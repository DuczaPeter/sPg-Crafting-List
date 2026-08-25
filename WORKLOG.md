# WORKLOG.md

Idorendi munkanaplo. Uj bejegyzest mindig a friss bejegyzesek resz vegere adj hozza. Korabbi bejegyzest ne torolj.

## Aktualis osszefoglalo

- Jelenlegi allapot: `V002 STABLE RELEASE – SINGLE-FILE RELEASE GATE PASS`.
- Utolso ismert jo allapot: `V002` annotalt tag; egyetlen runtime artifact `releases/V002/sPg Crafting List.html`.
- Kovetkezo ajanlott lepes: nincs; uj fejleszteshez kulon celverzio/ciklus, tavoli pushhoz kulon engedely kell.
- Archivalt regi naplo: nincs.

## Friss bejegyzesek

Indulaskor eleg az aktualis osszefoglalot es a legutobbi 10-20 bejegyzest olvasni. A teljes regi naplot csak akkor nyisd meg, ha az aktualis feladathoz kell.

### Letrehozas

- Mi tortent: projektalap letrejott.
- Modositott fajlok: sablonbol masolt iranyito fajlok.
- Teszt vagy ellenorzes: meg nincs projekt-specifikus teszt.
- Ismert hiba: nincs ismert projekt-specifikus hiba.
- Kovetkezo ajanlott lepes: `CODEX_START_HERE.md`, `PROJECT_MAP.md` es `TEST_COMMANDS.md` kitoltese.

### Projektstruktura pontositas - 2026-08-22

- Mi tortent: a projekt celja, a tervezett HTML-fajlnev, a fejlesztesi es kiadasi mappak, valamint a strukturaellenorzes rogzitve lett.
- Modositott fajlok: `CODEX_START_HERE.md`, `README.md`, `STATUS.md`, `TASKS.md`, `PROJECT_MAP.md`, `TEST_COMMANDS.md`, `WORKLOG.md`, `USED_SKILLS.md`, `VERSION.json`, `DECISIONS.md`, `releases/.gitkeep`.
- Teszt vagy ellenorzes: `Project scaffold OK`, `JSON validation OK`, `PowerShell syntax OK`.
- Ismert hiba: nincs; alkalmazasfajl meg nem keszult.
- Kovetkezo ajanlott lepes: az alkalmazas funkcioinak es feluletenek meghatarozasa.

## Archivum szabaly

Ha a naplo hosszu lesz, regi bejegyzesek mozgathatok az `archive/` mappaba. Archivalaskor az aktualis osszefoglalo maradjon meg, es a regi naplo ne vesszen el.

### 2026-08-22T08:09:24 - V001-C001

- Cel: technikai baseline
- Tesztszint: targeted
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C001/test-summary.json`

### Technikai baseline es Chrome ellenorzes - 2026-08-22

- Mi tortent: elkeszult a `sPg Crafting List.html` alapalkalmazas kulso `Info/style.css` hasznalattal, API adapterrel, IndexedDB store-okkal, tranzakcios verziorogzitessel, Quality capability normalizalassal, RAM/session loggerrel es standalone export builderrel.
- Valos adat: a Wiki API aktualis default verzioja es a JS-300 blueprint betoltodott; Shell/Stileron `DYNAMIC`, Beryl es Savrilium `FIXED` lett.
- Teszt: `tools/validate-baseline.ps1` PASS, `V001-C001` PASS, Chrome localhost technikai proba 7/7 PASS, konzol warning/error 0.
- Perzisztencia: cache es technikai proba marker ujratoltes utan megmaradt.
- Vizualis ellenorzes: desktop es 390 px szeles mobilnezet PASS.
- Standalone export: a builder 52 KiB koruli, kulso stylesheet es tavoli font-import nelkuli HTML-t allitott elo; az alkalmazas sikeres exportot jelzett.
- Nem igazolt: az automatizalt Chrome-vezerles biztonsagi szabaly miatt a kozvetlen `file://` URL nem nyithato meg, ezert a file-modu egykattintasos proba kezzel futtatando.
- Artifact: `test-artifacts/V001-C001/browser-manual-summary.json`.

### 2026-08-22T08:56:57 - V001-C002

- Cel: M1 blueprint cache es normalizalt modell
- Tesztszint: related-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C002/test-summary.json`

### M1 verziozott cache es Blueprint Browser - 2026-08-22

- Mi tortent: elkeszult az 1591 blueprintet 8 oldalon betolto, SC-verziohoz kotott raw es normalizalt index-cache, a tranzakcios aktivalas, a lusta teljes recept-cache es a keresheto/szurheto Blueprint Browser.
- Modell: az API Aspect szint kulon Recipe Slot rekord marad; Ingredient, Quantity, Quality es teljes provenance kulon strukturat kapott, azonos materialt a normalizalas nem von ossze.
- Tesztadat: JS-300 3 slot, 1 DYNAMIC + 2 FIXED; Hofstede-S1 vegyes SCU/ITEM; duplicate-material fixture ket kulon slot; bizonytalan Quality UNKNOWN.
- Talalt hibak: a `null` mennyiseg teves numerikus felismerese, az elvart IndexedDB `AbortError` hibas tesztminositese es az azonos verzioju stale indexkulcs lehetosege javitva.
- Teszt: `tools/validate-m1.ps1` PASS, `V001-C003` PASS, Chrome technikai proba 8/8 PASS, valos `filter[output.type]` PASS, kikenyszeritett cache-frissites es rollback PASS, konzol warning/error 0.
- Perzisztencia es adatbiztonsag: ujratoltes utan 1591 normalizalt indexrekord visszaallt; raw/normalizalt payload kulon maradt; provenance teljes; Game Data sync kozben User Data rekordszam valtozatlan.
- Vizualis ellenorzes: desktop es 390 px mobil PASS.
- Nyitott: kozvetlen `file://`, exportfajl offline ujranyitasa es kulon Edge-regresszio; emiatt tovabbra sincs stabil kiadas.
- Reszletes jelentés: `docs/M1_REPORT.md`.

### 2026-08-22T09:06:22 - V001-C003

- Cel: M1 cache stale-kulcs tranzakcios csere
- Tesztszint: related-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C003/test-summary.json`

### M2 My Materials es Allocation Engine - 2026-08-22

- Mi tortent: elkeszult a globalis, tobb Quality batch-et kezelo inventory, a sorrendezheto es perzisztens Crafting List, valamint a tiszta determinisztikus Allocation Engine.
- Quality: HP-only slotnal Q500 feletti legalacsonyabb batch, funkcionális slotnal Highest Q vagy Target Q, FIXED-nel nincs strategia, UNKNOWN-nal nincs talalgatas.
- Teszt: 8/8 kotelezo M2 eset PASS; JS-300 es S00 Hofstede valos API-adat; 1000 batch/100 kartya/300 slot 0,66–0,72 masodperc.
- Bongeszo: 9/9 technikai proba, ketkartya-sorrend, Target Q ujratoltes, User Data teljes fingerprint megorzes, desktop es 390 px mobil PASS; warning/error 0.
- Adatbiztonsag: az allocation csak terv, a mentett batch-mennyiseget nem csokkenti; az 1591 rekordos Game Data sync a User Data-t valtozatlanul hagyta.
- Nyitott: kozvetlen `file://`, letoltott export offline ujranyitasa es Edge regresszio; stabil kiadas tovabbra sincs.
- UEX refinery: uj kesobbi V1 milestone-kovetelmeny, nem M1/M2 hianyossag.
- Reszletes jelentes: `docs/M2_REPORT.md`.

### 2026-08-22T09:50:12 - V001-C004

- Cel: M2 My Materials es determinisztikus allocation
- Tesztszint: related-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C004/test-summary.json`

### 2026-08-22T10:58:50 - V001-C005

- Cel: M3 mining adatok location rangsor es loadoutok
- Tesztszint: related-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C005/test-summary.json`

### M3 Mining Data, location rangsor es loadoutok - 2026-08-22

- Mi tortent: elkeszult a verziozott, raw/normalizalt mining commodity/location/equipment cache, a rendszerenkenti determinisztikus location rangsor es a tobb perzisztens mining loadout.
- Dinamikus adatok: API-facetekbol 72 commodity, 14 mining vehicle, 20 head, 28 module es 6 gadget; nincs beégetett vegleges lista.
- Loadout: materialonként tobb rekord es egy default; API- vagy USER_OVERRIDE station-szam; tetszoleges station/module/gadget; eltunt equipment megorzes es jeloles.
- Teszt: 17/17 kotelezo M3 eset PASS; 5000 location 44–45 ms; `V001-C005` PASS.
- Bongeszo: Agricium/Aphorite, MOLE 3 station, Prospector 1/override 5 station, Helix II 3 es Arbor MH1 1 module slot, ket loadout/default, reload es kikenyszeritett sync fingerprint PASS.
- Talalt hibak: indulasi commodity-valasztas, loadoutnev ujrarender, override esemeny, probe eredmenystruktura es pontos commodity Quality-szures javitva.
- Technikai kapu: Chrome localhost 10/10 PASS, konzol warning/error 0, desktop layout PASS.
- Nyitott: kozvetlen `file://`, letoltott export offline ujranyitasa es Edge regresszio; stabil kiadas nincs. UEX refinery kesobbi V1 milestone, nem M3-hiany.
- Reszletes jelentes: `docs/M3_REPORT.md`.

### 2026-08-22T12:17:10 - V001-C006

- Cel: M4 Combined Materials backup es diagnosztika
- Tesztszint: related-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C006/test-summary.json`

### 2026-08-22T12:18:29 - V001-C007

- Cel: M4 user settings import hatar
- Tesztszint: related-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C007/test-summary.json`

### M4 Combined Materials, backup es diagnosztika - 2026-08-22

- Mi tortent: elkeszult az Allocation Engine kozvetlen Combined Materials projekcioja, a teljes User Data schema 2 backupja, read-only import preview, schema 1 migracio, automatikus snapshot, atomi import/rollback es a masolhato M1-M4 diagnosztikai csomag.
- Adatbiztonsag: az ot User Data-terulet egy tranzakcioban valtozik; belso alkalmazasbeallitast backup nem irhat felul; preview, atomi REPLACE roundtrip es szimulalt abort fingerprintje valtozatlan.
- Teszt: 12/12 M4 eset es teljes M1-M3 regresszio PASS; 1000 kartya/3000 slot/5000 batch Combined fixture a `V001-C007` ciklusban 144 ms; az M4 fo `V001-C006` es a User Settings hatart javito `V001-C007` PASS.
- Bongeszo: 11/11 technikai proba, schema 1 preview migracio, `30efd6b4` fingerprint megorzes, kb. 190 KiB diagnosztikai csomag, Combined/Data Settings vizualis ellenorzes PASS; warning/error 0.
- Talalt/javitott pontok: User Settings bekerult a teljes fingerprintbe; belso settings importja tiltva; a logmasolas teljes allapotsnapshotot kapott; M4 navigacio aktivalva; a preview-fixture vart rekordszama javitva.
- Nyitott: kozvetlen `file://`, letoltott standalone export offline ujranyitasa es Edge-regresszio; stabil kiadas nincs. UEX refinery kesobbi V1 milestone, nem M4-hiany.
- Reszletes jelentes: `docs/M4_REPORT.md`; hasznalati leiras: `BACKUP_RESTORE.md`.

### 2026-08-22T13:02:33 - V001-C008

- Cel: M5 UEX refinery mapping ranking cache es kartyasnapshot
- Tesztszint: related-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C008/test-summary.json`

### M5 UEX Refinery Data es kartyaintegracio - 2026-08-22

- Mi tortent: elkeszult a kulon UEX raw/normalizalt/dataset cache, napi TTL es kezi sync, az atomi aktivalas/rollback, a biztonsagos Wiki–UEX mapping es a `value_month` naprendszerenkenti rangsor.
- Valos adat: auth fejlec nelkuli HTTP 200; 215 rekord, 24 UEX commodity, Stanton/Pyro/Nyx; 19/72 Wiki exact MATCHED, 53 UNMAPPED, 0 AMBIGUOUS.
- Kartya: a Blueprint Recipe Slot API `commodityUuid` kapcsolata alapjan az aktiv Crafting Card es Combined Materials ugyanazt a mining+refinery snapshotot hasznalja; a hianyzo location reszlet lazy cache-betoltest kapott.
- Teszt: 17/17 M5 es teljes M1-M4 regresszio PASS; 500 rekordos fixture kb. 11 ms; `V001-C008` PASS; valos UEX probe PASS.
- Bongeszo: 12/12 technikai proba, manual sync fingerprint-megorzessel, TTL reload cache-hit, szimulalt commit rollback, Beryl kartya/Combined azonos snapshot, desktop es 390 px PASS; warning/error 0.
- Talalt/javitott pontok: Wiki taxonomy-utotag exact normalizalasa; regi kartya commodity UUID visszakovetese a blueprint cache-bol; kartya mining location lazy load; UEX epoch datum ISO-normalizalasa.
- Nyitott: M6 vegleges standalone export/refencia-UI; kozvetlen `file://`, offline export-ujranyitas es kulon Edge-regresszio. Stabil kiadas nincs.
- Reszletes jelentes: `docs/M5_REPORT.md`.

### 2026-08-22T13:42:34 - V001-C009

- Cel: M5.1 verziozott canonical Wiki UEX alias korrekcio
- Tesztszint: related-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C009/test-summary.json`

### 2026-08-22T13:59:19 - V001-C010

- Cel: M6 standalone export referencia UI es V1 acceptance
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C010/test-summary.json`

### M6 release candidate es kezi V1 acceptance atadas - 2026-08-22

- Az M5.1 es az M6 implementacio felhasznaloi elfogadast kapott release candidate allapotban; uj feature milestone nem indul.
- Az automatizalt M1-M6 regresszio, Chrome localhost 12/12 technikai proba, User Data fingerprint, Crafting/Combined snapshot, konzol es statikus standalone ellenorzes PASS maradt.
- Nem lett PASS-nak jelolve a kozvetlen Chrome `file://`, a tenyleges kikapcsolt internet melletti export-ujranyitas es a kulon Edge regresszio.
- Elkeszult a kattintasonkenti `V1_RELEASE_GATE_CHECKLIST.md`, Chrome/Edge tesztadatokkal, PASS-feltetelekkel, hibabizonyitek-listaval es egyben visszakuldheto eredmenysablonnal.
- Stabil commit, tag vagy release nem keszult; a release gate `manual-acceptance-pending`.

### 2026-08-24T08:58:26 - V001-C011

- Cel: M6.1 V1 UI completeness audit
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C011/test-summary.json`

### M6.1 UI Completeness Audit es Chrome-kapu - 2026-08-24

- Mi valtozott: a disabled `Material Database` es `Mining Loadouts` placeholder a meglevo M3/M5 modellek teljes UI-kapuja lett; a felso navigacio pontosan 8 enabled celt tartalmaz.
- Material Database: 72 rekordos mining index, nev/UUID kereses, All/Ship/Vehicle/FPS/Harvestable kategoriak, radar/API metrikak, meglevo location- es refinery-rangsor, valamint mentett Default Loadout.
- Mining Loadouts: a meglevo `userLoadouts` editor kulon felso navigaciot kapott, uj adatmodell nelkul.
- Talalt/javitott hiba: simitott scroll alatt gyors navigacional minden masodik kattintas elveszhetett; determinisztikus `auto` scroll utan 8/8 valodi Chrome-kattintas PASS. A regi commodity detail-cache raw rekordbol M6.1 normalizalast kapott, igy az API `tier`/instability/resistance adatok friss halozati kenyszer nelkul megjelennek.
- Automatizalt teszt: teljes M1-M6 es 14 M6.1 UI-eset PASS; `V001-C011` PASS.
- Chrome localhost: 13/13 probe, Material Database kategoriak, Agricium, Prospector/Helix I/Brandt/BoreMax Default Loadout, IndexedDB reload, Game Data sync es 390 px PASS; fingerprint `e6d8dec8` maradt; konzol warning/error 0.
- Dokumentacio: `docs/M6_1_REPORT.md`, frissitett `V1_RELEASE_GATE_CHECKLIST.md`, `docs/TECHNICAL_BASELINE.md` es `test-artifacts/V001-C011/browser-manual-summary.json`.
- Implementacios commit: `bb24bf9` (`feat: complete M6.1 UI audit`).
- Nyitott: a stabil V1-et tovabbra is blokkolja a kezi Chrome `file://`, a valos offline export-ujranyitas es a kulon Edge regresszio. Stabil tag/release nem keszult.

### 2026-08-24T09:35:01 - V001-C012

- Cel: C04 file standalone export CSS fallback
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C012/test-summary.json`

### C04 file standalone export CSS javitas - 2026-08-24

- Felhasznaloi bizonyitek: Chrome 151 normal `file://` futasban C01-C03 PASS, C04 12/13 FAIL; a centralis CSS normalisan betoltodott, de `cssRules` olvasas `SecurityError` lett.
- Hibalanc: `CSS_CSSOM_READ_FAILED -> EXPORT_FAILED -> TECHNICAL_CHECK_FAILED`; a tobbi 12 technikai ellenorzes PASS volt.
- Javitas: a fo kulso `Info/style.css` byte-azonos, SHA-256-tal jelolt base64 snapshotja generatorral kerul a HTML nem vegrehajthato template elemebe. File modban az export ezt hasznalja, CSSOM olvasas nelkul; HTTP alatt a regi utvonal maradt.
- Karbantarthatosag: `validate-baseline.ps1` minden regresszioban driftet ellenoriz; a snapshot nem masodik kezzel karbantartott stilusrendszer.
- Teszt: 80 617 byte es `463be393...e24bb` SHA-egyezes, file CSSOM olvasas 0, WARN 0; teljes M1-M6.1 + C04 regresszio es `V001-C012` PASS.
- Chrome localhost: 13/13 technikai proba, 107 KiB standalone export, fingerprint `e6d8dec8` valtozatlan, DevTools warning/error 0.
- Nyitott: a normal Chrome `file://` C04 kezi ujrateszt `NOT_TESTED`; C05 es a tobbi acceptance csak C04 PASS utan folytathato. Stabil tag/release nincs.

### 2026-08-24T11:11:52 - V001-C013

- Cel: V1 pre-release automated acceptance
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C013/test-summary.json`

### V1 pre-release acceptance lezaras - 2026-08-24

- Kezi Chrome: C01-C17 PASS; B/C/D User Data fingerprint mindharomszor `2667ea55`, User Data-vesztes nem tortent, a vegso C17 konzol tiszta.
- Standalone: O01-O03 es O05-O06 PASS; O04 `NOT TESTED`, mert a felhasznalo nem kert Windows-szintu halozatlekapcsolast. Edge E01-E10 `NOT TESTED`, mert a felhasznalo nem kert kulon Edge acceptance-et.
- Automatizalt: teljes M1-M6.1 + C04 PASS; az elo SC API `4.9.0-LIVE.12232306`, az elo UEX mapping `24 MATCHED / 50 UNMAPPED / 0 AMBIGUOUS`.
- CSS: a kozponti fajl es export snapshot 80 617 byte-tal, `463be393...e24bb` SHA-256-tal byte-azonos; drift nincs.
- Uj automatikus JS-300 export: 92 083 byte, `89b3c196...21892c` SHA-256, embedded CSS, ervenyes snapshot JSON, kulso runtime/network dependency nelkul.
- Dokumentacio: `docs/V1_PRE_RELEASE_ACCEPTANCE_REPORT.md`; bizonyitek: `test-artifacts/V001-C013/`.
- Vegso allapot: release candidate, nem stabil V1. Release commit/tag/verzioemeles nem keszult; a kovetkezo lepes release-waiver dontes O04 es Edge kapurol.

### 2026-08-24T11:26:14 - V001-C014

- Cel: V1 stable release final regression
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V001-C014/test-summary.json`

### V001 stabil release waiverrel - 2026-08-24

- Felhasznaloi approval: O04 es Edge E01-E10 `NOT TESTED` eredmenye kifejezett release-waiver; egyik sem lett PASS-ra atirva.
- Vegso automatizalt kapu: `V001-C014`, teljes M1-M6.1 + C04 regresszio PASS.
- Stabil bundle: `releases/V001/sPg Crafting List.html` + `releases/V001/Info/style.css`; a forrastol csak a harom `V001-dev -> V001` verziofelirat ter el.
- Integritas: HTML `c422c4da...c259`, CSS `463be393...e24bb`; teljes release-validator PASS.
- Dokumentacio: `CHANGELOG.md`, `docs/V1_RELEASE_REPORT.md`, `releases/V001/RELEASE.md`, `SHA256SUMS.txt`, valamint frissitett statusz/verzio/checklist/baseline.
- Vegso statusz: `V1 STABLE RELEASE – APPROVED WITH ACCEPTED MANUAL TEST WAIVERS`; release tag: `V001`.
- Tavoli push, publikacio vagy main merge nem tortent. Visszaallas: `V001` tag vagy a fagyasztott `releases/V001/` bundle.

### V002 egyfajlos audit es implementacio - 2026-08-24

- Uj branch: `develop/V002`; celverzio: `V002-dev`. A `V001` tag es `releases/V001/` tartalma valtozatlan.
- Audit: a linkelt CSS mellett base64 snapshot, CSSOM/fetch/IndexedDB fallback es fajlfuggo baseline/M6/M6.1/C04 tesztek is azonositasra kerultek.
- Implementacio: egyetlen `#spgApplicationStyles` style blokk a fo HTML-ben; az export ezt olvassa. Kulso fontimport, stylesheet link es duplikalt snapshot nincs.
- Tesztek: az embedded CSS verifier, M6/M6.1 es C04 a HTML-bol olvas; az ures ideiglenes mappaban csak a HTML marad, helyi sidecar 0.
- Elozetes teljes M1-M6.1 + C04 futas PASS. A kovetkezo kapu a `V002-C001` ciklus, majd valos Chrome `file://` proba.
- Audit/terv: `docs/V002_SINGLE_FILE_AUDIT.md`.

### 2026-08-24T12:05:50 - V002-C015

- Cel: V002 one-file embedded CSS application
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V002-C015/test-summary.json`

### 2026-08-24T12:06:39 - V002-C001

- Cel: V002 one-file embedded CSS application
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V002-C001/test-summary.json`

### V002-C001 egyfajlos regresszio es Chrome-atadas - 2026-08-24

- Ciklusszam javitas: az elso futas tevesen a V001 `C014` ciklust folytatta `V002-C015` azonosittal. A `tools/new-cycle.ps1` most csak azonos celverzio ciklusat novelheti; a V002 kanonikus elso ciklusa helyesen `V002-C001`. A C015 PASS summary megorzesre kerult, de nem ez az aktualis ciklus.
- Automatizalt: a `V002-C001` teljes M1-M6.1 + C04 egyfajlos regresszio PASS; embedded CSS 80 548 byte, SHA-256 `14a84519...c00b2`; sidecar igeny 0.
- Chrome localhost: V002-dev, 8 navigacio, 13/13 technikai proba, SC `4.9.0-LIVE.12232306`, 1591 blueprint, mining 72/20/14, UEX 215 es mapping 24/50/0 PASS.
- Perzisztencia: reload es UEX refresh elott/utan a User Data fingerprint `e6d8dec8`; konzol warning/error 0.
- Export: a builder 113 373 byte-os standalone tartalmat keszitett; a bongeszo download event idotullepes miatt nincs kulon PASS-nak jelolve, az M6/C04 tartalomteszt PASS.
- `file://`: a Chrome-vezerlo URL-policy elutasitotta a navigaciot. Nem tortent megkerules, es a localhost nem lett file-bizonyitekkent elszamolva; a kapu `NOT TESTED`, kezi ellenorzes szukseges.
- Dokumentacio: `docs/V002_SINGLE_FILE_REPORT.md`, `test-artifacts/V002-C001/browser-manual-summary.json` es frissitett projektvezerlo fajlok.
- V001: tag `b22dbc3c2ef0765e30aa3806537854298c873dff`, a `releases/V001/` diffje ures. Stabil V002 release/tag nem keszult.

### V002 valos Chrome file:// kezi gate PASS - 2026-08-24

- Felhasznaloi ellenorzes: az onallo `sPg Crafting List.html` a Downloads mappabol kozvetlen `file://` modban megnyilt; verzio `V002-dev · schema 6`.
- Technical Baseline: 13 PASS / 0 FAIL; IndexedDB roundtrip, Wiki API, M2 allocation, M3 Mining, M4 Combined/backup rollback, M5 UEX es M6.1 8/8 PASS.
- Standalone HTML export PASS; `externalStylesheet: false`, `externalResource: false`, diagnostic errors 0.
- A korabbi `NOT TESTED / AUTOMATION BLOCKED` V002 file-gate status bizonyitek alapjan PASS-ra valtozott. Az automatizalasi blokkolas torteneti megjegyzeskent megmaradt.
- Zaras utani ellenorzes: teljes aktualis M1-M6.1 + C04 regresszio PASS; V001 fagyasztott bundle es SHA-256 validacio PASS.
- Alkalmazasfunkcio nem valtozott; a V001 tag es fagyasztott release erintetlen. Stabil V002 release/tag ebben a korben nem keszul.

### 2026-08-24T12:35:15 - V002-C002

- Cel: V002 stable single-file release final regression
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V002-C002/test-summary.json`

### V002 stabil single-file release - 2026-08-24

- Felhasznaloi approval: a stabil V002 release commit es annotalt `V002` tag kifejezetten engedelyezve.
- Vegso ciklus: `V002-C002`, teljes M1-M6.1 + C04 regresszio PASS.
- Release artifact: `releases/V002/sPg Crafting List.html`, 489 492 byte, SHA-256 `de2d59b4...f2357`; runtime fajlok szama 1, helyi sidecar 0.
- Stabil verzio: a tesztelt forrastol csak a harom `V002-dev -> V002` runtime-jelolesben ter el; funkcio, IndexedDB schema es User Data modell valtozatlan.
- Elo API: Wiki JS-300 HTTP 200 / 3 slot; UEX HTTP 200 / 215 rekord, Authorization nelkul.
- Browser acceptance: localhost warning/error 0; valos Chrome `file://` 13 PASS / 0 FAIL, standalone export PASS, diagnostic error 0.
- V001: tag `b22dbc3c2ef0765e30aa3806537854298c873dff` es fagyasztott bundle valtozatlan.
- Dokumentacio: `docs/V002_RELEASE_REPORT.md`, `releases/V002/RELEASE.md`, `SHA256SUMS.txt`; validator `tools/validate-v002-release.ps1`.
- Tavoli push, publikacio vagy main merge nem tortent. Visszaallas: `V002` tag vagy az egyetlen release HTML; V001 kulon tovabbra is elerheto.

### V002 GitHub- es Discord-dokumentacio - 2026-08-24

- A `README.md` a stabil V002 teljes angol GitHub-dokumentacioja lett; a `README_HU.md` ennek termeszetesen megfogalmazott, azonos lefedettsegu magyar valtozata.
- A `DISCORD_POST_HU.md` rovid, kozvetlen magyar inditasi es funkcio-osszefoglalo, bemasolhato Discordra.
- A leirasok a stabil V002 HTML nyolc modulja, a V002 release-riport es a bizonyitott release-adatok alapjan keszultek; bizonytalan vagy uj funkcio nem kerult bele.
- Ellenorzes: helyi Markdown linkek PASS; a harom publikus dokumentumban regi ketfajlos telepitesi szoveg, `V001` es `Info/style.css` nincs; `git diff --check` PASS.
- Release-integritas: a teljes V002 validator M1-M6.1 + C04, single-file kapu es elo Wiki/UEX probe PASS; a `V002` annotalt tag tovabbra is `b326aaff5838aafd5b1f13b16982c29a0e150e35`, a release HTML SHA-256 tovabbra is `de2d59b4...f2357`.
- Alkalmazaskod, `VERSION.json`, V002 tag es `releases/V002/` artifact nem valtozott. Tavoli push, uj release, tag vagy verzioemeles nem tortent.
- Modositott dokumentacio: `README.md`, `README_HU.md`, `DISCORD_POST_HU.md`, `PROJECT_MAP.md`, `STATUS.md`, `TASKS.md`, `USED_SKILLS.md`, `WORKLOG.md`.
- Nyitott ellenorzes nincs. Visszaallas: a kulon dokumentacios commit `git revert <commit>` paranccsal visszafordithato a stabil release erintese nelkul.

### V002 GitHub tortenetintegracio es publikacio - 2026-08-24

- Biztonsagi referenciak: `codex/backup-v002-local-11a554d` a korabbi helyi HEAD-re es `codex/backup-origin-main-de3d452` a korabbi tavoli `main` allapotra; egyik backup branch sem lett pusholva.
- Audit: remote-only `index.html` es `sPg Crafring List.zip`; eltero kozos fajlok a regi V001 `README.md` es `README_HU.md`. Az `index.html` blobja azonos a stabil V002 release HTML-lel; a ZIP a stabil `b326aaff...` projektpillanatkep, uj alkalmazaskod nelkul.
- Integration merge: `7b0104d260df1c5a0e77756f34d1c76f1e5b3e8d`, szulok `11a554d...` es `de3d452...`; mindket elozo tortenet megmaradt, a remote-only fajlok megorzodtek, a helyi V002 README-k lettek elsodlegesek.
- A kozos integration HEAD normal fast-forward push-sal, force nelkul kerult a GitHub `main` branchre; a valtozatlan annotalt `V002` tag dereferalt commitja tovabbra is `b326aaff5838aafd5b1f13b16982c29a0e150e35`.
- GitHub Release: `https://github.com/DuczaPeter/sPg-Crafting-List/releases/tag/V002`. A GitHub az asset szokozos nevet `sPg.Crafting.List.html` alakra normalizalta; az API `browser_download_url` kerult a README-kbe.
- Visszatoltes: HTTP 200, 489 492 byte, SHA-256 `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357` PASS.
- Ellenorzes: V002 release validator, single-file gate, elo Wiki/UEX, Markdown-linkek, vedett fajl-diff es ancestry kapuk PASS; V001 es a stabil V002 HTML valtozatlan.
- Visszaallas: a README dokumentacios commit `git revert <commit>` paranccsal visszafordithato; az integration elotti helyi/tavoli allapot a ket helyi backup branchrol elerheto.

### 2026-08-24T15:31:57 - V003-C001

- Cel: V003 farm recommendation primary filter es quality ranking
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V003-C001/test-summary.json`

### V003 farm recommendation audit es implementacio - 2026-08-24

- Branch/cel: `develop/V003`, `V003-dev`; stabil V003 release/tag nem keszult, V001/V002 fagyasztva maradt.
- Elo API + hivatalos forraskod audit: 40 mineable commodity, 2 505 location, 3 246 resource, 4 641 target-material; az `is_current` es `materialIndex` nem primary-jelzo.
- Javitas: exact target UUID + canonical resource-label primary gate, secondary kizaras, group probability/spawn → relative probability/occurrence → quantized/range Quality rangsor.
- Projekcio: rendszerenkent legfeljebb egy normal es egy space ajanlas, teljes decision trace; Material Database, Crafting/Combined es standalone export kozos fuggvenyt hasznal.
- Automatizalt: `V003-C001` teljes regresszio es elo Aluminum/Agricium/Stileron API-proba PASS; M3 24 eset, 5 000 location kb. 131 ms.
- Chrome localhost: 13/13 PASS, fingerprint `e6d8dec8` reload utan is valtozatlan, warning/error 0, Material Database vizualisan PASS.
- Chrome `file://`: automatizalasi URL-policy miatt BLOCKED, nem lett PASS; kezi kapu nyitva.
- Standalone artifact: 92 386 byte, SHA-256 `3d118c1e...92592ce`; external runtime dependency nincs.
- V002: tag commit `b326aaff...150e35`, release HTML SHA-256 `de2d59b4...9f2357`; valtozatlan.
- Riport: `docs/V003_FARM_RECOMMENDATION_REPORT.md`. Visszaallas: a V003 fejlesztesi commit revertje vagy a fagyasztott V002 tag/release.

### 2026-08-24T17:35:18 - V003-C002

- Cel: V003 mining recommendation emberi farmhely-csoportok
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V003-C002/test-summary.json`

### V003-C002 emberi farmhely-csoportositas - 2026-08-24

- Scope: a C001 primary/secondary kapu, spawn -> occurrence -> Quality rangsor es NORMAL/SPACE szetvalasztas valtozatlan; uj logika csak a ranking utani presentation retegben.
- Modell: `groupLabel`, `memberSummary`, bizonyitekos `groups[]`; a teljes raw location nev/ID, provider, parent, type es resource adat a recommendation/diagnosztika resze maradt.
- Lagrange: exact provider + system + parent + resource identity; rovid `Lagrange X` label es konkret LP-lista. Az `allLagrangePoints` csak minden relevans LP teljes rankazonossaganal igaz.
- Pyro: exact `HPP_Pyro_AkiroCluster` / `HPP_Pyro_DeepSpaceAsteroids`, Pyro SPACE/type, kozos parent/resource es rank; live adatban Akiro+RMB, a RAB jovobiztos provider-gate-es fixture, nem allitott live jelenlet.
- Mining Base: az `Aaron Halo` csoportot az exact `HPP_AaronHalo` provider, azonos system/resource/rank bizonyitja; a prefix csak a mar bizonyitott member-summaryhoz hasznalt.
- Elo API PASS: Aluminum/Pyro 86 RMB -> `Pyro Deep Space Asteroids`; Aluminum/Stanton 50 Mining Base + 1 system record -> `Aaron Halo`; Agricium/Stanton -> `Lagrange D`; Stileron/Pyro 87 raw rekord -> `Pyro Deep Space Asteroids`.
- Teszt: teljes M1-M6.1 + C04 PASS; M3 33 eset es 5 000 location kb. 134 ms; C001 secondary-exclusion/ranking PASS.
- Localhost UI: Material Database Aluminum/Agricium grouped label/summary vizualisan es DOM-ban PASS; warning/error konzol 0. Ezt Codex browser automation futtatta, a `file://` manual kaput nem helyettesiti.
- Standalone: grouped label/summary PASS, 92 792 byte, SHA-256 `f7bdb1f2...a36e0`; a normal exportkartya nem listazza a technikai RMB/RAB neveket.
- Chrome `file://`: USER MANUAL PASS, minden Technikai baseline sor zold; a bizonyitekot a felhasznalo futtatta, nem Codex automation.
- V002: tag commit `b326aaff...150e35`, stabil HTML SHA-256 `de2d59b4...9f2357`; valtozatlan. Stabil V003 release/tag nem keszult.
- Visszaallas: a C002 commit revertje; stabil visszaallasi alap a valtozatlan `V002` tag/release.

### 2026-08-24T18:28:05 - V003-C003

- Cel: V003 material canonical naming es display cleanup
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V003-C003/test-summary.json`

### V003-C003 material canonical naming es display cleanup - 2026-08-24

- Elo audit: Wiki `4.9.0-LIVE.12232306`, 206 teljes commodity es 72 aktiv mineable/harvestable rekord; raw nev-, UUID-, category-, method-, group- es `refined_version` adatok megorizve.
- Resolver: `rawName`, `canonicalName`, `displayName`, `aliases`, `nameSource`, `nameStatus`; exact UUID-alias -> biztonsagos terminalis suffix -> API exact sorrend, fuzzy matching nelkul.
- Eredmeny: 71 resolved, 11 explicit alias, 25 suffix-normalized, 35 API-exact, 1 unmapped/rejtett technikai fragment, 0 ambiguous, 64 user-facing rekord.
- Duplicate: Copper, Gold, Iron, Lindinium, Riccite, Silicon es Tungsten csak az API `refined_version` kapcsolata alapjan egyesul; bizonyitek nelkuli canonical egyezes kulon marad.
- Fogyasztok: Material Database/search/detail/select, Mining Loadouts, My Materials, Crafting, Combined, farm, UEX megjelenites, standalone export es diagnosztika ugyanazt a projekciot hasznalja.
- Teszt: celzott 20 eset (mas UUID es nem ellenorzott SC-verzio alias-elutasitasaval), elo nevaudit, teljes M1-M6.1 + C04 + C001/C002 es V002-integritas PASS; standalone export PASS.
- Chrome localhost: 14/14 PASS; Tungsten egy tiszta sor, raw `Agricium (Ore)` es `Beradom` alias kereses PASS; fingerprint `e6d8dec8` reload utan valtozatlan; alkalmazas WARN/ERROR 0.
- A korabbi valos Chrome `file://` kapu tovabbra is USER MANUAL PASS, nem Codex automation. V002 valtozatlan; stabil V003 release/tag nem keszult.
- Riport: `docs/V003_MATERIAL_NAMING_REPORT.md`. Visszaallas: a C003 commit revertje vagy a fagyasztott V002 tag/release.

### V003-C004 Radar Signature registry es Top-3 recommendation - 2026-08-24

- Forras: `Info/Radar Signature.png`, SHA-256 `f9c6e362...cabdc6`, 1182x879; a kep megorzott projektforras, runtime fugges nincs.
- Registry: 26 kozvetlen Ship sor + 7 Wiki kategoriaval bizonyitott ROC/FPS material = 33 verified rekord; 3 kategoriaszabaly. Elo 72 raw / 64 user-facing auditban 33 verified es 31 `Nincs adat`.
- Mezo-hatar: a Wiki `signature` csak `API_RAW_NOT_USER_FACING` diagnosztika, user-facing fallback nincs.
- Top-3: C001 primary gate es spawn -> occurrence -> Quality valtozatlan; utanuk rendszerenkent/kornyezetenkent legfeljebb 3 dense rank tier, tie azonos helyezessel, teljes raw trace-szel. Nem-Ship SPACE lista elnyomva.
- SCMDB: read-only PTU referencia; 6 MATCH, 1 EXPLAINED_DIFFERENCE, 2 UNVERIFIED. Szazalek nem ranking input, runtime dependency nincs; Yela Belt/Terminus Ring bizonyitek hianyaban nem kerult be.
- Chrome altal talalt javitasok: regi detail cache cluster-listajanak null-safe kezelese; regi index-cache kozos radar-projekcioja, hogy lista/reszlet ne terjen el.
- Automatizalt: celzott C004, elo Wiki/SCMDB audit, teljes M1-M6.1 + C04 + C001-C003, standalone export es V002-integritas PASS.
- Standalone Top-3 artifact: 95 529 byte, SHA-256 `8c42dbf9...72d63b8d`; kulso runtime dependency nincs.
- Valodi Chrome localhost: 15/15 PASS; Aluminum Stanton 3 NORMAL + 3 SPACE, unmapped `Nincs adat`, vizualis PASS; fingerprint B/C/D `e6d8dec8`; konzol warning/error 0.
- A felhasznalo korabbi valos Chrome `file://` kapuja tovabbra is MANUAL PASS bizonyitek, nem Codex automation. Stabil V003 release/tag nem keszult; V002 tag/artifact valtozatlan.
- Riport: `docs/V003_C004_RADAR_TOP3_REPORT.md`. Visszaallas: a C004 commit revertje vagy a fagyasztott V002 tag/release.

### 2026-08-24T20:17:53 - V003-C005

- Cel: V003 C004 consistency closure es final-card roadmap lock
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V003-C005/test-summary.json`

### V003-C005 C004 consistency closure es final-card roadmap lock - 2026-08-24

- Lagrange F verdict: a primary `MineableRock_AsteroidCommon_Aluminum` negy locationje exact UUID+label gate-tel INCLUDED, SPACE dense rank 2; a testver `...Corundum` resource Aluminum mellékanyaga SECONDARY_EXCLUDED. A Top-3 nem valtozott, csak a C004 SCMDB auditmondat javult.
- Radar reconciliation: 72 raw / 64 user-facing / 33 VERIFIED / 31 UNMAPPED; ujonnan verified rekord 0. Mind a 7 aktiv ROC/FPS material exact Wiki flag+method alapjan mar C004-ben is verified volt.
- Carinite, Jaclium, Sadaryx es Saldynium: minden mining flag false, method/system/location nincs; Wiki `signature=3000` nem user-facing bizonyitek, ezert jogos `UNKNOWN / Nincs adat`.
- Forrashierarchia: Radar PNG user-facing canonical; minden mas mining adat Wiki `4.9.0-LIVE.12232306`; SCMDB `4.10.0-ptu.12497254` csak read-only sanity reference.
- Automatizalt: C001-C005, teljes M1-M6.1 + C04, elo Wiki audit, standalone export es V002-integritas PASS. Standalone artifact 95 529 byte, SHA-256 `8c42dbf9...72d63b8d`.
- Chrome localhost: 15/15 PASS; Aluminum/Stanton SPACE `Aaron Halo`, `Lagrange F`, `Lagrange A`; Carinite `Nincs adat`; reload fingerprint `e6d8dec8`; konzol warning/error 0.
- Roadmap: V003-C006 adatkontraktus, C007 card-first UI/szinek, C008 in-app detail/deep link, C009 Advanced/Diagnostics, C010 standalone parity/acceptance.
- Alkalmazaskod nem valtozott. Korabbi felhasznaloi valos Chrome `file://` kapu MANUAL PASS maradt, nem Codex automation. C006 csak uj felhasznaloi file-ujrateszt es kulon utasitas utan indul.
- V002 tag/artifact valtozatlan; V003 release/tag nem keszult. Visszaallas: a C005 commit revertje vagy a fagyasztott V002 tag/release.

### 2026-08-24T21:09:34 - V003-C006

- Cel: Final Crafting Card Layout + complete material snapshot hydration
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V003-C006/test-summary.json`

### V003-C006 Final Crafting Card + complete material snapshot hydration - 2026-08-24

- A kartyafejlec a valos Wiki item detailbol mutatja a JS-300 `Size 1`, `Military`, `Power Plant`, `Grade A` es `15 perc` adatait; a kartya requested quantity/max craftable es slotonkenti terv az M2 Allocation Engine valtozatlan eredmenye.
- Uj kozos hydration: `hydrateMaterialIntelligenceRecords()` + `ensureMaterialIntelligenceHydrated()`; cache eloszor, engedelyezett halozatnal Wiki detail, majd a meglevo C001-C005 normalizer/ranking/naming/radar es M5 UEX snapshot.
- A UI es export kozos `buildFinalCraftingCardViewModel()` adatot hasznal. A final kartyan nincs lathato raw UUID/provider/resource/debug/schema; material/blueprint/mining/refinery/radar interakcios data-hookok elokeszitve, C008 reszletnezet nelkul.
- Fresh-cache Chrome localhost: Material Database elozetes megnyitasa nelkul mindharom JS-300 material Radar+Mining snapshotot kapott; Beryl/Savrilium UEX elerheto, Stileron exact `Nincs biztonságos UEX refinery adat`.
- Chrome reload: quantity `2`, max `3`, harom inventory batch es snapshot megmaradt; User Data fingerprint `39341365 -> 39341365`; alkalmazas-konzol WARN/ERROR 0.
- A Chrome-bol letoltott `sPg Crafting List - JS-300 (2).html`: 448 917 byte, SHA-256 `a834c84801639057b9a7f3e6a14f8a5a881bd45562d411159c1d5a6ef52542fb`; embedded CSS, ervenyes snapshot JSON, 3 material, 6 location, 4 refinery system es 0 kulso network/runtime resource.
- Automatizalt C006 + C001-C005 + teljes M1-M6.1 + C04 + elo Wiki audit + standalone + fagyasztott V002 integritas PASS. A felhasznalo korabbi valos Chrome `file://` C005 kapuja MANUAL PASS bizonyitek, nem Codex automation.
- V002 tag/artifact valtozatlan; V003 stabil release/tag es C007 nem keszult. Visszaallas: a C006 commit revertje vagy a fagyasztott V002 tag/release.

### 2026-08-24T22:30:00 - V003-C007

- Cel: Radar Signature Material Color System.
- Tesztszint: full-regression.
- Eredmeny: PASS.
- Artifact: `test-artifacts/V003-C007/test-summary.json`.

### V003-C007 Radar Signature Material Color System - 2026-08-24

- Scope: csak a canonical forraskepbol bizonyitott material-identitas; C006 hydration/view-model/allocation, C001-C005 ranking/grouping/Top-3/naming/Radar/UEX valtozatlan.
- Kepaudit: `Info/Radar Signature.png`, `1182x879`, SHA-256 `f9c6e362...cabdc6`; a Node pixeldekoder 33/33 registry mintapixelt ellenorzott.
- Registry: `V003-C007-1`, 33 exact Wiki UUID-s `VERIFIED_COLOR`; 31 user-facing `UNMAPPED_COLOR` neutralis fallback. Source hue a foreground/border, a background ugyanennek 16%-os UI tintje.
- Resolver: `resolveMaterialColor()` exact Wiki UUID, majd egyedi exact canonical nev; fuzzy/rarity/Quality/signature/SCMDB/mining category/random/hash kovetkeztetes nincs.
- Fogyasztok: Crafting Card token es Radar accent, My Materials, Combined Materials, Material Database, standalone export; kozos CSS-valtozok es C006 data-hook kompatibilitas.
- JS-300: Stileron `#ffaa33`, Beryl `#3399ff`, Savrilium `#ffaa33`; quantity 2, max 3, HP_MIN_500/FIXED, Radar/Mining/UEX valtozatlan automatizalt fixture-ben.
- Automatizalt kapu: C007 audit/tesztek, C001-C006, M1-M6.1, C04, standalone es V002-integritas PASS. Artifact: `test-artifacts/V003-C007/`.
- Chrome localhost: Technical Probe PASS; 33/31 registry audit, 47 rendered verified es 31 neutralis unmapped elem; My Materials/Combined/Material Database/Crafting vizualis PASS; fingerprint `52f14d76 -> 52f14d76`; konzol warning/error 0.
- Standalone: automatizalt artifact 108220 byte, SHA `4967a01c...b831fb`, kulso runtime resource 0. A valodi Chrome download szinregistry/snapshot/resource ellenorzese PASS; a Codex browser URL policy a letoltott `file://` navigaciot blokkolta, megkerules nem tortent.
- Kezi bizonyitek: a felhasznalo C006 valodi Chrome `file://` Crafting Card, quantity recalc, material hydration es standalone export probat PASS-kent jelentette; nem Codex automation.
- V002: tag commit `b326aaff...150e35`, stabil HTML SHA `de2d59b4...9f2357`; valtozatlan. V003 tag/release es C008 nem keszult.
- Visszaallas: a C007 commit revertje; stabil visszaallasi alap a valtozatlan `V002` tag/release.

### 2026-08-25T06:05:03 - V003-C008

- Cel: Single-file Detail View + Star Citizen Wiki deep links
- Tesztszint: full-regression
- Eredmeny: PASS
- Indok: Selected test command exited with code 0.
- Checkpoint: not-requested
- Artifact: `test-artifacts/V003-C008/test-summary.json`

### V003-C008 Single-file Detail View + Star Citizen Wiki deep links - 2026-08-25

- A C006 kattinthato hookok most ugyanazon HTML-en beluli blueprint/item, material, Radar Signature, mining es UEX refinery detailt nyitnak; a C001-C007 modellek es az Allocation Engine nem valtoztak.
- A `c008DetailController` hash/history route-ot, reload-helyreallitast, bongeszo Visszat es invalid-target fallbacket kezel. A Chrome-proba talalta es javitotta, hogy a sajat `Vissza a Crafting Cardhoz` gomb detail-lancban csak egy lepest ment vissza; most a route-depth alapjan kozvetlenul a kartyahoz ter vissza.
- Wiki resolver: exact API `web_url` -> auditalt API slug canonical -> `NO_PROVEN_WIKI_URL`; fuzzy/nevbol kepzett link nincs. Elo audit PASS: JS-300, Stileron, Beryl, Savrilium oldalak HTTP 200.
- Standalone export: 13 snapshot-detail target, interaktiv item/material/radar/mining/refinery navigacio, history/reload/invalid fallback, embedded CSS/JS es 0 kulso runtime resource. API-hivas nincs; a bizonyitott Wiki link csak opcionális kulso kattintas.
- Automatizalt: C008 celzott teszt/audit, C001-C007, teljes M1-M6.1 + C04, standalone es V002-integritas PASS. Repair-cycle: `test-artifacts/V003-C008/test-summary.json`.
- Valodi Chrome localhost: Technical Probe 15/15; JS-300/Stileron/Beryl/Savrilium, Radar/Mining/Refinery, browser Back, sajat back, reload, invalid target es desktop vizualis layout PASS. Fingerprint `e6d8dec8 -> e6d8dec8`; main es standalone konzol warning/error 0.
- Korabbi C007 valodi Chrome `file://` kapu: USER MANUAL PASS; a felhasznalo futtatta, nem Codex automation. V002 tag/artifact valtozatlan; V003 tag/release es C009 nem keszult.
- Visszaallas: a C008 commit revertje; stabil visszaallasi alap a valtozatlan `V002` tag/release.
