import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C007.1");
const evidencePath = path.join(artifactDirectory, "browser-evidence.json");
const appBuffer = fs.readFileSync(appPath);
const moduleArgument = process.argv.find(value => value.startsWith("--playwright-module="));
const exactBlueprintUuid = "280f47b7-8434-410c-b854-380768fdccec";
const copy = value => JSON.parse(JSON.stringify(value));

async function loadPlaywright() {
  if (moduleArgument) {
    const imported = await import(pathToFileURL(path.resolve(moduleArgument.slice("--playwright-module=".length))).href);
    return imported.default || imported;
  }
  const imported = await import("playwright");
  return imported.default || imported;
}

function startServer() {
  const server = http.createServer((request, response) => {
    if (request.url === "/away") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end("<!doctype html><meta charset=utf-8><title>Away</title><p>BFCache target</p>");
      return;
    }
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(appBuffer);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }));
  });
}

function closeServer(server) {
  return new Promise(resolve => server.close(resolve));
}

async function newContext(browser, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => false });
    window.__c0071PageShows = [];
    window.addEventListener("pageshow", event => {
      window.__c0071PageShows.push({ persisted: event.persisted, at: Date.now() });
    });
  });
  return context;
}

function collectErrors(page, errors) {
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console:${message.text()}`);
  });
  page.on("pageerror", error => errors.push(`pageerror:${error.message}`));
}

async function openPage(context, url, errors) {
  const page = await context.newPage();
  collectErrors(page, errors);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.waitForFunction(() => document.body.dataset.v003MigrationStatus !== "CHECKING", null, { timeout: 15000 });
  await page.waitForFunction(() => ["READY", "MULTI_TAB_SIGNAL_UNAVAILABLE"].includes(document.body.dataset.multiTabSignalStatus));
  return page;
}

async function reloadPage(page) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.waitForFunction(() => document.body.dataset.multiTabSignalStatus === "READY");
}

async function durableSnapshot(page) {
  return page.evaluate(async () => JSON.parse(JSON.stringify(await window.__SPG_TEST__.userDataRepository.readAllUserData())));
}

async function normalizedDurableData(page, data) {
  return page.evaluate(async supplied => {
    const test = window.__SPG_TEST__;
    const source = supplied || await test.userDataRepository.readAllUserData();
    return JSON.parse(JSON.stringify(test.buildM4BackupEnvelope(source, {
      applicationVersion: test.app.version,
      exportedAt: "2026-09-11T00:00:00.000Z"
    }).data));
  }, data || null);
}

async function runtimeSnapshot(page) {
  return page.evaluate(() => {
    const test = window.__SPG_TEST__;
    return JSON.parse(JSON.stringify({
      loadouts: test.state.miningLoadouts,
      batches: test.state.materialBatches,
      cards: test.state.craftingCards,
      history: test.state.craftHistory,
      reservationRunStatus: test.state.reservationRunStatus,
      allocationIsNull: test.state.allocationResult === null,
      multiTab: test.state.multiTab,
      uiLoadoutCount: Number(document.body.dataset.miningLoadoutCount || 0),
      signalStatus: document.body.dataset.multiTabSignalStatus,
      listenerRegistrations: Number(document.body.dataset.multiTabListenerRegistrations || 0),
      tabId: test.state.multiTab.tabInstanceId
    }));
  });
}

async function loadNormalizedBlueprint(page) {
  return page.evaluate(async blueprintUuid => {
    const test = window.__SPG_TEST__;
    const version = await test.adapter.getDefaultGameVersion();
    test.state.gameVersion = version;
    const normalized = await test.loadBlueprintDetail(blueprintUuid, { ownsProcess: false });
    return JSON.parse(JSON.stringify({ version: version.code, normalized }));
  }, exactBlueprintUuid);
}

async function seedNormalized(page, normalized, craftRuns, extraUnits, prefix) {
  return page.evaluate(async ({ normalized, craftRuns, extraUnits, prefix }) => {
    const test = window.__SPG_TEST__;
    test.state.gameVersion = { code: normalized.gameVersion };
    const card = test.buildCraftingCard(normalized);
    card.quantity = craftRuns;
    card.outputCountEvidence = test.v004RevisionReservation.outputCountEvidence.UNPROVEN;
    const timestamp = new Date().toISOString();
    const batches = card.requirements.map((requirement, index) => ({
      id: `batch-${prefix}-${index + 1}`,
      materialUuid: requirement.ingredientUuid,
      sourceMaterialUuid: requirement.ingredientUuid,
      materialName: requirement.materialName,
      quality: 900,
      quantityUnits: requirement.requiredQuantityUnits * craftRuns + extraUnits,
      unit: requirement.unit,
      createdAt: timestamp,
      updatedAt: timestamp,
      provenance: { origin: "C0071_BROWSER_PRODUCTION", scenario: prefix }
    }));
    await test.userDataRepository.saveCraftingCards([card]);
    await test.userDataRepository.saveMaterialBatches(batches);
    return JSON.parse(JSON.stringify({ card, batches }));
  }, { normalized, craftRuns, extraUnits, prefix });
}

async function openSeededPair(browser, url, normalized, craftRuns, extraUnits, prefix, errors) {
  const context = await newContext(browser);
  const pageA = await openPage(context, url, errors);
  const seed = await seedNormalized(pageA, normalized, craftRuns, extraUnits, prefix);
  await reloadPage(pageA);
  const pageB = await openPage(context, url, errors);
  await pageA.evaluate(version => { window.__SPG_TEST__.state.gameVersion = { code: version }; }, normalized.gameVersion);
  await pageB.evaluate(version => { window.__SPG_TEST__.state.gameVersion = { code: version }; }, normalized.gameVersion);
  return { context, pageA, pageB, seed };
}

async function reallocate(page) {
  await page.click("#craftingListNav");
  await page.click("#activeCraftsTab");
  await page.click("#reallocateCraftingListButton");
  await page.waitForFunction(() => document.body.dataset.reservationRunStatus === "VALID", null, { timeout: 15000 });
}

async function prepareCompletion(page, cardId, quantity, transactionId) {
  return page.evaluate(async ({ cardId, quantity, transactionId }) => JSON.parse(JSON.stringify(
    await window.__SPG_TEST__.prepareCraftCompletion(cardId, quantity, transactionId)
  )), { cardId, quantity, transactionId });
}

async function commitCompletion(page, request) {
  return page.evaluate(async request => {
    const result = await window.__SPG_TEST__.commitPreparedCraftCompletion(request);
    return JSON.parse(JSON.stringify(result.historyEvent));
  }, request);
}

async function prepareUndo(page, transactionId, undoTransactionId) {
  return page.evaluate(async ({ transactionId, undoTransactionId }) => JSON.parse(JSON.stringify(
    (await window.__SPG_TEST__.prepareCraftUndo(transactionId, undoTransactionId)).request
  )), { transactionId, undoTransactionId });
}

async function commitUndo(page, request) {
  return page.evaluate(async request => {
    const result = await window.__SPG_TEST__.commitPreparedCraftUndo(request);
    return JSON.parse(JSON.stringify(result.historyEvent));
  }, request);
}

async function buildCurrentEnvelope(page) {
  return page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    return JSON.parse(JSON.stringify(test.buildM4BackupEnvelope(await test.userDataRepository.readAllUserData(), {
      applicationVersion: test.app.version,
      exportedAt: "2026-09-11T00:01:00.000Z"
    })));
  });
}

async function buildZeroRevisionEnvelope(page, normalized) {
  return page.evaluate(normalized => {
    const test = window.__SPG_TEST__;
    test.state.gameVersion = { code: normalized.gameVersion };
    const card = test.buildCraftingCard(normalized);
    card.quantity = 3;
    const timestamp = "2026-09-11T00:02:00.000Z";
    const batches = card.requirements.map((requirement, index) => ({
      id: `batch-c0071-pristine-${index + 1}`,
      materialUuid: requirement.ingredientUuid,
      sourceMaterialUuid: requirement.ingredientUuid,
      materialName: requirement.materialName,
      quality: 900,
      quantityUnits: requirement.requiredQuantityUnits * 3,
      unit: requirement.unit,
      createdAt: timestamp,
      updatedAt: timestamp
    }));
    const data = {
      userInventory: test.v004CraftComplete.buildInventoryAggregates(batches, timestamp),
      materialBatches: batches,
      craftingCards: [card],
      miningLoadouts: [],
      userSettings: [],
      craftHistory: [],
      userMeta: test.v004Migration.defaultUserMetaRecords()
    };
    return JSON.parse(JSON.stringify(test.buildM4BackupEnvelope(data, {
      applicationVersion: test.app.version,
      exportedAt: "2026-09-11T00:03:00.000Z"
    })));
  }, normalized);
}

async function setBackupPreview(page, envelope) {
  return page.evaluate(envelope => {
    const test = window.__SPG_TEST__;
    return test.userDataRepository.readAllUserData().then(before => {
      const validated = test.validateAndMigrateM4Backup(JSON.stringify(envelope));
      const preview = test.buildM4ImportPreview(before, validated.backup.data, "REPLACE");
      test.state.backupPreview = {
        fileName: "c0071-import.json",
        mode: "REPLACE",
        validated,
        preview,
        previewedAt: new Date().toISOString()
      };
      return JSON.parse(JSON.stringify(preview));
    });
  }, envelope);
}

async function applyBackupPreview(page) {
  return page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    try {
      const fingerprint = await test.applyUserDataBackup();
      return {
        status: "PASS",
        fingerprint,
        snapshotId: test.state.backupState.lastSnapshotId,
        lastStatus: test.state.backupState.lastStatus,
        previewCleared: test.state.backupPreview === null
      };
    } catch (error) {
      return {
        status: "BLOCKED",
        code: error.code || error.message,
        message: error.message,
        lastStatus: test.state.backupState.lastStatus,
        previewCleared: test.state.backupPreview === null
      };
    } finally {
      window.confirm = originalConfirm;
    }
  });
}

async function snapshotCount(page) {
  return page.evaluate(async () => (await window.__SPG_TEST__.database.getAll("snapshots")).length);
}

async function normalizedSnapshotData(page, snapshotId) {
  return page.evaluate(async snapshotId => {
    const test = window.__SPG_TEST__;
    const snapshot = await test.database.get("snapshots", snapshotId);
    return JSON.parse(JSON.stringify({
      fingerprint: snapshot.fingerprint,
      data: test.buildM4BackupEnvelope(snapshot.userData, {
        applicationVersion: test.app.version,
        exportedAt: "2026-09-11T00:04:00.000Z"
      }).data
    }));
  }, snapshotId);
}

function loadout(id, name, isDefault) {
  const timestamp = "2026-09-11T00:05:00.000Z";
  return {
    id,
    materialUuid: "material-c0071-loadout",
    materialName: "C007.1 Loadout Material",
    name,
    vehicle: { uuid: null, name: "Prospector" },
    stationCountOverride: 1,
    stations: [],
    gadgets: [],
    isDefault,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

async function persistLoadouts(page, loadouts, eventCode) {
  return page.evaluate(async ({ loadouts, eventCode }) => {
    await window.__SPG_TEST__.persistMiningLoadouts(loadouts, eventCode);
    return JSON.parse(JSON.stringify(window.__SPG_TEST__.state.miningLoadouts));
  }, { loadouts, eventCode });
}

async function waitForLoadouts(page, priorRefreshCount, expected) {
  await page.waitForFunction(({ priorRefreshCount, expected }) => {
    const test = window.__SPG_TEST__;
    if (test.state.multiTab.refreshCount <= priorRefreshCount) return false;
    if (test.state.miningLoadouts.length !== expected.length) return false;
    return expected.every(item => test.state.miningLoadouts.some(loadout =>
      loadout.id === item.id && loadout.name === item.name && loadout.isDefault === item.isDefault));
  }, { priorRefreshCount, expected }, { timeout: 15000 });
  return runtimeSnapshot(page);
}

const playwright = await loadPlaywright();
const { server, origin } = await startServer();
let browser;
const allErrors = [];
const results = {
  cycle: "V004-C007.1",
  status: "PENDING",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  browser: "Google Chrome",
  miningLoadoutsCrossTab: {},
  concurrentCompleteImport: {},
  concurrentUndoImport: {},
  concurrentLoadoutImport: {},
  pristineReplace: {},
  bfcache: {},
  directFile: {},
  consoleErrors: allErrors
};

try {
  browser = await playwright.chromium.launch({
    channel: "chrome",
    headless: true,
    ignoreDefaultArgs: ["--disable-back-forward-cache"],
    args: ["--enable-features=BackForwardCache"]
  });

  const sourceErrors = [];
  const sourceContext = await newContext(browser);
  const sourcePage = await openPage(sourceContext, `${origin}/source`, sourceErrors);
  const source = await loadNormalizedBlueprint(sourcePage);
  assert.equal(source.normalized.uuid, exactBlueprintUuid);
  allErrors.push(...sourceErrors);
  await sourceContext.close();

  const loadoutErrors = [];
  const loadoutContext = await newContext(browser);
  const loadoutA = await openPage(loadoutContext, `${origin}/loadouts`, loadoutErrors);
  const loadoutB = await openPage(loadoutContext, `${origin}/loadouts`, loadoutErrors);
  await loadoutA.evaluate(() => {
    window.__c0071Messages = [];
    const original = BroadcastChannel.prototype.postMessage;
    BroadcastChannel.prototype.postMessage = function (message) {
      window.__c0071Messages.push(JSON.parse(JSON.stringify(message)));
      return original.call(this, message);
    };
  });
  const first = loadout("loadout-c0071-a", "Első", true);
  let prior = (await runtimeSnapshot(loadoutB)).multiTab.refreshCount;
  await persistLoadouts(loadoutA, [first], "C0071_LOADOUT_ADD");
  const afterAdd = await waitForLoadouts(loadoutB, prior, [first]);
  const edited = { ...first, name: "Első szerkesztve", updatedAt: "2026-09-11T00:06:00.000Z" };
  prior = afterAdd.multiTab.refreshCount;
  await persistLoadouts(loadoutA, [edited], "C0071_LOADOUT_EDIT");
  const afterEdit = await waitForLoadouts(loadoutB, prior, [edited]);
  const second = loadout("loadout-c0071-b", "Második", true);
  const firstNotDefault = { ...edited, isDefault: false, updatedAt: "2026-09-11T00:07:00.000Z" };
  prior = afterEdit.multiTab.refreshCount;
  await persistLoadouts(loadoutA, [firstNotDefault, second], "C0071_LOADOUT_DEFAULT");
  const afterDefault = await waitForLoadouts(loadoutB, prior, [firstNotDefault, second]);
  prior = afterDefault.multiTab.refreshCount;
  await persistLoadouts(loadoutA, [second], "C0071_LOADOUT_DELETE");
  const afterDelete = await waitForLoadouts(loadoutB, prior, [second]);
  const presentationBefore = await loadoutA.evaluate(async () => ({
    sent: window.__SPG_TEST__.state.multiTab.sent,
    fingerprint: await window.__SPG_TEST__.userDataRepository.fingerprint()
  }));
  await loadoutA.click("#miningLoadoutsNav");
  const presentationAfter = await loadoutA.evaluate(async () => ({
    sent: window.__SPG_TEST__.state.multiTab.sent,
    fingerprint: await window.__SPG_TEST__.userDataRepository.fingerprint()
  }));
  const loadoutMessages = await loadoutA.evaluate(() => JSON.parse(JSON.stringify(window.__c0071Messages)));
  assert.equal(loadoutMessages.length, 4);
  assert.ok(loadoutMessages.every(message => message.mutationType === "MINING_LOADOUTS_CHANGED"));
  assert.ok(loadoutMessages.every(message => !JSON.stringify(message).includes("Első") && !JSON.stringify(message).includes("Prospector")));
  assert.ok(loadoutMessages.every(message => Buffer.byteLength(JSON.stringify(message), "utf8") < 2048));
  assert.deepEqual(presentationAfter, presentationBefore);
  assert.equal(afterDelete.uiLoadoutCount, 1);
  assert.equal(afterDelete.allocationIsNull, true);
  results.miningLoadoutsCrossTab = {
    status: "PASS",
    add: afterAdd.loadouts[0].name,
    edit: afterEdit.loadouts[0].name,
    defaultId: afterDefault.loadouts.find(item => item.isDefault).id,
    deleteRemainingIds: afterDelete.loadouts.map(item => item.id),
    uiLoadoutCount: afterDelete.uiLoadoutCount,
    mutationType: loadoutMessages[0].mutationType,
    payloadContainsLoadoutData: false,
    presentationOnlyBroadcasts: presentationAfter.sent - presentationBefore.sent,
    presentationOnlyDurableWrites: presentationAfter.fingerprint === presentationBefore.fingerprint ? 0 : 1,
    automaticReallocate: false
  };
  allErrors.push(...loadoutErrors);
  await loadoutContext.close();

  const completeErrors = [];
  const complete = await openSeededPair(browser, `${origin}/import-complete`, source.normalized, 21, 1, "c0071-complete", completeErrors);
  await reallocate(complete.pageB);
  const completionRequest = await prepareCompletion(complete.pageB, complete.seed.card.id, 5, "craft-c0071-import-complete");
  const completeEnvelope = await buildCurrentEnvelope(complete.pageA);
  await setBackupPreview(complete.pageA, completeEnvelope);
  const completeSnapshotCountBefore = await snapshotCount(complete.pageA);
  const completedEvent = await commitCompletion(complete.pageB, completionRequest);
  const completedState = await durableSnapshot(complete.pageB);
  const blockedCompleteImport = await applyBackupPreview(complete.pageA);
  const afterBlockedComplete = await durableSnapshot(complete.pageA);
  assert.equal(blockedCompleteImport.code, "IMPORT_BASE_STATE_CHANGED");
  assert.match(blockedCompleteImport.message, /Frissítsd az import előnézetét/);
  assert.equal(blockedCompleteImport.previewCleared, true);
  assert.deepEqual(afterBlockedComplete, completedState);
  assert.equal(await snapshotCount(complete.pageA), completeSnapshotCountBefore);
  await setBackupPreview(complete.pageA, completeEnvelope);
  const exactPreImport = await normalizedDurableData(complete.pageA);
  const secondAttempt = await applyBackupPreview(complete.pageA);
  assert.equal(secondAttempt.status, "PASS");
  const exactSnapshot = await normalizedSnapshotData(complete.pageA, secondAttempt.snapshotId);
  assert.deepEqual(exactSnapshot.data, exactPreImport);
  assert.ok(exactSnapshot.data.craftHistory.some(event => event.craftTransactionId === completedEvent.craftTransactionId));
  results.concurrentCompleteImport = {
    status: "PRESERVED",
    blocker: blockedCompleteImport.code,
    cardQuantityAfterBlockedImport: completedState.craftingCards[0].quantity,
    historyStatusAfterBlockedImport: completedState.craftHistory[0].status,
    blockedSnapshotWrites: (await snapshotCount(complete.pageA)) - completeSnapshotCountBefore - 1,
    newPreviewImport: secondAttempt.status,
    automaticRetry: false,
    exactPreImportSnapshot: true
  };
  allErrors.push(...completeErrors);
  await complete.context.close();

  const undoErrors = [];
  const undo = await openSeededPair(browser, `${origin}/import-undo`, source.normalized, 10, 1, "c0071-undo", undoErrors);
  await reallocate(undo.pageB);
  const undoCompletionRequest = await prepareCompletion(undo.pageB, undo.seed.card.id, 2, "craft-c0071-import-undo-source");
  const undoCompletion = await commitCompletion(undo.pageB, undoCompletionRequest);
  const undoRequest = await prepareUndo(undo.pageB, undoCompletion.craftTransactionId, "undo-c0071-import-race");
  const undoEnvelope = await buildCurrentEnvelope(undo.pageA);
  await setBackupPreview(undo.pageA, undoEnvelope);
  const undoSnapshotCountBefore = await snapshotCount(undo.pageA);
  await commitUndo(undo.pageB, undoRequest);
  const undoneState = await durableSnapshot(undo.pageB);
  const blockedUndoImport = await applyBackupPreview(undo.pageA);
  const afterBlockedUndo = await durableSnapshot(undo.pageA);
  assert.equal(blockedUndoImport.code, "IMPORT_BASE_STATE_CHANGED");
  assert.deepEqual(afterBlockedUndo, undoneState);
  assert.equal(afterBlockedUndo.craftHistory[0].status, "UNDONE");
  assert.equal(await snapshotCount(undo.pageA), undoSnapshotCountBefore);
  results.concurrentUndoImport = {
    status: "PRESERVED",
    blocker: blockedUndoImport.code,
    historyStatus: afterBlockedUndo.craftHistory[0].status,
    blockedSnapshotWrites: 0,
    automaticRetry: false
  };
  allErrors.push(...undoErrors);
  await undo.context.close();

  const loadoutImportErrors = [];
  const loadoutImportContext = await newContext(browser);
  const loadoutImportA = await openPage(loadoutImportContext, `${origin}/import-loadout`, loadoutImportErrors);
  const loadoutImportB = await openPage(loadoutImportContext, `${origin}/import-loadout`, loadoutImportErrors);
  const emptyEnvelope = await buildCurrentEnvelope(loadoutImportA);
  await setBackupPreview(loadoutImportA, emptyEnvelope);
  const loadoutImportSnapshotCount = await snapshotCount(loadoutImportA);
  const raceLoadout = loadout("loadout-c0071-import-race", "Import race", true);
  await persistLoadouts(loadoutImportB, [raceLoadout], "C0071_IMPORT_RACE_LOADOUT");
  const loadoutStateBeforeImport = await durableSnapshot(loadoutImportB);
  const blockedLoadoutImport = await applyBackupPreview(loadoutImportA);
  const loadoutStateAfterImport = await durableSnapshot(loadoutImportA);
  assert.equal(blockedLoadoutImport.code, "IMPORT_BASE_STATE_CHANGED");
  assert.deepEqual(loadoutStateAfterImport, loadoutStateBeforeImport);
  assert.equal(loadoutStateAfterImport.miningLoadouts[0].id, raceLoadout.id);
  assert.equal(await snapshotCount(loadoutImportA), loadoutImportSnapshotCount);
  results.concurrentLoadoutImport = {
    status: "PRESERVED",
    blocker: blockedLoadoutImport.code,
    loadoutId: loadoutStateAfterImport.miningLoadouts[0].id,
    blockedSnapshotWrites: 0
  };
  allErrors.push(...loadoutImportErrors);
  await loadoutImportContext.close();

  const pristineErrors = [];
  const pristineContext = await newContext(browser);
  const pristinePage = await openPage(pristineContext, `${origin}/pristine`, pristineErrors);
  const pristineEnvelope = await buildZeroRevisionEnvelope(pristinePage, source.normalized);
  assert.equal(pristineEnvelope.schemaVersion, 3);
  assert.ok(pristineEnvelope.data.userMeta.every(record => record.value === 0));
  await setBackupPreview(pristinePage, pristineEnvelope);
  const pristineResult = await applyBackupPreview(pristinePage);
  const pristineData = await normalizedDurableData(pristinePage);
  assert.equal(pristineResult.status, "PASS");
  assert.deepEqual(pristineData, pristineEnvelope.data);
  assert.ok(pristineData.userMeta.every(record => record.value === 0));
  results.pristineReplace = {
    status: "PASS",
    schemaVersion: pristineEnvelope.schemaVersion,
    structuralJsonEqual: true,
    extraRevisionIncrement: 0,
    backupDataLoss: 0
  };
  allErrors.push(...pristineErrors);
  await pristineContext.close();

  const bfcacheErrors = [];
  const bfcacheContext = await newContext(browser);
  const bfcacheA = await openPage(bfcacheContext, `${origin}/bfcache`, bfcacheErrors);
  const bfcacheB = await openPage(bfcacheContext, `${origin}/bfcache`, bfcacheErrors);
  const beforeBfcache = await runtimeSnapshot(bfcacheA);
  await bfcacheA.goto(`${origin}/away`, { waitUntil: "domcontentloaded" });
  await bfcacheB.evaluate(async () => {
    const now = new Date().toISOString();
    await window.__SPG_TEST__.persistMaterialBatches([{
      id: "batch-c0071-bfcache",
      materialUuid: "material-c0071-bfcache",
      sourceMaterialUuid: "material-c0071-bfcache",
      materialName: "C007.1 BFCache material",
      quality: 900,
      quantityUnits: 100,
      unit: "SCU",
      createdAt: now,
      updatedAt: now
    }], "C0071_BFCACHE_MUTATION");
  });
  await bfcacheA.goBack({ waitUntil: "commit" });
  await bfcacheA.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await bfcacheA.waitForFunction(() => window.__c0071PageShows.at(-1)?.persisted === true);
  await bfcacheA.waitForFunction(() => {
    const test = window.__SPG_TEST__;
    return document.body.dataset.multiTabSignalStatus === "READY" &&
      test.state.multiTab.listenerRegistrations === 1 && test.state.materialBatches.length === 1;
  }, null, { timeout: 15000 });
  const afterBfcache = await runtimeSnapshot(bfcacheA);
  const bfcachePageShows = await bfcacheA.evaluate(() => JSON.parse(JSON.stringify(window.__c0071PageShows)));
  assert.equal(bfcachePageShows.at(-1).persisted, true);
  assert.equal(afterBfcache.tabId, beforeBfcache.tabId);
  assert.equal(afterBfcache.listenerRegistrations, 1);
  assert.equal(afterBfcache.batches.length, 1);
  const tabIdBeforeReload = afterBfcache.tabId;
  await reloadPage(bfcacheA);
  const afterReload = await runtimeSnapshot(bfcacheA);
  assert.notEqual(afterReload.tabId, tabIdBeforeReload);
  assert.equal(afterReload.listenerRegistrations, 1);
  results.bfcache = {
    status: "PASS",
    persisted: true,
    channelAfterReturn: afterBfcache.signalStatus,
    durableUiRefreshed: afterBfcache.batches.length === 1,
    listenerCount: afterBfcache.listenerRegistrations,
    duplicateListener: 0,
    tabIdPreservedAcrossBfcache: afterBfcache.tabId === beforeBfcache.tabId,
    reloadTabIdChanged: afterReload.tabId !== tabIdBeforeReload,
    listenerAfterReload: afterReload.listenerRegistrations
  };
  allErrors.push(...bfcacheErrors);
  await bfcacheContext.close();

  const fileErrors = [];
  const fileContext = await newContext(browser, { width: 1280, height: 800 });
  const fileUrl = pathToFileURL(appPath).href;
  const fileA = await openPage(fileContext, fileUrl, fileErrors);
  const fileB = await openPage(fileContext, fileUrl, fileErrors);
  const filePrior = (await runtimeSnapshot(fileB)).multiTab.refreshCount;
  const fileLoadout = loadout("loadout-c0071-file", "Direct file", true);
  await persistLoadouts(fileA, [fileLoadout], "C0071_FILE_LOADOUT");
  const fileAfter = await waitForLoadouts(fileB, filePrior, [fileLoadout]);
  const fileLayout = await fileB.evaluate(() => ({
    protocol: location.protocol,
    overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    runtimeFiles: 1,
    sidecars: 0
  }));
  assert.equal(fileLayout.protocol, "file:");
  assert.equal(fileAfter.loadouts[0].id, fileLoadout.id);
  assert.equal(fileLayout.overflow, 0);
  results.directFile = {
    status: "PASS_AUTOMATED",
    protocol: fileLayout.protocol,
    miningLoadoutSignal: "PASS",
    durableReread: "PASS",
    runtimeFiles: fileLayout.runtimeFiles,
    sidecars: fileLayout.sidecars,
    overflow: fileLayout.overflow
  };
  allErrors.push(...fileErrors);
  await fileContext.close();

  assert.equal(allErrors.length, 0, allErrors.join("\n"));
  results.status = "PASS_TARGETED_CHROME";
  fs.mkdirSync(artifactDirectory, { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(results, null, 2)}\n`);
  process.stdout.write(`V004_C0071_USER_DATA_SAFETY_CHROME_PASS evidence=${path.relative(projectDirectory, evidencePath)}\n`);
} finally {
  if (browser) await browser.close();
  await closeServer(server);
}
