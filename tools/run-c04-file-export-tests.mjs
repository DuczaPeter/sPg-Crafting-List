import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { TextEncoder } from "node:util";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const htmlPath = path.join(projectDirectory, "sPg Crafting List.html");
const htmlSource = fs.readFileSync(htmlPath, "utf8");
const cssSource = extractEmbeddedApplicationCss(htmlSource);
const cssBytes = Buffer.from(cssSource, "utf8");
const cssHash = crypto.createHash("sha256").update(cssBytes).digest("hex");
const modelMatch = htmlSource.match(/\/\* C04_FILE_EXPORT_CSS_MODEL_START \*\/([\s\S]*?)\/\* C04_FILE_EXPORT_CSS_MODEL_END \*\//);

assert.ok(modelMatch, "A C04 embedded CSS modellblokk hiányzik.");
assertSingleFileRuntimeMarkup(htmlSource);
assert.doesNotMatch(cssSource, /@import[^;]+https?:/i);
assert.ok(cssBytes.length > 70000);

async function runCssReader(protocol) {
  const events = [];
  let networkReads = 0;
  const style = {
    dataset: { source: "embedded" },
    textContent: cssSource
  };
  const context = vm.createContext({
    String,
    TextEncoder,
    state: { cssText: null, cssReady: false },
    location: { protocol },
    document: { getElementById: (id) => id === "spgApplicationStyles" ? style : null },
    fetch: async () => { networkReads += 1; throw new Error("Nem lehet CSS-hálózati olvasás."); },
    logger: { event: (level, code, message, detail) => events.push({ level, code, message, detail }) }
  });
  vm.runInContext(`${modelMatch[1]}\nglobalThis.__C04__ = { readApplicationCss, readEmbeddedApplicationCss };`, context, { filename: "spg-c04-single-file-css-model.js" });
  const css = await context.__C04__.readApplicationCss();
  return { css, events, networkReads, state: context.state };
}

for (const protocol of ["file:", "http:"]) {
  const result = await runCssReader(protocol);
  assert.equal(result.networkReads, 0, `${protocol} alatt nem lehet CSS-hálózati olvasás.`);
  assert.ok(result.events.some((event) => event.level === "INFO" && event.code === "CSS_EMBEDDED_SOURCE_USED"));
  assert.ok(!result.events.some((event) => event.level === "WARN" || event.level === "ERROR"));
  assert.equal(result.state.cssReady, true);
  assert.doesNotMatch(result.css, /fonts\.googleapis\.com/i);
  assert.match(result.css, /Standalone offline font fallback/);
}

const isolatedDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "spg-v002-single-file-"));
try {
  const isolatedHtmlPath = path.join(isolatedDirectory, "sPg Crafting List.html");
  fs.copyFileSync(htmlPath, isolatedHtmlPath);
  const isolatedHtml = fs.readFileSync(isolatedHtmlPath, "utf8");
  assertSingleFileRuntimeMarkup(isolatedHtml);
  assert.equal(extractEmbeddedApplicationCss(isolatedHtml), cssSource);
  assert.deepEqual(fs.readdirSync(isolatedDirectory), ["sPg Crafting List.html"]);
} finally {
  fs.rmSync(isolatedDirectory, { recursive: true, force: true });
}

console.log("C04_SINGLE_FILE_CSS_TEST_PASS");
console.log(JSON.stringify({
  source: "embedded-style",
  sha256: cssHash,
  bytes: cssBytes.length,
  fileProtocolCssNetworkReads: 0,
  httpProtocolCssNetworkReads: 0,
  localSidecarFilesRequired: 0,
  duplicateCssSnapshot: false,
  externalFontDependencyRemoved: true
}, null, 2));
