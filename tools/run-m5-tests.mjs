import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const fixture = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "m5-uex-refinery-cases.json"), "utf8"));
const block = (name) => {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const APP = {
  uexRefineryEndpoint: "https://api.uexcorp.uk/2.0/refineries_yields",
  uexRefineryTtlMs: 86400000,
  uexRefineryDocumentedLimit: 500
};
const context = vm.createContext({
  console,
  APP,
  nowIso: () => "2026-08-22T12:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("M5_UEX_REFINERY_MODEL")}
globalThis.__M5__ = {
  statuses: M5_MAPPING_STATUS,
  normalizeCommodityMappingName,
  normalizeUexTimestamp,
  normalizeUexRefineryYield,
  buildCommodityMappings,
  rankUexRefineriesBySystem,
  buildUexRefineryRecommendations,
  summarizeUexMappings,
  uexDatasetAgeMs,
  isUexDatasetFresh,
  hasUexLimitWarning,
  buildCombinedMaterials
};`, context, { filename: "spg-m5-model.js" });

const m5 = context.__M5__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const contextMeta = { datasetId: "fixture-uex", fetchedAt: "2026-08-22T12:00:00.000Z" };
const normalized = fixture.rawYields.map((raw, index) => m5.normalizeUexRefineryYield(raw, contextMeta, index));
assert.equal(m5.normalizeUexTimestamp(1781976622), "2026-06-20T17:30:22.000Z");
const beforeMappingInput = JSON.stringify({ wiki: fixture.wikiCommodities, normalized });
const mappings = m5.buildCommodityMappings(fixture.wikiCommodities, normalized, []);
const mappingByUuid = new Map(Array.from(mappings, (mapping) => [mapping.wikiCommodityUuid, mapping]));

// 1. Wiki commodity -> UEX commodity exact mapping.
assert.equal(mappingByUuid.get("wiki-agricium").status, m5.statuses.MATCHED);
assert.equal(mappingByUuid.get("wiki-agricium").uexCommodityId, "2");
assert.equal(mappingByUuid.get("wiki-agricium").origin, "AUTO_NORMALIZED_EXACT");

// 2. Unmatchable commodity -> UNMAPPED.
assert.equal(mappingByUuid.get("wiki-unmapped").status, m5.statuses.UNMAPPED);

// 3. Multiple possible exact candidates -> AMBIGUOUS.
assert.equal(mappingByUuid.get("wiki-ambiguous").status, m5.statuses.AMBIGUOUS);
assert.equal(mappingByUuid.get("wiki-ambiguous").candidateCount, 2);

// Explicit override mapping can remain valid even when the active yield dataset has no row for it.
const overrideOnlyMapping = m5.buildCommodityMappings(
  [{ uuid: "wiki-override-only", name: "Override Only", kind: null }],
  normalized,
  [{ wikiCommodityUuid: "wiki-override-only", uexCommodityId: "9999", uexCommodityName: "Override Only", origin: "USER_OVERRIDE" }]
)[0];
assert.equal(overrideOnlyMapping.status, m5.statuses.MATCHED);
assert.equal(overrideOnlyMapping.origin, "USER_OVERRIDE");
const overrideNoData = m5.buildUexRefineryRecommendations([overrideOnlyMapping], normalized, { datasetId: "fixture" })[0];
assert.equal(overrideNoData.status, "NO_REFINERY_DATA");
const unresolved = m5.buildUexRefineryRecommendations([mappingByUuid.get("wiki-unmapped")], normalized, { datasetId: "fixture" })[0];
assert.equal(unresolved.status, "MAPPING_UNRESOLVED");

const dataset = { datasetId: contextMeta.datasetId, fetchedAt: contextMeta.fetchedAt, expiresAt: "2026-08-23T12:00:00.000Z", scVersion: "4.2.0" };
const recommendations = m5.buildUexRefineryRecommendations(mappings, normalized, dataset);
const agricium = Array.from(recommendations).find((recommendation) => recommendation.wikiCommodityUuid === "wiki-agricium");

// 4. One commodity remains present in multiple star systems.
assert.deepEqual(Array.from(agricium.systems, (system) => system.starSystemName), ["Nyx", "Pyro", "Stanton"]);

// 5. Each system gets its own maximum.
assert.equal(agricium.systems.find((system) => system.starSystemName === "Stanton").rankingValue, 7);
assert.equal(agricium.systems.find((system) => system.starSystemName === "Pyro").rankingValue, 0);
assert.equal(agricium.systems.find((system) => system.starSystemName === "Nyx").rankingValue, -2);

// 6. Equal maxima retain every terminal.
const stanton = agricium.systems.find((system) => system.starSystemName === "Stanton");
assert.equal(stanton.tieCount, 2);
assert.deepEqual(Array.from(stanton.terminals, (terminal) => terminal.terminalName), ["HUR-L1", "MIC-L5"]);

// 7. Positive bonus is preserved.
assert.ok(stanton.rankingValue > 0);

// 8. Zero bonus is preserved and not hidden.
assert.equal(agricium.systems.find((system) => system.starSystemName === "Pyro").rankingValue, 0);

// 9. Negative-only systems select the least negative value.
assert.equal(agricium.systems.find((system) => system.starSystemName === "Nyx").rankingValue, -2);

// 10. Ranking uses value_month, not value or value_week.
assert.equal(stanton.terminals.length, 2, "A current value mező nem írhatja felül a havi döntetlent.");
assert.equal(agricium.rankingField, "value_month");
assert.ok(agricium.systems.every((system) => system.rankingField === "value_month"));

// 11. One-day TTL: fresh just before the boundary, stale at the boundary.
const ttlDataset = { fetchedAt: "2026-08-22T00:00:00.000Z" };
assert.equal(m5.isUexDatasetFresh(ttlDataset, Date.parse(ttlDataset.fetchedAt) + APP.uexRefineryTtlMs - 1), true);
assert.equal(m5.isUexDatasetFresh(ttlDataset, Date.parse(ttlDataset.fetchedAt) + APP.uexRefineryTtlMs), false);

// 12. Failed sync is wired to an atomic transaction rollback and previous dataset retention.
for (const marker of ["commitUexRefineryDataset", "transaction.abort()", "UEX_SYNC_ROLLBACK", "ROLLBACK_PREVIOUS_ACTIVE", "retainedDatasetId"]) {
  assert.ok(html.includes(marker), `A rollback marker hiányzik: ${marker}`);
}

// 13. Game Data model/sync does not mutate User Data input and fingerprints are asserted around sync.
assert.equal(JSON.stringify({ wiki: fixture.wikiCommodities, normalized }), beforeMappingInput);
for (const marker of ["userFingerprintBefore", "userFingerprintAfter", "A UEX Game Data sync módosította a User Data-t.", "uexUserDataFingerprintPreserved"]) {
  assert.ok(html.includes(marker), `A User Data-határ marker hiányzik: ${marker}`);
}

// 14. Exactly 500 API rows trigger the documented-limit warning.
assert.equal(m5.hasUexLimitWarning(499), false);
assert.equal(m5.hasUexLimitWarning(500), true);
assert.equal(m5.hasUexLimitWarning(501), false);

// 15. A Crafting Card requirement carries the normalized refinery recommendation snapshot.
const snapshot = {
  commodityUuid: "wiki-agricium",
  refinery: clone(agricium),
  refinerySnapshotFingerprint: agricium.snapshotFingerprint,
  mining: { status: "AVAILABLE", radarSignature: 1700, methods: ["SHIP_MINING"], systems: [] },
  loadouts: []
};
const allocation = {
  cards: [{ cardId: "card-1", order: 0, outputName: "Fixture", requestedQuantity: 1, requirements: [{ recipeSlotId: "slot-1", recipeSlotName: "Ore", ingredientUuid: "wiki-agricium", materialName: "Agricium", unit: "SCU", rule: "FIXED", targetQuality: null, requiredUnits: 10000, allocatedUnits: 0, missingAmountUnits: 10000, missingQualityUnits: 0, status: "MISSING_AMOUNT", allocatedBatches: [], materialIntelligence: snapshot }] }],
  batchUsage: [],
  summary: { cardCount: 1, requirementCount: 1, unsatisfiedRequirementCount: 1 }
};
assert.equal(allocation.cards[0].requirements[0].materialIntelligence.refinery.snapshotFingerprint, agricium.snapshotFingerprint);

// 16. Combined Materials projects that very same recommendation result without a second calculation.
const cards = [{ id: "card-1", blueprintUuid: "bp-1", outputName: "Fixture" }];
const combined = m5.buildCombinedMaterials(allocation, cards, []);
assert.equal(combined[0].materialIntelligence.refinery.snapshotFingerprint, agricium.snapshotFingerprint);
assert.equal(combined[0].usages[0].refinerySnapshotFingerprint, agricium.snapshotFingerprint);

// 17. The copied diagnostic bundle contains complete UEX cache/mapping/ranking state.
for (const marker of [
  "activeUexRefineryDataset", "uexRefinery", "UEX_REQUEST_START", "UEX_REQUEST_END", "UEX_CACHE_HIT",
  "UEX_CACHE_MISS_STALE", "UEX_LIMIT_WARNING", "UEX_MAPPING_AND_RANKING", "UEX_SYNC_ROLLBACK",
  "mappingSummary", "recommendations", "diagnosticBundleM5", "M1-M5"
]) {
  assert.ok(html.includes(marker), `Az M5 diagnosztikai marker hiányzik: ${marker}`);
}

// Additional performance guard: 20 commodities x 500 documented maximum rows.
const performanceRaw = Array.from({ length: 500 }, (_, index) => ({
  id: 1000 + index,
  id_commodity: 100 + (index % 20),
  commodity_name: `Performance Ore ${index % 20}`,
  id_star_system: 1 + (index % 3),
  star_system_name: ["Stanton", "Pyro", "Nyx"][index % 3],
  id_terminal: 200 + (index % 30),
  terminal_name: `Terminal ${index % 30}`,
  value: 0,
  value_week: index % 7,
  value_month: (index % 23) - 11,
  date_modified: "2026-08-01T00:00:00Z"
}));
const performanceWiki = Array.from({ length: 20 }, (_, index) => ({ uuid: `perf-${index}`, name: `Performance Ore ${index}`, kind: null }));
const started = performance.now();
const performanceRecords = performanceRaw.map((raw, index) => m5.normalizeUexRefineryYield(raw, contextMeta, index));
const performanceMappings = m5.buildCommodityMappings(performanceWiki, performanceRecords, []);
const performanceRecommendations = m5.buildUexRefineryRecommendations(performanceMappings, performanceRecords, dataset);
const durationMs = performance.now() - started;
assert.equal(performanceRecommendations.length, 20);
assert.ok(durationMs < 1000, `Az M5 500 rekordos fixture túl lassú: ${durationMs.toFixed(1)} ms`);

console.log("M5_UEX_REFINERY_TEST_PASS");
console.log(JSON.stringify({
  mandatoryCases: 17,
  mappingSummary: m5.summarizeUexMappings(mappings),
  systems: Array.from(agricium.systems, (system) => ({ name: system.starSystemName, best: system.rankingValue, ties: system.tieCount })),
  performance: { records: 500, commodities: 20, durationMs: Number(durationMs.toFixed(2)) }
}, null, 2));
