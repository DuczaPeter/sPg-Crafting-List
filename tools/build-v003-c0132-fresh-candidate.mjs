import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const sourceHead = "9a07de34643fed477399b070462aeb2be3d4f11a";
const sourceRelativePath = "sPg Crafting List.html";
const defaultOutput = path.join(projectDirectory, "test-artifacts", "V003-C013.2", "fresh-release-candidate", "sPg Crafting List V003 RC.html");
const outputArgument = process.argv.find((argument) => argument.startsWith("--output="));
const outputPath = outputArgument ? path.resolve(projectDirectory, outputArgument.slice("--output=".length)) : defaultOutput;

const git = (arguments_) => {
  const result = spawnSync("git", arguments_, { cwd: projectDirectory, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} sikertelen: ${String(result.stderr || "")}`);
  return result.stdout;
};
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

assert.equal(git(["branch", "--show-current"]).toString("utf8").trim(), "develop/V003", "A C013.2 builder csak a develop/V003 ágon futhat.");
assert.equal(spawnSync("git", ["merge-base", "--is-ancestor", sourceHead, "HEAD"], { cwd: projectDirectory }).status, 0, "A C013.2 source checkpoint nem őse a jelenlegi HEAD-nek.");
assert.equal(spawnSync("git", ["diff", "--quiet", sourceHead, "--", sourceRelativePath], { cwd: projectDirectory }).status, 0, "Az application HTML eltér a C013.1 source HEAD-től; STOP.");

const sourceBytes = git(["show", `${sourceHead}:${sourceRelativePath}`]);
const workingBytes = fs.readFileSync(path.join(projectDirectory, sourceRelativePath));
assert.deepEqual(workingBytes, sourceBytes, "A working application nem byte-azonos a C013.1 source HEAD-del.");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sourceBytes);
const result = {
  cycle: "V003-C013.2",
  status: "BUILT_PENDING_GATES",
  sourceHead,
  source: sourceRelativePath,
  output: path.relative(projectDirectory, outputPath).replaceAll("\\", "/"),
  bytes: sourceBytes.length,
  sha256: sha256(sourceBytes),
  generatedAt: new Date().toISOString(),
  buildModel: "GIT_COMMIT_RAW_BYTE_COPY",
  sourceByteIdentical: true,
  applicationCodeChanged: false,
  localRuntimeSidecars: 0,
  stableRelease: false,
  manualCandidateFileGate: "NOT_RUN"
};
if (!outputArgument) {
  fs.writeFileSync(path.join(path.dirname(outputPath), "candidate-manifest.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
}
console.log("V003_C0132_FRESH_CANDIDATE_BUILD_PASS");
console.log(JSON.stringify(result, null, 2));
