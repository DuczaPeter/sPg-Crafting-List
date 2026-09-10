import assert from "node:assert/strict";
import crypto, { webcrypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v004-c003-reservation.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C004.4");
const evidencePath = path.join(artifactDirectory, "model-evidence.json");
const appBuffer = fs.readFileSync(appPath);
const appHtml = appBuffer.toString("utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const clone = value => JSON.parse(JSON.stringify(value));

function block(name) {
  const startMarker = `/* ${name}_START */`;
  const endMarker = `/* ${name}_END */`;
  const start = appHtml.indexOf(startMarker);
  const end = appHtml.indexOf(endMarker);
  assert.ok(start >= 0 && end > start, `Missing model block: ${name}`);
  return appHtml.slice(start, end + endMarker.length);
}

const m4Block = block("M4_COMBINED_BACKUP_MODEL");
const m4Foundation = m4Block.slice(0, m4Block.indexOf("function buildCombinedCanonicalMaterialLookup"));
const context = vm.createContext({
  console,
  crypto: webcrypto,
  TextEncoder,
  Uint8Array,
  Map,
  Set,
  Number,
  Object,
  Array,
  JSON,
  String,
  RegExp,
  Math,
  Date,
  BigInt
});
vm.runInContext(`
  function hasValidQuality(value) { return Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 1000; }
  function isUserSettingRecord(record) { return Boolean(record && (record.scope === "USER" || String(record.key || "").indexOf("user:") === 0)); }
  function compareStableIdentity(a, b) { return String(a && a.id || "").localeCompare(String(b && b.id || "")); }
  var MATERIAL_QUALITY_PLAN_SETTING_KEY = "user:materialQualityPlans";
  var MATERIAL_QUALITY_POOL_SETTING_KEY = "user:materialQualityPools";
  ${block("V004_C002_MIGRATION_MODEL")}
  ${m4Foundation}
  ${block("V004_C003_REVISION_RESERVATION_MODEL")}
  ${block("V004_C004_ATOMIC_CRAFT_COMPLETE_MODEL")}
  globalThis.__C0044__ = {
    evidence: v004BuildExactRequirementQuantityEvidence,
    normalizeRequirement: v004NormalizeRequirementExactEvidence,
    hasExactInput: v004RequirementHasExactCraftRunInput,
    cardEvidence: v004CardCraftRunInputEvidence,
    buildPayload: buildV004ReservationCanonicalPayload,
    capability: buildV004ReservationCapability,
    normalizationStatus: V004_QUANTITY_NORMALIZATION_STATUS,
    inputEvidence: V004_CRAFT_RUN_INPUT_EVIDENCE,
    exactness: V004_REQUIREMENT_QUANTITY_EXACTNESS,
    scuRule: V004_SCU_NORMALIZATION_RULE,
    itemRule: V004_ITEM_NORMALIZATION_RULE
  };
`, context);

const model = context.__C0044__;
const exactScuCases = [
  { source: 0.0001, normalizedScu: "0.0001", units: 1 },
  { source: 0.0002, normalizedScu: "0.0002", units: 2 },
  { source: 0.01, normalizedScu: "0.0100", units: 100 },
  { source: 0.07, normalizedScu: "0.0700", units: 700 },
  { source: 0.11, normalizedScu: "0.1100", units: 1100 },
  { source: 0.14, normalizedScu: "0.1400", units: 1400 },
  { source: 0.35, normalizedScu: "0.3500", units: 3500 },
  { source: 3.1, normalizedScu: "3.1000", units: 31000 },
  { source: 0.11000000000000001, normalizedScu: "0.1100", units: 1100 },
  { source: 3.0999999999999996, normalizedScu: "3.1000", units: 31000 },
  { source: 0.12344, normalizedScu: "0.1234", units: 1234 },
  { source: 0.12345, normalizedScu: "0.1235", units: 1235 },
  { source: 0.00005, normalizedScu: "0.0001", units: 1 }
];
for (const testCase of exactScuCases) {
  const result = clone(model.evidence(testCase.source, "SCU"));
  assert.equal(result.sourceQuantityCanonicalDecimal, String(testCase.source));
  assert.equal(result.normalizedQuantityText, testCase.normalizedScu);
  assert.equal(result.normalizedRequiredQuantityUnits, testCase.units);
  assert.equal(result.exactRequiredQuantityUnits, testCase.units);
  assert.equal(result.normalizedUnitText, String(testCase.units));
  assert.equal(result.quantityNormalizationStatus, "NORMALIZED_EXACT_INTEGER_UNITS");
  assert.equal(result.quantityNormalizationRule, "SCU_4DP_HALF_UP_V1");
  assert.equal(result.quantityExactness, "EXACT_SAFE_INTEGER_UNITS");
  assert.equal(result.quantityExactnessReason, null);
}

const blockedScuCases = [
  { label: "rounds to zero", source: 0.00004, reason: "ROUNDS_TO_ZERO", normalizedScu: "0.0000", normalizedUnits: 0 },
  { label: "NaN", source: Number.NaN, reason: "SOURCE_QUANTITY_NOT_FINITE" },
  { label: "Infinity", source: Number.POSITIVE_INFINITY, reason: "SOURCE_QUANTITY_NOT_FINITE" },
  { label: "negative", source: -0.1, reason: "SOURCE_QUANTITY_NOT_POSITIVE" },
  { label: "zero", source: 0, reason: "SOURCE_QUANTITY_NOT_POSITIVE" },
  { label: "unsafe units", source: 900719925474.0992, reason: "NORMALIZED_UNITS_UNSAFE" },
  { label: "scientific rounds to zero", source: 1e-7, reason: "ROUNDS_TO_ZERO", normalizedScu: "0.0000", normalizedUnits: 0 },
  { label: "scientific unsafe", source: 1e21, reason: "NORMALIZED_UNITS_UNSAFE" }
];
for (const testCase of blockedScuCases) {
  const result = clone(model.evidence(testCase.source, "SCU"));
  assert.equal(result.quantityNormalizationStatus, "NORMALIZATION_BLOCKED", testCase.label);
  assert.equal(result.exactRequiredQuantityUnits, null, testCase.label);
  assert.equal(result.quantityExactnessReason, testCase.reason, testCase.label);
  if (testCase.normalizedScu !== undefined) assert.equal(result.normalizedQuantityText, testCase.normalizedScu, testCase.label);
  if (testCase.normalizedUnits !== undefined) assert.equal(result.normalizedRequiredQuantityUnits, testCase.normalizedUnits, testCase.label);
}

const itemSeven = clone(model.evidence(7, "ITEM"));
assert.equal(itemSeven.quantityNormalizationStatus, "NORMALIZED_EXACT_INTEGER_UNITS");
assert.equal(itemSeven.normalizedRequiredQuantityUnits, 7);
assert.equal(itemSeven.quantityNormalizationRule, "ITEM_POSITIVE_SAFE_INTEGER_V1");
for (const source of [7.5, Number.NaN, Number.POSITIVE_INFINITY, -1, 0, Number.MAX_SAFE_INTEGER + 1]) {
  const result = clone(model.evidence(source, "ITEM"));
  assert.equal(result.quantityNormalizationStatus, "NORMALIZATION_BLOCKED", `ITEM ${source}`);
  assert.equal(result.exactRequiredQuantityUnits, null, `ITEM ${source}`);
}

const upgradedC0043Requirement = clone(fixture.card.requirements[0]);
upgradedC0043Requirement.sourceQuantityValue = 0.14;
upgradedC0043Requirement.requiredQuantityUnits = 1400;
upgradedC0043Requirement.exactRequiredQuantityUnits = null;
upgradedC0043Requirement.quantityExactness = "QUANTITY_UNITS_UNPROVEN";
upgradedC0043Requirement.quantityExactnessReason = "SCU_TIMES_10000_NOT_EXACT_SAFE_INTEGER";
const upgraded = clone(model.normalizeRequirement(upgradedC0043Requirement));
assert.equal(upgraded.requiredQuantityUnits, 1400);
assert.equal(upgraded.exactRequiredQuantityUnits, 1400);
assert.equal(upgraded.normalizedQuantityText, "0.1400");
assert.equal(upgraded.quantityNormalizationRule, "SCU_4DP_HALF_UP_V1");
assert.equal(model.hasExactInput(upgradedC0043Requirement), true);

function buildPayload(sourceFixture) {
  return clone(model.buildPayload({
    card: clone(sourceFixture.card),
    cardResult: clone(sourceFixture.cardResult),
    revisions: clone(sourceFixture.revisions),
    batches: clone(sourceFixture.batches),
    activeScDataVersion: sourceFixture.card.gameVersion
  }));
}

const payload = buildPayload(fixture);
assert.equal(payload.quantitySemantics, "CRAFT_RUN_COUNT");
assert.equal(payload.craftRunInputEvidence, "CRAFT_RUN_INPUTS_EXACT");
assert.equal(model.capability(payload).status, "READY");
assert.ok(payload.recipeSlots.every(slot => slot.quantityNormalizationStatus === "NORMALIZED_EXACT_INTEGER_UNITS"));
assert.ok(payload.recipeSlots.every(slot => slot.quantityNormalizationRule === "SCU_4DP_HALF_UP_V1"));

const roundsToZeroFixture = clone(fixture);
roundsToZeroFixture.card.craftRunInputEvidence = "CRAFT_RUN_INPUTS_UNPROVEN";
roundsToZeroFixture.card.requirements[0].sourceQuantityValue = 0.00004;
roundsToZeroFixture.card.requirements[0].requiredQuantityUnits = 0;
roundsToZeroFixture.card.requirements[0].exactRequiredQuantityUnits = null;
assert.throws(() => buildPayload(roundsToZeroFixture), error => error.code === "CRAFT_RUN_INPUTS_UNPROVEN");

const helperStart = appHtml.indexOf("function v004FixedScuTextFromUnitBigInt");
const helperEnd = appHtml.indexOf("function v004NormalizeRequirementExactEvidence", helperStart);
const helperSource = appHtml.slice(helperStart, helperEnd);
assert.ok(helperStart >= 0 && helperEnd > helperStart);
assert.doesNotMatch(helperSource, /Math\.(?:round|floor|ceil)|Number\.EPSILON/);
assert.match(helperSource, /remainder \* 2n >= divisor/);
assert.match(helperSource, /String\(numeric\)/);
assert.match(appHtml, /var V004_SCU_NORMALIZATION_RULE = "SCU_4DP_HALF_UP_V1"/);

const normalizeBlueprintStart = appHtml.indexOf("function normalizeBlueprint(raw, provenance)");
const normalizeBlueprintEnd = appHtml.indexOf("/* M1_PURE_MODEL_END */", normalizeBlueprintStart);
const normalizeBlueprintSource = appHtml.slice(normalizeBlueprintStart, normalizeBlueprintEnd);
assert.ok(normalizeBlueprintStart >= 0 && normalizeBlueprintEnd > normalizeBlueprintStart);
assert.doesNotMatch(normalizeBlueprintSource, /toScuUnits\(rawQuantity\)|Math\.round\(rawQuantity\)/);
assert.match(normalizeBlueprintSource, /normalizedRequiredQuantityUnits/);
assert.match(appHtml, /CRAFT_RUN_COUNT/);
assert.match(appHtml, /OUTPUT_COUNT_UNPROVEN/);
assert.doesNotMatch(appHtml, /payload\.outputCountEvidence\s*!==\s*V004_OUTPUT_COUNT_EVIDENCE\.EXACT_PER_FINISHED_ITEM/);

const documentMarkup = appHtml.slice(0, appHtml.indexOf("<script>"));
const localScriptSources = [...documentMarkup.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)]
  .map(match => match[1]).filter(value => !/^https?:/i.test(value));
const localStylesheets = [...documentMarkup.matchAll(/<link\b[^>]*rel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*href\s*=\s*["']([^"']+)["']/gi)]
  .map(match => match[1]).filter(value => !/^https?:/i.test(value));
const localRuntimeJson = [...appHtml.matchAll(/(?:fetch\s*\(|\bsrc\s*=|\bhref\s*=)\s*["']([^"']+\.json(?:[?#][^"']*)?)["']/gi)]
  .map(match => match[1]).filter(value => !/^https?:/i.test(value));
assert.match(documentMarkup, /<style\b[^>]*id="spgApplicationStyles"/i);
assert.equal(localScriptSources.length, 0);
assert.equal(localStylesheets.length, 0);
assert.equal(localRuntimeJson.length, 0);

fs.mkdirSync(artifactDirectory, { recursive: true });
const evidence = {
  cycle: "V004-C004.4",
  status: "PASS_TARGETED_MODEL",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  normalization: {
    scuRule: model.scuRule,
    itemRule: model.itemRule,
    decimalSource: "String(finiteNumber)",
    rounding: "DECIMAL_HALF_UP_4DP",
    floatRoundingCalls: 0,
    postNormalizationArithmetic: "SAFE_INTEGER_UNITS_ONLY"
  },
  exactScuCases,
  blockedScuCases: blockedScuCases.map(testCase => ({
    label: testCase.label,
    source: Number.isFinite(testCase.source) ? testCase.source : String(testCase.source),
    reason: testCase.reason
  })),
  item: {
    sevenUnits: itemSeven.normalizedRequiredQuantityUnits,
    fractionalBlocked: true,
    nonfiniteBlocked: true,
    negativeOrZeroBlocked: true,
    unsafeBlocked: true
  },
  c0043Compatibility: {
    falseNegative014Upgraded: true,
    quantitySemantics: payload.quantitySemantics,
    craftRunInputEvidence: payload.craftRunInputEvidence,
    legacySemanticsStillRequired: "LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED"
  },
  outputCardinality: {
    evidence: "OUTPUT_COUNT_UNPROVEN",
    claimed: false,
    completionGate: false
  },
  singleFile: {
    embeddedCss: true,
    embeddedJavaScript: true,
    localScriptSrc: localScriptSources.length,
    localStylesheet: localStylesheets.length,
    localRuntimeJson: localRuntimeJson.length,
    fixtureRuntimeDependencies: 0,
    applicationRuntimeFileCount: 1,
    localRuntimeSidecars: 0
  }
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V004_C0044_TARGETED_MODEL_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
