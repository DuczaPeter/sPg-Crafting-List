# V004-C006.1 Undo Backup Round-Trip Report

## Baseline és scope

- Input checkpoint: `4bb3303dea206b65dd51d9c911ac69b5517a443d`.
- Input application SHA-256: `ad0457cdf9655bfb03dfb4b6e9f924d5db71c2e8c55d1d8be215c0beea3b6ce5`.
- Final application SHA-256: `ecbb85cee6fc0ae92c0b2338e392806f7fac72befb430e2bbb40f3ab717f71b5`.
- Branch/runtime: `develop/V004`, `V004-dev`.
- C006.1 a már elkészült C006 Undo backup/export/import/reload hézagát zárja. Új feature, C007, schema bump, stable release, push és teljes regresszió nincs a scope-ban.

## Talált hiba és minimális javítás

A schema-3 `REPLACE` import minden célállapotnál szemantikai mutationként revisiont növelt. Ez helyes meglévő adatok felülírásakor, de egy tiszta, izolált V004 adatbázis backupból történő exact visszaállításakor megváltoztatta az importált revision evidence-et. Emiatt a durable állapot nem volt teljesen azonos az exportált állapottal.

A javítás explicit pristine ellenőrzést vezet be. Ha a cél User Data és History üres, a négy revision meta pedig pontosan 0, a `REPLACE` import az incoming normalizált adatot revision-növelés nélkül állítja vissza. Nem pristine cél és `MERGE` esetén az eddigi revision-invalidálás változatlan. Reservation import után továbbra sem él újra automatikusan; explicit Reallocate kell.

Backup schema verzióváltás nem történt: a verzió maradt 3.

## Partial Undo round-trip

Valódi Omnisky production Cardon a Chrome teszt két partial completiont, majd a legújabb event Undo műveletét hajtotta végre. Ezután az alkalmazás saját exportját letöltötte, új izolált és pristine böngészőprofilban importálta, majd reload után újraolvasta.

- A normalizált durable JSON strukturálisan exact egyezett.
- History események sorrendje `2,1`, státusza `UNDONE,COMPLETED`, aktív total 5 maradt.
- Az `UNDONE` History összes mezője, `consumedDeltas`, restored-batch evidence és Undo revision evidence megmaradt.
- Inventory, Crafting Card és mind a négy `userMeta` revision exact megmaradt.
- Egy mesterséges, ismeretlen extra History mező változatlanul round-tripelt.
- Backup data loss: 0.

## Full Undo round-trip

A full completion eltávolította a Cardot, az Undo pedig a stored pre-craft snapshotból visszaállította. Export, tiszta DB import és reload után exact maradt:

- a History event;
- az inventory és material batch állapot;
- a Card ID, quantity, order, blueprint, slotok, Quality poolok és Card revision;
- mind a négy globális revision meta.

Backup data loss: 0.

## LIFO és idempotencia import után

Az importált `COMPLETED` esemény `UNDO_READY`, az importált `UNDONE` esemény `ALREADY_UNDONE` maradt. A group/event sorrend és a latest-active Card LIFO változatlan. A már visszavont event második Undo-kísérlete blokkolt, durable write 0.

## Legacy schema 3 és forward compatibility

A marker nélküli legacy schema-3 History esemény importálható és megjeleníthető, de Undo evidence nem készül hozzá utólag. Az Undo gombok száma 0, a státusz `FAIL_CLOSED_COMPATIBLE`. Az ismeretlen extra History mező megmaradt. Current schema eventnél az unknown mező szintén megőrződött.

## V003 migráció

A C002 Google Chrome regresszió az aktuális application byte-okon PASS:

- source access `READ_ONLY`;
- a V003 source a migráció után változatlan;
- migrált `craftHistory` hossza 0;
- ismételt és megváltozott-source migráció fail-closed;
- V003 source DB write 0.

A V003 migrációs szemantika és a schema-2 V003 backup út változatlan.

## Célzott kapuk

- Baseline static: PASS.
- C002 V003 migration Google Chrome regresszió: PASS.
- C006 Undo VM és Google Chrome regresszió: PASS.
- C006.1 VM backup round-trip: PASS.
- C006.1 Google Chrome partial/full export → isolated import → reload: PASS.
- Automated direct `file://`: PASS; protocol `file:`; overflow 0.
- Runtime fájl: 1; helyi runtime sidecar: 0.
- Console/page error: 0.
- `git diff --check`: PASS.
- Teljes regresszió: `NOT_RUN_BY_SCOPE`.

Evidence:

- `test-artifacts/V004-C006.1/model-evidence.json`
- `test-artifacts/V004-C006.1/browser-evidence.json`
- `test-artifacts/V004-C006.1/validation.log`
- `test-artifacts/V004-C006.1/target-summary.json`

## Kötelező végállapot

- UNDONE History round-trip = PASS
- Consumed delta preservation = PASS
- Restored inventory preservation = PASS
- Restored Card preservation = PASS
- LIFO after import = PASS
- Double Undo after import = BLOCKED
- Legacy schema-3 = FAIL-CLOSED COMPATIBLE
- V003 migration = UNCHANGED
- Backup data loss = 0
- runtime files = 1
- sidecars = 0
- push = NO
- C007 = NOT STARTED

## Protected baseline és rollback

- Annotated `V003` tag target: `ebc83281769fd212d988ee55957b1c2754256490`.
- V003 artifact: `835820` byte; SHA-256 `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`.
- V001/V002/V003 release path változatlan.

A C006.1 helyi checkpoint normál `git revert` műveletével állítható vissza. A V003 taget vagy artifactot nem kell és nem szabad módosítani.
