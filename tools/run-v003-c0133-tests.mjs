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
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v003-c0133-disjoint-pools-canonical-grouping.json");
const artifactDirectory = process.env.SPG_ARTIFACT_DIRECTORY
  ? path.resolve(process.env.SPG_ARTIFACT_DIRECTORY)
  : path.join(projectDirectory, "test-artifacts", "V003-C013.3");
const evidencePath = path.join(artifactDirectory, "disjoint-pools-canonical-grouping-evidence.json");
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
  nowIso: () => "2026-09-07T08:30:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000),
  foldSearchText: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
});
vm.runInContext(`${m4HarnessSource}
${block("MATERIAL_NAMING_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
${block("C0125B_COMBINED_QUALITY_POOL_MODEL")}
${block("C0125C3B2_STANDALONE_QUALITY_PROJECTION")}
globalThis.__C0133__ = {
  rules: M2_QUALITY_RULES,
  modes: RECIPE_SLOT_QUALITY_POOL_MODES,
  rangeStatus: MATERIAL_QUALITY_POOL_RANGE_STATUS,
  resolveRange: resolveMaterialQualityPoolRange,
  formatRange: formatMaterialQualityPoolRange,
  eligibleUnits: calculateQualityPoolEligibleInventoryUnits,
  allocate: allocateCardsDeterministically,
  buildCombined: buildCombinedMaterials,
  buildOverview: buildCombinedMaterialsOverviewViewModel,
  buildKnown: buildKnownMaterialOptions,
  buildInventoryGroups: buildMaterialInventoryGroups,
  projectStandaloneQuality: projectStandaloneEffectiveQuality,
  buildBackup: buildM4BackupEnvelope,
  validateBackup: validateAndMigrateM4Backup,
  importBackup: simulateM4UserDataImport,
  defaultUserMetaRecords: v004DefaultUserMetaRecords
};`, context, { filename: "spg-v003-c0133-model.js" });

const model = context.__C0133__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const material = fixture.material;
const canonical = [{
  uuid: material.commodityUuid,
  displayName: material.name,
  sourceUuids: [material.commodityUuid, material.ingredientUuid]
}];
const pools = { [material.commodityUuid]: clone(fixture.qualityPool) };
const modes = model.modes;
const assignments = {
  [fixture.requirements[0].id]: modes.MINIMUM_Q_POOL,
  [fixture.requirements[1].id]: modes.MAXIMUM_Q_POOL
};
const makeCard = (id, order, requirements = fixture.requirements, slotAssignments = assignments) => ({
  id,
  order,
  active: true,
  quantity: 1,
  blueprintUuid: "c0133-titanium-blueprint",
  outputName: "C013.3 Titanium Fixture",
  requirements: clone(requirements),
  slotStrategies: {},
  recipeSlotQualityPoolAssignments: clone(slotAssignments)
});
const requirement = (allocation, cardId, slotId) => allocation.cards.find((card) => card.cardId === cardId).requirements.find((entry) => entry.recipeSlotId === slotId);

const minimumRange = model.resolveRange(fixture.qualityPool, modes.MINIMUM_Q_POOL);
const maximumRange = model.resolveRange(fixture.qualityPool, modes.MAXIMUM_Q_POOL);
assert.deepEqual(clone(minimumRange), { status: "RESOLVED", minimumInclusive: 500, maximumExclusive: 800, reason: "MINIMUM_POOL_DISJOINT_RANGE" });
assert.deepEqual(clone(maximumRange), { status: "RESOLVED", minimumInclusive: 800, maximumExclusive: null, reason: "MAXIMUM_POOL_RANGE" });
assert.equal(model.formatRange(fixture.qualityPool, modes.MINIMUM_Q_POOL), "Q500–Q799");
assert.equal(model.formatRange(fixture.qualityPool, modes.MAXIMUM_Q_POOL), "Q800+");
assert.equal(model.eligibleUnits(fixture.batches, material.commodityUuid, "SCU", fixture.qualityPool, modes.MINIMUM_Q_POOL, canonical), 17440);
assert.equal(model.eligibleUnits(fixture.batches, material.commodityUuid, "SCU", fixture.qualityPool, modes.MAXIMUM_Q_POOL, canonical), 31240);
const q866Only = fixture.batches.filter((batch) => batch.quality === 866);
assert.equal(model.eligibleUnits(q866Only, material.commodityUuid, "SCU", fixture.qualityPool, modes.MINIMUM_Q_POOL, canonical), 0);
assert.equal(model.eligibleUnits(q866Only, material.commodityUuid, "SCU", fixture.qualityPool, modes.MAXIMUM_Q_POOL, canonical), 31240);

const invalidPool = { minimumQ: 800, maximumQ: 800 };
assert.equal(model.resolveRange(invalidPool, modes.MINIMUM_Q_POOL).status, model.rangeStatus.INVALID);
assert.equal(model.resolveRange(invalidPool, modes.MAXIMUM_Q_POOL).status, model.rangeStatus.INVALID);
assert.equal(model.eligibleUnits(fixture.batches, material.commodityUuid, "SCU", invalidPool, modes.MINIMUM_Q_POOL, canonical), null);
const minimumOnlyPool = { minimumQ: 500, maximumQ: null };
assert.equal(model.resolveRange(minimumOnlyPool, modes.MINIMUM_Q_POOL).maximumExclusive, null);
assert.equal(model.eligibleUnits(fixture.batches, material.commodityUuid, "SCU", minimumOnlyPool, modes.MINIMUM_Q_POOL, canonical), 48680);
const maximumOnlyPool = { minimumQ: null, maximumQ: 800 };
assert.equal(model.resolveRange(maximumOnlyPool, modes.MAXIMUM_Q_POOL).minimumInclusive, 800);
assert.equal(model.eligibleUnits(fixture.batches, material.commodityUuid, "SCU", maximumOnlyPool, modes.MAXIMUM_Q_POOL, canonical), 31240);

const known = model.buildKnown(canonical, clone(fixture.batches), [], null);
assert.equal(known.length, 1, "Az exact commodity/ingredient bridge egy logical materialt kell adjon.");
assert.equal(known[0].uuid, material.commodityUuid);
assert.ok(known[0].sourceUuids.includes(material.ingredientUuid));
const inventoryGroups = model.buildInventoryGroups(clone(fixture.batches), canonical);
assert.equal(inventoryGroups.length, 1);
assert.equal(inventoryGroups[0].materialUuid, material.commodityUuid);
assert.equal(inventoryGroups[0].batches.length, 2);
assert.equal(inventoryGroups[0].batches.reduce((sum, batch) => sum + batch.quantityUnits, 0), 48680);
assert.ok(inventoryGroups[0].batches.some((batch) => batch.sourceMaterialUuid === material.ingredientUuid));

const unlinked = [
  { uuid: "c0133-unlinked-a", displayName: "Titanium", sourceUuids: ["c0133-unlinked-a"] },
  { uuid: "c0133-unlinked-b", displayName: "Titanium", sourceUuids: ["c0133-unlinked-b"] }
];
const unlinkedBatches = [
  { ...fixture.batches[0], id: "unlinked-a", materialUuid: unlinked[0].uuid, sourceMaterialUuid: unlinked[0].uuid },
  { ...fixture.batches[1], id: "unlinked-b", materialUuid: unlinked[1].uuid, sourceMaterialUuid: unlinked[1].uuid }
];
assert.equal(model.buildInventoryGroups(unlinkedBatches, unlinked).length, 2, "Name-only merge tilos.");

const card = makeCard("c0133-card", 0);
const allocation = model.allocate([card], clone(fixture.batches), {}, canonical, pools);
const minimum = requirement(allocation, card.id, fixture.requirements[0].id);
const maximum = requirement(allocation, card.id, fixture.requirements[1].id);
assert.deepEqual(clone(maximum.allocatedBatches.map((batch) => batch.batchId)), ["c0133-titanium-q866"]);
assert.equal(maximum.allocatedUnits, 10000);
assert.deepEqual(clone(minimum.allocatedBatches.map((batch) => batch.batchId)), ["c0133-titanium-q784"]);
assert.equal(minimum.allocatedUnits, 17440);
assert.equal(minimum.missingAmountUnits, 0);
assert.equal(minimum.missingQualityUnits, 2560);
assert.equal(minimum.qualityPolicy.allocationMaximumExclusive, 800);
const minimumTrace = allocation.trace.find((entry) => entry.recipeSlotId === fixture.requirements[0].id);
assert.equal(minimumTrace.available.find((batch) => batch.batchId === "c0133-titanium-q866").decision, "QUALITY_AT_OR_ABOVE_POOL_MAXIMUM");
assert.equal(allocation.summary.totalReservedUnits, 27440);
assert.ok(allocation.batchUsage.every((batch) => batch.reservedUnits <= batch.quantityUnits));
assert.equal(allocation.cards[0].maxCraftable, 0);

const reversed = makeCard("c0133-reversed", 0, fixture.requirements.slice().reverse());
const reverseAllocation = model.allocate([reversed], clone(fixture.batches), {}, canonical, pools);
assert.deepEqual(clone(reverseAllocation.batchUsage), clone(allocation.batchUsage));

const maxOnly = [{ ...fixture.requirements[1], id: "c0133-max-only", requiredQuantityUnits: 20000 }];
const maxAssignment = { "c0133-max-only": modes.MAXIMUM_Q_POOL };
const highPriority = makeCard("c0133-priority-high", 0, maxOnly, maxAssignment);
const lowPriority = makeCard("c0133-priority-low", 1, maxOnly, maxAssignment);
const priority = model.allocate([lowPriority, highPriority], clone(fixture.batches), {}, canonical, pools);
assert.equal(requirement(priority, highPriority.id, "c0133-max-only").allocatedUnits, 20000);
assert.equal(requirement(priority, lowPriority.id, "c0133-max-only").allocatedUnits, 11240);

const combined = model.buildCombined(allocation, [card], clone(fixture.batches), canonical);
assert.equal(combined.length, 1);
assert.equal(combined[0].materialUuid, material.commodityUuid);
assert.equal(combined[0].availableUnits, 48680);
assert.equal(combined[0].reservedUnits, 27440);
const overview = model.buildOverview(combined, [card], {}, pools, clone(fixture.batches), canonical);
assert.equal(overview.materials.length, 1);
assert.equal(overview.materials[0].eligibleInventory.minimumUnits, 17440);
assert.equal(overview.materials[0].eligibleInventory.maximumUnits, 31240);
assert.equal(overview.materials[0].eligibleInventory.minimumUnits + overview.materials[0].eligibleInventory.maximumUnits, overview.materials[0].totals.availableUnits);

const invalidAllocation = model.allocate([card], clone(fixture.batches), {}, canonical, { [material.commodityUuid]: invalidPool });
assert.equal(requirement(invalidAllocation, card.id, fixture.requirements[0].id).status, "POOL_RANGE_INVALID");
assert.equal(requirement(invalidAllocation, card.id, fixture.requirements[1].id).status, "POOL_RANGE_INVALID");
assert.equal(invalidAllocation.summary.totalReservedUnits, 0);

const minimumStandalone = model.projectStandaloneQuality(minimum, minimum.qualityPolicy);
const maximumStandalone = model.projectStandaloneQuality(maximum, maximum.qualityPolicy);
assert.equal(minimumStandalone.displayLabel, "Minimum Q · Q500–Q799");
assert.equal(minimumStandalone.poolMaximumExclusive, 800);
assert.equal(maximumStandalone.displayLabel, "MAX Q · Q800+");

const reloaded = model.allocate([clone(card)], clone(fixture.batches), {}, clone(canonical), clone(pools));
assert.deepEqual(clone(reloaded), clone(allocation));
const userData = {
  userInventory: [], materialBatches: clone(fixture.batches), craftingCards: [clone(card)], miningLoadouts: [],
  userSettings: [{ key: "user:materialQualityPools", scope: "USER", value: clone(pools), updatedAt: "2026-09-07T08:30:00.000Z" }],
  craftHistory: [], userMeta: clone(model.defaultUserMetaRecords())
};
const backup = model.buildBackup(userData, { applicationVersion: "V003-dev", exportedAt: "2026-09-07T08:31:00.000Z" });
const restored = model.validateBackup(backup).backup.data;
assert.deepEqual(clone(restored.materialBatches).sort((a, b) => a.id.localeCompare(b.id)), clone(fixture.batches).sort((a, b) => a.id.localeCompare(b.id)));
assert.equal(restored.materialBatches.find((batch) => batch.id === "c0133-titanium-q866").sourceMaterialUuid, material.ingredientUuid);
assert.deepEqual(clone(restored.userSettings[0].value), clone(pools));

const inventoryRenderer = html.match(/function renderMaterialInventory\(\) \{[\s\S]*?\n    \}(?=\n\n    function translateAllocationDecision)/)?.[0] || "";
assert.match(inventoryRenderer, /buildMaterialInventoryGroups\(state\.materialBatches, state\.knownMaterials\)/);
assert.match(html, /POOL_RANGE_INVALID · a Minimum Q értéknek kisebbnek kell lennie a MAX Q értéknél/);
assert.doesNotMatch(block("C0133_CANONICAL_INVENTORY_GROUPING"), /foldSearchText|materialName\s*===|includes\(.*materialName/);

const evidence = {
  cycle: "V003-C013.3",
  status: "PASS",
  fixtures: {
    DISJOINT_MINIMUM_MAX_QUALITY_POOLS: "PASS",
    CANONICAL_MATERIAL_MULTI_SOURCE_UUID_GROUPING: "PASS",
    sameCardTwoSlotPool: "PASS",
    twoCardPriority: "PASS",
    reverseRecipeRow: "PASS",
    combinedParity: "PASS",
    myMaterialsGroupingParity: "PASS",
    maxCraftableParity: "PASS",
    finalCardCraftingListParity: "PASS_SHARED_ALLOCATION_MODEL",
    standaloneParity: "PASS_READ_ONLY_PROJECTION",
    reloadPersistence: "PASS",
    backupRestore: "PASS_SOURCE_UUID_PRESERVED",
    noDoubleReserve: "PASS",
    canonicalExactMapping: "PASS_NO_NAME_MERGE"
  },
  titanium: {
    canonicalMaterialUuid: material.commodityUuid,
    sourceMaterialUuid: material.ingredientUuid,
    logicalMaterials: inventoryGroups.length,
    displayedCards: inventoryGroups.length,
    batches: inventoryGroups[0].batches.length,
    totalInventoryUnits: 48680,
    minimumEligibleUnits: 17440,
    maximumEligibleUnits: 31240,
    q866OnlyMinimumEligibleUnits: 0,
    q866OnlyMaximumEligibleUnits: 31240,
    minimumOnlyUnboundedEligibleUnits: 48680,
    maximumOnlyEligibleUnits: 31240
  },
  poolSemantics: "MINIMUM_Q_INCLUSIVE_AND_MAXIMUM_Q_EXCLUSIVE; MAXIMUM_Q_INCLUSIVE",
  invalidRange: "POOL_RANGE_INVALID",
  applicationCodeChanged: true,
  fullReleaseRegression: "NOT_RUN_BY_SCOPE",
  freshReleaseCandidateRequired: true
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0133_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
