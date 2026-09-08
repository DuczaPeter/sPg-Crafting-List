import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const sourceHead = "37f8852b4ddfd5b628d952a445f97ee5a5179a11";
const sourceRelativePath = "sPg Crafting List.html";
const defaultOutput = path.join(projectDirectory, "test-artifacts", "V003-C015", "fresh-release-candidate", "sPg Crafting List V003 RC.html");
const outputArgument = process.argv.find((argument) => argument.startsWith("--output="));
const outputPath = outputArgument ? path.resolve(projectDirectory, outputArgument.slice("--output=".length)) : defaultOutput;

const git = (arguments_) => {
  const result = spawnSync("git", arguments_, { cwd: projectDirectory, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} sikertelen: ${String(result.stderr || "")}`);
  return result.stdout;
};
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const count = (text, token) => text.split(token).length - 1;

assert.equal(git(["branch", "--show-current"]).toString("utf8").trim(), "develop/V003", "A C015 builder csak a develop/V003 agon futhat.");
assert.equal(git(["rev-parse", "HEAD"]).toString("utf8").trim(), sourceHead, "A C015 candidate kizarolag az exact C014 checkpointbol keszulhet.");

const sourceBytes = git(["show", `${sourceHead}:${sourceRelativePath}`]);
const workingBytes = fs.readFileSync(path.join(projectDirectory, sourceRelativePath));
assert.deepEqual(workingBytes, sourceBytes, "A working application nem byte-azonos a C014 source HEAD-del.");
const sourceHtml = sourceBytes.toString("utf8");
assert.equal(count(sourceHtml, "V003-dev"), 0, "V003-dev runtime identity maradt a C014 source-ban.");
assert.equal(count(sourceHtml, '<strong id="applicationStatus">V003</strong>'), 1);
assert.equal(count(sourceHtml, '<span id="footerRuntime">V003</span>'), 1);
assert.equal(count(sourceHtml, 'version: "V003"'), 1);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sourceBytes);
const writtenBytes = fs.readFileSync(outputPath);
assert.deepEqual(writtenBytes, sourceBytes, "A C015 raw-byte copy elter a source applicationtol.");

const result = {
  cycle: "V003-C015",
  status: "BUILT_PENDING_GATES",
  sourceHead,
  source: sourceRelativePath,
  output: path.relative(projectDirectory, outputPath).replaceAll("\\", "/"),
  bytes: sourceBytes.length,
  sha256: sha256(sourceBytes),
  generatedAt: new Date().toISOString(),
  buildModel: "GIT_COMMIT_RAW_BYTE_COPY",
  sourceByteIdentical: true,
  runtimeIdentity: "V003",
  v003DevRuntimeIdentityOccurrences: 0,
  applicationCodeChanged: false,
  localRuntimeSidecars: 0,
  stableRelease: false,
  manualCandidateFileGate: "NOT_RUN"
};
if (!outputArgument) {
  fs.writeFileSync(path.join(path.dirname(outputPath), "candidate-manifest.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
}
console.log("V003_C015_FRESH_CANDIDATE_BUILD_PASS");
console.log(JSON.stringify(result, null, 2));
