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

A stabil V002 kiadas egyetlen futtathato fajlja:

- `releases/V002/sPg Crafting List.html`

A V002 futasahoz sem az `Info` mappa, sem kulon CSS/JavaScript, sem a release-dokumentacio nem szukseges. A kiadast a `V002` Git tag azonositja; acceptance: `docs/V002_RELEASE_REPORT.md`.

A torteneti V001 ketfajlos bundle es `V001` tag valtozatlanul megmaradt a `releases/V001/` mappaban.
