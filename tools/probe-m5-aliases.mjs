import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const match = html.match(/\/\* M5_UEX_REFINERY_MODEL_START \*\/([\s\S]*?)\/\* M5_UEX_REFINERY_MODEL_END \*\//);
assert.ok(match, "Az M5 modellblokk hiányzik.");

const APP = {
  apiBase: "https://api.star-citizen.wiki/api",
  uexRefineryEndpoint: "https://api.uexcorp.uk/2.0/refineries_yields",
  uexRefineryTtlMs: 86400000,
  uexRefineryDocumentedLimit: 500
};
const context = vm.createContext({
  APP,
  console,
  m4Clone: (value) => JSON.parse(JSON.stringify(value)),
  m4Canonicalize: (value) => value,
  m4FingerprintText: () => "probe"
});
vm.runInContext(`${match[1]}
globalThis.__M5_ALIAS_PROBE__ = {
  normalizeUexRefineryYield,
  buildCommodityMappings,
  summarizeUexMappings,
  aliasRegistryVersion: M5_CANONICAL_ALIAS_REGISTRY_VERSION
};`, context, { filename: "spg-m5-alias-probe.js" });
const model = context.__M5_ALIAS_PROBE__;

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

const defaultVersionPayload = await getJson(`${APP.apiBase}/game-versions/default`);
const scVersion = defaultVersionPayload.data.code;
const encodedVersion = encodeURIComponent(scVersion);
const [mineable, harvestable, uexEnvelope] = await Promise.all([
  getJson(`${APP.apiBase}/commodities?filter%5Bkind%5D=mineable&page%5Bsize%5D=200&version=${encodedVersion}`),
  getJson(`${APP.apiBase}/commodities?filter%5Bkind%5D=harvestable&page%5Bsize%5D=200&version=${encodedVersion}`),
  getJson(APP.uexRefineryEndpoint)
]);
const fetchedAt = new Date().toISOString();
const datasetId = `probe-${fetchedAt}`;
const uexRecords = uexEnvelope.data.map((record, index) => model.normalizeUexRefineryYield(record, { datasetId, fetchedAt }, index));
const mappings = model.buildCommodityMappings(
  [...mineable.data, ...harvestable.data],
  uexRecords,
  [],
  { scVersion, uexDatasetId: datasetId }
);
const aliasMappings = mappings.filter((mapping) => mapping.origin === "VERIFIED_CANONICAL_ALIAS");
assert.equal(aliasMappings.length, 5, "Nem mind az öt igazolt alias lett MATCHED.");
assert.ok(aliasMappings.every((mapping) => mapping.status === "MATCHED"));

console.log("M5_CANONICAL_ALIAS_LIVE_PASS");
console.log(JSON.stringify({
  checkedAt: fetchedAt,
  scVersion,
  uexStatus: uexEnvelope.status,
  uexRecordCount: uexRecords.length,
  aliasRegistryVersion: model.aliasRegistryVersion,
  mappingSummary: model.summarizeUexMappings(mappings),
  aliases: aliasMappings.map((mapping) => ({
    wikiCommodityUuid: mapping.wikiCommodityUuid,
    wikiCommodityName: mapping.wikiCommodityName,
    uexCommodityId: mapping.uexCommodityId,
    uexCommodityName: mapping.uexCommodityName,
    canonicalName: mapping.canonicalName,
    origin: mapping.origin,
    verifiedScVersion: mapping.provenance.verifiedScVersion,
    verifiedUexDataVersion: mapping.provenance.verifiedUexDataVersion,
    uexModifiedMin: mapping.provenance.uexModifiedMin,
    uexModifiedMax: mapping.provenance.uexModifiedMax
  }))
}, null, 2));
