import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const sourceHead = "3f94ad079c95234599c56f84347c48a0d11ecc25";
const invalidCandidateSourceHead = "c4fef88d5d0a910437b814aa2bd9f90b9375c877";
const invalidCandidatePath = path.join(projectDirectory, "test-artifacts", "V004-C008", "fresh-release-candidate", "sPg Crafting List V004 RC.html");
const invalidCandidateSha256 = "7ac2c27bc7a35f719f4a4526e6839f8460a51e2ab6d881e1a95c3ed16f58b050";
const invalidCandidateBytes = 1083258;
const sourceRelativePath = "sPg Crafting List.html";
const defaultOutput = path.join(projectDirectory, "test-artifacts", "V004-C009", "fresh-release-candidate", "sPg Crafting List V004 RC.html");
const outputArgument = process.argv.find(argument => argument.startsWith("--output="));
const outputPath = outputArgument ? path.resolve(projectDirectory, outputArgument.slice("--output=".length)) : defaultOutput;

function git(arguments_) {
  const result = spawnSync("git", arguments_, { cwd: projectDirectory, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} failed: ${String(result.stderr || "")}`);
  return result.stdout;
}
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const count = (text, token) => text.split(token).length - 1;

assert.equal(git(["branch", "--show-current"]).toString("utf8").trim(), "candidate/V004", "The C009 builder requires candidate/V004.");
assert.doesNotThrow(() => git(["merge-base", "--is-ancestor", sourceHead, "HEAD"]), "The C009 application repair commit is not an ancestor of HEAD.");

const sourceBytes = git(["show", `${sourceHead}:${sourceRelativePath}`]);
const invalidSourceBytes = git(["show", `${invalidCandidateSourceHead}:${sourceRelativePath}`]);
const headBytes = git(["show", `HEAD:${sourceRelativePath}`]);
assert.deepEqual(headBytes, sourceBytes, "HEAD application bytes differ from the C009 source commit.");
const applicationDiff = spawnSync("git", ["diff", "--quiet", "--", sourceRelativePath], { cwd: projectDirectory });
assert.equal(applicationDiff.status, 0, "The working application differs from committed C009 source bytes.");

const invalidArtifactBytes = fs.readFileSync(invalidCandidatePath);
assert.equal(invalidArtifactBytes.byteLength, invalidCandidateBytes, "The preserved invalid C008 candidate size changed.");
assert.equal(sha256(invalidArtifactBytes), invalidCandidateSha256, "The preserved invalid C008 candidate SHA changed.");
assert.deepEqual(invalidArtifactBytes, invalidSourceBytes, "The preserved invalid C008 candidate is not its source commit raw bytes.");

const oldSnippet = '      normalized.craftTimeSeconds = Number.isFinite(Number(card.craftTimeSeconds)) ? Number(card.craftTimeSeconds) : null;';
const newSnippet = [
  '      var craftTimeSeconds = card.craftTimeSeconds;',
  '      var craftTimeMissing = craftTimeSeconds === undefined || craftTimeSeconds === null ||',
  '        (typeof craftTimeSeconds === "string" && craftTimeSeconds.trim() === "");',
  '      normalized.craftTimeSeconds = !craftTimeMissing && Number.isFinite(Number(craftTimeSeconds)) ? Number(craftTimeSeconds) : null;'
].join("\n");
const invalidSourceText = invalidSourceBytes.toString("utf8");
const sourceText = sourceBytes.toString("utf8");
assert.equal(count(invalidSourceText, oldSnippet), 1, "The invalid source craft-time snippet is missing or duplicated.");
assert.equal(count(sourceText, newSnippet), 1, "The repaired craft-time snippet is missing or duplicated.");
assert.equal(sourceText, invalidSourceText.replace(oldSnippet, newSnippet), "C009 contains application changes outside the exact craft-time repair.");

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

if (!outputArgument) {
  assert.equal(fs.existsSync(outputPath), false, "The C009 replacement candidate already exists and may not be overwritten.");
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sourceBytes);
const writtenBytes = fs.readFileSync(outputPath);
assert.deepEqual(writtenBytes, sourceBytes, "The C009 raw-byte artifact differs from its source commit.");

const result = {
  cycle: "V004-C009",
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
  applicationDiffFromInvalidC008: "EXACT_CRAFT_TIME_NORMALIZATION_SNIPPET_ONLY",
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
if (!outputArgument) {
  fs.writeFileSync(path.join(path.dirname(outputPath), "candidate-manifest.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
}
console.log("V004_C009_REPLACEMENT_CANDIDATE_BUILD_PASS");
console.log(JSON.stringify(result, null, 2));
