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
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "metamaterial-test-152-quality-constraint.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C012.3");
const standalonePath = path.join(artifactDirectory, "standalone-metamaterial-test-152-q800.html");
const evidencePath = path.join(artifactDirectory, "quality-constraint-evidence.json");
const appHtml = fs.readFileSync(appPath, "utf8");
const appCss = extractEmbeddedApplicationCss(appHtml);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const block = (name) => {
  const match = appHtml.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-29T12:30:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("MATERIAL_NAMING_MODEL")}
${block("MATERIAL_COLOR_MODEL")}
${block("M6_STANDALONE_EXPORT_MODEL")}
globalThis.__C0123__ = {
  rules: M2_QUALITY_RULES,
  modes: MATERIAL_QUALITY_PLAN_MODES,
  normalizeBlueprint,
  resolveEffectiveMaterialQualityPolicy,
  allocateCardsDeterministically,
  buildCombinedMaterials,
  buildCombinedMaterialsOverviewViewModel,
  buildFinalCraftingCardViewModel,
  buildM4BackupEnvelope,
  validateAndMigrateM4Backup,
  materialQualityPlansFromUserSettings,
  buildStandaloneSnapshot: m6BuildStandaloneSnapshot,
  renderStandaloneHtml: m6RenderStandaloneHtml
};`, context, { filename: "spg-v003-c0123-model.js" });

const model = context.__C0123__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const stileronUuid = "8cd317a3-df9b-4315-8ac3-0f1fca42dfd4";
const ouratiteUuid = "989f9b73-f636-4f35-a81d-579dcbe3f0ab";
const normalized = vm.runInContext(`normalizeBlueprint(${JSON.stringify(fixture.blueprint)}, {
  gameVersion: ${JSON.stringify(fixture.scVersion)},
  dataSource: "Star Citizen Wiki API",
  source: "FIXTURE",
  fetchedAt: nowIso(),
  origin: "API_FIXTURE"
})`, context);
assert.equal(normalized.outputName, "Metamaterial Test #152");
assert.deepEqual(Array.from(normalized.recipeSlots, (slot) => slot.qualityCapability), ["FIXED", "FIXED"]);
assert.deepEqual(Array.from(normalized.recipeSlots, (slot) => slot.requiredQuantityUnits), [5000, 3000]);

const cardFromNormalized = (id, order = 0) => ({
  id,
  order,
  active: true,
  collapsed: fixture.card.collapsed,
  quantity: fixture.card.quantity,
  blueprintUuid: normalized.uuid,
  blueprintCacheKey: normalized.cacheKey,
  gameVersion: normalized.gameVersion,
  outputUuid: normalized.outputUuid,
  outputName: normalized.outputName,
  outputType: normalized.outputType,
  outputTypeLabel: normalized.outputTypeLabel,
  outputClass: normalized.outputClass,
  outputGrade: "1",
  outputSize: null,
  outputWebUrl: normalized.outputWebUrl,
  craftTimeSeconds: normalized.craftTimeSeconds,
  requirements: Array.from(normalized.recipeSlots, (slot) => ({
    id: slot.id,
    aspectIndex: slot.aspectIndex,
    ingredientUuid: slot.ingredientUuid,
    commodityUuid: slot.ingredient.commodityUuid,
    materialWebUrl: slot.ingredient.webUrl,
    materialName: slot.materialName,
    recipeSlotName: slot.recipeSlotName,
    requiredQuantityUnits: slot.requiredQuantityUnits,
    unit: slot.unit,
    qualityCapability: slot.qualityCapability,
    affectedStats: Array.from(slot.affectedStats)
  })),
  slotStrategies: {},
  createdAt: "2026-08-29T12:30:00.000Z",
  updatedAt: "2026-08-29T12:30:00.000Z"
});
const card = cardFromNormalized(fixture.card.id);
const requirement = (allocation, materialUuid) => allocation.cards[0].requirements.find((entry) => entry.ingredientUuid === materialUuid);
const traceFor = (allocation, materialUuid) => allocation.trace.find((entry) => entry.materialUuid === materialUuid);

// Release-blocking reproduction: FIXED recipe semantics plus explicit Target Q800.
const lowAllocation = model.allocateCardsDeterministically([card], clone(fixture.lowOnlyBatches), clone(fixture.materialPlans));
const lowStileron = requirement(lowAllocation, stileronUuid);
const lowOuratite = requirement(lowAllocation, ouratiteUuid);
const lowStileronTrace = traceFor(lowAllocation, stileronUuid);
assert.equal(lowStileron.baselineRule, model.rules.FIXED);
assert.equal(lowStileron.effectiveRule, model.rules.TARGET_Q);
assert.equal(lowStileron.effectiveTarget, 800);
assert.equal(lowStileron.userFacingQualityLabel, "Q800+");
assert.equal(lowStileron.requiredUnits, 15000);
assert.equal(lowStileron.allocatedUnits, 0);
assert.equal(lowStileron.missingAmountUnits, 0);
assert.equal(lowStileron.missingQualityUnits, 15000);
assert.equal(lowStileron.status, "INSUFFICIENT_QUALITY");
assert.equal(lowStileronTrace.available.find((batch) => batch.batchId === "stileron-q747").eligible, false);
assert.equal(lowStileronTrace.available.find((batch) => batch.batchId === "stileron-q747").decision, "QUALITY_BELOW_TARGET");
assert.equal(lowOuratite.requiredUnits, 9000);
assert.equal(lowOuratite.allocatedUnits, 9000);
assert.equal(lowOuratite.missingQualityUnits, 0);
assert.equal(lowOuratite.allocatedBatches[0].quality, 860);
assert.equal(lowAllocation.cards[0].satisfied, false);
assert.equal(lowAllocation.cards[0].maxCraftable, 0);

const lowCombined = model.buildCombinedMaterials(lowAllocation, [card], clone(fixture.lowOnlyBatches));
const lowStileronCombined = lowCombined.find((entry) => entry.materialUuid === stileronUuid);
assert.equal(lowStileronCombined.qualityBuckets[0].label, "Q800+");
assert.equal(lowStileronCombined.qualityBuckets[0].missingUnits, 15000);
assert.equal(lowStileronCombined.usages[0].baselineRule, model.rules.FIXED);
assert.equal(lowStileronCombined.usages[0].effectiveRule, model.rules.TARGET_Q);
const lowFinal = model.buildFinalCraftingCardViewModel({
  card,
  cardResult: lowAllocation.cards[0],
  trace: lowAllocation.trace,
  blueprint: normalized,
  scDataVersion: fixture.scVersion,
  materialQualityPlans: clone(fixture.materialPlans)
});
const lowFinalStileron = lowFinal.requirements.find((entry) => entry.materialUuid === stileronUuid);
assert.equal(lowFinalStileron.effectiveQualityLabel, "Q800+");
assert.equal(lowFinalStileron.missingQualityUnits, 15000);
assert.match(lowFinalStileron.qualityTooltip, /Recipe: Bármely Q \/ FIXED/);
assert.match(lowFinalStileron.qualityTooltip, /Saját anyagcél: Q800\+/);

// Adding a proven Q850 Stileron batch restores craftability without using Q747.
const sufficientBatches = clone(fixture.lowOnlyBatches).concat(clone(fixture.sufficientStileronBatch));
const sufficientAllocation = model.allocateCardsDeterministically([card], sufficientBatches, clone(fixture.materialPlans));
const sufficientStileron = requirement(sufficientAllocation, stileronUuid);
assert.equal(sufficientStileron.satisfied, true);
assert.equal(sufficientStileron.missingQualityUnits, 0);
assert.deepEqual(Array.from(sufficientStileron.allocatedBatches, (entry) => entry.quality), [850]);
assert.equal(traceFor(sufficientAllocation, stileronUuid).available.find((batch) => batch.batchId === "stileron-q747").eligible, false);
assert.equal(sufficientAllocation.cards[0].satisfied, true);
assert.equal(sufficientAllocation.cards[0].maxCraftable, 3);

// FIXED + HIGHEST_Q remains FIXED at recipe level but consumes descending Quality.
const highestPlans = clone(fixture.materialPlans);
highestPlans[stileronUuid] = { mode: model.modes.HIGHEST_Q, targetQuality: null };
const highestBatches = clone(fixture.lowOnlyBatches).concat(clone(fixture.highestStileronBatches));
const highestAllocation = model.allocateCardsDeterministically([card], highestBatches, highestPlans);
const highestStileron = requirement(highestAllocation, stileronUuid);
assert.equal(highestStileron.baselineRule, model.rules.FIXED);
assert.equal(highestStileron.effectiveRule, model.rules.HIGHEST_Q);
assert.equal(highestStileron.userFacingQualityLabel, "Legjobb Q");
assert.deepEqual(Array.from(highestStileron.allocatedBatches, (entry) => entry.quality), [950, 850]);
assert.equal(traceFor(highestAllocation, stileronUuid).available.find((batch) => batch.batchId === "stileron-q747").allocatedUnits, 0);

// RECIPE is backward-compatible: FIXED still accepts any Quality.
const recipeAllocation = model.allocateCardsDeterministically([card], clone(fixture.lowOnlyBatches), {});
const recipeStileron = requirement(recipeAllocation, stileronUuid);
assert.equal(recipeStileron.baselineRule, model.rules.FIXED);
assert.equal(recipeStileron.effectiveRule, model.rules.FIXED);
assert.equal(recipeStileron.userFacingQualityLabel, "Bármely Q");
assert.equal(recipeStileron.allocatedBatches[0].quality, 747);
assert.equal(recipeAllocation.cards[0].satisfied, true);

// Dynamic, recipe-minimum and UNKNOWN policy matrix.
const dynamicMaterialUuid = "11111111-1111-4111-8111-111111111111";
const dynamicRequirement = (id, stats, capability = "DYNAMIC") => ({
  id,
  ingredientUuid: dynamicMaterialUuid,
  materialName: "Dynamic Fixture",
  recipeSlotName: id,
  requiredQuantityUnits: 1000,
  unit: "SCU",
  qualityCapability: capability,
  affectedStats: stats
});
const dynamicCard = (req) => ({ id: `card-${req.id}`, order: 0, active: true, quantity: 1, outputName: req.id, requirements: [req], slotStrategies: {} });
const dynamicBatches = [{ id: "dynamic-q450", materialUuid: dynamicMaterialUuid, quality: 450, quantityUnits: 1000, unit: "SCU", createdAt: "2026-08-29T12:31:00.000Z" }, { id: "dynamic-q850", materialUuid: dynamicMaterialUuid, quality: 850, quantityUnits: 1000, unit: "SCU", createdAt: "2026-08-29T12:31:01.000Z" }];
const functional = dynamicRequirement("functional", [{ key: "power", label: "Power" }]);
assert.equal(requirement(model.allocateCardsDeterministically([dynamicCard(functional)], dynamicBatches, { [dynamicMaterialUuid]: { mode: model.modes.TARGET_Q, targetQuality: 800 } }), dynamicMaterialUuid).allocatedBatches[0].quality, 850);
const hp = dynamicRequirement("hp", [{ key: "health_maxhealth", label: "Integrity" }]);
const hp400 = requirement(model.allocateCardsDeterministically([dynamicCard(hp)], dynamicBatches, { [dynamicMaterialUuid]: { mode: model.modes.TARGET_Q, targetQuality: 400 } }), dynamicMaterialUuid);
assert.equal(hp400.effectiveTarget, 500);
assert.equal(hp400.userFacingQualityLabel, "Q500+");
const hp800 = requirement(model.allocateCardsDeterministically([dynamicCard(hp)], dynamicBatches, { [dynamicMaterialUuid]: { mode: model.modes.TARGET_Q, targetQuality: 800 } }), dynamicMaterialUuid);
assert.equal(hp800.effectiveTarget, 800);
assert.equal(hp800.allocatedBatches[0].quality, 850);
const unknown = dynamicRequirement("unknown", [], "UNKNOWN");
const unknownResult = requirement(model.allocateCardsDeterministically([dynamicCard(unknown)], dynamicBatches, { [dynamicMaterialUuid]: { mode: model.modes.TARGET_Q, targetQuality: 800 } }), dynamicMaterialUuid);
assert.equal(unknownResult.effectiveRule, model.rules.UNKNOWN);
assert.equal(unknownResult.userFacingQualityLabel, "Q?");
assert.equal(unknownResult.status, "QUALITY_UNKNOWN");

// Priority and no-double-count remain deterministic with user constraints.
const priorityBatches = [clone(fixture.sufficientStileronBatch)];
const firstCard = cardFromNormalized("priority-first", 0);
firstCard.requirements = firstCard.requirements.filter((entry) => entry.ingredientUuid === stileronUuid);
const secondCard = cardFromNormalized("priority-second", 1);
secondCard.requirements = secondCard.requirements.filter((entry) => entry.ingredientUuid === stileronUuid);
const priorityAllocation = model.allocateCardsDeterministically([firstCard, secondCard], priorityBatches, { [stileronUuid]: fixture.materialPlans[stileronUuid] });
assert.equal(priorityAllocation.cards[0].requirements[0].allocatedUnits, 15000);
assert.equal(priorityAllocation.cards[1].requirements[0].allocatedUnits, 0);
assert.ok(priorityAllocation.batchUsage[0].reservedUnits <= priorityAllocation.batchUsage[0].quantityUnits);

// Persistence and backup/restore keep the material plan; legacy backups default to RECIPE.
const userSettings = [{ key: "user:materialQualityPlans", scope: "USER", value: clone(fixture.materialPlans), updatedAt: "2026-08-29T12:30:00.000Z" }];
const userData = {
  userInventory: [],
  materialBatches: sufficientBatches,
  craftingCards: [card],
  miningLoadouts: [{ id: "loadout-c0123", materialUuid: stileronUuid, materialName: "Stileron", name: "C012.3", stations: [], gadgets: [], isDefault: true }],
  userSettings
};
const envelope = model.buildM4BackupEnvelope(userData, { applicationVersion: "V003-dev" });
const restored = model.validateAndMigrateM4Backup(JSON.stringify(envelope));
assert.deepEqual(JSON.parse(JSON.stringify(model.materialQualityPlansFromUserSettings(restored.backup.data.userSettings))), fixture.materialPlans);
assert.equal(restored.backup.data.craftingCards[0].quantity, 3);
assert.equal(restored.backup.data.craftingCards[0].order, 0);
assert.equal(restored.backup.data.craftingCards[0].collapsed, false);
assert.equal(restored.backup.data.materialBatches.length, sufficientBatches.length);
assert.equal(restored.backup.data.miningLoadouts[0].id, "loadout-c0123");
const schema1 = model.validateAndMigrateM4Backup({ format: envelope.format, schemaVersion: 1, data: { userInventory: [], materialBatches: [], craftingCards: [], userLoadouts: [] } });
assert.deepEqual(JSON.parse(JSON.stringify(model.materialQualityPlansFromUserSettings(schema1.backup.data.userSettings))), {});

// Standalone uses the same computed constraint and carries no runtime dependency.
const standaloneSnapshot = model.buildStandaloneSnapshot({
  appName: "sPg Crafting List",
  generatedAt: "2026-08-29T12:30:00.000Z",
  scDataVersion: fixture.scVersion,
  card,
  cardResult: sufficientAllocation.cards[0],
  blueprint: normalized,
  trace: sufficientAllocation.trace,
  materialQualityPlans: clone(fixture.materialPlans)
});
const standaloneHtml = model.renderStandaloneHtml(standaloneSnapshot, appCss);
const standaloneStileron = standaloneSnapshot.requirements.find((entry) => entry.materialUuid === stileronUuid);
assert.equal(standaloneStileron.rule, model.rules.TARGET_Q);
assert.equal(standaloneStileron.baselineRule, model.rules.FIXED);
assert.equal(standaloneStileron.effectiveQualityLabel, "Q800+");
assert.match(standaloneHtml, /Q800\+/);
assert.match(standaloneHtml, /Recipe: Bármely Q \/ FIXED/);
assert.match(standaloneHtml, /Saját anyagcél: Q800\+/);
assert.doesNotMatch(standaloneHtml, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);
assert.doesNotMatch(standaloneHtml, /\bfetch\s*\(/);
assertSingleFileRuntimeMarkup(appHtml);

fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(standalonePath, standaloneHtml, "utf8");
const evidence = {
  cycle: "V003-C012.3",
  status: "PASS",
  activeScVersion: fixture.scVersion,
  blueprint: normalized.outputName,
  recipeSemantics: { Stileron: "FIXED", Ouratite: "FIXED" },
  targetQ800LowOnly: {
    stileronQ747Eligible: false,
    stileronReservedUnits: lowStileron.allocatedUnits,
    stileronMissingAmountUnits: lowStileron.missingAmountUnits,
    stileronMissingQualityUnits: lowStileron.missingQualityUnits,
    ouratiteQ860ReservedUnits: lowOuratite.allocatedUnits,
    cardSatisfied: lowAllocation.cards[0].satisfied,
    maxCraftable: lowAllocation.cards[0].maxCraftable
  },
  targetQ800WithQ850: {
    stileronAllocatedQualities: Array.from(sufficientStileron.allocatedBatches, (entry) => entry.quality),
    cardSatisfied: sufficientAllocation.cards[0].satisfied,
    maxCraftable: sufficientAllocation.cards[0].maxCraftable
  },
  highestQ: {
    stileronAllocatedQualities: Array.from(highestStileron.allocatedBatches, (entry) => entry.quality)
  },
  parity: {
    combinedLabel: lowStileronCombined.qualityBuckets[0].label,
    finalCardLabel: lowFinalStileron.effectiveQualityLabel,
    standaloneLabel: standaloneStileron.effectiveQualityLabel
  },
  backupRestore: "PASS",
  priorityAndNoDoubleCount: "PASS",
  standalone: {
    path: path.relative(projectDirectory, standalonePath).replaceAll("\\", "/"),
    bytes: Buffer.byteLength(standaloneHtml, "utf8"),
    sha256: crypto.createHash("sha256").update(standaloneHtml).digest("hex"),
    externalRuntimeAssets: 0,
    runtimeFetch: 0
  }
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

console.log("V003_C0123_USER_MATERIAL_CONSTRAINT_TEST_PASS");
console.log(JSON.stringify(evidence, null, 2));
