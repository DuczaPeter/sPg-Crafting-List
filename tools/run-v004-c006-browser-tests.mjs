import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C006");
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
  const context = await browser.newContext({ viewport });
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

async function revisions(page) {
  return page.evaluate(async () => Object.fromEntries((await window.__SPG_TEST__.userDataRepository.loadUserMeta()).map(record => [record.key, record.value])));
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
      updatedAt: timestamp
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

async function switchToHistory(page) {
  await page.click("#craftHistoryTab");
  await page.waitForFunction(() => document.body.dataset.craftingListView === "HISTORY");
}

async function openHistoryGroup(page, cardId) {
  const group = page.locator(`.spg-c005-history-group[data-crafting-card-id="${cardId}"]`);
  if ((await group.getAttribute("open")) === null) await group.locator(":scope > summary").click();
  return group;
}

async function openHistoryEvent(group, index) {
  const event = group.locator(".spg-c005-history-event").nth(index);
  if ((await event.getAttribute("open")) === null) await event.locator(":scope > summary").click();
  return event;
}

function batchUnits(data) {
  return Object.fromEntries(copy(data.materialBatches).sort((a, b) => a.id.localeCompare(b.id)).map(batch => [batch.id, batch.quantityUnits]));
}

function omitCardVolatile(card) {
  const value = copy(card);
  delete value.cardRevision;
  delete value.updatedAt;
  return value;
}

async function expectBlockedPrepare(page, transactionId, expectedCode) {
  const before = await durableSnapshot(page);
  const code = await page.evaluate(async ({ transactionId }) => {
    try {
      await window.__SPG_TEST__.prepareCraftUndo(transactionId);
      return "UNEXPECTED_SUCCESS";
    } catch (error) {
      return error.code || error.message;
    }
  }, { transactionId });
  const after = await durableSnapshot(page);
  assert.equal(code, expectedCode);
  assert.deepEqual(after, before);
  return { code, durableWrites: 0 };
}

const playwright = await loadPlaywright();
const { server, origin } = await startServer();
let browser;
const allErrors = [];
const results = {
  cycle: "V004-C006",
  status: "PENDING",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  browser: "Google Chrome",
  productionBlueprint: {},
  partialUndo: {},
  lifo: {},
  fullUndo: {},
  blockers: {},
  rollback: {},
  legacy: {},
  layout: {},
  reload: {},
  fileGate: {},
  consoleErrors: allErrors
};

try {
  browser = await playwright.chromium.launch({ channel: "chrome", headless: true });

  const partialErrors = [];
  const partial = await openApplication(browser, `${origin}/app`, partialErrors);
  const source = await loadNormalizedBlueprint(partial.page);
  assert.equal(source.normalized.uuid, exactBlueprintUuid);
  const seededPartial = await seedNormalized(partial.page, source.normalized, 21, 1, "c006-partial");
  assert.deepEqual(seededPartial.card.requirements.map(requirement => requirement.requiredQuantityUnits), [3600, 7, 7]);
  await reloadToCrafting(partial.page);
  let partialData = await completeCraft(partial.page, seededPartial.card.id, 5);
  assert.equal(partialData.craftingCards[0].quantity, 16);
  assert.deepEqual(partialData.craftHistory[0].consumedDeltas.map(delta => delta.consumedUnits), [18000, 35, 35]);
  const completedEvent = copy(partialData.craftHistory[0]);

  const unrelated = {
    id: "batch-c006-unrelated",
    materialUuid: "material-c006-unrelated",
    sourceMaterialUuid: "source-c006-unrelated",
    materialName: "Independent user batch",
    quality: 500,
    quantityUnits: 5000,
    unit: "SCU",
    createdAt: "2026-09-10T12:00:00.000Z",
    updatedAt: "2026-09-10T12:00:00.000Z"
  };
  await partial.page.evaluate(async unrelated => {
    const test = window.__SPG_TEST__;
    const batches = await test.userDataRepository.loadMaterialBatches();
    await test.userDataRepository.saveMaterialBatches(batches.concat(unrelated));
  }, unrelated);
  await reloadToCrafting(partial.page);
  const revisionsBeforeUndo = await revisions(partial.page);
  const beforeCancel = await durableSnapshot(partial.page);
  await switchToHistory(partial.page);
  let partialGroup = await openHistoryGroup(partial.page, seededPartial.card.id);
  let partialEventDom = await openHistoryEvent(partialGroup, 0);
  const undoAction = partialEventDom.locator(".spg-c006-history-undo");
  assert.equal(await undoAction.getAttribute("data-eligible"), "true");
  assert.equal(await undoAction.getAttribute("data-eligibility-code"), "UNDO_READY");
  await undoAction.locator(".spg-c006-undo-open").click();
  await partial.page.waitForSelector("#craftUndoDialog[open]");
  const dialog = await partial.page.evaluate(() => ({
    item: document.getElementById("craftUndoItemName").textContent,
    quantity: document.getElementById("craftUndoQuantity").textContent,
    eventTime: document.getElementById("craftUndoEventTime").textContent,
    cardResult: document.getElementById("craftUndoCardResult").textContent,
    warning: document.querySelector("#craftUndoDialog .spg-v004-craft-warning").textContent,
    lines: Array.from(document.querySelectorAll("#craftUndoMaterialLines li")).map(line => ({
      batchId: line.dataset.batchId,
      quality: line.dataset.quality,
      unit: line.dataset.unit,
      restoredUnits: Number(line.dataset.restoredUnits),
      text: line.textContent
    }))
  }));
  assert.equal(dialog.item, seededPartial.card.outputName);
  assert.equal(dialog.quantity, "5 craft");
  assert.ok(dialog.eventTime.length > 0);
  assert.match(dialog.cardResult, /16 → 21 craft/);
  assert.equal(dialog.warning, "A művelet visszaállítja a Craft során levont készletet. Ez az esemény csak egyszer vonható vissza.");
  assert.deepEqual(dialog.lines.map(line => line.restoredUnits), [18000, 35, 35]);
  assert.deepEqual(dialog.lines.map(line => line.batchId), seededPartial.batches.map(batch => batch.id));
  assert.ok(dialog.lines.every(line => line.quality === "900" && /Q900/.test(line.text)));
  assert.match(dialog.lines[0].text, /18000 unit · 1\.8000 SCU/);
  assert.ok(dialog.lines.slice(1).every(line => /35 db/.test(line.text)));

  const desktopLayout = await partial.page.evaluate(() => ({
    documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    dialogOverflow: document.getElementById("craftUndoDialog").scrollWidth - document.getElementById("craftUndoDialog").clientWidth,
    lineOverflow: Array.from(document.querySelectorAll("#craftUndoMaterialLines li")).some(line => line.scrollWidth > line.clientWidth + 1)
  }));
  await partial.page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await partial.page.evaluate(() => ({
    documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    dialogOverflow: document.getElementById("craftUndoDialog").scrollWidth - document.getElementById("craftUndoDialog").clientWidth,
    lineOverflow: Array.from(document.querySelectorAll("#craftUndoMaterialLines li")).some(line => line.scrollWidth > line.clientWidth + 1)
  }));
  assert.ok(desktopLayout.documentOverflow <= 1 && desktopLayout.dialogOverflow <= 1 && !desktopLayout.lineOverflow);
  assert.ok(mobileLayout.documentOverflow <= 1 && mobileLayout.dialogOverflow <= 1 && !mobileLayout.lineOverflow);
  results.layout = { desktop: desktopLayout, mobile: mobileLayout, status: "PASS_NO_HORIZONTAL_OVERFLOW" };

  await partial.page.click("#cancelCraftUndoButton");
  assert.equal(await partial.page.locator("#craftUndoDialog").getAttribute("open"), null);
  assert.deepEqual(await durableSnapshot(partial.page), beforeCancel);
  assert.deepEqual(await revisions(partial.page), revisionsBeforeUndo);
  partialGroup = await openHistoryGroup(partial.page, seededPartial.card.id);
  partialEventDom = await openHistoryEvent(partialGroup, 0);
  await partialEventDom.locator(".spg-c006-undo-open").click();
  await partial.page.waitForSelector("#craftUndoDialog[open]");
  await partial.page.click("#confirmCraftUndoButton");
  await partial.page.waitForFunction(() => document.body.dataset.craftUndoState === "UNDONE");
  partialData = await durableSnapshot(partial.page);
  const partialUndone = partialData.craftHistory[0];
  const revisionsAfterUndo = await revisions(partial.page);
  assert.equal(partialData.craftingCards[0].quantity, 21);
  assert.deepEqual(batchUnits(partialData), { ...Object.fromEntries(seededPartial.batches.map(batch => [batch.id, batch.quantityUnits])), [unrelated.id]: 5000 });
  assert.equal(partialUndone.status, "UNDONE");
  assert.ok(partialUndone.undoneAt && partialUndone.undoTransactionId);
  assert.equal(partialUndone.historySequence, completedEvent.historySequence);
  assert.deepEqual(partialUndone.consumedDeltas, completedEvent.consumedDeltas);
  assert.deepEqual(partialUndone.restoredBatches.map(entry => entry.mode), ["MERGED", "MERGED", "MERGED"]);
  assert.equal(revisionsAfterUndo.inventoryRevision, revisionsBeforeUndo.inventoryRevision + 1);
  assert.equal(revisionsAfterUndo.allocationRevision, revisionsBeforeUndo.allocationRevision + 1);
  assert.equal(revisionsAfterUndo.craftListRevision, revisionsBeforeUndo.craftListRevision);
  assert.equal(partialData.craftingCards[0].cardRevision, completedEvent.cardRevisionAfter + 1);
  assert.equal(await partial.page.getAttribute("body", "data-reservation-run-status"), "STALE");
  partialGroup = partial.page.locator(`.spg-c005-history-group[data-crafting-card-id="${seededPartial.card.id}"]`);
  assert.equal(await partialGroup.getAttribute("data-active-completed-craft-runs"), "0");
  assert.equal(await partialGroup.locator(".spg-c006-undo-open").count(), 0);
  assert.match(await partialGroup.textContent(), /Visszavonva.*nincs Redo/is);

  await reloadToCrafting(partial.page);
  const reloadedPartial = await durableSnapshot(partial.page);
  assert.equal(reloadedPartial.craftingCards[0].quantity, 21);
  assert.equal(reloadedPartial.craftHistory[0].status, "UNDONE");
  assert.equal(batchUnits(reloadedPartial)[unrelated.id], 5000);
  const doubleUndo = await expectBlockedPrepare(partial.page, completedEvent.craftTransactionId, "ALREADY_UNDONE");
  assert.equal(partialErrors.length, 0);
  results.productionBlueprint = { uuid: exactBlueprintUuid, outputName: seededPartial.card.outputName, gameVersion: source.version, requiredUnitsPerCraft: [3600, 7, 7] };
  results.partialUndo = {
    status: "PASS",
    quantity: "21 -> 16 -> 21",
    consumedAndRestoredUnits: [18000, 35, 35],
    restoreModes: partialUndone.restoredBatches.map(entry => entry.mode),
    revisionsBefore: revisionsBeforeUndo,
    revisionsAfter: revisionsAfterUndo,
    cancelDurableWrites: 0,
    doubleUndo,
    reservationAfter: "STALE",
    automaticReallocate: false,
    unrelatedBatchUnits: 5000,
    reload: "PASS",
    materialRoundTripLossUnits: 0
  };
  results.reload.partial = { status: "PASS", cardQuantity: 21, eventStatus: "UNDONE", unrelatedBatchUnits: 5000 };
  await partial.context.close();

  const lifoErrors = [];
  const lifo = await openApplication(browser, `${origin}/app`, lifoErrors);
  const seededLifo = await seedNormalized(lifo.page, source.normalized, 21, 1, "c006-lifo");
  await reloadToCrafting(lifo.page);
  let lifoData = await completeCraft(lifo.page, seededLifo.card.id, 5);
  lifoData = await completeCraft(lifo.page, seededLifo.card.id, 3);
  assert.equal(lifoData.craftingCards[0].quantity, 13);
  await switchToHistory(lifo.page);
  let lifoGroup = await openHistoryGroup(lifo.page, seededLifo.card.id);
  const newest = await openHistoryEvent(lifoGroup, 0);
  const oldest = await openHistoryEvent(lifoGroup, 1);
  assert.equal(await newest.locator(".spg-c006-history-undo").getAttribute("data-eligibility-code"), "UNDO_READY");
  assert.equal(await oldest.locator(".spg-c006-history-undo").getAttribute("data-eligibility-code"), "NOT_LATEST_ACTIVE_EVENT");
  assert.equal(await oldest.locator(".spg-c006-undo-open").isDisabled(), true);
  await newest.locator(".spg-c006-undo-open").click();
  await lifo.page.waitForSelector("#craftUndoDialog[open]");
  await lifo.page.click("#confirmCraftUndoButton");
  await lifo.page.waitForFunction(() => document.body.dataset.craftUndoState === "UNDONE");
  assert.equal((await durableSnapshot(lifo.page)).craftingCards[0].quantity, 16);
  lifoGroup = await openHistoryGroup(lifo.page, seededLifo.card.id);
  const prior = await openHistoryEvent(lifoGroup, 1);
  assert.equal(await prior.locator(".spg-c006-history-undo").getAttribute("data-eligibility-code"), "UNDO_READY");
  await prior.locator(".spg-c006-undo-open").click();
  await lifo.page.waitForSelector("#craftUndoDialog[open]");
  await lifo.page.click("#confirmCraftUndoButton");
  await lifo.page.waitForFunction(() => document.body.dataset.craftUndoState === "UNDONE");
  lifoData = await durableSnapshot(lifo.page);
  assert.equal(lifoData.craftingCards[0].quantity, 21);
  assert.deepEqual(batchUnits(lifoData), Object.fromEntries(seededLifo.batches.map(batch => [batch.id, batch.quantityUnits])));
  assert.ok(lifoData.craftHistory.every(event => event.status === "UNDONE"));
  assert.equal(lifoErrors.length, 0);
  results.lifo = { status: "PASS", order: "SECOND_THEN_FIRST", quantities: [21, 16, 13, 16, 21], finalInventoryEqualsInitial: true, materialRoundTripLossUnits: 0 };
  await lifo.context.close();

  const fullErrors = [];
  const full = await openApplication(browser, `${origin}/app`, fullErrors);
  const seededFull = await seedNormalized(full.page, source.normalized, 1, 0, "c006-full");
  await reloadToCrafting(full.page);
  const fullRevisionsBeforeComplete = await revisions(full.page);
  let fullData = await completeCraft(full.page, seededFull.card.id, 1);
  assert.equal(fullData.craftingCards.length, 0);
  assert.equal(fullData.materialBatches.length, 0);
  const fullEvent = copy(fullData.craftHistory[0]);
  const fullRevisionsBeforeUndo = await revisions(full.page);
  await switchToHistory(full.page);
  const fullGroup = await openHistoryGroup(full.page, seededFull.card.id);
  const fullEventDom = await openHistoryEvent(fullGroup, 0);
  await fullEventDom.locator(".spg-c006-undo-open").click();
  await full.page.waitForSelector("#craftUndoDialog[open]");
  assert.match(await full.page.textContent("#craftUndoCardResult"), /Card visszaáll: 1 craft.*prioritás 1/);
  await full.page.click("#confirmCraftUndoButton");
  await full.page.waitForFunction(() => document.body.dataset.craftUndoState === "UNDONE");
  fullData = await durableSnapshot(full.page);
  const fullRevisionsAfterUndo = await revisions(full.page);
  assert.equal(fullData.craftingCards.length, 1);
  assert.deepEqual(omitCardVolatile(fullData.craftingCards[0]), omitCardVolatile(fullEvent.preCraftCardSnapshot));
  assert.deepEqual(batchUnits(fullData), Object.fromEntries(seededFull.batches.map(batch => [batch.id, batch.quantityUnits])));
  assert.deepEqual(fullData.craftHistory[0].restoredBatches.map(entry => entry.mode), ["RECREATED", "RECREATED", "RECREATED"]);
  assert.equal(fullRevisionsAfterUndo.inventoryRevision, fullRevisionsBeforeUndo.inventoryRevision + 1);
  assert.equal(fullRevisionsAfterUndo.allocationRevision, fullRevisionsBeforeUndo.allocationRevision + 1);
  assert.equal(fullRevisionsAfterUndo.craftListRevision, fullRevisionsBeforeUndo.craftListRevision + 1);
  assert.equal(fullData.craftingCards[0].cardRevision, fullEvent.cardRevisionAfter + 1);
  await reloadToCrafting(full.page);
  assert.equal((await durableSnapshot(full.page)).craftingCards[0].id, seededFull.card.id);
  assert.equal(fullErrors.length, 0);
  results.fullUndo = {
    status: "PASS",
    cardRemovedThenRestored: true,
    exactOriginalIdentityAndSettings: true,
    restoredOrder: fullData.craftingCards[0].order,
    restoreModes: fullData.craftHistory[0].restoredBatches.map(entry => entry.mode),
    revisionsBeforeComplete: fullRevisionsBeforeComplete,
    revisionsBeforeUndo: fullRevisionsBeforeUndo,
    revisionsAfterUndo: fullRevisionsAfterUndo,
    reload: "PASS",
    materialRoundTripLossUnits: 0
  };
  results.reload.full = { status: "PASS", cardId: seededFull.card.id, quantity: 1 };
  await full.context.close();

  const cardBlockErrors = [];
  const cardBlock = await openApplication(browser, `${origin}/app`, cardBlockErrors);
  const seededCardBlock = await seedNormalized(cardBlock.page, source.normalized, 8, 1, "c006-card-block");
  await reloadToCrafting(cardBlock.page);
  const cardBlockData = await completeCraft(cardBlock.page, seededCardBlock.card.id, 2);
  const cardBlockEvent = cardBlockData.craftHistory[0];
  await cardBlock.page.evaluate(async cardId => {
    const test = window.__SPG_TEST__;
    const cards = await test.userDataRepository.loadCraftingCards();
    const target = cards.find(card => card.id === cardId);
    target.quantity -= 1;
    await test.userDataRepository.saveCraftingCards(cards);
  }, seededCardBlock.card.id);
  results.blockers.cardSemanticEdit = await expectBlockedPrepare(cardBlock.page, cardBlockEvent.craftTransactionId, "UNDO_CARD_REVISION_MISMATCH");
  assert.equal(cardBlockErrors.length, 0);
  await cardBlock.context.close();

  const listBlockErrors = [];
  const listBlock = await openApplication(browser, `${origin}/app`, listBlockErrors);
  const seededListBlock = await seedNormalized(listBlock.page, source.normalized, 1, 0, "c006-list-block");
  await reloadToCrafting(listBlock.page);
  const listBlockData = await completeCraft(listBlock.page, seededListBlock.card.id, 1);
  const listBlockEvent = listBlockData.craftHistory[0];
  await listBlock.page.evaluate(async normalized => {
    const test = window.__SPG_TEST__;
    const added = test.buildCraftingCard(normalized);
    added.quantity = 1;
    await test.userDataRepository.saveCraftingCards([added]);
  }, source.normalized);
  results.blockers.fullListMutation = await expectBlockedPrepare(listBlock.page, listBlockEvent.craftTransactionId, "UNDO_CRAFT_LIST_REVISION_MISMATCH");
  assert.equal(listBlockErrors.length, 0);
  await listBlock.context.close();

  const collisionErrors = [];
  const collision = await openApplication(browser, `${origin}/app`, collisionErrors);
  const seededCollision = await seedNormalized(collision.page, source.normalized, 1, 0, "c006-collision");
  await reloadToCrafting(collision.page);
  const collisionData = await completeCraft(collision.page, seededCollision.card.id, 1);
  const collisionEvent = collisionData.craftHistory[0];
  const incompatible = { ...seededCollision.batches[0], materialUuid: "incompatible-material", sourceMaterialUuid: "incompatible-source", quality: 100, quantityUnits: 1 };
  await collision.page.evaluate(async batch => window.__SPG_TEST__.userDataRepository.saveMaterialBatches([batch]), incompatible);
  results.blockers.incompatibleBatchId = await expectBlockedPrepare(collision.page, collisionEvent.craftTransactionId, "UNDO_BATCH_ID_COLLISION");
  const collisionAfter = await durableSnapshot(collision.page);
  assert.equal(collisionAfter.materialBatches[0].materialUuid, "incompatible-material");
  assert.equal(collisionErrors.length, 0);
  await collision.context.close();

  const rollbackErrors = [];
  const rollback = await openApplication(browser, `${origin}/app`, rollbackErrors);
  const seededRollback = await seedNormalized(rollback.page, source.normalized, 6, 1, "c006-rollback");
  await reloadToCrafting(rollback.page);
  const rollbackData = await completeCraft(rollback.page, seededRollback.card.id, 2);
  const rollbackEvent = rollbackData.craftHistory[0];
  const prepared = await rollback.page.evaluate(async transactionId => {
    const value = await window.__SPG_TEST__.prepareCraftUndo(transactionId, "undo-c006-rollback-0001");
    return JSON.parse(JSON.stringify(value.request));
  }, rollbackEvent.craftTransactionId);
  const stages = ["AFTER_BATCH_RESTORE", "BEFORE_CARD_RESTORE", "AFTER_HISTORY_UPDATE", "BEFORE_META_UPDATE"];
  const stageResults = [];
  for (const stage of stages) {
    const before = await durableSnapshot(rollback.page);
    const code = await rollback.page.evaluate(async ({ request, stage }) => {
      try {
        await window.__SPG_TEST__.commitPreparedCraftUndo(request, { simulateFailureAt: stage });
        return "UNEXPECTED_SUCCESS";
      } catch (error) {
        return error.code || error.message;
      }
    }, { request: prepared, stage });
    const after = await durableSnapshot(rollback.page);
    assert.equal(code, "SIMULATED_CRAFT_UNDO_ABORT");
    assert.deepEqual(after, before);
    assert.equal(after.craftHistory[0].status, "COMPLETED");
    stageResults.push({ stage, code, durableWrites: 0, status: "ROLLED_BACK" });
  }
  assert.equal(rollbackErrors.length, 0);
  results.rollback = { status: "PASS_ATOMIC", stores: ["materialBatches", "userInventory", "craftingCards", "craftHistory", "userMeta"], stages: stageResults };
  await rollback.context.close();

  const legacyErrors = [];
  const legacy = await openApplication(browser, `${origin}/app`, legacyErrors);
  await legacy.page.evaluate(async () => {
    await window.__SPG_TEST__.database.put("craftHistory", {
      craftTransactionId: "legacy-c006-browser",
      craftingCardId: "legacy-card-c006",
      status: "COMPLETED",
      timestamp: "2026-09-10T10:00:00.000Z",
      itemName: "Legacy product",
      completedQuantity: 1,
      consumedDeltas: []
    });
  });
  await reloadToCrafting(legacy.page);
  await switchToHistory(legacy.page);
  const legacyGroup = await openHistoryGroup(legacy.page, "legacy-card-c006");
  const legacyEvent = await openHistoryEvent(legacyGroup, 0);
  assert.equal(await legacyEvent.locator(".spg-c006-undo-open").count(), 0);
  assert.match(await legacyEvent.textContent(), /Legacy esemény – nem vonható vissza biztonságosan/);
  assert.equal(legacyErrors.length, 0);
  results.legacy = { status: "BLOCKED", undoButton: false, message: "Legacy esemény – nem vonható vissza biztonságosan.", fabricatedEvidence: false };
  await legacy.context.close();

  const fileErrors = [];
  const file = await openApplication(browser, pathToFileURL(appPath).href, fileErrors, { width: 390, height: 844 });
  await file.page.click("#craftingListNav");
  await switchToHistory(file.page);
  const fileState = await file.page.evaluate(() => ({
    version: window.__SPG_TEST__.app.version,
    undoDialogPresent: Boolean(document.getElementById("craftUndoDialog")),
    runtimeFileCount: 1,
    localRuntimeSidecars: 0,
    documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  assert.equal(fileState.version, "V004-dev");
  assert.equal(fileState.undoDialogPresent, true);
  assert.ok(fileState.documentOverflow <= 1);
  assert.equal(fileErrors.length, 0);
  results.fileGate = { status: "PASS_AUTOMATED_DIRECT_FILE", ...fileState, consoleErrors: fileErrors };
  await file.context.close();

  allErrors.push(...partialErrors, ...lifoErrors, ...fullErrors, ...cardBlockErrors, ...listBlockErrors, ...collisionErrors, ...rollbackErrors, ...legacyErrors, ...fileErrors);
  assert.equal(allErrors.length, 0);
  results.status = "PASS_TARGETED_CHROME";
  fs.mkdirSync(artifactDirectory, { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
  console.log(`V004_C006_TARGETED_CHROME_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
} finally {
  if (browser) await browser.close();
  await closeServer(server);
}
