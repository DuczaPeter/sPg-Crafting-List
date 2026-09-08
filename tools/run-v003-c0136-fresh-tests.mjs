import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const sourceHead = "e4bc51672c072a8c8ecb4c5cc0db8ed622cde057";
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C013.6", "fresh-release-candidate");
const candidateRelativePath = "test-artifacts/V003-C013.6/fresh-release-candidate/sPg Crafting List V003 RC.html";
const candidatePath = path.join(projectDirectory, ...candidateRelativePath.split("/"));
const manifestPath = path.join(artifactDirectory, "candidate-manifest.json");
const d1ArtifactDirectory = path.join(artifactDirectory, "integrated-fr86");
const d1StandalonePath = path.join(artifactDirectory, "standalone", "sPg Crafting List - FR-86 shortage.html");
const c0131ArtifactDirectory = path.join(artifactDirectory, "c0131-mixed-shortage");
const c0133ArtifactDirectory = path.join(artifactDirectory, "c0133-disjoint-canonical");
const c0135ArtifactDirectory = path.join(artifactDirectory, "c0135-canonical-picker");
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
assert.deepEqual(candidateBytes, sourceBytes, "A C013.6 candidate nem byte-azonos a C013.5 source HEAD alkalmazassal.");
const candidateShaBefore = sha256(candidateBytes);
const candidateHtml = candidateBytes.toString("utf8");
assertSingleFileRuntimeMarkup(candidateHtml);
assert.ok(extractEmbeddedApplicationCss(candidateHtml).length > 100000, "A candidate embedded CSS-e hianyos.");
assert.match(candidateHtml, /<script(?:\s[^>]*)?>[\s\S]*?<\/script>/i, "A candidate embedded JavaScriptje hianyzik.");
assert.doesNotMatch(candidateHtml, /<(?:link|script)[^>]+(?:href|src)=["'](?:\.\.?\/|file:|Info\/)/i, "A candidate helyi runtime sidecart ker.");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
assert.equal(manifest.sourceHead, sourceHead);
assert.equal(manifest.sha256, candidateShaBefore);
assert.equal(manifest.bytes, candidateBytes.length);

run("run-v003-c0125d1-tests.mjs", {
  SPG_APP_PATH: candidatePath,
  SPG_EXPECTED_HEAD: sourceHead,
  SPG_ARTIFACT_DIRECTORY: d1ArtifactDirectory,
  SPG_STANDALONE_OUTPUT: d1StandalonePath,
  SPG_CYCLE_ID: "V003-C013.6"
});
run("run-v003-c0131-tests.mjs", {
  SPG_APP_PATH: candidatePath,
  SPG_ARTIFACT_DIRECTORY: c0131ArtifactDirectory
});
run("run-v003-c0133-tests.mjs", {
  SPG_APP_PATH: candidatePath,
  SPG_ARTIFACT_DIRECTORY: c0133ArtifactDirectory
});
run("run-v003-c0135-tests.mjs", {
  SPG_APP_PATH: candidatePath,
  SPG_ARTIFACT_DIRECTORY: c0135ArtifactDirectory
});

const d1Evidence = JSON.parse(fs.readFileSync(path.join(d1ArtifactDirectory, "integration-evidence.json"), "utf8"));
const mixedEvidence = JSON.parse(fs.readFileSync(path.join(c0131ArtifactDirectory, "strict-quality-allocation-evidence.json"), "utf8"));
const c0133Evidence = JSON.parse(fs.readFileSync(path.join(c0133ArtifactDirectory, "disjoint-pools-canonical-grouping-evidence.json"), "utf8"));
const c0135Evidence = JSON.parse(fs.readFileSync(path.join(c0135ArtifactDirectory, "canonical-material-picker-evidence.json"), "utf8"));

assert.equal(d1Evidence.fixtureStatuses.fr86HappyPath, "PASS");
assert.equal(d1Evidence.fixtureStatuses.qualityShortage, "PASS");
assert.equal(d1Evidence.fixtureStatuses.twoCardPriority, "PASS");
assert.equal(d1Evidence.backupRestore, "PASS_INVENTORY_POOLS_ASSIGNMENTS_ALLOCATION");
assert.equal(mixedEvidence.fixture, "FR86_MIXED_AMOUNT_AND_QUALITY_SHORTAGE");
assert.equal(mixedEvidence.global.reservedUnits, 230000);
assert.equal(mixedEvidence.global.missingUnits, 297000);
assert.equal(mixedEvidence.reverseRecipeRows, "PASS");
assert.equal(mixedEvidence.cardPriority, "PASS");
assert.equal(mixedEvidence.noDoubleReserve, "PASS");
assert.equal(mixedEvidence.crossViewParity, "PASS_FINAL_CARD_CRAFTING_LIST_COMBINED_MAXIMUM_CRAFTABLE_STANDALONE");

assert.equal(c0133Evidence.status, "PASS");
for (const status of Object.values(c0133Evidence.fixtures)) assert.match(status, /^PASS/);
assert.deepEqual(c0133Evidence.titanium, {
  canonicalMaterialUuid: "64978449-1d87-4a16-ba55-4b5f94fee217",
  sourceMaterialUuid: "07570c9f-fdf6-4bca-a56b-c42809ec0e01",
  logicalMaterials: 1,
  displayedCards: 1,
  batches: 2,
  totalInventoryUnits: 48680,
  minimumEligibleUnits: 17440,
  maximumEligibleUnits: 31240,
  q866OnlyMinimumEligibleUnits: 0,
  q866OnlyMaximumEligibleUnits: 31240,
  minimumOnlyUnboundedEligibleUnits: 48680,
  maximumOnlyEligibleUnits: 31240
});
assert.equal(c0133Evidence.invalidRange, "POOL_RANGE_INVALID");

assert.equal(c0135Evidence.status, "PASS");
assert.equal(c0135Evidence.activeScVersion, "4.10.0-LIVE.12519617");
assert.equal(c0135Evidence.feynmaline.visiblePickerOptions, 1);
assert.equal(c0135Evidence.feynmaline.canonicalUuid, "7310c15d-359c-42b4-b61e-7da3d0da3384");
assert.ok(c0135Evidence.feynmaline.sourceUuids.includes("d7a21cac-3c2b-4695-95b7-2042d8f5755e"));
assert.equal(c0135Evidence.feynmaline.nameToUuidAutofill, "7310c15d-359c-42b4-b61e-7da3d0da3384");
assert.equal(c0135Evidence.titanium.visiblePickerOptions, 1);
assert.equal(c0135Evidence.titanium.canonicalUuid, "64978449-1d87-4a16-ba55-4b5f94fee217");
assert.equal(c0135Evidence.checks.noFuzzyOrNameOnlyMerge, "PASS");
assert.equal(c0135Evidence.checks.backupRestoreSourceProvenance, "PASS");
assert.equal(c0135Evidence.checks.combinedParity, "PASS");
assert.equal(c0135Evidence.checks.allocationParity, "PASS");
assert.equal(c0135Evidence.checks.noDoubleReserve, "PASS");

const candidateShaAfter = sha256(fs.readFileSync(candidatePath));
assert.equal(candidateShaAfter, candidateShaBefore, "A candidate megvaltozott a target tesztek alatt.");
const evidence = {
  cycle: "V003-C013.6",
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
  mixedShortage: mixedEvidence,
  disjointPoolsCanonicalGrouping: c0133Evidence,
  canonicalPickerDedup: c0135Evidence,
  standalone: {
    d1Path: path.relative(projectDirectory, d1StandalonePath).replaceAll("\\", "/"),
    readOnly: true,
    editorControls: 0,
    indexedDbWriteSurface: 0,
    allocationRecomputation: 0,
    canonicalMaterialParity: "PASS",
    qualityPoolParity: "PASS",
    selfContained: true
  }
};
fs.writeFileSync(targetEvidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log("V003_C0136_FRESH_TARGET_TEST_PASS");
console.log(JSON.stringify(evidence, null, 2));
