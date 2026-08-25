# STATUS.md

- Projekt neve: `sPg Crafting List`
- Rovid cel: `Star Citizen crafting-, inventory-, Quality-, mining- es loadout-tervezo helyi webalkalmazas elkeszitese.`
- Projekt tipus: `egyfajlos helyi webalkalmazas: sPg Crafting List.html embedded CSS-sel es JavaScripttel`
- Aktualis allapot: `V003-dev C010.1 – COMPACT MINING/REFINERY PRESENTATION + C010 EVIDENCE REPAIR PASS`
- Stabil verzio vagy baseline: `V002`
- Stabil fajl, commit vagy tag: `releases/V002/sPg Crafting List.html; tag V002`
- Aktualis fejlesztesi celverzio: `V003-dev`
- Aktualis javitasi ciklus: `V003-C010.1`
- Utolso sikeres ciklus: `V003-C010.1`
- Candidate vagy munkaverzio: `sPg Crafting List.html (V003-dev single-file munkaverzio)`
- Aktualis branch: `develop/V003`
- Utolso ellenorzesi szint: `PASS`
- Kovetkezo kotelezo teszt: `felhasznaloi vizualis ellenorzes; C011 nincs elinditva`
- Aktualis feladat: `C010.1 Final Card Mining/Refinery compact projection es C010 evidence audit lezart`
- Blokkolo problema: `nincs fejlesztesi blokkolo; stabil V003 release/tag nincs engedelyezve`
- Kovetkezo lepes: `megallas a felhasznaloi vizualis ellenorzeshez; stabil V003 release/tag es C011 nincs engedelyezve`
- Utolso frissites: `2026-08-25T09:51:22+02:00`

## Ellenorzesi igazsag

Csak azt jelold mukodonek vagy stabilnak, amit tenylegesen ellenoriztel.

- C010 automatizalt: default bal Blueprint Browser + jobb egyetlen Final Crafting Card, kulon navigacios teljes Crafting List, kompakt header/quantity/max/recipe/stock/material intelligence, pontosan 8 curated Radar chip, standalone parity es teljes C001-C010 + M1-M6.1 + C04 regresszio PASS.
- C010.1 automatizalt: az elso kivalasztott top mining tier bizonyitott presentation groupjai es a UEX `rankingValue` exact nyertesei kompakt, determinisztikus `elso (+N azonos legjobb)` projekciot kapnak; `+N további`, terminal-prefix es slash-lista nincs a Final Cardon. A nyers snapshot/detail valtozatlan.
- Public Wiki user UI: eltavolitva. A korabbi `resolvePublicWikiDeepLink()` csak belso torteneti/audit snapshot celra maradt; a normal es standalone UI-ban kizárólag a pontos `API adatlap` muvelet latszik.
- Exact API audit: JS-300 `items/js-300`, Stileron `commodities/stileron-ore`, Beryl `commodities/beryl-raw`, Savrilium `commodities/savrilium-ore`; mind a hidratalt forrasrekordbol, nevbol kepzett/fuzzy URL nelkul.
- C010.1 valodi Chrome localhost: Technical Probe 15/15, main es standalone compact parity, detail reload + browser Back, 390 px tulcsordulasmentes layout PASS; fingerprint `d7be3ccc -> d7be3ccc`; alkalmazas/standalone konzol warning/error 0.
- C007 valodi Chrome `file://`: `USER MANUAL PASS_NOT_CODEX_AUTOMATION`; a felhasznalo jelentette, nem Codex automation futtatta.
- Stabil V002 tag commit `b326aaff...150e35` es HTML SHA-256 `de2d59b4...9f2357` valtozatlan; stabil V003 release/tag nem keszult.
