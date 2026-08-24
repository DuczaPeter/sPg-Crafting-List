# DECISIONS.md

## 2026-08-22 - Egyfajlos HTML projekt es fajlverziozas

- Az alkalmazas neve: `sPg Crafring List`.
- A projekt tipusa: `one-file-html`; az alkalmazas mukodese egyetlen, onallo HTML-fajlban marad.
- Az elso fejlesztesi munkafajl tervezett helye: `src/sPg Crafring List V001-dev.html`.
- Az elso ellenorzott kiadas tervezett helye: `releases/sPg Crafring List V001.html`.
- Stabil kiadas csak tenylegesen lefuttatott kiadasi kapu utan keszulhet.

Ez a kezdeti dontes a kesobbi teljes specifikacio elott szuletett. A nev- es fajlszerkezeti reszet az alabbi dontes felulirja.

## 2026-08-22 - Vegleges nev, ketfajlos alkalmazas es V1.0 keret

- A vegleges alkalmazasnev: `sPg Crafting List`.
- A kanonikus fo fajl: `sPg Crafting List.html`.
- A fo alkalmazas kozponti, kulso stilusfajlja: `Info/style.css`; ezt nem kell a fo HTML-be agyazni.
- Az exportalt Crafting/Farm Card mindig standalone HTML, a szukseges CSS-t sajat `<style>` blokkban tartalmazza.
- Tamogatott kornyezet: Windows 11, aktualis Chrome es Edge; a `file://` mod valos tesztje kotelezo.
- Crafting Card keszletprioritas: a felhasznalo altal rendezheto kartya-sorrend, felulrol lefele.
- V1 keszletkezeles: tervezes es foglalas, vegleges inventory-levonas nelkul.
- Location rangsor: occurrence csokkeno, spawn csokkeno, maximum Quality csokkeno; teljes egyezeskor UI-osszevonas.
- A 82 pontos specifikacio teljes V1.0 celallapot, belso milestone-okkal, funkcioelhagyas nelkul.
- A reszletes dontesforras: `docs/IMPLEMENTATION_DECISIONS.md`.

## 2026-08-24 - V001 stabil bundle es elfogadott release-waiverek

- A stabil V001 ketfajlos, fagyasztott bundle: `releases/V001/sPg Crafting List.html` es `releases/V001/Info/style.css`.
- A stabil HTML a kanonikus fajl funkcioazonos masolata, csak a harom futasideju `V001-dev` verziofelirat `V001` ertekre cserelt.
- A stabil bundle integritasat `releases/V001/SHA256SUMS.txt` rogziti; a kiadast a `V001` annotalt Git tag azonositja.
- O04 Windows-szintu offline hard-disconnect ujranyitas: `NOT TESTED – ACCEPTED RELEASE WAIVER`.
- Edge E01-E10 kezi acceptance: `NOT TESTED – ACCEPTED RELEASE WAIVER`.
- A waiverek nem valtoztatjak PASS-ra a kihagyott teszteket, de a felhasznalo kifejezett dontese alapjan nem blokkoljak a V001 stabil kiadasat.

## 2026-08-24 - V002 egyetlen futtathato HTML

- A V002 fo alkalmazas egyetlen `sPg Crafting List.html`; teljes CSS es JavaScript beagyazva.
- `Info/style.css` es semmilyen mas helyi mellekfajl nem lehet runtime-fuggoseg.
- Az export ugyanazt az embedded CSS-forrast olvassa, ezert kulon base64 snapshot, CSSOM/fetch fallback es ketforrasos driftellenorzes nem marad.
- A gyoker `Info/` referenciaanyag megmaradhat a repositoryban, de a felhasznalonak nem kell atadni.
- A V001 tag, release commit es `releases/V001/` tartalma valtozatlan.
