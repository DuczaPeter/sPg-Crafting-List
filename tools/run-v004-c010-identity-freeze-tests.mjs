import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const invalidCandidateHead = "3f94ad079c95234599c56f84347c48a0d11ecc25";
const candidateHead = "a6a5d35592d9777c6b740eeb7ec44c4c58b27443";
const expectedCandidateSha256 = "16f186cc7a0ec3d614dbdd690c1ac448261713ff4fd6c32bdfa8876b68641af5";
const expectedCandidateBytes = 1083886;
const invalidCandidateSha256 = "e4763a54deca8755ec9604ccc16e2d00be53896040572b41a777d1e89357f8b4";
const invalidCandidateBytes = 1083495;
const applicationPath = "sPg Crafting List.html";
const candidatePath = path.join(projectDirectory, "test-artifacts", "V004-C010", "fresh-release-candidate", "sPg Crafting List V004 RC.html");
const invalidCandidatePath = path.join(projectDirectory, "test-artifacts", "V004-C009", "fresh-release-candidate", "sPg Crafting List V004 RC.html");
const evidencePath = path.join(projectDirectory, "test-artifacts", "V004-C010", "identity-freeze-evidence.json");

const git = arguments_ => {
  const result = spawnSync("git", arguments_, { cwd: projectDirectory, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} failed: ${String(result.stderr || "")}`);
  return result.stdout;
};
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const count = (text, token) => text.split(token).length - 1;

const invalidBytes = git(["show", `${invalidCandidateHead}:${applicationPath}`]);
const sourceBytes = git(["show", `${candidateHead}:${applicationPath}`]);
const artifactBytes = fs.readFileSync(candidatePath);
const invalidArtifactBytes = fs.readFileSync(invalidCandidatePath);
assert.equal(artifactBytes.byteLength, expectedCandidateBytes, "The C010 replacement candidate byte size changed.");
assert.equal(sha256(artifactBytes), expectedCandidateSha256, "The C010 replacement candidate SHA-256 changed.");
assert.deepEqual(artifactBytes, sourceBytes, "The C010 replacement candidate does not equal its source commit raw bytes.");
assert.equal(invalidArtifactBytes.byteLength, invalidCandidateBytes, "The invalid C009 candidate byte size changed.");
assert.equal(sha256(invalidArtifactBytes), invalidCandidateSha256, "The invalid C009 candidate SHA-256 changed.");
assert.deepEqual(invalidArtifactBytes, invalidBytes, "The invalid C009 candidate no longer equals its source commit raw bytes.");

const replacements = [
  [
    "    function v004NormalizeImportedCraftHistory(events) {\n      return (Array.isArray(events) ? events : []).map(normalizeStoredCraftHistoryEvent);\n    }\n\n    function v004ReservationError(code, message) {",
    "    function v004NormalizeImportedCraftHistory(events) {\n      return (Array.isArray(events) ? events : []).map(normalizeStoredCraftHistoryEvent);\n    }\n\n    function v004CanonicalizeCraftHistoryCardSnapshot(snapshot, fallbackOrder) {\n      return normalizeStoredCraftingCard(m4Clone(snapshot || {}), fallbackOrder);\n    }\n\n    function v004ReservationError(code, message) {"
  ],
  ["        preCraftCardSnapshot: m4Clone(currentCard),", "        preCraftCardSnapshot: v004CanonicalizeCraftHistoryCardSnapshot(currentCard, currentCard.order),"],
  ["      var expected = m4Clone(event.preCraftCardSnapshot);", "      var expected = v004CanonicalizeCraftHistoryCardSnapshot(event.preCraftCardSnapshot, event.originalOrder);"],
  ["          v004CardAllocationSemantic(currentCard, currentCard.order),", "          v004CardAllocationSemantic(v004CanonicalizeCraftHistoryCardSnapshot(currentCard, currentCard.order), currentCard.order),"],
  ["        restoredCard = Object.assign({}, m4Clone(event.preCraftCardSnapshot), {", "        restoredCard = Object.assign({}, v004CanonicalizeCraftHistoryCardSnapshot(event.preCraftCardSnapshot, event.originalOrder), {"]
];

const invalidText = invalidBytes.toString("utf8");
const candidateText = sourceBytes.toString("utf8");
let expectedText = invalidText;
for (const [before, after] of replacements) {
  assert.equal(count(expectedText, before), 1, `C009 application anchor missing or duplicated: ${before.slice(0, 80)}`);
  expectedText = expectedText.replace(before, after);
}
assert.equal(candidateText, expectedText, "C010 contains application changes outside the exact History snapshot canonicalization repair.");

assert.equal(count(candidateText, "V004-dev"), 0);
assert.equal(count(candidateText, '<strong id="applicationStatus">V004</strong>'), 1);
assert.equal(count(candidateText, '<span id="footerRuntime">V004</span>'), 1);
assert.equal(count(candidateText, 'version: "V004"'), 1);
assert.equal(count(candidateText, 'verifiedScVersions: Object.freeze(["4.10.0-LIVE.12519617"])'), 1);
assert.equal(count(candidateText, "var M4_BACKUP_SCHEMA_VERSION = 3;"), 1);

const evidence = {
  cycle: "V004-C010",
  status: "PASS_HISTORY_SNAPSHOT_ONLY_DATASET_ADAPTER_FREEZE",
  invalidCandidateHead,
  candidateHead,
  invalidCandidateApplicationSha256: sha256(invalidBytes),
  invalidCandidateArtifactSha256: sha256(invalidArtifactBytes),
  candidateApplicationSha256: sha256(sourceBytes),
  candidateArtifactSha256: sha256(artifactBytes),
  candidateBytes: artifactBytes.byteLength,
  candidateSourceByteIdentical: true,
  applicationDiffFromInvalidC009: "EXACT_HISTORY_SNAPSHOT_CANONICALIZATION_ONLY",
  applicationDiffInsertions: 8,
  applicationDiffDeletions: 4,
  v004DevRuntimeIdentityOccurrences: 0,
  runtimeIdentity: "V004",
  allOtherApplicationBytesUnchanged: true,
  gameDataIdentity: "4.10.0-LIVE.12519617",
  unchangedContracts: {
    wikiDataset: true,
    wikiAdapter: true,
    recipeParsing: true,
    exactQuantityNormalization: true,
    scuNormalization: true,
    canonicalIdentityMapping: true,
    uexAdapter: true,
    indexedDbSchema: true,
    backupSchemaVersion: 3,
    craftTimeNormalization: true
  },
  full1606BlueprintAuditRequired: false,
  reason: "C010 is byte-identical to the invalid C009 candidate except for the exact History snapshot canonicalization repair."
};

fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log("V004_C010_HISTORY_SNAPSHOT_DATASET_ADAPTER_FREEZE_PASS");
console.log(JSON.stringify(evidence, null, 2));
