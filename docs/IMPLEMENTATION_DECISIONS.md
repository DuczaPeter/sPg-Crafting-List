# sPg Crafting List - vegleges megvalositasi dontesek

Datum: 2026-08-22

## Lezart dontesek

1. Nev: `sPg Crafting List`.
2. A fo alkalmazas ket futtatasi fajlja: `sPg Crafting List.html` es `Info/style.css`.
3. A fo HTML nem agyazza be a kozponti CSS-t; az exportalt Crafting/Farm Card viszont mindig standalone, beagyazott CSS-t tartalmazo HTML.
4. Tamogatott kornyezet: Windows 11, aktualis Chrome es Edge.
5. A `file://` mod tenyleges tesztje kotelezo; csak igazolt szukseg eseten kell minimalis localhost fallback dokumentacio.
6. A Crafting Cardok keszletfoglalasi prioritasa a felhasznalo altal rendezheto sorrend, felulrol lefele.
7. V1-ben a keszletkezeles tervezesi jellegu, nincs automatikus vegleges levonas.
8. Location rangsor: occurrence csokkeno, spawn csokkeno, maximum Quality csokkeno; teljes egyezeskor a UI osszevonhat, a raw rekordok megmaradnak.
9. A hatterszinkron csak a megnyitott alkalmazasban futhat.
10. A teljes 82 pontos specifikacio a V1.0 celallapot; belso milestone-ok nem hagyhatnak el kovetelmenyt.

## Elfogadott technikai kiegeszitesek

- Quality capability: `DYNAMIC`, `FIXED`, `UNKNOWN`.
- Adat-proveniencia: forras, SC-verzio, lekeresi ido es `API` / `override` / `unknown` eredet.
- Pontos SCU tarolas: `1 SCU = 10 000` belso egesz egyseg.
- Tranzakcios adatfrissites, igeny szerinti betoltes es cache.
- Uj SC-verzional a regi override-ok `ellenorizendo` allapotot kapnak.
- Backup import elott automatikus snapshot es import-elonezet.
- Determinisztikus Allocation Engine tesztfixture-okkel.
- A standalone export nem fugghet Google Fontstol vagy mas halozati eroforrastol.
- Elso technikai kapu: API + `file://` + IndexedDB + standalone export.

## Forrasok sorrendje

1. `docs/PROJECT_SPECIFICATION.md`
2. Ez a lezart dontesdokumentum
3. Aktualis Star Citizen Wiki API es OpenAPI
4. `Info/` referencia HTML es CSS a megjeleneshez

Ellentmondas eseten a felhasznalo kesobbi explicit dontese az iranyado.

## 2026-08-24 - V002 egyfajlos feluliras

A kesobbi explicit felhasznaloi dontes a 2-3. pont futtatasi szerkezetet V002-tol felulirja:

- A teljes alkalmazas egyetlen `sPg Crafting List.html` fajl.
- A CSS es JavaScript kozvetlenul ebben a HTML-ben van; `Info/style.css` vagy mas helyi mellekfajl nem szukseges a futashoz.
- Az alkalmazas build folyamat nelkul, kozvetlen `file://` modban hasznalhato.
- Az alkalmazas es a standalone kartyaexport ugyanazt az egyetlen embedded CSS-forrast hasznalja; kulon CSS snapshot/drift par nincs.
- A V001 stabil tag es ketfajlos release bundle torteneti allapotkent valtozatlan marad.
