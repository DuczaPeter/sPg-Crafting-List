# V003-C006 Final Crafting Card és teljes material snapshot hydration

Dátum: `2026-08-24`

Branch: `develop/V003`

Állapot: `PASS` fejlesztési ciklus. Stabil V003 release vagy tag nem készült; V003-C007 nem indult el.

## Final Crafting Card

A `Crafting List` card-first megjelenítést kapott. A kártyafejléc a blueprint output és a Wiki item detail alapján mutatja:

- blueprint/item név;
- Size;
- Class és Type;
- Grade;
- Crafting Time;
- `+ Crafting List` műveletet.

A kártya a `Gyártani akarok` mennyiséget és a készletből maximálisan gyártható darabszámot is mutatja. Minden Recipe Slot külön marad; anyagonként látható az egy darabhoz és az aktuális mennyiséghez szükséges érték, a megfelelő készlet, a lefoglalt mennyiség, a hiány vagy maradék, továbbá a Quality szabály és a felhasznált batch.

A kártyán materialonként három gameplay-panel szerepel:

1. curated Radar Signature;
2. Mining snapshot a C001-C005 közös Top-3/ranking/grouping projekcióból;
3. biztonságos UEX refinery eredmény.

Raw Wiki `signature`, raw UUID, provider/resource key, cache/schema/verzió és diagnosztikai trace nem jelenik meg a normál kártyán. A material token `data-material-uuid`, `data-material-name` és neutralis `spg-material-token-accent-pending` hookot kapott; bizonyítatlan szín nem került be.

## Automatikus hydration

A közös folyamat:

`hydrateMaterialIntelligenceRecords()` → `ensureMaterialIntelligenceHydrated()` → `resolveMiningCommodityDetailRecord()` → `refreshMaterialIntelligenceSnapshots()`.

Működés:

1. a kártyák minden ingredient commodity UUID-ját összegyűjti;
2. verziózott normalizált cache-t keres;
3. cache-hiánynál és engedélyezett hálózatnál a Wiki API item detailt tölti le;
4. a meglévő mining normalizer, primary/secondary gate, ranking, grouping, canonical naming és curated Radar projekció fut;
5. ugyanahhoz a snapshothoz kapcsolja az exact/verified UEX mapping eredményét;
6. a közös final-card view-modelt újraszámolja.

Ez létrehozáskor, update/reload után és export előtt fut. A Material Database megnyitása nem előfeltétel. A blueprint output prezentáció külön cache-ből tölti a valós Size/Class/Type/Grade adatot.

Offline cache-találat `AVAILABLE`. Offline cache-hiány `UNAVAILABLE_OFFLINE`, online sikertelen lekérés `UNAVAILABLE`; egyik eset sem dobja el a kártyát és nem talál ki adatot.

## UEX korlát

Stileronhoz nincs biztonságosan igazolt UEX mapping, ezért a látható szöveg pontosan:

`Nincs biztonságos UEX refinery adat`

Fuzzy matching vagy új alias nem készült. Beryl és Savrilium a meglévő verified M5/M5.1 mappinget használja.

## Közös UI/export adatmodell

A normál kártya és a standalone export ugyanazt a `buildFinalCraftingCardViewModel()` eredményt használja. A view-model bemenete a változatlan determinisztikus Allocation Engine, a normalizált blueprint, a hidratált material intelligence és az output presentation cache.

Előkészített, stabil DOM hook készült a blueprint, material, mining, refinery és radar elemekhez. Ezek `spg:detail-request` eseményt adnak, de teljes C008 detail nézet vagy külső HTML nem készült.

## JS-300 bizonyíték

Friss localhost originen, korábbi Material Database megnyitása nélkül létrehozott JS-300 kártya:

- output: JS-300, Size 1, Military, Power Plant, Grade A, Crafting Time 15 perc;
- quantity: 2; max craftable: 3;
- Stileron: Q517, megfelelő készlet 1,05 SCU, foglalás 0,7 SCU, maradék 0,35 SCU;
- Beryl: megfelelő készlet 0,42 SCU, foglalás 0,28 SCU, maradék 0,14 SCU;
- Savrilium: megfelelő készlet 0,72 SCU, foglalás 0,48 SCU, maradék 0,24 SCU;
- mindhárom material curated Radar és Wiki mining snapshotot kapott;
- Beryl/Savrilium refinery elérhető; Stileron a fenti explicit biztonságos korlátot mutatja.

## Ellenőrzések

- C006 célzott fixture: 12 kötelező csoport PASS.
- Offline cached, offline uncached és online failure hydration: PASS.
- Quantity 1→2, max craftable, HP_MIN_500, FIXED, enough/partial/missing, determinisztikus reload: PASS.
- C001-C005 és teljes M1-M6.1 + C04: PASS.
- Élő Wiki C003-C005 auditok: PASS.
- V002 tag és release HTML integritás: PASS.
- Chrome localhost fresh-cache hydration: PASS.
- Chrome reload fingerprint: `39341365` előtte és utána.
- Chrome alkalmazás-konzol warning/error: 0.
- Felhasználói valós Chrome `file://` C005 kapu: `MANUAL PASS`; nem Codex automation.

A Chrome-ból ténylegesen letöltött JS-300 standalone fájl ellenőrzése:

- méret: `448917` byte;
- SHA-256: `a834c84801639057b9a7f3e6a14f8a5a881bd45562d411159c1d5a6ef52542fb`;
- 3 Recipe Slot, 3 teljes material snapshot, 6 location és 4 refinery system;
- embedded CSS és érvényes snapshot JSON;
- külső HTTP/HTTPS runtime resource: 0;
- raw `SHIP_MINING` nem látható; emberi `Ship Mining` felirat jelenik meg;
- Stileron explicit UEX korlát megvan.

## Érintett fő függvények

- `resolveMiningCommodityDetailRecord()`
- `hydrateMaterialIntelligenceRecords()`
- `ensureMaterialIntelligenceHydrated()`
- `ensureCraftingOutputPresentationHydrated()`
- `refreshMaterialIntelligenceSnapshots()`
- `buildFinalCraftingCardViewModel()`
- `renderCraftingCards()`
- `renderRequirementAllocation()`
- `renderMaterialIntelligenceSnapshot()`
- `m6RenderStandaloneHtml()`
- `buildStandaloneExport()`

## Védelem és visszaállás

A `V002` tag dereferált commitja továbbra is `b326aaff5838aafd5b1f13b16982c29a0e150e35`. A stabil V002 HTML SHA-256 továbbra is `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`.

Visszaállás: a C006 commit revertje; stabil visszaállási alap a változatlan V002 tag és release artifact.
