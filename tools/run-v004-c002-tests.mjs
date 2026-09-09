import assert from "node:assert/strict";
import crypto, { webcrypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v004-c002-v003-migration.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C002");
const evidencePath = path.join(artifactDirectory, "model-evidence.json");
const appBuffer = fs.readFileSync(appPath);
const appHtml = appBuffer.toString("utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

function block(name) {
  const pattern = new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`);
  const match = appHtml.match(pattern);
  assert.ok(match, `Hiányzó modellblokk: ${name}`);
  return match[1];
}

function sliceBetween(start, end) {
  const from = appHtml.indexOf(start);
  const to = appHtml.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `Hiányzó kódtartomány: ${start}`);
  return appHtml.slice(from, to);
}

const m4Block = block("M4_COMBINED_BACKUP_MODEL");
const m4Foundation = m4Block.slice(0, m4Block.indexOf("function buildCombinedCanonicalMaterialLookup"));
const context = vm.createContext({
  console,
  crypto: webcrypto,
  TextEncoder,
  TextDecoder,
  Set,
  Map,
  APP: {
    name: "sPg Crafting List",
    version: "V004-dev",
    schemaVersion: 7,
    dbName: "spg-crafting-list-v004",
    dbVersion: 1
  },
  isUserSettingRecord(record) {
    return Boolean(record && (record.scope === "USER" || String(record.key || "").indexOf("user:") === 0));
  }
});
vm.runInContext(`${block("V004_C002_MIGRATION_MODEL")}\n${m4Foundation}\nglobalThis.__C002__ = {
  V004_CRAFT_HISTORY_INDEXES,
  V004_META_KEYS,
  V003_SOURCE_DATABASE,
  V003_SOURCE_STORE_SPECS,
  v004DefaultUserMetaRecords,
  normalizeV003SourceUserData,
  buildV003MigrationCanonicalPayload,
  fingerprintV003MigrationSource,
  v004AssertMigrationAllowed,
  buildV003SourceBackupEnvelope,
  buildM4BackupEnvelope,
  validateAndMigrateM4Backup,
  validateM4UserData,
  fingerprintUserDataPayload
};`, context, { filename: "spg-v004-c002-model.js" });

const model = context.__C002__;
const clone = value => JSON.parse(JSON.stringify(value));
const source = {
  databaseName: fixture.sourceDatabase.name,
  databaseVersion: fixture.sourceDatabase.version,
  userData: clone(fixture.userData)
};

assert.equal((appHtml.match(/version: "V004-dev"/g) || []).length, 1);
assert.equal((appHtml.match(/schemaVersion: 7/g) || []).length, 1);
assert.equal((appHtml.match(/dbName: "spg-crafting-list-v004"/g) || []).length, 1);
assert.equal((appHtml.match(/dbVersion: 1/g) || []).length, 1);
assert.equal((appHtml.match(/backupSchemaVersion: 3/g) || []).length, 1);

const storeDefinitions = sliceBetween("var STORE_DEFINITIONS", "var state =");
for (const storeName of fixture.sourceDatabase.requiredStores.concat(["craftHistory", "userMeta"])) {
  assert.match(storeDefinitions, new RegExp(`${storeName}: \\"`), `Hiányzó store: ${storeName}`);
}
assert.equal(Object.keys(model.V004_CRAFT_HISTORY_INDEXES).length, 3);
assert.deepEqual(Array.from(model.V004_CRAFT_HISTORY_INDEXES.byCraftingCardAndSequence.keyPath), ["craftingCardId", "historySequence"]);
assert.equal(model.V004_CRAFT_HISTORY_INDEXES.byHistorySequence.keyPath, "historySequence");
assert.deepEqual(Array.from(model.V004_CRAFT_HISTORY_INDEXES.byCraftingCardStatusAndSequence.keyPath), ["craftingCardId", "status", "historySequence"]);

const defaults = JSON.parse(JSON.stringify(model.v004DefaultUserMetaRecords()));
assert.deepEqual(Object.fromEntries(defaults.map(record => [record.key, record.value])), fixture.revisionInitialization);
for (const record of defaults) {
  assert.ok(Number.isSafeInteger(record.value));
  assert.equal(record.value, 0);
}

const normalized = JSON.parse(JSON.stringify(model.normalizeV003SourceUserData(clone(fixture.userData))));
assert.deepEqual(normalized, {
  userInventory: clone(fixture.userData.userInventory),
  materialBatches: clone(fixture.userData.materialBatches).sort((a, b) => a.id.localeCompare(b.id)),
  miningLoadouts: clone(fixture.userData.miningLoadouts),
  craftingCards: clone(fixture.userData.craftingCards),
  userSettings: clone(fixture.userData.userSettings)
});
for (const batch of fixture.userData.materialBatches) {
  const migrated = normalized.materialBatches.find(record => record.id === batch.id);
  assert.equal(migrated.materialUuid, batch.materialUuid);
  assert.equal(migrated.sourceMaterialUuid || null, batch.sourceMaterialUuid || null);
  assert.equal(migrated.quality, batch.quality);
  assert.equal(migrated.quantityUnits, batch.quantityUnits);
  assert.equal(migrated.unit, batch.unit);
}
assert.equal(normalized.craftingCards[0].id, fixture.userData.craftingCards[0].id);
assert.equal(normalized.craftingCards[0].order, 0);
assert.equal(normalized.craftingCards[0].quantity, 21);
assert.deepEqual(normalized.craftingCards[0].recipeSlotQualityPoolAssignments, fixture.userData.craftingCards[0].recipeSlotQualityPoolAssignments);

const firstFingerprint = await model.fingerprintV003MigrationSource(source);
const secondFingerprint = await model.fingerprintV003MigrationSource(clone(source));
assert.match(firstFingerprint, /^[0-9a-f]{64}$/);
assert.equal(firstFingerprint, secondFingerprint, "Azonos source eltérő SHA-256 fingerprintet adott.");
const changedSource = clone(source);
changedSource.userData.materialBatches[0].quantityUnits += 1;
const changedFingerprint = await model.fingerprintV003MigrationSource(changedSource);
assert.notEqual(firstFingerprint, changedFingerprint, "Releváns quantityUnits-változás nem változtatta meg a fingerprintet.");

const pristineTarget = {
  userInventory: [],
  materialBatches: [],
  craftingCards: [],
  miningLoadouts: [],
  userSettings: [],
  craftHistory: [],
  userMeta: defaults
};
assert.equal(model.v004AssertMigrationAllowed(pristineTarget, firstFingerprint), true);

function expectMigrationCode(target, fingerprint, code) {
  assert.throws(
    () => model.v004AssertMigrationAllowed(target, fingerprint),
    error => error && error.code === code,
    `Nem a várt migrációs blokk történt: ${code}`
  );
}

const successfulLedger = {
  key: model.V004_META_KEYS.migrationV003,
  status: "SUCCESS",
  fingerprint: firstFingerprint
};
expectMigrationCode({ ...pristineTarget, userMeta: defaults.concat(successfulLedger) }, firstFingerprint, "V003_MIGRATION_ALREADY_APPLIED");
expectMigrationCode({ ...pristineTarget, userMeta: defaults.concat(successfulLedger) }, changedFingerprint, "V003_SOURCE_CHANGED_AFTER_MIGRATION");
expectMigrationCode({ ...pristineTarget, materialBatches: [clone(fixture.userData.materialBatches[0])] }, firstFingerprint, "V004_TARGET_NOT_PRISTINE");

const v003Envelope = JSON.parse(JSON.stringify(model.buildV003SourceBackupEnvelope(clone(fixture.userData), {
  exportedAt: "2026-09-09T06:30:00.000Z"
})));
assert.equal(v003Envelope.schemaVersion, 2);
assert.equal(v003Envelope.sourceDatabase.accessMode, "READ_ONLY");
const migratedSchema2 = JSON.parse(JSON.stringify(model.validateAndMigrateM4Backup(v003Envelope)));
assert.equal(migratedSchema2.backup.schemaVersion, 3);
assert.deepEqual(migratedSchema2.backup.data.craftHistory, []);
assert.deepEqual(Object.fromEntries(migratedSchema2.backup.data.userMeta.map(record => [record.key, record.value])), fixture.revisionInitialization);
assert.equal(migratedSchema2.backup.data.materialBatches.find(record => record.id === "batch-one-unit").quantityUnits, 1);
assert.equal(migratedSchema2.backup.data.materialBatches.find(record => record.id === "batch-two-hundred-units").quantityUnits, 200);

const schema1 = clone(v003Envelope);
schema1.schemaVersion = 1;
delete schema1.fingerprint;
schema1.userData = schema1.data;
delete schema1.data;
const migratedSchema1 = JSON.parse(JSON.stringify(model.validateAndMigrateM4Backup(schema1)));
assert.equal(migratedSchema1.backup.schemaVersion, 3);
assert.deepEqual(migratedSchema1.backup.data.craftHistory, []);

const schema3Envelope = JSON.parse(JSON.stringify(model.buildM4BackupEnvelope(migratedSchema2.backup.data, {
  applicationVersion: "V004-dev",
  exportedAt: "2026-09-09T06:31:00.000Z"
})));
assert.equal(schema3Envelope.schemaVersion, 3);
assert.deepEqual(JSON.parse(JSON.stringify(model.validateAndMigrateM4Backup(schema3Envelope).backup.data)), migratedSchema2.backup.data);

for (const unitCase of fixture.exactUnitCases) {
  const batch = normalized.materialBatches.find(record => record.quantityUnits === unitCase.quantityUnits);
  assert.ok(batch, `Hiányzó exact-unit fixture: ${unitCase.quantityUnits}`);
  assert.equal(batch.quantityUnits, unitCase.quantityUnits);
}

assert.equal(fixture.liveOutputCountAudit.outputCountCandidateFields.length, 0);
assert.equal(fixture.liveOutputCountAudit.conclusion, "OUTPUT_COUNT_UNPROVEN – COMPLETION MUST BLOCK AFFECTED RECIPES");
const normalizer = sliceBetween("function normalizeBlueprint(raw, provenance)", "/* M1_PURE_MODEL_END */");
assert.doesNotMatch(normalizer, /outputCount|output_count|outputQuantity|output_quantity/);

const sourceReader = sliceBetween("async function discoverV003SourceDatabase", "function buildM4BackupEnvelope");
assert.match(sourceReader, /indexedDB\.databases\(\)/);
assert.match(sourceReader, /transaction\(storeNames, "readonly"\)/);
assert.match(sourceReader, /request\.transaction\.abort\(\)/);
assert.match(sourceReader, /SAFE_DISCOVERY_UNAVAILABLE/);
assert.match(sourceReader, /V003_SOURCE_SCHEMA_MISMATCH/);
assert.doesNotMatch(sourceReader, /\.put\(|\.add\(|\.delete\(|\.clear\(/);
const migrationWriter = sliceBetween("commitV003Migration(sourceData", "commitMiningDataset(payload)");
assert.match(migrationWriter, /\["userInventory", "materialBatches", "craftingCards", "userLoadouts", "settings", "craftHistory", "userMeta"\]/);
assert.match(migrationWriter, /transaction\.abort\(\)/);
assert.match(migrationWriter, /SIMULATED_V003_MIGRATION_ABORT/);
assert.doesNotMatch(migrationWriter, /toScuUnits|Math\.round|Math\.floor|Math\.ceil/);
assert.doesNotMatch(appHtml, /function\s+commitCraftCompletion|function\s+undoCraftCompletion|reservationSnapshotHash|new\s+BroadcastChannel/);
assert.doesNotMatch(appHtml, /id=["']craftComplete|id=["']craftHistoryTab|id=["']undoCraft/);

const documentMarkup = appHtml.slice(0, appHtml.indexOf("<script>"));
assert.match(documentMarkup, /<style\s+id="spgApplicationStyles"\s+data-source="embedded">[\s\S]+<\/style>/);
assert.doesNotMatch(documentMarkup, /<link[^>]+rel=["']stylesheet["']/i);
assert.doesNotMatch(documentMarkup, /<script[^>]+src=/i);
assert.doesNotMatch(appHtml, /v004-c002-v003-migration\.json|run-v004-c002-tests\.mjs|validate-v004-c002\.ps1/i);

fs.mkdirSync(artifactDirectory, { recursive: true });
const evidence = {
  cycle: "V004-C002",
  status: "PASS_TARGETED_MODEL",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  identity: {
    applicationVersion: "V004-dev",
    applicationSchemaVersion: 7,
    databaseName: "spg-crafting-list-v004",
    databaseVersion: 1,
    backupSchemaVersion: 3
  },
  topology: {
    sourceStores: fixture.sourceDatabase.requiredStores,
    newStores: ["craftHistory", "userMeta"],
    craftHistoryIndexes: Object.keys(model.V004_CRAFT_HISTORY_INDEXES)
  },
  migration: {
    fingerprint: firstFingerprint,
    changedFingerprint,
    sourceAccessMode: "READ_ONLY",
    replayCode: "V003_MIGRATION_ALREADY_APPLIED",
    changedSourceCode: "V003_SOURCE_CHANGED_AFTER_MIGRATION",
    nonPristineCode: "V004_TARGET_NOT_PRISTINE",
    atomicFailureCode: "SIMULATED_V003_MIGRATION_ABORT",
    exactQuantityUnits: fixture.userData.materialBatches.map(batch => ({ id: batch.id, quantityUnits: batch.quantityUnits })),
    historyAfterV003Migration: 0
  },
  backup: {
    acceptedLegacySchemas: [1, 2],
    targetSchema: 3,
    historyInitializedEmpty: true,
    revisionsInitializedAtZero: true
  },
  outputCount: fixture.liveOutputCountAudit,
  singleFile: {
    applicationRuntimeFileCount: 1,
    localRuntimeSidecars: 0,
    embeddedCss: true,
    embeddedJavaScript: true
  },
  excludedFeatures: {
    craftCompleteDeduction: "NOT_IMPLEMENTED",
    partialOrMaxExecution: "NOT_IMPLEMENTED",
    undo: "NOT_IMPLEMENTED"
  }
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V004_C002_TARGETED_MODEL_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
