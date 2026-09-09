# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V004`; C002 checkpoint: `d773dc2...`; `origin/main`: `0a83e4409e2c38442ca8f908dcf101d013061955`.
- Runtime: `V004-dev`; application schema `7`; IndexedDB: `spg-crafting-list-v004` version `1`; backup schema `3`.
- Durable, 0-ról induló `inventoryRevision`, `craftListRevision`, `allocationRevision` és per-card `cardRevision`; szemantikai mutationönként pontosan egy increment, presentation-only collapse increment `0`.
- Inventory/Card/quality setting/import/V003 migration revision-írás az érintett rekordokkal közös tranzakcióban; overflow és injected failure fail-closed, teljes rollback.
- Runtime-only reservation snapshot: canonical payload + Web Crypto SHA-256 lowercase hex; batch/Quality/sorrend/mennyiség/revision változás hash-érzékeny, display label nem identity.
- Állapotok: `VALID`, `STALE`, `BLOCKED`; startup/reload/import/migration után `STALE`, explicit `Újraszámítás / Reallocate` szükséges. Snapshot nincs IndexedDB-ben vagy backupban.
- MAX és partial prefix kizárólag a látható reservationből számolható; `OUTPUT_COUNT_UNPROVEN` és `HASH_UNAVAILABLE` blokkol.
- Célzott model/static + valódi Chrome startup/mutation/Reallocate/rollback/reload/direct `file://`: PASS; console/page error `0`.
- `LOCAL_RUNTIME_SIDECARS = 0`; `APPLICATION_RUNTIME_FILE_COUNT = 1`; application SHA-256: `30cc7b37246005c916a87f1c75f0f619579287fdd702bc87f948f8e6ecc027ee`.
- V001/V002/V003/tag/artifact változatlan. Craft Complete/deduction/partial execution/History event/Undo/BroadcastChannel: NOT IMPLEMENTED. Full regression: NOT RUN BY SCOPE. Push: NO.
- Riport: `docs/V004_C003_REVISION_RESERVATION_SNAPSHOT_REPORT.md`.

`V004-C003 – REVISION + RESERVATION SNAPSHOT INFRASTRUCTURE PASS, C004 READY`
