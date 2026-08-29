import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const appPath = path.join(projectDirectory, "sPg Crafting List.html");
const appHtml = fs.readFileSync(appPath, "utf8");
const appCss = extractEmbeddedApplicationCss(appHtml);
const artifactArgument = process.argv.find((argument) => argument.startsWith("--artifact="));
const artifactPath = artifactArgument
  ? path.resolve(projectDirectory, artifactArgument.slice("--artifact=".length))
  : path.join(projectDirectory, "test-artifacts", "V003-C012.2", "standalone-js-300-version-b.html");

const block = (name) => {
  const match = appHtml.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-29T16:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("MATERIAL_COLOR_MODEL")}
${block("C0122_VERSION_CONSISTENCY_MODEL")}
${block("M6_STANDALONE_EXPORT_MODEL")}
globalThis.__C0122__ = {
  recordVersion: c0122RecordScVersion,
  activeVersion: resolveActiveScVersion,
  selectVersion: c0122SelectExactVersion,
  hydrationKey: c0122VersionScopedHydrationKey,
  project: buildVersionScopedRecordProjection,
  normalizeBlueprint,
  itemLink: resolveItemApiDeepLink,
  materialLink: resolveMaterialApiDeepLink,
  buildSnapshot: buildFinalCraftingCardViewModel,
  renderStandalone: m6RenderStandaloneHtml
};`, context, { filename: "spg-v003-c0122-model.js" });

const model = context.__C0122__;
const VERSION_A = "4.9.0-LIVE.12232306";
const VERSION_B = "4.10.0-LIVE.12519617";
const sharedCommodityUuid = "93c8b7df-d6ac-4b4f-a115-b0e3afc238b8";
const sharedItemUuid = "fixture-js-300-item";
const provenance = (gameVersion, marker) => ({ gameVersion, dataSource: "FIXTURE", source: marker, fetchedAt: "2026-08-29T16:00:00.000Z", origin: "FIXTURE" });
const commodityRecord = (gameVersion, marker, recordType = "COMMODITY_DETAIL") => ({
  cacheKey: `${gameVersion}::commodity-detail::${sharedCommodityUuid}`,
  recordType,
  uuid: sharedCommodityUuid,
  name: `Beryl ${marker}`,
  locations: [{ name: marker }],
  provenance: provenance(gameVersion, marker)
});
const outputRecord = (gameVersion, marker) => ({
  cacheKey: `${gameVersion}::crafting-output-item::${sharedItemUuid}`,
  recordType: "CRAFTING_OUTPUT_ITEM_PRESENTATION",
  uuid: sharedItemUuid,
  name: `JS-300 ${marker}`,
  webUrl: `https://api.star-citizen.wiki/items/js-300?version=${gameVersion}`,
  provenance: provenance(gameVersion, marker)
});
const blueprintRecord = (gameVersion, marker) => ({
  cacheKey: `${gameVersion}::fixture-blueprint`,
  uuid: "fixture-blueprint",
  gameVersion,
  recipeSlots: [{ id: "slot-shared", ingredient: { commodityUuid: sharedCommodityUuid }, marker }],
  provenance: provenance(gameVersion, marker)
});

const normalizedMiningRecords = [
  commodityRecord(VERSION_A, "VERSION_A"),
  outputRecord(VERSION_A, "VERSION_A"),
  commodityRecord(VERSION_B, "VERSION_B"),
  outputRecord(VERSION_B, "VERSION_B")
];
const blueprintDetails = [blueprintRecord(VERSION_A, "VERSION_A"), blueprintRecord(VERSION_B, "VERSION_B")];
const miningCommodityIndex = [
  { ...commodityRecord(VERSION_A, "VERSION_A", "COMMODITY_INDEX"), locations: undefined },
  { ...commodityRecord(VERSION_B, "VERSION_B", "COMMODITY_INDEX"), locations: undefined }
];
const projection = model.project({
  activeScVersion: VERSION_B,
  activeMiningDataset: { version: VERSION_B },
  normalizedMiningRecords,
  blueprintDetails,
  miningCommodityIndex
});
assert.equal(projection.status, "ACTIVE_VERSION_ALIGNED");
assert.equal(projection.detailRecords.length, 1);
assert.equal(projection.detailRecords[0].name, "Beryl VERSION_B");
assert.equal(projection.outputPresentationRecords.length, 1);
assert.equal(projection.outputPresentationRecords[0].name, "JS-300 VERSION_B");
assert.equal(projection.blueprintDetails.length, 1);
assert.equal(projection.blueprintDetails[0].recipeSlots[0].marker, "VERSION_B");
assert.equal(projection.miningCommodityIndex.length, 1);
assert.equal(projection.miningCommodityIndex[0].name, "Beryl VERSION_B");
assert.equal(normalizedMiningRecords.length, 4, "A régi cache rekordjai nem maradtak meg.");
assert.ok(normalizedMiningRecords.some((record) => model.recordVersion(record) === VERSION_A), "A VERSION_A cache eltűnt.");
assert.notEqual(model.hydrationKey(VERSION_A, sharedCommodityUuid), model.hydrationKey(VERSION_B, sharedCommodityUuid));

const blocked = model.project({
  activeScVersion: VERSION_B,
  activeMiningDataset: { version: VERSION_A },
  normalizedMiningRecords,
  blueprintDetails,
  miningCommodityIndex
});
assert.equal(blocked.status, "CROSS_VERSION_DATASET_BLOCKED");
assert.equal(blocked.detailRecords.length, 0);
assert.equal(blocked.miningCommodityIndex.length, 0);
assert.equal(blocked.outputPresentationRecords[0].provenance.gameVersion, VERSION_B);

const staleItemUrl = `https://api.star-citizen.wiki/items/js-300?version=${VERSION_A}`;
const currentItemLink = model.itemLink({ exactUrls: [staleItemUrl], gameVersion: VERSION_B });
assert.equal(currentItemLink.url, `https://api.star-citizen.wiki/items/js-300?version=${VERSION_B}`);
assert.equal(currentItemLink.origin, "API_WEB_URL");
assert.equal(currentItemLink.versionOrigin, "ACTIVE_SC_VERSION");
const currentMaterialLink = model.materialLink({
  exactUrls: [`https://api.star-citizen.wiki/commodities/stileron-ore?version=${VERSION_A}`],
  gameVersion: VERSION_B
});
assert.equal(currentMaterialLink.url, `https://api.star-citizen.wiki/commodities/stileron-ore?version=${VERSION_B}`);

const rawBlueprint = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "js-300-blueprint.json"), "utf8"));
rawBlueprint.game_version = VERSION_B;
rawBlueprint.output_item_web_url = staleItemUrl;
rawBlueprint.web_url = `https://api.star-citizen.wiki/blueprints/js-300?version=${VERSION_A}`;
const blueprint = model.normalizeBlueprint(rawBlueprint, {
  gameVersion: VERSION_B,
  dataSource: "FIXTURE",
  source: "VERSION_B",
  fetchedAt: "2026-08-29T16:00:00.000Z",
  origin: "FIXTURE"
});
const slugs = { Stileron: "stileron-ore", Beryl: "beryl-raw", Savrilium: "savrilium-ore" };
const card = {
  id: "c0122-js300",
  order: 0,
  active: true,
  quantity: 1,
  blueprintUuid: blueprint.uuid,
  outputUuid: blueprint.outputUuid,
  outputName: blueprint.outputName,
  outputType: blueprint.outputType,
  outputTypeLabel: blueprint.outputTypeLabel,
  outputWebUrl: staleItemUrl,
  craftTimeSeconds: blueprint.craftTimeSeconds,
  gameVersion: VERSION_A,
  requirements: blueprint.recipeSlots.map((slot) => ({
    id: slot.id,
    recipeSlotName: slot.recipeSlotName,
    ingredientUuid: slot.ingredientUuid,
    commodityUuid: slot.ingredientUuid,
    materialName: slot.materialName,
    materialWebUrl: `https://api.star-citizen.wiki/commodities/${slugs[slot.materialName]}?version=${VERSION_A}`,
    requiredQuantityUnits: slot.requiredQuantityUnits,
    unit: slot.unit,
    qualityCapability: slot.qualityCapability,
    affectedStats: slot.affectedStats
  }))
};
const cardResult = {
  cardId: card.id,
  maxCraftable: 0,
  satisfied: false,
  bottleneckSlotIds: card.requirements.map((requirement) => requirement.id),
  requirements: card.requirements.map((requirement) => ({
    recipeSlotId: requirement.id,
    commodityUuid: requirement.commodityUuid,
    requiredUnits: requirement.requiredQuantityUnits,
    allocatedUnits: 0,
    missingAmountUnits: requirement.requiredQuantityUnits,
    missingQualityUnits: 0,
    status: "MISSING_AMOUNT",
    materialIntelligence: {
      scVersion: VERSION_B,
      material: {
        uuid: requirement.commodityUuid,
        canonicalName: requirement.materialName,
        slug: slugs[requirement.materialName],
        webUrl: requirement.materialWebUrl,
        apiWikiLink: { url: requirement.materialWebUrl },
        categories: ["SHIP_MINING"],
        source: provenance(VERSION_B, `${requirement.materialName}-material-B`)
      },
      mining: {
        status: "AVAILABLE",
        methods: ["SHIP_MINING"],
        systems: [],
        decisions: [],
        source: provenance(VERSION_B, `${requirement.materialName}-mining-B`)
      },
      refinery: { status: "MAPPING_UNRESOLVED", systems: [] },
      loadouts: []
    }
  }))
};
const snapshot = model.buildSnapshot({
  appName: "sPg Crafting List",
  generatedAt: "2026-08-29T16:00:00.000Z",
  scDataVersion: VERSION_B,
  card,
  cardResult,
  blueprint,
  outputPresentation: {
    uuid: blueprint.outputUuid,
    name: blueprint.outputName,
    slug: "js-300",
    webUrl: staleItemUrl,
    provenance: provenance(VERSION_B, "item-B")
  },
  trace: []
});
assert.equal(snapshot.scDataVersion, VERSION_B);
assert.equal(snapshot.card.apiWikiLink.url, `https://api.star-citizen.wiki/items/js-300?version=${VERSION_B}`);
for (const requirement of snapshot.requirements) {
  assert.equal(requirement.materialDetails.source.gameVersion, VERSION_B);
  assert.equal(requirement.mining.source.gameVersion, VERSION_B);
  assert.equal(new URL(requirement.materialDetails.apiWikiLink.url).searchParams.get("version"), VERSION_B);
}

const standalone = model.renderStandalone(snapshot, appCss);
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, standalone, "utf8");
assert.ok(standalone.length > 100000, "A C012.2 standalone artifact túl kicsi.");
assert.ok(standalone.includes(`https://api.star-citizen.wiki/items/js-300?version=${VERSION_B}`));
assert.doesNotMatch(standalone, new RegExp(`(?:items/js-300|commodities/(?:stileron-ore|beryl-raw|savrilium-ore))\\?version=${VERSION_A.replace(/\./g, "\\.")}`));
assert.doesNotMatch(standalone, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);
assert.doesNotMatch(standalone, /fetch\s*\(/i);
const payload = standalone.match(/<script type="application\/json" id="spg-export-snapshot">([\s\S]*?)<\/script>/);
assert.ok(payload, "A C012.2 standalone snapshot hiányzik.");
assert.equal(JSON.parse(payload[1]).scDataVersion, VERSION_B);

assertSingleFileRuntimeMarkup(appHtml);
for (const marker of [
  "function resolveActiveScVersion",
  "function buildVersionScopedRecordProjection",
  "CROSS_VERSION_DATASET_BLOCKED",
  "c0122VersionScopedHydrationKey",
  'version + "::raw::commodity-detail::"',
  'version + "::commodity-detail::"',
  'activeScVersion + "::" + card.blueprintUuid'
]) {
  assert.ok(appHtml.includes(marker), `A C012.2 runtime marker hiányzik: ${marker}`);
}
assert.match(appHtml, /scDataVersion: resolveActiveScVersion\(state\)/);
assert.doesNotMatch(appHtml, /scDataVersion: card\.gameVersion/);

console.log("V003_C0122_VERSION_CONSISTENCY_TEST_PASS");
console.log(JSON.stringify({
  activeScVersion: VERSION_B,
  itemApiUrl: snapshot.card.apiWikiLink.url,
  materialApiUrls: Object.fromEntries(snapshot.requirements.map((requirement) => [requirement.materialName, requirement.materialDetails.apiWikiLink.url])),
  materialSourceVersions: Object.fromEntries(snapshot.requirements.map((requirement) => [requirement.materialName, requirement.materialDetails.source.gameVersion])),
  miningSourceVersions: Object.fromEntries(snapshot.requirements.map((requirement) => [requirement.materialName, requirement.mining.source.gameVersion])),
  versionACacheRetained: true,
  versionALeakIntoVersionB: false,
  crossVersionBlock: blocked.status,
  standalonePath: path.relative(projectDirectory, artifactPath).replace(/\\/g, "/"),
  standaloneBytes: Buffer.byteLength(standalone, "utf8")
}, null, 2));
