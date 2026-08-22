# M3 jelentés – Mining Data, location rangsor és loadoutok

Dátum: 2026-08-22

## 1. Endpointok és dinamikus filterek

- Commodity: `/commodities/filters`, majd lapozott `/commodities?filter[kind]=...`; részlet igény szerint `/commodities/{uuid}`.
- Equipment: `/items/filters`, majd lapozott `/items?filter[classification]=...`; head részlet igény szerint `/items/{uuid}`.
- Vehicle: `/vehicles/filters`, majd lapozott `/vehicles?filter[role]=...`; stationfelismeréshez részlet `/vehicles/{uuid}?include=ports,components`.
- A kategória-, role- és classification-lista API-facetekből épül. A program nem tart fenn kézi commodity-, vehicle-, head-, module- vagy gadgetlistát.
- Az aktuális `4.9.0-LIVE.12232306` dataset: 72 commodity, 14 mining role-os vehicle, 20 head, 28 module és 6 gadget.

## 2. Normalizált mining modell és cache

- Elkülönített Game Data store: `miningRawCache`, `miningNormalizedCache`, `miningDatasets`.
- Commodity index: UUID, név, kind, API-flagből vagy methodból származó `SHIP_MINING` / `VEHICLE_MINING` / `FPS_MINING` / `HARVESTABLE` / `UNKNOWN`, signature, systems és teljes provenance.
- Commodity részlet: minden raw location külön rekordként megmarad; occurrence, spawn, mining method, csak az adott commodity UUID-jéhez tartozó Quality-tartományok és azok tényleges maximuma külön mező.
- Equipment index: API classification, típus és provenance. A head részlet őrzi a `moduleSlotCount` és forrását.
- Vehicle részlet: rekurzívan felismert mining portok, station count és forrás. Bizonytalan esetben `UNKNOWN`.
- A teljes új dataset csak egy sikeres IndexedDB-tranzakció után válik aktívvá. A raw és normalizált adat külön marad.
- A `userLoadouts` külön User Data store. A sync előtti és utáni teljes loadout- és User Data-fingerprint egyezését a program ellenőrzi.

## 3. Location rangsor

1. A rekordok naprendszer és mining method szerint külön csoportba kerülnek.
2. Sorrend: occurrence csökkenő, spawn csökkenő, maximum Quality csökkenő, majd stabil név/ID tie-breaker.
3. Csak teljesen azonos method + occurrence + spawn + maximum Quality eredmények vonhatók össze; a raw rekordok ettől nem változnak.
4. Az `All Lagrange Points` csak akkor jelenik meg, ha az adott rendszer/method minden releváns Lagrange rekordja azonos a legjobb ranggal. Azonos nem-Lagrange helyek külön felsorolva maradnak.
5. Ismeretlen rendszeradatnál nincs másik rendszerből fallback: `Nincs ismert mining location`.

## 4. Mining Loadout modell

- Egy materialhoz tetszőleges számú loadout tartozhat, materialonként pontosan egy defaulttal.
- Loadout mezők: material, név, vehicle, station override, dinamikus stationlista, stationönként head és dinamikus module-lista, tetszőleges gadgetlista, default és időbélyegek.
- Vehicle választáskor az API-portok alapján 1, 3 vagy bármely későbbi station-szám automatikusan megjelenik.
- Head választáskor az API `mining_laser.module_slots` értéke szerint pontosan annyi module dropdown jelenik meg. Ismeretlen értéknél nincs találgatás.
- A kézi station override `USER_OVERRIDE` forrással naplózott.
- Az aktuális Game Datából eltűnt vehicle/head/module/gadget UUID és név megmarad; a UI `Nem található az aktuális játékadatban` állapottal jelöli.

## 5. Valós adatok és tesztek

- Commodity: Agricium (Ship, signature 4000, több rendszer), Beradom (Vehicle), Aphorite (FPS, signature hiányzik), Bluemoon Fungus (Harvestable).
- Head: Arbor MH1 1 module slot; Helix II 3 module slot.
- Vehicle: Prospector 1 station; MOLE 3 station; API role- és rekurzív portfelismerés.
- A `S00 Hofstede` valós, külön S0 API-item; nem a `Hofstede-S1` dokumentációs elírása.
- A 17 kötelező M3 regressziós eset PASS. A 5000 locationös determinisztikus teljesítményfixture 44–45 ms alatt futott.
- Chrome localhost: 72/14/20/28/6 index, Agricium rangsor, Aphorite `Nincs adat`, MOLE 3 station, Helix II 3 slot, Arbor MH1 1 slot, több loadout/default, 5 stationös override, loadout fingerprint és reload PASS.
- Beépített technikai próba: 10/10 PASS; Chrome warning/error: 0.

## 6. API-ból nem biztonságosan meghatározható adatok

- Egyes S0/vehicle mining headek `module_slots` értéke `null`; ezek `UNKNOWN` állapotúak.
- Olyan mining role-os vehicle, amelynél a ports/components alapján nincs biztos head, `UNKNOWN` station countot kap és user override-ot igényel.
- Hiányzó signature `null` marad, a UI-ban `Nincs adat`; nulla vagy becslés nem készül.
- Kétértelmű commodity kategória `UNKNOWN`; a névből a program nem következtet.

## 7. Talált és javított hibák

- Az induló Agricium-választás túl szigorú teljes névegyezése az első commodityra esett vissza; prefixalapú, stabil kiválasztásra javítva.
- Vehicle/head újrarender közben a már beírt loadoutnév elveszhetett; a mező azonnal a draftmodellhez kötve.
- A station override csak `change` eseményre reagált; azonnali `input` feldolgozásra javítva.
- A tizedik beépített probe a classification eredményobjektumot tévesen tömbként ellenőrizte; javítva.
- A Quality-kivonás másik material `is_current` rekordját is elfogadhatta volna; elsődlegesen szigorú commodity UUID-egyezésre javítva és decoy fixture-rel lefedve.

## 8. M4 előtt nyitva

- A közvetlen `file://`, a letöltött standalone export offline újranyitása és a külön Edge-regresszió változatlan release-gate; stabil kiadás nincs.
- M4: Combined Materials, backup/restore preview és kibővített diagnosztika a teljes V1 specifikáció szerint.
- A UEX refinery ajánló külön későbbi V1 milestone. Hiánya nem M3-hiba.
