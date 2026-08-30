import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const baselineCommit = "e519b0889a65b70e8ae6d8be6d869b52e206eb99";
const sourceRelativePath = "sPg Crafting List.html";
const defaultOutput = path.join(projectDirectory, "test-artifacts", "V003-C013", "release-candidate", sourceRelativePath);
const outputArgument = process.argv.find((argument) => argument.startsWith("--output="));
const outputPath = outputArgument ? path.resolve(projectDirectory, outputArgument.slice("--output=".length)) : defaultOutput;

const git = (arguments_) => {
  const result = spawnSync("git", arguments_, { cwd: projectDirectory, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} sikertelen: ${String(result.stderr || "")}`);
  return result.stdout;
};

const branch = git(["branch", "--show-current"]).toString("utf8").trim();
assert.equal(branch, "develop/V003", "A C013 builder csak a develop/V003 ágon futhat.");
const head = git(["rev-parse", "HEAD"]).toString("utf8").trim();
const baselineIsAncestor = spawnSync("git", ["merge-base", "--is-ancestor", baselineCommit, head], { cwd: projectDirectory });
assert.equal(baselineIsAncestor.status, 0, "A C013 builder HEAD-je nem a lezárt C012.4 baseline leszármazottja.");

const appDiff = spawnSync("git", ["diff", "--quiet", baselineCommit, "--", sourceRelativePath], { cwd: projectDirectory });
assert.equal(appDiff.status, 0, "Az alkalmazáskód eltér a C012.4 baseline-tól; C013 STOP.");

const candidateBytes = git(["show", `${baselineCommit}:${sourceRelativePath}`]);
const workingBytes = fs.readFileSync(path.join(projectDirectory, sourceRelativePath));
assert.deepEqual(candidateBytes, workingBytes, "A working application byte-tartalma eltér a C012.4 commit forrásától.");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, candidateBytes);

const result = {
  cycle: "V003-C013",
  baselineCommit,
  source: sourceRelativePath,
  output: path.relative(projectDirectory, outputPath).replaceAll("\\", "/"),
  bytes: candidateBytes.length,
  sha256: crypto.createHash("sha256").update(candidateBytes).digest("hex"),
  buildModel: "GIT_COMMIT_RAW_BYTE_COPY",
  sourceByteIdentical: true
};

console.log("V003_C013_CANDIDATE_BUILD_PASS");
console.log(JSON.stringify(result, null, 2));
