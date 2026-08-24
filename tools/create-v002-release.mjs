import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const sourcePath = path.join(projectDirectory, "sPg Crafting List.html");
const releaseDirectory = path.join(projectDirectory, "releases", "V002");
const releasePath = path.join(releaseDirectory, "sPg Crafting List.html");
const allowedEntries = new Set(["sPg Crafting List.html", "RELEASE.md", "SHA256SUMS.txt"]);

if (fs.existsSync(releaseDirectory)) {
  const unexpectedEntries = fs.readdirSync(releaseDirectory).filter((entry) => !allowedEntries.has(entry));
  assert.deepEqual(unexpectedEntries, [], `Nem vart V002 release elem: ${unexpectedEntries.join(", ")}`);
} else {
  fs.mkdirSync(releaseDirectory, { recursive: true });
}

const sourceHtml = fs.readFileSync(sourcePath, "utf8");
const devMarkers = sourceHtml.match(/V002-dev/g) || [];
assert.equal(devMarkers.length, 3, "A kanonikus V002-dev verziojelolok szama nem 3.");

const releaseHtml = sourceHtml.replaceAll("V002-dev", "V002");
assert.doesNotMatch(releaseHtml, /V002-dev/, "A stabil HTML-ben dev verziojelolo maradt.");
fs.writeFileSync(releasePath, releaseHtml, "utf8");

const releaseBytes = fs.readFileSync(releasePath);
const sha256 = crypto.createHash("sha256").update(releaseBytes).digest("hex");

const releaseNotes = `# sPg Crafting List V002

Statusz: \`V002 STABLE RELEASE – SINGLE-FILE RELEASE GATE PASS\`

## Inditas

A futtathato alkalmazas pontosan egy fajl:

- \`sPg Crafting List.html\`

Masold tetszoleges mappaba, majd Windows 11 alatt nyisd meg aktualis Chrome-ban. Az alkalmazas kozvetlen \`file://\` modban mukodik.

Az alkalmazas futasahoz nem kell az \`Info\` mappa, kulon CSS, kulon JavaScript, a jelen \`RELEASE.md\` vagy a \`SHA256SUMS.txt\`.

## Acceptance

- Teljes M1-M6.1 + C04 regresszio: PASS.
- Valos Chrome \`file://\` manual gate: 13 PASS / 0 FAIL.
- Standalone Crafting Card export: PASS.
- IndexedDB/User Data kompatibilitas: PASS.
- Wiki API es UEX: PASS.
- Kulso stylesheet vagy helyi runtime sidecar: nincs.
- Application console/diagnostic error: 0.

## Integritas

Az egyetlen futtathato HTML SHA-256 erteke a \`SHA256SUMS.txt\` fajlban van. A kiadast a \`V002\` annotalt Git tag azonositja.
`;

fs.writeFileSync(path.join(releaseDirectory, "RELEASE.md"), releaseNotes, "utf8");
fs.writeFileSync(path.join(releaseDirectory, "SHA256SUMS.txt"), `${sha256}  sPg Crafting List.html\n`, "utf8");

console.log("V002_RELEASE_GENERATED");
console.log(JSON.stringify({
  version: "V002",
  releasePath,
  sha256,
  bytes: releaseBytes.length,
  runtimeFilesRequired: ["sPg Crafting List.html"]
}, null, 2));
