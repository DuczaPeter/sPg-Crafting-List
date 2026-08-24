import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const fixture = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "m3-mining-cases.json"), "utf8"));
const match = html.match(/\/\* M3_MINING_MODEL_START \*\/([\s\S]*?)\/\* M3_MINING_MODEL_END \*\//);
assert.ok(match, "Az M3 mining modellblokk hiányzik.");

const context = vm.createContext({ console });
vm.runInContext(`${match[1]}
globalThis.__M3__ = {
  categories: M3_MINING_CATEGORIES,
  equipmentTypes: M3_EQUIPMENT_TYPES,
  decisions: M3_RECOMMENDATION_DECISIONS,
  environments: M3_ENVIRONMENTS,
  classifyMiningCommodity,
  normalizeMiningCommodity,
  normalizeMiningCommodityIndex,
  compareMiningLocations,
  mergeBestMiningLocationsBySystem,
  buildMiningFarmRecommendations,
  classifyMiningEnvironment,
  canonicalDepositName: m3CanonicalDepositName,
  normalizeMiningEquipmentIndex,
  normalizeMiningHeadDetail,
  normalizeMiningVehicleDetail,
  resizeMiningModules,
  resizeMiningStations,
  setDefaultMiningLoadout,
  reconcileMiningLoadout
};`, context, { filename: "spg-m3-model.js" });

const model = context.__M3__;
const provenance = {
  gameVersion: fixture.gameVersion,
  dataSource: "Star Citizen Wiki API",
  source: "https://api.star-citizen.wiki/api/commodities/fixture",
  fetchedAt: "2026-08-22T10:00:00.000Z",
  origin: "API"
};
const clone = value => structuredClone(value);

// 1–4. Explicit API flags classify all required mining categories.
assert.deepEqual(Array.from(model.classifyMiningCommodity(fixture.commodities.ship).categories), [model.categories.SHIP]);
assert.deepEqual(Array.from(model.classifyMiningCommodity(fixture.commodities.vehicle).categories), [model.categories.VEHICLE]);
assert.deepEqual(Array.from(model.classifyMiningCommodity(fixture.commodities.fps).categories), [model.categories.FPS]);
assert.deepEqual(Array.from(model.classifyMiningCommodity(fixture.commodities.harvestable).categories), [model.categories.HARVESTABLE]);

// 5. Radar Signature remains numeric or null; it is never converted to zero.
const shipIndex = model.normalizeMiningCommodityIndex(fixture.commodities.ship, provenance);
const fpsIndex = model.normalizeMiningCommodityIndex(fixture.commodities.fps, provenance);
assert.equal(shipIndex.radarSignature, 4000);
assert.equal(fpsIndex.radarSignature, null);

// 6. A real-style commodity keeps every location and every resource; recommendation filtering is a separate projection.
const ship = model.normalizeMiningCommodity(fixture.commodities.ship, provenance);
assert.deepEqual(Array.from(ship.systems), ["Pyro System", "Stanton System"]);
assert.equal(ship.locations.length, 5);
assert.equal(ship.locations[0].resources.length, 1);
assert.equal(ship.locations[0].resources[0].materials.length, 3);
assert.equal(ship.locations[0].resources[0].targetMaterials.length, 2);
assert.equal(ship.locations[0].resources[0].targetQuality.reachableMaximum, 1000, "Más material Q1000 értéke nem kerülhet a target Quality profilba.");
assert.equal(ship.locations.find(location => location.name === "Akiro Cluster").resources[0].targetMaterials[0].materialIndex, 2, "A primary felismerés nem támaszkodhat materialIndex === 0 szabályra.");

// 7. Primary gate first; an extreme secondary spawn/occurrence/Q result cannot enter the ranking.
const recommendation = model.buildMiningFarmRecommendations(ship, fixture.knownSystems);
const secondaryDecision = recommendation.decisions.find(decision => decision.locationName === "Aberdeen");
assert.equal(secondaryDecision.primaryEvidence, "API_RESOURCE_LABEL_DIFFERS");
assert.equal(secondaryDecision.decision, model.decisions.SECONDARY_EXCLUDED);
assert.equal(secondaryDecision.qualityProfile.reachableMaximum, 1000, "A magas maximum-Q secondary csapdának explicitnek kell maradnia.");
const stanton = recommendation.systems.find(result => result.system === "Stanton System");
assert.equal(stanton.methods.find(method => method.category === model.environments.NORMAL).locationLabel, "Arial");
assert.equal(stanton.methods.find(method => method.category === model.environments.SPACE).locationLabel, "ARC L3");
assert.equal(recommendation.systems.find(result => result.system === "Nyx System").status, "NO_KNOWN_LOCATION");
assert.deepEqual(Array.from(recommendation.rankingOrder), [
  "PRIMARY_RESOURCE_GATE",
  "GROUP_PROBABILITY_SPAWN_DESC",
  "RELATIVE_PROBABILITY_OCCURRENCE_DESC",
  "HIGH_Q_QUANTIZED_VALUES_DESC",
  "QUALITY_RANGE_DESC"
]);

// 8. The target resource's spawn precedes occurrence; Quality only breaks an exact probability tie.
const quality = values => ({ hasHighQuality: true, highQualityValues: values, reachableMaximum: values.at(-1), reachableMinimum: values[0], ranges: [] });
const ranked = [
  { id: "occurrence", locationName: "Occurrence", environment: "NORMAL", miningMethod: "SHIP_MINING", spawn: 10, occurrence: 99, qualityProfile: quality([600, 1000]) },
  { id: "spawn", locationName: "Spawn", environment: "NORMAL", miningMethod: "SHIP_MINING", spawn: 20, occurrence: 1, qualityProfile: quality([500]) },
  { id: "quality-low", locationName: "Quality Low", environment: "NORMAL", miningMethod: "SHIP_MINING", spawn: 15, occurrence: 20, qualityProfile: quality([600, 900]) },
  { id: "quality-high", locationName: "Quality High", environment: "NORMAL", miningMethod: "SHIP_MINING", spawn: 15, occurrence: 20, qualityProfile: quality([600, 950]) }
].sort(model.compareMiningLocations);
assert.deepEqual(Array.from(ranked, item => item.id), ["spawn", "quality-high", "quality-low", "occurrence"]);

// 9. Normal and space results are independent, and strict All Lagrange Points needs every relevant LP to tie.
function primaryLocation(uuid, name, spawn, occurrence, options = {}) {
  return {
    uuid,
    name,
    system: "Stanton System",
    type: "Asteroid",
    parent_name: "Stanton",
    parent_type: "Star",
    parent_uuid: "stanton-star",
    resources: [{
      key: "MineableRock_AsteroidUncommon_Agricium",
      resource_uuid: "resource-agricium-asteroid",
      label: "Agricium",
      group_name: "SpaceShip_Mineables",
      resource_kind: "mineable",
      provider_names: [options.provider || "HPP_Lagrange_D"],
      materials: [{
        key: "Ore_Agricium",
        name: "Agricium (Ore)",
        uuid: fixture.commodities.ship.uuid,
        is_current: true,
        group_probability_percent: spawn,
        relative_probability_percent: occurrence,
        quality_min: 501,
        quality_max: 1000,
        quality_quantized_values: [588, 796, 1000]
      }]
    }]
  };
}
const lagrangeRaw = clone(fixture.commodities.ship);
lagrangeRaw.locations = [
  primaryLocation("arc-l1", "ARC L1", 20, 30),
  primaryLocation("arc-l2", "ARC L2", 20, 30),
  primaryLocation("arc-l3", "ARC L3", 19, 30)
];
let lagrangeRecommendation = model.buildMiningFarmRecommendations(model.normalizeMiningCommodity(lagrangeRaw, provenance), ["Stanton System"]);
let bestSpace = lagrangeRecommendation.systems.find(system => system.system === "Stanton System").methods[0];
assert.equal(bestSpace.allLagrangePoints, false);
assert.equal(bestSpace.locationLabel, "Lagrange D");
assert.equal(bestSpace.locationSummary, "ARC-L1 · ARC-L2");
lagrangeRaw.locations = lagrangeRaw.locations.slice(0, 2);
lagrangeRecommendation = model.buildMiningFarmRecommendations(model.normalizeMiningCommodity(lagrangeRaw, provenance), ["Stanton System"]);
bestSpace = lagrangeRecommendation.systems.find(system => system.system === "Stanton System").methods[0];
assert.equal(bestSpace.allLagrangePoints, true);
assert.equal(bestSpace.locationLabel, "Lagrange D");
assert.notEqual(bestSpace.locationLabel, "All Lagrange Points", "A provider-család rövid neve olvashatóbb az általános All Lagrange labelnél.");

// 10. C002 presentation grouping is provider/resource/parent gated and keeps the full raw list.
function groupingLocation({ uuid, name, provider, system = "Pyro System", type = "Asteroid", parentUuid = "pyro-star", parentName = "Pyro", resourceUuid = "resource-aluminum", spawn = 10, occurrence = 2 }) {
  return {
    uuid,
    name,
    system,
    type,
    parent_name: parentName,
    parent_type: "Star",
    parent_uuid: parentUuid,
    resources: [{
      key: "MineableRock_AsteroidCommon_Aluminum",
      resource_uuid: resourceUuid,
      label: "Aluminum",
      group_name: "SpaceShip_Mineables",
      resource_kind: "mineable",
      provider_names: [provider],
      materials: [{
        key: "Ore_Aluminum",
        name: "Aluminum (Ore)",
        uuid: "grouping-aluminum",
        is_current: true,
        group_probability_percent: spawn,
        relative_probability_percent: occurrence,
        quality_min: 501,
        quality_max: 1000,
        quality_quantized_values: [588, 796, 1000]
      }]
    }]
  };
}
const pyroGroupingRaw = {
  uuid: "grouping-aluminum",
  key: "Ore_Aluminum",
  name: "Aluminum (Ore)",
  kind: "mineable",
  has_ship_mineables: true,
  systems: ["Pyro System"],
  locations: [
    groupingLocation({ uuid: "akiro", name: "Akiro Cluster", provider: "HPP_Pyro_AkiroCluster", type: "Asteroid_ValidQT" }),
    groupingLocation({ uuid: "rab", name: "RAB-TUNG", provider: "HPP_Pyro_DeepSpaceAsteroids" }),
    groupingLocation({ uuid: "rmb-1", name: "RMB-1-01", provider: "HPP_Pyro_DeepSpaceAsteroids" }),
    groupingLocation({ uuid: "rmb-2", name: "RMB-2-01", provider: "HPP_Pyro_DeepSpaceAsteroids" })
  ]
};
const pyroGrouped = model.buildMiningFarmRecommendations(model.normalizeMiningCommodity(pyroGroupingRaw, provenance), ["Pyro System"]).systems[0].methods[0];
assert.equal(pyroGrouped.locationLabel, "Pyro Deep Space Asteroids");
assert.equal(pyroGrouped.locationSummary, "Akiro Cluster, RAB és RMB helyszínek");
assert.equal(pyroGrouped.presentation.groups[0].evidence.kind, "VERIFIED_API_PROVIDER_FAMILY");
assert.deepEqual(Array.from(pyroGrouped.locationNames), ["Akiro Cluster", "RAB-TUNG", "RMB-1-01", "RMB-2-01"]);
assert.equal(pyroGrouped.locationLabel.includes("RMB-"), false, "A normál label nem lehet technikai névfal.");

const aluminumLagrangeRaw = clone(lagrangeRaw);
aluminumLagrangeRaw.uuid = "grouping-aluminum";
aluminumLagrangeRaw.key = "Ore_Aluminum";
aluminumLagrangeRaw.name = "Aluminum (Ore)";
aluminumLagrangeRaw.locations = [
  primaryLocation("hur-l2", "HUR L2", 30, 10.3, { provider: "HPP_Lagrange_F" }),
  primaryLocation("arc-l1", "ARC L1", 30, 10.3, { provider: "HPP_Lagrange_F" }),
  primaryLocation("arc-l2", "ARC L2", 30, 10.3, { provider: "HPP_Lagrange_F" }),
  primaryLocation("arc-l4", "ARC L4", 30, 10.3, { provider: "HPP_Lagrange_F" })
].map(location => {
  location.resources[0].label = "Aluminum";
  location.resources[0].key = "MineableRock_AsteroidCommon_Aluminum";
  location.resources[0].resource_uuid = "resource-aluminum";
  location.resources[0].materials[0].uuid = "grouping-aluminum";
  location.resources[0].materials[0].name = "Aluminum (Ore)";
  return location;
});
const aluminumLagrange = model.buildMiningFarmRecommendations(model.normalizeMiningCommodity(aluminumLagrangeRaw, provenance), ["Stanton System"]).systems.find(system => system.system === "Stanton System").methods[0];
assert.equal(aluminumLagrange.locationLabel, "Lagrange F");
assert.equal(aluminumLagrange.locationSummary, "ARC-L1 · ARC-L2 · ARC-L4 · HUR-L2");

const unrelatedRaw = clone(pyroGroupingRaw);
unrelatedRaw.locations = [
  groupingLocation({ uuid: "terminus", name: "Terminus", provider: "HPP_Pyro6", type: "Moon", parentUuid: "pyro-6", parentName: "Pyro VI" }),
  groupingLocation({ uuid: "vuur", name: "Vuur", provider: "HPP_Pyro5f", type: "Moon", parentUuid: "pyro-5", parentName: "Pyro V" })
];
const unrelated = model.buildMiningFarmRecommendations(model.normalizeMiningCommodity(unrelatedRaw, provenance), ["Pyro System"]).systems[0].methods[0];
assert.equal(unrelated.locationLabel, "2 azonos rangú farmhely");
assert.equal(unrelated.presentation.groups.length, 2, "Eltérő provider/parent családot nem szabad egy csoporttá mosni.");
assert.ok(unrelated.presentation.groups.every(group => group.evidence.kind === "SINGLE_LOCATION"));

const singleRaw = clone(pyroGroupingRaw);
singleRaw.locations = [groupingLocation({ uuid: "single", name: "Keeger Belt", provider: "HPP_Nyx_KeegerBelt", system: "Nyx System", parentUuid: "nyx-star", parentName: "Nyx" })];
singleRaw.systems = ["Nyx System"];
const singleWinner = model.buildMiningFarmRecommendations(model.normalizeMiningCommodity(singleRaw, provenance), ["Nyx System"]).systems[0].methods[0];
assert.equal(singleWinner.locationLabel, "Keeger Belt");
assert.equal(singleWinner.locationSummary, "1 nyertes location");

// 11. Actual-schema common/uncommon/legendary fixtures cover Nyx, Stanton, Pyro, surface and space.
const common = model.normalizeMiningCommodity(fixture.recommendationCommodities.common, provenance);
const legendary = model.normalizeMiningCommodity(fixture.recommendationCommodities.legendary, provenance);
assert.equal(model.buildMiningFarmRecommendations(common, fixture.knownSystems).systems.find(system => system.system === "Nyx System").methods[0].locationLabel, "Keeger Belt");
const legendaryPyro = model.buildMiningFarmRecommendations(legendary, fixture.knownSystems).systems.find(system => system.system === "Pyro System");
assert.equal(legendaryPyro.methods.find(method => method.category === model.environments.NORMAL).locationLabel, "Pyro IV");
assert.equal(legendaryPyro.methods.find(method => method.category === model.environments.SPACE).locationLabel, "Akiro Cluster");

// 12–13. Head module dropdown count comes from the current item detail.
assert.equal(model.normalizeMiningHeadDetail(fixture.heads.oneSlot, provenance).moduleSlotCount, 1);
assert.equal(model.normalizeMiningHeadDetail(fixture.heads.threeSlot, provenance).moduleSlotCount, 3);
assert.equal(model.resizeMiningModules([], 1, prefix => `${prefix}-1`).length, 1);
assert.equal(model.resizeMiningModules([], 5, prefix => `${prefix}-x`).length, 5, "A modell nem lehet három modulra hardcode-olva.");

// 12. The real MOLE-style port tree exposes three independent mining stations.
const mole = model.normalizeMiningVehicleDetail(fixture.mole, provenance);
assert.equal(mole.stationCount, 3);
assert.equal(mole.stationCountSource, "API_PORT_EQUIPPED_ITEM");
assert.equal(model.resizeMiningStations([], mole.stationCount, prefix => `${prefix}-${Math.random()}`).length, 3);

// 13–14. Multiple material loadouts and exactly one chosen default are supported.
const loadouts = [
  { id: "safe", materialUuid: fixture.commodities.ship.uuid, name: "MOLE Safe", isDefault: true, vehicle: {}, stations: [], gadgets: [] },
  { id: "crew", materialUuid: fixture.commodities.ship.uuid, name: "MOLE Crew", isDefault: false, vehicle: {}, stations: [], gadgets: [] }
];
assert.equal(loadouts.filter(loadout => loadout.materialUuid === fixture.commodities.ship.uuid).length, 2);
const switched = model.setDefaultMiningLoadout(loadouts, fixture.commodities.ship.uuid, "crew");
assert.deepEqual(Array.from(switched, loadout => [loadout.id, loadout.isDefault]), [["safe", false], ["crew", true]]);

// 15. Gadget count is arbitrary.
const manyGadgets = Array.from({ length: 12 }, (_, index) => ({ id: `g-${index}`, uuid: fixture.catalog.gadgets[0].uuid, name: "BoreMax" }));
const gadgetLoadout = { id: "gadgets", materialUuid: fixture.commodities.ship.uuid, vehicle: {}, stations: [], gadgets: manyGadgets };
assert.equal(model.reconcileMiningLoadout(gadgetLoadout, fixture.catalog).availability.gadgets.length, 12);

// 16. Equipment removed from Game Data stays in User Data and is marked missing.
const missingLoadout = {
  id: "missing",
  materialUuid: fixture.commodities.ship.uuid,
  vehicle: { uuid: "removed-vehicle", name: "Old Miner" },
  stations: [{ id: "s1", head: { uuid: "removed-head", name: "Old Head" }, modules: [{ id: "m1", uuid: "removed-module", name: "Old Module" }] }],
  gadgets: [{ id: "g1", uuid: "removed-gadget", name: "Old Gadget" }]
};
const missingBefore = JSON.stringify(missingLoadout);
const reconciled = model.reconcileMiningLoadout(missingLoadout, fixture.catalog);
assert.equal(JSON.stringify(missingLoadout), missingBefore, "A reconcile nem módosíthatja a mentett loadoutot.");
assert.equal(reconciled.availability.vehicle, "MISSING_CURRENT_GAME_DATA");
assert.equal(reconciled.availability.stations[0].head, "MISSING_CURRENT_GAME_DATA");
assert.equal(reconciled.availability.stations[0].modules[0].status, "MISSING_CURRENT_GAME_DATA");
assert.equal(reconciled.availability.gadgets[0].status, "MISSING_CURRENT_GAME_DATA");

// 17. A simulated Game Data replacement cannot mutate the loadout snapshot; browser code also has the fingerprint guard.
const userSnapshot = JSON.stringify({ loadouts: clone(loadouts), missing: clone(missingLoadout) });
model.normalizeMiningCommodityIndex(fixture.commodities.vehicle, provenance);
model.normalizeMiningVehicleDetail(fixture.mole, provenance);
assert.equal(JSON.stringify({ loadouts: clone(loadouts), missing: clone(missingLoadout) }), userSnapshot);
assert.match(html, /miningLoadoutFingerprintPreserved/, "Az M3 loadout fingerprint guard hiányzik a Game Data syncből.");

const performanceCommodityRaw = {
  uuid: "performance-commodity",
  key: "Ore_Performance",
  name: "Performance (Ore)",
  kind: "mineable",
  has_ship_mineables: true,
  systems: ["Stanton", "Pyro", "Nyx"],
  locations: Array.from({ length: 5000 }, (_, index) => ({
    uuid: `perf-${index}`,
    name: `Location ${index}`,
    system: ["Stanton", "Pyro", "Nyx"][index % 3],
    type: index % 2 ? "Moon" : "Asteroid",
    resources: [{
      key: `MineableRock_${index % 2 ? "Surface" : "Asteroid"}Common_Performance`,
      label: "Performance",
      group_name: "SpaceShip_Mineables",
      materials: [{
        uuid: "performance-commodity",
        is_current: true,
        group_probability_percent: index % 71,
        relative_probability_percent: index % 101,
        quality_min: 500,
        quality_max: 500 + (index % 501),
        quality_quantized_values: [500 + (index % 501)]
      }]
    }]
  }))
};
const performanceStarted = performance.now();
const performanceCommodity = model.normalizeMiningCommodity(performanceCommodityRaw, provenance);
const performanceRanking = model.buildMiningFarmRecommendations(performanceCommodity, ["Stanton", "Pyro", "Nyx"]).systems;
const performanceDurationMs = performance.now() - performanceStarted;
assert.equal(performanceRanking.length, 3);
assert.ok(performanceDurationMs < 500, `Az M3 location ranking túl lassú: ${performanceDurationMs.toFixed(1)} ms`);

console.log("M3_MINING_TEST_PASS");
console.log(JSON.stringify({
  mandatoryCases: 33,
  realFixtures: ["Aluminum (Ore)", "Agricium (Ore)", "Stileron (Ore)", "Beradom", "Aphorite", "Bluemoon Fungus", "Arbor MH1", "Helix II", "MOLE"],
  performance: { locations: 5000, durationMs: Number(performanceDurationMs.toFixed(2)) }
}, null, 2));
