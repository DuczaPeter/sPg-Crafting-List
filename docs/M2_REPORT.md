# M2 jelentés – My Materials és determinisztikus Allocation Engine

Dátum: 2026-08-22

## 1. Inventory és batch adatmodell

- A `materialBatches` a kanonikus globális User Data készlet. Egy material tetszőleges számú, külön azonosítójú Quality batch-ben tárolható.
- Batch mezők: `id`, material API UUID és név, `quality` (`0–1000` vagy ismeretlen), `quantityUnits`, `unit`, megjegyzés, létrehozási és módosítási idő.
- SCU esetén a `quantityUnits` egész szám, `1 SCU = 10 000` belső egység. `ITEM` esetén csak egész darabszám menthető.
- A `userInventory` csak tranzakciósan újraépített material/unit összesítő; a batch-eket nem vonja össze Quality szerint.
- A `craftingCards` sorrendezett User Data snapshot. Minden kártya saját mennyiséget, változtatható prioritást, külön Recipe Slot rekordokat és slotonkénti Quality-stratégiát tárol.
- A Game Data sync teljes User Data fingerprintet ellenőriz a frissítés előtt és után; a 1591 rekordos kényszerített sync ezt változatlanul hagyta.

## 2. Allocation algoritmus

1. A motor másolatból dolgozik, ezért az inventory bemenetet nem módosítja.
2. A kártyákat kézi `order`, azon belül stabil `id` szerint; a követelményeket `aspectIndex`, majd stabil slot-ID szerint dolgozza fel.
3. Minden Recipe Slot önállóan kap Quality-szabályt és allocation eredményt. Azonos material két slotban sem kerül összevonásra.
4. A motor material UUID + unit szerint keresi a batch-eket, majd a Quality-szabálynak megfelelő stabil sorrendet alkalmazza.
5. A foglalás csak a számítás belső `remaining` térképét csökkenti. A mentett batch mennyisége változatlan marad.
6. Külön készül mennyiséghiány, Quality-hiány, maximálisan gyártható darabszám, bottleneck és batch-szintű döntési trace.

Az algoritmus tiszta és determinisztikus: azonos inputból bitazonos JSON eredményt ad.

## 3. Quality szabályok

| Slot típusa | Stratégia | Batch sorrend |
| --- | --- | --- |
| DYNAMIC, csak HP/Integrity | `HP_MIN_500` | legalacsonyabb Q500 vagy jobb Quality először |
| DYNAMIC, funkcionális | `Highest Q` | legmagasabb Quality először |
| DYNAMIC, funkcionális | `Target Q` | a célt elérő legalacsonyabb Quality először |
| FIXED | nincs stratégia | stabil batch-sorrend; Quality nem szűr |
| UNKNOWN | nincs találgatás | nem foglal, külön Quality-ismeretlen állapot |

`Target Q` nem használ csendben gyengébb batch-et. Ha a teljes mennyiség megvan, de nem megfelelő Quality-ben, az eredmény `INSUFFICIENT_QUALITY`, nem egyszerű mennyiséghiány.

## 4. Tesztfixture-ök és valós blueprint-ek

- Kötelező 8 M2 eset: PASS (`tests/fixtures/m2-allocation-cases.json`).
- HP-only Q480/Q517/Q700/Q950: Q517 elsőként.
- Target Q850 Q820/Q860/Q910/Q990: Q860 elsőként.
- Highest Q Q700/Q850/Q930: Q930 elsőként.
- Azonos material külön HP és funkcionális slotban: külön allocation.
- Pontos mennyiséghiány és bottleneck; külön Quality-hiány: PASS.
- Két kártya sorrendcseréje megváltoztatja, melyik kártya kapja a Q517 elsőbbségi foglalást; ismételt futás bitazonos.
- JS-300 valós API-adat: `HP_MIN_500 + FIXED + FIXED`; helyi böngészőben Q517 foglalás, két kártya, IndexedDB reload és Game Data sync PASS.
- S00 Hofstede valós API-adat: `HP_MIN_500 + HIGHEST_Q + HIGHEST_Q`; a funkcionális slotok `Highest Q`/`Target Q` vezérlői és a Target Q850 újratöltés utáni megőrzése PASS.

## 5. Talált és javított hibák

- A korábbi, stratégiamező nélküli kártyarekord UI-hibát okozhatott volna; betöltéskor biztonságos alapértelmezett migráció készül.
- Cache-ből visszaállított vagy újonnan megnyitott blueprintnél a kártyahozzáadás gomb állapota és a material-lista nem frissült minden útvonalon; javítva.
- `ITEM` szerkesztés után a batch űrlap SCU-ra resetelése megtarthatta volna az egész számos lépésközt; javítva.
- A Game Data/User Data védelem korábban csak rekordszámot hasonlított; most a teljes kanonikus User Data fingerprintet is ellenőrzi.

## 6. Teljesítmény

A nagy fixture 1000 batch-et, 100 kártyát és 300 Recipe Slotot számol. A megfigyelt futásidő Windows alatt 0,66–0,72 másodperc volt; a regressziós kapu 1,5 másodperces felső határral fut. A UI lazy renderelése és további lapozása későbbi extrém készletméretnél még optimalizálható.

## 7. M3 előtt nyitva maradt pontok

- M3: mining adatok, occurrence → spawn → maximum Quality location rangsor és loadoutok.
- A közvetlen `file://`, a ténylegesen letöltött standalone export offline újranyitása és a külön Edge-regresszió továbbra is nyitott release-gate; stabil kiadás nincs.
- A UEX refinery ajánló új V1 követelmény, külön későbbi milestone feladata. Hiánya nem M1/M2 hiba.
- A végleges készletlevonás továbbra sincs bekapcsolva; V1-ben az allocation tervezési mód.

## M2 ellenőrzési eredmény

- `tools/validate-m2.ps1`: PASS; az M1 regresszió is PASS.
- Helyi Chromium böngésző: 9/9 technikai próba, IndexedDB-perzisztencia, kártyasorrend, teljes User Data fingerprint, desktop és 390 px mobil nézet: PASS.
- Böngésző warning/error konzol: 0.
