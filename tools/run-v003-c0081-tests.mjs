import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const htmlPath = path.join(projectDirectory, "sPg Crafting List.html");
const standaloneArgument = process.argv.find((argument) => argument.startsWith("--standalone="));
const standalonePath = standaloneArgument
  ? path.resolve(projectDirectory, standaloneArgument.slice("--standalone=".length))
  : path.join(projectDirectory, "test-artifacts", "V003-C008.1", "standalone-js-300-detail-view.html");

const appHtml = fs.readFileSync(htmlPath, "utf8");
const standalone = fs.readFileSync(standalonePath, "utf8");

for (const marker of [
  "function resolvePublicWikiDeepLink",
  "function resolveWikiApiDeepLink",
  "function c008RenderPublicWikiAction",
  "function c008RenderWikiApiAction",
  "NO_PROVEN_PUBLIC_WIKI_URL",
  "SOURCE_EXACT_PUBLIC_WIKI_URL",
  "MEDIAWIKI_EXACT_TITLE",
  "API adatlap megnyitása"
]) {
  assert.ok(appHtml.includes(marker), `A C008.1 alkalmazásmarker hiányzik: ${marker}`);
}
assert.ok(!appHtml.includes("function resolveWikiDeepLink"), "Az összemosott régi Wiki resolver megmaradt.");

const snapshotMatch = standalone.match(/<script type="application\/json" id="spg-export-snapshot">([\s\S]*?)<\/script>/);
assert.ok(snapshotMatch, "A standalone snapshot JSON hiányzik.");
const snapshot = JSON.parse(snapshotMatch[1]);

function assertPublicResolution(link, expected) {
  for (const field of ["targetUuid", "canonicalName", "publicWikiUrl", "resolutionStatus", "resolutionOrigin", "verifiedAt"]) {
    assert.ok(Object.prototype.hasOwnProperty.call(link, field), `A public Wiki snapshotból hiányzik: ${field}`);
  }
  assert.equal(link.resolutionStatus, expected.status);
  assert.equal(link.publicWikiUrl, expected.url);
}

assertPublicResolution(snapshot.card.publicWikiLink, { status: "VERIFIED", url: "https://star-citizen.wiki/JS-300" });
assert.equal(snapshot.card.apiWikiLink.url, "https://api.star-citizen.wiki/items/js-300?version=4.9.0-LIVE.12232306");

const byName = new Map(snapshot.requirements.map((requirement) => [requirement.materialName, requirement]));
assertPublicResolution(byName.get("Beryl").materialDetails.publicWikiLink, { status: "VERIFIED", url: "https://star-citizen.wiki/Beryl" });
assertPublicResolution(byName.get("Stileron").materialDetails.publicWikiLink, { status: "NO_PROVEN_PUBLIC_WIKI_URL", url: null });
assertPublicResolution(byName.get("Savrilium").materialDetails.publicWikiLink, { status: "NO_PROVEN_PUBLIC_WIKI_URL", url: null });
for (const requirement of snapshot.requirements) {
  assert.match(requirement.materialDetails.apiWikiLink.url, /^https:\/\/api\.star-citizen\.wiki\//);
}

assert.match(standalone, /href="https:\/\/star-citizen\.wiki\/JS-300"[^>]*>Megnyitás a Star Citizen Wiki-ben<\/a>/);
assert.match(standalone, /href="https:\/\/star-citizen\.wiki\/Beryl"[^>]*>Megnyitás a Star Citizen Wiki-ben<\/a>/);
assert.match(standalone, /href="https:\/\/api\.star-citizen\.wiki\/[^"]+"[^>]*>API adatlap megnyitása<\/a>/);
assert.doesNotMatch(standalone, /href="https:\/\/api\.star-citizen\.wiki[^"]*"[^>]*>Megnyitás a Star Citizen Wiki-ben<\/a>/);
assert.doesNotMatch(standalone, /href="https:\/\/star-citizen\.wiki\/(?:Stileron|Savrilium)[^"]*"/);
assert.doesNotMatch(standalone, /fetch\s*\(/i);
assert.doesNotMatch(standalone, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);

console.log("V003_C0081_PUBLIC_WIKI_TEST_PASS");
console.log(JSON.stringify({
  publicWikiResolver: "resolvePublicWikiDeepLink",
  apiWikiResolver: "resolveWikiApiDeepLink",
  js300PublicWikiUrl: snapshot.card.publicWikiLink.publicWikiUrl,
  berylPublicWikiUrl: byName.get("Beryl").materialDetails.publicWikiLink.publicWikiUrl,
  stileronStatus: byName.get("Stileron").materialDetails.publicWikiLink.resolutionStatus,
  savriliumStatus: byName.get("Savrilium").materialDetails.publicWikiLink.resolutionStatus,
  standaloneRuntimeFetch: 0,
  standaloneExternalRuntimeResources: 0
}, null, 2));
