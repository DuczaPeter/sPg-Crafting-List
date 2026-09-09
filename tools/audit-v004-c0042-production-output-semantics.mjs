import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appPath = path.join(projectRoot, "sPg Crafting List.html");
const artifactDirectory = path.join(projectRoot, "test-artifacts", "V004-C004.2");
const evidencePath = path.join(artifactDirectory, "production-output-semantics.json");
const apiBase = "https://api.star-citizen.wiki/api";
const githubRepository = "StarCitizenWiki/API";
const expectedApplicationSha256 = "0a0a57ffe689134bb36f7cffc1443dbafbfbdbd8d5e3647affa9194770ee2764";
const sampleBlueprints = [
  { uuid: "00eabb01-d628-49f5-a1f6-7c9df4ad9259", name: "TH-01 Propulsor", type: "Cargo" },
  { uuid: "cb32c252-45b9-43d0-b1bf-f2755c2f320f", name: "LumaCore", type: "PowerPlant" },
  { uuid: "280f47b7-8434-410c-b854-380768fdccec", name: "Omnisky III Cannon", type: "WeaponGun" },
  { uuid: "b2857c9f-e7ca-4e6f-9071-d352a58383d4", name: "Vendetta HMG", type: "WeaponPersonal" }
];
const officialSourcePaths = [
  "app/Console/Commands/Game/ImportBlueprints.php",
  "app/Http/Resources/Game/Blueprint/BlueprintResource.php",
  "app/Http/Resources/Game/Blueprint/BlueprintRequirementNormalizer.php"
];
const appBuffer = fs.readFileSync(appPath);
const app = appBuffer.toString("utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function fetchResource(url, accept) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: accept,
        "User-Agent": "sPg-Crafting-List-V004-C004.2-read-only-audit"
      },
      cache: "no-store",
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    return { status: response.status, text, contentType: response.headers.get("content-type") || null };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url) {
  const response = await fetchResource(url, "application/json");
  return { ...response, body: JSON.parse(response.text) };
}

function blueprintPageUrl(page, gameVersion) {
  const url = new URL(`${apiBase}/blueprints`);
  url.searchParams.set("page[number]", String(page));
  url.searchParams.set("page[size]", "200");
  url.searchParams.set("version", gameVersion);
  return url;
}

function detailUrl(uuid, gameVersion) {
  const url = new URL(`${apiBase}/blueprints/${encodeURIComponent(uuid)}`);
  url.searchParams.set("version", gameVersion);
  return url;
}

function itemUrl(uuid, gameVersion) {
  const url = new URL(`${apiBase}/items/${encodeURIComponent(uuid)}`);
  url.searchParams.set("version", gameVersion);
  url.searchParams.set("include", "blueprints");
  return url;
}

function exactScuConversion(value) {
  const literal = String(value);
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(literal);
  if (!match) return { rawValue: value, literal, exact: false, reason: "NON_DECIMAL_LITERAL" };
  const fraction = match[3] || "";
  if (fraction.length > 4) return {
    rawValue: value,
    literal,
    fractionalDigits: fraction.length,
    exact: false,
    exactUnits: null,
    runtimeMathRoundUnits: Number.isSafeInteger(Math.round(Number(value) * 10000)) ? Math.round(Number(value) * 10000) : null,
    roundedAwayDecimalDigits: fraction.slice(4).replace(/0/g, "").length,
    reason: "MORE_THAN_FOUR_DECIMALS"
  };
  const sign = match[1] === "-" ? -1n : 1n;
  const exactUnitsBigInt = sign * ((BigInt(match[2]) * 10000n) + BigInt(fraction.padEnd(4, "0") || "0"));
  const exactUnits = Number(exactUnitsBigInt);
  const runtimeUnits = Math.round(Number(value) * 10000);
  const safe = Number.isSafeInteger(exactUnits);
  return {
    rawValue: value,
    literal,
    fractionalDigits: fraction.length,
    exact: safe && runtimeUnits === exactUnits,
    exactUnits: safe ? exactUnits : null,
    runtimeMathRoundUnits: Number.isSafeInteger(runtimeUnits) ? runtimeUnits : null,
    roundedAwayDecimalDigits: 0,
    reason: safe && runtimeUnits === exactUnits ? null : "RUNTIME_CONVERSION_MISMATCH"
  };
}

function exactIngredientConversion(ingredient) {
  if (ingredient?.kind === "resource" && ingredient.quantity_scu !== null && ingredient.quantity_scu !== undefined) {
    return { kind: "resource", unit: "SCU", ...exactScuConversion(ingredient.quantity_scu) };
  }
  if (ingredient?.kind === "item" && Number.isSafeInteger(Number(ingredient.quantity))) {
    const exactUnits = Number(ingredient.quantity);
    return {
      kind: "item",
      unit: "ITEM",
      rawValue: ingredient.quantity,
      literal: String(ingredient.quantity),
      exact: true,
      exactUnits,
      runtimeMathRoundUnits: Math.round(Number(ingredient.quantity)),
      roundedAwayDecimalDigits: 0,
      reason: null
    };
  }
  return {
    kind: ingredient?.kind || null,
    unit: null,
    rawValue: ingredient?.quantity_scu ?? ingredient?.quantity ?? null,
    literal: null,
    exact: false,
    exactUnits: null,
    runtimeMathRoundUnits: null,
    roundedAwayDecimalDigits: null,
    reason: "MISSING_OR_NON_INTEGER_QUANTITY"
  };
}

function outputCardinalityKey(key, parentKey) {
  const normalized = String(key).toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const parent = String(parentKey || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return /^(?:output|produced|result|yield|craft_output)_(?:count|quantity|amount|size|yield)$/.test(normalized) ||
    /^(?:count|quantity|amount|size|yield)_(?:output|produced|result)$/.test(normalized) ||
    /^(?:batch_size|produced_count|produced_quantity|quantity_per_craft|output_per_craft)$/.test(normalized) ||
    (parent === "output" && /^(?:count|quantity|amount|size|yield)$/.test(normalized));
}

function collectOutputCardinalityCandidates(value, pathParts = [], found = []) {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectOutputCardinalityCandidates(entry, pathParts.concat(`[${index}]`), found));
    return found;
  }
  Object.entries(value).forEach(([key, child]) => {
    const nextPath = pathParts.concat(key);
    if (outputCardinalityKey(key, pathParts[pathParts.length - 1])) {
      found.push({ path: nextPath.join("."), value: child });
    }
    collectOutputCardinalityCandidates(child, nextPath, found);
  });
  return found;
}

function collectMatchingQuantityRepresentations(value, targetUuid, pathParts = [], found = []) {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectMatchingQuantityRepresentations(entry, targetUuid, pathParts.concat(`[${index}]`), found));
    return found;
  }
  const identity = value.uuid || value.resource_type_uuid || value.item_uuid || null;
  if (identity === targetUuid && (value.quantity_scu !== undefined || value.quantity !== undefined)) {
    found.push({
      path: pathParts.join("."),
      quantityScu: value.quantity_scu ?? null,
      quantity: value.quantity ?? null
    });
  }
  Object.entries(value).forEach(([key, child]) => {
    collectMatchingQuantityRepresentations(child, targetUuid, pathParts.concat(key), found);
  });
  return found;
}

function lineNumberOf(needle) {
  const index = app.indexOf(needle);
  assert(index >= 0, `Application source needle missing: ${needle}`);
  return app.slice(0, index).split("\n").length;
}

function extractYamlSchema(yaml, schemaName) {
  const marker = `    ${schemaName}:`;
  const start = yaml.indexOf(marker);
  assert(start >= 0, `OpenAPI schema missing: ${schemaName}`);
  const rest = yaml.slice(start + marker.length);
  const next = rest.search(/\n    [a-zA-Z0-9_]+:\r?\n/);
  return marker + (next >= 0 ? rest.slice(0, next) : rest);
}

function yamlPropertyNames(schemaText) {
  return Array.from(schemaText.matchAll(/^        ([a-zA-Z0-9_]+):\r?$/gm), match => match[1]);
}

const applicationSha256 = sha256(appBuffer);
assert(applicationSha256 === expectedApplicationSha256, `Application SHA mismatch: ${applicationSha256}`);

const versionResponse = await fetchJson(`${apiBase}/game-versions/default`);
const gameVersion = versionResponse.body?.data?.code;
assert(typeof gameVersion === "string" && gameVersion.length > 0, "Default game version is missing.");

const firstPage = await fetchJson(blueprintPageUrl(1, gameVersion));
const pageCount = Number(firstPage.body?.meta?.last_page);
const expectedTotal = Number(firstPage.body?.meta?.total);
assert(Array.isArray(firstPage.body?.data) && Number.isSafeInteger(pageCount) && pageCount > 0, "Blueprint pagination schema mismatch.");
const indexRecords = [...firstPage.body.data];
for (let page = 2; page <= pageCount; page += 1) {
  const response = await fetchJson(blueprintPageUrl(page, gameVersion));
  assert(Array.isArray(response.body?.data), `Blueprint page ${page} schema mismatch.`);
  indexRecords.push(...response.body.data);
}
assert(indexRecords.length === expectedTotal, `Blueprint total mismatch: ${indexRecords.length} !== ${expectedTotal}`);

const indexOutputCardinalityCandidates = [];
const quantityViolations = [];
let ingredientCount = 0;
let resourceIngredientCount = 0;
let itemIngredientCount = 0;
let maximumScuDecimalPlaces = 0;
indexRecords.forEach(record => {
  collectOutputCardinalityCandidates(record).forEach(candidate => {
    indexOutputCardinalityCandidates.push({ blueprintUuid: record.uuid, ...candidate });
  });
  (Array.isArray(record.ingredients) ? record.ingredients : []).forEach(ingredient => {
    ingredientCount += 1;
    if (ingredient.kind === "resource") resourceIngredientCount += 1;
    if (ingredient.kind === "item") itemIngredientCount += 1;
    const conversion = exactIngredientConversion(ingredient);
    if (conversion.unit === "SCU") maximumScuDecimalPlaces = Math.max(maximumScuDecimalPlaces, conversion.fractionalDigits || 0);
    if (!conversion.exact) {
      quantityViolations.push({ blueprintUuid: record.uuid, outputName: record.output_name, ingredient, conversion });
    }
  });
});

const sampleEvidence = [];
for (const sample of sampleBlueprints) {
  const detailResponse = await fetchJson(detailUrl(sample.uuid, gameVersion));
  const detail = detailResponse.body?.data;
  assert(detail?.uuid === sample.uuid, `Blueprint detail mismatch: ${sample.uuid}`);
  assert(detail?.output?.name === sample.name && detail?.output?.type === sample.type, `Blueprint sample identity mismatch: ${sample.uuid}`);
  assert(detail?.output?.uuid, `Blueprint output UUID missing: ${sample.uuid}`);

  const linkedItemResponse = await fetchJson(itemUrl(detail.output.uuid, gameVersion));
  const linkedItem = linkedItemResponse.body?.data;
  assert(linkedItem?.uuid === detail.output.uuid, `Linked item identity mismatch: ${sample.name}`);
  const linkedBlueprints = Array.isArray(linkedItem?.blueprint) ? linkedItem.blueprint : [linkedItem?.blueprint].filter(Boolean);
  assert(linkedBlueprints.some(blueprint => blueprint?.uuid === sample.uuid), `Linked item blueprint mismatch: ${sample.name}`);

  const aspects = Array.isArray(detail?.aspects?.aspects) ? detail.aspects.aspects : [];
  assert(aspects.length > 0, `No normalized aspect inputs for sample: ${sample.name}`);
  const normalizedRequirements = aspects.map((aspect, aspectIndex) => {
    const input = aspect?.input || {};
    const conversion = exactIngredientConversion(input);
    assert(input.uuid, `Aspect input UUID missing: ${sample.name} #${aspectIndex}`);
    assert(conversion.exact, `Non-exact sample quantity conversion: ${sample.name} #${aspectIndex}`);
    const representations = collectMatchingQuantityRepresentations(detail, input.uuid);
    assert(representations.length >= 3, `Nested quantity representations are incomplete: ${sample.name} #${aspectIndex}`);
    return {
      aspectIndex,
      slotKey: aspect.key || null,
      slotName: aspect.name || null,
      ingredientUuid: input.uuid,
      ingredientName: input.name || null,
      unit: conversion.unit,
      rawValue: conversion.rawValue,
      normalizedRequiredQuantityUnits: conversion.exactUnits,
      decimalConversionExactWithZeroRoundedAwayDigits: conversion.exact && conversion.roundedAwayDecimalDigits === 0,
      representationPaths: representations,
      cardQuantityMultiplication: [1, 2, 5].map(cardQuantity => ({
        cardQuantity,
        requiredUnits: conversion.exactUnits * cardQuantity
      }))
    };
  });

  const detailCandidates = collectOutputCardinalityCandidates(detail);
  const linkedItemCandidates = collectOutputCardinalityCandidates(linkedItem);
  assert(detailCandidates.length === 0, `Detail output-cardinality candidate found: ${sample.name}`);
  assert(linkedItemCandidates.length === 0, `Linked item output-cardinality candidate found: ${sample.name}`);
  sampleEvidence.push({
    blueprintUuid: sample.uuid,
    outputUuid: detail.output.uuid,
    outputName: sample.name,
    outputType: sample.type,
    detailHttpStatus: detailResponse.status,
    linkedItemHttpStatus: linkedItemResponse.status,
    linkedItemBlueprintEmbedded: true,
    outputCardinalityCandidates: {
      blueprintDetail: detailCandidates,
      linkedItemAndEmbeddedBlueprint: linkedItemCandidates
    },
    normalizedRequirements
  });
}

const openApiResponse = await fetchResource(`${apiBase}/openapi`, "application/yaml,text/yaml,text/plain");
const outputSchema = extractYamlSchema(openApiResponse.text, "blueprint_output");
const requirementChildSchema = extractYamlSchema(openApiResponse.text, "blueprint_requirement_child");
const ingredientSchema = extractYamlSchema(openApiResponse.text, "blueprint_ingredient");
const outputSchemaFields = yamlPropertyNames(outputSchema);
const documentedOutputCardinalityFields = outputSchemaFields.filter(field => outputCardinalityKey(field, "output"));
assert(/Discrete item count required/.test(requirementChildSchema), "OpenAPI item requirement quantity description missing.");
assert(/Quantity in Standard Cargo Units \(for resources\)/.test(requirementChildSchema), "OpenAPI resource requirement quantity description missing.");
assert(/Ingredients required to craft the item/.test(openApiResponse.text), "OpenAPI blueprint ingredient description missing.");
assert(documentedOutputCardinalityFields.length === 0, "OpenAPI output cardinality field requires semantic review.");

const commitResponse = await fetchJson(`https://api.github.com/repos/${githubRepository}/commits/develop`);
const officialSourceCommit = commitResponse.body?.sha;
assert(/^[0-9a-f]{40}$/.test(officialSourceCommit), "Official source commit SHA missing.");
const officialSourceEvidence = [];
const sourceCardinalityMatches = [];
let blueprintResourceSource = null;
for (const sourcePath of officialSourcePaths) {
  const rawUrl = `https://raw.githubusercontent.com/${githubRepository}/${officialSourceCommit}/${sourcePath}`;
  const sourceResponse = await fetchResource(rawUrl, "text/plain");
  const lines = sourceResponse.text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/Output\.(?:Count|Quantity|Amount|Yield|Size)|output_(?:count|quantity|amount|yield|size)|produced_(?:count|quantity|amount)|batch_size|yield_(?:count|quantity|amount)/i.test(line)) {
      sourceCardinalityMatches.push({ sourcePath, line: index + 1, text: line.trim() });
    }
  });
  if (sourcePath.endsWith("BlueprintResource.php")) blueprintResourceSource = sourceResponse.text;
  officialSourceEvidence.push({ sourcePath, rawUrl, httpStatus: sourceResponse.status, sha256: sha256(sourceResponse.text) });
}
assert(sourceCardinalityMatches.length === 0, "Official source output-cardinality candidate requires semantic review.");
assert(blueprintResourceSource, "Blueprint resource source was not loaded.");
const outputPayloadStart = blueprintResourceSource.indexOf("private function outputPayload");
const outputPayloadEnd = blueprintResourceSource.indexOf("private function", outputPayloadStart + 20);
assert(outputPayloadStart >= 0 && outputPayloadEnd > outputPayloadStart, "Official outputPayload source block missing.");
const outputPayloadBlock = blueprintResourceSource.slice(outputPayloadStart, outputPayloadEnd);
const sourceOutputPayloadFields = Array.from(outputPayloadBlock.matchAll(/^\s*'([a-z_]+)'\s*=>/gm), match => match[1]);
assert(sourceOutputPayloadFields.length >= 8, "Official output payload fields were not recovered.");
assert(sourceOutputPayloadFields.filter(field => outputCardinalityKey(field, "output")).length === 0, "Official output payload cardinality field requires review.");

const traceNeedles = {
  scuConversion: "function toScuUnits(value)",
  indexNormalization: "function normalizeBlueprintIndex(raw, gameVersion, fetchedAt)",
  nestedAspectSelection: "function blueprintAspectCandidates(raw)",
  blueprintNormalization: "function normalizeBlueprint(raw, provenance)",
  sourceQuantitySelection: "var rawQuantity = hasScu ? Number(input.quantity_scu)",
  normalizedRequiredUnits: "requiredQuantityUnits: quantityUnits",
  allocationMultiplication: "perCraftUnits * craftQuantity",
  blueprintQuantityDisplay: "function formatRequirementQuantity(requirement)",
  cardBuild: "function buildCraftingCard(blueprint)",
  cardOneItemLabel: '["1 db-hoz", formatInventoryUnits',
  cardRequestedItemsLabel: '[card.quantity + " db-hoz"',
  completionOutputGate: "payload.outputCountEvidence !== V004_OUTPUT_COUNT_EVIDENCE.EXACT_PER_FINISHED_ITEM"
};
const applicationTrace = Object.fromEntries(Object.entries(traceNeedles).map(([key, needle]) => [key, { line: lineNumberOf(needle), needle }]));
const exactProductionAssignments = app.match(/outputCountEvidence\s*(?::|=)\s*V004_OUTPUT_COUNT_EVIDENCE\.EXACT_PER_FINISHED_ITEM/g) || [];
assert(/outputCountEvidence:\s*V004_OUTPUT_COUNT_EVIDENCE\.UNPROVEN/.test(app), "Production Card builder fail-closed assignment missing.");
assert(/outputCountEvidence\s*=\s*card\.outputCountEvidence\s*\|\|\s*V004_OUTPUT_COUNT_EVIDENCE\.UNPROVEN/.test(app), "Stored/migrated Card fail-closed default missing.");
assert(exactProductionAssignments.length === 0, "Production exact output assignment exists without audited proof.");
assert(indexOutputCardinalityCandidates.length === 0, "Live blueprint index output-cardinality candidate requires review.");

const documentMarkup = app.slice(0, app.indexOf("<script>"));
const localScriptSources = Array.from(documentMarkup.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi), match => match[1]).filter(value => !/^https?:/i.test(value));
const localStylesheets = Array.from(documentMarkup.matchAll(/<link\b[^>]*rel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*href\s*=\s*["']([^"']+)["']/gi), match => match[1]).filter(value => !/^https?:/i.test(value));
assert(/<style\b[^>]*id="spgApplicationStyles"/i.test(documentMarkup), "Embedded application CSS missing.");
assert(/<script>/.test(app), "Embedded application JavaScript missing.");
assert(localScriptSources.length === 0 && localStylesheets.length === 0, "Local runtime sidecar detected.");

const evidence = {
  cycle: "V004-C004.2",
  status: "PASS_READ_ONLY_SEMANTIC_AUDIT",
  conclusion: "PRODUCTION_OUTPUT_SEMANTICS_UNPROVEN",
  liveCraftCompleteGate: "LIVE_CRAFT_COMPLETE_GATE_BLOCKED_BY_UNPROVEN_OUTPUT_SEMANTICS",
  productionCardOutputCountEvidence: "OUTPUT_COUNT_UNPROVEN",
  observedAt: new Date().toISOString(),
  inputCheckpoint: "82d4814afa2697ebc625f118dde57caa30e372f3",
  application: {
    runtimeIdentity: "V004-dev",
    sha256: applicationSha256,
    changedByAudit: false,
    trace: applicationTrace,
    semantics: {
      apiDetailToNormalizedCard: "aspects.aspects[].input.quantity_scu|quantity -> requiredQuantityUnits -> Card requirement",
      allocationFormula: "requiredQuantityUnits * card.quantity",
      uiLabels: ["1 db-hoz", "<card.quantity> db-hoz"],
      uiLabelsAreSourceProof: false,
      exactProductionAssignmentCount: exactProductionAssignments.length,
      newCardDefault: "OUTPUT_COUNT_UNPROVEN",
      storedOrMigratedCardDefault: "OUTPUT_COUNT_UNPROVEN"
    }
  },
  liveApi: {
    source: `${apiBase}/blueprints`,
    gameVersion,
    defaultVersionHttpStatus: versionResponse.status,
    indexHttpStatus: firstPage.status,
    indexRecords: indexRecords.length,
    indexPages: pageCount,
    ingredientQuantitiesAudited: ingredientCount,
    resourceIngredientQuantitiesAudited: resourceIngredientCount,
    itemIngredientQuantitiesAudited: itemIngredientCount,
    maximumObservedScuDecimalPlaces: maximumScuDecimalPlaces,
    nonExactQuantityConversions: quantityViolations,
    indexOutputCardinalityCandidates,
    sampleCategories: sampleEvidence.map(sample => sample.outputType),
    sampleDetails: sampleEvidence
  },
  officialOpenApi: {
    url: `${apiBase}/openapi`,
    httpStatus: openApiResponse.status,
    sha256: sha256(openApiResponse.text),
    blueprintOutputFields: outputSchemaFields,
    outputCardinalityFields: documentedOutputCardinalityFields,
    requirementQuantityDescriptionsPresent: true,
    ingredientDescription: "Ingredients required to craft the item",
    singularWordingTreatedAsOutputCountProof: false
  },
  officialSource: {
    repository: `https://github.com/${githubRepository}`,
    branch: "develop",
    commit: officialSourceCommit,
    commitDate: commitResponse.body?.commit?.committer?.date || null,
    commitSubject: String(commitResponse.body?.commit?.message || "").split("\n")[0],
    files: officialSourceEvidence,
    outputPayloadFields: sourceOutputPayloadFields,
    outputCardinalityMatches: sourceCardinalityMatches,
    importerMapping: "raw Output.UUID/Name/Class plus complete raw payload; no explicit output cardinality mapping",
    resourceMapping: "outputPayload exposes identity/type/grade/link only; requirement normalizer exposes quantity and quantity_scu"
  },
  semanticDecision: {
    sourceRequirementQuantityConversionExactForCurrentDataset: quantityViolations.length === 0,
    perFinishedItemNormalizationProven: false,
    outputCountOrYieldFieldFound: false,
    documentedUniversalOneOutputInvariantFound: false,
    outputCountDefaultedToOne: false,
    promotedProductionCardClasses: [],
    fullCompletionAllowedForProductionCards: false,
    partialCompletionAllowedForProductionCards: false,
    oldOrMigratedCardsRemainBlockedWithoutProof: true
  },
  singleFile: {
    embeddedCss: true,
    embeddedJavaScript: true,
    localScriptSources,
    localStylesheets,
    localRuntimeSidecars: 0,
    applicationRuntimeFileCount: 1
  },
  safety: {
    methods: ["GET"],
    remoteWrites: 0,
    applicationWrites: 0,
    fullRegression: "NOT_RUN_BY_SCOPE",
    browserGate: "NOT_RUN_AUDIT_ONLY_APPLICATION_BYTES_UNCHANGED",
    c005: "NOT_STARTED"
  }
};

fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
process.stdout.write(`V004_C0042_PRODUCTION_OUTPUT_SEMANTICS_AUDIT_PASS conclusion=${evidence.conclusion} liveGate=${evidence.liveCraftCompleteGate} evidence=${path.relative(projectRoot, evidencePath)}\n`);
