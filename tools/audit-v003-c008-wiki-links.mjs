import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const version = "4.9.0-LIVE.12232306";
const apiBase = "https://api.star-citizen.wiki/api";
const outputArgument = process.argv.find((argument) => argument.startsWith("--output="));
const outputPath = outputArgument
  ? path.resolve(projectDirectory, outputArgument.slice("--output=".length))
  : path.join(projectDirectory, "test-artifacts", "V003-C008", "wiki-deep-link-audit.json");

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  assert.equal(response.ok, true, `${url}: HTTP ${response.status}`);
  return response.json();
}

async function verifyWebPage(url) {
  const parsed = new URL(url);
  assert.equal(parsed.protocol, "https:");
  assert.equal(parsed.hostname, "api.star-citizen.wiki");
  assert.doesNotMatch(parsed.pathname, /^\/api\//, "A web_url nem lehet raw API endpoint.");
  const response = await fetch(url, { redirect: "follow", headers: { accept: "text/html,application/xhtml+xml" } });
  assert.equal(response.ok, true, `${url}: HTTP ${response.status}`);
  return { status: response.status, finalUrl: response.url, contentType: response.headers.get("content-type") };
}

const blueprintEnvelope = await fetchJson(`${apiBase}/blueprints/js-300?version=${encodeURIComponent(version)}`);
const blueprint = blueprintEnvelope.data;
assert.equal(blueprint.uuid, "9585b0dc-b660-4e2a-9136-0092af1e72c1");
assert.equal(blueprint.output?.name, "JS-300");
assert.equal(blueprint.output?.item_web_url || blueprint.output_item_web_url, `https://api.star-citizen.wiki/items/b1c89d89-d408-4998-9b17-76986d78a9dd?version=${version}`);

const itemEnvelope = await fetchJson(`${apiBase}/items/${encodeURIComponent(blueprint.output_item_uuid)}?version=${encodeURIComponent(version)}`);
const item = itemEnvelope.data;
assert.equal(item.slug, "js-300");
assert.equal(item.web_url, `https://api.star-citizen.wiki/items/js-300?version=${version}`);

const expectedCommodities = new Map([
  ["Stileron", { uuid: "32bafbd4-c52a-476d-b31c-97c4b3102471", slug: "stileron-ore" }],
  ["Beryl", { uuid: "93c8b7df-d6ac-4b4f-a115-b0e3afc238b8", slug: "beryl" }],
  ["Savrilium", { uuid: "d76ea7ef-5116-488c-93d3-71e02bada13d", slug: "savrilium-ore" }]
]);
const commodityResults = [];
for (const ingredient of blueprint.ingredients || []) {
  const expected = expectedCommodities.get(ingredient.name);
  if (!expected) continue;
  const commodityEnvelope = await fetchJson(`${apiBase}/commodities/${encodeURIComponent(expected.uuid)}?version=${encodeURIComponent(version)}`);
  const commodity = commodityEnvelope.data;
  assert.equal(commodity.uuid, expected.uuid);
  assert.equal(commodity.slug, expected.slug);
  assert.equal(commodity.web_url, `https://api.star-citizen.wiki/commodities/${expected.slug}?version=${version}`);
  assert.match(ingredient.web_url, /^https:\/\/api\.star-citizen\.wiki\/commodities\//);
  commodityResults.push({
    name: ingredient.name,
    uuid: commodity.uuid,
    slug: commodity.slug,
    ingredientWebUrl: ingredient.web_url,
    canonicalWebUrl: commodity.web_url,
    page: await verifyWebPage(commodity.web_url)
  });
}
assert.equal(commodityResults.length, 3);

const result = {
  status: "PASS",
  auditedAt: new Date().toISOString(),
  dataSource: "Star Citizen Wiki API",
  gameVersion: version,
  blueprint: {
    uuid: blueprint.uuid,
    apiWebUrl: blueprint.web_url,
    outputItemWebUrl: blueprint.output?.item_web_url || blueprint.output_item_web_url
  },
  item: {
    uuid: item.uuid,
    slug: item.slug,
    webUrl: item.web_url,
    page: await verifyWebPage(item.web_url)
  },
  commodities: commodityResults,
  resolutionOrder: ["API_WEB_URL", "AUDITED_API_SLUG_CANONICAL", "NO_PROVEN_WIKI_URL"],
  fuzzyOrNameGuessing: false
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log("V003_C008_WIKI_DEEP_LINK_AUDIT_PASS");
console.log(JSON.stringify({ output: path.relative(projectDirectory, outputPath), item: item.web_url, commodities: commodityResults.map((record) => record.canonicalWebUrl) }, null, 2));
