Igen. Most már összeállt annyira, hogy ezt **egyben oda lehet adni Codexnek fejlesztési specifikációként**. Beletettem azt a fontos pontosítást is, hogy a funkcionális Q-kezelés csak akkor alkalmazható, ha az adott blueprint input ténylegesen változtatható Quality-t enged; ha az API `Fixed` inputot jelez, azt nem írhatjuk felül. A jelenlegi Wiki blueprint felület például a JS-300-nál külön kezeli a Shell Quality-t és a fix inputokat. ([Star Citizen Wiki API][1])

# sPg Crafting List – teljes projektterv Codex számára

## 1. Projekt célja

Készíts egy Star Citizenhez használható, helyben futó alkalmazást:

**sPg Crafting List**

A program elsődleges célja, hogy egy kiválasztott craftolható tárgyról egyetlen Crafting Cardon rendelkezésre álljon minden információ ahhoz, hogy a felhasználó:

* megtudja, miből készül;
* lássa, az egyes alapanyagok a tárgy mely részéhez tartoznak;
* beállítsa, hány darabot szeretne gyártani;
* megadja a saját alapanyagkészletét Quality batch-ekkel együtt;
* megtudja, ebből hány darab készíthető;
* megtudja, miből mennyi hiányzik;
* lássa az egyes bányászható alapanyagok Radar Signature értékét;
* lássa rendszerenként a legjobb bányászhelyeket;
* lássa a spawn/occurrence és Quality adatokat;
* kiválaszthassa az adott anyaghoz használt mining hajót;
* kiválaszthassa a mining laser/head konfigurációt;
* dinamikusan kezelhesse a mining module slotokat;
* tetszőleges számú gadgetet rendeljen az anyaghoz;
* több mining loadoutot tároljon;
* több Crafting Cardot használjon egyszerre;
* ezekből közös alapanyaglistát készítsen;
* standalone HTML farm/crafting kártyát exportáljon;
* és hiba esetén egy kattintással AI-nak átadható diagnosztikai logot másoljon.

Az oldal adatai **ne legyenek kézzel beleégetve**, ahol az adat dinamikusan lekérhető a Star Citizen Wiki API-ból.

Az alkalmazásnak lehetőség szerint egy új játékverzió, új blueprint, új ore, új mining laser, új mining module, új gadget vagy új mining hajó megjelenésekor **programkód-módosítás nélkül** fel kell ismernie az új adatokat.

A Star Citizen Wiki API jelenleg külön erőforrásokat biztosít többek között Vehicles, Items, Locations, Commodities és Blueprints számára, és játékverzió is rögzíthető a lekérdezésekhez. Az API index végpontjai szűrhetőek, és külön `/filters` végpont is használható. ([Star Citizen Wiki API][2])

---

# 2. Projektkönyvtár

A projekt helye:

`C:\Users\ganos\OneDrive\Munka\Codex\sPg Crafring List\`

A referenciaanyagok helye:

`C:\Users\ganos\OneDrive\Munka\Codex\sPg Crafring List\Info\`

A Codexnek **minden fejlesztés előtt át kell vizsgálnia az `Info` mappát**.

Különösen fontos referenciafájlok:

`Info\style.css`

és a felhasználó által később hozzáadott:

`Star_Citizen_alapanyag_farm_kartyak_BP_API_C788_P6_P8_Killshot_bovitve.html`

vagy azonos nevű referencia HTML.

A referencia HTML-t nem szabad vakon lemásolni. Fel kell térképezni belőle:

* kártyaszerkezetet;
* elrendezést;
* vizuális hierarchiát;
* material megjelenítést;
* location megjelenítést;
* Quality jelöléseket;
* Radar Signature megjelenítést;
* tipográfiát;
* responsive működést;
* ikonhasználatot;
* spacinget;
* színeket;
* fejlécet és láblécet.

---

# 3. Fájlszerkezet

A fő alkalmazás:

`sPg Crafting List.html`

A JavaScript lehetőleg **ebben az egy HTML-ben legyen**, külön build rendszer nélkül.

A központi vizuális fájl:

`Info\style.css`

A fő HTML ezt használja külső stylesheetként.

Ne legyen a fő alkalmazás tele felesleges inline CSS-sel.

A CSS kezelje:

* teljes layout;
* kártyák;
* táblázatok;
* panelek;
* badge-ek;
* figyelmeztetések;
* inputok;
* dropdownok;
* gombok;
* material Quality megjelenítés;
* mining loadoutok;
* location blokkok;
* desktop;
* tablet;
* mobilnézet.

A program működéséhez ne legyen szükség npm-re, Node buildre vagy framework build folyamatra.

Elsődleges cél:

**HTML + CSS + vanilla JavaScript.**

---

# 4. Elsődleges adatforrás

Elsődleges adatforrás:

**Star Citizen Wiki API**

API dokumentáció:

`https://api.star-citizen.wiki/developers`

JSON API alap:

`https://api.star-citizen.wiki/api/...`

Elsődlegesen ezek az erőforrások szükségesek:

* `/api/game-versions/default`
* `/api/blueprints`
* `/api/items`
* `/api/vehicles`
* `/api/commodities`
* `/api/locations`

A konkrét filtereket nem szabad találgatni.

Használd az adott erőforrás:

`/filters`

végpontját, illetve az OpenAPI dokumentációt.

A Wiki fejlesztői dokumentáció kifejezetten ezt a mintát javasolja a dinamikus filterek felderítésére. ([Star Citizen Wiki API][2])

---

# 5. Külső adatforrás szabály

Ne keverd automatikusan bele más adatforrás adatait.

Ha valamely szükséges mező nincs a Wiki API-ban:

**ne találj ki adatot.**

Jelöld:

`Nincs API-adat`

vagy:

`Ellenőrzendő`

és rögzítsd a diagnosztikai logban.

UEX vagy más külső szolgáltatás csak későbbi, külön engedélyezett adatforrásként kerüljön be.

---

# 6. Játékverzió-kezelés

Az alkalmazás induláskor kérdezze le az aktuális alapértelmezett SC adatverziót.

A Wiki API támogatja a játékadatok verzióhoz rögzítését, és a fejlesztői dokumentáció a default game-version végpont használatát javasolja. ([Star Citizen Wiki API][2])

Tárold:

* aktuális API game version;
* utolsó sikeresen szinkronizált version;
* utolsó sync időpont;
* cache schema version;
* application schema version.

Ha az API game version megváltozott:

induljon teljes vagy szükséges részleges adatfrissítés.

Ha nem változott:

használható a helyi cache.

Legyen kézi:

**Adatok frissítése**

gomb is.

---

# 7. Offline és cache rendszer

Nagyobb adatokhoz használj:

**IndexedDB**

tárolást.

Ne próbáld az egész játékadatbázist localStorage-ba gyömöszölni.

Legalább ezek legyenek logikailag elkülönítve:

* game metadata;
* blueprints;
* items;
* vehicles;
* commodities;
* locations;
* mining equipment;
* normalized blueprint data;
* user inventory;
* material batches;
* user loadouts;
* crafting cards;
* application settings.

Ha nincs internet:

az utolsó sikeresen szinkronizált adatokkal az alkalmazás tovább működhessen.

Egyértelműen jelezze:

**Offline – mentett játékadat használatban**

Ne törölje a működő cache-t sikertelen frissítés miatt.

Új adatok csak akkor váltsák le a régieket, ha a szükséges adatfrissítés sikeresen lezárult.

---

# 8. CORS és helyi futtatás

A programot ténylegesen tesztelni kell úgy, ahogy a felhasználó használni fogja.

Elsődleges cél:

`file://` módban, közvetlenül megnyitott HTML.

A Codex **ne feltételezze**, hogy a Wiki API minden böngészőben engedi a `file://` originből indított fetch kéréseket.

Ténylegesen tesztelni kell.

Ha CORS miatt nem működik:

* ne legyen kamu siker;
* ne használjon kitalált adatot;
* a cache tovább működjön;
* legyen érthető hiba;
* kerüljön be a logba;
* dokumentáld a minimális localhost fallback megoldást.

De ne építs szervert a projektbe addig, amíg az valóban nem szükséges.

---

# 9. Blueprint rendszer

A Blueprint Browser automatikusan töltse le az aktuális craftolható blueprint adatokat.

A blueprint API jelenleg többek között outputot, típust, craft időt, ingredienteket és alapértelmezett elérhetőséget közöl. ([Star Citizen Wiki API][3])

Egy blueprint ingredientet **nem szabad pusztán material névként tárolni**.

A helyes belső struktúra:

**Blueprint → Recipe Slot / Aspect → Ingredient → Quantity → Unit → Quality behaviour → Affected stat**

Példa:

JS-300

Shell
→ Stileron
→ 0.35 SCU

Voltage Regulator
→ Beryl
→ 0.14 SCU

Stator Cores
→ Savrilium
→ 0.24 SCU

A jelenlegi Wiki adatok is aspect szerint bontják a JS-300 ingredientjeit. ([Star Citizen Wiki API][1])

---

# 10. Azonos material többszöri szereplése

Ez kritikus követelmény.

Ha ugyanaz az anyag ugyanabban a blueprintben több külön recepthelyen szerepel, azokat **nem szabad számítás előtt összevonni**.

Példa:

Shell
Stileron
5 SCU
HP / Integrity cél

Field Array
Stileron
2 SCU
funkcionális cél

A számítási motor számára ez két külön requirement.

Csak a megjelenítési összesítésben lehet:

**Stileron összesen: 7 SCU**

de ott is meg kell őrizni a részleteket.

---

# 11. Mértékegységek

Az ingredientek nem feltétlenül azonos mértékegységűek.

Támogatni kell legalább:

* SCU;
* darab / item.

A Wiki jelenlegi Hofstede blueprintje például SCU alapanyagokat és darabszámos Sadaryx inputot egyszerre használ. ([Star Citizen Wiki API][4])

Mértékegységeket soha ne add össze egymással.

---

# 12. Numerikus pontosság

SCU számításnál kerüld a JavaScript lebegőpontos hibákat.

Ne jelenjen meg például:

`0.30000000000000004`

Használj normalizált belső egységet vagy kontrollált decimal helper rendszert.

A felületen legalább 4 tizedes SCU pontosság legyen kezelhető.

---

# 13. Quality adatmodell

A készlet nem egyszerűen:

`Stileron = 20 SCU`

hanem Quality batch-ekből állhat.

Példa:

Stileron:

Q517 → 10.1110 SCU
Q681 → 1.1850 SCU
Q747 → 2.4710 SCU
Q892 → 1.9370 SCU

Minden batch külön rekord.

A minimum mezők:

* material ID;
* material name;
* Quality;
* quantity;
* unit;
* optional note;
* created/updated timestamp.

---

# 14. Quality capability az API alapján

Mielőtt egy ingredienthez Quality-stratégiát kínálsz, vizsgáld meg, hogy az adott blueprint input **ténylegesen Quality-változtatható-e**.

A jelenlegi Wiki JS-300 blueprint felülete például a Shell/Stileron inputot Quality-kezeléssel mutatja, míg más inputjai `Fixed` státuszúak. ([Star Citizen Wiki API][1])

Ha az API szerint:

**Fixed**

akkor:

* ne jelenjen meg Highest Q mód;
* ne jelenjen meg Target Q mód;
* ne írd át saját logikával;
* a UI jelezze: `Fixed`.

---

# 15. HP / Integrity Quality szabály

Alapértelmezett projekt-szabály:

Ha egy blueprint ingredient **kizárólag Shell / HP / Integrity jellegű értéket módosít**, akkor:

**Q500 elegendő.**

Jelölés:

**Q500+ elég**

A készletkiosztásnál mindig a **Q500 vagy afeletti legalacsonyabb Quality-jú megfelelő batch** fogyjon először.

Példa:

Q487 → nem használható
Q517 → első
Q681 → második
Q920 → csak később

Így a magas Quality nem pazarlódik el HP-only recepthelyre.

Fontos:

ne kizárólag a `Shell` szót vizsgáld.

Az API stat/effect információja legyen elsődleges.

Ha a rendszer nem tudja biztosan megállapítani:

`Quality hatás ellenőrzendő`

és ne alkalmazza vakon a HP szabályt.

---

# 16. Funkcionális Quality módok

Változtatható Quality-jú, nem HP-only recepthely esetén két választható mód kell.

### Highest Q

A rendszer a rendelkezésre álló **legmagasabb Quality-jú megfelelő batch-et használja először**.

### Target Q

A felhasználó megad például:

`Q850`

Ebben az esetben a rendszer:

Q850 vagy afeletti batch-ek közül a **legalacsonyabb megfelelőt** használja először.

Például:

Q823
Q861
Q912
Q987

Target Q850 esetén:

Q861 fogy először.

Ha nincs megfelelő Quality:

ne használjon automatikusan alacsonyabbat.

Jelzés:

**A kívánt Quality nem teljesíthető.**

---

# 17. Quality-stratégia tárolása

A Quality-stratégia ne globális material property legyen.

Tárolódjon:

**recipe requirement szinten.**

Tehát ugyanaz a Stileron egyszer lehet:

`HP_MIN_500`

és máshol:

`TARGET_Q_850`

vagy:

`HIGHEST_Q`

Ez alapvető követelmény.

---

# 18. Material Allocation Engine

Készüljön külön logikai réteg a készlet kiosztására.

Feladata:

* ingredient requirementek összegyűjtése;
* Quality szabály értelmezése;
* megfelelő batch-ek kiválasztása;
* mennyiség lefoglalása;
* hiány meghatározása;
* szűk keresztmetszet meghatározása;
* maximálisan craftolható darabszám számítása.

Egy requirement legalább tartalmazza:

* blueprint UUID;
* output UUID;
* recipe slot;
* ingredient UUID;
* material;
* required quantity;
* unit;
* quality capability;
* quality strategy;
* target Quality;
* affected stats;
* allocated batches;
* missing quantity.

---

# 19. Crafting mennyiség

Minden Crafting Cardon legyen:

**Gyártani kívánt mennyiség**

Alapérték:

1.

Módosításkor minden ingredient requirement azonnal frissüljön.

Példa:

1 darabhoz:

0.35 SCU

10 darabhoz:

3.50 SCU.

---

# 20. Maximálisan craftolható darabszám

A felhasználónak akkor is meg kell tudnia nézni:

**mennyi készíthető a jelenlegi készletből**

ha nem állít be konkrét gyártási célt.

A rendszer minden requirementet figyelembe vesz:

* mennyiség;
* mértékegység;
* Quality szabály;
* Fixed Quality;
* batch rendelkezésre állás.

Eredmény:

**Készletből maximálisan gyártható: X db**

és:

**Szűk keresztmetszet: Material / Recipe Slot**

---

# 21. Globális My Materials

Legyen közös:

**My Materials**

adatbázis.

A Crafting Cardok nem rendelkezhetnek egymástól független, duplikált kamu készlettel.

Minden Crafting Card ugyanabból a globális készletből dolgozik.

A kártyán a készlet mező szerkeszthető lehet, de ugyanazt a központi adatot módosítsa.

---

# 22. Készletfoglalás

Több aktív Crafting Card esetén támogatni kell a tervezett készletfoglalást.

Példa:

Borase készlet:

20 SCU

Card A igény:

12 SCU

Card B igény:

5 SCU

Megjelenítés:

Készlet: 20
Tervezett felhasználás: 17
Szabad: 3

Így ugyanaz az anyag nem számítódik automatikusan kétszer rendelkezésre állónak.

---

# 23. Több Crafting Card

A felhasználó egyszerre több blueprintet adhasson hozzá.

Például:

JS-300 ×4
FR-86 ×2
TS-2 ×2
Glacier ×3

Kártyánként lehessen:

* mennyiséget módosítani;
* összecsukni;
* törölni;
* duplikálni;
* lehetőség szerint sorrendet változtatni.

---

# 24. Combined Material List

Készüljön közös összesített lista az aktív Crafting Cardokból.

Materialonként jelenjen meg:

* teljes szükséges mennyiség;
* rendelkezésre álló mennyiség;
* lefoglalt mennyiség;
* hiány;
* felhasználási helyek;
* Quality kategóriák;
* mely blueprinthez kell;
* mely recipe slothoz kell.

Az azonos material összevonható megjelenítésben, de a Quality requirement bontás nem veszhet el.

---

# 25. Commodity adatbázis

A Wiki Commodities API legyen az elsődleges.

A jelenlegi adatstruktúra tartalmaz többek között:

* commodity name;
* group;
* rarity;
* refined version;
* signature;
* systems;
* locations;
* density;
* instability;
* resistance. ([Star Citizen Wiki API][5])

A commodity rendszer mining method szerint is megkülönböztethető.

Az alkalmazás kezelje:

* Ship Mining;
* Vehicle Mining;
* FPS Mining;
* Harvestable.

---

# 26. Radar Signature

Ha a Wiki Commodity API ad:

`signature`

értéket, azt jelenítsd meg a material kártyán.

Például a jelenlegi Aluminum (Ore) rekord:

**Signature: 4000**. ([Star Citizen Wiki API][6])

Megjelenítés például:

**Radar Signature: 4000**

Ha nincs adat:

**Radar Signature: Nincs adat**

Soha ne helyettesítsd nullával vagy becsléssel.

---

# 27. Mining location rendszer

Minden craftinghez szükséges bányászható materialnál legyen location feldolgozás.

A Wiki commodity rekordok jelenleg tudnak location, deposit, spawn, occurrence és Quality adatokat szolgáltatni. Például az Aluminum rekord Nyx rendszerbeli Keeger Belt bejegyzése Spawn, Occurrence és Quality tartományokat is tartalmaz. ([Star Citizen Wiki API][6])

A location motornak rendszerenként külön kell dolgoznia.

Például:

Stanton
Pyro
Nyx

Minden rendszerből legalább egy ajánlott legjobb hely.

---

# 28. Legjobb bányászhely meghatározása

Alapértelmezett rendezés:

1. legjobb occurrence/spawn esély;
2. azonos értéknél legjobb elérhető maximum Quality;
3. teljes azonosságnál location összevonás.

Ne használj kitalált súlyozott pontszámot.

A raw adat maradjon visszakereshető.

---

# 29. Location összevonás

Ha több hely:

* ugyanabban a rendszerben van;
* azonos releváns mining methoddal rendelkezik;
* azonos spawn/occurrence értéke van;
* azonos max Quality értéke van;

akkor megjelenítésben összevonható.

Például:

`Arial / Ita / Magda`

vagy:

`ARC-L1 / ARC-L2 / MIC-L1`

Az egyes eredeti location rekordokat adatmodellben őrizd meg.

Csak a UI csoportosítsa őket.

---

# 30. All Lagrange Points

Az:

**All Lagrange Points**

jelölés kizárólag akkor használható, ha az adott rendszer valamennyi releváns Lagrange mining locationje valóban ugyanazokat az összevonási feltételeket teljesíti.

Ha nem:

sorold fel konkrétan:

ARC-L1
MIC-L2
HUR-L3

stb.

Ne írj `All` megjelölést pusztán azért, mert sok hely azonos.

---

# 31. Mining equipment automatikus felismerése

Ne legyen kézzel fenntartott lista.

A Wiki Items API classification mezőit használd.

A jelenlegi API például:

Hofstede-S1:

`Ship.Mining.Gun` ([Star Citizen Wiki API][4])

Surge:

`Mining.Module` ([Star Citizen Wiki API][7])

Sabir:

`Mining.Gadget` ([Star Citizen Wiki API][8])

Ezekből dinamikusan épüljenek a dropdownok.

---

# 32. Mining Laser / Head

A mining laser dropdown automatikusan tartalmazza az aktuális kompatibilis mining lasereket.

A Wiki jelenleg külön mining-laser adatokat is szolgáltat, beleértve a module slot számot. ([Star Citizen Wiki API][9])

Egy laser kiválasztásakor olvasd ki:

`mining_laser.module_slots`

vagy az aktuális API megfelelő mezőjét.

---

# 33. Module slot dinamikus UI

Soha ne legyen fixen:

3 module dropdown.

Például a jelenlegi Hofstede-S1:

**Module Slots: 1**. ([Star Citizen Wiki API][4])

Ha egy head:

0 slot → ne legyen modulválasztó
1 slot → 1 dropdown
2 slot → 2 dropdown
3 slot → 3 dropdown

Ha új játékverzióban más szám jelenik meg:

automatikusan kövesse.

---

# 34. Hajók és mining stationök

A hajólistát lehetőség szerint az API alapján generáld.

A kiválasztott hajó alapján dinamikusan határozd meg a használható mining station/head számot.

Elsődlegesen vizsgáld:

* vehicle role/career;
* ports;
* components;
* mining hardpoint/station struktúra.

Ne legyen beégetve:

`Prospector = 1`

`MOLE = 3`

ha az API-ból biztonságosan meghatározható.

Ha nem lehet biztosan meghatározni:

használható külön user override.

Az override kerüljön logba.

---

# 35. Több mining loadout materialonként

Egy materialhoz több mentett loadout tartozhat.

Példa:

Quantanium:

* MOLE Crew;
* MOLE Safe;
* Prospector Solo;
* Golem.

Legyen:

**Alapértelmezett loadout**

beállítás.

A Crafting Cardon dropdownból választható legyen az aktív loadout.

---

# 36. Loadout szerkezete

Egy loadout legalább tartalmazza:

* loadout ID;
* material ID;
* név;
* vehicle;
* vehicle UUID;
* mining stations;
* stationonként selected laser/head;
* stationonként module slotok;
* selected modules;
* gadgetek;
* default flag;
* optional notes;
* modified timestamp.

---

# 37. Gadget kezelés

A gadgetekből a felhasználó **tetszőleges számút** adhasson a mentett loadouthoz.

UI:

**+ Gadget hozzáadása**

Minden sorban dropdown.

Legyen törölhető.

A gadget lista automatikusan a `Mining.Gadget` classification adataiból épüljön. ([Star Citizen Wiki API][8])

Ha az API vagy item leírás gameplay-korlátozást jelez, azt információként meg lehet jeleníteni, de ne találj ki szabályt.

---

# 38. Mining Card információk

Materialonként legalább legyen:

* material name;
* mining method;
* rarity;
* Radar Signature;
* instability;
* resistance;
* rendszerek;
* legjobb location rendszerenként;
* spawn;
* occurrence;
* max Quality;
* selected loadout;
* hajó;
* headek;
* modulok;
* gadgetek.

---

# 39. Crafting Card felépítése

Egy Crafting Cardon egy helyen legyen:

### Fejléc

* output neve;
* kategóriája;
* blueprint elérhetőség;
* craft time;
* SC data version.

### Gyártás

* kívánt darabszám;
* készletből gyártható maximum;
* szűk keresztmetszet.

### Ingredients

Minden recipe slot külön:

* recipe slot;
* material;
* 1 darabhoz szükséges;
* teljes szükséges;
* unit;
* Quality behaviour;
* Q500+ elég jelzés, ha alkalmazható;
* Highest Q / Target Q, ha alkalmazható;
* saját készlet;
* felhasznált batch-ek;
* hiány.

### Mining

Minden bányászható ingredienthez:

* mining method;
* Radar Signature;
* rendszerenként legjobb hely;
* spawn/occurrence;
* max Q.

### Loadout

* kiválasztott mentett loadout;
* vehicle;
* laser/head konfiguráció;
* modulok;
* gadgetek.

---

# 40. Standalone HTML export

Minden Crafting Card exportálható legyen:

**teljesen önálló HTML fájlba.**

Nem függhet külső CSS fájltól.

Exportáláskor:

`Info\style.css`

aktuális szükséges szabályait olvasd/beágyazd a HTML `<style>` részébe.

Az exportált fájl önállóan megnyitható legyen.

Ne igényeljen API kapcsolatot a már exportált adatok megjelenítéséhez.

---

# 41. Export referencia

Az export vizuális és tartalmi szerkezetének referenciaanyaga:

`Star_Citizen_alapanyag_farm_kartyak_BP_API_C788_P6_P8_Killshot_bovitve`

A Codex a tényleges fájl meglétekor vizsgálja meg, és az ottani használható megoldásokat illessze az új adatmodellhez.

A minta nem írhatja felül a funkcionális projektkövetelményeket.

---

# 42. Exportált HTML metaadat

Az exportált kártya tartalmazza legalább:

**Generated by:** sPg Crafting List
**SC Data Version:** aktuális API version
**Generated:** dátum és idő
**Data Source:** Star Citizen Wiki API

Ez legyen diszkrét, de olvasható.

---

# 43. Backup rendszer

User data export/import szükséges.

Legalább ezek kerüljenek backupba:

* My Materials;
* Quality batch-ek;
* loadoutok;
* Crafting Cardok;
* user settings;
* Quality stratégiák;
* override-ok.

Formátum:

JSON.

Legyen:

**Backup export**

és:

**Backup import**

A game API cache mentése nem kötelező ugyanebbe.

---

# 44. Diagnosztikai log alapelve

A log normál használat közben **ne jelenjen meg külön logablakban**.

A felületen csak:

**Log másolása**

és:

**Log törlése**

gomb kell.

---

# 45. RAM-alapú logolás

Egy művelet indulásakor hozz létre RAM-ban:

`logBuffer`

jellegű ideiglenes struktúrát.

Művelet közben ide gyűjtsd a diagnosztikai adatot.

Ne írj minden egyes logbejegyzésnél:

* IndexedDB;
* localStorage;
* sessionStorage;
* DOM.

---

# 46. Egyszeri logírás

Egy logikai folyamat lezárásakor:

**RAM log buffer → egyetlen véglegesített blokk → sessionStorage**

Ezután a RAM buffer üríthető.

Példa processzek:

Startup
API Sync
Blueprint Load
Material Allocation
Crafting Calculation
Card Export
Backup Import

---

# 47. Log retention

A session log több lezárt processzt tartalmazhat.

Példa:

PROCESS #001 Startup
PROCESS #002 API Sync
PROCESS #003 JS-300 Calculation
PROCESS #004 Card Export

Legyen maximális méret vagy maximális process-szám, hogy ne nőjön korlátlanra.

A legrégebbi diagnosztikai blokkok szükség esetén eldobhatók.

---

# 48. Log másolása

A:

**Log másolása**

gomb az összes rendelkezésre álló diagnosztikai adatot egy kattintással a vágólapra másolja.

Cél:

a felhasználó ezt egy az egyben átadhassa ChatGPT-nek vagy Codexnek hibakeresésre.

---

# 49. Log törlése

A:

**Log törlése**

gomb törölje:

* RAM log buffert;
* session logot;
* korábbi hibaállapotot.

Nem törölheti:

* inventoryt;
* Crafting Cardokat;
* loadoutokat;
* API cache-t.

---

# 50. Log tartalma

A diagnosztikai log fejlécében szerepeljen:

* application name;
* application version/schema;
* SC data version;
* timestamp;
* browser/user agent;
* online/offline;
* cache version;
* database version.

---

# 51. API diagnosztika

Logolni kell:

* endpoint;
* query/filter;
* HTTP státusz;
* request start/end;
* duration;
* rekordok száma;
* pagination;
* retry;
* parse error;
* schema mismatch.

Érzékeny felhasználói adatot ne logolj.

---

# 52. Schema-változás felismerése

Ha az API elvárt struktúrája megváltozik:

ne omoljon össze csendben az egész alkalmazás.

Példa log:

`SCHEMA_WARNING`

Expected field: ingredient.amount
Actual: missing
Blueprint UUID: ...
Available keys: ...

A felület jelezze, hogy az adat részben feldolgozhatatlan.

Ne találj ki pótló értéket.

---

# 53. Quality allocation log

A készletkiosztás legyen részletesen visszafejthető.

Példa logikai információ:

Material: Stileron
Slot: Shell
Rule: HP_MIN_500
Required: 6 SCU

Available:

Q487: 10
Q517: 5
Q681: 8
Q920: 4

Allocated:

Q517: 5
Q681: 1

Satisfied: yes

Ez nagyon fontos hibakereséshez.

---

# 54. JavaScript hibakezelés

Kezeld globálisan legalább:

`window.onerror`

és:

`unhandledrejection`

eseményeket.

A stack trace és releváns context kerüljön a diagnosztikai logba.

A felhasználónak ne kelljen DevTools Console-t másolgatnia.

---

# 55. Export diagnosztika

Export folyamatban logold:

* blueprint;
* SC version;
* ingredient count;
* location count;
* loadout;
* CSS beolvasás sikeressége;
* export mérete;
* hiányzó adatok;
* export eredmény.

Ha a CSS nem olvasható:

ne állítsd, hogy hibátlan standalone export készült.

---

# 56. Import validáció

Backup importnál:

* validáld a JSON-t;
* validáld a schema verziót;
* ne írj felül működő adatot félbehagyott importtal;
* migráld a régebbi támogatott schema verziót;
* ismeretlen verziónál állj meg biztonságosan.

---

# 57. Game data és user data szétválasztása

Ez kötelező.

**Game Data**

API-ról származik és frissíthető.

**User Data**

a felhasználó saját:

* inventoryja;
* Quality batch-ei;
* loadoutjai;
* Crafting Cardjai;
* beállításai.

Game data sync **soha nem törölheti a User Data-t**.

---

# 58. Eltűnt API-elemek

Ha egy korábban elmentett user loadout olyan mining module-ra hivatkozik, amely az aktuális API verzióban már nincs:

ne töröld a loadoutból.

Jelöld:

**Nem található az aktuális játékadatban**

és tartsd meg a korábbi nevet/UUID-t, amíg a felhasználó ki nem cseréli.

---

# 59. UI alapelvek

Az oldal elsődlegesen desktop használatra készüljön, de legyen responsive.

Ne legyen információs káosz.

A Crafting Card fő adatainak gyorsan áttekinthetőnek kell lennie.

A részletes blokkok lehessenek összecsukhatóak.

Különösen:

* Mining Locations;
* Loadout;
* Quality batches;
* Allocation details.

---

# 60. Fő alkalmazásrészek

A kész alkalmazás logikailag tartalmazza:

### Crafting List

Aktív Crafting Cardok.

### Blueprint Browser

Blueprint kereső és kiválasztó.

### My Materials

Globális inventory és Quality batch kezelés.

### Material Database

Ship / Vehicle / FPS / Harvestable alapanyagok.

### Mining Loadouts

Mentett mining konfigurációk.

### Combined Materials

Összes aktív crafting projekt közös igénye.

### Data / Settings

API sync, cache, backup, log kezelés.

Nem szükséges mindegyiknek külön oldalnak lennie, ha jobb UX adható panelekkel.

---

# 61. Keresés

Keresés legyen legalább:

* blueprint name;
* output item;
* material;
* vehicle;
* mining laser;
* module;
* gadget.

A keresés legyen case-insensitive.

Ha lehet, kezelje az ékezetmentes keresést is.

---

# 62. API teljesítmény

Ne indíts több száz egyedi requestet fölöslegesen.

Használd:

* index endpointokat;
* filtereket;
* paginationt;
* cache-t;
* normalizált helyi adatot.

A Wiki kereső API-ja dokumentáció szerint rate limitált, ezért különösen kerülni kell a felesleges search requesteket. ([Star Citizen Wiki API][2])

---

# 63. Adatnormalizálás

A raw API választ lehetőleg őrizd meg cache-ben vagy debug célra, de az alkalmazás számításaihoz készüljön saját normalizált adatmodell.

Ne építsd a teljes UI-t közvetlenül nyers, mély API objektumokra.

Ennek célja, hogy kisebb API schema-változás esetén csak az adapter réteget kelljen javítani.

---

# 64. API Adapter

Készüljön külön logikai modul a HTML JavaScriptjén belül:

**SCWikiAdapter**

Feladata:

* fetch;
* version;
* pagination;
* filter discovery;
* response validation;
* normalization;
* error mapping.

A többi alkalmazáslogika ne közvetlen API URL-ekkel dolgozzon.

---

# 65. Repository / Service logikai rétegek

Ajánlott belső felosztás:

`SCWikiAdapter`

`GameDataRepository`

`UserDataRepository`

`BlueprintService`

`CommodityService`

`MiningLocationService`

`MiningEquipmentService`

`InventoryService`

`AllocationService`

`CraftingService`

`ExportService`

`DiagnosticLogger`

Nem kell külön JS fájlokba bontani, ha az egyfájlos követelmény miatt nem kívánatos, de a kódban legyenek világosan elkülönítve.

---

# 66. Biztonsági szabály

Ne használj `eval()`-t.

API-ból érkező HTML vagy szöveg ne kerülhessen ellenőrizetlenül `innerHTML`-be.

Felhasználói note mezők és API-szövegek renderelésénél legyen escaping/sanitization.

---

# 67. Elfogadási teszt – blueprint

A rendszer akkor megfelelő, ha egy blueprint kiválasztásakor:

* minden ingredient megjelenik;
* recipe slot nem vész el;
* mennyiség helyes;
* unit helyes;
* Quality capability helyes;
* craft mennyiség változtatása helyesen szoroz.

---

# 68. Elfogadási teszt – azonos material kétszer

Készíts tesztet olyan blueprinttel vagy tesztfixture-rel, ahol azonos material két eltérő recipe slotban szerepel.

Az egyik legyen HP_MIN_500.

A másik legyen funkcionális.

Bizonyítani kell, hogy a készletkiosztás nem keveri össze őket.

---

# 69. Elfogadási teszt – Q500

Tesztkészlet:

Q480
Q517
Q700
Q950

HP-only requirement.

Elvárt sorrend:

Q517 → Q700 → Q950.

Q480 ne kerüljön felhasználásra.

---

# 70. Elfogadási teszt – Target Q

Target:

Q850

Készlet:

Q820
Q860
Q910
Q990

Elvárt:

Q860 fogyjon először.

Q820 ne kerüljön felhasználásra.

---

# 71. Elfogadási teszt – Highest Q

Készlet:

Q700
Q850
Q930

Highest Q stratégia.

Elvárt:

Q930 fogyjon először.

---

# 72. Elfogadási teszt – Fixed

Ha az API inputot `Fixed` státuszúnak adja:

nem jelenhet meg hozzá:

Highest Q
Target Q
Q500 override

ha az API ezt nem engedi.

---

# 73. Elfogadási teszt – mining head slot

Válassz ki 1 slotos mining lasert.

Pontosan 1 module selector jelenjen meg.

A Hofstede-S1 jelenlegi Wiki adata 1 module slotot ad, ezért használható ellenőrző példának. ([Star Citizen Wiki API][4])

---

# 74. Elfogadási teszt – API új elem

Teszteld mock adatokkal:

új mining module jelenik meg `Mining.Module` classificationnel.

Az UI-nak programkód-módosítás nélkül fel kell vennie a listába.

Ugyanez:

* Mining.Gadget;
* Ship.Mining.Gun;
* új commodity;
* új blueprint.

---

# 75. Elfogadási teszt – log

Szándékosan okozz:

* API 404;
* schema missing field;
* allocation hiány;
* export CSS hibát;
* JavaScript promise rejectiont.

Mindegyik után a:

**Log másolása**

gombbal olyan diagnosztika legyen másolható, amelyből a hiba visszakereshető.

---

# 76. Elfogadási teszt – logírás

Bizonyítani kell, hogy egy process alatt a log RAM-ban épül.

A sessionStorage-ba a teljes process végén kerüljön egyetlen véglegesített blokk.

Ne történjen minden log sor után storage írás.

---

# 77. Elfogadási teszt – standalone export

Exportálj Crafting Cardot.

Ezután:

* kapcsold le az internetet;
* helyezd át másik könyvtárba;
* nyisd meg.

A kártyának teljes kinézettel és az exportált adatokkal továbbra is működően meg kell jelennie.

---

# 78. Elfogadási teszt – game data update

Szimulálj új SC game versiont.

Elvárt:

* API cache frissül;
* User Data nem törlődik;
* régi loadoutok megmaradnak;
* eltűnt item figyelmeztetést kap.

---

# 79. Fejlesztési sorrend

Elsőként ne a kinézetet kezdd el tökéletesíteni.

Ajánlott sorrend:

1. `Info` mappa teljes elemzése.
2. API és OpenAPI felderítése.
3. helyi `file://` fetch teszt.
4. normalizált adatmodell.
5. IndexedDB.
6. API sync/version rendszer.
7. blueprint parser.
8. commodity/location parser.
9. mining equipment discovery.
10. User inventory.
11. Quality batch rendszer.
12. Allocation Engine.
13. Crafting Card számítás.
14. mining loadout rendszer.
15. Combined Materials.
16. diagnosztikai logger.
17. standalone export.
18. referencia CSS és HTML alapján végleges UI.
19. teljes elfogadási teszt.

---

# 80. Codex számára kötelező munkamódszer

Ne feltételezd, hogy egy mező létezik csak azért, mert a dokumentáció vagy egy régi API-válasz tartalmazta.

A tényleges aktuális API-t vizsgáld.

Ha bizonytalan:

* ellenőrizd az OpenAPI-t;
* ellenőrizd a `/filters` végpontot;
* ellenőrizd valós rekorddal.

Ne találj ki Star Citizen adatot.

Ne építs kézzel fenntartott listát olyan adatra, amely az API-ból stabilan felismerhető.

Ha valamire nincs megbízható adat:

jelöld ismeretlennek és logold.

---

# 81. A projekt legfontosabb alapelve

A rendszer központi lánca:

**Blueprint**

→ **Recipe Slot**

→ **Material Requirement**

→ **Quality Rule**

→ **Inventory Batch Allocation**

→ **Mining Source**

→ **Mining Loadout**

→ **Crafting Card**

Ezután készülhet csak:

**Material Summary**

és:

**Combined Materials**

Soha ne vond össze túl korán ugyanazt az anyagot, mert az eltérő recipe slotok eltérő Quality-követelményeket kaphatnak.

---

# 82. Első működő verzió késznek tekinthető, ha

A felhasználó ki tud választani egy valódi Wiki blueprintet, például JS-300-at.

A rendszer:

* betölti az aktuális receptet;
* megmutatja az ingredienteket recipe slot bontásban;
* kezeli a crafting darabszámot;
* kezeli a globális inventoryt;
* kezeli a Quality batch-eket;
* kezeli Q500 HP allocationt;
* kezeli Highest Q és Target Q stratégiát ott, ahol engedélyezett;
* kiszámolja a hiányt;
* kiszámolja a maximálisan gyártható darabszámot;
* megmutatja a szükséges ore Radar Signature értékét;
* megmutatja rendszerenként a legjobb mining locationt;
* loadoutot lehet rendelni az anyaghoz;
* a mining head module slot UI dinamikus;
* gadgetek korlátlanul hozzáadhatók;
* több Crafting Card összegezhető;
* kész standalone HTML export;
* működik a Log másolása;
* működik a Log törlése;
* adatfrissítés nem törli a User Data-t.

**Ez legyen az első teljes értékű milestone.**

A Codex ezt a specifikációt tekintse elsődleges funkcionális tervnek. Az `Info` mappában később megtalálható referencia HTML és `style.css` a megjelenéshez és az export formájához szolgál további konkrét referenciaként.

[1]: https://api.star-citizen.wiki/blueprints/js-300?utm_source=chatgpt.com "JS-300 Blueprint"
[2]: https://api.star-citizen.wiki/developers?utm_source=chatgpt.com "Developer Quickstart - Star Citizen Wiki API"
[3]: https://api.star-citizen.wiki/blueprints?utm_source=chatgpt.com "Blueprints - Star Citizen"
[4]: https://api.star-citizen.wiki/items/hofstede-s1-mining-laser?utm_source=chatgpt.com "Hofstede-S1 Mining Laser by Shubin Interstellar - WeaponMining Size 1 Grade A - Star Citizen"
[5]: https://api.star-citizen.wiki/commodities?utm_source=chatgpt.com "Commodities - Star Citizen"
[6]: https://api.star-citizen.wiki/commodities/aluminum-ore?utm_source=chatgpt.com "Aluminum (Ore) - mineable Tier common - Star Citizen"
[7]: https://api.star-citizen.wiki/items/surge-module?utm_source=chatgpt.com "Surge Module by Thermyte Concern - MiningModifier Mining.Module - Star Citizen"
[8]: https://api.star-citizen.wiki/items/sabir?utm_source=chatgpt.com "Sabir by Shubin Interstellar - Gadget Mining.Gadget - Star Citizen"
[9]: https://api.star-citizen.wiki/items?filter%5Btype%5D=WeaponMining&utm_source=chatgpt.com "Mining Lasers - Star Citizen Items"
