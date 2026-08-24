# sPg Crafting List

English: [README.md](README.md) · Magyar: **README_HU.md**

## Mi az sPg Crafting List?

Az sPg Crafting List egy helyben futó Star Citizen-tervezőeszköz crafting receptekhez, saját anyagkészlethez, Quality-alapú foglaláshoz, bányászati adatokhoz, mining loadoutokhoz és refinery ajánlásokhoz. Böngészőben működik, és az aktuális játékadatokat a helyben tárolt készleteddel és terveiddel kapcsolja össze.

**A V002 valódi egyfájlos kiadás: a használatához semmilyen további helyi fájl nem szükséges.** Az alkalmazás teljes CSS- és JavaScript-kódja az `sPg Crafting List.html` fájlba van beépítve; nincs build folyamat, futásidejű mellékfájl, külön stíluslap vagy külön script.

## Mire használható?

Az alkalmazás a blueprint receptekből és a saját anyagbatch-eidből átlátható crafting tervet készít. Külön kezeli a Recipe Slotokat, slotonként alkalmazza a megfelelő Quality-szabályt, jelzi a mennyiségi és Quality-hiányt, és több Crafting Card közös igényét is összesíti. A mining helyek, az elmentett loadoutok és a UEX refinery adatai a szükséges anyagok megszerzésének és finomításának megtervezésében segítenek.

A V002-ben az allocation csak tervezés: az anyagokat lefoglalja a megjelenített tervhez, de nem vonja le őket véglegesen a készletből.

## Letöltés és indítás

1. Töltsd le az [`sPg Crafting List.html`](releases/V002/sPg%20Crafting%20List.html) fájlt.
2. Nyisd meg egy aktuális Google Chrome böngészőben.
3. Kattints az `Adatok frissítése` gombra a játékadatok betöltéséhez vagy frissítéséhez.
4. Használd a Blueprint Browsert vagy a többi modult.

A fájl közvetlenül a lemezről, `file://` módban is megnyitható Chrome-ban. Nincs szükség `Info` mappára, külön CSS- vagy JavaScript-fájlra, helyi webszerverre, telepítésre vagy build folyamatra.

## Fő funkciók

### Blueprint Browser

Szűréssel és lapozással böngészheted az elérhető blueprint indexet, a receptek részletei pedig csak akkor töltődnek be, amikor szükség van rájuk. A normalizált rekordok megőrzik a forrás UUID-ját, az SC adatverziót, az adatforrást, a lekérési időt és az eredeti Recipe Slot / Aspect szerkezetet.

### Crafting List

Több Crafting Cardot hozhatsz létre, megadhatod a gyártandó mennyiséget, és ahol a forrásadatok ezt lehetővé teszik, slotonként választhatsz Quality-stratégiát. A kártyák kézzel átrendezhetők; a sorrend egyben a determinisztikus készletfoglalási prioritás is, vagyis a legfelső kártya kap először megfelelő készletet.

### My Materials és Quality batch-ek

Egyetlen globális készletben kezelheted a saját anyagaidat. Ugyanahhoz az anyaghoz több, külön Quality-értékű batch is tartozhat. Az SCU-mennyiségek belső tárolása egész számokkal történik (`1 SCU = 10 000` belső egység), így a számítás nem sodródik el lebegőpontos kerekítések miatt.

### Quality-alapú determinisztikus allocation

A foglalás Recipe Slot szinten történik, nem csak összevont material szinten. Emiatt ugyanaz az anyag két külön slotban eltérő szabály szerint is felhasználható. A támogatott működés:

- `HP_MIN_500`: a minimumot teljesítő legalacsonyabb Quality-batch fogy először;
- `Highest Q`: a legmagasabb elérhető Quality fogy először;
- `Target Q`: a célt elérő vagy meghaladó legalacsonyabb batch fogy először;
- `FIXED`: nincs felhasználó által választható Quality-stratégia;
- `UNKNOWN`: az alkalmazás megőrzi a bizonytalanságot, és nem találgat.

Azonos bemenetből, kártyasorrendből és készletből mindig azonos allocation eredmény készül. A mennyiségi hiány, a Quality-hiány, a hiányzó mennyiség és a bottleneck külön visszakövethető az eredményben és a diagnosztikában.

### Combined Materials

Egy helyen láthatod az összes Crafting Card teljes anyagigényét: a szükséges, elérhető, lefoglalt és hiányzó mennyiségeket. Azonos materialok az áttekinthetőség kedvéért összevonhatók a megjelenítésben, miközben a kapcsolódó blueprint-ek, Recipe Slotok és Quality-követelmények megmaradnak. A nézet ugyanannak az Allocation Engine-nek a közvetlen eredményét használja, mint az egyedi kártyák.

### Material Database

A normalizált commodity- és harvestable-adatok az All, Ship Mining, Vehicle Mining, FPS Mining és Harvestable kategóriák szerint böngészhetők. Az alkalmazás csak a forrásban ténylegesen rendelkezésre álló mezőket jeleníti meg, és nem talál ki hiányzó értékeket.

### Mining helyek

A támogatott anyagoknál naprendszerenként láthatók az elérhető mining/farm helyek. A rangsor az API által megadott adatokból occurrence, majd spawn, végül maximum Quality szerint készül. A részletek között – ha a forrás biztosítja őket – Radar Signature, occurrence, spawn és maximum Quality szerepel; a hiányzó vagy bizonytalan értékek ismeretlenek maradnak.

### Mining Loadouts

Anyagonként több loadout menthető, és közülük egy kijelölhető alapértelmezettként. A loadout megőrizheti a vehicle, mining station, head, module, gadget és felhasználói override adatokat. A mentett loadout User Data, ezért a játékadatok frissítése nem törli; az időközben eltűnt equipment is látható marad, hogy ellenőrizhető legyen.

### UEX Refinery ajánlások

A UEX refinery yield rekordjai külön cache-be kerülnek, és determinisztikus, visszakövethető szabályok kapcsolják őket a Wiki commoditykhez. A kiválasztott naprendszeren belüli ajánlásokat a dokumentált 30 napos yield bonusz (`value_month`) rangsorolja; a holtversenyek, valamint a forrásban szereplő nulla és negatív értékek is megmaradnak.

### Data / Settings

Itt érhető el a játékadatok frissítése, a teljes User Data backup és import, az import előnézete és validálása, a diagnosztika, valamint a `Log másolása` művelet. Az import alkalmazás előtt ellenőrizhető, automatikus snapshotot készít, és tranzakciósan fut, így egy hibás vagy félbeszakadt import nem írja felül észrevétlenül a meglévő User Data-t.

### Önálló Crafting Card export

Egy Crafting Card külön, önálló HTML-fájlba exportálható. Az export beágyazza a szükséges megjelenést és adat-snapshotot, beleértve a kártyához elérhető recept-, allocation-, mining-, refinery- és kiválasztott loadoutadatokat. Megnyitáskor nincs szüksége a fő alkalmazásra, külső CSS-re, betűkészletre, scriptre, Wiki- vagy UEX-lekérésre.

## Játékadatok frissítése

Online állapotban kattints az `Adatok frissítése` gombra. Az alkalmazás lekéri és normalizálja a támogatott Star Citizen Wiki- és UEX-adatokat, majd verziózott cache-ben tárolja őket. Az új Game Data cache csak teljes, sikeres tranzakció után válik aktívvá; sikertelen frissítésnél az előző működő cache marad használatban. A Game Data frissítése nem módosítja a User Data-t.

## Hogyan tárolódnak a saját adatok?

Az anyagkészlet, a Quality batch-ek, a Crafting Cardok, a Quality-stratégiák, a mining loadoutok, az override-ok és a beállítások helyben, a böngésző IndexedDB-tárolójában maradnak. Az alkalmazás nem felhős felhasználói fiókrendszer, és nem szinkronizál automatikusan több eszköz között. A böngészőprofil törlése vagy a webhelyadatok ürítése eltávolíthatja ezeket az adatokat, ezért böngészőkarbantartás, gép- vagy profilváltás előtt érdemes backupot exportálni.

## Adatforrások

- A [Star Citizen Wiki API](https://api.star-citizen.wiki/api) biztosítja a blueprint-, commodity-, mining equipment-, vehicle- és kapcsolódó játékadatokat.
- A [UEX Corp API](https://api.uexcorp.uk/2.0/refineries_yields) adja a refinery ajánlásokhoz használt yield adatokat.

Ahol a normalizált modell támogatja, megmarad a forrásazonosító, az adatverzió, a lekérési idő és a mapping eredete. Az API-ból származó adatok és a felhasználói override-ok elkülöníthetők.

## Korlátok

- A V002 elfogadott helyi futtatási környezete Windows 11 és aktuális Google Chrome `file://` módban. Más böngészők és operációs rendszerek nem kaptak ugyanilyen kézi acceptance lefedettséget.
- A friss játékadatok lekérése internetkapcsolatot igényel, és függ a forrás API-k elérhetőségétől, illetve kompatibilis sémájától. A korábban cache-elt adatok helyben továbbra is használhatók lehetnek.
- A hiányzó, többértelmű vagy nem támogatott forrásadat ismeretlen vagy párosítatlan marad; az alkalmazás nem talál ki eredményt általános fuzzy matchinggel.
- Az allocation tervezés, nem vonja le véglegesen a készletet.
- A mining helyek és refinery eredmények a rendelkezésre álló API-adatokból készülő ajánlások, nem garantálják az aktuális játékon belüli előfordulást vagy eredményt.
- A User Data az adott böngészőprofilhoz kötődik. Nincs hosztolt fiók, felhős backup vagy automatikus eszközök közötti szinkronizáció.

## Verzióinformáció

- Verzió és Git tag: `V002`
- Kiadási forma: egyetlen önálló `sPg Crafting List.html`
- Szükséges futásidejű mellékfájlok száma: `0`
- Chrome `file://` Technical Baseline: `13/13 PASS`
- Teljes M1–M6.1 + C04 regresszió: `PASS`
- Star Citizen Wiki API és UEX API ellenőrzés: `PASS`
- IndexedDB/User Data kompatibilitás: `PASS`
- Önálló Crafting Card export: `PASS`
- Release HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`

A rögzített kiadási bizonyítékok a [V002 release reportban](docs/V002_RELEASE_REPORT.md) találhatók.

## Jogi nyilatkozat

Az sPg Crafting List közösségi fejlesztésű eszköz, nem a Cloud Imperium Games hivatalos alkalmazása. A projekt nem áll kapcsolatban a Cloud Imperium Gamesszel, és a cég nem hagyta jóvá. A Star Citizen, a kapcsolódó elnevezések és játékadatok a mindenkori jogosultjaik tulajdonát képezik.
