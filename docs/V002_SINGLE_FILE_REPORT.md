# V002-dev egyfajlos fejlesztesi riport

Datum: `2026-08-24`

Fejlesztesi branch: `develop/V002`

## Eredmeny

A gyoker `sPg Crafting List.html` a V002-dev kanonikus es egyetlen futtatando alkalmazasfajlja. A teljes alkalmazas-CSS a `#spgApplicationStyles` style blokkban, a JavaScript pedig tovabbra is ugyanebben a HTML-ben van. A V002 runtime nem hivatkozik az `Info/style.css` fajlra vagy mas helyi mellekfajlra.

Az `Info/` mappa a repositoryban csak torteneti V001- es referenciaanyag. A felhasznalonak a V002-dev futtatasahoz csak ezt az egy fajlt kell masolnia:

`sPg Crafting List.html`

## CSS-architektura

- Egyetlen kanonikus CSS-forras: `style#spgApplicationStyles[data-source="embedded"]`.
- Nincs kulso stylesheet link, Google Fonts import, base64 CSS-snapshot, CSSOM-olvasas, CSS-fetch vagy IndexedDB CSS-cache fallback.
- A fo alkalmazas es a standalone Crafting Card export ugyanazt az embedded CSS-szoveget hasznalja.
- A regi snapshot/drift par helyett az ellenorzes azt bizonyitja, hogy pontosan egy CSS-forras van, es nincs helyi runtime-fugges.
- Embedded CSS: `80 548` byte; SHA-256: `14a8451990f809ccb8493e4e0b11ac898af299a6957225f157490a0b1cbc00b2`.

## Automatizalt ellenorzes

`V002-C001`: `PASS`

A `v002-single-file-regression` teljes M1-M6.1 + C04 kaput futtatott. Az eredmeny:

- M1 normalizalt blueprint modell es fixture-ek: PASS.
- M2 allocation es Quality szabalyok: 8/8 PASS.
- M3 mining modell: 17/17 PASS.
- M4 Combined Materials, backup es rollback: 12/12 PASS.
- M5 UEX mapping, cache es refinery: 18/18 PASS.
- M6 standalone export: 14/14 PASS.
- M6.1 UI completeness: 14/14 PASS.
- C04 egyfajlos CSS/export regresszio: PASS.
- File- es HTTP-modellszimulacioban CSS network read: 0.
- Ures ideiglenes mappaban helyi sidecar igeny: 0.
- Kulso runtime/network eroforras az exportban: 0.

## Valos Chrome kiegeszito proba

Localhost Chrome eredmeny: `PASS`.

- `V002-dev · schema 6` betoltott.
- Embedded style blokkok: 1; stylesheet linkek: 0; kulso script src: 0.
- Technikai proba: 13/13 PASS.
- IndexedDB cache es User Data reload utan megmaradt.
- User Data fingerprint reload es UEX refresh elott/utan: `e6d8dec8`.
- SC dataset: `4.9.0-LIVE.12232306`; blueprint index: 1591.
- Mining: 72 commodity, 20 head, 14 vehicle.
- UEX: 215 rekord; mapping `24 MATCHED / 50 UNMAPPED / 0 AMBIGUOUS`.
- Standalone export builder: PASS, 113 373 byte.
- Chrome konzol warning/error: 0.

A bongeszos automatizalas download eventje idotullepessel zart, ezert a tenyleges fajlletoltesi esemeny nincs kulon PASS-nak jelolve. A builder es a generalt tartalom automatizalt M6/C04 ellenorzese PASS.

## Nyitott kezi kapu

Valos Chrome `file://`: `NOT TESTED / AUTOMATION BLOCKED`.

A Chrome-vezerlo biztonsagi URL-szabalya elutasitotta a `file://` navigaciot. Nem tortent security flag, nyers CDP, alternativ automatizalas vagy mas megkerules. A localhost eredmeny nem lett `file://` bizonyitekkent elszamolva.

Kezi ellenorzes:

1. Masold csak az `sPg Crafting List.html` fajlt egy uj, ures mappaba.
2. Nyisd meg duplakattal aktualis Chrome-ban, es ellenorizd, hogy a cim `file://` protokollu.
3. Ellenorizd a `V002-dev` verziojelzest es futtasd a `Technikai proba` gombot; az elvart eredmeny 13/13 PASS.
4. Frissitsd az oldalt, es ellenorizd az IndexedDB/User Data megmaradasat.
5. Frissits Wiki es UEX adatot, majd keszits standalone exportot.
6. PASS csak akkor, ha a Network nezetben nincs helyi sidecar vagy nem vart kulso UI-eroforras, es a Console alkalmazas warning/error szama 0.

## Verzios vedelmek

- A stabil `V001` tag valtozatlan commiton maradt: `b22dbc3c2ef0765e30aa3806537854298c873dff`.
- A `releases/V001/` tartalma nem valtozott.
- Stabil V002 release, tag vagy release bundle nem keszult.

## Vegso fejlesztesi statusz

`V002-dev SINGLE-FILE IMPLEMENTATION – AUTOMATED PASS, CHROME LOCALHOST PASS, REAL CHROME file:// MANUAL GATE NOT TESTED.`
