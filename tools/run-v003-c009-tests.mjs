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
  : path.join(projectDirectory, "test-artifacts", "V003-C009", "standalone-js-300-final-card.html");
const appHtml = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const standalone = fs.readFileSync(standalonePath, "utf8");

for (const marker of [
  "function resolveItemApiDeepLink",
  "function resolveMaterialApiDeepLink",
  "function c009RadarValues",
  "function c009TopMiningMethods",
  "function renderC009MaterialSnapshot",
  "function c009RenderStandaloneRequirement",
  "spg-c009-recipe-row",
  "spg-c009-material-snapshot"
]) {
  assert.ok(appHtml.includes(marker), `A C009 alkalmazásmarker hiányzik: ${marker}`);
}
assert.equal((appHtml.match(/c008RenderPublicWikiAction\(/g) || []).length, 1, "A public Wiki renderer user-facing hívása megmaradt.");
assert.ok(appHtml.includes('wikiAction.innerHTML = c008RenderWikiApiAction(model.apiWikiLink)'), "A live detail fejléc nem exact API adatlapot használ.");

for (const reference of ["Info/A fö nézet.png", "Info/A Crafting card.png"]) {
  const bytes = fs.readFileSync(path.join(projectDirectory, reference));
  assert.equal(bytes.toString("ascii", 1, 4), "PNG", `${reference} nem PNG.`);
  assert.ok(bytes.readUInt32BE(16) >= 1200 && bytes.readUInt32BE(20) >= 700, `${reference} felbontása túl kicsi.`);
}

const snapshotMatch = standalone.match(/<script type="application\/json" id="spg-export-snapshot">([\s\S]*?)<\/script>/);
assert.ok(snapshotMatch, "A standalone snapshot JSON hiányzik.");
const snapshot = JSON.parse(snapshotMatch[1]);
assert.equal(snapshot.card.outputName, "JS-300");
assert.equal(snapshot.card.outputSize, "1");
assert.equal(snapshot.card.outputClass, "Military");
assert.equal(snapshot.card.outputGrade, "A");
assert.equal(snapshot.card.craftTimeSeconds, 900);
assert.equal(snapshot.card.requestedQuantity, 2);
assert.equal(snapshot.card.apiWikiLink.url, "https://api.star-citizen.wiki/items/js-300?version=4.9.0-LIVE.12232306");

const expectedMaterials = {
  Stileron: { slot: "Shell", units: 3500, url: "https://api.star-citizen.wiki/commodities/stileron-ore?version=4.9.0-LIVE.12232306" },
  Beryl: { slot: "Voltage Regulator", units: 1400, url: "https://api.star-citizen.wiki/commodities/beryl-raw?version=4.9.0-LIVE.12232306" },
  Savrilium: { slot: "Stator Cores", units: 2400, url: "https://api.star-citizen.wiki/commodities/savrilium-ore?version=4.9.0-LIVE.12232306" }
};
for (const requirement of snapshot.requirements) {
  const expected = expectedMaterials[requirement.materialName];
  assert.ok(expected, `Nem várt JS-300 material: ${requirement.materialName}`);
  assert.equal(requirement.recipeSlotName, expected.slot);
  assert.equal(requirement.perCraftUnits, expected.units);
  assert.equal(requirement.requiredUnits, expected.units * snapshot.card.requestedQuantity);
  assert.equal(requirement.materialDetails.apiWikiLink.url, expected.url);
  assert.equal(requirement.mining.radarSignatureStatus, "VERIFIED");
  assert.ok(requirement.mining.radarSignatureClusterSignatures.length >= 1, `${requirement.materialName} radar chiplista üres.`);
  for (const system of requirement.mining.systems || []) {
    if (system.status !== "AVAILABLE") continue;
    assert.ok((system.methods || []).some((method) => Number(method.rankingTier || method.rankPosition || 1) === 1), `${requirement.materialName}/${system.system} top-1 tier hiányzik.`);
  }
}

for (const marker of ["15:00", "Mining / Farm helyek", "UEX refinery ajánló", "Mining loadout", "API adatlap"]) {
  assert.ok(standalone.includes(marker), `A standalone C009 kártyából hiányzik: ${marker}`);
}
if (standalone.includes("spg-c010-final-card")) {
  for (const marker of ["2 DB", "Max: 3 DB", "Mining", "Refinery", "Radar", "spg-c010-recipe-row", "spg-c010-material"]) {
    assert.ok(standalone.includes(marker), `A C010-cel korrigált C009 projekcióból hiányzik: ${marker}`);
  }
} else {
  for (const marker of ["Recipe Slot", "Megfelelő készlet", "Rendszerenkénti legjobb Mining", "Rendszerenkénti legjobb UEX Refinery", "Radar Signature", "Mining Top-3"]) {
    assert.ok(standalone.includes(marker), `A történeti C009 projekcióból hiányzik: ${marker}`);
  }
}
for (const url of [snapshot.card.apiWikiLink.url, ...Object.values(expectedMaterials).map((record) => record.url)]) {
  assert.ok(standalone.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`), `Hiányzó exact API link: ${url}`);
}
assert.ok((standalone.match(/spg-c0(?:09|10)-radar-chip/g) || []).length >= 4, "A Radar Signature chip megjelenítés hiányos.");
assert.doesNotMatch(standalone, /Megnyitás a Star Citizen Wiki-ben/);
assert.doesNotMatch(standalone, /href="https:\/\/star-citizen\.wiki\//);
assert.doesNotMatch(standalone, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);
assert.doesNotMatch(standalone, /fetch\s*\(/i);

console.log("V003_C009_FINAL_MAIN_CARD_TEST_PASS");
console.log(JSON.stringify({
  itemApiResolver: "resolveItemApiDeepLink",
  materialApiResolver: "resolveMaterialApiDeepLink",
  itemUrl: snapshot.card.apiWikiLink.url,
  materialUrls: Object.fromEntries(snapshot.requirements.map((requirement) => [requirement.materialName, requirement.materialDetails.apiWikiLink.url])),
  recipeSlots: snapshot.requirements.length,
  standaloneBytes: Buffer.byteLength(standalone),
  publicWikiUserActions: 0,
  externalRuntimeResources: 0
}, null, 2));
