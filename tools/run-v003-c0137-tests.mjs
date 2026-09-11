import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { buildM4HarnessSource, loadVerifiedCandidateHtml } from "./v004-c0081-harness-loader.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = process.env.SPG_APP_PATH
  ? path.resolve(process.env.SPG_APP_PATH)
  : path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v003-c0137-user-data-independent-canonical-picker.json");
const artifactDirectory = process.env.SPG_ARTIFACT_DIRECTORY
  ? path.resolve(process.env.SPG_ARTIFACT_DIRECTORY)
  : path.join(projectDirectory, "test-artifacts", "V003-C013.7");
const evidencePath = path.join(artifactDirectory, "user-data-independent-canonical-picker-evidence.json");
const verifiedApplication = loadVerifiedCandidateHtml({ localApplicationPath: appPath });
const html = verifiedApplication.html;
const m4HarnessSource = buildM4HarnessSource(html);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const block = (name) => {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-09-08T08:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000),
  foldSearchText: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
});
vm.runInContext(`${m4HarnessSource}
${block("MATERIAL_NAMING_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
${block("C0125B_COMBINED_QUALITY_POOL_MODEL")}
globalThis.__C0137__ = {
  modelVersion: MATERIAL_IDENTITY_MODEL_VERSION,
  status: MATERIAL_IDENTITY_STATUS,
  authority: MATERIAL_CANONICAL_AUTHORITY,
  buildCatalog: buildCanonicalMaterialCatalog,
  buildKnown: buildKnownMaterialOptions,
  auditKnown: auditKnownMaterialOptions,
  resolveSelection: resolveKnownMaterialSelection,
  buildBatch: buildCanonicalMaterialBatchRecord,
  buildInventoryGroups: buildMaterialInventoryGroups,
  allocate: allocateCardsDeterministically,
  buildCombined: buildCombinedMaterials,
  buildBackup: buildM4BackupEnvelope,
  validateBackup: validateAndMigrateM4Backup,
  defaultUserMetaRecords: v004DefaultUserMetaRecords
};`, context, { filename: "spg-v003-c0137-model.js" });

const model = context.__C0137__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const commodityIndex = fixture.materials.map((material) => clone(material.commodity));
const relations = fixture.materials.map((material) => material.relation).filter(Boolean).map(clone);
const legacyBatchFor = (material, index = 0) => ({
  id: `c0137-${material.name.toLowerCase()}-legacy-${index}`,
  materialUuid: material.sourceUuid,
  sourceMaterialUuid: material.sourceUuid,
  materialName: material.name,
  quality: 600 + index,
  quantityUnits: 7000 + index * 1000,
  unit: "SCU",
  createdAt: `2026-09-08T08:00:0${index}.000Z`
});
const buildKnown = (batches) => model.buildKnown(commodityIndex, clone(batches || []), [], null, relations, fixture.scVersion);
const optionFor = (known, material) => {
  const records = known.filter((record) => record.name === material.name);
  assert.equal(records.length, 1, `${material.name}: pontosan egy logical identity kell.`);
  assert.equal(records[0].pickerVisible, true, `${material.name}: a canonical opciónak láthatónak kell maradnia.`);
  return records[0];
};

assert.equal(model.modelVersion, "V003-C013.7-1");
const invariance = [];
for (const material of fixture.materials) {
  const noUserData = buildKnown([]);
  const noUserOption = optionFor(noUserData, material);
  const legacyBatch = legacyBatchFor(material);
  const originalLegacy = clone(legacyBatch);
  const withLegacyUserData = buildKnown([legacyBatch]);
  const withLegacyOption = optionFor(withLegacyUserData, material);
  const resolvedByName = model.resolveSelection(material.name, "", withLegacyUserData);
  const resolvedByLegacyUuid = model.resolveSelection(material.name, material.sourceUuid, withLegacyUserData);

  assert.equal(noUserOption.uuid, material.canonicalUuid, `${material.name}: User Data nélkül canonical UUID kell.`);
  assert.equal(withLegacyOption.uuid, material.canonicalUuid, `${material.name}: legacy batch nem írhatja felül a canonical UUID-t.`);
  assert.equal(noUserOption.uuid, withLegacyOption.uuid, `${material.name}: picker canonical invariance sérült.`);
  assert.equal(resolvedByName.uuid, material.canonicalUuid);
  assert.equal(resolvedByLegacyUuid.uuid, material.canonicalUuid);
  assert.ok(withLegacyOption.sourceUuids.includes(material.sourceUuid), `${material.name}: source provenance hiányzik.`);
  assert.ok(withLegacyOption.canonicalAuthorityRank >= model.authority.CANONICAL_COMMODITY_RECORD);
  assert.deepEqual(legacyBatch, originalLegacy, `${material.name}: a runtime projection módosította a User Data batch-et.`);

  invariance.push({
    name: material.name,
    canonicalUuid: material.canonicalUuid,
    sourceUuid: material.sourceUuid,
    pickerCanonicalUuidNoUserData: noUserOption.uuid,
    pickerCanonicalUuidWithLegacyUserData: withLegacyOption.uuid,
    equal: noUserOption.uuid === withLegacyOption.uuid,
    authority: withLegacyOption.canonicalAuthoritySource
  });
}

const titanium = fixture.materials.find((material) => material.name === "Titanium");
const oldTitaniumBatch = {
  ...legacyBatchFor(titanium),
  id: "c0137-titanium-q784-legacy",
  quality: 784,
  quantityUnits: 17440
};
const oldTitaniumSnapshot = clone(oldTitaniumBatch);
const titaniumKnownWithLegacy = buildKnown([oldTitaniumBatch]);
const newTitaniumBatch = model.buildBatch({
  materialUuid: titanium.sourceUuid,
  materialName: titanium.name,
  quality: 866,
  quantityUnits: 31240,
  unit: "SCU",
  note: "C013.7 canonical-save beside legacy batch"
}, titaniumKnownWithLegacy, null, "2026-09-08T08:01:00.000Z", "c0137-titanium-q866-new");
assert.equal(newTitaniumBatch.materialUuid, titanium.canonicalUuid);
assert.equal(newTitaniumBatch.sourceMaterialUuid, titanium.sourceUuid);
assert.deepEqual(oldTitaniumBatch, oldTitaniumSnapshot, "A régi Titanium batch nem törlődhet vagy migrálódhat destruktívan.");

const thirdTitaniumBatch = model.buildBatch({
  materialUuid: titanium.canonicalUuid,
  materialName: titanium.name,
  quality: 920,
  quantityUnits: 10000,
  unit: "SCU",
  note: "C013.7 third Quality batch"
}, titaniumKnownWithLegacy, null, "2026-09-08T08:02:00.000Z", "c0137-titanium-q920-new");
const titaniumBatches = [oldTitaniumBatch, newTitaniumBatch, thirdTitaniumBatch];
const titaniumKnown = buildKnown(titaniumBatches);
const titaniumGroups = model.buildInventoryGroups(clone(titaniumBatches), titaniumKnown);
assert.equal(titaniumGroups.length, 1);
assert.equal(titaniumGroups[0].materialUuid, titanium.canonicalUuid);
assert.equal(titaniumGroups[0].batches.length, 3);
assert.deepEqual(clone(titaniumGroups[0].batches.map((batch) => batch.quality).sort((a, b) => a - b)), [784, 866, 920]);
assert.ok(titaniumGroups[0].sourceUuids.includes(titanium.sourceUuid));

const reloadedKnown = buildKnown(clone(titaniumBatches));
assert.equal(model.resolveSelection(titanium.name, "", reloadedKnown).uuid, titanium.canonicalUuid);
assert.deepEqual(clone(reloadedKnown), clone(titaniumKnown), "Reload után a picker projection determinisztikus.");

const requirement = {
  id: "c0137-titanium-slot",
  ingredientUuid: titanium.sourceUuid,
  commodityUuid: titanium.canonicalUuid,
  materialName: titanium.name,
  recipeSlotName: "Titanium Slot",
  requiredQuantityUnits: 40000,
  unit: "SCU",
  qualityCapability: "FIXED",
  affectedStats: []
};
const card = {
  id: "c0137-card",
  order: 0,
  active: true,
  quantity: 1,
  blueprintUuid: "c0137-blueprint",
  outputName: "C013.7 Canonical Fixture",
  requirements: [requirement],
  slotStrategies: {},
  recipeSlotQualityPoolAssignments: {}
};
const allocation = model.allocate([clone(card)], clone(titaniumBatches), {}, titaniumKnown, {});
assert.equal(allocation.summary.totalReservedUnits, 40000);
assert.ok(allocation.batchUsage.every((batch) => batch.reservedUnits <= batch.quantityUnits), "Double reserve tilos.");
const combined = model.buildCombined(allocation, [clone(card)], clone(titaniumBatches), titaniumKnown);
assert.equal(combined.length, 1);
assert.equal(combined[0].materialUuid, titanium.canonicalUuid);
assert.equal(combined[0].availableUnits, 58680);
assert.equal(combined[0].reservedUnits, allocation.summary.totalReservedUnits);

const userData = {
  userInventory: [], materialBatches: clone(titaniumBatches), craftingCards: [clone(card)], miningLoadouts: [], userSettings: [],
  craftHistory: [], userMeta: clone(model.defaultUserMetaRecords())
};
const backup = model.buildBackup(userData, { applicationVersion: "V003-dev", exportedAt: "2026-09-08T08:03:00.000Z" });
const restored = model.validateBackup(backup).backup.data;
assert.deepEqual(clone(restored.materialBatches).sort((a, b) => a.id.localeCompare(b.id)), clone(titaniumBatches).sort((a, b) => a.id.localeCompare(b.id)));
assert.equal(restored.materialBatches.find((batch) => batch.id === oldTitaniumBatch.id).materialUuid, titanium.sourceUuid);
assert.equal(buildKnown(restored.materialBatches).find((record) => record.name === titanium.name).uuid, titanium.canonicalUuid);

const unresolvedRecords = fixture.unresolved.uuids.map((uuid) => ({
  uuid,
  name: fixture.unresolved.name,
  display_name: fixture.unresolved.name,
  kind: "harvestable",
  categories: ["HARVESTABLE"],
  refinedVersion: null,
  provenance: { gameVersion: fixture.scVersion }
}));
const unresolvedKnown = model.buildKnown(commodityIndex.concat(unresolvedRecords), [
  { ...legacyBatchFor({ name: fixture.unresolved.name, sourceUuid: fixture.unresolved.uuids[0] }), materialUuid: fixture.unresolved.uuids[0] }
], [], null, relations, fixture.scVersion);
const unresolvedOptions = unresolvedKnown.filter((record) => record.name === fixture.unresolved.name);
assert.equal(unresolvedOptions.length, 2, "A User Data nem merge-elhet bizonyítatlan azonos nevű identityket.");
assert.ok(unresolvedOptions.every((record) => record.pickerVisible === false));
assert.ok(unresolvedOptions.every((record) => record.identityStatus === model.status.UNRESOLVED_DUPLICATE));
assert.equal(model.resolveSelection(fixture.unresolved.name, "", unresolvedKnown), null);
assert.equal(model.resolveSelection("Titaniu", "", titaniumKnown), null, "Fuzzy névfeloldás továbbra is tilos.");

assert.match(html, /function canonicalMaterialAuthority\(/);
assert.match(html, /USER_DATA_PROVENANCE:\s*100[\s\S]*VERIFIED_EXACT_API_RELATION:\s*400/);
assert.match(html, /refinedSourceUuids[\s\S]*WIKI_COMMODITY_REFINED_VERSION/);
assert.match(html, /buildKnownMaterialOptions\(state\.miningCommodityIndex, state\.materialBatches, state\.craftingCards, state\.normalizedBlueprint, state\.materialIdentityRelations, resolveActiveScVersion\(state\)\)/);
assert.doesNotMatch(block("C0135_CANONICAL_MATERIAL_IDENTITY_MODEL"), /levenshtein|similarity|startsWith\(.*name|includes\(.*name/iu);

const evidence = {
  cycle: "V003-C013.7",
  status: "PASS",
  rootCause: "DANGLING_REFINED_VERSION_SOURCE_UUID_WAS_NOT_PROJECTED_AND_USER_INVENTORY_COULD_CREATE_A_SECOND_PICKER_IDENTITY",
  modelVersion: model.modelVersion,
  precedence: ["VERIFIED_EXACT_API_RELATION", "CANONICAL_COMMODITY_RECORD", "VERIFIED_SOURCE_RELATION", "USER_DATA_PROVENANCE"],
  invariance,
  titanium: {
    oldBatchPreserved: clone(oldTitaniumBatch),
    newBatch: clone(newTitaniumBatch),
    logicalMaterialCount: titaniumGroups.length,
    batchCount: titaniumGroups[0].batches.length,
    qualities: titaniumGroups[0].batches.map((batch) => batch.quality).sort((a, b) => a - b),
    reloadCanonicalUuid: model.resolveSelection(titanium.name, "", reloadedKnown).uuid
  },
  checks: {
    userDataIndependentCanonicalPicker: "PASS",
    newBatchBesideLegacyBatch: "PASS",
    multipleQualityBatches: "PASS",
    destructiveMigration: "NO",
    sourceProvenance: "PASS",
    reload: "PASS",
    backupRestore: "PASS",
    myMaterialsGrouping: "PASS",
    combinedParity: "PASS",
    allocationParity: "PASS",
    noDoubleReserve: "PASS",
    noFuzzyOrNameOnlyMerge: "PASS",
    unresolvedDuplicateFailSafe: "PASS"
  }
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0137_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
