import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const htmlSource = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const cssSource = fs.readFileSync(path.join(projectDirectory, "Info", "style.css"), "utf8");
const block = (name) => {
  const match = htmlSource.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-22T14:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M6_STANDALONE_EXPORT_MODEL")}
globalThis.__M6__ = {
  normalizeBlueprint,
  buildSnapshot: m6BuildStandaloneSnapshot,
  renderHtml: m6RenderStandaloneHtml,
  formatUnits: m6FormatUnits,
  qualityLabel: m6QualityRuleLabel
};`, context, { filename: "spg-m6-model.js" });
const m6 = context.__M6__;
const rawBlueprint = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "js-300-blueprint.json"), "utf8"));
const blueprint = m6.normalizeBlueprint(rawBlueprint, {
  gameVersion: rawBlueprint.game_version,
  dataSource: "Star Citizen Wiki API",
  source: "fixture",
  fetchedAt: "2026-08-22T13:00:00.000Z",
  origin: "FIXTURE"
});
const card = {
  id: "card-js300",
  order: 0,
  active: true,
  quantity: 2,
  blueprintUuid: blueprint.uuid,
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
    affectedStats: requirement.affectedStats.map((stat) => ({ label: stat.label }))
  }))
};
const intelligence = {
  commodityUuid: "commodity-stileron",
  refinerySnapshotFingerprint: "refinery-fingerprint",
  mining: {
    status: "AVAILABLE",
    radarSignature: 3185,
    methods: ["SHIP_MINING"],
    systems: [{
      system: "Pyro",
      status: "AVAILABLE",
      methods: [{ method: "SHIP_MINING", locationLabel: "Pyro II – Monox", occurrence: 0.3, spawn: 10, maximumQuality: 1000 }]
    }]
  },
  loadouts: [{
    id: "loadout-1",
    name: "Prospector Helix",
    default: true,
    vehicle: { uuid: "vehicle-1", name: "Prospector" },
    stations: [{ id: "station-1", head: { uuid: "head-1", name: "Helix I" }, modules: [{ id: "module-1", uuid: "module-1", name: "Rieger-C3" }] }],
    gadgets: [{ id: "gadget-1", uuid: "gadget-1", name: "OptiMax" }]
  }],
  refinery: {
    status: "AVAILABLE",
    systems: [{ starSystemName: "Stanton", rankingValue: 8, tieCount: 2, terminals: [{ terminalName: "MIC-L5" }, { terminalName: "HUR-L1" }] }]
  }
};
const cardResult = {
  cardId: card.id,
  order: 0,
  outputName: card.outputName,
  requestedQuantity: 2,
  maxCraftable: 3,
  bottleneckSlotIds: [card.requirements[2].id],
  satisfied: false,
  requirements: card.requirements.map((requirement, index) => ({
    recipeSlotId: requirement.id,
    ingredientUuid: requirement.ingredientUuid,
    commodityUuid: requirement.commodityUuid,
    materialName: requirement.materialName,
    unit: requirement.unit,
    rule: index === 0 ? "HP_MIN_500" : (index === 1 ? "FIXED" : "UNKNOWN"),
    targetQuality: null,
    requiredUnits: requirement.requiredQuantityUnits * 2,
    allocatedUnits: index === 2 ? 0 : requirement.requiredQuantityUnits * 2,
    allocatedBatches: index === 0 ? [{ batchId: "batch-q517", quality: 517, allocatedUnits: requirement.requiredQuantityUnits * 2, reason: "LOWEST_Q_AT_OR_ABOVE_500" }] : [],
    missingAmountUnits: 0,
    missingQualityUnits: index === 2 ? requirement.requiredQuantityUnits * 2 : 0,
    status: index === 2 ? "QUALITY_UNKNOWN" : "SATISFIED",
    bottleneck: index === 2,
    materialIntelligence: index === 0 ? intelligence : null
  }))
};
const trace = card.requirements.map((requirement, index) => ({
  cardId: card.id,
  recipeSlotId: requirement.id,
  available: [{ batchId: `batch-${index}`, quality: index === 0 ? 517 : null, unit: requirement.unit, availableUnitsAtSlot: requirement.requiredQuantityUnits * 3 }]
}));

const snapshot = m6.buildSnapshot({
  appName: "sPg Crafting List",
  generatedAt: "2026-08-22T14:00:00.000Z",
  scDataVersion: blueprint.gameVersion,
  card,
  cardResult,
  blueprint,
  trace
});
const offlineCss = cssSource.replace(/@import\s+url\([^;]+fonts\.googleapis\.com[^;]+;/gi, "") + "\nbody{font-family:Arial,Helvetica,sans-serif;}";
const exportedHtml = m6.renderHtml(snapshot, offlineCss);

// 1-4. Complete card, production, slot and Quality/allocation data.
assert.equal(snapshot.card.outputName, "JS-300");
assert.equal(snapshot.card.requestedQuantity, 2);
assert.equal(snapshot.card.maxCraftable, 3);
assert.equal(snapshot.requirements.length, 3);
assert.equal(snapshot.requirements[0].rule, "HP_MIN_500");
assert.equal(snapshot.requirements[0].allocatedBatches[0].quality, 517);
assert.equal(snapshot.requirements[2].bottleneck, true);
assert.equal(snapshot.requirements[2].missingQualityUnits, card.requirements[2].requiredQuantityUnits * 2);

// 5-7. Farm location, radar, default loadout and UEX refinery snapshot are embedded.
for (const marker of ["Pyro II – Monox", "3185", "Prospector Helix", "Prospector", "Helix I", "Rieger-C3", "OptiMax", "MIC-L5", "HUR-L1", "+8%"] ) {
  assert.ok(exportedHtml.includes(marker), `Az exportból hiányzik: ${marker}`);
}
assert.equal(snapshot.summary.locationCount, 1);
assert.equal(snapshot.summary.selectedLoadoutCount, 1);
assert.equal(snapshot.summary.refinerySystemCount, 1);

// 8-10. Standalone/offline guarantees and metadata.
assert.ok(exportedHtml.includes('data-spg-standalone-export="true"'));
assert.match(exportedHtml, /<style>[\s\S]+<\/style>/i);
assert.doesNotMatch(exportedHtml, /<link[^>]+stylesheet/i);
assert.doesNotMatch(exportedHtml, /@import[^;]+https?:/i);
assert.doesNotMatch(exportedHtml, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);
assert.doesNotMatch(exportedHtml, /\bfetch\s*\(/i);
for (const marker of ["Generated by:", "SC Data Version:", "Generated:", "Data Source:", blueprint.gameVersion, blueprint.uuid]) {
  assert.ok(exportedHtml.includes(marker), `Metaadat hiányzik: ${marker}`);
}

// 11. The non-executable JSON payload round-trips every exported decision.
const payloadMatch = exportedHtml.match(/<script type="application\/json" id="spg-export-snapshot">([\s\S]*?)<\/script>/);
assert.ok(payloadMatch);
const roundtrip = JSON.parse(payloadMatch[1]);
assert.deepEqual(roundtrip, JSON.parse(JSON.stringify(snapshot)));

// 12. Content is escaped, while unknown/missing data remains explicit instead of guessed.
const unsafeSnapshot = JSON.parse(JSON.stringify(snapshot));
unsafeSnapshot.card.outputName = '<img src="https://example.invalid/x" onerror="alert(1)">';
const escapedHtml = m6.renderHtml(unsafeSnapshot, offlineCss);
assert.ok(escapedHtml.includes("&lt;img"));
assert.doesNotMatch(escapedHtml, /<img\s/i);
assert.ok(exportedHtml.includes("UNKNOWN · nincs találgatás"));
assert.ok(exportedHtml.includes("Hiányzó / ellenőrizendő adatok"));

// 13. Every visible Crafting Card gets a card-specific export action.
for (const marker of ["dataset.exportCardId", "downloadStandaloneExport(card.id)", "buildStandaloneExport(cardId)", "M6_STANDALONE_EXPORT_MODEL_START"]) {
  assert.ok(htmlSource.includes(marker), `Kártyaexport marker hiányzik: ${marker}`);
}

// 14. Larger deterministic export fixture remains practical.
const largeSnapshot = JSON.parse(JSON.stringify(snapshot));
largeSnapshot.requirements = Array.from({ length: 120 }, (_, index) => ({
  ...snapshot.requirements[index % snapshot.requirements.length],
  recipeSlotId: `slot-${index}`,
  recipeSlotName: `Fixture Slot ${index}`,
  materialName: `Fixture Material ${index}`
}));
largeSnapshot.summary.ingredientCount = largeSnapshot.requirements.length;
const started = performance.now();
const largeHtml = m6.renderHtml(largeSnapshot, offlineCss);
const durationMs = performance.now() - started;
assert.ok(largeHtml.length > exportedHtml.length);
assert.ok(durationMs < 1000, `A 120 slotos export túl lassú: ${durationMs.toFixed(1)} ms`);

console.log("M6_STANDALONE_EXPORT_TEST_PASS");
console.log(JSON.stringify({
  mandatoryCases: 14,
  output: snapshot.card.outputName,
  recipeSlots: snapshot.requirements.length,
  locations: snapshot.summary.locationCount,
  loadouts: snapshot.summary.selectedLoadoutCount,
  refinerySystems: snapshot.summary.refinerySystemCount,
  exportBytes: Buffer.byteLength(exportedHtml),
  performance: { recipeSlots: largeSnapshot.requirements.length, durationMs: Number(durationMs.toFixed(2)) }
}, null, 2));
