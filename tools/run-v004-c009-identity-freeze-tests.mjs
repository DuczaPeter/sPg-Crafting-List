import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const invalidCandidateHead = "c4fef88d5d0a910437b814aa2bd9f90b9375c877";
const candidateHead = "3f94ad079c95234599c56f84347c48a0d11ecc25";
const expectedCandidateSha256 = "e4763a54deca8755ec9604ccc16e2d00be53896040572b41a777d1e89357f8b4";
const expectedCandidateBytes = 1083495;
const applicationPath = "sPg Crafting List.html";
const candidatePath = path.join(projectDirectory, "test-artifacts", "V004-C009", "fresh-release-candidate", "sPg Crafting List V004 RC.html");
const evidencePath = path.join(projectDirectory, "test-artifacts", "V004-C009", "identity-freeze-evidence.json");

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
assert.equal(artifactBytes.byteLength, expectedCandidateBytes, "The replacement candidate byte size changed.");
assert.equal(sha256(artifactBytes), expectedCandidateSha256, "The replacement candidate SHA-256 changed.");
assert.deepEqual(artifactBytes, sourceBytes, "The replacement candidate does not equal its source commit raw bytes.");

const oldSnippet = '      normalized.craftTimeSeconds = Number.isFinite(Number(card.craftTimeSeconds)) ? Number(card.craftTimeSeconds) : null;';
const newSnippet = [
  '      var craftTimeSeconds = card.craftTimeSeconds;',
  '      var craftTimeMissing = craftTimeSeconds === undefined || craftTimeSeconds === null ||',
  '        (typeof craftTimeSeconds === "string" && craftTimeSeconds.trim() === "");',
  '      normalized.craftTimeSeconds = !craftTimeMissing && Number.isFinite(Number(craftTimeSeconds)) ? Number(craftTimeSeconds) : null;'
].join("\n");
const invalidText = invalidBytes.toString("utf8");
const candidateText = sourceBytes.toString("utf8");
assert.equal(count(invalidText, oldSnippet), 1, "The invalid C008 craft-time implementation is missing or duplicated.");
assert.equal(count(candidateText, newSnippet), 1, "The C009 craft-time repair is missing or duplicated.");
assert.equal(candidateText, invalidText.replace(oldSnippet, newSnippet), "C009 contains application changes outside the exact craft-time normalization repair.");

assert.equal(count(candidateText, "V004-dev"), 0);
assert.equal(count(candidateText, '<strong id="applicationStatus">V004</strong>'), 1);
assert.equal(count(candidateText, '<span id="footerRuntime">V004</span>'), 1);
assert.equal(count(candidateText, 'version: "V004"'), 1);
assert.equal(count(candidateText, 'verifiedScVersions: Object.freeze(["4.10.0-LIVE.12519617"])'), 1);
assert.equal(count(candidateText, "var M4_BACKUP_SCHEMA_VERSION = 3;"), 1);

const evidence = {
  cycle: "V004-C009",
  status: "PASS_CRAFT_TIME_ONLY_DATASET_ADAPTER_FREEZE",
  invalidCandidateHead,
  candidateHead,
  invalidCandidateApplicationSha256: sha256(invalidBytes),
  candidateApplicationSha256: sha256(sourceBytes),
  candidateArtifactSha256: sha256(artifactBytes),
  candidateBytes: artifactBytes.byteLength,
  candidateSourceByteIdentical: true,
  applicationDiffFromInvalidC008: "EXACT_CRAFT_TIME_NORMALIZATION_SNIPPET_ONLY",
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
    backupSchemaVersion: 3
  },
  full1606BlueprintAuditRequired: false,
  reason: "C009 is byte-identical to the invalid C008 candidate except for the exact craftTimeSeconds normalization repair."
};
fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log("V004_C009_CRAFT_TIME_DATASET_ADAPTER_FREEZE_PASS");
console.log(JSON.stringify(evidence, null, 2));
