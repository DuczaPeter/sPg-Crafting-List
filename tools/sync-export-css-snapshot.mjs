import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const htmlPath = path.join(projectDirectory, "sPg Crafting List.html");
const cssPath = path.join(projectDirectory, "Info", "style.css");
const startMarker = "  <!-- SPG_APPLICATION_CSS_SNAPSHOT_START -->";
const endMarker = "  <!-- SPG_APPLICATION_CSS_SNAPSHOT_END -->";
const checkOnly = process.argv.includes("--check");

const html = fs.readFileSync(htmlPath, "utf8");
const cssBytes = fs.readFileSync(cssPath);
const cssBase64 = cssBytes.toString("base64");
const wrappedBase64 = cssBase64.match(/.{1,120}/g)?.join("\n") || "";
const sha256 = crypto.createHash("sha256").update(cssBytes).digest("hex");
const generatedBlock = [
  startMarker,
  `  <template id="spgApplicationCssSnapshot" data-source="Info/style.css" data-encoding="base64" data-sha256="${sha256}" data-bytes="${cssBytes.length}">`,
  wrappedBase64,
  "  </template>",
  endMarker
].join("\n");
const markerPattern = new RegExp(`${startMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);

if (!markerPattern.test(html)) {
  throw new Error("A fő HTML export-CSS snapshot markerei hiányoznak.");
}

const synchronizedHtml = html.replace(markerPattern, generatedBlock);
if (checkOnly) {
  if (synchronizedHtml !== html) {
    console.error("EXPORT_CSS_SNAPSHOT_DRIFT");
    console.error("Futtasd: node .\\tools\\sync-export-css-snapshot.mjs");
    process.exit(1);
  }
  console.log(`EXPORT_CSS_SNAPSHOT_CHECK_PASS ${sha256} ${cssBytes.length} bytes`);
} else {
  if (synchronizedHtml !== html) {
    fs.writeFileSync(htmlPath, synchronizedHtml, "utf8");
    console.log(`EXPORT_CSS_SNAPSHOT_UPDATED ${sha256} ${cssBytes.length} bytes`);
  } else {
    console.log(`EXPORT_CSS_SNAPSHOT_ALREADY_CURRENT ${sha256} ${cssBytes.length} bytes`);
  }
}
