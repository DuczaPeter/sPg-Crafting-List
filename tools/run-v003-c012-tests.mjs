import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const fixtureDirectory = path.join(projectDirectory, "tests", "fixtures");
const standaloneArgument = process.argv.find((argument) => argument.startsWith("--standalone="));
const standalonePath = standaloneArgument
  ? path.resolve(projectDirectory, standaloneArgument.slice("--standalone=".length))
  : path.join(projectDirectory, "test-artifacts", "V003-C012", "standalone-js-300-final-card.html");
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const appHtml = fs.readFileSync(appPath, "utf8");
const appCss = extractEmbeddedApplicationCss(appHtml);
const standalone = fs.readFileSync(standalonePath, "utf8");

assertSingleFileRuntimeMarkup(appHtml);
assert.ok(appHtml.includes("function renderFinalCraftingCardContent"), "A közös Final Crafting Card renderer hiányzik.");
const browserRenderer = appHtml.match(/function renderC010FinalCraftingCard\(\)\s*\{([\s\S]*?)\n\s*\}\n\n\s*function renderC009MaterialSnapshot/);
assert.ok(browserRenderer, "A Blueprint Browser Final Card renderer nem auditálható.");
assert.match(browserRenderer[1], /renderFinalCraftingCardContent\(viewModel/, "A Blueprint Browser nem a közös Final Card renderert használja.");
const listRenderer = appHtml.match(/function renderCraftingCards\(\)\s*\{([\s\S]*?)\n\s*\}\n\n\s*function recalculateAllocation/);
assert.ok(listRenderer, "A Crafting List renderer nem auditálható.");
assert.match(listRenderer[1], /buildFinalCraftingCardViewModel\(/, "A Crafting List elvesztette a kanonikus view-modelt.");
assert.match(listRenderer[1], /renderFinalCraftingCardContent\(cardViewModel/, "A Crafting List nem a közös Final Card renderert használja.");
assert.doesNotMatch(listRenderer[1], /renderRequirementAllocation\(/, "A régi dashboard renderer visszakerült a Crafting List főnézetébe.");
assert.match(listRenderer[1], /CARD_COLLAPSE/, "A mentett expanded/collapsed állapot kezelése hiányzik.");
assert.match(listRenderer[1], /moveCraftingCard\(card\.id,\s*-1\)/, "A prioritás-feljebb művelet hiányzik.");
assert.match(listRenderer[1], /moveCraftingCard\(card\.id,\s*1\)/, "A prioritás-lejjebb művelet hiányzik.");
assert.match(listRenderer[1], /duplicateCraftingCard/, "A duplikálás elveszett.");
assert.match(listRenderer[1], /deleteCraftingCard/, "A törlés elveszett.");
assert.match(listRenderer[1], /downloadStandaloneExport/, "A kanonikus egykártyás export elveszett.");
assert.match(listRenderer[1], /sourceCardId:\s*card\.id[\s\S]*?sourceModule:\s*"craftingListNav"/, "A detail route nem őrzi a forráskártya-kontektsust.");
assert.match(listRenderer[1], /onQuantityInput:\s*function\s*\(value\)/, "A mennyiség nem mentődik input közben.");
assert.match(appHtml, /spg-source-card=/, "A detail route nem tárolja a forrás Crafting Card azonosítóját.");
assert.match(appHtml, /spgDetailReturnedCardId/, "A detail-visszatérés diagnosztikája nem azonosítja a helyreállított kártyát.");

const sharedRenderer = appHtml.match(/function renderFinalCraftingCardContent\(viewModel, options\)\s*\{([\s\S]*?)\n\s*\}\n\n\s*function renderC010FinalCraftingCard/);
assert.ok(sharedRenderer, "A közös presentation helper nem izolálható.");
for (const marker of ["spg-c010-topline", "spg-c010-titleline", "spg-c010-recipe", "spg-c010-material-list", "renderC010RecipeRow", "renderC010MaterialIntelligence"]) {
  assert.ok(sharedRenderer[1].includes(marker), `A közös rendererből hiányzik: ${marker}`);
}
assert.equal((appHtml.match(/materials\.append\(renderC010MaterialIntelligence/g) || []).length, 1, "A material intelligence live DOM implementáció duplikálódott.");
assert.equal((appHtml.match(/recipe\.append\(renderC010RecipeRow/g) || []).length, 1, "A recipe live DOM implementáció duplikálódott.");

const allocationSummary = appHtml.match(/function renderAllocationSummary\(\)\s*\{([\s\S]*?)\n\s*\}\n\n\s*function combinedQualityLabel/);
assert.ok(allocationSummary, "A Crafting List summary nem auditálható.");
assert.match(allocationSummary[1], /kártya · [" +\w.()]+recipe slot · [" +\w.()]+hiányos/, "A kompakt summary sor hiányzik.");
assert.doesNotMatch(allocationSummary[1], /Tervezett batch-foglalás|Aktív kártya/, "A régi négyblokkos dashboard summary visszakerült.");

for (const marker of [
  ".spg-c012-list-card",
  ".spg-c012-management",
  ".spg-c012-final-card",
  ".spg-c012-quality-controls",
  '.spg-c012-list-card[data-collapsed="true"]',
  "@media (max-width: 560px)"
]) {
  assert.ok(appCss.includes(marker), `A C012 CSS marker hiányzik: ${marker}`);
}
assert.match(appCss, /body\[data-active-module="craftingListNav"\] \.spg-allocation-summary\s*\{[\s\S]*?display:\s*block/, "A nagy summary-grid nincs kompakt sorra cserélve.");
assert.match(appCss, /\.spg-c012-list-card,[\s\S]*?\.spg-c012-final-card\s*\{[\s\S]*?width:\s*100%/, "A mobil teljes szélességű kártya-szabály hiányzik.");

const fixtureFiles = ["js-300-blueprint.json", "hofstede-s1-blueprint.json", "duplicate-material-blueprint.json"];
const fixtures = fixtureFiles.map((name) => JSON.parse(fs.readFileSync(path.join(fixtureDirectory, name), "utf8")));
const fixtureNames = fixtures.map((fixture) => fixture.output.name);
assert.equal(new Set(fixtureNames).size, 3, "A háromkártyás fixture nem három külön output.");
const threeCardPresentation = fixtures.map((fixture, index) => ({
  priority: index + 1,
  outputName: fixture.output.name,
  renderer: "renderFinalCraftingCardContent",
  collapsed: index === 2
}));
assert.deepEqual(threeCardPresentation.map((card) => card.priority), [1, 2, 3]);
assert.equal(threeCardPresentation.filter((card) => !card.collapsed).length, 2);
assert.equal(threeCardPresentation.filter((card) => card.collapsed).length, 1);
const tenCardStress = Array.from({ length: 10 }, (_, index) => ({ priority: index + 1, collapsed: index >= 2 }));
assert.equal(tenCardStress.filter((card) => card.collapsed).length, 8, "A 10-card stress fixture nem bizonyít kompakt listát.");

const m1Match = appHtml.match(/\/\* M1_PURE_MODEL_START \*\/([\s\S]*?)\/\* M1_PURE_MODEL_END \*\//);
const m2Match = appHtml.match(/\/\* M2_ALLOCATION_ENGINE_START \*\/([\s\S]*?)\/\* M2_ALLOCATION_ENGINE_END \*\//);
assert.ok(m1Match && m2Match, "Az allocation priority modellblokk nem auditálható.");
const context = vm.createContext({ console, nowIso: () => "2026-08-25T12:00:00.000Z", toScuUnits: (value) => Math.round(Number(value) * 10000) });
vm.runInContext(`${m1Match[1]}\n${m2Match[1]}\nglobalThis.__C012__={allocateCardsDeterministically};`, context, { filename: "spg-v003-c012-allocation.js" });
const allocationFixture = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, "m2-allocation-cases.json"), "utf8"));
const requirement = structuredClone(allocationFixture.baseRequirement);
requirement.requiredQuantityUnits = 8000;
const makeCard = (id, order) => ({ id, order, active: true, quantity: 1, outputName: id, blueprintUuid: `blueprint-${id}`, requirements: [structuredClone(requirement)], slotStrategies: {} });
const batches = [
  { id: "priority-q930", materialUuid: allocationFixture.materialUuid, materialName: "Fixture Material", quality: 930, quantityUnits: 10000, unit: "SCU", createdAt: "2026-08-25T12:00:00.000Z" },
  { id: "priority-q850", materialUuid: allocationFixture.materialUuid, materialName: "Fixture Material", quality: 850, quantityUnits: 6000, unit: "SCU", createdAt: "2026-08-25T12:00:01.000Z" }
];
const resultAB = context.__C012__.allocateCardsDeterministically([makeCard("card-a", 0), makeCard("card-b", 1)], batches);
const resultBA = context.__C012__.allocateCardsDeterministically([makeCard("card-a", 1), makeCard("card-b", 0)], batches);
const allocationFor = (result, id) => result.cards.find((card) => card.cardId === id).requirements[0].allocatedBatches.map((batch) => batch.quality);
assert.deepEqual(Array.from(allocationFor(resultAB, "card-a")), [930]);
assert.deepEqual(Array.from(allocationFor(resultBA, "card-b")), [930]);
assert.notDeepEqual(Array.from(allocationFor(resultAB, "card-b")), Array.from(allocationFor(resultBA, "card-b")), "A priority swap nem változtatta meg determinisztikusan a foglalást.");

const standaloneMain = standalone.match(/<article class="spg-c010-final-card spg-c010-standalone-card"[\s\S]*?<\/article>/);
assert.ok(standaloneMain, "A standalone Final Card hiányzik.");
assert.equal((standaloneMain[0].match(/class="spg-c010-recipe-row"/g) || []).length, 3, "A standalone recipe parity megváltozott.");
assert.equal((standaloneMain[0].match(/class="spg-c010-material"/g) || []).length, 3, "A standalone material parity megváltozott.");
assert.doesNotMatch(standalone, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i, "Külső runtime erőforrás került a standalone exportba.");

const referencePath = path.join(projectDirectory, "Info", "A Crafting card.png");
const referenceSha = crypto.createHash("sha256").update(fs.readFileSync(referencePath)).digest("hex");
assert.equal(referenceSha, "2fbc9f4f39d4b33b4a65673ca9daa4af0c81f3b69d4ac8279c76776f503b2be5", "A Crafting Card vizuális referencia megváltozott.");

console.log("V003_C012_CRAFTING_LIST_PARITY_TEST_PASS");
console.log(JSON.stringify({
  sharedRenderer: "renderFinalCraftingCardContent",
  fixtureCards: threeCardPresentation,
  tenCardStress: { cards: 10, expanded: 2, collapsed: 8 },
  prioritySwap: true,
  sourceCardAwareDetail: true,
  standaloneBytes: Buffer.byteLength(standalone, "utf8"),
  externalRuntimeResources: 0
}, null, 2));
