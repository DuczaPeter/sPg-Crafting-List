import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const outputArgument = process.argv.find((argument) => argument.startsWith("--output="));
const outputPath = outputArgument
  ? path.resolve(projectDirectory, outputArgument.slice("--output=".length))
  : path.join(projectDirectory, "test-artifacts", "V003-C008.1", "public-wiki-audit.json");

const titles = ["JS-300", "Beryl", "Stileron", "Savrilium"];
const queryUrl = new URL("https://star-citizen.wiki/api.php");
queryUrl.search = new URLSearchParams({
  action: "query",
  format: "json",
  formatversion: "2",
  redirects: "1",
  titles: titles.join("|")
}).toString();

const queryResponse = await fetch(queryUrl, { headers: { accept: "application/json" } });
assert.equal(queryResponse.ok, true, `MediaWiki exact-title query: HTTP ${queryResponse.status}`);
const query = await queryResponse.json();
const pages = new Map((query.query?.pages || []).map((page) => [page.title, page]));

for (const title of ["JS-300", "Beryl"]) {
  const page = pages.get(title);
  assert.ok(page && !page.missing && Number.isInteger(page.pageid), `${title}: exact public Wiki page missing.`);
  const publicUrl = `https://star-citizen.wiki/${encodeURIComponent(title)}`;
  const response = await fetch(publicUrl, { redirect: "follow", headers: { accept: "text/html,application/xhtml+xml" } });
  assert.equal(response.ok, true, `${publicUrl}: HTTP ${response.status}`);
  assert.equal(new URL(response.url).hostname, "star-citizen.wiki");
}

for (const title of ["Stileron", "Savrilium"]) {
  const page = pages.get(title);
  assert.ok(page && page.missing === true, `${title}: a public exact-title query unexpectedly resolved.`);
}

const result = {
  status: "PASS",
  auditedAt: new Date().toISOString(),
  resolverPolicy: "EXACT_TITLE_OR_REDIRECT_ONLY",
  fuzzyMatching: false,
  queryUrl: queryUrl.toString(),
  records: titles.map((title) => {
    const page = pages.get(title);
    const verified = Boolean(page && !page.missing && Number.isInteger(page.pageid));
    return {
      canonicalName: title,
      resolutionStatus: verified ? "VERIFIED" : "NO_PROVEN_PUBLIC_WIKI_URL",
      resolutionOrigin: verified ? "MEDIAWIKI_EXACT_TITLE" : "MEDIAWIKI_EXACT_TITLE_NOT_FOUND",
      publicWikiUrl: verified ? `https://star-citizen.wiki/${encodeURIComponent(title)}` : null,
      pageId: verified ? page.pageid : null
    };
  })
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log("V003_C0081_PUBLIC_WIKI_AUDIT_PASS");
console.log(JSON.stringify({ output: path.relative(projectDirectory, outputPath), records: result.records }, null, 2));
