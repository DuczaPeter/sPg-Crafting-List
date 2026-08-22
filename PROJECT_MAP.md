# PROJECT_MAP.md

## Fo belepesi pontok

- Fo programfajl: `sPg Crafting List.html` (tervezett, meg nincs letrehozva)
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

## Elsodleges tervezesi forrasok

- `docs/PROJECT_SPECIFICATION.md`: teljes, 82 pontos V1.0 funkcionalis specifikacio.
- `docs/IMPLEMENTATION_DECISIONS.md`: lezart nev-, futtatasi-, prioritas-, keszlet- es rangsorolasi dontesek.
- `Info/Star_Citizen_alapanyag_farm_kartyak_BP_API_C788_P6_P8_Killshot_bovitve.html`: vizualis es export referencia.
- `Info/style.css`: kozponti alkalmazas-CSS.

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
