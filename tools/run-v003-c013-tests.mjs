import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertSingleFileRuntimeMarkup, extractEmbeddedApplicationCss } from "./embedded-css-utils.mjs";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const baselineCommit = "e519b0889a65b70e8ae6d8be6d869b52e206eb99";
const candidateRelativePath = "test-artifacts/V003-C013/release-candidate/sPg Crafting List.html";
const candidatePath = path.join(projectDirectory, ...candidateRelativePath.split("/"));
const baselineStandalonePath = path.join(projectDirectory, "test-artifacts", "V003-C013", "standalone", "sPg Crafting List - JS-300 baseline.html");
const targetStandalonePath = path.join(projectDirectory, "test-artifacts", "V003-C013", "standalone", "sPg Crafting List - JS-300 Q900.html");

const git = (arguments_) => {
  const result = spawnSync("git", arguments_, { cwd: projectDirectory, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} sikertelen: ${String(result.stderr || "")}`);
  return result.stdout;
};
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const baselineBytes = git(["show", `${baselineCommit}:sPg Crafting List.html`]);
const candidateBytes = fs.readFileSync(candidatePath);
assert.deepEqual(candidateBytes, baselineBytes, "A C013 candidate nem byte-azonos a lezárt C012.4 baseline alkalmazással.");
const candidateHtml = candidateBytes.toString("utf8");
const candidateCss = extractEmbeddedApplicationCss(candidateHtml);
assertSingleFileRuntimeMarkup(candidateHtml);
assert.ok(candidateCss.length > 100000, "A candidate beágyazott CSS-e hiányos.");
assert.match(candidateHtml, /<script(?:\s[^>]*)?>[\s\S]*?<\/script>/i, "A candidate beágyazott JavaScriptje hiányzik.");
assert.doesNotMatch(candidateHtml, /<(?:link|script)[^>]+(?:href|src)=["'](?:\.\.?\/|file:|Info\/)/i, "A candidate helyi runtime sidecart kér.");

const versionMetadata = JSON.parse(fs.readFileSync(path.join(projectDirectory, "VERSION.json"), "utf8").replace(/^\uFEFF/, ""));
const activeScVersion = versionMetadata.v003DevelopmentGate?.activeVersionConsistency?.activeScVersion;
assert.ok(/^\d+\.\d+\.\d+-LIVE\.\d+$/.test(activeScVersion || ""), "Az aktív SC-verzió nem vezethető le a lezárt cycle metadata-ból.");

const block = (name) => {
  const match = candidateHtml.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A candidate ${name} modellblokkja hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-30T08:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("M4_COMBINED_BACKUP_MODEL")}
${block("MATERIAL_NAMING_MODEL")}
${block("MATERIAL_COLOR_MODEL")}
${block("C0122_VERSION_CONSISTENCY_MODEL")}
${block("M6_STANDALONE_EXPORT_MODEL")}
globalThis.__C013__ = {
  normalizeBlueprint,
  allocateCardsDeterministically,
  buildCombinedMaterials,
  buildStandaloneSnapshot: m6BuildStandaloneSnapshot,
  renderStandaloneHtml: m6RenderStandaloneHtml,
  modes: MATERIAL_QUALITY_PLAN_MODES
};`, context, { filename: "spg-v003-c013-model.js" });
const model = context.__C013__;

const rawBlueprint = JSON.parse(fs.readFileSync(path.join(projectDirectory, "tests", "fixtures", "js-300-blueprint.json"), "utf8"));
rawBlueprint.game_version = activeScVersion;
rawBlueprint.output_item_web_url = `https://api.star-citizen.wiki/items/js-300?version=${activeScVersion}`;
rawBlueprint.web_url = `https://api.star-citizen.wiki/blueprints/js-300?version=${activeScVersion}`;
const blueprint = model.normalizeBlueprint(rawBlueprint, {
  gameVersion: activeScVersion,
  dataSource: "C013_FIXTURE",
  source: "JS-300 C013",
  fetchedAt: "2026-08-30T08:00:00.000Z",
  origin: "TEST_FIXTURE"
});
const slugs = { Stileron: "stileron-ore", Beryl: "beryl-raw", Savrilium: "savrilium-ore" };
const card = {
  id: "c013-js300",
  order: 0,
  active: true,
  quantity: 2,
  blueprintUuid: blueprint.uuid,
  outputUuid: blueprint.outputUuid,
  outputName: blueprint.outputName,
  outputType: blueprint.outputType,
  outputTypeLabel: blueprint.outputTypeLabel,
  outputWebUrl: rawBlueprint.output_item_web_url,
  blueprintWebUrl: rawBlueprint.web_url,
  craftTimeSeconds: blueprint.craftTimeSeconds,
  gameVersion: activeScVersion,
  requirements: blueprint.recipeSlots.map((slot) => ({
    id: slot.id,
    recipeSlotName: slot.recipeSlotName,
    ingredientUuid: slot.ingredientUuid,
    commodityUuid: slot.ingredientUuid,
    materialName: slot.materialName,
    materialWebUrl: `https://api.star-citizen.wiki/commodities/${slugs[slot.materialName]}?version=${activeScVersion}`,
    requiredQuantityUnits: slot.requiredQuantityUnits,
    unit: slot.unit,
    qualityCapability: slot.qualityCapability,
    affectedStats: slot.affectedStats
  }))
};
const createdAt = (index) => `2026-08-30T08:00:0${index}.000Z`;
const batches = card.requirements.flatMap((requirement, requirementIndex) => {
  const qualities = requirement.materialName === "Stileron" ? [517, 860, 930] : [517];
  return qualities.map((quality, qualityIndex) => ({
    id: `${requirement.materialName.toLowerCase()}-${quality}`,
    materialUuid: requirement.ingredientUuid,
    materialName: requirement.materialName,
    quality,
    quantityUnits: 100000,
    unit: requirement.unit,
    createdAt: createdAt(requirementIndex + qualityIndex)
  }));
});
const provenance = (name) => ({
  gameVersion: activeScVersion,
  dataSource: "C013_FIXTURE",
  source: name,
  fetchedAt: "2026-08-30T08:00:00.000Z",
  origin: "TEST_FIXTURE"
});
const intelligence = (requirement) => ({
  scVersion: activeScVersion,
  material: {
    uuid: requirement.ingredientUuid,
    canonicalName: requirement.materialName,
    slug: slugs[requirement.materialName],
    webUrl: requirement.materialWebUrl,
    apiWikiLink: { url: requirement.materialWebUrl },
    categories: ["SHIP_MINING"],
    source: provenance(`${requirement.materialName} material`)
  },
  mining: {
    status: "AVAILABLE",
    methods: ["SHIP_MINING"],
    radarSignature: 5,
    radarSignatureDisplay: "5",
    systems: [{
      system: "Stanton",
      status: "AVAILABLE",
      methods: [{
        method: "SHIP_MINING",
        recommendationLabel: "Lagrange F",
        tierDisplayLabel: "HUR-L2 · ARC-L1",
        tierMemberSummary: "Azonos legjobb fixture helyek",
        locationLabel: "HUR-L2 · ARC-L1",
        spawn: 18,
        occurrence: 12,
        qualityProfile: { maximum: 930 }
      }]
    }],
    decisions: [],
    source: provenance(`${requirement.materialName} mining`)
  },
  refinery: {
    status: "AVAILABLE",
    systems: [{
      starSystemName: "Stanton",
      rankingValue: 4,
      tieCount: 1,
      terminals: [{ terminalName: "ARC-L1 Wide Forest Station" }]
    }]
  },
  loadouts: [{
    id: `${requirement.materialName}-loadout`,
    name: "C013 fixture loadout",
    default: true,
    vehicle: { name: "MOLE" },
    stations: [{ head: { name: "Helix II" }, modules: [{ name: "Rieger-C3" }] }],
    gadgets: [{ name: "Okunis" }]
  }]
});

const renderCase = (label, materialQualityPlans, outputPath) => {
  const allocation = model.allocateCardsDeterministically([card], batches, materialQualityPlans);
  const result = allocation.cards[0];
  for (const requirementResult of result.requirements) {
    const sourceRequirement = card.requirements.find((entry) => entry.id === requirementResult.recipeSlotId);
    requirementResult.materialIntelligence = intelligence(sourceRequirement);
  }
  const snapshot = model.buildStandaloneSnapshot({
    appName: "sPg Crafting List",
    generatedAt: "2026-08-30T08:00:00.000Z",
    scDataVersion: activeScVersion,
    card,
    cardResult: result,
    blueprint,
    outputPresentation: {
      uuid: blueprint.outputUuid,
      name: blueprint.outputName,
      typeLabel: blueprint.outputTypeLabel,
      slug: "js-300",
      webUrl: rawBlueprint.output_item_web_url,
      provenance: provenance("JS-300 output")
    },
    trace: allocation.trace,
    materialQualityPlans
  });
  const html = model.renderStandaloneHtml(snapshot, candidateCss);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, "utf8");
  assert.ok(Buffer.byteLength(html, "utf8") > 100000, `${label}: a standalone túl kicsi.`);
  assert.doesNotMatch(html, /<(?:link|script|img|source)[^>]+(?:href|src)=["'](?:https?:|\.\.?\/|file:)/i, `${label}: külső runtime resource maradt.`);
  assert.doesNotMatch(html, /fetch\s*\(/i, `${label}: runtime fetch maradt.`);
  const embedded = html.match(/<script type="application\/json" id="spg-export-snapshot">([\s\S]*?)<\/script>/);
  assert.ok(embedded, `${label}: embedded snapshot hiányzik.`);
  const parsed = JSON.parse(embedded[1]);
  assert.equal(parsed.scDataVersion, activeScVersion);
  assert.equal(new URL(parsed.card.apiWikiLink.url).searchParams.get("version"), activeScVersion);
  for (const requirement of parsed.requirements) {
    assert.equal(requirement.materialDetails.source.gameVersion, activeScVersion);
    assert.equal(requirement.mining.source.gameVersion, activeScVersion);
    assert.equal(new URL(requirement.materialDetails.apiWikiLink.url).searchParams.get("version"), activeScVersion);
  }
  assert.ok((html.match(/data-detail-kind=/g) || []).length >= 13, `${label}: a detail műveletek hiányosak.`);
  return { allocation, snapshot: parsed, html, bytes: Buffer.byteLength(html, "utf8"), sha256: sha256(html) };
};

const baseline = renderCase("JS-300 baseline", {}, baselineStandalonePath);
const stileron = card.requirements.find((requirement) => requirement.materialName === "Stileron");
const targetPlans = { [stileron.ingredientUuid]: { mode: model.modes.TARGET_Q, targetQuality: 900 } };
const target = renderCase("JS-300 Q900", targetPlans, targetStandalonePath);
const targetStileron = target.snapshot.requirements.find((requirement) => requirement.materialName === "Stileron");
assert.equal(targetStileron.effectiveQualityLabel, "Q900+");
assert.deepEqual(targetStileron.allocatedBatches.map((batch) => batch.quality), [930], "A Q900 target nem a legalacsonyabb megfelelő batchből foglalt.");
assert.equal(baseline.snapshot.requirements.find((requirement) => requirement.materialName === "Stileron").effectiveQualityLabel, "Q500+");
assert.deepEqual(Array.from(baseline.snapshot.requirements, (requirement) => requirement.effectiveQualityLabel), ["Q500+", "Bármely Q", "Bármely Q"]);
assert.equal(model.buildCombinedMaterials(target.allocation, [card], batches).length, 3);

const result = {
  cycle: "V003-C013",
  baselineCommit,
  candidate: {
    path: candidateRelativePath,
    bytes: candidateBytes.length,
    sha256: sha256(candidateBytes),
    sourceByteIdentical: true,
    singleFileRuntime: true,
    localRuntimeSidecars: 0
  },
  activeScVersion,
  standalone: {
    baseline: { path: path.relative(projectDirectory, baselineStandalonePath).replaceAll("\\", "/"), bytes: baseline.bytes, sha256: baseline.sha256 },
    targetQ900: { path: path.relative(projectDirectory, targetStandalonePath).replaceAll("\\", "/"), bytes: target.bytes, sha256: target.sha256 },
    embeddedCss: true,
    embeddedJavaScript: true,
    embeddedSnapshot: true,
    runtimeFetch: 0,
    localRuntimeSidecars: 0,
    details: "PASS"
  },
  qualityPlan: {
    baselineLabels: Array.from(baseline.snapshot.requirements, (requirement) => requirement.effectiveQualityLabel),
    targetQ900AllocatedQuality: targetStileron.allocatedBatches.map((batch) => batch.quality),
    combinedMaterialCount: 3
  }
};
console.log("V003_C013_TARGET_TEST_PASS");
console.log(JSON.stringify(result, null, 2));
