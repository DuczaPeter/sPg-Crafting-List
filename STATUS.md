# STATUS.md

- Projekt neve: `sPg Crafting List`
- Rovid cel: `Star Citizen crafting-, inventory-, Quality-, mining- es loadout-tervezo helyi webalkalmazas elkeszitese.`
- Projekt tipus: `egyfajlos helyi webalkalmazas: sPg Crafting List.html embedded CSS-sel es JavaScripttel`
- Aktualis allapot: `V003-dev C009 – FINAL MAIN VIEW + EXACT CRAFTING CARD REFERENCE + API DEEP-LINK CORRECTION PASS`
- Stabil verzio vagy baseline: `V002`
- Stabil fajl, commit vagy tag: `releases/V002/sPg Crafting List.html; tag V002`
- Aktualis fejlesztesi celverzio: `V003-dev`
- Aktualis javitasi ciklus: `V003-C009`
- Utolso sikeres ciklus: `V003-C009`
- Candidate vagy munkaverzio: `sPg Crafting List.html (V003-dev single-file munkaverzio)`
- Aktualis branch: `develop/V003`
- Utolso ellenorzesi szint: `PASS`
- Kovetkezo kotelezo teszt: `felhasznaloi vizualis ellenorzes; V003-C010 nincs elinditva`
- Aktualis feladat: `C009 referencia-alapu fo nezet, kompakt Crafting Card es exact API source link lezart`
- Blokkolo problema: `nincs fejlesztesi blokkolo; stabil V003 release/tag nincs engedelyezve`
- Kovetkezo lepes: `megallas a felhasznaloi vizualis ellenorzeshez; stabil V003 release/tag es V003-C010 nincs engedelyezve`
- Utolso frissites: `2026-08-25T07:04:18+02:00`

## Ellenorzesi igazsag

Csak azt jelold mukodonek vagy stabilnak, amit tenylegesen ellenoriztel.

- C009 automatizalt: referencia-alapu fo nezet es Crafting Card, source-record-only `resolveItemApiDeepLink()` / `resolveMaterialApiDeepLink()`, kompakt slot/stock, rendszerenkenti top mining/refinery, curated Radar chipek, standalone parity es teljes C001-C008.1 + M1-M6.1 + C04 regresszio PASS.
- Public Wiki user UI: eltavolitva. A korabbi `resolvePublicWikiDeepLink()` csak belso torteneti/audit snapshot celra maradt; a normal es standalone UI-ban kizárólag a pontos `API adatlap` muvelet latszik.
- Exact API audit: JS-300 `items/js-300`, Stileron `commodities/stileron-ore`, Beryl `commodities/beryl-raw`, Savrilium `commodities/savrilium-ore`; mind a hidratalt forrasrekordbol, nevbol kepzett/fuzzy URL nelkul.
- C009 valodi Chrome localhost: Technical Probe 15/15, main/detail Back+reload, 390 px responsive layout, quantity visszaallitas es standalone PASS; fingerprint `d7be3ccc -> d7be3ccc`; alkalmazas-konzol warning/error 0.
- C007 valodi Chrome `file://`: `USER MANUAL PASS_NOT_CODEX_AUTOMATION`; a felhasznalo jelentette, nem Codex automation futtatta.
- Stabil V002 tag commit `b326aaff...150e35` es HTML SHA-256 `de2d59b4...9f2357` valtozatlan; stabil V003 release/tag nem keszult.
