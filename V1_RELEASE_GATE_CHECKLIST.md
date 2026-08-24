# V1 kézi release-gate checklist

Ez a lista kizárólag a három még nyitott V1 kaput ellenőrzi:

1. a fő alkalmazás közvetlen Chrome `file://` futása;
2. a tényleges standalone export teljes offline újranyitása;
3. külön Microsoft Edge regresszió, lehetőség szerint közvetlen `file://` módban.

Az M6 jelenleg release candidate. Stabil V1 csak akkor készülhet, ha az összes alábbi kötelező pont `PASS`.

Az `M6.1 UI Completeness Audit` a `V001-C011` ciklusban PASS: a felso navigacio pontosan nyolc enabled celt tartalmaz, a `Material Database` es a `Mining Loadouts` hasznalhato, a teljes M1-M6 + M6.1 regresszio es a Chrome localhost 13/13 proba zold. Ezert a korabban szunetelt kezi acceptance most ujra folytathato. Az M6.1 localhost bizonyitek nem helyettesiti az alabbi `file://`, offline es Edge kapukat.

2026-08-24-i kezi eredmeny: C01-C03 PASS, C04 FAIL volt a `file://` CSSOM `SecurityError` miatt. A `V001-C012` javitas a kozponti CSS-bol generalt, automatikusan drift-ellenorzott export snapshotot vezetett be; a teljes regresszio es localhost Chrome 13/13 PASS. A kovetkezo kezi lepes **kizarolag C04 ujrateszt**. C05 csak C04 PASS utan kezdheto.

## Tesztelendő fájlok

- Fő alkalmazás: `C:\Users\ganos\OneDrive\Munka\Codex\sPg Crafring List\sPg Crafting List.html`
- Helyi CSS: `C:\Users\ganos\OneDrive\Munka\Codex\sPg Crafring List\Info\style.css`
- Standalone export: a teszt közben az alkalmazás `Export HTML` gombjával létrehozott új HTML-fájl.

Ne localhost URL-t nyiss meg. A címsornak mindkét böngészőben `file:///C:/.../sPg%20Crafting%20List.html` kezdetűnek kell lennie.

## Előkészítés

1. Kapcsold be az internetet.
2. Chrome-ban és Edge-ben jegyezd fel a pontos böngészőverziót.
3. A fő alkalmazásban nyisd meg a `Data / Settings` lapot, kattints a `Backup JSON letöltése` gombra, és őrizd meg a teszt előtti backupot. Ezt Chrome-ban és Edge-ben külön végezd el, mert a két böngésző saját IndexedDB-t használ.
4. Nyomj `F12`-t, majd tartsd nyitva a `Console` és a `Network` panelt. A teszt elején töröld mindkettő korábbi tartalmát.
5. A tesztadatokat ne töröld, amíg mindhárom gate-et be nem fejezted.

## Gate 1 — fő HTML közvetlenül Chrome-ban

Nyisd meg a fő HTML-t a Windows Intézőből a `Megnyitás ezzel > Google Chrome` művelettel.

- [x] **C01 – Valódi file mód:** a címsor `file:///` URL-t mutat, a felső `Futtatási mód` mező pedig `file://` értékű. Localhost használata `FAIL`. *(Felhasználói eredmény: PASS.)*
- [x] **C02 – CSS:** nyomj `F12`-t, töröld a `Network` listát, majd nyomj `Ctrl+R`-t. Sötét, cián keretes SPG felület jelenjen meg, az `Info/style.css` pedig helyi fájlként, piros hiba nélkül töltődjön be. Formázatlan fehér oldal `FAIL`. *(Felhasználói eredmény: PASS.)*
- [x] **C03 – JavaScript indulás:** a fejléc, a modulnavigáció és az SC-verzió megjelenik; a `Console` panelen nincs piros, az alkalmazásból származó JavaScript hiba. *(Felhasználói eredmény: PASS.)*
- [ ] **C04 – Technikai próba – ÚJRATESZT:** kattints a `Technikai próba` gombra. `PASS`, ha mind a 13 sor zöld, koztuk az `M6.1 V1 UI completeness` es a `Standalone HTML export`, a badge `Minden próba sikeres`, a `Futtatási mód` sor pedig `Közvetlen file:// futás`. Nem jelenhet meg `CSS_CSSOM_READ_FAILED`, `CSS_EMBEDDED_SNAPSHOT_FAILED`, `EXPORT_FAILED` vagy `TECHNICAL_CHECK_FAILED`.
- [ ] **C05 – Wiki API:** ugyanebben a próbában a `Star Citizen Wiki API` sor PASS és JS-300 receptet jelez. Ezután kattints az `Adatok frissítése` gombra. `PASS`, ha a `Wiki API` állapot `Elérhető`, és nincs fetch/CORS hiba.
- [ ] **C06 – UEX API:** nyisd meg az `UEX Refinery` lapot, kattints az `UEX adatok kézi frissítése` gombra, majd válaszd a `Beryl` commodityt. `PASS`, ha aktív cache/mapping összegzés és rendszerenkénti refinery ajánlás jelenik meg. A jelenlegi SC-verziónál az elvárt mapping `24 MATCHED / 50 UNMAPPED / 0 AMBIGUOUS`.
- [ ] **C07 – Blueprint Browser:** nyisd meg a `Blueprint Browser` lapot, keress rá: `JS-300`, majd kattints a találatra. `PASS`, ha a részletes recept 3 külön Recipe Slotot mutat: `Shell`, `Voltage Regulator`, `Stator Cores`.
- [ ] **C08 – Crafting Card:** kattints a `Megnyitott blueprint hozzáadása` gombra, majd nyisd meg a `Crafting List` lapot. `PASS`, ha megjelenik a JS-300 kártya, módosítható a `Gyártani kívánt mennyiség`, és látható az `Export HTML` gomb.
- [ ] **C09 – My Materials és Quality batch:** nyisd meg a `My Materials` lapot, és add hozzá ezt a tesztbatch-et: név `Stileron`; UUID `8cd317a3-df9b-4315-8ac3-0f1fca42dfd4`; Quality `517`; mennyiség `1`; unit `SCU`; megjegyzés `V1-GATE-CHROME`. `PASS`, ha külön Q517 batchként megjelenik.
- [ ] **C10 – Allocation újraszámolás:** térj vissza a `Crafting List` lapra. `PASS`, ha a JS-300 `Shell / Stileron` sorában Q517 batch-foglalás jelenik meg, a `Lefoglalt` érték `0,35 SCU`, és az inventory mennyisége nem csökken véglegesen.
- [ ] **C11 – Material Database és refinery adatok:** nyisd meg a `Material Database` lapot. Keress `Agricium` névre, ellenőrizd az egytalálatos keresést, majd próbáld ki az `All / Ship Mining / Vehicle Mining / FPS Mining / Harvestable` szűrőket. Válaszd ki az Agriciumot. `PASS`, ha látható a mining mód, Radar Signature, API-adat esetén rarity/instability/resistance, rendszerenkénti occurrence/spawn/max Quality location, UEX refinery és Default Loadout vagy pontos `Nincs adat`/`UNKNOWN` állapot. A JS-300 kártya adatpillanatképe továbbra is jelenjen meg.
- [ ] **C12 – Mining Loadouts:** nyisd meg a külön `Mining Loadouts` felső navigációt, válaszd a `Beryl` commodityt, kattints az `Új loadout ehhez a materialhoz` gombra, add meg a `V1-GATE-CHROME` nevet, válassz egy elérhető mining vehicle-t és headet, majd mentsd, és állítsd Default Loadoutnak. `PASS`, ha a mentett loadout kiválasztható, defaultként jelölt, és a Material Database Beryl adatlapján is megjelenik.
- [ ] **C13 – Combined Materials:** nyisd meg a `Combined Materials` lapot. `PASS`, ha a JS-300 három materialja külön megjelenik, a Recipe Slot részletek megmaradnak, és a Stileron lefoglalása megegyezik a Crafting Card értékével.
- [ ] **C14 – Log másolása:** nyisd meg a `Data / Settings` lapot, kattints a `Log másolása` gombra, majd illeszd be ideiglenesen egy üres szövegfájlba. `PASS`, ha az M1–M6 diagnosztikai szöveg beilleszthető, és tartalmaz `User Data fingerprint`, `UEX`, `allocation`, `Combined Materials` és `standaloneExport` adatot.
- [ ] **C15 – IndexedDB újratöltés:** a `Data / Settings` lapon jegyezd fel a `User Data fingerprint` értéket (`Chrome B`), majd nyomj `Ctrl+R`-t. `PASS`, ha a JS-300 kártya, a Q517 batch és a `V1-GATE-CHROME` loadout megmarad, és újra a `Data / Settings` lapra lépve ugyanaz a fingerprint látható (`Chrome C = Chrome B`).
- [ ] **C16 – Game Data nem ír User Data-t:** kattints az `Adatok frissítése` gombra, várd meg a sikeres lezárást, majd újra olvasd le a fingerprintet (`Chrome D`). `PASS`, ha `Chrome D = Chrome C`, és minden tesztadat megmaradt.
- [ ] **C17 – Konzol:** töröld a Console korábbi tartalmát, nyomj `Ctrl+R`-t, és járd végig egyszer a fenti lapokat. `PASS`, ha nincs új, az alkalmazásból származó piros JavaScript hiba.

Gate 1 csak akkor `PASS`, ha **C01–C17 mind PASS**.

## Gate 2 — tényleges standalone export offline Chrome-ban

1. Internet mellett nyisd meg a `Crafting List` lapot.
2. A JS-300 kártyán kattints az `Export HTML` gombra.
3. Jegyezd fel a ténylegesen létrejött fájl teljes nevét és helyét.
4. Nyisd meg ezt a fájlt Chrome-ban, és ellenőrizd a tartalmát.
5. Zárd be az export lapját, majd kapcsold ki a számítógép internetkapcsolatát. A böngésző DevTools `Network > Offline` módja csak kiegészítő ellenőrzés; az elsődleges próba a Windows hálózati kapcsolat kikapcsolása.
6. Az internet kikapcsolása után nyisd meg újra ugyanazt az exportált HTML-t közvetlenül a fájlból.

- [ ] **O01 – Tényleges fájl:** az exportfájl létrejött, nem 0 bájtos, és a címsor az export saját `file:///` URL-jét mutatja.
- [ ] **O02 – Teljes kártya:** internet nélkül is látható a JS-300 fejléc, SC-verzió, gyártási mennyiség, maximum/bottleneck, mindhárom Recipe Slot, Quality szabály, allocation/batch részletek, mining/farmhelyek, loadout és UEX refinery szekció vagy az adat hiányát pontosan jelző warning.
- [ ] **O03 – Beágyazott kinézet:** az export formázott SPG-kártyaként jelenik meg; nem kell mellé `Info/style.css` vagy más fájl.
- [ ] **O04 – Valóban offline újranyitás:** a fájl bezárás után, továbbra is kikapcsolt internet mellett újra megnyílik és ugyanazt a teljes tartalmat mutatja.
- [ ] **O05 – Nincs külső kérés:** a DevTools `Network` panel törlése után töltsd újra az exportot. `PASS`, ha nincs `http://` vagy `https://` kérés Google Fonts, CSS, Wiki API, UEX API vagy más külső cím felé.
- [ ] **O06 – Offline konzol:** a Console panelen nincs piros JavaScript-, CSS- vagy hálózati hiba.

Gate 2 csak akkor `PASS`, ha **O01–O06 mind PASS**. Utána kapcsold vissza az internetet.

## Gate 3 — külön Microsoft Edge regresszió

Edge-ben ne a Chrome már megnyitott lapját használd: a fő HTML-t újra a Windows Intézőből, a `Megnyitás ezzel > Microsoft Edge` művelettel nyisd meg.

- [ ] **E01 – Edge file mód és CSS:** a fő alkalmazás `file:///` URL-ről, teljes SPG-stílussal nyílik meg; az `Info/style.css` helyi fájlként betöltődik.
- [ ] **E02 – Edge technikai próba/API:** a `Technikai próba` 13/13 PASS, benne az `M6.1 V1 UI completeness`, es `Közvetlen file:// futás`; az `Adatok frissítése` és az `UEX adatok kézi frissítése` nem ad fetch/CORS hibát.
- [ ] **E03 – Edge Blueprint/Crafting:** keresd meg a JS-300-at a `Blueprint Browser` lapon, add hozzá, majd módosítsd a gyártási mennyiséget. A 3 Recipe Slot és a Crafting Card hibátlanul működik.
- [ ] **E04 – Edge User Data:** adj hozzá egy Q517 Stileron batch-et `V1-GATE-EDGE` megjegyzéssel és egy `V1-GATE-EDGE` Beryl loadoutot. `Ctrl+R` után mindkettő és a Crafting Card megmarad.
- [ ] **E05 – Edge allocation/Combined/Material Database/refinery:** a kártya allocation újraszámol, a Combined értéke egyezik, a `Material Database` keresés/kategóriaszűrés/adatlap működik, a külön `Mining Loadouts` navigáció a mentett loadoutot mutatja, és a mining/refinery részletek láthatók.
- [ ] **E06 – Edge log és fingerprint:** a `Log másolása` működik. Jegyezd fel az Edge fingerprintet újratöltés előtt (`Edge B`), újratöltés után (`Edge C`) és `Adatok frissítése` után (`Edge D`). `PASS`, ha `Edge B = Edge C = Edge D`.
- [ ] **E07 – Edge export:** az Edge-ben a JS-300 `Export HTML` gombja tényleges HTML-fájlt hoz létre.
- [ ] **E08 – Edge offline export:** zárd be az export lapját, kapcsold ki az internetet, majd nyisd meg újra az Edge-ben exportált fájlt. A Gate 2 **O01–O06** követelményei Edge-ben is mind teljesülnek.
- [ ] **E09 – Edge konzol:** tiszta Console mellett töltsd újra a fő HTML-t, járd végig a használt lapokat, és ellenőrizd, hogy nincs új, alkalmazásból származó piros JavaScript hiba.
- [ ] **E10 – Nincs User Data-vesztés:** az Edge teszt végén a kártya, batch, Quality, loadout és beállítások továbbra is elérhetők; a fingerprint változatlan.

Gate 3 csak akkor `PASS`, ha **E01–E10 mind PASS**. Utána kapcsold vissza az internetet.

## Mit küldj vissza egyben

Másold a következő blokkot a válaszodba, és töltsd ki. Ha egy pont hibás, ne csak `FAIL`-t írj: add meg a checklist-azonosítót, a képernyőn látható pontos szöveget, a Console első releváns piros hibáját és a `Log másolása` releváns `ERROR`/`WARN` részletét. Teljes backupot vagy teljes személyes inventoryt ne küldj.

```text
V1 KÉZI ACCEPTANCE
Dátum:
Windows 11 verzió:
Chrome verzió:
Edge verzió:
SC adatverzió:

Gate 1 – Chrome fő file://: PASS / FAIL
C01–C17 eltérés: nincs / [azonosító + részlet]
Chrome fingerprint B:
Chrome fingerprint C:
Chrome fingerprint D:

Gate 2 – Chrome standalone offline: PASS / FAIL
Export teljes elérési útja:
O01–O06 eltérés: nincs / [azonosító + részlet]
Külső hálózati kérés: nincs / [URL]

Gate 3 – Edge regresszió: PASS / FAIL
E01–E10 eltérés: nincs / [azonosító + részlet]
Edge fingerprint B:
Edge fingerprint C:
Edge fingerprint D:
Edge export teljes elérési útja:

Console hibák: nincs / [böngésző + pontos első hiba]
User Data-vesztés: nincs / [mi veszett el]
Csatolt diagnosztikai részlet vagy képernyőkép: nincs / [megnevezés]

ÖSSZESÍTETT V1 KÉZI GATE: PASS / FAIL
```

## Döntési szabály

- `PASS`: C01–C17, O01–O06 és E01–E10 mind sikeres; nincs User Data-vesztés és nincs megmagyarázatlan JavaScript hiba.
- `FAIL`: bármely kötelező pont hibás vagy nem lett ténylegesen lefuttatva.
- `NOT TESTED`: nem egyenlő PASS-szal.

Teljes kézi PASS után Codex újrafuttatja az M1–M6 + M6.1 regressziót, ellenőrzi a Git working tree-t és elkészíti a végső V1 acceptance reportot. Stabil commit, tag vagy release csak ezután és külön kiadási jóváhagyással készülhet.
