import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const fixture = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "v003-c005-consistency.json"), "utf8"));
const outputArgument = process.argv.find(argument => argument.startsWith("--output-dir="));
const outputDirectory = path.resolve(projectDirectory, outputArgument ? outputArgument.slice("--output-dir=".length) : "test-artifacts/V003-C005");
const baseUrl = "https://api.star-citizen.wiki/api";
const version = fixture.wikiVersion;
const modelMatch = html.match(/\/\* M3_MINING_MODEL_START \*\/([\s\S]*?)\/\* M3_MINING_MODEL_END \*\//);
assert.ok(modelMatch, "Az M3 mining modellblokk hiányzik.");

const context = vm.createContext({ console });
vm.runInContext(`${modelMatch[1]}
globalThis.__C005_AUDIT__ = {
  normalizeMiningCommodity,
  normalizeMiningCommodityIndex,
  buildMiningFarmRecommendations,
  buildMaterialDisplayIndex,
  resolveRadarSignature,
  auditRadarSignatures,
  registry: RADAR_SIGNATURE_REGISTRY,
  categories: M3_MINING_CATEGORIES
};`, context, { filename: "spg-v003-c005-audit-model.js" });
const model = context.__C005_AUDIT__;

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  assert.equal(response.status, 200, `Wiki API hiba: ${response.status} ${url}`);
  return (await response.json()).data;
}

async function fetchActiveCommodities() {
  const groups = await Promise.all(["mineable", "harvestable"].map(kind => fetchJson(`${baseUrl}/commodities?version=${encodeURIComponent(version)}&filter[kind]=${kind}&page[size]=200`)));
  return Array.from(new Map(groups.flat().map(record => [record.uuid, record])).values());
}

async function fetchCommodity(slug) {
  return fetchJson(`${baseUrl}/commodities/${encodeURIComponent(slug)}?version=${encodeURIComponent(version)}`);
}

function recommendationProjection(raw, normalized, recommendation) {
  return {
    material: raw.name,
    radarSignature: normalized.radarSignature,
    radarSignatureDisplay: normalized.radarSignatureDisplay,
    systems: recommendation.systems.map(system => ({
      system: system.system,
      status: system.status,
      methods: system.methods.map(method => ({
        environment: method.category,
        rank: method.rankPosition,
        farmLocation: method.tierDisplayLabel,
        memberSummary: method.tierMemberSummary,
        method: method.method,
        spawn: method.spawn,
        occurrence: method.occurrence,
        quality: method.qualityProfile,
        radarSignature: method.radarSignatureDisplay,
        rawLocationCount: method.locationNames.length
      }))
    }))
  };
}

const provenance = { gameVersion: version, dataSource: "Star Citizen Wiki API", source: `${baseUrl}/commodities`, fetchedAt: new Date().toISOString(), origin: "LIVE_API_AUDIT" };
const activeRaw = await fetchActiveCommodities();
const activeByUuid = new Map(activeRaw.map(record => [record.uuid, record]));
const activeNormalized = activeRaw.map(raw => model.normalizeMiningCommodityIndex(raw, provenance));
const displayIndex = model.buildMaterialDisplayIndex(activeNormalized);
const radarAudit = model.auditRadarSignatures(activeNormalized);
assert.equal(activeRaw.length, 72, "Az aktív Wiki commodity-készlet eltér a C004/C005 baseline-tól.");
assert.equal(displayIndex.length, 64, "A user-facing materialprojekció eltér a C004/C005 baseline-tól.");
assert.equal(radarAudit.verified, 33);
assert.equal(radarAudit.unmapped, 31);

const provenCategoryMaterials = fixture.provenCategoryMaterials.map(expected => {
  const raw = activeByUuid.get(expected.uuid);
  assert.ok(raw, `${expected.canonicalName}: hiányzik az aktív Wiki indexből.`);
  const normalized = activeNormalized.find(record => record.uuid === expected.uuid);
  const flag = expected.category === model.categories.VEHICLE ? raw.has_ground_vehicle_mineables : raw.has_fps_mineables;
  const expectedMethod = expected.category === model.categories.VEHICLE ? "Ground Vehicle" : "FPS";
  assert.equal(flag, true, `${expected.canonicalName}: hiányzó exact Wiki category flag.`);
  assert.ok((raw.methods || []).includes(expectedMethod), `${expected.canonicalName}: hiányzó exact Wiki method.`);
  assert.deepEqual(Array.from(normalized.categories), [expected.category]);
  assert.equal(normalized.radarSignatureStatus, "VERIFIED");
  return {
    canonicalName: normalized.displayName,
    apiName: raw.name,
    uuid: raw.uuid,
    miningCategory: expected.category,
    categoryEvidence: {
      flag: expected.category === model.categories.VEHICLE ? "has_ground_vehicle_mineables=true" : "has_fps_mineables=true",
      method: expectedMethod,
      locationCount: (raw.locations || []).length
    },
    radarResult: normalized.radarSignatureDisplay,
    radarSourceRow: expected.radarSourceRow,
    status: normalized.radarSignatureStatus
  };
});
assert.equal(provenCategoryMaterials.length, 7);

const rightfullyUnmappedTargets = fixture.rightfullyUnmappedTargets.map(expected => {
  const raw = activeByUuid.get(expected.uuid);
  assert.ok(raw, `${expected.canonicalName}: hiányzik az aktív Wiki indexből.`);
  const normalized = activeNormalized.find(record => record.uuid === expected.uuid);
  assert.deepEqual(Array.from(normalized.categories), [model.categories.UNKNOWN], `${expected.canonicalName}: váratlan mining kategória.`);
  assert.equal(normalized.radarSignatureStatus, "UNMAPPED", `${expected.canonicalName}: bizonyíték nélküli Radar mapping.`);
  assert.equal((raw.methods || []).length, 0);
  assert.equal((raw.locations || []).length, 0);
  assert.equal(raw.has_ship_mineables, false);
  assert.equal(raw.has_ground_vehicle_mineables, false);
  assert.equal(raw.has_fps_mineables, false);
  assert.equal(raw.has_harvestables, false);
  return {
    canonicalName: normalized.displayName,
    apiName: raw.name,
    uuid: raw.uuid,
    miningCategory: normalized.categories[0],
    categoryEvidence: {
      hasShipMineables: raw.has_ship_mineables,
      hasGroundVehicleMineables: raw.has_ground_vehicle_mineables,
      hasFpsMineables: raw.has_fps_mineables,
      hasHarvestables: raw.has_harvestables,
      methods: raw.methods || [],
      systems: raw.systems || [],
      locationCount: (raw.locations || []).length
    },
    radarResult: normalized.radarSignatureDisplay,
    wikiSignatureDiagnostic: { value: raw.signature, status: normalized.radarSignatureApiStatus },
    decision: "RIGHTFULLY_UNMAPPED_NO_PROVEN_MINING_CATEGORY"
  };
});

const unmappedRegistry = displayIndex.map(record => {
  const radar = model.resolveRadarSignature(record);
  if (radar.status !== "UNMAPPED") return null;
  const sourceUuids = record.sourceUuids || [record.uuid];
  const rawSources = sourceUuids.map(uuid => activeByUuid.get(uuid)).filter(Boolean);
  const categories = Array.from(record.categories || []);
  let reason = "NO_EXACT_RADAR_REFERENCE_IMAGE_MATERIAL_ROW";
  if (categories.includes(model.categories.UNKNOWN)) reason = "NO_PROVEN_WIKI_MINING_CATEGORY";
  else if (categories.includes(model.categories.HARVESTABLE)) reason = "RADAR_REFERENCE_IMAGE_HAS_NO_HARVESTABLE_CATEGORY_ROW";
  else if (categories.includes(model.categories.SHIP)) reason = "RADAR_REFERENCE_IMAGE_HAS_NO_EXACT_SHIP_MATERIAL_ROW";
  return {
    canonicalName: record.displayName,
    uuid: record.uuid,
    sourceUuids,
    miningCategories: categories,
    classificationSources: Array.from(new Set(rawSources.map(source => {
      if ([source.has_ship_mineables, source.has_ground_vehicle_mineables, source.has_fps_mineables, source.has_harvestables].some(Boolean)) return "API_FLAGS";
      if ((source.methods || []).length) return "API_METHODS";
      return "UNKNOWN";
    }))),
    evidence: rawSources.map(source => ({
      uuid: source.uuid,
      apiName: source.name,
      methods: source.methods || [],
      systems: source.systems || [],
      locationCount: (source.locations || []).length,
      hasShipMineables: source.has_ship_mineables,
      hasGroundVehicleMineables: source.has_ground_vehicle_mineables,
      hasFpsMineables: source.has_fps_mineables,
      hasHarvestables: source.has_harvestables
    })),
    radarResult: "Nincs adat",
    reason
  };
}).filter(Boolean).sort((left, right) => left.canonicalName.localeCompare(right.canonicalName, "hu"));
assert.equal(unmappedRegistry.length, 31);

const rawDetails = await Promise.all(["aluminum-ore", "agricium-ore", "stileron-ore"].map(fetchCommodity));
const normalizedDetails = rawDetails.map(raw => model.normalizeMiningCommodity(raw, provenance));
const systems = Array.from(new Set(normalizedDetails.flatMap(detail => detail.systems))).sort();
const recommendations = normalizedDetails.map(detail => model.buildMiningFarmRecommendations(detail, systems));
const currentProjection = JSON.parse(JSON.stringify(rawDetails.map((raw, index) => recommendationProjection(raw, normalizedDetails[index], recommendations[index]))));
const c004Projection = JSON.parse(fs.readFileSync(path.join(projectDirectory, "test-artifacts", "V003-C004", "top3-live-api.json"), "utf8")).materials;
assert.deepEqual(currentProjection, c004Projection, "A C004 Top-3 projection a változatlan Wiki-verzión megváltozott.");

const aluminum = normalizedDetails[0];
const aluminumRecommendation = recommendations[0];
const lagrangeDecisions = aluminumRecommendation.decisions.filter(decision => decision.providerNames.includes(fixture.lagrangeF.provider));
const lagrangeTrace = lagrangeDecisions.map(decision => {
  const location = aluminum.locations.find(candidate => candidate.id === decision.locationId);
  const resource = location.resources[decision.resourceIndex];
  const method = aluminumRecommendation.systems.flatMap(system => system.methods).find(candidate =>
    candidate.resourceKeys.includes(decision.resourceKey) && candidate.presentation.groups.some(group => group.rawLocationIds.includes(decision.locationId))
  );
  const group = method ? method.presentation.groups.find(candidate => candidate.rawLocationIds.includes(decision.locationId)) : null;
  return {
    commodityUuid: aluminum.uuid,
    targetMaterialUuids: resource.targetMaterials.map(material => material.uuid),
    location: { id: decision.locationId, rawUuid: decision.rawLocationUuid || location.rawLocationUuid, name: decision.locationName, type: decision.locationType },
    provider: decision.providerNames,
    parent: { uuid: decision.parentUuid, name: decision.parentName, type: decision.parentType },
    resource: { key: decision.resourceKey, uuid: decision.resourceUuid, label: decision.resourceLabel, group: decision.resourceGroupName, kind: decision.resourceKind },
    primaryOrSecondary: decision.initialDecision === "INCLUDED" ? "PRIMARY" : "SECONDARY",
    primaryGateResult: decision.primaryEvidence,
    spawn: decision.spawn,
    occurrence: decision.occurrence,
    qualityTuple: decision.qualityProfile,
    presentationGroup: group ? { label: group.label, memberSummary: group.memberSummary, evidence: group.evidence } : null,
    finalRank: decision.rankingTier ?? null,
    finalDecision: decision.decision,
    includedOrExcluded: decision.initialDecision === "INCLUDED" ? "INCLUDED" : "EXCLUDED"
  };
}).sort((left, right) => left.location.name.localeCompare(right.location.name) || left.resource.key.localeCompare(right.resource.key));

const primaryTrace = lagrangeTrace.filter(trace => trace.resource.key === fixture.lagrangeF.primaryResourceKey);
const secondaryTrace = lagrangeTrace.filter(trace => trace.resource.key === fixture.lagrangeF.secondaryResourceKey);
assert.equal(JSON.stringify(Array.from(primaryTrace, trace => trace.location.name).sort()), JSON.stringify(fixture.lagrangeF.expectedLocations));
assert.equal(primaryTrace.length, 4);
assert.ok(primaryTrace.every(trace => trace.primaryOrSecondary === "PRIMARY" && trace.primaryGateResult === "API_RESOURCE_LABEL_MATCH" && trace.finalRank === fixture.lagrangeF.expectedDenseRank && trace.includedOrExcluded === "INCLUDED" && trace.presentationGroup.label === fixture.lagrangeF.expectedPresentationGroup));
assert.equal(secondaryTrace.length, 4);
assert.ok(secondaryTrace.every(trace => trace.primaryOrSecondary === "SECONDARY" && trace.primaryGateResult === "API_RESOURCE_LABEL_DIFFERS" && trace.finalRank === null && trace.includedOrExcluded === "EXCLUDED"));

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "c005-consistency-audit.json"), JSON.stringify({
  auditId: "V003-C005-CONSISTENCY",
  auditedAt: new Date().toISOString(),
  sources: {
    radarSignature: { canonical: fixture.sourceHierarchy.radarSignature, role: "USER_FACING_CANONICAL" },
    wiki: { baseUrl, version, role: "CANONICAL_MINING_GAME_DATA" },
    scmdb: { version: fixture.scmdbReferenceVersion, role: "READ_ONLY_COMPARISON_ONLY" }
  },
  lagrangeFVerdict: {
    verdict: "PRIMARY_ALUMINUM_INCLUDED_AT_SPACE_DENSE_RANK_2; SIBLING_CORUNDUM_SECONDARY_ROWS_EXCLUDED",
    topThreeChanged: false,
    trace: lagrangeTrace
  },
  radarReconciliation: {
    rawRecords: radarAudit.rawRecordCount,
    userFacingRecords: radarAudit.userFacingRecordCount,
    verified: radarAudit.verified,
    unmapped: radarAudit.unmapped,
    previouslyFalselyUnmappedNowVerified: [],
    provenRocFpsMaterials: provenCategoryMaterials,
    targetedRightfullyUnmapped: rightfullyUnmappedTargets,
    allRightfullyUnmapped: unmappedRegistry
  },
  topThreeConsistency: {
    changedFromC004: false,
    checkedMaterials: currentProjection
  },
  legacyCacheCompatibility: {
    indexProjection: "COMMON_WITH_RADAR_SIGNATURE_PROJECTION",
    missingClusterArray: "NULL_SAFE_EMPTY_ARRAY_FALLBACK",
    consumerProjection: "MATERIAL_DATABASE_DETAIL_AND_STANDALONE_SHARE_BUILD_MINING_FARM_RECOMMENDATIONS"
  }
}, null, 2) + "\n");

console.log("V003_C005_LIVE_AUDIT_PASS");
console.log(JSON.stringify({
  scVersion: version,
  lagrangeF: { primaryIncluded: primaryTrace.length, secondaryExcluded: secondaryTrace.length, denseRank: fixture.lagrangeF.expectedDenseRank },
  radar: { raw: radarAudit.rawRecordCount, userFacing: radarAudit.userFacingRecordCount, verified: radarAudit.verified, unmapped: radarAudit.unmapped, newlyVerified: 0 },
  provenRocFps: provenCategoryMaterials.length,
  targetedRightfullyUnmapped: rightfullyUnmappedTargets.map(record => record.canonicalName),
  topThreeChanged: false,
  outputDirectory: path.relative(projectDirectory, outputDirectory)
}, null, 2));
