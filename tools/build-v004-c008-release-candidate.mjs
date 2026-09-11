import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const sourceHead = "c4fef88d5d0a910437b814aa2bd9f90b9375c877";
const inputHead = "4923aae9948666aeb6acdb793b64f77706419648";
const sourceRelativePath = "sPg Crafting List.html";
const defaultOutput = path.join(projectDirectory, "test-artifacts", "V004-C008", "fresh-release-candidate", "sPg Crafting List V004 RC.html");
const outputArgument = process.argv.find(argument => argument.startsWith("--output="));
const outputPath = outputArgument ? path.resolve(projectDirectory, outputArgument.slice("--output=".length)) : defaultOutput;

const git = arguments_ => {
  const result = spawnSync("git", arguments_, { cwd: projectDirectory, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} sikertelen: ${String(result.stderr || "")}`);
  return result.stdout;
};
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const count = (text, token) => text.split(token).length - 1;

assert.equal(git(["branch", "--show-current"]).toString("utf8").trim(), "candidate/V004", "A C008 builder csak a candidate/V004 ágon futhat.");
assert.equal(git(["rev-parse", `${sourceHead}^`]).toString("utf8").trim(), inputHead, "A candidate identity commit nem a C007.1 exact checkpoint közvetlen gyermeke.");
assert.doesNotThrow(() => git(["merge-base", "--is-ancestor", sourceHead, "HEAD"]), "A candidate identity commit nem őse a jelenlegi HEAD-nek.");

const sourceBytes = git(["show", `${sourceHead}:${sourceRelativePath}`]);
const headBytes = git(["show", `HEAD:${sourceRelativePath}`]);
assert.deepEqual(headBytes, sourceBytes, "Az alkalmazás Git-bytejai megváltoztak a candidate identity commit után.");
const applicationDiff = spawnSync("git", ["diff", "--quiet", "--", sourceRelativePath], { cwd: projectDirectory });
assert.equal(applicationDiff.status, 0, "A working application eltér a committed candidate-től.");

const sourceHtml = sourceBytes.toString("utf8");
assert.equal(count(sourceHtml, "V004-dev"), 0, "V004-dev runtime identity maradt a candidate-ben.");
assert.equal(count(sourceHtml, '<strong id="applicationStatus">V004</strong>'), 1);
assert.equal(count(sourceHtml, '<span id="footerRuntime">V004</span>'), 1);
assert.equal(count(sourceHtml, 'version: "V004"'), 1);
assert.equal(count(sourceHtml, 'verifiedScVersions: Object.freeze(["4.10.0-LIVE.12519617"])'), 1, "Az aktív Star Citizen build identity eltér.");
assert.equal(count(sourceHtml, "var M4_BACKUP_SCHEMA_VERSION = 3;"), 1, "A backup schema nem 3.");

const documentMarkup = sourceHtml.slice(0, sourceHtml.indexOf("<script>"));
assert.match(documentMarkup, /<style\s+id="spgApplicationStyles"\s+data-source="embedded">[\s\S]+<\/style>/);
assert.doesNotMatch(documentMarkup, /<link[^>]+rel=["']stylesheet["']/i);
assert.doesNotMatch(documentMarkup, /<script[^>]+src=/i);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sourceBytes);
const writtenBytes = fs.readFileSync(outputPath);
assert.deepEqual(writtenBytes, sourceBytes, "A C008 raw-byte copy eltér a committed candidate applicationtől.");

const result = {
  cycle: "V004-C008",
  status: "BUILT_PENDING_GATES",
  sourceHead,
  inputHead,
  source: sourceRelativePath,
  output: path.relative(projectDirectory, outputPath).replaceAll("\\", "/"),
  bytes: sourceBytes.length,
  sha256: sha256(sourceBytes),
  generatedAt: new Date().toISOString(),
  buildModel: "GIT_COMMIT_RAW_BYTE_COPY",
  sourceByteIdentical: true,
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
console.log("V004_C008_FRESH_CANDIDATE_BUILD_PASS");
console.log(JSON.stringify(result, null, 2));
