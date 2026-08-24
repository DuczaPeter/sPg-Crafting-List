import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const match = html.match(/\/\* M3_MINING_MODEL_START \*\/([\s\S]*?)\/\* M3_MINING_MODEL_END \*\//);
assert.ok(match, "Az M3 mining modellblokk hiányzik.");

const context = vm.createContext({ console });
vm.runInContext(`${match[1]}
globalThis.__V003_FARM__ = {
  normalizeMiningCommodity,
  buildMiningFarmRecommendations,
  decisions: M3_RECOMMENDATION_DECISIONS,
  environments: M3_ENVIRONMENTS
};`, context, { filename: "spg-v003-farm-model.js" });

const model = context.__V003_FARM__;
const base = "https://api.star-citizen.wiki/api";
const version = process.argv[2] || "4.9.0-LIVE.12232306";
const slugs = ["aluminum-ore", "agricium-ore", "stileron-ore"];

async function getCommodity(slug) {
  const response = await fetch(`${base}/commodities/${encodeURIComponent(slug)}?version=${encodeURIComponent(version)}`);
  assert.equal(response.ok, true, `${slug}: HTTP ${response.status}`);
  return (await response.json()).data;
}

const rawCommodities = await Promise.all(slugs.map(getCommodity));
const provenance = {
  gameVersion: version,
  dataSource: "Star Citizen Wiki API",
  source: `${base}/commodities/{slug}`,
  fetchedAt: new Date().toISOString(),
  origin: "LIVE_API_PROBE"
};
const normalized = rawCommodities.map((commodity) => model.normalizeMiningCommodity(commodity, provenance));
const systems = Array.from(new Set(normalized.flatMap((commodity) => commodity.systems))).sort();
const projections = normalized.map((commodity) => ({
  commodity,
  recommendation: model.buildMiningFarmRecommendations(commodity, systems)
}));

const byRawName = new Map(projections.map((entry) => [rawCommodities.find((raw) => raw.uuid === entry.commodity.uuid).name, entry]));
assert.equal(byRawName.get("Aluminum (Ore)").commodity.rarity, "common");
assert.equal(byRawName.get("Agricium (Ore)").commodity.rarity, "uncommon");
assert.equal(byRawName.get("Stileron (Ore)").commodity.rarity, "legendary");

for (const { recommendation } of projections) {
  for (const system of recommendation.systems) {
    for (const category of [model.environments.NORMAL, model.environments.SPACE]) {
      const tiers = system.methods.filter((method) => method.category === category);
      assert.ok(tiers.length <= 3, `${system.system}/${category}: háromnál több dense rank tier jelent meg.`);
      assert.deepEqual(tiers.map((method) => method.rankPosition), tiers.map((_, index) => index + 1), `${system.system}/${category}: hibás dense rank pozíció.`);
    }
  }
}

const agricium = byRawName.get("Agricium (Ore)");
const agriciumPrimary = agricium.recommendation.decisions.filter((decision) => decision.primaryEvidence === "API_RESOURCE_LABEL_MATCH");
const agriciumSecondary = agricium.recommendation.decisions.filter((decision) => decision.decision === model.decisions.SECONDARY_EXCLUDED);
assert.ok(agriciumPrimary.length > 0, "Agricium primary resource nem található.");
assert.ok(agriciumSecondary.length > 0, "Agricium secondary resource nem található.");
assert.ok(agriciumSecondary.every((decision) => decision.primaryEvidence === "API_RESOURCE_LABEL_DIFFERS"));

const agriciumRawSecondaryCurrent = rawCommodities.find((raw) => raw.name === "Agricium (Ore)").locations.some((location) =>
  (location.resources || []).some((resource) => resource.label !== "Agricium" &&
    (resource.materials || []).some((material) => material.uuid === agricium.commodity.uuid && material.is_current === true))
);
assert.equal(agriciumRawSecondaryCurrent, true, "Az is_current nem bizonyította a megnyitott, de secondary commodity előfordulást.");

const agriciumBest = agricium.recommendation.decisions.filter((decision) =>
  decision.decision === model.decisions.BEST_NORMAL || decision.decision === model.decisions.BEST_SPACE
);
const highSpawnSecondary = agriciumSecondary.some((secondary) => agriciumBest.some((best) =>
  secondary.system === best.system && secondary.environment === best.environment && Number(secondary.spawn) > Number(best.spawn)
));
assert.equal(highSpawnSecondary, true, "A live fixture nem tartalmaz magasabb spawnú secondary csapdát.");

const aluminumNyx = byRawName.get("Aluminum (Ore)").recommendation.systems.find((system) => system.system === "Nyx System");
assert.equal(aluminumNyx.status, "AVAILABLE");
assert.ok(aluminumNyx.methods.some((method) => method.category === model.environments.SPACE && method.locationNames.includes("Keeger Belt")));

function methodFor(rawName, systemName, category) {
  return byRawName.get(rawName).recommendation.systems.find((system) => system.system === systemName)?.methods.find((method) => method.category === category && method.rankPosition === 1);
}

const aluminumPyroSpace = methodFor("Aluminum (Ore)", "Pyro System", model.environments.SPACE);
assert.equal(aluminumPyroSpace.locationLabel, "Pyro Deep Space Asteroids");
assert.equal(aluminumPyroSpace.locationSummary, "86 RMB helyszín");
assert.equal(aluminumPyroSpace.locationNames.length, 86, "A teljes Aluminum/Pyro RMB nyers lista nem maradt meg.");
assert.equal(/RMB-/.test(aluminumPyroSpace.locationLabel), false, "Az Aluminum/Pyro UI label technikai RMB-listát tartalmaz.");

const aluminumStantonSpace = methodFor("Aluminum (Ore)", "Stanton System", model.environments.SPACE);
assert.equal(aluminumStantonSpace.locationLabel, "Aaron Halo");
assert.equal(aluminumStantonSpace.locationSummary, "50 Mining Base helyszín · 1 rendszer-szintű API-rekord");
assert.equal(aluminumStantonSpace.presentation.groups[0].evidence.providerNames.includes("HPP_AaronHalo"), true);

const agriciumStantonSpace = methodFor("Agricium (Ore)", "Stanton System", model.environments.SPACE);
assert.equal(agriciumStantonSpace.locationLabel, "Lagrange D");
assert.equal(agriciumStantonSpace.locationSummary, "ARC-L3 · CRU-L5 · MIC-L4");
const agriciumPyroNormal = methodFor("Agricium (Ore)", "Pyro System", model.environments.NORMAL);
assert.equal(agriciumPyroNormal.locationLabel, "2 azonos rangú farmhely");
assert.equal(agriciumPyroNormal.presentation.groups.length, 2, "A Terminus/Vuur rekordokat nem szabad bizonyíték nélkül összevonni.");

const agriciumPyroSpace = methodFor("Agricium (Ore)", "Pyro System", model.environments.SPACE);
assert.equal(agriciumPyroSpace.locationLabel, "Pyro Lagrange Points");
assert.equal(agriciumPyroSpace.presentation.groups[0].evidence.providerNames.includes("HPP_Pyro_Warm01"), true);

const stileronPyro = byRawName.get("Stileron (Ore)").recommendation.systems.find((system) => system.system === "Pyro System");
assert.equal(stileronPyro.status, "AVAILABLE");
assert.ok(stileronPyro.methods.some((method) => method.category === model.environments.NORMAL));
assert.ok(stileronPyro.methods.some((method) => method.category === model.environments.SPACE));
const stileronPyroSpace = stileronPyro.methods.find((method) => method.category === model.environments.SPACE && method.rankPosition === 1);
assert.equal(stileronPyroSpace.locationLabel, "Pyro Deep Space Asteroids");
assert.equal(stileronPyroSpace.locationSummary, "Akiro Cluster és RMB helyszínek");
assert.equal(stileronPyroSpace.locationNames.length, 87, "A teljes Stileron/Pyro nyers lista nem maradt meg.");

const allEnvironmentEvidence = projections.flatMap((entry) => entry.recommendation.decisions.map((decision) => decision.environmentEvidence));
assert.ok(allEnvironmentEvidence.some((evidence) => /ASTEROID/.test(evidence)), "Nincs API-alapú space bizonyíték.");
assert.ok(allEnvironmentEvidence.some((evidence) => /MOON|PLANET|OUTPOST/.test(evidence)), "Nincs API-alapú normal/surface bizonyíték.");

console.log("V003_FARM_LIVE_API_PROBE_PASS");
console.log(JSON.stringify({
  version,
  materials: projections.map(({ commodity, recommendation }) => ({
    name: rawCommodities.find((raw) => raw.uuid === commodity.uuid).name,
    tier: commodity.rarity,
    rawLocations: commodity.locations.length,
    primary: recommendation.decisions.filter((decision) => decision.primaryEvidence === "API_RESOURCE_LABEL_MATCH").length,
    secondaryExcluded: recommendation.decisions.filter((decision) => decision.decision === model.decisions.SECONDARY_EXCLUDED).length,
    best: recommendation.decisions.filter((decision) => decision.decision === model.decisions.BEST_NORMAL || decision.decision === model.decisions.BEST_SPACE).length
  })),
  systems,
  highSpawnSecondaryExcluded: highSpawnSecondary,
  grouping: {
    aluminumPyro: { label: aluminumPyroSpace.locationLabel, summary: aluminumPyroSpace.locationSummary, rawCount: aluminumPyroSpace.locationNames.length },
    aluminumStanton: { label: aluminumStantonSpace.locationLabel, summary: aluminumStantonSpace.locationSummary, rawCount: aluminumStantonSpace.locationNames.length },
    agriciumStanton: { label: agriciumStantonSpace.locationLabel, summary: agriciumStantonSpace.locationSummary },
    agriciumPyroNormal: { label: agriciumPyroNormal.locationLabel, groupCount: agriciumPyroNormal.presentation.groups.length },
    stileronPyro: { label: stileronPyroSpace.locationLabel, summary: stileronPyroSpace.locationSummary, rawCount: stileronPyroSpace.locationNames.length }
  },
  recommendationFunction: "buildMiningFarmRecommendations"
}, null, 2));
