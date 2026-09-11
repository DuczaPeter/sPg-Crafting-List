import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const standaloneArgument = process.argv.find((argument) => argument.startsWith("--standalone="));
const releaseCandidateMode = process.env.SPG_V004_RELEASE_CANDIDATE_MODE === "1";
if (releaseCandidateMode) {
  assert.ok(standaloneArgument, "Release-candidate módban kötelező az explicit --standalone binding.");
  assert.ok(standaloneArgument.slice("--standalone=".length).trim(), "Release-candidate módban a --standalone útvonal nem lehet üres.");
}
const standalonePath = standaloneArgument
  ? path.resolve(projectDirectory, standaloneArgument.slice("--standalone=".length))
  : path.join(projectDirectory, "test-artifacts", "V003-C010", "standalone-js-300-final-card.html");
const appHtml = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const standalone = fs.readFileSync(standalonePath, "utf8");

for (const marker of [
  'data-active-module="blueprintBrowserNav"',
  'body[data-active-module="blueprintBrowserNav"] #finalCraftingCardPanel',
  'body[data-active-module="craftingListNav"] #craftingCardsPanel',
  'body[data-active-module="craftingListNav"] #blueprintBrowserPanel',
  'id="finalCraftingCardPanel"',
  'id="finalCraftingCardPreview"',
  "function buildC010PreviewCard",
  "function prepareC010FinalCraftingCard",
  "function addC010FinalCardToCraftingList",
  "function renderC010FinalCraftingCard",
  "function renderC010MaterialIntelligence",
  "bindCommittedNumericEditor(quantity",
  "onQuantityCommit",
  "function c010MiningSummary",
  "function c010RefinerySummary",
  "function c010RenderStandaloneMaterial",
  'navigateToPanel("craftingListNav", "craftingCardsPanel"'
]) {
  assert.ok(appHtml.includes(marker), `A C010 alkalmazásmarker hiányzik: ${marker}`);
}
assert.ok(!appHtml.includes("onQuantityInput"), "A karakterenkénti quantity callback visszakerült.");

const liveStart = appHtml.indexOf("function renderC010FinalCraftingCard");
const liveEnd = appHtml.indexOf("function renderC009MaterialSnapshot", liveStart);
assert.ok(liveStart >= 0 && liveEnd > liveStart, "A C010 live renderer nem izolálható.");
const liveRenderer = appHtml.slice(liveStart, liveEnd);
for (const forbidden of ["Prioritás ", "Belső részlet", "Kártyaműveletek", "Terv teljesíthető", "Hiány van"]) {
  assert.ok(!liveRenderer.includes(forbidden), `Dashboard/admin elem maradt a Final Card rendererben: ${forbidden}`);
}
assert.ok(appHtml.includes("function renderCraftingCards"), "A teljes Crafting List renderer eltűnt.");
assert.ok(appHtml.includes("Kártyaműveletek"), "A külön Crafting List admin funkciója elveszett.");

for (const reference of ["Info/A fö nézet.png", "Info/A Crafting card.png"]) {
  const bytes = fs.readFileSync(path.join(projectDirectory, reference));
  assert.equal(bytes.toString("ascii", 1, 4), "PNG", `${reference} nem PNG.`);
}

const snapshotMatch = standalone.match(/<script type="application\/json" id="spg-export-snapshot">([\s\S]*?)<\/script>/);
assert.ok(snapshotMatch, "A C010 standalone snapshot hiányzik.");
const snapshot = JSON.parse(snapshotMatch[1]);
assert.equal(snapshot.card.outputName, "JS-300");
assert.equal(snapshot.card.outputSize, "1");
assert.equal(snapshot.card.outputClass, "Military");
assert.equal(snapshot.card.outputGrade, "A");
assert.equal(snapshot.card.craftTimeSeconds, 900);
assert.equal(snapshot.card.requestedQuantity, 2);
assert.equal(snapshot.card.maxCraftable, 3);
assert.equal(snapshot.requirements.length, 3);

const mainMatch = standalone.match(/<article class="spg-c010-final-card spg-c010-standalone-card"[\s\S]*?<\/article>/);
assert.ok(mainMatch, "A standalone fő Final Card hiányzik.");
const main = mainMatch[0];
assert.equal((main.match(/spg-c010-recipe-row/g) || []).length, 3, "A recipe nem pontosan három kompakt sor.");
assert.equal((main.match(/<section class="spg-c010-material"/g) || []).length, 3, "Nem pontosan három material intelligence blokk renderelt.");
assert.equal((main.match(/class="spg-c010-stock"/g) || []).length, 3, "A jobboldali készletoszlop hiányos.");
assert.equal((main.match(/15:00/g) || []).length, 1, "A Crafting Time duplikált vagy hiányzik.");
assert.equal((main.match(/2 DB/g) || []).length, 1, "A quantity duplikált vagy hiányzik.");
assert.equal((main.match(/Max: 3 DB/g) || []).length, 1, "A max craftable duplikált vagy hiányzik.");
for (const marker of ["Shell", "Stileron", "0,35 SCU", "Voltage Regulator", "Beryl", "0,14 SCU", "Stator Cores", "Savrilium", "0,24 SCU", "Mining", "Refinery", "Radar", "Stanton:", "Pyro:", "Nyx:"]) {
  assert.ok(main.includes(marker), `A kompakt C010 kártyából hiányzik: ${marker}`);
}
for (const forbidden of ["Crafting List", ">Recipe Slot<", "Prioritás", "Belső részlet", "Kártyaműveletek", "Terv teljesíthető", "Hiány van", "Spawn ", "Occurrence ", "Maximum Quality"]) {
  assert.ok(!main.includes(forbidden), `Nem Final Card jellegű tartalom maradt a standalone főnézetben: ${forbidden}`);
}

const firstStanton = main.indexOf("Stanton:");
const firstPyro = main.indexOf("Pyro:");
const firstNyx = main.indexOf("Nyx:");
assert.ok(firstStanton >= 0 && firstStanton < firstPyro && firstPyro < firstNyx, "A kötelező Stanton → Pyro → Nyx sorrend hibás.");

for (const [material, expected] of Object.entries({
  Stileron: [3185, 6370],
  Beryl: [3540, 7080, 10620, 14160],
  Savrilium: [3200, 6400]
})) {
  const requirement = snapshot.requirements.find((entry) => entry.materialName === material);
  assert.ok(requirement, `${material} snapshot hiányzik.`);
  const actual = [...new Set([requirement.mining.radarSignature, ...(requirement.mining.radarSignatureClusterSignatures || [])].map(Number).filter((value) => Number.isFinite(value) && value > 0))].sort((a, b) => a - b);
  assert.deepEqual(actual, expected, `${material} curated Radar értékei hibásak.`);
  assert.equal(requirement.mining.radarSignatureStatus, "VERIFIED");
  for (const system of requirement.mining.systems || []) {
    if (system.status !== "AVAILABLE") continue;
    const top = (system.methods || []).filter((method) => Number(method.rankingTier || method.rankPosition || 1) === 1);
    assert.ok(top.length >= 1, `${material}/${system.system} top-1 hiányzik.`);
  }
}
for (const formatted of ["3185", "6370", "3540", "7080", "10 620", "14 160", "3200", "6400"]) {
  assert.ok(main.includes(formatted), `A tagolt Radar chip hiányzik: ${formatted}`);
}

const exactUrls = [
  snapshot.card.apiWikiLink.url,
  ...snapshot.requirements.map((requirement) => requirement.materialDetails.apiWikiLink.url)
];
for (const url of exactUrls) {
  assert.ok(main.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`), `Exact API link hiányzik: ${url}`);
}
assert.ok((main.match(/data-detail-kind="mining"/g) || []).length >= 3, "Mining detail link hiányos.");
assert.ok((main.match(/data-detail-kind="refinery"/g) || []).length >= 2, "Refinery detail link hiányos.");
assert.equal((main.match(/class="spg-c010-radar-chip"/g) || []).length, 8, "A Radar detail chipkészlet nem pontosan a curated 8 érték.");
assert.doesNotMatch(standalone, /Megnyitás a Star Citizen Wiki-ben/);
assert.doesNotMatch(standalone, /href="https:\/\/star-citizen\.wiki\//);
assert.doesNotMatch(standalone, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);
assert.doesNotMatch(standalone, /fetch\s*\(/i);

console.log("V003_C010_EXACT_FINAL_CARD_TEST_PASS");
console.log(JSON.stringify({
  defaultView: "Blueprint Browser + Final Card only",
  recipeRows: 3,
  materialBlocks: 3,
  radarChips: (main.match(/class="spg-c010-radar-chip"/g) || []).length,
  exactApiLinks: exactUrls.length,
  standaloneBytes: Buffer.byteLength(standalone),
  externalRuntimeResources: 0
}, null, 2));
