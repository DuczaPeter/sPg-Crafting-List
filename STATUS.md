# STATUS.md

- Projekt: `sPg Crafting List`
- Stabil baseline: `V002` (`V002` tag és `releases/V002/` változatlan)
- Fejlesztési ág: `develop/V003`
- Fejlesztési verzió: `V003-dev`
- Aktuális ciklus: `V003-C012.5A`
- Baseline commit: `1e7e407304f2a08ed427786e8ecee4ec84a0f777`
- Állapot: `PASS`
- Következő ciklus: `V003-C012.5B NOT STARTED`
- Release: nincs V003 tag, release, push vagy main merge

## Aktuális eredmény

- A Combined Materials forráshalmaza: `inventory materials ∪ active requirement materials`.
- Deduplikáció exact canonical UUID és bizonyított `commodityUuid ↔ ingredientUuid` API-kapcsolat alapján; név/fuzzy összevonás nincs.
- Inventory-only material kártya nélkül is látható. Requirement/reserved/missing ilyenkor `0`, a készlet valós értéke megmarad.
- A My Materials ismert material-listája az aktív commodity cache `buildMaterialDisplayIndex()` projekciójából épül; recept, Final Card és Crafting Card nélkül is használható. A kézi név/UUID bevitel megmaradt.
- Combined Materials derivált nézet maradt; schema, Quality policy és C012.4 numeric lifecycle nem változott.

## Bizonyíték

- Target validator: `PASS`; C012.5A, exact UUID bridge, no-fuzzy negatív fixture, C012.3 Quality, C012.4 numeric, static/JS és V001/V002 integrity zöld.
- Chrome localhost: Stileron Q747 `4,109 SCU`, reload, eltérő commodity/ingredient UUID-s JS-300 dedup és 0,35 SCU foglalás, kártyatörlés utáni inventory-megőrzés: `PASS`.
- Chrome console: `WARN 0 / ERROR 0`.
- C013 candidate továbbra is invalidált; C012.5B és C013 nincs elindítva.

Végső státusz: `V003-C012.5A – INVENTORY INDEPENDENCE PASS, C012.5B NOT STARTED`
