import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const sourcePath = path.join(projectDirectory, "sPg Crafting List.html");
const releaseDirectory = path.join(projectDirectory, "releases", "V002");
const releasePath = path.join(releaseDirectory, "sPg Crafting List.html");
const evidencePath = path.join(projectDirectory, "test-artifacts", "V002-C001", "browser-manual-summary.json");

const entries = fs.readdirSync(releaseDirectory, { withFileTypes: true });
assert.ok(entries.every((entry) => entry.isFile()), "A V002 release mappaban alkonyvtar vagy nem fajl elem van.");
assert.deepEqual(
  entries.map((entry) => entry.name).sort(),
  ["RELEASE.md", "SHA256SUMS.txt", "sPg Crafting List.html"].sort(),
  "A V002 release mappa nem a megengedett HTML + repository-dokumentacio keszletet tartalmazza."
);
assert.equal(entries.filter((entry) => entry.name.toLowerCase().endsWith(".html")).length, 1, "A V002 release-ben nem pontosan egy HTML van.");

const sourceHtml = fs.readFileSync(sourcePath, "utf8");
const releaseHtml = fs.readFileSync(releasePath, "utf8");
assert.equal((sourceHtml.match(/V002-dev/g) || []).length, 3, "A forras V002-dev jeloloinek szama megvaltozott.");
assert.equal(releaseHtml, sourceHtml.replaceAll("V002-dev", "V002"), "A stabil HTML nem kizarolag verziojelolesben ter el a tesztelt forrastol.");
assert.doesNotMatch(releaseHtml, /V002-dev/, "A stabil HTML dev jelolest tartalmaz.");
assert.equal((releaseHtml.match(/\bV002\b/g) || []).length, 3, "A stabil V002 runtime-jelolok szama nem 3.");

assertSingleFileRuntimeMarkup(releaseHtml);
assert.doesNotMatch(releaseHtml, /<link[^>]+href=["'](?!data:)/i, "Nem data: link-fugges maradt a stabil HTML-ben.");
assert.doesNotMatch(releaseHtml, /<(?:iframe|embed)[^>]+src=["'](?!data:)/i, "Beagyazott runtime src-fugges maradt a stabil HTML-ben.");
assert.doesNotMatch(releaseHtml, /<object[^>]+data=["'](?!data:)/i, "Object runtime-fugges maradt a stabil HTML-ben.");

const css = extractEmbeddedApplicationCss(releaseHtml);
assert.ok(Buffer.byteLength(css) > 70000, "A stabil embedded CSS gyanusan rovid.");
assert.doesNotMatch(css, /@import[^;]+https?:/i, "A stabil embedded CSS tavoli importot tartalmaz.");
for (const match of css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
  assert.ok(match[2].startsWith("data:"), `Nem embedded CSS url() fugges: ${match[2]}`);
}

for (const requiredMarker of [
  'dbName: "spg-crafting-list"',
  "dbVersion: 4",
  'apiBase: "https://api.star-citizen.wiki/api"',
  'uexRefineryEndpoint: "https://api.uexcorp.uk/2.0/refineries_yields"',
  "function buildStandaloneExport",
  "function runTechnicalProbe"
]) {
  assert.ok(releaseHtml.includes(requiredMarker), `Hianyzo stabil runtime marker: ${requiredMarker}`);
}

const releaseBytes = fs.readFileSync(releasePath);
const sha256 = crypto.createHash("sha256").update(releaseBytes).digest("hex");
const manifest = fs.readFileSync(path.join(releaseDirectory, "SHA256SUMS.txt"), "utf8").trim();
assert.equal(manifest, `${sha256}  sPg Crafting List.html`, "A V002 SHA256SUMS.txt nem egyezik a release HTML-lel.");

const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
assert.equal(evidence.localhost.consoleWarningCount, 0, "A localhost Chrome warning count nem 0.");
assert.equal(evidence.localhost.consoleErrorCount, 0, "A localhost Chrome error count nem 0.");
assert.equal(evidence.fileProtocol.status, "PASS", "A valos Chrome file:// gate nem PASS.");
assert.equal(evidence.fileProtocol.technicalBaseline.passed, 13, "A file:// technical PASS count nem 13.");
assert.equal(evidence.fileProtocol.technicalBaseline.failed, 0, "A file:// technical FAIL count nem 0.");
assert.equal(evidence.fileProtocol.standaloneHtmlExport, "PASS", "A file:// standalone export nem PASS.");
assert.equal(evidence.fileProtocol.externalStylesheet, false, "A file:// alkalmazas kulso stylesheetet jelzett.");
assert.equal(evidence.fileProtocol.externalResource, false, "A file:// alkalmazas kulso runtime-eroforrast jelzett.");
assert.equal(evidence.fileProtocol.diagnosticErrorCount, 0, "A file:// diagnosztikai hibaszam nem 0.");

console.log("V002_SINGLE_FILE_RELEASE_GATE_PASS");
console.log(JSON.stringify({
  version: "V002",
  releaseHtml: "releases/V002/sPg Crafting List.html",
  sha256,
  bytes: releaseBytes.length,
  runtimeFilesRequired: ["sPg Crafting List.html"],
  localSidecarFilesRequired: 0,
  versionOnlyTransform: true,
  indexedDbUserDataCompatibility: true,
  standaloneExport: "PASS",
  manualFileGate: "PASS",
  consoleApplicationWarningError: 0
}, null, 2));
