# V004-C006 Craft History Undo Report

## Baseline és scope

- Input checkpoint: `7972659a1cc987a2056eedf5703992183ec58770`.
- Input application SHA-256: `fd37d3a951e95266a15e8807fd09d4dc477351897a60060b59375062f65b3569`.
- Final application SHA-256: `ad0457cdf9655bfb03dfb4b6e9f924d5db71c2e8c55d1d8be215c0beea3b6ce5`.
- Branch/runtime: `develop/V004`, `V004-dev`.
- A ciklus a C005 History UI-ra épülő exact, LIFO Craft Undo műveletet valósította meg. Redo, History delete/archive/clear, BroadcastChannel, C007 és stable V004 nincs a scope-ban.
- Teljes release-regresszió és a 1606-blueprint production audit nem futott újra. A változatlan normalization/completion út célzott C004.4 és C005 regressziója futott.

## Durable Undo contract

Az Undo egyetlen truth-forrása a kiválasztott `craftHistory` eseményben tárolt `consumedDeltas`. A művelet nem olvas live recipe/API adatot, nem futtat quantity-normalizálást, és nem állít vissza teljes inventory snapshotot. Minden sor pontosan a korábban levont egész `consumedUnits` értéket adja vissza ugyanahhoz a canonical material/source UUID, Quality, unit és batch lineage identitáshoz.

Cardonként csak a legutóbbi még aktív `COMPLETED` esemény vonható vissza. A frissebb esemény `UNDONE` állapota után az előző aktív event válhat jogosulttá. Legacy vagy hiányos evidence, megváltozott partial Card, megváltozott full list, inkompatibilis batch-ID és második Undo fail-closed, nulla írással.

Sikeres Undo után az event megmarad, `UNDONE` státuszt, `undoneAt`, egyedi `undoTransactionId`, exact restored-batch auditot és revision evidence-et kap. Az eredeti completion evidence, `historySequence`, reservation hash, Card snapshot és consumed delta nem változik. Redo nincs.

## Partial és full állapot

- Partial Undo csak az event által hátrahagyott exact Card post-state és megfelelő Card revision mellett engedélyezett. A quantity visszaáll, `inventoryRevision +1`, `allocationRevision +1`, Card revision `+1`, `craftListRevision +0`.
- Full Undo csak változatlan post-completion list authority mellett engedélyezett. Az eredeti Card ugyanazzal az ID-val, quantityvel, blueprinttel, slot-/Quality-pool beállításokkal, provenance-szal és eredeti orderrel a tárolt pre-craft snapshotból áll vissza. `inventoryRevision +1`, `allocationRevision +1`, `craftListRevision +1`, a Card revision konzisztensen nő.
- Létező kompatibilis batchbe exact merge történik. Hiányzó batch az eredeti lineage/Q/material/unit/provenance alapján újrajön. Azonos ID-jú inkompatibilis rekord `UNDO_BATCH_ID_COLLISION`, felülírás nélkül.
- Más batchben Craft után történt független inventory-változás megmarad. A global inventory revision eltérése önmagában nem blokkol; a friss durable batch-state az authority.
- Minden sikeres Undo után valamennyi reservation stale, allocation nincs automatikusan újraszámítva; explicit Reallocate szükséges.

## Atomi tranzakció és UI

A commit előtt az alkalmazás frissen olvassa az IndexedDB event, History, Card, meta és batch állapotát. Egyetlen readwrite tranzakció kezeli a `materialBatches`, `userInventory`, `craftingCards`, `craftHistory` és `userMeta` store-okat. A batch restore utáni, Card restore előtti, History update utáni és meta/revision update előtti szimulált hibák mind teljes rollbacket adtak.

A C005 History eventen csak ténylegesen jogosult eseménynél aktív a `Craft visszavonása` gomb. A dialógus megmutatja a productot, craft-run mennyiséget, event időpontot, Card eredményt és minden exact material/Q/batch/unit sort. A `Mégse` durable write 0; bezárás után a History action state újrarenderelődik. `UNDONE` eseménynél `Visszavonva` látható és nincs Redo.

## Célzott bizonyítás

- Production Omnisky III Cannon, UUID `280f47b7-8434-410c-b854-380768fdccec`, requirement `3600/7/7` unit craftonként.
- Partial: 21 → complete 5 → 16 → Undo → 21; consumed/restored `18000/35/35` unit; material loss 0.
- LIFO: complete 5, complete 3; először csak a második event jogosult. Második Undo után az első jogosult; végső Card 21 és inventory exact initial.
- Full: 1 → complete 1 → Card és batch-ek eltűnnek → Undo → eredeti Card és mindhárom batch exact recreate; material loss 0.
- Merge és recreate PASS; incompatible same-ID collision BLOCKED, corruption 0.
- Független `+5000` unit batch megmaradt; targeted delta restore PASS.
- Partial Card semantic edit és post-full Crafting List mutation BLOCKED, durable write 0.
- Cancel 0 write; double Undo `ALREADY_UNDONE`, 0 write.
- Négy injected failure stage teljes rollback, részleges restore 0.
- Reload után UNDONE, inventory, Card és eligibility tartósan helyes.
- History grouping és sequence-first deterministic group/event sort C005 szerint változatlan; aktív completed totalból UNDONE kizárva.
- 1920×1080 és 390×844: horizontal overflow 0.
- C004.4 Craft Complete/4DP HALF-UP és C005 History regresszió az aktuális application byte-okon PASS.
- Automated direct `file://`: PASS; runtime fájl 1, helyi runtime sidecar 0.
- Console/page error: 0; `git diff --check`: PASS.

Evidence:

- `test-artifacts/V004-C006/model-evidence.json`
- `test-artifacts/V004-C006/browser-evidence.json`
- `test-artifacts/V004-C006/validation.log`
- `test-artifacts/V004-C006/target-summary.json`

## Protected release integritás

- V001/V002/V003 release path: változatlan.
- Annotated `V003` tag target: `ebc83281769fd212d988ee55957b1c2754256490`.
- V003 artifact: `835820` byte; SHA-256 `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`.
- Push/force push: NO.

## Rollback

A C006 helyi checkpoint normál `git revert` műveletével állítható vissza. A V003 taget vagy artifactot nem kell és nem szabad módosítani. C007 nem indult el.
