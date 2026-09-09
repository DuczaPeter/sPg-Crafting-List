import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const fixturePath = path.join(projectDirectory, "tests", "fixtures", "v004-c002-v003-migration.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C002");
const evidencePath = path.join(artifactDirectory, "browser-evidence.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const appHtml = fs.readFileSync(appPath);
const moduleArgument = process.argv.find(value => value.startsWith("--playwright-module="));

async function loadPlaywright() {
  if (moduleArgument) {
    const modulePath = moduleArgument.slice("--playwright-module=".length);
    const imported = await import(pathToFileURL(path.resolve(modulePath)).href);
    return imported.default || imported;
  }
  try {
    const imported = await import("playwright");
    return imported.default || imported;
  } catch (error) {
    error.message = `PLAYWRIGHT_UNAVAILABLE: ${error.message}`;
    throw error;
  }
}

function startServer() {
  const server = http.createServer((request, response) => {
    if (request.url === "/app" || request.url === "/app/") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      response.end(appHtml);
      return;
    }
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    response.end("<!doctype html><meta charset=\"utf-8\"><title>V004 C002 seed</title>");
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        origin: `http://127.0.0.1:${address.port}`
      });
    });
  });
}

function closeServer(server) {
  return new Promise(resolve => server.close(resolve));
}

async function seedV003Database(page, userData) {
  await page.evaluate(async input => {
    const definitions = {
      userInventory: "id",
      materialBatches: "id",
      userLoadouts: "id",
      craftingCards: "id",
      settings: "key"
    };
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("spg-crafting-list", 4);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const [storeName, keyPath] of Object.entries(definitions)) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath });
          }
        }
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const stores = Object.keys(definitions);
        const transaction = db.transaction(stores, "readwrite");
        for (const record of input.userInventory) transaction.objectStore("userInventory").add(record);
        for (const record of input.materialBatches) transaction.objectStore("materialBatches").add(record);
        for (const record of input.miningLoadouts) transaction.objectStore("userLoadouts").add(record);
        for (const record of input.craftingCards) transaction.objectStore("craftingCards").add(record);
        for (const record of input.userSettings) transaction.objectStore("settings").add(record);
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error("V003 fixture seed aborted"));
      };
    });
  }, userData);
}

async function createTestPage(browser, origin, errors) {
  const context = await browser.newContext({ acceptDownloads: true });
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => false });
  });
  const page = await context.newPage();
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console:${message.text()}`);
  });
  page.on("pageerror", error => errors.push(`pageerror:${error.message}`));
  await page.goto(`${origin}/seed`, { waitUntil: "domcontentloaded" });
  await seedV003Database(page, fixture.userData);
  await page.goto(`${origin}/app`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.waitForFunction(() => document.body.dataset.v003MigrationStatus !== "CHECKING", null, { timeout: 15000 });
  return { context, page };
}

const playwright = await loadPlaywright();
const { server, origin } = await startServer();
let browser;
const errors = [];
const results = {
  cycle: "V004-C002",
  status: "PENDING",
  applicationSha256: crypto.createHash("sha256").update(appHtml).digest("hex"),
  browser: "Google Chrome",
  origin,
  startup: {},
  migration: {},
  atomicFailure: {},
  fileGate: { status: "DEFERRED" },
  applicationOriginConsoleErrors: errors
};

try {
  browser = await playwright.chromium.launch({ channel: "chrome", headless: true });
  const primary = await createTestPage(browser, origin, errors);
  const { context, page } = primary;

  const startup = await page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const stores = Array.from(test.database.db.objectStoreNames);
    const transaction = test.database.db.transaction(["craftHistory", "userMeta"], "readonly");
    const historyStore = transaction.objectStore("craftHistory");
    const metaStore = transaction.objectStore("userMeta");
    const meta = await test.database.getAll("userMeta");
    return {
      app: test.app,
      stores,
      historyKeyPath: historyStore.keyPath,
      metaKeyPath: metaStore.keyPath,
      historyIndexes: Array.from(historyStore.indexNames),
      meta,
      migrationStatus: document.body.dataset.v003MigrationStatus,
      migrationButtonDisabled: document.getElementById("v003MigrationStartButton").disabled,
      materialBatchCount: test.state.materialBatches.length,
      craftingCardCount: test.state.craftingCards.length,
      craftHistoryCount: test.state.craftHistory.length
    };
  });
  assert.equal(startup.app.version, "V004-dev");
  assert.equal(startup.app.schemaVersion, 7);
  assert.equal(startup.app.dbName, "spg-crafting-list-v004");
  assert.equal(startup.app.dbVersion, 1);
  assert.equal(startup.app.backupSchemaVersion, 3);
  for (const storeName of fixture.sourceDatabase.requiredStores.concat(["craftHistory", "userMeta"])) {
    assert.ok(startup.stores.includes(storeName), `Hiányzó V004 store: ${storeName}`);
  }
  assert.equal(startup.historyKeyPath, "craftTransactionId");
  assert.equal(startup.metaKeyPath, "key");
  assert.deepEqual(startup.historyIndexes.sort(), ["byCraftingCardAndSequence", "byCraftingCardStatusAndSequence", "byHistorySequence"]);
  assert.deepEqual(Object.fromEntries(startup.meta.map(record => [record.key, record.value])), fixture.revisionInitialization);
  assert.equal(startup.migrationStatus, "SOURCE_VALIDATED");
  assert.equal(startup.migrationButtonDisabled, true, "A migráció backup előtt engedélyezett.");
  assert.equal(startup.materialBatchCount, 0, "Startup automatikusan migrált material batch-et.");
  assert.equal(startup.craftingCardCount, 0, "Startup automatikusan migrált Crafting Cardot.");
  assert.equal(startup.craftHistoryCount, 0);
  results.startup = {
    status: "PASS",
    applicationVersion: startup.app.version,
    applicationSchemaVersion: startup.app.schemaVersion,
    databaseName: startup.app.dbName,
    databaseVersion: startup.app.dbVersion,
    storeCount: startup.stores.length,
    historyIndexes: startup.historyIndexes,
    revisionInitialization: fixture.revisionInitialization,
    automaticMigration: false
  };

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.waitForFunction(() => document.body.dataset.v003MigrationStatus !== "CHECKING", null, { timeout: 15000 });
  const refreshed = await page.evaluate(() => ({
    dbReady: window.__SPG_TEST__.state.dbReady,
    databaseName: window.__SPG_TEST__.database.db.name,
    databaseVersion: window.__SPG_TEST__.database.db.version,
    materialBatchCount: window.__SPG_TEST__.state.materialBatches.length,
    craftHistoryCount: window.__SPG_TEST__.state.craftHistory.length,
    migrationStatus: document.body.dataset.v003MigrationStatus
  }));
  assert.equal(refreshed.dbReady, true);
  assert.equal(refreshed.databaseName, "spg-crafting-list-v004");
  assert.equal(refreshed.databaseVersion, 1);
  assert.equal(refreshed.materialBatchCount, 0);
  assert.equal(refreshed.craftHistoryCount, 0);
  assert.equal(refreshed.migrationStatus, "SOURCE_VALIDATED");
  results.startup.refreshReopen = "PASS";

  await page.click("#dataSettingsNav");
  await page.waitForSelector("#v003BackupDownloadButton", { state: "visible" });
  fs.mkdirSync(artifactDirectory, { recursive: true });
  const screenshotPath = path.join(artifactDirectory, "chrome-data-settings.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  results.startup.dataSettingsScreenshot = path.relative(projectDirectory, screenshotPath);
  const sourceBefore = await page.evaluate(() => window.__SPG_TEST__.v004Migration.readSourceDatabase());
  await page.evaluate(() => {
    const createObjectUrl = URL.createObjectURL.bind(URL);
    URL.createObjectURL = blob => {
      window.__V004_C002_LAST_DOWNLOAD_BLOB__ = blob;
      return createObjectUrl(blob);
    };
  });
  await page.click("#v003BackupDownloadButton");
  await page.waitForFunction(() => document.body.dataset.v003MigrationBackupDownloaded === "true");
  const backup = await page.evaluate(async () => JSON.parse(await window.__V004_C002_LAST_DOWNLOAD_BLOB__.text()));
  assert.equal(backup.schemaVersion, 2);
  assert.equal(backup.sourceDatabase.accessMode, "READ_ONLY");
  assert.equal(backup.data.materialBatches.find(record => record.id === "batch-one-unit").quantityUnits, 1);
  assert.equal(backup.data.materialBatches.find(record => record.id === "batch-two-hundred-units").quantityUnits, 200);
  assert.equal(await page.isEnabled("#v003MigrationStartButton"), true);

  page.once("dialog", dialog => dialog.accept());
  await page.click("#v003MigrationStartButton");
  await page.waitForFunction(() => document.body.dataset.v003MigrationStatus === "SUCCESS", null, { timeout: 15000 });
  const migrationResult = await page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const target = await test.userDataRepository.readAllUserData();
    const sourceAfter = await test.v004Migration.readSourceDatabase();
    const fingerprint = await test.v004Migration.fingerprintSource(sourceAfter);
    let replayCode = null;
    try {
      await test.database.commitV003Migration(sourceAfter.userData, fingerprint);
    } catch (error) {
      replayCode = error.code;
    }
    const targetFingerprintBeforeChange = await test.userDataRepository.fingerprint();
    return { target, sourceAfter, fingerprint, replayCode, targetFingerprintBeforeChange };
  });
  assert.deepEqual(migrationResult.sourceAfter.userData, sourceBefore.userData, "A V003 source megváltozott a migráció során.");
  assert.deepEqual(migrationResult.target.materialBatches, fixture.userData.materialBatches.slice().sort((a, b) => a.id.localeCompare(b.id)));
  assert.equal(migrationResult.target.craftingCards[0].id, "card-alpha");
  assert.equal(migrationResult.target.craftingCards[0].order, 0);
  assert.equal(migrationResult.target.craftingCards[0].quantity, 21);
  assert.equal(migrationResult.target.craftHistory.length, 0);
  const ledger = migrationResult.target.userMeta.find(record => record.key === "migration:v003");
  assert.equal(ledger.status, "SUCCESS");
  assert.equal(ledger.fingerprint, migrationResult.fingerprint);
  assert.equal(migrationResult.replayCode, "V003_MIGRATION_ALREADY_APPLIED");

  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("spg-crafting-list");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("materialBatches", "readwrite");
        const store = transaction.objectStore("materialBatches");
        const get = store.get("batch-one-unit");
        get.onsuccess = () => {
          const record = get.result;
          record.quantityUnits += 1;
          store.put(record);
        };
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });
  await page.evaluate(() => window.__SPG_TEST__.v004Migration.inspectSource());
  const changedSourceResult = await page.evaluate(async () => ({
    status: document.body.dataset.v003MigrationStatus,
    code: document.body.dataset.v003MigrationError,
    targetFingerprint: await window.__SPG_TEST__.userDataRepository.fingerprint()
  }));
  assert.equal(changedSourceResult.status, "BLOCKED");
  assert.equal(changedSourceResult.code, "V003_SOURCE_CHANGED_AFTER_MIGRATION");
  assert.equal(changedSourceResult.targetFingerprint, migrationResult.targetFingerprintBeforeChange);
  results.migration = {
    status: "PASS",
    sourceAccess: sourceBefore.accessMode,
    sourceUnchangedAfterMigration: true,
    backupRequiredBeforeConfirmation: true,
    exactQuantityUnits: migrationResult.target.materialBatches.map(record => ({ id: record.id, quantityUnits: record.quantityUnits })),
    craftHistoryLength: migrationResult.target.craftHistory.length,
    replayCode: migrationResult.replayCode,
    changedSourceCode: changedSourceResult.code,
    targetUnchangedAfterChangedSource: true
  };
  await context.close();

  const failure = await createTestPage(browser, origin, errors);
  const failureResult = await failure.page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const source = test.state.v003Migration.source;
    const fingerprint = test.state.v003Migration.fingerprint;
    let failureCode = null;
    try {
      await test.database.commitV003Migration(source.userData, fingerprint, {
        simulateFailure: true,
        migratedAt: "2026-09-09T07:00:00.000Z"
      });
    } catch (error) {
      failureCode = error.code;
    }
    const sourceAfterFailure = await test.v004Migration.readSourceDatabase();
    const sourceFingerprintAfterFailure = await test.v004Migration.fingerprintSource(sourceAfterFailure);
    const targetAfterFailure = await test.database.readV004MigrationTargetData();
    await test.database.put("materialBatches", {
      id: "target-dirty",
      materialUuid: "material-dirty",
      materialName: "Dirty target",
      quality: 500,
      quantityUnits: 1,
      unit: "SCU"
    });
    const inspection = await test.v004Migration.inspectSource();
    return {
      failureCode,
      sourceUnchanged: sourceFingerprintAfterFailure === fingerprint,
      targetAfterFailure,
      nonPristineStatus: inspection.status,
      nonPristineCode: inspection.errorCode
    };
  });
  assert.equal(failureResult.failureCode, "SIMULATED_V003_MIGRATION_ABORT");
  assert.equal(failureResult.sourceUnchanged, true);
  assert.equal(failureResult.targetAfterFailure.materialBatches.length, 0);
  assert.equal(failureResult.targetAfterFailure.craftingCards.length, 0);
  assert.equal(failureResult.targetAfterFailure.craftHistory.length, 0);
  assert.equal(failureResult.targetAfterFailure.userMeta.some(record => record.key === "migration:v003"), false);
  assert.equal(failureResult.nonPristineStatus, "BLOCKED");
  assert.equal(failureResult.nonPristineCode, "V004_TARGET_NOT_PRISTINE");
  results.atomicFailure = {
    status: "PASS",
    failureCode: failureResult.failureCode,
    sourceUnchanged: failureResult.sourceUnchanged,
    partialUserData: false,
    successLedgerAfterFailure: false,
    nonPristineCode: failureResult.nonPristineCode
  };
  await failure.context.close();

  const fileErrors = [];
  try {
    const fileContext = await browser.newContext();
    await fileContext.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => false });
    });
    const filePage = await fileContext.newPage();
    filePage.on("console", message => {
      if (message.type() === "error") fileErrors.push(`console:${message.text()}`);
    });
    filePage.on("pageerror", error => fileErrors.push(`pageerror:${error.message}`));
    await filePage.goto(pathToFileURL(appPath).href, { waitUntil: "domcontentloaded" });
    await filePage.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
    const fileIdentity = await filePage.evaluate(async () => ({
      version: window.__SPG_TEST__.app.version,
      dbName: window.__SPG_TEST__.app.dbName,
      dbVersion: window.__SPG_TEST__.app.dbVersion,
      migrationStatus: document.body.dataset.v003MigrationStatus,
      sourceDbExists: (await indexedDB.databases()).some(entry => entry.name === "spg-crafting-list")
    }));
    assert.equal(fileIdentity.version, "V004-dev");
    assert.equal(fileIdentity.dbName, "spg-crafting-list-v004");
    assert.equal(fileIdentity.dbVersion, 1);
    assert.equal(fileIdentity.sourceDbExists, false, "A hiányzó V003 adatbázis véletlenül létrejött.");
    assert.equal(fileErrors.length, 0);
    results.fileGate = { status: "PASS_AUTOMATED", ...fileIdentity };
    await fileContext.close();
  } catch (error) {
    results.fileGate = { status: "DEFERRED", reason: error.message };
  }

  assert.equal(errors.length, 0, `Application-origin browser errors: ${errors.join(" | ")}`);
  results.status = "PASS_TARGETED_CHROME";
} finally {
  if (browser) await browser.close();
  await closeServer(server);
}

fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
console.log(`V004_C002_BROWSER_PASS fileGate=${results.fileGate.status} evidence=${path.relative(projectDirectory, evidencePath)}`);
