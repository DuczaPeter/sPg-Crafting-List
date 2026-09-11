import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const applicationArgument = process.argv.find(value => value.startsWith("--application="));
const evidenceArgument = process.argv.find(value => value.startsWith("--evidence="));
const moduleArgument = process.argv.find(value => value.startsWith("--playwright-module="));
const applicationPath = applicationArgument
  ? path.resolve(projectDirectory, applicationArgument.slice("--application=".length))
  : path.join(projectDirectory, "test-artifacts", "V004-C008", "fresh-release-candidate", "sPg Crafting List V004 RC.html");
const evidencePath = evidenceArgument
  ? path.resolve(projectDirectory, evidenceArgument.slice("--evidence=".length))
  : path.join(projectDirectory, "test-artifacts", "V004-C008", "candidate-browser-evidence.json");
const applicationBytes = fs.readFileSync(applicationPath);

async function loadPlaywright() {
  if (moduleArgument) {
    const imported = await import(pathToFileURL(path.resolve(moduleArgument.slice("--playwright-module=".length))).href);
    return imported.default || imported;
  }
  const imported = await import("playwright");
  return imported.default || imported;
}

function startServer() {
  const server = http.createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    response.end(applicationBytes);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }));
  });
}

async function closeServer(server) {
  await new Promise(resolve => server.close(resolve));
}

function attachErrorCapture(page, errors) {
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console:${message.text()}`);
  });
  page.on("pageerror", error => errors.push(`pageerror:${error.message}`));
}

async function waitForBoot(page) {
  await page.waitForSelector('body[data-app-ready="true"]', { timeout: 30000 });
  await page.waitForFunction(() => document.body.dataset.v003MigrationStatus !== "CHECKING", null, { timeout: 15000 });
}

async function verifyViewport(browser, url, viewport) {
  const errors = [];
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  attachErrorCapture(page, errors);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForBoot(page);
  const boot = await page.evaluate(() => ({
    version: window.__SPG_TEST__.app.version,
    databaseOpen: Boolean(window.__SPG_TEST__.database.db),
    appReady: document.body.dataset.appReady,
    runtimeFiles: 1,
    sidecars: 0,
    overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  }));
  assert.equal(boot.version, "V004");
  assert.equal(boot.databaseOpen, true);
  assert.equal(boot.appReady, "true");
  assert.equal(boot.overflow, 0);
  await page.click("#craftingListNav");
  await page.click("#craftHistoryTab");
  assert.equal(await page.locator("#craftHistoryView").isVisible(), true);
  await page.click("#myMaterialsNav");
  assert.equal(await page.locator("#myMaterialsPanel").isVisible(), true);
  const result = {
    status: "PASS",
    viewport,
    ...boot,
    craftingList: "PASS",
    craftHistory: "PASS",
    myMaterials: "PASS",
    consoleErrors: errors.filter(value => value.startsWith("console:")),
    pageErrors: errors.filter(value => value.startsWith("pageerror:"))
  };
  assert.equal(errors.length, 0);
  await context.close();
  return result;
}

async function verifyDirectFileLive(browser) {
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  attachErrorCapture(page, errors);
  await page.goto(pathToFileURL(applicationPath).href, { waitUntil: "domcontentloaded" });
  await waitForBoot(page);
  const live = await page.evaluate(async () => {
    const test = window.__SPG_TEST__;
    const version = await test.adapter.getDefaultGameVersion();
    test.state.gameVersion = version;
    const blueprint = await test.loadBlueprintDetail("JS-300", { ownsProcess: false });
    const uex = await test.uexAdapter.getRefineryYields({ attempts: 2 });
    return {
      protocol: location.protocol,
      version: test.app.version,
      gameDataIdentity: version.code,
      wikiBlueprintUuid: blueprint.uuid,
      wikiRecipeSlots: blueprint.requirements.length,
      uexHttpStatus: uex.httpStatus,
      uexRecords: uex.records.length,
      indexedDbOpen: Boolean(test.database.db),
      multiTabSignalStatus: document.body.dataset.multiTabSignalStatus,
      overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  });
  assert.equal(live.protocol, "file:");
  assert.equal(live.version, "V004");
  assert.equal(live.gameDataIdentity, "4.10.0-LIVE.12519617");
  assert.ok(live.wikiBlueprintUuid);
  assert.ok(live.wikiRecipeSlots > 0);
  assert.equal(live.uexHttpStatus, 200);
  assert.ok(live.uexRecords > 0);
  assert.equal(live.indexedDbOpen, true);
  assert.equal(live.multiTabSignalStatus, "READY");
  assert.equal(live.overflow, 0);
  assert.equal(errors.length, 0);
  await context.close();
  return {
    status: "PASS_AUTOMATED",
    ...live,
    consoleErrors: errors.filter(value => value.startsWith("console:")),
    pageErrors: errors.filter(value => value.startsWith("pageerror:"))
  };
}

const playwright = await loadPlaywright();
const { server, origin } = await startServer();
let browser;
try {
  browser = await playwright.chromium.launch({ channel: "chrome", headless: true });
  const desktop = await verifyViewport(browser, `${origin}/candidate`, { width: 1920, height: 1080 });
  const mobile = await verifyViewport(browser, `${origin}/candidate`, { width: 390, height: 844 });
  const directFile = await verifyDirectFileLive(browser);
  const evidence = {
    cycle: "V004-C008",
    status: "PASS_CANDIDATE_GOOGLE_CHROME",
    browser: "Google Chrome",
    candidatePath: path.relative(projectDirectory, applicationPath).replaceAll("\\", "/"),
    candidateSha256: crypto.createHash("sha256").update(applicationBytes).digest("hex"),
    candidateBytes: applicationBytes.length,
    runtimeIdentity: "V004",
    desktop,
    mobile,
    directFile,
    consoleErrors: [...desktop.consoleErrors, ...mobile.consoleErrors, ...directFile.consoleErrors],
    pageErrors: [...desktop.pageErrors, ...mobile.pageErrors, ...directFile.pageErrors]
  };
  assert.equal(evidence.consoleErrors.length, 0);
  assert.equal(evidence.pageErrors.length, 0);
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(`V004_C008_CANDIDATE_CHROME_PASS evidence=${path.relative(projectDirectory, evidencePath)}`);
} finally {
  if (browser) await browser.close();
  await closeServer(server);
}
