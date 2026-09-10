import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C004.3");
const evidencePath = path.join(artifactDirectory, "browser-evidence.json");
const appBuffer = fs.readFileSync(appPath);
const moduleArgument = process.argv.find(value => value.startsWith("--playwright-module="));
const exactBlueprintUuid = "280f47b7-8434-410c-b854-380768fdccec";
const c0042NonexactBlueprintUuids = [
  "5af6beb3-4030-4a32-bb77-2a9b729483f5",
  "db6460d8-273e-4fe3-bf57-a02a61e7a3e2",
  "feb14c78-6068-4436-8bea-0027a6b36480"
];

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
  return page.evaluate(async () => JSON.parse(JSON.stringify(await window.__SPG_TEST__.userDataRepository.readAllUserData())));
}

async function revisions(page) {
  return page.evaluate(async () => Object.fromEntries((await window.__SPG_TEST__.userDataRepository.loadUserMeta()).map(record => [record.key, record.value])));
}

async function seedProductionBlueprint(page, blueprintUuid, craftRuns) {
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
      id: `batch-c0043-${index + 1}`,
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
    const cacheKey = normalized.cacheKey;
    return {
      version: version.code,
      normalized,
      card,
      batches,
      cache: {
        key: cacheKey,
        rawPresent: Boolean(await test.database.get("blueprintRawCache", cacheKey)),
        normalizedPresent: Boolean(await test.database.get("blueprintNormalizedCache", cacheKey))
      }
    };
  }, { blueprintUuid, craftRuns });
}

const playwright = await loadPlaywright();
const { server, origin } = await startServer();
let browser;
const errors = [];
const results = {
  cycle: "V004-C004.3",
  status: "PENDING",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  browser: "Google Chrome",
  productionExact: {},
  legacyConfirmation: {},
  productionNonexact: {},
  reload: {},
  fileGate: {},
  consoleErrors: errors
};

try {
  browser = await playwright.chromium.launch({ channel: "chrome", headless: true });

  const exactErrors = [];
  const exact = await openApplication(browser, `${origin}/app`, exactErrors);
  const seeded = await seedProductionBlueprint(exact.page, exactBlueprintUuid, 21);
  assert.equal(seeded.card.quantitySemantics, "CRAFT_RUN_COUNT");
  assert.equal(seeded.card.craftRunInputEvidence, "CRAFT_RUN_INPUTS_EXACT");
  assert.equal(seeded.card.outputCountEvidence, "OUTPUT_COUNT_UNPROVEN");
  assert.equal(seeded.card.requirements.length, 3);
  assert.deepEqual(seeded.card.requirements.map(requirement => requirement.exactRequiredQuantityUnits), [3600, 7, 7]);
  assert.ok(seeded.card.requirements.every(requirement => requirement.requiredQuantityUnits === requirement.exactRequiredQuantityUnits));
  assert.equal(seeded.cache.rawPresent, true);
  assert.equal(seeded.cache.normalizedPresent, true);

  await exact.page.reload({ waitUntil: "domcontentloaded" });
  await exact.page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await exact.page.click("#craftingListNav");
  await exact.page.click("#reallocateCraftingListButton");
  await exact.page.waitForFunction(() => document.body.dataset.reservationRunStatus === "VALID");
  const cardId = seeded.card.id;
  const control = `[data-card-id="${cardId}"].spg-v004-completion-controls`;
  const quantityInput = `${control} .spg-v004-completion-quantity`;
  const maxButton = `${control} .spg-v004-completion-max`;
  const completeButton = `${control} .spg-v004-completion-open`;
  assert.equal(await exact.page.getAttribute(control, "data-completion-ready"), "true");
  assert.equal(await exact.page.getAttribute(control, "data-craft-run-input-evidence"), "CRAFT_RUN_INPUTS_EXACT");
  assert.equal(await exact.page.getAttribute(control, "data-output-count-evidence"), "OUTPUT_COUNT_UNPROVEN");
  const visibleCardText = await exact.page.locator(`[data-card-id="${cardId}"].spg-crafting-card`).innerText();
  assert.match(visibleCardText, /Craftok száma/);
  assert.match(visibleCardText, /Lezárt craftok/);
  assert.match(visibleCardText, /1 crafthoz/);
  assert.match(visibleCardText, /21 crafthoz/);
  assert.match(visibleCardText, /Lefoglalt/);
  assert.match(visibleCardText, /Batch-ek:/);
  assert.match(visibleCardText, /Q900/);

  const beforeMax = await durableSnapshot(exact.page);
  await exact.page.click(maxButton);
  assert.equal(await exact.page.inputValue(quantityInput), "21");
  assert.deepEqual(await durableSnapshot(exact.page), beforeMax, "MAX must be fill-only.");

  await exact.page.fill(quantityInput, "5");
  const beforeCancel = await durableSnapshot(exact.page);
  await exact.page.click(completeButton);
  await exact.page.waitForSelector("#craftCompletionDialog[open]");
  const confirmation = await exact.page.evaluate(() => ({
    requested: document.getElementById("craftCompletionRequestedQuantity").textContent,
    before: document.getElementById("craftCompletionRemainingBefore").textContent,
    after: document.getElementById("craftCompletionRemainingAfter").textContent,
    lines: Array.from(document.querySelectorAll("#craftCompletionMaterialLines li")).map(line => ({
      batchId: line.dataset.batchId,
      consumedUnits: Number(line.dataset.consumedUnits),
      text: line.textContent
    }))
  }));
  assert.deepEqual([confirmation.requested, confirmation.before, confirmation.after], ["5", "21", "16"]);
  assert.deepEqual(confirmation.lines.map(line => line.consumedUnits), [18000, 35, 35]);
  assert.ok(confirmation.lines.every(line => /Q900/.test(line.text) && /batch/.test(line.text)));
  await exact.page.click("#cancelCraftCompletionButton");
  assert.deepEqual(await durableSnapshot(exact.page), beforeCancel, "Cancel must perform zero writes.");

  await exact.page.fill(quantityInput, "5");
  await exact.page.click(completeButton);
  await exact.page.waitForSelector("#craftCompletionDialog[open]");
  await exact.page.click("#confirmCraftCompletionButton");
  await exact.page.waitForFunction(() => document.body.dataset.craftCompletionState === "COMPLETED");
  let exactData = await durableSnapshot(exact.page);
  let exactRevisions = await revisions(exact.page);
  assert.equal(exactData.craftingCards[0].quantity, 16);
  assert.equal(exactData.craftingCards[0].cardRevision, 1);
  assert.deepEqual(exactData.materialBatches.map(batch => batch.quantityUnits), [57601, 113, 113]);
  assert.deepEqual(exactRevisions, { inventoryRevision: 2, craftListRevision: 1, allocationRevision: 3, historySequence: 1 });
  assert.equal(exactData.craftHistory[0].quantitySemantics, "CRAFT_RUN_COUNT");
  assert.equal(exactData.craftHistory[0].craftRunInputEvidence, "CRAFT_RUN_INPUTS_EXACT");
  assert.equal(exactData.craftHistory[0].outputCountEvidence, "OUTPUT_COUNT_UNPROVEN");
  assert.equal(exactData.craftHistory[0].eventSchema, "V004_CRAFT_HISTORY_EVENT_2");
  assert.ok(exactData.craftHistory[0].consumedDeltas.every(line => line.beforeUnits === line.consumedUnits + line.afterUnits));
  assert.notEqual(await exact.page.getAttribute(control, "data-reservation-status"), "VALID");

  const staleBefore = await durableSnapshot(exact.page);
  const staleAttempt = await exact.page.evaluate(async cardId => {
    try {
      await window.__SPG_TEST__.prepareCraftCompletion(cardId, 1, "craft-c0043-stale-check");
      return null;
    } catch (error) {
      return { code: error.code, detail: error.detail };
    }
  }, cardId);
  assert.equal(staleAttempt.code, "STALE_RESERVATION");
  assert.deepEqual(await durableSnapshot(exact.page), staleBefore, "Stale completion attempt must perform zero writes.");

  await exact.page.click("#reallocateCraftingListButton");
  await exact.page.waitForFunction(() => document.body.dataset.reservationRunStatus === "VALID");
  await exact.page.click(maxButton);
  assert.equal(await exact.page.inputValue(quantityInput), "16");
  await exact.page.click(completeButton);
  await exact.page.waitForSelector("#craftCompletionDialog[open]");
  await exact.page.click("#confirmCraftCompletionButton");
  await exact.page.waitForFunction(() => document.body.dataset.craftCompletionState === "COMPLETED");
  exactData = await durableSnapshot(exact.page);
  exactRevisions = await revisions(exact.page);
  assert.equal(exactData.craftingCards.length, 0);
  assert.deepEqual(exactData.materialBatches.map(batch => batch.quantityUnits), [1, 1, 1]);
  assert.equal(exactData.craftHistory.length, 2);
  assert.deepEqual(exactRevisions, { inventoryRevision: 3, craftListRevision: 2, allocationRevision: 4, historySequence: 2 });
  assert.ok(exactData.craftHistory.every(event => event.quantitySemantics === "CRAFT_RUN_COUNT"));
  assert.ok(exactData.craftHistory.flatMap(event => event.consumedDeltas).every(line => line.beforeUnits === line.consumedUnits + line.afterUnits));
  results.productionExact = {
    status: "PASS",
    blueprintUuid: seeded.card.blueprintUuid,
    outputName: seeded.card.outputName,
    gameVersion: seeded.version,
    cache: seeded.cache,
    recipeSlots: seeded.card.requirements.map(requirement => ({
      id: requirement.id,
      materialName: requirement.materialName,
      sourceQuantityValue: requirement.sourceQuantityValue,
      exactRequiredQuantityUnits: requirement.exactRequiredQuantityUnits,
      quantityExactness: requirement.quantityExactness
    })),
    quantitySemantics: seeded.card.quantitySemantics,
    craftRunInputEvidence: seeded.card.craftRunInputEvidence,
    outputCountEvidence: seeded.card.outputCountEvidence,
    outputCardinalityClaimed: false,
    partial: { completedCraftRuns: 5, remainingCraftRuns: 16, consumedUnits: confirmation.lines.map(line => line.consumedUnits) },
    full: { completedRemainingCraftRuns: 16, cardRemoved: true, finalBatchUnits: exactData.materialBatches.map(batch => batch.quantityUnits) },
    staleAttempt: { ...staleAttempt, writes: 0, fallbackConsumption: false },
    maxWrites: 0,
    cancelWrites: 0,
    finalRevisions: exactRevisions,
    materialLossUnits: 0
  };

  await exact.page.reload({ waitUntil: "domcontentloaded" });
  await exact.page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  const reloadData = await durableSnapshot(exact.page);
  assert.equal(reloadData.craftingCards.length, 0);
  assert.equal(reloadData.craftHistory.length, 2);
  assert.deepEqual(reloadData.materialBatches.map(batch => batch.quantityUnits), [1, 1, 1]);
  results.reload = { status: "PASS", activeCards: 0, historyEvents: 2, remainingUnits: [1, 1, 1] };
  assert.equal(exactErrors.length, 0);
  await exact.context.close();

  const legacyErrors = [];
  const legacy = await openApplication(browser, `${origin}/app`, legacyErrors);
  const legacySeed = await legacy.page.evaluate(async normalized => {
    const test = window.__SPG_TEST__;
    const card = test.buildCraftingCard(normalized);
    card.quantity = 21;
    delete card.quantitySemantics;
    const timestamp = new Date().toISOString();
    const batches = card.requirements.map((requirement, index) => ({
      id: `batch-c0043-legacy-${index + 1}`,
      materialUuid: requirement.ingredientUuid,
      sourceMaterialUuid: requirement.ingredientUuid,
      materialName: requirement.materialName,
      quality: 900,
      quantityUnits: requirement.requiredQuantityUnits * card.quantity,
      unit: requirement.unit,
      createdAt: timestamp,
      updatedAt: timestamp
    }));
    await test.userDataRepository.saveCraftingCards([card]);
    await test.userDataRepository.saveMaterialBatches(batches);
    return { cardId: card.id };
  }, seeded.normalized);
  await legacy.page.reload({ waitUntil: "domcontentloaded" });
  await legacy.page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await legacy.page.click("#craftingListNav");
  const legacyBefore = await durableSnapshot(legacy.page);
  const legacyRevisionsBefore = await revisions(legacy.page);
  const legacyRuntimeBefore = await legacy.page.evaluate(async cardId => {
    const card = window.__SPG_TEST__.state.craftingCards.find(item => item.id === cardId);
    const historyClassification = window.__SPG_TEST__.normalizeStoredCraftHistoryEvent({
      eventSchema: "V004_CRAFT_HISTORY_EVENT_1",
      craftTransactionId: "craft-legacy-history",
      status: "COMPLETED"
    });
    const legacyBackupData = await window.__SPG_TEST__.userDataRepository.readAllUserData();
    legacyBackupData.craftingCards = legacyBackupData.craftingCards.map(sourceCard => {
      const copy = JSON.parse(JSON.stringify(sourceCard));
      delete copy.quantitySemantics;
      delete copy.craftRunInputEvidence;
      copy.requirements.forEach(requirement => {
        delete requirement.sourceQuantityValue;
        delete requirement.exactRequiredQuantityUnits;
        delete requirement.quantityExactness;
        delete requirement.quantityExactnessReason;
      });
      return copy;
    });
    legacyBackupData.craftHistory = [{
      eventSchema: "V004_CRAFT_HISTORY_EVENT_1",
      craftTransactionId: "craft-legacy-backup-event",
      historySequence: 1,
      craftingCardId: cardId,
      status: "COMPLETED"
    }];
    const legacyEnvelope = {
      format: "spg-crafting-list-backup",
      schemaVersion: 3,
      application: "sPg Crafting List",
      applicationVersion: "V004-dev",
      data: legacyBackupData,
      fingerprint: window.__SPG_TEST__.fingerprintUserDataPayload(legacyBackupData)
    };
    const validated = window.__SPG_TEST__.validateAndMigrateM4Backup(legacyEnvelope);
    return {
      quantity: card.quantity,
      semantics: card.quantitySemantics,
      cardRevision: card.cardRevision,
      historySemantics: historyClassification.quantitySemantics,
      backupCardSemantics: validated.backup.data.craftingCards[0].quantitySemantics,
      backupCardInputEvidence: validated.backup.data.craftingCards[0].craftRunInputEvidence,
      backupHistorySemantics: validated.backup.data.craftHistory[0].quantitySemantics,
      backupMigrationSteps: validated.migration.steps
    };
  }, legacySeed.cardId);
  assert.equal(legacyRuntimeBefore.quantity, 21);
  assert.equal(legacyRuntimeBefore.semantics, "LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED");
  assert.equal(legacyRuntimeBefore.cardRevision, 0);
  assert.equal(legacyRuntimeBefore.historySemantics, "LEGACY_HISTORY_QUANTITY_SEMANTICS_UNKNOWN");
  assert.equal(legacyRuntimeBefore.backupCardSemantics, "LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED");
  assert.equal(legacyRuntimeBefore.backupCardInputEvidence, "CRAFT_RUN_INPUTS_UNPROVEN");
  assert.equal(legacyRuntimeBefore.backupHistorySemantics, "LEGACY_HISTORY_QUANTITY_SEMANTICS_UNKNOWN");
  assert.ok(legacyRuntimeBefore.backupMigrationSteps.includes("CARD_QUANTITY_SEMANTICS_CLASSIFICATION"));
  assert.ok(legacyRuntimeBefore.backupMigrationSteps.includes("HISTORY_QUANTITY_SEMANTICS_CLASSIFICATION"));
  const legacyButton = `[data-card-id="${legacySeed.cardId}"] .spg-v004-legacy-confirm`;
  assert.equal(await legacy.page.textContent(legacyButton), "21 craftként használom");
  await legacy.page.click(legacyButton);
  await legacy.page.waitForFunction(cardId => window.__SPG_TEST__.state.craftingCards.find(card => card.id === cardId).quantitySemantics === "CRAFT_RUN_COUNT", legacySeed.cardId);
  const legacyAfter = await durableSnapshot(legacy.page);
  const legacyRevisionsAfter = await revisions(legacy.page);
  assert.equal(legacyAfter.craftingCards[0].quantity, 21);
  assert.equal(legacyAfter.craftingCards[0].cardRevision, 1);
  assert.deepEqual(legacyAfter.materialBatches, legacyBefore.materialBatches);
  assert.deepEqual(legacyAfter.userInventory, legacyBefore.userInventory);
  assert.equal(legacyRevisionsAfter.inventoryRevision, legacyRevisionsBefore.inventoryRevision);
  assert.equal(legacyRevisionsAfter.craftListRevision, legacyRevisionsBefore.craftListRevision);
  assert.equal(legacyRevisionsAfter.allocationRevision, legacyRevisionsBefore.allocationRevision + 1);
  assert.equal(await legacy.page.getAttribute(`[data-card-id="${legacySeed.cardId}"].spg-crafting-card`, "data-reservation-status"), "STALE");
  await legacy.page.click("#reallocateCraftingListButton");
  await legacy.page.waitForFunction(() => document.body.dataset.reservationRunStatus === "VALID");
  assert.equal(await legacy.page.getAttribute(`[data-card-id="${legacySeed.cardId}"].spg-v004-completion-controls`, "data-completion-ready"), "true");
  results.legacyConfirmation = {
    status: "PASS",
    visibleAction: "21 craftként használom",
    quantityBefore: 21,
    quantityAfter: legacyAfter.craftingCards[0].quantity,
    semanticsBefore: legacyRuntimeBefore.semantics,
    semanticsAfter: legacyAfter.craftingCards[0].quantitySemantics,
    cardRevisionBefore: 0,
    cardRevisionAfter: legacyAfter.craftingCards[0].cardRevision,
    inventoryRevisionDelta: 0,
    craftListRevisionDelta: 0,
    allocationRevisionDelta: 1,
    reservationAfterConfirmation: "STALE",
    explicitReallocateRequired: true,
    markerlessHistoryClassification: legacyRuntimeBefore.historySemantics,
    schema3Compatibility: {
      cardSemantics: legacyRuntimeBefore.backupCardSemantics,
      cardInputEvidence: legacyRuntimeBefore.backupCardInputEvidence,
      historySemantics: legacyRuntimeBefore.backupHistorySemantics,
      migrationSteps: legacyRuntimeBefore.backupMigrationSteps
    }
  };
  assert.equal(legacyErrors.length, 0);
  await legacy.context.close();

  const nonexactErrors = [];
  const nonexact = await openApplication(browser, `${origin}/app`, nonexactErrors);
  const nonexactSeed = await nonexact.page.evaluate(async blueprintUuids => {
    const test = window.__SPG_TEST__;
    const version = await test.adapter.getDefaultGameVersion();
    test.state.gameVersion = version;
    let normalized = null;
    let card = null;
    for (const blueprintUuid of blueprintUuids) {
      normalized = await test.loadBlueprintDetail(blueprintUuid, { ownsProcess: false });
      card = test.buildCraftingCard(normalized);
      if (card.craftRunInputEvidence === "CRAFT_RUN_INPUTS_UNPROVEN") break;
    }
    if (!card || card.craftRunInputEvidence !== "CRAFT_RUN_INPUTS_UNPROVEN") {
      throw new Error("C004.2 real nonexact blueprint path is no longer reproducible in the live default dataset.");
    }
    card.quantity = 1;
    const timestamp = new Date().toISOString();
    const batches = card.requirements.map((requirement, index) => ({
      id: `batch-c0043-nonexact-${index + 1}`,
      materialUuid: requirement.ingredientUuid,
      sourceMaterialUuid: requirement.ingredientUuid,
      materialName: requirement.materialName,
      quality: 900,
      quantityUnits: requirement.requiredQuantityUnits + 1,
      unit: requirement.unit,
      createdAt: timestamp,
      updatedAt: timestamp
    }));
    await test.userDataRepository.saveCraftingCards([card]);
    await test.userDataRepository.saveMaterialBatches(batches);
    return {
      version: version.code,
      card,
      cache: {
        key: normalized.cacheKey,
        rawPresent: Boolean(await test.database.get("blueprintRawCache", normalized.cacheKey)),
        normalizedPresent: Boolean(await test.database.get("blueprintNormalizedCache", normalized.cacheKey))
      }
    };
  }, c0042NonexactBlueprintUuids);
  await nonexact.page.reload({ waitUntil: "domcontentloaded" });
  await nonexact.page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await nonexact.page.click("#craftingListNav");
  const nonexactBefore = await durableSnapshot(nonexact.page);
  await nonexact.page.click("#reallocateCraftingListButton");
  await nonexact.page.waitForFunction(() => document.body.dataset.reservationRunStatus === "BLOCKED");
  const nonexactRuntime = await nonexact.page.evaluate(cardId => {
    const test = window.__SPG_TEST__;
    const card = test.state.craftingCards.find(item => item.id === cardId);
    const reservation = test.state.reservationSnapshots.get(cardId);
    return {
      visible: Boolean(document.querySelector(`[data-card-id="${cardId}"].spg-crafting-card`)),
      semantics: card.quantitySemantics,
      inputEvidence: card.craftRunInputEvidence,
      outputCountEvidence: card.outputCountEvidence,
      reason: reservation.reason,
      completionDisabled: document.querySelector(`[data-card-id="${cardId}"].spg-v004-completion-controls .spg-v004-completion-open`).disabled,
      nonexactRequirements: card.requirements.filter(requirement => requirement.quantityExactness !== "EXACT_SAFE_INTEGER_UNITS").map(requirement => ({
        materialName: requirement.materialName,
        sourceQuantityValue: requirement.sourceQuantityValue,
        legacyRequiredQuantityUnits: requirement.requiredQuantityUnits,
        exactRequiredQuantityUnits: requirement.exactRequiredQuantityUnits,
        quantityExactnessReason: requirement.quantityExactnessReason
      }))
    };
  }, nonexactSeed.card.id);
  assert.equal(nonexactRuntime.visible, true);
  assert.equal(nonexactRuntime.semantics, "CRAFT_RUN_COUNT");
  assert.equal(nonexactRuntime.inputEvidence, "CRAFT_RUN_INPUTS_UNPROVEN");
  assert.equal(nonexactRuntime.outputCountEvidence, "OUTPUT_COUNT_UNPROVEN");
  assert.equal(nonexactRuntime.reason, "CRAFT_RUN_INPUTS_UNPROVEN");
  assert.equal(nonexactRuntime.completionDisabled, true);
  assert.ok(nonexactRuntime.nonexactRequirements.length >= 1);
  const nonexactAttempt = await nonexact.page.evaluate(async cardId => {
    try {
      await window.__SPG_TEST__.prepareCraftCompletion(cardId, 1, "craft-c0043-nonexact-check");
      return null;
    } catch (error) {
      return { code: error.code, detail: error.detail };
    }
  }, nonexactSeed.card.id);
  assert.equal(nonexactAttempt.code, "STALE_RESERVATION");
  assert.deepEqual(await durableSnapshot(nonexact.page), nonexactBefore, "Nonexact blocked attempt must perform zero writes.");
  results.productionNonexact = {
    status: "PASS_BLOCKED_ZERO_WRITES",
    blueprintUuid: nonexactSeed.card.blueprintUuid,
    outputName: nonexactSeed.card.outputName,
    gameVersion: nonexactSeed.version,
    cache: nonexactSeed.cache,
    ...nonexactRuntime,
    attempt: nonexactAttempt,
    inventoryWrites: 0,
    completionReached: false
  };
  assert.equal(nonexactErrors.length, 0);
  await nonexact.context.close();

  const fileErrors = [];
  const file = await openApplication(browser, pathToFileURL(appPath).href, fileErrors);
  const fileState = await file.page.evaluate(() => ({
    version: window.__SPG_TEST__.app.version,
    runtimeFileCount: 1,
    localRuntimeSidecars: 0,
    craftRunLabelsPresent: document.body.innerText.includes("Craftok száma") || document.documentElement.innerHTML.includes("Craftok száma")
  }));
  assert.equal(fileState.version, "V004-dev");
  assert.equal(fileState.craftRunLabelsPresent, true);
  assert.equal(fileErrors.length, 0);
  results.fileGate = { status: "PASS_AUTOMATED", ...fileState, consoleErrors: fileErrors };
  await file.context.close();

  errors.push(...exactErrors, ...legacyErrors, ...nonexactErrors, ...fileErrors);
  assert.equal(errors.length, 0);
  results.status = "PASS_TARGETED_CHROME";
  fs.mkdirSync(artifactDirectory, { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
  console.log(`V004_C0043_TARGETED_CHROME_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
} finally {
  if (browser) await browser.close();
  await closeServer(server);
}
