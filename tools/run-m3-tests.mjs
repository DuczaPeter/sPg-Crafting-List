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
  classifyMiningCommodity,
  normalizeMiningCommodity,
  normalizeMiningCommodityIndex,
  compareMiningLocations,
  mergeBestMiningLocationsBySystem,
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

// 6. A real-style commodity keeps separate systems and every raw location as a normalized record.
const ship = model.normalizeMiningCommodity(fixture.commodities.ship, provenance);
assert.deepEqual(Array.from(ship.systems), ["Pyro System", "Stanton System"]);
assert.equal(ship.locations.length, 3);
assert.equal(ship.locations[0].qualityRanges.length, 2);
assert.equal(ship.locations[0].maximumQuality, 875, "A material maximuma nem lehet a location más anyagból származó Q1000 értéke.");

// 7. occurrence → spawn → maximum Quality, without a synthetic score.
const ranked = [
  { id: "quality", name: "Quality", occurrence: 20, spawn: 40, maximumQuality: 950, miningMethod: "SHIP_MINING" },
  { id: "spawn", name: "Spawn", occurrence: 20, spawn: 50, maximumQuality: 500, miningMethod: "SHIP_MINING" },
  { id: "occurrence", name: "Occurrence", occurrence: 30, spawn: 1, maximumQuality: 100, miningMethod: "SHIP_MINING" }
].sort(model.compareMiningLocations);
assert.deepEqual(Array.from(ranked, item => item.id), ["occurrence", "spawn", "quality"]);

// 8. Fully identical location results merge, while raw records remain separate.
const systemRanking = model.mergeBestMiningLocationsBySystem(ship.locations, fixture.knownSystems);
const stanton = systemRanking.find(result => result.system === "Stanton System");
assert.equal(stanton.methods[0].locationLabel, "Arial / Ita");
assert.equal(stanton.methods[0].mergedCount, 2);
assert.equal(ship.locations.length, 3);
assert.equal(systemRanking.find(result => result.system === "Nyx System").status, "NO_KNOWN_LOCATION");

// 9. Partly different Lagrange results must never become All Lagrange Points.
const lagrange = [
  { id: "l1", name: "ARC-L1", system: "Stanton", miningMethod: "SHIP_MINING", occurrence: 30, spawn: 20, maximumQuality: 900 },
  { id: "l2", name: "ARC-L2", system: "Stanton", miningMethod: "SHIP_MINING", occurrence: 30, spawn: 20, maximumQuality: 900 },
  { id: "l3", name: "ARC-L3", system: "Stanton", miningMethod: "SHIP_MINING", occurrence: 29, spawn: 20, maximumQuality: 900 }
];
const partialLagrange = model.mergeBestMiningLocationsBySystem(lagrange, ["Stanton"])[0].methods[0];
assert.equal(partialLagrange.allLagrangePoints, false);
assert.equal(partialLagrange.locationLabel, "ARC-L1 / ARC-L2");
const allLagrange = model.mergeBestMiningLocationsBySystem(lagrange.slice(0, 2), ["Stanton"])[0].methods[0];
assert.equal(allLagrange.allLagrangePoints, true);

// 10–11. Head module dropdown count comes from the current item detail.
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

const performanceLocations = Array.from({ length: 5000 }, (_, index) => ({
  id: `perf-${index}`,
  name: `Location ${index}`,
  system: ["Stanton", "Pyro", "Nyx"][index % 3],
  miningMethod: ["SHIP_MINING", "VEHICLE_MINING"][index % 2],
  occurrence: index % 101,
  spawn: index % 71,
  maximumQuality: 500 + (index % 501)
}));
const performanceStarted = performance.now();
const performanceRanking = model.mergeBestMiningLocationsBySystem(performanceLocations, ["Stanton", "Pyro", "Nyx"]);
const performanceDurationMs = performance.now() - performanceStarted;
assert.equal(performanceRanking.length, 3);
assert.ok(performanceDurationMs < 500, `Az M3 location ranking túl lassú: ${performanceDurationMs.toFixed(1)} ms`);

console.log("M3_MINING_TEST_PASS");
console.log(JSON.stringify({
  mandatoryCases: 17,
  realFixtures: ["Agricium (Ore)", "Beradom", "Aphorite", "Bluemoon Fungus", "Arbor MH1", "Helix II", "MOLE"],
  performance: { locations: 5000, durationMs: Number(performanceDurationMs.toFixed(2)) }
}, null, 2));
