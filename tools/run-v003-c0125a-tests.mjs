import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v003-c0125a-inventory-independence.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C012.5A");
const evidencePath = path.join(artifactDirectory, "inventory-independence-evidence.json");
const html = fs.readFileSync(appPath, "utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const block = (name) => {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-30T09:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000),
  foldSearchText: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
${block("C0125B_COMBINED_QUALITY_POOL_MODEL")}
globalThis.__C0125A__ = {
  allocateCardsDeterministically,
  buildCombinedMaterials,
  buildCombinedMaterialsOverviewViewModel,
  buildKnownMaterialOptions,
  resolveKnownMaterialSelection,
  buildM4BackupEnvelope,
  validateAndMigrateM4Backup,
  simulateM4UserDataImport
};`, context, { filename: "spg-v003-c0125a-model.js" });

const model = context.__C0125A__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const materials = Object.values(fixture.materials).map((record) => ({
  uuid: record.uuid,
  name: record.name,
  rawName: record.name,
  categories: ["SHIP_MINING"],
  kind: "mineable",
  provenance: { gameVersion: fixture.scVersion }
}));
const canonicalMaterials = vm.runInContext(`buildMaterialDisplayIndex(${JSON.stringify(materials)})`, context);
const batches = clone(fixture.inventoryOnlyBatches);

const zeroAllocation = model.allocateCardsDeterministically([], batches, {});
const inventoryOnly = model.buildCombinedMaterials(zeroAllocation, [], [batches[0]], canonicalMaterials);
assert.equal(inventoryOnly.length, 1);
assert.equal(inventoryOnly[0].materialUuid, fixture.materials.stileron.uuid);
assert.equal(inventoryOnly[0].requiredUnits, 0);
assert.equal(inventoryOnly[0].reservedUnits, 0);
assert.equal(inventoryOnly[0].missingUnits, 0);
assert.equal(inventoryOnly[0].availableUnits, 41090);

const multipleInventoryOnly = model.buildCombinedMaterials(zeroAllocation, [], batches, canonicalMaterials);
assert.equal(multipleInventoryOnly.length, 3);
assert.equal(model.buildCombinedMaterialsOverviewViewModel(multipleInventoryOnly, [], {}).summary.materialCount, 3);

const stileronRequirement = {
  id: "slot-stileron",
  ingredientUuid: fixture.materials.stileron.uuid,
  materialName: "Stileron",
  recipeSlotName: "Shell",
  requiredQuantityUnits: 50000,
  unit: "SCU",
  qualityCapability: "FIXED",
  affectedStats: []
};
const card = {
  id: "c0125a-card",
  order: 0,
  active: true,
  collapsed: false,
  quantity: 1,
  blueprintUuid: "c0125a-blueprint",
  outputName: "C012.5A Fixture",
  requirements: [stileronRequirement],
  slotStrategies: {}
};

const requirementOnlyAllocation = model.allocateCardsDeterministically([card], [], {});
const requirementOnly = model.buildCombinedMaterials(requirementOnlyAllocation, [card], [], canonicalMaterials);
assert.equal(requirementOnly.length, 1);
assert.equal(requirementOnly[0].availableUnits, 0);
assert.equal(requirementOnly[0].requiredUnits, 50000);
assert.equal(requirementOnly[0].missingUnits, 50000);

const combinedAllocation = model.allocateCardsDeterministically([card], [batches[0]], {});
const combined = model.buildCombinedMaterials(combinedAllocation, [card], [batches[0]], canonicalMaterials);
assert.equal(combined.length, 1, "Az inventory és requirement Stileron két kártyára szakadt.");
assert.equal(combined[0].availableUnits, 41090);
assert.equal(combined[0].requiredUnits, 50000);
assert.equal(combined[0].reservedUnits, 41090);
assert.equal(combined[0].missingUnits, 8910);

const afterCardDelete = model.buildCombinedMaterials(model.allocateCardsDeterministically([], [batches[0]], {}), [], [batches[0]], canonicalMaterials);
assert.equal(afterCardDelete.length, 1);
assert.equal(afterCardDelete[0].requiredUnits, 0);
assert.equal(afterCardDelete[0].availableUnits, 41090);

const knownWithoutRecipe = model.buildKnownMaterialOptions(materials, [], [], null);
assert.equal(knownWithoutRecipe.length, 3);
const selectedStileron = model.resolveKnownMaterialSelection("Stileron", "", knownWithoutRecipe);
assert.equal(selectedStileron.uuid, fixture.materials.stileron.uuid);
assert.equal(selectedStileron.origin, "ACTIVE_COMMODITY_CACHE");
assert.equal(model.resolveKnownMaterialSelection("Manual Unknown", "manual-uuid", knownWithoutRecipe), null);

const linkedCommodityUuid = fixture.identityFixtures.exactLinkedStileron.commodityUuid;
const linkedCache = [{
  uuid: linkedCommodityUuid,
  name: fixture.identityFixtures.exactLinkedStileron.name,
  rawName: fixture.identityFixtures.exactLinkedStileron.name,
  categories: ["SHIP_MINING"],
  kind: "mineable",
  provenance: { gameVersion: fixture.scVersion }
}];
const linkedCard = clone(card);
linkedCard.requirements[0].commodityUuid = linkedCommodityUuid;
const linkedKnownMaterials = model.buildKnownMaterialOptions(linkedCache, [batches[0]], [linkedCard], null);
assert.equal(linkedKnownMaterials.length, 1, "Az exact commodityUuid ↔ ingredientUuid kapcsolat nem vonta össze a canonical materialt.");
assert.equal(linkedKnownMaterials[0].uuid, linkedCommodityUuid);
assert.ok(linkedKnownMaterials[0].sourceUuids.includes(fixture.materials.stileron.uuid));
const linkedInventoryBatch = Object.assign({}, batches[0], { materialUuid: linkedCommodityUuid });
const linkedAllocation = model.allocateCardsDeterministically([linkedCard], [linkedInventoryBatch], {}, linkedKnownMaterials);
const linkedCombined = model.buildCombinedMaterials(linkedAllocation, [linkedCard], [linkedInventoryBatch], linkedKnownMaterials);
assert.equal(linkedCombined.length, 1);
assert.equal(linkedCombined[0].materialUuid, linkedCommodityUuid);
assert.equal(linkedCombined[0].availableUnits, 41090);
assert.equal(linkedCombined[0].requiredUnits, 50000);
assert.equal(linkedCombined[0].reservedUnits, 41090);
assert.equal(linkedCombined[0].missingUnits, 8910);

const unlinked = fixture.identityFixtures.unlinkedSameName;
const unlinkedBatch = Object.assign({}, batches[0], {
  id: "c0125a-unlinked-batch",
  materialUuid: unlinked[0].uuid,
  materialName: unlinked[0].name
});
const unlinkedCard = clone(card);
unlinkedCard.requirements[0].ingredientUuid = unlinked[1].uuid;
unlinkedCard.requirements[0].commodityUuid = null;
unlinkedCard.requirements[0].materialName = unlinked[1].name;
const unlinkedKnownMaterials = model.buildKnownMaterialOptions([], [unlinkedBatch], [unlinkedCard], null);
assert.equal(unlinkedKnownMaterials.length, 2, "Exact API-kapcsolat nélküli, azonos nevű UUID-ket tilos összevonni.");
const unlinkedAllocation = model.allocateCardsDeterministically([unlinkedCard], [unlinkedBatch], {}, unlinkedKnownMaterials);
const unlinkedCombined = model.buildCombinedMaterials(unlinkedAllocation, [unlinkedCard], [unlinkedBatch], unlinkedKnownMaterials);
assert.equal(unlinkedCombined.length, 2, "A Combined Materials név alapján vont össze két nem kapcsolt UUID-t.");
assert.equal(model.buildCombinedMaterialsOverviewViewModel(unlinkedCombined, [unlinkedCard], {}).summary.materialCount, 2);
assert.ok(unlinkedCombined.some((material) => material.materialUuid === unlinked[0].uuid && material.availableUnits === 41090 && material.requiredUnits === 0));
assert.ok(unlinkedCombined.some((material) => material.materialUuid === unlinked[1].uuid && material.availableUnits === 0 && material.requiredUnits === 50000));

const userData = {
  userInventory: [],
  materialBatches: [batches[0]],
  craftingCards: [],
  miningLoadouts: [],
  userSettings: []
};
const envelope = model.buildM4BackupEnvelope(userData, { applicationVersion: "V003-dev", exportedAt: "2026-08-30T09:00:00.000Z" });
const restored = model.validateAndMigrateM4Backup(envelope);
assert.equal(restored.backup.data.materialBatches.length, 1);
assert.equal(restored.backup.data.materialBatches[0].quantityUnits, 41090);
const imported = model.simulateM4UserDataImport({ userInventory: [], materialBatches: [], craftingCards: [], miningLoadouts: [], userSettings: [] }, restored.backup.data, "REPLACE", false);
assert.equal(imported.materialBatches[0].materialUuid, fixture.materials.stileron.uuid);

const saveFunction = html.match(/async function saveMaterialBatchFromForm\(\) \{([\s\S]*?)\n    \}/);
assert.ok(saveFunction);
assert.doesNotMatch(saveFunction[1], /state\.(?:normalizedBlueprint|finalCardPreview)/, "A My Materials mentés még recipe/preview állapottól függ.");
assert.match(html, /buildKnownMaterialOptions\(state\.miningCommodityIndex, state\.materialBatches, state\.craftingCards, state\.normalizedBlueprint, state\.materialIdentityRelations, resolveActiveScVersion\(state\)\)/);
assert.match(html, /createCombinedMetric\("Készlet", material\.unit, material\.totals\.availableUnits\)/);

const evidence = {
  cycle: "V003-C012.5A",
  status: "PASS",
  combinedSourceSet: "inventory materials UNION active requirement materials",
  canonicalIdentity: "canonical material UUID",
  inventoryOnly: { status: "PASS", stileronUnits: 41090, requiredUnits: 0, reservedUnits: 0, missingUnits: 0 },
  multipleInventoryOnly: { status: "PASS", materialCount: 3 },
  requirementOnly: { status: "PASS", missingUnits: 50000 },
  inventoryRequirementDedup: { status: "PASS", materialCount: 1 },
  recipeDeletionRetainsInventory: "PASS",
  recipeIndependentKnownMaterialAdd: "PASS",
  knownMaterialSource: "ACTIVE_COMMODITY_CACHE via buildMaterialDisplayIndex",
  exactCommodityIngredientBridge: "PASS",
  unlinkedSameNameRemainsSeparate: "PASS",
  manualNameUuidEntryPreserved: true,
  reloadPersistenceModel: "materialBatches IndexedDB source unchanged",
  backupRestore: "PASS",
  schemaChanged: false,
  qualityPoolImplemented: false
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0125A_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
