# V003-C012.5A – Inventory Independence Foundation

## Eredmény

`PASS` – a Combined Materials már nem függ kizárólag aktív receptektől, a My Materials ismert materialválasztása pedig recept nélkül is működik. C012.5B és C013 nem indult el.

## Root cause és javítás

A Combined Materials korábban csak az Allocation Engine recipe requirement eredményeiből építette a materialhalmazt, ezért nulla Crafting Card mellett a valós inventory eltűnt a nézetből. A known-material datalist elsődlegesen a már használt inventory/recipe rekordokra támaszkodott.

Az új forráshalmaz:

`inventory materials ∪ active requirement materials`

Az inventory-only rekord `required = 0`, `reserved = 0`, `missing = 0` értékekkel és a tényleges készlettel jelenik meg. A nézet továbbra is derivált; nincs külön Combined inventory-másolat vagy schema-változás.

## Canonical identity

- Elsődleges forrás: az aktív commodity cache meglévő `buildMaterialDisplayIndex()` projekciója.
- Azonos material csak exact UUID vagy az API-ban bizonyított `commodityUuid ↔ ingredientUuid` kapcsolat alapján vonható össze.
- Név-, részleges string-, fuzzy- vagy guessed alias deduplikáció nincs.
- Exact kapcsolat nélküli két, akár azonos nevű UUID külön material marad.
- A kézi materialnév/UUID/Quality/mennyiség/unit bevitel megmaradt.

## Targeted fixture-ek

- Nulla kártya, Stileron Q747 4,109 SCU: PASS.
- Három inventory-only material: PASS.
- Requirement-only material és pontos hiány: PASS.
- Inventory + requirement egy canonical material kártyán: PASS.
- Eltérő commodity/ingredient UUID exact API-kapcsolattal: egy kártya, inventory/requirement/reserved/missing együtt: PASS.
- Azonos nevű, de nem kapcsolt UUID-k: két kártya, nincs fuzzy merge: PASS.
- Crafting Card törlése után inventory megmarad: PASS.
- Receptfüggetlen known-material választás: PASS.
- Reload/persistence modell és backup/restore: PASS.
- C012.3 közvetlen Quality regresszió: PASS.
- C012.4 numeric lifecycle regresszió: PASS.
- Static/JavaScript és V001/V002 integrity: PASS.

Validator: `tools/validate-v003-c0125a.ps1`  
Log: `test-artifacts/V003-C012.5A/validation.log`

## Chrome localhost

A végleges kódon az inventory Stileron commodity UUID-je `32bafbd4-c52a-476d-b31c-97c4b3102471`, a JS-300 ingredient UUID-je `8cd317a3-df9b-4315-8ac3-0f1fca42dfd4` volt. A bizonyított exact kapcsolat alapján a Combined Materials egyetlen Stileron kártyát mutatott: készlet 4,109 SCU, igény 0,35 SCU, foglalás 0,35 SCU, hiány 0. A kártya törlése és reload után a készlet 4,109 SCU maradt, a három requirement érték 0-ra állt vissza.

Chrome console: `WARN 0 / ERROR 0`.

Végső státusz: `V003-C012.5A – INVENTORY INDEPENDENCE PASS, C012.5B NOT STARTED`
