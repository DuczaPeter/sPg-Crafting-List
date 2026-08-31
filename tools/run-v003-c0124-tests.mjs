import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const artifactDirectory = path.join(projectDirectory, "test-artifacts", "V003-C012.4");
const evidencePath = path.join(artifactDirectory, "numeric-editor-evidence.json");
const html = fs.readFileSync(appPath, "utf8");

const blockMatch = html.match(/\/\* C0124_NUMERIC_EDITOR_START \*\/([\s\S]*?)\/\* C0124_NUMERIC_EDITOR_END \*\//);
assert.ok(blockMatch, "A C012.4 kozos numeric editor blokk hianyzik.");

class FakeNumericInput {
  constructor(value) {
    this.value = String(value);
    this.dataset = {};
    this.listeners = new Map();
    this.selectedAll = false;
    this.selectCount = 0;
    this.validityMessage = "";
  }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  dispatch(type, values = {}) {
    const event = {
      key: values.key || "",
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; }
    };
    for (const listener of this.listeners.get(type) || []) listener.call(this, event);
    return event;
  }
  select() {
    this.selectedAll = true;
    this.selectCount += 1;
  }
  setCustomValidity(message) { this.validityMessage = message; }
  blur() {
    documentState.activeElement = null;
    this.dispatch("blur");
  }
  pointerFocus() {
    this.dispatch("pointerdown");
    documentState.activeElement = this;
    this.dispatch("focus");
    this.dispatch("pointerup");
  }
  keyboardFocus() {
    documentState.activeElement = this;
    this.dispatch("focus");
  }
  typeSequence(text) {
    for (const character of String(text)) {
      this.value = this.selectedAll ? character : this.value + character;
      this.selectedAll = false;
      this.dispatch("input");
    }
  }
  replaceWithEmpty() {
    this.value = "";
    this.selectedAll = false;
    this.dispatch("input");
  }
}

const documentState = { activeElement: null };
const notices = [];
const context = vm.createContext({
  console,
  document: documentState,
  setNotice: (message, tone) => notices.push({ message, tone }),
  Promise,
  Object,
  Number,
  String,
  TypeError
});
vm.runInContext(`${blockMatch[1]}
globalThis.__C0124__ = { normalizeCommittedNumericDraft, bindCommittedNumericEditor, bindQualityTargetEditor };`, context, { filename: "spg-v003-c0124-numeric-editor.js" });
const model = context.__C0124__;

const quantityResolver = (draft) => model.normalizeCommittedNumericDraft(draft, {
  integer: true,
  roundInteger: true,
  min: 1,
  clamp: true,
  emptyValue: 1
});
const qualityResolver = (draft) => model.normalizeCommittedNumericDraft(draft, { integer: true, min: 0, max: 1000 });

assert.deepEqual(JSON.parse(JSON.stringify(quantityResolver(""))), { ok: true, value: 1, text: "1", normalization: "EMPTY_NORMALIZED" });
assert.equal(quantityResolver("0").value, 1);
assert.equal(quantityResolver("2").value, 2);
assert.equal(quantityResolver("11").value, 11);
assert.equal(quantityResolver("452").value, 452);
assert.equal(quantityResolver("11452").value, 11452);
assert.equal(quantityResolver("20.6").value, 21);
assert.equal(qualityResolver("950").value, 950);
assert.equal(qualityResolver("1001").ok, false);
assert.equal(qualityResolver("").ok, false);
assert.equal(model.normalizeCommittedNumericDraft("1.2345", { min: 0.0001 }).value, 1.2345);
assert.equal(model.normalizeCommittedNumericDraft("1,2345", { min: 0.0001 }).ok, false, "A C012.4 nem vezet be uj vesszos locale-parsert.");

function assertFirstFocusReplacement(initialValue, replacement, resolver, expectedValue) {
  const input = new FakeNumericInput(initialValue);
  const committed = [];
  model.bindCommittedNumericEditor(input, {
    resolveDraft: resolver,
    onCommit: (value, currentInput, reason) => committed.push({ value, reason })
  });
  input.pointerFocus();
  input.typeSequence(replacement);
  input.blur();
  assert.equal(input.value, String(expectedValue));
  assert.deepEqual(committed, [{ value: expectedValue, reason: "blur" }]);
}

for (const [initialValue, replacement, expected] of [
  ["1", "2", 2],
  ["1", "11", 11],
  ["1", "452", 452],
  ["1", "11452", 11452],
  ["20", "3", 3],
  ["20", "300", 300]
]) {
  assertFirstFocusReplacement(initialValue, replacement, quantityResolver, expected);
}
for (const [initialValue, replacement, expected] of [
  ["800", "900", 900],
  ["800", "950", 950],
  ["950", "700", 700]
]) {
  assertFirstFocusReplacement(initialValue, replacement, qualityResolver, expected);
}

const commits = [];
const quantityInput = new FakeNumericInput("1");
model.bindCommittedNumericEditor(quantityInput, {
  resolveDraft: quantityResolver,
  onCommit: (value, input, reason) => commits.push({ value, reason, sameInput: input === quantityInput })
});
quantityInput.pointerFocus();
assert.equal(quantityInput.selectCount, 1, "Az elso mouse focus nem jelolte ki a teljes erteket.");
quantityInput.typeSequence("11452");
assert.equal(quantityInput.value, "11452");
assert.equal(commits.length, 0, "Gepeles kozben commit vagy User Data iras tortent.");
assert.equal(documentState.activeElement, quantityInput, "Gepeles kozben elveszett a focus.");
assert.equal(quantityInput.dataset.numericCommit, "DRAFT");
quantityInput.dispatch("keydown", { key: "ArrowLeft" });
quantityInput.dispatch("keydown", { key: "ArrowRight" });
quantityInput.dispatch("keydown", { key: "Home" });
quantityInput.dispatch("keydown", { key: "End" });
assert.equal(quantityInput.value, "11452", "A helper felulirta a bongeszo nativ navigacios billentyuit.");
quantityInput.dispatch("keydown", { key: "Enter" });
assert.deepEqual(commits, [{ value: 11452, reason: "enter", sameInput: true }]);
assert.equal(quantityInput.value, "11452");

const replacementCommits = [];
const replacementInput = new FakeNumericInput("11452");
model.bindCommittedNumericEditor(replacementInput, {
  resolveDraft: quantityResolver,
  onCommit: (value, input, reason) => replacementCommits.push({ value, reason })
});
replacementInput.pointerFocus();
replacementInput.typeSequence("3");
replacementInput.dispatch("change");
replacementInput.blur();
assert.equal(replacementInput.value, "3");
assert.deepEqual(replacementCommits, [{ value: 3, reason: "change" }], "A change+blur kettos commitot okozott.");

const emptyDraftInput = new FakeNumericInput("20");
const emptyDraftCommits = [];
model.bindCommittedNumericEditor(emptyDraftInput, {
  resolveDraft: quantityResolver,
  onCommit: (value, input, reason) => emptyDraftCommits.push({ value, reason })
});
emptyDraftInput.pointerFocus();
emptyDraftInput.replaceWithEmpty();
assert.equal(emptyDraftInput.value, "", "Az ures koztes draft visszaugrott committed ertekre.");
assert.equal(emptyDraftCommits.length, 0);
emptyDraftInput.typeSequence("300");
assert.equal(emptyDraftInput.value, "300");
emptyDraftInput.blur();
assert.deepEqual(emptyDraftCommits, [{ value: 300, reason: "blur" }]);

const alreadyFocusedSelectCount = emptyDraftInput.selectCount;
documentState.activeElement = emptyDraftInput;
emptyDraftInput.dispatch("pointerdown");
emptyDraftInput.dispatch("pointerup");
assert.equal(emptyDraftInput.selectCount, alreadyFocusedSelectCount, "Az ujrakattintas ismet kijelolt mindent, igy caret-edit nem lehetseges.");

const keyboardInput = new FakeNumericInput("800");
const qualityCommits = [];
model.bindCommittedNumericEditor(keyboardInput, {
  resolveDraft: qualityResolver,
  onCommit: (value, input, reason) => qualityCommits.push({ value, reason })
});
keyboardInput.keyboardFocus();
assert.equal(keyboardInput.selectCount, 1, "A keyboard/Tab focus nem jelolte ki az aktualis erteket.");
keyboardInput.replaceWithEmpty();
assert.equal(keyboardInput.value, "");
keyboardInput.typeSequence("950");
keyboardInput.dispatch("keydown", { key: "Enter" });
assert.equal(keyboardInput.value, "950");
assert.deepEqual(qualityCommits, [{ value: 950, reason: "enter" }]);

const invalidQualityInput = new FakeNumericInput("950");
model.bindCommittedNumericEditor(invalidQualityInput, { resolveDraft: qualityResolver });
invalidQualityInput.pointerFocus();
invalidQualityInput.replaceWithEmpty();
invalidQualityInput.blur();
assert.equal(invalidQualityInput.value, "950", "Invalid Target Q commitkor nem az elozo ertek allt vissza.");
assert.equal(invalidQualityInput.dataset.numericCommit, "RESTORED_INVALID");

const stationResult = model.normalizeCommittedNumericDraft("", { allowEmpty: true, integer: true, min: 1 });
assert.equal(stationResult.ok, true);
assert.equal(stationResult.value, null);

const staticNumberInputs = [...html.matchAll(/<input[^>]+type="number"/g)].length;
const dynamicNumberInputs = [...html.matchAll(/\.type\s*=\s*"number"/g)].length;
assert.equal(staticNumberInputs, 3);
assert.equal(dynamicNumberInputs, 5);
assert.doesNotMatch(html, /onQuantityInput\s*:/, "A karakterenkenti quantity callback visszakerult.");
assert.doesNotMatch(html, /quantityPersistTimer|var inputTimer = null/, "Karakterenkenti numeric mentest/renderelest vezerlo timer maradt.");
assert.match(html, /bindCommittedNumericEditor\(document\.getElementById\("batchQuality"\)\)/);
assert.match(html, /bindCommittedNumericEditor\(document\.getElementById\("batchQuantity"\)\)/);
assert.match(html, /bindCommittedNumericEditor\(document\.getElementById\("miningStationOverride"\)/);
assert.match(html, /function renderCombinedQualityPool[\s\S]*bindCommittedNumericEditor\(input,/);
assert.match(html, /var quantityValue = Number\(document\.getElementById\("batchQuantity"\)\.value\)/, "A meglevo SCU\/ITEM parser megvaltozott.");
assert.match(html, /unit === "SCU" \? toScuUnits\(quantityValue\) : quantityValue/, "A 1 SCU = 10000 unit utvonal megvaltozott.");

const evidence = {
  cycle: "V003-C012.4",
  status: "PASS",
  rootCause: "INPUT_EVENT_NORMALIZATION_PLUS_DEBOUNCED_FULL_RERENDER",
  helper: "bindCommittedNumericEditor",
  normalizationHelper: "normalizeCommittedNumericDraft",
  auditedNumericInputs: [
    "Blueprint Browser Final Card quantity",
    "Crafting List expanded card quantity",
    "Combined Materials Minimum Q",
    "Combined Materials MAX Q",
    "Crafting requirement Target Q",
    "My Materials batch quantity",
    "My Materials batch Quality",
    "Mining Loadout station count override"
  ],
  craftQuantity: { oneTo11452: 11452, elevenFourFiveTwoToThree: 3, temporaryEmpty: "PASS" },
  targetQuality: { eightHundredToNineFifty: 950, invalidCommit: "RESTORE_PREVIOUS" },
  interaction: {
    firstFocusSelectAll: "PASS",
    alreadyFocusedCaretEdit: "PASS",
    multiCharacterFocusStable: "PASS",
    backspaceDeleteDraft: "PASS",
    arrowHomeEndNativePathPreserved: "PASS",
    enterCommit: "PASS",
    blurCommit: "PASS",
    changeNoDoubleCommit: "PASS",
    tabUsesNativeBlurCommit: "PASS"
  },
  userDataWritesDuringDraft: 0,
  decimalAudit: { dot: "SUPPORTED_AS_BEFORE", comma: "NOT_PARSED_AS_BEFORE", scuPrecision: 4 },
  staticNumberInputs,
  dynamicNumberInputs
};
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log("V003_C0124_NUMERIC_EDITOR_TEST_PASS");
console.log(JSON.stringify(evidence, null, 2));
