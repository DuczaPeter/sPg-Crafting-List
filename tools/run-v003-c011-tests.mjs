import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const standaloneArgument = process.argv.find((argument) => argument.startsWith("--standalone="));
const standalonePath = standaloneArgument
  ? path.resolve(projectDirectory, standaloneArgument.slice("--standalone=".length))
  : path.join(projectDirectory, "test-artifacts", "V003-C011", "standalone-js-300-final-card.html");
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const appHtml = fs.readFileSync(appPath, "utf8");
const appCss = extractEmbeddedApplicationCss(appHtml);
const standalone = fs.readFileSync(standalonePath, "utf8");

const sha256 = (filePath) => crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
const referenceLocks = {
  "Info/A fö nézet.png": "cfd86011e619d43f73c9fca358974d0c489fc1936e761702f6f1c37cd55689fa",
  "Info/A Crafting card.png": "2fbc9f4f39d4b33b4a65673ca9daa4af0c81f3b69d4ac8279c76776f503b2be5"
};
for (const [relativePath, expectedHash] of Object.entries(referenceLocks)) {
  const absolutePath = path.join(projectDirectory, ...relativePath.split("/"));
  assert.ok(fs.existsSync(absolutePath), `A vizuális referencia hiányzik: ${relativePath}`);
  assert.equal(sha256(absolutePath), expectedHash, `A vizuális referencia megváltozott: ${relativePath}`);
}

const browserPanelMatch = appHtml.match(/<section id="blueprintBrowserPanel"[\s\S]*?<\/section>/);
assert.ok(browserPanelMatch, "A Blueprint Browser panel hiányzik.");
const browserPanel = browserPanelMatch[0];
assert.doesNotMatch(browserPanel, /RÉSZLET-CACHE/i, "A RÉSZLET-CACHE felirat még látható a Blueprint Browserben.");
assert.doesNotMatch(browserPanel, /Blueprint UUID|Adatforrás|Lekérés|SC-verzió|Recipe slot/i, "Technikai cache-mező maradt a Blueprint Browser főnézetében.");
assert.doesNotMatch(browserPanel, /blueprintBrowserDetail/, "A technikai részletpanel DOM-ja még jelen van.");
assert.match(browserPanel, /<div class="spg-browser-list">[\s\S]*?id="blueprintBrowserResults"/, "A találati lista nem kapta meg a C011 listakonténert.");
assert.doesNotMatch(appHtml, /function\s+renderBlueprintBrowserDetail\s*\(/, "A megszüntetett főnézeti detail renderelő bent maradt.");
assert.doesNotMatch(appHtml, /500;700;800&family=Roboto/, "Az árva font-import maradvány még jelen van.");
assert.doesNotMatch(appCss, /@import|fonts\.googleapis\.com|fonts\.gstatic\.com/i, "Külső font/CSS függés került vissza.");
assertSingleFileRuntimeMarkup(appHtml);

const browserResultsRule = appCss.match(/body\[data-active-module="blueprintBrowserNav"\] #blueprintBrowserPanel \.spg-browser-results\s*\{([\s\S]*?)\}/);
assert.ok(browserResultsRule, "A Blueprint Browser aktív listastílusa hiányzik.");
assert.match(browserResultsRule[1], /height:\s*clamp\(230px,\s*calc\(100vh - 530px\),\s*620px\)/, "A desktop listamagasság nem használja ki a viewportot.");
const genericResultsRule = appCss.match(/\.spg-browser-results\s*\{([\s\S]*?)\}/);
assert.ok(genericResultsRule, "A Blueprint Browser listastílusa hiányzik.");
assert.match(genericResultsRule[1], /overflow-y:\s*auto/, "A blueprint lista belső függőleges scrollja hiányzik.");
assert.match(genericResultsRule[1], /overflow-x:\s*hidden/, "A blueprint lista vízszintes túlcsordulása nincs levédve.");
assert.match(appCss, /@media \(max-width:\s*820px\)[\s\S]*?#blueprintBrowserPanel \.spg-browser-results\s*\{[\s\S]*?height:\s*min\(360px,\s*48vh\)/, "A mobil listamagasság nincs korlátozva.");

const resultRenderer = appHtml.match(/function renderBlueprintBrowserResults\(\)\s*\{([\s\S]*?)\n\s*\}\n\n\s*async function loadBlueprintIndexFromCache/);
assert.ok(resultRenderer, "A Blueprint Browser találati renderelő nem auditálható.");
assert.match(resultRenderer[1], /button\.setAttribute\("aria-current",\s*"true"\)/, "A kiválasztott blueprint kijelölése elveszett.");
const detailLoader = appHtml.match(/async function loadBlueprintDetail\(identifier, options\)\s*\{([\s\S]*?)\n\s*\}\n\n\s*async function syncBlueprintIndex/);
assert.ok(detailLoader, "A blueprint detail betöltő nem auditálható.");
assert.match(detailLoader[1], /state\.normalizedBlueprint\s*=\s*normalized/, "A kiválasztott normalizált blueprint állapota nem frissül.");
assert.match(detailLoader[1], /renderBlueprintBrowserResults\(\)/, "A bal oldali kijelölés nem renderelődik újra.");
assert.match(detailLoader[1], /await prepareC010FinalCraftingCard\(\{ resetQuantity: true \}\)/, "A Final Crafting Card frissítése elveszett.");

const modelMatch = appHtml.match(/\/\* M1_PURE_MODEL_START \*\/([\s\S]*?)\/\* M1_PURE_MODEL_END \*\//);
assert.ok(modelMatch, "Az M1 normalizált modellblokk hiányzik.");
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-25T10:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${modelMatch[1]}
globalThis.__C011_MODEL__ = { normalizeBlueprint };`, context, { filename: "spg-v003-c011-model.js" });
const rawBlueprint = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "js-300-blueprint.json"), "utf8"));
const provenance = {
  rawBlueprintUuid: rawBlueprint.uuid,
  gameVersion: rawBlueprint.game_version,
  dataSource: "Star Citizen Wiki API",
  source: "https://api.star-citizen.wiki/api/blueprints/js-300",
  fetchedAt: "2026-08-25T10:00:00.000Z",
  origin: "FIXTURE",
  rawCacheKey: `${rawBlueprint.game_version}::${rawBlueprint.uuid}`
};
const normalized = context.__C011_MODEL__.normalizeBlueprint(rawBlueprint, provenance);
assert.equal(normalized.uuid, rawBlueprint.uuid, "A technikai Blueprint UUID elveszett a modellből.");
assert.equal(normalized.gameVersion, rawBlueprint.game_version, "Az SC-verzió elveszett a modellből.");
assert.equal(normalized.outputTypeLabel, "Power Plant", "Az output típus elveszett a modellből.");
assert.equal(normalized.recipeSlots.length, 3, "A recipe slot adatok elvesztek a modellből.");
assert.equal(normalized.provenance.dataSource, provenance.dataSource, "Az adatforrás elveszett a modellből.");
assert.equal(normalized.provenance.fetchedAt, provenance.fetchedAt, "A lekérési idő elveszett a modellből.");
assert.equal(normalized.provenance.source, provenance.source, "A forrás URL elveszett a modellből.");

const standaloneMainMatch = standalone.match(/<article class="spg-c010-final-card spg-c010-standalone-card"[\s\S]*?<\/article>/);
assert.ok(standaloneMainMatch, "A C011 standalone Final Crafting Card hiányzik.");
const standaloneMain = standaloneMainMatch[0];
assert.match(standaloneMain, />JS-300</, "A JS-300 cím hiányzik a standalone kártyáról.");
assert.equal((standaloneMain.match(/class="spg-c010-recipe-row"/g) || []).length, 3, "A standalone recept nem három slotot mutat.");
assert.equal((standaloneMain.match(/class="spg-c010-material"/g) || []).length, 3, "A standalone kártya nem három material blokkot mutat.");
assert.equal((standaloneMain.match(/class="spg-c010-radar-chip"/g) || []).length, 8, "A standalone Radar chip-készlet megváltozott.");
assert.doesNotMatch(standalone, /RÉSZLET-CACHE/i, "A technikai cache-blokk bekerült a standalone exportba.");
assert.doesNotMatch(standalone, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i, "Külső runtime erőforrás maradt a standalone exportban.");
assert.doesNotMatch(standalone, /fetch\s*\(/i, "Runtime fetch maradt a standalone exportban.");

console.log("V003_C011_FINAL_UI_CLEANUP_TEST_PASS");
console.log(JSON.stringify({
  referenceLock: referenceLocks,
  detailVisibleCount: 0,
  technicalModelRetained: true,
  selectedResultRetained: true,
  listScrollStrategy: "viewport-height + overflow-y:auto",
  standaloneBytes: Buffer.byteLength(standalone, "utf8"),
  standaloneExternalRuntimeResources: 0
}, null, 2));
