# V003-C012.1 – Material Quality Planner és allocation-aware Combined Materials

## Eredmény

`PASS` a `develop/V003` ágon. A Final Crafting Card, a Crafting List, a Combined Materials, az Allocation Engine és a standalone export egyetlen effektív Quality-policyból dolgozik. Stabil V003 release vagy tag nem készült; C013 nem indult el.

## Közös Quality-modell

- Resolver: `resolveEffectiveMaterialQualityPolicy()`.
- Felirat és tooltip: `formatEffectiveQualityLabel()` és `formatEffectiveQualityTooltip()`.
- Materialterv-módok: `RECIPE`, `TARGET_Q`, `HIGHEST_Q`.
- Tárolás: exact material UUID szerint, a `user:materialQualityPlans` USER-scoped settingben.
- Alapértelmezés: `RECIPE`, ezért meglévő User Data vagy explicit terv nélküli futás a C012 allocation eredményét tartja meg.
- A numerikus cél egész `Q0–Q1000`; effektív minimum `max(recept minimum, material cél)`, tehát a terv nem gyengítheti a receptet.
- `FIXED` mindig `Bármely Q`, `UNKNOWN` mindig `Q?`; materialterv ezeket nem írja felül.
- A séma nem változott. A meglévő backup/restore már tartalmazza a USER setting rekordot; régi adatnál a hiányzó terv automatikusan `RECIPE`.

## Allocation és Combined Materials

- A determinisztikus Allocation Engine ugyanazt a resolvert használja a tényleges foglalás és a max craftable számításakor.
- `TARGET_Q` a legalacsonyabb megfelelő batchből, `HIGHEST_Q` a legmagasabb megfelelő batchből foglal; a kártyasorrend továbbra is prioritás.
- A `buildCombinedMaterialsOverviewViewModel()` materialkártyákat, effektív Quality-bucketeket és összesített szükséges/lefoglalt/hiány értékeket projektál a valódi allocation eredményből.
- A bucket foglalások összege a material valódi foglalásával egyezik; ugyanaz a batch nem számolható kétszer, az összes foglalás nem haladhatja meg az inventoryt.
- Az egység a forrásadatból jön, ezért az `ITEM` mennyiség nem jelenik meg SCU-ként.
- A Combined detail a meglévő `resolveC008DetailModel()` és `c008RenderDetailMarkup()` útvonal `combined` ágát használja. Recipe Slotonként megőrzi a baseline szabályt, materialtervet, effektív Qualityt, reservationt, batch Qualityt és hiányokot.
- Az exact commodity link a meglévő `resolveMaterialApiDeepLink()` resolverből jön; új URL-generátor nincs. Back és reload PASS.

## Acceptance-fixture-ek

- Policy-mátrix: `HP_MIN_500`, `TARGET_Q 750`, `HIGHEST_Q`, `FIXED`, `UNKNOWN` baseline `RECIPE`, `TARGET_Q 900` és `HIGHEST_Q` tervvel PASS.
- Q900 override: `HP_MIN_500 -> Q900+`, `TARGET_Q 750 -> Q900+`, `HIGHEST_Q -> Q900+`; `FIXED -> Bármely Q`, `UNKNOWN -> Q?`.
- Gyengébb override: recept `Q750+`, material `Q700` esetén effektív `Q750+`.
- Q900 allocation: a Q930 batch fogy a Q990 előtt. Legjobb elérhető: Q990 fogy először.
- Standalone Q900 célfixture: a valódi Q900 allocationből épített export-snapshot `TARGET_Q` és `Q900+` értéket, a renderelt HTML `Q900+` feliratot tartalmaz; külső runtime erőforrás nincs.
- Double-count fixture: Q517 és Q950 két külön slothoz, bucket-sum és batchenkénti foglalási korlát PASS.
- Priority swap: a sorrendcsere determinisztikusan átadja a szűk Q930 készletet az új első kártyának.
- Max craftable: csak Q800 inventory mellett alapállapotban `1`, Q900 materialtervvel `0`.
- JS-300 alapállapot: Shell/Stileron `HP_MIN_500 -> RECIPE -> Q500+`; Voltage Regulator/Beryl `FIXED -> RECIPE -> Bármely Q`; Stator Cores/Savrilium `FIXED -> RECIPE -> Bármely Q`.
- JS-300, FR-66 és XL-1 háromkártyás böngészős parity PASS; a Stileron Q900 terv reload után is megmaradt.

## Standalone és Chrome

- Standalone: `test-artifacts/V003-C012.1/standalone-js-300-quality-plan.html`, 220 359 byte, SHA-256 `f1eabe9a129748fb904538526cbf458fd22d9f5388214134e6b52434c7c2a4bc`.
- A standalone az export pillanatának effektív Quality snapshotját használja; külső runtime resource és runtime fetch: `0`.
- Teljes `tools/validate-v003-c0121.ps1`: C001–C012 + M1–M6.1 + C04 + C012.1, standalone és V002-integritás `PASS`.
- Valódi Chrome localhost: Technical Probe `15 PASS / 0 FAIL`; 1920×1080, 1366×768 és 390×844 horizontal overflow `0`; Combined detail reload/Back PASS; konzol WARN/ERROR `0`.
- User Data fingerprint stabil reload előtt/után: `c4a49ff0 -> c4a49ff0`.
- Vizuális referencia: `Info/Combined Materials.png`, SHA-256 `f1883eca222bb1a5172b90c31cb9be8f724f6366841483f0bdff2cc14bdb7cb6`.

Helyi képernyőképek:

- `test-artifacts/V003-C012.1/chrome-1920-blueprint-final-card-quality.png`
- `test-artifacts/V003-C012.1/chrome-1920-crafting-list-three-cards.png`
- `test-artifacts/V003-C012.1/chrome-1920-combined-quality-planner.png`
- `test-artifacts/V003-C012.1/chrome-1366-combined-quality-planner.png`
- `test-artifacts/V003-C012.1/chrome-390-combined-quality-planner.png`

## V002 és visszaállás

- V002 tag commit: `b326aaff5838aafd5b1f13b16982c29a0e150e35`.
- V002 HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`.
- Mindkettő változatlan. A C012.1 commit revertje visszaállítja a C012 állapotot; biztos stabil fallback a fagyasztott V002 tag/release.
