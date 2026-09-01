import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const appHtml = fs.readFileSync(appPath, "utf8");
const appCss = extractEmbeddedApplicationCss(appHtml);
const standaloneArgument = process.argv.find((argument) => argument.startsWith("--standalone="));
const standalonePath = standaloneArgument
  ? path.resolve(projectDirectory, standaloneArgument.slice("--standalone=".length))
  : path.join(projectDirectory, "test-artifacts", "V003-C012.1", "standalone-js-300-quality-plan.html");
const standalone = fs.readFileSync(standalonePath, "utf8");

const block = (name) => {
  const match = appHtml.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-29T12:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
${block("C0125B_COMBINED_QUALITY_POOL_MODEL")}
${block("MATERIAL_NAMING_MODEL")}
${block("MATERIAL_COLOR_MODEL")}
${block("M6_STANDALONE_EXPORT_MODEL")}
globalThis.__C0121__ = {
  rules: M2_QUALITY_RULES,
  modes: MATERIAL_QUALITY_PLAN_MODES,
  normalizeMaterialQualityPlan,
  normalizeMaterialQualityPlans,
  materialQualityPlansFromUserSettings,
  resolveEffectiveMaterialQualityPolicy,
  formatEffectiveQualityLabel,
  allocateCardsDeterministically,
  buildCombinedMaterials,
  buildCombinedMaterialsOverviewViewModel,
  buildM4BackupEnvelope,
  validateAndMigrateM4Backup,
  buildStandaloneSnapshot: m6BuildStandaloneSnapshot,
  renderStandaloneHtml: m6RenderStandaloneHtml
};`, context, { filename: "spg-v003-c0121-model.js" });

const model = context.__C0121__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const materialUuid = "11111111-1111-4111-8111-111111111111";
const dynamicRequirement = (id, slot, stats, units = 1000, unit = "SCU") => ({
  id,
  aspectIndex: 0,
  ingredientUuid: materialUuid,
  materialName: "Fixture Material",
  recipeSlotName: slot,
  requiredQuantityUnits: units,
  unit,
  qualityCapability: "DYNAMIC",
  affectedStats: stats
});
const card = (id, order, requirements, slotStrategies = {}) => ({
  id,
  order,
  active: true,
  quantity: 1,
  blueprintUuid: `blueprint-${id}`,
  outputName: `Blueprint ${id}`,
  requirements: clone(requirements),
  slotStrategies: clone(slotStrategies)
});
const batch = (id, quality, quantityUnits = 1000, unit = "SCU", targetMaterialUuid = materialUuid) => ({
  id,
  materialUuid: targetMaterialUuid,
  materialName: "Fixture Material",
  quality,
  quantityUnits,
  unit,
  createdAt: `2026-08-29T12:00:${String(Number(id.replace(/\D/g, "") || 0)).padStart(2, "0")}.000Z`
});

// Shared effective policy matrix. Explicit user material constraints may tighten
// FIXED allocation without changing its recipe semantics; UNKNOWN stays fail-safe.
const policy = (baselineRule, baselineTarget, plan, qualityCapability = "DYNAMIC") => model.resolveEffectiveMaterialQualityPolicy({
  materialUuid,
  qualityCapability,
  baselineRule,
  baselineTarget,
  materialPlan: plan
});
const target900 = { mode: model.modes.TARGET_Q, targetQuality: 900 };
const highest = { mode: model.modes.HIGHEST_Q };
assert.equal(policy(model.rules.HP_MIN_500, 500, target900).userFacingLabel, "Q900+");
assert.equal(policy(model.rules.TARGET_Q, 750, target900).userFacingLabel, "Q900+");
assert.equal(policy(model.rules.TARGET_Q, 750, { mode: model.modes.TARGET_Q, targetQuality: 700 }).effectiveTarget, 750, "A material terv nem gyengítheti a recept minimumát.");
assert.equal(policy(model.rules.TARGET_Q, 750, highest).userFacingLabel, "Legjobb Q");
assert.equal(policy(model.rules.TARGET_Q, 750, highest).effectiveMinimum, 750, "A Highest available nem dobhatja el a recept minimumát.");
assert.equal(policy(model.rules.FIXED, null, target900, "FIXED").userFacingLabel, "Q900+");
assert.equal(policy(model.rules.FIXED, null, target900, "FIXED").baselineRecipeQualityRule, model.rules.FIXED);
assert.equal(policy(model.rules.FIXED, null, highest, "FIXED").effectiveRule, model.rules.HIGHEST_Q);
assert.equal(policy(model.rules.UNKNOWN, null, target900, "UNKNOWN").userFacingLabel, "Q?");
assert.equal(policy(model.rules.UNKNOWN, null, highest, "UNKNOWN").effectiveRule, model.rules.UNKNOWN);
assert.equal(model.formatEffectiveQualityLabel(policy(model.rules.HP_MIN_500, 500, null)), "Q500+");

// Target and Highest plans must drive the real deterministic allocation path.
const functional = dynamicRequirement("slot-functional", "Functional", [{ key: "power", label: "Power" }]);
const targetCard = card("target", 0, [functional], { "slot-functional": { mode: model.rules.TARGET_Q, targetQuality: 750 } });
const qualityBatches = [batch("q700", 700), batch("q860", 860), batch("q930", 930), batch("q990", 990)];
const targetAllocation = model.allocateCardsDeterministically([targetCard], qualityBatches, { [materialUuid]: target900 });
const targetResult = targetAllocation.cards[0].requirements[0];
assert.equal(targetResult.effectiveTarget, 900);
assert.equal(targetResult.allocatedBatches[0].quality, 930, "Target Q esetén a legalacsonyabb megfelelő batch fogyjon először.");
const highestAllocation = model.allocateCardsDeterministically([targetCard], qualityBatches, { [materialUuid]: highest });
const highestResult = highestAllocation.cards[0].requirements[0];
assert.equal(highestResult.effectiveMinimum, 750);
assert.equal(highestResult.allocatedBatches[0].quality, 990, "Highest available esetén a legmagasabb megfelelő batch fogyjon először.");

// The standalone projection must carry the effective TARGET_Q policy from the real allocation result.
const targetExportCard = Object.assign({}, targetCard, {
  outputUuid: "item-target",
  outputType: "Fixture",
  outputTypeLabel: "Fixture",
  craftTimeSeconds: 60,
  gameVersion: "fixture-version"
});
const targetStandaloneSnapshot = model.buildStandaloneSnapshot({
  appName: "sPg Crafting List",
  generatedAt: "2026-08-29T12:00:00.000Z",
  scDataVersion: "fixture-version",
  card: targetExportCard,
  cardResult: targetAllocation.cards[0],
  blueprint: { uuid: targetExportCard.blueprintUuid, outputUuid: targetExportCard.outputUuid, outputName: targetExportCard.outputName, gameVersion: "fixture-version" },
  trace: targetAllocation.trace,
  materialQualityPlans: { [materialUuid]: target900 }
});
assert.equal(targetStandaloneSnapshot.requirements[0].materialPlanMode, model.modes.TARGET_Q);
assert.equal(targetStandaloneSnapshot.requirements[0].effectiveQualityLabel, "Q900+");
const targetStandaloneHtml = model.renderStandaloneHtml(targetStandaloneSnapshot, appCss);
assert.ok(targetStandaloneHtml.includes("Q900+"), "A TARGET_Q 900 standalone exportból hiányzik a Q900+ effektív felirat.");
assert.doesNotMatch(targetStandaloneHtml, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);

// Material-level policy applies to every matching Recipe Slot while reservations remain slot-specific.
const hp = dynamicRequirement("slot-hp", "Integrity", [{ key: "health_maxhealth", label: "Integrity" }]);
const dualCard = card("dual", 0, [hp, functional]);
const dualBatches = [batch("q517", 517), batch("q950", 950)];
const dualAllocation = model.allocateCardsDeterministically([dualCard], dualBatches);
const dualCombined = model.buildCombinedMaterials(dualAllocation, [dualCard], dualBatches);
assert.equal(dualCombined.length, 1);
assert.equal(dualCombined[0].usages.length, 2);
assert.deepEqual(Array.from(dualCombined[0].qualityBuckets, (entry) => entry.label).sort(), ["Legjobb Q", "Q500+"].sort());
assert.equal(dualCombined[0].qualityBuckets.reduce((sum, entry) => sum + entry.reservedUnits, 0), dualCombined[0].reservedUnits);
const reservedByBatch = new Map();
dualCombined[0].usages.flatMap((usage) => usage.allocatedBatches).forEach((entry) => reservedByBatch.set(entry.batchId, (reservedByBatch.get(entry.batchId) || 0) + entry.allocatedUnits));
for (const sourceBatch of dualBatches) {
  assert.ok((reservedByBatch.get(sourceBatch.id) || 0) <= sourceBatch.quantityUnits, `A ${sourceBatch.id} batch duplán lett lefoglalva.`);
}

// Card priority and max-craftable react deterministically to a material plan change.
const scarce = [batch("q930", 930, 1000)];
const priorityAB = model.allocateCardsDeterministically([card("a", 0, [functional]), card("b", 1, [functional])], scarce, { [materialUuid]: target900 });
const priorityBA = model.allocateCardsDeterministically([card("a", 1, [functional]), card("b", 0, [functional])], scarce, { [materialUuid]: target900 });
assert.equal(priorityAB.cards.find((entry) => entry.cardId === "a").requirements[0].allocatedUnits, 1000);
assert.equal(priorityBA.cards.find((entry) => entry.cardId === "b").requirements[0].allocatedUnits, 1000);
const onlyQ800 = [batch("q800", 800, 1000)];
assert.equal(model.allocateCardsDeterministically([card("max", 0, [functional])], onlyQ800).cards[0].maxCraftable, 1);
assert.equal(model.allocateCardsDeterministically([card("max", 0, [functional])], onlyQ800, { [materialUuid]: target900 }).cards[0].maxCraftable, 0);

// Combined view-model remains unit-aware, including ITEM quantities.
const itemUuid = "22222222-2222-4222-8222-222222222222";
const itemRequirement = { id: "slot-item", ingredientUuid: itemUuid, materialName: "Item Fixture", recipeSlotName: "Item Slot", requiredQuantityUnits: 2, unit: "ITEM", qualityCapability: "FIXED", affectedStats: [] };
const itemCard = card("item", 0, [itemRequirement]);
const itemBatches = [batch("item1", null, 3, "ITEM", itemUuid)];
const itemAllocation = model.allocateCardsDeterministically([itemCard], itemBatches);
const itemCombined = model.buildCombinedMaterials(itemAllocation, [itemCard], itemBatches);
const itemOverview = model.buildCombinedMaterialsOverviewViewModel(itemCombined, [itemCard], {});
assert.equal(itemOverview.materials[0].unit, "ITEM");
assert.deepEqual(JSON.parse(JSON.stringify(itemOverview.materials[0].totals)), { requiredUnits: 2, availableUnits: 3, reservedUnits: 2, missingUnits: 0 });

// Generic USER setting provides persistence and backup compatibility without a schema bump.
const normalizedPlans = model.normalizeMaterialQualityPlans({
  [materialUuid]: target900,
  ignored: { mode: model.modes.RECIPE }
});
assert.deepEqual(JSON.parse(JSON.stringify(normalizedPlans)), { [materialUuid]: target900 });
const userSettings = [{ key: "user:materialQualityPlans", scope: "USER", value: normalizedPlans, updatedAt: "2026-08-29T12:00:00.000Z" }];
assert.deepEqual(JSON.parse(JSON.stringify(model.materialQualityPlansFromUserSettings(userSettings))), { [materialUuid]: target900 });
const userData = { userInventory: [], materialBatches: dualBatches, craftingCards: [dualCard], miningLoadouts: [], userSettings };
const envelope = model.buildM4BackupEnvelope(userData, { applicationVersion: "V003-dev" });
const restored = model.validateAndMigrateM4Backup(JSON.stringify(envelope));
assert.deepEqual(JSON.parse(JSON.stringify(model.materialQualityPlansFromUserSettings(restored.backup.data.userSettings))), { [materialUuid]: target900 });
const schema1 = model.validateAndMigrateM4Backup({ format: envelope.format, schemaVersion: 1, data: { userInventory: [], materialBatches: [], craftingCards: [], userLoadouts: [] } });
assert.deepEqual(JSON.parse(JSON.stringify(model.materialQualityPlansFromUserSettings(schema1.backup.data.userSettings))), {});

// JS-300 default recipe policy stays exactly HP_MIN_500 + 2 FIXED.
const rawJs300 = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "js-300-blueprint.json"), "utf8"));
const js300 = vm.runInContext(`normalizeBlueprint(${JSON.stringify(rawJs300)}, { gameVersion: ${JSON.stringify(rawJs300.game_version)}, dataSource: "FIXTURE", fetchedAt: nowIso(), origin: "FIXTURE" })`, context);
const js300Card = card("js300", 0, Array.from(js300.recipeSlots, (slot) => ({
  id: slot.id,
  ingredientUuid: slot.ingredientUuid,
  materialName: slot.materialName,
  recipeSlotName: slot.recipeSlotName,
  requiredQuantityUnits: slot.requiredQuantityUnits,
  unit: slot.unit,
  qualityCapability: slot.qualityCapability,
  affectedStats: Array.from(slot.affectedStats, (stat) => ({ key: stat.key, label: stat.label }))
})));
const js300Allocation = model.allocateCardsDeterministically([js300Card], []);
assert.deepEqual(Array.from(js300Allocation.cards[0].requirements, (entry) => entry.effectiveRule), [model.rules.HP_MIN_500, model.rules.FIXED, model.rules.FIXED]);
assert.deepEqual(Array.from(js300Allocation.cards[0].requirements, (entry) => entry.userFacingQualityLabel), ["Q500+", "Bármely Q", "Bármely Q"]);

// UI, shared consumer, detail, standalone and single-file acceptance markers.
assertSingleFileRuntimeMarkup(appHtml);
for (const marker of [
  "function resolveEffectiveMaterialQualityPolicy",
  "function renderMaterialQualityPlanControl",
  "function buildCombinedMaterialsOverviewViewModel",
  "spg-c0121-quality-badge",
  "spg-c0121-quality-buckets",
  "C0121_COMBINED_DETAIL_KIND",
  "Quality + allocation részlet"
]) {
  assert.ok(appHtml.includes(marker), `A C012.1 marker hiányzik: ${marker}`);
}
for (const marker of [".spg-c0121-quality-plan", ".spg-c0121-quality-bucket", ".spg-c0121-recipe-need", "@media (max-width: 560px)"]) {
  assert.ok(appCss.includes(marker), `A C012.1 CSS marker hiányzik: ${marker}`);
}
assert.match(standalone, /spg-c0121-quality-badge/);
assert.match(standalone, />Q500\+<|>Bármely Q<|>Q\?</);
assert.doesNotMatch(standalone, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);
const payload = standalone.match(/<script type="application\/json" id="spg-export-snapshot">([\s\S]*?)<\/script>/);
assert.ok(payload, "A standalone Quality snapshot hiányzik.");
JSON.parse(payload[1]);

const referencePath = path.join(projectDirectory, "Info", "Combined Materials.png");
const referenceSha = crypto.createHash("sha256").update(fs.readFileSync(referencePath)).digest("hex");
assert.equal(referenceSha, "f1883eca222bb1a5172b90c31cb9be8f724f6366841483f0bdff2cc14bdb7cb6", "A Combined Materials vizuális referencia megváltozott.");

console.log("V003_C0121_MATERIAL_QUALITY_PLANNER_TEST_PASS");
console.log(JSON.stringify({
  policyMatrix: "PASS",
  deterministicAllocation: "PASS",
  combinedNoDoubleCount: "PASS",
  priorityAndMaxCraftable: "PASS",
  persistenceAndBackup: "PASS",
  standaloneTargetQ900: "PASS",
  js300DefaultLabels: ["Q500+", "Bármely Q", "Bármely Q"],
  standaloneBytes: Buffer.byteLength(standalone, "utf8"),
  referenceSha256: referenceSha
}, null, 2));
