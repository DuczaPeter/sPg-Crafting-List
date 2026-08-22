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

Valos bongeszos ellenorzes:

1. Nyisd meg a `sPg Crafting List.html` fajlt aktualis Chrome-ban vagy Edge-ben.
2. Kattints a `Technikai proba` gombra.
3. Csak akkor tekintheto `file://` kompatibilisnek, ha minden sor `PASS`, a futtatasi mod pedig `Kozvetlen file:// futas`.

A localhost csak fejlesztesi ellenorzeshez hasznalhato, es nem bizonyitja a \`file://\` kompatibilitast:

```powershell
python -m http.server 4177 --bind 127.0.0.1
```

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
