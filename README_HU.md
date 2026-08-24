# sPg Crafting List

[English documentation](README.md)

Az **sPg Crafting List** egy helyben futó Star Citizen crafting-, készlet-, Quality-, mining- és refinery-tervező. Böngészőből használható, és egy helyre rakja össze a blueprint receptet, a saját alapanyagkészletet, a Quality-szabályokat, a bányászhelyeket, a mining loadoutokat és a refinery ajánlásokat.

Aktuális stabil kiadás: **V001**  
Release státusz: **V1 STABLE RELEASE – APPROVED WITH ACCEPTED MANUAL TEST WAIVERS**

## Mire való?

A program arra próbál egyben választ adni, hogy:

> Mit akarok legyártani, miből mennyi kell hozzá, milyen Quality szükséges, mi van már meg, miből van hiány, hol tudom kibányászni, és hol érdemes finomítani?

A receptet nem egyszerűen anyagnevekre és végösszegre butítja le. Megőrzi a **Blueprint → Recipe Slot → Ingredient** felépítést, mert ugyanaz az anyag akár több külön recepthelyen is szerepelhet eltérő Quality-viselkedéssel vagy stat-hatással.

## Fő funkciók

| Modul | Mire használható? |
| --- | --- |
| **Crafting List** | Egy vagy több blueprint hozzáadása, kívánt darabszám megadása, szükséges/lefoglalt/hiányzó anyagok számítása és kártyaprioritás kezelése. |
| **Blueprint Browser** | Az aktuális Star Citizen blueprint adatbázis keresése, a teljes slot-szintű recept csak szükség esetén töltődik be. |
| **My Materials** | A saját anyagkészlet rögzítése külön Quality batch-ekben. |
| **Material Database** | Mining/harvestable anyagok, Radar Signature, rarity, instability, resistance, helyadatok, refinery adatok és mentett default loadout megjelenítése, ha van hozzá adat. |
| **Mining Loadouts** | Materialonként mining összeállítás mentése járművel, mining headekkel, modulokkal és gadgetekkel. |
| **UEX Refinery** | Rendszerenként a legjobb elérhető refinery ajánlás megjelenítése UEX adatokból. |
| **Combined Materials** | Az összes aktív Crafting Card közös anyagigényének összesítése úgy, hogy a Recipe Slot és Quality részletek megmaradnak. |
| **Data / Settings** | User Data backup export/import és diagnosztikai log másolása. |

## Quality és allocation működés

A program nem talál ki Quality-szabályt, ha azt az adatforrásból nem lehet biztonságosan megállapítani.

- **FIXED**: a blueprint input fix, nincs Quality-stratégia.
- **DYNAMIC**: az input Quality alapján kezelhető.
- **UNKNOWN**: nincs elég biztos adat, ezért nincs találgatás.

A csak HP/Integrity jellegű dinamikus inputoknál a V001 szabálya: **Q500+ elég**, és először a legalacsonyabb megfelelő Quality batch kerül lefoglalásra. Funkcionális Quality inputoknál az aktuális blueprintadat és UI alapján használható például **Highest Q** vagy **Target Q** stratégia.

Az allocation csak **tervezett foglalás**. A `My Materials` készletből nem vonja le véglegesen az anyagot.

Ha több Crafting Card van, a kártyák sorrendje adja a prioritást: a legfelső foglal először.

## Felhasznált adatforrások

### 1. Star Citizen Wiki API

Elsődleges Star Citizen Game Data forrás:

- Fejlesztői dokumentáció: `https://api.star-citizen.wiki/developers`
- API alap: `https://api.star-citizen.wiki/api`

A V001 többek között ezeket használja:

- `GET /game-versions/default`
- `GET /blueprints/filters`
- `GET /blueprints`
- `GET /blueprints/{uuid-or-slug}`
- `GET /commodities/filters`
- `GET /commodities`
- `GET /commodities/{uuid}`
- `GET /items/filters`
- `GET /items`
- `GET /items/{uuid}`
- `GET /vehicles/filters`
- `GET /vehicles`
- `GET /vehicles/{uuid}?include=ports,components`

Ezekből jönnek többek között:

- blueprint és Recipe Slot adatok;
- ingredientek és mennyiségek;
- mining commodityk;
- Radar Signature és mining location adatok;
- mining equipment classification;
- mining head module slotok;
- mining vehicle station/head felismerés.

A V001 release ellenőrzése ezen az SC adatverzión történt:

`4.9.0-LIVE.12232306`

A program viszont az API aktuális default játékverzióját követi frissítéskor, ezért később a futás közbeni adatverzió ennél újabb lehet.

### 2. UEX Corp API

Refinery adatforrás:

- `GET https://api.uexcorp.uk/2.0/refineries_yields`

A UEX refinery cache külön van kezelve a Star Citizen Wiki Game Data és a User Data mellett. A V001 rendszerenként a UEX `value_month` értéke alapján választja ki a legjobb refinery eredményt, és döntetlen esetén minden azonos legjobb terminalt megtart.

A Wiki ↔ UEX material mapping szándékosan szigorú. Nincs fuzzy névtalálgatás. Ha egy egyezés nem bizonyítható biztonságosan, az `UNMAPPED` vagy `AMBIGUOUS` marad.

Release-kor ellenőrzött mapping:

`24 MATCHED / 50 UNMAPPED / 0 AMBIGUOUS`

### 3. Helyi fejlesztési/UI referencia

A UI és a standalone export kialakításához használt helyi referencia:

`Info/Star_Citizen_alapanyag_farm_kartyak_BP_API_C788_P6_P8_Killshot_bovitve.html`

A központi megjelenés forrása:

`Info/style.css`

Ez vizuális/fejlesztési referencia, nem élő játékadat-forrás.

## Telepítés és indítás

Normál V001 használathoz nincs telepítő, build rendszer vagy localhost szerver.

Ezt a két fájlt/mappát tartsd meg ugyanebben a relatív szerkezetben:

```text
sPg Crafting List.html
Info/
└── style.css
```

Ajánlott környezet:

- Windows 11
- aktuális Google Chrome
- a HTML közvetlen megnyitása Windows Intézőből, `file://` módban

A V001 teljes Chrome `file://` acceptance tesztje PASS lett.

Microsoft Edge alatt külön teljes kézi acceptance nem futott. Ez elfogadott release-waiver volt, ezért **a stabil V001-hez a Chrome az ajánlott böngésző**.

## Gyors használat

1. Nyisd meg Chrome-ban az `sPg Crafting List.html` fájlt.
2. Kattints az **Adatok frissítése** gombra, ha az aktuális Wiki/UEX Game Data-t szeretnéd használni.
3. Opcionálisan futtasd a **Technikai próba** ellenőrzést.
4. Nyisd meg a **Blueprint Browser** modult, és keress rá arra, amit gyártani szeretnél.
5. Nyisd meg a blueprintet, majd kattints a **Megnyitott blueprint hozzáadása** gombra.
6. A **Crafting List** alatt állítsd be, hány darabot akarsz gyártani.
7. A **My Materials** alatt add hozzá a ténylegesen meglévő anyagbatch-eket.
8. Menj vissza a **Crafting List** részhez: itt látod a lefoglalt, hiányzó és Quality-hiányos mennyiségeket.
9. Ha több blueprintet gyártasz, a **Combined Materials** adja a közös anyaglistát.
10. A **Material Database**, **Mining Loadouts** és **UEX Refinery** segít megtervezni a hiányzó alapanyag megszerzését és finomítását.
11. Egy Crafting Cardból az **Export HTML** gombbal külön standalone Crafting/Farm Card készíthető.
12. A **Data / Settings → Backup JSON letöltése** gombbal rendszeresen mentsd a User Data-t.

## Modulok használata

### Blueprint Browser

Kereshetsz blueprint/output névre vagy UUID-ra, és output típus szerint is szűrhetsz. A blueprint index cache-elve van, a teljes recept csak akkor töltődik le, amikor megnyitsz egy blueprintet.

### Crafting List

A megnyitott blueprintet hozzáadhatod a listához, majd megadhatod a kívánt darabszámot. A program Recipe Slotonként számol.

A kártyán az elérhető forrásadatoktól függően látható:

- szükséges mennyiség;
- rendelkezésre álló mennyiség;
- lefoglalt mennyiség;
- mennyiséghiány;
- Quality-hiány;
- Quality szabály/stratégia;
- lefoglalt Quality batch-ek;
- mining/farm információ;
- UEX refinery ajánlás;
- mentett mining loadout.

Több kártya is használható. A kártyasorrend módosítása az allocation prioritását is módosítja.

### My Materials

Minden Quality batch külön rekord.

Mezők:

- Material neve
- Material UUID
- Quality (`0–1000`, ahol értelmezhető)
- Mennyiség
- Unit (`SCU` vagy darab)
- Opcionális megjegyzés

Ha a Material névnél a program által felkínált ismert anyagot választod ki, az API UUID-t automatikusan ki tudja tölteni.

A belső SCU pontosság:

`1 SCU = 10 000 belső egész egység`

### Material Database

Keresés és kategóriaszűrés:

- All
- Ship Mining
- Vehicle Mining
- FPS Mining
- Harvestable

Ha az API biztos adatot ad hozzá, az adatlap megjelenítheti:

- mining mód;
- Radar Signature;
- rarity;
- instability;
- resistance;
- rendszerenkénti legjobb helyeket;
- occurrence;
- spawn értéket;
- maximum Quality-t;
- UEX refinery ajánlást;
- saját mentett Default Mining Loadoutot.

A helyrangsor nem kitalált pontszám alapján működik. A sorrend: occurrence, utána spawn, utána maximum Quality.

### Mining Loadouts

Válassz materialt, majd készíts egy vagy több loadoutot.

Egy loadout tartalmazhat:

- nevet;
- mining vehicle-t;
- mining station/head számot;
- stationönként mining headet;
- a head API-adatból ismert module slotjait;
- modulokat;
- tetszőleges számú gadgetet;
- Default Loadout jelölést.

Ha az API-ból a station-szám nem állapítható meg biztonságosan, kézi station override adható meg. Ha egy korábban mentett equipment eltűnik az aktuális Game Datából, a program nem törli ki csendben, hanem hiányzóként megőrzi/jelöli.

### UEX Refinery

Válassz Wiki mining commodityt, és megkapod rendszerenként a legjobb refinery eredményeket.

A rangsorolás alapja a UEX `value_month`.

- Azonos legjobb értéknél minden döntetlen terminal megmarad.
- A nulla vagy negatív értéket sem rejti el automatikusan.
- Ha nincs biztonságos Wiki ↔ UEX mapping, ezt jelzi, nem találgat.

A UEX cache alapból legfeljebb naponta egyszer frissül automatikusan, kivéve a kézi frissítést.

### Combined Materials

Az összes aktív Crafting Card közös nézete. Több gyártási célhoz egyben megmutatja az anyagigényt, miközben a Recipe Slot és Quality részletek továbbra is visszakövethetők.

### Data / Settings

A **Backup JSON letöltése** a User Data-t menti ki.

A backup nem tartalmazza a bármikor újra letölthető Game Data cache-t. Import előtt előnézet készül, majd validált MERGE vagy REPLACE mód használható.

A diagnosztikai rész egy tömör logot tud másolni API-, cache-, allocation-, refinery-, export- és hibaadatokkal, amit hibakereséshez lehet továbbadni.

## Helyi adattárolás és cache

A felhasználó saját adatai helyben, a böngésző **IndexedDB** tárolójában vannak. Ide tartoznak többek között a material batch-ek, Crafting Cardok, mining loadoutok és kapcsolódó beállítások.

A Game Data külön cache-ben van, és újra letölthető az API-kból. A UEX Game Data szintén külön van kezelve a Wiki Game Data és User Data mellett.

A külön böngészők/profilok IndexedDB-je nem közös. Például a Chrome és az Edge külön helyi User Data-ként kezelendő. Átköltözéshez használd a JSON backupot.

Ha már van érvényes mentett Game Data cache, a program élő API-kapcsolat hiányában vissza tud esni a mentett adatokra. Új adatfrissítéshez természetesen internet kell.

## Standalone Crafting/Farm Card export

Minden Crafting Cardból készíthető külön HTML az **Export HTML** gombbal.

Az export egy adatpillanatképet és beágyazott megjelenést tartalmaz, tehát nem kell mellé a fő alkalmazás vagy az `Info/style.css`. A V001 ellenőrzés során az export újratöltésekor nem indult külső HTTP/HTTPS runtime kérés.

A Windows-szintű teljes internetlekapcsolással történő újranyitás O04 tesztje nem futott le, és elfogadott release-waiver lett. Ez a tesztlefedettséget dokumentálja; az export ettől még külső runtime dependency nélkül készül.

## V001 tesztállapot

- Automatizált M1–M6.1 + C04 regresszió: **PASS**
- Chrome C01–C17 közvetlen `file://` acceptance: **PASS**
- Standalone O01–O03 és O05–O06: **PASS**
- O04 Windows-szintű internetlekapcsolásos újranyitás: **NOT TESTED – ACCEPTED RELEASE WAIVER**
- Edge E01–E10 kézi acceptance: **NOT TESTED – ACCEPTED RELEASE WAIVER**
- User Data-vesztés az acceptance alatt: **NO**

## Projektstruktúra

```text
sPg Crafting List.html          Fő alkalmazás
Info/style.css                  Központi stílus
releases/V001/                  Fagyasztott stabil V001 bundle
docs/                           Technikai/projekt dokumentáció
tests/                          Regressziós fixture-ök és tesztterv
tools/                          Validáló és teszt scriptek
test-artifacts/                 Ciklusonkénti tesztbizonyítékok
```

Stabil használathoz a fagyasztott release innen való:

`releases/V001/`

## Fontos működési elvek

- A program nem talál ki hiányzó Quality-szabályt.
- Ugyanaz a material külön Recipe Slotokban külön marad, ameddig a számítás ezt megköveteli.
- A mining equipment listák API classification alapján épülnek, nem kézzel beégetett listából.
- Új API-elemeket lehetőség szerint programkód-módosítás nélkül fel tud venni, ha az API schema/classification kompatibilis marad.
- User Data és Game Data szándékosan külön van választva.
- Nagyobb változtatás vagy import előtt mindig készíts backupot.

