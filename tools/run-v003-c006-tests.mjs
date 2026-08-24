import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const htmlPath = path.join(projectDirectory, "sPg Crafting List.html");
const htmlSource = fs.readFileSync(htmlPath, "utf8");
const cssSource = extractEmbeddedApplicationCss(htmlSource);
const block = (name) => {
  const match = htmlSource.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};

const context = vm.createContext({
  console,
  nowIso: () => "2026-08-24T21:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("C006_HYDRATION_MODEL")}
${block("M6_STANDALONE_EXPORT_MODEL")}
globalThis.__C006__ = {
  normalizeBlueprint,
  allocateCardsDeterministically,
  hydrateMaterialIntelligenceRecords,
  buildFinalCraftingCardViewModel,
  renderStandalone: m6RenderStandaloneHtml
};`, context, { filename: "spg-v003-c006-model.js" });
const model = context.__C006__;

const rawBlueprint = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "js-300-blueprint.json"), "utf8"));
const blueprint = model.normalizeBlueprint(rawBlueprint, {
  gameVersion: rawBlueprint.game_version,
  dataSource: "Star Citizen Wiki API",
  source: "fixture",
  fetchedAt: "2026-08-24T20:59:00.000Z",
  origin: "FIXTURE"
});
const card = {
  id: "c006-js300",
  order: 0,
  active: true,
  quantity: 2,
  blueprintUuid: blueprint.uuid,
  outputUuid: blueprint.outputUuid,
  outputName: blueprint.outputName,
  outputType: blueprint.outputType,
  outputTypeLabel: blueprint.outputTypeLabel,
  craftTimeSeconds: blueprint.craftTimeSeconds,
  isAvailableByDefault: blueprint.isAvailableByDefault,
  gameVersion: blueprint.gameVersion,
  requirements: blueprint.recipeSlots.map((requirement) => ({
    id: requirement.id,
    aspectIndex: requirement.aspectIndex,
    recipeSlotName: requirement.recipeSlotName,
    ingredientUuid: requirement.ingredientUuid,
    commodityUuid: requirement.ingredient.commodityUuid,
    materialName: requirement.materialName,
    requiredQuantityUnits: requirement.requiredQuantityUnits,
    unit: requirement.unit,
    qualityCapability: requirement.qualityCapability,
    affectedStats: requirement.affectedStats.map((stat) => ({ label: stat.label, key: stat.key }))
  })),
  slotStrategies: {}
};
const [stileron, beryl, savrilium] = card.requirements;
const batches = [
  { id: "stileron-q480", materialUuid: stileron.ingredientUuid, materialName: "Stileron", unit: "SCU", quality: 480, quantityUnits: 1000, createdAt: "1" },
  { id: "stileron-q517", materialUuid: stileron.ingredientUuid, materialName: "Stileron", unit: "SCU", quality: 517, quantityUnits: 10500, createdAt: "2" },
  { id: "beryl-fixed", materialUuid: beryl.ingredientUuid, materialName: "Beryl", unit: "SCU", quality: 100, quantityUnits: 4200, createdAt: "3" },
  { id: "savrilium-fixed", materialUuid: savrilium.ingredientUuid, materialName: "Savrilium", unit: "SCU", quality: null, quantityUnits: 7200, createdAt: "4" }
];

const intel = (requirement, radarDisplay, refineryStatus) => ({
  commodityUuid: requirement.commodityUuid,
  commodityName: requirement.materialName,
  mining: {
    status: "AVAILABLE",
    radarSignatureDisplay: radarDisplay,
    methods: ["SHIP_MINING"],
    systems: [{
      system: "Pyro",
      status: "AVAILABLE",
      methods: [{
        category: "SPACE",
        recommendationLabel: "1. hely · Űrbeli farmhely",
        method: "SHIP_MINING",
        tierDisplayLabel: `${requirement.materialName} fresh-cache farmhely`,
        tierMemberSummary: "Automatikusan hidratált fixture",
        spawn: 10,
        occurrence: 2,
        qualityProfile: { ranges: [{ min: 501, max: 1000 }], highQualityValues: [517, 1000], reachableMaximum: 1000 }
      }]
    }]
  },
  refinery: refineryStatus === "AVAILABLE"
    ? { status: "AVAILABLE", systems: [{ starSystemName: "Stanton", rankingValue: 4, tieCount: 1, terminals: [{ terminalName: "Fixture Refinery" }] }] }
    : { status: "MAPPING_UNRESOLVED", mapping: { status: "UNMAPPED" }, systems: [] },
  loadouts: []
});
const intelligenceByCommodity = new Map([
  [stileron.commodityUuid, intel(stileron, "3185–6370 (1–2× cluster)", "MAPPING_UNRESOLVED")],
  [beryl.commodityUuid, intel(beryl, "3540–14160 (1–4× cluster)", "AVAILABLE")],
  [savrilium.commodityUuid, intel(savrilium, "3200–6400 (1–2× cluster)", "AVAILABLE")]
]);

const allocation = model.allocateCardsDeterministically([card], batches);
const cardResult = allocation.cards[0];
cardResult.requirements.forEach((requirement) => {
  const sourceRequirement = card.requirements.find((candidate) => candidate.id === requirement.recipeSlotId);
  requirement.commodityUuid = sourceRequirement.commodityUuid;
  requirement.materialIntelligence = intelligenceByCommodity.get(sourceRequirement.commodityUuid);
});
const viewModel = model.buildFinalCraftingCardViewModel({
  appName: "sPg Crafting List",
  generatedAt: "2026-08-24T21:00:00.000Z",
  scDataVersion: blueprint.gameVersion,
  card,
  cardResult,
  blueprint,
  outputPresentation: { size: 1, classLabel: "Military", typeLabel: "Power Plant", subTypeLabel: "Power", gradeLabel: "A" },
  trace: allocation.trace
});

// Final card header, quantity, max craftable and deterministic slot projections.
assert.deepEqual(
  [viewModel.card.outputName, viewModel.card.outputSize, viewModel.card.outputClass, viewModel.card.outputType, viewModel.card.outputGrade, viewModel.card.craftTimeSeconds],
  ["JS-300", "1", "Military", "Power Plant", "A", 900]
);
assert.equal(viewModel.card.requestedQuantity, 2);
assert.equal(viewModel.card.maxCraftable, 3);
assert.equal(viewModel.requirements.length, 3);
assert.equal(viewModel.requirements[0].rule, "HP_MIN_500");
assert.equal(viewModel.requirements[0].suitableInventoryUnits, 10500, "A Q480 batch nem számíthat megfelelő HP_MIN_500 készletnek.");
assert.equal(viewModel.requirements[1].rule, "FIXED");
assert.equal(viewModel.requirements[2].rule, "FIXED");
assert.ok(viewModel.requirements.every((requirement) => requirement.shortageUnits === 0));
assert.ok(viewModel.requirements.every((requirement) => requirement.remainingUnits > 0));

// Quantity 1 -> multiple, enough, partial and missing inventory all use the unchanged Allocation Engine.
const quantityOneCard = structuredClone(card);
quantityOneCard.quantity = 1;
const quantityOne = model.allocateCardsDeterministically([quantityOneCard], batches).cards[0];
assert.equal(quantityOne.maxCraftable, 3);
assert.ok(quantityOne.requirements.every((requirement) => requirement.satisfied));
const partialBatches = batches.map((batch) => batch.id === "stileron-q517" ? { ...batch, quantityUnits: 5000 } : batch);
const partial = model.allocateCardsDeterministically([card], partialBatches).cards[0];
assert.equal(partial.maxCraftable, 1);
const partialStileron = partial.requirements.find((requirement) => requirement.recipeSlotId === stileron.id);
assert.equal(partialStileron.missingAmountUnits, 1000);
assert.equal(partialStileron.missingQualityUnits, 1000);
const empty = model.allocateCardsDeterministically([card], []).cards[0];
assert.equal(empty.maxCraftable, 0);
assert.ok(empty.requirements.every((requirement) => requirement.missingAmountUnits > 0));

// Reload/determinism: identical input produces a byte-identical final card view-model after generatedAt is fixed.
const allocationReload = model.allocateCardsDeterministically([structuredClone(card)], structuredClone(batches));
allocationReload.cards[0].requirements.forEach((requirement) => {
  const sourceRequirement = card.requirements.find((candidate) => candidate.id === requirement.recipeSlotId);
  requirement.commodityUuid = sourceRequirement.commodityUuid;
  requirement.materialIntelligence = intelligenceByCommodity.get(sourceRequirement.commodityUuid);
});
const reloadViewModel = model.buildFinalCraftingCardViewModel({
  appName: "sPg Crafting List",
  generatedAt: "2026-08-24T21:00:00.000Z",
  scDataVersion: blueprint.gameVersion,
  card: structuredClone(card),
  cardResult: allocationReload.cards[0],
  blueprint,
  outputPresentation: { size: 1, classLabel: "Military", typeLabel: "Power Plant", subTypeLabel: "Power", gradeLabel: "A" },
  trace: allocationReload.trace
});
assert.deepEqual(JSON.parse(JSON.stringify(reloadViewModel)), JSON.parse(JSON.stringify(viewModel)));

// Fresh-cache-equivalent complete snapshot: all three materials have Radar + mining, mapped ones refinery, Stileron explicit safe limitation.
for (const requirement of viewModel.requirements) {
  assert.equal(requirement.mining.status, "AVAILABLE");
  assert.ok(requirement.mining.radarSignatureDisplay);
  assert.ok(requirement.mining.systems[0].methods.length > 0);
}
assert.equal(viewModel.requirements[0].refineryStatusText, "Nincs biztonságos UEX refinery adat");
const exported = model.renderStandalone(viewModel, cssSource);
for (const marker of [
  "Stileron fresh-cache farmhely",
  "Beryl fresh-cache farmhely",
  "Savrilium fresh-cache farmhely",
  "3185–6370 (1–2× cluster)",
  "3540–14160 (1–4× cluster)",
  "3200–6400 (1–2× cluster)",
  "Nincs biztonságos UEX refinery adat",
  'data-material-name="Stileron"',
  'data-detail-kind="mining"',
  "Military",
  "Grade"
]) {
  assert.ok(exported.includes(marker), `A C006 standalone exportból hiányzik: ${marker}`);
}
assert.ok(!exported.includes("Allocation log"));
assert.ok(!exported.includes("Blueprint UUID:</strong>"));
assert.ok(!exported.includes("Export schema:</strong>"));
assert.doesNotMatch(exported, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);
assert.ok(exported.includes("Ship Mining"));
assert.ok(!exported.includes(">SHIP_MINING<"));

// Offline hydration is explicit and deterministic: cached detail remains available, uncached detail stays unavailable without a network attempt.
let offlineResolverCalls = 0;
const offlineCached = await model.hydrateMaterialIntelligenceRecords({
  commodityUuids: [stileron.commodityUuid, stileron.commodityUuid],
  allowNetwork: false,
  resolve: async (_uuid, options) => {
    offlineResolverCalls += 1;
    assert.equal(options.allowNetwork, false);
    return { normalized: { uuid: stileron.commodityUuid }, origin: "CACHE_NORMALIZED" };
  }
});
assert.equal(offlineResolverCalls, 1);
assert.deepEqual(JSON.parse(JSON.stringify(offlineCached)), {
  requested: 1,
  cacheHits: 1,
  apiLoaded: 0,
  unavailable: 0,
  details: [{ commodityUuid: stileron.commodityUuid, status: "AVAILABLE", origin: "CACHE_NORMALIZED" }]
});
const offlineUncached = await model.hydrateMaterialIntelligenceRecords({
  commodityUuids: [beryl.commodityUuid],
  allowNetwork: false,
  resolve: async (_uuid, options) => {
    assert.equal(options.allowNetwork, false);
    return { normalized: null, origin: "OFFLINE_NO_CACHE" };
  }
});
assert.equal(offlineUncached.unavailable, 1);
assert.equal(offlineUncached.details[0].status, "UNAVAILABLE_OFFLINE");
const onlineFailure = await model.hydrateMaterialIntelligenceRecords({
  commodityUuids: [savrilium.commodityUuid],
  allowNetwork: true,
  resolve: async () => { throw new Error("fixture network failure"); }
});
assert.equal(onlineFailure.details[0].status, "UNAVAILABLE");
assert.equal(onlineFailure.details[0].origin, "API_FAILED");

// The runtime hydration path is shared by create/open/export and does not contain a second ranking/name algorithm.
for (const marker of [
  "async function ensureMaterialIntelligenceHydrated",
  "resolve: resolveMiningCommodityDetailRecord",
  "await refreshMaterialIntelligenceSnapshots(\"CARD_MATERIAL_INTELLIGENCE_READY\")",
  "ensureCraftingOutputPresentationHydrated",
  "ensureMaterialIntelligenceHydrated([card])",
  "outputPresentation: state.craftingOutputPresentationByUuid.get(card.outputUuid) || null"
]) {
  assert.ok(htmlSource.includes(marker), `Hiányzó C006 hydration marker: ${marker}`);
}
const ensureSource = htmlSource.match(/async function ensureMaterialIntelligenceHydrated[\s\S]*?\n    }\n\n    async function ensureCraftingOutputPresentationHydrated/)?.[0] || "";
assert.ok(block("C006_HYDRATION_MODEL").includes("UNAVAILABLE_OFFLINE"));
assert.ok(!ensureSource.includes("buildMiningFarmRecommendations("), "A hydration nem tartalmazhat külön ranking implementációt.");
assert.ok(!ensureSource.toLowerCase().includes("fuzzy"));

console.log("V003_C006_FINAL_CARD_TEST_PASS");
console.log(JSON.stringify({
  mandatoryCases: 12,
  output: viewModel.card.outputName,
  requestedQuantity: viewModel.card.requestedQuantity,
  maxCraftable: viewModel.card.maxCraftable,
  materialSnapshots: viewModel.requirements.map((requirement) => ({
    material: requirement.materialName,
    radar: requirement.mining.radarSignatureDisplay,
    mining: requirement.mining.status,
    refinery: requirement.refinery.status
  })),
  standaloneBytes: Buffer.byteLength(exported),
  externalRuntimeResources: 0
}, null, 2));
