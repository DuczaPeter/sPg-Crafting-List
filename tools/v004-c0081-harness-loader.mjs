import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const RELEASE_MODE_ENV = "SPG_V004_RELEASE_CANDIDATE_MODE";
const CANDIDATE_PATH_ENV = "SPG_V004_VERIFIED_CANDIDATE_PATH";
const CANDIDATE_SHA_ENV = "SPG_V004_VERIFIED_CANDIDATE_SHA256";
const CANDIDATE_BYTES_ENV = "SPG_V004_VERIFIED_CANDIDATE_BYTES";

const DIRECT_M1_VERSIONED_DEPENDENCIES = Object.freeze([
  "v004BuildExactRequirementQuantityEvidence"
]);

const EXACT_QUANTITY_DECLARATIONS = Object.freeze([
  ["V004_REQUIREMENT_QUANTITY_EXACTNESS", "var V004_REQUIREMENT_QUANTITY_EXACTNESS = Object.freeze({"],
  ["V004_QUANTITY_NORMALIZATION_STATUS", "var V004_QUANTITY_NORMALIZATION_STATUS = Object.freeze({"],
  ["V004_SCU_NORMALIZATION_RULE", "var V004_SCU_NORMALIZATION_RULE = "],
  ["V004_ITEM_NORMALIZATION_RULE", "var V004_ITEM_NORMALIZATION_RULE = "],
  ["v004FixedScuTextFromUnitBigInt", "function v004FixedScuTextFromUnitBigInt("],
  ["v004ParsePositiveDecimalToFourDpUnits", "function v004ParsePositiveDecimalToFourDpUnits("],
  ["v004BuildExactRequirementQuantityEvidence", "function v004BuildExactRequirementQuantityEvidence("]
]);

const DIRECT_M4_VERSIONED_DEPENDENCIES = Object.freeze([
  "V004_CRAFT_HISTORY_EVENT_SCHEMA",
  "V004_META_KEYS",
  "V004_QUANTITY_SEMANTICS",
  "v004DefaultUserMetaRecords",
  "v004MigrationError",
  "v004NormalizeImportedCards",
  "v004NormalizeImportedCraftHistory",
  "v004ValidateCraftHistoryEvent"
]);

const M4_REQUIRED_DECLARATIONS = Object.freeze([
  ["APP", "var APP = Object.freeze({"],
  ["isUserSettingRecord", "function isUserSettingRecord(record) {"],
  ["V004_META_KEYS", "var V004_META_KEYS = Object.freeze({"],
  ["V003_SOURCE_DATABASE", "var V003_SOURCE_DATABASE = Object.freeze({"],
  ["V003_SOURCE_STORE_SPECS", "var V003_SOURCE_STORE_SPECS = Object.freeze(["],
  ["v004MigrationError", "function v004MigrationError(code, message) {"],
  ["v004DefaultUserMetaRecords", "function v004DefaultUserMetaRecords() {"],
  ["normalizeV003SourceUserData", "function normalizeV003SourceUserData(data) {"],
  ["V004_RESERVATION_SNAPSHOT_MARKER", "var V004_RESERVATION_SNAPSHOT_MARKER = "],
  ["V004_OUTPUT_COUNT_EVIDENCE", "var V004_OUTPUT_COUNT_EVIDENCE = Object.freeze({"],
  ["V004_QUANTITY_SEMANTICS", "var V004_QUANTITY_SEMANTICS = Object.freeze({"],
  ["V004_CRAFT_RUN_INPUT_EVIDENCE", "var V004_CRAFT_RUN_INPUT_EVIDENCE = Object.freeze({"],
  ["v004NormalizeRequirementExactEvidence", "function v004NormalizeRequirementExactEvidence(requirement) {"],
  ["v004RequirementHasExactCraftRunInput", "function v004RequirementHasExactCraftRunInput(requirement) {"],
  ["v004CardCraftRunInputEvidence", "function v004CardCraftRunInputEvidence(card) {"],
  ["v004NormalizeCardRevision", "function v004NormalizeCardRevision(card) {"],
  ["v004NormalizeImportedCards", "function v004NormalizeImportedCards(cards) {"],
  ["v004NormalizeImportedCraftHistory", "function v004NormalizeImportedCraftHistory(events) {"],
  ["v004CanonicalizeCraftHistoryCardSnapshot", "function v004CanonicalizeCraftHistoryCardSnapshot(snapshot, fallbackOrder) {"],
  ["V004_CRAFT_HISTORY_EVENT_SCHEMA", "var V004_CRAFT_HISTORY_EVENT_SCHEMA = "],
  ["v004CraftCompleteError", "function v004CraftCompleteError(code, message, detail) {"],
  ["v004ValidateCraftHistoryEvent", "function v004ValidateCraftHistoryEvent(event) {"],
  ["normalizeStoredCraftingCard", "function normalizeStoredCraftingCard(card, fallbackOrder) {"],
  ["normalizeStoredCraftHistoryEvent", "function normalizeStoredCraftHistoryEvent(event) {"]
]);

const M4_CLOSURE_VERSIONED_IDENTIFIERS = Object.freeze([
  ...EXACT_QUANTITY_DECLARATIONS.map(([identifier]) => identifier),
  "V004_CRAFT_HISTORY_EVENT_SCHEMA",
  "V004_CRAFT_RUN_INPUT_EVIDENCE",
  "V004_META_KEYS",
  "V004_OUTPUT_COUNT_EVIDENCE",
  "V004_QUANTITY_SEMANTICS",
  "V004_RESERVATION_SNAPSHOT_MARKER",
  "v004CardCraftRunInputEvidence",
  "v004CanonicalizeCraftHistoryCardSnapshot",
  "v004CraftCompleteError",
  "v004DefaultUserMetaRecords",
  "v004MigrationError",
  "v004NormalizeCardRevision",
  "v004NormalizeImportedCards",
  "v004NormalizeImportedCraftHistory",
  "v004NormalizeRequirementExactEvidence",
  "v004RequirementHasExactCraftRunInput",
  "v004ValidateCraftHistoryEvent"
]);

function fail(code, message) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  throw error;
}

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    fail("VERIFIED_CANDIDATE_BINDING_MISSING", `Release módban kötelező környezeti változó hiányzik: ${name}`);
  }
  return value;
}

function parseExpectedBytes(value) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    fail("VERIFIED_CANDIDATE_SIZE_INVALID", `Érvénytelen expected byte size: ${value}`);
  }
  return parsed;
}

function uniqueIndex(source, needle, label) {
  const first = source.indexOf(needle);
  const last = source.lastIndexOf(needle);
  if (first < 0) {
    fail("PRODUCTION_SOURCE_ANCHOR_MISSING", `${label}: ${needle}`);
  }
  if (first !== last) {
    fail("PRODUCTION_SOURCE_ANCHOR_DUPLICATE", `${label}: ${needle}`);
  }
  return first;
}

function extractUniqueMarkerBlock(source, markerName) {
  const startMarker = `/* ${markerName}_START */`;
  const endMarker = `/* ${markerName}_END */`;
  const start = uniqueIndex(source, startMarker, `${markerName} start marker`) + startMarker.length;
  const end = uniqueIndex(source, endMarker, `${markerName} end marker`);
  if (end <= start) {
    fail("PRODUCTION_SOURCE_RANGE_INVALID", `${markerName} marker sorrend hibás.`);
  }
  return { source: source.slice(start, end), start, end };
}

function extractUniqueRange(source, startAnchor, endAnchor, label, bounds) {
  const start = uniqueIndex(source, startAnchor, `${label} start`);
  const end = uniqueIndex(source, endAnchor, `${label} end`);
  if (end <= start) {
    fail("PRODUCTION_SOURCE_RANGE_INVALID", `${label}: a source range sorrendje hibás.`);
  }
  if (bounds && (start < bounds.start || end > bounds.end)) {
    fail("PRODUCTION_SOURCE_MARKER_BOUNDARY_INVALID", `${label}: a source range kilépett a várt markerblokkból.`);
  }
  return source.slice(start, end);
}

function executableVersionedIdentifiers(source) {
  let sanitized = "";
  let state = "CODE";
  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];
    if (state === "CODE") {
      if (current === "/" && next === "/") {
        state = "LINE_COMMENT";
        sanitized += "  ";
        index += 1;
      } else if (current === "/" && next === "*") {
        state = "BLOCK_COMMENT";
        sanitized += "  ";
        index += 1;
      } else if (current === "'") {
        state = "SINGLE_QUOTE";
        sanitized += " ";
      } else if (current === "\"") {
        state = "DOUBLE_QUOTE";
        sanitized += " ";
      } else if (current === "`") {
        state = "TEMPLATE";
        sanitized += " ";
      } else {
        sanitized += current;
      }
      continue;
    }
    if (state === "LINE_COMMENT") {
      sanitized += current === "\n" ? "\n" : " ";
      if (current === "\n") { state = "CODE"; }
      continue;
    }
    if (state === "BLOCK_COMMENT") {
      if (current === "*" && next === "/") {
        sanitized += "  ";
        index += 1;
        state = "CODE";
      } else {
        sanitized += current === "\n" ? "\n" : " ";
      }
      continue;
    }
    if (current === "\\") {
      sanitized += " ";
      if (next !== undefined) {
        sanitized += next === "\n" ? "\n" : " ";
        index += 1;
      }
      continue;
    }
    if ((state === "SINGLE_QUOTE" && current === "'") || (state === "DOUBLE_QUOTE" && current === "\"")) {
      sanitized += " ";
      state = "CODE";
      continue;
    }
    if (state === "TEMPLATE" && current === "$" && next === "{") {
      fail("DEPENDENCY_SCAN_TEMPLATE_EXPRESSION_UNSUPPORTED", "Az auditált source template expressiont tartalmaz; explicit review szükséges.");
    }
    if (state === "TEMPLATE" && current === "`") {
      sanitized += " ";
      state = "CODE";
      continue;
    }
    sanitized += current === "\n" ? "\n" : " ";
  }
  if (state !== "CODE" && state !== "LINE_COMMENT") {
    fail("DEPENDENCY_SCAN_UNTERMINATED_LITERAL", `Lezáratlan JavaScript lexical state: ${state}`);
  }
  return new Set(Array.from(sanitized.matchAll(/\b(?:v004[A-Za-z0-9_$]*|V004_[A-Z0-9_]+)\b/g), (match) => match[0]));
}

function assertExactSet(actual, expected, code, label) {
  const actualSorted = Array.from(actual).sort();
  const expectedSorted = Array.from(expected).sort();
  if (JSON.stringify(actualSorted) !== JSON.stringify(expectedSorted)) {
    fail(code, `${label}; expected=${expectedSorted.join(",")} actual=${actualSorted.join(",")}`);
  }
}

export function loadVerifiedCandidateHtml({ candidatePath, expectedSha256, expectedBytes, localApplicationPath } = {}) {
  const releaseMode = process.env[RELEASE_MODE_ENV] === "1";
  const selectedPath = releaseMode ? requiredEnvironment(CANDIDATE_PATH_ENV) : (candidatePath || localApplicationPath);
  const selectedExpectedSha256 = releaseMode ? requiredEnvironment(CANDIDATE_SHA_ENV) : expectedSha256;
  const selectedExpectedBytes = releaseMode ? requiredEnvironment(CANDIDATE_BYTES_ENV) : expectedBytes;
  if (!selectedPath) {
    fail("APPLICATION_PATH_MISSING", "Nincs explicit candidate path vagy local application fallback.");
  }
  const strictBinding = releaseMode || candidatePath !== undefined || expectedSha256 !== undefined || expectedBytes !== undefined;
  if (strictBinding && (selectedExpectedSha256 === undefined || selectedExpectedBytes === undefined)) {
    fail("VERIFIED_CANDIDATE_BINDING_INCOMPLETE", "Az explicit candidate path, SHA-256 és byte size együtt kötelező.");
  }
  const resolvedPath = path.resolve(selectedPath);
  const rawBytes = fs.readFileSync(resolvedPath);
  const observedBytes = rawBytes.byteLength;
  const observedSha256 = crypto.createHash("sha256").update(rawBytes).digest("hex");
  if (strictBinding) {
    const normalizedExpectedSha256 = String(selectedExpectedSha256).toLowerCase();
    const normalizedExpectedBytes = parseExpectedBytes(selectedExpectedBytes);
    if (!/^[0-9a-f]{64}$/.test(normalizedExpectedSha256)) {
      fail("VERIFIED_CANDIDATE_SHA_INVALID", `Érvénytelen expected SHA-256: ${normalizedExpectedSha256}`);
    }
    if (observedBytes !== normalizedExpectedBytes) {
      fail("VERIFIED_CANDIDATE_SIZE_MISMATCH", `expected=${normalizedExpectedBytes} actual=${observedBytes}`);
    }
    if (observedSha256 !== normalizedExpectedSha256) {
      fail("VERIFIED_CANDIDATE_SHA_MISMATCH", `expected=${normalizedExpectedSha256} actual=${observedSha256}`);
    }
  }
  let html;
  try {
    html = new TextDecoder("utf-8", { fatal: true }).decode(rawBytes);
  } catch (error) {
    fail("VERIFIED_CANDIDATE_UTF8_INVALID", error.message);
  }
  return Object.freeze({
    html,
    path: resolvedPath,
    sha256: observedSha256,
    bytes: observedBytes,
    binding: strictBinding ? "FROZEN_CANDIDATE" : "LOCAL_APPLICATION"
  });
}

export function buildM1HarnessSource(verifiedCandidateHtml) {
  if (typeof verifiedCandidateHtml !== "string" || !verifiedCandidateHtml.length) {
    fail("VERIFIED_CANDIDATE_HTML_INVALID", "A candidate HTML string hiányzik.");
  }
  const m1 = extractUniqueMarkerBlock(verifiedCandidateHtml, "M1_PURE_MODEL");
  const c003 = extractUniqueMarkerBlock(verifiedCandidateHtml, "V004_C003_REVISION_RESERVATION_MODEL");
  const quantityStartAnchor = EXACT_QUANTITY_DECLARATIONS[0][1];
  const quantityEndAnchor = "function v004NormalizeRequirementExactEvidence(requirement) {";
  const quantityStart = uniqueIndex(verifiedCandidateHtml, quantityStartAnchor, "exact quantity cluster start");
  const quantityEnd = uniqueIndex(verifiedCandidateHtml, quantityEndAnchor, "exact quantity cluster end");
  if (quantityEnd <= quantityStart || quantityStart < c003.start || quantityEnd > c003.end) {
    fail("EXACT_QUANTITY_CLUSTER_RANGE_INVALID", "Az exact-quantity cluster nincs a C003 markerhatáron belül.");
  }
  const quantitySource = verifiedCandidateHtml.slice(quantityStart, quantityEnd);
  for (const [identifier, declaration] of EXACT_QUANTITY_DECLARATIONS) {
    uniqueIndex(quantitySource, declaration, `${identifier} declaration`);
  }
  assertExactSet(
    executableVersionedIdentifiers(m1.source),
    DIRECT_M1_VERSIONED_DEPENDENCIES,
    "M1_VERSIONED_DEPENDENCY_CONTRACT_MISMATCH",
    "Az M1 direct versioned dependency készlete megváltozott"
  );
  assertExactSet(
    executableVersionedIdentifiers(quantitySource),
    EXACT_QUANTITY_DECLARATIONS.map(([identifier]) => identifier),
    "M1_QUANTITY_CLOSURE_CONTRACT_MISMATCH",
    "Az exact-quantity dependency closure megváltozott"
  );
  return `${quantitySource}\n${m1.source}`;
}

export function buildM4HarnessSource(verifiedCandidateHtml) {
  if (typeof verifiedCandidateHtml !== "string" || !verifiedCandidateHtml.length) {
    fail("VERIFIED_CANDIDATE_HTML_INVALID", "A candidate HTML string hiányzik.");
  }
  const c002 = extractUniqueMarkerBlock(verifiedCandidateHtml, "V004_C002_MIGRATION_MODEL");
  const c003 = extractUniqueMarkerBlock(verifiedCandidateHtml, "V004_C003_REVISION_RESERVATION_MODEL");
  const c004 = extractUniqueMarkerBlock(verifiedCandidateHtml, "V004_C004_ATOMIC_CRAFT_COMPLETE_MODEL");
  const m2 = extractUniqueMarkerBlock(verifiedCandidateHtml, "M2_ALLOCATION_ENGINE");
  const m4 = extractUniqueMarkerBlock(verifiedCandidateHtml, "M4_COMBINED_BACKUP_MODEL");
  const m1HarnessSource = buildM1HarnessSource(verifiedCandidateHtml);

  const m4DependencySource = [
    extractUniqueRange(verifiedCandidateHtml, "var APP = Object.freeze({", "var STORE_DEFINITIONS = Object.freeze({", "APP declaration"),
    extractUniqueRange(verifiedCandidateHtml, "function isUserSettingRecord(record) {", "class UserDataRepository", "User Setting predicate"),
    extractUniqueRange(verifiedCandidateHtml, "var V004_META_KEYS = Object.freeze({", "function buildV003MigrationCanonicalPayload", "M4 meta and V003 source normalization", c002),
    extractUniqueRange(verifiedCandidateHtml, "var V004_RESERVATION_SNAPSHOT_MARKER = ", "var V004_RESERVATION_STATUS", "reservation snapshot marker", c003),
    extractUniqueRange(verifiedCandidateHtml, "var V004_OUTPUT_COUNT_EVIDENCE = Object.freeze({", "var V004_REQUIREMENT_QUANTITY_EXACTNESS", "Card quantity constants", c003),
    extractUniqueRange(verifiedCandidateHtml, "function v004NormalizeRequirementExactEvidence(requirement) {", "function v004RevisionError", "Card exact-evidence normalization", c003),
    extractUniqueRange(verifiedCandidateHtml, "function v004NormalizeCardRevision(card) {", "function v004RequirementAllocationSemantic", "Card revision normalization", c003),
    extractUniqueRange(verifiedCandidateHtml, "function v004NormalizeImportedCards(cards) {", "function v004ReservationError", "imported Card and History normalization", c003),
    extractUniqueRange(verifiedCandidateHtml, "var V004_CRAFT_HISTORY_EVENT_SCHEMA = ", "function v004StaleReservationError", "Craft History schema and error", c004),
    extractUniqueRange(verifiedCandidateHtml, "function v004ValidateCraftHistoryEvent(event) {", "function v004BuildCraftCompletionMutation", "Craft History validation", c004),
    extractUniqueRange(verifiedCandidateHtml, "function normalizeStoredCraftingCard(card, fallbackOrder) {", "/* V004_C005_CRAFT_HISTORY_UI_MODEL_START */", "stored Card and History normalization")
  ].join("\n");

  for (const [identifier, declaration] of M4_REQUIRED_DECLARATIONS) {
    uniqueIndex(m4DependencySource, declaration, `${identifier} declaration`);
  }
  assertExactSet(
    executableVersionedIdentifiers(m4.source),
    DIRECT_M4_VERSIONED_DEPENDENCIES,
    "M4_VERSIONED_DEPENDENCY_CONTRACT_MISMATCH",
    "Az M4 direct versioned dependency készlete megváltozott"
  );
  assertExactSet(
    executableVersionedIdentifiers(`${m1HarnessSource}\n${m4DependencySource}`),
    M4_CLOSURE_VERSIONED_IDENTIFIERS,
    "M4_CLOSURE_CONTRACT_MISMATCH",
    "Az M4 explicit versioned dependency closure megváltozott"
  );
  return `${m1HarnessSource}\n${m2.source}\n${m4DependencySource}\n${m4.source}`;
}

export function buildHistorySnapshotCardNormalizerSource(verifiedCandidateHtml) {
  if (typeof verifiedCandidateHtml !== "string" || !verifiedCandidateHtml.length) {
    fail("VERIFIED_CANDIDATE_HTML_INVALID", "A candidate HTML string hiányzik.");
  }
  const recipeSlotAssignments = extractUniqueMarkerBlock(verifiedCandidateHtml, "C0125C_RECIPE_SLOT_POOL_ASSIGNMENT_MODEL");
  const storedCardNormalizer = extractUniqueRange(
    verifiedCandidateHtml,
    "function normalizeStoredCraftingCard(card, fallbackOrder) {",
    "function normalizeStoredCraftHistoryEvent(event) {",
    "stored Card normalizer"
  );
  uniqueIndex(storedCardNormalizer, "function normalizeStoredCraftingCard(card, fallbackOrder) {", "stored Card normalizer declaration");
  return `${recipeSlotAssignments.source}\n${storedCardNormalizer}`;
}

export const V004_C0081_HARNESS_CONTRACT = Object.freeze({
  directDependencies: DIRECT_M1_VERSIONED_DEPENDENCIES,
  quantityClosure: EXACT_QUANTITY_DECLARATIONS.map(([identifier]) => identifier),
  directM4Dependencies: DIRECT_M4_VERSIONED_DEPENDENCIES,
  m4RequiredDeclarations: M4_REQUIRED_DECLARATIONS.map(([identifier]) => identifier),
  m4Closure: M4_CLOSURE_VERSIONED_IDENTIFIERS,
  historySnapshotCardNormalizer: Object.freeze([
    "C0125C_RECIPE_SLOT_POOL_ASSIGNMENT_MODEL",
    "normalizeStoredCraftingCard"
  ])
});
