import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C014");
const evidencePath = path.join(artifactDirectory, "version-identity-evidence.json");
const baselineHead = "045bd8ce38dde5e2ef43999a038c4d835d644b9a";
const oldIdentity = "V003-dev";
const stableIdentity = "V003";

const appBuffer = fs.readFileSync(appPath);
const appHtml = appBuffer.toString("utf8");
const baselineBuffer = execFileSync("git", ["show", `${baselineHead}:sPg Crafting List.html`], {
  cwd: projectDirectory,
  encoding: null,
  maxBuffer: 2 * 1024 * 1024
});
const baselineHtml = baselineBuffer.toString("utf8");
const occurrenceCount = (text, token) => text.split(token).length - 1;
const sliceBetween = (text, start, end) => {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `Hiányzó kódblokk: ${start}`);
  return text.slice(from, to);
};

assert.equal(occurrenceCount(baselineHtml, oldIdentity), 3, "A release baseline nem pontosan három V003-dev runtime identityt tartalmaz.");
assert.equal(occurrenceCount(appHtml, oldIdentity), 0, "V003-dev runtime identity maradt a fő alkalmazásban.");
assert.equal(appHtml, baselineHtml.replaceAll(oldIdentity, stableIdentity), "A fő HTML a három engedélyezett identity-cserén kívül is módosult.");

assert.equal(occurrenceCount(appHtml, '<strong id="applicationStatus">V003</strong>'), 1);
assert.equal(occurrenceCount(appHtml, '<span id="footerRuntime">V003</span>'), 1);
assert.equal(occurrenceCount(appHtml, 'version: "V003"'), 1);

const environmentUi = sliceBetween(appHtml, "function updateEnvironmentUi()", "function renderBlueprintBrowserResults");
assert.match(environmentUi, /setText\("applicationStatus", APP\.version \+ " · schema " \+ APP\.schemaVersion\)/);
assert.match(environmentUi, /setText\("footerRuntime", APP\.version \+ " · cache schema " \+ APP\.cacheSchemaVersion\)/);

const backupBuilder = sliceBetween(appHtml, "function buildM4BackupEnvelope", "function validateAndMigrateM4Backup");
assert.match(backupBuilder, /applicationVersion: meta\.applicationVersion \|\| "unknown"/);
const backupExport = sliceBetween(appHtml, "async function exportUserDataBackup", "async function previewUserDataBackup");
assert.match(backupExport, /applicationVersion: APP\.version/);

const diagnosticLogger = sliceBetween(appHtml, "class DiagnosticLogger", "class AppDatabase");
assert.match(diagnosticLogger, /application:\s*\{[\s\S]*?version: APP\.version/);
assert.match(diagnosticLogger, /text\(stateSnapshot\)[\s\S]*?version: APP\.version/);

const scriptStart = appHtml.indexOf("<script>");
assert.ok(scriptStart > 0, "Hiányzik az inline JavaScript.");
const documentMarkup = appHtml.slice(0, scriptStart);
assert.match(documentMarkup, /<style\s+id="spgApplicationStyles"\s+data-source="embedded">[\s\S]+<\/style>/);
assert.doesNotMatch(documentMarkup, /<link[^>]+rel=["']stylesheet["']/i);
assert.doesNotMatch(documentMarkup, /<script[^>]+src=/i);
assert.doesNotMatch(documentMarkup, /<(?:img|source)[^>]+src=["'](?!data:)/i);

fs.mkdirSync(artifactDirectory, { recursive: true });
const evidence = {
  cycle: "V003-C014",
  status: "PASS_STATIC_VERSION_IDENTITY",
  baselineHead,
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  exactRepair: {
    baselineV003DevOccurrences: 3,
    currentV003DevOccurrences: 0,
    onlyThreeIdentityReplacements: true,
    applicationStatus: stableIdentity,
    footerRuntime: stableIdentity,
    appVersion: stableIdentity
  },
  propagation: {
    runtimeUiUsesAppVersion: true,
    backupApplicationVersionUsesAppVersion: true,
    diagnosticApplicationVersionUsesAppVersion: true
  },
  singleFile: {
    embeddedCss: true,
    embeddedJavaScript: true,
    localRuntimeSidecars: 0
  },
  fullHistoricalRegression: "NOT_RUN_BY_SCOPE",
  freshReleaseCandidate: "NOT_CREATED"
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V003_C014_STATIC_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
