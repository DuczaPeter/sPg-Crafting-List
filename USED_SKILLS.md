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
