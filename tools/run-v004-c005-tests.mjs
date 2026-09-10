import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C005");
const evidencePath = path.join(artifactDirectory, "model-evidence.json");
const appBuffer = fs.readFileSync(appPath);
const appHtml = appBuffer.toString("utf8");

function block(name) {
  const startMarker = `/* ${name}_START */`;
  const endMarker = `/* ${name}_END */`;
  const start = appHtml.indexOf(startMarker);
  const end = appHtml.indexOf(endMarker);
  assert.ok(start >= 0 && end > start, `Missing model block: ${name}`);
  return appHtml.slice(start, end + endMarker.length);
}

const context = vm.createContext({
  Object,
  String,
  Number,
  Array,
  Map,
  Date,
  Math,
  BigInt
});
vm.runInContext(`
  ${block("V004_C005_CRAFT_HISTORY_UI_MODEL")}
  globalThis.__C005__ = {
    group: c005GroupCraftHistory,
    compareEvents: c005CompareHistoryEventsNewest,
    status: c005HistoryStatusPresentation,
    formatUnits: c005FormatStoredConsumedUnits,
    views: V004_C005_CRAFTING_LIST_VIEW
  };
`, context);
const model = context.__C005__;
const plain = value => JSON.parse(JSON.stringify(value));

function historyEvent({
  cardId,
  sequence,
  timestamp,
  status = "COMPLETED",
  completedQuantity = 1,
  semantics = "CRAFT_RUN_COUNT",
  transactionId,
  itemName
}) {
  const event = {
    eventSchema: "V004_CRAFT_HISTORY_EVENT_2",
    quantitySemantics: semantics,
    craftRunInputEvidence: semantics === "CRAFT_RUN_COUNT" ? "CRAFT_RUN_INPUTS_EXACT" : "CRAFT_RUN_INPUTS_UNPROVEN",
    craftTransactionId: transactionId,
    craftingCardId: cardId,
    itemName: itemName || cardId,
    completedQuantity,
    timestamp,
    status,
    blueprintIdentity: { uuid: `blueprint-${cardId}` },
    outputIdentity: { uuid: `output-${cardId}`, itemIdentity: `item-${cardId}` }
  };
  if (sequence !== null) event.historySequence = sequence;
  return event;
}

const a1 = historyEvent({ cardId: "card-a", sequence: 1, timestamp: "2026-09-10T07:00:00.000Z", completedQuantity: 5, transactionId: "craft-a-00000001", itemName: "Card A" });
const a2 = historyEvent({ cardId: "card-a", sequence: 2, timestamp: "2026-09-10T08:00:00.000Z", status: "UNDONE", completedQuantity: 3, transactionId: "craft-a-00000002", itemName: "Card A" });
const b3 = historyEvent({ cardId: "card-b", sequence: 3, timestamp: "2026-09-10T09:00:00.000Z", completedQuantity: 2, transactionId: "craft-b-00000003", itemName: "Card B" });

let groups = model.group([a2, b3, a1]);
assert.deepEqual(plain(groups.map(group => group.groupKey)), ["card-b", "card-a"]);
assert.deepEqual(plain(groups[1].events.map(event => event.historySequence)), [2, 1]);
assert.equal(groups[1].eventCount, 2);
assert.equal(groups[1].activeCompletedCraftRuns, 5, "UNDONE must not count as active completion.");

const a4 = historyEvent({ cardId: "card-a", sequence: 4, timestamp: "2026-09-10T10:00:00.000Z", completedQuantity: 1, transactionId: "craft-a-00000004", itemName: "Card A" });
groups = model.group([a1, a2, b3, a4]);
assert.deepEqual(plain(groups.map(group => group.groupKey)), ["card-a", "card-b"]);
assert.deepEqual(plain(groups[0].events.map(event => event.historySequence)), [4, 2, 1]);
assert.equal(groups[0].eventCount, 3);
assert.equal(groups[0].activeCompletedCraftRuns, 6);

const legacyOlder = historyEvent({
  cardId: "legacy-old",
  sequence: null,
  timestamp: "2026-09-09T08:00:00.000Z",
  semantics: "LEGACY_HISTORY_QUANTITY_SEMANTICS_UNKNOWN",
  completedQuantity: 99,
  transactionId: "craft-legacy-old",
  itemName: "Legacy Old"
});
delete legacyOlder.eventSchema;
const legacyNewer = historyEvent({
  cardId: "legacy-new",
  sequence: null,
  timestamp: "2026-09-09T09:00:00.000Z",
  semantics: "LEGACY_HISTORY_QUANTITY_SEMANTICS_UNKNOWN",
  completedQuantity: 88,
  transactionId: "craft-legacy-new",
  itemName: "Legacy New"
});
delete legacyNewer.eventSchema;
const legacyGroups = model.group([legacyOlder, legacyNewer]);
assert.deepEqual(plain(legacyGroups.map(group => group.groupKey)), ["legacy-new", "legacy-old"]);
assert.equal(legacyGroups[0].activeCompletedCraftRuns, null, "Legacy quantity must fail closed instead of being reinterpreted as a proven zero craft-run total.");

assert.deepEqual(JSON.parse(JSON.stringify(model.status({ status: "COMPLETED" }))), { code: "COMPLETED", label: "Kész", tone: "success" });
assert.deepEqual(JSON.parse(JSON.stringify(model.status({ status: "UNDONE" }))), { code: "UNDONE", label: "Visszavonva", tone: "warning" });
assert.deepEqual(JSON.parse(JSON.stringify(model.status({ status: "FUTURE_STATUS" }))), { code: "UNKNOWN", label: "Ismeretlen állapot: FUTURE_STATUS", tone: "warning" });
assert.equal(model.formatUnits("SCU", 17500), "17500 unit · 1.7500 SCU");
assert.equal(model.formatUnits("SCU", 1), "1 unit · 0.0001 SCU");
assert.equal(model.formatUnits("ITEM", 35), "35 db");
assert.equal(model.formatUnits("SCU", 1.5), "Érvénytelen stored delta");
assert.deepEqual(JSON.parse(JSON.stringify(model.views)), { ACTIVE: "ACTIVE", HISTORY: "HISTORY" });

const modelSource = block("V004_C005_CRAFT_HISTORY_UI_MODEL");
assert.doesNotMatch(modelSource, /localeCompare/);
assert.match(modelSource, /historySequence/);
assert.match(modelSource, /Date\.parse/);
assert.match(modelSource, /status !== "COMPLETED"/);
assert.match(modelSource, /quantitySemantics !== "CRAFT_RUN_COUNT"/);

const historyRendererStart = appHtml.indexOf("function c005StoredValue");
const historyRendererEnd = appHtml.indexOf("function renderCraftingCards", historyRendererStart);
assert.ok(historyRendererStart >= 0 && historyRendererEnd > historyRendererStart);
const rendererSource = appHtml.slice(historyRendererStart, historyRendererEnd);
const historyTruthRendererStart = appHtml.indexOf("function c005HistoryDeltaMaterialName", historyRendererStart);
const historyTruthRendererEnd = appHtml.indexOf("var undoAction = document.createElement", historyTruthRendererStart);
assert.ok(historyTruthRendererStart >= 0 && historyTruthRendererEnd > historyTruthRendererStart);
const historyTruthRendererSource = appHtml.slice(historyTruthRendererStart, historyTruthRendererEnd);
assert.match(rendererSource, /event\.consumedDeltas/);
assert.match(rendererSource, /event\.preCraftCardSnapshot/);
assert.match(rendererSource, /reservationSnapshotHash/);
assert.match(rendererSource, /Legacy esemény/);
assert.match(rendererSource, /tárolt exact batch\/unit delták|nincs tárolt exact batch delta/i);
assert.doesNotMatch(historyTruthRendererSource, /loadBlueprintDetail|syncBlueprint|fetch\s*\(|state\.materialBatches|state\.craftingCards/);
assert.doesNotMatch(historyTruthRendererSource, /v004BuildExactRequirementQuantityEvidence|normalizeScuQuantityToUnits|toScuUnits\s*\(/);
assert.doesNotMatch(rendererSource, /userDataRepository\.(?:save|complete)|database\.(?:put|delete)|objectStore\s*\(/);
assert.doesNotMatch(rendererSource, /redoCraft|deleteHistory|clearHistory|archiveCraftHistory/i);

assert.match(appHtml, /id="activeCraftsTab"[^>]*role="tab"[^>]*aria-selected="true"/);
assert.match(appHtml, /id="craftHistoryTab"[^>]*role="tab"[^>]*aria-selected="false"/);
assert.match(appHtml, /id="craftingActiveView"[^>]*role="tabpanel"/);
assert.match(appHtml, /id="craftHistoryView"[^>]*role="tabpanel"[^>]*hidden/);
assert.match(appHtml, /Még nincs rögzített Craft History/);
assert.match(appHtml, /V004_CRAFT_HISTORY_EVENT_2/);
assert.match(appHtml, /byCraftingCardAndSequence/);
assert.match(appHtml, /byHistorySequence/);
assert.match(appHtml, /byCraftingCardStatusAndSequence/);
assert.match(appHtml, /schemaVersion:\s*7/);
assert.match(appHtml, /craftHistory:\s*"craftTransactionId"/);
assert.match(appHtml, /CRAFT_RUN_COUNT/);
assert.match(appHtml, /OUTPUT_COUNT_UNPROVEN/);

const documentMarkup = appHtml.slice(0, appHtml.indexOf("<script>"));
const localScriptSources = [...documentMarkup.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)]
  .map(match => match[1]).filter(value => !/^https?:/i.test(value));
const localStylesheets = [...documentMarkup.matchAll(/<link\b[^>]*rel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*href\s*=\s*["']([^"']+)["']/gi)]
  .map(match => match[1]).filter(value => !/^https?:/i.test(value));
const localRuntimeJson = [...appHtml.matchAll(/(?:fetch\s*\(|\bsrc\s*=|\bhref\s*=)\s*["']([^"']+\.json(?:[?#][^"']*)?)["']/gi)]
  .map(match => match[1]).filter(value => !/^https?:/i.test(value));
assert.equal(localScriptSources.length, 0);
assert.equal(localStylesheets.length, 0);
assert.equal(localRuntimeJson.length, 0);

fs.mkdirSync(artifactDirectory, { recursive: true });
const evidence = {
  cycle: "V004-C005",
  status: "PASS_TARGETED_MODEL",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  grouping: {
    cardIdentity: "craftingCardId",
    sameCardPartialAndFullOneGroup: true,
    firstOrder: ["card-b", "card-a"],
    afterASequence4Order: ["card-a", "card-b"],
    eventOrder: [4, 2, 1],
    localeStringSorting: false
  },
  statusHandling: {
    completed: "Kész",
    undone: "Visszavonva",
    unknown: "FAIL_SAFE_VISIBLE",
    undoneExcludedFromActiveTotal: true,
    legacyExcludedFromCraftRunTotal: true
  },
  storedDeltaTruth: {
    source: "event.consumedDeltas",
    currentCardUsed: false,
    currentInventoryUsed: false,
    liveRecipeFetchUsed: false,
    renormalizationUsed: false,
    scu17500: model.formatUnits("SCU", 17500),
    item35: model.formatUnits("ITEM", 35)
  },
  presentation: {
    defaultView: "ACTIVE",
    deleteImplemented: false,
    undoImplemented: true,
    redoImplemented: false,
    databaseSchemaChanged: false,
    backupSchemaChanged: false
  },
  singleFile: {
    runtimeFiles: 1,
    sidecars: 0,
    localScriptSrc: localScriptSources.length,
    localStylesheet: localStylesheets.length,
    localRuntimeJson: localRuntimeJson.length
  }
};
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`V004_C005_TARGETED_MODEL_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
