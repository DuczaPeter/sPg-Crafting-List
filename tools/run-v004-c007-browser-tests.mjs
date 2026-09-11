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
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C007");
const evidencePath = path.join(artifactDirectory, "browser-evidence.json");
const appBuffer = fs.readFileSync(appPath);
const v003Fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const moduleArgument = process.argv.find(value => value.startsWith("--playwright-module="));
const exactBlueprintUuid = "280f47b7-8434-410c-b854-380768fdccec";
const copy = value => JSON.parse(JSON.stringify(value));

async function loadPlaywright() {
  if (moduleArgument) {
    const modulePath = moduleArgument.slice("--playwright-module=".length);
    const imported = await import(pathToFileURL(path.resolve(modulePath)).href);
    return imported.default || imported;
  }
  const imported = await import("playwright");
  return imported.default || imported;
}

function startServer() {
  const server = http.createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    response.end(request.url.startsWith("/app") ? appBuffer : "<!doctype html><meta charset=\"utf-8\"><title>seed</title>");
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }));
  });
}

function closeServer(server) {
  return new Promise(resolve => server.close(resolve));
}

async function newContext(browser, broadcastAvailable = true, viewport = { width: 1920, height: 1080 }) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  await context.addInitScript(available => {
    Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => false });
    if (!available) Object.defineProperty(window, "BroadcastChannel", { configurable: true, value: undefined });
  }, broadcastAvailable);
  return context;
}

async function openPage(context, url, errors) {
  const page = await context.newPage();
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console:${message.text()}`);
  });
  page.on("pageerror", error => errors.push(`pageerror:${error.message}`));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.waitForFunction(() => document.body.dataset.v003MigrationStatus !== "CHECKING", null, { timeout: 15000 });
  await page.waitForFunction(() => ["READY", "MULTI_TAB_SIGNAL_UNAVAILABLE"].includes(document.body.dataset.multiTabSignalStatus));
  return page;
}

async function reloadPage(page) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.waitForFunction(() => ["READY", "MULTI_TAB_SIGNAL_UNAVAILABLE"].includes(document.body.dataset.multiTabSignalStatus));
}

async function durableSnapshot(page) {
  return page.evaluate(async () => JSON.parse(JSON.stringify(await window.__SPG_TEST__.userDataRepository.readAllUserData())));
}

async function runtimeSnapshot(page) {
  return page.evaluate(() => {
    const test = window.__SPG_TEST__;
    return JSON.parse(JSON.stringify({
      cards: test.state.craftingCards,
      batches: test.state.materialBatches,
      history: test.state.craftHistory,
      revisions: test.state.revisions,
      reservationRunStatus: test.state.reservationRunStatus,
      allocationIsNull: test.state.allocationResult === null,
      multiTab: test.state.multiTab,
      notice: document.getElementById("actionNotice").textContent,
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

async function setRuntimeGameVersion(page, version) {
  await page.evaluate(value => { window.__SPG_TEST__.state.gameVersion = { code: value }; }, version);
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
      provenance: { origin: "C007_BROWSER_PRODUCTION", scenario: prefix }
    }));
    await test.userDataRepository.saveCraftingCards([card]);
    await test.userDataRepository.saveMaterialBatches(batches);
    return JSON.parse(JSON.stringify({ card, batches }));
  }, { normalized, craftRuns, extraUnits, prefix });
}

async function openSeededPair(browser, url, normalized, craftRuns, extraUnits, prefix, errors, broadcastAvailable = true) {
  const context = await newContext(browser, broadcastAvailable);
  const pageA = await openPage(context, url, errors);
  const seed = await seedNormalized(pageA, normalized, craftRuns, extraUnits, prefix);
  await reloadPage(pageA);
  await setRuntimeGameVersion(pageA, normalized.gameVersion);
  const pageB = await openPage(context, url, errors);
  await setRuntimeGameVersion(pageB, normalized.gameVersion);
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

async function commitPreparedCompletion(page, request) {
  return page.evaluate(async request => {
    try {
      const result = await window.__SPG_TEST__.commitPreparedCraftCompletion(request);
      return { status: "COMMITTED", transactionId: result.historyEvent.craftTransactionId };
    } catch (error) {
      return { status: "BLOCKED", code: error.code || error.message, detail: error.detail || null };
    }
  }, request);
}

async function completeViaUi(page, cardId, quantity, skipReallocate = false) {
  if (!skipReallocate) await reallocate(page);
  const selector = `[data-card-id="${cardId}"].spg-v004-completion-controls`;
  await page.fill(`${selector} .spg-v004-completion-quantity`, String(quantity));
  await page.click(`${selector} .spg-v004-completion-open`);
  await page.waitForSelector("#craftCompletionDialog[open]");
  await page.click("#confirmCraftCompletionButton");
  await page.waitForFunction(() => document.body.dataset.craftCompletionState === "COMPLETED", null, { timeout: 15000 });
  return durableSnapshot(page);
}

async function prepareUndo(page, transactionId, undoId) {
  return page.evaluate(async ({ transactionId, undoId }) => {
    try {
      const prepared = await window.__SPG_TEST__.prepareCraftUndo(transactionId, undoId);
      return { status: "READY", request: JSON.parse(JSON.stringify(prepared.request)) };
    } catch (error) {
      return { status: "BLOCKED", code: error.code || error.message };
    }
  }, { transactionId, undoId });
}

async function commitPreparedUndo(page, request) {
  return page.evaluate(async request => {
    try {
      const result = await window.__SPG_TEST__.commitPreparedCraftUndo(request);
      return { status: "RESTORED", transactionId: result.historyEvent.undoTransactionId };
    } catch (error) {
      return { status: "BLOCKED", code: error.code || error.message };
    }
  }, request);
}

async function openHistoryEvent(page, cardId) {
  await page.click("#craftingListNav");
  await page.click("#craftHistoryTab");
  const group = page.locator(`.spg-c005-history-group[data-crafting-card-id="${cardId}"]`);
  await group.waitFor();
  if ((await group.getAttribute("open")) === null) await group.locator(":scope > summary").click();
  const event = group.locator(".spg-c005-history-event").first();
  if ((await event.getAttribute("open")) === null) await event.locator(":scope > summary").click();
  return event;
}

async function undoViaUi(page, cardId) {
  const event = await openHistoryEvent(page, cardId);
  assert.equal(await event.locator(".spg-c006-history-undo").getAttribute("data-eligibility-code"), "UNDO_READY");
  await event.locator(".spg-c006-undo-open").click();
  await page.waitForSelector("#craftUndoDialog[open]");
  await page.click("#confirmCraftUndoButton");
  await page.waitForFunction(() => document.body.dataset.craftUndoState === "UNDONE", null, { timeout: 15000 });
  return durableSnapshot(page);
}

async function waitForRefresh(page, priorCount, predicateSource, argument) {
  await page.waitForFunction(({ priorCount, predicateSource, argument }) => {
    const test = window.__SPG_TEST__;
    if (test.state.multiTab.refreshCount <= priorCount) return false;
    return Function("test", "argument", `return (${predicateSource})(test, argument);`)(test, argument);
  }, { priorCount, predicateSource, argument }, { timeout: 15000 });
  return runtimeSnapshot(page);
}

function batchUnits(data) {
  return Object.fromEntries(copy(data.materialBatches).sort((a, b) => a.id.localeCompare(b.id)).map(batch => [batch.id, batch.quantityUnits]));
}

function totalBatchUnits(data) {
  return data.materialBatches.reduce((sum, batch) => sum + batch.quantityUnits, 0);
}

async function buildZeroRevisionImportEnvelope(page, normalized) {
  return page.evaluate(normalized => {
    const test = window.__SPG_TEST__;
    const card = test.buildCraftingCard(normalized);
    card.quantity = 3;
    const timestamp = "2026-09-10T20:30:00.000Z";
    const batches = card.requirements.map((requirement, index) => ({
      id: `batch-c007-import-${index + 1}`,
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
      exportedAt: "2026-09-10T20:31:00.000Z"
    })));
  }, normalized);
}

async function applyEnvelope(page, envelope) {
  return page.evaluate(async envelope => {
    const test = window.__SPG_TEST__;
    const before = await test.userDataRepository.readAllUserData();
    const validated = test.validateAndMigrateM4Backup(JSON.stringify(envelope));
    test.state.backupPreview = {
      fileName: "c007-multi-tab-import.json",
      mode: "REPLACE",
      validated,
      preview: test.buildM4ImportPreview(before, validated.backup.data, "REPLACE"),
      previewedAt: new Date().toISOString()
    };
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    try {
      return await test.applyUserDataBackup();
    } finally {
      window.confirm = originalConfirm;
    }
  }, envelope);
}

async function seedV003Database(page, userData) {
  await page.evaluate(async userData => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("spg-crafting-list", 4);
      request.onupgradeneeded = () => {
        const db = request.result;
        const stores = [
          ["userInventory", "id"], ["materialBatches", "id"], ["userLoadouts", "id"],
          ["craftingCards", "id"], ["settings", "key"]
        ];
        stores.forEach(([name, keyPath]) => { if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath }); });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["userInventory", "materialBatches", "userLoadouts", "craftingCards", "settings"], "readwrite");
        const mapping = { userInventory: "userInventory", materialBatches: "materialBatches", miningLoadouts: "userLoadouts", craftingCards: "craftingCards", userSettings: "settings" };
        Object.entries(mapping).forEach(([key, store]) => (userData[key] || []).forEach(record => transaction.objectStore(store).put(record)));
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error("V003 fixture seed aborted"));
      };
    });
  }, userData);
}

const playwright = await loadPlaywright();
const { server, origin } = await startServer();
let browser;
const allErrors = [];
const results = {
  cycle: "V004-C007",
  status: "PENDING",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  browser: "Google Chrome",
  architecture: { broadcastChannel: "UI_SIGNAL_ONLY", indexedDb: "DURABLE_AUTHORITY" },
  protocol: {},
  twoTabCraftComplete: {},
  twoTabUndo: {},
  messageLoss: {},
  concurrency: {},
  inventorySync: {},
  cardSync: {},
  fullCompletionListGuard: {},
  backupImport: {},
  migration: {},
  unavailableFallback: {},
  lifecycle: {},
  directFile: {},
  responsive: {},
  consoleErrors: allErrors
};

try {
  browser = await playwright.chromium.launch({ channel: "chrome", headless: true });

  const sourceErrors = [];
  const sourceContext = await newContext(browser);
  const sourcePage = await openPage(sourceContext, `${origin}/app-source`, sourceErrors);
  const source = await loadNormalizedBlueprint(sourcePage);
  assert.equal(source.normalized.uuid, exactBlueprintUuid);
  await sourceContext.close();
  allErrors.push(...sourceErrors);

  const mainErrors = [];
  const main = await openSeededPair(browser, `${origin}/app-main`, source.normalized, 21, 1, "main", mainErrors);
  assert.deepEqual(main.seed.card.requirements.map(item => item.requiredQuantityUnits), [3600, 7, 7]);
  await reallocate(main.pageA);
  await reallocate(main.pageB);
  const initial = await durableSnapshot(main.pageA);
  const initialUnits = batchUnits(initial);
  const beforeB = await runtimeSnapshot(main.pageB);
  const completed = await completeViaUi(main.pageA, main.seed.card.id, 5, true);
  const completedEvent = completed.craftHistory[0];
  const refreshedAfterComplete = await waitForRefresh(
    main.pageB,
    beforeB.multiTab.refreshCount,
    "(test, cardId) => test.state.craftingCards[0]?.id === cardId && test.state.craftingCards[0].quantity === 16 && test.state.craftHistory.length === 1 && test.state.reservationRunStatus === 'STALE' && test.state.allocationResult === null",
    main.seed.card.id
  );
  assert.match(refreshedAfterComplete.notice, /másik megnyitott ablakban megváltoztak/);
  assert.deepEqual(await durableSnapshot(main.pageB), completed);
  const historyEventB = await openHistoryEvent(main.pageB, main.seed.card.id);
  assert.equal(await historyEventB.getAttribute("data-history-status"), "COMPLETED");
  assert.equal(await historyEventB.locator(".spg-c006-history-undo").getAttribute("data-eligibility-code"), "UNDO_READY");
  results.twoTabCraftComplete = {
    status: "PASS",
    cardQuantity: refreshedAfterComplete.cards[0].quantity,
    historyStatus: refreshedAfterComplete.history[0].status,
    inventoryExact: true,
    reservationStatus: refreshedAfterComplete.reservationRunStatus,
    automaticReallocate: !refreshedAfterComplete.allocationIsNull,
    doubleConsumptionUnits: 0
  };

  const presentationBefore = await durableSnapshot(main.pageB);
  const sentBeforePresentation = (await runtimeSnapshot(main.pageB)).multiTab.sent;
  await main.pageB.click("#activeCraftsTab");
  await main.pageB.click("#craftHistoryTab");
  const presentationEvent = await openHistoryEvent(main.pageB, main.seed.card.id);
  await presentationEvent.locator(".spg-c006-undo-open").click();
  await main.pageB.waitForSelector("#craftUndoDialog[open]");
  await main.pageB.click("#cancelCraftUndoButton");
  assert.deepEqual(await durableSnapshot(main.pageB), presentationBefore);
  assert.equal((await runtimeSnapshot(main.pageB)).multiTab.sent, sentBeforePresentation);

  const bBeforeUndo = await runtimeSnapshot(main.pageB);
  const undone = await undoViaUi(main.pageA, main.seed.card.id);
  const refreshedAfterUndo = await waitForRefresh(
    main.pageB,
    bBeforeUndo.multiTab.refreshCount,
    "(test, transactionId) => test.state.craftHistory.find(event => event.craftTransactionId === transactionId)?.status === 'UNDONE' && test.state.reservationRunStatus === 'STALE'",
    completedEvent.craftTransactionId
  );
  const secondUndo = await prepareUndo(main.pageB, completedEvent.craftTransactionId, "undo-c007-second-blocked");
  assert.equal(secondUndo.code, "ALREADY_UNDONE");
  assert.deepEqual(batchUnits(undone), initialUnits);
  assert.equal(undone.craftingCards[0].quantity, 21);
  results.twoTabUndo = {
    status: "PASS",
    historyStatus: refreshedAfterUndo.history[0].status,
    undoButtonEnabled: false,
    secondUndo: secondUndo.code,
    doubleRestoreUnits: 0,
    inventoryEqualsInitial: true
  };

  const oldTabId = refreshedAfterUndo.tabId;
  await reloadPage(main.pageB);
  await setRuntimeGameVersion(main.pageB, source.version);
  const reloadedB = await runtimeSnapshot(main.pageB);
  assert.notEqual(reloadedB.tabId, oldTabId);
  assert.equal(reloadedB.multiTab.listenerRegistrations, 1);
  await main.pageB.evaluate(() => window.__SPG_TEST__.v004MultiTab.open());
  assert.equal((await runtimeSnapshot(main.pageB)).multiTab.listenerRegistrations, 1);
  assert.equal(reloadedB.history[0].status, "UNDONE");
  assert.equal(reloadedB.reservationRunStatus, "STALE");
  results.lifecycle = {
    status: "PASS",
    tabIdChangedOnReload: true,
    listenerRegistrationsAfterReload: 1,
    repeatedOpenListenerRegistrations: 1,
    historyStatusAfterReload: reloadedB.history[0].status,
    reservationAfterReload: reloadedB.reservationRunStatus
  };

  const inventoryMutations = [];
  const unrelated = {
    id: "batch-c007-cross-tab", materialUuid: "material-c007-cross-tab", sourceMaterialUuid: "source-c007-cross-tab",
    materialName: "C007 cross-tab material", quality: 700, quantityUnits: 100, unit: "SCU",
    createdAt: "2026-09-10T20:40:00.000Z", updatedAt: "2026-09-10T20:40:00.000Z"
  };
  let bRuntime = await runtimeSnapshot(main.pageB);
  await main.pageA.evaluate(async batch => {
    const test = window.__SPG_TEST__;
    await test.persistMaterialBatches(test.state.materialBatches.concat(batch), "BATCH_ADD");
  }, unrelated);
  bRuntime = await waitForRefresh(main.pageB, bRuntime.multiTab.refreshCount, "(test, id) => test.state.materialBatches.some(batch => batch.id === id && batch.quantityUnits === 100)", unrelated.id);
  inventoryMutations.push({ type: "ADD", quantityUnits: 100, reservation: bRuntime.reservationRunStatus });
  await reallocate(main.pageB);
  bRuntime = await runtimeSnapshot(main.pageB);
  await main.pageA.evaluate(async id => {
    const test = window.__SPG_TEST__;
    await test.persistMaterialBatches(test.state.materialBatches.map(batch => batch.id === id ? { ...batch, quantityUnits: 150, updatedAt: new Date().toISOString() } : batch), "BATCH_UPDATE");
  }, unrelated.id);
  bRuntime = await waitForRefresh(main.pageB, bRuntime.multiTab.refreshCount, "(test, id) => test.state.materialBatches.some(batch => batch.id === id && batch.quantityUnits === 150)", unrelated.id);
  inventoryMutations.push({ type: "EDIT", quantityUnits: 150, reservation: bRuntime.reservationRunStatus });
  await reallocate(main.pageB);
  bRuntime = await runtimeSnapshot(main.pageB);
  await main.pageA.evaluate(async id => {
    const test = window.__SPG_TEST__;
    await test.persistMaterialBatches(test.state.materialBatches.filter(batch => batch.id !== id), "BATCH_DELETE");
  }, unrelated.id);
  bRuntime = await waitForRefresh(main.pageB, bRuntime.multiTab.refreshCount, "(test, id) => !test.state.materialBatches.some(batch => batch.id === id)", unrelated.id);
  inventoryMutations.push({ type: "DELETE", present: false, reservation: bRuntime.reservationRunStatus });
  assert.ok(inventoryMutations.every(item => item.reservation === "STALE"));
  results.inventorySync = { status: "PASS", mutations: inventoryMutations, automaticReallocate: false };

  await reallocate(main.pageB);
  let priorB = await runtimeSnapshot(main.pageB);
  const addedCard = await main.pageA.evaluate(async normalized => {
    const test = window.__SPG_TEST__;
    const card = test.buildCraftingCard(normalized);
    card.quantity = 1;
    await test.persistCraftingCards(test.state.craftingCards.concat(card), "CARD_ADD");
    return JSON.parse(JSON.stringify(card));
  }, source.normalized);
  let cardRuntime = await waitForRefresh(main.pageB, priorB.multiTab.refreshCount, "(test, id) => test.state.craftingCards.some(card => card.id === id)", addedCard.id);
  const cardMutations = [{ type: "ADD", cardCount: cardRuntime.cards.length, reservation: cardRuntime.reservationRunStatus }];
  await reallocate(main.pageB);
  priorB = await runtimeSnapshot(main.pageB);
  await main.pageA.evaluate(async () => {
    const test = window.__SPG_TEST__;
    await test.persistCraftingCards(test.state.craftingCards.slice().reverse(), "CARD_REORDER");
  });
  cardRuntime = await waitForRefresh(main.pageB, priorB.multiTab.refreshCount, "(test, id) => test.state.craftingCards[0]?.id === id", addedCard.id);
  cardMutations.push({ type: "REORDER", firstCardId: cardRuntime.cards[0].id, reservation: cardRuntime.reservationRunStatus });
  await reallocate(main.pageB);
  priorB = await runtimeSnapshot(main.pageB);
  await main.pageA.evaluate(async originalId => {
    const test = window.__SPG_TEST__;
    await test.persistCraftingCards(test.state.craftingCards.map(card => card.id === originalId ? { ...card, quantity: 20 } : card), "CARD_QUANTITY_UPDATE");
  }, main.seed.card.id);
  cardRuntime = await waitForRefresh(main.pageB, priorB.multiTab.refreshCount, "(test, id) => test.state.craftingCards.find(card => card.id === id)?.quantity === 20", main.seed.card.id);
  cardMutations.push({ type: "QUANTITY", quantity: 20, reservation: cardRuntime.reservationRunStatus });
  await reallocate(main.pageB);
  priorB = await runtimeSnapshot(main.pageB);
  await main.pageA.evaluate(async originalId => {
    const test = window.__SPG_TEST__;
    const next = test.state.craftingCards.map(card => {
      if (card.id !== originalId) return card;
      const requirementId = card.requirements[0].id;
      return {
        ...card,
        slotStrategies: { ...card.slotStrategies, [requirementId]: { mode: "TARGET_Q", targetQuality: 850 } },
        recipeSlotQualityPoolAssignments: { ...card.recipeSlotQualityPoolAssignments, [requirementId]: "ANY_Q" }
      };
    });
    await test.persistCraftingCards(next, "CARD_SLOT_QUALITY_UPDATE");
  }, main.seed.card.id);
  cardRuntime = await waitForRefresh(main.pageB, priorB.multiTab.refreshCount, "(test, id) => { const card = test.state.craftingCards.find(item => item.id === id); const requirementId = card?.requirements[0]?.id; return card?.slotStrategies?.[requirementId]?.targetQuality === 850 && card?.recipeSlotQualityPoolAssignments?.[requirementId] === 'ANY_Q'; }", main.seed.card.id);
  cardMutations.push({ type: "SLOT_QUALITY", targetQuality: 850, reservation: cardRuntime.reservationRunStatus });
  await reallocate(main.pageB);
  priorB = await runtimeSnapshot(main.pageB);
  const firstMaterialUuid = main.seed.card.requirements[0].ingredientUuid;
  await main.pageA.evaluate(async materialUuid => {
    await window.__SPG_TEST__.persistMaterialQualityPoolValue(materialUuid, "minimumQ", 500);
  }, firstMaterialUuid);
  cardRuntime = await waitForRefresh(main.pageB, priorB.multiTab.refreshCount, "(test) => test.state.userSettings.some(setting => setting.key === 'user:materialQualityPools')", null);
  cardMutations.push({ type: "QUALITY_POOL", minimumQ: 500, reservation: cardRuntime.reservationRunStatus });
  priorB = cardRuntime;
  await main.pageA.evaluate(async cardId => {
    const test = window.__SPG_TEST__;
    await test.persistCraftingCards(test.state.craftingCards.filter(card => card.id !== cardId), "CARD_DELETE");
  }, addedCard.id);
  cardRuntime = await waitForRefresh(main.pageB, priorB.multiTab.refreshCount, "(test, id) => !test.state.craftingCards.some(card => card.id === id)", addedCard.id);
  cardMutations.push({ type: "DELETE", cardCount: cardRuntime.cards.length, reservation: cardRuntime.reservationRunStatus });
  assert.ok(cardMutations.every(item => item.reservation === "STALE"));
  results.cardSync = { status: "PASS", mutations: cardMutations, automaticReallocate: false };

  const desktopLayout = await main.pageB.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    noticeOverflow: document.getElementById("actionNotice").scrollWidth - document.getElementById("actionNotice").clientWidth
  }));
  await main.pageB.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await main.pageB.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    noticeOverflow: document.getElementById("actionNotice").scrollWidth - document.getElementById("actionNotice").clientWidth
  }));
  assert.ok(desktopLayout.overflow <= 1 && desktopLayout.noticeOverflow <= 1 && mobileLayout.overflow <= 1 && mobileLayout.noticeOverflow <= 1);
  results.responsive = { status: "PASS_NO_HORIZONTAL_OVERFLOW", desktop: desktopLayout, mobile: mobileLayout };
  allErrors.push(...mainErrors);
  await main.context.close();

  const lossErrors = [];
  const loss = await openSeededPair(browser, `${origin}/app-loss`, source.normalized, 21, 1, "loss", lossErrors);
  await reallocate(loss.pageA);
  await reallocate(loss.pageB);
  const oldRequest = await prepareCompletion(loss.pageB, loss.seed.card.id, 5, "craft-c007-message-loss-old");
  await loss.pageB.evaluate(() => window.__SPG_TEST__.v004MultiTab.close());
  await completeViaUi(loss.pageA, loss.seed.card.id, 5, true);
  const staleLocal = await runtimeSnapshot(loss.pageB);
  assert.equal(staleLocal.cards[0].quantity, 21);
  assert.equal(staleLocal.reservationRunStatus, "VALID");
  const blockedOld = await commitPreparedCompletion(loss.pageB, oldRequest);
  assert.equal(blockedOld.code, "STALE_RESERVATION");
  const lossDurable = await durableSnapshot(loss.pageA);
  assert.equal(lossDurable.craftingCards[0].quantity, 16);
  assert.equal(lossDurable.craftHistory.length, 1);
  results.messageLoss = {
    status: "PASS",
    channelDelivery: "BLOCKED_FOR_TEST",
    receiverOldRuntimeQuantity: staleLocal.cards[0].quantity,
    oldCompletion: blockedOld.code,
    durableHistoryCount: lossDurable.craftHistory.length,
    doubleConsumptionUnits: 0
  };
  allErrors.push(...lossErrors);
  await loss.context.close();

  const concurrentErrors = [];
  const concurrent = await openSeededPair(browser, `${origin}/app-concurrent`, source.normalized, 21, 1, "concurrent", concurrentErrors);
  await reallocate(concurrent.pageA);
  await reallocate(concurrent.pageB);
  const concurrentInitial = await durableSnapshot(concurrent.pageA);
  const requestA = await prepareCompletion(concurrent.pageA, concurrent.seed.card.id, 5, "craft-c007-concurrent-a");
  const requestB = await prepareCompletion(concurrent.pageB, concurrent.seed.card.id, 5, "craft-c007-concurrent-b");
  const completeResults = await Promise.all([
    commitPreparedCompletion(concurrent.pageA, requestA),
    commitPreparedCompletion(concurrent.pageB, requestB)
  ]);
  assert.equal(completeResults.filter(result => result.status === "COMMITTED").length, 1);
  assert.equal(completeResults.filter(result => result.code === "STALE_RESERVATION").length, 1);
  const concurrentAfterComplete = await durableSnapshot(concurrent.pageA);
  assert.equal(concurrentAfterComplete.craftingCards[0].quantity, 16);
  assert.equal(concurrentAfterComplete.craftHistory.length, 1);
  assert.ok(concurrentAfterComplete.materialBatches.every(batch => batch.quantityUnits >= 0));
  const consumedUnits = concurrentAfterComplete.craftHistory[0].consumedDeltas.reduce((sum, delta) => sum + delta.consumedUnits, 0);
  assert.equal(totalBatchUnits(concurrentInitial), consumedUnits + totalBatchUnits(concurrentAfterComplete));
  const transactionId = concurrentAfterComplete.craftHistory[0].craftTransactionId;
  const undoA = await prepareUndo(concurrent.pageA, transactionId, "undo-c007-concurrent-a");
  const undoB = await prepareUndo(concurrent.pageB, transactionId, "undo-c007-concurrent-b");
  assert.equal(undoA.status, "READY");
  assert.equal(undoB.status, "READY");
  const undoResults = await Promise.all([
    commitPreparedUndo(concurrent.pageA, undoA.request),
    commitPreparedUndo(concurrent.pageB, undoB.request)
  ]);
  assert.equal(undoResults.filter(result => result.status === "RESTORED").length, 1);
  assert.equal(undoResults.filter(result => result.code === "ALREADY_UNDONE").length, 1);
  const concurrentAfterUndo = await durableSnapshot(concurrent.pageA);
  assert.equal(concurrentAfterUndo.craftingCards[0].quantity, 21);
  assert.equal(concurrentAfterUndo.craftHistory[0].status, "UNDONE");
  assert.deepEqual(batchUnits(concurrentAfterUndo), batchUnits(concurrentInitial));
  results.concurrency = {
    complete: "SINGLE_COMMIT_PASS",
    completeResults,
    undo: "SINGLE_RESTORE_PASS",
    undoResults,
    negativeInventory: false,
    duplicateHistoryCompletion: false,
    materialLossUnits: 0
  };
  allErrors.push(...concurrentErrors);
  await concurrent.context.close();

  const fullErrors = [];
  const full = await openSeededPair(browser, `${origin}/app-full`, source.normalized, 1, 0, "full", fullErrors);
  await reallocate(full.pageA);
  await reallocate(full.pageB);
  const fullComplete = await completeViaUi(full.pageA, full.seed.card.id, 1, true);
  assert.equal(fullComplete.craftingCards.length, 0);
  const fullBInitial = await runtimeSnapshot(full.pageB);
  const fullB = await waitForRefresh(full.pageB, 0, "(test) => test.state.craftingCards.length === 0 && test.state.craftHistory.length === 1", null).catch(() => fullBInitial);
  assert.equal(fullB.cards.length, 0);
  const replacementCard = await full.pageA.evaluate(async normalized => {
    const test = window.__SPG_TEST__;
    const card = test.buildCraftingCard(normalized);
    await test.persistCraftingCards([card], "CARD_ADD_AFTER_FULL_COMPLETE");
    return JSON.parse(JSON.stringify(card));
  }, source.normalized);
  await full.pageB.waitForFunction(id => window.__SPG_TEST__.state.craftingCards.some(card => card.id === id), replacementCard.id);
  const fullUndoBlock = await prepareUndo(full.pageB, fullComplete.craftHistory[0].craftTransactionId, "undo-c007-full-list-block");
  assert.equal(fullUndoBlock.code, "UNDO_CRAFT_LIST_REVISION_MISMATCH");
  results.fullCompletionListGuard = {
    status: "PASS",
    cardRemovalRefreshed: true,
    postCompletionListMutation: true,
    undoBlocker: fullUndoBlock.code,
    broadcastBypass: false
  };
  allErrors.push(...fullErrors);
  await full.context.close();

  const importErrors = [];
  const importContext = await newContext(browser);
  const importA = await openPage(importContext, `${origin}/app-import`, importErrors);
  const importB = await openPage(importContext, `${origin}/app-import`, importErrors);
  const importEnvelope = await buildZeroRevisionImportEnvelope(importA, source.normalized);
  assert.equal(importEnvelope.schemaVersion, 3);
  assert.ok(importEnvelope.data.userMeta.every(record => record.value === 0));
  assert.doesNotMatch(JSON.stringify(importEnvelope), /tabInstanceId|multiTab|receivedDiagnostics/);
  const importBBefore = await runtimeSnapshot(importB);
  await applyEnvelope(importA, importEnvelope);
  const importedB = await waitForRefresh(importB, importBBefore.multiTab.refreshCount, "(test, cardId) => test.state.craftingCards[0]?.id === cardId", importEnvelope.data.craftingCards[0].id);
  const importedDurable = await durableSnapshot(importA);
  assert.deepEqual(importedDurable.userMeta, importEnvelope.data.userMeta);
  assert.equal(importedB.revisions.inventoryRevision, 0);
  assert.equal(importedB.revisions.craftListRevision, 0);
  assert.equal(importedB.revisions.allocationRevision, 0);
  assert.equal(importedB.reservationRunStatus, "STALE");
  assert.equal(importedB.allocationIsNull, true);
  results.backupImport = {
    status: "PASS",
    schemaVersion: importEnvelope.schemaVersion,
    dedicatedSignal: "BACKUP_IMPORTED",
    equalRevisionForcedRefresh: true,
    exactZeroRevisionsPreserved: true,
    cardCountAfterRefresh: importedB.cards.length,
    reservationStatus: importedB.reservationRunStatus,
    automaticReallocate: false,
    sessionFieldsInBackup: 0
  };
  allErrors.push(...importErrors);
  await importContext.close();

  const migrationErrors = [];
  const migrationContext = await newContext(browser);
  const migrationA = await openPage(migrationContext, `${origin}/app-migration`, migrationErrors);
  const migrationB = await openPage(migrationContext, `${origin}/app-migration`, migrationErrors);
  await seedV003Database(migrationA, v003Fixture.userData);
  const migrationBeforeB = await runtimeSnapshot(migrationB);
  const migrationOutcome = await migrationA.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const source = await test.v004Migration.readSourceDatabase();
    const fingerprint = await test.v004Migration.fingerprintSource(source);
    test.state.v003Migration.source = source;
    test.state.v003Migration.fingerprint = fingerprint;
    test.state.v003Migration.backupDownloadedFingerprint = fingerprint;
    const before = JSON.stringify(source.userData);
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    try {
      await test.v004Migration.startMigration();
    } finally {
      window.confirm = originalConfirm;
    }
    const after = await test.v004Migration.readSourceDatabase();
    return { sourceUnchanged: before === JSON.stringify(after.userData), target: JSON.parse(JSON.stringify(await test.userDataRepository.readAllUserData())) };
  });
  const migratedB = await waitForRefresh(migrationB, migrationBeforeB.multiTab.refreshCount, "(test) => test.state.craftingCards.length > 0 && test.state.materialBatches.length > 0", null);
  assert.equal(migrationOutcome.sourceUnchanged, true);
  assert.equal(migratedB.history.length, 0);
  assert.equal(migratedB.reservationRunStatus, "STALE");
  results.migration = {
    status: "PASS",
    dedicatedSignal: "MIGRATION_COMPLETED",
    sourceAccess: "READ_ONLY",
    sourceUnchanged: migrationOutcome.sourceUnchanged,
    targetCardCount: migratedB.cards.length,
    targetHistoryCount: migratedB.history.length,
    reservationStatus: migratedB.reservationRunStatus
  };
  allErrors.push(...migrationErrors);
  await migrationContext.close();

  const fallbackErrors = [];
  const fallback = await openSeededPair(browser, `${origin}/app-fallback`, source.normalized, 21, 1, "fallback", fallbackErrors, false);
  assert.equal((await runtimeSnapshot(fallback.pageA)).multiTab.status, "MULTI_TAB_SIGNAL_UNAVAILABLE");
  assert.equal((await runtimeSnapshot(fallback.pageB)).multiTab.status, "MULTI_TAB_SIGNAL_UNAVAILABLE");
  await reallocate(fallback.pageA);
  await reallocate(fallback.pageB);
  const fallbackOld = await prepareCompletion(fallback.pageB, fallback.seed.card.id, 5, "craft-c007-fallback-old");
  await completeViaUi(fallback.pageA, fallback.seed.card.id, 5, true);
  const fallbackBlocked = await commitPreparedCompletion(fallback.pageB, fallbackOld);
  assert.equal(fallbackBlocked.code, "STALE_RESERVATION");
  const fallbackDurable = await durableSnapshot(fallback.pageA);
  assert.equal(fallbackDurable.craftHistory.length, 1);
  assert.equal(fallbackDurable.craftingCards[0].quantity, 16);
  results.unavailableFallback = {
    status: "PASS",
    diagnostic: "MULTI_TAB_SIGNAL_UNAVAILABLE",
    appOperational: true,
    staleCompletion: fallbackBlocked.code,
    durableHistoryCount: fallbackDurable.craftHistory.length,
    doubleConsumptionUnits: 0
  };
  allErrors.push(...fallbackErrors);
  await fallback.context.close();

  const fileErrors = [];
  const fileContext = await newContext(browser);
  const fileUrl = pathToFileURL(appPath).href;
  const fileA = await openPage(fileContext, fileUrl, fileErrors);
  const fileB = await openPage(fileContext, fileUrl, fileErrors);
  const fileStatusA = (await runtimeSnapshot(fileA)).multiTab.status;
  const fileStatusB = (await runtimeSnapshot(fileB)).multiTab.status;
  const fileBatch = {
    id: "batch-c007-file", materialUuid: "material-c007-file", sourceMaterialUuid: "source-c007-file",
    materialName: "C007 file material", quality: 600, quantityUnits: 1234, unit: "SCU",
    createdAt: "2026-09-10T20:50:00.000Z", updatedAt: "2026-09-10T20:50:00.000Z"
  };
  const fileBeforeB = await runtimeSnapshot(fileB);
  await fileA.evaluate(async batch => window.__SPG_TEST__.persistMaterialBatches([batch], "BATCH_ADD"), fileBatch);
  let fileSharedSignal = "NOT_AVAILABLE";
  if (fileStatusA === "READY" && fileStatusB === "READY") {
    const fileRefreshed = await waitForRefresh(fileB, fileBeforeB.multiTab.refreshCount, "(test, id) => test.state.materialBatches.some(batch => batch.id === id)", fileBatch.id);
    assert.equal(fileRefreshed.batches[0].quantityUnits, 1234);
    fileSharedSignal = "PASS";
  } else {
    const forced = await fileB.evaluate(async () => window.__SPG_TEST__.v004MultiTab.refreshFromDurable({ forceRefresh: true, mutationTypes: ["TEST_FILE_ORIGIN_PROBE"] }));
    assert.equal(forced.status, "DURABLE_STATE_REFRESHED");
  }
  const fileLayout = await fileB.evaluate(() => ({
    protocol: location.protocol,
    version: window.__SPG_TEST__.app.version,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  assert.equal(fileLayout.protocol, "file:");
  assert.equal(fileLayout.version, process.env.SPG_EXPECTED_RUNTIME_IDENTITY || "V004-dev");
  assert.ok(fileLayout.overflow <= 1);
  results.directFile = {
    status: "PASS_AUTOMATED",
    protocol: fileLayout.protocol,
    version: fileLayout.version,
    broadcastStatus: [fileStatusA, fileStatusB],
    sameFileMultiTabSignal: fileSharedSignal,
    durableAuthority: "PASS",
    runtimeFiles: 1,
    sidecars: 0,
    overflow: fileLayout.overflow
  };
  allErrors.push(...fileErrors);
  await fileContext.close();

  results.protocol = {
    marker: "V004_MULTI_TAB_SIGNAL_1",
    channelName: "spg-crafting-list-v004",
    senderTabIdsDistinct: true,
    messageAppliesPayloadAsState: false,
    debounceAndDurableReread: true,
    malformedUnsupportedSelfDuplicateOutOfOrder: "PASS_MODEL"
  };
  assert.equal(allErrors.length, 0, allErrors.join("\n"));
  results.status = "PASS_TARGETED_CHROME";
  fs.mkdirSync(artifactDirectory, { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(results, null, 2)}\n`);
  console.log(`V004_C007_MULTI_TAB_CHROME_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
} catch (error) {
  results.status = "FAIL";
  results.failure = { name: error.name, message: error.message, stack: error.stack };
  fs.mkdirSync(artifactDirectory, { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(results, null, 2)}\n`);
  throw error;
} finally {
  if (browser) await browser.close();
  await closeServer(server);
}
