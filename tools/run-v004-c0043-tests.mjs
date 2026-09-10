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
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C004.3");
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
  Date
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
  globalThis.__C0043__ = {
    exactEvidence: v004BuildExactRequirementQuantityEvidence,
    buildPayload: buildV004ReservationCanonicalPayload,
    capability: buildV004ReservationCapability,
    quantitySemantics: V004_QUANTITY_SEMANTICS,
    inputEvidence: V004_CRAFT_RUN_INPUT_EVIDENCE,
    exactness: V004_REQUIREMENT_QUANTITY_EXACTNESS,
    snapshotMarker: V004_RESERVATION_SNAPSHOT_MARKER,
    requestMarker: V004_CRAFT_COMPLETE_REQUEST_MARKER,
    historySchema: V004_CRAFT_HISTORY_EVENT_SCHEMA
  };
`, context);

const model = context.__C0043__;
const exactCases = [
  { label: "SCU 0.35", source: 0.35, unit: "SCU", expectedUnits: 3500 },
  { label: "SCU 0.0001", source: 0.0001, unit: "SCU", expectedUnits: 1 },
  { label: "ITEM 7", source: 7, unit: "ITEM", expectedUnits: 7 }
];
for (const testCase of exactCases) {
  const result = clone(model.exactEvidence(testCase.source, testCase.unit));
  assert.equal(result.quantityExactness, "EXACT_SAFE_INTEGER_UNITS", testCase.label);
  assert.equal(result.exactRequiredQuantityUnits, testCase.expectedUnits, testCase.label);
  assert.equal(result.quantityExactnessReason, null, testCase.label);
}

const blockedCases = [
  { label: "SCU 0.11000000000000001", source: 0.11000000000000001, unit: "SCU" },
  { label: "SCU 3.0999999999999996", source: 3.0999999999999996, unit: "SCU" },
  { label: "ITEM fractional", source: 7.5, unit: "ITEM" },
  { label: "ITEM NaN", source: Number.NaN, unit: "ITEM" },
  { label: "ITEM Infinity", source: Number.POSITIVE_INFINITY, unit: "ITEM" },
  { label: "ITEM unsafe", source: Number.MAX_SAFE_INTEGER + 1, unit: "ITEM" }
];
for (const testCase of blockedCases) {
  const result = clone(model.exactEvidence(testCase.source, testCase.unit));
  assert.equal(result.quantityExactness, "QUANTITY_UNITS_UNPROVEN", testCase.label);
  assert.equal(result.exactRequiredQuantityUnits, null, testCase.label);
}

function buildPayload(sourceFixture) {
  return clone(model.buildPayload({
    card: clone(sourceFixture.card),
    cardResult: clone(sourceFixture.cardResult),
    revisions: clone(sourceFixture.revisions),
    batches: clone(sourceFixture.batches),
    activeScDataVersion: sourceFixture.card.gameVersion
  }));
}

const diagnosticFixture = clone(fixture);
diagnosticFixture.card.outputCountEvidence = "OUTPUT_COUNT_UNPROVEN";
const exactPayload = buildPayload(diagnosticFixture);
assert.equal(exactPayload.quantitySemantics, "CRAFT_RUN_COUNT");
assert.equal(exactPayload.craftRunInputEvidence, "CRAFT_RUN_INPUTS_EXACT");
assert.equal(exactPayload.outputCountEvidence, "OUTPUT_COUNT_UNPROVEN");
assert.equal(model.capability(exactPayload).status, "READY");
assert.equal(model.capability(exactPayload).maxCompletableQuantity, 5);
assert.ok(exactPayload.recipeSlots.every(slot => Number.isSafeInteger(slot.perCraftRequiredUnits) && !Object.hasOwn(slot, "perItemRequiredUnits")));

const legacyFixture = clone(fixture);
delete legacyFixture.card.quantitySemantics;
assert.throws(() => buildPayload(legacyFixture), error => error.code === "LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED");

const nonexactFixture = clone(fixture);
nonexactFixture.card.craftRunInputEvidence = "CRAFT_RUN_INPUTS_UNPROVEN";
nonexactFixture.card.requirements[0].exactRequiredQuantityUnits = null;
nonexactFixture.card.requirements[0].quantityExactness = "QUANTITY_UNITS_UNPROVEN";
nonexactFixture.card.requirements[0].quantityExactnessReason = "SCU_TIMES_10000_NOT_EXACT_SAFE_INTEGER";
assert.throws(() => buildPayload(nonexactFixture), error => error.code === "CRAFT_RUN_INPUTS_UNPROVEN");

const mismatchFixture = clone(fixture);
mismatchFixture.card.requirements[0].exactRequiredQuantityUnits += 1;
assert.throws(() => buildPayload(mismatchFixture), error => error.code === "CRAFT_RUN_INPUTS_UNPROVEN");

const exactHelperStart = appHtml.indexOf("function v004BuildExactRequirementQuantityEvidence");
const exactHelperEnd = appHtml.indexOf("function v004NormalizeRequirementExactEvidence", exactHelperStart);
const exactHelperSource = appHtml.slice(exactHelperStart, exactHelperEnd);
assert.ok(exactHelperStart >= 0 && exactHelperEnd > exactHelperStart);
assert.doesNotMatch(exactHelperSource, /Math\.(?:round|floor|ceil)|toScuUnits|Number\.EPSILON/);
assert.doesNotMatch(appHtml, /payload\.outputCountEvidence\s*!==\s*V004_OUTPUT_COUNT_EVIDENCE\.EXACT_PER_FINISHED_ITEM/);
assert.match(appHtml, /"1 crafthoz"/);
assert.match(appHtml, /card\.quantity \+ " crafthoz"/);
assert.match(appHtml, /Craftok száma/);
assert.match(appHtml, /Lezárt craftok/);
assert.match(appHtml, /craftként használom/);
assert.equal(model.snapshotMarker, "V004_RESERVATION_SNAPSHOT_2");
assert.equal(model.requestMarker, "V004_CRAFT_COMPLETE_REQUEST_2");
assert.equal(model.historySchema, "V004_CRAFT_HISTORY_EVENT_2");

const documentMarkup = appHtml.slice(0, appHtml.indexOf("<script>"));
const localScriptSources = [...documentMarkup.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)]
  .map(match => match[1]).filter(value => !/^https?:/i.test(value));
const localStylesheets = [...documentMarkup.matchAll(/<link\b[^>]*rel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*href\s*=\s*["']([^"']+)["']/gi)]
  .map(match => match[1]).filter(value => !/^https?:/i.test(value));
assert.equal(localScriptSources.length, 0);
assert.equal(localStylesheets.length, 0);

fs.mkdirSync(artifactDirectory, { recursive: true });
const evidence = {
  cycle: "V004-C004.3",
  status: "PASS_TARGETED_MODEL",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  exactCases,
  blockedCases: blockedCases.map(({ label, source, unit }) => ({ label, source: Number.isFinite(source) ? source : String(source), unit })),
  exactArithmetic: {
    scuScale: 10000,
    roundingCalls: 0,
    epsilonTolerance: 0,
    legacyExactMismatchBlocked: true
  },
  semantics: {
    quantitySemantics: exactPayload.quantitySemantics,
    craftRunInputEvidence: exactPayload.craftRunInputEvidence,
    outputCountEvidence: exactPayload.outputCountEvidence,
    outputCountIsCompletionGate: false,
    legacyMissingSemanticsBlocker: "LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED",
    nonexactInputBlocker: "CRAFT_RUN_INPUTS_UNPROVEN"
  },
  schemas: {
    reservation: model.snapshotMarker,
    completionRequest: model.requestMarker,
    historyEvent: model.historySchema
  },
  labels: ["Craftok száma", "Lezárt craftok", "1 crafthoz", "<quantity> crafthoz"],
  singleFile: {
    localScriptSrc: localScriptSources.length,
    localStylesheetDependency: localStylesheets.length,
    localRuntimeSidecars: 0,
    applicationRuntimeFileCount: 1
  }
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V004_C0043_TARGETED_MODEL_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
