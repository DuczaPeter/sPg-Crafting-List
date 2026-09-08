import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const sourceHead = "37f8852b4ddfd5b628d952a445f97ee5a5179a11";
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C015", "fresh-release-candidate");
const candidateRelativePath = "test-artifacts/V003-C015/fresh-release-candidate/sPg Crafting List V003 RC.html";
const candidatePath = path.join(projectDirectory, ...candidateRelativePath.split("/"));
const manifestPath = path.join(artifactDirectory, "candidate-manifest.json");
const d1ArtifactDirectory = path.join(artifactDirectory, "integrated-fr86");
const d1StandalonePath = path.join(artifactDirectory, "standalone", "sPg Crafting List - FR-86 shortage.html");
const c0131ArtifactDirectory = path.join(artifactDirectory, "c0131-mixed-shortage");
const c0133ArtifactDirectory = path.join(artifactDirectory, "c0133-disjoint-canonical");
const c0135ArtifactDirectory = path.join(artifactDirectory, "c0135-canonical-picker");
const c0137ArtifactDirectory = path.join(artifactDirectory, "c0137-user-data-independent-picker");
const targetEvidencePath = path.join(artifactDirectory, "target-evidence.json");

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const count = (text, token) => text.split(token).length - 1;
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
assert.deepEqual(candidateBytes, sourceBytes, "A C015 candidate nem byte-azonos a C014 source HEAD alkalmazassal.");
const candidateShaBefore = sha256(candidateBytes);
const candidateHtml = candidateBytes.toString("utf8");
assertSingleFileRuntimeMarkup(candidateHtml);
assert.ok(extractEmbeddedApplicationCss(candidateHtml).length > 100000, "A candidate embedded CSS-e hianyos.");
assert.match(candidateHtml, /<script(?:\s[^>]*)?>[\s\S]*?<\/script>/i, "A candidate embedded JavaScriptje hianyzik.");
assert.doesNotMatch(candidateHtml, /<(?:link|script)[^>]+(?:href|src)=["'](?:\.\.?\/|file:|Info\/)/i, "A candidate helyi runtime sidecart ker.");
assert.equal(count(candidateHtml, "V003-dev"), 0, "V003-dev runtime identity maradt a candidate-ben.");
assert.equal(count(candidateHtml, '<strong id="applicationStatus">V003</strong>'), 1);
assert.equal(count(candidateHtml, '<span id="footerRuntime">V003</span>'), 1);
assert.equal(count(candidateHtml, 'version: "V003"'), 1);
assert.match(candidateHtml, /applicationVersion:\s*APP\.version/);
assert.match(candidateHtml, /application:\s*\{[\s\S]*?version:\s*APP\.version/);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
assert.equal(manifest.sourceHead, sourceHead);
assert.equal(manifest.sha256, candidateShaBefore);
assert.equal(manifest.bytes, candidateBytes.length);
assert.equal(manifest.runtimeIdentity, "V003");
assert.equal(manifest.v003DevRuntimeIdentityOccurrences, 0);

run("run-v003-c0125d1-tests.mjs", {
  SPG_APP_PATH: candidatePath,
  SPG_EXPECTED_HEAD: sourceHead,
  SPG_ARTIFACT_DIRECTORY: d1ArtifactDirectory,
  SPG_STANDALONE_OUTPUT: d1StandalonePath,
  SPG_CYCLE_ID: "V003-C015"
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
run("run-v003-c0137-tests.mjs", {
  SPG_APP_PATH: candidatePath,
  SPG_ARTIFACT_DIRECTORY: c0137ArtifactDirectory
});

const d1Evidence = JSON.parse(fs.readFileSync(path.join(d1ArtifactDirectory, "integration-evidence.json"), "utf8"));
const mixedEvidence = JSON.parse(fs.readFileSync(path.join(c0131ArtifactDirectory, "strict-quality-allocation-evidence.json"), "utf8"));
const c0133Evidence = JSON.parse(fs.readFileSync(path.join(c0133ArtifactDirectory, "disjoint-pools-canonical-grouping-evidence.json"), "utf8"));
const c0135Evidence = JSON.parse(fs.readFileSync(path.join(c0135ArtifactDirectory, "canonical-material-picker-evidence.json"), "utf8"));
const c0137Evidence = JSON.parse(fs.readFileSync(path.join(c0137ArtifactDirectory, "user-data-independent-canonical-picker-evidence.json"), "utf8"));

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
assert.equal(c0133Evidence.titanium.canonicalMaterialUuid, "64978449-1d87-4a16-ba55-4b5f94fee217");
assert.equal(c0133Evidence.titanium.sourceMaterialUuid, "07570c9f-fdf6-4bca-a56b-c42809ec0e01");
assert.equal(c0133Evidence.titanium.logicalMaterials, 1);
assert.equal(c0133Evidence.titanium.batches, 2);
assert.equal(c0133Evidence.titanium.minimumEligibleUnits, 17440);
assert.equal(c0133Evidence.titanium.maximumEligibleUnits, 31240);
assert.equal(c0133Evidence.titanium.q866OnlyMinimumEligibleUnits, 0);
assert.equal(c0133Evidence.invalidRange, "POOL_RANGE_INVALID");

assert.equal(c0135Evidence.status, "PASS");
assert.equal(c0135Evidence.activeScVersion, "4.10.0-LIVE.12519617");
assert.equal(c0135Evidence.feynmaline.visiblePickerOptions, 1);
assert.equal(c0135Evidence.titanium.visiblePickerOptions, 1);
assert.equal(c0135Evidence.checks.noFuzzyOrNameOnlyMerge, "PASS");
assert.equal(c0135Evidence.checks.combinedParity, "PASS");
assert.equal(c0135Evidence.checks.allocationParity, "PASS");
assert.equal(c0135Evidence.checks.noDoubleReserve, "PASS");

assert.equal(c0137Evidence.status, "PASS");
const expectedCanonical = new Map([
  ["Feynmaline", "7310c15d-359c-42b4-b61e-7da3d0da3384"],
  ["Titanium", "64978449-1d87-4a16-ba55-4b5f94fee217"],
  ["Tungsten", "addc9aa4-5d2d-4c0d-b01b-ad2b2e50a5d6"],
  ["Gold", "57aba429-cf97-4fdd-8042-94b1d643f5bd"]
]);
for (const record of c0137Evidence.invariance) {
  assert.equal(record.equal, true, `${record.name}: legacy User Data megvaltoztatta a canonical UUID-t.`);
  assert.equal(record.canonicalUuid, expectedCanonical.get(record.name));
  assert.equal(record.pickerCanonicalUuidNoUserData, record.canonicalUuid);
  assert.equal(record.pickerCanonicalUuidWithLegacyUserData, record.canonicalUuid);
}
const titaniumInvariance = c0137Evidence.invariance.find((record) => record.name === "Titanium");
assert.equal(titaniumInvariance.sourceUuid, "07570c9f-fdf6-4bca-a56b-c42809ec0e01");
assert.equal(c0137Evidence.titanium.logicalMaterialCount, 1);
assert.equal(c0137Evidence.titanium.batchCount, 3);
assert.deepEqual(c0137Evidence.titanium.qualities, [784, 866, 920]);
for (const key of ["userDataIndependentCanonicalPicker", "newBatchBesideLegacyBatch", "multipleQualityBatches", "sourceProvenance", "reload", "backupRestore", "myMaterialsGrouping", "combinedParity", "allocationParity", "noDoubleReserve", "noFuzzyOrNameOnlyMerge", "unresolvedDuplicateFailSafe"]) {
  assert.equal(c0137Evidence.checks[key], "PASS", `C013.7 check FAIL: ${key}`);
}

const candidateShaAfter = sha256(fs.readFileSync(candidatePath));
assert.equal(candidateShaAfter, candidateShaBefore, "A candidate megvaltozott a target tesztek alatt.");
const evidence = {
  cycle: "V003-C015",
  status: "TARGET_PASS",
  sourceHead,
  candidate: {
    path: candidateRelativePath,
    bytes: candidateBytes.length,
    sha256Before: candidateShaBefore,
    sha256After: candidateShaAfter,
    immutableDuringTest: true,
    sourceByteIdentical: true,
    runtimeIdentity: "V003",
    v003DevRuntimeIdentityOccurrences: 0,
    singleFileRuntime: true,
    embeddedCss: true,
    embeddedJavaScript: true,
    localRuntimeSidecars: 0
  },
  integratedFr86: d1Evidence,
  mixedShortage: mixedEvidence,
  disjointPoolsCanonicalGrouping: c0133Evidence,
  canonicalPickerDedup: c0135Evidence,
  userDataIndependentCanonicalPicker: c0137Evidence,
  standalone: {
    d1Path: path.relative(projectDirectory, d1StandalonePath).replaceAll("\\", "/"),
    readOnly: true,
    editorControls: 0,
    indexedDbWriteSurface: 0,
    allocationRecomputation: 0,
    canonicalMaterialParity: "PASS",
    qualityPoolParity: "PASS",
    selfContained: true,
    v003DevRuntimeIdentityOccurrences: count(fs.readFileSync(d1StandalonePath, "utf8"), "V003-dev")
  }
};
assert.equal(evidence.standalone.v003DevRuntimeIdentityOccurrences, 0, "V003-dev identity maradt a standalone exportban.");
fs.writeFileSync(targetEvidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log("V003_C015_FRESH_TARGET_TEST_PASS");
console.log(JSON.stringify(evidence, null, 2));
