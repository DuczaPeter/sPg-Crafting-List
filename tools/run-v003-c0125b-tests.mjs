import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v003-c0125b-combined-quality-pools.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C012.5B");
const evidencePath = path.join(artifactDirectory, "combined-quality-pools-evidence.json");
const html = fs.readFileSync(appPath, "utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const block = (name) => {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-31T08:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000),
  foldSearchText: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
${block("C0125B_COMBINED_QUALITY_POOL_MODEL")}
globalThis.__C0125B__ = {
  allocateCardsDeterministically,
  buildCombinedMaterials,
  buildCombinedMaterialsOverviewViewModel,
  normalizeMaterialQualityPools,
  materialQualityPoolsFromUserSettings,
  materialQualityPlansFromUserSettings,
  materialQualityPoolFor,
  canonicalizeMaterialQualityPoolUpdate,
  calculateQualityEligibleInventoryUnits,
  buildM4BackupEnvelope,
  validateAndMigrateM4Backup,
  simulateM4UserDataImport
};`, context, { filename: "spg-v003-c0125b-model.js" });

const model = context.__C0125B__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const stileron = fixture.materials.stileron;
const canonicalMaterials = Object.values(fixture.materials).map((material) => ({
  uuid: material.commodityUuid,
  displayName: material.name,
  sourceUuids: [material.commodityUuid, material.ingredientUuid]
}));
const batches = clone(fixture.batches);

const zeroAllocation = model.allocateCardsDeterministically([], batches, {}, canonicalMaterials);
const inventoryOnly = model.buildCombinedMaterials(zeroAllocation, [], batches, canonicalMaterials);
assert.equal(inventoryOnly.length, 3, "Nulla kártyánál mindhárom inventory materialnak látszania kell.");

const overview = model.buildCombinedMaterialsOverviewViewModel(inventoryOnly, [], {}, fixture.qualityPools, batches, canonicalMaterials);
const stileronView = overview.materials.find((material) => material.materialUuid === stileron.commodityUuid);
assert.ok(stileronView);
assert.deepEqual(JSON.parse(JSON.stringify(stileronView.qualityPool)), { minimumQ: 500, maximumQ: 950 });
assert.equal(stileronView.totals.availableUnits, 30000);
assert.equal(stileronView.eligibleInventory.minimumUnits, 30000);
assert.equal(stileronView.eligibleInventory.maximumUnits, 10000);
assert.notEqual(stileronView.eligibleInventory.minimumUnits + stileronView.eligibleInventory.maximumUnits, stileronView.totals.availableUnits, "Az átfedő eligible previewt tilos fizikai inventoryként összeadni.");

assert.deepEqual(
  JSON.parse(JSON.stringify(model.materialQualityPoolFor(stileron.ingredientUuid, fixture.qualityPools, canonicalMaterials))),
  { minimumQ: 500, maximumQ: 950 },
  "Az exact commodity/ingredient kapcsolatnak közös pool settinget kell adnia."
);
const updatedViaIngredient = model.canonicalizeMaterialQualityPoolUpdate(
  stileron.ingredientUuid,
  { minimumQ: 600, maximumQ: 975 },
  fixture.qualityPools,
  canonicalMaterials
);
assert.deepEqual(JSON.parse(JSON.stringify(updatedViaIngredient[stileron.commodityUuid])), { minimumQ: 600, maximumQ: 975 });
assert.equal(updatedViaIngredient[stileron.ingredientUuid], undefined);
assert.deepEqual(JSON.parse(JSON.stringify(updatedViaIngredient[fixture.materials.savrilium.commodityUuid])), { minimumQ: 700, maximumQ: 900 });

const unlinked = fixture.unlinkedSameName;
const unlinkedMaterials = unlinked.map((record) => ({ uuid: record.uuid, displayName: record.name, sourceUuids: [record.uuid] }));
const unlinkedPools = { [unlinked[0].uuid]: { minimumQ: 500, maximumQ: 950 } };
assert.deepEqual(JSON.parse(JSON.stringify(model.materialQualityPoolFor(unlinked[1].uuid, unlinkedPools, unlinkedMaterials))), { minimumQ: null, maximumQ: null });
assert.equal(Object.keys(model.canonicalizeMaterialQualityPoolUpdate(unlinked[1].uuid, { minimumQ: 700, maximumQ: 900 }, unlinkedPools, unlinkedMaterials)).length, 2);

const card = {
  id: "c0125b-card",
  order: 0,
  active: true,
  quantity: 1,
  blueprintUuid: "c0125b-blueprint",
  outputName: "C012.5B Fixture",
  slotStrategies: {},
  requirements: [{
    id: "c0125b-slot",
    ingredientUuid: stileron.ingredientUuid,
    commodityUuid: stileron.commodityUuid,
    materialName: stileron.name,
    recipeSlotName: "Hidden Fixture Slot",
    requiredQuantityUnits: 5000,
    unit: "SCU",
    qualityCapability: "FIXED",
    affectedStats: []
  }]
};
const withRecipeAllocation = model.allocateCardsDeterministically([card], batches, {}, canonicalMaterials);
const withRecipe = model.buildCombinedMaterials(withRecipeAllocation, [card], batches, canonicalMaterials);
assert.equal(withRecipe.filter((material) => material.materialUuid === stileron.commodityUuid).length, 1);
assert.deepEqual(JSON.parse(JSON.stringify(model.buildCombinedMaterialsOverviewViewModel(withRecipe, [card], {}, fixture.qualityPools, batches, canonicalMaterials).materials.find((material) => material.materialUuid === stileron.commodityUuid).qualityPool)), { minimumQ: 500, maximumQ: 950 });
const afterRecipeDelete = model.buildCombinedMaterials(model.allocateCardsDeterministically([], batches, {}, canonicalMaterials), [], batches, canonicalMaterials);
assert.equal(afterRecipeDelete.length, 3);
assert.deepEqual(JSON.parse(JSON.stringify(model.buildCombinedMaterialsOverviewViewModel(afterRecipeDelete, [], {}, fixture.qualityPools, batches, canonicalMaterials).materials.find((material) => material.materialUuid === stileron.commodityUuid).qualityPool)), { minimumQ: 500, maximumQ: 950 });

const planSetting = { key: "user:materialQualityPlans", scope: "USER", value: { [stileron.ingredientUuid]: { mode: "TARGET_Q", targetQuality: 800 } }, updatedAt: "2026-08-31T08:00:00.000Z" };
const poolSetting = { key: "user:materialQualityPools", scope: "USER", value: clone(fixture.qualityPools), updatedAt: "2026-08-31T08:00:01.000Z" };
const userData = { userInventory: [], materialBatches: batches, craftingCards: [], miningLoadouts: [], userSettings: [planSetting, poolSetting] };
const envelope = model.buildM4BackupEnvelope(userData, { applicationVersion: "V003-dev", exportedAt: "2026-08-31T08:00:02.000Z" });
const restored = model.validateAndMigrateM4Backup(envelope);
assert.deepEqual(JSON.parse(JSON.stringify(model.materialQualityPoolsFromUserSettings(restored.backup.data.userSettings))), fixture.qualityPools);
assert.deepEqual(JSON.parse(JSON.stringify(model.materialQualityPlansFromUserSettings(restored.backup.data.userSettings))), planSetting.value);
const modified = clone(userData);
modified.userSettings = [planSetting, { ...poolSetting, value: { [stileron.commodityUuid]: { minimumQ: 1, maximumQ: 2 } } }];
const imported = model.simulateM4UserDataImport(modified, restored.backup.data, "REPLACE", false);
assert.deepEqual(JSON.parse(JSON.stringify(model.materialQualityPoolsFromUserSettings(imported.userSettings))), fixture.qualityPools);

const oldEnvelope = model.buildM4BackupEnvelope({ ...userData, userSettings: [planSetting] }, { applicationVersion: "V003-dev" });
const oldRestored = model.validateAndMigrateM4Backup(oldEnvelope);
assert.deepEqual(JSON.parse(JSON.stringify(model.materialQualityPoolsFromUserSettings(oldRestored.backup.data.userSettings))), {});
assert.deepEqual(JSON.parse(JSON.stringify(model.materialQualityPlansFromUserSettings(oldRestored.backup.data.userSettings))), planSetting.value);

const poolRenderer = html.match(/function renderCombinedQualityPool\([\s\S]*?\n    \}/);
assert.ok(poolRenderer);
assert.match(poolRenderer[0], /bindCommittedNumericEditor/);
assert.match(poolRenderer[0], /normalizeCommittedNumericDraft/);
assert.doesNotMatch(poolRenderer[0], /addEventListener\("input"[\s\S]*saveMaterialQualityPools/);
const combinedRenderer = html.match(/function renderCombinedMaterials\(\) \{([\s\S]*?)\n    \}\n\n    function renderMaterialInventory/);
assert.ok(combinedRenderer);
assert.match(combinedRenderer[1], /"Minimum Q"/);
assert.match(combinedRenderer[1], /"MAX Q"/);
assert.doesNotMatch(combinedRenderer[1], /recipeSlotName|Shell|Field Array|Voltage Regulator|Stator Cores/);
const poolPersistence = html.match(/async function persistMaterialQualityPoolValue\([\s\S]*?\n    \}/);
assert.ok(poolPersistence);
assert.match(poolPersistence[0], /recalculateAllocation\("MATERIAL_QUALITY_POOL_UPDATE"\)/);

const evidence = {
  cycle: "V003-C012.5B",
  status: "PASS",
  inventoryOnlyMaterialCount: inventoryOnly.length,
  stileronPool: fixture.qualityPools[stileron.commodityUuid],
  eligibleInventory: { totalUnits: 30000, minimumUnits: 30000, maximumUnits: 10000, noDoubleCount: "PASS" },
  canonicalCommodityIngredientSharedSetting: "PASS",
  unlinkedSameNameRemainsSeparate: "PASS",
  independentMaterialSettings: "PASS",
  recipeAddRemovePersistence: "PASS",
  backupRestore: "PASS",
  oldBackupWithoutPoolSettings: "PASS",
  existingMaterialQualityPlansPreserved: "PASS",
  allocationUsesNewPools: true,
  c0125c3aIntegrationExpected: true,
  standaloneChanged: false
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0125B_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
