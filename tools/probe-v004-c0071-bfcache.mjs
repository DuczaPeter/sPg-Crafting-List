import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const moduleArgument = process.argv.find(value => value.startsWith("--playwright-module="));
const gitRefArgument = process.argv.find(value => value.startsWith("--git-ref="));
const evidenceArgument = process.argv.find(value => value.startsWith("--evidence="));
const checkpointWorkingTreeShaArgument = process.argv.find(value => value.startsWith("--checkpoint-working-tree-sha="));
const gitRef = gitRefArgument ? gitRefArgument.slice("--git-ref=".length) : null;
const checkpointWorkingTreeSha256 = checkpointWorkingTreeShaArgument
  ? checkpointWorkingTreeShaArgument.slice("--checkpoint-working-tree-sha=".length)
  : null;
const appBuffer = gitRef
  ? execFileSync("git", ["show", `${gitRef}:sPg Crafting List.html`], { cwd: projectDirectory, maxBuffer: 16 * 1024 * 1024 })
  : fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"));

async function loadPlaywright() {
  if (moduleArgument) {
    const imported = await import(pathToFileURL(path.resolve(moduleArgument.slice("--playwright-module=".length))).href);
    return imported.default || imported;
  }
  const imported = await import("playwright");
  return imported.default || imported;
}

const server = http.createServer((request, response) => {
  if (request.url === "/away") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end("<!doctype html><meta charset=utf-8><title>Away</title><p>BFCache target</p>");
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(appBuffer);
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

const origin = `http://127.0.0.1:${server.address().port}`;
const playwright = await loadPlaywright();
const browser = await playwright.chromium.launch({
  channel: "chrome",
  headless: true,
  ignoreDefaultArgs: ["--disable-back-forward-cache"],
  args: ["--enable-features=BackForwardCache"]
});
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await context.addInitScript(() => {
  Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => false });
  window.__c0071PageShows = [];
  window.addEventListener("pageshow", event => {
    window.__c0071PageShows.push({ persisted: event.persisted, at: Date.now() });
  });
});

async function openApp() {
  const page = await context.newPage();
  await page.goto(`${origin}/app-bfcache`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.waitForFunction(() => document.body.dataset.multiTabSignalStatus === "READY");
  return page;
}

try {
  const pageA = await openApp();
  const pageB = await openApp();
  const cdp = await context.newCDPSession(pageA);
  const bfcacheNotUsed = [];
  await cdp.send("Page.enable");
  cdp.on("Page.backForwardCacheNotUsed", event => bfcacheNotUsed.push(event));
  const initial = await pageA.evaluate(() => ({
    tabId: window.__SPG_TEST__.state.multiTab.tabInstanceId,
    listenerRegistrations: window.__SPG_TEST__.state.multiTab.listenerRegistrations,
    batchCount: window.__SPG_TEST__.state.materialBatches.length
  }));
  await pageA.goto(`${origin}/away`, { waitUntil: "domcontentloaded" });
  await pageB.evaluate(async () => {
    const now = new Date().toISOString();
    await window.__SPG_TEST__.persistMaterialBatches([{
      id: "batch-c0071-bfcache",
      materialUuid: "material-c0071-bfcache",
      sourceMaterialUuid: "material-c0071-bfcache",
      materialName: "C007.1 BFCache material",
      quality: 900,
      quantityUnits: 100,
      unit: "SCU",
      createdAt: now,
      updatedAt: now
    }], "C0071_BFCACHE_MUTATION");
  });
  await pageA.goBack({ waitUntil: "commit" });
  await pageA.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await pageA.waitForTimeout(500);
  const result = await pageA.evaluate(async () => ({
    pageShows: window.__c0071PageShows,
    navigationType: performance.getEntriesByType("navigation")[0]?.type || null,
    signalStatus: document.body.dataset.multiTabSignalStatus,
    tabId: window.__SPG_TEST__.state.multiTab.tabInstanceId,
    listenerRegistrations: window.__SPG_TEST__.state.multiTab.listenerRegistrations,
    runtimeBatchCount: window.__SPG_TEST__.state.materialBatches.length,
    durableBatchCount: (await window.__SPG_TEST__.userDataRepository.loadMaterialBatches()).length,
    refreshCount: window.__SPG_TEST__.state.multiTab.refreshCount
  }));
  const passed = result.pageShows.at(-1)?.persisted === true && result.signalStatus === "READY" &&
    result.runtimeBatchCount === result.durableBatchCount && result.listenerRegistrations === 1;
  const evidence = {
    cycle: "V004-C007.1",
    purpose: "BFCACHE_PRE_FIX_REPRODUCTION",
    applicationRef: gitRef || "WORKTREE",
    servedSource: gitRef ? "GIT_OBJECT_CANONICAL_LF" : "WORKTREE_BYTES",
    servedApplicationSha256: crypto.createHash("sha256").update(appBuffer).digest("hex"),
    checkpointWorkingTreeSha256,
    status: passed ? "PASS" : "FAIL_REPRODUCED",
    initial,
    result,
    bfcacheNotUsed
  };
  if (evidenceArgument) {
    const evidencePath = path.resolve(projectDirectory, evidenceArgument.slice("--evidence=".length));
    fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
    fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  }
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  if (!passed) {
    process.exitCode = 2;
  }
} finally {
  await context.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
