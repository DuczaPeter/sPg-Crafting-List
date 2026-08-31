import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v003-c0125c1-fr86-assignment-model.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C012.5C3A");
const evidencePath = path.join(artifactDirectory, "pool-allocation-evidence.json");
const html = fs.readFileSync(appPath, "utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const block = (name) => {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  toScuUnits: (value) => Math.round(Number(value) * 10000),
  foldSearchText: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
globalThis.__C0125C3A__ = {
  M2_QUALITY_RULES,
  MATERIAL_QUALITY_PLAN_MODES,
  RECIPE_SLOT_QUALITY_POOL_MODES,
  resolveEffectiveMaterialQualityPolicy,
  resolveRecipeSlotPoolAllocationPolicy,
  allocateCardsDeterministically
};`, context, { filename: "spg-v003-c0125c3a-model.js" });

const model = context.__C0125C3A__;
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
  quantity: options.quantity ?? 1,
  blueprintUuid: fixture.blueprint.uuid,
  outputName: fixture.blueprint.outputName,
  requirements: clone(options.requirements || fixture.requirements),
  slotStrategies: clone(options.slotStrategies || {}),
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
const requirement = (result, slotId) => result.cards[0].requirements.find((item) => item.recipeSlotId === slotId);

// FR-86 happy path: one physical Stileron pool, two different slot thresholds.
const fr86Card = makeCard("fr86-c3a", { assignments });
const happy = model.allocateCardsDeterministically([fr86Card], clone(happyBatches), {}, canonical, pools);
const happyShell = requirement(happy, shell.id);
const happyField = requirement(happy, fieldArray.id);
assert.equal(happy.cards[0].satisfied, true);
assert.equal(happy.cards[0].maxCraftable, 1);
assert.deepEqual(JSON.parse(JSON.stringify(happyShell.allocatedBatches.map((item) => item.batchId))), ["q550"]);
assert.deepEqual(JSON.parse(JSON.stringify(happyField.allocatedBatches.map((item) => item.batchId))), ["q750"]);
assert.equal(happyShell.baselineRule, model.M2_QUALITY_RULES.FIXED);
assert.equal(happyShell.recipePoolAssignmentMode, modes.MINIMUM_Q_POOL);
assert.equal(happyShell.recipePoolThreshold, 500);
assert.equal(happyShell.finalEffectiveMinimum, 500);
assert.equal(happyField.recipePoolAssignmentMode, modes.MAXIMUM_Q_POOL);
assert.equal(happyField.recipePoolThreshold, 700);
assert.equal(happyField.finalEffectiveMinimum, 700);
assert.equal(happyField.allocationStrategy, "LOWEST_QUALITY_AT_OR_ABOVE_MINIMUM");
assert.ok(happy.batchUsage.every((item) => item.reservedUnits <= item.quantityUnits), "Ugyanaz a fizikai batch nem foglalható kétszer.");

// Enough physical amount, but no Q700+ batch for Field Array.
const shortageBatches = [
  batch("q550-only", stileron.commodityUuid, 31000, 550, "1"),
  batch("feyn-shortage", feynmaline.ingredientUuid, 170, 900, "2", "ITEM")
];
const shortage = model.allocateCardsDeterministically([fr86Card], clone(shortageBatches), {}, canonical, pools);
const shortageField = requirement(shortage, fieldArray.id);
assert.equal(shortage.cards[0].satisfied, false);
assert.equal(shortage.cards[0].maxCraftable, 0);
assert.equal(shortageField.status, "INSUFFICIENT_QUALITY");
assert.equal(shortageField.missingAmountUnits, 0);
assert.equal(shortageField.missingQualityUnits, 19000);

// Explicit pool without a valid threshold fails closed and is traceable.
const unresolved = model.allocateCardsDeterministically([fr86Card], clone(happyBatches), {}, canonical, {});
const unresolvedShell = requirement(unresolved, shell.id);
assert.equal(unresolvedShell.status, "POOL_THRESHOLD_UNRESOLVED");
assert.equal(unresolvedShell.recipePoolResolutionStatus, "UNRESOLVED_MISSING_THRESHOLD");
assert.equal(unresolvedShell.allocationBlockReason, "POOL_THRESHOLD_UNRESOLVED");
assert.equal(unresolvedShell.allocatedUnits, 0);
assert.equal(unresolved.cards[0].maxCraftable, 0);

// ANY_Q cannot weaken an HP/Integrity recipe baseline; explicit assignment replaces legacy material-plan constraint only.
const hpRequirement = {
  ...clone(shell),
  id: "hp-slot",
  qualityCapability: "DYNAMIC",
  affectedStats: [{ key: "health", label: "Health" }],
  requiredQuantityUnits: 1000
};
const hpCard = makeCard("hp-any", { requirements: [hpRequirement], assignments: { [hpRequirement.id]: modes.ANY_Q } });
const hpResult = model.allocateCardsDeterministically(
  [hpCard],
  [batch("q100", stileron.commodityUuid, 1000, 100, "1"), batch("q550-hp", stileron.commodityUuid, 1000, 550, "2")],
  { [stileron.ingredientUuid]: { mode: model.MATERIAL_QUALITY_PLAN_MODES.TARGET_Q, targetQuality: 900 } },
  canonical,
  pools
);
const hpSlot = requirement(hpResult, hpRequirement.id);
assert.equal(hpSlot.baselineRule, model.M2_QUALITY_RULES.HP_MIN_500);
assert.equal(hpSlot.recipePoolAssignmentMode, modes.ANY_Q);
assert.equal(hpSlot.finalEffectiveMinimum, 500);
assert.equal(hpSlot.allocatedBatches[0].batchId, "q550-hp");
assert.equal(hpSlot.qualityPolicy.legacyMaterialPlanIgnored, true);

// Assignment absence is exact C012.3 compatibility, even when pool data exists.
const legacyCard = makeCard("legacy");
const legacyPlans = { [stileron.ingredientUuid]: { mode: model.MATERIAL_QUALITY_PLAN_MODES.TARGET_Q, targetQuality: 700 } };
const legacyWithoutPoolArgument = model.allocateCardsDeterministically([legacyCard], clone(happyBatches), legacyPlans, canonical);
const legacyWithUnusedPools = model.allocateCardsDeterministically([legacyCard], clone(happyBatches), legacyPlans, canonical, pools);
assert.deepEqual(JSON.parse(JSON.stringify(legacyWithUnusedPools)), JSON.parse(JSON.stringify(legacyWithoutPoolArgument)));
assert.equal(requirement(legacyWithUnusedPools, shell.id).allocatedBatches[0].batchId, "q750");

// FIXED remains baseline semantics while explicit pool constrains physical inventory.
assert.equal(happyField.baselineRule, model.M2_QUALITY_RULES.FIXED);
assert.equal(happyField.effectiveRule, model.M2_QUALITY_RULES.TARGET_Q);

// UNKNOWN stays fail-safe even with a valid pool selection.
const unknownRequirement = { ...clone(shell), id: "unknown-slot", qualityCapability: "UNKNOWN", affectedStats: [], requiredQuantityUnits: 1000 };
const unknownCard = makeCard("unknown", { requirements: [unknownRequirement], assignments: { [unknownRequirement.id]: modes.MAXIMUM_Q_POOL } });
const unknown = model.allocateCardsDeterministically([unknownCard], [batch("q900-unknown", stileron.commodityUuid, 1000, 900)], {}, canonical, pools);
const unknownSlot = requirement(unknown, unknownRequirement.id);
assert.equal(unknownSlot.status, "QUALITY_UNKNOWN");
assert.equal(unknownSlot.baselineRule, model.M2_QUALITY_RULES.UNKNOWN);
assert.equal(unknownSlot.qualityPolicy.recipePoolResolutionStatus, "BLOCKED_BY_UNKNOWN_RECIPE_BASELINE");

// Threshold modes consume the lowest eligible Q first; legacy HIGHEST_Q remains highest-first.
const oneFixed = { ...clone(shell), id: "fixed-one", requiredQuantityUnits: 1000 };
const lowFirstCard = makeCard("low-first", { requirements: [oneFixed], assignments: { [oneFixed.id]: modes.MAXIMUM_Q_POOL } });
const orderedBatches = [
  batch("q980", stileron.commodityUuid, 1000, 980, "1"),
  batch("q750-low", stileron.commodityUuid, 1000, 750, "2"),
  batch("q900", stileron.commodityUuid, 1000, 900, "3")
];
assert.equal(requirement(model.allocateCardsDeterministically([lowFirstCard], clone(orderedBatches), {}, canonical, pools), oneFixed.id).allocatedBatches[0].batchId, "q750-low");
const functional = { ...clone(shell), id: "functional", qualityCapability: "DYNAMIC", affectedStats: [{ key: "power_draw", label: "Power" }], requiredQuantityUnits: 1000 };
const highestCard = makeCard("highest", { requirements: [functional] });
assert.equal(requirement(model.allocateCardsDeterministically([highestCard], clone(orderedBatches), {}, canonical, pools), functional.id).allocatedBatches[0].batchId, "q980");

// Per-card assignment independence and deterministic Card priority.
const shellOnly = { ...clone(shell), id: "shared-shell", requiredQuantityUnits: 12000 };
const cardA = makeCard("card-a", { order: 0, requirements: [shellOnly], assignments: { [shellOnly.id]: modes.MINIMUM_Q_POOL } });
const cardB = makeCard("card-b", { order: 1, requirements: [shellOnly], assignments: { [shellOnly.id]: modes.MAXIMUM_Q_POOL } });
const independent = model.allocateCardsDeterministically(
  [cardA, cardB],
  [batch("q550-cards", stileron.commodityUuid, 12000, 550, "1"), batch("q750-cards", stileron.commodityUuid, 12000, 750, "2")],
  {}, canonical, pools
);
assert.equal(independent.cards.find((card) => card.cardId === "card-a").requirements[0].allocatedBatches[0].batchId, "q550-cards");
assert.equal(independent.cards.find((card) => card.cardId === "card-b").requirements[0].allocatedBatches[0].batchId, "q750-cards");
const priorityA = makeCard("priority-a", { order: 0, requirements: [shellOnly], assignments: { [shellOnly.id]: modes.MAXIMUM_Q_POOL } });
const priorityB = makeCard("priority-b", { order: 1, requirements: [shellOnly], assignments: { [shellOnly.id]: modes.MAXIMUM_Q_POOL } });
const priority = model.allocateCardsDeterministically([priorityB, priorityA], [batch("scarce-q750", stileron.commodityUuid, 12000, 750)], {}, canonical, pools);
assert.equal(priority.cards.find((card) => card.cardId === "priority-a").satisfied, true);
assert.equal(priority.cards.find((card) => card.cardId === "priority-b").satisfied, false);
assert.equal(priority.batchUsage[0].reservedUnits, 12000);

// Max DB and assignment change use the same per-slot policy.
const allMinimumAssignments = { [shell.id]: modes.MINIMUM_Q_POOL, [fieldArray.id]: modes.MINIMUM_Q_POOL };
const allMinimum = model.allocateCardsDeterministically([makeCard("all-min", { assignments: allMinimumAssignments })], clone(shortageBatches), {}, canonical, pools);
assert.equal(allMinimum.cards[0].satisfied, true);
assert.equal(allMinimum.cards[0].maxCraftable, 1);
assert.equal(shortage.cards[0].maxCraftable, 0);
const maxTwoBatches = [
  batch("q550-two", stileron.commodityUuid, 24000, 550, "1"),
  batch("q750-two", stileron.commodityUuid, 38000, 750, "2"),
  batch("feyn-two", feynmaline.ingredientUuid, 340, 900, "3", "ITEM")
];
assert.equal(model.allocateCardsDeterministically([fr86Card], maxTwoBatches, {}, canonical, pools).cards[0].maxCraftable, 2);

// Static wiring and scope guards.
assert.match(html, /function allocateCardsDeterministically\(cards, batches, materialQualityPlans, canonicalMaterials, materialQualityPools\)/);
assert.match(html, /allocateCardsDeterministically\(state\.craftingCards, state\.materialBatches, state\.materialQualityPlans, state\.knownMaterials, state\.materialQualityPools\)/);
assert.match(html, /recalculateAllocation\("MATERIAL_QUALITY_POOL_UPDATE"\)/);
assert.match(html, /async function updateRecipeSlotQualityPoolAssignment[\s\S]*updateCraftingCard[\s\S]*RECIPE_SLOT_QUALITY_POOL_ASSIGNMENT/);
assert.match(html, /async function updateC010RecipeSlotQualityPoolAssignment[\s\S]*recalculateC010FinalCraftingCard\(\)/);
assert.doesNotMatch(html, /C0125C3B_/);

const evidence = {
  cycle: "V003-C012.5C3A",
  status: "PASS",
  precedence: "RECIPE_BASELINE -> LEGACY_C0123_WHEN_NO_EXPLICIT_ASSIGNMENT -> EXPLICIT_RECIPE_SLOT_POOL_CONSTRAINT",
  legacyFallbackCompatibility: "PASS",
  anyQBaselineProtection: "PASS",
  minimumQ: { threshold: 500, batch: "q550", status: "PASS" },
  maximumQ: { threshold: 700, batch: "q750", status: "PASS" },
  fr86HappyPath: "PASS",
  insufficientQuality: { status: shortageField.status, missingAmountUnits: shortageField.missingAmountUnits, missingQualityUnits: shortageField.missingQualityUnits },
  unresolvedThreshold: unresolvedShell.status,
  fixedBaselinePreserved: "PASS",
  unknownFailSafe: "PASS",
  lowEligibleFirst: "PASS",
  legacyHighestQ: "PASS",
  perCardIndependence: "PASS",
  priority: "PASS",
  noDoubleCount: "PASS",
  canonicalCommodityIngredientIdentity: "PASS",
  maxCraftable: { insufficient: 0, sufficientForTwo: 2 },
  assignmentRecalculationWiring: "PASS",
  combinedPoolMetricsChanged: false,
  standaloneRendererChanged: false,
  c0125c3bStarted: false
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0125C3A_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
