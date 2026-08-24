import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const fixture = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "v003-c005-consistency.json"), "utf8"));
const scmdbFixture = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "v003-c004-scmdb-reference.json"), "utf8"));
const modelMatch = html.match(/\/\* M3_MINING_MODEL_START \*\/([\s\S]*?)\/\* M3_MINING_MODEL_END \*\//);
assert.ok(modelMatch, "Az M3 mining modellblokk hiányzik.");

const context = vm.createContext({ console });
vm.runInContext(`${modelMatch[1]}
globalThis.__C005__ = {
  categories: M3_MINING_CATEGORIES,
  registry: RADAR_SIGNATURE_REGISTRY,
  normalizeMiningCommodityIndex,
  resolveRadarSignature,
  buildMaterialDisplayIndex
};`, context, { filename: "spg-v003-c005-model.js" });
const model = context.__C005__;
const provenance = { gameVersion: fixture.wikiVersion, dataSource: "Star Citizen Wiki API", source: "V003-C005 fixture", fetchedAt: "2026-08-24T00:00:00.000Z", origin: "FIXTURE" };

assert.equal(model.registry.length, 33, "A C004 Radar registry rekordszáma megváltozott.");
for (const expected of fixture.provenCategoryMaterials) {
  const record = model.registry.find(candidate => candidate.uuid === expected.uuid);
  assert.ok(record, `${expected.canonicalName}: hiányzó exact UUID-s Radar rekord.`);
  assert.equal(record.miningCategory, expected.category, expected.canonicalName);
  assert.equal(record.sourceRow, expected.radarSourceRow, expected.canonicalName);
  assert.equal(record.derivation, "VERIFIED_CATEGORY_ROW_WITH_WIKI_MINING_CATEGORY", expected.canonicalName);
}

for (const expected of fixture.rightfullyUnmappedTargets) {
  const raw = {
    uuid: expected.uuid,
    name: expected.apiName,
    display_name: expected.apiName,
    has_ship_mineables: false,
    has_ground_vehicle_mineables: false,
    has_fps_mineables: false,
    has_harvestables: false,
    methods: [],
    systems: [],
    locations: [],
    signature: 3000
  };
  const normalized = model.normalizeMiningCommodityIndex(raw, provenance);
  const radar = model.resolveRadarSignature(normalized);
  assert.deepEqual(Array.from(normalized.categories), [model.categories.UNKNOWN], `${expected.canonicalName}: bizonyíték nélkül mining kategóriát kapott.`);
  assert.equal(radar.status, "UNMAPPED", `${expected.canonicalName}: bizonyíték nélkül Radar-registry egyezést kapott.`);
  assert.equal(radar.displayValue, "Nincs adat", expected.canonicalName);
  assert.equal(radar.apiRaw.status, "API_RAW_NOT_USER_FACING", expected.canonicalName);
}

const aluminumScmdb = scmdbFixture.comparisonCases.find(entry => entry.material === "Aluminum" && entry.system === "Stanton System" && entry.environment === "SPACE" && entry.status === "MATCH");
assert.ok(aluminumScmdb, "Az Aluminum/Stanton/SPACE SCMDB audit eset hiányzik.");
assert.match(aluminumScmdb.reason, /primary Lagrange F Aluminum resource is included at dense rank 2/i);
assert.match(aluminumScmdb.reason, /Corundum resources.*secondary material.*excluded/i);
assert.doesNotMatch(aluminumScmdb.reason, /secondary Lagrange F Aluminum is excluded/i);

assert.match(html, /radarSignatureClusterSignatures:\s*\(\(detail \? detail\.radarSignatureClusterSignatures : commodity\.radarSignatureClusterSignatures\) \|\| \[\]\)\.slice\(\)/, "A régi detail cache null-safe cluster-projekciója eltűnt.");
assert.match(html, /withRadarSignatureProjection\(withResolvedMaterialName\(Object\.assign\(\{\}, record/, "A régi index cache közös Radar-projekciója eltűnt.");
assert.match(html, /method\.tierDisplayLabel \|\| method\.locationLabel/, "A Material Database nem a közös recommendation-projekciót használja.");
assert.match(html, /m6EscapeHtml\(method\.tierDisplayLabel \|\| method\.locationLabel\)/, "A standalone export nem a közös recommendation-projekciót használja.");

for (const documentPath of ["TASKS.md", "DECISIONS.md"]) {
  const text = fs.readFileSync(path.join(projectDirectory, documentPath), "utf8");
  for (const cycle of ["C006", "C007", "C008", "C009", "C010"]) {
    assert.match(text, new RegExp(`V003-${cycle}`), `${documentPath}: hiányzó V003-${cycle} roadmap.`);
  }
}

console.log("V003_C005_CONSISTENCY_TEST_PASS");
console.log(JSON.stringify({
  radarRegistryRecords: model.registry.length,
  provenRocFpsRecords: fixture.provenCategoryMaterials.length,
  newlyVerifiedFromPreviouslyUnmapped: 0,
  targetedRightfullyUnmapped: fixture.rightfullyUnmappedTargets.length,
  lagrangeFScmdbReasonCorrected: true,
  legacyCacheGuards: "PASS",
  roadmapCycles: ["V003-C006", "V003-C007", "V003-C008", "V003-C009", "V003-C010"]
}, null, 2));
