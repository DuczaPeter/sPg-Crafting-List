import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const radarFixture = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "v003-c004-radar-signatures.json"), "utf8"));
const scmdbFixture = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "v003-c004-scmdb-reference.json"), "utf8"));
const imagePath = path.join(projectDirectory, "Info", "Radar Signature.png");
const match = html.match(/\/\* M3_MINING_MODEL_START \*\/([\s\S]*?)\/\* M3_MINING_MODEL_END \*\//);
assert.ok(match, "Az M3 mining modellblokk hiányzik.");

const context = vm.createContext({ console });
vm.runInContext(`${match[1]}
globalThis.__C004__ = {
  categories: M3_MINING_CATEGORIES,
  environments: M3_ENVIRONMENTS,
  decisions: M3_RECOMMENDATION_DECISIONS,
  registry: RADAR_SIGNATURE_REGISTRY,
  categoryRules: RADAR_SIGNATURE_CATEGORY_RULES,
  registryVersion: RADAR_SIGNATURE_REGISTRY_VERSION,
  sourceSha256: RADAR_SIGNATURE_SOURCE_SHA256,
  resolveRadarSignature,
  auditRadarSignatures,
  normalizeMiningCommodity,
  normalizeMiningCommodityIndex,
  buildMiningFarmRecommendations,
  sameMiningRank,
  partitionTiers: m3PartitionRankingTiers
};`, context, { filename: "spg-v003-c004-model.js" });
const model = context.__C004__;

assert.equal(crypto.createHash("sha256").update(fs.readFileSync(imagePath)).digest("hex"), radarFixture.sourceSha256);
assert.equal(model.sourceSha256, radarFixture.sourceSha256);
assert.equal(model.registry.length, 33);
assert.equal(model.categoryRules.length, 3);
for (const [name, base, maxMultiplier] of radarFixture.directShipRows) {
  const record = model.registry.find(candidate => candidate.canonicalMaterial === name);
  assert.ok(record, `${name}: hiányzó Radar Signature registry rekord.`);
  assert.equal(record.baseRadarSignature, base, name);
  assert.equal(record.clusterSignatures.length, maxMultiplier, name);
  assert.equal(record.clusterSignatures.at(-1), base * maxMultiplier, name);
}
for (const [category, sourceRow, base, maxMultiplier] of radarFixture.categoryRows) {
  const rule = model.categoryRules.find(candidate => candidate.miningCategory === category);
  assert.ok(rule, `${sourceRow}: hiányzó kategóriaszabály.`);
  assert.equal(rule.baseRadarSignature, base);
  assert.equal(rule.maximumClusterMultiplier, maxMultiplier);
}

const provenance = { gameVersion: "4.9.0-LIVE.12232306", dataSource: "Star Citizen Wiki API", source: "fixture", fetchedAt: "2026-08-24T00:00:00.000Z", origin: "FIXTURE" };
const curated = model.normalizeMiningCommodityIndex({ uuid: "fc1ec740-3047-48d8-81f0-396f4c9a90ef", name: "Agricium (Ore)", signature: 4000, has_ship_mineables: true }, provenance);
assert.equal(curated.radarSignature, 3885);
assert.equal(curated.radarSignatureApiRaw, 4000);
assert.equal(curated.radarSignatureStatus, "VERIFIED");
const unmapped = model.normalizeMiningCommodityIndex({ uuid: "no-registry", name: "Unknown Test", signature: 9876, has_harvestables: true }, provenance);
assert.equal(unmapped.radarSignature, null);
assert.equal(unmapped.radarSignatureDisplay, "Nincs adat");
assert.equal(unmapped.radarSignatureApiRaw, 9876);
assert.equal(unmapped.radarSignatureApiStatus, "API_RAW_NOT_USER_FACING");

function location({ id, name, system = "Stanton System", type = "Moon", parent = "Stanton", parentUuid = "stanton", provider = "HPP_Test", spawn, occurrence, quality, category = "SHIP_MINING" }) {
  return {
    uuid: id,
    name,
    system,
    type,
    parent_name: parent,
    parent_type: type === "Asteroid" ? "Star" : "Planet",
    parent_uuid: parentUuid,
    resources: [{
      key: `${category}_${id}`,
      resource_uuid: `resource-${category}`,
      label: "Agricium",
      group_name: category === "VEHICLE_MINING" ? "GroundVehicle_Mineables" : "SpaceShip_Mineables",
      resource_kind: "mineable",
      provider_names: [provider],
      materials: [{
        uuid: "fc1ec740-3047-48d8-81f0-396f4c9a90ef",
        name: "Agricium (Ore)",
        is_current: true,
        group_probability_percent: spawn,
        relative_probability_percent: occurrence,
        quality_min: quality,
        quality_max: quality,
        quality_quantized_values: [quality]
      }]
    }]
  };
}

const topThreeRaw = {
  uuid: "fc1ec740-3047-48d8-81f0-396f4c9a90ef",
  name: "Agricium (Ore)",
  signature: 4000,
  has_ship_mineables: true,
  systems: ["Stanton System"],
  locations: [
    location({ id: "normal-a", name: "Normal A", spawn: 50, occurrence: 20, quality: 900, parent: "A", parentUuid: "a" }),
    location({ id: "normal-b", name: "Normal B", spawn: 50, occurrence: 20, quality: 900, parent: "B", parentUuid: "b" }),
    location({ id: "normal-c", name: "Normal C", spawn: 40, occurrence: 99, quality: 1000 }),
    location({ id: "normal-d", name: "Normal D", spawn: 40, occurrence: 20, quality: 950 }),
    location({ id: "normal-e", name: "Normal E", spawn: 30, occurrence: 99, quality: 1000 }),
    location({ id: "space-a", name: "Space A", type: "Asteroid", spawn: 60, occurrence: 10, quality: 800 }),
    location({ id: "space-b", name: "Space B", type: "Asteroid", spawn: 50, occurrence: 50, quality: 900 }),
    location({ id: "space-c", name: "Space C", type: "Asteroid", spawn: 40, occurrence: 50, quality: 1000 }),
    location({ id: "space-d", name: "Space D", type: "Asteroid", spawn: 30, occurrence: 50, quality: 1000 })
  ]
};
const topThree = model.buildMiningFarmRecommendations(model.normalizeMiningCommodity(topThreeRaw, provenance), ["Stanton System"]);
const stanton = topThree.systems[0];
const normal = stanton.methods.filter(method => method.category === model.environments.NORMAL);
const space = stanton.methods.filter(method => method.category === model.environments.SPACE);
assert.deepEqual(Array.from(normal, method => method.rankPosition), [1, 2, 3]);
assert.deepEqual(Array.from(space, method => method.rankPosition), [1, 2, 3]);
assert.deepEqual(Array.from(normal[0].locationNames), ["Normal A", "Normal B"]);
assert.equal(normal[0].presentation.groups.length, 2, "Azonos tuple, de bizonyítatlan family nem mosható össze egy csoportba.");
assert.equal(normal[0].tierDisplayLabel.includes("Normal A"), true);
assert.equal(topThree.decisions.find(decision => decision.locationName === "Normal E").decision, model.decisions.LOWER_RANKED);
assert.equal(topThree.decisions.find(decision => decision.locationName === "Normal A").rankingTier, 1);
assert.equal(normal.every(method => method.radarSignature === 3885), true);

const vehicleRaw = {
  uuid: "c339897c-d682-48ad-a16f-daf145bc0f4d",
  name: "Beradon",
  signature: 4000,
  has_ground_vehicle_mineables: true,
  systems: ["Stanton System"],
  locations: [
    location({ id: "roc-surface", name: "ROC Surface", spawn: 30, occurrence: 20, quality: 700, category: "VEHICLE_MINING" }),
    location({ id: "roc-space", name: "ROC Space", type: "Asteroid", spawn: 99, occurrence: 99, quality: 1000, category: "VEHICLE_MINING" })
  ].map(candidate => {
    candidate.resources[0].label = "Beradon";
    candidate.resources[0].materials[0].uuid = "c339897c-d682-48ad-a16f-daf145bc0f4d";
    candidate.resources[0].materials[0].name = "Beradon";
    return candidate;
  })
};
const vehicleRecommendation = model.buildMiningFarmRecommendations(model.normalizeMiningCommodity(vehicleRaw, provenance), ["Stanton System"]);
assert.deepEqual(Array.from(vehicleRecommendation.systems[0].methods, method => method.category), [model.environments.NORMAL]);

const scmdbCounts = scmdbFixture.comparisonCases.reduce((counts, entry) => {
  counts[entry.status] = (counts[entry.status] || 0) + 1;
  return counts;
}, {});
assert.deepEqual(scmdbCounts, { MATCH: 6, EXPLAINED_DIFFERENCE: 1, UNVERIFIED: 2 });
assert.equal(scmdbFixture.runtimeDependency, false);
assert.ok(scmdbFixture.forbiddenUses.includes("RANKING_INPUT"));
assert.equal(html.includes("scmdb.net"), false, "Az alkalmazás runtime kódja nem függhet SCMDB-től.");
assert.match(html, /radarSignatureClusterSignatures:\s*\(\(detail \? detail\.radarSignatureClusterSignatures : commodity\.radarSignatureClusterSignatures\) \|\| \[\]\)\.slice\(\)/, "A régi cache-ből hiányzó cluster-lista nem null-safe.");
assert.match(html, /withRadarSignatureProjection\(withResolvedMaterialName\(Object\.assign\(\{\}, record/, "A visszatöltött commodity index nem kap közös radar-projekciót.");
assert.match(html, /method\.tierDisplayLabel \|\| method\.locationLabel/, "A normál UI nem a közös Top-3 projection labelt használja.");
assert.match(html, /m6EscapeHtml\(method\.tierDisplayLabel \|\| method\.locationLabel\)/, "A standalone export nem a közös Top-3 projection labelt használja.");

console.log("V003_C004_RADAR_TOP3_TEST_PASS");
console.log(JSON.stringify({
  registryVersion: model.registryVersion,
  verifiedMaterialRecords: model.registry.length,
  directShipRows: radarFixture.directShipRows.length,
  categoryDerivedRecords: Object.values(radarFixture.categoryDerivedMaterials).flat().length,
  topThree: { normalTiers: normal.length, spaceTiers: space.length, tiedWinnerLocations: normal[0].locationNames.length },
  nonShipSpaceSuppressed: true,
  scmdbComparison: scmdbCounts
}, null, 2));
