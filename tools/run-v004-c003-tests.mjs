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
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C003");
const evidencePath = path.join(artifactDirectory, "model-evidence.json");
const appBuffer = fs.readFileSync(appPath);
const appHtml = appBuffer.toString("utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

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
  Math,
  Date
});
vm.runInContext(`
  function hasValidQuality(value) { return Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 1000; }
  function isUserSettingRecord(record) { return Boolean(record && (record.scope === "USER" || String(record.key || "").indexOf("user:") === 0)); }
  var MATERIAL_QUALITY_PLAN_SETTING_KEY = "user:materialQualityPlans";
  var MATERIAL_QUALITY_POOL_SETTING_KEY = "user:materialQualityPools";
  ${block("V004_C002_MIGRATION_MODEL")}
  ${m4Foundation}
  ${block("V004_C003_REVISION_RESERVATION_MODEL")}
  globalThis.__C003__ = {
    defaultMeta: v004DefaultUserMetaRecords,
    nextRevision: v004NextRevision,
    revisionSnapshot: v004RevisionSnapshot,
    cardSemantic: v004CardAllocationSemantic,
    buildPayload: buildV004ReservationCanonicalPayload,
    hashPayload: hashV004ReservationPayload,
    capability: buildV004ReservationCapability,
    prefixPlan: buildV004ReservedPrefixPlan,
    prepareImport: prepareV004RevisionAwareImport,
    validateBackup: validateAndMigrateM4Backup,
    buildBackup: buildM4BackupEnvelope,
    fingerprint: fingerprintUserDataPayload
  };
`, context);

const model = context.__C003__;
const clone = value => JSON.parse(JSON.stringify(value));
const defaults = clone(model.defaultMeta());
assert.deepEqual(clone(model.revisionSnapshot(defaults)), {
  inventoryRevision: 0,
  craftListRevision: 0,
  allocationRevision: 0
});
assert.equal(model.nextRevision(0, "test"), 1);
assert.throws(() => model.nextRevision(Number.MAX_SAFE_INTEGER, "test"), error => error.code === "V004_REVISION_OVERFLOW");

function buildPayload(source = fixture) {
  return clone(model.buildPayload({
    card: clone(source.card),
    cardResult: clone(source.cardResult),
    revisions: clone(source.revisions),
    batches: clone(source.batches),
    activeScDataVersion: source.card.gameVersion
  }));
}

const payload = buildPayload();
assert.equal(payload.marker, "V004_RESERVATION_SNAPSHOT_1");
assert.deepEqual(payload.recipeSlots.map(slot => slot.stableSlotId), ["slot-alpha", "slot-beta"]);
assert.deepEqual(payload.recipeSlots[0].reservedBatches.map(line => line.batchId), ["batch-alpha-first", "batch-alpha-second"]);
assert.deepEqual(Object.keys(payload), Object.keys(payload).slice().sort(), "Canonical object keys are not deterministic.");
const hash = await model.hashPayload(payload);
assert.match(hash, /^[0-9a-f]{64}$/);
assert.equal(await model.hashPayload(buildPayload()), hash);

const changes = {};
async function changedHash(name, mutator) {
  const changed = clone(payload);
  mutator(changed);
  const changedValue = await model.hashPayload(changed);
  assert.notEqual(changedValue, hash, `${name} did not change reservation hash.`);
  changes[name] = changedValue;
}
await changedHash("batchQuantity", value => { value.recipeSlots[0].reservedBatches[0].batchQuantityUnits += 1; });
await changedHash("quality", value => { value.recipeSlots[0].reservedBatches[0].quality += 1; });
await changedHash("batchOrder", value => { value.recipeSlots[0].reservedBatches.reverse(); });
await changedHash("allocatedUnits", value => {
  value.recipeSlots[0].reservedBatches[0].allocatedUnits -= 1;
  value.recipeSlots[0].reservedBatches[1].allocatedUnits += 1;
});
await changedHash("cardQuantity", value => { value.remainingQuantity += 1; });
await changedHash("cardRevision", value => { value.cardRevision += 1; });
await changedHash("allocationRevision", value => { value.allocationRevision += 1; });

const relabeled = clone(fixture);
relabeled.card.outputName = "Changed display-only output label";
relabeled.card.requirements[0].materialName = "Changed display-only material label";
relabeled.batches[0].materialName = "Changed display-only batch label";
assert.equal(await model.hashPayload(buildPayload(relabeled)), hash, "Display-only label changed semantic snapshot identity.");

const capability = clone(model.capability(payload));
assert.deepEqual(capability, {
  status: "READY",
  maxCompletableQuantity: 5,
  remainingQuantity: 5,
  blockerReason: null
});
const prefix = clone(model.prefixPlan(payload, 4));
assert.deepEqual(prefix[0].lines, [
  { sequence: 0, batchId: "batch-alpha-first", consumedUnits: 30 },
  { sequence: 1, batchId: "batch-alpha-second", consumedUnits: 10 }
]);
assert.equal(prefix[0].requiredUnits, 40);

const limited = clone(payload);
limited.recipeSlots[0].reservedBatches[1].allocatedUnits = 0;
limited.recipeSlots[0].reservedBatches = limited.recipeSlots[0].reservedBatches.filter(line => line.allocatedUnits > 0);
limited.recipeSlots[0].reservedTotalUnits = 30;
assert.equal(model.capability(limited).maxCompletableQuantity, 3);
const unproven = clone(payload);
unproven.outputCountEvidence = "OUTPUT_COUNT_UNPROVEN";
assert.deepEqual(clone(model.capability(unproven)), {
  status: "BLOCKED",
  maxCompletableQuantity: 0,
  remainingQuantity: 5,
  blockerReason: "OUTPUT_COUNT_UNPROVEN"
});
await assert.rejects(() => model.hashPayload(payload, null, TextEncoder), error => error.code === "HASH_UNAVAILABLE");

function emptyUserData() {
  return {
    userInventory: [],
    materialBatches: [],
    craftingCards: [],
    miningLoadouts: [],
    userSettings: [],
    craftHistory: [],
    userMeta: clone(defaults)
  };
}
const incoming = emptyUserData();
incoming.materialBatches = clone(fixture.batches);
incoming.userInventory = Array.from(fixture.batches.reduce((groups, batch) => {
  const id = `${batch.materialUuid}::${batch.unit}`;
  const current = groups.get(id) || {
    id,
    materialUuid: batch.materialUuid,
    materialName: batch.materialName,
    unit: batch.unit,
    batchCount: 0,
    totalQuantityUnits: 0
  };
  current.batchCount += 1;
  current.totalQuantityUnits += batch.quantityUnits;
  groups.set(id, current);
  return groups;
}, new Map()).values());
incoming.craftingCards = [clone(fixture.card)];
incoming.craftingCards[0].cardRevision = undefined;
const prepared = clone(model.prepareImport(emptyUserData(), incoming, "REPLACE"));
assert.equal(prepared.revisions.inventoryRevision, 1);
assert.equal(prepared.revisions.craftListRevision, 1);
assert.equal(prepared.revisions.allocationRevision, 1);
assert.equal(prepared.data.craftingCards[0].cardRevision, 0);

const legacySchema3 = clone(model.buildBackup(prepared.data, { applicationVersion: "V004-dev" }));
delete legacySchema3.data.craftingCards[0].cardRevision;
legacySchema3.fingerprint = model.fingerprint(legacySchema3.data);
const repairedLegacy = clone(model.validateBackup(legacySchema3));
assert.equal(repairedLegacy.backup.data.craftingCards[0].cardRevision, 0);
assert.ok(repairedLegacy.migration.steps.includes("CARD_REVISION_INITIALIZATION"));

const documentMarkup = appHtml.slice(0, appHtml.indexOf("<script>"));
const localScriptSources = [...documentMarkup.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]).filter(value => !/^https?:/i.test(value));
const localStylesheets = [...documentMarkup.matchAll(/<link\b[^>]*rel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*href\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]).filter(value => !/^https?:/i.test(value));
assert.equal(localScriptSources.length, 0);
assert.equal(localStylesheets.length, 0);
assert.match(documentMarkup, /id="reallocateCraftingListButton"/);
assert.doesNotMatch(appHtml, /Craft Complete/);

fs.mkdirSync(artifactDirectory, { recursive: true });
const evidence = {
  cycle: "V004-C003",
  status: "PASS_TARGETED_MODEL",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  revision: {
    initial: model.revisionSnapshot(defaults),
    overflow: "V004_REVISION_OVERFLOW",
    importInventoryRevision: prepared.revisions.inventoryRevision,
    importCraftListRevision: prepared.revisions.craftListRevision,
    importAllocationRevision: prepared.revisions.allocationRevision,
    importedCardRevision: prepared.data.craftingCards[0].cardRevision
  },
  reservation: {
    marker: payload.marker,
    sha256: hash,
    deterministic: true,
    semanticArrayOrderPreserved: true,
    changeSensitivity: Object.keys(changes),
    displayLabelsExcludedFromIdentity: true,
    cryptoUnavailable: "HASH_UNAVAILABLE"
  },
  capability: {
    fullMax: capability.maxCompletableQuantity,
    limitedVisibleReservationMax: model.capability(limited).maxCompletableQuantity,
    prefixBatchOrder: prefix[0].lines.map(line => line.batchId),
    outputCountUnproven: model.capability(unproven).blockerReason,
    rounding: "FORBIDDEN"
  },
  backup: {
    schemaVersion: repairedLegacy.backup.schemaVersion,
    earlySchema3CardRevisionInitialization: repairedLegacy.backup.data.craftingCards[0].cardRevision
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
    inventoryDeduction: "NOT_IMPLEMENTED",
    craftHistoryEvent: "NOT_IMPLEMENTED",
    undo: "NOT_IMPLEMENTED",
    broadcastChannel: "NOT_IMPLEMENTED"
  }
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V004_C003_TARGETED_MODEL_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
