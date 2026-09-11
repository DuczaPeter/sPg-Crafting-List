import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { buildM4HarnessSource, loadVerifiedCandidateHtml } from "./v004-c0081-harness-loader.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v004-c003-reservation.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C006.1");
const evidencePath = path.join(artifactDirectory, "model-evidence.json");
const verifiedApplication = loadVerifiedCandidateHtml({ localApplicationPath: appPath });
const appHtml = verifiedApplication.html;
const m4HarnessSource = buildM4HarnessSource(appHtml);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const clone = value => JSON.parse(JSON.stringify(value));

function cardSemanticProjection(card) {
  const source = card || {};
  const assignments = source.recipeSlotQualityPoolAssignments && typeof source.recipeSlotQualityPoolAssignments === "object"
    ? source.recipeSlotQualityPoolAssignments
    : {};
  return {
    id: source.id,
    quantity: source.quantity,
    cardRevision: source.cardRevision,
    craftRunInputEvidence: source.craftRunInputEvidence,
    recipeSlotQualityPoolAssignments: Object.fromEntries(Object.entries(assignments).sort(([left], [right]) => left.localeCompare(right))),
    requirements: (Array.isArray(source.requirements) ? source.requirements : []).map(requirement => {
      const hasExactUnits = requirement.exactRequiredQuantityUnits !== undefined && requirement.exactRequiredQuantityUnits !== null;
      const hasNormalizedUnits = requirement.normalizedRequiredQuantityUnits !== undefined && requirement.normalizedRequiredQuantityUnits !== null;
      if (hasExactUnits && hasNormalizedUnits) {
        assert.equal(
          requirement.normalizedRequiredQuantityUnits,
          requirement.exactRequiredQuantityUnits,
          `Requirement exact-unit evidence mismatch: ${requirement.id}`
        );
      }
      const effectiveExactRequiredUnits = hasNormalizedUnits
        ? requirement.normalizedRequiredQuantityUnits
        : requirement.exactRequiredQuantityUnits;
      assert.ok(Number.isSafeInteger(effectiveExactRequiredUnits) && effectiveExactRequiredUnits > 0, `Requirement exact units missing: ${requirement.id}`);
      return {
        slotId: requirement.id,
        aspectIndex: requirement.aspectIndex,
        ingredientUuid: requirement.ingredientUuid,
        commodityUuid: requirement.commodityUuid,
        unit: requirement.unit,
        effectiveExactRequiredUnits
      };
    })
  };
}

function block(name) {
  const startMarker = `/* ${name}_START */`;
  const endMarker = `/* ${name}_END */`;
  const start = appHtml.indexOf(startMarker);
  const end = appHtml.indexOf(endMarker);
  assert.ok(start >= 0 && end > start, `Missing model block: ${name}`);
  return appHtml.slice(start, end + endMarker.length);
}

const context = vm.createContext({ console, crypto: webcrypto, TextEncoder, Uint8Array, Map, Set, Number, Object, Array, JSON, String, RegExp, Math, Date });
vm.runInContext(`
  ${m4HarnessSource}
  ${block("V004_C002_MIGRATION_MODEL")}
  ${block("V004_C003_REVISION_RESERVATION_MODEL")}
  ${block("V004_C004_ATOMIC_CRAFT_COMPLETE_MODEL")}
  ${block("V004_C005_CRAFT_HISTORY_UI_MODEL")}
  ${block("V004_C006_CRAFT_HISTORY_UNDO_MODEL")}
  globalThis.__C0061__ = {
    defaultMeta: v004DefaultUserMetaRecords,
    buildPayload: buildV004ReservationCanonicalPayload,
    hashPayload: hashV004ReservationPayload,
    completeMarker: V004_CRAFT_COMPLETE_REQUEST_MARKER,
    completeMutation: v004BuildCraftCompletionMutation,
    undoMarker: V004_CRAFT_UNDO_REQUEST_MARKER,
    undoMutation: v004BuildCraftUndoMutation,
    evaluateUndo: v004EvaluateCraftUndoEligibility,
    buildBackup: buildM4BackupEnvelope,
    validateBackup: validateAndMigrateM4Backup,
    prepareImport: prepareV004RevisionAwareImport,
    fingerprint: fingerprintUserDataPayload,
    normalizeCard: normalizeStoredCraftingCard,
    canonicalSnapshot: v004CanonicalizeCraftHistoryCardSnapshot
  };
`, context);
const model = context.__C0061__;

function metaRecords(revisions, historySequence = 0) {
  return clone(model.defaultMeta()).map(record => {
    if (record.key === "historySequence") return { ...record, value: historySequence };
    return Object.prototype.hasOwnProperty.call(revisions, record.key) ? { ...record, value: revisions[record.key] } : record;
  });
}

function emptyData() {
  return {
    userInventory: [], materialBatches: [], craftingCards: [], miningLoadouts: [], userSettings: [], craftHistory: [], userMeta: clone(model.defaultMeta())
  };
}

function payloadFrom(source) {
  return clone(model.buildPayload({
    card: clone(source.card), cardResult: clone(source.cardResult), revisions: clone(source.revisions), batches: clone(source.batches), activeScDataVersion: source.card.gameVersion
  }));
}

async function completionRequest(payload, quantity, id) {
  const hash = await model.hashPayload(payload);
  return {
    marker: model.completeMarker,
    craftTransactionId: id,
    requestedQuantity: quantity,
    reservationPayload: clone(payload),
    reservationCanonicalPayload: JSON.stringify(payload),
    reservationSnapshotHash: hash,
    verifiedReservationSnapshotHash: hash,
    preparedAt: "2026-09-10T18:00:00.000Z"
  };
}

function undoRequest(event, id) {
  return {
    marker: model.undoMarker,
    undoTransactionId: id,
    craftTransactionId: event.craftTransactionId,
    craftingCardId: event.craftingCardId,
    expectedHistorySequence: event.historySequence,
    preparedAt: "2026-09-10T18:02:00.000Z"
  };
}

function dataFromMutation(mutation, history) {
  return {
    userInventory: clone(mutation.userInventory),
    materialBatches: clone(mutation.materialBatches),
    craftingCards: clone(mutation.craftingCards),
    miningLoadouts: [],
    userSettings: [],
    craftHistory: clone(history || [mutation.historyEvent]),
    userMeta: metaRecords(mutation.revisions, mutation.revisions.historySequence)
  };
}

function exactRoundTrip(data, label) {
  const envelope = clone(model.buildBackup(data, { applicationVersion: "V004-dev", exportedAt: "2026-09-10T18:10:00.000Z" }));
  assert.equal(envelope.schemaVersion, 3);
  const validated = clone(model.validateBackup(JSON.stringify(envelope)));
  const prepared = clone(model.prepareImport(emptyData(), validated.backup.data, "REPLACE"));
  assert.equal(prepared.exactPristineRestore, true, `${label}: pristine REPLACE was not treated as exact restore`);
  assert.deepEqual(prepared.data, envelope.data, `${label}: structural data mismatch`);
  assert.equal(model.fingerprint(prepared.data), envelope.fingerprint, `${label}: fingerprint mismatch`);
  return { envelope, validated, prepared };
}

const payload = payloadFrom(fixture);
const baseMeta = metaRecords(fixture.revisions, 0);
const rawFixtureCard = clone(fixture.card);

const partialComplete = clone(model.completeMutation(
  await completionRequest(payload, 4, "craft-c0061-partial-0001"),
  clone(fixture.card), [clone(fixture.card)], baseMeta, clone(fixture.batches), "2026-09-10T18:01:00.000Z"
));
const canonicalFixtureCard = clone(model.normalizeCard(rawFixtureCard, rawFixtureCard.order));
const canonicalCompleteSnapshot = clone(partialComplete.historyEvent.preCraftCardSnapshot);
assert.deepEqual(canonicalCompleteSnapshot, canonicalFixtureCard, "new Complete did not persist a production-canonical Card snapshot");
assert.deepEqual(
  clone(model.canonicalSnapshot(canonicalCompleteSnapshot, canonicalCompleteSnapshot.order)),
  canonicalCompleteSnapshot,
  "canonical History Card snapshot normalization is not idempotent"
);
assert.deepEqual(fixture.card, rawFixtureCard, "snapshot canonicalization mutated the source Card");

const partialMetaAfterComplete = metaRecords(partialComplete.revisions, 1);
const canonicalHistoryRawCurrentEligibility = clone(model.evaluateUndo(
  partialComplete.historyEvent,
  [partialComplete.historyEvent],
  partialComplete.craftingCards,
  partialMetaAfterComplete,
  partialComplete.materialBatches
));
assert.equal(canonicalHistoryRawCurrentEligibility.eligible, true, "canonical History + raw current Card must remain Undo-eligible");

const rawHistoryEvent = clone(partialComplete.historyEvent);
rawHistoryEvent.preCraftCardSnapshot = clone(rawFixtureCard);
const canonicalCurrentCard = clone(model.normalizeCard(partialComplete.craftingCards[0], partialComplete.craftingCards[0].order));
const rawHistoryCanonicalCurrentEligibility = clone(model.evaluateUndo(
  rawHistoryEvent,
  [rawHistoryEvent],
  [canonicalCurrentCard],
  partialMetaAfterComplete,
  partialComplete.materialBatches
));
assert.equal(rawHistoryCanonicalCurrentEligibility.eligible, true, "raw History + canonical current Card must remain Undo-eligible");

const semanticallyChangedCurrentCard = clone(canonicalCurrentCard);
semanticallyChangedCurrentCard.recipeSlotQualityPoolAssignments["slot-alpha"] = "MAXIMUM_Q_POOL";
const changedEligibility = clone(model.evaluateUndo(
  partialComplete.historyEvent,
  [partialComplete.historyEvent],
  [semanticallyChangedCurrentCard],
  partialMetaAfterComplete,
  partialComplete.materialBatches
));
assert.equal(changedEligibility.code, "UNDO_CARD_STATE_CHANGED", "real allocation semantics change must remain fail-closed");

const partialUndo = clone(model.undoMutation(
  undoRequest(partialComplete.historyEvent, "undo-c0061-partial-0001"),
  partialComplete.historyEvent, [partialComplete.historyEvent], partialComplete.craftingCards,
  partialMetaAfterComplete, partialComplete.materialBatches, "2026-09-10T18:03:00.000Z"
));
assert.equal(partialUndo.historyEvent.craftTransactionId, partialComplete.historyEvent.craftTransactionId);
assert.equal(partialUndo.historyEvent.reservationSnapshotHash, partialComplete.historyEvent.reservationSnapshotHash);
assert.equal(partialUndo.historyEvent.reservationSnapshotSchema, partialComplete.historyEvent.reservationSnapshotSchema);
assert.equal(partialUndo.historyEvent.historySequence, partialComplete.historyEvent.historySequence);
assert.equal(partialUndo.historyEvent.timestamp, partialComplete.historyEvent.timestamp);
assert.deepEqual(partialUndo.historyEvent.reservationSnapshot, partialComplete.historyEvent.reservationSnapshot);
assert.deepEqual(partialUndo.historyEvent.consumedDeltas, partialComplete.historyEvent.consumedDeltas);
partialUndo.historyEvent.forwardCompatibleProbe = { preserved: true, value: "C006.1_UNKNOWN_EVENT_FIELD" };
const partialData = dataFromMutation(partialUndo);
const partialRoundTrip = exactRoundTrip(partialData, "partial");
const partialImportedEvent = partialRoundTrip.prepared.data.craftHistory[0];
assert.equal(partialImportedEvent.status, "UNDONE");
assert.equal(partialImportedEvent.undoneAt, partialUndo.historyEvent.undoneAt);
assert.equal(partialImportedEvent.undoTransactionId, partialUndo.historyEvent.undoTransactionId);
assert.deepEqual(partialImportedEvent.consumedDeltas, partialUndo.historyEvent.consumedDeltas);
assert.deepEqual(partialImportedEvent.restoredBatches, partialUndo.historyEvent.restoredBatches);
assert.deepEqual(partialImportedEvent.undoRevisionEvidence, partialUndo.historyEvent.undoRevisionEvidence);
assert.deepEqual(partialImportedEvent.forwardCompatibleProbe, partialUndo.historyEvent.forwardCompatibleProbe);
assert.deepEqual(
  partialRoundTrip.prepared.data.craftingCards.map(cardSemanticProjection),
  partialData.craftingCards.map(cardSemanticProjection),
  "partial: Card semantics changed during backup round-trip"
);
assert.deepEqual(partialRoundTrip.prepared.data.materialBatches, partialData.materialBatches);
assert.deepEqual(partialRoundTrip.prepared.data.userMeta, partialRoundTrip.envelope.data.userMeta);

const nonPristineIncoming = clone(partialRoundTrip.envelope.data);
nonPristineIncoming.materialBatches[0].quantityUnits += 1;
const changedMaterial = nonPristineIncoming.materialBatches[0];
const changedAggregate = nonPristineIncoming.userInventory.find(record => record.materialUuid === changedMaterial.materialUuid && record.unit === changedMaterial.unit);
changedAggregate.totalQuantityUnits += 1;
const nonPristinePrepared = clone(model.prepareImport(partialRoundTrip.envelope.data, nonPristineIncoming, "REPLACE"));
assert.equal(nonPristinePrepared.exactPristineRestore, false);
assert.equal(nonPristinePrepared.revisions.inventoryRevision, partialUndo.revisions.inventoryRevision + 1);
assert.equal(nonPristinePrepared.revisions.allocationRevision, partialUndo.revisions.allocationRevision + 1);
assert.equal(nonPristinePrepared.revisions.craftListRevision, partialUndo.revisions.craftListRevision);

const fullComplete = clone(model.completeMutation(
  await completionRequest(payload, 5, "craft-c0061-full-000001"),
  clone(fixture.card), [clone(fixture.card)], baseMeta, clone(fixture.batches), "2026-09-10T18:20:00.000Z"
));
const rawFullEvent = clone(fullComplete.historyEvent);
rawFullEvent.preCraftCardSnapshot = clone(rawFixtureCard);
const rawFullUndoTimestamp = "2026-09-10T18:20:30.000Z";
const rawFullUndo = clone(model.undoMutation(
  undoRequest(rawFullEvent, "undo-c0061-full-raw-0001"),
  rawFullEvent, [rawFullEvent], fullComplete.craftingCards,
  metaRecords(fullComplete.revisions, 1), fullComplete.materialBatches, rawFullUndoTimestamp
));
const expectedCanonicalFullRestore = {
  ...clone(model.canonicalSnapshot(rawFixtureCard, rawFixtureCard.order)),
  order: rawFullEvent.originalOrder,
  cardRevision: rawFullEvent.cardRevisionAfter + 1,
  updatedAt: rawFullUndoTimestamp
};
assert.deepEqual(rawFullUndo.craftingCards[0], expectedCanonicalFullRestore, "Full Undo did not restore a canonical Card from a raw History snapshot");

const fullUndo = clone(model.undoMutation(
  undoRequest(fullComplete.historyEvent, "undo-c0061-full-000001"),
  fullComplete.historyEvent, [fullComplete.historyEvent], fullComplete.craftingCards,
  metaRecords(fullComplete.revisions, 1), fullComplete.materialBatches, "2026-09-10T18:21:00.000Z"
));
const fullData = dataFromMutation(fullUndo);
const fullRoundTrip = exactRoundTrip(fullData, "full");
assert.deepEqual(
  fullRoundTrip.prepared.data.craftingCards.map(cardSemanticProjection),
  fullData.craftingCards.map(cardSemanticProjection),
  "full: Card semantics changed during backup round-trip"
);
assert.deepEqual(fullRoundTrip.prepared.data.materialBatches, fullData.materialBatches);
assert.deepEqual(fullRoundTrip.prepared.data.craftHistory, fullData.craftHistory);
assert.deepEqual(fullRoundTrip.prepared.data.userMeta, fullRoundTrip.envelope.data.userMeta);

const eventA = partialComplete.historyEvent;
const cardAfterA = clone(partialComplete.craftingCards[0]);
const batchesAfterA = clone(partialComplete.materialBatches);
const eventBBatch = batchesAfterA.find(batch => batch.id === "batch-alpha-second");
const eventB = {
  ...clone(eventA),
  craftTransactionId: "craft-c0061-lifo-b-0001",
  historySequence: 2,
  completedQuantity: 1,
  remainingBefore: 1,
  remainingAfter: 0,
  inventoryRevisionBefore: 5,
  inventoryRevisionAfter: 6,
  allocationRevisionBefore: 8,
  allocationRevisionUsed: 8,
  allocationRevisionAfter: 9,
  cardRevisionBefore: 4,
  cardRevisionAfter: 5,
  craftListRevisionBefore: 2,
  craftListRevisionAfter: 3,
  consumedDeltas: [{
    ...clone(eventA.consumedDeltas[1]), sequence: 0, consumedUnits: 1,
    beforeUnits: eventBBatch.quantityUnits, afterUnits: eventBBatch.quantityUnits - 1, preCraftBatchSnapshot: clone(eventBBatch)
  }],
  timestamp: "2026-09-10T18:30:00.000Z",
  preCraftCardSnapshot: cardAfterA,
  cardRemoved: true,
  shiftedCardRevisions: [],
  restoredBatches: [],
  undoTimestamp: null
};
const batchesAfterB = batchesAfterA.map(batch => batch.id === eventBBatch.id ? { ...batch, quantityUnits: batch.quantityUnits - 1 } : batch);
const undoB = clone(model.undoMutation(
  undoRequest(eventB, "undo-c0061-lifo-b-0001"), eventB, [eventA, eventB], [],
  metaRecords({ inventoryRevision: 6, allocationRevision: 9, craftListRevision: 3 }, 2), batchesAfterB, "2026-09-10T18:31:00.000Z"
));
const eligibilityABeforeBackup = clone(model.evaluateUndo(
  eventA,
  [eventA, undoB.historyEvent],
  undoB.craftingCards,
  metaRecords(undoB.revisions, 2),
  undoB.materialBatches
));
assert.equal(eligibilityABeforeBackup.eligible, true, "A must become eligible immediately after B Undo");
const lifoData = dataFromMutation(undoB, [eventA, undoB.historyEvent]);
const lifoRoundTrip = exactRoundTrip(lifoData, "lifo");
const importedEvents = lifoRoundTrip.prepared.data.craftHistory;
const importedA = importedEvents.find(event => event.craftTransactionId === eventA.craftTransactionId);
const importedB = importedEvents.find(event => event.craftTransactionId === eventB.craftTransactionId);
const eligibilityA = clone(model.evaluateUndo(importedA, importedEvents, lifoRoundTrip.prepared.data.craftingCards, lifoRoundTrip.prepared.data.userMeta, lifoRoundTrip.prepared.data.materialBatches));
const eligibilityB = clone(model.evaluateUndo(importedB, importedEvents, lifoRoundTrip.prepared.data.craftingCards, lifoRoundTrip.prepared.data.userMeta, lifoRoundTrip.prepared.data.materialBatches));
assert.equal(importedB.status, "UNDONE");
assert.equal(eligibilityA.eligible, true);
assert.equal(eligibilityB.code, "ALREADY_UNDONE");

const legacyEvent = {
  craftTransactionId: "legacy-c0061-schema3",
  historySequence: 1,
  craftingCardId: "legacy-card-c0061",
  status: "COMPLETED",
  timestamp: "2026-09-10T17:00:00.000Z",
  completedQuantity: 1,
  consumedDeltas: [],
  legacyExtraField: "PRESERVE_ME"
};
const legacyData = emptyData();
legacyData.craftHistory = [legacyEvent];
legacyData.userMeta = metaRecords({ inventoryRevision: 0, craftListRevision: 0, allocationRevision: 0 }, 1);
const legacyRoundTrip = exactRoundTrip(legacyData, "legacy-schema3");
const importedLegacy = legacyRoundTrip.prepared.data.craftHistory[0];
assert.equal(importedLegacy.quantitySemantics, "LEGACY_HISTORY_QUANTITY_SEMANTICS_UNKNOWN");
assert.equal(importedLegacy.undoTransactionId, undefined);
assert.equal(importedLegacy.undoneAt, undefined);
assert.equal(importedLegacy.legacyExtraField, "PRESERVE_ME");
assert.equal(model.evaluateUndo(importedLegacy, [importedLegacy], [], legacyRoundTrip.prepared.data.userMeta, []).code, "UNDO_EVIDENCE_INCOMPLETE");

const v003Card = clone(fixture.card);
delete v003Card.cardRevision;
delete v003Card.quantitySemantics;
delete v003Card.craftRunInputEvidence;
const v003Validated = clone(model.validateBackup({
  format: "spg-crafting-list-backup",
  schemaVersion: 2,
  applicationVersion: "V003",
  data: {
    userInventory: [], materialBatches: [], craftingCards: [v003Card], miningLoadouts: [], userSettings: []
  }
}));
assert.deepEqual(v003Validated.backup.data.craftHistory, []);
assert.equal(v003Validated.backup.data.craftingCards[0].quantitySemantics, "LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED");
assert.ok(v003Validated.backup.data.userMeta.every(record => record.value === 0));
assert.equal(v003Validated.migration.fromSchema, 2);
assert.equal(v003Validated.migration.toSchema, 3);

const documentMarkup = appHtml.slice(0, appHtml.indexOf("<script>"));
const localScriptSources = [...documentMarkup.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]).filter(value => !/^https?:/i.test(value));
const localStylesheets = [...documentMarkup.matchAll(/<link\b[^>]*rel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*href\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]).filter(value => !/^https?:/i.test(value));
assert.equal(localScriptSources.length, 0);
assert.equal(localStylesheets.length, 0);
assert.match(appHtml, /M4_BACKUP_SCHEMA_VERSION = 3/);
assert.doesNotMatch(block("V004_C006_CRAFT_HISTORY_UNDO_MODEL"), /normalizeScuQuantityToUnits|loadBlueprintDetail|fetch\s*\(/);

const evidence = {
  cycle: "V004-C006.1",
  status: "PASS_TARGETED_MODEL",
  applicationSha256: verifiedApplication.sha256,
  backupSchemaVersion: 3,
  pristineReplace: { exactRestore: true, revisionIncrementAtSerializationBoundary: 0, nonPristineRevisionInvalidationUnchanged: nonPristinePrepared.exactPristineRestore === false },
  partialUndo: {
    structuralRoundTrip: true,
    historyStatus: partialImportedEvent.status,
    consumedDeltasPreserved: true,
    restoredBatchEvidencePreserved: true,
    undoRevisionEvidencePreserved: true,
    restoredInventoryPreserved: true,
    restoredCardPreserved: true,
    unknownHistoryFieldPreserved: true
  },
  snapshotCompatibility: {
    rawHistoryCanonicalCurrentEligible: rawHistoryCanonicalCurrentEligibility.eligible,
    canonicalHistoryRawCurrentEligible: canonicalHistoryRawCurrentEligibility.eligible,
    canonicalSnapshotIdempotent: true,
    semanticChangeBlocker: changedEligibility.code,
    newCompleteSnapshotCanonical: true,
    fullRawSnapshotRestoreCanonical: true
  },
  fullUndo: { structuralRoundTrip: true, restoredInventoryPreserved: true, restoredCardPreserved: true, userMetaPreserved: true },
  lifoAfterImport: { eventAEligibleBeforeBackup: eligibilityABeforeBackup.eligible, eventAEligible: eligibilityA.eligible, eventBStatus: importedB.status, secondUndo: eligibilityB.code, writes: 0 },
  legacySchema3: { status: "FAIL_CLOSED_COMPATIBLE", undoFieldsFabricated: false, unknownFieldPreserved: true },
  v003Migration: { status: "UNCHANGED", craftHistoryCount: 0, quantitySemantics: v003Validated.backup.data.craftingCards[0].quantitySemantics, revisionValues: [0, 0, 0, 0] },
  conservation: { relevantDurableDelta: 0, backupDataLoss: 0, normalizationRerun: false, liveApiUsed: false },
  singleFile: { runtimeFiles: 1, sidecars: 0, localScriptSrc: 0, localStylesheet: 0 }
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V004_C0061_UNDO_BACKUP_MODEL_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
