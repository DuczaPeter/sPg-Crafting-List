import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v003-c0125c1-fr86-assignment-model.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C012.5C3B2");
const standalonePath = path.join(artifactDirectory, "standalone-fr86-quality-shortage.html");
const evidencePath = path.join(artifactDirectory, "standalone-effective-quality-evidence.json");
const appHtml = fs.readFileSync(appPath, "utf8");
const appCss = extractEmbeddedApplicationCss(appHtml);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const block = (name) => {
  const match = appHtml.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-31T16:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000),
  foldSearchText: (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("MATERIAL_COLOR_MODEL")}
${block("M6_STANDALONE_EXPORT_MODEL")}
globalThis.__C0125C3B2__ = {
  rules: M2_QUALITY_RULES,
  modes: RECIPE_SLOT_QUALITY_POOL_MODES,
  allocate: allocateCardsDeterministically,
  buildSnapshot: m6BuildStandaloneSnapshot,
  renderHtml: m6RenderStandaloneHtml,
  projectQuality: projectStandaloneEffectiveQuality,
  renderRecipeRow: c010RenderStandaloneRecipeRow
};`, context, { filename: "spg-v003-c0125c3b2-model.js" });

const model = context.__C0125C3B2__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const [shell, fieldArray] = fixture.requirements;
const stileron = fixture.materials.stileron;
const feynmaline = fixture.materials.feynmaline;
const canonical = [
  { uuid: stileron.commodityUuid, displayName: stileron.name, sourceUuids: [stileron.commodityUuid, stileron.ingredientUuid] },
  { uuid: feynmaline.ingredientUuid, displayName: feynmaline.name, sourceUuids: [feynmaline.ingredientUuid] }
];
const poolSettings = { [stileron.commodityUuid]: { minimumQ: 500, maximumQ: 700 } };
const card = {
  id: "c0125c3b2-fr86",
  order: 0,
  active: true,
  quantity: 1,
  blueprintUuid: fixture.blueprint.uuid,
  outputUuid: fixture.blueprint.outputUuid,
  outputName: fixture.blueprint.outputName,
  outputTypeLabel: "Weapon",
  craftTimeSeconds: 900,
  gameVersion: "4.10.0-LIVE.12519617",
  requirements: clone(fixture.requirements),
  slotStrategies: {},
  recipeSlotQualityPoolAssignments: {
    [shell.id]: model.modes.MINIMUM_Q_POOL,
    [fieldArray.id]: model.modes.MAXIMUM_Q_POOL
  }
};
const batch = (id, materialUuid, quantityUnits, quality, unit = "SCU") => ({
  id,
  materialUuid,
  materialName: materialUuid === feynmaline.ingredientUuid ? feynmaline.name : stileron.name,
  quantityUnits,
  unit,
  quality,
  createdAt: id
});
const shortageBatches = [
  batch("stileron-q550", stileron.commodityUuid, 31000, 550),
  batch("feynmaline-q800", feynmaline.ingredientUuid, 170, 800, "ITEM")
];
const allocation = model.allocate([card], clone(shortageBatches), {}, canonical, poolSettings);
const cardResult = allocation.cards[0];
const input = {
  appName: "sPg Crafting List",
  generatedAt: "2026-08-31T16:00:00.000Z",
  scDataVersion: card.gameVersion,
  card: clone(card),
  cardResult: clone(cardResult),
  blueprint: {
    uuid: fixture.blueprint.uuid,
    outputUuid: fixture.blueprint.outputUuid,
    outputName: fixture.blueprint.outputName,
    outputTypeLabel: "Weapon",
    gameVersion: card.gameVersion,
    craftTimeSeconds: 900
  },
  outputPresentation: { uuid: fixture.blueprint.outputUuid, name: fixture.blueprint.outputName, typeLabel: "Weapon" },
  trace: clone(allocation.trace)
};
const beforeFingerprint = sha256(JSON.stringify(input));
const snapshot = model.buildSnapshot(input);
const standaloneHtml = model.renderHtml(snapshot, appCss);
const afterFingerprint = sha256(JSON.stringify(input));
assert.equal(afterFingerprint, beforeFingerprint, "A standalone snapshot/render nem módosíthatja a bemeneti User Data modellt.");

const shellSnapshot = snapshot.requirements.find((entry) => entry.recipeSlotId === shell.id);
const fieldSnapshot = snapshot.requirements.find((entry) => entry.recipeSlotId === fieldArray.id);
assert.ok(shellSnapshot && fieldSnapshot);
assert.equal(shellSnapshot.commodityUuid, stileron.commodityUuid);
assert.equal(fieldSnapshot.commodityUuid, stileron.commodityUuid);
assert.equal(shellSnapshot.standaloneQuality.assignmentSource, "EXPLICIT_RECIPE_SLOT_ASSIGNMENT");
assert.equal(shellSnapshot.standaloneQuality.assignmentMode, model.modes.MINIMUM_Q_POOL);
assert.equal(shellSnapshot.standaloneQuality.baselineRule, model.rules.FIXED);
assert.equal(shellSnapshot.standaloneQuality.poolThreshold, 500);
assert.equal(shellSnapshot.standaloneQuality.effectiveMinimum, 500);
assert.equal(shellSnapshot.standaloneQuality.displayLabel, "Minimum Q · Q500+");
assert.equal(shellSnapshot.standaloneQuality.baselineLabel, "FIXED recept · Bármely Q");
assert.equal(fieldSnapshot.standaloneQuality.assignmentMode, model.modes.MAXIMUM_Q_POOL);
assert.equal(fieldSnapshot.standaloneQuality.poolThreshold, 700);
assert.equal(fieldSnapshot.standaloneQuality.effectiveMinimum, 700);
assert.equal(fieldSnapshot.standaloneQuality.displayLabel, "MAX Q · Q700+");
assert.equal(fieldSnapshot.missingAmountUnits, 0);
assert.equal(fieldSnapshot.missingQualityUnits, 19000);
assert.equal(fieldSnapshot.status, "INSUFFICIENT_QUALITY");
assert.equal(snapshot.card.satisfied, false);

const resolved = (overrides) => model.projectQuality({
  baselineRule: model.rules.FIXED,
  baselineTarget: null,
  effectiveRule: model.rules.FIXED,
  effectiveTarget: null,
  effectiveMinimum: null,
  userFacingQualityLabel: "Bármely Q",
  ...overrides
}, overrides.qualityPolicy || {});
assert.equal(resolved({
  recipePoolAssignmentMode: model.modes.MINIMUM_Q_POOL,
  recipePoolAssignmentOrigin: "USER_EXPLICIT_RECIPE_SLOT_POOL",
  recipePoolThreshold: 500,
  recipePoolThresholdField: "minimumQ",
  recipePoolResolutionStatus: "RESOLVED_THRESHOLD",
  baselineRule: model.rules.TARGET_Q,
  baselineTarget: 700,
  effectiveRule: model.rules.TARGET_Q,
  effectiveTarget: 700,
  effectiveMinimum: 700,
  finalEffectiveMinimum: 700,
  userFacingQualityLabel: "Q700+"
}).displayLabel, "Minimum Q · effektív Q700+");
assert.equal(resolved({
  recipePoolAssignmentMode: model.modes.ANY_Q,
  recipePoolAssignmentOrigin: "USER_EXPLICIT_RECIPE_SLOT_POOL",
  recipePoolResolutionStatus: "NOT_REQUIRED_ANY_Q",
  baselineRule: model.rules.HP_MIN_500,
  effectiveRule: model.rules.HP_MIN_500,
  effectiveMinimum: 500,
  userFacingQualityLabel: "Q500+"
}).displayLabel, "Bármely Q user constraint · effektív Q500+");
assert.equal(resolved({}).displayLabel, "Recept szerint · Bármely Q");
assert.equal(resolved({
  recipePoolAssignmentMode: model.modes.MINIMUM_Q_POOL,
  recipePoolAssignmentOrigin: "USER_EXPLICIT_RECIPE_SLOT_POOL",
  recipePoolThreshold: 500,
  recipePoolThresholdField: "minimumQ",
  recipePoolResolutionStatus: "RESOLVED_THRESHOLD",
  effectiveRule: model.rules.TARGET_Q,
  effectiveTarget: 500,
  effectiveMinimum: 500,
  finalEffectiveMinimum: 500,
  userFacingQualityLabel: "Q500+"
}).baselineLabel, "FIXED recept · Bármely Q");
assert.equal(resolved({
  recipePoolAssignmentMode: model.modes.MAXIMUM_Q_POOL,
  recipePoolAssignmentOrigin: "USER_EXPLICIT_RECIPE_SLOT_POOL",
  recipePoolResolutionStatus: "UNRESOLVED_MISSING_THRESHOLD",
  allocationBlockReason: "POOL_THRESHOLD_UNRESOLVED",
  effectiveRule: model.rules.UNKNOWN,
  userFacingQualityLabel: "Q?"
}).displayLabel, "Quality nem feloldható");
assert.equal(resolved({
  baselineRule: model.rules.UNKNOWN,
  effectiveRule: model.rules.UNKNOWN,
  userFacingQualityLabel: "Q?"
}).displayLabel, "Quality nem feloldható");

assert.match(standaloneHtml, /Shell[\s\S]*Minimum Q · Q500\+/);
assert.match(standaloneHtml, /Field Array[\s\S]*MAX Q · Q700\+/);
assert.match(standaloneHtml, /FIXED recept · Bármely Q/);
assert.match(standaloneHtml, /Quality-hiány: 1,9 SCU/);
assert.match(standaloneHtml, /data-card-satisfied="false"|Nem teljesíthető/);
assert.doesNotMatch(standaloneHtml, /MAX Q[^<]*(?:≤|legfeljebb)/i);
const runtimeMarkup = standaloneHtml.replace(/<style>[\s\S]*?<\/style>/i, "").replace(/<script type="application\/json"[\s\S]*?<\/script>/i, "");
assert.doesNotMatch(runtimeMarkup, /<select\b|<input\b|contenteditable\s*=|spg-c0125c2-pool-select/i);
assert.doesNotMatch(runtimeMarkup, /indexedDB|userDataRepository|saveCraftingCards|persistMaterialQualityPoolValue/);
assert.doesNotMatch(standaloneHtml, /<link\b[^>]*stylesheet|<script\b[^>]*\bsrc\s*=|@import\s+url/i);
assertSingleFileRuntimeMarkup(standaloneHtml);

const projectionBlock = block("C0125C3B2_STANDALONE_QUALITY_PROJECTION");
assert.doesNotMatch(projectionBlock, /allocateCardsDeterministically|resolveRecipeSlotPoolAllocationPolicy|resolveEffectiveMaterialQualityPolicy|calculateQualityEligibleInventoryUnits/);
const rendererSource = appHtml.match(/function c010RenderStandaloneRecipeRow\(requirement\) \{[\s\S]*?\n    \}(?=\n\n    function m6RenderStandaloneHtml)/)?.[0] || "";
assert.ok(rendererSource);
assert.doesNotMatch(rendererSource, /allocateCardsDeterministically|resolveRecipeSlotPoolAllocationPolicy|resolveEffectiveMaterialQualityPolicy/);

fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(standalonePath, standaloneHtml, "utf8");
const evidence = {
  cycle: "V003-C012.5C3B2",
  status: "PASS",
  snapshotSource: "C3A_RESOLVED_ALLOCATION_RESULT_AND_QUALITY_POLICY",
  standaloneRecomputation: false,
  minimumQLabel: shellSnapshot.standaloneQuality.displayLabel,
  maximumQLabel: fieldSnapshot.standaloneQuality.displayLabel,
  baselineHigherThanPool: "PASS_MINIMUM_Q_EFFECTIVE_Q700_PLUS",
  anyQ: "PASS_BASELINE_PRESERVED",
  legacyFallback: "PASS_RECIPE_SEMANTICS",
  fixedWithPool: "PASS_BASELINE_VISIBLE",
  unknownAndUnresolved: "PASS_FAIL_SAFE",
  qualityShortage: "PASS_1.9_SCU_CARD_UNSATISFIED",
  canonicalUuid: "PASS_SINGLE_COMMODITY_IDENTITY",
  editableControlsAbsent: true,
  singleFile: true,
  localRuntimeSidecars: 0,
  exportReadOnly: beforeFingerprint === afterFingerprint,
  inputFingerprintBefore: beforeFingerprint,
  inputFingerprintAfter: afterFingerprint,
  bytes: Buffer.byteLength(standaloneHtml),
  sha256: sha256(standaloneHtml),
  artifact: path.relative(projectDirectory, standalonePath).replaceAll("\\", "/")
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C0125C3B2_TARGET_PASS evidence=${path.relative(projectDirectory, evidencePath).replaceAll("\\", "/")}`);
