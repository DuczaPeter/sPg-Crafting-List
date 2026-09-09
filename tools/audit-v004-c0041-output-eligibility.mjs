import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appPath = path.join(projectRoot, "sPg Crafting List.html");
const evidenceDirectory = path.join(projectRoot, "test-artifacts", "V004-C004.1");
const evidencePath = path.join(evidenceDirectory, "live-output-eligibility.json");
const apiBase = "https://api.star-citizen.wiki/api";
const app = fs.readFileSync(appPath, "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    });
    const body = await response.json();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    return { status: response.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

function blueprintPageUrl(page, gameVersion) {
  const url = new URL(`${apiBase}/blueprints`);
  url.searchParams.set("page[number]", String(page));
  url.searchParams.set("page[size]", "200");
  url.searchParams.set("version", gameVersion);
  return url;
}

function outputTypeOf(record) {
  return record?.output?.type || record?.output?.class || record?.output_class || "UNKNOWN";
}

function addKeys(target, value) {
  Object.keys(value && typeof value === "object" ? value : {}).forEach(key => target.add(key));
}

function rootOutputQuantityCandidates(keys) {
  return keys.filter(key => /output.*(?:count|quantity|yield|amount)|(?:count|quantity|yield|amount).*output/i.test(key));
}

function nestedOutputQuantityCandidates(keys) {
  return keys.filter(key => /count|quantity|yield|amount/i.test(key));
}

const versionResponse = await fetchJson(`${apiBase}/game-versions/default`);
const gameVersion = versionResponse.body?.data?.code;
assert(typeof gameVersion === "string" && gameVersion.length > 0, "Default game version is missing.");

const firstPage = await fetchJson(blueprintPageUrl(1, gameVersion));
const pageCount = Number(firstPage.body?.meta?.last_page);
const expectedTotal = Number(firstPage.body?.meta?.total);
assert(Array.isArray(firstPage.body?.data) && Number.isSafeInteger(pageCount) && pageCount > 0, "Blueprint pagination schema mismatch.");

const records = [...firstPage.body.data];
for (let page = 2; page <= pageCount; page += 1) {
  const response = await fetchJson(blueprintPageUrl(page, gameVersion));
  assert(Array.isArray(response.body?.data), `Blueprint page ${page} schema mismatch.`);
  records.push(...response.body.data);
}
assert(records.length === expectedTotal, `Blueprint total mismatch: ${records.length} !== ${expectedTotal}`);

const indexRootKeys = new Set();
const indexOutputKeys = new Set();
const representativeByType = new Map();
records.forEach(record => {
  addKeys(indexRootKeys, record);
  addKeys(indexOutputKeys, record.output);
  const type = outputTypeOf(record);
  if (!representativeByType.has(type)) representativeByType.set(type, record);
});

const detailRootKeys = new Set();
const detailOutputKeys = new Set();
const detailEvidence = [];
const representatives = Array.from(representativeByType.entries()).sort(([left], [right]) => left.localeCompare(right));
for (let offset = 0; offset < representatives.length; offset += 5) {
  const chunk = representatives.slice(offset, offset + 5);
  const responses = await Promise.all(chunk.map(async ([outputType, record]) => {
    const url = new URL(`${apiBase}/blueprints/${encodeURIComponent(record.uuid)}`);
    url.searchParams.set("version", gameVersion);
    const response = await fetchJson(url);
    return { outputType, indexRecord: record, detail: response.body?.data, status: response.status };
  }));
  responses.forEach(entry => {
    assert(entry.detail && entry.detail.uuid, `Blueprint detail schema mismatch: ${entry.indexRecord.uuid}`);
    addKeys(detailRootKeys, entry.detail);
    addKeys(detailOutputKeys, entry.detail.output);
    detailEvidence.push({
      uuid: entry.detail.uuid,
      outputName: entry.detail.output_name || entry.detail.output?.name || null,
      outputType: entry.outputType,
      httpStatus: entry.status,
      rootOutputQuantityCandidateFields: rootOutputQuantityCandidates(Object.keys(entry.detail)),
      nestedOutputQuantityCandidateFields: nestedOutputQuantityCandidates(Object.keys(entry.detail.output || {}))
    });
  });
}

const indexRootKeyList = Array.from(indexRootKeys).sort();
const indexOutputKeyList = Array.from(indexOutputKeys).sort();
const detailRootKeyList = Array.from(detailRootKeys).sort();
const detailOutputKeyList = Array.from(detailOutputKeys).sort();
const candidateFields = Array.from(new Set([
  ...rootOutputQuantityCandidates(indexRootKeyList),
  ...nestedOutputQuantityCandidates(indexOutputKeyList).map(key => `output.${key}`),
  ...rootOutputQuantityCandidates(detailRootKeyList),
  ...nestedOutputQuantityCandidates(detailOutputKeyList).map(key => `detail.output.${key}`)
])).sort();

const buildStart = app.indexOf("function buildCraftingCard(blueprint)");
const buildEnd = app.indexOf("function buildC010PreviewCard", buildStart);
const normalizeStart = app.indexOf("function normalizeStoredCraftingCard(card, fallbackOrder)");
const normalizeEnd = app.indexOf("/* C0125A_INVENTORY_INDEPENDENCE_MODEL_START */", normalizeStart);
assert(buildStart >= 0 && buildEnd > buildStart && normalizeStart >= 0 && normalizeEnd > normalizeStart, "Production Card source blocks were not found.");
const buildBlock = app.slice(buildStart, buildEnd);
const normalizeBlock = app.slice(normalizeStart, normalizeEnd);
const exactProductionAssignments = app.match(/outputCountEvidence\s*(?::|=)\s*V004_OUTPUT_COUNT_EVIDENCE\.EXACT_PER_FINISHED_ITEM/g) || [];
assert(/outputCountEvidence:\s*V004_OUTPUT_COUNT_EVIDENCE\.UNPROVEN/.test(buildBlock), "New production Cards are not explicitly fail-closed.");
assert(/outputCountEvidence\s*=\s*card\.outputCountEvidence\s*\|\|\s*V004_OUTPUT_COUNT_EVIDENCE\.UNPROVEN/.test(normalizeBlock), "Stored Card fail-closed default is missing.");
assert(exactProductionAssignments.length === 0, "A production exact-output assignment exists without audited semantics.");
assert(candidateFields.length === 0, `Live API exposes unaudited output-count candidates: ${candidateFields.join(", ")}`);

const evidence = {
  cycle: "V004-C004.1",
  status: "PASS_READ_ONLY_LIVE_OUTPUT_ELIGIBILITY_AUDIT",
  conclusion: "LIVE_COMPLETION_CURRENTLY_BLOCKED_BY_OUTPUT_COUNT_UNPROVEN",
  observedAt: new Date().toISOString(),
  source: `${apiBase}/blueprints`,
  gameVersion,
  liveApi: {
    defaultVersionHttpStatus: versionResponse.status,
    blueprintHttpStatus: firstPage.status,
    indexRecords: records.length,
    indexPages: pageCount,
    outputTypes: representatives.length,
    detailRecordsSampled: detailEvidence.length,
    indexRootKeys: indexRootKeyList,
    indexOutputKeys: indexOutputKeyList,
    detailRootKeys: detailRootKeyList,
    detailOutputKeys: detailOutputKeyList,
    outputCountCandidateFields: candidateFields,
    representativeCardEvidence: detailEvidence[0],
    representativeDetails: detailEvidence
  },
  productionCardModel: {
    newCardAssignment: "OUTPUT_COUNT_UNPROVEN",
    storedOrMigratedCardDefault: "OUTPUT_COUNT_UNPROVEN",
    exactProductionAssignmentCount: exactProductionAssignments.length,
    completionCapableProductionCardClasses: [],
    supportedFixtureOnly: "tests/fixtures/v004-c003-reservation.json"
  },
  safety: {
    outputCountDefaultedToOne: false,
    applicationCodeChangedByAudit: false,
    remoteWrites: 0
  }
};

fs.mkdirSync(evidenceDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
process.stdout.write(`V004_C0041_LIVE_OUTPUT_ELIGIBILITY_AUDIT_PASS result=${evidence.conclusion} evidence=${path.relative(projectRoot, evidencePath)}\n`);
