# V003-C012 – Crafting List Final Crafting Card visual parity

## Eredmény

`PASS` a `develop/V003` ágon. A Blueprint Browser és a többkártyás Crafting List ugyanazt a kanonikus Final Crafting Card view-modelt és DOM renderert használja. Stabil V003 release vagy tag nem készült; C013 nem indult el.

## Közös megjelenítési útvonal

- Adatprojekció: `buildFinalCraftingCardViewModel()`.
- Közös DOM renderer: `renderFinalCraftingCardContent()`.
- A Crafting List csak a prioritás-, kártyaművelet-, expanded/collapsed- és Quality-stratégia vezérlést teszi a közös kártya köré.
- Recipe, material, készlet/hiány, Mining, Refinery, Radar és exact API-link megjelenítés nem külön Crafting List implementáció.
- A standalone export továbbra is ugyanazt a kanonikus view-modelt és meglévő snapshot/presentation helper-réteget használja; külső runtime erőforrás nincs.

## Crafting List működés

- Háromkártyás referencia: JS-300, FR-66, XL-1; prioritás 1/2/3; 2 expanded és 1 collapsed.
- Tízkártyás stressz: 2 expanded és 8 collapsed, vízszintes túlcsordulás nélkül.
- A quantity mező input közben debounced módon is mentődik, így blur nélkül is túléli a reloadot.
- A kártyasorrend módosítása tartós, és a meglévő determinisztikus Allocation Engine ugyanebben a sorrendben foglal.
- A C008 detail route megőrzi a forráskártya azonosítóját és modult; reload után is helyreáll, a böngésző Vissza a megfelelő Crafting List kártyához tér vissza.

## Automatizált ellenőrzés

`tools/validate-v003-c012.ps1`: `PASS`.

- C001–C011 és M1–M6.1 + C04: PASS
- C012 háromkártyás és tízkártyás célteszt: PASS
- expanded/collapsed perzisztencia: PASS
- azonos materialt használó kártyák prioritáscseréje és allocation: PASS
- source-card-aware C008 detail: PASS
- standalone/single-file: PASS; külső runtime erőforrás: 0
- V002 tag commit: `b326aaff5838aafd5b1f13b16982c29a0e150e35`
- V002 HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`

## Valódi Chrome localhost

- Technical Probe: `15 PASS / 0 FAIL`
- 3 kártya: JS-300/FR-66/XL-1, `2 expanded / 1 collapsed`, quantity `2/1/1`
- prioritáscsere, reload-perzisztencia és eredeti sorrend visszaállítása: PASS
- 10 kártya: `2 expanded / 8 collapsed`, horizontal overflow: `0`
- 1920×1080, 1366×768 és 390×844: horizontal overflow `0`
- source-card detail reload + browser Back: PASS; visszatérés az FR-66 kártyához
- exact API-link host: kizárólag `api.star-citizen.wiki`
- User Data fingerprint: `78b870b4 -> 78b870b4`
- alkalmazás konzol WARN/ERROR: `0`

Helyi képernyőképek:

- `test-artifacts/V003-C012/chrome-crafting-list-3-cards-1920x1080.png`
- `test-artifacts/V003-C012/chrome-crafting-list-1366x768.png`
- `test-artifacts/V003-C012/chrome-crafting-list-mobile-card-390x844.png`
- `test-artifacts/V003-C012/chrome-crafting-list-10-card-stress-1920x1080.png`

## Visszaállás

A C012 commit revertje visszaállítja a C011 állapotot. Biztos stabil fallback a változatlan `V002` tag és `releases/V002/` artifact.
