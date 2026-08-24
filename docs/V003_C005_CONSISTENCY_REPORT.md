# V003-C005 C004 consistency closure és final-card roadmap lock

Dátum: `2026-08-24`

Branch: `develop/V003`

Állapot: `PASS` fejlesztési kapu; stabil V003 release vagy tag nem készült.

## Forráshierarchia

1. User-facing Radar Signature: `Info/Radar Signature.png`, SHA-256 `f9c6e362a41bbbc28acbac984300d582a00bc4b79a7e9738f136e1da89cabdc6`.
2. Minden egyéb mining adat: Star Citizen Wiki API `4.9.0-LIVE.12232306` — identity, UUID, rendszer, location, provider, resource, primary/secondary, spawn, occurrence, Quality és ranking.
3. SCMDB `4.10.0-ptu.12497254`: kizárólag read-only összehasonlítás, elnevezési és grouping sanity check. Nem runtime-forrás és nem ranking input.

A két külső adatverzió eltérése önmagában nem alkalmazáshiba. A Wiki `signature` mező továbbra is csak `API_RAW_NOT_USER_FACING`; registry-egyezés nélkül a felület `Nincs adat` értéket mutat.

## Lagrange F döntési verdict

Verdict: `PRIMARY_ALUMINUM_INCLUDED_AT_SPACE_DENSE_RANK_2; SIBLING_CORUNDUM_SECONDARY_ROWS_EXCLUDED`.

A C004 Top-3 helyes volt, csak az SCMDB összehasonlító fixture egyik indoklása mosta össze a két külön resource-rekordot. Az exact Wiki döntési lánc négy locationön azonos:

| Mező | Primary Aluminum resource | Sibling Corundum resource |
|---|---|---|
| Commodity / target UUID | `e30bdd32-8fd5-44b8-9994-5fd253a16c37` | ugyanaz az Aluminum UUID secondary materialként |
| Location | `ARC L1`, `ARC L2`, `ARC L4`, `HUR L2` | ugyanaz a négy location |
| Provider | `HPP_Lagrange_F` | `HPP_Lagrange_F` |
| Parent | `Stanton`, `34ff378f-faee-47bb-b5fe-f505e665c5ca`, `Star` | ugyanaz |
| Resource key | `MineableRock_AsteroidCommon_Aluminum` | `MineableRock_AsteroidCommon_Corundum` |
| Resource UUID | `1c949ce0-c99b-485b-b783-2ea3b49162c0` | `b8c75d71-52f1-44bb-9d27-61075591d91a` |
| Resource label | `Aluminum` | `Corundum` |
| Gate | `API_RESOURCE_LABEL_MATCH` → PRIMARY | `API_RESOURCE_LABEL_DIFFERS` → SECONDARY |
| Spawn / occurrence | `15 / 17.8` | `15 / 17.9` |
| Quality tuple | quantized `318, 511, 614, 783, 896, 919, 953, 1000`; reachable max `1000` | quantized `318, 511, 614, 783`; reachable max `783` |
| Presentation | `Lagrange F`; `ARC-L1 · ARC-L2 · ARC-L4 · HUR-L2` | nincs, mert gate előtt kiesik |
| Final | dense rank `2`, `RANKED_SPACE`, INCLUDED | rank `null`, `SECONDARY_EXCLUDED`, EXCLUDED |

Következmény: az Aluminum/Stanton/SPACE Top-3 továbbra is `Aaron Halo`, `Lagrange F`, `Lagrange A`. Ranking- vagy UI-kód nem változott. A teljes mezőszintű nyolcrekordos trace a `test-artifacts/V003-C005/c005-consistency-audit.json` fájlban van.

## Radar Signature reconciliation

Élő audit: `72 raw / 64 user-facing / 33 VERIFIED / 31 UNMAPPED`. A registry továbbra is 26 exact Ship sorból és 7 Wiki-kategóriával bizonyított ROC/FPS rekordból áll.

### A. Korábban tévesen UNMAPPED, most VERIFIED

Nincs ilyen rekord. A teljes aktív ROC/FPS készlet mind a hét tagja már C004-ben is exact UUID + Wiki category flag/method alapján `VERIFIED` volt:

| Canonical név | UUID | Mining kategória | Bizonyíték | Radar eredmény |
|---|---|---|---|---|
| Beradon | `c339897c-d682-48ad-a16f-daf145bc0f4d` | VEHICLE_MINING | `has_ground_vehicle_mineables=true`, method `Ground Vehicle` | ROC Mineables, `4000–28000` |
| Feynmaline | `7310c15d-359c-42b4-b61e-7da3d0da3384` | VEHICLE_MINING | ugyanaz az exact Wiki flag/method | ROC Mineables, `4000–28000` |
| Glacosite | `960eda23-d77c-425e-8cbd-89d94ca6e2aa` | VEHICLE_MINING | ugyanaz az exact Wiki flag/method | ROC Mineables, `4000–28000` |
| Aphorite | `9b47bacf-8efa-42e2-8d84-dee64983a00a` | FPS_MINING | `has_fps_mineables=true`, method `FPS` | FPS Mineables, `3000–30000` |
| Dolivine | `7e86e2f4-6c31-41f8-9438-0fd8ad037426` | FPS_MINING | ugyanaz az exact Wiki flag/method | FPS Mineables, `3000–30000` |
| Hadanite | `3e5fdc37-cb59-4fd3-8168-e3c538ab9722` | FPS_MINING | ugyanaz az exact Wiki flag/method | FPS Mineables, `3000–30000` |
| Janalite | `f3379bda-0520-4c75-920a-c29a50eb6b50` | FPS_MINING | ugyanaz az exact Wiki flag/method | FPS Mineables, `3000–30000` |

### B. Jogos UNMAPPED / `Nincs adat`

| Canonical név | UUID | Wiki mining kategória | Bizonyíték / Radar döntés |
|---|---|---|---|
| Altruciatoxin | `6fc6df10-0267-4097-8233-67983e594669` | UNKNOWN | nincs bizonyított mining kategória |
| Amioshi Plague | `6c45b24e-bb2d-45f1-9622-f7ef9359dc77` | UNKNOWN | nincs bizonyított mining kategória |
| Bluemoon Fungus | `1996b79b-14bc-42ad-9cc4-36b0705fd284` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| Carinite | `d7d39082-ba27-470c-bc9a-d9e82ce838ae` | UNKNOWN | minden mining flag false; method/system/location nincs |
| Carinite (Pure) | `80dd9dd7-1a4e-41b9-9b3b-4f385b87396c` | UNKNOWN | minden mining flag false; method/system/location nincs |
| Comp Board | `9177e3bb-6714-49f5-8beb-46a981226ff6` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| Construction Materials | `98aa6a70-80e7-41d7-9128-9692053d57a2` | UNKNOWN | nincs bizonyított mining kategória |
| Decari | `469a34fe-2e37-4269-82eb-490eaed361a1` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| Degnous | `a0046f6f-ce84-4ca2-b5d1-d6598a9aad39` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| E'tam | `ba11589f-a278-44e9-9bd9-79552832fc94` | UNKNOWN | nincs bizonyított mining kategória |
| Fotia | `def044a7-a56a-4f99-a497-ef6022113922` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| Fresh Food | `096618a0-1f7d-48db-9c6a-9ac459386527` | UNKNOWN | nincs bizonyított mining kategória |
| Golden Medmon | `d99498e8-1464-4ff7-8177-afd05d75c3d8` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| Heart of the Woods | `293cbddc-9515-456e-8090-bdc94f746619` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| Jaclium | `2c1e1693-4d19-446c-8224-ebad36feb618` | UNKNOWN | minden mining flag false; method/system/location nincs |
| Maze | `ca8dcc9f-35d9-4652-b270-7db91ccd25a8` | UNKNOWN | nincs bizonyított mining kategória |
| Neograph | `c184c595-78c9-4e19-8e27-5ae16e166f20` | UNKNOWN | nincs bizonyított mining kategória |
| Neon | `d3c3ec68-b4ac-4504-85b3-e860a70eb9a5` | UNKNOWN | nincs bizonyított mining kategória |
| Nitrogen | `8ee121cc-aabb-4394-87dd-02552d228d0b` | UNKNOWN | nincs bizonyított mining kategória |
| Organics | `7f72bf18-3334-4e60-837d-d51d9fa745cd` | UNKNOWN | nincs bizonyított mining kategória |
| Pingala | `b442105e-6eeb-46b7-b50b-15cb39918d09` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| Pitambu | `1e4ca7fc-bb70-4080-b94f-7ad24ba4f520` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| Prota | `70684af3-55f1-43db-8aca-eae33cfac445` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| Ranta Dung | `5cc98bf3-8edd-4184-9e47-2ff40e4c556b` | UNKNOWN | nincs bizonyított mining kategória |
| Recycled Material Composite | `a0e6c4cf-face-4f52-a020-dfa869607901` | UNKNOWN | nincs bizonyított mining kategória |
| Revenant | `75982fed-2b4b-4433-be1f-5657fb783918` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| Sadaryx | `93feeedc-6d17-4b86-b8ae-8e0f4ba56cbf` | UNKNOWN | minden mining flag false; method/system/location nincs |
| Saldynium | `5fdfdea8-3d75-4287-85c7-f29a722ee351` | UNKNOWN | minden mining flag false; method/system/location nincs |
| SLAM | `8950d9c5-8a54-4e2c-87a2-c56c1b9edd3c` | UNKNOWN | nincs bizonyított mining kategória |
| Sunset Berry | `306f93e6-a500-415b-b71b-631e8c93721c` | HARVESTABLE | a PNG-ben nincs harvestable kategóriasor |
| WiDoW | `a69c19f9-f33e-4c87-bfd2-09663585d158` | UNKNOWN | nincs bizonyított mining kategória |

A Carinite, Jaclium, Sadaryx és Saldynium Wiki `signature=3000` értéke nem használható FPS-bizonyítékként, mert ez a mező kifejezetten diagnosztikai, miközben a category flag, method és location mind hiányzik. A helyes felhasználói eredmény mind a négynél `Nincs adat`.

## Top-3 és consumer konzisztencia

A változatlan Wiki-verzió C004 snapshotjához képest byte-szintű JSON-projekció összevetés történt Aluminum, Agricium és Stileron teljes rendszer/környezet eredményeire. `topThreeChanged=false`.

Külön újraellenőrzött nézetek:

- Aluminum / Stanton NORMAL és SPACE;
- Aluminum / Pyro;
- Agricium / Stanton és Pyro;
- Stileron / Pyro.

A Material Database lista, adatlap, Crafting/Combined mining snapshot és standalone export továbbra is a közös `buildMiningFarmRecommendations()` modellből dolgozik. A C004 két cache-védelme megmaradt: a hiányzó cluster-lista `[]` fallbacket kap, a régi index-cache pedig közös Radar-projekciót. `undefined.slice()` regresszió nem maradt.

## Ellenőrzés és állapot

- C005 exact fixture + élő Wiki audit: PASS.
- C001–C004 változatlan regresszió: PASS.
- M1–M6.1 + C04: PASS.
- Standalone JS-300 export: 95 529 byte, SHA-256 `8c42dbf9a68b3ede33ca108d74cddfe653aad817ae639eea5179d73572d63b8d`, PASS; külső runtime dependency nincs.
- Valódi Chrome localhost Technical Baseline: 15/15 PASS.
- Chrome Material Database: Aluminum/Stanton 3 NORMAL + 3 SPACE tier; SPACE `Aaron Halo`, `Lagrange F`, `Lagrange A`; Carinite `UNKNOWN / Nincs adat`, PASS.
- Chrome reload User Data fingerprint: `e6d8dec8` előtte és utána; változatlan.
- Chrome console warning/error: 0.
- Korábbi felhasználói Chrome `file://` ellenőrzés: `MANUAL PASS`; nem Codex automation.
- V002 tag `b326aaff5838aafd5b1f13b16982c29a0e150e35`; release HTML SHA-256 `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`; változatlan.

A C005 itt megáll. A V003-C006 csak a felhasználó következő valós Chrome `file://` visszajelzése és külön folytatási utasítása után indulhat.

Visszaállás: a V003-C005 commit revertje; stabil visszaállási alap a változatlan V002 tag és release HTML.
