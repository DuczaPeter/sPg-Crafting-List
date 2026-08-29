# STATUS.md

- Projekt neve: `sPg Crafting List`
- Rovid cel: `Star Citizen crafting-, inventory-, Quality-, mining- es loadout-tervezo helyi webalkalmazas elkeszitese.`
- Projekt tipus: `egyfajlos helyi webalkalmazas: sPg Crafting List.html embedded CSS-sel es JavaScripttel`
- Aktualis allapot: `V003-dev C012.1 – MATERIAL QUALITY PLANNER PASS`
- Stabil verzio vagy baseline: `V002`
- Stabil fajl, commit vagy tag: `releases/V002/sPg Crafting List.html; tag V002`
- Aktualis fejlesztesi celverzio: `V003-dev`
- Aktualis javitasi ciklus: `V003-C012.1`
- Utolso sikeres ciklus: `V003-C012.1`
- Candidate vagy munkaverzio: `sPg Crafting List.html (V003-dev single-file munkaverzio)`
- Aktualis branch: `develop/V003`
- Utolso ellenorzesi szint: `PASS`
- Kovetkezo kotelezo teszt: `felhasznaloi vizualis es mukodesi ellenorzes a C012.1 Quality Planner screenshotok alapjan`
- Aktualis feladat: `C012.1 kozos effektív Quality policy es allocation-aware Combined Materials kor lezart`
- Blokkolo problema: `nincs fejlesztesi blokkolo; stabil V003 release/tag nincs engedelyezve`
- Kovetkezo lepes: `megallas felhasznaloi vizualis es mukodesi ellenorzeshez; C013 es stabil V003 release/tag nincs engedelyezve`
- Utolso frissites: `2026-08-29T06:09:39+02:00`

## Ellenorzesi igazsag

Csak azt jelold mukodonek vagy stabilnak, amit tenylegesen ellenoriztel.

- C010 automatizalt: default bal Blueprint Browser + jobb egyetlen Final Crafting Card, kulon navigacios teljes Crafting List, kompakt header/quantity/max/recipe/stock/material intelligence, pontosan 8 curated Radar chip, standalone parity es teljes C001-C010 + M1-M6.1 + C04 regresszio PASS.
- C010.1 automatizalt: az elso kivalasztott top mining tier bizonyitott presentation groupjai es a UEX `rankingValue` exact nyertesei kompakt, determinisztikus `elso (+N azonos legjobb)` projekciot kapnak; `+N további`, terminal-prefix es slash-lista nincs a Final Cardon. A nyers snapshot/detail valtozatlan.
- Public Wiki user UI: eltavolitva. A korabbi `resolvePublicWikiDeepLink()` csak belso torteneti/audit snapshot celra maradt; a normal es standalone UI-ban kizárólag a pontos `API adatlap` muvelet latszik.
- Exact API audit: JS-300 `items/js-300`, Stileron `commodities/stileron-ore`, Beryl `commodities/beryl-raw`, Savrilium `commodities/savrilium-ore`; mind a hidratalt forrasrekordbol, nevbol kepzett/fuzzy URL nelkul.
- C010.1 valodi Chrome localhost: Technical Probe 15/15, main es standalone compact parity, detail reload + browser Back, 390 px tulcsordulasmentes layout PASS; fingerprint `d7be3ccc -> d7be3ccc`; alkalmazas/standalone konzol warning/error 0.
- C011 automatizalt: a ket referencia-PNG SHA-zar alatt; a normal Blueprint Browserben a technikai detail/cache blokk lathato elemszama 0, a modelladat megmarad, a lista viewportmagassagu belso scrollt kapott; C001-C010.1 + M1-M6.1 + C04 es standalone PASS.
- C011 valodi Chrome localhost: 1920x1080, 1366x768 es 390x844 PASS, horizontal overflow 0, JS-300 3 recipe/3 material/8 Radar, detail Back+reload PASS, Technical Probe 15/15, fingerprint `d7be3ccc -> d7be3ccc`, main/standalone konzol warning/error 0.
- C012 automatizalt: a Blueprint Browser es a Crafting List ugyanazt a `buildFinalCraftingCardViewModel()` + `renderFinalCraftingCardContent()` utvonalat hasznalja; 3- es 10-kartyas fixture, 2 expanded/1 collapsed, prioritascsere/allocation, forraskartya-aware detail, standalone es teljes C001-C011 + M1-M6.1 + C04 regresszio PASS.
- C012 valodi Chrome localhost: JS-300/FR-66/XL-1 harom kartya, 2 expanded/1 collapsed, quantity `2/1/1`, sorrendmentes + visszaallitas, 1920x1080/1366x768/390x844 es 10-kartyas stressz horizontal overflow 0; Technical Probe 15/15, detail reload+Back a forras FR-66 kartyahoz, fingerprint `78b870b4 -> 78b870b4`, konzol WARN/ERROR 0.
- C012.1 automatizalt: kozos `resolveEffectiveMaterialQualityPolicy()` es `formatEffectiveQualityLabel()` a Final Card, Crafting List, Combined Materials, Allocation Engine es standalone szamara; RECIPE/TARGET_Q/HIGHEST_Q, FIXED/UNKNOWN vedelme, Quality-bucket no-double-count, priority/max, backup/restore es teljes C001-C012 + M1-M6.1 + C04 PASS.
- C012.1 valodi Chrome localhost: Technical Probe 15/15; JS-300/FR-66/XL-1, Stileron Q900 terv reload-perzisztencia, Combined detail reload+Back, 1920x1080/1366x768/390x844 horizontal overflow 0, fingerprint `c4a49ff0 -> c4a49ff0`, konzol WARN/ERROR 0.
- C007 valodi Chrome `file://`: `USER MANUAL PASS_NOT_CODEX_AUTOMATION`; a felhasznalo jelentette, nem Codex automation futtatta.
- Stabil V002 tag commit `b326aaff...150e35` es HTML SHA-256 `de2d59b4...9f2357` valtozatlan; stabil V003 release/tag nem keszult.
