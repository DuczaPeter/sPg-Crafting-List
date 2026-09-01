import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v003-c0125c1-fr86-assignment-model.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C012.5C3B1");
const evidencePath = path.join(artifactDirectory, "combined-pool-metrics-evidence.json");
const html = fs.readFileSync(appPath, "utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const block = (name) => {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-31T15:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000),
  foldSearchText: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
${block("C0125B_COMBINED_QUALITY_POOL_MODEL")}
globalThis.__C0125C3B1__ = {
  M2_QUALITY_RULES,
  RECIPE_SLOT_QUALITY_POOL_MODES,
  allocateCardsDeterministically,
  buildCombinedMaterials,
  buildCombinedMaterialsOverviewViewModel,
  buildCombinedPoolAllocationMetrics
};`, context, { filename: "spg-v003-c0125c3b1-model.js" });

const model = context.__C0125C3B1__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const [shell, fieldArray, frequencyController] = fixture.requirements;
const stileron = fixture.materials.stileron;
const feynmaline = fixture.materials.feynmaline;
const modes = model.RECIPE_SLOT_QUALITY_POOL_MODES;
const canonical = [
  { uuid: stileron.commodityUuid, displayName: stileron.name, sourceUuids: [stileron.commodityUuid, stileron.ingredientUuid] },
  { uuid: feynmaline.ingredientUuid, displayName: feynmaline.name, sourceUuids: [feynmaline.ingredientUuid] }
];
const pools = { [stileron.commodityUuid]: { minimumQ: 500, maximumQ: 700 } };
const assignments = { [shell.id]: modes.MINIMUM_Q_POOL, [fieldArray.id]: modes.MAXIMUM_Q_POOL };
const makeCard = (id, options = {}) => ({
  id,
  order: options.order ?? 0,
  active: true,
  quantity: 1,
  blueprintUuid: fixture.blueprint.uuid,
  outputName: fixture.blueprint.outputName,
  requirements: clone(options.requirements || fixture.requirements),
  slotStrategies: {},
  recipeSlotQualityPoolAssignments: clone(options.assignments || {})
});
const batch = (id, materialUuid, quantityUnits, quality, createdAt = id, unit = "SCU") => ({
  id,
  materialUuid,
  materialName: materialUuid === feynmaline.ingredientUuid ? feynmaline.name : stileron.name,
  quantityUnits,
  unit,
  quality,
  createdAt
});
const happyBatches = [
  batch("q550", stileron.commodityUuid, 12000, 550, "1"),
  batch("q750", stileron.commodityUuid, 19000, 750, "2"),
  batch("feyn", feynmaline.ingredientUuid, 170, 900, "3", "ITEM")
];
const buildOverview = (cards, batches, poolSettings = pools) => {
  const allocation = model.allocateCardsDeterministically(cards, clone(batches), {}, canonical, poolSettings);
  const combined = model.buildCombinedMaterials(allocation, cards, clone(batches), canonical);
  return {
    allocation,
    combined,
    overview: model.buildCombinedMaterialsOverviewViewModel(combined, cards, {}, poolSettings, clone(batches), canonical)
  };
};
const stileronView = (result) => result.overview.materials.find((material) => material.materialUuid === stileron.commodityUuid);

// FR-86 happy path: pool metrics only aggregate their explicit assignment results.
const fr86 = makeCard("fr86-b1", { assignments });
const happy = buildOverview([fr86], happyBatches);
const happyStileron = stileronView(happy);
assert.ok(happyStileron);
assert.deepEqual(JSON.parse(JSON.stringify(happyStileron.poolMetrics.minimum)), {
  assignmentMode: modes.MINIMUM_Q_POOL,
  requirementCount: 1,
  requiredUnits: 12000,
  reservedUnits: 12000,
  missingUnits: 0,
  missingAmountUnits: 0,
  missingQualityUnits: 0,
  unresolvedCount: 0,
  status: "SATISFIED"
});
assert.equal(happyStileron.poolMetrics.maximum.requiredUnits, 19000);
assert.equal(happyStileron.poolMetrics.maximum.reservedUnits, 19000);
assert.equal(happyStileron.poolMetrics.maximum.missingUnits, 0);
assert.equal(happyStileron.eligibleInventory.minimumUnits, 31000);
assert.equal(happyStileron.eligibleInventory.maximumUnits, 19000);
assert.equal(happyStileron.totals.availableUnits, 31000);
assert.equal(happyStileron.totals.requiredUnits, 31000);
assert.equal(happyStileron.totals.reservedUnits, 31000);
assert.ok(happy.allocation.batchUsage.every((item) => item.reservedUnits <= item.quantityUnits));

// Enough physical Q550 amount, but no Q700+ inventory: preserve Quality shortage semantics.
const lowOnlyBatches = [
  batch("q550-only", stileron.commodityUuid, 31000, 550, "1"),
  batch("feyn-low", feynmaline.ingredientUuid, 170, 900, "2", "ITEM")
];
const lowOnly = buildOverview([fr86], lowOnlyBatches);
const lowStileron = stileronView(lowOnly);
assert.equal(lowStileron.poolMetrics.minimum.status, "SATISFIED");
assert.equal(lowStileron.poolMetrics.maximum.status, "INSUFFICIENT_QUALITY");
assert.equal(lowStileron.poolMetrics.maximum.requiredUnits, 19000);
assert.equal(lowStileron.poolMetrics.maximum.reservedUnits, 0);
assert.equal(lowStileron.poolMetrics.maximum.missingAmountUnits, 0);
assert.equal(lowStileron.poolMetrics.maximum.missingQualityUnits, 19000);

// Missing threshold remains explicitly unresolved in the material pool projection.
const unresolved = buildOverview([fr86], happyBatches, {});
const unresolvedStileron = stileronView(unresolved);
assert.equal(unresolvedStileron.poolMetrics.minimum.status, "UNRESOLVED");
assert.equal(unresolvedStileron.poolMetrics.maximum.status, "UNRESOLVED");
assert.equal(unresolvedStileron.poolMetrics.minimum.unresolvedCount, 1);
assert.equal(unresolvedStileron.poolMetrics.maximum.unresolvedCount, 1);
assert.equal(unresolvedStileron.poolMetrics.minimum.reservedUnits, 0);

// ANY_Q and LEGACY_FALLBACK remain global totals, but never enter explicit pool subtotals.
const anyRequirement = { ...clone(shell), id: "any-slot", requiredQuantityUnits: 1000 };
const legacyRequirement = { ...clone(shell), id: "legacy-slot", requiredQuantityUnits: 1000 };
const mixedCard = makeCard("mixed", {
  requirements: [clone(shell), clone(fieldArray), anyRequirement, legacyRequirement],
  assignments: { [shell.id]: modes.MINIMUM_Q_POOL, [fieldArray.id]: modes.MAXIMUM_Q_POOL, [anyRequirement.id]: modes.ANY_Q }
});
const mixedBatches = [batch("q550-mixed", stileron.commodityUuid, 14000, 550, "1"), batch("q750-mixed", stileron.commodityUuid, 19000, 750, "2")];
const mixed = buildOverview([mixedCard], mixedBatches);
const mixedStileron = stileronView(mixed);
assert.equal(mixedStileron.poolMetrics.minimum.requiredUnits, 12000);
assert.equal(mixedStileron.poolMetrics.maximum.requiredUnits, 19000);
assert.equal(mixedStileron.totals.requiredUnits, 33000);
assert.equal(mixedStileron.totals.reservedUnits, 33000);

// Card priority is already resolved by C3A; Combined only aggregates the result.
const maxOnly = { ...clone(fieldArray), id: "max-only", requiredQuantityUnits: 19000 };
const high = makeCard("priority-high", { order: 0, requirements: [maxOnly], assignments: { [maxOnly.id]: modes.MAXIMUM_Q_POOL } });
const low = makeCard("priority-low", { order: 1, requirements: [maxOnly], assignments: { [maxOnly.id]: modes.MAXIMUM_Q_POOL } });
const priority = buildOverview([low, high], [batch("q550-spare", stileron.commodityUuid, 19000, 550, "1"), batch("q750-scarce", stileron.commodityUuid, 19000, 750, "2")]);
const priorityStileron = stileronView(priority);
assert.equal(priority.allocation.cards.find((card) => card.cardId === "priority-high").satisfied, true);
assert.equal(priority.allocation.cards.find((card) => card.cardId === "priority-low").satisfied, false);
assert.equal(priorityStileron.poolMetrics.maximum.requiredUnits, 38000);
assert.equal(priorityStileron.poolMetrics.maximum.reservedUnits, 19000);
assert.equal(priorityStileron.poolMetrics.maximum.missingQualityUnits, 19000);

// Recipe deletion removes pool demand while inventory-only material and thresholds remain.
const inventoryOnly = buildOverview([], happyBatches);
const inventoryStileron = stileronView(inventoryOnly);
assert.ok(inventoryStileron);
assert.equal(inventoryStileron.poolMetrics.minimum.requirementCount, 0);
assert.equal(inventoryStileron.poolMetrics.maximum.requirementCount, 0);
assert.equal(inventoryStileron.poolMetrics.minimum.requiredUnits, 0);
assert.deepEqual(JSON.parse(JSON.stringify(inventoryStileron.qualityPool)), { minimumQ: 500, maximumQ: 700 });
assert.equal(inventoryStileron.eligibleInventory.minimumUnits, 31000);
assert.equal(inventoryStileron.eligibleInventory.maximumUnits, 19000);

// Renderer scope: material-level metrics only, no recipe-slot names and no standalone work.
const poolRenderer = html.match(/function renderCombinedQualityPool\(material, field, label\) \{[\s\S]*?\n    \}(?=\n\n    function renderMaterialQualityPlanControl)/);
assert.ok(poolRenderer);
assert.match(poolRenderer[0], /Mennyiséghiány/);
assert.match(poolRenderer[0], /Quality-hiány/);
assert.match(poolRenderer[0], /allocation feloldatlan/);
assert.doesNotMatch(poolRenderer[0], /recipeSlotName|Shell|Field Array|Voltage Regulator|Stator Cores/);
assert.doesNotMatch(poolRenderer[0], /C0125C3B2_/);

const evidence = {
  cycle: "V003-C012.5C3B1",
  status: "PASS",
  minimumQRealMetrics: "PASS",
  maximumQRealMetrics: "PASS",
  eligiblePreview: "PASS_OVERLAP_NOT_PHYSICAL_TOTAL",
  globalTotal: "PASS",
  anyQExcludedFromPools: "PASS",
  legacyFallbackExcludedFromPools: "PASS",
  fr86HappyPath: "PASS",
  qualityShortage: "PASS_MISSING_AMOUNT_0_MISSING_QUALITY_19000",
  unresolvedThreshold: "PASS_FAIL_SAFE",
  noDoubleCount: "PASS",
  multipleCards: "PASS",
  priorityDerivedAggregation: "PASS",
  canonicalCommodityIngredientIdentity: "PASS",
  recipeDelete: "PASS",
  inventoryOnlyPersistence: "PASS",
  recipeSlotNamesInPoolUi: false,
  standaloneChanged: false,
  c0125c3b2TouchesCombinedRenderer: false
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0125C3B1_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
