import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildM1HarnessSource,
  loadVerifiedCandidateHtml,
  V004_C0081_HARNESS_CONTRACT
} from "./v004-c0081-harness-loader.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const expectedSha256 = "7ac2c27bc7a35f719f4a4526e6839f8460a51e2ab6d881e1a95c3ed16f58b050";
const expectedBytes = 1083258;
const candidatePath = path.join(projectDirectory, "test-artifacts", "V004-C008", "fresh-release-candidate", "sPg Crafting List V004 RC.html");
const validatorPath = path.join(toolsDirectory, "validate-v004-c008-release-candidate.ps1");
const affected = Object.freeze([
  ["m1-model-cache", "run-m1-tests.mjs"],
  ["m2-inventory-allocation", "run-m2-tests.mjs"],
  ["m6-standalone-export", "run-m6-tests.mjs"],
  ["v003-c006-final-card", "run-v003-c006-tests.mjs"],
  ["v003-c007-color", "run-v003-c007-tests.mjs"],
  ["v003-c008-detail", "run-v003-c008-tests.mjs"],
  ["v003-c011-visual-cleanup", "run-v003-c011-tests.mjs"],
  ["v003-c0121-quality-planner", "run-v003-c0121-tests.mjs"],
  ["v003-c0122-version-consistency", "run-v003-c0122-tests.mjs"],
  ["v003-c0123-quality-constraints", "run-v003-c0123-tests.mjs"]
]);

const verified = loadVerifiedCandidateHtml({ candidatePath, expectedSha256, expectedBytes });
const m1HarnessSource = buildM1HarnessSource(verified.html);
assert.ok(m1HarnessSource.includes("function normalizeBlueprint(raw, provenance)"), "A candidate-bound M1 normalizáló hiányzik.");
assert.ok(m1HarnessSource.includes("function v004BuildExactRequirementQuantityEvidence(sourceValue, unit)"), "Az exact-quantity helper hiányzik.");

const validatorSource = fs.readFileSync(validatorPath, "utf8");
assert.doesNotMatch(validatorSource, /candidate-raw-byte-build/, "A C008 validator nem regenerálhatja a frozen candidate-et.");
for (const required of [
  "SPG_V004_RELEASE_CANDIDATE_MODE",
  "SPG_V004_VERIFIED_CANDIDATE_PATH",
  "SPG_V004_VERIFIED_CANDIDATE_SHA256",
  "SPG_V004_VERIFIED_CANDIDATE_BYTES"
]) {
  assert.match(validatorSource, new RegExp(required), `A validator candidate bindingje hiányzik: ${required}`);
}

const configuredNodeRunners = new Map(Array.from(
  validatorSource.matchAll(/^\s*'([^']+)'\s*=\s*@\{\s*Executable\s*=\s*'node';\s*Arguments\s*=\s*@\('\.\\tools\\([^']+\.mjs)'/gm),
  (match) => [match[1], match[2]]
));
const affectedFiles = new Set(affected.map(([, filename]) => filename));
const unresolved = [];
for (const [leafId, filename] of configuredNodeRunners) {
  const runnerPath = path.join(toolsDirectory, filename);
  const source = fs.readFileSync(runnerPath, "utf8");
  const referencesM1 = source.includes("M1_PURE_MODEL") || source.includes("buildM1HarnessSource");
  const dereferencesNormalizer = /normalizeBlueprint\s*\(/.test(source);
  const hasCurrentC003Closure = source.includes('block("V004_C003_REVISION_RESERVATION_MODEL")');
  const usesSharedLoader = source.includes("buildM1HarnessSource") && source.includes("loadVerifiedCandidateHtml");
  if (referencesM1 && dereferencesNormalizer && !hasCurrentC003Closure && !usesSharedLoader) {
    unresolved.push({ leafId, filename });
  }
}
assert.deepEqual(unresolved, [], `Nem javított candidate M1 harness maradt: ${JSON.stringify(unresolved)}`);

for (const [leafId, filename] of affected) {
  assert.equal(configuredNodeRunners.get(leafId), filename, `A release leaf/runner mapping eltér: ${leafId}`);
  const source = fs.readFileSync(path.join(toolsDirectory, filename), "utf8");
  assert.match(source, /from "\.\/v004-c0081-harness-loader\.mjs"/, `${filename}: shared loader import hiányzik.`);
  assert.match(source, /loadVerifiedCandidateHtml\s*\(/, `${filename}: verified candidate load hiányzik.`);
  assert.match(source, /buildM1HarnessSource\s*\(/, `${filename}: candidate-bound M1 prelude hiányzik.`);
  assert.doesNotMatch(source, /block\("M1_PURE_MODEL"\)|M1_PURE_MODEL_START/, `${filename}: régi közvetlen M1 extraction maradt.`);
  assert.doesNotMatch(source, /readFileSync\([^\r\n]*sPg Crafting List\.html[^\r\n]*utf8/, `${filename}: checkout HTML közvetlen olvasás maradt.`);
}

const evidence = {
  cycle: "V004-C008.1",
  status: "PASS_HARNESS_DEPENDENCY_AND_WIRING_AUDIT",
  candidateSha256: verified.sha256,
  candidateBytes: verified.bytes,
  candidateBinding: verified.binding,
  directM1Dependencies: V004_C0081_HARNESS_CONTRACT.directDependencies,
  exactQuantityClosure: V004_C0081_HARNESS_CONTRACT.quantityClosure,
  affectedLeafCount: affected.length,
  affectedLeaves: affected.map(([leafId, filename]) => ({ leafId, filename })),
  unresolvedAffectedHarnesses: unresolved.length,
  checkoutHtmlReleaseFallbacks: 0,
  fullTenLeafPreRunRequired: false
};

const evidenceArgument = process.argv.find((argument) => argument.startsWith("--evidence="));
if (evidenceArgument) {
  const evidencePath = path.resolve(projectDirectory, evidenceArgument.slice("--evidence=".length));
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

console.log("V004_C0081_HARNESS_AUDIT_PASS");
console.log(JSON.stringify({
  candidateSha256: verified.sha256,
  candidateBytes: verified.bytes,
  affectedLeafCount: affected.length,
  unresolvedAffectedHarnesses: unresolved.length,
  checkoutHtmlReleaseFallbacks: 0
}));
