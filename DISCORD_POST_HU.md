# sPg Crafting List V002 – rövid használati leírás

Az **sPg Crafting List** egy helyben futó Star Citizen crafting- és anyagtervező. Blueprint receptekből kiszámolja, milyen anyagokra és Quality-re van szükséged, összeveti ezt a saját készleteddel, és a mining vagy refinery következő lépéseinek megtervezésében is segít.

A **V002 már egyetlen önálló HTML-fájl**: csak az `sPg Crafting List.html` kell hozzá. Nincs szükség `Info` mappára, külön CSS-re vagy JavaScriptre, telepítésre és build folyamatra.

## Indítás

1. Töltsd le az `sPg Crafting List.html` fájlt.
2. Nyisd meg aktuális Google Chrome-ban – közvetlenül a fájlból is működik.
3. Első használatkor kattints az `Adatok frissítése` gombra.
4. Ezután a Blueprint Browserből vagy bármelyik másik modulból indulhatsz.

## Mit tud?

- **Blueprint Browser:** receptek keresése és részletes Recipe Slot adatok.
- **Crafting List:** több, átrendezhető Crafting Card és gyártási mennyiség.
- **My Materials:** saját készlet, anyagonként több külön Quality batch.
- **Quality és hiány számítás:** slotonkénti, determinisztikus allocation; külön mennyiségi és Quality-hiány.
- **Combined Materials:** az összes Crafting Card közös anyagigénye egy nézetben.
- **Material Database:** commodity-, harvestable- és elérhető mining adatok, például helyek és Radar Signature.
- **Mining Loadouts:** több menthető loadout, anyagonként kijelölhető alapértelmezett összeállítással.
- **UEX Refinery:** refinery yield adatokból készülő, naprendszerenkénti ajánlások.
- **Data / Settings:** játékadat-frissítés, backup/import előnézettel és másolható diagnosztikai log.
- **Önálló export:** a Crafting Card külön HTML-fájlként is elmenthető, beágyazott adatokkal és megjelenéssel.

A saját készleted, Quality batch-eid, Crafting Cardjaid és mining loadoutjaid helyben, a böngésző IndexedDB-tárolójában maradnak. Nincs felhős felhasználói fiók vagy automatikus eszközszinkron, ezért időnként érdemes backupot készíteni.

Friss játékadatok lekéréséhez internetkapcsolat kell, de maga az alkalmazás közvetlen `file://` módban indul.

**Adatforrások: Star Citizen Wiki API + UEX Corp API**
