import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const html = fs.readFileSync(path.join(projectDirectory, "sPg Crafting List.html"), "utf8");
const block = (name) => {
  const match = html.match(new RegExp(`/\\* ${name}_START \\*/([\\s\\S]*?)/\\* ${name}_END \\*/`));
  assert.ok(match, `A ${name} modellblokk hiányzik.`);
  return match[1];
};
const context = vm.createContext({
  console,
  nowIso: () => "2026-08-22T12:00:00.000Z",
  toScuUnits: (value) => Math.round(Number(value) * 10000)
});
vm.runInContext(`${block("M1_PURE_MODEL")}
${block("M2_ALLOCATION_ENGINE")}
${block("M4_COMBINED_BACKUP_MODEL")}
globalThis.__M4__ = {
  rules: M2_QUALITY_RULES,
  allocateCardsDeterministically,
  buildCombinedMaterials,
  buildM4BackupEnvelope,
  validateAndMigrateM4Backup,
  buildM4ImportPreview,
  simulateM4UserDataImport,
  fingerprintUserDataPayload,
  normalizeM4UserData
};`, context, { filename: "spg-m4-model.js" });

const m4 = context.__M4__;
const clone = (value) => JSON.parse(JSON.stringify(value));
const materialUuid = "material-shared";
const requirement = (id, name, affectedStats, units = 8000) => ({
  id,
  aspectIndex: Number(id.split("-").pop()) || 0,
  ingredientUuid: materialUuid,
  materialName: "Shared Material",
  recipeSlotName: name,
  requiredQuantityUnits: units,
  unit: "SCU",
  qualityCapability: "DYNAMIC",
  affectedStats
});
const card = (id, order, requirements, slotStrategies = {}) => ({
  id,
  order,
  active: true,
  collapsed: false,
  quantity: 1,
  blueprintUuid: `blueprint-${id}`,
  outputName: `Blueprint ${id}`,
  requirements: clone(requirements),
  slotStrategies: clone(slotStrategies)
});
const batch = (id, quality, quantityUnits = 8000) => ({
  id,
  materialUuid,
  materialName: "Shared Material",
  quality,
  quantityUnits,
  unit: "SCU",
  createdAt: "2026-08-22T12:00:00.000Z"
});
const functional = requirement("slot-1", "Functional", [{ key: "power", label: "Power" }]);
const hp = requirement("slot-2", "Integrity", [{ key: "health", label: "Health" }]);

// 1. Multiple Crafting Cards using the same material produce one display group.
const sameMaterialCards = [card("a", 0, [functional]), card("b", 1, [functional])];
const scarceBatches = [batch("q930", 930, 12000)];
const sameMaterialAllocation = m4.allocateCardsDeterministically(sameMaterialCards, scarceBatches);
const sameMaterialCombined = m4.buildCombinedMaterials(sameMaterialAllocation, sameMaterialCards, scarceBatches);
assert.equal(sameMaterialCombined.length, 1);
assert.equal(sameMaterialCombined[0].requiredUnits, 16000);
assert.equal(sameMaterialCombined[0].usages.length, 2);

// 2. The same material keeps independent HP and functional slot rules.
const dualCard = card("dual", 0, [hp, functional]);
const dualBatches = [batch("q517", 517), batch("q950", 950)];
const dualAllocation = m4.allocateCardsDeterministically([dualCard], dualBatches);
const dualCombined = m4.buildCombinedMaterials(dualAllocation, [dualCard], dualBatches);
assert.equal(dualCombined[0].usages.length, 2);
assert.deepEqual(Array.from(dualCombined[0].usages, (usage) => usage.qualityRule).sort(), [m4.rules.HIGHEST_Q, m4.rules.HP_MIN_500].sort());
assert.equal(dualCombined[0].usages.find((usage) => usage.qualityRule === m4.rules.HP_MIN_500).allocatedBatches[0].quality, 517);
assert.equal(dualCombined[0].usages.find((usage) => usage.qualityRule === m4.rules.HIGHEST_Q).allocatedBatches[0].quality, 950);

// 3. Combined values are an exact projection of the shared Allocation Engine result.
const engineRequired = sameMaterialAllocation.cards.flatMap((item) => Array.from(item.requirements)).reduce((sum, item) => sum + item.requiredUnits, 0);
const engineReserved = sameMaterialAllocation.batchUsage.reduce((sum, item) => sum + item.reservedUnits, 0);
assert.equal(sameMaterialCombined.reduce((sum, item) => sum + item.requiredUnits, 0), engineRequired);
assert.equal(sameMaterialCombined.reduce((sum, item) => sum + item.reservedUnits, 0), engineReserved);

// 4. Card reorder deterministically changes per-card aggregate reservations.
const reversedCards = [card("a", 1, [functional]), card("b", 0, [functional])];
const reversedAllocation = m4.allocateCardsDeterministically(reversedCards, scarceBatches);
const reversedCombined = m4.buildCombinedMaterials(reversedAllocation, reversedCards, scarceBatches);
const reservedByCard = (combined) => Object.fromEntries(combined[0].usages.map((usage) => [usage.cardId, usage.reservedUnits]));
assert.deepEqual(reservedByCard(sameMaterialCombined), { a: 8000, b: 4000 });
assert.deepEqual(reservedByCard(reversedCombined), { b: 8000, a: 4000 });
assert.notEqual(sameMaterialCombined[0].fingerprint, reversedCombined[0].fingerprint);

const userData = {
  userInventory: [{ id: `${materialUuid}::SCU`, materialUuid, materialName: "Shared Material", unit: "SCU", batchCount: 2, totalQuantityUnits: 16000, updatedAt: "2026-08-22T12:00:00.000Z" }],
  materialBatches: dualBatches,
  craftingCards: [dualCard],
  miningLoadouts: [{ id: "loadout-1", materialUuid, materialName: "Shared Material", name: "Fixture", stations: [], gadgets: [], isDefault: true }],
  userSettings: [{ key: "user:locale", scope: "USER", value: "hu-HU" }]
};

// 5. Export -> deletion -> replace import restores a bit-identical fingerprint.
const envelope = m4.buildM4BackupEnvelope(userData, { application: "sPg Crafting List", applicationVersion: "V001-dev" });
const validated = m4.validateAndMigrateM4Backup(JSON.stringify(envelope));
const emptyData = { userInventory: [], materialBatches: [], craftingCards: [], miningLoadouts: [], userSettings: [] };
const restored = m4.simulateM4UserDataImport(emptyData, validated.backup.data, "REPLACE", false);
assert.equal(m4.fingerprintUserDataPayload(restored), envelope.fingerprint);

// 6. Invalid JSON is rejected.
assert.throws(() => m4.validateAndMigrateM4Backup("{invalid"), (error) => error.code === "INVALID_JSON");

// 7. Unknown schemas are rejected before any import calculation.
assert.throws(() => m4.validateAndMigrateM4Backup({ format: envelope.format, schemaVersion: 999, data: userData }), (error) => error.code === "UNKNOWN_SCHEMA_VERSION");
assert.throws(() => m4.buildM4BackupEnvelope({ ...userData, userSettings: [{ key: "lastTechnicalProbe", value: "overwrite-attempt" }] }), (error) => error.code === "INVALID_USER_SETTING");

// 8. Interrupted import leaves its source state unchanged.
const beforeInterrupted = m4.fingerprintUserDataPayload(userData);
assert.throws(() => m4.simulateM4UserDataImport(userData, emptyData, "REPLACE", true), (error) => error.code === "SIMULATED_IMPORT_ABORT");
assert.equal(m4.fingerprintUserDataPayload(userData), beforeInterrupted);

// 9. Supported schema 1 is migrated with explicit steps.
const schema1 = m4.validateAndMigrateM4Backup({
  format: envelope.format,
  schemaVersion: 1,
  data: { userInventory: userData.userInventory, materialBatches: userData.materialBatches, craftingCards: userData.craftingCards, userLoadouts: userData.miningLoadouts }
});
assert.equal(schema1.migration.fromSchema, 1);
assert.equal(schema1.migration.toSchema, 2);
assert.equal(schema1.backup.data.miningLoadouts.length, 1);
assert.equal(schema1.backup.data.userSettings.length, 0);

// 10. Preview is read-only and reports additions/overwrites/conflicts/deletions.
const beforePreview = m4.fingerprintUserDataPayload(userData);
const preview = m4.buildM4ImportPreview(userData, emptyData, "REPLACE");
assert.equal(m4.fingerprintUserDataPayload(userData), beforePreview);
assert.equal(preview.totals.deletions, 6);
assert.equal(preview.currentFingerprint, beforePreview);

// 11. One copied log is wired to all required M1-M4 state and process markers.
for (const marker of [
  "activeScVersion", "gameDataCache", "userData", "craftingCardOrder", "allocation", "combinedMaterials", "backup",
  "BACKUP_EXPORT_CREATED", "BACKUP_IMPORT_PREVIEW", "BACKUP_SNAPSHOT_CREATED", "BACKUP_IMPORT_COMMITTED", "BACKUP_IMPORT_ROLLBACK",
  "RAM_DURING_PROCESS_SINGLE_SESSIONSTORAGE_WRITE_ON_FINISH", "diagnosticBundleM4"
]) {
  assert.ok(html.includes(marker), `A diagnosztikai marker hiányzik: ${marker}`);
}
const loggerSource = html.match(/class DiagnosticLogger \{[\s\S]*?\n    \}\n\n    class AppDatabase/)[0];
assert.equal((loggerSource.match(/sessionStorage\.setItem/g) || []).length, 1, "A logger több helyen ír sessionStorage-ba.");
assert.match(loggerSource, /finish\([\s\S]*?this\.writeBlocks\(blocks\)/, "A session log írása nem a process finish része.");

// 12. Larger Combined Materials fixture: 1,000 cards, 3,000 slots, 5,000 batches.
const materialIds = Array.from({ length: 100 }, (_, index) => `perf-material-${String(index).padStart(3, "0")}`);
const performanceCards = Array.from({ length: 1000 }, (_, cardIndex) => ({
  id: `perf-card-${cardIndex}`,
  order: cardIndex,
  blueprintUuid: `perf-blueprint-${cardIndex}`,
  outputName: `Performance ${cardIndex}`
}));
const performanceBatches = Array.from({ length: 5000 }, (_, index) => ({
  id: `perf-batch-${index}`,
  materialUuid: materialIds[index % 100],
  materialName: `Material ${index % 100}`,
  unit: "SCU",
  quantityUnits: 1000
}));
const performanceAllocation = {
  cards: performanceCards.map((item) => ({
    cardId: item.id,
    order: item.order,
    outputName: item.outputName,
    requestedQuantity: 1,
    requirements: Array.from({ length: 3 }, (_, slotIndex) => {
      const materialIndex = (item.order * 3 + slotIndex) % 100;
      return {
        recipeSlotId: `${item.id}:slot:${slotIndex}`,
        recipeSlotName: `Slot ${slotIndex}`,
        ingredientUuid: materialIds[materialIndex],
        materialName: `Material ${materialIndex}`,
        unit: "SCU",
        rule: "HIGHEST_Q",
        targetQuality: null,
        requiredUnits: 10,
        allocatedUnits: 10,
        missingAmountUnits: 0,
        missingQualityUnits: 0,
        status: "SATISFIED",
        allocatedBatches: []
      };
    })
  })),
  batchUsage: materialIds.map((id) => ({ batchId: `aggregate-${id}`, materialUuid: id, unit: "SCU", reservedUnits: 300 })),
  summary: { cardCount: 1000, requirementCount: 3000, unsatisfiedRequirementCount: 0 }
};
const performanceStarted = performance.now();
const performanceCombined = m4.buildCombinedMaterials(performanceAllocation, performanceCards, performanceBatches);
const performanceDurationMs = performance.now() - performanceStarted;
assert.equal(performanceCombined.length, 100);
assert.equal(performanceCombined.reduce((sum, group) => sum + group.usages.length, 0), 3000);
assert.ok(performanceDurationMs < 1000, `A Combined Materials nagy fixture túl lassú: ${performanceDurationMs.toFixed(1)} ms`);

console.log("M4_COMBINED_BACKUP_TEST_PASS");
console.log(JSON.stringify({
  mandatoryCases: 12,
  backupSchemaVersion: envelope.schemaVersion,
  roundtripFingerprint: envelope.fingerprint,
  performance: {
    cards: 1000,
    recipeSlots: 3000,
    batches: 5000,
    materials: performanceCombined.length,
    durationMs: Number(performanceDurationMs.toFixed(2))
  }
}, null, 2));
