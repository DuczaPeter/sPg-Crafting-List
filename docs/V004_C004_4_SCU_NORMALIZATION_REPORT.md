# V004-C004.4 SCU Normalization Report

## Eredmény

`V004-C004.4 – 4-DECIMAL SCU NORMALIZATION PASS, C005 READY`

A V004 recipe-requirement SCU mennyiségei egyetlen, determinisztikus boundaryn normalizálódnak egész belső unitra. A normalizálás utáni Crafting Card, allocation, reservation, full/partial Craft Complete és History kizárólag egész unitot használ. A conservation tolerancia 0 unit.

A cycle a meglévő `develop/V004` branchen, a félbeszakadt dirty állapot megtartásával folytatódott. Input HEAD: `0b35f8ef4ba19530a302b3a086047a014e83290a`. A C004.3 checkpoint application SHA-256 értéke `1cc18a53ea41e27ae05f69e8195c4120cd5cc4e401446c62c8c2ee3742bcc0eb`, a folytatáskor talált dirty HTML-é `aeaadea4b1c4d0c605c2ca1a57864a472daac01fb8991509374cb1f0f59d557e` volt. Reset, rebase, history rewrite és módosításeldobás nem történt.

## Rögzített mennyiségi szabály

- `1 SCU = 10 000 unit`, ezért `1 unit = 0.0001 SCU`.
- Upstream/API SCU út: véges pozitív JavaScript `Number` → `String(Number)` → scientific notationt is kezelő decimális parser → 4 tizedes HALF-UP → egész unit.
- A parser a decimális számjegyeket `BigInt` aritmetikával dolgozza fel. A boundaryben nincs `Math.round`, `Math.floor`, `Math.ceil` vagy epsilon-korrekció.
- Kerekítés csak ezen a recipe source-boundaryn történik. Az eredmény után minden mennyiség pozitív safe integer unit.
- ITEM input csak véges, pozitív safe integer lehet.
- `0.00004 SCU` négy tizedesre `0.0000 SCU` és 0 unit, ezért `ROUNDS_TO_ZERO` blocker. Completion, fallback fogyasztás és durable write nincs.
- Full és partial completion conservation invariánsa változatlan: `before = consumed + after`, eltérés 0 unit.

## Numerikus mátrix

| Source SCU | Normalizált SCU | Unit | Eredmény |
|---:|---:|---:|---|
| 0.0001 | 0.0001 | 1 | PASS |
| 0.01 | 0.0100 | 100 | PASS |
| 0.07 | 0.0700 | 700 | PASS |
| 0.14 | 0.1400 | 1400 | PASS |
| 3.1 | 3.1000 | 31000 | PASS |
| 0.11000000000000001 | 0.1100 | 1100 | PASS |
| 3.0999999999999996 | 3.1000 | 31000 | PASS |
| 0.12344 | 0.1234 | 1234 | PASS |
| 0.12345 | 0.1235 | 1235 | PASS |
| 0.00005 | 0.0001 | 1 | PASS |
| 0.00004 | 0.0000 | 0 | BLOCKED: ROUNDS_TO_ZERO |

NaN, Infinity, nulla, negatív és unsafe normalizált SCU blokkolt. Fractional, nem véges, nulla, negatív és unsafe ITEM szintén blokkolt.

## Adatmodell és kompatibilitás

A normalized blueprint requirement, Crafting Card és reservation recipe slot ugyanazt az evidence-et viszi:

- source numerikus érték és canonical decimális szöveg;
- négytizedes normalizált SCU szöveg;
- normalizált egész unit és unit-szöveg;
- normalization status és rule;
- meglévő exactness mezők.

A reservation semantic fingerprint ezeket is köti. Craft Complete a jelenlegi Card requirement evidence-et újraszámolja és a reservationnel összeveti; mismatch esetén stale, nulla írás és explicit Reallocate szükséges.

A C004.3 Card új normalization-evidence mezők nélkül csak akkor emelhető automatikusan exact állapotba, ha a megőrzött source értékből számolt normalizált unit pontosan egyezik a Card `requiredQuantityUnits` értékével. Markerless legacy Card továbbra is `LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED`, látható explicit megerősítést és utána Reallocate lépést igényel. Schema-3 backuphoz a `REQUIREMENT_QUANTITY_NORMALIZATION_EVIDENCE_V1` kompatibilitási migrációs lépés került.

A `CRAFT_RUN_COUNT` szemantika változatlan. `OUTPUT_COUNT_UNPROVEN` megmaradt, nem completion gate, és a rendszer továbbra sem állít output count/yield/cardinality értéket.

## Teljes production audit

Aktív Game Data: `4.10.0-LIVE.12519617`.

- Blueprint: 1606.
- Ingredient: 4217.
- SCU requirement: 3919/3919 normalizálva.
- ITEM requirement: 298/298 normalizálva.
- Blokkolt SCU: 0.
- Blokkolt ITEM: 0.
- Unsupported requirement: 0.
- Érintett, completionre alkalmatlan blueprint: 0.
- Korábbi floating-representation eset: 6/6 normalizálva.

A Wiki adapter a HTTP response textet JSON-ként parse-olja, de az egyes numerikus mezők eredeti JSON literalját nem őrzi. Ezért a rögzített canonical boundary `String(JSON.parse numeric Number)`. Fragilis regexes JSON-parser nem készült; scientific notationt a decimális normalizáló kezel.

| Production minta | Forrás | Normalizálás | Állapot |
|---|---:|---:|---|
| LumaCore / Laranite detail | 0.14 SCU | 0.1400 / 1400 unit | completion-ready |
| Steadfast / Laranite detail | 0.07 SCU | 0.0700 / 700 unit | completion-ready |
| Steadfast / Laranite index aggregate | 0.11000000000000001 SCU | 0.1100 / 1100 unit | PASS |
| Omnisky III Cannon / Agricium | 0.36 SCU | 0.3600 / 3600 unit | completion-ready |
| Omnisky III Cannon / Hadanite és Dolivine | 7 ITEM | 7 unit | completion-ready |

A Steadfast detail két külön Laranite slotja 0.04 és 0.07 SCU; az index aggregate 0.11000000000000001 SCU. A két reprezentáció eltérése nem fuzzy összevonás: mindkettő saját source-értékéből determinisztikusan normalizálódik.

## Valódi Chrome eredmény

Google Chrome headless, production API/cache/normalize/Card út:

- LumaCore és Steadfast reservation `VALID`, completion-ready.
- Omnisky III Cannon 21 craftból 5 partial completion után 16 maradt.
- A partial exact fogyasztása 18000, 35 és 35 unit.
- Partial után a reservation stale; completion-time reallocation és más batch fallback nincs.
- Explicit Reallocate után a maradék 16 full completionje eltávolította a Cardot.
- Mindhárom batchben pontosan 1 unit maradt; material loss 0 unit.
- History két eventet és exact consumed unit deltákat őriz.
- My Materials partial és full után Q900 és exact aktuális SCU/ITEM készletet mutat.
- Reload után 0 aktív Card, 2 History event és 1/1/1 unit maradék.
- A `0.00004 SCU` eset completion-disabled, látható `ROUNDS_TO_ZERO` + javítás/Reallocate üzenettel; completion-kísérlet durable write-ja 0.
- Console error: 0. Page error: 0.

## Single-file és védett baseline

A végső application:

- útvonal: `sPg Crafting List.html`;
- runtime identity: `V004-dev`;
- méret: 1 013 727 byte;
- SHA-256: `b2b18b94196783984b2164084d184852eea79f2e686fa9b5c6e3ccaf01cdc706`;
- runtime HTML: 1;
- helyi JS/CSS/JSON sidecar: 0;
- embedded CSS és JavaScript: PASS;
- automated direct `file://` gate: PASS;
- kézi direct `file://` gate: NOT RUN BY DEVELOPMENT SCOPE.

V003 védelem:

- annotated tag target: `ebc83281769fd212d988ee55957b1c2754256490`;
- stable artifact: 835820 byte;
- stable SHA-256: `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`;
- V001/V002/V003 protected útvonal változás: 0.

Nem készült V004 release candidate vagy stable artifact, ezért candidate/stable byte-azonosság ebben a development cycle-ban nem alkalmazható.

## Futtatott ellenőrzések

A végső bounded validator parancsa:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v004-c0044.ps1" -PlaywrightModulePath "<workspace Playwright index.mjs abszolút útvonala>"
```

A kapu részei:

- baseline static: PASS;
- meglévő C004 atomikus model-regresszió: PASS;
- C004.4 determinisztikus model/static mátrix: PASS;
- teljes production dataset audit: PASS;
- C004.4 production Google Chrome: PASS;
- `git diff --check`: PASS;
- current-byte evidence: PASS;
- protected V003 előtte/utána: PASS.

Teljes release regression: NOT RUN BY SCOPE. Push, force push, rebase és history rewrite: NO. C005: NOT STARTED.

## Módosított fájlok

- `sPg Crafting List.html`
- `tools/run-v004-c0044-tests.mjs`
- `tools/audit-v004-c0044-production-scu-normalization.mjs`
- `tools/run-v004-c0044-browser-tests.mjs`
- `tools/validate-v004-c0044.ps1`
- `test-artifacts/V004-C004/model-evidence.json` – current-byte C004 model evidence
- `test-artifacts/V004-C004.4/*`
- `docs/V004_C004_4_SCU_NORMALIZATION_REPORT.md`
- `STATUS.md`, `TASKS.md`, `PROJECT_MAP.md`, `WORKLOG.md`, `USED_SKILLS.md`, `TEST_COMMANDS.md`, `VERSION.json`, `DECISIONS.md`

## Visszaállás

A cycle commit publikálás nélkül készül. Visszaállás normál `git revert <C004.4 commit>` művelettel végezhető; force push, reset és history rewrite nem szükséges. A V003 tag és stable artifact nem része a visszaállításnak.
