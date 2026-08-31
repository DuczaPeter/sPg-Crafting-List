import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v003-c0125c1-fr86-assignment-model.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C012.5C1");
const evidencePath = path.join(artifactDirectory, "assignment-model-evidence.json");
const html = fs.readFileSync(appPath, "utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const block = (name) => {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const storedCardNormalizer = html.match(/function normalizeStoredCraftingCard\(card, fallbackOrder\) \{[\s\S]*?\n    \}(?=\n\n    \/\* C0125A_)/);
assert.ok(storedCardNormalizer, "A Crafting Card storage normalizer hiányzik.");
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-31T12:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000),
  foldSearchText: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
${storedCardNormalizer[0]}
globalThis.__C0125C1__ = {
  RECIPE_SLOT_QUALITY_POOL_MODES,
  normalizeRecipeSlotQualityPoolMode,
  normalizeRecipeSlotQualityPoolAssignments,
  recipeSlotQualityPoolAssignmentFor,
  setRecipeSlotQualityPoolAssignment,
  normalizeStoredCraftingCard,
  allocateCardsDeterministically,
  buildM4BackupEnvelope,
  validateAndMigrateM4Backup,
  simulateM4UserDataImport
};`, context, { filename: "spg-v003-c0125c1-model.js" });

const model = context.__C0125C1__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const [shell, fieldArray] = fixture.requirements;
const modes = model.RECIPE_SLOT_QUALITY_POOL_MODES;
assert.equal(model.normalizeRecipeSlotQualityPoolMode(modes.ANY_Q), modes.ANY_Q);
assert.equal(model.normalizeRecipeSlotQualityPoolMode(modes.MINIMUM_Q_POOL), modes.MINIMUM_Q_POOL);
assert.equal(model.normalizeRecipeSlotQualityPoolMode(modes.MAXIMUM_Q_POOL), modes.MAXIMUM_Q_POOL);
assert.equal(model.normalizeRecipeSlotQualityPoolMode("SUPER_Q_POOL"), null);

let assignments = model.setRecipeSlotQualityPoolAssignment({}, shell.id, modes.MINIMUM_Q_POOL);
assignments = model.setRecipeSlotQualityPoolAssignment(assignments, fieldArray.id, modes.MAXIMUM_Q_POOL);
assert.equal(assignments[shell.id], modes.MINIMUM_Q_POOL);
assert.equal(assignments[fieldArray.id], modes.MAXIMUM_Q_POOL);
const changedShell = model.setRecipeSlotQualityPoolAssignment(assignments, shell.id, modes.ANY_Q);
assert.equal(changedShell[shell.id], modes.ANY_Q);
assert.equal(changedShell[fieldArray.id], modes.MAXIMUM_Q_POOL, "A Shell módosítása nem írhatja át a Field Array assignmentet.");
assert.throws(() => model.setRecipeSlotQualityPoolAssignment(assignments, shell.id, "SUPER_Q_POOL"));

const invalidStored = model.normalizeStoredCraftingCard({
  id: "invalid-card",
  requirements: fixture.requirements,
  slotStrategies: {},
  recipeSlotQualityPoolAssignments: { [shell.id]: "SUPER_Q_POOL", [fieldArray.id]: modes.MAXIMUM_Q_POOL, orphan: modes.MINIMUM_Q_POOL }
}, 0);
assert.deepEqual(JSON.parse(JSON.stringify(invalidStored.recipeSlotQualityPoolAssignments)), { [fieldArray.id]: modes.MAXIMUM_Q_POOL });
assert.equal(model.recipeSlotQualityPoolAssignmentFor(invalidStored, shell.id).explicit, false);
assert.equal(model.recipeSlotQualityPoolAssignmentFor(invalidStored, shell.id).mode, null);
assert.equal(model.recipeSlotQualityPoolAssignmentFor({ id: "old" }, shell.id).origin, "LEGACY_FALLBACK");

const makeCard = (id, cardAssignments) => ({
  id,
  order: 0,
  active: true,
  collapsed: false,
  quantity: 1,
  blueprintUuid: fixture.blueprint.uuid,
  outputUuid: fixture.blueprint.outputUuid,
  outputName: fixture.blueprint.outputName,
  requirements: clone(fixture.requirements),
  slotStrategies: {},
  recipeSlotQualityPoolAssignments: clone(cardAssignments),
  createdAt: "2026-08-31T12:00:00.000Z",
  updatedAt: "2026-08-31T12:00:00.000Z"
});
const cardA = makeCard("fr86-a", assignments);
const cardB = makeCard("fr86-b", { [shell.id]: modes.MAXIMUM_Q_POOL });
cardA.recipeSlotQualityPoolAssignments = model.setRecipeSlotQualityPoolAssignment(cardA.recipeSlotQualityPoolAssignments, shell.id, modes.MINIMUM_Q_POOL);
assert.equal(cardB.recipeSlotQualityPoolAssignments[shell.id], modes.MAXIMUM_Q_POOL);

const reloaded = [cardA, cardB].map((card, index) => model.normalizeStoredCraftingCard(JSON.parse(JSON.stringify(card)), index));
assert.equal(reloaded[0].recipeSlotQualityPoolAssignments[shell.id], modes.MINIMUM_Q_POOL);
assert.equal(reloaded[0].recipeSlotQualityPoolAssignments[fieldArray.id], modes.MAXIMUM_Q_POOL);
assert.equal(reloaded[1].recipeSlotQualityPoolAssignments[shell.id], modes.MAXIMUM_Q_POOL);

const duplicate = JSON.parse(JSON.stringify(cardA));
duplicate.id = "fr86-copy";
duplicate.recipeSlotQualityPoolAssignments = model.setRecipeSlotQualityPoolAssignment(duplicate.recipeSlotQualityPoolAssignments, shell.id, modes.MAXIMUM_Q_POOL);
assert.equal(cardA.recipeSlotQualityPoolAssignments[shell.id], modes.MINIMUM_Q_POOL);
assert.equal(duplicate.recipeSlotQualityPoolAssignments[shell.id], modes.MAXIMUM_Q_POOL);

const afterDelete = [cardA, cardB].filter((card) => card.id !== cardA.id);
assert.equal(afterDelete.length, 1);
assert.equal(afterDelete[0].recipeSlotQualityPoolAssignments[shell.id], modes.MAXIMUM_Q_POOL);

const userData = { userInventory: [], materialBatches: [], craftingCards: [cardA, cardB], miningLoadouts: [], userSettings: [] };
const backup = model.buildM4BackupEnvelope(userData, { applicationVersion: "V003-dev" });
const restored = model.validateAndMigrateM4Backup(backup).backup.data;
assert.deepEqual(JSON.parse(JSON.stringify(restored.craftingCards.map((card) => card.recipeSlotQualityPoolAssignments))), [clone(assignments), { [shell.id]: modes.MAXIMUM_Q_POOL }]);
const modified = clone(userData);
modified.craftingCards[0].recipeSlotQualityPoolAssignments[shell.id] = modes.ANY_Q;
const imported = model.simulateM4UserDataImport(modified, restored, "REPLACE", false);
assert.equal(imported.craftingCards[0].recipeSlotQualityPoolAssignments[shell.id], modes.MINIMUM_Q_POOL);
assert.equal(imported.craftingCards[0].recipeSlotQualityPoolAssignments[fieldArray.id], modes.MAXIMUM_Q_POOL);

const oldCard = clone(cardA);
delete oldCard.recipeSlotQualityPoolAssignments;
const oldBackup = model.buildM4BackupEnvelope({ ...userData, craftingCards: [oldCard] }, { applicationVersion: "V002" });
const oldRestored = model.validateAndMigrateM4Backup(oldBackup).backup.data.craftingCards[0];
const oldReloaded = model.normalizeStoredCraftingCard(oldRestored, 0);
assert.deepEqual(JSON.parse(JSON.stringify(oldReloaded.recipeSlotQualityPoolAssignments)), {});
assert.equal(model.recipeSlotQualityPoolAssignmentFor(oldReloaded, shell.id).origin, "LEGACY_FALLBACK");

const batches = [
  { id: "q550", materialUuid: fixture.materials.stileron.commodityUuid, materialName: "Stileron", quantityUnits: 12000, unit: "SCU", quality: 550, createdAt: "1" },
  { id: "q750", materialUuid: fixture.materials.stileron.commodityUuid, materialName: "Stileron", quantityUnits: 19000, unit: "SCU", quality: 750, createdAt: "2" },
  { id: "feyn", materialUuid: fixture.materials.feynmaline.ingredientUuid, materialName: "Feynmaline", quantityUnits: 170, unit: "ITEM", quality: 900, createdAt: "3" }
];
const canonical = [{ uuid: fixture.materials.stileron.commodityUuid, sourceUuids: [fixture.materials.stileron.commodityUuid, fixture.materials.stileron.ingredientUuid] }];
const withoutAssignments = clone(cardA);
delete withoutAssignments.recipeSlotQualityPoolAssignments;
const legacyPlan = { [fixture.materials.stileron.ingredientUuid]: { mode: "TARGET_Q", targetQuality: 700 } };
const legacyAllocation = model.allocateCardsDeterministically([withoutAssignments], batches, legacyPlan, canonical);
assert.equal(legacyAllocation.cards[0].requirements[0].allocatedBatches[0].batchId, "q750", "A C012.3 materialQualityPlans fallbacknak változatlanul működnie kell.");

assert.match(html, /recipeSlotQualityPoolAssignments:\s*\{\}/);
assert.match(html, /async function updateRecipeSlotQualityPoolAssignment/);
assert.match(html, /function allocateCardsDeterministically\(cards, batches, materialQualityPlans, canonicalMaterials, materialQualityPools\)/);

const evidence = {
  cycle: "V003-C012.5C1",
  status: "PASS",
  storage: "craftingCards[].recipeSlotQualityPoolAssignments[recipeSlotId]",
  validModes: Object.values(modes),
  default: {},
  invalidFallback: "LEGACY_FALLBACK",
  fr86SlotIndependence: "PASS",
  fr86CardIndependence: "PASS",
  duplicateIndependence: "PASS",
  reloadPersistence: "PASS",
  deleteCleanup: "PASS",
  backupRestore: "PASS",
  oldBackupCompatibility: "PASS",
  legacyFallbackAllocationCompatibility: "PASS",
  c0125c2Started: false,
  c0125c3aIntegrationExpected: true,
  c0125c3bStarted: false
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0125C1_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
