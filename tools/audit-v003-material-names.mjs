import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const fixture = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "v003-c003-material-names.json"), "utf8"));
const version = fixture.gameVersion;
const baseUrl = "https://api.star-citizen.wiki/api/commodities";
const outputArgument = process.argv.find(argument => argument.startsWith("--output="));
const outputPath = outputArgument ? path.resolve(projectDirectory, outputArgument.slice("--output=".length)) : null;

const match = html.match(/\/\* MATERIAL_NAMING_MODEL_START \*\/([\s\S]*?)\/\* MATERIAL_NAMING_MODEL_END \*\//);
assert.ok(match, "A material naming modellblokk hiányzik.");
const context = vm.createContext({ console });
vm.runInContext(`${match[1]}
globalThis.__NAMING__ = {
  resolve: resolveMaterialName,
  displayIndex: buildMaterialDisplayIndex,
  audit: auditMaterialNames,
  aliases: MATERIAL_NAME_ALIASES,
  safeSuffixes: MATERIAL_SAFE_TERMINAL_SUFFIXES
};`, context, { filename: "spg-material-naming-audit-model.js" });
const model = context.__NAMING__;

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  assert.equal(response.status, 200, `Wiki API hiba: ${response.status} ${url}`);
  return response.json();
}

async function fetchAllCommodities() {
  const records = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `${baseUrl}?version=${encodeURIComponent(version)}&page[size]=200&page[number]=${page}`;
    const payload = await fetchJson(url);
    records.push(...(payload.data || []));
    if (!payload.links?.next) break;
  }
  return Array.from(new Map(records.map(record => [record.uuid, record])).values());
}

async function fetchAppActiveCommodities() {
  const groups = await Promise.all(["mineable", "harvestable"].map(async kind => {
    const url = `${baseUrl}?version=${encodeURIComponent(version)}&filter[kind]=${encodeURIComponent(kind)}&page[size]=200`;
    const payload = await fetchJson(url);
    return payload.data || [];
  }));
  return Array.from(new Map(groups.flat().map(record => [record.uuid, record])).values());
}

function categories(record) {
  const result = [];
  if (record.has_ship_mineables === true) result.push("SHIP_MINING");
  if (record.has_ground_vehicle_mineables === true) result.push("VEHICLE_MINING");
  if (record.has_fps_mineables === true) result.push("FPS_MINING");
  if (record.has_harvestables === true) result.push("HARVESTABLE");
  if (!result.length) {
    const map = { ship: "SHIP_MINING", "ground vehicle": "VEHICLE_MINING", fps: "FPS_MINING", harvestable: "HARVESTABLE" };
    for (const method of record.methods || []) {
      const category = map[String(method || "").trim().toLowerCase()];
      if (category && !result.includes(category)) result.push(category);
    }
  }
  return result.length ? result : ["UNKNOWN"];
}

function auditRecord(raw) {
  return {
    uuid: raw.uuid,
    key: raw.key || null,
    slug: raw.slug || null,
    name: raw.display_name || raw.name || "",
    apiName: raw.name || "",
    rawName: raw.display_name || raw.name || "",
    display_name: raw.display_name || "",
    kind: raw.kind || null,
    categories: categories(raw),
    methods: Array.isArray(raw.methods) ? raw.methods.slice() : [],
    commodityGroups: Array.isArray(raw.commodity_groups) ? raw.commodity_groups.slice() : [],
    refinedVersion: raw.refined_version ? { uuid: raw.refined_version.uuid || null, name: raw.refined_version.name || null } : null,
    flags: {
      isMineable: raw.is_mineable === true,
      ship: raw.has_ship_mineables === true,
      vehicle: raw.has_ground_vehicle_mineables === true,
      fps: raw.has_fps_mineables === true,
      harvestable: raw.has_harvestables === true,
      salvage: raw.has_salvage === true
    }
  };
}

function suffixes(value) {
  return Array.from(String(value || "").matchAll(/\(([^()]+)\)/g), item => item[1]);
}

const [allRaw, activeRaw] = await Promise.all([fetchAllCommodities(), fetchAppActiveCommodities()]);
assert.equal(allRaw.length, 206, "A rögzített SC-verzió teljes commodity rekordszáma megváltozott.");
assert.equal(activeRaw.length, 72, "Az alkalmazás aktív mineable/harvestable commodity rekordszáma megváltozott.");
const allRecords = allRaw.map(auditRecord);
const activeRecords = activeRaw.map(auditRecord);
const naming = model.audit(activeRecords);
const suffixFrequency = {};
for (const record of allRecords) {
  for (const suffix of suffixes(record.rawName)) suffixFrequency[suffix] = (suffixFrequency[suffix] || 0) + 1;
}
const fullInvalid = allRecords.map(record => ({ record, name: model.resolve(record) })).filter(item => item.name.nameStatus !== "RESOLVED");
const requestedExamples = ["Aniant", "Decari", "Degnous", "Flareweed", "Fotia", "Golden Medmon", "Heart of the Woods", "Pingala", "Pitambu", "Prota", "Revenant", "Sunset Berry", "Woutan", "Comp Board"];
const activeDisplayNames = new Set(model.displayIndex(activeRecords).map(record => record.displayName));

const report = {
  auditId: "V003-C003",
  auditedAt: new Date().toISOString(),
  scVersion: version,
  endpoints: [
    `${baseUrl}?version=${version}&page[size]=200`,
    `${baseUrl}?version=${version}&filter[kind]=mineable&page[size]=200`,
    `${baseUrl}?version=${version}&filter[kind]=harvestable&page[size]=200`
  ],
  fullCommodityDataset: {
    total: allRecords.length,
    suffixFrequency: Object.fromEntries(Object.entries(suffixFrequency).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
    emptyName: allRecords.filter(record => !record.apiName.trim()).map(record => ({ uuid: record.uuid, key: record.key, rawName: record.rawName, kind: record.kind })),
    unknownName: allRecords.filter(record => /^UNKNOWN$/i.test(record.apiName.trim()) || /^UNKNOWN$/i.test(record.rawName.trim())).map(record => ({ uuid: record.uuid, key: record.key, rawName: record.rawName, kind: record.kind })),
    technicalFragmentOnly: allRecords.filter(record => /^\s*\([^()]+\)\s*$/.test(record.rawName)).map(record => ({ uuid: record.uuid, key: record.key, rawName: record.rawName, kind: record.kind })),
    unresolvedCount: fullInvalid.length,
    records: allRecords.map(record => Object.assign({}, record, { naming: model.resolve(record) }))
  },
  applicationActiveDataset: {
    total: activeRecords.length,
    mineableFilterCount: 40,
    harvestableFilterCount: 32,
    note: "The harvestable filter includes the API kind=remains Ranta Dung record; UUID de-duplication yields 72 active records.",
    naming,
    requestedExamplesPresent: requestedExamples.filter(name => activeDisplayNames.has(name)),
    requestedExamplesAbsentInVersion: requestedExamples.filter(name => !activeDisplayNames.has(name)),
    records: activeRecords.map(record => Object.assign({}, record, { naming: model.resolve(record) }))
  }
};

if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
}

console.log("V003_C003_LIVE_MATERIAL_AUDIT_PASS");
console.log(JSON.stringify({
  scVersion: version,
  fullRecords: report.fullCommodityDataset.total,
  activeRecords: report.applicationActiveDataset.total,
  resolved: naming.resolvedCanonicalNames,
  explicitAliasMatches: naming.explicitAliasMatches,
  suffixNormalized: naming.suffixNormalized,
  apiExact: naming.apiExact,
  unmapped: naming.unmapped,
  ambiguous: naming.ambiguous,
  hiddenInvalidRecords: naming.hiddenInvalidRecords,
  userFacingRecords: naming.userFacingRecords,
  duplicateCanonicalGroups: naming.duplicateCanonical.length,
  output: outputPath
}, null, 2));
