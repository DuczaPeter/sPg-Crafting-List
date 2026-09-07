# PROJECT_MAP.md

## Fo belepesi pontok

- Fo programfajl: `sPg Crafting List.html`
- Kozponti vizualis forras: a fo HTML `#spgApplicationStyles` embedded `<style>` blokkja
- Indito mod: `sPg Crafting List.html` kozvetlen megnyitasa Windows 11 alatt aktualis Chrome vagy Edge bongeszoben
- Minimalis fallback: csak dokumentalt localhost inditas, ha a valos `file://` teszt ezt indokolja
- Teszt vagy ellenorzes inditasa: `lasd TEST_COMMANDS.md`
- Javitasi ciklus inditasa: `tools/new-cycle.ps1`, ha letezik
- Browser diagnostics inditasa: `tools/run-browser-diagnostics.ps1`, ha az opcionlis modul letezik

## Fo mappak

- `src/`: kesobbi fejlesztesi segedforrasok, ha szukseges; a kanonikus fo alkalmazas a projekt gyokereben marad.
- `Info/`: torteneti V001 es vizualis referenciaanyag; a V002 runtime nem hasznalja.
- `releases/`: ellenorzott stabil kiadasok es onallo exportmintak.
- `tests/`: tesztek, ismert bemenetek, regresszio es `test-plan.json`.
- `tests/browser-diagnostics/`: opcionlis browser diagnostics mintak es tesztadatok.
- `test-artifacts/`: ciklusonkenti rovid tesztosszefoglalok es diagnosztikai allapotok.
- `docs/`: reszletesebb dokumentacio, csak ha kell.
- `logs/`: rovid, nem titkos futasi vagy hibakimenetek.
- `archive/`: regi vagy levaltott anyagok; csak celzottan olvasd.
- `tools/`: segedscriptek.
- Baseline validalas: `tools/validate-baseline.ps1`.
- M1 modell- es cache-regresszio: `tools/validate-m1.ps1`, amely a `tools/run-m1-tests.mjs` fixture-tesztet is futtatja.
- M2 inventory- es allocation-regresszio: `tools/validate-m2.ps1`, amely az M1 kaput es a `tools/run-m2-tests.mjs` fixture/performance tesztet is futtatja.
- M3 mining-regresszio: `tools/validate-m3.ps1`, amely az M1/M2 kapukat es a `tools/run-m3-tests.mjs` 24 V003 primary/secondary/ranking/loadout fixture/performance esetet is futtatja.
- M4 Combined Materials-, backup- es diagnosztikai regresszio: `tools/validate-m4.ps1`, amely az M1-M3 kapukat es a `tools/run-m4-tests.mjs` 12 kotelezo esetet is futtatja.
- M5 UEX refinery regresszio: `tools/validate-m5.ps1`, amely az M1-M4 kapukat es a `tools/run-m5-tests.mjs` 18 kotelezo mapping/ranking/cache/snapshot esetet futtatja.
- M6 standalone export regresszio: `tools/validate-m6.ps1`, amely az M1-M5 kapukat es a `tools/run-m6-tests.mjs` 14 exportesetet futtatja.
- M6.1 UI Completeness regresszio: `tools/validate-m61.ps1`, amely a teljes M1-M6 kaput es a `tools/run-m61-ui-tests.mjs` 14 navigacios/Material Database/Mining Loadouts/responsive esetet futtatja.
- C04 single-file CSS/export regresszio: `tools/validate-c04.ps1`; a `tools/verify-embedded-application-css.mjs` az egyetlen CSS-forrast, a `tools/run-c04-file-export-tests.mjs` pedig file/HTTP es ures-mappas sidecar-mentesseget tesztel.
- V002 stabil release kapu: `tools/validate-v002-release.ps1`; a teljes regresszio mellett az egyetlen release HTML-t, checksumot, elo Wiki/UEX API-t es V001-integritast ellenorzi.
- V003 farm recommendation kapu: `tools/validate-v003-farm.ps1`; a teljes regresszio mellett elo Wiki common/uncommon/legendary resource-probat es V002-integritast ellenoriz.
- V003 elo farmhely API-proba: `tools/probe-v003-farm-api.mjs`, csak olvaso Aluminum/Agricium/Stileron bizonyitekkal.
- V003 materialnev kapu: `tools/validate-v003-c003.ps1`; a celzott canonical naming tesztet, elo commodity-auditot, teljes V003 farm-regressziot es V002-integritast egyutt ellenorzi.
- V003 materialnev fixture: `tests/fixtures/v003-c003-material-names.json`; exact alias, suffix, invalid rekord es duplicate projection esetek.
- V003 elo materialnev audit: `tools/audit-v003-material-names.mjs`; a teljes `/commodities` es az alkalmazas `mineable`/`harvestable` mintajat olvassa, az audit JSON-t a C003 artifactba irja.
- V003-C005 consistency kapu: `tools/validate-v003-c005.ps1`; exact Lagrange F primary/secondary trace, teljes Radar reconciliation, C001-C004/M1-M6.1/C04, standalone es V002-integritas.
- V003-C005 elo audit: `tools/audit-v003-c005.mjs`; a Wiki `4.9.0-LIVE.12232306` adaton keszit mezoszintu Lagrange F trace-t, 7 ROC/FPS kategoriabizonyitekot, 31 jogos UNMAPPED listat es C004 Top-3 snapshot-egyezest.
- V003-C005 riport: `docs/V003_C005_CONSISTENCY_REPORT.md`; forrashierarchia, auditjavitas es a V003-C006-C010 final-card roadmap.
- V003-C006 final-card kapu: `tools/validate-v003-c006.ps1`; C006 adatmodell/hydration/standalone teszt, teljes C001-C005 + M1-M6.1 + C04, elo Wiki audit es V002-integritas.
- V003-C006 celzott teszt: `tools/run-v003-c006-tests.mjs`; JS-300 vegso view-model, quantity/max/allocation, cached/uncached offline hydration, teljes material snapshot es kozos standalone render.
- V003-C006 riport: `docs/V003_C006_FINAL_CARD_REPORT.md`; layout, hydration, offline viselkedes, export, Chrome es V002-integritas bizonyitek.
- V003-C007 color kapu: `tools/validate-v003-c007.ps1`; canonical kep-pixelaudit, celzott color/resolver/export teszt, teljes C001-C006 + M1-M6.1 + C04 es V002-integritas.
- V003-C007 celzott teszt/audit: `tools/run-v003-c007-tests.mjs` es `tools/audit-v003-c007-colors.mjs`; exact Wiki UUID registry, 33 source pixel, neutral fallback, UI/export consumer es JS-300 bizonyitek.
- V003-C007 riport: `docs/V003_C007_COLOR_AUDIT.md`; forraskep, registry, exact szinek, unmapped lista, fogyasztok, export es Chrome bizonyitek.
- V003-C008 detail kapu: `tools/validate-v003-c008.ps1`; elo Wiki deep-link audit, celzott same-HTML/standalone detail teszt, teljes C001-C007 + M1-M6.1 + C04 es V002-integritas.
- V003-C008 celzott teszt/audit: `tools/run-v003-c008-tests.mjs` es `tools/audit-v003-c008-wiki-links.mjs`; ot detail tipus, history/reload/invalid modell, exact URL-forras es offline standalone bizonyitek.
- V003-C008 riport: `docs/V003_C008_DETAIL_VIEW_REPORT.md`; route/controller, adattartalom, Wiki URL-hierarchia, standalone parity, Chrome es V002-integritas.
- V003-C009 exact API/main-card kapu: `tools/validate-v003-c009.ps1`; source-record-only item/material API audit, referencia-alapu main/card projekcio, C001-C008.1 regresszio es V002-integritas.
- V003-C010 exact Final Card kapu: `tools/validate-v003-c010.ps1`; default Browser + egy Final Card, kulon Crafting List, kompakt standalone, C001-C010/M1-M6.1/C04 es V002-integritas.
- V003-C010 celzott teszt: `tools/run-v003-c010-tests.mjs`; 3 recipe-sor, 3 materialblokk, 8 curated Radar chip, exact API linkek, detail-celok es 0 kulso standalone runtime eroforras.
- V003-C010 riport: `docs/V003_C010_REPORT.md`; layout, quantity/allocation, standalone, Chrome desktop/mobile/Back/reload/konzol/fingerprint es V002-integritas bizonyitek.
- V003-C010.1 kapu: `tools/validate-v003-c0101.ps1`; C010 teljes kapu + compact Mining/Refinery celteszt, standalone es V002-integritas.
- V003-C010.1 celteszt: `tools/run-v003-c0101-tests.mjs`; family/single/multi-group mining, refinery friendly label, exact tie-count, alacsonyabb rang kizárasa es standalone parity.
- V003-C010.1 riport: `docs/V003_C0101_REPORT.md`; eredeti C010 audit, compact szabalyok, valos Chrome eredmeny, standalone es V002-integritas.
- V003-C011 kapu: `tools/validate-v003-c011.ps1`; teljes C010.1 kapu, reference SHA-zar, fo Blueprint Browser technikai detail cleanup, modellmegorzes, standalone es V002-integritas.
- V003-C011 celteszt: `tools/run-v003-c011-tests.mjs`; `RÉSZLET-CACHE` lathatosag 0, scroll/layout CSS, kivalasztas/Final Card frissites, technikai modellmegorzes es standalone 3/3/8 invarians.
- V003-C011 riport: `docs/V003_C011_REPORT.md`; scope, referenciazar, Chrome meretek, fingerprint, konzol, standalone es V002 bizonyitek.
- V003-C012 kapu: `tools/validate-v003-c012.ps1`; kozos Browser/Crafting List Final Card renderer, tobbkartyas prioritas/expanded state, detail return, standalone es teljes regresszio.
- V003-C012.1 kapu: `tools/validate-v003-c0121.ps1`; kozos effektív Quality policy, materialterv, Combined allocation-bucket/detail, standalone es teljes regresszio.
- V003-C012.2 kapu: `tools/validate-v003-c0122.ps1`; C012.1 teljes kapu + aktiv SC-verzios normalized cache/projekcio/deep-link/provenance izolacio, standalone es V002-integritas.
- V003-C012.2 celteszt: `tools/run-v003-c0122-tests.mjs`; VERSION_A/VERSION_B azonos UUID, aktiv B link/source/snapshot, regi A cache-megorzes leakage nelkul es cross-version block.
- V003-C012.2 riport: `docs/V003_C0122_VERSION_CONSISTENCY_REPORT.md`; gyokerok, invarians, teszt, Chrome/user-manual bizonyitek es visszaallas.
- V003-C012.3 kapu: `tools/validate-v003-c0123.ps1`; C012.2 teljes kapu + FIXED recipe/user material constraint szetvalasztas, Metamaterial Test #152, standalone parity, C013 invalidacio es V002-integritas.
- V003-C012.3 celteszt: `tools/run-v003-c0123-tests.mjs`; valos 4.10 Metamaterial fixture, Q747/Q800/Q850/Q860/Q950, missing Quality/Max, HIGHEST_Q, HP/UNKNOWN, priority/no-double-count, backup/restore es standalone.
- V003-C012.3 fixture: `tests/fixtures/metamaterial-test-152-quality-constraint.json`; exact blueprint/material UUID-k es bizonyitott recipe slot mennyisegek.
- V003-C012.3 riport: `docs/V003_C0123_USER_MATERIAL_QUALITY_CONSTRAINT_REPORT.md`; gyokerok, policy-modell, celteszt, Chrome, invalidalt C013 es visszaallas.
- V003-C012.4 kapu: `tools/validate-v003-c0124.ps1`; C012.3 teljes kapu + minden numerikus editor draft/commit lifecycle, Chrome-bizonyitek es V002-integritas.
- V003-C012.4 celteszt: `tools/run-v003-c0124-tests.mjs`; replacement matrix, temporary empty, selection/caret, Enter/change/blur/Tab, decimal/unit audit es nulla draftkori User Data iras.
- V003-C012.4 riport: `docs/V003_C0124_NUMERIC_INPUT_EDITING_REPORT.md`; gyokerok, kozos helper, inputaudit, Chrome sequential typing, responsive es visszaallas.
- V003-C013 fresh candidate kapu: `tools/validate-v003-c013-fresh.ps1`; exact D2B source byte-lock, teljes relevans regresszio, C012.5D1 integralt FR-86, single-file/standalone es V001/V002 integritas.
- V003-C013 candidate builder/target: `tools/build-v003-c013-fresh-candidate.mjs` es `tools/run-v003-c013-fresh-tests.mjs`; az aktiv candidate az invalidalt torteneti candidate-ektol kulon `test-artifacts/V003-C013/fresh-release-candidate/` alatt van.
- V003-C013 riport: `docs/V003_C013_RELEASE_CANDIDATE_REPORT.md`; automated/Chrome PASS, exact candidate SHA-zar es a meg nyitott manual candidate `file://` gate.
- V003-C013.1 strict allocation kapu: `tools/validate-v003-c0131.ps1`, `tools/run-v003-c0131-tests.mjs`; FR-86 vegyes amount/Quality shortage, Card/material Quality scheduling, cross-view parity es M4 canonical harness audit.
- V003-C013.1 riport: `docs/V003_C0131_STRICT_QUALITY_ALLOCATION_REPORT.md`; fixture: `tests/fixtures/fr86-mixed-amount-quality-shortage.json`.
- V003-C013.2 friss candidate kapu: `tools/validate-v003-c0132-fresh.ps1`; exact `9a07de3...` source-lock, determinisztikus single-file build, teljes releváns regresszió, C013.1 mixed-shortage/parity és V001/V002 integritás.
- V003-C013.2 builder/target: `tools/build-v003-c0132-fresh-candidate.mjs`, `tools/run-v003-c0132-fresh-tests.mjs`; artifact: `test-artifacts/V003-C013.2/fresh-release-candidate/`.
- V003-C013.2 riport: `docs/V003_C0132_RELEASE_CANDIDATE_REPORT.md`; automated + valódi Chrome localhost PASS, exact manual candidate `file://` gate NOT RUN.
- M5 valos UEX semaproba: `tools/probe-m5-api.mjs`, auth fejlec nelkuli, csak olvaso endpoint-ellenorzes.
- M3 API-semavizsgalat: `tools/probe-m3-api.mjs`, csak olvaso, tomor valos endpoint/facet bizonyitekkal.
- Minimalis localhost fallback: `node tools/serve-local.mjs`, alapertelmezett cim `http://127.0.0.1:4177/`.

## Elsodleges tervezesi forrasok

- `docs/PROJECT_SPECIFICATION.md`: teljes, 82 pontos V1.0 funkcionalis specifikacio.
- `docs/IMPLEMENTATION_DECISIONS.md`: lezart nev-, futtatasi-, prioritas-, keszlet- es rangsorolasi dontesek.
- `Info/Star_Citizen_alapanyag_farm_kartyak_BP_API_C788_P6_P8_Killshot_bovitve.html`: vizualis es export referencia.
- `Info/style.css`: torteneti V001/reference CSS; V002-ben nem runtime-forras.
- `docs/V002_SINGLE_FILE_AUDIT.md`: a kulso CSS-fugges auditja, az egyforrasos embedded architektura es ellenorzesi terv.
- `docs/V002_SINGLE_FILE_REPORT.md`: a V002-C001 regresszio, Chrome localhost es valos `file://` kezi PASS bizonyitek, valamint a V001 vedelme.
- `docs/V002_RELEASE_REPORT.md`: a stabil V002 approval, V002-C002 regresszio, single-file artifact, hash, API-probak es Git tag release-riportja.
- `docs/V003_FARM_RECOMMENDATION_REPORT.md`: a primary/secondary API-audit, uj rangsor, space/normal besorolas, tesztek es nyitott `file://` kapu.
- `docs/V003_MATERIAL_NAMING_REPORT.md`: a C003 teljes nevmező/suffix/alias/invalid/duplicate auditja, kozos resolvere, fogyasztoi es regresszios bizonyiteka.
- `docs/V003_C004_RADAR_TOP3_REPORT.md`: a forraskep-alapu radar registry, Wiki API_RAW mezohatar, Top-3 dense rank, SCMDB audit, Chrome es regresszios bizonyitek.
- `docs/V003_C006_FINAL_CARD_REPORT.md`: a final Crafting Card adatkontraktus, automatikus ingredient hydration, kozos UI/export projekcio es C006 acceptance.
- `docs/V003_C008_DETAIL_VIEW_REPORT.md`: a same-HTML detail controller, ot reszlettipus, Wiki URL-hierarchia, offline standalone parity es C008 acceptance.
- `docs/V003_C008_1_PUBLIC_WIKI_REPORT.md`: a public Wiki/API linkkorrekcio, exact MediaWiki audit, snapshot contract, standalone es C008.1 acceptance.
- `docs/V003_C009_REPORT.md`: a referencia-alapu main view, exact source API linkek, kompakt kartya es C009 acceptance.
- `docs/V003_C010_REPORT.md`: a tiszta Final Card-only default nezet, kulon Crafting List, kompakt standalone es C010 Chrome/regresszios acceptance.
- `docs/V003_C0101_REPORT.md`: a C010.1 compact Mining/Refinery prezentacios korrekcio es a C010 evidence audit.
- `docs/V003_C011_REPORT.md`: a vegleges Blueprint Browser fo UI cleanup, vizualis referenciazar es Chrome/regresszios bizonyitek.
- `docs/TECHNICAL_BASELINE.md`: a bizonyitott es meg nyitott technikai kapuk.
- `V1_RELEASE_GATE_CHECKLIST.md`: a Chrome `file://`, tenyleges offline standalone export es kulon Edge release-gate kattintasonkenti kezi ellenorzese es visszakuldesi sablonja.
- `docs/M1_REPORT.md`: endpointok, normalizalt modell, cache-tranzakcio, valos tesztadatok es M2 elotti nyitott pontok.
- `docs/M2_REPORT.md`: inventory/batch modell, allocation algoritmus, Quality szabalyok, teljesitmeny es M3 elotti nyitott pontok.
- `docs/M3_REPORT.md`: mining endpointok, normalizalt modell, location rangsor, loadoutok, valos tesztadatok es M4 elotti nyitott pontok.
- `docs/M4_REPORT.md`: Combined Materials projekcio, backup schema/importtranzakcio, diagnosztika, teljesitmeny es M5 elotti nyitott pontok.
- `docs/M5_REPORT.md`: UEX endpoint/valasz, mapping, rendszerrangsor, napi cache/rollback, kartya-snapshot, valos tesztpeldak es M6 elotti nyitott pontok.
- `docs/M6_1_REPORT.md`: a placeholder-ok oka, a meglevo M3/M5 modellek ujrahasznalata, a nyolc navigacios cel, Material Database/Mining Loadouts es Chrome audit bizonyitekai.
- `docs/C04_FILE_EXPORT_REPAIR.md`: a CSSOM SecurityError oka, a generalt snapshot megoldas, hash, regresszio es a kezi C04 ujrateszt kapuja.
- `docs/V1_PRE_RELEASE_ACCEPTANCE_REPORT.md`: a V001-C013 teljes automatizalt bizonyiteka, a Chrome manual PASS, az O04/Edge NOT TESTED allapot es a vegso release-candidate minosites.
- `docs/V1_RELEASE_REPORT.md`: a V001 stabil approval, a C014 regresszio, az elfogadott manualis waiverek, a stabil bundle es a Git tag vegso riportja.
- `CHANGELOG.md`: kiadott verzio funkcio- es acceptance-osszefoglaloja.
- `BACKUP_RESTORE.md`: backup export/import, preview, migracio, snapshot es rollback rovid uzemeltetesi leirasa.
- `tests/fixtures/`: JS-300, Hofstede-S1 es azonos materialt ket slotban tarto regresszios fixture.
- `test-artifacts/V001-C001/`: az elso statikus es Chrome localhost baseline bizonyitekai.
- `test-artifacts/V001-C002/`: az M1 normalizalt modell related-regression ciklus rovid bizonyitekai.
- `test-artifacts/V001-C003/`: az M1 azonos verzioju indexcsere vegso regresszios es Chrome-bizonyitekai.
- `test-artifacts/V001-C004/`: az M2 regresszios ciklus es helyi bongeszos ellenorzes bizonyitekai.
- `test-artifacts/V001-C005/`: az M3 regresszios ciklus es helyi Chrome-ellenorzes bizonyitekai.
- `test-artifacts/V001-C006/`: az M4 fo regresszios ciklus bizonyitekai.
- `test-artifacts/V001-C007/`: az M4 User Settings importhatar-javitasa es a vegso helyi bongeszos ellenorzes bizonyitekai.
- `test-artifacts/V001-C008/`: az M5 17 esetes regresszio, valos browser-ellenorzes es UEX cache/mapping bizonyitekai.
- `test-artifacts/V001-C010/`: az M6 teljes regresszio, tenyleges exportfixture es Chrome localhost RC-bizonyitekai; a harom kezi release-gate egyertelmuen `NOT_TESTED` maradt.
- `test-artifacts/V001-C011/`: az M6.1 teljes M1-M6 + 14 pontos UI regresszio es a valos Chrome kattintas/reload/fingerprint/responsive/konzol bizonyitekai.
- `test-artifacts/V001-C012/`: a C04 CSS fallback teljes regresszio es localhost Chrome bizonyitekai; a valos file C04 ujrateszt `NOT_TESTED`.
- `test-artifacts/V001-C013/`: a vegso M1-M6.1/C04 regresszio, pre-release evidence JSON es az automatikusan generalt, hash-ellenorzott JS-300 standalone export.
- `test-artifacts/V001-C014/`: a stabil V001 kiadas elotti utolso teljes M1-M6.1/C04 regresszio bizonyiteka.
- `test-artifacts/V002-C001/`: a V002 egyfajlos teljes regresszio es Chrome localhost/manual-gate summary bizonyiteka.
- `test-artifacts/V002-C002/`: a stabil V002 kiadas elotti teljes regresszio es release evidence.
- `test-artifacts/V003-C001/`: a V003 farm recommendation teljes regresszio, standalone artifact es Chrome localhost/file-gate summary bizonyiteka.
- `test-artifacts/V003-C002/`: a ranking utani bizonyitekos farmhely-grouping teljes regresszios es browser bizonyiteka.
- `test-artifacts/V003-C003/`: a material naming teljes elo API-auditja, Chrome localhost summaryja es repair-cycle PASS summaryja.
- `test-artifacts/V003-C004/`: Radar Signature/SCMDB/Top-3 elo auditok, standalone export, teljes PASS summary es valodi Chrome localhost bizonyitek.
- `test-artifacts/V003-C005/`: a consistency closure elo auditja, standalone exportja es teljes PASS summaryja.
- `test-artifacts/V003-C006/`: a final Crafting Card teljes regresszios summaryja, Chrome evidence es standalone artifactja.
- `test-artifacts/V003-C007/`: material color pixelaudit, teljes regresszios summary, Chrome evidence es standalone artifact.
- `test-artifacts/V003-C008/`: Wiki deep-link audit, detail/standalone artifact, repair-cycle summary es valodi Chrome localhost evidence.
- `test-artifacts/V003-C008.1/`: public MediaWiki exact-title audit, korrigalt standalone snapshot es valodi Chrome localhost evidence.
- `test-artifacts/V003-C009/`: exact API audit, referencia-alapu standalone kartya, summary es Chrome screenshot.
- `test-artifacts/V003-C010/`: exact API audit, kompakt standalone Final Card, PASS summary es helyi Chrome desktop/mobile screenshot.
- `test-artifacts/V003-C010.1/`: exact API audit, compact standalone Final Card, PASS summary es helyi Chrome screenshot.
- `test-artifacts/V003-C011/`: exact API audit, standalone Final Card, PASS summary es helyi Git-ignore 1920/1366/mobile Chrome screenshotok.
- `test-artifacts/V003-C012.2/`: ketverzios izolacios standalone, PASS summary es Chrome localhost bizonyitek.
- `test-artifacts/V003-C012.3/`: Metamaterial Q800 allocation/standalone bizonyitek es PASS summary.
- `test-artifacts/V003-C012.4/`: numeric editor celteszt, valodi Chrome localhost sequential typing/responsive/fingerprint bizonyitek es PASS summary.
- `test-artifacts/V003-C013/`: a C012.3 release-blokkolo miatt explicit invalidalt, nem aktiv release-candidate bizonyitek; C013 commit nem keszult.
- `test-artifacts/V003-C013.1/`: strict Quality allocation, vegyes hiányosztályozás, FR-86 cross-view/standalone és célzott validator bizonyíték.
- `test-artifacts/V003-C013.2/`: exact C013.1 source-ból épített friss candidate, teljes regressziós, mixed-shortage, standalone és valódi Chrome localhost evidence.
- `test-artifacts/V003-C013.3/`: diszjunkt Minimum/MAX pool, Titanium exact canonical multi-source grouping, standalone parity és célzott regressziós evidence.
- `test-artifacts/V002-C015/`: a ciklusszam-reset hibaja elott lefutott megorzott PASS summary; a kanonikus V002 ciklus a `V002-C001`.
- `releases/V001/`: a fagyasztott ketfajlos V001 alkalmazas, integritasi manifest es release-leiras.
- `releases/V002/`: a stabil V002 egyetlen futtathato HTML artifactja, plusz nem runtime jellegu release-leiras es checksum.

## V003-C013.3 célzott repair

- `tests/fixtures/v003-c0133-disjoint-pools-canonical-grouping.json`: Titanium Q784/Q866, Minimum Q500/MAX Q800 exact canonical fixture.
- `tools/run-v003-c0133-tests.mjs`: diszjunkt eligibility, canonical My Materials grouping és cross-view parity célteszt.
- `tools/validate-v003-c0133.ps1`: csak a közvetlenül érintett regressziókat és release-integritást futtató bounded validator.
- `docs/V003_C0133_DISJOINT_POOLS_CANONICAL_GROUPING_REPORT.md`: gyökérok, szabály, exact UUID evidence és eredmények.

## Iranyito fajlok

- `README.md`: a stabil V002 teljes angol GitHub-dokumentacioja.
- `README_HU.md`: a stabil V002 teljes magyar GitHub-dokumentacioja.
- `DISCORD_POST_HU.md`: rovid, Discordra bemasolhato magyar hasznalati leiras.
- `CODEX_START_HERE.md`: rovid inditasi lap.
- `STATUS.md`: aktualis valos allapot.
- `TASKS.md`: aktualis feladatlista.
- `WORKLOG.md`: rovid munkanaplo es friss bejegyzesek.
- `USED_SKILLS.md`: hasznalt skillek, csak skilles feladatnal olvasd.
- `TEST_COMMANDS.md`: bizonyito parancsok es kezi tesztek.
- `AGENTS.md`: Codex munkaszabalyok.
- `VERSION.json`: verzio, fejlesztesi cel es ciklus allapota, ha letezik.
- `BROWSER_DIAGNOSTICS.md`: opcionlis, csak explicit browser-diagnostics modulnal.
- `tests/test-plan.browser-diagnostics.json`: opcionlis browser diagnostics minta konfiguracio.

## Opcionlis fajlok

Az `uj-projekt` profil vagy modul akkor hozhat letre extra fajlt, ha a projekt indokolja:

- `CHANGELOG.md`
- `VERSIONING_RULES.md`
- `VERSION.json`
- `BROWSER_DIAGNOSTICS.md`
- `tools/run-browser-diagnostics.ps1`
- `tools/browser-diagnostics-runner.mjs`
- `tests/test-plan.browser-diagnostics.json`
- `BACKUP_RESTORE.md`
- `WORKING.lock.example`
- `DECISIONS.md`
- `SKILL_POLICY.md`

## Nagy fajlok olvasasi szabaly

Nagy HTML, JS, log vagy adatfajl megnyitasa elott keress pontos szovegre, fuggvenyre, komponensre vagy hibara. Browser diagnostics hibanal eloszor a rovid summary es excerpt fajlt olvasd.
