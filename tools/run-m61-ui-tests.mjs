import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const css = fs.readFileSync(path.join(projectDirectory, "Info", "style.css"), "utf8");

function block(name) {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
}

const context = vm.createContext({ console });
vm.runInContext(`${block("M61_UI_COMPLETENESS_MODEL")}
globalThis.__M61__ = {
  navigation: M61_REQUIRED_NAVIGATION,
  filter: m61FilterMaterialIndex,
  defaultLoadout: m61DefaultLoadout,
  metric: m61ApiMetric
};`, context, { filename: "spg-m61-ui-model.js" });
const m61 = context.__M61__;

const expectedNavigation = [
  ["craftingListNav", "Crafting List"],
  ["blueprintBrowserNav", "Blueprint Browser"],
  ["myMaterialsNav", "My Materials"],
  ["materialDatabaseNav", "Material Database"],
  ["miningLoadoutsNav", "Mining Loadouts"],
  ["refineryNav", "UEX Refinery"],
  ["combinedMaterialsNav", "Combined Materials"],
  ["dataSettingsNav", "Data / Settings"]
];
const navMarkup = html.match(/<nav class="spg-module-nav"[\s\S]*?<\/nav>/)?.[0] || "";
const navButtons = Array.from(navMarkup.matchAll(/<button\s+([^>]*)>([\s\S]*?)<\/button>/g)).map((match) => ({
  attributes: match[1],
  label: match[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim(),
  id: match[1].match(/\bid="([^"]+)"/)?.[1] || null
}));

// 1-4. Complete enabled navigation and real targets.
assert.equal(navButtons.length, expectedNavigation.length);
assert.deepEqual(navButtons.map((button) => [button.id, button.label]), expectedNavigation);
assert.ok(navButtons.every((button) => !/\bdisabled\b/.test(button.attributes)));
assert.equal(m61.navigation.length, expectedNavigation.length);
m61.navigation.forEach((entry) => {
  assert.ok(html.includes(`id="${entry.targetId}"`), `Hiányzó cél: ${entry.targetId}`);
  if (entry.focusId) assert.ok(html.includes(`id="${entry.focusId}"`), `Hiányzó fókuszcél: ${entry.focusId}`);
});
assert.ok(html.includes("M61_REQUIRED_NAVIGATION.forEach"));
assert.ok(html.includes("document.body.dataset.activeModule = navId"));

// 5-8. Material Database renders the existing commodity index with search and exact categories.
const commodities = [
  { uuid: "ship", name: "Agricium (Ore)", slug: "agricium-ore", kind: "mineable", categories: ["SHIP_MINING"], radarSignature: 4000 },
  { uuid: "vehicle", name: "Beradom", slug: "beradom", kind: "mineable", categories: ["VEHICLE_MINING"], radarSignature: 4000 },
  { uuid: "fps", name: "Aphorite", slug: "aphorite", kind: "mineable", categories: ["FPS_MINING"], radarSignature: null },
  { uuid: "harvest", name: "Bluemoon Fungus", slug: "bluemoon-fungus", kind: "harvestable", categories: ["HARVESTABLE"], radarSignature: 2000 }
];
assert.equal(m61.filter(commodities, "agricium", "").length, 1);
assert.equal(m61.filter(commodities, "aphorite", "FPS_MINING")[0].uuid, "fps");
assert.equal(m61.filter(commodities, "", "VEHICLE_MINING")[0].uuid, "vehicle");
assert.equal(m61.filter(commodities, "", "HARVESTABLE")[0].uuid, "harvest");
for (const marker of ["materialDatabaseSearch", "materialDatabaseCategory", "materialDatabaseResults", "materialDatabaseDetail"]) {
  assert.ok(html.includes(`id="${marker}"`), `Material Database UI hiányzik: ${marker}`);
}

// 9. Detail view shows API metrics and reuses the existing ranking projections.
for (const marker of ["Radar Signature", "Rarity", "Instability", "Resistance", "mergeBestMiningLocationsBySystem(commodity.locations", "state.uexRefineryRecommendations.get(commodity.uuid)"]) {
  assert.ok(html.includes(marker), `Material részletmarker hiányzik: ${marker}`);
}
assert.equal(m61.metric(null), "Nincs adat");
assert.equal(m61.metric(undefined), "Nincs adat");
assert.equal(m61.metric(0), "0");

// 10-12. The separate navigation exposes the existing loadout editor and User Data model.
for (const marker of ["miningLoadoutsSection", "miningLoadoutForm", "createMiningLoadoutDraft", "persistMiningLoadouts", "setDefaultMiningLoadout", "reconcileMiningLoadout", "MISSING_CURRENT_GAME_DATA"]) {
  assert.ok(html.includes(marker), `Loadout marker hiányzik: ${marker}`);
}
const defaultLoadout = m61.defaultLoadout([
  { id: "other", materialUuid: "x", isDefault: true },
  { id: "first", materialUuid: "ship", isDefault: false },
  { id: "default", materialUuid: "ship", isDefault: true }
], "ship");
assert.equal(defaultLoadout.id, "default");
assert.equal((html.match(/userLoadouts: "id"/g) || []).length, 1, "Párhuzamos loadout store jelent meg.");

// 13. Existing Game Data/User Data boundary remains the persistence path.
for (const marker of ["userDataRepository.fingerprint()", "miningLoadoutFingerprint()", "A Mining Game Data sync módosította a User Data-t.", "renderMaterialDatabaseDefaultLoadout(state.selectedMiningCommodity)"]) {
  assert.ok(html.includes(marker), `User Data határmarker hiányzik: ${marker}`);
}

// 14. Static UI gate and responsive CSS are present; real console capture remains a browser check.
for (const marker of ["m61AuditNavigationDom", "runM61UiRegression", "M6.1 V1 UI completeness", ".spg-material-database-layout", ".spg-material-database-results"]) {
  assert.ok((html + css).includes(marker), `M6.1 regressziós marker hiányzik: ${marker}`);
}
assert.match(css, /@media \(max-width: 720px\)[\s\S]*?\.spg-material-database-layout[\s\S]*?grid-template-columns:\s*1fr/);

console.log("M61_UI_COMPLETENESS_TEST_PASS");
console.log(JSON.stringify({
  mandatoryCases: 14,
  navigation: expectedNavigation.map((entry) => entry[1]),
  materialCategories: ["All", "Ship Mining", "Vehicle Mining", "FPS Mining", "Harvestable"],
  usesExistingMiningRanking: true,
  usesExistingRefineryRanking: true,
  usesExistingLoadoutStore: true
}, null, 2));
