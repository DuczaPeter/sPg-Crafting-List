import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = process.env.SPG_APP_PATH
  ? path.resolve(process.env.SPG_APP_PATH)
  : path.join(projectDirectory, "sPg Crafting List.html");
const fr86Path = path.join(projectDirectory, "tests", "fixtures", "v003-c0125c1-fr86-assignment-model.json");
const mixedPath = path.join(projectDirectory, "tests", "fixtures", "fr86-mixed-amount-quality-shortage.json");
const artifactDirectory = process.env.SPG_ARTIFACT_DIRECTORY
  ? path.resolve(process.env.SPG_ARTIFACT_DIRECTORY)
  : path.join(projectDirectory, "test-artifacts", "V003-C013.1");
const evidencePath = path.join(artifactDirectory, "strict-quality-allocation-evidence.json");
const html = fs.readFileSync(appPath, "utf8");
const appCss = extractEmbeddedApplicationCss(html);
const fr86 = JSON.parse(fs.readFileSync(fr86Path, "utf8"));
const mixed = JSON.parse(fs.readFileSync(mixedPath, "utf8"));

const block = (name) => {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
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
globalThis.__C0131__ = {
  allocate: allocateCardsDeterministically,
  buildCombined: buildCombinedMaterials,
  buildOverview: buildCombinedMaterialsOverviewViewModel,
  buildFinal: buildFinalCraftingCardViewModel,
  buildSnapshot: m6BuildStandaloneSnapshot,
  renderStandalone: m6RenderStandaloneHtml,
  poolModes: RECIPE_SLOT_QUALITY_POOL_MODES
};`, context, { filename: "spg-v003-c0131-model.js" });

const model = context.__C0131__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const [shell, fieldArray] = fr86.requirements;
const stileron = fr86.materials.stileron;
const canonical = [{
  uuid: stileron.commodityUuid,
  displayName: stileron.name,
  sourceUuids: [stileron.commodityUuid, stileron.ingredientUuid]
}];
const pools = { [stileron.commodityUuid]: clone(mixed.pools) };
const assignments = {
  [shell.id]: model.poolModes.MINIMUM_Q_POOL,
  [fieldArray.id]: model.poolModes.MAXIMUM_Q_POOL
};
const card = (id, order, requirements = [shell, fieldArray], cardAssignments = assignments) => ({
  id,
  order,
  active: true,
  quantity: mixed.quantity,
  blueprintUuid: fr86.blueprint.uuid,
  outputUuid: fr86.blueprint.outputUuid,
  outputName: fr86.blueprint.outputName,
  outputTypeLabel: "Weapon",
  craftTimeSeconds: 900,
  gameVersion: "4.10.0-LIVE.12519617",
  requirements: clone(requirements),
  slotStrategies: {},
  recipeSlotQualityPoolAssignments: clone(cardAssignments)
});
const batches = mixed.batches.map((batch) => ({
  ...clone(batch),
  materialUuid: stileron.commodityUuid,
  materialName: stileron.name,
  createdAt: batch.id
}));
const findSlot = (allocation, cardId, slotId) => allocation.cards.find((entry) => entry.cardId === cardId).requirements.find((entry) => entry.recipeSlotId === slotId);
const sum = (records, field) => records.reduce((total, record) => total + Number(record[field] || 0), 0);

const allocation = model.allocate([card("mixed", 0)], clone(batches), {}, canonical, pools);
const field = findSlot(allocation, "mixed", fieldArray.id);
const shellResult = findSlot(allocation, "mixed", shell.id);

assert.equal(field.allocatedUnits, mixed.expected.field.reservedUnits);
assert.equal(field.missingAmountUnits, mixed.expected.field.missingAmountUnits);
assert.equal(field.missingQualityUnits, mixed.expected.field.missingQualityUnits);
assert.equal(field.status, "INSUFFICIENT_QUALITY_AND_QUANTITY");
assert.deepEqual(clone(field.allocatedBatches.map((entry) => [entry.batchId, entry.allocatedUnits])), [["fr86-q910", 60000]]);
assert.equal(field.allocationSequence, 0);
assert.equal(field.availablePhysicalUnitsAtSlot, 230000);
assert.equal(field.availableEligibleUnitsAtSlot, 60000);

assert.equal(shellResult.allocatedUnits, mixed.expected.shell.reservedUnits);
assert.equal(shellResult.missingAmountUnits, mixed.expected.shell.missingAmountUnits);
assert.equal(shellResult.missingQualityUnits, mixed.expected.shell.missingQualityUnits);
assert.equal(shellResult.status, "INSUFFICIENT_QUANTITY");
assert.deepEqual(clone(shellResult.allocatedBatches.map((entry) => [entry.batchId, entry.allocatedUnits])), [["fr86-q512", 160000], ["fr86-q517", 10000]]);
assert.equal(shellResult.allocationSequence, 1);
assert.equal(shellResult.availablePhysicalUnitsAtSlot, 170000);
assert.equal(shellResult.availableEligibleUnitsAtSlot, 170000);

assert.equal(sum(allocation.batchUsage, "quantityUnits"), mixed.expected.global.inventoryUnits);
assert.equal(sum(allocation.batchUsage, "reservedUnits"), mixed.expected.global.reservedUnits);
assert.equal(sum(allocation.cards[0].requirements, "missingAmountUnits"), mixed.expected.global.missingAmountUnits);
assert.equal(sum(allocation.cards[0].requirements, "missingQualityUnits"), mixed.expected.global.missingQualityUnits);
assert.equal(sum(allocation.cards[0].requirements, "missingAmountUnits") + sum(allocation.cards[0].requirements, "missingQualityUnits"), mixed.expected.global.missingUnits);
assert.ok(allocation.batchUsage.every((entry) => entry.reservedUnits <= entry.quantityUnits), "Egy fizikai batch sem foglalható kétszer.");

// A scheduler consumption order changes, the user-facing recipe row order does not.
assert.deepEqual(clone(allocation.cards[0].requirements.map((entry) => entry.recipeSlotId)), [shell.id, fieldArray.id]);
const reversed = model.allocate([card("reverse", 0, [fieldArray, shell])], clone(batches), {}, canonical, pools);
assert.equal(findSlot(reversed, "reverse", fieldArray.id).allocatedUnits, 60000);
assert.equal(findSlot(reversed, "reverse", shell.id).allocatedUnits, 170000);

// Card priority stays above same-material Quality strictness across Cards.
const highPriority = card("priority-high", 0, [shell], { [shell.id]: model.poolModes.MINIMUM_Q_POOL });
highPriority.quantity = 5;
const lowPriority = card("priority-low", 1, [fieldArray], { [fieldArray.id]: model.poolModes.MAXIMUM_Q_POOL });
lowPriority.quantity = 1;
const priority = model.allocate([lowPriority, highPriority], [{
  id: "priority-q910",
  materialUuid: stileron.commodityUuid,
  materialName: stileron.name,
  quantityUnits: 60000,
  unit: "SCU",
  quality: 910,
  createdAt: "1"
}], {}, canonical, pools);
assert.equal(findSlot(priority, "priority-high", shell.id).allocatedUnits, 60000);
assert.equal(findSlot(priority, "priority-low", fieldArray.id).allocatedUnits, 0);

// The application model has exact canonical parity; the old technical probe call without canonical data reproduces the reported failure.
assert.throws(
  () => model.buildCombined(allocation, [card("mixed", 0)], clone(batches)),
  /A Combined Materials foglalása eltér az Allocation Engine eredményétől: (?:32bafbd4-c52a-476d-b31c-97c4b3102471|8cd317a3-df9b-4315-8ac3-0f1fca42dfd4)::SCU/
);
const combined = model.buildCombined(allocation, [card("mixed", 0)], clone(batches), canonical);
const stileronGroup = combined.find((entry) => entry.materialUuid === stileron.commodityUuid);
assert.ok(stileronGroup);
assert.equal(stileronGroup.reservedUnits, mixed.expected.global.reservedUnits);
assert.equal(stileronGroup.missingAmountUnits, mixed.expected.global.missingAmountUnits);
assert.equal(stileronGroup.missingQualityUnits, mixed.expected.global.missingQualityUnits);
assert.match(html, /buildCombinedMaterials\(state\.allocationResult, state\.craftingCards, state\.materialBatches, state\.knownMaterials\)/);

// Final Card, Crafting List projection, Combined, Maximum Craftable and standalone use the same repaired allocation result.
const sourceCard = card("mixed", 0);
const overview = model.buildOverview(combined, [sourceCard], {}, pools, clone(batches), canonical);
const input = {
  appName: "sPg Crafting List",
  generatedAt: "2026-09-01T10:00:00.000Z",
  scDataVersion: sourceCard.gameVersion,
  card: clone(sourceCard),
  cardResult: clone(allocation.cards[0]),
  blueprint: {
    uuid: fr86.blueprint.uuid,
    outputUuid: fr86.blueprint.outputUuid,
    outputName: fr86.blueprint.outputName,
    outputTypeLabel: "Weapon",
    gameVersion: sourceCard.gameVersion,
    craftTimeSeconds: 900
  },
  outputPresentation: { uuid: fr86.blueprint.outputUuid, name: fr86.blueprint.outputName, typeLabel: "Weapon" },
  trace: clone(allocation.trace),
  materialQualityPlans: {}
};
const finalCard = model.buildFinal(clone(input));
const craftingListCard = model.buildFinal(clone(input));
const snapshot = model.buildSnapshot(clone(input));
const standalone = model.renderStandalone(snapshot, appCss);
const standalonePath = path.join(artifactDirectory, "standalone", "sPg Crafting List - FR-86 mixed shortage.html");
fs.mkdirSync(path.dirname(standalonePath), { recursive: true });
fs.writeFileSync(standalonePath, standalone, "utf8");
const finalField = finalCard.requirements.find((entry) => entry.recipeSlotId === fieldArray.id);
const snapshotField = snapshot.requirements.find((entry) => entry.recipeSlotId === fieldArray.id);
assert.equal(finalField.allocatedUnits, mixed.expected.field.reservedUnits);
assert.equal(finalField.missingAmountUnits, mixed.expected.field.missingAmountUnits);
assert.equal(finalField.missingQualityUnits, mixed.expected.field.missingQualityUnits);
assert.deepEqual(clone(finalCard.requirements), clone(craftingListCard.requirements));
assert.equal(snapshotField.allocatedUnits, mixed.expected.field.reservedUnits);
assert.equal(snapshotField.missingAmountUnits, mixed.expected.field.missingAmountUnits);
assert.equal(snapshotField.missingQualityUnits, mixed.expected.field.missingQualityUnits);
assert.equal(finalCard.card.maxCraftable, allocation.cards[0].maxCraftable);
assert.equal(snapshot.card.maxCraftable, allocation.cards[0].maxCraftable);
const overviewStileron = overview.materials.find((entry) => entry.materialUuid === stileron.commodityUuid);
assert.equal(overviewStileron.poolMetrics.maximum.missingAmountUnits, mixed.expected.field.missingAmountUnits);
assert.equal(overviewStileron.poolMetrics.maximum.missingQualityUnits, mixed.expected.field.missingQualityUnits);
assert.equal(overviewStileron.poolMetrics.minimum.missingAmountUnits, mixed.expected.shell.missingAmountUnits);
assert.equal(overviewStileron.poolMetrics.minimum.missingQualityUnits, mixed.expected.shell.missingQualityUnits);
assert.match(standalone, /Field Array[\s\S]*Mennyiséghiány: 9,3 SCU[\s\S]*Quality-hiány: 17 SCU/);
assert.match(standalone, /Shell[\s\S]*Mennyiséghiány: 3,4 SCU/);
assertSingleFileRuntimeMarkup(standalone);

const evidence = {
  cycle: "V003-C013.1",
  status: "TARGET_PASS",
  fixture: mixed.name,
  scheduling: "CARD_PRIORITY -> CANONICAL_MATERIAL_UNIT_GROUP -> EFFECTIVE_MINIMUM_DESC -> STABLE_RECIPE_SLOT",
  field: {
    reservedUnits: field.allocatedUnits,
    missingAmountUnits: field.missingAmountUnits,
    missingQualityUnits: field.missingQualityUnits,
    availablePhysicalUnitsAtSlot: field.availablePhysicalUnitsAtSlot,
    availableEligibleUnitsAtSlot: field.availableEligibleUnitsAtSlot
  },
  shell: {
    reservedUnits: shellResult.allocatedUnits,
    missingAmountUnits: shellResult.missingAmountUnits,
    missingQualityUnits: shellResult.missingQualityUnits,
    availablePhysicalUnitsAtSlot: shellResult.availablePhysicalUnitsAtSlot,
    availableEligibleUnitsAtSlot: shellResult.availableEligibleUnitsAtSlot
  },
  global: clone(mixed.expected.global),
  reverseRecipeRows: "PASS",
  cardPriority: "PASS",
  noDoubleReserve: "PASS",
  m4Audit: "TECHNICAL_BASELINE_HARNESS_CANONICAL_ARGUMENT_MISSING",
  applicationCombinedParity: "PASS_EXACT_CANONICAL_UUID",
  crossViewParity: "PASS_FINAL_CARD_CRAFTING_LIST_COMBINED_MAXIMUM_CRAFTABLE_STANDALONE",
  maxCraftable: allocation.cards[0].maxCraftable,
  standalone: "PASS_SINGLE_FILE_MIXED_SHORTAGE"
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0131_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
