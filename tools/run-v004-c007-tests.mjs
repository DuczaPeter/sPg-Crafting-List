import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V004-C007");
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

function topLevelFunctionSource(name) {
  const start = appHtml.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing function: ${name}`);
  const next = appHtml.indexOf("\n    function ", start + 12);
  return appHtml.slice(start, next === -1 ? appHtml.length : next);
}

class FakeBroadcastChannel {
  static instances = [];
  constructor(name) {
    this.name = name;
    this.listeners = new Set();
    this.messages = [];
    this.closed = false;
    FakeBroadcastChannel.instances.push(this);
  }
  addEventListener(type, listener) {
    if (type === "message") this.listeners.add(listener);
  }
  removeEventListener(type, listener) {
    if (type === "message") this.listeners.delete(listener);
  }
  postMessage(message) {
    if (this.closed) throw new Error("channel closed");
    this.messages.push(JSON.parse(JSON.stringify(message)));
  }
  close() {
    this.closed = true;
    this.listeners.clear();
  }
}

const diagnostics = [];
const body = { dataset: {} };
const state = {
  dbReady: true,
  userMeta: [
    { key: "inventoryRevision", value: 4 },
    { key: "craftListRevision", value: 3 },
    { key: "allocationRevision", value: 8 },
    { key: "historySequence", value: 2 }
  ],
  multiTab: {
    status: "CLOSED", tabInstanceId: null, listenerRegistrations: 0, sent: 0, received: 0,
    accepted: 0, ignored: 0, refreshCount: 0, staleTransitions: 0, lastMutationType: null,
    lastRefreshResult: null, recentDiagnostics: []
  }
};
const windowStub = {
  crypto: { randomUUID: () => "00000000-0000-4000-8000-000000000007" },
  BroadcastChannel: FakeBroadcastChannel,
  setTimeout: () => 77,
  clearTimeout: () => {}
};
const context = vm.createContext({
  console,
  window: windowStub,
  document: { body, getElementById: () => null },
  APP: { multiTabProtocol: "V004_MULTI_TAB_SIGNAL_1", multiTabChannelName: "spg-crafting-list-v004", multiTabDebounceMs: 60 },
  state,
  logger: { event: (...args) => diagnostics.push(args) },
  nowIso: () => "2026-09-10T20:00:00.000Z",
  serializeError: error => ({ name: error?.name || "Error", message: error?.message || String(error) }),
  V004_META_KEYS: {
    inventoryRevision: "inventoryRevision", craftListRevision: "craftListRevision",
    allocationRevision: "allocationRevision", historySequence: "historySequence"
  },
  v004RevisionSnapshot: records => Object.fromEntries(["inventoryRevision", "craftListRevision", "allocationRevision"].map(key => [key, records.find(record => record.key === key).value])),
  v004RevisionValue: (records, key) => records.find(record => record.key === key).value,
  userDataRepository: {},
  materialQualityPlansFromUserSettings: () => ({}),
  materialQualityPoolsFromUserSettings: () => ({}),
  syncV004RevisionState: () => {},
  markReservationSnapshotsStale: () => {},
  updateKnownMaterials: () => {},
  renderCraftingCards: () => {},
  renderCraftHistory: () => {},
  renderMaterialInventory: () => {},
  renderCombinedMaterials: () => {},
  renderMiningLoadoutControls: () => {},
  setNotice: () => {},
  Map, Set, Number, Object, Array, JSON, String, Math, Date, Error
});
vm.runInContext(block("V004_C007_MULTI_TAB_COHERENCE"), context);

const protocol = context.APP.multiTabProtocol;
const revisions = { inventoryRevision: 4, craftListRevision: 3, allocationRevision: 8, historySequence: 2 };
const validInput = {
  protocol,
  senderTabId: "tab-external-c007",
  senderSequence: 2,
  mutationType: "CRAFT_COMPLETED",
  revisions,
  affected: { cardIds: ["card-a", "card-a"], historyIds: ["craft-a"], materialIds: ["material-a"] },
  sentAt: "2026-09-10T20:00:00.000Z"
};

assert.equal(context.v004ValidateMultiTabSignal(validInput, "tab-own-c007").code, "VALID_SIGNAL");
assert.equal(context.v004ValidateMultiTabSignal(null, "tab-own-c007").code, "MALFORMED_SIGNAL");
assert.equal(context.v004ValidateMultiTabSignal({ ...validInput, protocol: "V004_MULTI_TAB_SIGNAL_999" }, "tab-own-c007").code, "UNSUPPORTED_PROTOCOL");
assert.equal(context.v004ValidateMultiTabSignal({ ...validInput, senderTabId: "tab-own-c007" }, "tab-own-c007").code, "SELF_SIGNAL");
assert.equal(context.v004ValidateMultiTabSignal({ ...validInput, revisions: { ...revisions, inventoryRevision: -1 } }, "tab-own-c007").code, "MALFORMED_SIGNAL");
assert.deepEqual(Array.from(context.v004ValidateMultiTabSignal(validInput, "tab-own-c007").signal.affected.cardIds), ["card-a"]);

const local = { inventoryRevision: 4, craftListRevision: 3, allocationRevision: 8, historySequence: 2 };
assert.equal(context.v004ShouldRefreshFromDurable(local, { ...local, inventoryRevision: 5 }, false), true);
assert.equal(context.v004ShouldRefreshFromDurable(local, { ...local }, false), false);
assert.equal(context.v004ShouldRefreshFromDurable(local, { ...local, inventoryRevision: 3, craftListRevision: 4 }, false), false);
assert.equal(context.v004ShouldRefreshFromDurable(local, { inventoryRevision: 0, craftListRevision: 0, allocationRevision: 0, historySequence: 0 }, true), true);

assert.equal(context.v004OpenMultiTabSignalChannel(), "READY");
assert.equal(context.v004OpenMultiTabSignalChannel(), "READY");
assert.equal(state.multiTab.listenerRegistrations, 1);
assert.equal(FakeBroadcastChannel.instances[0].listeners.size, 1);
const sentResult = context.v004SignalDurableMutation("CRAFT_COMPLETED", validInput.affected);
assert.equal(sentResult.sent, true);
assert.equal(FakeBroadcastChannel.instances[0].messages.length, 1);
const sentMessage = FakeBroadcastChannel.instances[0].messages[0];
assert.equal(sentMessage.protocol, protocol);
assert.equal(sentMessage.senderTabId, state.multiTab.tabInstanceId);
assert.equal(sentMessage.mutationType, "CRAFT_COMPLETED");
assert.deepEqual(sentMessage.revisions, revisions);
assert.ok(Buffer.byteLength(JSON.stringify(sentMessage), "utf8") < 2048);
for (const forbidden of ["userInventory", "materialBatches", "craftingCards", "craftHistory", "userMeta", "tabInstanceId", "channelState"]) {
  assert.equal(Object.prototype.hasOwnProperty.call(sentMessage, forbidden), false, `Signal leaked forbidden field: ${forbidden}`);
}
assert.equal(state.multiTab.refreshCount, 0, "Sender entered a refresh loop");

state.multiTab.tabInstanceId = "tab-own-c007";
assert.equal(context.v004HandleMultiTabSignal(validInput).code, "VALID_SIGNAL");
assert.equal(context.v004HandleMultiTabSignal(validInput).code, "DUPLICATE_OR_OUT_OF_ORDER");
assert.equal(context.v004HandleMultiTabSignal({ ...validInput, senderSequence: 1 }).code, "DUPLICATE_OR_OUT_OF_ORDER");
assert.equal(state.multiTab.accepted, 1);
assert.equal(state.multiTab.ignored, 2);
assert.deepEqual(Array.from(context.v004MultiTabRuntime.queuedMutationTypes), ["CRAFT_COMPLETED"]);

const durableRefreshSource = context.v004RefreshUserDataFromDurableSignal.toString();
assert.match(durableRefreshSource, /loadUserMeta/);
assert.match(durableRefreshSource, /loadMaterialBatches/);
assert.match(durableRefreshSource, /loadCraftingCards/);
assert.match(durableRefreshSource, /loadCraftHistory/);
assert.match(durableRefreshSource, /markReservationSnapshotsStale\("MULTI_TAB_DURABLE_CHANGE"\)/);
assert.doesNotMatch(durableRefreshSource, /recalculateAllocation/);

for (const functionName of [
  "setCraftingListView", "renderBlueprintBrowserResults", "openV004CraftCompletionConfirmation",
  "cancelV004CraftCompletionConfirmation", "openV004CraftUndoConfirmation", "cancelV004CraftUndoConfirmation"
]) {
  assert.doesNotMatch(topLevelFunctionSource(functionName), /v004SignalDurableMutation/, `${functionName} must remain presentation-only`);
}

assert.equal(context.v004CloseMultiTabSignalChannel(), "CLOSED");
windowStub.BroadcastChannel = undefined;
assert.equal(context.v004OpenMultiTabSignalChannel(), "MULTI_TAB_SIGNAL_UNAVAILABLE");
assert.equal(context.v004SignalDurableMutation("INVENTORY_CHANGED", {}).sent, false);

assert.match(appHtml, /backupSchemaVersion:\s*3/);
assert.doesNotMatch(topLevelFunctionSource("buildM4BackupEnvelope"), /tabInstanceId|multiTab|received signal/i);
assert.match(appHtml, /commitCraftCompletion[\s\S]*?v004ValidateCurrentCraftCompletionState/);
assert.match(appHtml, /commitCraftUndo[\s\S]*?v004BuildCraftUndoMutation/);

const evidence = {
  cycle: "V004-C007",
  status: "PASS_TARGETED_MODEL",
  applicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
  protocol: {
    marker: protocol,
    channelName: context.APP.multiTabChannelName,
    mutationTypes: Array.from(context.V004_MULTI_TAB_MUTATION_TYPES),
    payloadBytesUnder2048: true,
    durablePayloadFields: 0
  },
  validation: {
    valid: "ACCEPTED",
    malformed: "IGNORED",
    unsupportedVersion: "IGNORED",
    selfMessage: "IGNORED",
    duplicate: "IGNORED",
    outOfOrder: "IGNORED"
  },
  revisionReconciliation: {
    newerDurableRefresh: true,
    equalIgnored: true,
    normalRegressionIgnored: true,
    backupImportForceAllowsExactLowerOrEqualRestore: true
  },
  lifecycle: {
    repeatedOpenListenerRegistrations: state.multiTab.listenerRegistrations,
    senderRefreshLoop: false,
    unavailableFallback: state.multiTab.status
  },
  authority: {
    broadcastChannel: "UI_SIGNAL_ONLY",
    indexedDb: "DURABLE_AUTHORITY",
    receiverAppliesPayloadAsState: false,
    durableRereadBeforeUiUpdate: true,
    automaticReallocate: false
  },
  presentationOnly: {
    broadcasts: 0,
    durableWrites: 0
  },
  backup: {
    schema: 3,
    sessionFieldsIncluded: 0
  },
  singleFile: {
    runtimeFiles: 1,
    sidecars: 0,
    localScriptSrc: (appHtml.match(/<script[^>]+src=["'](?!https?:|data:)/gi) || []).length,
    localStylesheet: (appHtml.match(/<link[^>]+rel=["']stylesheet["'][^>]*href=["'](?!https?:|data:)/gi) || []).length
  }
};

fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`V004_C007_MULTI_TAB_MODEL_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
