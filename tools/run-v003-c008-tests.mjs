import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const artifactArgument = process.argv.find((argument) => argument.startsWith("--artifact="));
const artifactPath = artifactArgument ? path.resolve(projectDirectory, artifactArgument.slice("--artifact=".length)) : null;
const htmlSource = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const cssSource = extractEmbeddedApplicationCss(htmlSource);
const block = (name) => {
  const match = htmlSource.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};

const context = vm.createContext({
  console,
  nowIso: () => "2026-08-25T08:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("MATERIAL_NAMING_MODEL")}
${block("MATERIAL_COLOR_MODEL")}
${block("M6_STANDALONE_EXPORT_MODEL")}
globalThis.__C008__ = {
  normalizeBlueprint,
  allocateCardsDeterministically,
  buildFinalCraftingCardViewModel,
  renderStandalone: m6RenderStandaloneHtml,
  resolvePublicWikiDeepLink,
  resolveWikiApiDeepLink,
  resolveDetailModel: resolveC008DetailModel,
  renderDetailMarkup: c008RenderDetailMarkup,
  renderDetailContent: c008RenderDetailContent,
  renderPublicWikiAction: c008RenderPublicWikiAction,
  renderWikiApiAction: c008RenderWikiApiAction,
  collectDetailTargets: c008CollectDetailTargets,
  detailTypes: C008_DETAIL_TYPES
};`, context, { filename: "spg-v003-c008-model.js" });
const model = context.__C008__;

assert.deepEqual(JSON.parse(JSON.stringify(model.detailTypes)), ["blueprint", "material", "radar", "mining", "refinery"]);

const version = "4.9.0-LIVE.12232306";
const itemWikiUrl = `https://api.star-citizen.wiki/items/js-300?version=${version}`;
const publicWikiUrls = {
  "JS-300": "https://star-citizen.wiki/JS-300",
  Beryl: "https://star-citizen.wiki/Beryl"
};
const materialWikiUrls = {
  Stileron: `https://api.star-citizen.wiki/commodities/stileron-ore?version=${version}`,
  Beryl: `https://api.star-citizen.wiki/commodities/beryl-raw?version=${version}`,
  Savrilium: `https://api.star-citizen.wiki/commodities/savrilium-ore?version=${version}`
};

const exact = model.resolveWikiApiDeepLink({ resourceType: "items", exactUrls: [itemWikiUrl] });
assert.equal(exact.status, "AVAILABLE");
assert.equal(exact.origin, "API_WEB_URL");
assert.equal(exact.url, itemWikiUrl);
const slugFallback = model.resolveWikiApiDeepLink({ resourceType: "commodities", slug: "stileron-ore", slugVerifiedByApi: true, gameVersion: version });
assert.equal(slugFallback.status, "AVAILABLE");
assert.equal(slugFallback.origin, "AUDITED_API_SLUG_CANONICAL");
assert.equal(slugFallback.url, materialWikiUrls.Stileron);
assert.equal(model.resolveWikiApiDeepLink({ resourceType: "commodities", slug: "guessed material", slugVerifiedByApi: true }).status, "UNAVAILABLE");
assert.equal(model.resolveWikiApiDeepLink({ resourceType: "commodities", exactUrls: ["https://example.invalid/commodities/stileron"] }).status, "UNAVAILABLE");
assert.equal(model.resolveWikiApiDeepLink({ resourceType: "commodities", slug: "stileron-ore", slugVerifiedByApi: false }).status, "UNAVAILABLE");

const js300Public = model.resolvePublicWikiDeepLink({ targetUuid: "b1c89d89-d408-4998-9b17-76986d78a9dd", canonicalName: "JS-300" });
assert.equal(js300Public.resolutionStatus, "VERIFIED");
assert.equal(js300Public.publicWikiUrl, publicWikiUrls["JS-300"]);
const berylPublic = model.resolvePublicWikiDeepLink({ targetUuid: "93c8b7df-d6ac-4b4f-a115-b0e3afc238b8", canonicalName: "Beryl" });
assert.equal(berylPublic.publicWikiUrl, publicWikiUrls.Beryl);
assert.equal(model.resolvePublicWikiDeepLink({ canonicalName: "Stileron" }).resolutionStatus, "NO_PROVEN_PUBLIC_WIKI_URL");
assert.equal(model.resolvePublicWikiDeepLink({ canonicalName: "Savrilium" }).resolutionStatus, "NO_PROVEN_PUBLIC_WIKI_URL");
assert.equal(model.resolvePublicWikiDeepLink({ canonicalName: "Guessed Material" }).publicWikiUrl, null);
assert.equal(model.resolvePublicWikiDeepLink({ canonicalName: "Bery" }).publicWikiUrl, null);
assert.equal(model.resolvePublicWikiDeepLink({ canonicalName: "Beryl", publicWikiUrl: "https://api.star-citizen.wiki/commodities/beryl", publicWikiVerified: true }).publicWikiUrl, publicWikiUrls.Beryl);
assert.equal(model.resolvePublicWikiDeepLink({ canonicalName: "JS-300", publicWikiUrl: publicWikiUrls["JS-300"], publicWikiVerified: true, verifiedAt: "2026-08-25T04:24:48.744Z" }).resolutionOrigin, "SOURCE_EXACT_PUBLIC_WIKI_URL");
assert.equal(model.resolvePublicWikiDeepLink({ canonicalName: "Unknown", publicWikiUrl: "https://api.star-citizen.wiki/items/unknown", publicWikiVerified: true }).publicWikiUrl, null);
assert.equal(model.resolvePublicWikiDeepLink({ canonicalName: "Unknown", publicWikiUrl: "https://star-citizen.wiki/Unknown", publicWikiVerified: false }).publicWikiUrl, null);

const rawBlueprint = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "js-300-blueprint.json"), "utf8"));
rawBlueprint.output_item_web_url = itemWikiUrl;
rawBlueprint.web_url = `https://api.star-citizen.wiki/blueprints/js-300?version=${version}`;
const blueprint = model.normalizeBlueprint(rawBlueprint, {
  gameVersion: version,
  dataSource: "Star Citizen Wiki API",
  source: "fixture",
  fetchedAt: "2026-08-25T07:59:00.000Z",
  origin: "FIXTURE"
});
const card = {
  id: "c008-js300",
  order: 0,
  active: true,
  quantity: 2,
  blueprintUuid: blueprint.uuid,
  blueprintWebUrl: blueprint.webUrl,
  outputWebUrl: blueprint.outputWebUrl,
  outputUuid: blueprint.outputUuid,
  outputName: blueprint.outputName,
  outputType: blueprint.outputType,
  outputTypeLabel: blueprint.outputTypeLabel,
  craftTimeSeconds: blueprint.craftTimeSeconds,
  isAvailableByDefault: blueprint.isAvailableByDefault,
  gameVersion: blueprint.gameVersion,
  requirements: blueprint.recipeSlots.map((requirement) => ({
    id: requirement.id,
    recipeSlotName: requirement.recipeSlotName,
    ingredientUuid: requirement.ingredientUuid,
    commodityUuid: requirement.ingredient.commodityUuid,
    materialName: requirement.materialName,
    materialWebUrl: materialWikiUrls[requirement.materialName],
    requiredQuantityUnits: requirement.requiredQuantityUnits,
    unit: requirement.unit,
    qualityCapability: requirement.qualityCapability,
    affectedStats: requirement.affectedStats.map((stat) => ({ label: stat.label, key: stat.key }))
  })),
  slotStrategies: {}
};
const [stileron, beryl, savrilium] = card.requirements;
const batches = [
  { id: "stileron-q517", materialUuid: stileron.ingredientUuid, materialName: "Stileron", unit: "SCU", quality: 517, quantityUnits: 10500, createdAt: "1" },
  { id: "beryl-fixed", materialUuid: beryl.ingredientUuid, materialName: "Beryl", unit: "SCU", quality: 100, quantityUnits: 4200, createdAt: "2" },
  { id: "savrilium-fixed", materialUuid: savrilium.ingredientUuid, materialName: "Savrilium", unit: "SCU", quality: null, quantityUnits: 7200, createdAt: "3" }
];
const allocation = model.allocateCardsDeterministically([card], batches);
const cardResult = allocation.cards[0];

function miningSnapshot(name) {
  const radar = name === "Beryl" ? 3540 : (name === "Savrilium" ? 3200 : 3185);
  const multiplierMax = name === "Beryl" ? 4 : 2;
  return {
    status: "AVAILABLE",
    radarSignature: radar,
    radarSignatureDisplay: `${radar}–${radar * multiplierMax} (1–${multiplierMax}× cluster)`,
    radarSignatureClusterRule: `INTEGER_MULTIPLIER_1_TO_${multiplierMax}`,
    radarSignatureClusterMultipliers: Array.from({ length: multiplierMax }, (_, index) => index + 1),
    radarSignatureClusterSignatures: Array.from({ length: multiplierMax }, (_, index) => radar * (index + 1)),
    radarSignatureSource: "Radar Signature.png",
    radarSignatureStatus: "VERIFIED",
    radarSignatureApiRaw: radar + 99,
    radarSignatureApiStatus: "API_RAW_NOT_USER_FACING",
    methods: ["SHIP_MINING"],
    rankingOrder: ["PRIMARY_RESOURCE_GATE", "GROUP_PROBABILITY_SPAWN_DESC", "RELATIVE_PROBABILITY_OCCURRENCE_DESC", "HIGH_Q_QUANTIZED_VALUES_DESC", "QUALITY_RANGE_DESC"],
    systems: ["Stanton", "Pyro", "Nyx"].map((system, systemIndex) => ({
      system,
      status: system === "Nyx" ? "NO_KNOWN_LOCATION" : "AVAILABLE",
      methods: system === "Nyx" ? [] : [
        {
          category: "NORMAL",
          rankingTier: 1,
          rankPosition: 1,
          recommendationLabel: "1. hely · Földi farmhely",
          method: "SHIP_MINING",
          tierDisplayLabel: `${system} Verified Farm`,
          tierMemberSummary: "2 bizonyított member",
          spawn: 40 - systemIndex,
          occurrence: 12 - systemIndex,
          qualityProfile: { ranges: [{ min: 500, max: 950 }], highQualityValues: [700, 950], reachableMinimum: 500, reachableMaximum: 950 },
          decision: "BEST_NORMAL",
          presentation: { groups: [{ evidence: { kind: "VERIFIED_API_PROVIDER_FAMILY", providerNames: [`${system} Provider`] }, rawLocationIds: ["RAW-ID-MUST-NOT-RENDER"] }] }
        },
        {
          category: "SPACE",
          rankingTier: 2,
          rankPosition: 2,
          recommendationLabel: "2. hely · Űrbeli farmhely",
          method: "SHIP_MINING",
          tierDisplayLabel: `${system} Lagrange F`,
          tierMemberSummary: "HUR-L2 · ARC-L1",
          spawn: 30 - systemIndex,
          occurrence: 8 - systemIndex,
          qualityProfile: { ranges: [{ min: 450, max: 900 }], highQualityValues: [700, 900], reachableMinimum: 450, reachableMaximum: 900 },
          decision: "RANKED_SPACE",
          presentation: { groups: [{ evidence: { kind: "EXACT_API_PROVIDER_RESOURCE_PARENT", providerNames: [`${system} Lagrange Provider`] } }] }
        }
      ]
    }))
  };
}

function refinerySnapshot(name) {
  if (name === "Stileron") {
    return { status: "MAPPING_UNRESOLVED", mapping: { status: "UNMAPPED", origin: "NONE", uexCommodityId: null, uexCommodityName: null }, systems: [], rankingField: "value_month" };
  }
  return {
    status: "AVAILABLE",
    mapping: { status: "MATCHED", origin: "AUTO_NORMALIZED_EXACT", uexCommodityId: name === "Beryl" ? "10" : "11", uexCommodityName: name },
    rankingField: "value_month",
    systems: [{ starSystemName: "Stanton", rankingField: "value_month", rankingValue: name === "Beryl" ? 8 : 6, tieCount: 2, terminals: [{ terminalName: "ARC-L1", valueMonth: name === "Beryl" ? 8 : 6 }, { terminalName: "HUR-L2", valueMonth: name === "Beryl" ? 8 : 6 }] }]
  };
}

cardResult.requirements.forEach((requirement) => {
  const sourceRequirement = card.requirements.find((candidate) => candidate.id === requirement.recipeSlotId);
  const name = sourceRequirement.materialName;
  requirement.commodityUuid = sourceRequirement.commodityUuid;
  requirement.materialIntelligence = {
    commodityUuid: sourceRequirement.commodityUuid,
    commodityName: name,
    material: {
      uuid: sourceRequirement.commodityUuid,
      canonicalName: name,
      slug: name === "Stileron" ? "stileron-ore" : (name === "Savrilium" ? "savrilium-ore" : "beryl"),
      webUrl: materialWikiUrls[name],
      apiWikiLink: model.resolveWikiApiDeepLink({ resourceType: "commodities", exactUrls: [materialWikiUrls[name]] }),
      publicWikiLink: model.resolvePublicWikiDeepLink({ targetUuid: sourceRequirement.commodityUuid, canonicalName: name }),
      categories: ["SHIP_MINING"],
      rarity: name === "Beryl" ? "Common" : "Rare",
      raritySourceField: "tier",
      instability: name === "Beryl" ? 0.2 : 0.8,
      resistance: name === "Beryl" ? 0.4 : 0.7,
      source: { dataSource: "Star Citizen Wiki API", gameVersion: version }
    },
    mining: miningSnapshot(name),
    refinery: refinerySnapshot(name),
    loadouts: []
  };
});

const snapshot = model.buildFinalCraftingCardViewModel({
  appName: "sPg Crafting List",
  generatedAt: "2026-08-25T08:00:00.000Z",
  scDataVersion: version,
  card,
  cardResult,
  blueprint,
  outputPresentation: { uuid: blueprint.outputUuid, slug: "js-300", webUrl: itemWikiUrl, size: 1, classLabel: "Military", typeLabel: "Power Plant", subTypeLabel: "Power", gradeLabel: "A" },
  trace: allocation.trace
});

assert.equal(snapshot.card.apiWikiLink.url, itemWikiUrl);
assert.equal(snapshot.card.publicWikiLink.publicWikiUrl, publicWikiUrls["JS-300"]);
assert.equal(snapshot.card.publicWikiLink.targetUuid, blueprint.outputUuid);
const itemDetail = model.resolveDetailModel(snapshot, "blueprint", blueprint.uuid);
assert.equal(itemDetail.status, "AVAILABLE");
assert.equal(itemDetail.title, "JS-300");
assert.equal(itemDetail.requirements.length, 3);
const itemMarkup = model.renderDetailMarkup(itemDetail);
for (const marker of ["Size", "Military", "Power Plant", "Grade", "Crafting Time", "Recipe Slots", "Blueprint UUID", "Stileron", "Beryl", "Savrilium"]) {
  assert.ok(itemMarkup.includes(marker), `Az item detailből hiányzik: ${marker}`);
}

for (const requirement of snapshot.requirements) {
  const id = requirement.commodityUuid || requirement.materialUuid;
  const materialDetail = model.resolveDetailModel(snapshot, "material", id);
  assert.equal(materialDetail.status, "AVAILABLE", `${requirement.materialName} material detail`);
  assert.equal(materialDetail.apiWikiLink.url, materialWikiUrls[requirement.materialName]);
  if (requirement.materialName === "Beryl") {
    assert.equal(materialDetail.publicWikiLink.publicWikiUrl, publicWikiUrls.Beryl);
  } else {
    assert.equal(materialDetail.publicWikiLink.resolutionStatus, "NO_PROVEN_PUBLIC_WIKI_URL");
    assert.equal(materialDetail.publicWikiLink.publicWikiUrl, null);
  }
  const materialMarkup = model.renderDetailMarkup(materialDetail);
  for (const marker of ["Mining category", "Curated Radar", "Quality tartomány", "Rarity", "Instability", "Resistance", "Top-3 farmhely", "UEX Refinery rendszerenként"]) {
    assert.ok(materialMarkup.includes(marker), `${requirement.materialName} material detailből hiányzik: ${marker}`);
  }
  const radarMarkup = model.renderDetailMarkup(model.resolveDetailModel(snapshot, "radar", id));
  assert.ok(radarMarkup.includes("Radar Signature.png"));
  assert.ok(radarMarkup.includes("API_RAW_NOT_USER_FACING"));
  const miningMarkup = model.renderDetailMarkup(model.resolveDetailModel(snapshot, "mining", id));
  assert.ok(miningMarkup.includes("Stanton"));
  assert.ok(miningMarkup.includes("Pyro"));
  assert.ok(miningMarkup.includes("Nyx"));
  assert.ok(miningMarkup.includes("Földi / NORMAL"));
  assert.ok(miningMarkup.includes("Űrbeli / SPACE"));
  assert.ok(miningMarkup.includes("spawn → occurrence → Quality"));
  assert.ok(!miningMarkup.includes("RAW-ID-MUST-NOT-RENDER"), "A raw location ID megjelent a normál detail UI-ban.");
  const refineryMarkup = model.renderDetailMarkup(model.resolveDetailModel(snapshot, "refinery", id));
  if (requirement.materialName === "Stileron") {
    assert.ok(refineryMarkup.includes("Nincs biztonságos UEX refinery adat"));
  } else {
    assert.ok(refineryMarkup.includes("value_month"));
    assert.ok(refineryMarkup.includes("2 azonos legjobb"));
  }
}

const unmappedRadarSnapshot = JSON.parse(JSON.stringify(snapshot));
unmappedRadarSnapshot.requirements[0].mining.radarSignature = null;
unmappedRadarSnapshot.requirements[0].mining.radarSignatureDisplay = "Nincs adat";
unmappedRadarSnapshot.requirements[0].mining.radarSignatureStatus = "UNMAPPED";
unmappedRadarSnapshot.requirements[0].mining.radarSignatureClusterSignatures = [];
assert.ok(model.renderDetailMarkup(model.resolveDetailModel(unmappedRadarSnapshot, "radar", stileron.commodityUuid)).includes("Nincs adat"));

assert.equal(model.resolveDetailModel(snapshot, "material", "missing-target").status, "INVALID_TARGET");
assert.ok(model.renderDetailMarkup(model.resolveDetailModel(snapshot, "invalid-kind", "x")).includes("részlet nem nyitható"));
const oldCacheWiki = model.resolveWikiApiDeepLink({ resourceType: "commodities", slug: "beryl", slugVerifiedByApi: true, gameVersion: version });
assert.equal(oldCacheWiki.origin, "AUDITED_API_SLUG_CANONICAL");
assert.equal(model.resolveWikiApiDeepLink({ resourceType: "commodities" }).origin, "NO_PROVEN_WIKI_API_URL");

const js300PublicAction = model.renderPublicWikiAction(itemDetail.publicWikiLink);
assert.equal(js300PublicAction, "", "A public Wiki audit nem renderelhet user-facing műveletet C009-től.");
const apiAction = model.renderWikiApiAction(itemDetail.apiWikiLink);
assert.match(apiAction, />API adatlap</);
assert.match(apiAction, /href="https:\/\/api\.star-citizen\.wiki\/items\/js-300\?/);
assert.doesNotMatch(apiAction, />Megnyitás a Star Citizen Wiki-ben</);
assert.equal(model.renderPublicWikiAction(model.resolveWikiApiDeepLink({ resourceType: "items", exactUrls: [itemWikiUrl] })), "");
assert.equal(model.renderPublicWikiAction(model.resolvePublicWikiDeepLink({ canonicalName: "Stileron" })), "");

const targets = JSON.parse(JSON.stringify(model.collectDetailTargets(snapshot)));
assert.equal(targets.length, 13);
const exported = model.renderStandalone(snapshot, cssSource);
for (const marker of [
  'id="spg-standalone-detail"', 'id="spg-standalone-detail-back"', 'data-spg-detail-panel="true"',
  'data-detail-kind="blueprint"', 'data-detail-kind="material"', 'data-detail-kind="radar"',
  'data-detail-kind="mining"', 'data-detail-kind="refinery"', 'target="_blank" rel="noopener noreferrer"',
  "history.pushState", "window.addEventListener(\"popstate\"", "window.addEventListener(\"hashchange\"",
  "spgDetailDepth", "history.go(-depth)",
  "Nincs biztonságos UEX refinery adat", "API_RAW_NOT_USER_FACING", itemWikiUrl,
  "API adatlap"
]) {
  assert.ok(exported.includes(marker), `A standalone detail exportból hiányzik: ${marker}`);
}
assert.equal((exported.match(/data-spg-detail-panel="true"/g) || []).length, 13);
assert.doesNotMatch(exported, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);
assert.doesNotMatch(exported, /fetch\s*\(/i);
assert.ok(exported.includes('type="application/json" id="spg-export-snapshot"'));
assert.ok(exported.includes("offline detail a helyi export snapshotból"));
assert.equal((exported.match(/Megnyitás a Star Citizen Wiki-ben/g) || []).length, 0, "Public Wiki gomb maradt a user-facing standalone nézetben.");
assert.doesNotMatch(exported, /href="https:\/\/star-citizen\.wiki\//, "Public Wiki link maradt a user-facing standalone nézetben.");
assert.doesNotMatch(exported, /href="https:\/\/api\.star-citizen\.wiki[^"]*"[^>]*>Megnyitás a Star Citizen Wiki-ben</);
assert.doesNotMatch(exported, /href="https:\/\/star-citizen\.wiki\/(?:Stileron|Savrilium)/);
if (artifactPath) {
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, exported, "utf8");
}

for (const marker of [
  'id="spgDetailView"', 'id="spgDetailBackButton"', 'spg:detail-request',
  "var c008DetailController", "function resolvePublicWikiDeepLink", "function resolveWikiApiDeepLink", "function resolveC008DetailModel",
  "history.pushState", "spgDetailDepth", "history.go(-depth)", "popstate", "hashchange", "c008DetailController.restore()"
]) {
  assert.ok(htmlSource.includes(marker), `A fő alkalmazás C008 route/controller marker hiányzik: ${marker}`);
}

console.log("V003_C008_DETAIL_VIEW_TEST_PASS");
console.log(JSON.stringify({
  detailController: "c008DetailController",
  detailTypes: JSON.parse(JSON.stringify(model.detailTypes)),
  publicWikiResolver: "resolvePublicWikiDeepLink",
  apiWikiResolver: "resolveWikiApiDeepLink",
  js300PublicWiki: snapshot.card.publicWikiLink,
  js300ApiWiki: snapshot.card.apiWikiLink,
  detailTargets: targets.length,
  materials: snapshot.requirements.map((requirement) => requirement.materialName),
  stileronUex: "MAPPING_UNRESOLVED_PASS",
  invalidTarget: "PASS",
  oldCacheSlugFallback: "PASS",
  standaloneBytes: Buffer.byteLength(exported),
  standaloneArtifact: artifactPath ? path.relative(projectDirectory, artifactPath) : null,
  standaloneExternalRuntimeResources: 0
}, null, 2));
