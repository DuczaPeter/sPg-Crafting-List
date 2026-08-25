# V003-C008 Detail View Report

> A public Wiki gomb C008-ban meg dokumentalt API-host viselkedeset a `V003-C008.1` korrekcio felulirta. Az aktualis public Wiki/API szabaly: `docs/V003_C008_1_PUBLIC_WIKI_REPORT.md`.

## Eredmeny

`V003-C008 – Single-file Detail View + Star Citizen Wiki deep links`: **PASS**.

A fejlesztes a `develop/V003` agon marad. Stabil V003 release vagy tag nem keszult, a fagyasztott V002 valtozatlan.

## Same-HTML detail architektura

- Egyetlen belso `#spgDetailView` felulet jeleniti meg a blueprint/item, material, Radar Signature, mining es UEX refinery reszleteket.
- A kozos adatforras a C006 `buildFinalCraftingCardViewModel()` snapshotja; a C001-C007 ranking, grouping, naming, Radar, color, hydration es allocation valtozatlan.
- Route: `#spg-detail=<kind>:<id>`.
- A `c008DetailController` kezeli a megnyitast, a related detail navigaciot, a bongeszo Visszat, a route reload utani visszaallitasat es az invalid-target fallbacket.
- A sajat `Vissza a Crafting Cardhoz` gomb a teljes aktualis detail-melyseget visszalepi. A bongeszo sajat Vissza gombja tovabbra is egy detail-szintet lep.

## Detail tartalom

- Blueprint/item: Size, Class, Type, Grade, Crafting Time es kulon Recipe Slotok.
- Material: category, curated Radar, Quality range, rarity, instability, resistance, valamint Nyx/Pyro/Stanton mining es UEX statusz.
- Radar: base, cluster range, multiplier, source/status es cluster-szintek; raw API adat csak Advanced alatt.
- Mining: a teljes C001-C005 Top-3 recommendation rendszerenkent, kulon NORMAL/SPACE kornyezettel, spawn, occurrence, Quality, provider es ranking-bizonyitekkal.
- Refinery: mapping status/origin/source/UEX ID, majd rendszerenkent a `value_month` szerinti legjobb refineryk es tie-ok. Stileron explicit `Nincs biztonsagos UEX refinery adat`.

## Star Citizen Wiki deep link szabaly

Feloldasi sorrend:

1. exact, engedelyezett Star Citizen Wiki API `web_url` (`API_WEB_URL`);
2. csak API-bol szarmazo es kulon auditalt slug (`AUDITED_API_SLUG_CANONICAL`);
3. bizonyitek hianyaban nincs link (`NO_PROVEN_WIKI_URL`).

Nevbol kepzett slug, fuzzy matching vagy altalanos URL-talalgatas nincs. Az elo audit HTTP 200 eredmennyel ellenorizte:

- `https://api.star-citizen.wiki/items/js-300?version=4.9.0-LIVE.12232306`
- `https://api.star-citizen.wiki/commodities/stileron-ore?version=4.9.0-LIVE.12232306`
- `https://api.star-citizen.wiki/commodities/beryl?version=4.9.0-LIVE.12232306`
- `https://api.star-citizen.wiki/commodities/savrilium-ore?version=4.9.0-LIVE.12232306`

A runtime cache exact `web_url` erteke elsoseget elvezhet; ezert egy masik, szinten API-altal adott canonical raw oldal is megjelenhet. A link uj lapon, `noopener noreferrer` vedelmmel nyilik.

## Standalone export

- A JS-300 fixture 13 elore renderelt detail targetet tartalmaz: 1 blueprint/item es 3 materialhoz 4-4 material/radar/mining/refinery panel.
- Minden adat az embedded snapshotbol jon; nincs runtime fetch.
- Embedded CSS es JavaScript, kulso runtime/network resource: `0`.
- Item/material/radar/mining/refinery kattintas, browser Back, sajat Back, reload-route es invalid-target fallback Chrome-ban PASS.
- A Wiki link opcionális kulso navigacio; a kartya es minden belso detail internet nelkul is mukodik.

## Tesztek

- `tools/validate-v003-c008.ps1`: PASS.
- C008 celzott detail/router/standalone teszt: PASS.
- Elo Wiki deep-link audit: PASS.
- Teljes C001-C007 + M1-M6.1 + C04 regresszio: PASS.
- V002 tag commit: `b326aaff5838aafd5b1f13b16982c29a0e150e35`.
- V002 HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`.

## Valodi Chrome localhost

- Technical Probe: `15 PASS / 0 FAIL`.
- Main app detail es standalone detail minden tipusra PASS.
- A JS-300 detail desktop layout vizualis ellenorzese PASS.
- Browser Back, sajat Back, reload es invalid route PASS.
- User Data fingerprint: `e6d8dec8 -> e6d8dec8`.
- Main app console warning/error: `0`.
- Standalone console warning/error: `0`.

A korabbi C007 valodi Chrome `file://` kaput a felhasznalo PASS-kent jelentette. Ez `USER MANUAL PASS_NOT_CODEX_AUTOMATION`, nem Codex altal futtatott automation.

## Nyitott kovetkezo lepes

A ciklus itt megall felhasznaloi vizualis ellenorzesre. `V003-C009`, stabil V003 release es V003 tag nincs elinditva vagy engedelyezve.
