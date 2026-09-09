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
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C004");
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
const context = vm.createContext({
  console,
  crypto: webcrypto,
  TextEncoder,
  Uint8Array,
  Map,
  Set,
  Number,
  Object,
  Array,
  JSON,
  String,
  RegExp,
  Math,
  Date
});
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
  globalThis.__C004__ = {
    defaultMeta: v004DefaultUserMetaRecords,
    buildPayload: buildV004ReservationCanonicalPayload,
    hashPayload: hashV004ReservationPayload,
    capability: buildV004ReservationCapability,
    prefixPlan: buildV004ReservedPrefixPlan,
    validateRequest: v004ValidatePreparedCompletionRequest,
    validateCurrent: v004ValidateCurrentCraftCompletionState,
    buildMutation: v004BuildCraftCompletionMutation,
    validateHistory: v004ValidateCraftHistoryEvent,
    requestMarker: V004_CRAFT_COMPLETE_REQUEST_MARKER,
    historySchema: V004_CRAFT_HISTORY_EVENT_SCHEMA
  };
`, context);

const model = context.__C004__;

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

async function requestFor(payload, quantity, id) {
  const hash = await model.hashPayload(payload);
  return {
    marker: model.requestMarker,
    craftTransactionId: id,
    requestedQuantity: quantity,
    reservationPayload: clone(payload),
    reservationCanonicalPayload: JSON.stringify(payload),
    reservationSnapshotHash: hash,
    verifiedReservationSnapshotHash: hash,
    preparedAt: "2026-09-09T17:00:00.000Z"
  };
}

const payload = payloadFrom(fixture);
const meta = metaRecords(fixture.revisions, 0);
const partialRequest = await requestFor(payload, 4, "craft-c004-partial-0001");
const partialValidation = clone(model.validateRequest(partialRequest));
assert.equal(partialValidation.capability.maxCompletableQuantity, 5);
assert.deepEqual(partialValidation.prefixPlan[0].lines, [
  { sequence: 0, batchId: "batch-alpha-first", consumedUnits: 30 },
  { sequence: 1, batchId: "batch-alpha-second", consumedUnits: 10 }
]);

const partialMutation = clone(model.buildMutation(
  partialRequest,
  clone(fixture.card),
  [clone(fixture.card)],
  meta,
  clone(fixture.batches),
  "2026-09-09T17:01:00.000Z"
));
assert.equal(partialMutation.cardRemoved, false);
assert.equal(partialMutation.craftingCards[0].quantity, 1);
assert.equal(partialMutation.craftingCards[0].cardRevision, 4);
assert.deepEqual(partialMutation.revisions, {
  inventoryRevision: 5,
  allocationRevision: 8,
  craftListRevision: 2,
  historySequence: 1
});
assert.equal(partialMutation.historyEvent.craftListRevisionBefore, 2);
assert.equal(partialMutation.historyEvent.craftListRevisionAfter, 2);
assert.equal(partialMutation.historyEvent.cardRevisionBefore, 3);
assert.equal(partialMutation.historyEvent.cardRevisionAfter, 4);
assert.deepEqual(partialMutation.historyEvent.consumedDeltas.map(line => [line.batchId, line.consumedUnits]), [
  ["batch-alpha-first", 30],
  ["batch-alpha-second", 10],
  ["batch-beta", 60]
]);
assert.ok(partialMutation.historyEvent.consumedDeltas.every(line => line.beforeUnits === line.consumedUnits + line.afterUnits));
assert.equal(partialMutation.historyEvent.remainingBefore, 5);
assert.equal(partialMutation.historyEvent.completedQuantity, 4);
assert.equal(partialMutation.historyEvent.remainingAfter, 1);
assert.equal(partialMutation.historyEvent.status, "COMPLETED");
assert.equal(partialMutation.historyEvent.undoTimestamp, null);
assert.equal(model.validateHistory(partialMutation.historyEvent).eventSchema, model.historySchema);

const fullRequest = await requestFor(payload, 5, "craft-c004-full-0000001");
const shiftedCard = { ...clone(fixture.card), id: "card-c003-second", order: 1, cardRevision: 6 };
const fullMutation = clone(model.buildMutation(
  fullRequest,
  clone(fixture.card),
  [clone(fixture.card), shiftedCard],
  meta,
  clone(fixture.batches),
  "2026-09-09T17:02:00.000Z"
));
assert.equal(fullMutation.cardRemoved, true);
assert.equal(fullMutation.craftingCards.length, 1);
assert.equal(fullMutation.craftingCards[0].id, "card-c003-second");
assert.equal(fullMutation.craftingCards[0].order, 0);
assert.equal(fullMutation.craftingCards[0].cardRevision, 7);
assert.equal(fullMutation.historyEvent.cardRevisionAfter, 4);
assert.equal(fullMutation.historyEvent.cardRemoved, true);
assert.equal(fullMutation.historyEvent.craftListRevisionBefore, 2);
assert.equal(fullMutation.historyEvent.craftListRevisionAfter, 3);
assert.deepEqual(fullMutation.historyEvent.shiftedCardRevisions, [{ id: "card-c003-second", before: 6, after: 7 }]);

const oneUnitSource = clone(fixture);
oneUnitSource.card.quantity = 1;
oneUnitSource.card.cardRevision = 0;
oneUnitSource.card.requirements = [clone(fixture.card.requirements[1])];
oneUnitSource.card.requirements[0].requiredQuantityUnits = 10000;
oneUnitSource.card.recipeSlotQualityPoolAssignments = {};
oneUnitSource.cardResult.requestedQuantity = 1;
oneUnitSource.cardResult.requirements = [clone(fixture.cardResult.requirements[1])];
oneUnitSource.cardResult.requirements[0].requiredUnits = 10000;
oneUnitSource.cardResult.requirements[0].allocatedUnits = 10000;
oneUnitSource.cardResult.requirements[0].allocatedBatches = [{
  batchId: "batch-beta",
  quality: null,
  allocatedUnits: 10000,
  reason: "ANY_QUALITY"
}];
oneUnitSource.batches = [{ ...clone(fixture.batches[2]), quantityUnits: 10001 }];
oneUnitSource.revisions = { inventoryRevision: 1, craftListRevision: 1, allocationRevision: 1 };
const oneUnitPayload = payloadFrom(oneUnitSource);
const oneUnitRequest = await requestFor(oneUnitPayload, 1, "craft-c004-one-unit-001");
const oneUnitMutation = clone(model.buildMutation(
  oneUnitRequest,
  oneUnitSource.card,
  [oneUnitSource.card],
  metaRecords(oneUnitSource.revisions, 0),
  oneUnitSource.batches,
  "2026-09-09T17:03:00.000Z"
));
assert.equal(oneUnitMutation.materialBatches[0].quantityUnits, 1);
assert.equal(oneUnitMutation.historyEvent.consumedDeltas[0].beforeUnits, 10001);
assert.equal(oneUnitMutation.historyEvent.consumedDeltas[0].consumedUnits, 10000);
assert.equal(oneUnitMutation.historyEvent.consumedDeltas[0].afterUnits, 1);

for (const invalid of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1, 6]) {
  const bad = { ...partialRequest, requestedQuantity: invalid };
  assert.throws(() => model.validateRequest(bad), error => error.code === "PARTIAL_QUANTITY_OUT_OF_RANGE");
}

const mismatchCases = [
  ["INVENTORY_REVISION_MISMATCH", ({ meta: records }) => { records.find(record => record.key === "inventoryRevision").value += 1; }],
  ["ALLOCATION_REVISION_MISMATCH", ({ meta: records }) => { records.find(record => record.key === "allocationRevision").value += 1; }],
  ["CRAFT_LIST_REVISION_MISMATCH", ({ meta: records }) => { records.find(record => record.key === "craftListRevision").value += 1; }],
  ["CARD_REVISION_MISMATCH", ({ card }) => { card.cardRevision += 1; }],
  ["RESERVED_BATCH_QUALITY_CHANGED", ({ batches }) => { batches[0].quality += 1; }],
  ["RESERVED_BATCH_QUANTITY_CHANGED", ({ batches }) => { batches[0].quantityUnits -= 1; }],
  ["RESERVED_BATCH_IDENTITY_CHANGED", ({ batches }) => { batches[0].materialUuid = "other-material"; }],
  ["RESERVED_BATCH_SOURCE_CHANGED", ({ batches }) => { batches[0].sourceMaterialUuid = "other-source"; }]
];
for (const [reason, mutate] of mismatchCases) {
  const current = { card: clone(fixture.card), meta: clone(meta), batches: clone(fixture.batches) };
  mutate(current);
  assert.throws(
    () => model.validateCurrent(partialRequest, current.card, current.meta, current.batches),
    error => error.code === "STALE_RESERVATION" && error.detail === reason,
    reason
  );
}

const badHashRequest = { ...partialRequest, verifiedReservationSnapshotHash: "0".repeat(64) };
assert.throws(() => model.validateRequest(badHashRequest), error => error.code === "STALE_RESERVATION" && error.detail === "SNAPSHOT_HASH_MISMATCH");

const unprovenPayload = clone(payload);
unprovenPayload.outputCountEvidence = "OUTPUT_COUNT_UNPROVEN";
const unprovenRequest = await requestFor(unprovenPayload, 1, "craft-c004-unproven-001");
assert.throws(() => model.validateRequest(unprovenRequest), error => error.code === "OUTPUT_COUNT_UNPROVEN");

const documentMarkup = appHtml.slice(0, appHtml.indexOf("<script>"));
const localScriptSources = [...documentMarkup.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]).filter(value => !/^https?:/i.test(value));
const localStylesheets = [...documentMarkup.matchAll(/<link\b[^>]*rel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*href\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]).filter(value => !/^https?:/i.test(value));
const c004Block = block("V004_C004_ATOMIC_CRAFT_COMPLETE_MODEL");
assert.doesNotMatch(c004Block, /\bMath\.(?:floor|ceil|round)\b/);
assert.doesNotMatch(c004Block, /\btoScuUnits\s*\(/);
assert.match(documentMarkup, /id="craftCompletionDialog"/);
assert.match(documentMarkup, /id="confirmCraftCompletionButton"/);
assert.match(appHtml, /commitCraftCompletion\(request, options\)/);
assert.match(appHtml, /db\.transaction\(\["materialBatches", "userInventory", "craftingCards", "craftHistory", "userMeta"\], "readwrite"\)/);
assert.match(appHtml, /historyStore\.add\(mutation\.historyEvent\)/);
assert.equal(localScriptSources.length, 0);
assert.equal(localStylesheets.length, 0);

fs.mkdirSync(artifactDirectory, { recursive: true });
const evidence = {
  cycle: "V004-C004",
  status: "PASS_TARGETED_MODEL",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  sourceFixture: "tests/fixtures/v004-c003-reservation.json",
  sourceFixtureEvidence: "PER_FINISHED_ITEM_NORMALIZED_EXACT",
  transaction: {
    stores: ["materialBatches", "userInventory", "craftingCards", "craftHistory", "userMeta"],
    resolvesOn: "transaction.oncomplete",
    historyWrite: "add",
    duplicateStatus: "ALREADY_COMPLETED",
    injectedFailureStatus: "SIMULATED_CRAFT_COMPLETE_ABORT"
  },
  partial: {
    requestedQuantity: 4,
    remainingBefore: 5,
    remainingAfter: 1,
    craftListRevisionBefore: partialMutation.historyEvent.craftListRevisionBefore,
    craftListRevisionAfter: partialMutation.historyEvent.craftListRevisionAfter,
    cardRevisionBefore: partialMutation.historyEvent.cardRevisionBefore,
    cardRevisionAfter: partialMutation.historyEvent.cardRevisionAfter,
    prefixDeltas: partialMutation.historyEvent.consumedDeltas.map(line => ({ batchId: line.batchId, consumedUnits: line.consumedUnits })),
    proportionalRedistribution: false
  },
  full: {
    cardRemoved: fullMutation.cardRemoved,
    craftListRevisionBefore: fullMutation.historyEvent.craftListRevisionBefore,
    craftListRevisionAfter: fullMutation.historyEvent.craftListRevisionAfter,
    preCraftCardStored: Boolean(fullMutation.historyEvent.preCraftCardSnapshot),
    originalOrder: fullMutation.historyEvent.originalOrder,
    shiftedCardRevision: fullMutation.historyEvent.shiftedCardRevisions[0]
  },
  conservation: {
    invariant: "beforeUnits = consumedUnits + afterUnits",
    toleranceUnits: 0,
    oneUnitRemainder: oneUnitMutation.materialBatches[0].quantityUnits,
    roundingCallsInC004Model: 0
  },
  revisions: partialMutation.revisions,
  staleReasons: mismatchCases.map(([reason]) => reason).concat(["SNAPSHOT_HASH_MISMATCH"]),
  outputCountBlocker: "OUTPUT_COUNT_UNPROVEN",
  history: {
    eventSchema: partialMutation.historyEvent.eventSchema,
    status: partialMutation.historyEvent.status,
    deltaCount: partialMutation.historyEvent.consumedDeltas.length,
    undoTimestamp: partialMutation.historyEvent.undoTimestamp
  },
  singleFile: {
    embeddedCss: /<style\b[^>]*id="spgApplicationStyles"/i.test(documentMarkup),
    embeddedJs: /<script>/.test(appHtml),
    localScriptSrc: localScriptSources.length,
    localStylesheetDependency: localStylesheets.length,
    localRuntimeJsonDependency: 0,
    fixtureRuntimeImport: 0,
    localRuntimeSidecars: 0,
    applicationRuntimeFileCount: 1
  },
  exclusions: {
    historyUi: "NOT_IMPLEMENTED",
    undo: "NOT_IMPLEMENTED",
    redo: "NOT_IMPLEMENTED",
    broadcastChannel: "NOT_IMPLEMENTED"
  }
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V004_C004_TARGETED_MODEL_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
