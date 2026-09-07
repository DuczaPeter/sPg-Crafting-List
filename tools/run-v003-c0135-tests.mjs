import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v003-c0135-canonical-material-picker.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C013.5");
const evidencePath = path.join(artifactDirectory, "canonical-material-picker-evidence.json");
const html = fs.readFileSync(appPath, "utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const block = (name) => {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-09-07T10:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000),
  foldSearchText: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
${block("C0125B_COMBINED_QUALITY_POOL_MODEL")}
globalThis.__C0135__ = {
  status: MATERIAL_IDENTITY_STATUS,
  normalizeRelation: normalizeExactMaterialIdentityRelation,
  relationsForVersion: materialIdentityRelationsForVersion,
  buildKnown: buildKnownMaterialOptions,
  auditKnown: auditKnownMaterialOptions,
  resolveSelection: resolveKnownMaterialSelection,
  buildBatch: buildCanonicalMaterialBatchRecord,
  buildInventoryGroups: buildMaterialInventoryGroups,
  allocate: allocateCardsDeterministically,
  buildCombined: buildCombinedMaterials,
  buildBackup: buildM4BackupEnvelope,
  validateBackup: validateAndMigrateM4Backup
};`, context, { filename: "spg-v003-c0135-model.js" });

const model = context.__C0135__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const provenance = { gameVersion: fixture.scVersion, source: "https://api.star-citizen.wiki/api/items", fetchedAt: "2026-09-07T10:00:00.000Z" };
const relation = model.normalizeRelation(clone(fixture.feynmalineItem), provenance);
assert.ok(relation, "A bizonyított Feynmaline item→commodity kapcsolatnak normalizálódnia kell.");
assert.equal(relation.status, model.status.VERIFIED);
assert.equal(relation.canonicalUuid, fixture.feynmaline.canonicalCommodityUuid);
assert.equal(relation.sourceUuid, fixture.feynmaline.itemUuid);
assert.equal(relation.relationWeight, 1);

const invalidWeight = clone(fixture.feynmalineItem);
invalidWeight.resource_container.default_composition[0].weight = 0.5;
assert.equal(model.normalizeRelation(invalidWeight, provenance), null, "Nem exact composition-weight nem bizonyít identityt.");
const ambiguousComposition = clone(fixture.feynmalineItem);
ambiguousComposition.resource_container.default_composition.push(clone(ambiguousComposition.resource_container.default_composition[0]));
assert.equal(model.normalizeRelation(ambiguousComposition, provenance), null, "Több composition rekord nem merge-elhető automatikusan.");
assert.equal(model.relationsForVersion([relation], "VERSION_A").length, 0, "Cross-version relation nem szivároghat az aktív indexbe.");

const card = {
  id: "c0135-card",
  order: 0,
  active: true,
  quantity: 1,
  blueprintUuid: "c0135-blueprint",
  outputName: "C013.5 Feynmaline Fixture",
  requirements: [clone(fixture.requirement)],
  slotStrategies: {},
  recipeSlotQualityPoolAssignments: {}
};
const known = model.buildKnown(
  clone(fixture.miningCommodityIndex),
  clone(fixture.batches),
  [clone(card)],
  null,
  [relation],
  fixture.scVersion
);
const byName = (name) => known.filter((record) => record.name === name);
const feynmalineOptions = byName(fixture.feynmaline.name);
assert.equal(feynmalineOptions.length, 1, "Feynmaline logical materialból egy known-material identity kell.");
assert.equal(feynmalineOptions.filter((record) => record.pickerVisible !== false).length, 1, "A pickerben Feynmaline egyszer látszhat.");
assert.equal(feynmalineOptions[0].uuid, fixture.feynmaline.canonicalCommodityUuid);
assert.ok(feynmalineOptions[0].sourceUuids.includes(fixture.feynmaline.itemUuid));
assert.equal(feynmalineOptions[0].identityStatus, model.status.VERIFIED);

const titaniumOptions = byName(fixture.titanium.name);
assert.equal(titaniumOptions.length, 1, "A refined_version exact Titanium bridge továbbra is egy identity.");
assert.equal(titaniumOptions[0].uuid, fixture.titanium.canonicalCommodityUuid);
assert.ok(titaniumOptions[0].sourceUuids.includes(fixture.titanium.relatedUuid));
assert.equal(titaniumOptions[0].pickerVisible, true);

const unresolvedOptions = byName("Unprovenium");
assert.equal(unresolvedOptions.length, 2, "A bizonyítatlan UUID-ket nem szabad name-only merge-elni.");
assert.ok(unresolvedOptions.every((record) => record.pickerVisible === false));
assert.ok(unresolvedOptions.every((record) => record.identityStatus === model.status.UNRESOLVED_DUPLICATE));
const audit = model.auditKnown(known);
assert.equal(audit.userFacingMaterialNameCount, 3);
assert.equal(audit.visiblePickerOptionCount, 2);
assert.equal(audit.exactCanonicalMultiUuidMaterialCount, 2);
assert.equal(audit.unresolvedDuplicateCount, 1);
assert.deepEqual(clone(audit.unresolvedDuplicates[0]), {
  name: "Unprovenium",
  uuids: ["c0135-unresolved-a", "c0135-unresolved-b"]
});

const nameSelection = model.resolveSelection("Feynmaline", "", known);
assert.equal(nameSelection.uuid, fixture.feynmaline.canonicalCommodityUuid, "Material name change canonical UUID-t tölt.");
assert.equal(model.resolveSelection("Feynmaline", fixture.feynmaline.itemUuid, known).uuid, fixture.feynmaline.canonicalCommodityUuid);
assert.equal(model.resolveSelection("Unprovenium", "", known), null, "Unresolved duplicate név nem tölthet UUID-t.");
assert.equal(model.resolveSelection("Feynmalin", "", known), null, "Fuzzy névfeloldás tilos.");

const newBatch = model.buildBatch({
  materialUuid: fixture.feynmaline.itemUuid,
  materialName: "Feynmaline",
  quality: 750,
  quantityUnits: 2500,
  unit: "SCU",
  note: "C013.5 canonical-save"
}, known, null, "2026-09-07T10:01:00.000Z", "c0135-new-batch");
assert.equal(newBatch.materialUuid, fixture.feynmaline.canonicalCommodityUuid);
assert.equal(newBatch.sourceMaterialUuid, fixture.feynmaline.itemUuid);
assert.equal(newBatch.materialName, "Feynmaline");

const originalStoredBatches = clone(fixture.batches);
const inventoryGroups = model.buildInventoryGroups(clone(fixture.batches).concat(newBatch), known);
const feynmalineGroup = inventoryGroups.find((group) => group.materialUuid === fixture.feynmaline.canonicalCommodityUuid);
assert.ok(feynmalineGroup);
assert.equal(feynmalineGroup.batches.length, 3);
assert.equal(feynmalineGroup.batches.reduce((sum, batch) => sum + batch.quantityUnits, 0), 15500);
assert.ok(feynmalineGroup.sourceUuids.includes(fixture.feynmaline.itemUuid));
assert.deepEqual(clone(fixture.batches), originalStoredBatches, "A runtime canonical projection nem írhatja át a régi User Data batch-eket.");

const allocation = model.allocate([clone(card)], clone(fixture.batches), {}, known, {});
const allocatedRequirement = allocation.cards[0].requirements[0];
assert.equal(allocatedRequirement.allocatedUnits, 10000);
assert.equal(allocatedRequirement.missingAmountUnits + allocatedRequirement.missingQualityUnits, 0);
assert.equal(allocation.summary.totalReservedUnits, 10000);
assert.ok(allocation.batchUsage.every((batch) => batch.reservedUnits <= batch.quantityUnits), "Double reserve tilos.");
const combined = model.buildCombined(allocation, [clone(card)], clone(fixture.batches), known);
assert.equal(combined.length, 1);
assert.equal(combined[0].materialUuid, fixture.feynmaline.canonicalCommodityUuid);
assert.equal(combined[0].availableUnits, 13000);
assert.equal(combined[0].reservedUnits, 10000);
assert.equal(combined[0].missingUnits, 0);

const reloadedKnown = model.buildKnown(clone(fixture.miningCommodityIndex), clone(fixture.batches), [clone(card)], null, [clone(relation)], fixture.scVersion);
assert.deepEqual(clone(reloadedKnown), clone(known), "Reload után a canonical picker determinisztikus.");
const userData = { userInventory: [], materialBatches: clone(fixture.batches).concat(newBatch), craftingCards: [clone(card)], miningLoadouts: [], userSettings: [] };
const backup = model.buildBackup(userData, { applicationVersion: "V003-dev", exportedAt: "2026-09-07T10:02:00.000Z" });
const restored = model.validateBackup(backup).backup.data;
assert.equal(restored.materialBatches.length, 3);
assert.equal(restored.materialBatches.find((batch) => batch.id === newBatch.id).sourceMaterialUuid, fixture.feynmaline.itemUuid);

assert.match(html, /state\.materialIdentityRelations/);
assert.match(html, /getItemsBySubType\(harvestableItemFacet\.value, version\)/);
assert.match(html, /state\.knownMaterials\.filter\(function \(record\) \{ return record\.pickerVisible !== false; \}\)/);
assert.match(html, /buildCanonicalMaterialBatchRecord\(/);
assert.match(html, /materialIdentity: m4Clone\(state\.knownMaterialIdentityAudit/);
assert.match(html, /function visibleMaterialDatabaseIndex\(\)[\s\S]*?buildCanonicalMaterialCatalog\(state\.miningCommodityIndex/);
assert.doesNotMatch(block("C0135_CANONICAL_MATERIAL_IDENTITY_MODEL"), /levenshtein|similarity|startsWith\(.*name|includes\(.*name/iu);

const evidence = {
  cycle: "V003-C013.5",
  status: "PASS",
  activeScVersion: fixture.scVersion,
  feynmaline: {
    visiblePickerOptions: feynmalineOptions.filter((record) => record.pickerVisible !== false).length,
    canonicalUuid: feynmalineOptions[0].uuid,
    sourceUuids: feynmalineOptions[0].sourceUuids,
    nameToUuidAutofill: nameSelection.uuid,
    canonicalNewBatch: { materialUuid: newBatch.materialUuid, sourceMaterialUuid: newBatch.sourceMaterialUuid }
  },
  titanium: {
    visiblePickerOptions: titaniumOptions.filter((record) => record.pickerVisible !== false).length,
    canonicalUuid: titaniumOptions[0].uuid,
    sourceUuids: titaniumOptions[0].sourceUuids
  },
  audit,
  checks: {
    canonicalInventoryGrouping: "PASS",
    exactUuidResolution: "PASS",
    materialNameToUuidAutofill: "PASS",
    canonicalBatchSave: "PASS",
    existingBatchDestructiveMigration: "NO",
    reload: "PASS",
    backupRestoreSourceProvenance: "PASS",
    combinedParity: "PASS",
    allocationParity: "PASS",
    noDoubleReserve: "PASS",
    noFuzzyOrNameOnlyMerge: "PASS",
    unresolvedDuplicateAudit: "PASS"
  }
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0135_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
