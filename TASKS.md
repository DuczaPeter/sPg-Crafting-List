# TASKS.md

## Aktualis

### V002-dev egyfajlos alkalmazas

- [x] Kulso `Info/style.css` runtime-fugges auditja es biztonsagos migracios terv.
- [x] Teljes CSS beagyazasa a `sPg Crafting List.html` fajlba.
- [x] Kulso stylesheet link, duplikalt base64 snapshot, CSSOM/fetch/cache CSS fallback es Google Fonts import eltavolitasa.
- [x] A standalone export atallitasa ugyanarra az egyetlen embedded CSS-forrasra.
- [x] Baseline, M6, M6.1 es C04 tesztek atallitasa HTML-bol olvasott CSS-re.
- [x] Ures ideiglenes mappaban csak az egyetlen HTML-lel vegzett sidecar-regresszio PASS.
- [x] `V002-C001` teljes regresszios ciklus PASS.
- [x] Valos Chrome localhost kiegeszito proba: 13/13 technikai proba, API/cache/reload/fingerprint es console error 0 PASS.
- [ ] Valos Chrome `file://` proba ures mappabol: az automatizalas URL-policy miatt `NOT TESTED`; kezi kapu szukseges.
- [x] V002 fejlesztesi riport es atadas; stabil V002 release most nem keszul.

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
- [x] C04 CSSOM `SecurityError` javitasa kozponti CSS-bol reprodukalhato, drift-ellenorzott embedded export snapshot fallbackkel.
- [x] C04 celzott file-modellteszt, teljes M1-M6.1 regresszio es Chrome localhost 13/13 PASS.
- [x] C04 Technikai proba kezi ujrateszt normal Chrome `file://` modban.
- [x] Kozvetlen `file://` technikai proba aktualis Chrome-ban: C01-C17 PASS.
- [x] Vegso automatizalt M1-M6.1 + C04 regresszio, elo SC/UEX probe, CSS-drift es standalone exportartifact PASS (`V001-C013`).
- [x] V1 pre-release acceptance report elkeszitese a manualis PASS/NOT TESTED allapotok valosaghu megorzesevel.
- [x] O04 `NOT TESTED` allapot release-waiverkent kifejezetten elfogadva; a teszt nem lett PASS-ra atirva.
- [x] E01-E10 `NOT TESTED` allapot release-waiverkent kifejezetten elfogadva; a tesztek nem lettek PASS-ra atirva.
- [x] `V001-C014` vegso teljes regresszio PASS.
- [x] Fagyasztott `releases/V001/` ketfajlos stabil bundle, SHA-256 manifest es release dokumentacio elkeszitve.
- [x] V001 stabil release commit es `V001` tag engedelyezve es elkeszitve.

## Kovetkezo

- [x] `sPg Crafting List.html` technikai baseline letrehozasa.
- [x] API + IndexedDB + standalone export builder technikai proba localhost Chrome-ban.
- [x] API + `file://` + IndexedDB + standalone export kezi Chrome technikai proba.
- [x] M1: verziozott, igeny szerinti API cache es Blueprint Browser.
- [x] M2: My Materials, Quality batch-ek es determinisztikus Allocation Engine.
- [x] M3: mining adatok, location rangsor es loadoutok.
- [x] M4: Combined Materials, backup/restore preview es kibovitett diagnosztika.
- [x] M5: UEX Refinery Data es naprendszerenkenti legjobb finomito.
- [x] M6.1: V1 UI completeness audit es placeholder-feloldas a meglevo M3/M5 modellekkel.
- [x] M6 vegso acceptance: Chrome PASS; O04 es Edge NOT TESTED eredmeny elfogadott release-waiverrel lezart.
- [x] A teljes V1.0 belso milestone-jainak vegrehajtasa a specifikacio funkcioinak elhagyasa nelkul.
- [x] M1 ellenorzes futtatasa a `TEST_COMMANDS.md` alapjan.
- [x] M1 `STATUS.md`, `WORKLOG.md` es jelentés frissitese.
- [x] M2 `STATUS.md`, `WORKLOG.md` es jelentés frissitese.
- [x] M3 `STATUS.md`, `WORKLOG.md` es jelentes frissitese.
- [x] M4 `STATUS.md`, `WORKLOG.md`, `BACKUP_RESTORE.md` es jelentes frissitese.
- [x] M5 `STATUS.md`, `WORKLOG.md`, technikai baseline es jelentes frissitese.

## Blokkolo problema

- A V002 automatizalt regresszio es Chrome localhost proba PASS, de a valos Chrome `file://` egyfajlos kapu az automatizalasi URL-policy miatt nem futott. A stabil V001 ettol fuggetlenul valtozatlan es visszaallithato.

