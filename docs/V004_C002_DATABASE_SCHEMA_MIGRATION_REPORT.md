# V004-C002 Database/schema and safe V003 migration foundation report

Date: 2026-09-09

Final status: `V004-C002 – DATABASE/SCHEMA + SAFE V003 MIGRATION FOUNDATION PASS, C003 READY`

## C001 input checkpoint

- Branch: `develop/V004`.
- Required and verified input checkpoint: `0b44909256bb776d91717d6578a1088399cfb149`.
- Audited branch base: `0a83e4409e2c38442ca8f908dcf101d013061955`.
- Technical source: `docs/V004_C001_CRAFT_COMPLETE_ARCHITECTURE_AUDIT.md`.
- The working tree was clean and no merge, rebase, cherry-pick or revert operation was in progress.
- Authenticated `git fetch --prune --tags` left `origin/main` unchanged at `0a83e4409e2c38442ca8f908dcf101d013061955`.

## Final C002 checkpoint

- Commit subject: `V004-C002-DATABASE-SCHEMA-MIGRATION-FOUNDATION`.
- The exact checkpoint hash is reported after commit because a Git commit cannot contain its own final hash.
- No push, merge, rebase, cherry-pick, tag change or GitHub Release change is part of this cycle.

## V004 runtime identity

| Field | V004-C002 value |
|---|---|
| `APP.version` | `V004-dev` |
| `APP.schemaVersion` | `7` |
| `APP.dbName` | `spg-crafting-list-v004` |
| `APP.dbVersion` | `1` |
| Backup format | `spg-crafting-list-backup` |
| Backup schema | `3` |

The canonical runtime remains `sPg Crafting List.html`. Its CSS and JavaScript are embedded; the fixture and tools are development-only and are not loaded by the application.

## Full V004 object-store topology

The new physical database contains 28 stores.

Game/cache and staging stores preserved from V003:

- `gameMetadata`, key path `key`;
- `blueprints`, key path `uuid`;
- `items`, key path `uuid`;
- `vehicles`, key path `uuid`;
- `commodities`, key path `uuid`;
- `locations`, key path `uuid`;
- `miningEquipment`, key path `uuid`;
- `normalizedBlueprints`, key path `uuid`;
- `blueprintIndexRawCache`, key path `cacheKey`;
- `blueprintIndexCache`, key path `cacheKey`;
- `blueprintRawCache`, key path `cacheKey`;
- `blueprintNormalizedCache`, key path `cacheKey`;
- `blueprintDatasets`, key path `version`;
- `miningRawCache`, key path `cacheKey`;
- `miningNormalizedCache`, key path `cacheKey`;
- `miningDatasets`, key path `version`;
- `uexRefineryRawCache`, key path `cacheKey`;
- `uexRefineryNormalizedCache`, key path `cacheKey`;
- `uexRefineryDatasets`, key path `datasetId`;
- `syncStaging`, key path `key`.

User Data and recovery stores:

- `userInventory`, key path `id`;
- `materialBatches`, key path `id`;
- `userLoadouts`, key path `id`;
- `craftingCards`, key path `id`;
- `settings`, key path `key`;
- `snapshots`, key path `id`;
- `craftHistory`, key path `craftTransactionId`;
- `userMeta`, key path `key`.

## `craftHistory` foundation

No Craft History event is created in C002. The empty store has these indexes:

| Index | Key path | Purpose |
|---|---|---|
| `byCraftingCardAndSequence` | `craftingCardId, historySequence` | Per-card ordered lookup |
| `byHistorySequence` | `historySequence`, unique | Global newest/oldest sequence lookup |
| `byCraftingCardStatusAndSequence` | `craftingCardId, status, historySequence` | Latest active event lookup for later Undo safety |

History event creation, History UI and Undo remain outside C002.

## `userMeta` and revision initialization

`userMeta` is initialized idempotently with four records:

| Key | Initial value |
|---|---:|
| `inventoryRevision` | `0` |
| `craftListRevision` | `0` |
| `allocationRevision` | `0` |
| `historySequence` | `0` |

Zero is deterministic, non-negative and a safe integer. No timestamp is used as a revision. Existing valid values are preserved on reload; invalid negative or non-integer revision records block startup. C003 will connect increments to the individual mutation paths.

`migration:v003` is intentionally absent in a pristine database and is added only by a successful migration transaction.

## V003 source discovery and validation

Direct migration source identity:

- database name: `spg-crafting-list`;
- database version: `4`;
- required stores: `userInventory`, `materialBatches`, `userLoadouts`, `craftingCards`, `settings`.

The application first requires `indexedDB.databases()` and proves that the exact name/version exists. If safe discovery is unavailable, the result is `SAFE_DISCOVERY_UNAVAILABLE`. Absence produces `V003_SOURCE_NOT_FOUND` without calling `indexedDB.open()` and without creating an empty source database.

After discovery, opening a disappeared or mismatched database would trigger `onupgradeneeded`; that transaction is immediately aborted. Name, version and all five stores are checked before data is read. Topology or version mismatch produces `V003_SOURCE_SCHEMA_MISMATCH`; there is no fuzzy migration.

The five source stores are read in one transaction declared exactly as `readonly`. The source-reader code contains no `put`, `add`, `delete` or `clear` operation. Application/schema identity is not persisted in the V003 database itself, so the ledger keeps those two source fields `null` rather than claiming unproven identity; database name/version/topology and the payload are proven.

## Explicit migration UI flow

The Data / Settings view now contains a V003 → V004 migration block.

1. Startup may safely detect and validate V003, but performs no migration and opens no confirmation dialog.
2. The UI states that V004 uses a separate database.
3. `V003 backup letöltése` creates a V003-compatible schema-2 backup of the validated five-store User Data.
4. `Migráció indítása` remains disabled until the backup was produced for the current source fingerprint.
5. Before writing, the source is read and fingerprinted again. A change since backup produces `V003_SOURCE_CHANGED_BEFORE_MIGRATION` and requires a new validation/backup.
6. A separate `window.confirm` is required.
7. Only then may the V004 transaction start.

No automatic startup migration exists.

## SHA-256 migration fingerprint

The migration idempotency key is a lowercase 64-character SHA-256 value from Web Crypto. There is no weak fallback. Missing `crypto.subtle.digest` or `TextEncoder` produces `V003_MIGRATION_SHA256_UNAVAILABLE` and blocks migration.

Canonical payload marker: `spg-v003-to-v004-migration-source`, schema `1`.

The payload contains:

- source database name and version;
- the sorted required-store name list;
- normalized contents of the five User Data stores.

Object keys are recursively sorted. Top-level object-store records are ordered by their primary key for deterministic serialization. Nested semantic arrays, including recipe requirements, slot-related arrays and loadout arrays, preserve their source order. The existing 32-bit FNV-style backup fingerprint remains only a backup-integrity mechanism and is not used for migration idempotency.

## Migration ledger

A successful `migration:v003` record includes:

- `status: SUCCESS`;
- source database name/version;
- proven source application/schema fields, currently `null`;
- SHA-256 source fingerprint;
- migration timestamp;
- target application version/schema;
- target database name/version.

If the stored successful ledger fingerprint equals the current source, the result is `V003_MIGRATION_ALREADY_APPLIED`. If it differs, the result is `V003_SOURCE_CHANGED_AFTER_MIGRATION`. Both are `BLOCKED`; no source data is imported again and no merge, overwrite, additive import or diff import runs.

## Pristine target definition

Direct V003 migration is permitted only when all these V004 collections are empty:

- `userInventory`;
- `materialBatches`;
- `craftingCards`;
- `userLoadouts`;
- USER-scope `settings`;
- `craftHistory`.

`userMeta` may contain only the four required revision records, all at value `0`. A migration ledger, an unknown meta record or any non-zero/default-mismatched revision makes the target non-pristine. Game/cache stores, internal non-USER settings and cache population do not make User Data dirty.

A non-pristine target produces `V004_TARGET_NOT_PRISTINE` before any migration write.

## Atomic migration transaction

The actual target write is one `readwrite` transaction over:

`userInventory`, `materialBatches`, `craftingCards`, `userLoadouts`, `settings`, `craftHistory`, `userMeta`.

Inside that transaction, the code re-reads the target, rechecks the ledger and pristine state, copies the five V003 User Data collections, initializes revisions, leaves History empty and adds the successful ledger. The Promise resolves only from `transaction.oncomplete`. Any validation, request or injected error aborts the transaction; a SUCCESS ledger cannot remain after rollback.

## Exact quantity preservation

Migration copies existing records through structured cloning. It never calls `toScuUnits()`, `Math.round`, `Math.floor` or `Math.ceil`, and never converts `quantityUnits` to SCU float and back.

The deterministic fixture and Chrome database test prove:

- `0.0001 SCU = 1 unit`, preserved as integer `1`;
- `0.0200 SCU = 200 unit`, preserved as integer `200`;
- batch ID, canonical UUID, provenance UUID, Quality, unit and note remain unchanged;
- Crafting Card ID, order `0`, quantity `21`, slot strategy and Quality Pool assignment remain unchanged.

Allowed material loss: `0 unit`.

## Backup schema-3 foundation

Schema 3 contains the five existing User Data arrays plus:

- `craftHistory`;
- `userMeta`.

Schema-1 and schema-2 backups remain accepted. They are transformed to schema 3 with `craftHistory: []` and the four revision counters initialized to `0`. Schema-2 input fingerprint is validated with the legacy five-store backup algorithm before transformation. Schema-3 data is validated against the new seven-collection shape.

The migration backup button deliberately emits schema 2 so it remains a faithful V003 safety backup. Full non-empty History merge/roundtrip behavior remains a C007 integration responsibility. V004 schema 3 → V003 backward import is unsupported.

## Output-count evidence

A live read-only audit queried the Star Citizen Wiki API on 2026-09-09:

- default game version: `4.10.0-LIVE.12519617`;
- `/api/blueprints`: all `1606` index records across `9` pages and `27` output types;
- `/api/blueprints/{uuid}`: `12` representative detail records;
- root output fields and nested `output` object fields contained no explicit output count, output quantity or output yield field.

The exact observed key lists are frozen in `tests/fixtures/v004-c002-v003-migration.json`.

Result: `OUTPUT_COUNT_UNPROVEN – COMPLETION MUST BLOCK AFFECTED RECIPES`.

No estimated output count was implemented. This remains an explicit C004 prerequisite for any affected recipe.

## Targeted automated results

Application SHA-256 under test: `a9d664947aa97f22c80b3706f44df5cc7346299fc06b1e57a01337923fa4b0c8`.

| Gate | Result |
|---|---|
| Baseline single-file structure, embedded CSS and JavaScript syntax | PASS |
| V004 identity and store/index topology model | PASS |
| Deterministic revision defaults | PASS |
| V003 schema validation and static read-only proof | PASS |
| Exact batch/Card migration fixture | PASS |
| SHA-256 deterministic/change sensitivity | PASS |
| Same-fingerprint replay block | PASS |
| Changed-source-after-success block | PASS |
| Non-pristine target block | PASS |
| Injected atomic failure rollback | PASS |
| V003 schema 1/2 → V004 schema 3 | PASS |
| Single-file runtime guard | PASS |

Machine-readable evidence:

- `test-artifacts/V004-C002/model-evidence.json`;
- `test-artifacts/V004-C002/target-summary.json`;
- `test-artifacts/V004-C002/validation.log`.

## Targeted Google Chrome result

Actual headless Google Chrome tested the single HTML at an isolated localhost origin with a controlled V003 version-4 source database.

- empty V004 startup: PASS;
- application base view and Data / Settings migration UI: PASS;
- 28-store topology and all three History indexes: PASS;
- refresh/reopen of `spg-crafting-list-v004` version 1: PASS;
- automatic startup migration: absent;
- backup required before confirmation: PASS;
- exact 1/200-unit migration: PASS;
- V003 source before/after logical state: unchanged;
- same-fingerprint replay block: PASS;
- changed source after success: blocked, target unchanged;
- injected write failure: full rollback, no SUCCESS ledger;
- non-pristine target: blocked;
- application-origin console errors/page errors: `0`.

Automated direct `file://` startup also passed in an isolated Chrome context. The V004 database opened, the absent V003 source remained absent, and safe discovery did not create an empty `spg-crafting-list` database.

Evidence: `test-artifacts/V004-C002/browser-evidence.json`. The local visual screenshot is intentionally ignored by Git as a large browser artifact.

## Single-file runtime audit

- Embedded application CSS: PASS.
- Embedded application JavaScript: PASS.
- Local `<script src>` dependency: `0`.
- Local stylesheet dependency: `0`.
- Runtime JSON/Info/test-fixture/tool dependency: `0`.
- `LOCAL_RUNTIME_SIDECARS = 0`.
- `APPLICATION_RUNTIME_FILE_COUNT = 1`.

## Protected release integrity

- V003 object type: annotated tag.
- V003 tag target: `ebc83281769fd212d988ee55957b1c2754256490`.
- V003 stable artifact size: `835820` bytes.
- V003 stable artifact SHA-256: `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`.
- V001/V002 release paths: unchanged from the V003 baseline.
- Historical V003 RC/evidence and release documentation: unchanged.

## Scope exclusions

- Craft Complete inventory deduction: `NOT IMPLEMENTED`.
- Partial/MAX completion execution: `NOT IMPLEMENTED`.
- `reservationSnapshotHash`: `NOT IMPLEMENTED`.
- Craft Complete UI and Craft History UI: `NOT IMPLEMENTED`.
- Undo: `NOT IMPLEMENTED`.
- BroadcastChannel and multi-tab completion logic: `NOT IMPLEMENTED`.
- Full release regression: `NOT RUN BY SCOPE`.

## Changed files

- `sPg Crafting List.html`;
- `tests/fixtures/v004-c002-v003-migration.json`;
- `tools/run-v004-c002-tests.mjs`;
- `tools/run-v004-c002-browser-tests.mjs`;
- `tools/validate-v004-c002.ps1`;
- `tests/test-plan.json`;
- `TEST_COMMANDS.md`;
- `test-artifacts/V004-C002/model-evidence.json`;
- `test-artifacts/V004-C002/browser-evidence.json`;
- `test-artifacts/V004-C002/target-summary.json`;
- `test-artifacts/V004-C002/validation.log`;
- this report and required project metadata.

## Rollback

Revert the single C002 checkpoint commit. This restores the V003 application code on `develop/V004`; the separately named V004 browser database can remain unused or be removed only through a separately authorized user-data operation. The V003 database, V001/V002/V003 release artifacts, V003 tag and remote state require no rollback because C002 never modified them.

`V004-C002 – DATABASE/SCHEMA + SAFE V003 MIGRATION FOUNDATION PASS, C003 READY`
