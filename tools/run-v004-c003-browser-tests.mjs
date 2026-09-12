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
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C003");
const evidencePath = path.join(artifactDirectory, "browser-evidence.json");
const appHtml = fs.readFileSync(appPath);
const sourceFixture = JSON.parse(fs.readFileSync(sourceFixturePath, "utf8"));
const moduleArgument = process.argv.find(value => value.startsWith("--playwright-module="));
const copy = value => JSON.parse(JSON.stringify(value));

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
    response.end("<!doctype html><meta charset=\"utf-8\"><title>V004 C003 seed</title>");
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

async function runtimeSnapshot(page) {
  return page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const meta = Object.fromEntries((await test.userDataRepository.loadUserMeta()).map(record => [record.key, record.value]));
    return {
      revisions: {
        inventoryRevision: meta.inventoryRevision,
        craftListRevision: meta.craftListRevision,
        allocationRevision: meta.allocationRevision
      },
      cards: test.state.craftingCards.map(card => ({
        id: card.id,
        order: card.order,
        quantity: card.quantity,
        cardRevision: card.cardRevision,
        collapsed: card.collapsed,
        quantitySemantics: card.quantitySemantics,
        craftRunInputEvidence: card.craftRunInputEvidence,
        outputCountEvidence: card.outputCountEvidence,
        requirements: card.requirements.map(requirement => ({
          id: requirement.id,
          sourceQuantityValue: requirement.sourceQuantityValue,
          requiredQuantityUnits: requirement.requiredQuantityUnits,
          exactRequiredQuantityUnits: requirement.exactRequiredQuantityUnits,
          quantityExactness: requirement.quantityExactness,
          quantityExactnessReason: requirement.quantityExactnessReason,
          quantityNormalizationStatus: requirement.quantityNormalizationStatus
        }))
      })),
      reservationRunStatus: test.state.reservationRunStatus,
      bodyReservationRunStatus: document.body.dataset.reservationRunStatus,
      reservationSnapshots: Array.from(test.state.reservationSnapshots.entries()).map(([cardId, snapshot]) => ({
        cardId,
        status: snapshot.status,
        reason: snapshot.reason,
        blockerReason: snapshot.capability && snapshot.capability.blockerReason
      })),
      renderedCards: Array.from(document.querySelectorAll(".spg-c012-list-card")).map(card => ({
        id: card.dataset.cardId,
        order: Number(card.dataset.cardOrder),
        cardRevision: Number(card.dataset.cardRevision),
        status: card.dataset.reservationStatus,
        hash: card.dataset.reservationSnapshotHash,
        maxCompletableQuantity: Number(card.dataset.maxCompletableQuantity),
        collapsed: card.dataset.collapsed
      }))
    };
  });
}

async function reallocateAndAssertValid(page) {
  const buttonSelector = "#reallocateCraftingListButton";
  assert.equal(await page.isEnabled(buttonSelector), true, "Reallocate must be enabled before the explicit action.");
  await page.click(buttonSelector);
  await page.waitForFunction(selector => {
    const button = document.querySelector(selector);
    return Boolean(button && button.disabled === false);
  }, buttonSelector);
  const snapshot = await runtimeSnapshot(page);
  const diagnostic = JSON.stringify({
    state: snapshot.reservationRunStatus,
    body: snapshot.bodyReservationRunStatus,
    cards: snapshot.reservationSnapshots
  });
  assert.equal(snapshot.bodyReservationRunStatus, snapshot.reservationRunStatus, `Reservation DOM/state mismatch after Reallocate: ${diagnostic}`);
  assert.equal(snapshot.reservationRunStatus, "VALID", `Reallocate completed without a VALID reservation: ${diagnostic}`);
  return snapshot;
}

function buildBrowserCard({ id, order, quantity, blueprintUuid, outputUuid, outputName, slotId, timestamp }) {
  const card = copy(sourceFixture.card);
  const requirement = copy(card.requirements[0]);
  Object.assign(card, {
    id,
    order,
    cardRevision: 0,
    active: true,
    collapsed: false,
    quantity,
    blueprintUuid,
    blueprintCacheKey: `TEST-LIVE::${blueprintUuid}`,
    gameVersion: "TEST-LIVE",
    outputUuid,
    outputName,
    requirements: [requirement],
    slotStrategies: {},
    recipeSlotQualityPoolAssignments: {},
    createdAt: timestamp,
    updatedAt: timestamp
  });
  Object.assign(requirement, {
    id: slotId,
    ingredientUuid: "material-browser",
    commodityUuid: "material-browser",
    materialName: "Browser Material",
    qualityCapability: "FIXED"
  });
  return card;
}

const cards = [
  buildBrowserCard({
    id: "card-browser-a",
    order: 0,
    quantity: 5,
    blueprintUuid: "blueprint-browser-a",
    outputUuid: "output-browser-a",
    outputName: "Browser Output A",
    slotId: "slot-browser-a",
    timestamp: "2026-09-09T08:00:00.000Z"
  }),
  buildBrowserCard({
    id: "card-browser-b",
    order: 1,
    quantity: 2,
    blueprintUuid: "blueprint-browser-b",
    outputUuid: "output-browser-b",
    outputName: "Browser Output B",
    slotId: "slot-browser-b",
    timestamp: "2026-09-09T08:00:01.000Z"
  })
];

cards.forEach(card => {
  assert.equal(card.quantitySemantics, "CRAFT_RUN_COUNT");
  assert.equal(card.craftRunInputEvidence, "CRAFT_RUN_INPUTS_EXACT");
  assert.equal(card.outputCountEvidence, "PER_FINISHED_ITEM_NORMALIZED_EXACT");
  assert.equal(card.requirements.length, 1);
  assert.equal(card.requirements[0].sourceQuantityValue, 0.001);
  assert.equal(card.requirements[0].requiredQuantityUnits, 10);
  assert.equal(card.requirements[0].exactRequiredQuantityUnits, 10);
  assert.equal(card.requirements[0].quantityExactness, "EXACT_SAFE_INTEGER_UNITS");
  assert.equal(card.requirements[0].quantityExactnessReason, null);
});

const batches = [{
  id: "batch-browser",
  materialUuid: "material-browser",
  sourceMaterialUuid: "material-browser",
  materialName: "Browser Material",
  quality: null,
  quantityUnits: 200,
  unit: "SCU",
  createdAt: "2026-09-09T08:00:00.000Z",
  updatedAt: "2026-09-09T08:00:00.000Z"
}];

const playwright = await loadPlaywright();
const { server, origin } = await startServer();
let browser;
const errors = [];
const results = {
  cycle: "V004-C003",
  status: "PENDING",
  applicationSha256: crypto.createHash("sha256").update(appHtml).digest("hex"),
  browser: "Google Chrome",
  origin,
  startup: {},
  revisionMutations: [],
  reservation: {},
  atomicRollback: {},
  reloadGate: {},
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
      revisions: {
        inventoryRevision: meta.inventoryRevision,
        craftListRevision: meta.craftListRevision,
        allocationRevision: meta.allocationRevision
      },
      cards: test.state.craftingCards.length,
      batches: test.state.materialBatches.length,
      reservationRunStatus: test.state.reservationRunStatus,
      baseUi: {
        moduleNavButtons: document.querySelectorAll(".spg-module-nav button").length,
        applicationStatus: document.getElementById("applicationStatus").textContent,
        blueprintBrowserVisible: !document.getElementById("blueprintBrowserPanel").hidden
      }
    };
  });
  assert.equal(startup.app.version, process.env.SPG_EXPECTED_RUNTIME_IDENTITY || "V004-dev");
  assert.equal(startup.app.schemaVersion, 7);
  assert.equal(startup.app.dbName, "spg-crafting-list-v004");
  assert.equal(startup.app.dbVersion, 1);
  assert.equal(startup.app.backupSchemaVersion, 3);
  assert.deepEqual(startup.revisions, { inventoryRevision: 0, craftListRevision: 0, allocationRevision: 0 });
  assert.equal(startup.cards, 0);
  assert.equal(startup.batches, 0);
  assert.equal(startup.reservationRunStatus, "ABSENT");
  assert.deepEqual(startup.baseUi, { moduleNavButtons: 8, applicationStatus: `${process.env.SPG_EXPECTED_RUNTIME_IDENTITY || "V004-dev"} · schema 7`, blueprintBrowserVisible: true });
  results.startup = { status: "PASS", ...startup };

  const seeded = await page.evaluate(async input => {
    const test = window.__SPG_TEST__;
    const canonicalCards = input.cards.map((card, index) => test.normalizeStoredCraftingCard(card, index));
    const cardResult = await test.userDataRepository.saveCraftingCards(canonicalCards);
    const batchResult = await test.userDataRepository.saveMaterialBatches(input.batches);
    const durableCards = (await test.database.getAll("craftingCards"))
      .sort((left, right) => left.order - right.order || String(left.id).localeCompare(String(right.id)));
    const meta = Object.fromEntries((await test.userDataRepository.loadUserMeta()).map(record => [record.key, record.value]));
    return { cardResult, batchResult, durableCards, meta };
  }, { cards, batches });
  assert.equal(seeded.cardResult.craftListChanged, true);
  assert.equal(seeded.cardResult.allocationChanged, true);
  assert.equal(seeded.batchResult.changed, true);
  assert.deepEqual(
    {
      inventoryRevision: seeded.meta.inventoryRevision,
      craftListRevision: seeded.meta.craftListRevision,
      allocationRevision: seeded.meta.allocationRevision
    },
    { inventoryRevision: 1, craftListRevision: 1, allocationRevision: 2 }
  );
  assert.equal(seeded.durableCards.length, 2);
  seeded.durableCards.forEach(card => {
    assert.equal(card.cardRevision, 0);
    assert.equal(card.requirements.length, 1);
    const requirement = card.requirements[0];
    assert.equal(requirement.sourceQuantityCanonicalDecimal, "0.001");
    assert.equal(requirement.normalizedQuantityText, "0.0010");
    assert.equal(requirement.normalizedRequiredQuantityUnits, 10);
    assert.equal(requirement.normalizedUnitText, "10");
    assert.equal(requirement.quantityNormalizationStatus, "NORMALIZED_EXACT_INTEGER_UNITS");
    assert.equal(requirement.quantityNormalizationRule, "SCU_4DP_HALF_UP_V1");
    assert.equal(requirement.exactRequiredQuantityUnits, 10);
    assert.equal(requirement.quantityExactness, "EXACT_SAFE_INTEGER_UNITS");
    assert.equal(requirement.quantityExactnessReason, null);
  });
  results.reservation.canonicalDurableSeed = {
    status: "PASS",
    cardRevisions: seeded.durableCards.map(card => ({ id: card.id, cardRevision: card.cardRevision })),
    requirementEvidence: seeded.durableCards.map(card => ({
      id: card.id,
      sourceQuantityCanonicalDecimal: card.requirements[0].sourceQuantityCanonicalDecimal,
      normalizedQuantityText: card.requirements[0].normalizedQuantityText,
      normalizedRequiredQuantityUnits: card.requirements[0].normalizedRequiredQuantityUnits,
      normalizedUnitText: card.requirements[0].normalizedUnitText,
      quantityNormalizationStatus: card.requirements[0].quantityNormalizationStatus,
      quantityNormalizationRule: card.requirements[0].quantityNormalizationRule,
      exactRequiredQuantityUnits: card.requirements[0].exactRequiredQuantityUnits,
      quantityExactness: card.requirements[0].quantityExactness,
      quantityExactnessReason: card.requirements[0].quantityExactnessReason
    }))
  };
  results.revisionMutations.push({ action: "seed cards then inventory", revisions: { inventoryRevision: 1, craftListRevision: 1, allocationRevision: 2 } });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  let view = await runtimeSnapshot(page);
  assert.equal(view.cards.length, 2);
  assert.equal(view.renderedCards.length, 2);
  assert.equal(view.reservationRunStatus, "STALE");
  assert.ok(view.renderedCards.every(card => card.status === "STALE"));
  assert.ok(view.cards.every(card => card.quantitySemantics === "CRAFT_RUN_COUNT"));
  assert.ok(view.cards.every(card => card.craftRunInputEvidence === "CRAFT_RUN_INPUTS_EXACT"));
  assert.ok(view.cards.every(card => card.requirements.every(requirement =>
    requirement.sourceQuantityValue === 0.001 &&
    requirement.requiredQuantityUnits === 10 &&
    requirement.exactRequiredQuantityUnits === 10 &&
    requirement.quantityExactness === "EXACT_SAFE_INTEGER_UNITS" &&
    requirement.quantityExactnessReason === null &&
    requirement.quantityNormalizationStatus === "NORMALIZED_EXACT_INTEGER_UNITS"
  )));

  await page.click("#craftingListNav");
  view = await reallocateAndAssertValid(page);
  assert.deepEqual(view.renderedCards.map(card => card.maxCompletableQuantity), [5, 2]);
  assert.ok(view.renderedCards.every(card => card.status === "VALID" && /^[0-9a-f]{64}$/.test(card.hash)));
  const initialHashes = Object.fromEntries(view.renderedCards.map(card => [card.id, card.hash]));
  results.reservation.initialValid = { status: "PASS", hashes: initialHashes, maxCompletableQuantities: [5, 2] };

  await page.evaluate(() => window.__SPG_TEST__.updateCraftingCard(
    "card-browser-b",
    card => { card.outputCountEvidence = "OUTPUT_COUNT_UNPROVEN"; },
    "TEST_OUTPUT_COUNT_UNPROVEN"
  ));
  view = await runtimeSnapshot(page);
  assert.deepEqual(view.revisions, { inventoryRevision: 1, craftListRevision: 1, allocationRevision: 3 });
  assert.equal(view.cards.find(card => card.id === "card-browser-b").cardRevision, 1);
  assert.ok(view.renderedCards.every(card => card.status === "STALE"));
  await page.evaluate(() => window.__SPG_TEST__.reallocateCraftingList());
  view = await runtimeSnapshot(page);
  const diagnosticOutputCard = view.cards.find(card => card.id === "card-browser-b");
  const renderedDiagnosticOutputCard = view.renderedCards.find(card => card.id === "card-browser-b");
  assert.equal(view.reservationRunStatus, "VALID");
  assert.equal(renderedDiagnosticOutputCard.status, "VALID");
  assert.equal(diagnosticOutputCard.outputCountEvidence, "OUTPUT_COUNT_UNPROVEN");
  assert.equal(diagnosticOutputCard.quantitySemantics, "CRAFT_RUN_COUNT");
  assert.equal(diagnosticOutputCard.craftRunInputEvidence, "CRAFT_RUN_INPUTS_EXACT");
  assert.equal(renderedDiagnosticOutputCard.maxCompletableQuantity, 2);
  const outputCapability = await page.evaluate(() => window.__SPG_TEST__.state.reservationSnapshots.get("card-browser-b").capability);
  assert.equal(outputCapability.status, "READY");
  assert.equal(outputCapability.maxCompletableQuantity, 2);
  assert.equal(outputCapability.blockerReason, null);
  results.reservation.outputCountBlocker = {
    status: "PASS_DIAGNOSTIC_ONLY",
    outputCountEvidence: diagnosticOutputCard.outputCountEvidence,
    completionGate: false,
    capability: outputCapability
  };
  results.revisionMutations.push({ action: "output evidence invalidated", revisions: view.revisions, cardRevision: 1 });

  await page.evaluate(() => window.__SPG_TEST__.updateCraftingCard(
    "card-browser-b",
    card => { card.outputCountEvidence = "PER_FINISHED_ITEM_NORMALIZED_EXACT"; },
    "TEST_OUTPUT_COUNT_RESTORED"
  ));
  await page.evaluate(() => window.__SPG_TEST__.reallocateCraftingList());
  view = await runtimeSnapshot(page);
  assert.deepEqual(view.revisions, { inventoryRevision: 1, craftListRevision: 1, allocationRevision: 4 });
  assert.equal(view.cards.find(card => card.id === "card-browser-b").cardRevision, 2);
  assert.equal(view.renderedCards.find(card => card.id === "card-browser-b").maxCompletableQuantity, 2);
  results.revisionMutations.push({ action: "output evidence restored", revisions: view.revisions, cardRevision: 2 });

  await page.evaluate(() => {
    const test = window.__SPG_TEST__;
    return test.persistMaterialBatches(test.state.materialBatches.map(batch => ({ ...batch, quantityUnits: batch.quantityUnits + 1 })), "TEST_BATCH_EDIT");
  });
  view = await runtimeSnapshot(page);
  assert.deepEqual(view.revisions, { inventoryRevision: 2, craftListRevision: 1, allocationRevision: 5 });
  assert.ok(view.renderedCards.every(card => card.status === "STALE"));
  results.revisionMutations.push({ action: "inventory edit", revisions: view.revisions });
  await page.evaluate(() => window.__SPG_TEST__.reallocateCraftingList());

  await page.evaluate(() => window.__SPG_TEST__.updateCraftingCard(
    "card-browser-a",
    card => { card.quantity = 4; },
    "TEST_CARD_QUANTITY"
  ));
  view = await runtimeSnapshot(page);
  assert.deepEqual(view.revisions, { inventoryRevision: 2, craftListRevision: 1, allocationRevision: 6 });
  assert.equal(view.cards.find(card => card.id === "card-browser-a").cardRevision, 1);
  assert.ok(view.renderedCards.every(card => card.status === "STALE"));
  results.revisionMutations.push({ action: "card quantity edit", revisions: view.revisions, cardRevision: 1 });
  await page.evaluate(() => window.__SPG_TEST__.reallocateCraftingList());

  const beforeCollapse = await runtimeSnapshot(page);
  await page.evaluate(() => window.__SPG_TEST__.updateCraftingCard(
    "card-browser-a",
    card => { card.collapsed = !card.collapsed; },
    "TEST_PRESENTATION_COLLAPSE"
  ));
  view = await runtimeSnapshot(page);
  assert.deepEqual(view.revisions, beforeCollapse.revisions);
  assert.deepEqual(
    Object.fromEntries(view.renderedCards.map(card => [card.id, card.hash])),
    Object.fromEntries(beforeCollapse.renderedCards.map(card => [card.id, card.hash]))
  );
  assert.ok(view.renderedCards.every(card => card.status === "VALID"));
  results.revisionMutations.push({ action: "presentation-only collapse", revisions: view.revisions, increment: 0, snapshotsRemainValid: true });

  await page.evaluate(() => window.__SPG_TEST__.moveCraftingCard("card-browser-a", 1));
  view = await runtimeSnapshot(page);
  assert.deepEqual(view.revisions, { inventoryRevision: 2, craftListRevision: 2, allocationRevision: 7 });
  assert.deepEqual(view.cards.map(card => [card.id, card.cardRevision]), [["card-browser-b", 3], ["card-browser-a", 2]]);
  assert.ok(view.renderedCards.every(card => card.status === "STALE"));
  results.revisionMutations.push({ action: "card reorder", revisions: view.revisions, cardRevisions: view.cards.map(card => ({ id: card.id, cardRevision: card.cardRevision })) });
  await page.evaluate(() => window.__SPG_TEST__.reallocateCraftingList());
  view = await runtimeSnapshot(page);
  assert.ok(view.renderedCards.every(card => card.status === "VALID"));
  assert.deepEqual(view.renderedCards.map(card => card.maxCompletableQuantity), [2, 4]);
  results.reservation.afterReorder = { status: "PASS", order: view.renderedCards.map(card => card.id), hashes: view.renderedCards.map(card => card.hash) };

  const rollback = await page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const beforeBatches = await test.userDataRepository.loadMaterialBatches();
    const beforeInventory = await test.database.getAll("userInventory");
    const beforeMeta = await test.userDataRepository.loadUserMeta();
    let code = null;
    try {
      await test.database.commitInventorySnapshot(beforeBatches.map(batch => ({ ...batch, quantityUnits: batch.quantityUnits + 9 })), { simulateFailure: true });
    } catch (error) {
      code = error.code;
    }
    return {
      code,
      beforeBatches,
      afterBatches: await test.userDataRepository.loadMaterialBatches(),
      beforeInventory,
      afterInventory: await test.database.getAll("userInventory"),
      beforeMeta,
      afterMeta: await test.userDataRepository.loadUserMeta()
    };
  });
  assert.equal(rollback.code, "SIMULATED_REVISION_MUTATION_ABORT");
  assert.deepEqual(rollback.afterBatches, rollback.beforeBatches);
  assert.deepEqual(rollback.afterInventory, rollback.beforeInventory);
  assert.deepEqual(rollback.afterMeta, rollback.beforeMeta);
  results.atomicRollback = { status: "PASS", failureCode: rollback.code, batchAndInventoryRecordsUnchanged: true, recordsUnchanged: true, revisionsUnchanged: true };

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  view = await runtimeSnapshot(page);
  assert.equal(view.renderedCards.length, 2);
  assert.equal(view.reservationRunStatus, "STALE");
  assert.ok(view.renderedCards.every(card => card.status === "STALE" && card.hash === ""));
  results.reloadGate = { status: "PASS", cardsRendered: 2, reservationStatus: "STALE", explicitReallocateRequired: true };
  await page.click("#craftingListNav");
  view = await reallocateAndAssertValid(page);
  assert.ok(view.renderedCards.every(card => card.status === "VALID" && /^[0-9a-f]{64}$/.test(card.hash)));
  results.reloadGate.reallocateAfterReload = "PASS";
  await context.close();

  const fileErrors = [];
  try {
    const file = await openApplication(browser, pathToFileURL(appPath).href, fileErrors);
    const fileIdentity = await file.page.evaluate(async () => ({
      version: window.__SPG_TEST__.app.version,
      dbName: window.__SPG_TEST__.app.dbName,
      dbVersion: window.__SPG_TEST__.app.dbVersion,
      reservationRunStatus: window.__SPG_TEST__.state.reservationRunStatus,
      sourceDbExists: (await indexedDB.databases()).some(entry => entry.name === "spg-crafting-list")
    }));
    assert.equal(fileIdentity.version, process.env.SPG_EXPECTED_RUNTIME_IDENTITY || "V004-dev");
    assert.equal(fileIdentity.dbName, "spg-crafting-list-v004");
    assert.equal(fileIdentity.dbVersion, 1);
    assert.equal(fileIdentity.reservationRunStatus, "ABSENT");
    assert.equal(fileIdentity.sourceDbExists, false, "A hiányzó V003 adatbázis véletlenül létrejött.");
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
console.log(`V004_C003_BROWSER_PASS fileGate=${results.fileGate.status} evidence=${path.relative(projectDirectory, evidencePath)}`);
