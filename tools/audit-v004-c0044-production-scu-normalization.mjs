import crypto, { webcrypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appPath = path.join(projectRoot, "sPg Crafting List.html");
const fixturePath = path.join(projectRoot, "tests", "fixtures", "v004-c003-reservation.json");
const artifactDirectory = path.join(projectRoot, "test-artifacts", "V004-C004.4");
const evidencePath = path.join(artifactDirectory, "production-scu-normalization.json");
const apiBase = "https://api.star-citizen.wiki/api";
const appBuffer = fs.readFileSync(appPath);
const appHtml = appBuffer.toString("utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const sampleBlueprints = [
  { key: "lumaCore", uuid: "cb32c252-45b9-43d0-b1bf-f2755c2f320f", expectedName: "LumaCore" },
  { key: "steadfast", uuid: "5af6beb3-4030-4a32-bb77-2a9b729483f5", expectedName: "Steadfast" },
  { key: "omnisky", uuid: "280f47b7-8434-410c-b854-380768fdccec", expectedName: "Omnisky III Cannon" }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function block(name) {
  const startMarker = `/* ${name}_START */`;
  const endMarker = `/* ${name}_END */`;
  const start = appHtml.indexOf(startMarker);
  const end = appHtml.indexOf(endMarker);
  assert(start >= 0 && end > start, `Missing model block: ${name}`);
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
  globalThis.__C0044_AUDIT__ = {
    normalize: v004BuildExactRequirementQuantityEvidence,
    status: V004_QUANTITY_NORMALIZATION_STATUS,
    scuRule: V004_SCU_NORMALIZATION_RULE,
    itemRule: V004_ITEM_NORMALIZATION_RULE
  };
`, context);
const model = context.__C0044_AUDIT__;

async function fetchResource(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": "sPg-Crafting-List-V004-C004.4-read-only-audit" },
      cache: "no-store",
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    return { status: response.status, text, body: JSON.parse(text) };
  } finally {
    clearTimeout(timeout);
  }
}

function blueprintPageUrl(page, gameVersion) {
  const url = new URL(`${apiBase}/blueprints`);
  url.searchParams.set("page[number]", String(page));
  url.searchParams.set("page[size]", "200");
  url.searchParams.set("version", gameVersion);
  return url.href;
}

function blueprintDetailUrl(uuid, gameVersion) {
  const url = new URL(`${apiBase}/blueprints/${encodeURIComponent(uuid)}`);
  url.searchParams.set("version", gameVersion);
  return url.href;
}

function sourceQuantity(ingredient) {
  if (ingredient?.kind === "resource" && ingredient.quantity_scu !== undefined && ingredient.quantity_scu !== null) {
    return { unit: "SCU", value: ingredient.quantity_scu };
  }
  if (ingredient?.kind === "item" && ingredient.quantity !== undefined && ingredient.quantity !== null) {
    return { unit: "ITEM", value: ingredient.quantity };
  }
  return { unit: "UNKNOWN", value: ingredient?.quantity_scu ?? ingredient?.quantity ?? null };
}

function normalizeIngredient(ingredient) {
  const source = sourceQuantity(ingredient);
  const normalized = JSON.parse(JSON.stringify(model.normalize(source.value, source.unit)));
  return {
    ingredientUuid: ingredient?.uuid || ingredient?.resource_type_uuid || ingredient?.item_uuid || null,
    ingredientName: ingredient?.name || null,
    kind: ingredient?.kind || null,
    unit: source.unit,
    sourceValue: source.value,
    ...normalized
  };
}

const defaultVersionResponse = await fetchResource(`${apiBase}/game-versions/default`);
const gameVersion = defaultVersionResponse.body?.data?.code;
assert(typeof gameVersion === "string" && gameVersion.length > 0, "Default game version missing.");

const firstPage = await fetchResource(blueprintPageUrl(1, gameVersion));
const pageCount = Number(firstPage.body?.meta?.last_page);
const expectedBlueprintCount = Number(firstPage.body?.meta?.total);
assert(Array.isArray(firstPage.body?.data) && Number.isSafeInteger(pageCount) && pageCount > 0, "Blueprint pagination mismatch.");
const blueprints = [...firstPage.body.data];
for (let page = 2; page <= pageCount; page += 1) {
  const response = await fetchResource(blueprintPageUrl(page, gameVersion));
  assert(Array.isArray(response.body?.data), `Blueprint page ${page} missing data.`);
  blueprints.push(...response.body.data);
}
assert(blueprints.length === expectedBlueprintCount, `Blueprint total mismatch: ${blueprints.length} !== ${expectedBlueprintCount}`);

let ingredientCount = 0;
let scuRequirementCount = 0;
let itemRequirementCount = 0;
let scuSuccessfullyNormalizedCount = 0;
let itemSuccessfullyNormalizedCount = 0;
const blockedScu = [];
const blockedItem = [];
const unsupported = [];
const affectedBlueprints = new Set();
const previousFloatingRepresentationCases = [];
const blockerReasons = new Map();

for (const blueprint of blueprints) {
  for (const ingredient of Array.isArray(blueprint.ingredients) ? blueprint.ingredients : []) {
    ingredientCount += 1;
    const normalized = normalizeIngredient(ingredient);
    if (normalized.unit === "SCU") scuRequirementCount += 1;
    else if (normalized.unit === "ITEM") itemRequirementCount += 1;
    else unsupported.push({ blueprintUuid: blueprint.uuid, outputName: blueprint.output_name, ...normalized });

    const success = normalized.quantityNormalizationStatus === "NORMALIZED_EXACT_INTEGER_UNITS";
    if (normalized.unit === "SCU" && success) scuSuccessfullyNormalizedCount += 1;
    if (normalized.unit === "ITEM" && success) itemSuccessfullyNormalizedCount += 1;
    if (!success && (normalized.unit === "SCU" || normalized.unit === "ITEM")) {
      const target = normalized.unit === "SCU" ? blockedScu : blockedItem;
      target.push({ blueprintUuid: blueprint.uuid, outputName: blueprint.output_name, ...normalized });
      affectedBlueprints.add(blueprint.uuid);
      blockerReasons.set(normalized.quantityExactnessReason, (blockerReasons.get(normalized.quantityExactnessReason) || 0) + 1);
    }

    if (normalized.unit === "SCU" && ["0.11000000000000001", "3.0999999999999996"].includes(normalized.sourceQuantityCanonicalDecimal)) {
      previousFloatingRepresentationCases.push({
        blueprintUuid: blueprint.uuid,
        outputName: blueprint.output_name,
        ingredientUuid: normalized.ingredientUuid,
        ingredientName: normalized.ingredientName,
        sourceQuantityValue: normalized.sourceQuantityValue,
        canonicalDecimal: normalized.sourceQuantityCanonicalDecimal,
        normalizedScu: normalized.normalizedQuantityText,
        normalizedUnits: normalized.normalizedRequiredQuantityUnits,
        status: normalized.quantityNormalizationStatus,
        reason: normalized.quantityExactnessReason
      });
    }
  }
}

const sampleEvidence = {};
for (const sample of sampleBlueprints) {
  const response = await fetchResource(blueprintDetailUrl(sample.uuid, gameVersion));
  const detail = response.body?.data;
  assert(detail?.uuid === sample.uuid, `Detail UUID mismatch: ${sample.key}`);
  assert(detail?.output?.name === sample.expectedName || detail?.output_name === sample.expectedName, `Detail name mismatch: ${sample.key}`);
  const aspects = Array.isArray(detail?.aspects?.aspects) ? detail.aspects.aspects : [];
  assert(aspects.length > 0, `No aspect inputs: ${sample.key}`);
  const requirements = aspects.map((aspect, index) => ({
    aspectIndex: index,
    slotKey: aspect?.key || null,
    slotName: aspect?.name || null,
    ...normalizeIngredient(aspect?.input || {})
  }));
  sampleEvidence[sample.key] = {
    blueprintUuid: sample.uuid,
    outputName: sample.expectedName,
    httpStatus: response.status,
    completionInputEligible: requirements.every(requirement => requirement.quantityNormalizationStatus === "NORMALIZED_EXACT_INTEGER_UNITS"),
    requirements
  };
}

assert(sampleEvidence.lumaCore.requirements.some(requirement => requirement.sourceQuantityCanonicalDecimal === "0.14" && requirement.normalizedQuantityText === "0.1400" && requirement.normalizedRequiredQuantityUnits === 1400), "LumaCore 0.14 SCU normalization proof missing.");
assert(sampleEvidence.lumaCore.completionInputEligible, "LumaCore still has an input-normalization blocker.");
assert(sampleEvidence.steadfast.completionInputEligible, "Steadfast still has an input-normalization blocker.");
assert(sampleEvidence.omnisky.completionInputEligible, "Omnisky regression has an input-normalization blocker.");

const requestStart = appHtml.indexOf("class SCWikiAdapter");
const requestEnd = appHtml.indexOf("async getDefaultGameVersion", requestStart);
const requestSource = appHtml.slice(requestStart, requestEnd);
assert(requestStart >= 0 && requestEnd > requestStart, "SCWikiAdapter.request source missing.");
assert(/var text = await response\.text\(\)/.test(requestSource) && /JSON\.parse\(text\)/.test(requestSource), "SCWikiAdapter response text/JSON.parse flow changed.");

const evidence = {
  cycle: "V004-C004.4",
  status: blockedScu.length || blockedItem.length || unsupported.length ? "BLOCKED_PRODUCTION_INPUT_NORMALIZATION" : "PASS_PRODUCTION_INPUT_NORMALIZATION",
  observedAt: new Date().toISOString(),
  applicationSha256: sha256(appBuffer),
  api: {
    base: apiBase,
    method: "GET",
    gameVersion,
    blueprintPages: pageCount
  },
  sourceLiteralAudit: {
    adapterReadsResponseTextBeforeJsonParse: true,
    parsedFieldRetainsOriginalJsonNumericLiteral: false,
    fragileRegexJsonParserAdded: false,
    canonicalDecimalSource: "String(JSON.parse numeric Number)",
    scientificNotation: "SUPPORTED_BY_DETERMINISTIC_DECIMAL_PARSER"
  },
  normalizationRule: {
    scu: model.scuRule,
    item: model.itemRule,
    rounding: "DECIMAL_HALF_UP_4DP",
    canonicalTruthAfterBoundary: "INTEGER_INTERNAL_UNITS",
    postNormalizationToleranceUnits: 0
  },
  totals: {
    blueprintCount: blueprints.length,
    ingredientCount,
    scuRequirementCount,
    itemRequirementCount,
    scuSuccessfullyNormalizedCount,
    itemSuccessfullyNormalizedCount,
    blockedScuCount: blockedScu.length,
    blockedItemCount: blockedItem.length,
    unsupportedRequirementCount: unsupported.length,
    affectedBlueprintCount: affectedBlueprints.size
  },
  blockerReasons: Object.fromEntries([...blockerReasons.entries()].sort(([left], [right]) => String(left).localeCompare(String(right)))),
  blockedScu,
  blockedItem,
  unsupported,
  previousFloatingRepresentationCases: {
    count: previousFloatingRepresentationCases.length,
    expectedHistoricalCount: 6,
    allNormalized: previousFloatingRepresentationCases.every(item => item.status === "NORMALIZED_EXACT_INTEGER_UNITS"),
    cases: previousFloatingRepresentationCases
  },
  productionSamples: sampleEvidence,
  safety: {
    remoteWrites: 0,
    applicationWrites: 0,
    outputCardinality: "UNPROVEN_AND_NOT_CLAIMED",
    craftQuantity: "CRAFT_RUN_COUNT",
    c005: "NOT_STARTED"
  }
};

fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V004_C0044_PRODUCTION_AUDIT_${evidence.status.startsWith("PASS") ? "PASS" : "BLOCKED"} blueprints=${blueprints.length} ingredients=${ingredientCount} scu=${scuRequirementCount}/${scuSuccessfullyNormalizedCount} item=${itemRequirementCount}/${itemSuccessfullyNormalizedCount} blockedScu=${blockedScu.length} blockedItem=${blockedItem.length} previousFloatCases=${previousFloatingRepresentationCases.length} evidence=${path.relative(projectRoot, evidencePath)}`);
