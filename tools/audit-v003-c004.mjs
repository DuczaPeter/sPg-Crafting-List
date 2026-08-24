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
const outputArgument = process.argv.find(argument => argument.startsWith("--output-dir="));
const outputDirectory = path.resolve(projectDirectory, outputArgument ? outputArgument.slice("--output-dir=".length) : "test-artifacts/V003-C004");
const version = process.argv.find(argument => argument.startsWith("--version="))?.slice("--version=".length) || "4.9.0-LIVE.12232306";
const baseUrl = "https://api.star-citizen.wiki/api";
const match = html.match(/\/\* M3_MINING_MODEL_START \*\/([\s\S]*?)\/\* M3_MINING_MODEL_END \*\//);
assert.ok(match, "Az M3 mining modellblokk hiányzik.");

const context = vm.createContext({ console });
vm.runInContext(`${match[1]}
globalThis.__C004_AUDIT__ = {
  normalizeMiningCommodity,
  normalizeMiningCommodityIndex,
  buildMiningFarmRecommendations,
  auditRadarSignatures,
  registry: RADAR_SIGNATURE_REGISTRY,
  categoryRules: RADAR_SIGNATURE_CATEGORY_RULES,
  sourceSha256: RADAR_SIGNATURE_SOURCE_SHA256,
  environments: M3_ENVIRONMENTS,
  decisions: M3_RECOMMENDATION_DECISIONS
};`, context, { filename: "spg-v003-c004-audit-model.js" });
const model = context.__C004_AUDIT__;

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  assert.equal(response.status, 200, `Wiki API hiba: ${response.status} ${url}`);
  return response.json();
}

async function fetchActiveCommodities() {
  const groups = await Promise.all(["mineable", "harvestable"].map(async kind => {
    const payload = await fetchJson(`${baseUrl}/commodities?version=${encodeURIComponent(version)}&filter[kind]=${kind}&page[size]=200`);
    return payload.data || [];
  }));
  return Array.from(new Map(groups.flat().map(record => [record.uuid, record])).values());
}

async function fetchCommodity(slug) {
  return (await fetchJson(`${baseUrl}/commodities/${encodeURIComponent(slug)}?version=${encodeURIComponent(version)}`)).data;
}

const provenance = { gameVersion: version, dataSource: "Star Citizen Wiki API", source: `${baseUrl}/commodities`, fetchedAt: new Date().toISOString(), origin: "LIVE_API_AUDIT" };
const image = fs.readFileSync(path.join(projectDirectory, radarFixture.source));
const imageSha256 = crypto.createHash("sha256").update(image).digest("hex");
const imageDimensions = { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
assert.equal(imageSha256, radarFixture.sourceSha256);
assert.deepEqual(imageDimensions, radarFixture.sourceDimensions);
assert.equal(model.sourceSha256, imageSha256);

const activeRaw = await fetchActiveCommodities();
const activeNormalized = activeRaw.map(raw => model.normalizeMiningCommodityIndex(raw, provenance));
const radarAudit = model.auditRadarSignatures(activeNormalized);
assert.equal(activeRaw.length, 72, "Az aktív rögzített Wiki commodity-készlet rekordszáma megváltozott.");
assert.equal(radarAudit.registryMaterialRecords, 33);
assert.equal(radarAudit.categoryRules, 3);
assert.equal(radarAudit.verified + radarAudit.unmapped, radarAudit.userFacingRecordCount);
assert.equal(radarAudit.rawVerified + radarAudit.rawUnmapped, radarAudit.rawRecordCount);

const slugs = ["aluminum-ore", "agricium-ore", "stileron-ore"];
const rawDetails = await Promise.all(slugs.map(fetchCommodity));
const details = rawDetails.map(raw => model.normalizeMiningCommodity(raw, provenance));
const systems = Array.from(new Set(details.flatMap(detail => detail.systems))).sort();
const recommendations = details.map((detail, index) => ({
  rawName: rawDetails[index].name,
  detail,
  recommendation: model.buildMiningFarmRecommendations(detail, systems)
}));

function topThreeFor(entry, system, environment) {
  return entry.recommendation.systems.find(candidate => candidate.system === system)?.methods.filter(method => method.category === environment) || [];
}

for (const entry of recommendations) {
  for (const system of entry.recommendation.systems) {
    for (const environment of [model.environments.NORMAL, model.environments.SPACE]) {
      const tiers = system.methods.filter(method => method.category === environment);
      assert.ok(tiers.length <= 3, `${entry.rawName}/${system.system}/${environment}: túl sok tier.`);
      assert.deepEqual(Array.from(tiers, method => method.rankPosition), Array.from(tiers, (_, index) => index + 1));
      assert.ok(tiers.every(method => method.locationIds.length > 0 && method.radarSignatureStatus === "VERIFIED"));
    }
  }
  assert.ok(entry.recommendation.decisions.filter(decision => decision.decision === model.decisions.SECONDARY_EXCLUDED).every(decision => !entry.recommendation.systems.some(system => system.methods.some(method => method.resourceKeys.includes(decision.resourceKey)))), `${entry.rawName}: secondary resource bekerült a látható Top-3-ba.`);
}

const byName = new Map(recommendations.map(entry => [entry.rawName, entry]));
const aluminumStantonNormal = topThreeFor(byName.get("Aluminum (Ore)"), "Stanton System", model.environments.NORMAL);
const aluminumStantonSpace = topThreeFor(byName.get("Aluminum (Ore)"), "Stanton System", model.environments.SPACE);
assert.ok(aluminumStantonNormal.length > 0 && aluminumStantonSpace.length > 0);
for (const material of ["Aluminum (Ore)", "Agricium (Ore)", "Stileron (Ore)"]) {
  const entry = byName.get(material);
  const pyro = entry.recommendation.systems.find(system => system.system === "Pyro System");
  assert.ok(pyro && pyro.status === "AVAILABLE", `${material}: hiányzó Pyro ajánlás.`);
}

function providerNames(raw) {
  return new Set((raw.locations || []).flatMap(location => (location.resources || []).flatMap(resource => resource.provider_names || [])));
}
const providers = new Map(rawDetails.map(raw => [raw.name, providerNames(raw)]));
assert.ok(providers.get("Aluminum (Ore)").has("HPP_AaronHalo"));
assert.ok(providers.get("Aluminum (Ore)").has("HPP_Pyro_DeepSpaceAsteroids"));
assert.ok(providers.get("Agricium (Ore)").has("HPP_Lagrange_D"));
assert.ok(providers.get("Stileron (Ore)").has("HPP_Pyro_AkiroCluster"));
assert.equal(html.includes("Yela Asteroid Belt"), false, "A nem bizonyított SCMDB label bekerült az alkalmazásba.");
assert.equal(html.includes("Terminus Ring"), false, "A nem bizonyított SCMDB label bekerült az alkalmazásba.");

const scmdbSummary = scmdbFixture.comparisonCases.reduce((counts, item) => {
  counts[item.status] = (counts[item.status] || 0) + 1;
  return counts;
}, { MATCH: 0, EXPLAINED_DIFFERENCE: 0, UNVERIFIED: 0 });
const topThreeReport = recommendations.map(entry => ({
  material: entry.rawName,
  radarSignature: entry.detail.radarSignature,
  radarSignatureDisplay: entry.detail.radarSignatureDisplay,
  systems: entry.recommendation.systems.map(system => ({
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
}));

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "radar-signature-audit.json"), JSON.stringify({
  auditId: "V003-C004-RADAR",
  auditedAt: new Date().toISOString(),
  scVersion: version,
  sourceImage: { path: radarFixture.source, sha256: imageSha256, dimensions: imageDimensions },
  fieldPriority: { userFacing: "CURATED_RADAR_SIGNATURE_REGISTRY", wiki: "API_RAW_DIAGNOSTIC_ONLY", missing: "Nincs adat" },
  audit: radarAudit
}, null, 2) + "\n");
fs.writeFileSync(path.join(outputDirectory, "scmdb-comparison-audit.json"), JSON.stringify({
  auditId: "V003-C004-SCMDB",
  auditedAt: new Date().toISOString(),
  sourceUrl: scmdbFixture.sourceUrl,
  observedVersion: scmdbFixture.observedVersion,
  observationMethod: "MANUAL_BROWSER_REFERENCE_CAPTURE_PLUS_AUTOMATED_WIKI_PROVIDER_VALIDATION",
  runtimeDependency: false,
  percentageSemantics: scmdbFixture.percentageSemantics,
  summary: scmdbSummary,
  cases: scmdbFixture.comparisonCases
}, null, 2) + "\n");
fs.writeFileSync(path.join(outputDirectory, "top3-live-api.json"), JSON.stringify({
  auditId: "V003-C004-TOP3",
  auditedAt: new Date().toISOString(),
  scVersion: version,
  ranking: ["PRIMARY_RESOURCE_GATE", "SPAWN_DESC", "OCCURRENCE_DESC", "QUALITY_DESC", "DENSE_RANK_MAX_3_TIERS_PER_SYSTEM_AND_ENVIRONMENT"],
  materials: topThreeReport
}, null, 2) + "\n");

console.log("V003_C004_LIVE_AUDIT_PASS");
console.log(JSON.stringify({
  scVersion: version,
  activeRawRecords: radarAudit.rawRecordCount,
  userFacingRecords: radarAudit.userFacingRecordCount,
  verified: radarAudit.verified,
  unmapped: radarAudit.unmapped,
  registryMaterialRecords: radarAudit.registryMaterialRecords,
  categoryRules: radarAudit.categoryRules,
  scmdbComparison: scmdbSummary,
  aluminumStanton: { normalTiers: aluminumStantonNormal.length, spaceTiers: aluminumStantonSpace.length },
  outputDirectory: path.relative(projectDirectory, outputDirectory)
}, null, 2));
