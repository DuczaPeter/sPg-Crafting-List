# V004-C007.1 Multi-Tab User Data Safety Report

## Scope és baseline

- Branch: `develop/V004`
- Input checkpoint: `8b7efea39a79d7d22cc61ef8634b1320c8db81ed`
- Input working-tree application SHA-256: `9cf79521aa9d1e46ed2494cdbbed80723f6cb52c2937497f264bc146ed20d365`
- Validált C007.1 application SHA-256: `9fc09f1884feedcea64390f5f4ce34b37e9798bf823c78f7e840d51406427798`
- Runtime identity: `V004-dev`
- Scope: Mining Loadouts cross-tab jelzés, backup-import konkurens durable változás elleni fail-closed védelem és valós Chrome BFCache lifecycle.
- Nem scope: Complete/Undo/History/SCU/reservation üzleti logika, backup schema bump, Wiki datasetaudit, full regression, release gate, kiadás vagy push.

## Mining Loadouts cross-tab

A `persistMiningLoadouts` csak a durable IndexedDB-commit után küld `MINING_LOADOUTS_CHANGED` UI-signalt. A payload nem tartalmaz loadout állapotot, csak kis érintettségi azonosítókat. A fogadó fül force-reread útvonalon IndexedDB-ből tölti újra a durable adatot, majd frissíti a Mining Loadouts és a Material Database default-loadout nézetét.

Valós kétfüles Chrome-eredmény: add, edit, default és delete azonnali durable UI-frissítése PASS. Presentation-only művelet broadcastja `0`, durable írása `0`; automatikus Reallocate nincs.

## Backup-import konkurenciavédelem

Az import preview eltárolt current fingerprintje commit-precondition lett. A `commitUserDataImport` ugyanabban a readwrite IndexedDB-tranzakcióban:

1. beolvassa az összes User Data store pontos durable előállapotát;
2. kiszámítja annak canonical fingerprintjét;
3. bármely eltérésnél `IMPORT_BASE_STATE_CHANGED` hibával abortál, még snapshot vagy céladat-írás előtt;
4. egyezéskor ugyanabban a tranzakcióban készíti el az exact pre-import snapshotot és hajtja végre az importot.

Nincs automatikus retry vagy régi preview alapján történő felülírás. A hibaüzenet friss preview-t és új felhasználói megerősítést kér.

Chrome-bizonyíték:

- preview → másik fül Complete → import: BLOCKED; a `COMPLETED` event és a Card mennyiség megmaradt; snapshot-írás `0`;
- preview → másik fül Undo → import: BLOCKED; az `UNDONE` állapot megmaradt; snapshot-írás `0`;
- preview → másik fül Mining Loadout mutation → import: BLOCKED; a loadout megmaradt; snapshot-írás `0`;
- új preview → explicit import: PASS; az import előtti snapshot az exact durable előállapotot tartalmazza.

A backup schema verzió továbbra is `3`. A C006.1 pristine schema-3 `REPLACE` structural JSON exact, extra revision increment `0`, backup data loss `0`.

## BFCache lifecycle

Az input checkpoint kódján valós Google Chrome BFCache navigáció reprodukálta a hibát: `pageshow.persisted=true` után a multi-tab csatorna `CLOSED` maradt, a runtime batch count `0`, miközben durable batch count `1` volt. A reprodukció a checkpoint Git-objektumának kanonikus LF-bytejait szolgálta ki; ennek külön SHA-ja szerepel az evidence-ben, míg az induláskor ellenőrzött fizikai working-tree SHA külön mező marad.

A javítás persisted `pageshow` esetén egyszer megnyitja a csatornát, majd force-reread útvonalon újratölti a durable User Data állapotot. A listener számláló aktív listener-darabszámot jelez: close után `0`, reopen után `1`.

Javítás utáni Chrome-eredmény: valódi BFCache `persisted=true`, csatorna `READY`, durable UI frissült, listener `1`, duplicate listener `0`. Normál reload után új tab ID és listener `1`.

## Célzott kapu

- C007.1 model/source contract: PASS
- C007.1 Google Chrome: PASS
- C006.1 backup round-trip current-byte regresszió: PASS
- C007 multi-tab current-byte regresszió: PASS
- Automated direct `file://`: PASS
- Runtime fájl: `1`; sidecar: `0`; overflow: `0`; console error: `0`
- Backup data loss: `0`
- Full regression: `NOT_RUN_BY_SCOPE`
- Release gate: `NOT_STARTED_BY_SCOPE`
- Push: `NO`

Evidence: `test-artifacts/V004-C007.1/`. Validátor: `tools/validate-v004-c0071.ps1`.

## Protected baseline és visszaállás

A V003 annotated tag targetje `ebc83281769fd212d988ee55957b1c2754256490`; a stable artifact mérete `835820` byte, SHA-256 értéke `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`. A V001/V002/V003 release útvonal, V003 tag és artifact változatlan.

A C007.1 egyetlen helyi commitként normál `git revert` művelettel állítható vissza. History rewrite, rebase, force push és remote push nem történt.

`V004-C007.1 – MULTI-TAB USER-DATA SAFETY PASS, RELEASE-GATE READY`
