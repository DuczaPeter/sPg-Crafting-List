import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const fixtureDirectory = path.join(projectDirectory, "tests", "fixtures");
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const m1Match = html.match(/\/\* M1_PURE_MODEL_START \*\/([\s\S]*?)\/\* M1_PURE_MODEL_END \*\//);
const m2Match = html.match(/\/\* M2_ALLOCATION_ENGINE_START \*\/([\s\S]*?)\/\* M2_ALLOCATION_ENGINE_END \*\//);

assert.ok(m1Match, "Az M1 modellblokk hiányzik.");
assert.ok(m2Match, "Az M2 Allocation Engine blokk hiányzik.");

const context = vm.createContext({
  console,
  nowIso: () => "2026-08-22T07:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});

vm.runInContext(`${m1Match[1]}
${m2Match[1]}
globalThis.__M2__ = {
  normalizeBlueprint,
  classifyRequirementQuality,
  resolveRequirementQualityRule,
  allocateCardsDeterministically,
  rules: M2_QUALITY_RULES
};`, context, { filename: "spg-m2-engine.js" });

const engine = context.__M2__;
const fixture = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, "m2-allocation-cases.json"), "utf8"));
const clone = (value) => structuredClone(value);
const batch = (quality, quantityUnits = 1000, materialUuid = fixture.materialUuid, suffix = String(quality)) => ({
  id: `batch-${materialUuid.slice(0, 4)}-${suffix}`,
  materialUuid,
  materialName: "Fixture Material",
  quality,
  quantityUnits,
  unit: "SCU",
  createdAt: `2026-08-22T07:00:${String(Math.abs(Number(quality) || 0) % 60).padStart(2, "0")}.000Z`
});
const card = (id, requirement, configuration = null, order = 0) => ({
  id,
  order,
  active: true,
  quantity: 1,
  outputName: id,
  blueprintUuid: `blueprint-${id}`,
  requirements: [clone(requirement)],
  slotStrategies: configuration ? { [requirement.id]: configuration } : {}
});
const allocationFor = (result, cardId, slotId) => result.cards.find((item) => item.cardId === cardId)
  .requirements.find((item) => item.recipeSlotId === slotId);

// 1. HP-only: the lowest batch at or above Q500 must be first.
const hpBatches = fixture.qualitySets.hp.map((quality) => batch(quality));
const hpResult = engine.allocateCardsDeterministically([card("hp-card", fixture.hpRequirement)], hpBatches);
const hpAllocation = allocationFor(hpResult, "hp-card", fixture.hpRequirement.id);
assert.equal(hpAllocation.rule, engine.rules.HP_MIN_500);
assert.equal(hpAllocation.allocatedBatches[0].quality, 517);
assert.equal(hpResult.trace[0].available.find((item) => item.quality === 480).decision, "QUALITY_BELOW_500");

// 2. Target Q850: Q860 is the lowest acceptable batch.
const targetBatches = fixture.qualitySets.target.map((quality) => batch(quality));
const targetCard = card("target-card", fixture.baseRequirement, { mode: engine.rules.TARGET_Q, targetQuality: 850 });
const targetResult = engine.allocateCardsDeterministically([targetCard], targetBatches);
const targetAllocation = allocationFor(targetResult, "target-card", fixture.baseRequirement.id);
assert.equal(targetAllocation.allocatedBatches[0].quality, 860);
assert.equal(targetResult.trace[0].available.find((item) => item.quality === 820).decision, "QUALITY_BELOW_TARGET");

// 3. Highest Q: Q930 is first.
const highestBatches = fixture.qualitySets.highest.map((quality) => batch(quality));
const highestResult = engine.allocateCardsDeterministically([card("highest-card", fixture.baseRequirement)], highestBatches);
assert.equal(allocationFor(highestResult, "highest-card", fixture.baseRequirement.id).allocatedBatches[0].quality, 930);

// 4. The same material in two slots keeps independent rules and allocations.
const functionalSecondSlot = Object.assign(clone(fixture.baseRequirement), {
  id: "fixture-blueprint:aspect:functional",
  aspectIndex: 1,
  recipeSlotName: "Functional Core"
});
const duplicateCard = {
  id: "duplicate-card",
  order: 0,
  active: true,
  quantity: 1,
  outputName: "Duplicate material fixture",
  requirements: [clone(fixture.hpRequirement), functionalSecondSlot],
  slotStrategies: { [functionalSecondSlot.id]: { mode: engine.rules.HIGHEST_Q } }
};
const duplicateResult = engine.allocateCardsDeterministically(
  [duplicateCard],
  [batch(517, 1000, fixture.materialUuid, "dup-517"), batch(950, 1000, fixture.materialUuid, "dup-950")]
);
assert.equal(allocationFor(duplicateResult, "duplicate-card", fixture.hpRequirement.id).allocatedBatches[0].quality, 517);
assert.equal(allocationFor(duplicateResult, "duplicate-card", functionalSecondSlot.id).allocatedBatches[0].quality, 950);
assert.equal(duplicateResult.cards[0].requirements.length, 2);

// 5. Insufficient quantity produces an exact amount shortage and bottleneck.
const largeRequirement = Object.assign(clone(fixture.baseRequirement), { requiredQuantityUnits: 5000 });
const amountResult = engine.allocateCardsDeterministically(
  [card("amount-card", largeRequirement)],
  [batch(930, 3000, fixture.materialUuid, "amount")]
);
const amountAllocation = allocationFor(amountResult, "amount-card", largeRequirement.id);
assert.equal(amountAllocation.missingAmountUnits, 2000);
assert.equal(amountAllocation.missingQualityUnits, 0);
assert.equal(amountAllocation.status, "INSUFFICIENT_QUANTITY");
assert.equal(amountAllocation.bottleneck, true);

// 6. Enough quantity below target is a Quality shortage, never a plain amount shortage.
const qualityResult = engine.allocateCardsDeterministically(
  [card("quality-card", largeRequirement, { mode: engine.rules.TARGET_Q, targetQuality: 850 })],
  [batch(820, 10000, fixture.materialUuid, "quality")]
);
const qualityAllocation = allocationFor(qualityResult, "quality-card", largeRequirement.id);
assert.equal(qualityAllocation.missingAmountUnits, 0);
assert.equal(qualityAllocation.missingQualityUnits, 5000);
assert.equal(qualityAllocation.status, "INSUFFICIENT_QUALITY");
assert.equal(qualityAllocation.allocatedBatches.length, 0);

// 7. Card order deterministically changes reservations.
const priorityRequirement = Object.assign(clone(fixture.baseRequirement), { requiredQuantityUnits: 8000 });
const priorityBatches = [
  batch(930, 10000, fixture.materialUuid, "priority-930"),
  batch(850, 6000, fixture.materialUuid, "priority-850")
];
const cardsAB = [card("card-a", priorityRequirement, null, 0), card("card-b", priorityRequirement, null, 1)];
const cardsBA = [card("card-a", priorityRequirement, null, 1), card("card-b", priorityRequirement, null, 0)];
const beforeInventory = JSON.stringify(priorityBatches);
const resultAB = engine.allocateCardsDeterministically(cardsAB, priorityBatches);
const resultABRepeat = engine.allocateCardsDeterministically(cardsAB, priorityBatches);
const resultBA = engine.allocateCardsDeterministically(cardsBA, priorityBatches);
assert.equal(JSON.stringify(resultAB), JSON.stringify(resultABRepeat), "Azonos inputból bitazonos JSON allocation szükséges.");
assert.equal(JSON.stringify(priorityBatches), beforeInventory, "Az allocation csak tervezhet, batch-et nem módosíthat.");
assert.deepEqual(Array.from(allocationFor(resultAB, "card-a", priorityRequirement.id).allocatedBatches, (item) => item.quality), [930]);
assert.deepEqual(Array.from(allocationFor(resultAB, "card-b", priorityRequirement.id).allocatedBatches, (item) => item.quality), [930, 850]);
assert.deepEqual(Array.from(allocationFor(resultBA, "card-b", priorityRequirement.id).allocatedBatches, (item) => item.quality), [930]);

// FIXED ignores a supplied strategy; UNKNOWN never guesses.
const fixedRequirement = Object.assign(clone(fixture.baseRequirement), { qualityCapability: "FIXED" });
const fixedResult = engine.allocateCardsDeterministically(
  [card("fixed-card", fixedRequirement, { mode: engine.rules.TARGET_Q, targetQuality: 999 })],
  [batch(null, 1000, fixture.materialUuid, "fixed")]
);
assert.equal(allocationFor(fixedResult, "fixed-card", fixedRequirement.id).rule, engine.rules.FIXED);
assert.equal(allocationFor(fixedResult, "fixed-card", fixedRequirement.id).satisfied, true);

const unknownRequirement = Object.assign(clone(fixture.baseRequirement), { affectedStats: [] });
const unknownResult = engine.allocateCardsDeterministically(
  [card("unknown-card", unknownRequirement)],
  [batch(999, 1000, fixture.materialUuid, "unknown")]
);
assert.equal(allocationFor(unknownResult, "unknown-card", unknownRequirement.id).status, "QUALITY_UNKNOWN");
assert.equal(allocationFor(unknownResult, "unknown-card", unknownRequirement.id).allocatedBatches.length, 0);

// Real normalized blueprints keep the expected slot-level default rules.
const provenanceFor = (raw) => ({
  rawBlueprintUuid: raw.uuid,
  gameVersion: raw.game_version,
  dataSource: "Star Citizen Wiki API",
  source: `https://api.star-citizen.wiki/api/blueprints/${raw.uuid}`,
  fetchedAt: "2026-08-22T07:00:00.000Z",
  origin: "API",
  rawCacheKey: `${raw.game_version}::${raw.uuid}`
});
const js300Raw = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, "js-300-blueprint.json"), "utf8"));
const hofstedeRaw = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, "hofstede-s1-blueprint.json"), "utf8"));
const js300 = engine.normalizeBlueprint(js300Raw, provenanceFor(js300Raw));
const hofstede = engine.normalizeBlueprint(hofstedeRaw, provenanceFor(hofstedeRaw));
assert.deepEqual(Array.from(js300.recipeSlots, (slot) => engine.classifyRequirementQuality(slot).mode), ["HP_MIN_500", "FIXED", "FIXED"]);
assert.deepEqual(Array.from(hofstede.recipeSlots, (slot) => engine.classifyRequirementQuality(slot).mode), ["HP_MIN_500", "HIGHEST_Q", "HIGHEST_Q"]);

// Larger deterministic workload: 1,000 batches and 100 cards, three slots each.
const performanceMaterials = Array.from({ length: 20 }, (_, index) => `perf-material-${String(index).padStart(2, "0")}`);
const performanceBatches = Array.from({ length: 1000 }, (_, index) => batch(
  500 + (index % 501),
  5000,
  performanceMaterials[index % performanceMaterials.length],
  `perf-${String(index).padStart(4, "0")}`
));
const performanceCards = Array.from({ length: 100 }, (_, cardIndex) => ({
  id: `perf-card-${String(cardIndex).padStart(3, "0")}`,
  order: cardIndex,
  active: true,
  quantity: 2,
  outputName: "Performance fixture",
  requirements: Array.from({ length: 3 }, (_, slotIndex) => Object.assign(clone(fixture.baseRequirement), {
    id: `perf-card-${cardIndex}:slot:${slotIndex}`,
    aspectIndex: slotIndex,
    ingredientUuid: performanceMaterials[(cardIndex * 3 + slotIndex) % performanceMaterials.length],
    requiredQuantityUnits: 250
  })),
  slotStrategies: {}
}));
const performanceStarted = performance.now();
const performanceResult = engine.allocateCardsDeterministically(performanceCards, performanceBatches);
const performanceDurationMs = performance.now() - performanceStarted;
assert.equal(performanceResult.cards.length, 100);
assert.equal(performanceResult.summary.requirementCount, 300);
assert.ok(performanceDurationMs < 1500, `Az M2 nagy fixture túl lassú: ${performanceDurationMs.toFixed(1)} ms`);

// The Game Data sync fingerprint guard is part of the browser implementation.
assert.match(html, /userDataFingerprintPreserved/, "A Game Data/User Data fingerprint guard hiányzik a fő alkalmazásból.");

console.log("M2_ALLOCATION_TEST_PASS");
console.log(JSON.stringify({
  mandatoryCases: 8,
  js300Rules: ["HP_MIN_500", "FIXED", "FIXED"],
  hofstedeRules: ["HP_MIN_500", "HIGHEST_Q", "HIGHEST_Q"],
  deterministicPriority: true,
  performance: {
    batches: 1000,
    cards: 100,
    requirements: 300,
    durationMs: Number(performanceDurationMs.toFixed(2))
  }
}, null, 2));
