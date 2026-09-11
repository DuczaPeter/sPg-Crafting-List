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

export const V004_C0081_HARNESS_CONTRACT = Object.freeze({
  directDependencies: DIRECT_M1_VERSIONED_DEPENDENCIES,
  quantityClosure: EXACT_QUANTITY_DECLARATIONS.map(([identifier]) => identifier)
});
