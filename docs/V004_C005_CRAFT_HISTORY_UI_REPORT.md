# V004-C005 Craft History UI Report

## Baseline és scope

- C004.4 input checkpoint: `99744c3a7bd7ec2de947efbea4b9826e45a59b62`.
- Input application SHA-256: `b2b18b94196783984b2164084d184852eea79f2e686fa9b5c6e3ccaf01cdc706`.
- Final application SHA-256: `fd37d3a951e95266a15e8807fd09d4dc477351897a60060b59375062f65b3569`.
- Branch/runtime: `develop/V004`, `V004-dev`.
- A ciklus kizárólag a már létező append-only `craftHistory` felhasználói megjelenítését készítette el. Undo, Redo, History delete/archive/retention, multi-tab sync, új adatbázis- vagy backup-schema és C006 nem része.
- Teljes release-regresszió nem futott; a változatlan normalizálás miatt a C004.4 célzott model- és production Chrome-folyamat futott újra.

## History UI

A Crafting List tetején kompakt, billentyűzettel kezelhető `Aktív Craftok | Craft History` tablist van. A default az Aktív Craftok. A nézetváltás és a natív `details/summary` group- és event-lenyitás csak presentation state: nem ír IndexedDB-be, nem növel revisiont, nem indít allocationt és nem változtat reservationt.

Üres állapot: `Még nincs rögzített Craft History.` A kiegészítő szöveg egyértelműsíti, hogy esemény csak sikeresen megerősített Craft Complete után keletkezik.

## Grouping és sorrend

- Group identity: exact eredeti `craftingCardId`; partial és full completion ugyanabban a csoportban marad akkor is, ha az aktív Card full completion után eltűnt.
- Group sorrend: elsődlegesen `max(historySequence)` csökkenő; sequence nélküli legacy groupnál timestamp fallback, majd stabil nem-locale szöveges tie-break.
- Event sorrend groupon belül: `historySequence DESC`; legacy eventnél timestamp, majd stabil ID fallback.
- Header: eltárolt item/product név, blueprint/output identity, eventszám, legutóbbi időpont, valamint az aktív, bizonyított `COMPLETED + CRAFT_RUN_COUNT` mennyiség összege. `UNDONE` nem számít aktív teljesítésnek; unknown/legacy aktív összeg fail-closed `nem bizonyított`.

## Status és immutable historical evidence

- `COMPLETED` → `Kész`.
- `UNDONE` → `Visszavonva`.
- Ismeretlen status látható `Ismeretlen állapot: ...` jelzést kap, a lista nem törik el.
- Marker nélküli/régi event `LEGACY_HISTORY_QUANTITY_SEMANTICS_UNKNOWN`; nincs craft-runná reinterpretálva, és világos legacy warning jelenik meg.

A renderer kizárólag az eltárolt History eventet használja. Nem kér live receptet, nem használja az aktuális Cardot vagy Inventoryt történelmi truthként, és nem futtatja újra a C004.4 normalizálást. A tárolt `consumedDeltas[].consumedUnits` az exact truth. Minden batch külön sorban marad materialnévvel, canonical/source UUID-val, Qualityvel, batch ID-val, unittal és exact formátummal, például `17500 unit · 1.7500 SCU` vagy `35 db`.

## Célzott bizonyítás

- Static/model: exact `craftingCardId` grouping; B(seq3) → A(seq2), majd A(seq4) → B; event 4,2,1; `UNDONE` kizárás; legacy/unknown fail-safe; localeless rendezés; stored-delta-only renderer; no Undo/delete/schema change; single-file PASS.
- Production Chrome: Omnisky III Cannon, UUID `280f47b7-8434-410c-b854-380768fdccec`; 21 craftból partial 5, History `×5`, exact deltas `18000/35/35`, Q900 és exact batch ID-k; aktív Card 16.
- Ugyanazon Card explicit Reallocate után full 16: aktív Card 0, ugyanaz a History group 2 eventtel, event order 2,1, aktív total 21, végső batch maradék `1/1/1` unit, material loss 0.
- Több Card/status fixture: A sequence 1,2; B sequence 3; A sequence 4 után group order A,B,legacy. A event order 4,2,1; `Kész`/`Visszavonva`; legacy stored exact `1234 unit · 0.1234 SCU` látható.
- Reload: group order, event order, counts, statusok és stored evidence változatlan.
- Presentation proof: History tab → group expand → event expand → Aktív Craftok; durable User Data write 0, global/card revision változás 0, allocation változás 0, reservation változás 0.
- Layout: 1920×1080 és 390×844, horizontal overflow 0; batch/UUID tördelés PASS.
- C004.4 completion regresszió: targeted model és valódi Chrome PASS az aktuális application byte-okon.
- Automated direct `file://`: PASS; runtime fájl 1, helyi runtime sidecar 0, local stylesheet/script/JSON/fixture dependency 0.
- Console/page error: 0.

Evidence:

- `test-artifacts/V004-C005/model-evidence.json`
- `test-artifacts/V004-C005/browser-evidence.json`
- `test-artifacts/V004-C005/validation.log`
- `test-artifacts/V004-C005/target-summary.json`

## Protected release integritás

- V001/V002/V003 release path: változatlan.
- Annotated `V003` tag target: `ebc83281769fd212d988ee55957b1c2754256490`.
- V003 artifact: `835820` byte; SHA-256 `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`.
- Push/force push: NO.

## Módosult fájlok

- `sPg Crafting List.html`
- `tools/run-v004-c005-tests.mjs`
- `tools/run-v004-c005-browser-tests.mjs`
- `tools/validate-v004-c005.ps1`
- `test-artifacts/V004-C005/`
- az aktuális HTML-byteokra frissített C004.4 model/Chrome evidence
- `docs/V004_C005_CRAFT_HISTORY_UI_REPORT.md`
- `STATUS.md`, `TASKS.md`, `PROJECT_MAP.md`, `WORKLOG.md`, `USED_SKILLS.md`, `TEST_COMMANDS.md`, `VERSION.json`, `DECISIONS.md`

## Rollback

A C005 helyi checkpoint normál `git revert` műveletével állítható vissza. A V003 taget vagy artifactot nem kell és nem szabad módosítani. C006 nem indult el.
