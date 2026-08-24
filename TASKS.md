# TASKS.md

## Aktualis

- [x] Projekt celja es projekt tipusa pontosan rogzitve a `CODEX_START_HERE.md` fajlban.
- [x] Fo belepesi fajl vagy inditasi struktura azonositva a `PROJECT_MAP.md` fajlban.
- [x] Projektstruktura-ellenorzes kitoltve a `TEST_COMMANDS.md` fajlban.
- [x] A teljes V1.0 specifikacio tartosan rogzitve a projektben.
- [x] A nev, ketfajlos futtatasi szerkezet es tovabbi vegleges dontesek rogzitve.
- [x] Elso fejlesztesi technikai baseline letrehozva.
- [x] Statikus baseline kapu es repair-cycle PASS.
- [x] Chrome localhost technikai proba, IndexedDB-perzisztencia es responsive vizualis ellenorzes PASS.
- [x] M1 verziozott raw/normalizalt blueprint cache es tranzakcios aktivalas.
- [x] M1 Blueprint Browser lapozott indexszel, API-facetekkel es lusta reszletbetoltessel.
- [x] Teljes slotonkenti normalizalt receptmodell, JS-300, Hofstede-S1 es duplicate-material fixture regresszio.
- [x] Globalis My Materials inventory es kulon Quality batch rekordok egeszpontos SCU tarolassal.
- [x] Sorrendezheto Crafting Cardok es determinisztikus, slotonkenti Allocation Engine.
- [x] HP_MIN_500, Highest Q, Target Q, FIXED es UNKNOWN Quality szabalyok.
- [x] Nyolc kotelezo M2 fixture, nagy terhelesi proba es helyi bongeszos User Data fingerprint regresszio.
- [x] Dinamikus mining commodity/location/equipment Game Data cache es naprendszerenkenti determinisztikus rangsor.
- [x] Tobb mining loadout materialonkénti defaulttal, dinamikus station/module sorokkal, tetszoleges gadgettel es USER_OVERRIDE forrassal.
- [x] Tizenhet kotelezo M3 fixture, 5000 locationos teljesitmenyproba es helyi Chrome loadout-fingerprint regresszio.
- [x] Combined Materials az Allocation Engine kozvetlen projekciojakent, slot- es Quality-reszletek megorzesevel.
- [x] Teljes User Data backup schema 2, read-only import preview, schema 1 migracio, automatikus snapshot es atomi rollback.
- [x] Egyetlen muvelettel masolhato M1-M4 diagnosztikai csomag es 12 kotelezo M4 regresszios eset.
- [x] Kulon UEX refinery raw/normalizalt cache napi TTL-lel, kezi frissitessel es tranzakcios rollbackkel.
- [x] Biztonsagos Wiki–UEX exact mapping, MATCHED/UNMAPPED/AMBIGUOUS es USER_OVERRIDE adatmodell.
- [x] `value_month` szerinti naprendszerenkenti rangsor, tie-, nulla- es negativ-ertek kezelessel.
- [x] Kozos Crafting Card/Combined mining+refinery snapshot M6 offline export-elokeszitessel.
- [x] Tizenhet kotelezo M5 regresszio, valos auth nelkuli UEX fetch es 12/12 helyi bongeszos technikai proba.
- [x] M5.1: ot igazolt, verziozott `VERIFIED_CANONICAL_ALIAS`; nincs altalanos fuzzy vagy Construction-szoeldobas.
- [x] M6 standalone export, referencia-UI es automatizalt M1-M6 release-candidate regresszio.
- [x] Pontos, visszakuldheto kezi V1 release-gate checklist elkeszitese.
- [x] M6.1 UI Completeness Audit: pontosan 8 enabled felso navigacio, hasznalhato Material Database es kulon Mining Loadouts kapu.
- [x] M6.1 teljes M1-M6 + 14 pontos UI regresszio, Chrome 13/13, IndexedDB reload, fingerprint es 390 px ellenorzes.
- [ ] Kozvetlen `file://` technikai proba aktualis Chrome-ban vagy Edge-ben.
- [ ] Letoltott standalone export kulon, offline ujranyitasa.
- [ ] Kulon Edge-regresszio.

## Kovetkezo

- [x] `sPg Crafting List.html` technikai baseline letrehozasa.
- [x] API + IndexedDB + standalone export builder technikai proba localhost Chrome-ban.
- [ ] API + `file://` + IndexedDB + standalone export kezi technikai proba.
- [x] M1: verziozott, igeny szerinti API cache es Blueprint Browser.
- [x] M2: My Materials, Quality batch-ek es determinisztikus Allocation Engine.
- [x] M3: mining adatok, location rangsor es loadoutok.
- [x] M4: Combined Materials, backup/restore preview es kibovitett diagnosztika.
- [x] M5: UEX Refinery Data es naprendszerenkenti legjobb finomito.
- [x] M6.1: V1 UI completeness audit es placeholder-feloldas a meglevo M3/M5 modellekkel.
- [ ] M6 vegso acceptance: kezi Chrome `file://`, tenyleges offline export es kulon Edge gate PASS.
- [ ] A teljes V1.0 belso milestone-jainak vegrehajtasa a specifikacio funkcioinak elhagyasa nelkul.
- [x] M1 ellenorzes futtatasa a `TEST_COMMANDS.md` alapjan.
- [x] M1 `STATUS.md`, `WORKLOG.md` es jelentés frissitese.
- [x] M2 `STATUS.md`, `WORKLOG.md` es jelentés frissitese.
- [x] M3 `STATUS.md`, `WORKLOG.md` es jelentes frissitese.
- [x] M4 `STATUS.md`, `WORKLOG.md`, `BACKUP_RESTORE.md` es jelentes frissitese.
- [x] M5 `STATUS.md`, `WORKLOG.md`, technikai baseline es jelentes frissitese.

## Blokkolo problema

- Az M6.1 PASS, de a stabil V1 kiadast tovabbra is blokkolja a harom meg nem futtatott kezi release-gate.

