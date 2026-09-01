import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const sourceHead = "9a07de34643fed477399b070462aeb2be3d4f11a";
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C013.2", "fresh-release-candidate");
const candidateRelativePath = "test-artifacts/V003-C013.2/fresh-release-candidate/sPg Crafting List V003 RC.html";
const candidatePath = path.join(projectDirectory, ...candidateRelativePath.split("/"));
const manifestPath = path.join(artifactDirectory, "candidate-manifest.json");
const d1ArtifactDirectory = path.join(artifactDirectory, "integrated-fr86");
const d1StandalonePath = path.join(artifactDirectory, "standalone", "sPg Crafting List - FR-86 shortage.html");
const c0131ArtifactDirectory = path.join(artifactDirectory, "c0131-mixed-shortage");
const mixedStandalonePath = path.join(c0131ArtifactDirectory, "standalone", "sPg Crafting List - FR-86 mixed shortage.html");
const targetEvidencePath = path.join(artifactDirectory, "target-evidence.json");

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const git = (arguments_) => {
  const result = spawnSync("git", arguments_, { cwd: projectDirectory, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} sikertelen: ${String(result.stderr || "")}`);
  return result.stdout;
};
const run = (script, env) => {
  const result = spawnSync("node", [path.join(toolsDirectory, script)], {
    cwd: projectDirectory,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, ...env }
  });
  assert.equal(result.status, 0, `${script} sikertelen:\n${result.stdout}\n${result.stderr}`);
};

const sourceBytes = git(["show", `${sourceHead}:sPg Crafting List.html`]);
const candidateBytes = fs.readFileSync(candidatePath);
assert.deepEqual(candidateBytes, sourceBytes, "A C013.2 candidate nem byte-azonos a C013.1 source HEAD alkalmazással.");
const candidateShaBefore = sha256(candidateBytes);
const candidateHtml = candidateBytes.toString("utf8");
assertSingleFileRuntimeMarkup(candidateHtml);
assert.ok(extractEmbeddedApplicationCss(candidateHtml).length > 100000, "A candidate embedded CSS-e hiányos.");
assert.match(candidateHtml, /<script(?:\s[^>]*)?>[\s\S]*?<\/script>/i, "A candidate embedded JavaScriptje hiányzik.");
assert.doesNotMatch(candidateHtml, /<(?:link|script)[^>]+(?:href|src)=["'](?:\.\.?\/|file:|Info\/)/i, "A candidate helyi runtime sidecart kér.");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
assert.equal(manifest.sourceHead, sourceHead);
assert.equal(manifest.sha256, candidateShaBefore);
assert.equal(manifest.bytes, candidateBytes.length);

run("run-v003-c0125d1-tests.mjs", {
  SPG_APP_PATH: candidatePath,
  SPG_EXPECTED_HEAD: sourceHead,
  SPG_ARTIFACT_DIRECTORY: d1ArtifactDirectory,
  SPG_STANDALONE_OUTPUT: d1StandalonePath,
  SPG_CYCLE_ID: "V003-C013.2"
});
run("run-v003-c0131-tests.mjs", {
  SPG_APP_PATH: candidatePath,
  SPG_ARTIFACT_DIRECTORY: c0131ArtifactDirectory
});

const d1Evidence = JSON.parse(fs.readFileSync(path.join(d1ArtifactDirectory, "integration-evidence.json"), "utf8"));
const mixedEvidence = JSON.parse(fs.readFileSync(path.join(c0131ArtifactDirectory, "strict-quality-allocation-evidence.json"), "utf8"));
assert.equal(d1Evidence.fixtureStatuses.fr86HappyPath, "PASS");
assert.equal(d1Evidence.fixtureStatuses.qualityShortage, "PASS");
assert.equal(d1Evidence.fixtureStatuses.anyQRecipeMinimum, "PASS");
assert.equal(d1Evidence.fixtureStatuses.unresolvedThreshold, "PASS_FAIL_SAFE");
assert.equal(d1Evidence.fixtureStatuses.twoCardPriority, "PASS");
assert.equal(d1Evidence.fixtureStatuses.recipeDeleteInventoryOnly, "PASS");
assert.equal(d1Evidence.backupRestore, "PASS_INVENTORY_POOLS_ASSIGNMENTS_ALLOCATION");
assert.equal(mixedEvidence.fixture, "FR86_MIXED_AMOUNT_AND_QUALITY_SHORTAGE");
assert.deepEqual(mixedEvidence.field, { reservedUnits: 60000, missingAmountUnits: 93000, missingQualityUnits: 170000, availablePhysicalUnitsAtSlot: 230000, availableEligibleUnitsAtSlot: 60000 });
assert.deepEqual(mixedEvidence.shell, { reservedUnits: 170000, missingAmountUnits: 34000, missingQualityUnits: 0, availablePhysicalUnitsAtSlot: 170000, availableEligibleUnitsAtSlot: 170000 });
assert.equal(mixedEvidence.global.reservedUnits, 230000);
assert.equal(mixedEvidence.global.missingUnits, 297000);
assert.equal(mixedEvidence.reverseRecipeRows, "PASS");
assert.equal(mixedEvidence.cardPriority, "PASS");
assert.equal(mixedEvidence.noDoubleReserve, "PASS");
assert.equal(mixedEvidence.m4Audit, "TECHNICAL_BASELINE_HARNESS_CANONICAL_ARGUMENT_MISSING");
assert.equal(mixedEvidence.crossViewParity, "PASS_FINAL_CARD_CRAFTING_LIST_COMBINED_MAXIMUM_CRAFTABLE_STANDALONE");

const mixedStandaloneBytes = fs.readFileSync(mixedStandalonePath);
const mixedStandaloneHtml = mixedStandaloneBytes.toString("utf8");
assertSingleFileRuntimeMarkup(mixedStandaloneHtml);
assert.match(mixedStandaloneHtml, /Field Array[\s\S]*Mennyiséghiány: 9,3 SCU[\s\S]*Quality-hiány: 17 SCU/);
assert.match(mixedStandaloneHtml, /Shell[\s\S]*Mennyiséghiány: 3,4 SCU/);
assert.doesNotMatch(mixedStandaloneHtml, /<select\b|<input\b|contenteditable\s*=/i);
assert.doesNotMatch(mixedStandaloneHtml, /indexedDB|saveCraftingCards|persistMaterialQualityPoolValue/);
assert.doesNotMatch(mixedStandaloneHtml, /fetch\s*\(/i);

const candidateShaAfter = sha256(fs.readFileSync(candidatePath));
assert.equal(candidateShaAfter, candidateShaBefore, "A candidate megváltozott a target tesztek alatt.");
const evidence = {
  cycle: "V003-C013.2",
  status: "TARGET_PASS",
  sourceHead,
  candidate: { path: candidateRelativePath, bytes: candidateBytes.length, sha256Before: candidateShaBefore, sha256After: candidateShaAfter, immutableDuringTest: true, singleFileRuntime: true, embeddedCss: true, embeddedJavaScript: true, localRuntimeSidecars: 0 },
  integratedFr86: d1Evidence,
  mixedShortage: mixedEvidence,
  standalone: { path: path.relative(projectDirectory, mixedStandalonePath).replaceAll("\\", "/"), bytes: mixedStandaloneBytes.length, sha256: sha256(mixedStandaloneBytes), readOnly: true, editorControls: 0, indexedDbWriteSurface: 0, allocationRecomputation: 0, mixedShortageAndEffectiveQuality: "PASS" }
};
fs.writeFileSync(targetEvidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log("V003_C0132_FRESH_TARGET_TEST_PASS");
console.log(JSON.stringify(evidence, null, 2));
