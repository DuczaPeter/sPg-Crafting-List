# V004-C004.3 Craft Run Quantity Semantics Report

## Eredmény

`V004-C004.3 – CRAFT RUN SEMANTICS PASS, LIVE EXACT-INPUT CRAFT COMPLETE ENABLED`

Az input checkpoint `db3d0a71d45e840247ce6f029290104a8f16b84e`, az elkészült alkalmazás SHA-256 értéke `1cc18a53ea41e27ae05f69e8195c4120cd5cc4e401446c62c8c2ee3742bcc0eb`. A runtime identity `V004-dev` maradt. A C004.3 a meglévő cycle folytatása; C005 nem indult el.

## Rögzített szemantika

A Crafting Card `quantity` mezője most explicit craft-run count. Egy érték azt jelenti, hányszor hajtjuk végre a receptet; nem jelenti azt, hogy hány output item készül. Ezért a Card és a History külön őrzi:

- `quantitySemantics = CRAFT_RUN_COUNT`;
- `craftRunInputEvidence = CRAFT_RUN_INPUTS_EXACT` vagy `CRAFT_RUN_INPUTS_UNPROVEN`;
- `outputCountEvidence = OUTPUT_COUNT_UNPROVEN`.

Az output count/yield/cardinality továbbra sincs upstream bizonyítékkal alátámasztva. A rendszer nem állít `outputCount = 1` értéket. A C004.2 evidence diagnosztikaként megmarad, de nem blokkol egy olyan craft-futást, amelynek minden bemeneti requirementje exact.

## Exact input szabály

Minden requirement megőrzi a source értéket és az exactness evidence-et:

- SCU: `sourceQuantityValue * 10000` közvetlenül, pozitív safe integer eredménnyel;
- ITEM: a source érték közvetlenül pozitív safe integer;
- engedélyezett tolerancia: `0 unit`;
- `Math.round`, floor, ceil és epsilon-alapú korrekció: tilos.

Az exact Cardon `exactRequiredQuantityUnits` található. A régi `requiredQuantityUnits` a tervezési és allocation kompatibilitás miatt megmaradt, de completionkor pontosan egyeznie kell az exact értékkel. Eltérés esetén a completion blokkolt.

A célzott numerikus mátrix PASS eredménye:

| Source | Unit | Eredmény |
|---|---:|---:|
| `0.35` | SCU | exact `3500` unit |
| `0.0001` | SCU | exact `1` unit |
| `7` | ITEM | exact `7` unit |
| `0.11000000000000001` | SCU | unproven, blocked |
| `3.0999999999999996` | SCU | unproven, blocked |
| `7.5`, NaN, Infinity vagy unsafe integer | ITEM | unproven, blocked |

## Production bizonyítás

Az exact live út a Wiki `4.10.0-LIVE.12519617` datasetből cache-elt, nyers és normalizált rekorddal futott:

- Blueprint: Omnisky III Cannon;
- UUID: `280f47b7-8434-410c-b854-380768fdccec`;
- Agricium `0.36 SCU` → `3600` unit;
- Hadanite `7 ITEM` → `7` unit;
- Dolivine `7 ITEM` → `7` unit.

A Card 21 craft-futással indult. A partial completion 5 futást zárt le, így 16 maradt; exact fogyasztás `18000`, `35`, `35` unit. A completion után a reservation stale lett. Az újraszámítás nélküli következő kísérlet `STALE_RESERVATION` állapotban, nulla írással és fallback nélkül blokkolt. Explicit Reallocate után a maradék 16 craft-futás full completionje eltávolította a Cardot. A három batch végső készlete pontosan `1`, `1`, `1` unit lett.

A nonexact live út szintén tényleges production rekorddal futott:

- Blueprint output: Steadfast;
- UUID: `5af6beb3-4030-4a32-bb77-2a9b729483f5`;
- Laranite source requirement: `0.07 SCU`;
- a közvetlen JavaScript-szorzás eredménye nem exact safe integer, ezért `CRAFT_RUN_INPUTS_UNPROVEN`.

A recept látható és tervezhető marad, de a Complete tiltott. A kísérlet nem érte el a completion tranzakciót, inventory write `0`.

## Stale reservation és inventory conservation

Full és partial Craft Complete pontosan az aktuálisan látható reservation batch-listáját fogyasztja. Completion közben nincs reallocation, más eligible batch, Quality-csere vagy fallback. Bármely hiányzó, kevés, módosult vagy más okból érvénytelen reserved entry az egész műveletet `STALE_RESERVATION` állapotban blokkolja, és explicit Reallocate lépést kér.

Az atomi C004 commit-szerződés megmaradt: batch deduction, inventory aggregate, Card, append-only History és revision meta egy tranzakció. A korábbi célzott négy rollback-injection és az idempotens replay ismét PASS. Minden esetben érvényes:

`before = consumed + after`

Az engedélyezett anyagveszteség `0 unit`; a bizonyított futás anyagvesztesége `0 unit`. A History exact consumed unit deltákat tárolja, így a későbbi Undo szerződése változatlanul exact visszaállításra épül.

## Legacy és backup kompatibilitás

Hiányzó Card marker esetén nincs automatikus craft-run következtetés:

- Card: `LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED`;
- input evidence: `CRAFT_RUN_INPUTS_UNPROVEN`;
- markerless History: `LEGACY_HISTORY_QUANTITY_SEMANTICS_UNKNOWN`.

A látható `21 craftként használom` megerősítés a 21-es számot változatlanul hagyja. A Card revision `+1`, az allocation revision `+1`, az inventory és craft list revision `+0`; a reservation stale lesz, és explicit Reallocate szükséges. A V003 direct migration és a schema-3 backup/import kompatibilitás ugyanezt a fail-closed osztályozást alkalmazza, és nem hamisít craft-run vagy output bizonyítékot.

## UI és schema markerek

A felhasználói szövegek a döntést tükrözik: `Craftok száma`, `Lezárt craftok`, `1 crafthoz`, illetve `<quantity> crafthoz`. A MAX továbbra is csak az inputot tölti ki, durable írás nélkül. A reservation sorok láthatóan mutatják az egy craft és az összes craft anyagigényét, a reserved mennyiséget, Qualityt és batch-listát.

Az új runtime markerek:

- `V004_RESERVATION_SNAPSHOT_2`;
- `V004_CRAFT_COMPLETE_REQUEST_2`;
- `V004_CRAFT_HISTORY_EVENT_2`.

A reservation mező neve `perCraftRequiredUnits`; ezzel nem keverhető össze a kész output item darabszámával.

## Ellenőrzés

Futtatott célzott kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v004-c0043.ps1" -PlaywrightModulePath "<workspace Playwright index.mjs abszolút útvonala>"
```

A kapu lefuttatta:

- C004.3 determinisztikus model/static tesztet;
- valódi Google Chrome production exact és nonexact API/cache utat;
- partial/full/stale/Reallocate/reload/direct `file://` ellenőrzést;
- a korábbi C004 atomic modellregressziót, rollbackkel és idempotenciával;
- single-file dependency és protected V003 tag/artifact kaput;
- `git diff --check` vizsgálatot.

Eredmény: PASS. A C004 Chrome-regresszió külön is újrafutott az aktuális HTML-bájtokon, PASS eredménnyel. Böngésző console error `0`. A direct `file://` ellenőrzés automatizált, nem kézi kapu. Runtime fájl `1`, helyi runtime sidecar `0`. Teljes történeti/release regression nem futott a cycle scope szerint.

Evidence:

- `test-artifacts/V004-C004.3/model-evidence.json`;
- `test-artifacts/V004-C004.3/browser-evidence.json`;
- `test-artifacts/V004-C004.3/target-summary.json`;
- `test-artifacts/V004-C004.3/validation.log`;
- `test-artifacts/V004-C004/` frissített atomic regression evidence.

## Védett baseline, kizárások és rollback

A V003 tag target változatlanul `ebc83281769fd212d988ee55957b1c2754256490`. A `releases/V003/sPg Crafting List.html` továbbra is `835820` byte és SHA-256 értéke `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`. A V003 protected release nem módosult.

Undo/Redo, History UI, BroadcastChannel, stable V004 release, C005, remote push és force push nincs ebben a cycle-ban. A helyi C004.3 checkpoint normál `git revert` művelettel állítható vissza; protected taget vagy release artifactot nem kell és nem szabad átírni.
