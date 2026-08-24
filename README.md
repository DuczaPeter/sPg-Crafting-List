# sPg Crafting List

Helyben futtathato Star Citizen crafting-, inventory-, Quality-, mining- es loadout-tervezo alkalmazas.

A teljes V002 alkalmazas egyetlen futtathato fajl:

- `sPg Crafting List.html`

A CSS es JavaScript be van agyazva. Az `Info/` mappa vagy mas helyi mellekfajl nem szukseges a hasznalathoz; a HTML kozvetlenul `file://` modban nyithato meg.

Az exportalt Crafting/Farm Cardok mindig onallo, beagyazott CSS-t tartalmazo HTML-fajlok.

A teljes funkcionalis terv a `docs/PROJECT_SPECIFICATION.md`, a lezart megvalositasi dontesek a `docs/IMPLEMENTATION_DECISIONS.md` fajlban vannak.

## Codex inditas

Codex munkahoz eloszor a `CODEX_START_HERE.md` fajlt olvasd. A reszletes aktualis allapot a `STATUS.md`, a feladatlista a `TASKS.md`, az ellenorzes pedig a `TEST_COMMANDS.md` fajlban van.

## Fontos elv

A legutolso mukodo allapot ne vesszen el. Amit nem teszteltunk, azt nem nevezzuk stabilnak.

## Stabil kiadas

A stabil, torteneti V001 ketfajlos bundle a `releases/V001/` mappaban talalhato. A V001 ottani `sPg Crafting List.html` es `Info/style.css` fajlja egyutt tartando; az integritasi ertekeket a `SHA256SUMS.txt` tartalmazza.

A kiadast a `V001` Git tag azonositja. A teljes acceptance es a ket elfogadott manualis release-waiver a `docs/V1_RELEASE_REPORT.md` fajlban olvashato.

A jelenlegi fejlesztesi cel a kulon `develop/V002` agon: `V002-dev` egyfajlos alkalmazas. Ez nem irja felul a V001 stabil kiadast.
