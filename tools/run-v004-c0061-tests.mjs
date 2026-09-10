import assert from "node:assert/strict";
import crypto, { webcrypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v004-c003-reservation.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C006.1");
const evidencePath = path.join(artifactDirectory, "model-evidence.json");
const appBuffer = fs.readFileSync(appPath);
const appHtml = appBuffer.toString("utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const clone = value => JSON.parse(JSON.stringify(value));

function block(name) {
  const startMarker = `/* ${name}_START */`;
  const endMarker = `/* ${name}_END */`;
  const start = appHtml.indexOf(startMarker);
  const end = appHtml.indexOf(endMarker);
  assert.ok(start >= 0 && end > start, `Missing model block: ${name}`);
  return appHtml.slice(start, end + endMarker.length);
}

const m4Block = block("M4_COMBINED_BACKUP_MODEL");
const m4Foundation = m4Block.slice(0, m4Block.indexOf("function buildCombinedCanonicalMaterialLookup"));
const context = vm.createContext({ console, crypto: webcrypto, TextEncoder, Uint8Array, Map, Set, Number, Object, Array, JSON, String, RegExp, Math, Date });
vm.runInContext(`
  function hasValidQuality(value) { return Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 1000; }
  function isUserSettingRecord(record) { return Boolean(record && (record.scope === "USER" || String(record.key || "").indexOf("user:") === 0)); }
  function compareStableIdentity(a, b) { return String(a && a.id || "").localeCompare(String(b && b.id || "")); }
  var MATERIAL_QUALITY_PLAN_SETTING_KEY = "user:materialQualityPlans";
  var MATERIAL_QUALITY_POOL_SETTING_KEY = "user:materialQualityPools";
  ${block("V004_C002_MIGRATION_MODEL")}
  ${m4Foundation}
  function normalizeStoredCraftingCard(card, fallbackOrder) {
    var normalized = Object.assign({}, card || {});
    normalized.order = Number.isInteger(Number(normalized.order)) ? Number(normalized.order) : fallbackOrder;
    normalized.cardRevision = v004NormalizeCardRevision(normalized);
    normalized.active = normalized.active !== false;
    normalized.collapsed = normalized.collapsed === true;
    normalized.quantity = Number.isInteger(Number(normalized.quantity)) && Number(normalized.quantity) > 0 ? Number(normalized.quantity) : 1;
    normalized.quantitySemantics = normalized.quantitySemantics === V004_QUANTITY_SEMANTICS.CRAFT_RUN_COUNT
      ? V004_QUANTITY_SEMANTICS.CRAFT_RUN_COUNT : V004_QUANTITY_SEMANTICS.LEGACY_UNCONFIRMED;
    normalized.requirements = Array.isArray(normalized.requirements) ? normalized.requirements.map(m4Clone) : [];
    normalized.craftRunInputEvidence = normalized.craftRunInputEvidence === V004_CRAFT_RUN_INPUT_EVIDENCE.EXACT
      ? V004_CRAFT_RUN_INPUT_EVIDENCE.EXACT : V004_CRAFT_RUN_INPUT_EVIDENCE.UNPROVEN;
    normalized.slotStrategies = normalized.slotStrategies && typeof normalized.slotStrategies === "object" ? normalized.slotStrategies : {};
    normalized.recipeSlotQualityPoolAssignments = normalized.recipeSlotQualityPoolAssignments && typeof normalized.recipeSlotQualityPoolAssignments === "object"
      ? normalized.recipeSlotQualityPoolAssignments : {};
    return normalized;
  }
  function normalizeStoredCraftHistoryEvent(event) {
    var normalized = m4Clone(event || {});
    if (normalized.eventSchema === V004_CRAFT_HISTORY_EVENT_SCHEMA && normalized.quantitySemantics === V004_QUANTITY_SEMANTICS.CRAFT_RUN_COUNT) {
      normalized.craftRunInputEvidence = normalized.craftRunInputEvidence === V004_CRAFT_RUN_INPUT_EVIDENCE.EXACT
        ? V004_CRAFT_RUN_INPUT_EVIDENCE.EXACT : V004_CRAFT_RUN_INPUT_EVIDENCE.UNPROVEN;
      return normalized;
    }
    normalized.quantitySemantics = V004_QUANTITY_SEMANTICS.LEGACY_HISTORY_UNKNOWN;
    normalized.craftRunInputEvidence = V004_CRAFT_RUN_INPUT_EVIDENCE.UNPROVEN;
    return normalized;
  }
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
    fingerprint: fingerprintUserDataPayload
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

const partialComplete = clone(model.completeMutation(
  await completionRequest(payload, 4, "craft-c0061-partial-0001"),
  clone(fixture.card), [clone(fixture.card)], baseMeta, clone(fixture.batches), "2026-09-10T18:01:00.000Z"
));
const partialUndo = clone(model.undoMutation(
  undoRequest(partialComplete.historyEvent, "undo-c0061-partial-0001"),
  partialComplete.historyEvent, [partialComplete.historyEvent], partialComplete.craftingCards,
  metaRecords(partialComplete.revisions, 1), partialComplete.materialBatches, "2026-09-10T18:03:00.000Z"
));
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
assert.deepEqual(partialRoundTrip.prepared.data.craftingCards, partialData.craftingCards);
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
const fullUndo = clone(model.undoMutation(
  undoRequest(fullComplete.historyEvent, "undo-c0061-full-000001"),
  fullComplete.historyEvent, [fullComplete.historyEvent], fullComplete.craftingCards,
  metaRecords(fullComplete.revisions, 1), fullComplete.materialBatches, "2026-09-10T18:21:00.000Z"
));
const fullData = dataFromMutation(fullUndo);
const fullRoundTrip = exactRoundTrip(fullData, "full");
assert.deepEqual(fullRoundTrip.prepared.data.craftingCards, fullData.craftingCards);
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
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
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
  fullUndo: { structuralRoundTrip: true, restoredInventoryPreserved: true, restoredCardPreserved: true, userMetaPreserved: true },
  lifoAfterImport: { eventAEligible: eligibilityA.eligible, eventBStatus: importedB.status, secondUndo: eligibilityB.code, writes: 0 },
  legacySchema3: { status: "FAIL_CLOSED_COMPATIBLE", undoFieldsFabricated: false, unknownFieldPreserved: true },
  v003Migration: { status: "UNCHANGED", craftHistoryCount: 0, quantitySemantics: v003Validated.backup.data.craftingCards[0].quantitySemantics, revisionValues: [0, 0, 0, 0] },
  conservation: { relevantDurableDelta: 0, backupDataLoss: 0, normalizationRerun: false, liveApiUsed: false },
  singleFile: { runtimeFiles: 1, sidecars: 0, localScriptSrc: 0, localStylesheet: 0 }
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V004_C0061_UNDO_BACKUP_MODEL_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
