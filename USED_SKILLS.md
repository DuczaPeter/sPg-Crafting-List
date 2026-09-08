# USED_SKILLS.md

Ebben a fajlban roviden vezesd, mely Codex skillek segitettek a projektben. Csak akkor olvasd teljesen, ha skillt hasznalsz, skillt javitasz, vagy skillproblemat vizsgalsz.

## V003-C015 Fresh Release Candidate

- Skillek neve: `credit-efficient-project-runner`, `computer-use:computer-use`.
- Mikor használtuk: `2026-09-08`, az exact C014 checkpointból épített fresh single-file RC teljes release-regressziójához és valódi Chrome localhost kapujához.
- Mire segített: minimális resume, determinisztikus source/hash lock, izolált regressziós clone, legacy Titanium és diszjunkt Quality pool browser fixture, három exact viewport, backup/standalone/version identity és tiszta konzol bizonyítására.
- Mely fájlokat vagy döntéseket érintett: C015 builder/validator/test harness, candidate/evidence/report és ciklusmeta; application code, V001/V002, a régi invalidált V003 tag/release, remote és `main` nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C014 Stable Version Identity Repair

- Skillek neve: `credit-efficient-project-runner`, `computer-use:computer-use`.
- Mikor használtuk: `2026-09-08`, a szűk runtime identity javításhoz, célzott statikus kapuhoz és valódi Chrome localhost ellenőrzéshez.
- Mire segített: a három verzióazonosító pontos javítására teljes történeti regresszió nélkül, valamint az UI/backup/diagnosztika, IndexedDB reload, standalone és konzol valódi böngészős bizonyítására.
- Mely fájlokat vagy döntéseket érintett: fő HTML három identity értéke, C014 teszt/validator/evidence/report és projektmeta; business logic, V001/V002, régi V003 tag/artifact, remote és `main` nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## Format

- Skill neve:
- Mikor hasznaltuk:
- Mire segitett:
- Mely fajlokat vagy donteseket erintett:
- Kell-e kesobb tanulsagot visszairni a skillbe: igen/nem

## V003 stable release

- Skill neve: `credit-efficient-project-runner`.
- Mikor használtuk: `2026-09-08`, a változatlan, elfogadott C013.8 candidate release-only, helyi stable lezárásához.
- Mire segített: a bounded pre-release integritásauditra, a byte-pontos artifact-promócióra és a már bizonyított automated/Chrome/manual kapuk szükségtelen újrafuttatásának elkerülésére.
- Mely fájlokat vagy döntéseket érintett: V003 stable artifact, release/checksum riportok és kötelező projektmeta; application code, RC, V001/V002, remote és `main` nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C013.9 Exact manual file gate evidence closure

- Skill neve: `credit-efficient-project-runner`.
- Mikor használtuk: `2026-09-08`, a felhasználó által igazolt exact C013.8 `file://` kapu dokumentáció-only lezárásához.
- Mire segített: a változatlan RC hash/integritás rövid ellenőrzésére, a költséges automated/Chrome kapuk ismétlésének elkerülésére és a manuális evidence elkülönítésére.
- Mely fájlokat vagy döntéseket érintett: C013.8/C013.9 riport, manual summary és ciklusmetaadatok; application code, RC, V001/V002 és remote Git nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C013.8 Fresh release candidate

- Skillek neve: `credit-efficient-project-runner`, `computer-use:computer-use`.
- Mikor használtuk: `2026-09-08`, az exact C013.7 checkpointból készített friss single-file RC teljes release-regressziójához és valódi Chrome localhost kapujához.
- Mire segített: minimális resume, determinisztikus source/hash lock, teljes releváns validatorlánc, valamint a legacy Titanium picker, reload, nyolc modul, három viewport, konzol, Wiki/UEX és IndexedDB böngészős bizonyítására.
- Mely fájlokat vagy döntéseket érintett: C013.8 builder/validator/evidence/report és ciklusmetaadatok; application code, V001/V002 és remote Git nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C013.4 Fresh release candidate

- Skillek neve: `credit-efficient-project-runner`, `computer-use:computer-use`.
- Mikor használtuk: `2026-09-07`, az exact C013.3 checkpointból készített friss single-file RC teljes release-regressziójához és valódi Chrome localhost kapujához.
- Mire segített: a minimális resume, determinisztikus source/hash lock, bounded tesztlánc, valamint a nyolc modul, három viewport, konzol, Wiki/UEX/IndexedDB és reload böngészős bizonyítására.
- Mely fájlokat vagy döntéseket érintett: C013.4 builder/validator/evidence/report és ciklusmetaadatok; application code, V001/V002 és távoli Git nem változott.
- Kell-e később tanulsagot visszaírni a skillbe: `nem`.

## V003-C012.5D2B Exact manual file gate

- Skill neve: `credit-efficient-project-runner`.
- Mikor használtuk: `2026-09-01`, a felhasználó által igazolt exact `file://` kapu dokumentáció-only lezárásához.
- Mire segített: a változatlan D2A checkpoint minimális folytatására, automated/browser ismétlés nélkül, valamint a WORKLOG byte-azonos archiválására.
- Mely fájlokat vagy döntéseket érintett: D2B riport és projektmetaadatok; application code, V001/V002 és C013 nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C012.5D2A Integrated Chrome localhost gate

- Skillek neve: `credit-efficient-project-runner`, `chrome:control-chrome`, `computer-use`.
- Mikor használtuk: `2026-09-01`, a D1 baseline célzott Chrome localhost integrációjához, teardownjához és lezárásához.
- Mire segített: a teljes történeti regresszió ismétlése nélkül az FR-86 happy/shortage, shared Card state, responsive, standalone, console és fingerprint kapu bizonyítására. A `computer-use` kizárólag a natív fájlválasztó korlátozott fallback-kísérlete volt; a fájlt végül a felhasználó választotta ki.
- Mely fájlokat vagy döntéseket érintett: D2A evidence/report és projektmetaadatok; alkalmazáskód, V001/V002, D2B és C013 nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C012.5D1 Integrated automated gate

- Skill neve: `credit-efficient-project-runner`.
- Mikor használtuk: `2026-09-01`, a C3B2 checkpointból induló, böngésző nélküli C012.5 integrációs kapuhoz.
- Mire segített: a minimális resume után csak a szükséges A/B/C, C012.3/C012.4, M4/M6 és integritási lánc futott; a teljes történeti release-suite kimaradt.
- Mely fájlokat vagy döntéseket érintett: D1 teszt/validator/evidence/report, két elavult tesztharness-kapcsolat és aktuális metaadatok; application code és V002 nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C012.5C3B2 Standalone effective Quality

- Skill neve: `credit-efficient-project-runner`, `chrome:control-chrome`.
- Mikor használtuk: `2026-09-01`, a félbemaradt dirty C3B2 diff célzott lezárásához és az elkészült standalone artifact rövid Chrome localhost ellenőrzéséhez.
- Mire segített: a már PASS direkt tesztlánc megőrzésére teljes regresszió ismétlése nélkül, valamint a renderelt Quality címkék, shortage, read-only felület és tiszta konzol bizonyítására.
- Mely fájlokat vagy döntéseket érintett: standalone Quality presentation, C3B2 célteszt/validator/evidence/report és aktuális projektmetaadatok; V002, allocation, Combined és User Data nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

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

## V003-C012.5C3B1 Combined real pool metrics

- Skill neve: `credit-efficient-project-runner`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-31`, a C3A baseline-ról induló szűk Combined aggregation-javításhoz és az izolált localhost UI/teardown/reload ellenőrzéshez.
- Mire segített: a célzott fájl- és tesztkör megtartására teljes regresszió nélkül, valamint az egyetlen jóváhagyott FR-86 tesztkártya biztonságos törlésének és a megmaradó User Data bizonyítására.
- Mely fájlokat vagy döntéseket érintett: Combined view-model/render, C3B1 teszt/validator/report/artifact és aktuális projektstátusz; skillfájl, standalone és V002 nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C012.5C1 Recipe Slot assignment model

- Skill neve: `credit-efficient-project-runner`.
- Mikor hasznaltuk: `2026-08-31`, a félbeszakadt dirty diff célzott auditjára és a kizárólagos C1 adatmodell/perzisztencia checkpoint lezárására.
- Mire segített: a `18004a5…` baseline, a szűk érintett HTML-részek és a C012.5B/A/C012.3 célzott kapuk használatára teljes projekt- és történeti regresszió ismétlése nélkül.
- Mely fájlokat vagy döntéseket érintett: Cardba ágyazott `cardId + recipeSlotId` assignment storage, C1 fixture/teszt/validator/report és aktuális projektdokumentáció; `uj-projekt` és Chrome skill nem lett használva.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C012.5C2 Recipe Pool Dropdown UI

- Skillek neve: `credit-efficient-project-runner`, `chrome:control-chrome`.
- Az `uj-projekt` skillt a felhasználói tiltásnak megfelelően nem használtuk.
- Mikor használtuk: `2026-08-31`, a C1 baseline-ról induló szűk dropdown UI, célzott validator és rövid valós Chrome FR-86/desktop/mobile/console ellenőrzés során.
- Mire segített: a teljes történeti regresszió elkerülésére, az allocation/Max/Combined/standalone határ megtartására, valamint a draft→Card, exact cardId, reload, mobil overflow és tiszta konzol bizonyítására.
- Mely fájlokat vagy döntéseket érintett: V003 Browser/Crafting Recipe Slot pool presentation és transient draft state, C2 teszt/validator/report/artifact és aktuális projektdokumentáció; C3 nem indult, V002 változatlan.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C012.5C3A Pool Allocation + Max DB

- Skillek neve: `credit-efficient-project-runner`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-31`, a félbemaradt C3A dirty diff célzott folytatása, rövid regressziós lezárása és izolált valódi Chrome localhost allocation/reload/teardown ellenőrzése során.
- Mire segített: az ismételt teljes projekt- és történeti regresszió elkerülésére, valamint a FR-86 happy/insufficient Quality, live recalculation, konzol és fingerprint tényleges bizonyítására.
- Mely fájlokat vagy döntéseket érintett: C3A effective policy/allocation, céltesztek/validator/evidence/report és kötelező projektmetaadatok; skillfájl, V001/V002, C3B/D/C013 nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C012.5A Inventory Independence Foundation

- Skillek neve: `credit-efficient-project-runner`, `chrome:control-chrome`.
- Az `uj-projekt` skillt a felhasználói tiltásnak megfelelően nem használtuk.
- Mikor használtuk: `2026-08-30` és `2026-08-31`, a félbemaradt dirty repair-cycle célzott folytatása, bounded validator és rövid valós Chrome localhost fixture során.
- Mire segített: a minimális resume/audit, a teljes történeti regresszió elkerülése, az exact UUID identity edge case célzott bizonyítása és a C012.5A scope védelme.
- Érintett döntések: inventory ∪ requirement Combined source-set, aktív commodity cache alapú known-material lista, exact `commodityUuid ↔ ingredientUuid` bridge és no-fuzzy negatív gate.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C012.5B Combined Quality Pools

- Skillek neve: `credit-efficient-project-runner`, `chrome:control-chrome`.
- Az `uj-projekt` skillt a felhasználói tiltásnak megfelelően nem használtuk.
- Mikor használtuk: `2026-08-31`, a félkész C012.5B célzott folytatása, bounded validator, valós Chrome recipe add/remove/reload és 1920/390 viewport ellenőrzése során.
- Mire segített: a teljes történeti regresszió elkerülésére, a C012.5A/C012.4/C012.3 közvetlen kapuk megtartására, valamint a committed numeric szerkesztés, IndexedDB-perzisztencia, mobil overflow és tiszta konzol bizonyítására.
- Érintett döntések: külön Material Quality Pool User Data, exact canonical UUID sharing, eligible preview allocation-bekötés nélkül, C012.5C halasztása.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

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

## V003-C011 Final user-facing UI cleanup + reference lock

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-25`, a szuk fo UI cleanup, reference lock, teljes repair-cycle es valodi Chrome 1920/1366/390 responsive/standalone/konzol ellenorzes soran.
- Mire segitett: a C010.1 Final Card es uzleti modellek vedelmere, a haromsoros scope megtartasara, valamint a belso listascroll, 15/15 Technical Probe, detail Back/reload, fingerprint es nulla konzolhiba bizonyitasara.
- Mely fajlokat vagy donteseket erintett: V003 Blueprint Browser normal fo UI/CSS, C011 teszt/validator/report/artifact es projekt statuszfajlok; stabil V002 es V003 uzleti modellek nem valtoztak.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C012 Crafting List Final Crafting Card visual parity

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-25`, a közös Final Card renderer, többkártyás prioritás/expanded állapot, source-card detail route, teljes cikluskapu és valódi Chrome 1920/1366/390 + 10-kártyás stressz ellenőrzése során.
- Mire segített: a C012 szűk scope, a C013/release tiltás és a fagyasztott V002 védelmének megtartására; valamint a valós quantity/reload, prioritás, detail Back/reload, responsive overflow, fingerprint és tiszta konzol bizonyítására.
- Mely fájlokat vagy döntéseket érintett: V003 Crafting List/Final Card presentation és detail route kontextus, C012 teszt/validator/report/artifact és projekt státuszfájlok; a skillfájlok és V002 nem változtak.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C012.1 Material Quality Planner

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-29`, a kozos effektív Quality policy, allocation-aware Combined Materials, teljes repair-cycle es valodi Chrome 1920/1366/390/detail/konzol ellenorzes soran.
- Mire segitett: a C012.1 scope, a C013/release tiltás es a fagyasztott V002 vedelme megtartasara; valamint a valos Q900 reload-perzisztencia, Combined detail Back/reload, responsive overflow, fingerprint es tiszta konzol bizonyitasara.
- Mely fajlokat vagy donteseket erintett: V003 Quality policy/allocation/Combined UI es detail snapshot, C012.1 teszt/validator/report/artifact es projekt statuszfajlok; a skillfajlok es V002 nem valtoztak.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C012.2 Active SC Version Consistency Repair

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-29`, az aktivverzio/cache/provenance audit, a szuk repair-cycle, a teljes regresszios kapu es a valodi Chrome localhost refresh/reload/detail/export/konzol ellenorzes soran.
- Mire segitett: a C012.2 scope, a C013/release tiltasa es a fagyasztott V002 vedelme megtartasara; valamint az aktiv 4.10 dataset, exact API linkek, C008 reload/Back, letoltott standalone, fingerprint es tiszta konzol bizonyitasara.
- Mely fajlokat vagy donteseket erintett: V003 aktivverzio-resolver, normalized projekcio/hydration, API deep link es standalone snapshot, C012.2 teszt/validator/report/artifact es projekt statuszfajlok; a skillfajlok es V002 nem valtoztak.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C012.3 User Material Quality Constraint Repair

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-29`, a megszakadt C013 auditja, a FIXED recipe/user allocation policy szetvalasztasa, teljes repair-cycle es valodi Chrome localhost Metamaterial Q800/Q850/reload/konzol ellenorzes soran.
- Mire segitett: a szuk C012.3 scope, az invalidalt C013 es a fagyasztott V002 vedelmenek megtartasara; valamint a valos allocation, Combined/Final Card parity, perzisztencia, fingerprint es tiszta konzol bizonyitasara.
- Mely fajlokat vagy donteseket erintett: V003 Quality policy/allocation UI, C012.3 fixture/teszt/validator/report/artifact es projekt statuszfajlok; a skillfajlok es V002 nem valtoztak.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C012.4 Numeric Input Editing Lifecycle Repair

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-29` es `2026-08-30`, a numeric input audit, kozos draft/commit helper, teljes repair-cycle es valodi Chrome sequential typing/responsive/konzol ellenorzes soran.
- Mire segitett: a szuk C012.4 scope, az invalidalt C013 es a fagyasztott V002 vedelmenek megtartasara; valamint a tenyleges billentyues focus/caret/temporary-empty/commit, reload fingerprint es tiszta konzol bizonyitasara.
- Mely fajlokat vagy donteseket erintett: V003 numerikus input lifecycle, C010/C012 torteneti tesztassert, C012.4 teszt/validator/report/artifact es projekt statuszfajlok; a skillfajlok es V002 nem valtoztak.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C013 invalidalt Release Candidate kiserlet lezarasa

- Skillek neve: `uj-projekt`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-08-30`, a C012.4 baseline-lock, determinisztikus candidate-build, teljes release-kapu, exact candidate valodi Chrome localhost ellenorzese es a C012.5 blocker miatti biztonsagos invalidalas soran.
- Mire segitett: a C013 validacio-only scope, a tiltott application-code modositas, a ket kulon invalidalt candidate es a fagyasztott V001/V002 vedelmenek megtartasara; valamint a PASS evidence megorzese mellett a kiadhatosagi statusz valosaghu lezárasara.
- Mely fajlokat vagy donteseket erintett: csak C013 builder/teszt/validator, candidate/standalone/evidence, release-candidate riport es projekt statuszdokumentacio; `sPg Crafting List.html`, C012.5, V001 es V002 nem valtozott.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## V003-C013 fresh Release Candidate

- Skillek neve: `credit-efficient-project-runner`, `chrome:control-chrome`.
- Mikor hasznaltuk: `2026-09-01`, az exact D2B baseline-ból épített fresh candidate célzott resume-ja, teljes release-regressziója és valódi Chrome localhost gate-je során.
- Mire segített: a minimális kontextusú folytatásra, az alkalmazáskód byte-lockjára, a régi invalidált candidate-ek elkülönítésére, a generated artifact-zaj célzott takarítására, valamint a 1920/1366/390 viewport, nyolc modul és tiszta konzol bizonyítására.
- Mely fájlokat vagy döntéseket érintett: C013 builder/validator/test harness, fresh candidate/evidence/report és projektállapot-dokumentáció; a fő HTML, V001 és V002 nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C013.1 Strict Quality Allocation + Shortage Repair

- Skillek neve: `credit-efficient-project-runner`.
- Mikor használtuk: `2026-09-01`, a kézi candidate gate blockeréből induló szűk application repair, célfixture, M4 harness-audit, célzott regresszió és checkpoint lezárása során.
- Mire segített: a jelenlegi baseline minimális kontextusú folytatására, a teljes release-regresszió és RC rebuild tudatos kihagyására, a generated artifact-zaj elkülönítésére, valamint V001/V002 és a blokkolt C013 candidate védelmére.
- Mely fájlokat vagy döntéseket érintett: Allocation Engine scheduling/shortage projection, M4 Technical Baseline probe, C013.1 fixture/teszt/validator/report/artifact és projektállapot-dokumentáció; a skillfájlok és stabil V001/V002 nem változtak.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C013.2 Fresh Release Candidate

- Skillek neve: `credit-efficient-project-runner`, `chrome:control-chrome`.
- Mikor használtuk: `2026-09-01`, az exact C013.1 checkpointból épített friss candidate minimális resume-jához, teljes release-regressziójához és valódi Chrome localhost kapujához.
- Mire segített: a candidate byte-lock, a régi blokkolt C013 artifact elkülönítése, a generált regressziós zaj célzott visszaállítása, valamint a 15/15 Technical Baseline, nyolc modul, három viewport és tiszta konzol bizonyítására.
- Mely fájlokat vagy döntéseket érintett: C013.2 builder/validator/target harness, candidate/evidence/report és projektmetaadatok; a fő alkalmazás HTML, V001 és V002 nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C013.3 Disjoint Quality Pools + Canonical Grouping Repair

- Skillek neve: `credit-efficient-project-runner`.
- Mikor használtuk: `2026-09-07`, a C013.2 kézi kapuján talált két blocker minimális resume-jához, célzott application repairjéhez és checkpoint lezárásához.
- Mire segített: a szűk célteszt-scope, a teljes release-regresszió tudatos kihagyása, a generált történeti artifact-zaj elkülönítése, valamint a blokkolt C013.2 candidate és a stabil V001/V002 védelme.
- Mely fájlokat vagy döntéseket érintett: Quality pool range/allocation/Combined/standalone és exact canonical My Materials grouping, C013.3 fixture/teszt/validator/report/evidence és projektállapot-dokumentáció; skillfájl, stabil release és remote nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C013.5 Canonical Material Picker Dedup Repair

- Skillek neve: `credit-efficient-project-runner`.
- Mikor használtuk: `2026-09-07`, a C013.4 kézi kapuján talált canonical picker blocker minimális resume-jához, célzott application repairjéhez, aktív 4.10 API-auditjához és checkpoint lezárásához.
- Mire segített: a szűk affected-path olvasásra, a teljes release-regresszió és RC rebuild tudatos kihagyására, a generált történeti artifact-zaj elkülönítésére, valamint a blokkolt C013.4 candidate és a stabil V001/V002 védelmére.
- Mely fájlokat vagy döntéseket érintett: exact item→commodity identity/cache/picker/batch projection, C013.5 fixture/teszt/live audit/validator/report/evidence és projektállapot-dokumentáció; skillfájl, stabil release és remote nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C013.6 Fresh Release Candidate

- Skillek neve: `credit-efficient-project-runner`, `computer-use`.
- Mikor használtuk: `2026-09-08`, az exact C013.5 checkpointból épített új candidate minimális resume-jához, teljes release-regressziójához és valódi Chrome localhost kapujához.
- Mire segített: a candidate byte-lock, az invalidált C013.4 artifact elkülönítése, a generált történeti artifact-zaj visszaállítása, valamint a 15/15 baseline, nyolc modul, három viewport és 0/0 konzol bizonyítására.
- Mely fájlokat vagy döntéseket érintett: C013.6 builder/validator/target harness, candidate/evidence/report és projektállapot-dokumentáció; a fő HTML, V001 és V002 nem változott.
- Kell-e később tanulságot visszaírni a skillbe: `nem`.

## V003-C013.7 User-Data-Independent Canonical Picker Repair

- Skillek neve: `credit-efficient-project-runner`.
- Mikor használtuk: `2026-09-08`, a C013.6 kézi kapuján talált User Data-függő canonical picker blocker minimális resume-jához és célzott application repairjéhez.
- Mire segített: a szűk affected-path auditra, a teljes release-regresszió/Chrome/RC tudatos kihagyására, az invalidált C013.6 candidate és a stabil V001/V002 védelmére, valamint a célzott checkpoint lezárására.
- Mely fájlokat vagy döntéseket érintett: exact refined-version identity graph, canonical authority/picker/batch projection, C013.7 fixture/teszt/validator/report/evidence és projektállapot-dokumentáció; skillfájl, stabil release és remote nem változott.
- Kell-e később tanulsagot visszaírni a skillbe: `nem`.
