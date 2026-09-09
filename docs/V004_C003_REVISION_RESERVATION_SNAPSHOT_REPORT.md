# V004-C003 Revision + Reservation Snapshot Infrastructure Report

## Eredmény

`PASS_REVISION_RESERVATION_SNAPSHOT_INFRASTRUCTURE`

A C003 a lezárt C002 checkpointból készült a `develop/V004` ágon. A runtime identity `V004-dev`, a database `spg-crafting-list-v004` version 1, az application schema 7 és a backup schema 3 maradt. A V001, V002 és V003 release-ek, az annotált V003 tag és a stabil V003 artifact nem változott.

## Elkészült infrastruktúra

- Durable `inventoryRevision`, `craftListRevision`, `allocationRevision` és per-card `cardRevision`, determinisztikus 0 kezdőértékkel.
- Szemantikai mutationönként pontosan egy increment; presentation-only collapse increment nélkül marad.
- Inventory, Crafting Card, Quality setting, import és V003 migration esetén az adat és a revision ugyanazon IndexedDB tranzakcióban íródik.
- Safe-integer revision validation, explicit `V004_REVISION_OVERFLOW` blocker és injected-failure teljes rollback.
- Runtime-only `V004_RESERVATION_SNAPSHOT_1` payload, stabil canonicalizálás és Web Crypto SHA-256 lowercase hex hash.
- Reservation állapotok: `VALID`, `STALE`, `BLOCKED`; reload/import/migration után explicit `Újraszámítás / Reallocate` szükséges.
- A snapshot a Card, prioritás, globális és card revision, blueprint/output identity, SC adatverzió, recipe slot, Quality-policy és a látható reserved batch allocation exact evidence-ét köti össze.
- MAX és partial prefix csak a látható reservationből számolható. A többbatch-es partial terv a megjelenített batch-sorrend prefixét fogyasztaná, arányos újrakeverés nélkül.
- `OUTPUT_COUNT_UNPROVEN` és `HASH_UNAVAILABLE` fail-closed blocker.

## Tudatosan nincs a C003-ban

- Craft Complete és inventory deduction.
- Partial completion végrehajtás.
- Craft History event és Undo.
- BroadcastChannel vagy multi-window invalidation.
- Completion-time reallocation vagy fallback batch consumption.

## Ellenőrzés

- `tools/validate-baseline.ps1`: PASS.
- `tools/run-v004-c003-tests.mjs`: PASS_TARGETED_MODEL.
- `tools/run-v004-c003-browser-tests.mjs`: PASS_TARGETED_CHROME Google Chrome-ban.
- Chrome: startup, exact revision-lépések, collapse +0, stale, explicit Reallocate, output blocker, reorder, atomic rollback, reload és direct `file://`: PASS.
- Application-origin console/page error: 0; direct-file console/page error: 0.
- Single-file gate: embedded CSS/JS, local runtime sidecar 0, application runtime file count 1.
- Full regression: `NOT_RUN_BY_SCOPE`.

Application SHA-256: `30cc7b37246005c916a87f1c75f0f619579287fdd702bc87f948f8e6ecc027ee`.

A gépi bizonyíték a `test-artifacts/V004-C003/` mappában található.

## Visszaállás

A C003 checkpoint normál Git reverttel visszavonható. History rewrite, rebase, force push vagy remote push nem történt. A V003 baseline, tag és release artifact visszaállítást nem igényel.

## Következő állapot

`V004-C003 – REVISION + RESERVATION SNAPSHOT INFRASTRUCTURE PASS, C004 READY`

A C004 ebben a ciklusban nem indul el; csak új, explicit feladatban kezdhető.
