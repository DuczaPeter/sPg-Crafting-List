import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const htmlPath = path.join(projectDirectory, "sPg Crafting List.html");
const html = fs.readFileSync(htmlPath, "utf8");
const css = extractEmbeddedApplicationCss(html);

assertSingleFileRuntimeMarkup(html);
assert.ok(Buffer.byteLength(css) > 70000, "A beágyazott alkalmazás-CSS gyanúsan rövid.");
assert.doesNotMatch(css, /@import[^;]+https?:/i, "A beágyazott CSS távoli importot tartalmaz.");
for (const selector of [".spg-app-shell", ".spg-badge-dynamic", ".spg-export-page", ".spg-material-database-layout"]) {
  assert.ok(css.includes(selector), `Hiányzó embedded CSS selector: ${selector}`);
}

const cssBytes = Buffer.from(css, "utf8");
const sha256 = crypto.createHash("sha256").update(cssBytes).digest("hex");
console.log(`EMBEDDED_APPLICATION_CSS_PASS ${sha256} ${cssBytes.length} bytes`);
