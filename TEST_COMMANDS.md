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

V003 farm recommendation teljes regresszio, elo API-proba es fagyasztott V002-integritas:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-farm.ps1"
```

Csak az elo Star Citizen Wiki common/uncommon/legendary farm-ajanlo proba:

```powershell
node .\tools\probe-v003-farm-api.mjs
```

V003 repair-cycle:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V003 -Purpose "V003 farm recommendation primary filter es quality ranking" -TestId v003-farm-recommendation-regression
```

V003-C002 presentation/grouping repair-cycle:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V003 -Purpose "V003 mining recommendation emberi farmhely-csoportok" -TestId v003-c002-grouping-regression
```

V003-C003 material canonical naming celzott + elo API + teljes regresszio:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c003.ps1"
```

Csak a celzott materialnev/alias/duplicate/invalid fixture-ek:

```powershell
node .\tools\run-v003-c003-tests.mjs
```

Csak a teljes es aktiv Wiki commodity-nevaudit:

```powershell
node .\tools\audit-v003-material-names.mjs --output="test-artifacts/V003-C003/material-name-audit.json"
```

V003-C003 repair-cycle:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V003 -Purpose "V003 material canonical naming es display cleanup" -TestId v003-c003-material-naming-regression
```

V003-C004 Radar Signature registry + Top-3 teljes kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c004.ps1"
```

Csak a celzott Radar/Top-3/tie/nem-Ship/consumer teszt:

```powershell
node .\tools\run-v003-c004-tests.mjs
```

Elo Wiki radar-lefedettseg, Top-3 es SCMDB-reference audit:

```powershell
node .\tools\audit-v003-c004.mjs --output-dir="test-artifacts/V003-C004"
```

V003-C005 C004 consistency closure + final-card roadmap teljes kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c005.ps1"
```

Csak a C005 fixture-, cache-consumer- es roadmap-teszt:

```powershell
node .\tools\run-v003-c005-tests.mjs
```

Elo Wiki Lagrange F + Radar reconciliation + Top-3 consistency audit:

```powershell
node .\tools\audit-v003-c005.mjs --output-dir="test-artifacts/V003-C005"
```

V003-C006 Final Crafting Card + teljes material snapshot hydration kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c006.ps1"
```

Csak a C006 final view-model, allocation, offline hydration es standalone teszt:

```powershell
node .\tools\run-v003-c006-tests.mjs
```

C006 repair-cycle a teszttervbol:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V003 -Purpose "Final Crafting Card Layout + complete material snapshot hydration" -TestId v003-c006-final-card-regression
```

V003-C008 Single-file Detail View + Wiki deep link teljes kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c008.ps1"
```

Csak a C008 detail/router/standalone fixture:

```powershell
node .\tools\run-v003-c008-tests.mjs --artifact="test-artifacts/V003-C008/standalone-js-300-detail-view.html"
```

Csak az elo, read-only Star Citizen Wiki deep-link audit:

```powershell
node .\tools\audit-v003-c008-wiki-links.mjs --output="test-artifacts/V003-C008/wiki-deep-link-audit.json"
```

C008 repair-cycle a teszttervbol:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\new-cycle.ps1" -TargetVersion V003 -Purpose "Single-file Detail View + Star Citizen Wiki deep links" -TestId v003-c008-detail-view-regression
```

V003-C008.1 Public Wiki deep-link correction teljes kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0081.ps1"
```

Csak az exact publikus MediaWiki title/redirect audit:

```powershell
node .\tools\audit-v003-c0081-public-wiki.mjs --output="test-artifacts/V003-C008.1/public-wiki-audit.json"
```

Csak a C008.1 public/API host-, felirat-, snapshot- es standalone celteszt:

```powershell
node .\tools\run-v003-c0081-tests.mjs --standalone="test-artifacts/V003-C008.1/standalone-js-300-detail-view.html"
```

V003-C009 referencia-alapu fo nezet, exact source API link es standalone kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c009.ps1"
```

Celzott exact elo API audit es C009 standalone/UI fixture:

```powershell
node .\tools\audit-v003-c009-api-links.mjs --output="test-artifacts/V003-C009/exact-api-link-audit.json"
node .\tools\run-v003-c009-tests.mjs --artifact="test-artifacts/V003-C009/standalone-js-300-final-card.html"
```

V003-C010 exact Final Crafting Card, kulon Crafting List es kompakt standalone teljes kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c010.ps1"
```

Csak a C010 exact kompozicio/standalone celteszt:

```powershell
node .\tools\run-v003-c010-tests.mjs --standalone="test-artifacts/V003-C010/standalone-js-300-final-card.html"
```

V003-C007 Radar Signature Material Color System teljes kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c007.ps1"
```

Csak a C007 canonical kep-pixelaudit:

```powershell
node .\tools\audit-v003-c007-colors.mjs
```

Csak a C007 registry/resolver/consumer/JS-300/standalone teszt:

```powershell
node .\tools\run-v003-c007-tests.mjs
```

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
- `m3-regression`: az M1/M2 kapuk mellett 24 kotelezo V003 primary/secondary, spawn/occurrence/Quality, space/normal, loadout, eltunt equipment es User Data eset, valamint 5000 locationos teljesitmenyfixture.
- `m4-regression`: az M1-M3 kapuk mellett 12 kotelezo Combined Materials/backup/diagnosztikai eset, schema 1 migracio, bitazonos roundtrip, rollback es 1000 kartya/3000 slot/5000 batch teljesitmenyfixture.
- `m5-regression`: az M1-M4 kapuk mellett 18 kotelezo UEX mapping/ranking/cache/snapshot/diagnosztikai eset, az 5 verziozott canonical alias, fuzzy-elutasitas, 500 soros limitfixture es teljesitmenyproba.
- `m6-regression`: teljes M1-M5 regresszio, 14 kotelezo teljes standalone export eset, offline eroforrasfuggetlenseg, per-card export, JSON roundtrip, XSS-escape es 120 slotos teljesitmenyfixture. A valos `file://` Chrome/Edge es offline ujranyitas tovabbra is kulon bongeszos release-gate.
- `m61-ui-regression`: teljes M1-M6 regresszio es 14 kotelezo UI-eset a pontos 8 enabled navigaciora, celpanelekre, Material Database kereses/kategoriak/adatlapra, az M3/M5 projekciok es a `userLoadouts` ujrahasznalatara, valamint responsive CSS-re. A valos kattintas/reload/konzol bizonyitek kulon Chrome-summaryban van.
- `c04-file-export-regression`: teljes M1-M6.1 regresszio, egyetlen embedded CSS-forras, nulla CSSOM/fetch utvonal, ures-mappas sidecar-mentesseg, tavoli fontimport eltavolitas es standalone export keszenlet.
- `v002-single-file-regression`: a C04 teljes kapuja V002 ciklusazonositoval; bizonyitja, hogy a fo alkalmazas runtime-oldalon egyetlen HTML.
- `v003-farm-recommendation-regression`: teljes M1-M6.1 + C04, elo Wiki common/uncommon/legendary location/resource proba, primary/secondary gate, spawn/occurrence/quantized-Quality sorrend es valtozatlan V002 tag/artifact.
- `v003-c002-grouping-regression`: a C001 teljes kapuja mellett provider/resource/parent-bizonyitekos Lagrange, Pyro deep-space es Aaron Halo presentation grouping; nyers location lista megorzese; Material Database/standalone kozos modell.
- `v003-c003-material-naming-regression`: exact UUID-alias, biztonsagos terminalis suffix, invalid rekord rejtese, raw/alias kereses, `refined_version`-bizonyitekos duplicate projection, kozos UI/export consumer es teljes C001/C002/fagyasztott V002 regresszio.
- `v003-c004-radar-top3-regression`: 33 rekordszamu curated radar registry, 31 explicit `Nincs adat`, Wiki API_RAW diagnosztika, 3 dense rank tier/kornyezet, tie es nem-Ship SPACE eset, SCMDB osszehasonlito audit, kozos UI/export projekcio es teljes C001-C003/V002 regresszio.
- `v003-c005-consistency-regression`: exact Lagrange F primary/secondary decision trace, 7/7 ROC/FPS category proof, 31 jogos UNMAPPED, valtozatlan C004 Top-3, cache/consumer konzisztencia, C006-C010 roadmap, teljes C001-C004/M1-M6.1/C04 es V002-integritas.
- `v003-c006-final-card-regression`: JS-300 final card header es slotprojekcio, quantity/max, HP_MIN_500/FIXED/shortage, cache/offline hydration, harom teljes Radar/Mining/UEX snapshot, kozos standalone view-model, C001-C005/M1-M6.1/C04 es V002-integritas.
- `v003-c007-material-color-regression`: 33 exact Wiki UUID-s source-pixelaudit, 31 neutralis `UNMAPPED_COLOR`, kozos Crafting/My Materials/Combined/Material Database/export resolver, JS-300 exact szinek, standalone, C001-C006/M1-M6.1/C04 es V002-integritas.
- `v003-c0081-public-wiki-regression`: exact public MediaWiki title/redirect audit, kulon public/API resolver es UI action, snapshot/standalone parity, tiltott host/felirat keveredes es nevbol generalt public URL kizárasa, teljes C001-C008/M1-M6.1/C04 es V002-integritas.
- `v003-c009-final-main-card-regression`: ket kovetett referencia-PNG, default Blueprint Browser + kompakt Crafting Card, exact source-record item/material API linkek, public Wiki user action 0, per-system top mining/refinery, VERIFIED Radar chips, standalone parity, teljes C001-C008.1/M1-M6.1/C04 es V002-integritas.
- `v003-c010-exact-final-card-regression`: default Blueprint Browser + egy Final Card, kulon teljes Crafting List, kompakt header/quantity/max/3 recipe/stock/3 material blokk, 8 exact Radar chip, internal detail, standalone parity, teljes C001-C010/M1-M6.1/C04 es V002-integritas.
- `v003-c0101-compact-presentation-regression`: valtozatlan C010 layout mellett C002 family label, exact mining tie compact count, refinery prefix/system-suffix normalizalas, alacsonyabb `value_month` kizárasa, main/standalone azonos projekcio, teljes C001-C010/M1-M6.1/C04 es V002-integritas.
- `v003-c011-final-ui-cleanup-regression`: ket reference SHA-zar, fo Blueprint Browser technikai detail lathatosag 0, technikai modellmegorzes, viewportfuggo listascroll, JS-300 Final Card/standalone 3 recipe/3 material/8 Radar invarians, teljes C001-C010.1/M1-M6.1/C04 es V002-integritas.
- V003 artifactok: `test-artifacts/V003-C001/`, `test-artifacts/V003-C002/`, `test-artifacts/V003-C003/`, `test-artifacts/V003-C004/`, `test-artifacts/V003-C005/`, `test-artifacts/V003-C006/`, `test-artifacts/V003-C007/`, `test-artifacts/V003-C008/`, `test-artifacts/V003-C008.1/`, `test-artifacts/V003-C009/`, `test-artifacts/V003-C010/`, `test-artifacts/V003-C010.1/`, `test-artifacts/V003-C011/`, `test-artifacts/V003-C012/`, `test-artifacts/V003-C012.1/`, `test-artifacts/V003-C012.2/`.

V003-C011 teljes kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c011.ps1"
```

Csak a C011 fo UI/reference/model/standalone celteszt:

```powershell
node .\tools\run-v003-c011-tests.mjs --standalone="test-artifacts/V003-C011/standalone-js-300-final-card.html"
```

V003-C012 teljes kapu (közös Final Card renderer, többkártyás Crafting List, prioritás/detail/standalone és teljes regresszió):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c012.ps1"
```

Csak a C012 háromkártyás/tízkártyás, expanded/collapsed, prioritás és forráskártya-detail célteszt:

```powershell
node .\tools\run-v003-c012-tests.mjs --standalone="test-artifacts/V003-C012/standalone-js-300-final-card.html"
```

- `v003-c012-crafting-list-final-card-parity`: közös `buildFinalCraftingCardViewModel()` + `renderFinalCraftingCardContent()`, kompakt priority/action fej, 3 és 10 kártya, expanded/collapsed, allocation-prioritáscsere, source-card detail, standalone/single-file és teljes C001-C011/M1-M6.1/C04/V002-integritás.
- C012 artifactok: `test-artifacts/V003-C012/`.

V003-C012.1 teljes kapu (kozos effektív Quality policy, materialterv, Combined bucket/detail, standalone es teljes regresszio):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0121.ps1"
```

Csak a C012.1 policy/allocation/Combined/persistence/standalone celteszt:

```powershell
node .\tools\run-v003-c0121-tests.mjs --standalone="test-artifacts/V003-C012.1/standalone-js-300-quality-plan.html"
```

- `v003-c0121-material-quality-planner`: kozos `resolveEffectiveMaterialQualityPolicy()` es `formatEffectiveQualityLabel()`, exact UUID-s USER setting, RECIPE/TARGET_Q/HIGHEST_Q, receptminimum- es UNKNOWN-vedelem, allocation-alapu Quality-bucketek double-count nelkul, max/prioritas, backup/restore, Combined detail, standalone/single-file, teljes C001-C012/M1-M6.1/C04 es V002-integritas. A FIXED + explicit user constraint vegso szemantikajat a C012.3 gate ellenorzi.
- C012.1 artifactok: `test-artifacts/V003-C012.1/`.

V003-C012.2 teljes kapu (aktiv SC-verzio, cache/projekcio izolacio, deep link/provenance, standalone es teljes regresszio):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0122.ps1"
```

Csak a C012.2 VERSION_A/VERSION_B es standalone celteszt:

```powershell
node .\tools\run-v003-c0122-tests.mjs --artifact="test-artifacts/V003-C012.2/standalone-js-300-version-b.html"
```

- `v003-c0122-active-version-consistency`: exact aktivverzio-szurt normalized projekcio/hydration, VERSION_A cache-megorzes leakage nelkul, item/material API link es material/mining provenance VERSION_B, cross-version block, standalone/single-file es teljes C001-C012.1/M1-M6.1/C04/V002-integritas.
- C012.2 artifactok: `test-artifacts/V003-C012.2/`.

V003-C012.3 teljes kapu (FIXED recipe baseline + explicit user material allocation constraint, Metamaterial Test #152, standalone es teljes regresszio):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0123.ps1"
```

Csak a C012.3 Q747/Q800/Q850/HIGHEST_Q/persistence/standalone celteszt:

```powershell
node .\tools\run-v003-c0123-tests.mjs
```

- `v003-c0123-user-material-quality-constraint`: FIXED recipe baseline megorzese, explicit TARGET_Q/HIGHEST_Q allocation-korlat, missing Quality es Max, Combined/Final/standalone parity, HP/UNKNOWN vedelmek, priority/no-double-count, backup/restore, C013 invalidacio es V002-integritas.
- C012.3 artifactok: `test-artifacts/V003-C012.3/`; az elozo megszakadt candidate csak invalidalt bizonyitekkent: `test-artifacts/V003-C013/`.

V003-C012.4 teljes kapu (minden numerikus editor draft/commit lifecycle, C012.3 es teljes regresszio):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0124.ps1"
```

Csak a C012.4 replacement/empty/selection/caret/commit/unit celteszt:

```powershell
node .\tools\run-v003-c0124-tests.mjs
```

- `v003-c0124-numeric-editor-lifecycle`: kozos `bindCommittedNumericEditor()` es `normalizeCommittedNumericDraft()`, 7 tenyleges input, quantity/Target Q replacement matrix, temporary empty, first-focus select, mar fokuszalt caret, Backspace/Delete, nyil/Home/End, Enter/change/blur/Tab, 0 draftkori User Data iras, valtozatlan SCU/ITEM parser es teljes C001-C012.3/M1-M6.1/C04/V002-integritas.
- C012.4 artifactok: `test-artifacts/V003-C012.4/`.

V003-C013 invalidalt kiserlet lezaro integritas-kapuja (C012.4 byte-lock, determinisztikus build, celteszt es fagyasztott release-integritas):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c013.ps1"
```

Candidate ujrageneralasa kizarolag a lezart C012.4 commitbol:

```powershell
node .\tools\build-v003-c013-candidate.mjs
```

Csak a C013 candidate/single-file/JS-300 baseline+Q900 standalone celteszt:

```powershell
node .\tools\run-v003-c013-tests.mjs
```

- `v003-c013-release-candidate`: az alkalmazas C012.4 baseline-tol valo eltereset blokkolja; a candidate SHA/byte-egyezeset, single-file runtime-ot, aktiv 4.10 source/link konzisztenciat, baseline/Q900 Quality/allocation/Combined/detail standalone-t, a megorzott evidence statuszt es V001/V002 integritast ellenorzi.
- A teljes C001-C012.4/M1-M6.1/C04 kapu az invalidalas elott PASS volt; ezt az evidence orzi, a lezaro integritas-kapu nem futtatja ujra a teljes torteneti lancot.
- C013 artifactok: `test-artifacts/V003-C013/`; exact candidate manual `file://` `NOT_RUN`, candidate `INVALIDATED_BY_C012.5_RELEASE_BLOCKER`. A regi `388a...` candidate kulon `INVALIDATED_BY_C012.3_RELEASE_BLOCKER`.

V003-C013 friss release-candidate kapu a lezart D2B source HEAD-bol:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c013-fresh.ps1"
```

- Forras: exact `6abae928b7d2f81e0b5eee2976a652feb0577c8d`; a fo HTML elterese azonnali STOP.
- Friss artifact: `test-artifacts/V003-C013/fresh-release-candidate/sPg Crafting List V003 RC.html`; a regi invalidalt candidate-ekhez nem nyul.
- Futtatja a teljes C001-C012.4/M1-M6.1/C04 kaput, a C012.5A-C3B2 lancot, valamint a candidate-en a D1 integralt FR-86 happy/shortage/backup/standalone tesztet.
- Candidate build/rebuild es SHA before/after byte-azonossag, single-file runtime, V001/V002 integritas es V003 tag/release hianya kotelezo.

V003-C012.5A célzott kapu (inventory independence, exact UUID identity, közvetlen Quality/numeric regresszió és stabil release-integritás):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0125a.ps1"
```

Csak a C012.5A model/fixture teszt:

```powershell
node .\tools\run-v003-c0125a-tests.mjs
```

- `v003-c0125a-inventory-independence`: inventory ∪ requirement source-set, inventory-only/requirement-only/dedup/delete-card, exact commodityUuid–ingredientUuid bridge, no-fuzzy negatív fixture, recipe-independent known material, backup/restore és közvetlen C012.3/C012.4 regresszió.
- Artifactok: `test-artifacts/V003-C012.5A/`.

V003-C012.5B célzott kapu (Combined Minimum/MAX Q pool, eligible inventory preview, persistence és stabil release-integritás):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0125b.ps1"
```

Csak a C012.5B model/fixture teszt:

```powershell
node .\tools\run-v003-c0125b-tests.mjs
```

- `v003-c0125b-combined-quality-pools`: két külön 0–1000 egész threshold, a C013.3 aktuális szemantikája szerint diszjunkt eligible preview, exact commodity/ingredient közös beállítás, no-fuzzy negatív fixture, inventory-only és recipe add/remove, backup/restore, régi backup és közvetlen C012.5A/C012.4/C012.3 regresszió.
- Artifactok: `test-artifacts/V003-C012.5B/`.

V003-C012.5C1 célzott kapu (Recipe Slot assignment model/perzisztencia; UI és allocation nélkül):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0125c1.ps1"
```

Csak a C012.5C1 FR-86 assignment modellteszt:

```powershell
node .\tools\run-v003-c0125c1-tests.mjs
```

- `v003-c0125c1-recipe-slot-assignment-model`: valid enum/fallback, per-slot/per-card/Duplicate függetlenség, reload/delete/backup/old-backup, változatlan C012.3 allocation, static gate és V001/V002 integrity.
- Artifactok: `test-artifacts/V003-C012.5C1/`.

V003-C012.5C2 célzott kapu (Recipe Pool dropdown UI; allocation-bekötés nélkül):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0125c2.ps1"
```

Csak a C012.5C2 UI/model célteszt:

```powershell
node .\tools\run-v003-c0125c2-tests.mjs
```

- `v003-c0125c2-recipe-pool-dropdown-ui`: transient draft, draft→Card, exact cardId binding, Browser/Crafting same-card állapot, per-slot/per-card/Duplicate függetlenség, legacy/invalid fallback, dinamikus Minimum/MAX label, reload és változatlan allocation/Max/Combined modell.
- A validator közvetlenül futtatja a C012.5C1/C012.5B/C012.5A/C012.3 kapukat, a static/single-file ellenőrzést és V001/V002 integritást; teljes történeti regressziót nem futtat.
- Artifactok: `test-artifacts/V003-C012.5C2/`.

V003-C012.5C3A célzott kapu (Recipe Slot pool assignment → Allocation Engine + Max DB):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0125c3a.ps1"
```

Csak a C012.5C3A allocation modellteszt:

```powershell
node .\tools\run-v003-c0125c3a-tests.mjs
```

- `v003-c0125c3a-pool-allocation-maxdb`: precedence, legacy fallback, ANY/Minimum/MAX, unresolved threshold, FIXED/UNKNOWN, batch order, FR-86 Quality-hiány, per-card/prioritás/no-double-count, canonical UUID és Max DB.
- A validator közvetlenül futtatja a C2/C1/B/A/C012.3 regressziókat, static/single-file kaput és V001/V002 integritást; teljes történeti regressziót nem futtat.
- Artifactok: `test-artifacts/V003-C012.5C3A/`.

V003-C012.5C3B1 célzott kapu (Combined Materials valódi pool-metrikák):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0125c3b1.ps1"
```

Csak a C012.5C3B1 aggregation célteszt:

```powershell
node .\tools\run-v003-c0125c3b1-tests.mjs
```

- `v003-c0125c3b1-combined-pool-metrics`: explicit Minimum/MAX allocation részösszegek, eligible/global no-double-count, Quality-hiány, unresolved threshold, ANY/legacy exclusion, multiple Card/prioritás, exact UUID és recipe delete/inventory-only.
- A validator közvetlenül futtatja a C3A/C2/C1/B/A regressziókat, a static/single-file kaput és V001/V002 integritást; teljes történeti regressziót nem futtat.
- Artifactok: `test-artifacts/V003-C012.5C3B1/`.

V003-C012.5C3B2 célzott kapu (standalone effective Quality projection):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0125c3b2.ps1"
```

Csak a C012.5C3B2 standalone célteszt:

```powershell
node .\tools\run-v003-c0125c3b2-tests.mjs
```

- `v003-c0125c3b2-standalone-effective-quality`: tárolt C3A eredményből Minimum/MAX, baseline > pool, ANY, legacy FIXED és unresolved presentation; recomputation nélkül.
- FR-86 Q550-only fixture: exact két Stileron slot, `Quality-hiány 1,9 SCU`, Card `UNSATISFIED`, editable controls/User Data write surface 0.
- Artifactok: `test-artifacts/V003-C012.5C3B2/`.

V003-C012.5D1 integrált automated gate:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0125d1.ps1"
```

Csak az integrált FR-86 fixture:

```powershell
node .\tools\run-v003-c0125d1-tests.mjs
```

- A D1 validator a C012.5 A/B/C1/C2/C3A/C3B1/C3B2, C012.3/C012.4, M4/M6, static/single-file és V001/V002 kaput futtatja.
- Chrome, localhost, User Data és teljes történeti release-suite nincs a D1 scope-ban.
- Artifactok: `test-artifacts/V003-C012.5D1/`.

V003-C013.1 célzott repair kapu (strict Quality scheduling + vegyes hiány):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0131.ps1"
```

- `v003-c0131-strict-quality-allocation-shortage`: Card-prioritás után same-card/canonical-material/unit csoportban magasabb effektív minimum Quality előbb; stabil slot-sorrend azonos küszöbnél.
- Kötelező FR-86 fixture: Field Q900+ `6 / 9,3 / 17 SCU`, Shell Q500+ `17 / 3,4 / 0 SCU` (reserved / amount shortage / Quality shortage), globális foglalás `23 SCU`, teljes hiány `29,7 SCU`, double reserve `0`.
- A célkapu lefedi a korábbi FR-86 happy/Q550, reverse-slot, két-Card prioritás, Combined/Final/Crafting/Maximum/standalone parity, M2/M4 és C012.3/C3A/C3B1/C3B2 regressziókat, static single-file és V001/V002 integritást.
- Teljes release-regresszió és RC rebuild nincs a C013.1 scope-ban. Artifactok: `test-artifacts/V003-C013.1/`.

V003-C013.2 friss release-candidate teljes kapu az exact C013.1 checkpointból:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0132-fresh.ps1"
```

- Exact source HEAD: `9a07de34643fed477399b070462aeb2be3d4f11a`; a builder Git-commit raw-byte copyval dolgozik.
- `v003-c0132-fresh-release-candidate`: determinisztikus single-file build, teljes releváns C001-C012.5C3B2 + D1 + M1-M6.1 + C04 + C013.1 regresszió, kötelező FR-86 mixed-shortage/parity és V001/V002 integritás.
- Candidate: `test-artifacts/V003-C013.2/fresh-release-candidate/sPg Crafting List V003 RC.html`.
- A Chrome localhost evidence külön, ugyanazon hash-zárolt candidate-en készül; exact manual candidate `file://` gate nincs automatizálva.

V003-C013.3 célzott repair kapu (diszjunkt poolok + exact canonical grouping):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0133.ps1"
```

Csak a C013.3 modellfixture:

```powershell
node .\tools\run-v003-c0133-tests.mjs
```

- `DISJOINT_MINIMUM_MAX_QUALITY_POOLS`: Minimum `[minimumQ, maximumQ)`, MAX `[maximumQ, +∞)`, borrowing/fallback nélkül; invalid tartomány fail-safe.
- `CANONICAL_MATERIAL_MULTI_SOURCE_UUID_GROUPING`: exact commodity↔ingredient UUID bridge, egy Titanium kártya/két batch/4,868 SCU, provenance megőrzéssel és fuzzy/name merge nélkül.
- A validator közvetlen M2/M4, C012.5A–C3B2, D1 és C013.1 regressziót, static single-file kaput, candidate immutabilityt és V001/V002 integritást ellenőriz. Teljes release-regresszió és Chrome nem része a scope-nak.
- Artifactok: `test-artifacts/V003-C013.3/`.

V003-C013.4 friss release-candidate teljes kapu az exact C013.3 checkpointból:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0134-fresh.ps1"
```

Csak a candidate-re kötött D1/C013.1/C013.3 célkapu:

```powershell
node .\tools\run-v003-c0134-fresh-tests.mjs
```

- Exact source HEAD: `2c138cf8cdaccb5a746bc0de7b6537259cc8985d`; Git-commit raw-byte copy, SHA-zár és determinisztikus rebuild.
- Teljes releváns C001–C012.5 + D1 + C013.1 + C013.3 + M1–M6.1 + C04, static/single-file, standalone és V001/V002 kapu.
- Candidate: `test-artifacts/V003-C013.4/fresh-release-candidate/sPg Crafting List V003 RC.html`.
- A valódi Chrome localhost evidence ugyanazon hash-zárolt candidate-en külön készül; exact manual candidate `file://` gate nincs automatizálva.

V003-C013.5 célzott repair kapu (exact canonical material picker dedup):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0135.ps1"
```

Külön célfixture és aktív 4.10 live audit:

```powershell
node .\tools\run-v003-c0135-tests.mjs
node .\tools\audit-v003-c0135-active-materials.mjs
```

- Feynmaline/Titanium picker dedup, exact UUID/name→UUID feloldás, canonical batch save, source provenance, runtime inventory grouping, reload/backup, Combined/Allocation/no-double-reserve és unresolved duplicate audit.
- A live audit csak exact same-name item-detail candidate-eket kér le és kizárólag bizonyított weight-1 `default_composition` kapcsolatot merge-el; fuzzy/name-only merge nincs.
- A validator C013.3, C012.5A, M2/M4, static single-file, C013.4 immutability és V001/V002 integritás regressziót futtat. Teljes release-regresszió és RC build nincs a C013.5 scope-ban.
- Artifactok: `test-artifacts/V003-C013.5/`.

V003-C013.6 teljes fresh release-candidate kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0136-fresh.ps1"
```

Csak a candidate-re kötött D1/C013.1/C013.3/C013.5 célkapu:

```powershell
node .\tools\run-v003-c0136-fresh-tests.mjs
```

- Exact source HEAD: `e4bc51672c072a8c8ecb4c5cc0db8ed622cde057`; determinisztikus Git-commit raw-byte copy és SHA-zár.
- Teljes releváns C001–C012.5 + D1 + C013.1 + C013.3 + C013.5 + M1–M6.1 + C04, static/single-file, standalone és V001/V002 kapu.
- Candidate: `test-artifacts/V003-C013.6/fresh-release-candidate/sPg Crafting List V003 RC.html`.
- A valódi Chrome localhost evidence ugyanazon hash-zárolt candidate-en készült; exact manual candidate `file://` gate nem futott.

V003-C013.7 célzott repair kapu (User Data-tól független canonical picker):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0137.ps1"
```

Csak a C013.7 modellfixture:

```powershell
node .\tools\run-v003-c0137-tests.mjs
```

- Feynmaline, Titanium, Tungsten és Gold canonical picker UUID-invariancia legacy User Data batch nélkül és mellett.
- Titanium legacy Q784 batch + új canonical Q866/Q920 batch: egy logical material, három batch, provenance/reload/backup megőrzéssel.
- My Materials, Combined, Allocation, no-double-reserve, no-fuzzy és unresolved duplicate viselkedés; közvetlen C013.5/C013.3/C012.5A/M2/M4 regresszió.
- A validator a C013.6 candidate változatlan SHA-ját és a stabil V001/V002 integritását ellenőrzi. Teljes release-regresszió, Chrome és új RC nem része a scope-nak.
- Artifactok: `test-artifacts/V003-C013.7/`.

V003-C013.8 teljes fresh release-candidate kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v003-c0138-fresh.ps1"
```

Csak a candidate-re kötött D1/C013.1/C013.3/C013.5/C013.7 célkapu:

```powershell
node .\tools\run-v003-c0138-fresh-tests.mjs
```

- Exact source HEAD: `490ed6fc3e94f2361c7448650a08752fa5f3c8c7`; determinisztikus Git-commit raw-byte copy és SHA-zár.
- Teljes releváns C001–C012.5 + D1 + C013.1/.3/.5/.7 + M1–M6.1 + C04, static/single-file, standalone, backup és V001/V002 kapu.
- Live aktív 4.10 audit: látható picker-duplikátum `0`, guessed canonical UUID `0`; a C013.6 countokkal való eltérés külön rögzül.
- Candidate: `test-artifacts/V003-C013.8/fresh-release-candidate/sPg Crafting List V003 RC.html`.
- A valódi Chrome localhost evidence ugyanazon hash-zárolt candidate-en készül; exact manual candidate `file://` gate nincs automatizálva.
