# V003-C012.5C2 – Recipe Pool Dropdown UI

## Eredmény

`V003-C012.5C2 – RECIPE POOL DROPDOWN UI PASS, C012.5C3 NOT STARTED`

A C012.5C1-ben rögzített `craftingCards[].recipeSlotQualityPoolAssignments[recipeSlotId]` modell szerkeszthető dropdown UI-t kapott a Blueprint Browser Final Crafting Card és a Crafting List Recipe Slot soraiban. Allocation-, Max DB-, Combined allocation- és standalone-számítás nem változott.

## Dropdown és állapotmodell

Megjelenő opciók:

- `Recept szerint · <aktuális C012.3 effective label>` – nincs explicit persistált assignment;
- `Bármely Q` → `ANY_Q`;
- `Minimum Q · Qxxx+` → `MINIMUM_Q_POOL`;
- `MAX Q · Qxxx+` → `MAXIMUM_Q_POOL`.

Minimum/MAX értéket a Card nem tárol. A felirat mindig a material aktuális `materialQualityPools` beállításából épül, ezért a pool módosítása után újrarenderelve automatikusan változik. Hiányzó thresholdnál `nincs beállítva` jelenik meg.

Fő függvények:

- `renderRecipeSlotQualityPoolSelect()` – közös Browser/Crafting renderer;
- `buildRecipeSlotQualityPoolUiModel()` – opciók, label és fallback;
- `resolveFinalCardQualityPoolAssignmentSource()` – kizárólag exact `cardId` kötés, blueprint UUID szerinti keresés nélkül;
- `updateC010RecipeSlotQualityPoolAssignment()` – transient draft vagy exact kötött Card frissítése;
- `updateRecipeSlotQualityPoolAssignment()` – persistált Crafting Card assignment;
- `applyRecipeSlotQualityPoolAssignmentsToCard()` – draft → új Card másolás;
- `syncC010FinalCardQualityPoolAssignments()` – ugyanazon Card Browser/Crafting szinkron.

Blueprint betöltése előtt az assignment a nem persistált `finalCardDraftQualityPoolAssignments` state-ben él. Kosár-műveletkor az új Card kapja meg; ezután a Browser preview az új exact `cardId`-hoz kötődik. Két azonos blueprintű Card nem kapcsolódik össze. Duplicate örökli a mapet, majd külön objektumként szerkeszthető.

## Védett határok

- Az `allocateCardsDeterministically(cards, batches, materialQualityPlans, canonicalMaterials)` aláírása és logikája változatlan.
- C2 assignment váltáskor allocation/reserved/missing/missingQuality/Max/batch order/Combined metrika nem változik.
- A régi Advanced Quality editor külön legacy state maradt.
- A standalone export nem kap dropdownot vagy runtime szerkesztést; a meglévő snapshot-modell változatlan.
- V001/V002 tag, release és stabil artifact változatlan.

## Automatizált ellenőrzés

`tools/validate-v003-c0125c2.ps1`:

- static/single-file/JS gate PASS;
- C012.5C2 célteszt PASS;
- C012.5C1 közvetlen modellteszt PASS;
- C012.5B, C012.5A és C012.3 közvetlen regresszió PASS;
- FR-86 draft, draft→Card, exact binding, same-card, per-slot, per-card, duplicate, clear-explicit, invalid fallback és dynamic label PASS;
- allocation unchanged PASS;
- standalone editable dropdown: nincs;
- V001/V002 integrity PASS;
- V003 tag/release: nincs.

## Valódi Chrome localhost

- JS-300: 3 dropdown, legacy label helyesen `Q500+` / `Bármely Q`.
- Draft Shell `MINIMUM_Q_POOL` → új Card másolás PASS.
- Crafting List Shell `MAXIMUM_Q_POOL` → Browser ugyanazon exact Cardon azonnal azonos állapot PASS.
- Három másik, azonos blueprintű JS-300 Card legacy maradt: per-card függetlenség PASS.
- Reload után az explicit Card assignment megmaradt PASS.
- 1366×768 overflow: 0.
- 390×844 overflow: 0; látható dropdownszélesség: 89 px.
- Konzol WARN/ERROR: 0.

A teszt egyetlen ideiglenes JS-300 Cardot hozott létre, majd felhasználói jóváhagyással kizárólag ezt törölte. Card count `5 → 6 → 5`, explicit teszt-assignment `0 → 1 → 0`. Fingerprint `3e2bcb00 → b965ee32 → f3ad8800`; a végérték változtatásmentes reloadon `f3ad8800 → f3ad8800`. A biteltérés oka, hogy a meglévő `saveCraftingCards()` minden Card mentésekor valamennyi megmaradó Card `updatedAt` mezőjét `nowIso()` értékre frissíti. A törlési útvonal csak a `craftingCards` snapshotot írta; más User Data rekord nem lett törölve.

Chrome evidence: `test-artifacts/V003-C012.5C2/chrome-localhost-evidence.json`.

## Visszaállás

A C012.5C2 commit revertje eltávolítja a dropdown UI-t, a transient preview state-et és a C2 teszteket. A C012.5C1 assignment storage továbbra is külön baseline. Stabil fallback: változatlan V002.
