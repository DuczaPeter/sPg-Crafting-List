# TEST_COMMANDS.md

## Cel

Itt csak a tenylegesen futtathato vagy roviden elvegezheto ellenorzesek legyenek. Ne legyen hosszu magyarazat.

## Alap ellenorzesek

```powershell
git status --short --branch
```

## Javitasi ciklus

Ha a projektben van `tools/new-cycle.ps1`, a tesztelt allapotot ciklussal azonositsd. A tesztet elsodlegesen `tests/test-plan.json` szerinti `TestId` alapjan futtasd:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V001 -Purpose "rovid javitasi cel" -TestId smoke-pass
```

Git checkpoint csak tiszta working tree-bol indulhat:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V001 -Purpose "rovid javitasi cel" -TestId smoke-pass -Checkpoint
```

Az alap repair-cycle nem gyujt valodi app logot es nem gyujt browser console-t. Ezek `NOT_CAPTURED` allapotot kapnak. Ha egy teszt kotelezo capture-t ker, de nincs browser-diagnostics runner, a ciklus `BLOCKED` lesz.

## Browser Diagnostics

Csak explicit `browser-diagnostics` modulnal:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\run-browser-diagnostics.ps1" -ConfigPath ".\tests\test-plan.browser-diagnostics.json" -TestId sample-dom-css-log
```

Repair-cycle integracioval, ha a `tests/test-plan.json` tartalmaz browserDiagnostics bejegyzest:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V001 -Purpose "browser targeted" -TestId browser-diagnostics-sample
```

Ha Node, npm, projektlokalis Playwright vagy bongeszo hianyzik, a browser diagnostics eredmenye `BLOCKED`; ne allitsd, hogy lefutott.

## Projekt-specifikus parancsok

Projektstruktura ellenorzese:

```powershell
$required = @('CODEX_START_HERE.md', 'STATUS.md', 'TASKS.md', 'PROJECT_MAP.md', 'WORKLOG.md', 'USED_SKILLS.md', 'TEST_COMMANDS.md', 'AGENTS.md', 'README.md', '.gitignore', 'VERSIONING_RULES.md', 'VERSION.json', 'src', 'releases', 'tests', 'test-artifacts', 'tools', 'docs', 'logs', 'archive'); $missing = @($required | Where-Object { -not (Test-Path -LiteralPath $_) }); if ($missing.Count -gt 0) { Write-Error ("Hianyzo elemek: " + ($missing -join ', ')); exit 1 }; Write-Output 'Project scaffold OK'
```

Az HTML szintaktikai es bongeszos smoke tesztje alabb rogzitve van.

Technikai baseline statikus ellenorzese:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-baseline.ps1"
```

M1 normalizalt modell- es regresszios teszt:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-m1.ps1"
```

M1 repair-cycle futtatas:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V001 -Purpose "M1 blueprint cache es normalizalt modell" -TestId m1-regression
```

M2 inventory-, allocation- es teljesitmeny-regresszio:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-m2.ps1"
```

M2 repair-cycle futtatas:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V001 -Purpose "M2 My Materials es determinisztikus allocation" -TestId m2-regression
```

M3 mining modell-, loadout- es teljesitmeny-regresszio:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-m3.ps1"
```

M3 repair-cycle futtatas:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V001 -Purpose "M3 mining adatok location rangsor es loadoutok" -TestId m3-regression
```

M4 Combined Materials-, backup- es diagnosztikai regresszio:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-m4.ps1"
```

M4 repair-cycle futtatas:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V001 -Purpose "M4 Combined Materials backup es diagnosztika" -TestId m4-regression
```

M5 UEX refinery mapping-, ranking-, cache- es snapshot-regresszio:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-m5.ps1"
```

Valos, hitelesites nelkuli UEX semaproba:

```powershell
node .\tools\probe-m5-api.mjs
```

Az ot verziozott canonical alias valos Wiki/UEX ellenorzese:

```powershell
node .\tools\probe-m5-aliases.mjs
```

M5 repair-cycle futtatas:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V001 -Purpose "M5 UEX refinery mapping ranking cache es kartyasnapshot" -TestId m5-regression
```

M6 teljes standalone export es teljes regresszio:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-m6.ps1"
```

M6 repair-cycle futtatas:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V001 -Purpose "M6 standalone export referencia UI es V1 acceptance" -TestId m6-regression
```

M6.1 teljes M1-M6 + UI Completeness regresszio:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-m61.ps1"
```

M6.1 repair-cycle futtatas:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V001 -Purpose "M6.1 V1 UI completeness audit" -TestId m61-ui-regression
```

V002 egyetlen embedded alkalmazas-CSS integritasellenorzese:

```powershell
node .\tools\verify-embedded-application-css.mjs
```

C04 `file://` CSS fallback + teljes M1-M6.1 regresszio:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-c04.ps1"
```

V002-C001 egyfajlos teljes ciklus:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V002 -Purpose "V002 one-file embedded CSS application" -TestId v002-single-file-regression
```

Validalt standalone JS-300 exportartifact kiirasa (a 14 M6 ellenorzes utan byte-egyezes es SHA-256 is keszul):

```powershell
node .\tools\run-m6-tests.mjs --artifact="test-artifacts/V001-C013/standalone-js-300-automated.html"
```

V001 stabil bundle + teljes regresszio + hash-ellenorzes:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v001-release.ps1"
```

V002 stabil single-file release generalasa es teljes kiadasi kapuja:

```powershell
node .\tools\create-v002-release.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v002-release.ps1"
```

A V002 release-kapu a teljes M1-M6.1 + C04 regresszio mellett pontosan egy futtathato HTML-t, nulla helyi sidecart, checksumot, elo Wiki/UEX API-t, manualis Chrome-bizonyitekot es valtozatlan V001 bundle-t kovetel.

C04 repair-cycle:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V001 -Purpose "C04 file standalone export CSS fallback" -TestId c04-file-export-regression
```

Valos bongeszos ellenorzes:

Reszletes, kattintasonkenti V1 acceptance es visszakuldesi sablon: `V1_RELEASE_GATE_CHECKLIST.md`.

1. Nyisd meg a `sPg Crafting List.html` fajlt aktualis Chrome-ban vagy Edge-ben.
2. Kattints a `Technikai proba` gombra.
3. Csak akkor tekintheto `file://` kompatibilisnek, ha minden sor `PASS`, a futtatasi mod pedig `Kozvetlen file:// futas`.

A localhost csak fejlesztesi ellenorzeshez hasznalhato, es nem bizonyitja a `file://` kompatibilitast:

```powershell
node .\tools\serve-local.mjs
```

V002 egyfajlos kezi Chrome `file://` kapu:

1. Hozz letre egy uj, ures mappat, es csak a gyoker `sPg Crafting List.html` fajlt masold bele.
2. Nyisd meg ezt a masolatot duplakattal aktualis Chrome-ban; a cimnek `file://` protokollunak kell lennie.
3. PASS: `V002-dev` lathato, a felulet stilusos, es nincs `Info` vagy mas helyi mellekfajl a mappaban.
4. Kattints `Technikai proba`; PASS: 13/13, benne Wiki API, UEX, IndexedDB es standalone export.
5. Rogzits User Data fingerprintet, frissitsd az oldalt, majd ellenorizd, hogy a fingerprint es a mentett adatok valtozatlanok.
6. Keszits standalone exportot; PASS: az export kulon megnyilik, teljes es nem ker helyi CSS-t vagy mas runtime-fajlt.
7. DevTools Console PASS: alkalmazas warning/error 0. Network PASS: nincs helyi sidecar vagy nem vart kulso UI-eroforras.

A V002-dev kezi kapu 2026-08-24-en onallo Downloads-peldannyal lefutott: 13 PASS / 0 FAIL, standalone export PASS, `externalStylesheet: false`, `externalResource: false`, diagnostic errors 0. Reszletek: `docs/V002_SINGLE_FILE_REPORT.md`.

## Tesztszintek

- Celzott: csak az eppen javitott funkcio.
- Kapcsolodo regresszio: kozvetlenul erintett funkciok.
- Teljes regresszio: kiadasi kapuhoz vagy kozos kod erintesekor.

## Kezi ellenorzesek

- [ ] A projekt megnyilik vagy elindul.
- [ ] A modositott funkcio mukodik.
- [ ] Az alkalmazas belso logjaban nincs megmagyarazatlan `ERROR`, ha valodi app log capture engedelyezett es lefutott.
- [ ] A Chrome vagy Playwright konzolban nincs uj hiba, ha browser-diagnostics engedelyezett es lefutott.
- [ ] A diff csak a haromsoros tervben jelzett reszeket erinti.
- [ ] Nincs uj titok, token vagy felesleges nagy fajl.

## Ismert tesztesetek

- `smoke-pass`: validacios sikeres parancs.
- `smoke-fail`: validacios sikertelen parancs.
- `blocked-log-required`: bizonyitja, hogy kotelezo, de nem begyujtott log mellett nincs PASS.
- `browser-diagnostics-sample`: opcionlis minta; csak browser-diagnostics modul es projektlokalis Playwright mellett fut.
- `m1-regression`: baseline szintaxis, JS-300, vegyes unit, duplicate-material, UNKNOWN capability es provenance regresszio.
- `m2-regression`: az M1 kapu mellett 8 kotelezo allocation eset, JS-300/Hofstede szabalyok, determinisztikus kartya-prioritas, input-valtozatlansag es 1000 batch/100 kartya teljesitmenyfixture.
- `m3-regression`: az M1/M2 kapuk mellett 17 kotelezo mining/location/loadout eset, eltunt equipment es User Data hatar, valamint 5000 locationos teljesitmenyfixture.
- `m4-regression`: az M1-M3 kapuk mellett 12 kotelezo Combined Materials/backup/diagnosztikai eset, schema 1 migracio, bitazonos roundtrip, rollback es 1000 kartya/3000 slot/5000 batch teljesitmenyfixture.
- `m5-regression`: az M1-M4 kapuk mellett 18 kotelezo UEX mapping/ranking/cache/snapshot/diagnosztikai eset, az 5 verziozott canonical alias, fuzzy-elutasitas, 500 soros limitfixture es teljesitmenyproba.
- `m6-regression`: teljes M1-M5 regresszio, 14 kotelezo teljes standalone export eset, offline eroforrasfuggetlenseg, per-card export, JSON roundtrip, XSS-escape es 120 slotos teljesitmenyfixture. A valos `file://` Chrome/Edge es offline ujranyitas tovabbra is kulon bongeszos release-gate.
- `m61-ui-regression`: teljes M1-M6 regresszio es 14 kotelezo UI-eset a pontos 8 enabled navigaciora, celpanelekre, Material Database kereses/kategoriak/adatlapra, az M3/M5 projekciok es a `userLoadouts` ujrahasznalatara, valamint responsive CSS-re. A valos kattintas/reload/konzol bizonyitek kulon Chrome-summaryban van.
- `c04-file-export-regression`: teljes M1-M6.1 regresszio, egyetlen embedded CSS-forras, nulla CSSOM/fetch utvonal, ures-mappas sidecar-mentesseg, tavoli fontimport eltavolitas es standalone export keszenlet.
- `v002-single-file-regression`: a C04 teljes kapuja V002 ciklusazonositoval; bizonyitja, hogy a fo alkalmazas runtime-oldalon egyetlen HTML.
