import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const sourceHead = "a6a5d35592d9777c6b740eeb7ec44c4c58b27443";
const invalidCandidateSourceHead = "3f94ad079c95234599c56f84347c48a0d11ecc25";
const invalidCandidatePath = path.join(projectDirectory, "test-artifacts", "V004-C009", "fresh-release-candidate", "sPg Crafting List V004 RC.html");
const invalidCandidateSha256 = "e4763a54deca8755ec9604ccc16e2d00be53896040572b41a777d1e89357f8b4";
const invalidCandidateBytes = 1083495;
const sourceRelativePath = "sPg Crafting List.html";
const outputPath = path.join(projectDirectory, "test-artifacts", "V004-C010", "fresh-release-candidate", "sPg Crafting List V004 RC.html");

function git(arguments_) {
  const result = spawnSync("git", arguments_, { cwd: projectDirectory, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} failed: ${String(result.stderr || "")}`);
  return result.stdout;
}

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const count = (text, token) => text.split(token).length - 1;

assert.equal(git(["branch", "--show-current"]).toString("utf8").trim(), "candidate/V004", "The C010 builder requires candidate/V004.");
assert.equal(git(["rev-parse", "HEAD"]).toString("utf8").trim(), sourceHead, "C010 candidate creation requires the exact application repair HEAD.");

const sourceBytes = git(["show", `${sourceHead}:${sourceRelativePath}`]);
const invalidSourceBytes = git(["show", `${invalidCandidateSourceHead}:${sourceRelativePath}`]);
const headBytes = git(["show", `HEAD:${sourceRelativePath}`]);
assert.deepEqual(headBytes, sourceBytes, "HEAD application bytes differ from the C010 source commit.");
const applicationDiff = spawnSync("git", ["diff", "--quiet", "--", sourceRelativePath], { cwd: projectDirectory });
assert.equal(applicationDiff.status, 0, "The working application differs from committed C010 source bytes.");

const invalidArtifactBytes = fs.readFileSync(invalidCandidatePath);
assert.equal(invalidArtifactBytes.byteLength, invalidCandidateBytes, "The preserved invalid C009 candidate size changed.");
assert.equal(sha256(invalidArtifactBytes), invalidCandidateSha256, "The preserved invalid C009 candidate SHA changed.");
assert.deepEqual(invalidArtifactBytes, invalidSourceBytes, "The preserved invalid C009 candidate is not its source commit raw bytes.");

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

const invalidSourceText = invalidSourceBytes.toString("utf8");
const sourceText = sourceBytes.toString("utf8");
let expectedSourceText = invalidSourceText;
for (const [before, after] of replacements) {
  assert.equal(count(expectedSourceText, before), 1, `C009 source anchor missing or duplicated: ${before.slice(0, 80)}`);
  expectedSourceText = expectedSourceText.replace(before, after);
}
assert.equal(sourceText, expectedSourceText, "C010 contains application changes outside the approved History snapshot canonicalization repair.");

assert.equal(count(sourceText, "V004-dev"), 0, "V004-dev runtime identity remains in the replacement candidate.");
assert.equal(count(sourceText, '<strong id="applicationStatus">V004</strong>'), 1);
assert.equal(count(sourceText, '<span id="footerRuntime">V004</span>'), 1);
assert.equal(count(sourceText, 'version: "V004"'), 1);
assert.equal(count(sourceText, 'verifiedScVersions: Object.freeze(["4.10.0-LIVE.12519617"])'), 1);
assert.equal(count(sourceText, "var M4_BACKUP_SCHEMA_VERSION = 3;"), 1);

const documentMarkup = sourceText.slice(0, sourceText.indexOf("<script>"));
assert.match(documentMarkup, /<style\s+id="spgApplicationStyles"\s+data-source="embedded">[\s\S]+<\/style>/);
assert.doesNotMatch(documentMarkup, /<link[^>]+rel=["']stylesheet["']/i);
assert.doesNotMatch(documentMarkup, /<script[^>]+src=/i);
assert.equal(fs.existsSync(outputPath), false, "The C010 replacement candidate already exists and may not be overwritten.");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sourceBytes);
const writtenBytes = fs.readFileSync(outputPath);
assert.deepEqual(writtenBytes, sourceBytes, "The C010 raw-byte artifact differs from its source commit.");

const result = {
  cycle: "V004-C010",
  status: "BUILT_PENDING_GATES",
  sourceHead,
  invalidCandidateSourceHead,
  source: sourceRelativePath,
  output: path.relative(projectDirectory, outputPath).replaceAll("\\", "/"),
  bytes: sourceBytes.length,
  sha256: sha256(sourceBytes),
  generatedAt: new Date().toISOString(),
  buildModel: "GIT_COMMIT_RAW_BYTE_COPY",
  sourceByteIdentical: true,
  applicationDiffFromInvalidC009: {
    classification: "EXACT_HISTORY_SNAPSHOT_CANONICALIZATION_ONLY",
    insertions: 8,
    deletions: 4,
    runtimeIdentityReplacementRequired: false
  },
  invalidCandidate: {
    path: path.relative(projectDirectory, invalidCandidatePath).replaceAll("\\", "/"),
    bytes: invalidCandidateBytes,
    sha256: invalidCandidateSha256,
    preserved: true,
    releaseTarget: false
  },
  runtimeIdentity: "V004",
  v004DevRuntimeIdentityOccurrences: 0,
  gameDataIdentity: "4.10.0-LIVE.12519617",
  backupSchemaVersion: 3,
  applicationRuntimeFileCount: 1,
  localRuntimeSidecars: 0,
  embeddedCss: true,
  embeddedJavaScript: true,
  stableArtifactCreated: false,
  v004TagCreated: false,
  manualCandidateFileGate: "REQUIRED"
};

fs.writeFileSync(path.join(path.dirname(outputPath), "candidate-manifest.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log("V004_C010_REPLACEMENT_CANDIDATE_BUILD_PASS");
console.log(JSON.stringify(result, null, 2));
