import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const htmlSource = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const cssSource = extractEmbeddedApplicationCss(htmlSource);
const block = (name) => {
  const match = htmlSource.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};

const context = vm.createContext({
  console,
  nowIso: () => "2026-08-24T22:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
${block("C0125B_COMBINED_QUALITY_POOL_MODEL")}
${block("MATERIAL_COLOR_MODEL")}
${block("M6_STANDALONE_EXPORT_MODEL")}
globalThis.__C007__ = {
  normalizeBlueprint,
  allocateCardsDeterministically,
  registry: MATERIAL_COLOR_REGISTRY,
  registryVersion: MATERIAL_COLOR_REGISTRY_VERSION,
  sourceSha256: MATERIAL_COLOR_SOURCE_SHA256,
  resolveMaterialColor,
  auditMaterialColors,
  buildFinalCraftingCardViewModel,
  renderStandalone: m6RenderStandaloneHtml
};`, context, { filename: "spg-v003-c007-model.js" });
const model = context.__C007__;

assert.equal(model.registryVersion, "V003-C007-1");
assert.equal(model.sourceSha256, "f9c6e362a41bbbc28acbac984300d582a00bc4b79a7e9738f136e1da89cabdc6");
assert.equal(model.registry.length, 33);
assert.equal(new Set(model.registry.map((record) => record.uuid)).size, 33);

const expectedShipColors = new Map([
  ["Quantainium", "#ffaa33"], ["Stileron", "#ffaa33"], ["Savrilium", "#ffaa33"],
  ["Ouratite", "#cc66ff"], ["Riccite", "#cc66ff"], ["Lindinium", "#cc66ff"],
  ["Beryl", "#3399ff"], ["Taranite", "#3399ff"], ["Borase", "#3399ff"],
  ["Gold", "#3399ff"], ["Bexalite", "#3399ff"], ["Laranite", "#33ccaa"],
  ["Agricium", "#33ccaa"], ["Aluminum", "#8899aa"]
]);
for (const [name, foreground] of expectedShipColors) {
  const resolved = model.resolveMaterialColor(null, name);
  assert.equal(resolved.status, "VERIFIED_COLOR", `${name} színe nem VERIFIED_COLOR.`);
  assert.equal(resolved.foreground, foreground, `${name} source hue eltér.`);
  assert.equal(resolved.border, foreground, `${name} border hue eltér.`);
  assert.equal(resolved.matchOrigin, "EXACT_CANONICAL_NAME");
}
for (const name of ["Beradon", "Feynmaline", "Glacosite"]) {
  const resolved = model.resolveMaterialColor(null, name);
  assert.equal(resolved.foreground, "#66ddaa", `${name} ROC színe eltér.`);
  assert.equal(resolved.evidence, "VERIFIED_CATEGORY_ROW_WITH_EXACT_WIKI_UUID");
}
for (const name of ["Aphorite", "Dolivine", "Hadanite", "Janalite"]) {
  assert.equal(model.resolveMaterialColor(null, name).foreground, "#77bbdd", `${name} FPS színe eltér.`);
}
const unmapped = model.resolveMaterialColor("legacy-carinite", "Carinite");
assert.equal(unmapped.status, "UNMAPPED_COLOR");
assert.equal(unmapped.foreground, "#b7c2cc");
assert.equal(unmapped.matchOrigin, "NONE");
const oldCacheNameFallback = model.resolveMaterialColor({ uuid: "legacy-ingredient-uuid", materialName: "Stileron" });
assert.equal(oldCacheNameFallback.status, "VERIFIED_COLOR");
assert.equal(oldCacheNameFallback.matchOrigin, "EXACT_CANONICAL_NAME");
const exactUuid = model.resolveMaterialColor("eb503701-389a-48a1-af28-eb7374009d5d", "Wrong stale name");
assert.equal(exactUuid.canonicalName, "Beryl");
assert.equal(exactUuid.matchOrigin, "EXACT_WIKI_UUID");

const resolverSource = block("MATERIAL_COLOR_MODEL").match(/function resolveMaterialColor[\s\S]*?\n    }\n\n    function materialColorInlineStyle/)?.[0] || "";
for (const forbidden of ["rarity", "quality", "signature", "scmdb", "random", "miningcategory"]) {
  assert.ok(!resolverSource.toLowerCase().includes(forbidden), `Tiltott színkövetkeztetés a resolverben: ${forbidden}`);
}

const rawBlueprint = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "js-300-blueprint.json"), "utf8"));
const blueprint = model.normalizeBlueprint(rawBlueprint, {
  gameVersion: rawBlueprint.game_version,
  dataSource: "Star Citizen Wiki API",
  source: "fixture",
  fetchedAt: "2026-08-24T21:59:00.000Z",
  origin: "FIXTURE"
});
const card = {
  id: "c007-js300",
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
  { id: "stileron-q517", materialUuid: stileron.ingredientUuid, materialName: "Stileron", unit: "SCU", quality: 517, quantityUnits: 10500, createdAt: "1" },
  { id: "beryl-fixed", materialUuid: beryl.ingredientUuid, materialName: "Beryl", unit: "SCU", quality: 100, quantityUnits: 4200, createdAt: "2" },
  { id: "savrilium-fixed", materialUuid: savrilium.ingredientUuid, materialName: "Savrilium", unit: "SCU", quality: null, quantityUnits: 7200, createdAt: "3" }
];
const radarByName = new Map([["Stileron", "3185–6370 (1–2× cluster)"], ["Beryl", "3540–14160 (1–4× cluster)"], ["Savrilium", "3200–6400 (1–2× cluster)"]]);
const allocation = model.allocateCardsDeterministically([card], batches);
const cardResult = allocation.cards[0];
cardResult.requirements.forEach((requirement) => {
  const sourceRequirement = card.requirements.find((candidate) => candidate.id === requirement.recipeSlotId);
  requirement.commodityUuid = sourceRequirement.commodityUuid;
  requirement.materialIntelligence = {
    commodityUuid: sourceRequirement.commodityUuid,
    commodityName: sourceRequirement.materialName,
    mining: {
      status: "AVAILABLE",
      radarSignatureDisplay: radarByName.get(sourceRequirement.materialName),
      systems: [{ system: "Pyro", status: "AVAILABLE", methods: [{ recommendationLabel: "1. hely", method: "SHIP_MINING", tierDisplayLabel: "Fixture farmhely", spawn: 10, occurrence: 2, qualityProfile: { ranges: [], highQualityValues: [], reachableMaximum: null } }] }]
    },
    refinery: { status: "NO_REFINERY_DATA", systems: [] },
    loadouts: []
  };
});
const viewModel = model.buildFinalCraftingCardViewModel({
  appName: "sPg Crafting List",
  generatedAt: "2026-08-24T22:00:00.000Z",
  scDataVersion: blueprint.gameVersion,
  card,
  cardResult,
  blueprint,
  outputPresentation: { size: 1, classLabel: "Military", typeLabel: "Power Plant", subTypeLabel: "Power", gradeLabel: "A" },
  trace: allocation.trace
});
assert.equal(viewModel.card.requestedQuantity, 2);
assert.equal(viewModel.card.maxCraftable, 3);
assert.deepEqual(
  JSON.parse(JSON.stringify(viewModel.requirements.map((requirement) => ({
    name: requirement.materialName,
    foreground: requirement.materialColor.foreground,
    background: requirement.materialColor.background,
    border: requirement.materialColor.border,
    status: requirement.materialColor.status,
    radar: requirement.mining.radarSignatureDisplay
  })))),
  [
    { name: "Stileron", foreground: "#ffaa33", background: "rgba(255, 170, 51, 0.16)", border: "#ffaa33", status: "VERIFIED_COLOR", radar: "3185–6370 (1–2× cluster)" },
    { name: "Beryl", foreground: "#3399ff", background: "rgba(51, 153, 255, 0.16)", border: "#3399ff", status: "VERIFIED_COLOR", radar: "3540–14160 (1–4× cluster)" },
    { name: "Savrilium", foreground: "#ffaa33", background: "rgba(255, 170, 51, 0.16)", border: "#ffaa33", status: "VERIFIED_COLOR", radar: "3200–6400 (1–2× cluster)" }
  ]
);

const exported = model.renderStandalone(viewModel, cssSource);
for (const marker of [
  'data-material-name="Stileron"', 'data-material-name="Beryl"', 'data-material-name="Savrilium"',
  'data-material-color-status="VERIFIED_COLOR"', 'data-material-color-registry="V003-C007-1"',
  '--spg-material-foreground:#ffaa33', '--spg-material-foreground:#3399ff',
  'spg-material-color-token', 'spg-material-color-radar', 'id="spg-export-snapshot"'
]) {
  assert.ok(exported.includes(marker), `A C007 standalone exportból hiányzik: ${marker}`);
}
assert.doesNotMatch(exported, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);
assert.doesNotMatch(exported, /<img[^>]+Radar Signature\.png/i);
const snapshotJson = exported.match(/<script type="application\/json" id="spg-export-snapshot">([\s\S]*?)<\/script>/)?.[1];
assert.ok(snapshotJson);
const parsedSnapshot = JSON.parse(snapshotJson);
assert.equal(parsedSnapshot.requirements[1].materialColor.canonicalName, "Beryl");

for (const marker of [
  "function resolveMaterialColor", "applyMaterialColor(material, view.commodityUuid", "applyMaterialColor(name, group.materialUuid",
  "applyMaterialColor(title, record.uuid", "applyMaterialColor(radarCard, commodityUuid", "MATERIAL_COLOR_REGISTRY_VERSION"
]) {
  assert.ok(htmlSource.includes(marker), `Hiányzó közös color-consumer marker: ${marker}`);
}

const colorAuditFixture = [
  ...model.registry.map((record) => ({ uuid: record.uuid, canonicalName: record.canonicalName })),
  { uuid: "unmapped-carinite", canonicalName: "Carinite" }
];
const colorAudit = model.auditMaterialColors(colorAuditFixture);
assert.equal(colorAudit.verified, 33);
assert.equal(colorAudit.unmapped, 1);
assert.equal(colorAudit.unmappedRecords[0].status, "UNMAPPED_COLOR");

console.log("V003_C007_MATERIAL_COLOR_TEST_PASS");
console.log(JSON.stringify({
  registryVersion: model.registryVersion,
  registryRecords: model.registry.length,
  shipMaterialChecks: expectedShipColors.size,
  rocChecks: 3,
  fpsChecks: 4,
  unmappedFallback: "PASS",
  js300: viewModel.requirements.map((requirement) => ({ material: requirement.materialName, foreground: requirement.materialColor.foreground, background: requirement.materialColor.background })),
  requestedQuantity: viewModel.card.requestedQuantity,
  maxCraftable: viewModel.card.maxCraftable,
  standaloneBytes: Buffer.byteLength(exported),
  externalRuntimeResources: 0
}, null, 2));
