import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const fixture = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "v003-c003-material-names.json"), "utf8"));

function block(name) {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
}

const context = vm.createContext({ console });
vm.runInContext(`${block("MATERIAL_NAMING_MODEL")}
${block("M61_UI_COMPLETENESS_MODEL")}
globalThis.__C003__ = {
  statuses: MATERIAL_NAME_STATUS,
  sources: MATERIAL_NAME_SOURCE,
  aliases: MATERIAL_NAME_ALIASES,
  resolve: resolveMaterialName,
  display: resolveMaterialDisplayName,
  displayIndex: buildMaterialDisplayIndex,
  audit: auditMaterialNames,
  filter: m61FilterMaterialIndex
};`, context, { filename: "spg-v003-c003-model.js" });

const model = context.__C003__;

for (const testCase of fixture.cases) {
  const result = model.resolve(testCase);
  assert.equal(result.nameStatus, model.statuses.RESOLVED, testCase.display_name);
  assert.equal(result.displayName, testCase.expected, testCase.display_name);
  assert.equal(result.nameSource, testCase.source, testCase.display_name);
  assert.equal(result.rawName, testCase.display_name, "A raw API névnek meg kell maradnia.");
}

for (const invalid of fixture.invalid) {
  const result = model.resolve(invalid);
  assert.equal(result.displayName, null);
  assert.equal(result.nameStatus, model.statuses.UNMAPPED);
  assert.equal(result.diagnosticStatus, invalid.diagnosticStatus);
}

const wrongUuidAlias = model.resolve({
  uuid: "not-the-verified-beradom-uuid",
  name: "Beradom",
  display_name: "Beradom (Mineral)"
});
assert.equal(wrongUuidAlias.displayName, "Beradom", "Az alias nem alkalmazható puszta névegyezéssel más UUID-ra.");
assert.notEqual(wrongUuidAlias.nameSource, model.sources.EXPLICIT_ALIAS);

const wrongVersionAlias = model.resolve({
  uuid: "c339897c-d682-48ad-a16f-daf145bc0f4d",
  name: "Beradom",
  display_name: "Beradom (Mineral)",
  scVersion: "UNVERIFIED-SC-VERSION"
});
assert.equal(wrongVersionAlias.displayName, "Beradom", "Az alias nem alkalmazható nem ellenőrzött SC-verzióra.");
assert.notEqual(wrongVersionAlias.nameSource, model.sources.EXPLICIT_ALIAS);

const related = model.displayIndex(fixture.relatedDuplicate);
assert.equal(related.length, 1, "A refined_version kapcsolattal bizonyított Tungsten rekordokat egy user-facing rekordba kell vetíteni.");
assert.equal(related[0].displayName, "Tungsten");
assert.deepEqual(Array.from(related[0].sourceUuids), [
  "60f116f4-c02a-45b2-9ded-333747795124",
  "addc9aa4-5d2d-4c0d-b01b-ad2b2e50a5d6"
]);
assert.equal(related[0].duplicateCanonicalStatus, "RELATED_TECHNICAL_RECORDS");

const unrelated = model.displayIndex(fixture.unrelatedDuplicate);
assert.equal(unrelated.length, 2, "Bizonyítatlan azonos canonical nevet nem szabad UUID alapján összemosni.");

const searchable = model.displayIndex(fixture.cases.concat(fixture.relatedDuplicate));
assert.ok(model.filter(searchable, "agri", "").some(record => record.displayName === "Agricium"));
assert.ok(model.filter(searchable, "Agricium (Ore) (UnrefinedOres)", "").some(record => record.displayName === "Agricium"));
assert.ok(model.filter(searchable, "beradom", "").some(record => record.displayName === "Beradon"));
assert.ok(model.filter(searchable, "ber", "").some(record => record.displayName === "Beryl"));

const audit = model.audit(fixture.cases.concat(fixture.invalid, fixture.relatedDuplicate, fixture.unrelatedDuplicate));
assert.equal(audit.explicitMappingRecordCount, 11);
assert.equal(audit.unmapped, 2);
assert.equal(audit.ambiguous, 0);
assert.equal(audit.hiddenInvalidRecords, 2);
assert.ok(audit.duplicateCanonical.some(group => group.canonicalName === "Tungsten" && group.decision === "RELATED_TECHNICAL_RECORDS"));
assert.ok(audit.duplicateCanonical.some(group => group.canonicalName === "Fixture Crystal" && group.decision === "SEPARATE_UNPROVEN"));

for (const forbidden of ["(Ore)", "(Raw)", "(Mineral)", "(UnrefinedOres)", "(Raw_Minerals)", "UNKNOWN"]) {
  assert.ok(!searchable.some(record => record.displayName === forbidden || record.displayName?.includes(forbidden)), `Technikai név maradt a display indexben: ${forbidden}`);
}
assert.match(html, /materialName:\s*materialDisplayName/, "A standalone snapshot nem a közös display-name resolvert használja.");
assert.match(html, /resolveMaterialDisplayName\(\{ uuid: requirement\.ingredientUuid, materialName: requirement\.materialName \}/, "A Crafting List nem a közös resolvert használja.");
assert.match(html, /buildMaterialDisplayIndex\(state\.miningCommodityIndex\)/, "A Material Database nem a közös user-facing projekciót használja.");

console.log("V003_C003_MATERIAL_NAMING_TEST_PASS");
console.log(JSON.stringify({
  mandatoryCases: 20,
  registryVersion: fixture.gameVersion,
  explicitMappingRecords: model.aliases.length,
  fixtureAudit: audit
}, null, 2));
