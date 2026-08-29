import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { performance } from "node:perf_hooks";
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
  nowIso: () => "2026-08-22T14:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("MATERIAL_COLOR_MODEL")}
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
    radarSignatureDisplay: "3185–6370 (1–2× cluster)",
    radarSignatureSource: "RADAR_SIGNATURE_REFERENCE_IMAGE",
    radarSignatureStatus: "VERIFIED",
    methods: ["SHIP_MINING"],
    systems: [{
      system: "Pyro",
      status: "AVAILABLE",
      methods: [{
        category: "SPACE",
        rankPosition: 1,
        rankingTier: 1,
        recommendationLabel: "1. hely · Űrbeli farmhely",
        decision: "BEST_SPACE",
        method: "SHIP_MINING",
        locationLabel: "Pyro Deep Space Asteroids",
        locationSummary: "Akiro Cluster, RAB és RMB helyszínek",
        tierDisplayLabel: "Pyro Deep Space Asteroids",
        tierMemberSummary: "Akiro Cluster, RAB és RMB helyszínek",
        radarSignature: 3185,
        radarSignatureDisplay: "3185–6370 (1–2× cluster)",
        locationNames: ["Akiro Cluster", "RAB-TUNG", "RMB-1-01", "RMB-2-01"],
        presentation: {
          schemaVersion: 1,
          groupLabel: "Pyro Deep Space Asteroids",
          memberSummary: "Akiro Cluster, RAB és RMB helyszínek",
          rawLocationNames: ["Akiro Cluster", "RAB-TUNG", "RMB-1-01", "RMB-2-01"]
        },
        occurrence: 0.3,
        spawn: 10,
        maximumQuality: 1000,
        qualityProfile: {
          ranges: [{ min: 501, max: 1000 }],
          highQualityValues: [588, 667, 796, 852, 943, 971, 1000],
          reachableMinimum: 588,
          reachableMaximum: 1000
        }
      }, {
        category: "SPACE",
        rankPosition: 2,
        rankingTier: 2,
        recommendationLabel: "2. hely · Űrbeli farmhely",
        decision: "RANKED_SPACE",
        method: "SHIP_MINING",
        locationLabel: "Lagrange A",
        locationSummary: "CRU-L1 · HUR-L1",
        tierDisplayLabel: "Lagrange A",
        tierMemberSummary: "CRU-L1 · HUR-L1",
        radarSignature: 3185,
        radarSignatureDisplay: "3185–6370 (1–2× cluster)",
        occurrence: 0.2,
        spawn: 8,
        maximumQuality: 929,
        qualityProfile: { ranges: [{ min: 501, max: 929 }], highQualityValues: [674, 803, 881, 929], reachableMinimum: 674, reachableMaximum: 929 }
      }, {
        category: "SPACE",
        rankPosition: 3,
        rankingTier: 3,
        recommendationLabel: "3. hely · Űrbeli farmhely",
        decision: "RANKED_SPACE",
        method: "SHIP_MINING",
        locationLabel: "Lagrange B",
        locationSummary: "ARC-L5",
        tierDisplayLabel: "Lagrange B",
        tierMemberSummary: "ARC-L5",
        radarSignature: 3185,
        radarSignatureDisplay: "3185–6370 (1–2× cluster)",
        occurrence: 0.1,
        spawn: 7,
        maximumQuality: 881,
        qualityProfile: { ranges: [{ min: 501, max: 881 }], highQualityValues: [674, 803, 881], reachableMinimum: 674, reachableMaximum: 881 }
      }]
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
const artifactArgument = process.argv.find((argument) => argument.startsWith("--artifact="));

// 1-4. Complete card, production, slot and Quality/allocation data.
assert.equal(snapshot.card.outputName, "JS-300");
assert.equal(snapshot.card.requestedQuantity, 2);
assert.equal(snapshot.card.maxCraftable, 3);
assert.equal(snapshot.requirements.length, 3);
assert.equal(snapshot.requirements[0].rule, "HP_MIN_500");
assert.equal(snapshot.requirements[0].allocatedBatches[0].quality, 517);
assert.equal(snapshot.requirements[2].bottleneck, true);
assert.equal(snapshot.requirements[2].missingQualityUnits, card.requirements[2].requiredQuantityUnits * 2);

// V003-C003. The export snapshot consumes the shared material display-name resolver.
const dirtyNameCard = structuredClone(card);
dirtyNameCard.requirements[0].ingredientUuid = "fc1ec740-3047-48d8-81f0-396f4c9a90ef";
dirtyNameCard.requirements[0].materialName = "Agricium (Ore) (UnrefinedOres)";
const dirtyNameSnapshot = m6.buildSnapshot({
  appName: "sPg Crafting List",
  generatedAt: "2026-08-22T14:00:00.000Z",
  scDataVersion: blueprint.gameVersion,
  card: dirtyNameCard,
  cardResult,
  blueprint,
  trace
});
const dirtyNameHtml = m6.renderHtml(dirtyNameSnapshot, offlineCss);
assert.equal(dirtyNameSnapshot.requirements[0].materialName, "Agricium");
assert.ok(dirtyNameHtml.includes("Agricium"));
assert.ok(!dirtyNameHtml.includes("Agricium (Ore) (UnrefinedOres)"));

// 5-7. Farm location, radar, default loadout and UEX refinery snapshot are embedded.
for (const marker of ["Pyro Deep Space Asteroids", "Akiro Cluster, RAB és RMB helyszínek", "1. hely · Űrbeli farmhely", "2. hely · Űrbeli farmhely", "3. hely · Űrbeli farmhely", "Lagrange A", "Lagrange B", "3185–6370 (1–2× cluster)", "Prospector Helix", "Prospector", "Helix I", "Rieger-C3", "OptiMax", "MIC-L5", "HUR-L1", "+8%"] ) {
  assert.ok(exportedHtml.includes(marker), `Az exportból hiányzik: ${marker}`);
}
const renderedFarmCard = exportedHtml.match(/<article class="spg-export-location-card">[\s\S]*?<\/article>/)?.[0] || "";
assert.equal(renderedFarmCard.includes("RMB-1-01"), false, "Az export normál nézetében nem jelenhet meg a technikai RMB névfal.");
assert.equal(snapshot.summary.locationCount, 3);
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
assert.ok(exportedHtml.includes("<strong>Quality:</strong> Q?"));
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

let automatedExportArtifact = null;
if (artifactArgument) {
  const requestedPath = artifactArgument.slice("--artifact=".length).trim();
  assert.ok(requestedPath, "Az --artifact útvonal nem lehet üres.");
  const artifactPath = path.resolve(projectDirectory, requestedPath);
  const artifactHtml = exportedHtml.replace(/[ \t]+$/gm, "");
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, artifactHtml, "utf8");
  const persistedHtml = fs.readFileSync(artifactPath, "utf8");
  assert.equal(persistedHtml, artifactHtml, "A kiírt standalone artifact eltér a validált, trailing-whitespace-normalizált exporttól.");
  automatedExportArtifact = {
    path: path.relative(projectDirectory, artifactPath),
    bytes: Buffer.byteLength(persistedHtml),
    sha256: crypto.createHash("sha256").update(persistedHtml).digest("hex")
  };
}

console.log("M6_STANDALONE_EXPORT_TEST_PASS");
console.log(JSON.stringify({
  mandatoryCases: 14,
  output: snapshot.card.outputName,
  recipeSlots: snapshot.requirements.length,
  locations: snapshot.summary.locationCount,
  loadouts: snapshot.summary.selectedLoadoutCount,
  refinerySystems: snapshot.summary.refinerySystemCount,
  exportBytes: Buffer.byteLength(exportedHtml),
  automatedExportArtifact,
  performance: { recipeSlots: largeSnapshot.requirements.length, durationMs: Number(durationMs.toFixed(2)) }
}, null, 2));
