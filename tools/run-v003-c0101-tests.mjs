import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const standaloneArgument = process.argv.find((argument) => argument.startsWith("--standalone="));
const releaseCandidateMode = process.env.SPG_V004_RELEASE_CANDIDATE_MODE === "1";
if (releaseCandidateMode) {
  assert.ok(standaloneArgument, "Release-candidate módban kötelező az explicit --standalone binding.");
  assert.ok(standaloneArgument.slice("--standalone=".length).trim(), "Release-candidate módban a --standalone útvonal nem lehet üres.");
}
const standalonePath = standaloneArgument
  ? path.resolve(projectDirectory, standaloneArgument.slice("--standalone=".length))
  : path.join(projectDirectory, "test-artifacts", "V003-C010.1", "standalone-js-300-final-card.html");
const appHtml = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const standalone = fs.readFileSync(standalonePath, "utf8");
const modelMatch = appHtml.match(/\/\* C010_COMPACT_PRESENTATION_START \*\/([\s\S]*?)\/\* C010_COMPACT_PRESENTATION_END \*\//);
assert.ok(modelMatch, "A C010.1 compact presentation modellblokk hiányzik.");

const context = vm.createContext({ console });
vm.runInContext(`${modelMatch[1]}
globalThis.__C0101__ = {
  c010MiningPresentationGroups,
  c010CompactMiningLabel,
  c010MiningSummary,
  c010FriendlyRefineryLabel,
  c010BestRefineryTerminals,
  c010CompactRefinerySystem,
  c010RefinerySummary
};`, context, { filename: "spg-v003-c0101-model.js" });
const model = context.__C0101__;

assert.equal(model.c010FriendlyRefineryLabel("Refinement Processing - MIC-L5"), "MIC-L5");
assert.equal(model.c010FriendlyRefineryLabel("Refinement Center - Levski"), "Levski");
assert.equal(model.c010FriendlyRefineryLabel("Refinement Processing - Pyro Gateway (Stanton)"), "Pyro Gateway");

const pyroFamily = {
  rankingTier: 1,
  environment: "SPACE",
  presentation: {
    groups: [{ key: "PYRO", label: "Pyro Deep Space Asteroids", rawLocationNames: ["Akiro Cluster", "RAB-01", "RMB-01"] }]
  },
  tierDisplayLabel: "Akiro Cluster · RAB-01 · RMB-01"
};
assert.equal(model.c010CompactMiningLabel([pyroFamily]), "Pyro Deep Space Asteroids");

const separateTies = {
  rankingTier: 1,
  environment: "NORMAL",
  presentation: {
    groups: [
      { key: "MONOX", label: "Monox" },
      { key: "PYRO-I", label: "Pyro I" },
      { key: "BLOOM", label: "Bloom" }
    ]
  },
  tierDisplayLabel: "Bloom · Monox · Pyro I · +2 további"
};
assert.equal(model.c010CompactMiningLabel([separateTies]), "Bloom (+2 azonos legjobb)");
assert.doesNotMatch(model.c010CompactMiningLabel([separateTies]), /további/);

const miningRows = model.c010MiningSummary({
  systems: [{
    system: "Pyro System",
    status: "AVAILABLE",
    methods: [separateTies, pyroFamily, {
      rankingTier: 2,
      presentation: { groups: [{ key: "LOWER", label: "Lower-ranked location" }] }
    }]
  }]
});
const pyroRow = miningRows.find((row) => row.system === "Pyro");
assert.ok(pyroRow, "A Pyro mining sor hiányzik.");
assert.equal(pyroRow.label, "Bloom (+2 azonos legjobb)");
assert.doesNotMatch(pyroRow.label, /Pyro Deep Space|Lower-ranked|további/);

const mixedRefinery = {
  starSystemName: "Stanton System",
  rankingValue: 8,
  terminals: [
    { terminalId: 3, terminalName: "Refinement Processing - Pyro Gateway (Stanton)", valueMonth: 7 },
    { terminalId: 2, terminalName: "Refinement Processing - HUR-L2", valueMonth: 8 },
    { terminalId: 1, terminalName: "Refinement Center - ARC-L1", valueMonth: 8 }
  ]
};
const compactRefinery = model.c010CompactRefinerySystem(mixedRefinery);
assert.equal(compactRefinery.label, "ARC-L1 (+1 azonos legjobb)");
assert.equal(compactRefinery.tieCount, 2);
assert.deepEqual(JSON.parse(JSON.stringify(compactRefinery.rawTerminalNames)), ["Refinement Center - ARC-L1", "Refinement Processing - HUR-L2"]);
assert.doesNotMatch(compactRefinery.label, /Pyro Gateway|Refinement|\//);

const refineryRows = model.c010RefinerySummary({ status: "AVAILABLE", systems: [mixedRefinery] });
const stantonRefinery = refineryRows.rows.find((row) => row.system === "Stanton");
assert.equal(stantonRefinery.label, "ARC-L1 (+1 azonos legjobb)");
assert.equal(stantonRefinery.tieCount, 2);

const mainMatch = standalone.match(/<article class="spg-c010-final-card spg-c010-standalone-card"[\s\S]*?<\/article>/);
assert.ok(mainMatch, "A C010.1 standalone Final Card hiányzik.");
const main = mainMatch[0];
assert.match(main, /ARC-L1 \(\+1 azonos legjobb\)/);
assert.doesNotMatch(main, /Refinement (?:Processing|Center) -/);
assert.doesNotMatch(main, /\+\d+ további/);
assert.doesNotMatch(standalone, /<(?:link|script|img|source)[^>]+(?:href|src)=["']https?:/i);
assert.doesNotMatch(standalone, /fetch\s*\(/i);

console.log("V003_C0101_COMPACT_PRESENTATION_TEST_PASS");
console.log(JSON.stringify({
  miningSingleFamily: "Pyro Deep Space Asteroids",
  miningSeparateTie: "Bloom (+2 azonos legjobb)",
  refineryTieCount: compactRefinery.tieCount,
  refineryCompactLabel: compactRefinery.label,
  lowerRankedRefineryExcluded: true,
  standaloneExternalRuntimeResources: 0
}, null, 2));
