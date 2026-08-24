# V001 technikai baseline

Datum: 2026-08-22

## Megvalositva

- Kanonikus fo alkalmazas: `sPg Crafting List.html`.
- Kozponti kulso stilus: `Info/style.css`.
- `SCWikiAdapter`: timeout, korlatozott retry, HTTP/JSON/schema diagnosztika.
- `AppDatabase`: elkulonitett game- es user-data IndexedDB store-ok.
- Tranzakcios default game-version frissites staging rekorddal.
- JS-300 blueprint normalizalas recipe slot bontasban.
- Quality capability: `DYNAMIC`, `FIXED`, `UNKNOWN`.
- Pontos SCU helper: `1 SCU = 10 000` belso egesz egyseg.
- RAM-alapu process log, lezart blokkonkenti sessionStorage iras.
- Globalis `window.onerror` es `unhandledrejection` kezeles.
- Standalone export builder beagyazott CSS-sel es tavoli fontimport nelkul.
- Egykattintasos, tizenharom lepeses `Technikai proba`, benne tranzakcios rollback-, determinisztikus M2 allocation-, M3 mining modell-, M4 backup-, M5 UEX rollback/ranking- es M6.1 UI completeness ellenorzessel.
- M1 verziozott raw/normalizalt blueprint index- es reszlet-cache.
- Lapozott Blueprint Browser, API-facetekkel es lusta teljes receptbetoltessel.
- Globalis Quality batch inventory es sorrendezheto Crafting Card User Data.
- Slotonkenti, tervezesi modu Allocation Engine reszletes batch-dontesi trace-szel.
- Tranzakcios raw/normalizalt Mining Game Data cache, dinamikus API-facetek es occurrence → spawn → maximum Quality rangsor.
- Perzisztens mining loadoutok dinamikus station-, module- es gadgetkezeléssel, USER_OVERRIDE es deprecated equipment jelolessel.
- Combined Materials az Allocation Engine eredmenyenek slot- es Quality-reszleteket megorzo, determinisztikus projekciojakent.
- Teljes User Data backup schema 2, schema 1 migracio, read-only preview, import elotti snapshot es egytranzakcios import/rollback.
- Kulon UEX raw/normalizalt/dataset cache napi TTL-lel, kezi frissitessel es atomi rollbackkel.
- Biztonsagos Wiki–UEX commodity mapping es `value_month` szerinti rendszerenkenti refinery rangsor.
- Azonos normalizalt mining+refinery snapshot a Crafting Cardon es Combined Materialsben, M6 offline exporthoz elokeszitve.
- Teljes standalone Crafting/Farm Card export slotonkenti Quality/allocation, mining, loadout es refinery adatokkal; a kozponti CSS beagyazva, kulso eroforras nelkul.
- Egyetlen `Log masolasa` muvelettel exportalhato M1-M6 allapotcsomag.
- Pontosan nyolc enabled felso navigacios cel; keresheto/kategorizalhato Material Database a meglevo mining/refinery/loadout modelleken, valamint kulon Mining Loadouts navigacio.
- Reprodukalhato export-CSS snapshot: a fo HTML tovabbra is `Info/style.css`-t tolt, file exporthoz a centralis CSS byte-azonos, SHA-ellenorzott generalt masolata hasznalhato CSSOM security bypass nelkul.

## Bizonyitott

- `V001-C001` `baseline-static`: PASS.
- Korabbi Chrome localhost M1 proba: 8/8 PASS; M2 helyi Chromium proba: 9/9 PASS.
- Aktualis Wiki API default game version: `4.9.0-LIVE.12232306`.
- JS-300: 3 recipe slot, 1 `DYNAMIC`, 2 `FIXED`.
- IndexedDB iras/visszaolvasas es ujratoltes utani perzisztencia: PASS.
- Standalone export string: kulso stylesheet nelkul, beagyazott CSS-sel, tavoli CSS-import nelkul.
- Chrome konzol warning/error: 0.
- Desktop es 390 px mobil vizualis ellenorzes: PASS.
- M1 index: 1591 blueprint 8 API-laprol; kikenyszeritett tranzakcios frissites es ujratoltes utani cache-visszaallitas PASS.
- Hofstede-S1 vegyes `SCU`/`ITEM` recept, raw/normalizalt elkulonites, provenance es User Data rekordszam-megorzes PASS.
- M2: Q517 HP_MIN_500 valasztas, Highest/Target Q, ketkartya-prioritas, IndexedDB reload es teljes User Data fingerprint-megorzes PASS.
- M3: 72 commodity, 14 vehicle, 20 head, 28 module, 6 gadget; 17/17 regresszio, 5000 location 44–45 ms, teljes loadout/User Data fingerprint-megorzes PASS.
- Aktualis Chrome localhost technikai proba: 10/10 PASS; M3 desktop UI es dinamikus 1/3/5 station/module elrendezes PASS; konzol warning/error 0.
- M4: 12/12 kotelezo regresszio PASS; 1000 kartya/3000 Recipe Slot/5000 batch Combined fixture a `V001-C007` ciklusban 144 ms.
- Aktualis helyi bongeszos technikai proba: 11/11 PASS; atomi backup REPLACE roundtrip es megszakitott import rollback bitazonos fingerprinttel; Combined/Data Settings vizualis ellenorzes PASS; konzol warning/error 0.
- M5: 17/17 kotelezo regresszio PASS; 500 rekordos limit/performance fixture kb. 11 ms; `V001-C008` PASS.
- Valos UEX fetch auth fejlec nelkul: HTTP 200, 215 rekord, 24 commodity, Stanton/Pyro/Nyx, napi cache-fejlec.
- M5.1 valos mapping: 74 Wiki commoditybol 24 MATCHED, 50 UNMAPPED, 0 AMBIGUOUS; ot verziozott `VERIFIED_CANONICAL_ALIAS`, fuzzy mapping nincs.
- Aktualis helyi in-app browser technikai proba: 12/12 PASS; UEX manual refresh es User Data fingerprint-megorzes; TTL cache-hit; commit rollback; Beryl Crafting/Combined azonos snapshot; desktop/390 px PASS; warning/error 0.
- M6 automatizalt teljes regresszio: M1-M6 PASS, 14/14 standalone export eset; a tenyleges Chrome-export statikus offline eroforrasvizsgalata PASS.
- Tiszta Chrome localhost M6 proba: 12/12 PASS; Game Data sync elott/utan `06df191d` User Data fingerprint; Crafting/Combined refinery snapshot tartalmilag azonos; konzol warning/error 0.
- M6.1 `V001-C011`: teljes M1-M6 + 14 pontos UI regresszio PASS.
- Valodi Chrome localhost M6.1: 8/8 navigacio, 72 commodity, mind a negy kategoria, Agricium API-metrikak/location/refinery/default loadout, loadout mentes+reload, 13/13 technikai proba, 390 px overflow nelkul es 0 konzol warning/error PASS.
- M6.1 User Data fingerprint IndexedDB reload utan es Mining Game Data sync utan: `e6d8dec8` = `e6d8dec8`.
- C04 modellregresszio: file protokollnal 0 CSSOM `cssRules` olvasas, 0 WARN, 80 617 byte centralis CSS/snapshot egyezes; localhost CSSOM utvonal megmaradt; `V001-C012` PASS.
- C04 utani Chrome localhost: 13/13 technikai proba, 107 KiB standalone export, `e6d8dec8` fingerprint es 0 DevTools warning/error PASS.

## Meg nem bizonyitott

- Kozvetlen `file://` teljes Chrome/Edge proba: Chrome C01-C03 felhasznaloi PASS, de a C04 CSSOM-javitas utani kezi ujrateszt meg nyitott; Edge meg nem futott. Az automatizalt Chrome-felulet helyi fajl URL-t nem nyithat meg.
- A bongeszo altal tenylegesen letoltott exportfajl kulon, kikapcsolt internet melletti ujranyitasa. A letoltott fajl letezik es statikusan PASS, de ez nem bizonyitja a valos offline bongeszos ujranyitast.
- Edge kulon regresszio.

## Kezi file-kapu

A teljes, kattintasonkenti eljaras es az egyben visszakuldheto eredmenysablon: `V1_RELEASE_GATE_CHECKLIST.md`.

Amig ez nem tortent meg, a baseline fejlesztesi allapot, nem stabil kiadas.
