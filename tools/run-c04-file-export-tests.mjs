import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { TextDecoder, TextEncoder } from "node:util";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const htmlSource = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const cssBytes = fs.readFileSync(path.join(projectDirectory, "Info", "style.css"));
const cssSource = cssBytes.toString("utf8");
const modelMatch = htmlSource.match(/\/\* C04_FILE_EXPORT_CSS_MODEL_START \*\/([\s\S]*?)\/\* C04_FILE_EXPORT_CSS_MODEL_END \*\//);
assert.ok(modelMatch, "A C04 file export CSS modellblokk hiányzik.");

const snapshotMatch = htmlSource.match(/<template id="spgApplicationCssSnapshot"[^>]*data-source="([^"]+)"[^>]*data-encoding="([^"]+)"[^>]*data-sha256="([a-f0-9]{64})"[^>]*data-bytes="(\d+)"[^>]*>([\s\S]*?)<\/template>/);
assert.ok(snapshotMatch, "A generált export-CSS snapshot hiányzik.");
const [, source, encoding, declaredHash, declaredBytes, encodedSnapshot] = snapshotMatch;
const decodedBytes = Buffer.from(encodedSnapshot.replace(/\s+/g, ""), "base64");
const actualHash = crypto.createHash("sha256").update(cssBytes).digest("hex");

assert.equal(source, "Info/style.css");
assert.equal(encoding, "base64");
assert.equal(Number(declaredBytes), cssBytes.length);
assert.equal(declaredHash, actualHash);
assert.deepEqual(decodedBytes, cssBytes, "Az embedded export-CSS nem byte-azonos a központi Info/style.css fájllal.");
assert.match(htmlSource, /<link rel="stylesheet" href="Info\/style\.css" data-app-styles>/);

async function runCssReader(protocol) {
  const events = [];
  const savedRecords = [];
  let cssRulesReads = 0;
  const stylesheet = {};
  Object.defineProperty(stylesheet, "cssRules", {
    get() {
      cssRulesReads += 1;
      if (protocol === "file:") {
        const error = new Error("Cannot access rules");
        error.name = "SecurityError";
        throw error;
      }
      return [{ cssText: cssSource }];
    }
  });
  const template = {
    dataset: { encoding, bytes: declaredBytes, sha256: declaredHash, source },
    content: { textContent: encodedSnapshot }
  };
  const context = vm.createContext({
    Array,
    Object,
    String,
    Uint8Array,
    TextDecoder,
    TextEncoder,
    atob: (value) => Buffer.from(value, "base64").toString("binary"),
    state: { cssText: null, cssReady: false, dbReady: true },
    location: { protocol },
    document: { getElementById: (id) => id === "spgApplicationCssSnapshot" ? template : null },
    waitForApplicationStylesheet: async () => ({ href: "Info/style.css", sheet: stylesheet }),
    fetch: async () => { throw new Error("A célzott tesztben nincs hálózati CSS-forrás."); },
    database: {
      get: async () => null,
      put: async (_store, record) => { savedRecords.push(record); }
    },
    logger: { event: (level, code, message, detail) => events.push({ level, code, message, detail }) },
    serializeError: (error) => ({ name: error.name, message: error.message }),
    nowIso: () => "2026-08-24T09:00:00.000Z"
  });
  vm.runInContext(`${modelMatch[1]}\nglobalThis.__C04__ = { readApplicationCss };`, context, { filename: "spg-c04-css-model.js" });
  const css = await context.__C04__.readApplicationCss();
  return { css, events, savedRecords, cssRulesReads, state: context.state };
}

const fileResult = await runCssReader("file:");
assert.equal(fileResult.cssRulesReads, 0, "file:// alatt a tiltott CSSOM cssRules útvonal nem futhat le.");
assert.ok(fileResult.events.some((event) => event.level === "INFO" && event.code === "CSS_EMBEDDED_SNAPSHOT_USED"));
assert.ok(!fileResult.events.some((event) => event.code === "CSS_CSSOM_READ_FAILED"));
assert.ok(!fileResult.events.some((event) => event.level === "WARN" || event.level === "ERROR"));
assert.equal(fileResult.state.cssReady, true);
assert.equal(fileResult.savedRecords[0].runtimeSource, "GENERATED_EMBEDDED_SNAPSHOT");
assert.doesNotMatch(fileResult.css, /fonts\.googleapis\.com/i);
assert.match(fileResult.css, /Standalone offline font fallback/);
assert.ok(fileResult.css.length > 70000);

const httpResult = await runCssReader("http:");
assert.equal(httpResult.cssRulesReads, 1, "localhost alatt a működő CSSOM útvonalnak meg kell maradnia.");
assert.equal(httpResult.savedRecords[0].runtimeSource, "CSSOM");
assert.doesNotMatch(httpResult.css, /fonts\.googleapis\.com/i);

console.log("C04_FILE_EXPORT_CSS_TEST_PASS");
console.log(JSON.stringify({
  source,
  sha256: actualHash,
  bytes: cssBytes.length,
  fileProtocolCssomReads: fileResult.cssRulesReads,
  fileProtocolWarnings: fileResult.events.filter((event) => event.level === "WARN").length,
  httpProtocolCssomReads: httpResult.cssRulesReads,
  embeddedCssMatchesCentralCss: true,
  externalFontDependencyRemoved: true
}, null, 2));
