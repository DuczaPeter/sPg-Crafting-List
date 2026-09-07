import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v003-c0125c1-fr86-assignment-model.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C012.5C2");
const evidencePath = path.join(artifactDirectory, "recipe-pool-dropdown-evidence.json");
const html = fs.readFileSync(appPath, "utf8");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

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
globalThis.__C0125C2__ = {
  RECIPE_SLOT_QUALITY_POOL_MODES,
  RECIPE_SLOT_QUALITY_POOL_UI_LEGACY,
  normalizeRecipeSlotQualityPoolAssignments,
  recipeSlotQualityPoolAssignmentFor,
  setRecipeSlotQualityPoolAssignment,
  clearRecipeSlotQualityPoolAssignment,
  applyRecipeSlotQualityPoolAssignmentsToCard,
  resolveFinalCardQualityPoolAssignmentSource,
  buildRecipeSlotQualityPoolUiModel,
  allocateCardsDeterministically
};`, context, { filename: "spg-v003-c0125c2-model.js" });

const model = context.__C0125C2__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const [shell, fieldArray] = fixture.requirements;
const stileron = fixture.materials.stileron;
const modes = model.RECIPE_SLOT_QUALITY_POOL_MODES;
const legacy = model.RECIPE_SLOT_QUALITY_POOL_UI_LEGACY;
const canonical = [{ uuid: stileron.commodityUuid, displayName: stileron.name, sourceUuids: [stileron.commodityUuid, stileron.ingredientUuid] }];
const pools = { [stileron.commodityUuid]: { minimumQ: 500, maximumQ: 950 } };
const makeCard = (id, assignments = {}) => ({
  id,
  order: 0,
  active: true,
  quantity: 1,
  blueprintUuid: fixture.blueprint.uuid,
  outputName: fixture.blueprint.outputName,
  requirements: clone(fixture.requirements),
  slotStrategies: {},
  recipeSlotQualityPoolAssignments: clone(assignments)
});
const uiFor = (card, requirement, effectiveLabel = "Q500+", qualityPools = pools) => model.buildRecipeSlotQualityPoolUiModel({
  card,
  recipeSlotId: requirement.id,
  materialUuid: requirement.commodityUuid || requirement.ingredientUuid,
  materialQualityPools: qualityPools,
  canonicalMaterials: canonical,
  effectiveLabel
});

const emptyCard = makeCard("fr86-empty");
const legacyUi = uiFor(emptyCard, shell, "Q800+");
assert.equal(legacyUi.selectedValue, legacy);
assert.equal(legacyUi.assignmentOrigin, "LEGACY_FALLBACK");
assert.equal(legacyUi.options[0].label, "Recept szerint · Q800+");
assert.deepEqual(JSON.parse(JSON.stringify(legacyUi.options.map((option) => option.value))), [legacy, modes.ANY_Q, modes.MINIMUM_Q_POOL, modes.MAXIMUM_Q_POOL]);
assert.equal(uiFor({ ...emptyCard, recipeSlotQualityPoolAssignments: { [shell.id]: "SUPER_Q_POOL" } }, shell).selectedValue, legacy);

let draft = model.setRecipeSlotQualityPoolAssignment({}, shell.id, modes.MINIMUM_Q_POOL);
draft = model.setRecipeSlotQualityPoolAssignment(draft, fieldArray.id, modes.MAXIMUM_Q_POOL);
const draftSource = model.resolveFinalCardQualityPoolAssignmentSource(null, [], draft, fixture.requirements);
assert.equal(draftSource.origin, "TRANSIENT_DRAFT");
assert.equal(draftSource.assignments[shell.id], modes.MINIMUM_Q_POOL);
assert.equal(draftSource.assignments[fieldArray.id], modes.MAXIMUM_Q_POOL);
const newCard = model.applyRecipeSlotQualityPoolAssignmentsToCard(makeCard("fr86-new"), draftSource.assignments);
assert.equal(newCard.recipeSlotQualityPoolAssignments[shell.id], modes.MINIMUM_Q_POOL);
assert.equal(newCard.recipeSlotQualityPoolAssignments[fieldArray.id], modes.MAXIMUM_Q_POOL);

const cardA = makeCard("fr86-a", { [shell.id]: modes.MINIMUM_Q_POOL, [fieldArray.id]: modes.MAXIMUM_Q_POOL });
const cardB = makeCard("fr86-b", { [shell.id]: modes.MAXIMUM_Q_POOL });
assert.equal(model.resolveFinalCardQualityPoolAssignmentSource(null, [cardA, cardB], {}, fixture.requirements).origin, "TRANSIENT_DRAFT", "Blueprint UUID alapján tilos találomra Cardot kötni.");
const boundA = model.resolveFinalCardQualityPoolAssignmentSource(cardA.id, [cardA, cardB], {}, fixture.requirements);
assert.equal(boundA.boundCardId, cardA.id);
assert.equal(boundA.assignments[shell.id], modes.MINIMUM_Q_POOL);
cardA.recipeSlotQualityPoolAssignments = model.setRecipeSlotQualityPoolAssignment(cardA.recipeSlotQualityPoolAssignments, shell.id, modes.MAXIMUM_Q_POOL);
assert.equal(uiFor(cardA, shell).selectedValue, modes.MAXIMUM_Q_POOL);
assert.equal(uiFor(cardA, fieldArray).selectedValue, modes.MAXIMUM_Q_POOL);
assert.equal(uiFor(cardB, shell).selectedValue, modes.MAXIMUM_Q_POOL);
cardA.recipeSlotQualityPoolAssignments = model.setRecipeSlotQualityPoolAssignment(cardA.recipeSlotQualityPoolAssignments, shell.id, modes.MINIMUM_Q_POOL);
assert.equal(uiFor(cardA, shell).selectedValue, modes.MINIMUM_Q_POOL);
assert.equal(uiFor(cardB, shell).selectedValue, modes.MAXIMUM_Q_POOL);

const duplicate = clone(cardA);
duplicate.id = "fr86-duplicate";
duplicate.recipeSlotQualityPoolAssignments = model.setRecipeSlotQualityPoolAssignment(duplicate.recipeSlotQualityPoolAssignments, shell.id, modes.MAXIMUM_Q_POOL);
assert.equal(uiFor(cardA, shell).selectedValue, modes.MINIMUM_Q_POOL);
assert.equal(uiFor(duplicate, shell).selectedValue, modes.MAXIMUM_Q_POOL);

const cleared = model.clearRecipeSlotQualityPoolAssignment(cardA.recipeSlotQualityPoolAssignments, shell.id);
assert.equal(model.recipeSlotQualityPoolAssignmentFor({ recipeSlotQualityPoolAssignments: cleared }, shell.id).explicit, false);
assert.equal(uiFor({ ...cardA, recipeSlotQualityPoolAssignments: cleared }, shell).selectedValue, legacy);
assert.equal(uiFor(cardA, shell, "Q500+", { [stileron.commodityUuid]: { minimumQ: 700, maximumQ: 990 } }).options[2].label, "Minimum Q · Q700–Q989");
assert.equal(uiFor(cardA, shell, "Q500+", { [stileron.commodityUuid]: { minimumQ: 700, maximumQ: 990 } }).options[3].label, "MAX Q · Q990+");
assert.equal(cardA.recipeSlotQualityPoolAssignments[shell.id], modes.MINIMUM_Q_POOL, "A threshold változás nem írhat numerikus értéket az assignmentbe.");

const batches = [
  { id: "q550", materialUuid: stileron.commodityUuid, materialName: "Stileron", quantityUnits: 12000, unit: "SCU", quality: 550, createdAt: "1" },
  { id: "q750", materialUuid: stileron.commodityUuid, materialName: "Stileron", quantityUnits: 19000, unit: "SCU", quality: 750, createdAt: "2" },
  { id: "feyn", materialUuid: fixture.materials.feynmaline.ingredientUuid, materialName: "Feynmaline", quantityUnits: 170, unit: "ITEM", quality: 900, createdAt: "3" }
];
const withoutAssignments = clone(cardA);
delete withoutAssignments.recipeSlotQualityPoolAssignments;
const legacyPlan = { [stileron.ingredientUuid]: { mode: "TARGET_Q", targetQuality: 700 } };
assert.equal(model.allocateCardsDeterministically([withoutAssignments], batches, legacyPlan, canonical).cards[0].requirements[0].allocatedBatches[0].batchId, "q750");

const sharedRenderer = html.match(/function renderFinalCraftingCardContent\(viewModel, options\) \{[\s\S]*?\n    \}(?=\n\n    function renderC010FinalCraftingCard)/);
assert.ok(sharedRenderer);
assert.match(sharedRenderer[0], /renderC010RecipeRow\(requirement, settings\)/);
assert.match(html, /function renderRecipeSlotQualityPoolSelect/);
assert.match(html, /spg-c0125c2-pool-select/);
assert.match(html, /onQualityPoolAssignment: function \(mode, requirement\)/);
assert.match(html, /applyRecipeSlotQualityPoolAssignmentsToCard\(card, state\.finalCardPreview\.recipeSlotQualityPoolAssignments\)/);
assert.match(html, /state\.finalCardBoundCardId = card\.id/);
assert.match(html, /renderC010FinalCraftingCard\(\);[\s\S]*renderCraftingCards\(\);/);
assert.match(html, /function allocateCardsDeterministically\(cards, batches, materialQualityPlans, canonicalMaterials, materialQualityPools\)/);
const standaloneRequirement = html.match(/function m6RenderRequirement\(requirement\) \{[\s\S]*?\n    \}(?=\n\n    function)/);
assert.ok(standaloneRequirement);
assert.match(standaloneRequirement[0], /spg-export-quality/);
assert.doesNotMatch(standaloneRequirement[0], /select|spg-c0125c2/);

const evidence = {
  cycle: "V003-C012.5C2",
  status: "PASS",
  options: legacyUi.options,
  legacyFallbackUi: "PASS",
  draftToCardCopy: "PASS",
  exactCardBindingOnly: "PASS",
  sameCardSharedStateModel: "PASS",
  slotIndependence: "PASS",
  cardIndependence: "PASS",
  duplicateIndependence: "PASS",
  dynamicThresholdLabels: "PASS",
  invalidStoredFallback: "PASS",
  legacyFallbackAllocationCompatibility: "PASS",
  standaloneEditableDropdown: false,
  c0125c3aIntegrationExpected: true,
  c0125c3bStarted: false
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0125C2_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
