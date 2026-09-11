import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const inputHead = "4923aae9948666aeb6acdb793b64f77706419648";
const candidateHead = "c4fef88d5d0a910437b814aa2bd9f90b9375c877";
const applicationPath = "sPg Crafting List.html";
const evidencePath = path.join(projectDirectory, "test-artifacts", "V004-C008", "identity-freeze-evidence.json");

const git = arguments_ => {
  const result = spawnSync("git", arguments_, { cwd: projectDirectory, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} sikertelen: ${String(result.stderr || "")}`);
  return result.stdout;
};
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const count = (text, token) => text.split(token).length - 1;

const inputBytes = git(["show", `${inputHead}:${applicationPath}`]);
const candidateBytes = git(["show", `${candidateHead}:${applicationPath}`]);
const inputText = inputBytes.toString("utf8");
assert.equal(count(inputText, "V004-dev"), 3, "A C007.1 input Git-byteokban nem három V004-dev identity van.");
const expectedCandidateBytes = Buffer.from(inputText.replaceAll("V004-dev", "V004"), "utf8");
assert.deepEqual(candidateBytes, expectedCandidateBytes, "A candidate az identity cserén kívül más application byte-ot is módosít.");

const candidateText = candidateBytes.toString("utf8");
assert.equal(count(candidateText, "V004-dev"), 0);
assert.equal(count(candidateText, '<strong id="applicationStatus">V004</strong>'), 1);
assert.equal(count(candidateText, '<span id="footerRuntime">V004</span>'), 1);
assert.equal(count(candidateText, 'version: "V004"'), 1);
assert.equal(count(candidateText, 'verifiedScVersions: Object.freeze(["4.10.0-LIVE.12519617"])'), 1);
assert.equal(count(candidateText, "var M4_BACKUP_SCHEMA_VERSION = 3;"), 1);

const evidence = {
  cycle: "V004-C008",
  status: "PASS_IDENTITY_ONLY_DATASET_ADAPTER_FREEZE",
  inputHead,
  candidateHead,
  inputGitApplicationSha256: sha256(inputBytes),
  candidateApplicationSha256: sha256(candidateBytes),
  identityReplacementCount: 3,
  v004DevRuntimeIdentityOccurrences: 0,
  runtimeIdentity: "V004",
  allOtherApplicationBytesUnchanged: true,
  gameDataIdentity: "4.10.0-LIVE.12519617",
  unchangedContracts: {
    wikiAdapter: true,
    recipeParsing: true,
    scuNormalization: true,
    canonicalIdentityMapping: true,
    uexAdapter: true,
    indexedDbSchema: true,
    backupSchemaVersion: 3
  },
  full1606BlueprintAuditRequired: false,
  reason: "Candidate application equals the C007.1 Git bytes after exactly three V004-dev to V004 replacements."
};
fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log("V004_C008_IDENTITY_DATASET_ADAPTER_FREEZE_PASS");
console.log(JSON.stringify(evidence, null, 2));
