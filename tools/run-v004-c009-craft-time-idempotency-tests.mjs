import assert from "node:assert/strict";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { buildM1HarnessSource, loadVerifiedCandidateHtml } from "./v004-c0081-harness-loader.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const applicationPath = process.env.SPG_APP_PATH
  ? path.resolve(process.env.SPG_APP_PATH)
  : path.join(projectDirectory, "sPg Crafting List.html");
const verifiedApplication = loadVerifiedCandidateHtml({ localApplicationPath: applicationPath });
const html = verifiedApplication.html;

function uniqueIndex(source, needle, label) {
  const first = source.indexOf(needle);
  assert.notEqual(first, -1, `${label}: source anchor missing.`);
  assert.equal(first, source.lastIndexOf(needle), `${label}: duplicate source anchor.`);
  return first;
}

function markerBlock(name) {
  const startMarker = `/* ${name}_START */`;
  const endMarker = `/* ${name}_END */`;
  const start = uniqueIndex(html, startMarker, `${name} start`) + startMarker.length;
  const end = uniqueIndex(html, endMarker, `${name} end`);
  assert.ok(end > start, `${name}: invalid marker order.`);
  return html.slice(start, end);
}

function sourceRange(startAnchor, endAnchor, label) {
  const start = uniqueIndex(html, startAnchor, `${label} start`);
  const end = uniqueIndex(html, endAnchor, `${label} end`);
  assert.ok(end > start, `${label}: invalid source range.`);
  return html.slice(start, end);
}

const source = [
  buildM1HarnessSource(html),
  markerBlock("M2_ALLOCATION_ENGINE"),
  sourceRange("var V004_OUTPUT_COUNT_EVIDENCE = Object.freeze({", "var V004_REQUIREMENT_QUANTITY_EXACTNESS", "Card quantity constants"),
  sourceRange("function v004NormalizeRequirementExactEvidence(requirement) {", "function v004RevisionError", "requirement evidence normalization"),
  sourceRange("function v004NormalizeCardRevision(card) {", "function v004RequirementAllocationSemantic", "Card revision normalization"),
  sourceRange("function normalizeStoredCraftingCard(card, fallbackOrder) {", "function normalizeStoredCraftHistoryEvent(event) {", "stored Card normalization")
].join("\n");

const context = vm.createContext({
  console,
  nowIso: () => "2026-09-11T14:00:00.000Z",
  toScuUnits: value => Math.round(Number(value) * 10000)
});
vm.runInContext(`${source}\nglobalThis.__normalizeStoredCraftingCard = normalizeStoredCraftingCard;`, context, {
  filename: "spg-v004-c009-craft-time-normalizer.js"
});

const normalizeCard = context.__normalizeStoredCraftingCard;
const clone = value => JSON.parse(JSON.stringify(value));
const baseCard = {
  id: "c009-craft-time-card",
  order: 0,
  active: true,
  collapsed: false,
  quantity: 1,
  blueprintUuid: "c009-blueprint",
  outputName: "C009 craft-time fixture",
  requirements: [],
  slotStrategies: {}
};
const cases = [
  { name: "missing", present: false, expected: null },
  { name: "undefined", value: undefined, expected: null },
  { name: "null", value: null, expected: null },
  { name: "empty-string", value: "", expected: null },
  { name: "whitespace-string", value: "   ", expected: null },
  { name: "numeric-zero", value: 0, expected: 0 },
  { name: "numeric-string-zero", value: "0", expected: 0 },
  { name: "positive-integer", value: 42, expected: 42 },
  { name: "positive-decimal", value: 12.5, expected: 12.5 },
  { name: "numeric-string", value: "12.5", expected: 12.5 },
  { name: "negative-finite", value: -3.25, expected: -3.25 },
  { name: "garbage-string", value: "not-a-number", expected: null },
  { name: "nan", value: Number.NaN, expected: null },
  { name: "positive-infinity", value: Number.POSITIVE_INFINITY, expected: null },
  { name: "negative-infinity", value: Number.NEGATIVE_INFINITY, expected: null }
];

for (const testCase of cases) {
  const card = { ...baseCard };
  if (testCase.present !== false) { card.craftTimeSeconds = testCase.value; }
  const once = clone(normalizeCard(card, 0));
  const twice = clone(normalizeCard(once, 0));
  assert.equal(once.craftTimeSeconds, testCase.expected, `${testCase.name}: first normalization mismatch.`);
  assert.deepEqual(twice, once, `${testCase.name}: full Card normalization is not idempotent.`);
}

console.log("V004_C009_CRAFT_TIME_IDEMPOTENCY_PASS");
console.log(JSON.stringify({
  applicationSha256: verifiedApplication.sha256,
  applicationBytes: verifiedApplication.bytes,
  cases: cases.length,
  fullCardSecondPassChanges: 0,
  negativeFinitePreserved: true
}));
