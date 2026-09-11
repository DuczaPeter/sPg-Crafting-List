import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildHistorySnapshotCardNormalizerSource,
  buildM4HarnessSource,
  loadVerifiedCandidateHtml,
  V004_C0081_HARNESS_CONTRACT
} from "./v004-c0081-harness-loader.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const legacyBaseline = "874487ac8f2d72e7eb201a78ad79db048c3b0b25";
const expectedSha256 = "16f186cc7a0ec3d614dbdd690c1ac448261713ff4fd6c32bdfa8876b68641af5";
const expectedBytes = 1083886;
const candidatePath = path.join(projectDirectory, "test-artifacts", "V004-C010", "fresh-release-candidate", "sPg Crafting List V004 RC.html");
const validatorPath = path.join(toolsDirectory, "validate-v004-c008-release-candidate.ps1");
const required = Object.freeze([
  ["m4-combined-backup", "run-m4-tests.mjs"],
  ["v003-c0121-quality-planner", "run-v003-c0121-tests.mjs"],
  ["v003-c0123-quality-constraints", "run-v003-c0123-tests.mjs"],
  ["v003-c0125a-inventory-independence", "run-v003-c0125a-tests.mjs"],
  ["v003-c0125b-quality-pools", "run-v003-c0125b-tests.mjs"],
  ["v003-c0125c1-slot-assignment", "run-v003-c0125c1-tests.mjs"],
  ["v003-c0125d1-integrated-fixture", "run-v003-c0125d1-tests.mjs"],
  ["v003-c0133-disjoint-canonical", "run-v003-c0133-tests.mjs"],
  ["v003-c0135-canonical-picker", "run-v003-c0135-tests.mjs"],
  ["v003-c0137-user-data-independent-picker", "run-v003-c0137-tests.mjs"],
  ["v004-c0061-backup-model", "run-v004-c0061-tests.mjs"]
]);
const currentSchema3Files = new Set(required.slice(0, 10).map(([, filename]) => filename));
const historySnapshotRunners = Object.freeze([
  ["v004-c004-complete-model", "run-v004-c004-tests.mjs"],
  ["v004-c0044-normalization-model", "run-v004-c0044-tests.mjs"],
  ["v004-c006-undo-model", "run-v004-c006-tests.mjs"],
  ["v004-c0061-backup-model", "run-v004-c0061-tests.mjs"]
]);

function uniqueIndex(source, needle, label) {
  const first = source.indexOf(needle);
  assert.notEqual(first, -1, `${label}: start anchor missing: ${needle}`);
  assert.equal(first, source.lastIndexOf(needle), `${label}: duplicate anchor: ${needle}`);
  return first;
}

function region(source, startAnchor, endAnchor, label) {
  const start = uniqueIndex(source, startAnchor, `${label} start`);
  const end = uniqueIndex(source, endAnchor, `${label} end`);
  assert.ok(end > start, `${label}: invalid range`);
  return source.slice(start, end);
}

function baselineSource(filename) {
  return execFileSync("git", ["show", `${legacyBaseline}:tools/${filename}`], {
    cwd: projectDirectory,
    encoding: "utf8",
    windowsHide: true
  });
}

function assertLegacyRegionUnchanged(filename, startAnchor, endAnchor, label) {
  const current = fs.readFileSync(path.join(toolsDirectory, filename), "utf8");
  const baseline = baselineSource(filename);
  assert.equal(
    region(current, startAnchor, endAnchor, `${filename} current ${label}`).replaceAll("\r\n", "\n"),
    region(baseline, startAnchor, endAnchor, `${filename} baseline ${label}`).replaceAll("\r\n", "\n"),
    `${filename}: a legacy fixture jelentése megváltozott (${label}).`
  );
}

const verified = loadVerifiedCandidateHtml({ candidatePath, expectedSha256, expectedBytes });
const m4HarnessSource = buildM4HarnessSource(verified.html);
const historySnapshotCardNormalizerSource = buildHistorySnapshotCardNormalizerSource(verified.html);
for (const declaration of V004_C0081_HARNESS_CONTRACT.m4RequiredDeclarations) {
  assert.match(m4HarnessSource, new RegExp(`\\b${declaration.replaceAll("$", "\\$")}\\b`), `M4 closure declaration missing: ${declaration}`);
}
assert.match(m4HarnessSource, /function validateM4UserData\(data\)/, "The candidate M4 executable block is missing.");
assert.match(m4HarnessSource, /function normalizeStoredCraftingCard\(card, fallbackOrder\)/, "The production Card normalizer is missing.");
assert.match(m4HarnessSource, /function normalizeStoredCraftHistoryEvent\(event\)/, "The production History normalizer is missing.");
assert.match(m4HarnessSource, /function v004CanonicalizeCraftHistoryCardSnapshot\(snapshot, fallbackOrder\)/, "The production History Card snapshot helper is missing.");
assert.match(historySnapshotCardNormalizerSource, /function normalizeStoredCraftingCard\(card, fallbackOrder\)/, "The candidate-bound Card normalizer support source is missing.");

const validatorSource = fs.readFileSync(validatorPath, "utf8");
assert.match(validatorSource, /audit-v004-c0082-harness-closure\.mjs/, "The C010 validator does not run the M4 static closure audit.");
const configuredNodeRunners = new Map(Array.from(
  validatorSource.matchAll(/^\s*'([^']+)'\s*=\s*@\{\s*Executable\s*=\s*'node';\s*Arguments\s*=\s*@\('\.\\tools\\([^']+\.mjs)'/gm),
  match => [match[1], match[2]]
));

for (const [leafId, filename] of required) {
  assert.equal(configuredNodeRunners.get(leafId), filename, `Release leaf/runner mapping mismatch: ${leafId}`);
  const source = fs.readFileSync(path.join(toolsDirectory, filename), "utf8");
  assert.match(source, /from "\.\/v004-c0081-harness-loader\.mjs"/, `${filename}: shared candidate loader import missing.`);
  assert.match(source, /loadVerifiedCandidateHtml\s*\(/, `${filename}: verified candidate load missing.`);
  assert.match(source, /buildM4HarnessSource\s*\(/, `${filename}: candidate-bound M4 builder missing.`);
  assert.doesNotMatch(source, /block\("M4_COMBINED_BACKUP_MODEL"\)|M4_COMBINED_BACKUP_MODEL_START/, `${filename}: direct historical M4 extraction remains.`);
  assert.doesNotMatch(source, /readFileSync\([^\r\n]*sPg Crafting List\.html[^\r\n]*utf8/, `${filename}: direct checkout HTML read remains.`);
  if (currentSchema3Files.has(filename)) {
    assert.match(source, /craftHistory:\s*\[\]/, `${filename}: current schema-3 craftHistory is missing.`);
    assert.match(source, /userMeta:\s*clone\([^\r\n]*defaultUserMetaRecords\(\)\)/, `${filename}: production default userMeta is missing.`);
  }
}

for (const [leafId, filename] of historySnapshotRunners) {
  assert.equal(configuredNodeRunners.get(leafId), filename, `History snapshot release leaf/runner mapping mismatch: ${leafId}`);
  const source = fs.readFileSync(path.join(toolsDirectory, filename), "utf8");
  assert.match(source, /from "\.\/v004-c0081-harness-loader\.mjs"/, `${filename}: shared candidate loader import missing.`);
  assert.match(source, /loadVerifiedCandidateHtml\s*\(/, `${filename}: verified candidate load missing.`);
  assert.match(source, /build(?:HistorySnapshotCardNormalizerSource|M4HarnessSource)\s*\(/, `${filename}: candidate-bound snapshot canonicalization support missing.`);
  assert.doesNotMatch(source, /function normalizeStoredCraftingCard\s*\(/, `${filename}: copied Card normalizer is forbidden.`);
  assert.doesNotMatch(source, /readFileSync\([^\r\n]*sPg Crafting List\.html[^\r\n]*utf8/, `${filename}: direct checkout HTML read remains.`);
}

const c0061Source = fs.readFileSync(path.join(toolsDirectory, "run-v004-c0061-tests.mjs"), "utf8");
assert.doesNotMatch(c0061Source, /function normalizeStoredCraftingCard\s*\(/, "C006.1 still contains a copied Card normalizer.");
assert.doesNotMatch(c0061Source, /function normalizeStoredCraftHistoryEvent\s*\(/, "C006.1 still contains a copied History normalizer.");
for (const filename of ["run-v003-c0125c1-tests.mjs", "run-v003-c0125d1-tests.mjs"]) {
  const source = fs.readFileSync(path.join(toolsDirectory, filename), "utf8");
  assert.doesNotMatch(source, /storedCardNormalizer/, `${filename}: redundant wide Card-normalizer regex remains.`);
}

assertLegacyRegionUnchanged("run-m4-tests.mjs", "assert.throws(() => m4.validateAndMigrateM4Backup({ format: envelope.format, schemaVersion: 999", "// 8. Interrupted import", "unknown schema negative case");
assertLegacyRegionUnchanged("run-m4-tests.mjs", "const schema1 = m4.validateAndMigrateM4Backup({", "assert.equal(schema1.migration.fromSchema, 1);", "schema-1 input fixture");
assertLegacyRegionUnchanged("run-v003-c0121-tests.mjs", "const schema1 = model.validateAndMigrateM4Backup({", "// JS-300 default recipe policy", "schema-1 fixture");
assertLegacyRegionUnchanged("run-v003-c0123-tests.mjs", "const schema1 = model.validateAndMigrateM4Backup({", "// Standalone uses", "schema-1 fixture");
assertLegacyRegionUnchanged("run-v003-c0125c1-tests.mjs", "const oldCard = clone(cardA);", "const withoutAssignments = clone(cardA);", "legacy Card fixture");
assertLegacyRegionUnchanged("run-v003-c0125d1-tests.mjs", "const legacyCard = makeCard(\"d1-legacy\"", "// Two Cards", "legacy allocation Card fixture");
assertLegacyRegionUnchanged("run-v003-c0125d1-tests.mjs", "const oldCard = clone(card);", "const oldRestored", "legacy backup Card fixture");
assertLegacyRegionUnchanged("run-v004-c0061-tests.mjs", "const legacyEvent = {", "const v003Card = clone(fixture.card);", "markerless legacy schema-3 History fixture");
assertLegacyRegionUnchanged("run-v004-c0061-tests.mjs", "const v003Card = clone(fixture.card);", "const documentMarkup", "explicit schema-2 V003 backup fixture");

const unresolved = [];
const unresolvedHistorySnapshotHarnesses = [];
for (const [leafId, filename] of configuredNodeRunners) {
  const runnerPath = path.join(toolsDirectory, filename);
  const source = fs.readFileSync(runnerPath, "utf8");
  const executesM4BackupPath = /\.(?:buildM4BackupEnvelope|validateAndMigrateM4Backup|simulateM4UserDataImport|buildBackup|validateBackup|importBackup)\s*\(/.test(source);
  const directHistoricalM4 = /block\("M4_COMBINED_BACKUP_MODEL"\)/.test(source);
  const hasCandidateClosure = source.includes("buildM4HarnessSource") && source.includes("loadVerifiedCandidateHtml");
  const hasFullCurrentClosure = source.includes('block("V004_C002_MIGRATION_MODEL")') && source.includes('block("V004_C003_REVISION_RESERVATION_MODEL")') && source.includes('block("V004_C004_ATOMIC_CRAFT_COMPLETE_MODEL")');
  if (executesM4BackupPath && directHistoricalM4 && !hasCandidateClosure && !hasFullCurrentClosure) {
    unresolved.push({ leafId, filename });
  }
  const extractsAffectedCraftModel = source.includes('block("V004_C004_ATOMIC_CRAFT_COMPLETE_MODEL")') ||
    source.includes('block("V004_C006_CRAFT_HISTORY_UNDO_MODEL")');
  const hasSnapshotSupport = /build(?:HistorySnapshotCardNormalizerSource|M4HarnessSource)\s*\(/.test(source) && source.includes("loadVerifiedCandidateHtml");
  if (extractsAffectedCraftModel && !hasSnapshotSupport) {
    unresolvedHistorySnapshotHarnesses.push({ leafId, filename });
  }
}
assert.deepEqual(unresolved, [], `Known release-harness dependency gaps remain: ${JSON.stringify(unresolved)}`);
assert.deepEqual(unresolvedHistorySnapshotHarnesses, [], `History snapshot release-harness dependency gaps remain: ${JSON.stringify(unresolvedHistorySnapshotHarnesses)}`);

const evidence = {
  cycle: "V004-C010",
  status: "PASS_M4_REMAINING_RELEASE_HARNESS_CLOSURE_AUDIT",
  candidateSha256: verified.sha256,
  candidateBytes: verified.bytes,
  candidateBinding: verified.binding,
  directM4Dependencies: V004_C0081_HARNESS_CONTRACT.directM4Dependencies,
  m4Closure: V004_C0081_HARNESS_CONTRACT.m4Closure,
  requiredRunnerCount: required.length,
  requiredLeaves: required.map(([leafId, filename]) => ({ leafId, filename })),
  currentSchema3FixtureCount: currentSchema3Files.size,
  legacyFixtureRegionsUnchanged: 9,
  copiedC0061Normalizers: 0,
  historySnapshotRunnerCount: historySnapshotRunners.length,
  historySnapshotRunners: historySnapshotRunners.map(([leafId, filename]) => ({ leafId, filename })),
  checkoutHtmlReleaseFallbacks: 0,
  unresolvedKnownReleaseHarnessDependencyGaps: unresolved.length + unresolvedHistorySnapshotHarnesses.length
};

const evidenceArgument = process.argv.find(argument => argument.startsWith("--evidence="));
if (evidenceArgument) {
  const evidencePath = path.resolve(projectDirectory, evidenceArgument.slice("--evidence=".length));
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

console.log("V004_C010_HARNESS_CLOSURE_AUDIT_PASS");
console.log(JSON.stringify({
  candidateSha256: verified.sha256,
  candidateBytes: verified.bytes,
  requiredRunnerCount: required.length,
  legacyFixtureRegionsUnchanged: evidence.legacyFixtureRegionsUnchanged,
  unresolvedKnownReleaseHarnessDependencyGaps: unresolved.length
}));
