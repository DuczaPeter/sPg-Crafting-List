# STATUS.md

- Projekt neve: `sPg Crafting List`
- Rovid cel: `Star Citizen crafting-, inventory-, Quality-, mining- es loadout-tervezo helyi webalkalmazas elkeszitese.`
- Projekt tipus: `egyfajlos helyi webalkalmazas: sPg Crafting List.html embedded CSS-sel es JavaScripttel`
- Aktualis allapot: `V003-dev C008.1 – PUBLIC WIKI DEEP-LINK CORRECTION AUTOMATED + CHROME LOCALHOST PASS`
- Stabil verzio vagy baseline: `V002`
- Stabil fajl, commit vagy tag: `releases/V002/sPg Crafting List.html; tag V002`
- Aktualis fejlesztesi celverzio: `V003-dev`
- Aktualis javitasi ciklus: `V003-C008.1`
- Utolso sikeres ciklus: `V003-C008.1`
- Candidate vagy munkaverzio: `sPg Crafting List.html (V003-dev single-file munkaverzio)`
- Aktualis branch: `develop/V003`
- Utolso ellenorzesi szint: `PASS`
- Kovetkezo kotelezo teszt: `felhasznaloi vizualis ellenorzes; V003-C009 nincs elinditva`
- Aktualis feladat: `C008.1 publikus Star Citizen Wiki-cikk es API-adatlap egyertelmu szetvalasztasa lezart`
- Blokkolo problema: `nincs fejlesztesi blokkolo; stabil V003 release/tag nincs engedelyezve`
- Kovetkezo lepes: `megallas a felhasznaloi vizualis ellenorzeshez; stabil V003 release/tag es V003-C009 nincs engedelyezve`
- Utolso frissites: `2026-08-25T06:30:09+02:00`

## Ellenorzesi igazsag

Csak azt jelold mukodonek vagy stabilnak, amit tenylegesen ellenoriztel.

- C008.1 automatizalt: kulon `resolvePublicWikiDeepLink()` es `resolveWikiApiDeepLink()`; exact MediaWiki title/redirect audit, snapshot-alapu standalone parity, tiltott host/felirat keveredes es teljes C001-C008 + M1-M6.1 + C04 regresszio PASS.
- Public Wiki audit: JS-300 es Beryl `VERIFIED`; Stileron es Savrilium `NO_PROVEN_PUBLIC_WIKI_URL`; fuzzy, reszleges vagy vak nevbol kepzett URL nincs.
- C008.1 valodi Chrome localhost: Technical Probe 15/15, mind az 5 detailtipus public/API linkparitas, main es standalone Back/reload PASS; fingerprint `d7be3ccc -> d7be3ccc`; main/export konzol warning/error 0.
- C007 valodi Chrome `file://`: `USER MANUAL PASS_NOT_CODEX_AUTOMATION`; a felhasznalo jelentette, nem Codex automation futtatta.
- Stabil V002 tag commit `b326aaff...150e35` es HTML SHA-256 `de2d59b4...9f2357` valtozatlan; stabil V003 release/tag nem keszult.
