import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const htmlPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixtureDirectory = path.join(projectDirectory, "tests", "fixtures");
const html = fs.readFileSync(htmlPath, "utf8");
const modelMatch = html.match(/\/\* M1_PURE_MODEL_START \*\/([\s\S]*?)\/\* M1_PURE_MODEL_END \*\//);

assert.ok(modelMatch, "Az M1 tiszta modell blokk nem található a fő HTML-ben.");

const context = vm.createContext({
  console,
  nowIso: () => "2026-08-22T06:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});

vm.runInContext(`${modelMatch[1]}
globalThis.__MODEL__ = {
  deriveQualityCapability,
  normalizeOutputTypeFilters,
  normalizeBlueprintIndex,
  normalizeBlueprint
};`, context, { filename: "spg-m1-model.js" });

const model = context.__MODEL__;
const readFixture = (filename) => JSON.parse(fs.readFileSync(path.join(fixtureDirectory, filename), "utf8"));
const provenanceFor = (raw) => ({
  rawBlueprintUuid: raw.uuid,
  gameVersion: raw.game_version,
  dataSource: "Star Citizen Wiki API",
  source: `https://api.star-citizen.wiki/api/blueprints/${raw.uuid}`,
  fetchedAt: "2026-08-22T06:00:00.000Z",
  origin: "API",
  rawCacheKey: `${raw.game_version}::${raw.uuid}`
});

const js300Raw = readFixture("js-300-blueprint.json");
const js300 = model.normalizeBlueprint(js300Raw, provenanceFor(js300Raw));

assert.equal(js300.uuid, "9585b0dc-b660-4e2a-9136-0092af1e72c1");
assert.equal(js300.recipeSlots.length, 3, "A JS-300 három külön recipe slotja kötelező.");
assert.deepEqual(
  Array.from(js300.recipeSlots, (slot) => slot.recipeSlotKey),
  ["SHELL", "VOLTAGE REGULATOR", "STATOR CORES"]
);
assert.deepEqual(
  Array.from(js300.recipeSlots, (slot) => slot.ingredientUuid),
  [
    "8cd317a3-df9b-4315-8ac3-0f1fca42dfd4",
    "93c8b7df-d6ac-4b4f-a115-b0e3afc238b8",
    "4a47cad8-0271-4048-b19b-d9b52521fc20"
  ]
);
assert.deepEqual(Array.from(js300.recipeSlots, (slot) => slot.requiredQuantityUnits), [3500, 1400, 2400]);
assert.deepEqual(Array.from(js300.recipeSlots, (slot) => slot.unit), ["SCU", "SCU", "SCU"]);
assert.equal(js300.recipeSlots.filter((slot) => slot.qualityCapability === "DYNAMIC").length, 1);
assert.equal(js300.recipeSlots.filter((slot) => slot.qualityCapability === "FIXED").length, 2);
assert.ok(js300.recipeSlots.every((slot) => slot.provenance.rawBlueprintUuid === js300.uuid));
assert.ok(js300.recipeSlots.every((slot) => slot.ingredient.provenance.fetchedAt));
assert.ok(!Object.hasOwn(js300, "raw"), "A normalizált rekord nem tartalmazhat raw API payloadot.");

const hofstedeRaw = readFixture("hofstede-s1-blueprint.json");
const hofstede = model.normalizeBlueprint(hofstedeRaw, provenanceFor(hofstedeRaw));
assert.deepEqual(Array.from(hofstede.recipeSlots, (slot) => slot.unit), ["SCU", "ITEM", "SCU"]);
assert.equal(hofstede.recipeSlots[1].requiredQuantityUnits, 7, "Az item darabszám nem alakítható SCU-vá.");
assert.equal(hofstede.recipeSlots[1].ingredient.itemUuid, "51b456cd-e73e-42a8-b36e-0bf6fbe29ce6");

const duplicateRaw = readFixture("duplicate-material-blueprint.json");
const duplicate = model.normalizeBlueprint(duplicateRaw, provenanceFor(duplicateRaw));
assert.equal(duplicate.recipeSlots.length, 2, "Az azonos material két slotját tilos összevonni.");
assert.equal(duplicate.recipeSlots[0].ingredientUuid, duplicate.recipeSlots[1].ingredientUuid);
assert.notEqual(duplicate.recipeSlots[0].id, duplicate.recipeSlots[1].id);
assert.notEqual(duplicate.recipeSlots[0].recipeSlotKey, duplicate.recipeSlots[1].recipeSlotKey);
assert.deepEqual(Array.from(duplicate.recipeSlots, (slot) => slot.requiredQuantityUnits), [1000, 2000]);

const unknownRaw = structuredClone(duplicateRaw);
delete unknownRaw.aspects.aspects[0].has_dynamic_modifiers;
const unknown = model.normalizeBlueprint(unknownRaw, provenanceFor(unknownRaw));
assert.equal(unknown.recipeSlots[0].qualityCapability, "UNKNOWN", "Bizonytalan Quality capability csak UNKNOWN lehet.");

const indexRecord = model.normalizeBlueprintIndex(js300Raw, js300Raw.game_version, "2026-08-22T06:00:00.000Z");
assert.equal(indexRecord.cacheKey, `${js300Raw.game_version}::${js300Raw.uuid}`);
assert.equal(indexRecord.outputType, "PowerPlant");
assert.equal(indexRecord.provenance.apiUuid, js300Raw.uuid);

const filters = model.normalizeOutputTypeFilters({
  filters: { "output.type": [{ value: "PowerPlant", label: "Power Plant", count: 75 }] }
});
assert.deepEqual(JSON.parse(JSON.stringify(filters)), [{ value: "PowerPlant", label: "Power Plant", count: 75 }]);

console.log("M1_MODEL_TEST_PASS");
console.log(JSON.stringify({
  js300: { slots: 3, dynamic: 1, fixed: 2 },
  hofstede: { units: ["SCU", "ITEM", "SCU"] },
  duplicateMaterial: { sourceOccurrences: 1, normalizedSlots: 2 },
  unknownCapability: "UNKNOWN"
}, null, 2));
