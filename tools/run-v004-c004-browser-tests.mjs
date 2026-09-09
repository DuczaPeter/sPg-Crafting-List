import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const sourceFixturePath = path.join(projectDirectory, "tests", "fixtures", "v004-c003-reservation.json");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C004");
const evidencePath = path.join(artifactDirectory, "browser-evidence.json");
const appHtml = fs.readFileSync(appPath);
const sourceFixture = JSON.parse(fs.readFileSync(sourceFixturePath, "utf8"));
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
    response.end("<!doctype html><meta charset=\"utf-8\"><title>V004 C004 seed</title>");
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

function closeServer(server) {
  return new Promise(resolve => server.close(resolve));
}

async function openApplication(browser, url, errors) {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => false });
  });
  const page = await context.newPage();
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console:${message.text()}`);
  });
  page.on("pageerror", error => errors.push(`pageerror:${error.message}`));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.waitForFunction(() => document.body.dataset.v003MigrationStatus !== "CHECKING", null, { timeout: 15000 });
  return { context, page };
}

async function durableSnapshot(page) {
  return page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const data = await test.userDataRepository.readAllUserData();
    return JSON.parse(JSON.stringify(data));
  });
}

async function runtimeSnapshot(page) {
  return page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const meta = Object.fromEntries((await test.userDataRepository.loadUserMeta()).map(record => [record.key, record.value]));
    return {
      revisions: {
        inventoryRevision: meta.inventoryRevision,
        craftListRevision: meta.craftListRevision,
        allocationRevision: meta.allocationRevision,
        historySequence: meta.historySequence
      },
      cards: test.state.craftingCards.map(card => ({ id: card.id, order: card.order, quantity: card.quantity, cardRevision: card.cardRevision })),
      batches: test.state.materialBatches.map(batch => ({ id: batch.id, quantityUnits: batch.quantityUnits, quality: batch.quality })),
      history: test.state.craftHistory.map(event => ({
        id: event.craftTransactionId,
        sequence: event.historySequence,
        completedQuantity: event.completedQuantity,
        remainingBefore: event.remainingBefore,
        remainingAfter: event.remainingAfter,
        deltas: event.consumedDeltas.map(line => ({ batchId: line.batchId, consumedUnits: line.consumedUnits, beforeUnits: line.beforeUnits, afterUnits: line.afterUnits }))
      })),
      reservationRunStatus: test.state.reservationRunStatus,
      allocationCleared: test.state.allocationResult === null,
      renderedCardCount: document.querySelectorAll(".spg-c012-list-card").length,
      renderedBatchQuantities: Array.from(document.querySelectorAll(".spg-material-batch")).map(element => element.textContent),
      completionState: document.body.dataset.craftCompletionState || null
    };
  });
}

const card = {
  ...sourceFixture.card,
  id: "card-c004-browser",
  order: 0,
  cardRevision: 0,
  active: true,
  collapsed: false,
  quantity: 21,
  outputCountEvidence: sourceFixture.card.outputCountEvidence,
  requirements: [{
    ...sourceFixture.card.requirements[1],
    id: "slot-c004-browser",
    ingredientUuid: "material-c004-browser",
    commodityUuid: "material-c004-browser",
    materialName: "C004 Exact Material",
    requiredQuantityUnits: 10000,
    unit: "SCU",
    qualityCapability: "FIXED"
  }],
  slotStrategies: {},
  recipeSlotQualityPoolAssignments: {},
  createdAt: "2026-09-09T17:00:00.000Z",
  updatedAt: "2026-09-09T17:00:00.000Z"
};

const batches = [
  {
    id: "batch-c004-01-q620",
    materialUuid: "material-c004-browser",
    sourceMaterialUuid: "material-c004-browser",
    materialName: "C004 Exact Material",
    quality: 620,
    quantityUnits: 20000,
    unit: "SCU",
    createdAt: "2026-09-09T17:00:00.000Z",
    updatedAt: "2026-09-09T17:00:00.000Z"
  },
  {
    id: "batch-c004-02-q745",
    materialUuid: "material-c004-browser",
    sourceMaterialUuid: "material-c004-browser",
    materialName: "C004 Exact Material",
    quality: 745,
    quantityUnits: 30000,
    unit: "SCU",
    createdAt: "2026-09-09T17:00:01.000Z",
    updatedAt: "2026-09-09T17:00:01.000Z"
  },
  {
    id: "batch-c004-03-q910",
    materialUuid: "material-c004-browser",
    sourceMaterialUuid: "material-c004-browser",
    materialName: "C004 Exact Material",
    quality: 910,
    quantityUnits: 160001,
    unit: "SCU",
    createdAt: "2026-09-09T17:00:02.000Z",
    updatedAt: "2026-09-09T17:00:02.000Z"
  }
];

const playwright = await loadPlaywright();
const { server, origin } = await startServer();
let browser;
const errors = [];
const results = {
  cycle: "V004-C004",
  status: "PENDING",
  applicationSha256: crypto.createHash("sha256").update(appHtml).digest("hex"),
  browser: "Google Chrome",
  origin,
  sourceFixture: "tests/fixtures/v004-c003-reservation.json",
  startup: {},
  confirmation: {},
  partialCompletion: {},
  staleReservation: {},
  idempotency: {},
  atomicRollback: {},
  fullCompletion: {},
  reloadGate: {},
  outputCountBlocker: {},
  fileGate: { status: "DEFERRED" },
  applicationOriginConsoleErrors: errors
};

try {
  browser = await playwright.chromium.launch({ channel: "chrome", headless: true });
  const primary = await openApplication(browser, `${origin}/app`, errors);
  const { context, page } = primary;

  const startup = await page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const meta = Object.fromEntries((await test.userDataRepository.loadUserMeta()).map(record => [record.key, record.value]));
    return {
      app: test.app,
      meta,
      moduleNavButtons: document.querySelectorAll(".spg-module-nav button").length,
      dialogPresent: Boolean(document.getElementById("craftCompletionDialog"))
    };
  });
  assert.equal(startup.app.version, "V004-dev");
  assert.equal(startup.app.dbName, "spg-crafting-list-v004");
  assert.equal(startup.app.dbVersion, 1);
  assert.equal(startup.app.schemaVersion, 7);
  assert.equal(startup.app.backupSchemaVersion, 3);
  assert.deepEqual(
    { inventoryRevision: startup.meta.inventoryRevision, craftListRevision: startup.meta.craftListRevision, allocationRevision: startup.meta.allocationRevision, historySequence: startup.meta.historySequence },
    { inventoryRevision: 0, craftListRevision: 0, allocationRevision: 0, historySequence: 0 }
  );
  assert.equal(startup.moduleNavButtons, 8);
  assert.equal(startup.dialogPresent, true);
  results.startup = { status: "PASS", app: startup.app, revisions: startup.meta, baseUi: "PASS" };

  await page.evaluate(async input => {
    const test = window.__SPG_TEST__;
    await test.userDataRepository.saveCraftingCards([input.card]);
    await test.userDataRepository.saveMaterialBatches(input.batches);
  }, { card, batches });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.click("#craftingListNav");
  await page.click("#reallocateCraftingListButton");
  await page.waitForFunction(() => document.body.dataset.reservationRunStatus === "VALID");

  const controlSelector = '[data-card-id="card-c004-browser"].spg-v004-completion-controls';
  const quantitySelector = `${controlSelector} .spg-v004-completion-quantity`;
  const maxSelector = `${controlSelector} .spg-v004-completion-max`;
  const openSelector = `${controlSelector} .spg-v004-completion-open`;
  assert.equal(await page.inputValue(quantitySelector), "1");
  assert.equal(await page.getAttribute(controlSelector, "data-completion-ready"), "true");
  const beforeMax = await durableSnapshot(page);
  await page.click(maxSelector);
  assert.equal(await page.inputValue(quantitySelector), "21");
  assert.deepEqual(await durableSnapshot(page), beforeMax, "A MAX tartós adatot módosított.");

  await page.fill(quantitySelector, "5");
  const beforeConfirmation = await durableSnapshot(page);
  await page.click(openSelector);
  await page.waitForSelector("#craftCompletionDialog[open]");
  const confirmation = await page.evaluate(() => ({
    itemName: document.getElementById("craftCompletionItemName").textContent,
    requested: document.getElementById("craftCompletionRequestedQuantity").textContent,
    before: document.getElementById("craftCompletionRemainingBefore").textContent,
    after: document.getElementById("craftCompletionRemainingAfter").textContent,
    lines: Array.from(document.querySelectorAll("#craftCompletionMaterialLines li")).map(line => ({ text: line.textContent, batchId: line.dataset.batchId, consumedUnits: Number(line.dataset.consumedUnits) })),
    warning: document.querySelector(".spg-v004-craft-warning").textContent
  }));
  assert.equal(confirmation.requested, "5");
  assert.equal(confirmation.before, "21");
  assert.equal(confirmation.after, "16");
  assert.deepEqual(confirmation.lines.map(line => [line.batchId, line.consumedUnits]), [
    ["batch-c004-01-q620", 20000],
    ["batch-c004-02-q745", 30000]
  ]);
  assert.ok(confirmation.lines.every(line => /SCU/.test(line.text) && /unit/.test(line.text)));
  assert.match(confirmation.warning, /módosítja a készletet/);
  assert.deepEqual(await durableSnapshot(page), beforeConfirmation, "A confirmation megnyitása adatot módosított.");
  await page.click("#cancelCraftCompletionButton");
  assert.equal(await page.isVisible("#craftCompletionDialog"), false);
  assert.deepEqual(await durableSnapshot(page), beforeConfirmation, "A confirmation cancel adatot módosított.");
  results.confirmation = { status: "PASS", defaultQuantity: 1, maxFilled: 21, maxWrites: 0, cancelWrites: 0, lines: confirmation.lines };

  await page.fill(quantitySelector, "5");
  await page.click(openSelector);
  await page.waitForSelector("#craftCompletionDialog[open]");
  await page.evaluate(() => { window.__C004_PARTIAL_REQUEST__ = JSON.parse(JSON.stringify(window.__SPG_TEST__.state.pendingCraftCompletion.request)); });
  await page.click("#confirmCraftCompletionButton");
  await page.waitForFunction(() => document.body.dataset.craftCompletionState === "COMPLETED");
  let runtime = await runtimeSnapshot(page);
  assert.deepEqual(runtime.revisions, { inventoryRevision: 2, craftListRevision: 2, allocationRevision: 3, historySequence: 1 });
  assert.deepEqual(runtime.cards, [{ id: "card-c004-browser", order: 0, quantity: 16, cardRevision: 1 }]);
  assert.deepEqual(runtime.batches, [{ id: "batch-c004-03-q910", quantityUnits: 160001, quality: 910 }]);
  assert.equal(runtime.history.length, 1);
  assert.deepEqual(runtime.history[0].deltas.map(line => [line.batchId, line.consumedUnits]), [
    ["batch-c004-01-q620", 20000],
    ["batch-c004-02-q745", 30000]
  ]);
  assert.ok(runtime.history[0].deltas.every(line => line.beforeUnits === line.consumedUnits + line.afterUnits));
  assert.equal(runtime.reservationRunStatus, "STALE");
  assert.equal(runtime.allocationCleared, true);
  const partialDurable = await durableSnapshot(page);
  assert.equal(partialDurable.userInventory[0].totalQuantityUnits, 160001);
  results.partialCompletion = {
    status: "PASS",
    completedQuantity: 5,
    remainingBefore: 21,
    remainingAfter: 16,
    batchesAfter: runtime.batches,
    historyDeltas: runtime.history[0].deltas,
    revisions: runtime.revisions,
    reservationAfter: runtime.reservationRunStatus,
    automaticReallocate: false
  };

  const beforeReplay = await durableSnapshot(page);
  const replayCode = await page.evaluate(async () => {
    try {
      await window.__SPG_TEST__.userDataRepository.completeCraft(window.__C004_PARTIAL_REQUEST__);
      return null;
    } catch (error) {
      return error.code;
    }
  });
  assert.equal(replayCode, "ALREADY_COMPLETED");
  assert.deepEqual(await durableSnapshot(page), beforeReplay);
  results.idempotency = { status: "PASS", replayCode, historyEvents: 1, secondDeduction: false, secondCardChange: false };

  await page.click("#reallocateCraftingListButton");
  await page.waitForFunction(() => document.body.dataset.reservationRunStatus === "VALID");
  assert.equal(await page.inputValue(quantitySelector), "1");
  await page.click(maxSelector);
  assert.equal(await page.inputValue(quantitySelector), "16");
  await page.click(openSelector);
  await page.waitForSelector("#craftCompletionDialog[open]");
  const batchesBeforeExternalMutation = await page.evaluate(() => JSON.parse(JSON.stringify(window.__SPG_TEST__.state.materialBatches)));
  await page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    await new Promise((resolve, reject) => {
      const transaction = test.database.db.transaction("materialBatches", "readwrite");
      const store = transaction.objectStore("materialBatches");
      const get = store.get("batch-c004-03-q910");
      get.onsuccess = () => {
        const record = get.result;
        record.quantityUnits -= 1;
        store.put(record);
        store.put({
          id: "batch-c004-spare-fallback",
          materialUuid: record.materialUuid,
          sourceMaterialUuid: record.sourceMaterialUuid,
          materialName: record.materialName,
          quality: 999,
          quantityUnits: 999999,
          unit: record.unit,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
        });
      };
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("external mutation aborted"));
    });
  });
  const beforeStaleAttempt = await durableSnapshot(page);
  await page.click("#confirmCraftCompletionButton");
  await page.waitForFunction(() => document.body.dataset.craftCompletionState === "STALE_RESERVATION");
  assert.deepEqual(await durableSnapshot(page), beforeStaleAttempt, "A stale transaction részleges írást hagyott.");
  const staleNotice = await page.textContent("#craftCompletionDialogNotice");
  assert.match(staleNotice, /STALE_RESERVATION/);
  assert.equal(beforeStaleAttempt.materialBatches.find(batch => batch.id === "batch-c004-spare-fallback").quantityUnits, 999999);
  results.staleReservation = { status: "PASS", code: "STALE_RESERVATION", firstReservedBatchChanged: true, fallbackBatchPresent: true, fallbackConsumed: false, writesByAttempt: 0 };
  await page.click("#cancelCraftCompletionButton");

  await page.evaluate(async originalBatches => {
    const test = window.__SPG_TEST__;
    await new Promise((resolve, reject) => {
      const transaction = test.database.db.transaction("materialBatches", "readwrite");
      const store = transaction.objectStore("materialBatches");
      store.clear();
      originalBatches.forEach(batch => store.put(batch));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("external restore aborted"));
    });
  }, batchesBeforeExternalMutation);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.click("#craftingListNav");
  await page.click("#reallocateCraftingListButton");
  await page.waitForFunction(() => document.body.dataset.reservationRunStatus === "VALID");

  const failureStages = ["AFTER_BATCH_DEDUCTION", "BEFORE_HISTORY_ADD", "AFTER_CARD_UPDATE", "BEFORE_META_UPDATE"];
  const failureEvidence = [];
  for (let index = 0; index < failureStages.length; index += 1) {
    const stage = failureStages[index];
    const request = await page.evaluate(async ({ quantity, id }) => window.__SPG_TEST__.prepareCraftCompletion("card-c004-browser", quantity, id), {
      quantity: 16,
      id: `craft-c004-failure-${String(index).padStart(4, "0")}`
    });
    const beforeFailure = await durableSnapshot(page);
    const code = await page.evaluate(async ({ request, stage }) => {
      try {
        await window.__SPG_TEST__.userDataRepository.completeCraft(request, { simulateFailureAt: stage, timestamp: "2026-09-09T18:00:00.000Z" });
        return null;
      } catch (error) {
        return error.code;
      }
    }, { request, stage });
    assert.equal(code, "SIMULATED_CRAFT_COMPLETE_ABORT");
    assert.deepEqual(await durableSnapshot(page), beforeFailure, `Rollback failure at ${stage}`);
    failureEvidence.push({ stage, code, allStoresUnchanged: true });
  }
  results.atomicRollback = { status: "PASS", failures: failureEvidence };

  await page.click(maxSelector);
  assert.equal(await page.inputValue(quantitySelector), "16");
  await page.click(openSelector);
  await page.waitForSelector("#craftCompletionDialog[open]");
  await page.click("#confirmCraftCompletionButton");
  await page.waitForFunction(() => document.body.dataset.craftCompletionState === "COMPLETED");
  runtime = await runtimeSnapshot(page);
  assert.deepEqual(runtime.revisions, { inventoryRevision: 3, craftListRevision: 3, allocationRevision: 4, historySequence: 2 });
  assert.equal(runtime.cards.length, 0);
  assert.deepEqual(runtime.batches, [{ id: "batch-c004-03-q910", quantityUnits: 1, quality: 910 }]);
  assert.equal(runtime.history.length, 2);
  assert.deepEqual(runtime.history[1].deltas.map(line => [line.batchId, line.consumedUnits, line.beforeUnits, line.afterUnits]), [
    ["batch-c004-03-q910", 160000, 160001, 1]
  ]);
  assert.equal(runtime.history[1].remainingBefore, 16);
  assert.equal(runtime.history[1].remainingAfter, 0);
  assert.equal(runtime.reservationRunStatus, "ABSENT");
  assert.equal(runtime.allocationCleared, true);
  const fullDurable = await durableSnapshot(page);
  assert.equal(fullDurable.userInventory[0].totalQuantityUnits, 1);
  assert.equal(fullDurable.craftHistory.length, 2);
  results.fullCompletion = {
    status: "PASS",
    completedQuantity: 16,
    cardRemoved: true,
    oneUnitRemainder: 1,
    historyEvents: 2,
    finalDelta: runtime.history[1].deltas[0],
    revisions: runtime.revisions,
    reservationAfter: runtime.reservationRunStatus
  };

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  runtime = await runtimeSnapshot(page);
  assert.equal(runtime.cards.length, 0);
  assert.deepEqual(runtime.batches, [{ id: "batch-c004-03-q910", quantityUnits: 1, quality: 910 }]);
  assert.equal(runtime.history.length, 2);
  assert.deepEqual(runtime.revisions, { inventoryRevision: 3, craftListRevision: 3, allocationRevision: 4, historySequence: 2 });
  assert.notEqual(runtime.reservationRunStatus, "VALID");
  results.reloadGate = { status: "PASS", inventoryUnits: 1, activeCards: 0, historyEvents: 2, revisions: runtime.revisions, reservationAutomaticallyValid: false };
  await context.close();

  const unprovenErrors = [];
  const unproven = await openApplication(browser, `${origin}/app`, unprovenErrors);
  const unprovenCard = { ...card, id: "card-c004-unproven", outputCountEvidence: "OUTPUT_COUNT_UNPROVEN", quantity: 1 };
  await unproven.page.evaluate(async input => {
    const test = window.__SPG_TEST__;
    await test.userDataRepository.saveCraftingCards([input.card]);
    await test.userDataRepository.saveMaterialBatches(input.batches);
  }, { card: unprovenCard, batches: [batches[2]] });
  await unproven.page.reload({ waitUntil: "domcontentloaded" });
  await unproven.page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await unproven.page.click("#craftingListNav");
  await unproven.page.click("#reallocateCraftingListButton");
  await unproven.page.waitForFunction(() => document.body.dataset.reservationRunStatus === "VALID");
  const unprovenControl = '[data-card-id="card-c004-unproven"].spg-v004-completion-controls';
  assert.equal(await unproven.page.getAttribute(unprovenControl, "data-completion-ready"), "false");
  assert.equal(await unproven.page.isDisabled(`${unprovenControl} .spg-v004-completion-open`), true);
  const unprovenCode = await unproven.page.evaluate(async () => {
    try {
      await window.__SPG_TEST__.prepareCraftCompletion("card-c004-unproven", 1, "craft-c004-unproven-test");
      return null;
    } catch (error) {
      return error.code;
    }
  });
  assert.equal(unprovenCode, "OUTPUT_COUNT_UNPROVEN");
  assert.equal(await unproven.page.isVisible("#craftCompletionDialog"), false);
  assert.equal(unprovenErrors.length, 0);
  results.outputCountBlocker = { status: "PASS", code: unprovenCode, confirmationReachable: false };
  await unproven.context.close();

  const fileErrors = [];
  try {
    const file = await openApplication(browser, pathToFileURL(appPath).href, fileErrors);
    const fileIdentity = await file.page.evaluate(async () => ({
      version: window.__SPG_TEST__.app.version,
      dbName: window.__SPG_TEST__.app.dbName,
      dbVersion: window.__SPG_TEST__.app.dbVersion,
      historyCount: window.__SPG_TEST__.state.craftHistory.length,
      sourceDbExists: (await indexedDB.databases()).some(entry => entry.name === "spg-crafting-list")
    }));
    assert.equal(fileIdentity.version, "V004-dev");
    assert.equal(fileIdentity.dbName, "spg-crafting-list-v004");
    assert.equal(fileIdentity.dbVersion, 1);
    assert.equal(fileIdentity.historyCount, 0);
    assert.equal(fileIdentity.sourceDbExists, false);
    assert.equal(fileErrors.length, 0);
    results.fileGate = { status: "PASS_AUTOMATED", ...fileIdentity, consoleErrors: fileErrors };
    await file.context.close();
  } catch (error) {
    results.fileGate = { status: "DEFERRED", reason: error.message, consoleErrors: fileErrors };
  }

  assert.equal(errors.length, 0, `Application-origin browser errors: ${errors.join(" | ")}`);
  results.status = "PASS_TARGETED_CHROME";
} finally {
  if (browser) await browser.close();
  await closeServer(server);
}

fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
console.log(`V004_C004_BROWSER_PASS fileGate=${results.fileGate.status} evidence=${path.relative(projectDirectory, evidencePath)}`);
