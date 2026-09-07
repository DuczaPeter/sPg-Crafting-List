import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C013.5");
const evidencePath = path.join(artifactDirectory, "active-4.10-material-identity-audit.json");
const html = fs.readFileSync(appPath, "utf8");
const activeScVersion = "4.10.0-LIVE.12519617";
const apiBase = "https://api.star-citizen.wiki/api";

const block = (name) => {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  foldSearchText: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
});
vm.runInContext(`${block("MATERIAL_NAMING_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
globalThis.__AUDIT__ = {
  normalizeRelation: normalizeExactMaterialIdentityRelation,
  selectCandidates: selectExactMaterialIdentityAuditCandidates,
  buildKnown: buildKnownMaterialOptions,
  auditKnown: auditKnownMaterialOptions
};`, context, { filename: "spg-v003-c0135-live-audit-model.js" });
const model = context.__AUDIT__;

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

async function fetchAll(endpoint, filters) {
  const records = [];
  let page = 1;
  let lastPage = 1;
  do {
    const url = new URL(`${apiBase}/${endpoint}`);
    url.searchParams.set("version", activeScVersion);
    url.searchParams.set("page[number]", String(page));
    url.searchParams.set("page[size]", "100");
    Object.entries(filters || {}).forEach(([key, value]) => url.searchParams.set(`filter[${key}]`, value));
    const payload = await fetchJson(url);
    assert.ok(Array.isArray(payload.data), `${endpoint} data[] hiányzik.`);
    records.push(...payload.data);
    lastPage = Number(payload.meta?.last_page || 1);
    page += 1;
  } while (page <= lastPage);
  return records;
}

const [mineable, harvestable, harvestableItems] = await Promise.all([
  fetchAll("commodities", { kind: "mineable" }),
  fetchAll("commodities", { kind: "harvestable" }),
  fetchAll("items", { sub_type: "Harvestable" })
]);
const commodityByUuid = new Map([...mineable, ...harvestable].map((record) => [record.uuid, record]));
const commodityRecords = Array.from(commodityByUuid.values()).map((raw) => ({
  uuid: raw.uuid,
  name: raw.display_name || raw.name,
  display_name: raw.display_name || raw.name,
  apiName: raw.name || null,
  rawName: raw.display_name || raw.name || "",
  kind: raw.kind || null,
  categories: [raw.kind === "harvestable" ? "HARVESTABLE" : "SHIP_MINING"],
  refinedVersion: raw.refined_version ? { uuid: raw.refined_version.uuid || null, name: raw.refined_version.name || null } : null,
  provenance: { gameVersion: activeScVersion, source: `${apiBase}/commodities`, fetchedAt: new Date().toISOString() }
}));
const identityCandidates = model.selectCandidates(harvestableItems, [...mineable, ...harvestable]);
const identityDetails = await Promise.all(identityCandidates.map((record) => {
  const url = new URL(`${apiBase}/items/${encodeURIComponent(record.uuid)}`);
  url.searchParams.set("version", activeScVersion);
  return fetchJson(url).then((payload) => payload.data);
}));
const relations = identityDetails.map((raw) => model.normalizeRelation(raw, {
  gameVersion: activeScVersion,
  source: `${apiBase}/items`,
  fetchedAt: new Date().toISOString()
})).filter(Boolean);

// Every active Harvestable item is injected as a non-persisted potential source
// option. This audits the picker model without modifying User Data.
const potentialSourceOptions = harvestableItems.map((raw, index) => ({
  id: `audit-source-${index}`,
  materialUuid: raw.uuid,
  sourceMaterialUuid: raw.uuid,
  materialName: raw.display_name || raw.name || "Ismeretlen material"
}));
const known = model.buildKnown(commodityRecords, potentialSourceOptions, [], null, relations, activeScVersion);
const audit = model.auditKnown(known);
const feynmaline = known.filter((record) => record.name === "Feynmaline");
const titanium = known.filter((record) => record.name === "Titanium");
assert.equal(feynmaline.length, 1, "Az active 4.10 auditban egy Feynmaline logical identity kell.");
assert.equal(feynmaline[0].uuid, "7310c15d-359c-42b4-b61e-7da3d0da3384");
assert.ok(feynmaline[0].sourceUuids.includes("d7a21cac-3c2b-4695-95b7-2042d8f5755e"));
assert.equal(feynmaline[0].pickerVisible, true);
assert.equal(titanium.length, 1, "Az active 4.10 auditban egy Titanium logical identity kell.");
assert.equal(titanium[0].uuid, "64978449-1d87-4a16-ba55-4b5f94fee217");

const report = {
  cycle: "V003-C013.5",
  status: "PASS",
  activeScVersion,
  fetched: {
    mineableCommodities: mineable.length,
    harvestableCommodities: harvestable.length,
    uniqueCommodityRecords: commodityRecords.length,
    harvestableItems: harvestableItems.length,
    sameNameIdentityCandidates: identityCandidates.length,
    fetchedIdentityDetails: identityDetails.length,
    exactItemCommodityRelations: relations.length
  },
  picker: audit,
  exactRelationList: relations.map((record) => ({
    name: record.canonicalName,
    canonicalUuid: record.canonicalUuid,
    sourceUuid: record.sourceUuid,
    origin: record.relationOrigin
  })).sort((a, b) => a.name.localeCompare(b.name, "hu") || a.canonicalUuid.localeCompare(b.canonicalUuid)),
  unresolvedDuplicateList: audit.unresolvedDuplicates,
  feynmaline: {
    visibleCount: feynmaline.filter((record) => record.pickerVisible !== false).length,
    canonicalUuid: feynmaline[0].uuid,
    sourceUuids: feynmaline[0].sourceUuids
  },
  titanium: {
    visibleCount: titanium.filter((record) => record.pickerVisible !== false).length,
    canonicalUuid: titanium[0].uuid,
    sourceUuids: titanium[0].sourceUuids
  },
  userDataMutation: false
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`V003_C0135_ACTIVE_AUDIT_PASS names=${audit.userFacingMaterialNameCount} visible=${audit.visiblePickerOptionCount} exactMultiUuid=${audit.exactCanonicalMultiUuidMaterialCount} unresolved=${audit.unresolvedDuplicateCount} evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
