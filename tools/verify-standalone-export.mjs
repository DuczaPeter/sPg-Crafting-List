import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2];
assert.ok(inputPath, "Használat: node tools/verify-standalone-export.mjs <export.html>");
const resolvedPath = path.resolve(inputPath);
const html = fs.readFileSync(resolvedPath, "utf8");
assert.match(html, /data-spg-standalone-export="true"/);
assert.match(html, /<style>[\s\S]+<\/style>/i);
assert.doesNotMatch(html, /<link[^>]+stylesheet/i);
assert.doesNotMatch(html, /@import[^;]+https?:/i);
assert.doesNotMatch(html, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);
assert.doesNotMatch(html, /\bfetch\s*\(/i);
const payloadMatch = html.match(/<script type="application\/json" id="spg-export-snapshot">([\s\S]*?)<\/script>/);
assert.ok(payloadMatch, "Az export JSON snapshotja hiányzik.");
const snapshot = JSON.parse(payloadMatch[1]);
assert.equal(snapshot.kind, "SPG_STANDALONE_CRAFTING_FARM_CARD");
assert.ok(snapshot.requirements.length > 0);
assert.ok(snapshot.requirements.every((requirement) => requirement.recipeSlotId && requirement.materialName));

console.log("STANDALONE_EXPORT_FILE_PASS");
console.log(JSON.stringify({
  path: resolvedPath,
  bytes: Buffer.byteLength(html),
  output: snapshot.card.outputName,
  scVersion: snapshot.scDataVersion,
  requirements: snapshot.requirements.length,
  locationCount: snapshot.summary.locationCount,
  selectedLoadoutCount: snapshot.summary.selectedLoadoutCount,
  refinerySystemCount: snapshot.summary.refinerySystemCount,
  missingData: snapshot.summary.missingData,
  externalNetworkResources: false
}, null, 2));
