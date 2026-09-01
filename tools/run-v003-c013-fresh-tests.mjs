import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const sourceHead = "6abae928b7d2f81e0b5eee2976a652feb0577c8d";
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C013", "fresh-release-candidate");
const candidateRelativePath = "test-artifacts/V003-C013/fresh-release-candidate/sPg Crafting List V003 RC.html";
const candidatePath = path.join(projectDirectory, ...candidateRelativePath.split("/"));
const manifestPath = path.join(artifactDirectory, "candidate-manifest.json");
const d1ArtifactDirectory = path.join(artifactDirectory, "integrated-fr86");
const standalonePath = path.join(artifactDirectory, "standalone", "sPg Crafting List - FR-86 shortage.html");
const targetEvidencePath = path.join(artifactDirectory, "target-evidence.json");

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const git = (arguments_) => {
  const result = spawnSync("git", arguments_, { cwd: projectDirectory, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} sikertelen: ${String(result.stderr || "")}`);
  return result.stdout;
};

const sourceBytes = git(["show", `${sourceHead}:sPg Crafting List.html`]);
const candidateBytes = fs.readFileSync(candidatePath);
assert.deepEqual(candidateBytes, sourceBytes, "A fresh candidate nem byte-azonos a D2B source HEAD alkalmazással.");
const candidateShaBefore = sha256(candidateBytes);
const candidateHtml = candidateBytes.toString("utf8");
const candidateCss = extractEmbeddedApplicationCss(candidateHtml);
assertSingleFileRuntimeMarkup(candidateHtml);
assert.ok(candidateCss.length > 100000, "A candidate embedded CSS-e hiányos.");
assert.match(candidateHtml, /<script(?:\s[^>]*)?>[\s\S]*?<\/script>/i, "A candidate embedded JavaScriptje hiányzik.");
assert.doesNotMatch(candidateHtml, /<(?:link|script)[^>]+(?:href|src)=["'](?:\.\.?\/|file:|Info\/)/i, "A candidate helyi runtime sidecart kér.");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
assert.equal(manifest.sourceHead, sourceHead);
assert.equal(manifest.sha256, candidateShaBefore);
assert.equal(manifest.bytes, candidateBytes.length);
assert.ok(
  ["BUILT_PENDING_GATES", "FRESH_RC_AUTOMATED_CHROME_PASS_MANUAL_FILE_PENDING"].includes(manifest.status),
  `Ismeretlen fresh candidate manifest státusz: ${manifest.status}`
);

const d1Run = spawnSync("node", [path.join(toolsDirectory, "run-v003-c0125d1-tests.mjs")], {
  cwd: projectDirectory,
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
  env: {
    ...process.env,
    SPG_APP_PATH: candidatePath,
    SPG_EXPECTED_HEAD: sourceHead,
    SPG_ARTIFACT_DIRECTORY: d1ArtifactDirectory,
    SPG_STANDALONE_OUTPUT: standalonePath,
    SPG_CYCLE_ID: "V003-C013"
  }
});
assert.equal(d1Run.status, 0, `A fresh candidate integrált FR-86 tesztje sikertelen:\n${d1Run.stdout}\n${d1Run.stderr}`);

const d1Evidence = JSON.parse(fs.readFileSync(path.join(d1ArtifactDirectory, "integration-evidence.json"), "utf8"));
assert.equal(d1Evidence.cycle, "V003-C013");
assert.equal(d1Evidence.fixtureStatuses.fr86HappyPath, "PASS");
assert.equal(d1Evidence.fixtureStatuses.qualityShortage, "PASS");
assert.equal(d1Evidence.fixtureStatuses.anyQRecipeMinimum, "PASS");
assert.equal(d1Evidence.fixtureStatuses.unresolvedThreshold, "PASS_FAIL_SAFE");
assert.equal(d1Evidence.fixtureStatuses.twoCardPriority, "PASS");
assert.equal(d1Evidence.fixtureStatuses.recipeDeleteInventoryOnly, "PASS");
assert.deepEqual(d1Evidence.maxDb, { happy: 1, shortage: 0 });
assert.equal(d1Evidence.combined.minimumRequiredReservedScu, "1.2/1.2");
assert.equal(d1Evidence.combined.maximumRequiredReservedScu, "1.9/1.9");
assert.equal(d1Evidence.combined.shortageQualityScu, 1.9);
assert.equal(d1Evidence.backupRestore, "PASS_INVENTORY_POOLS_ASSIGNMENTS_ALLOCATION");

const standaloneBytes = fs.readFileSync(standalonePath);
const standaloneHtml = standaloneBytes.toString("utf8");
assertSingleFileRuntimeMarkup(standaloneHtml);
assert.match(standaloneHtml, /Shell[\s\S]*Minimum Q · Q500\+/);
assert.match(standaloneHtml, /Field Array[\s\S]*MAX Q · Q700\+/);
assert.match(standaloneHtml, /Quality-hiány: 1,9 SCU/);
assert.match(standaloneHtml, /data-card-satisfied="false"/);
assert.doesNotMatch(standaloneHtml, /<select\b|<input\b|contenteditable\s*=/i);
assert.doesNotMatch(standaloneHtml, /indexedDB|saveCraftingCards|persistMaterialQualityPoolValue/);
assert.doesNotMatch(standaloneHtml, /fetch\s*\(/i);

const candidateShaAfter = sha256(fs.readFileSync(candidatePath));
assert.equal(candidateShaAfter, candidateShaBefore, "A candidate megváltozott a target teszt alatt.");
const evidence = {
  cycle: "V003-C013",
  status: "TARGET_PASS",
  sourceHead,
  candidate: {
    path: candidateRelativePath,
    bytes: candidateBytes.length,
    sha256Before: candidateShaBefore,
    sha256After: candidateShaAfter,
    immutableDuringTest: true,
    singleFileRuntime: true,
    embeddedCss: true,
    embeddedJavaScript: true,
    localRuntimeSidecars: 0
  },
  integratedFr86: d1Evidence,
  standalone: {
    path: path.relative(projectDirectory, standalonePath).replaceAll("\\", "/"),
    bytes: standaloneBytes.length,
    sha256: sha256(standaloneBytes),
    readOnly: true,
    editorControls: 0,
    indexedDbWriteSurface: 0,
    allocationRecomputation: 0,
    effectiveQualityAndShortage: "PASS"
  }
};
fs.writeFileSync(targetEvidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log("V003_C013_FRESH_TARGET_TEST_PASS");
console.log(JSON.stringify(evidence, null, 2));
