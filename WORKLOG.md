# WORKLOG.md

Idorendi munkanaplo. Uj bejegyzest mindig a friss bejegyzesek resz vegere adj hozza. Korabbi bejegyzest ne torolj.

## Aktualis osszefoglalo

- Jelenlegi allapot: az M1 verziozott Blueprint cache, Browser es teljes slotonkenti normalizalt modell elkeszult.
- Utolso ismert jo allapot: `develop/V001`, `V001-C003` PASS; Chrome localhost M1 kapu PASS, a kozvetlen `file://` kapu meg nincs kezzel igazolva.
- Kovetkezo ajanlott lepes: kozvetlen `file://` proba, majd felhasznaloi jovahagyassal M2 My Materials es Allocation Engine.
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
