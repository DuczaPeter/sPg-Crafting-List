# PROJECT_MAP.md

## Fo belepesi pontok

- Fo programfajl: `sPg Crafting List.html`
- Kozponti vizualis fajl: `Info/style.css`
- Indito mod: `sPg Crafting List.html` kozvetlen megnyitasa Windows 11 alatt aktualis Chrome vagy Edge bongeszoben
- Minimalis fallback: csak dokumentalt localhost inditas, ha a valos `file://` teszt ezt indokolja
- Teszt vagy ellenorzes inditasa: `lasd TEST_COMMANDS.md`
- Javitasi ciklus inditasa: `tools/new-cycle.ps1`, ha letezik
- Browser diagnostics inditasa: `tools/run-browser-diagnostics.ps1`, ha az opcionlis modul letezik

## Fo mappak

- `src/`: kesobbi fejlesztesi segedforrasok, ha szukseges; a kanonikus fo alkalmazas a projekt gyokereben marad.
- `Info/`: kotelezo referencia HTML es a fo alkalmazas altal hasznalt `style.css`.
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
- M3 mining-regresszio: `tools/validate-m3.ps1`, amely az M1/M2 kapukat es a `tools/run-m3-tests.mjs` 17 fixture/performance esetet is futtatja.
- M4 Combined Materials-, backup- es diagnosztikai regresszio: `tools/validate-m4.ps1`, amely az M1-M3 kapukat es a `tools/run-m4-tests.mjs` 12 kotelezo esetet is futtatja.
- M3 API-semavizsgalat: `tools/probe-m3-api.mjs`, csak olvaso, tomor valos endpoint/facet bizonyitekkal.
- Minimalis localhost fallback: `node tools/serve-local.mjs`, alapertelmezett cim `http://127.0.0.1:4177/`.

## Elsodleges tervezesi forrasok

- `docs/PROJECT_SPECIFICATION.md`: teljes, 82 pontos V1.0 funkcionalis specifikacio.
- `docs/IMPLEMENTATION_DECISIONS.md`: lezart nev-, futtatasi-, prioritas-, keszlet- es rangsorolasi dontesek.
- `Info/Star_Citizen_alapanyag_farm_kartyak_BP_API_C788_P6_P8_Killshot_bovitve.html`: vizualis es export referencia.
- `Info/style.css`: kozponti alkalmazas-CSS.
- `docs/TECHNICAL_BASELINE.md`: a bizonyitott es meg nyitott technikai kapuk.
- `docs/M1_REPORT.md`: endpointok, normalizalt modell, cache-tranzakcio, valos tesztadatok es M2 elotti nyitott pontok.
- `docs/M2_REPORT.md`: inventory/batch modell, allocation algoritmus, Quality szabalyok, teljesitmeny es M3 elotti nyitott pontok.
- `docs/M3_REPORT.md`: mining endpointok, normalizalt modell, location rangsor, loadoutok, valos tesztadatok es M4 elotti nyitott pontok.
- `docs/M4_REPORT.md`: Combined Materials projekcio, backup schema/importtranzakcio, diagnosztika, teljesitmeny es M5 elotti nyitott pontok.
- `BACKUP_RESTORE.md`: backup export/import, preview, migracio, snapshot es rollback rovid uzemeltetesi leirasa.
- `tests/fixtures/`: JS-300, Hofstede-S1 es azonos materialt ket slotban tarto regresszios fixture.
- `test-artifacts/V001-C001/`: az elso statikus es Chrome localhost baseline bizonyitekai.
- `test-artifacts/V001-C002/`: az M1 normalizalt modell related-regression ciklus rovid bizonyitekai.
- `test-artifacts/V001-C003/`: az M1 azonos verzioju indexcsere vegso regresszios es Chrome-bizonyitekai.
- `test-artifacts/V001-C004/`: az M2 regresszios ciklus es helyi bongeszos ellenorzes bizonyitekai.
- `test-artifacts/V001-C005/`: az M3 regresszios ciklus es helyi Chrome-ellenorzes bizonyitekai.
- `test-artifacts/V001-C006/`: az M4 fo regresszios ciklus bizonyitekai.
- `test-artifacts/V001-C007/`: az M4 User Settings importhatar-javitasa es a vegso helyi bongeszos ellenorzes bizonyitekai.

## Iranyito fajlok

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
