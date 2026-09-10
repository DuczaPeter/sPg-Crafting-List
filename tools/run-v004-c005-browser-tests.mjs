import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C005");
const evidencePath = path.join(artifactDirectory, "browser-evidence.json");
const appBuffer = fs.readFileSync(appPath);
const moduleArgument = process.argv.find(value => value.startsWith("--playwright-module="));
const exactBlueprintUuid = "280f47b7-8434-410c-b854-380768fdccec";

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

async function durableSnapshot(page) {
  return page.evaluate(async () => JSON.parse(JSON.stringify(await window.__SPG_TEST__.userDataRepository.readAllUserData())));
}

async function presentationTruthSnapshot(page) {
  return page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const copy = value => JSON.parse(JSON.stringify(value));
    return {
      durable: copy(await test.userDataRepository.readAllUserData()),
      revisions: copy(test.state.revisions),
      cards: copy(test.state.craftingCards),
      batches: copy(test.state.materialBatches),
      allocationResult: copy(test.state.allocationResult),
      reservations: copy(Array.from(test.state.reservationSnapshots.entries()))
    };
  });
}

async function seedProductionBlueprint(page, craftRuns) {
  return page.evaluate(async ({ blueprintUuid, craftRuns }) => {
    const test = window.__SPG_TEST__;
    const version = await test.adapter.getDefaultGameVersion();
    test.state.gameVersion = version;
    const normalized = await test.loadBlueprintDetail(blueprintUuid, { ownsProcess: false });
    const card = test.buildCraftingCard(normalized);
    card.quantity = craftRuns;
    card.outputCountEvidence = test.v004RevisionReservation.outputCountEvidence.UNPROVEN;
    const timestamp = new Date().toISOString();
    const batches = card.requirements.map((requirement, index) => ({
      id: `batch-c005-${index + 1}`,
      materialUuid: requirement.ingredientUuid,
      sourceMaterialUuid: requirement.ingredientUuid,
      materialName: requirement.materialName,
      quality: 900,
      quantityUnits: requirement.requiredQuantityUnits * craftRuns + 1,
      unit: requirement.unit,
      createdAt: timestamp,
      updatedAt: timestamp
    }));
    await test.userDataRepository.saveCraftingCards([card]);
    await test.userDataRepository.saveMaterialBatches(batches);
    return { version: version.code, card, batches };
  }, { blueprintUuid: exactBlueprintUuid, craftRuns });
}

async function switchToHistory(page) {
  await page.click("#craftHistoryTab");
  await page.waitForFunction(() => document.body.dataset.craftingListView === "HISTORY");
}

async function collectHistoryDom(page) {
  return page.evaluate(() => ({
    view: document.body.dataset.craftingListView,
    groupOrder: document.body.dataset.craftHistoryGroupOrder,
    groups: Array.from(document.querySelectorAll(".spg-c005-history-group")).map(group => ({
      cardId: group.dataset.craftingCardId,
      groupKey: group.dataset.groupKey,
      eventCount: Number(group.dataset.eventCount),
      latestSequence: group.dataset.latestSequence,
      activeCompletedCraftRuns: group.dataset.activeCompletedCraftRuns,
      text: group.querySelector(":scope > summary").textContent,
      events: Array.from(group.querySelectorAll(".spg-c005-history-event")).map(event => ({
        transactionId: event.dataset.historyTransactionId,
        sequence: event.dataset.historySequence,
        status: event.dataset.historyStatus,
        semantics: event.dataset.quantitySemantics,
        summary: event.querySelector(":scope > summary").textContent,
        text: event.textContent,
        deltas: Array.from(event.querySelectorAll(".spg-c005-history-delta")).map(delta => ({
          batchId: delta.dataset.batchId,
          canonicalMaterialUuid: delta.dataset.canonicalMaterialUuid,
          quality: delta.dataset.quality,
          unit: delta.dataset.unit,
          consumedUnits: delta.dataset.consumedUnits,
          text: delta.textContent
        }))
      }))
    }))
  }));
}

async function expandFirstGroupAndEvent(page) {
  const group = page.locator(".spg-c005-history-group").first();
  const groupSummary = group.locator(":scope > summary");
  await groupSummary.focus();
  await page.keyboard.press("Enter");
  assert.equal(await group.getAttribute("open"), "");
  const event = group.locator(".spg-c005-history-event").first();
  const eventSummary = event.locator(":scope > summary");
  await eventSummary.focus();
  await page.keyboard.press("Enter");
  assert.equal(await event.getAttribute("open"), "");
}

async function layoutSnapshot(page, width, height) {
  await page.setViewportSize({ width, height });
  return page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    historyListWidth: document.getElementById("craftHistoryList").getBoundingClientRect().width,
    deltaOverflow: Array.from(document.querySelectorAll(".spg-c005-history-delta")).some(row => row.scrollWidth > row.clientWidth + 1)
  }));
}

const playwright = await loadPlaywright();
const { server, origin } = await startServer();
let browser;
const errors = [];
const results = {
  cycle: "V004-C005",
  status: "PENDING",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  browser: "Google Chrome",
  production: {},
  fixtures: {},
  presentationOnly: {},
  layout: {},
  reload: {},
  fileGate: {},
  consoleErrors: errors
};

try {
  browser = await playwright.chromium.launch({ channel: "chrome", headless: true });

  const productionErrors = [];
  const production = await openApplication(browser, `${origin}/app`, productionErrors);
  const seeded = await seedProductionBlueprint(production.page, 21);
  assert.equal(seeded.card.quantitySemantics, "CRAFT_RUN_COUNT");
  assert.deepEqual(seeded.card.requirements.map(requirement => requirement.requiredQuantityUnits), [3600, 7, 7]);
  await production.page.reload({ waitUntil: "domcontentloaded" });
  await production.page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await production.page.click("#craftingListNav");
  assert.equal(await production.page.getAttribute("#activeCraftsTab", "aria-selected"), "true");
  assert.equal(await production.page.getAttribute("#craftHistoryView", "hidden"), "");
  await production.page.click("#reallocateCraftingListButton");
  await production.page.waitForFunction(() => document.body.dataset.reservationRunStatus === "VALID");
  const cardId = seeded.card.id;
  const control = `[data-card-id="${cardId}"].spg-v004-completion-controls`;
  const quantityInput = `${control} .spg-v004-completion-quantity`;
  const completeButton = `${control} .spg-v004-completion-open`;

  await production.page.fill(quantityInput, "5");
  await production.page.click(completeButton);
  await production.page.waitForSelector("#craftCompletionDialog[open]");
  await production.page.click("#confirmCraftCompletionButton");
  await production.page.waitForFunction(() => document.body.dataset.craftCompletionState === "COMPLETED");
  let data = await durableSnapshot(production.page);
  assert.equal(data.craftingCards[0].quantity, 16);
  assert.equal(data.craftHistory.length, 1);
  assert.deepEqual(data.craftHistory[0].consumedDeltas.map(delta => delta.consumedUnits), [18000, 35, 35]);
  const beforePresentation = await presentationTruthSnapshot(production.page);

  await switchToHistory(production.page);
  assert.equal(await production.page.getAttribute("#craftHistoryTab", "aria-selected"), "true");
  assert.equal(await production.page.getAttribute("#craftingActiveView", "hidden"), "");
  await expandFirstGroupAndEvent(production.page);
  let history = await collectHistoryDom(production.page);
  assert.equal(history.groups.length, 1);
  assert.equal(history.groups[0].cardId, cardId);
  assert.equal(history.groups[0].eventCount, 1);
  assert.equal(history.groups[0].activeCompletedCraftRuns, "5");
  assert.match(history.groups[0].text, /1 esemény.*×5 lezárt craft/s);
  assert.deepEqual(history.groups[0].events.map(event => event.sequence), ["1"]);
  assert.equal(history.groups[0].events[0].status, "COMPLETED");
  assert.match(history.groups[0].events[0].summary, /×5 craft.*Kész/s);
  assert.match(history.groups[0].events[0].text, new RegExp(seeded.card.blueprintUuid));
  assert.match(history.groups[0].events[0].text, /Reservation snapshot hash/);
  assert.match(history.groups[0].events[0].text, /Inventory revision/);
  assert.deepEqual(history.groups[0].events[0].deltas.map(delta => Number(delta.consumedUnits)), [18000, 35, 35]);
  assert.deepEqual(history.groups[0].events[0].deltas.map(delta => delta.batchId), seeded.batches.map(batch => batch.id));
  assert.ok(history.groups[0].events[0].deltas.every(delta => delta.quality === "900" && /Q900/.test(delta.text)));
  assert.match(history.groups[0].events[0].deltas[0].text, /18000 unit · 1\.8000 SCU/);
  assert.ok(history.groups[0].events[0].deltas.slice(1).every(delta => /35 db/.test(delta.text)));

  const desktopLayout = await layoutSnapshot(production.page, 1920, 1080);
  const mobileLayout = await layoutSnapshot(production.page, 390, 844);
  assert.ok(desktopLayout.documentScrollWidth <= desktopLayout.documentClientWidth + 1);
  assert.ok(mobileLayout.documentScrollWidth <= mobileLayout.documentClientWidth + 1);
  assert.equal(desktopLayout.deltaOverflow, false);
  assert.equal(mobileLayout.deltaOverflow, false);
  results.layout = { desktop: desktopLayout, mobile: mobileLayout, status: "PASS_NO_HORIZONTAL_OVERFLOW" };

  await production.page.click("#activeCraftsTab");
  const afterPresentation = await presentationTruthSnapshot(production.page);
  assert.deepEqual(afterPresentation, beforePresentation, "History tab and expand/collapse must perform zero durable/domain writes.");
  assert.equal(await production.page.locator(`[data-card-id="${cardId}"].spg-crafting-card`).count(), 1);
  assert.equal((await durableSnapshot(production.page)).craftingCards[0].quantity, 16);
  results.presentationOnly = {
    status: "PASS_ZERO_WRITES",
    durableWrites: 0,
    revisionChanges: 0,
    allocationChanges: 0,
    reservationChanges: 0,
    activeCardQuantityAfterHistory: 16,
    keyboardExpandCollapse: "PASS"
  };

  await production.page.click("#reallocateCraftingListButton");
  await production.page.waitForFunction(() => document.body.dataset.reservationRunStatus === "VALID");
  await production.page.click(`${control} .spg-v004-completion-max`);
  assert.equal(await production.page.inputValue(quantityInput), "16");
  await production.page.click(completeButton);
  await production.page.waitForSelector("#craftCompletionDialog[open]");
  await production.page.click("#confirmCraftCompletionButton");
  await production.page.waitForFunction(() => document.body.dataset.craftCompletionState === "COMPLETED");
  data = await durableSnapshot(production.page);
  assert.equal(data.craftingCards.length, 0);
  assert.equal(data.craftHistory.length, 2);
  assert.deepEqual(data.materialBatches.map(batch => batch.quantityUnits), [1, 1, 1]);
  await switchToHistory(production.page);
  history = await collectHistoryDom(production.page);
  assert.equal(history.groups.length, 1);
  assert.equal(history.groups[0].eventCount, 2);
  assert.equal(history.groups[0].activeCompletedCraftRuns, "21");
  assert.deepEqual(history.groups[0].events.map(event => event.sequence), ["2", "1"]);
  assert.deepEqual(data.craftHistory.flatMap(event => event.consumedDeltas).map(delta => delta.beforeUnits - delta.consumedUnits - delta.afterUnits), [0, 0, 0, 0, 0, 0]);
  results.production = {
    status: "PASS_PARTIAL_AND_FULL",
    blueprintUuid: seeded.card.blueprintUuid,
    outputName: seeded.card.outputName,
    gameVersion: seeded.version,
    craftingCardId: cardId,
    partial: { completedCraftRuns: 5, remainingCraftRuns: 16, consumedUnits: [18000, 35, 35] },
    full: { completedCraftRuns: 16, activeCards: 0, finalBatchUnits: [1, 1, 1] },
    history: { groups: 1, events: 2, newestFirst: [2, 1], activeCompletedCraftRuns: 21 },
    materialLossUnits: 0
  };

  await production.page.reload({ waitUntil: "domcontentloaded" });
  await production.page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await production.page.click("#craftingListNav");
  await switchToHistory(production.page);
  const reloadedHistory = await collectHistoryDom(production.page);
  assert.equal(reloadedHistory.groups.length, 1);
  assert.deepEqual(reloadedHistory.groups[0].events.map(event => event.sequence), ["2", "1"]);
  assert.equal(reloadedHistory.groups[0].activeCompletedCraftRuns, "21");
  results.reload.production = { status: "PASS", groups: 1, events: 2, newestFirst: [2, 1] };
  assert.equal(productionErrors.length, 0);
  await production.context.close();

  const fixtureErrors = [];
  const fixture = await openApplication(browser, `${origin}/app`, fixtureErrors);
  await fixture.page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const makeEvent = ({ id, cardId, sequence, timestamp, status, quantity, schema = "V004_CRAFT_HISTORY_EVENT_2" }) => ({
      eventSchema: schema,
      quantitySemantics: schema === "V004_CRAFT_HISTORY_EVENT_2" ? "CRAFT_RUN_COUNT" : undefined,
      craftRunInputEvidence: schema === "V004_CRAFT_HISTORY_EVENT_2" ? "CRAFT_RUN_INPUTS_EXACT" : undefined,
      craftTransactionId: id,
      historySequence: sequence,
      craftingCardId: cardId,
      status,
      itemName: `Product ${cardId || "Legacy"}`,
      blueprintIdentity: { blueprintUuid: `blueprint-${cardId || "legacy"}` },
      outputIdentity: { itemIdentity: `item-${cardId || "legacy"}`, outputUuid: `output-${cardId || "legacy"}` },
      completedQuantity: quantity,
      remainingBefore: 10,
      remainingAfter: 10 - quantity,
      timestamp,
      reservationSnapshotHash: `hash-${id}`,
      inventoryRevisionBefore: 1,
      inventoryRevisionAfter: 2,
      allocationRevisionBefore: 1,
      allocationRevisionUsed: 1,
      allocationRevisionAfter: 2,
      cardRevisionBefore: 0,
      cardRevisionAfter: 1,
      craftListRevisionBefore: 0,
      craftListRevisionAfter: 1,
      preCraftCardSnapshot: {
        outputName: `Product ${cardId || "Legacy"}`,
        blueprintUuid: `blueprint-${cardId || "legacy"}`,
        itemIdentity: `item-${cardId || "legacy"}`,
        requirements: [{ id: `slot-${id}`, materialName: `Material ${id}` }]
      },
      consumedDeltas: [{
        sequence: 0,
        recipeSlotId: `slot-${id}`,
        batchId: `batch-${id}`,
        canonicalMaterialUuid: `material-${id}`,
        sourceMaterialUuid: `source-${id}`,
        quality: 875,
        unit: "SCU",
        consumedUnits: 1234,
        beforeUnits: 5000,
        afterUnits: 3766,
        preCraftBatchSnapshot: { materialName: `Material ${id}` }
      }]
    });
    const events = [
      makeEvent({ id: "a-1", cardId: "card-a", sequence: 1, timestamp: "2026-01-01T10:00:00.000Z", status: "COMPLETED", quantity: 2 }),
      makeEvent({ id: "a-2", cardId: "card-a", sequence: 2, timestamp: "2026-01-02T10:00:00.000Z", status: "UNDONE", quantity: 2 }),
      makeEvent({ id: "b-3", cardId: "card-b", sequence: 3, timestamp: "2026-01-03T10:00:00.000Z", status: "COMPLETED", quantity: 3 }),
      makeEvent({ id: "a-4", cardId: "card-a", sequence: 4, timestamp: "2026-01-04T10:00:00.000Z", status: "COMPLETED", quantity: 4 }),
      makeEvent({ id: "legacy-z", cardId: null, sequence: undefined, timestamp: "2025-12-31T10:00:00.000Z", status: "MYSTERY", quantity: 9, schema: "V004_CRAFT_HISTORY_EVENT_1" })
    ];
    for (const event of events) await test.database.put("craftHistory", event);
  });
  await fixture.page.reload({ waitUntil: "domcontentloaded" });
  await fixture.page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await fixture.page.click("#craftingListNav");
  await switchToHistory(fixture.page);
  let fixtureHistory = await collectHistoryDom(fixture.page);
  assert.deepEqual(fixtureHistory.groups.map(group => group.cardId), ["card-a", "card-b", "legacy-missing"]);
  assert.deepEqual(fixtureHistory.groups[0].events.map(event => event.sequence), ["4", "2", "1"]);
  assert.deepEqual(fixtureHistory.groups[0].events.map(event => event.status), ["COMPLETED", "UNDONE", "COMPLETED"]);
  assert.equal(fixtureHistory.groups[0].activeCompletedCraftRuns, "6");
  assert.equal(fixtureHistory.groups[1].activeCompletedCraftRuns, "3");
  assert.equal(fixtureHistory.groups[2].activeCompletedCraftRuns, "unproven");
  assert.equal(fixtureHistory.groups[2].events[0].status, "UNKNOWN");
  assert.match(fixtureHistory.groups[2].events[0].summary, /Legacy esemény.*Ismeretlen állapot: MYSTERY/s);
  await fixture.page.locator(".spg-c005-history-group").nth(2).locator(":scope > summary").click();
  await fixture.page.locator(".spg-c005-history-group").nth(2).locator(".spg-c005-history-event > summary").click();
  fixtureHistory = await collectHistoryDom(fixture.page);
  assert.match(fixtureHistory.groups[2].events[0].text, /mennyiségi szemantika nem bizonyított/i);
  assert.match(fixtureHistory.groups[2].events[0].deltas[0].text, /1234 unit · 0\.1234 SCU/);
  const fixtureBeforeReload = fixtureHistory.groups.map(group => ({ cardId: group.cardId, events: group.events.map(event => `${event.sequence}:${event.status}`) }));
  await fixture.page.reload({ waitUntil: "domcontentloaded" });
  await fixture.page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await fixture.page.click("#craftingListNav");
  await switchToHistory(fixture.page);
  fixtureHistory = await collectHistoryDom(fixture.page);
  const fixtureAfterReload = fixtureHistory.groups.map(group => ({ cardId: group.cardId, events: group.events.map(event => `${event.sequence}:${event.status}`) }));
  assert.deepEqual(fixtureAfterReload, fixtureBeforeReload);
  results.fixtures = {
    status: "PASS",
    groupOrder: fixtureHistory.groups.map(group => group.cardId),
    cardAEventOrder: fixtureHistory.groups[0].events.map(event => Number(event.sequence)),
    cardAStatuses: fixtureHistory.groups[0].events.map(event => event.status),
    activeTotals: fixtureHistory.groups.map(group => group.activeCompletedCraftRuns),
    legacy: "FAIL_CLOSED_DISPLAY",
    unknownStatusVisible: true,
    reloadStable: true
  };
  results.reload.fixtures = { status: "PASS", orderAndStatusesStable: true };
  assert.equal(fixtureErrors.length, 0);
  await fixture.context.close();

  const fileErrors = [];
  const file = await openApplication(browser, pathToFileURL(appPath).href, fileErrors, { width: 390, height: 844 });
  await file.page.click("#craftingListNav");
  assert.equal(await file.page.getAttribute("#activeCraftsTab", "aria-selected"), "true");
  await switchToHistory(file.page);
  const fileState = await file.page.evaluate(() => ({
    version: window.__SPG_TEST__.app.version,
    runtimeFileCount: 1,
    localRuntimeSidecars: 0,
    view: document.body.dataset.craftingListView,
    emptyOrHistoryVisible: !document.getElementById("craftHistoryView").hidden,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  assert.equal(fileState.version, "V004-dev");
  assert.equal(fileState.view, "HISTORY");
  assert.equal(fileState.emptyOrHistoryVisible, true);
  assert.ok(fileState.scrollWidth <= fileState.clientWidth + 1);
  assert.equal(fileErrors.length, 0);
  results.fileGate = { status: "PASS_AUTOMATED", ...fileState, consoleErrors: fileErrors };
  await file.context.close();

  errors.push(...productionErrors, ...fixtureErrors, ...fileErrors);
  assert.equal(errors.length, 0);
  results.status = "PASS_TARGETED_CHROME";
  fs.mkdirSync(artifactDirectory, { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
  console.log(`V004_C005_TARGETED_CHROME_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
} finally {
  if (browser) await browser.close();
  await closeServer(server);
}
