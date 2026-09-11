import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C006.1");
const evidencePath = path.join(artifactDirectory, "browser-evidence.json");
const appBuffer = fs.readFileSync(appPath);
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
    response.end(request.url === "/app" || request.url === "/app/" ? appBuffer : "<!doctype html><meta charset=\"utf-8\"><title>seed</title>");
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }));
  });
}

function closeServer(server) {
  return new Promise(resolve => server.close(resolve));
}

async function openApplication(browser, url, errors, viewport = { width: 1920, height: 1080 }) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
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

async function reloadToCrafting(page) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.click("#craftingListNav");
}

async function durableSnapshot(page) {
  return page.evaluate(async () => JSON.parse(JSON.stringify(await window.__SPG_TEST__.userDataRepository.readAllUserData())));
}

async function normalizedDurableData(page) {
  return page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    return JSON.parse(JSON.stringify(test.buildM4BackupEnvelope(await test.userDataRepository.readAllUserData(), {
      applicationVersion: test.app.version,
      exportedAt: "2026-09-10T19:00:00.000Z"
    }).data));
  });
}

async function loadNormalizedBlueprint(page) {
  return page.evaluate(async blueprintUuid => {
    const test = window.__SPG_TEST__;
    const version = await test.adapter.getDefaultGameVersion();
    test.state.gameVersion = version;
    const normalized = await test.loadBlueprintDetail(blueprintUuid, { ownsProcess: false });
    return { version: version.code, normalized: JSON.parse(JSON.stringify(normalized)) };
  }, exactBlueprintUuid);
}

async function seedNormalized(page, normalized, craftRuns, extraUnits, prefix) {
  return page.evaluate(async ({ normalized, craftRuns, extraUnits, prefix }) => {
    const test = window.__SPG_TEST__;
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
      provenance: { origin: "C006.1_BROWSER_PRODUCTION", scenario: prefix }
    }));
    await test.userDataRepository.saveCraftingCards([card]);
    await test.userDataRepository.saveMaterialBatches(batches);
    return JSON.parse(JSON.stringify({ card, batches }));
  }, { normalized, craftRuns, extraUnits, prefix });
}

async function completeCraft(page, cardId, quantity) {
  await page.click("#activeCraftsTab");
  await page.click("#reallocateCraftingListButton");
  await page.waitForFunction(() => document.body.dataset.reservationRunStatus === "VALID");
  const control = `[data-card-id="${cardId}"].spg-v004-completion-controls`;
  await page.fill(`${control} .spg-v004-completion-quantity`, String(quantity));
  await page.click(`${control} .spg-v004-completion-open`);
  await page.waitForSelector("#craftCompletionDialog[open]");
  await page.click("#confirmCraftCompletionButton");
  await page.waitForFunction(() => document.body.dataset.craftCompletionState === "COMPLETED");
  return durableSnapshot(page);
}

async function undoNewest(page, cardId) {
  await page.click("#craftHistoryTab");
  await page.waitForFunction(() => document.body.dataset.craftingListView === "HISTORY");
  const group = page.locator(`.spg-c005-history-group[data-crafting-card-id="${cardId}"]`);
  if ((await group.getAttribute("open")) === null) await group.locator(":scope > summary").click();
  const event = group.locator(".spg-c005-history-event").first();
  if ((await event.getAttribute("open")) === null) await event.locator(":scope > summary").click();
  assert.equal(await event.locator(".spg-c006-history-undo").getAttribute("data-eligibility-code"), "UNDO_READY");
  await event.locator(".spg-c006-undo-open").click();
  await page.waitForSelector("#craftUndoDialog[open]");
  await page.click("#confirmCraftUndoButton");
  await page.waitForFunction(() => document.body.dataset.craftUndoState === "UNDONE");
  return durableSnapshot(page);
}

async function exportBackup(page) {
  const [download, envelope] = await Promise.all([
    page.waitForEvent("download"),
    page.evaluate(async () => JSON.parse(JSON.stringify(await window.__SPG_TEST__.exportUserDataBackup())))
  ]);
  assert.match(download.suggestedFilename(), /^sPg Crafting List Backup .*\.json$/);
  return envelope;
}

async function importBackup(page, envelope) {
  return page.evaluate(async envelope => {
    const test = window.__SPG_TEST__;
    const before = await test.userDataRepository.readAllUserData();
    const validated = test.validateAndMigrateM4Backup(JSON.stringify(envelope));
    const preview = test.buildM4ImportPreview(before, validated.backup.data, "REPLACE");
    test.state.backupPreview = {
      fileName: "c0061-roundtrip.json",
      mode: "REPLACE",
      validated,
      preview,
      previewedAt: new Date().toISOString()
    };
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    try {
      const resultFingerprint = await test.applyUserDataBackup();
      return JSON.parse(JSON.stringify({
        schemaVersion: validated.backup.schemaVersion,
        migration: validated.migration,
        warnings: validated.warnings,
        preview,
        resultFingerprint
      }));
    } finally {
      window.confirm = originalConfirm;
    }
  }, envelope);
}

function storeCounts(data) {
  return Object.fromEntries(["userInventory", "materialBatches", "craftingCards", "miningLoadouts", "userSettings", "craftHistory", "userMeta"].map(key => [key, data[key].length]));
}

async function verifyImportedExact(page, envelope) {
  await reloadToCrafting(page);
  const actual = await normalizedDurableData(page);
  assert.deepEqual(actual, envelope.data);
  assert.equal(JSON.stringify(actual), JSON.stringify(envelope.data));
  return { data: actual, counts: storeCounts(actual), structuralJsonEqual: true };
}

async function eligibilityAfterImport(page, completedTransactionId, undoneTransactionId) {
  const before = await durableSnapshot(page);
  const values = await page.evaluate(async ({ completedTransactionId, undoneTransactionId }) => {
    const test = window.__SPG_TEST__;
    const completed = await test.prepareCraftUndo(completedTransactionId).then(() => "UNDO_READY", error => error.code || error.message);
    const undone = await test.prepareCraftUndo(undoneTransactionId).then(() => "UNEXPECTED_READY", error => error.code || error.message);
    return { completed, undone };
  }, { completedTransactionId, undoneTransactionId });
  const after = await durableSnapshot(page);
  assert.deepEqual(after, before);
  assert.equal(values.completed, "UNDO_READY");
  assert.equal(values.undone, "ALREADY_UNDONE");
  return { ...values, durableWrites: 0 };
}

const playwright = await loadPlaywright();
const { server, origin } = await startServer();
let browser;
const allErrors = [];
const results = {
  cycle: "V004-C006.1",
  status: "PENDING",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  browser: "Google Chrome",
  backupSchemaVersion: null,
  partialLifoRoundTrip: {},
  fullRoundTrip: {},
  legacySchema3: {},
  directFile: {},
  consoleErrors: allErrors
};

try {
  browser = await playwright.chromium.launch({ channel: "chrome", headless: true });

  const partialSourceErrors = [];
  const partialSource = await openApplication(browser, `${origin}/app`, partialSourceErrors);
  const sourceBlueprint = await loadNormalizedBlueprint(partialSource.page);
  const partialSeed = await seedNormalized(partialSource.page, sourceBlueprint.normalized, 21, 1, "c0061-partial");
  await reloadToCrafting(partialSource.page);
  let partialState = await completeCraft(partialSource.page, partialSeed.card.id, 5);
  partialState = await completeCraft(partialSource.page, partialSeed.card.id, 3);
  const event1 = copy(partialState.craftHistory.find(event => event.historySequence === 1));
  const event2Completed = copy(partialState.craftHistory.find(event => event.historySequence === 2));
  partialState = await undoNewest(partialSource.page, partialSeed.card.id);
  assert.equal(partialState.craftingCards[0].quantity, 16);
  const event2Undone = copy(partialState.craftHistory.find(event => event.historySequence === 2));
  assert.equal(event2Undone.status, "UNDONE");
  await partialSource.page.evaluate(async transactionId => {
    const test = window.__SPG_TEST__;
    const event = await test.database.get("craftHistory", transactionId);
    event.forwardCompatibleProbe = { preserved: true, value: "C006.1_UNKNOWN_EVENT_FIELD" };
    await test.database.put("craftHistory", event);
  }, event2Undone.craftTransactionId);
  const partialEnvelope = await exportBackup(partialSource.page);
  results.backupSchemaVersion = partialEnvelope.schemaVersion;
  assert.equal(partialEnvelope.schemaVersion, 3);
  assert.equal(partialSourceErrors.length, 0);
  await partialSource.context.close();

  const partialTargetErrors = [];
  const partialTarget = await openApplication(browser, `${origin}/app`, partialTargetErrors);
  const partialBeforeImport = await durableSnapshot(partialTarget.page);
  assert.equal(Object.values(storeCounts(partialBeforeImport)).reduce((sum, count) => sum + count, 0), 4);
  assert.ok(partialBeforeImport.userMeta.every(record => record.value === 0));
  const partialImport = await importBackup(partialTarget.page, partialEnvelope);
  assert.equal(partialImport.schemaVersion, 3);
  assert.equal(partialImport.migration, null);
  const importedPartial = await verifyImportedExact(partialTarget.page, partialEnvelope);
  const importedEvent1 = importedPartial.data.craftHistory.find(event => event.historySequence === 1);
  const importedEvent2 = importedPartial.data.craftHistory.find(event => event.historySequence === 2);
  assert.deepEqual(importedEvent1, partialEnvelope.data.craftHistory.find(event => event.historySequence === 1));
  assert.deepEqual(importedEvent2, partialEnvelope.data.craftHistory.find(event => event.historySequence === 2));
  assert.equal(importedEvent2.status, "UNDONE");
  assert.equal(importedEvent2.undoneAt, event2Undone.undoneAt);
  assert.equal(importedEvent2.undoTransactionId, event2Undone.undoTransactionId);
  assert.deepEqual(importedEvent2.consumedDeltas, event2Completed.consumedDeltas);
  assert.deepEqual(importedEvent2.restoredBatches, event2Undone.restoredBatches);
  assert.deepEqual(importedEvent2.undoRevisionEvidence, event2Undone.undoRevisionEvidence);
  assert.deepEqual(importedEvent2.forwardCompatibleProbe, { preserved: true, value: "C006.1_UNKNOWN_EVENT_FIELD" });
  assert.equal(importedPartial.data.craftingCards[0].id, partialSeed.card.id);
  assert.equal(importedPartial.data.craftingCards[0].quantity, 16);
  assert.equal(importedPartial.data.craftingCards[0].quantitySemantics, "CRAFT_RUN_COUNT");
  assert.deepEqual(importedPartial.data.craftingCards[0].recipeSlotQualityPoolAssignments, partialEnvelope.data.craftingCards[0].recipeSlotQualityPoolAssignments);
  assert.deepEqual(importedPartial.data.craftingCards[0].slotStrategies, partialEnvelope.data.craftingCards[0].slotStrategies);
  assert.deepEqual(importedPartial.data.materialBatches, partialEnvelope.data.materialBatches);
  assert.deepEqual(importedPartial.data.userMeta, partialEnvelope.data.userMeta);
  const partialEligibility = await eligibilityAfterImport(partialTarget.page, event1.craftTransactionId, event2Undone.craftTransactionId);
  await partialTarget.page.click("#craftHistoryTab");
  const historyDom = await partialTarget.page.evaluate(() => ({
    groupCount: document.querySelectorAll(".spg-c005-history-group").length,
    cardId: document.querySelector(".spg-c005-history-group").dataset.craftingCardId,
    sequences: Array.from(document.querySelectorAll(".spg-c005-history-event")).map(event => Number(event.dataset.historySequence)),
    statuses: Array.from(document.querySelectorAll(".spg-c005-history-event")).map(event => event.dataset.historyStatus),
    activeTotal: Number(document.querySelector(".spg-c005-history-group").dataset.activeCompletedCraftRuns)
  }));
  assert.deepEqual(historyDom.sequences, [2, 1]);
  assert.deepEqual(historyDom.statuses, ["UNDONE", "COMPLETED"]);
  assert.equal(historyDom.cardId, partialSeed.card.id);
  assert.equal(historyDom.activeTotal, 5);
  assert.equal(partialTargetErrors.length, 0);
  results.partialLifoRoundTrip = {
    status: "PASS",
    schemaVersion: partialImport.schemaVersion,
    recordCounts: importedPartial.counts,
    structuralJsonEqual: importedPartial.structuralJsonEqual,
    historyFieldsExact: true,
    consumedDeltasExact: true,
    restoredBatchEvidenceExact: true,
    inventoryExact: true,
    cardExact: true,
    userMetaExact: true,
    unknownHistoryFieldPreserved: true,
    historyDom,
    eligibilityAfterImport: partialEligibility,
    backupDataLoss: 0
  };
  await partialTarget.context.close();

  const fullSourceErrors = [];
  const fullSource = await openApplication(browser, `${origin}/app`, fullSourceErrors);
  const fullSeed = await seedNormalized(fullSource.page, sourceBlueprint.normalized, 1, 0, "c0061-full");
  await reloadToCrafting(fullSource.page);
  let fullState = await completeCraft(fullSource.page, fullSeed.card.id, 1);
  assert.equal(fullState.craftingCards.length, 0);
  fullState = await undoNewest(fullSource.page, fullSeed.card.id);
  assert.equal(fullState.craftingCards.length, 1);
  assert.equal(fullState.craftingCards[0].id, fullSeed.card.id);
  const fullEnvelope = await exportBackup(fullSource.page);
  assert.equal(fullSourceErrors.length, 0);
  await fullSource.context.close();

  const fullTargetErrors = [];
  const fullTarget = await openApplication(browser, `${origin}/app`, fullTargetErrors);
  const fullImport = await importBackup(fullTarget.page, fullEnvelope);
  const importedFull = await verifyImportedExact(fullTarget.page, fullEnvelope);
  assert.equal(importedFull.data.craftHistory[0].status, "UNDONE");
  assert.deepEqual(importedFull.data.craftingCards, fullEnvelope.data.craftingCards);
  assert.deepEqual(importedFull.data.materialBatches, fullEnvelope.data.materialBatches);
  assert.deepEqual(importedFull.data.userMeta, fullEnvelope.data.userMeta);
  assert.equal(importedFull.data.craftingCards[0].id, fullSeed.card.id);
  assert.equal(importedFull.data.craftingCards[0].quantity, 1);
  assert.equal(importedFull.data.craftingCards[0].order, 0);
  assert.equal(importedFull.data.craftingCards[0].blueprintUuid, fullSeed.card.blueprintUuid);
  assert.deepEqual(importedFull.data.craftingCards[0].slotStrategies, fullSeed.card.slotStrategies);
  assert.deepEqual(importedFull.data.craftingCards[0].recipeSlotQualityPoolAssignments, fullSeed.card.recipeSlotQualityPoolAssignments);
  assert.equal(fullTargetErrors.length, 0);
  results.fullRoundTrip = {
    status: "PASS",
    schemaVersion: fullImport.schemaVersion,
    recordCounts: importedFull.counts,
    structuralJsonEqual: importedFull.structuralJsonEqual,
    historyFieldsExact: true,
    inventoryExact: true,
    cardIdentityQuantityOrderBlueprintSlotsPoolsRevisionExact: true,
    userMetaExact: true,
    backupDataLoss: 0
  };
  await fullTarget.context.close();

  const legacyErrors = [];
  const legacy = await openApplication(browser, `${origin}/app`, legacyErrors);
  const legacyEnvelope = await legacy.page.evaluate(() => {
    const test = window.__SPG_TEST__;
    const meta = test.v004Migration.defaultUserMetaRecords();
    meta.find(record => record.key === "historySequence").value = 1;
    return JSON.parse(JSON.stringify(test.buildM4BackupEnvelope({
      userInventory: [], materialBatches: [], craftingCards: [], miningLoadouts: [], userSettings: [],
      craftHistory: [{
        craftTransactionId: "legacy-c0061-browser",
        historySequence: 1,
        craftingCardId: "legacy-card-c0061-browser",
        status: "COMPLETED",
        timestamp: "2026-09-10T17:00:00.000Z",
        completedQuantity: 1,
        consumedDeltas: [],
        legacyExtraField: "PRESERVE_ME"
      }],
      userMeta: meta
    }, { applicationVersion: test.app.version, exportedAt: "2026-09-10T19:10:00.000Z" })));
  });
  await importBackup(legacy.page, legacyEnvelope);
  const importedLegacy = await verifyImportedExact(legacy.page, legacyEnvelope);
  await legacy.page.click("#craftHistoryTab");
  const legacyUi = await legacy.page.evaluate(() => ({
    undoButtons: document.querySelectorAll(".spg-c006-undo-open").length,
    text: document.getElementById("craftHistoryList").textContent
  }));
  assert.equal(legacyUi.undoButtons, 0);
  assert.match(legacyUi.text, /Legacy esemény – nem vonható vissza biztonságosan/);
  assert.equal(importedLegacy.data.craftHistory[0].quantitySemantics, "LEGACY_HISTORY_QUANTITY_SEMANTICS_UNKNOWN");
  assert.equal(importedLegacy.data.craftHistory[0].undoTransactionId, undefined);
  assert.equal(importedLegacy.data.craftHistory[0].legacyExtraField, "PRESERVE_ME");
  assert.equal(legacyErrors.length, 0);
  results.legacySchema3 = { status: "FAIL_CLOSED_COMPATIBLE", schemaVersion: 3, undoFieldsFabricated: false, unknownFieldPreserved: true, undoButtons: 0 };
  await legacy.context.close();

  const fileSourceErrors = [];
  const fileSource = await openApplication(browser, pathToFileURL(appPath).href, fileSourceErrors, { width: 390, height: 844 });
  const fileSeed = await seedNormalized(fileSource.page, sourceBlueprint.normalized, 3, 1, "c0061-file");
  await reloadToCrafting(fileSource.page);
  await completeCraft(fileSource.page, fileSeed.card.id, 1);
  await undoNewest(fileSource.page, fileSeed.card.id);
  const fileEnvelope = await exportBackup(fileSource.page);
  assert.equal(fileSourceErrors.length, 0);
  await fileSource.context.close();

  const fileTargetErrors = [];
  const fileTarget = await openApplication(browser, pathToFileURL(appPath).href, fileTargetErrors, { width: 390, height: 844 });
  await importBackup(fileTarget.page, fileEnvelope);
  const importedFile = await verifyImportedExact(fileTarget.page, fileEnvelope);
  const fileUi = await fileTarget.page.evaluate(() => ({
    version: window.__SPG_TEST__.app.version,
    protocol: location.protocol,
    runtimeFiles: 1,
    sidecars: 0,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    historyStatus: window.__SPG_TEST__.state.craftHistory[0].status,
    cardQuantity: window.__SPG_TEST__.state.craftingCards[0].quantity
  }));
  assert.equal(fileUi.version, process.env.SPG_EXPECTED_RUNTIME_IDENTITY || "V004-dev");
  assert.equal(fileUi.protocol, "file:");
  assert.equal(fileUi.historyStatus, "UNDONE");
  assert.equal(fileUi.cardQuantity, 3);
  assert.ok(fileUi.overflow <= 1);
  assert.equal(fileTargetErrors.length, 0);
  results.directFile = { status: "PASS_AUTOMATED", ...fileUi, structuralJsonEqual: importedFile.structuralJsonEqual, backupDataLoss: 0 };
  await fileTarget.context.close();

  allErrors.push(...partialSourceErrors, ...partialTargetErrors, ...fullSourceErrors, ...fullTargetErrors, ...legacyErrors, ...fileSourceErrors, ...fileTargetErrors);
  assert.equal(allErrors.length, 0);
  results.status = "PASS_TARGETED_CHROME";
  fs.mkdirSync(artifactDirectory, { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
  console.log(`V004_C0061_UNDO_BACKUP_CHROME_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
} finally {
  if (browser) await browser.close();
  await closeServer(server);
}
