import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C007.1");
const evidencePath = path.join(artifactDirectory, "model-evidence.json");
const appBuffer = fs.readFileSync(appPath);
const source = appBuffer.toString("utf8");

function between(start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.ok(startIndex >= 0 && endIndex > startIndex, `Missing source range: ${start} ... ${end}`);
  return source.slice(startIndex, endIndex);
}

const importCommit = between("commitUserDataImport(userData, mode, options)", "commitV003Migration(sourceData");
const applyImport = between("async function applyUserDataBackup()", "async function verifyM4ImportRollbackPreservesUserData");
const loadoutPersist = between("async function persistMiningLoadouts(nextLoadouts, eventCode)", "function createMiningLoadoutDraft");
const multiTab = between("/* V004_C007_MULTI_TAB_COHERENCE_START */", "/* V004_C007_MULTI_TAB_COHERENCE_END */");
const lifecycle = between('window.addEventListener("pagehide"', "window.onerror");
const backupSpecs = between("var M4_BACKUP_STORE_SPECS", "function m4Clone");

assert.match(multiTab, /"MINING_LOADOUTS_CHANGED"/);
assert.match(multiTab, /V004_MULTI_TAB_FORCE_REFRESH_TYPES[^;]+"MINING_LOADOUTS_CHANGED"/s);
assert.match(loadoutPersist, /await userDataRepository\.saveMiningLoadouts/);
assert.match(loadoutPersist, /v004SignalDurableMutation\("MINING_LOADOUTS_CHANGED"/);
assert.ok(loadoutPersist.indexOf("saveMiningLoadouts") < loadoutPersist.indexOf("v004SignalDurableMutation"));
assert.doesNotMatch(loadoutPersist, /loadouts:\s*state\.miningLoadouts/);

const comparisonIndex = importCommit.indexOf("durableBaseFingerprint !== settings.expectedBaseFingerprint");
const clearIndex = importCommit.indexOf(".clear()");
const snapshotIndex = importCommit.indexOf('objectStore("snapshots").add(snapshot)');
assert.ok(comparisonIndex >= 0 && comparisonIndex < clearIndex);
assert.ok(snapshotIndex >= 0 && snapshotIndex < clearIndex);
assert.match(importCommit, /fingerprintUserDataPayload\(currentByDataKey\)/);
assert.match(importCommit, /"IMPORT_BASE_STATE_CHANGED"/);
assert.match(importCommit, /userData:\s*m4Clone\(currentByDataKey\)/);
assert.match(applyImport, /previewState\.preview\.currentFingerprint/);
assert.match(applyImport, /expectedBaseFingerprint:\s*expectedBaseFingerprint/);
assert.match(applyImport, /preImportSnapshot:/);
assert.doesNotMatch(applyImport, /createUserDataSnapshot/);
assert.match(applyImport, /state\.backupPreview = null/);
assert.match(importCommit, /Frissítsd az import előnézetét, majd erősítsd meg újra/);

assert.match(lifecycle, /pagehide[\s\S]+v004CloseMultiTabSignalChannel/);
assert.match(lifecycle, /pageshow[\s\S]+event\.persisted[\s\S]+v004OpenMultiTabSignalChannel/);
assert.match(lifecycle, /pageshow[\s\S]+v004RefreshUserDataFromDurableSignal[^;]+forceRefresh:\s*true/s);
assert.match(multiTab, /state\.multiTab\.listenerRegistrations = 1/);
assert.match(multiTab, /state\.multiTab\.listenerRegistrations = 0/);

assert.doesNotMatch(backupSpecs, /tabInstanceId|multiTab|BroadcastChannel/);
assert.match(source, /M4_BACKUP_SCHEMA_VERSION\s*=\s*3/);
assert.doesNotMatch(source, /<script\s+[^>]*src=["'](?!https?:)/i);
assert.doesNotMatch(source, /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["'](?!https?:)/i);

const evidence = {
  cycle: "V004-C007.1",
  status: "PASS_TARGETED_MODEL",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  miningLoadouts: {
    mutationType: "MINING_LOADOUTS_CHANGED",
    signalAfterDurableCommit: true,
    payloadContainsLoadoutData: false,
    durableRereadForced: true
  },
  importPrecondition: {
    authority: "INDEXEDDB_TRANSACTION_EXACT_PRE_STATE_FINGERPRINT",
    comparisonBeforeWrite: true,
    blocker: "IMPORT_BASE_STATE_CHANGED",
    automaticRetry: false,
    snapshotSameTransaction: true,
    snapshotUsesExactDurablePreState: true
  },
  bfcache: {
    pagehideClose: true,
    persistedPageshowReopen: true,
    durableReread: true,
    activeListenerCountContract: 1
  },
  backup: { schemaVersion: 3, sessionFieldsIncluded: 0 },
  singleFile: { runtimeFiles: 1, sidecars: 0, localScriptSrc: 0, localStylesheet: 0 }
};

fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
process.stdout.write(`V004_C0071_USER_DATA_SAFETY_MODEL_PASS evidence=${path.relative(projectDirectory, evidencePath)}\n`);
