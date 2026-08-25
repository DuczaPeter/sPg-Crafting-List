# USED_SKILLS.md

Ebben a fajlban roviden vezesd, mely Codex skillek segitettek a projektben. Csak akkor olvasd teljesen, ha skillt hasznalsz, skillt javitasz, vagy skillproblemat vizsgalsz.

## Format

- Skill neve:
- Mikor hasznaltuk:
- Mire segitett:
- Mely fajlokat vagy donteseket erintett:
- Kell-e kesobb tanulsagot visszairni a skillbe: igen/nem

## Kezdo allapot

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-22`, a projekt inditasakor.
- Mire segitett: a karcsu `one-file-html` projektvaz, verziozas es javitasi ciklus letrehozasara.
- Mely fajlokat vagy donteseket erintett: a teljes indulasi mappastrukturat, a vezirlo dokumentumokat, a `V001-dev` celverziot es a `releases/` kiadasi helyet.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem, jelenleg nincs uj altalanos tanulsag`.

## Chrome baseline ellenorzes

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-22`, a technikai baseline valos Chrome-ellenorzesekor.
- Mire segitett: localhost API/IndexedDB/export proba, konzolhiba-ellenorzes, desktop es 390 px mobil vizualis ellenorzes.
- Mely fajlokat vagy donteseket erintett: `docs/TECHNICAL_BASELINE.md` es `test-artifacts/V001-C001/browser-manual-summary.json`; a `file://` automatizalt tesztje biztonsagi korlat miatt kezi kapu maradt.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem; nincs user-owned skillmodositasra alkalmas altalanos tanulsag`.

## Chrome M1 regresszio

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-22`, az M1 verziozott cache es Blueprint Browser valos bongeszos kapujanal.
- Mire segitett: 1591 rekordos lapozott cache-frissites, IndexedDB-perzisztencia, rollback, Hofstede-S1 lazy load, API-filter, konzol es responsive UI ellenorzes.
- Mely fajlokat vagy donteseket erintett: `docs/M1_REPORT.md`, `docs/TECHNICAL_BASELINE.md`; a `file://` kapu tovabbra is kezi maradt.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M2 projektfolytatas

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-22`, az M2 inventory es Allocation Engine megvalositasakor.
- Mire segitett: haromsoros modositas elotti terv, kis kontextusu projektterkep, M2 related-regression es `V001-C004` javitasi ciklus.
- Mely fajlokat vagy donteseket erintett: `TEST_COMMANDS.md`, `tests/test-plan.json`, `STATUS.md`, `WORKLOG.md`, `VERSION.json` es az M2 artifactok.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M2 bongeszos regresszio

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-22`, a helyi M2 UI, IndexedDB es Game Data/User Data hatar ellenorzesekor.
- Mire segitett: JS-300 es S00 Hofstede valos blueprint, tobb kartya, Quality batch, Target Q perzisztencia, 1591 rekordos sync, 9/9 technikai kapu, desktop es 390 px mobil nezet.
- Mely fajlokat vagy donteseket erintett: `docs/M2_REPORT.md`, `docs/TECHNICAL_BASELINE.md` es `test-artifacts/V001-C004/browser-manual-summary.json`.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M3 projektfolytatas

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-22`, az M3 Mining Game Data, location rangsor es loadout rendszer megvalositasakor.
- Mire segitett: haromsoros modositas elotti terv, feladatfokuszu fajlolvasas, M3 related-regression es `V001-C005` javitasi ciklus.
- Mely fajlokat vagy donteseket erintett: `TEST_COMMANDS.md`, `tests/test-plan.json`, `STATUS.md`, `WORKLOG.md`, `VERSION.json`, `docs/M3_REPORT.md` es az M3 artifactok.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## Chrome M3 regresszio

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-22`, a valos Mining API-cache, IndexedDB loadout es dinamikus UI ellenorzesekor.
- Mire segitett: 72/14/20/28/6 API-index, Agricium/Aphorite location es signature, MOLE/Prospector, Helix II/Arbor MH1, default loadout, USER_OVERRIDE, fingerprint, 10/10 probe, konzol es desktop layout ellenorzese.
- Mely fajlokat vagy donteseket erintett: `docs/M3_REPORT.md`, `docs/TECHNICAL_BASELINE.md` es `test-artifacts/V001-C005/browser-manual-summary.json`.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M4 projektfolytatas

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-22`, az M4 Combined Materials, backup/import es diagnosztika megvalositasakor.
- Mire segitett: haromsoros modositas elotti terv, feladatfokuszu fajlolvasas, M4 related-regression es `V001-C006`/`V001-C007` javitasi ciklus.
- Mely fajlokat vagy donteseket erintett: `TEST_COMMANDS.md`, `tests/test-plan.json`, `BACKUP_RESTORE.md`, `STATUS.md`, `WORKLOG.md`, `VERSION.json`, `docs/M4_REPORT.md` es az M4 artifactok.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M4 bongeszos regresszio

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-22`, a Combined Materials, backup preview, atomi roundtrip, diagnosztikai csomag es helyi UI ellenorzesekor.
- Mire segitett: 11/11 technikai kapu, schema 1 preview migracio, User Data fingerprint, 189 KiB koruli diagnosztikai csomag, Combined/Data Settings vizualis ellenorzes es konzolhiba-ellenorzes.
- Mely fajlokat vagy donteseket erintett: `docs/M4_REPORT.md`, `docs/TECHNICAL_BASELINE.md` es `test-artifacts/V001-C007/browser-manual-summary.json`.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M4 blokkolt helyi dialog helyreallitas

- Skill neve: `computer-use:computer-use`
- Mikor hasznaltuk: `2026-08-22`, egy helyi in-app browser dialog helyreallitasi lehetosegenek vizsgalatakor.
- Mire segitett: igazolta, hogy a ChatGPT/Codex ablakot Windows automatizalassal nem szabad vezerelni; nem tortent Computer Use input, a teszt friss bongeszolapon folytatodott.
- Mely fajlokat vagy donteseket erintett: csak a bongeszos teszt helyreallitasi donteset.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M5 projektfolytatas

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-22`, az M5 UEX refinery cache, mapping, rangsor es kartya-snapshot megvalositasakor.
- Mire segitett: haromsoros modositas elotti terv, feladatfokuszu fajlolvasas, M5 related-regression es `V001-C008` javitasi ciklus.
- Mely fajlokat vagy donteseket erintett: `TEST_COMMANDS.md`, `tests/test-plan.json`, `STATUS.md`, `WORKLOG.md`, `VERSION.json`, `docs/M5_REPORT.md` es az M5 artifactok.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M5 bongeszos regresszio

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-22`, a helyi M5 UEX cache, IndexedDB rollback, Crafting/Combined snapshot es responsive UI ellenorzesekor.
- Mire segitett: a bongeszofelulet a helyi URL-hez az in-app browsert valasztotta; 215 rekordos valos UEX sync, TTL cache-hit, 12/12 technikai kapu, Beryl UUID-kapcsolat, desktop es 390 px mobil nezet, valamint warning/error 0 ellenorzese.
- Mely fajlokat vagy donteseket erintett: `docs/M5_REPORT.md`, `docs/TECHNICAL_BASELINE.md` es `test-artifacts/V001-C008/browser-manual-summary.json`.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V1 kezi release-gate atadas

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-22`, az M6 release candidate kezi acceptance atadasakor.
- Mire segitett: a stabil kiadas megjelolesenek visszatartasara, a harom valos kornyezeti kapu kulon kezelesere es egy pontosan visszakuldheto tesztsablon letrehozasara.
- Mely fajlokat vagy donteseket erintett: `V1_RELEASE_GATE_CHECKLIST.md`, `STATUS.md`, `TASKS.md`, `TEST_COMMANDS.md`, `VERSION.json` es `docs/TECHNICAL_BASELINE.md`.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M6.1 projektfolytatas

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-24`, az M6.1 V1 UI Completeness Audit megvalositasakor.
- Mire segitett: a kotelezo inditasi fajlsorrend, haromsoros modositas elotti terv, celzott fajlolvasas, teljes regresszio, `V001-C011` ciklus es a stabil release visszatartasa.
- Mely fajlokat vagy donteseket erintett: a fo HTML/CSS, `tools/run-m61-ui-tests.mjs`, `tools/validate-m61.ps1`, `tests/test-plan.json`, a release checklist, statusz- es jelentesfajlok, valamint a C011 artifact.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## Chrome M6.1 UI audit

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-24`, a valos localhost navigacio, Material Database, Mining Loadouts, IndexedDB es responsive ellenorzesekor.
- Mire segitett: 8/8 valodi navigacios kattintas, a simitott gorgetes kattintasvesztesenek megtalalasa, 72 commodity es kategoriak, Agricium API-metrikak, Default Loadout mentes/reload, azonos `e6d8dec8` fingerprint, 13/13 technikai proba, 390 px es warning/error 0 bizonyitasa.
- Mely fajlokat vagy donteseket erintett: `sPg Crafting List.html`, `Info/style.css`, `docs/M6_1_REPORT.md`, `docs/TECHNICAL_BASELINE.md` es `test-artifacts/V001-C011/browser-manual-summary.json`.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## C04 file export javitasi ciklus

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-24`, a C04 `file://` CSSOM SecurityError javitasakor.
- Mire segitett: a stabil allapot megorzese, a szuk C04 javitasi scope, a teljes regresszio, a `V001-C012` ciklus es a manualis kapu valosaghu nyitva tartasa.
- Mely fajlokat vagy donteseket erintett: fo HTML, snapshot generator/teszt/validator, tesztterv, C04 jelentes, release checklist es C012 artifact.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## Chrome C04 localhost regresszio

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-24`, a C04 javitas utani valos localhost Chrome ellenorzesekor.
- Mire segitett: 13/13 technikai proba, 107 KiB standalone export, valtozatlan `e6d8dec8` User Data fingerprint es 0 DevTools warning/error bizonyitasa.
- Mely fajlokat vagy donteseket erintett: `docs/C04_FILE_EXPORT_REPAIR.md`, `docs/TECHNICAL_BASELINE.md` es `test-artifacts/V001-C012/browser-manual-summary.json`.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V1 pre-release automatizalt acceptance

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-24`, a release candidate vegso automatizalt ujraellenorzesekor es a manualis gate-eredmenyek rogzitesekor.
- Mire segitett: haromsoros scope-terv, tiszta munkafarol indulo `V001-C013` full-regression ciklus, explicit PASS/NOT TESTED szetvalasztas es a stabil release visszatartasa.
- Mely fajlokat vagy donteseket erintett: `tools/run-m6-tests.mjs`, `TEST_COMMANDS.md`, `V1_RELEASE_GATE_CHECKLIST.md`, `docs/V1_PRE_RELEASE_ACCEPTANCE_REPORT.md`, statusz/naplo/verzio fajlok es a C013 artifactok.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V001 stabil release-zaras

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-24`, a kifejezetten engedelyezett stabil V001 commit/tag es release-waiver dokumentalasanak zarasakor.
- Mire segitett: a tiszta kiindulo munkafa, a `V001-C014` teljes release-regresszio, a fagyasztott stabil bundle, a visszaallithatosag es a stable tag csak PASS utani letrehozasa.
- Mely fajlokat vagy donteseket erintett: `releases/V001/`, `CHANGELOG.md`, `docs/V1_RELEASE_REPORT.md`, waiver/checklist/baseline, release-validator, statusz/verzio/naplo es C014 artifact.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V002 egyfajlos projektfolytatas

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-24`, a V002-dev egyetlen HTML-re valo atallitasakor.
- Mire segitett: az audit-first munkarendre, a haromsoros scope-tervre, a V001 stabil allapot vedelmere, az embedded CSS kapura, a V002-C001 teljes regressziora es a valos file-kapu oszinte nyitva tartasara.
- Mely fajlokat vagy donteseket erintett: a fo HTML, CSS-ellenorzo es C04/M6/M6.1 tesztek, V002 dokumentacio, statusz/verzio fajlok es a V002-C001 artifact.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## Chrome V002 egyfajlos regresszio

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-24`, a V002-dev valos bongeszos kiegeszito ellenorzesekor.
- Mire segitett: 13/13 localhost technikai proba, API/cache/reload, valtozatlan `e6d8dec8` fingerprint, UEX `24/50/0`, export builder es konzolhiba 0 bizonyitasara. A `file://` URL-policy tiltasa miatt a kezi kapu nem lett PASS-ra atirva es nem tortent megkerules.
- Mely fajlokat vagy donteseket erintett: `docs/V002_SINGLE_FILE_REPORT.md` es `test-artifacts/V002-C001/browser-manual-summary.json`.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V002 file gate dokumentacios zaras

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-24`, a felhasznalo altal lefuttatott valos Chrome `file://` kapu rogzitesekor.
- Mire segitett: a dokumentacios scope elkulonitesere, a korabbi `NOT TESTED` allapot bizonyitek-alapu PASS-ra modositasara, a V001 vedelmere es a stabil V002 release visszatartasara.
- Mely fajlokat vagy donteseket erintett: V002 riport, statusz, feladatlista, verzioallapot, munkanaplo es V002-C001 browser-summary.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V002 stabil single-file release-zaras

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-24`, a kifejezetten engedelyezett stabil V002 commit/tag es egyfajlos release bundle lezarasakor.
- Mire segitett: a V002-C002 teljes release-ciklus, a verzio-only stabil artifact, a V001 vedelme, az egyfajlos release-validacio es a tag csak minden PASS utani letrehozasa.
- Mely fajlokat vagy donteseket erintett: `releases/V002/`, V002 release-validator/probe, `docs/V002_RELEASE_REPORT.md`, statusz/verzio/changelog/task/worklog es C002 artifact.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V002 GitHub- es Discord-dokumentacio

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-24`, a stabil V002 felhasznaloi es GitHub-dokumentaciojanak frissitesekor.
- Mire segitett: a fagyasztott tag es release vedelmere, a celzott funkcionalis auditra, a dokumentacio-only scope megtartasara es a kulon dokumentacios commitra.
- Mely fajlokat vagy donteseket erintett: `README.md`, `README_HU.md`, `DISCORD_POST_HU.md`, valamint a projektterkep, statusz, feladatlista es munkanaplo.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V002 GitHub tortenetintegracio es publikacio

- Skillek neve: `uj-projekt`, `github-auth-duczapeter`.
- Mikor hasznaltuk: `2026-08-24`, az egymastol fuggetlen helyi/tavoli tortenet auditjakor, biztonsagos merge-jenel, valamint a V002 tag/Release/asset es README-link publikalasakor.
- Mire segitett: a stabil V001/V002 vedelmere, backup branchekre, force nelkuli ancestry- es fast-forward kapura, a `DuczaPeter` account/HTTPS hitelesitesere es az API-bol visszaolvasott valos asset URL hasznalatara.
- Mely fajlokat vagy donteseket erintett: ket helyi backup branch, `codex/integrate-github-main-v002`, tavoli `main`, tavoli `V002` tag/Release, `README.md`, `README_HU.md` es a projekt statusznaploja.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003 farm recommendation projektfolytatas

- Skill neve: `uj-projekt`.
- Mikor hasznaltuk: `2026-08-24`, a V003-dev primary/secondary mining recommendation javitasakor.
- Mire segitett: audit-first munkarend, haromsoros scope-terv, kulon `develop/V003` branch, `V003-C001` ciklus, teljes regresszio es a V001/V002 stabil allapot vedelme.
- Mely fajlokat vagy donteseket erintett: V003 mining modell/UI/export, fixture/probe/validator, auditriport, tesztterv es projekt statuszfajlok.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## Chrome V003 kiegeszito regresszio

- Skill neve: `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-24`, a V003-dev valodi Chrome ellenorzesekor.
- Mire segitett: localhost 13/13 technikai proba, valtozatlan `e6d8dec8` fingerprint, ures warning/error konzol es Material Database vizualis ellenorzes. A `file://` URL-policy blokkolast nem kerulte meg, ezert a file kapu nyitva maradt.
- Mely fajlokat vagy donteseket erintett: `docs/V003_FARM_RECOMMENDATION_REPORT.md` es `test-artifacts/V003-C001/browser-summary.json`.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C002 farmhely presentation/grouping

- Skillek neve: `uj-projekt`, `browser:control-in-app-browser`.
- Mikor hasznaltuk: `2026-08-24`, a C001 rangsor utani emberi farmhely-csoportositas javitasakor.
- Mire segitett: a stabil V002 vedelmere, a haromsoros scope-tervre, a valos API-bizonyitek elso auditjara, a C002 repair-cycle-re, a teljes regresszios kapura es a localhost Material Database valos DOM/vizualis ellenorzesere.
- Mely fajlokat vagy donteseket erintett: V003 mining presentation modell/UI/export, M3/M6 fixture-ek, elo API-proba, C002 dokumentacio es test artifact; a bongeszoproba konzol warning/error 0 eredmenyt adott.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C003 material canonical naming

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-24`, a teljes Wiki commodity-nevaudit, a centralizalt materialnev-resolver es a valodi Chrome localhost regresszio soran.
- Mire segitett: a szuk C003 scope, a V002 stabil allapot vedelme, a repair-cycle es teljes regresszio, valamint a 14/14 technikai proba, raw/alias kereses, duplicate UI, reload-fingerprint es alkalmazas-konzol ellenorzese.
- Mely fajlokat vagy donteseket erintett: V003 material naming modell es UI/export fogyasztok, naming fixture/audit/validator, C003 riport/artifact es projekt statuszfajlok.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C004 Radar Signature es Top-3 recommendation

- Skillek neve: `uj-projekt`, `browser:control-in-app-browser`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-24`, a forraskep-alapu radar registry, SCMDB read-only referenciaaudit, Top-3 dense rank es valodi Chrome localhost regresszio soran.
- Mire segitett: a C004 scope es V002 vedelem megtartasara; a dinamikus SCMDB PTU oldal lathato szemantikajanak ellenorzesere; a valodi Chrome 15/15 proba, cache-kompatibilitasi hibak, UI-konzisztencia, reload fingerprint es konzol ellenorzesere.
- Mely fajlokat vagy donteseket erintett: a V003 mining/radar/Top-3 modell es fogyasztok, Radar Signature kep/fixture, SCMDB referenciafixture, C004 tesztek/audit/validator, riport/artifact es projekt statuszfajlok.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C005 consistency closure es final-card roadmap

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-24`, a C004 Lagrange F/Radar konzisztencia audit, a C005 repair-cycle es a valodi Chrome localhost regresszio soran.
- Mire segitett: a szuk, feature-mentes C005 scope, a V002 vedelem, az exact API-bizonyitek, a teljes cikluskapu, valamint a Chrome 15/15 technikai proba, Aluminum/Carinite UI, reload fingerprint es warning/error konzol ellenorzese.
- Mely fajlokat vagy donteseket erintett: C004 SCMDB auditindok, C005 audit/fixture/validator/riport/artifact, C006-C010 roadmap es projekt statuszfajlok; alkalmazaskod nem valtozott.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C006 Final Crafting Card es hydration

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-24`, a final Crafting Card layout, a teljes ingredient-intelligence hydration, a C006 repair-cycle es a valodi Chrome localhost/export ellenorzes soran.
- Mire segitett: a C006 scope es fagyasztott V002 vedelmere, a celzott offline-cache fixture-re, a teljes regresszios kapura, valamint a friss origines JS-300 hydration, reload fingerprint, tenyleges download es konzol ellenorzesere.
- Mely fajlokat vagy donteseket erintett: a V003 final-card UI/view-model/hydration/export kod, C006 teszt/validator/artifact/riport es projekt statuszfajlok; V002 nem valtozott.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C007 Radar Signature Material Color System

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-24`, a canonical kep-pixelaudit, a centralizalt color registry/resolver, a teljes repair-cycle es a Chrome localhost vizualis/reload/export/konzol ellenorzes soran.
- Mire segitett: a szuk C007 scope, a fagyasztott V002 vedelme, a haromsoros terv es teljes regresszios kapu, valamint a valodi Chrome renderelt szinek, technical probe, fingerprint es konzol bizonyitasara.
- Mely fajlokat vagy donteseket erintett: V003 material color modell/CSS/fogyasztok/export, C007 audit/teszt/validator/riport/artifact es projekt statuszfajlok; V002 nem valtozott.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C008 Single-file Detail View + Wiki deep links

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-25`, a same-HTML detail router, bizonyitott Wiki deep link, offline standalone detail es valodi Chrome localhost regresszio soran.
- Mire segitett: a C008 repair-cycle es V002 vedelem megtartasara, valamint a JS-300/material/radar/mining/refinery kattintasok, history/reload/invalid route, 15/15 Technical Probe, valtozatlan fingerprint es tiszta konzol bizonyitasara.
- Mely fajlokat vagy donteseket erintett: V003 detail modell/controller/UI/export, C008 Wiki audit/teszt/validator/riport/artifact es projekt statuszfajlok; V002 nem valtozott.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C008.1 Public Wiki deep-link correction

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-25`, a public Wiki/API resolver szetvalasztasa, exact MediaWiki audit, teljes cikluskapu es valodi Chrome localhost ellenorzes soran.
- Mire segitett: a szuk korrekcios scope es fagyasztott V002 vedelmere, a teljes regresszios kapura, valamint az ot detailtipus, main/standalone Back+reload, fingerprint es tiszta konzol bizonyitasara.
- Mely fajlokat vagy donteseket erintett: V003 detail snapshot/UI/export linkmodell, C008/C008.1 teszt/validator/audit/riport/artifact es projekt statuszfajlok; C009 es stabil release nem indult.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C009 Final Main View + exact Crafting Card reference

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-25`, a referencia-alapu default fo nezet, exact source-API linkek, standalone parity es valodi Chrome localhost ellenorzes soran.
- Mire segitett: a szuk C009 scope, a fagyasztott V002 vedelme es teljes regresszios kapu megtartasara; valamint a desktop/390 px layout, exact DOM linkek, Technical Probe, Back/reload, quantity, fingerprint es tiszta konzol bizonyitasara.
- Mely fajlokat vagy donteseket erintett: V003 main/Crafting Card UI es standalone projection, C008.1 torteneti teszt elvarasok, C009 audit/teszt/validator/riport/artifact es projekt statuszfajlok; stabil V002 nem valtozott.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C010 Exact Final Crafting Card + clean main view

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-25`, a default Browser + egy Final Card szetvalasztas, kompakt standalone projekcio, teljes cikluskapu es valodi Chrome localhost desktop/mobile/detail/quantity/konzol ellenorzes soran.
- Mire segitett: a szuk C010 scope es a fagyasztott V002 vedelme, a haromsoros terv es teljes regresszios kapu megtartasara; valamint a valos 15/15 Technical Probe, quantity input es probe-kompatibilitasi hibak felismeresere/javitasara, a responsive vizualis bizonyitekra, a Back/reload, fingerprint es tiszta konzol igazolasara.
- Mely fajlokat vagy donteseket erintett: V003 default/main Final Card UI, preview quantity, standalone C010 projekcio, Technical Probe C010-kompatibilitas, C009 torteneti teszt, C010 teszt/validator/riport/artifact es projekt statuszfajlok; stabil V002 nem valtozott.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C010.1 Compact Mining/Refinery projection

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-25`, a szuk compact presentation javitas, teljes repair-cycle es valodi Chrome localhost/parity/responsive/konzol ellenorzes soran.
- Mire segitett: a C010 elrendezes es C001-C010 modellek vedelmere, a haromsoros terv es teljes regresszios kapu megtartasara, valamint a valos NORMAL/SPACE osszemosasi hatar felismeresere es a renderelt kompakt eredmeny bizonyitasara.
- Mely fajlokat vagy donteseket erintett: V003 Final Card kozos main/standalone Mining/Refinery presentation helper, C010.1 teszt/validator/riport/artifact es projekt statuszfajlok; stabil V002 nem valtozott.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.
