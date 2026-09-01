import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v003-c0125c1-fr86-assignment-model.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C012.5D1");
const evidencePath = path.join(artifactDirectory, "integration-evidence.json");
const appHtml = fs.readFileSync(appPath, "utf8");
const appCss = extractEmbeddedApplicationCss(appHtml);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const baseline = execFileSync("git", ["rev-parse", "HEAD"], { cwd: projectDirectory, encoding: "utf8" }).trim();
assert.equal(baseline, "42f94e9ecc40076174ac1c732e70d26402ea291f");
assert.equal(spawnSync("git", ["diff", "--quiet", "--", "sPg Crafting List.html"], { cwd: projectDirectory }).status, 0, "A D1 gate nem módosíthat application code-ot.");

const block = (name) => {
  const match = appHtml.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const storedCardNormalizer = appHtml.match(/function normalizeStoredCraftingCard\(card, fallbackOrder\) \{[\s\S]*?\n    \}(?=\n\n    \/\* C0125A_)/);
assert.ok(storedCardNormalizer, "A Crafting Card storage normalizer hiányzik.");
const context = vm.createContext({
  console,
  nowIso: () => "2026-09-01T00:30:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000),
  foldSearchText: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("C0125A_INVENTORY_INDEPENDENCE_MODEL")}
${block("C0125B_COMBINED_QUALITY_POOL_MODEL")}
${block("MATERIAL_COLOR_MODEL")}
${block("M6_STANDALONE_EXPORT_MODEL")}
${storedCardNormalizer[0]}
globalThis.__C0125D1__ = {
  rules: M2_QUALITY_RULES,
  planModes: MATERIAL_QUALITY_PLAN_MODES,
  poolModes: RECIPE_SLOT_QUALITY_POOL_MODES,
  allocate: allocateCardsDeterministically,
  buildCombined: buildCombinedMaterials,
  buildOverview: buildCombinedMaterialsOverviewViewModel,
  buildFinal: buildFinalCraftingCardViewModel,
  buildSnapshot: m6BuildStandaloneSnapshot,
  renderStandalone: m6RenderStandaloneHtml,
  buildBackup: buildM4BackupEnvelope,
  validateBackup: validateAndMigrateM4Backup,
  importBackup: simulateM4UserDataImport,
  normalizeCard: normalizeStoredCraftingCard,
  poolsFromSettings: materialQualityPoolsFromUserSettings,
  plansFromSettings: materialQualityPlansFromUserSettings,
  assignmentFor: recipeSlotQualityPoolAssignmentFor
};`, context, { filename: "spg-v003-c0125d1-model.js" });

const model = context.__C0125D1__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const fingerprint = (value) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const [shell, fieldArray] = fixture.requirements;
const stileron = fixture.materials.stileron;
const feynmaline = fixture.materials.feynmaline;
const modes = model.poolModes;
const canonical = [
  { uuid: stileron.commodityUuid, displayName: stileron.name, sourceUuids: [stileron.commodityUuid, stileron.ingredientUuid] },
  { uuid: feynmaline.ingredientUuid, displayName: feynmaline.name, sourceUuids: [feynmaline.ingredientUuid] }
];
const pools = { [stileron.commodityUuid]: { minimumQ: 500, maximumQ: 700 } };
const assignments = { [shell.id]: modes.MINIMUM_Q_POOL, [fieldArray.id]: modes.MAXIMUM_Q_POOL };
const makeCard = (id, options = {}) => ({
  id,
  order: options.order ?? 0,
  active: true,
  quantity: 1,
  blueprintUuid: fixture.blueprint.uuid,
  outputUuid: fixture.blueprint.outputUuid,
  outputName: fixture.blueprint.outputName,
  outputTypeLabel: "Weapon",
  craftTimeSeconds: 900,
  gameVersion: "4.10.0-LIVE.12519617",
  requirements: clone(options.requirements || fixture.requirements),
  slotStrategies: {},
  recipeSlotQualityPoolAssignments: clone(options.assignments ?? assignments)
});
const batch = (id, materialUuid, quantityUnits, quality, unit = "SCU", createdAt = id) => ({
  id,
  materialUuid,
  materialName: materialUuid === feynmaline.ingredientUuid ? feynmaline.name : stileron.name,
  quantityUnits,
  unit,
  quality,
  createdAt
});
const happyBatches = [
  batch("q550", stileron.commodityUuid, 12000, 550),
  batch("q750", stileron.commodityUuid, 19000, 750),
  batch("feyn", feynmaline.ingredientUuid, 170, 900, "ITEM")
];
const shortageBatches = [
  batch("q550-only", stileron.commodityUuid, 31000, 550),
  batch("feyn-shortage", feynmaline.ingredientUuid, 170, 900, "ITEM")
];
const card = makeCard("d1-fr86");
const blueprint = {
  uuid: fixture.blueprint.uuid,
  outputUuid: fixture.blueprint.outputUuid,
  outputName: fixture.blueprint.outputName,
  outputTypeLabel: "Weapon",
  gameVersion: card.gameVersion,
  craftTimeSeconds: 900
};
const buildLayers = (cards, batches, poolSettings = pools, plans = {}) => {
  const allocation = model.allocate(clone(cards), clone(batches), clone(plans), canonical, clone(poolSettings));
  const combined = model.buildCombined(allocation, clone(cards), clone(batches), canonical);
  const overview = model.buildOverview(combined, clone(cards), clone(plans), clone(poolSettings), clone(batches), canonical);
  const firstCard = cards[0] || null;
  const firstResult = firstCard ? allocation.cards.find((entry) => entry.cardId === firstCard.id) : null;
  if (!firstCard) return { allocation, combined, overview };
  const input = {
    appName: "sPg Crafting List",
    generatedAt: "2026-09-01T00:30:00.000Z",
    scDataVersion: firstCard.gameVersion,
    card: clone(firstCard),
    cardResult: clone(firstResult),
    blueprint,
    outputPresentation: { uuid: fixture.blueprint.outputUuid, name: fixture.blueprint.outputName, typeLabel: "Weapon" },
    trace: clone(allocation.trace.filter((entry) => entry.cardId === firstCard.id)),
    materialQualityPlans: clone(plans)
  };
  const finalCard = model.buildFinal(clone(input));
  const craftingListCard = model.buildFinal(clone(input));
  const snapshot = model.buildSnapshot(clone(input));
  const standalone = model.renderStandalone(snapshot, appCss);
  return { allocation, combined, overview, finalCard, craftingListCard, snapshot, standalone };
};
const requirement = (cardResult, slotId) => cardResult.requirements.find((entry) => entry.recipeSlotId === slotId);
const stileronView = (layers) => layers.overview.materials.find((entry) => entry.materialUuid === stileron.commodityUuid);

// One shared integrated happy-path fixture across allocation, both Card views, Combined and standalone.
const happyInputFingerprint = fingerprint({ card, pools, happyBatches });
const happy = buildLayers([card], happyBatches);
const happyResult = happy.allocation.cards[0];
const happyShell = requirement(happyResult, shell.id);
const happyField = requirement(happyResult, fieldArray.id);
const happyCombined = stileronView(happy);
assert.equal(happyResult.satisfied, true);
assert.equal(happyResult.maxCraftable, 1);
assert.deepEqual(clone(happyShell.allocatedBatches.map((entry) => [entry.batchId, entry.allocatedUnits])), [["q550", 12000]]);
assert.deepEqual(clone(happyField.allocatedBatches.map((entry) => [entry.batchId, entry.allocatedUnits])), [["q750", 19000]]);
assert.equal(requirement(happy.finalCard, shell.id).commodityUuid, stileron.commodityUuid);
assert.equal(requirement(happy.finalCard, fieldArray.id).commodityUuid, stileron.commodityUuid);
assert.equal(requirement(happy.snapshot, shell.id).commodityUuid, stileron.commodityUuid);
assert.equal(requirement(happy.snapshot, fieldArray.id).commodityUuid, stileron.commodityUuid);
assert.equal(happyCombined.poolMetrics.minimum.requiredUnits, 12000);
assert.equal(happyCombined.poolMetrics.minimum.reservedUnits, 12000);
assert.equal(happyCombined.poolMetrics.maximum.requiredUnits, 19000);
assert.equal(happyCombined.poolMetrics.maximum.reservedUnits, 19000);
assert.equal(happyCombined.totals.availableUnits, 31000);
assert.ok(happy.allocation.batchUsage.every((entry) => entry.reservedUnits <= entry.quantityUnits));
assert.deepEqual(clone(happy.finalCard.requirements.map((entry) => [entry.recipeSlotId, entry.standaloneQuality.assignmentMode])), clone(happy.craftingListCard.requirements.map((entry) => [entry.recipeSlotId, entry.standaloneQuality.assignmentMode])));
assert.deepEqual(clone(happy.finalCard.requirements.map((entry) => entry.standaloneQuality.displayLabel)), clone(happy.snapshot.requirements.map((entry) => entry.standaloneQuality.displayLabel)));
assert.match(happy.standalone, /Shell[\s\S]*Minimum Q · Q500\+/);
assert.match(happy.standalone, /Field Array[\s\S]*MAX Q · Q700\+/);
assertSingleFileRuntimeMarkup(happy.standalone);
assert.equal(fingerprint({ card, pools, happyBatches }), happyInputFingerprint);

// Physical amount exists, but the MAX pool has no Q700+ batch.
const shortage = buildLayers([card], shortageBatches);
const shortageResult = shortage.allocation.cards[0];
const shortageField = requirement(shortageResult, fieldArray.id);
const shortageCombined = stileronView(shortage);
assert.equal(requirement(shortageResult, shell.id).status, "SATISFIED");
assert.equal(shortageField.status, "INSUFFICIENT_QUALITY");
assert.equal(shortageField.missingAmountUnits, 0);
assert.equal(shortageField.missingQualityUnits, 19000);
assert.equal(shortageResult.satisfied, false);
assert.equal(shortageResult.maxCraftable, 0);
assert.equal(shortageCombined.poolMetrics.maximum.missingAmountUnits, 0);
assert.equal(shortageCombined.poolMetrics.maximum.missingQualityUnits, 19000);
assert.match(shortage.standalone, /MAX Q · Q700\+/);
assert.match(shortage.standalone, /Quality-hiány: 1,9 SCU/);
assert.match(shortage.standalone, /data-card-satisfied="false"/);

// ANY_Q does not add a user threshold and cannot weaken a recipe Q500 minimum.
const hpRequirement = { ...clone(shell), id: "d1-hp", qualityCapability: "DYNAMIC", affectedStats: [{ key: "health", label: "Health" }], requiredQuantityUnits: 1000 };
const hpCard = makeCard("d1-any", { requirements: [hpRequirement], assignments: { [hpRequirement.id]: modes.ANY_Q } });
const any = buildLayers([hpCard], [batch("q100", stileron.commodityUuid, 1000, 100), batch("q550-hp", stileron.commodityUuid, 1000, 550)], pools, { [stileron.ingredientUuid]: { mode: model.planModes.TARGET_Q, targetQuality: 900 } });
const anySlot = any.allocation.cards[0].requirements[0];
assert.equal(anySlot.baselineRule, model.rules.HP_MIN_500);
assert.equal(anySlot.finalEffectiveMinimum, 500);
assert.equal(anySlot.allocatedBatches[0].batchId, "q550-hp");
assert.equal(anySlot.qualityPolicy.legacyMaterialPlanIgnored, true);
assert.equal(any.snapshot.requirements[0].standaloneQuality.displayLabel, "Bármely Q user constraint · effektív Q500+");

// Missing thresholds fail closed throughout every layer; no invented Q0/Q1000.
const unresolved = buildLayers([card], happyBatches, {});
assert.ok(unresolved.allocation.cards[0].requirements.slice(0, 2).every((entry) => entry.status === "POOL_THRESHOLD_UNRESOLVED"));
assert.equal(unresolved.allocation.cards[0].satisfied, false);
assert.equal(unresolved.allocation.cards[0].maxCraftable, 0);
assert.equal(stileronView(unresolved).poolMetrics.minimum.status, "UNRESOLVED");
assert.equal(stileronView(unresolved).poolMetrics.maximum.status, "UNRESOLVED");
assert.ok(unresolved.snapshot.requirements.slice(0, 2).every((entry) => entry.standaloneQuality.displayLabel === "Quality nem feloldható"));
assert.doesNotMatch(unresolved.standalone, /Q0\+|Q1000\+/);

// No explicit assignment stays byte-for-byte on the C012.3 legacy allocation path.
const legacyCard = makeCard("d1-legacy", { assignments: {} });
const legacyPlans = { [stileron.ingredientUuid]: { mode: model.planModes.TARGET_Q, targetQuality: 700 } };
const legacyWithoutPools = model.allocate([clone(legacyCard)], clone(happyBatches), clone(legacyPlans), canonical);
const legacyWithUnusedPools = model.allocate([clone(legacyCard)], clone(happyBatches), clone(legacyPlans), canonical, clone(pools));
assert.deepEqual(clone(legacyWithUnusedPools), clone(legacyWithoutPools));
assert.equal(model.assignmentFor(legacyCard, shell.id).origin, "LEGACY_FALLBACK");
assert.equal(Object.hasOwn(requirement(legacyWithUnusedPools.cards[0], shell.id), "recipePoolAssignmentOrigin"), false);

// Two Cards, different assignments and one scarce high-Q batch: priority is deterministic.
const high = makeCard("d1-priority-high", { order: 0, assignments });
const lowAssignments = { [shell.id]: modes.MAXIMUM_Q_POOL, [fieldArray.id]: modes.MAXIMUM_Q_POOL };
const low = makeCard("d1-priority-low", { order: 1, assignments: lowAssignments });
const priority = buildLayers([low, high], happyBatches);
assert.equal(priority.allocation.cards.find((entry) => entry.cardId === high.id).satisfied, true);
assert.equal(priority.allocation.cards.find((entry) => entry.cardId === low.id).satisfied, false);
assert.ok(priority.allocation.batchUsage.every((entry) => entry.reservedUnits <= entry.quantityUnits));
assert.equal(stileronView(priority).poolMetrics.maximum.reservedUnits, 19000);

// Deleting the Card removes requirement metrics but preserves inventory, thresholds and previews.
const afterDelete = buildLayers([], happyBatches);
const inventoryOnly = stileronView(afterDelete);
assert.ok(inventoryOnly);
assert.equal(inventoryOnly.poolMetrics.minimum.requiredUnits, 0);
assert.equal(inventoryOnly.poolMetrics.maximum.reservedUnits, 0);
assert.deepEqual(clone(inventoryOnly.qualityPool), { minimumQ: 500, maximumQ: 700 });
assert.equal(inventoryOnly.eligibleInventory.minimumUnits, 31000);
assert.equal(inventoryOnly.eligibleInventory.maximumUnits, 19000);
assert.equal(inventoryOnly.totals.availableUnits, 31000);

// Integrated backup -> mutation -> restore returns inventory, thresholds, assignments and allocation.
const poolSetting = { key: "user:materialQualityPools", scope: "USER", value: clone(pools), updatedAt: "2026-09-01T00:30:00.000Z" };
const planSetting = { key: "user:materialQualityPlans", scope: "USER", value: {}, updatedAt: "2026-09-01T00:30:00.000Z" };
const userData = { userInventory: [], materialBatches: clone(happyBatches), craftingCards: [clone(card)], miningLoadouts: [], userSettings: [planSetting, poolSetting] };
const envelope = model.buildBackup(clone(userData), { applicationVersion: "V003-dev", exportedAt: "2026-09-01T00:30:01.000Z" });
const restoredEnvelope = model.validateBackup(envelope);
const modified = clone(userData);
modified.materialBatches = [];
modified.craftingCards[0].recipeSlotQualityPoolAssignments = {};
modified.userSettings = [planSetting, { ...poolSetting, value: { [stileron.commodityUuid]: { minimumQ: 1, maximumQ: 2 } } }];
const restored = model.importBackup(modified, restoredEnvelope.backup.data, "REPLACE", false);
const restoredPools = model.poolsFromSettings(restored.userSettings);
const restoredPlans = model.plansFromSettings(restored.userSettings);
const restoredCard = model.normalizeCard(restored.craftingCards[0], 0);
const restoredAllocation = model.allocate([restoredCard], restored.materialBatches, restoredPlans, canonical, restoredPools);
assert.deepEqual(clone(restored.materialBatches).sort((a, b) => a.id.localeCompare(b.id)), clone(userData.materialBatches).sort((a, b) => a.id.localeCompare(b.id)));
assert.deepEqual(clone(restoredPools), clone(pools));
assert.deepEqual(clone(restoredCard.recipeSlotQualityPoolAssignments), clone(assignments));
assert.equal(restoredAllocation.cards[0].satisfied, true);
assert.equal(restoredAllocation.cards[0].maxCraftable, 1);

// Old backup without pool settings/assignments remains a legacy fallback.
const oldCard = clone(card);
delete oldCard.recipeSlotQualityPoolAssignments;
const oldEnvelope = model.buildBackup({ ...clone(userData), craftingCards: [oldCard], userSettings: [planSetting] }, { applicationVersion: "V002" });
const oldRestored = model.validateBackup(oldEnvelope).backup.data;
const oldNormalizedCard = model.normalizeCard(oldRestored.craftingCards[0], 0);
assert.deepEqual(clone(model.poolsFromSettings(oldRestored.userSettings)), {});
assert.deepEqual(clone(oldNormalizedCard.recipeSlotQualityPoolAssignments), {});
assert.equal(model.assignmentFor(oldNormalizedCard, shell.id).origin, "LEGACY_FALLBACK");

// Standalone is read-only and has no local runtime sidecar or external runtime source.
const runtimeMarkup = shortage.standalone.replace(/<style>[\s\S]*?<\/style>/i, "").replace(/<script type="application\/json"[\s\S]*?<\/script>/i, "");
assert.doesNotMatch(runtimeMarkup, /<select\b|<input\b|contenteditable\s*=|spg-c0125c2-pool-select/i);
assert.doesNotMatch(runtimeMarkup, /indexedDB|userDataRepository|saveCraftingCards|persistMaterialQualityPoolValue/);
assert.doesNotMatch(shortage.standalone, /<link\b[^>]*stylesheet|<script\b[^>]*\bsrc\s*=|@import\s+url/i);
assertSingleFileRuntimeMarkup(shortage.standalone);

const v001Commit = execFileSync("git", ["rev-parse", "V001^{}"], { cwd: projectDirectory, encoding: "utf8" }).trim();
const v002Commit = execFileSync("git", ["rev-parse", "V002^{}"], { cwd: projectDirectory, encoding: "utf8" }).trim();
const v002Artifact = fs.readFileSync(path.join(projectDirectory, "releases", "V002", "sPg Crafting List.html"));
const v002Sha256 = crypto.createHash("sha256").update(v002Artifact).digest("hex");
assert.equal(v001Commit, "b22dbc3c2ef0765e30aa3806537854298c873dff");
assert.equal(v002Commit, "b326aaff5838aafd5b1f13b16982c29a0e150e35");
assert.equal(v002Sha256, "de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357");

const evidence = {
  cycle: "V003-C012.5D1",
  status: "TARGET_PASS",
  baseline,
  applicationCodeChanged: false,
  fixtureStatuses: {
    fr86HappyPath: "PASS",
    qualityShortage: "PASS",
    anyQRecipeMinimum: "PASS",
    unresolvedThreshold: "PASS_FAIL_SAFE",
    twoCardPriority: "PASS",
    recipeDeleteInventoryOnly: "PASS"
  },
  crossViewParity: "PASS_FINAL_CARD_CRAFTING_LIST_ALLOCATION_COMBINED_STANDALONE",
  canonicalIdentity: "PASS_EXACT_COMMODITY_UUID_NO_FUZZY",
  maxDb: { happy: 1, shortage: 0 },
  combined: { minimumRequiredReservedScu: "1.2/1.2", maximumRequiredReservedScu: "1.9/1.9", shortageQualityScu: 1.9 },
  standalone: { source: "MAIN_COMPUTES_SNAPSHOT_STORES_STANDALONE_RENDERS", recomputation: false, minimumLabel: "Minimum Q · Q500+", maximumLabel: "MAX Q · Q700+", editableControls: 0, userDataWrite: false },
  backupRestore: "PASS_INVENTORY_POOLS_ASSIGNMENTS_ALLOCATION",
  oldBackupCompatibility: "PASS_EMPTY_POOL_AND_LEGACY_FALLBACK",
  legacyCompatibility: "PASS_C0123_PATH_UNCHANGED_WITH_UNUSED_POOLS",
  singleFile: { embeddedCss: true, embeddedJs: true, localRuntimeSidecars: 0 },
  inputFingerprintBeforeAfter: `${happyInputFingerprint} -> ${fingerprint({ card, pools, happyBatches })}`,
  v001V002Integrity: "PASS",
  gateChain: "TARGET_ONLY_PENDING_VALIDATOR"
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0125D1_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
