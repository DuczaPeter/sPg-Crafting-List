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
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C006");
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
  ${block("V004_C003_REVISION_RESERVATION_MODEL")}
  ${block("V004_C004_ATOMIC_CRAFT_COMPLETE_MODEL")}
  ${block("V004_C005_CRAFT_HISTORY_UI_MODEL")}
  ${block("V004_C006_CRAFT_HISTORY_UNDO_MODEL")}
  globalThis.__C006__ = {
    defaultMeta: v004DefaultUserMetaRecords,
    buildPayload: buildV004ReservationCanonicalPayload,
    hashPayload: hashV004ReservationPayload,
    completeMarker: V004_CRAFT_COMPLETE_REQUEST_MARKER,
    completeMutation: v004BuildCraftCompletionMutation,
    undoMarker: V004_CRAFT_UNDO_REQUEST_MARKER,
    validateHistory: v004ValidateCraftHistoryEvent,
    evaluateUndo: v004EvaluateCraftUndoEligibility,
    undoMutation: v004BuildCraftUndoMutation,
    groupHistory: c005GroupCraftHistory
  };
`, context);
const model = context.__C006__;

function metaRecords(revisions, historySequence = 0) {
  return clone(model.defaultMeta()).map(record => {
    if (record.key === "historySequence") return { ...record, value: historySequence };
    return Object.prototype.hasOwnProperty.call(revisions, record.key) ? { ...record, value: revisions[record.key] } : record;
  });
}

function payloadFrom(source) {
  return clone(model.buildPayload({
    card: clone(source.card),
    cardResult: clone(source.cardResult),
    revisions: clone(source.revisions),
    batches: clone(source.batches),
    activeScDataVersion: source.card.gameVersion
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
    preparedAt: "2026-09-10T16:00:00.000Z"
  };
}

function undoRequest(event, id) {
  return {
    marker: model.undoMarker,
    undoTransactionId: id,
    craftTransactionId: event.craftTransactionId,
    craftingCardId: event.craftingCardId,
    expectedHistorySequence: event.historySequence,
    preparedAt: "2026-09-10T16:05:00.000Z"
  };
}

function batchQuantities(batches) {
  return Object.fromEntries(clone(batches).sort((a, b) => a.id.localeCompare(b.id)).map(batch => [batch.id, batch.quantityUnits]));
}

const payload = payloadFrom(fixture);
const completionMeta = metaRecords(fixture.revisions, 0);
const partialCompleteRequest = await completionRequest(payload, 4, "craft-c006-partial-0001");
const partialComplete = clone(model.completeMutation(
  partialCompleteRequest,
  clone(fixture.card),
  [clone(fixture.card)],
  completionMeta,
  clone(fixture.batches),
  "2026-09-10T16:01:00.000Z"
));
const partialUndoRequest = undoRequest(partialComplete.historyEvent, "undo-c006-partial-0001");
const partialUndo = clone(model.undoMutation(
  partialUndoRequest,
  partialComplete.historyEvent,
  [partialComplete.historyEvent],
  partialComplete.craftingCards,
  metaRecords(partialComplete.revisions, 1),
  partialComplete.materialBatches,
  "2026-09-10T16:06:00.000Z"
));

assert.equal(partialUndo.undoMode, "PARTIAL");
assert.equal(partialUndo.craftingCards[0].quantity, 5);
assert.equal(partialUndo.craftingCards[0].cardRevision, 5);
assert.deepEqual(batchQuantities(partialUndo.materialBatches), batchQuantities(fixture.batches));
assert.deepEqual(partialUndo.historyEvent.restoredBatches.map(record => record.mode), ["RECREATED", "MERGED", "MERGED"]);
assert.deepEqual(partialUndo.historyEvent.restoredBatches.map(record => record.restoredUnits), [30, 10, 60]);
assert.equal(partialUndo.historyEvent.status, "UNDONE");
assert.equal(partialUndo.historyEvent.undoTransactionId, "undo-c006-partial-0001");
assert.equal(partialUndo.historyEvent.undoneAt, "2026-09-10T16:06:00.000Z");
assert.equal(partialUndo.historyEvent.historySequence, 1);
assert.equal(partialUndo.historyEvent.undoRevisionEvidence.historySequenceChanged, false);
assert.deepEqual(partialUndo.revisions, { inventoryRevision: 6, allocationRevision: 9, craftListRevision: 2, historySequence: 1 });
assert.equal(model.validateHistory(partialUndo.historyEvent).status, "UNDONE");

const immutableCompletionFields = [
  "eventSchema", "quantitySemantics", "craftRunInputEvidence", "outputCountEvidence", "craftTransactionId", "historySequence",
  "craftingCardId", "blueprintIdentity", "outputIdentity", "itemName", "completedQuantity", "remainingBefore", "remainingAfter",
  "originalOrder", "originalPriority", "reservationSnapshotHash", "reservationSnapshotSchema", "reservationSnapshot",
  "consumedDeltas", "timestamp", "preCraftCardSnapshot", "cardRemoved", "shiftedCardRevisions", "inventoryConservation"
];
for (const key of immutableCompletionFields) assert.deepEqual(partialUndo.historyEvent[key], partialComplete.historyEvent[key], `Immutable History evidence changed: ${key}`);

const unrelatedBatch = {
  id: "batch-unrelated-user-addition",
  materialUuid: "material-unrelated",
  sourceMaterialUuid: "source-unrelated",
  materialName: "Unrelated",
  quality: 500,
  quantityUnits: 5000,
  unit: "SCU",
  createdAt: "2026-09-10T16:03:00.000Z",
  updatedAt: "2026-09-10T16:03:00.000Z"
};
const unrelatedMeta = metaRecords({ inventoryRevision: 12, allocationRevision: 15, craftListRevision: 2 }, 1);
const targetedUndo = clone(model.undoMutation(
  undoRequest(partialComplete.historyEvent, "undo-c006-targeted-001"),
  partialComplete.historyEvent,
  [partialComplete.historyEvent],
  partialComplete.craftingCards,
  unrelatedMeta,
  partialComplete.materialBatches.concat(unrelatedBatch),
  "2026-09-10T16:07:00.000Z"
));
assert.equal(targetedUndo.materialBatches.find(batch => batch.id === unrelatedBatch.id).quantityUnits, 5000);
assert.equal(targetedUndo.revisions.inventoryRevision, 13);
assert.equal(targetedUndo.revisions.allocationRevision, 16);

const editedCard = { ...clone(partialComplete.craftingCards[0]), quantity: 2, cardRevision: 5 };
assert.equal(model.evaluateUndo(partialComplete.historyEvent, [partialComplete.historyEvent], [editedCard], metaRecords(partialComplete.revisions, 1), partialComplete.materialBatches).code, "UNDO_CARD_REVISION_MISMATCH");

const incompatibleCollision = partialComplete.materialBatches.concat({
  ...clone(fixture.batches[0]),
  materialUuid: "different-material",
  sourceMaterialUuid: "different-source",
  quality: 100
});
assert.equal(model.evaluateUndo(partialComplete.historyEvent, [partialComplete.historyEvent], partialComplete.craftingCards, metaRecords(partialComplete.revisions, 1), incompatibleCollision).code, "UNDO_BATCH_ID_COLLISION");

const shiftedCard = { ...clone(fixture.card), id: "card-c006-second", order: 1, cardRevision: 6 };
const fullCompleteRequest = await completionRequest(payload, 5, "craft-c006-full-0000001");
const fullComplete = clone(model.completeMutation(
  fullCompleteRequest,
  clone(fixture.card),
  [clone(fixture.card), shiftedCard],
  completionMeta,
  clone(fixture.batches),
  "2026-09-10T16:10:00.000Z"
));
const fullUndo = clone(model.undoMutation(
  undoRequest(fullComplete.historyEvent, "undo-c006-full-0000001"),
  fullComplete.historyEvent,
  [fullComplete.historyEvent],
  fullComplete.craftingCards,
  metaRecords(fullComplete.revisions, 1),
  fullComplete.materialBatches,
  "2026-09-10T16:11:00.000Z"
));
assert.equal(fullUndo.undoMode, "FULL");
assert.deepEqual(fullUndo.craftingCards.map(card => [card.id, card.order, card.quantity]), [
  [fixture.card.id, 0, 5],
  [shiftedCard.id, 1, 5]
]);
assert.equal(fullUndo.craftingCards[0].cardRevision, 5);
assert.equal(fullUndo.craftingCards[1].cardRevision, 8);
assert.deepEqual(batchQuantities(fullUndo.materialBatches), batchQuantities(fixture.batches));
assert.deepEqual(fullUndo.revisions, { inventoryRevision: 6, allocationRevision: 9, craftListRevision: 4, historySequence: 1 });
const changedListMeta = metaRecords({ ...fullComplete.revisions, craftListRevision: fullComplete.revisions.craftListRevision + 1 }, 1);
assert.equal(model.evaluateUndo(fullComplete.historyEvent, [fullComplete.historyEvent], fullComplete.craftingCards, changedListMeta, fullComplete.materialBatches).code, "UNDO_CRAFT_LIST_REVISION_MISMATCH");

const eventA = partialComplete.historyEvent;
const cardAfterA = clone(partialComplete.craftingCards[0]);
const batchesAfterA = clone(partialComplete.materialBatches);
const eventBBatch = batchesAfterA.find(batch => batch.id === "batch-alpha-second");
const eventB = {
  ...clone(eventA),
  craftTransactionId: "craft-c006-lifo-b-0001",
  historySequence: 2,
  completedQuantity: 1,
  remainingBefore: 1,
  remainingAfter: 0,
  originalOrder: 0,
  originalPriority: 1,
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
    ...clone(eventA.consumedDeltas[1]),
    sequence: 0,
    consumedUnits: 1,
    beforeUnits: eventBBatch.quantityUnits,
    afterUnits: eventBBatch.quantityUnits - 1,
    preCraftBatchSnapshot: clone(eventBBatch)
  }],
  timestamp: "2026-09-10T16:20:00.000Z",
  preCraftCardSnapshot: cardAfterA,
  cardRemoved: true,
  shiftedCardRevisions: [],
  restoredBatches: [],
  undoTimestamp: null
};
model.validateHistory(eventB);
const batchesAfterB = batchesAfterA.map(batch => batch.id === eventBBatch.id ? { ...batch, quantityUnits: batch.quantityUnits - 1 } : batch);
assert.equal(model.evaluateUndo(eventA, [eventA, eventB], [], metaRecords({ inventoryRevision: 6, allocationRevision: 9, craftListRevision: 3 }, 2), batchesAfterB).code, "NOT_LATEST_ACTIVE_EVENT");
const undoB = clone(model.undoMutation(
  undoRequest(eventB, "undo-c006-lifo-b-0001"),
  eventB,
  [eventA, eventB],
  [],
  metaRecords({ inventoryRevision: 6, allocationRevision: 9, craftListRevision: 3 }, 2),
  batchesAfterB,
  "2026-09-10T16:21:00.000Z"
));
const eligibilityAAfterB = model.evaluateUndo(eventA, [eventA, undoB.historyEvent], undoB.craftingCards, metaRecords(undoB.revisions, 2), undoB.materialBatches);
assert.equal(eligibilityAAfterB.eligible, true);
const undoA = clone(model.undoMutation(
  undoRequest(eventA, "undo-c006-lifo-a-0001"),
  eventA,
  [eventA, undoB.historyEvent],
  undoB.craftingCards,
  metaRecords(undoB.revisions, 2),
  undoB.materialBatches,
  "2026-09-10T16:22:00.000Z"
));
assert.equal(undoA.craftingCards[0].quantity, 5);
assert.deepEqual(batchQuantities(undoA.materialBatches), batchQuantities(fixture.batches));
assert.throws(
  () => model.undoMutation(undoRequest(partialUndo.historyEvent, "undo-c006-partial-0001"), partialUndo.historyEvent, [partialUndo.historyEvent], partialUndo.craftingCards, metaRecords(partialUndo.revisions, 1), partialUndo.materialBatches, "2026-09-10T16:30:00.000Z"),
  error => error.code === "ALREADY_UNDONE"
);

const legacy = { craftTransactionId: "legacy-c006", craftingCardId: fixture.card.id, status: "COMPLETED", historySequence: 3 };
assert.equal(model.evaluateUndo(legacy, [legacy], partialComplete.craftingCards, metaRecords(partialComplete.revisions, 3), partialComplete.materialBatches).code, "UNDO_EVIDENCE_INCOMPLETE");

const groupBeforeUndo = clone(model.groupHistory([
  { ...clone(eventA), craftingCardId: "card-a", historySequence: 1, timestamp: "2026-09-10T10:00:00.000Z" },
  { ...clone(eventA), craftingCardId: "card-b", craftTransactionId: "craft-c006-group-b", historySequence: 2, timestamp: "2026-09-10T11:00:00.000Z" }
]));
assert.deepEqual(groupBeforeUndo.map(group => group.craftingCardId), ["card-b", "card-a"]);
const groupAfterUndo = clone(model.groupHistory([
  { ...clone(partialUndo.historyEvent), craftingCardId: "card-a", historySequence: 1, timestamp: "2026-09-10T10:00:00.000Z", undoneAt: "2026-09-10T12:00:00.000Z", undoTimestamp: "2026-09-10T12:00:00.000Z", lastActivityAt: "2026-09-10T12:00:00.000Z" },
  { ...clone(eventA), craftingCardId: "card-b", craftTransactionId: "craft-c006-group-b", historySequence: 2, timestamp: "2026-09-10T11:00:00.000Z" }
]));
assert.deepEqual(groupAfterUndo.map(group => group.craftingCardId), ["card-b", "card-a"]);
assert.deepEqual(groupAfterUndo[1].events.map(event => event.historySequence), [1]);

const c006Block = block("V004_C006_CRAFT_HISTORY_UNDO_MODEL");
assert.doesNotMatch(c006Block, /normalizeScuQuantityToUnits|v004BuildExactRequirementQuantityEvidence|toScuUnits\s*\(|Math\.(?:round|floor|ceil)/);
assert.doesNotMatch(c006Block, /inventorySnapshot|previousInventory|fullInventoryRollback/i);
assert.match(appHtml, /commitCraftUndo\(request, options\)/);
assert.match(appHtml, /historyStore\.put\(mutation\.historyEvent\)/);
assert.match(appHtml, /AFTER_BATCH_RESTORE/);
assert.match(appHtml, /BEFORE_CARD_RESTORE/);
assert.match(appHtml, /AFTER_HISTORY_UPDATE/);
assert.match(appHtml, /BEFORE_META_UPDATE/);
assert.match(appHtml, /id="craftUndoDialog"/);
assert.match(appHtml, />Craft visszavonása</);
assert.doesNotMatch(appHtml, /class="[^"]*spg-c006[^"]*redo|function\s+\w*[Rr]edo|Redo művelet[^<]*<button/);
assert.doesNotMatch(appHtml, /History törlése|Clear History|deleteCraftHistory|archiveCraftHistory/);
assert.match(appHtml, /M4_BACKUP_SCHEMA_VERSION = 3/);

const documentMarkup = appHtml.slice(0, appHtml.indexOf("<script>"));
const localScriptSources = [...documentMarkup.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]).filter(value => !/^https?:/i.test(value));
const localStylesheets = [...documentMarkup.matchAll(/<link\b[^>]*rel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*href\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]).filter(value => !/^https?:/i.test(value));
assert.equal(localScriptSources.length, 0);
assert.equal(localStylesheets.length, 0);

const evidence = {
  cycle: "V004-C006",
  status: "PASS_TARGETED_MODEL",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  eligibility: { latestActiveOnly: true, lifo: true, legacy: "BLOCKED", cardEdit: "BLOCKED", fullListChange: "BLOCKED" },
  partialUndo: {
    quantity: "1 -> 5",
    cardRevision: "4 -> 5",
    revisions: partialUndo.revisions,
    restoreModes: partialUndo.historyEvent.restoredBatches.map(record => record.mode)
  },
  fullUndo: {
    restoredCardId: fullUndo.craftingCards[0].id,
    restoredQuantity: fullUndo.craftingCards[0].quantity,
    restoredOrder: fullUndo.craftingCards[0].order,
    shiftedCardRevisionAfter: fullUndo.craftingCards[1].cardRevision,
    revisions: fullUndo.revisions
  },
  targetedDeltaRestore: { unrelatedBatchUnitsBefore: 5000, unrelatedBatchUnitsAfter: 5000, globalInventoryRevisionMismatchAllowed: true },
  exactBatchRestore: { recreated: true, merged: true, incompatibleCollision: "UNDO_BATCH_ID_COLLISION", restoredUnits: [30, 10, 60] },
  lifo: { beforeUndoB: "NOT_LATEST_ACTIVE_EVENT", afterUndoBEventAEligible: true, finalCardQuantity: undoA.craftingCards[0].quantity },
  idempotency: { secondUndo: "ALREADY_UNDONE", writes: 0 },
  history: { status: "UNDONE", historySequenceChanged: false, immutableCompletionEvidence: true, groupSortAfterUndo: ["card-b", "card-a"] },
  transaction: { stores: ["materialBatches", "userInventory", "craftingCards", "craftHistory", "userMeta"], failureStages: ["AFTER_BATCH_RESTORE", "BEFORE_CARD_RESTORE", "AFTER_HISTORY_UPDATE", "BEFORE_META_UPDATE"] },
  exclusions: { redo: "NOT_IMPLEMENTED", historyDelete: "NOT_IMPLEMENTED", archive: "NOT_IMPLEMENTED", fullInventorySnapshotRollback: false },
  backup: { schema: 3, undoneEventValidated: true },
  conservation: { materialRoundTripLossUnits: 0, normalizationRerun: false },
  singleFile: { runtimeFiles: 1, sidecars: 0, localScriptSrc: 0, localStylesheet: 0, localRuntimeJson: 0 }
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V004_C006_TARGETED_MODEL_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
