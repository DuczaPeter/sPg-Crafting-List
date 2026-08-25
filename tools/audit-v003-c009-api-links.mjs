import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const outputArgument = process.argv.find((argument) => argument.startsWith("--output="));
const outputPath = outputArgument
  ? path.resolve(projectDirectory, outputArgument.slice("--output=".length))
  : null;
const version = "4.9.0-LIVE.12232306";
const expected = [
  { type: "items", id: "b1c89d89-d408-4998-9b17-76986d78a9dd", name: "JS-300", slug: "js-300" },
  { type: "commodities", id: "32bafbd4-c52a-476d-b31c-97c4b3102471", name: "Stileron (Ore)", slug: "stileron-ore" },
  { type: "commodities", id: "eb503701-389a-48a1-af28-eb7374009d5d", name: "Beryl (Raw)", slug: "beryl-raw" },
  { type: "commodities", id: "d76ea7ef-5116-488c-93d3-71e02bada13d", name: "Savrilium (Ore)", slug: "savrilium-ore" }
];

const records = [];
for (const target of expected) {
  const apiUrl = `https://api.star-citizen.wiki/api/${target.type}/${target.id}?version=${encodeURIComponent(version)}`;
  const response = await fetch(apiUrl, { headers: { Accept: "application/json" } });
  assert.equal(response.status, 200, `${target.name} API rekord nem érhető el.`);
  const payload = await response.json();
  const record = payload.data;
  const expectedWebUrl = `https://api.star-citizen.wiki/${target.type}/${target.slug}?version=${version}`;
  assert.equal(record.uuid, target.id, `${target.name} UUID eltér.`);
  assert.equal(record.slug, target.slug, `${target.name} slug eltér.`);
  assert.equal(record.web_url, expectedWebUrl, `${target.name} exact web_url eltér.`);
  records.push({
    type: target.type,
    uuid: record.uuid,
    name: record.name,
    slug: record.slug,
    webUrl: record.web_url,
    sourceApiUrl: apiUrl
  });
}

const report = {
  status: "PASS",
  auditedAt: new Date().toISOString(),
  gameVersion: version,
  resolutionRule: "EXACT_SOURCE_RECORD_WEB_URL_ONLY",
  nameDerivedUrl: false,
  records
};
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
console.log("V003_C009_EXACT_API_LINK_AUDIT_PASS");
console.log(JSON.stringify(report, null, 2));
