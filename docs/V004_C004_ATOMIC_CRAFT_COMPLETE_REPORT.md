# V004-C004 Atomic Craft Complete Core Report

## Eredmény

`PASS_ATOMIC_CRAFT_COMPLETE_CORE`

A C004 a lezárt `4a65c6ad02f052198cef4ef69d66f2046be47030` C003 checkpointból készült a `develop/V004` ágon. A runtime identity `V004-dev`, a database `spg-crafting-list-v004` version 1, az application schema 7 és a backup schema 3 maradt. A V001, V002 és V003 release-ek, az annotált V003 tag és a stabil V003 artifact nem változott.

## Elkészült magfunkció

- A Crafting Card új `Legyártva` vezérlője egész késztermék-darabszámot fogad, alapértéke 1. A `MAX` csak a mezőt tölti ki, tartós írást nem végez.
- A megerősítő ablak mutatja az itemet, a teljesített és megmaradó darabszámot, továbbá minden fogyasztandó material/Q/batch sort SCU és exact belső unit formában. A `Mégse` nulla írással zár.
- A commit kizárólag a C003-ban látható `VALID` reservation snapshotból dolgozik. Ellenőrzi a snapshot hashét, a globális és card revisionöket, a card/blueprint/output/SC-version/slot identityt, valamint minden reserved batch canonical és provenance UUID-ját, Quality értékét és exact mennyiségét.
- Eltérésnél `STALE_RESERVATION`; nincs completion-time reallocation, eligible-batch fallback, Quality-csere vagy arányos újrakeverés. Új explicit `Újraszámítás / Reallocate` kötelező.
- Partial completion a látható reservation-sorrend prefixét fogyasztja, egész output-darabszám alapján. Full completion eltávolítja a Cardot; partial completion exact darabszámmal csökkenti.
- `OUTPUT_COUNT_UNPROVEN` esetén a gomb és a confirmation is blokkolt.

## Atomi tranzakció és idempotencia

Egyetlen IndexedDB `readwrite` tranzakció érinti a `materialBatches`, `userInventory`, `craftingCards`, `craftHistory` és `userMeta` store-okat. A tranzakció az aktuális durable adatokat újraolvassa és újraellenőrzi, majd ugyanabban a commitban írja a batch-deltákat, derived inventory aggregátumot, Card-állapotot, append-only History eventet és revisionöket. Siker csak `transaction.oncomplete` után jelezhető.

A `craftTransactionId` a History event kulcsa. Az első írás `add()`; ugyanazon azonosító visszajátszása `ALREADY_COMPLETED`, második levonás vagy Card-módosítás nélkül. A célteszt négy mesterséges hibaponton bizonyít teljes rollbacket.

## Exact unit conservation

- `1 SCU = 10 000 unit`.
- Completion közben nincs SCU-visszakonverzió, `Math.round`, `Math.ceil` vagy `Math.floor`.
- Minden delta invariánsa: `beforeUnits = consumedUnits + afterUnits`, tolerancia `0 unit`.
- A célteszt a `160001 - 160000 = 1` maradékot böngészőben, reload után is megőrizte.

## Craft History és revisionök

Az append-only `V004_CRAFT_HISTORY_EVENT_1` event tartalmazza a tranzakcióazonosítót, a blueprint/output identityt, a teljesített és megmaradó darabszámot, a teljes reservation snapshotot és hashét, az exact batch-deltákat, a completion előtti Card snapshotot, a sorrendet/prioritást, valamint az előtte/utána revisionöket. Státusza `COMPLETED`, `undoTimestamp` kezdetben `null`.

Sikeres partial és full completion után az `inventoryRevision`, `allocationRevision`, `craftListRevision` és `historySequence` pontosan eggyel nő. A részleges Card `cardRevision` értéke pontosan eggyel nő; teljes eltávolításkor a későbbi, átsorszámozott Cardok saját revisionje is követi a szemantikai változást. Automatikus újrafoglalás nincs; completion után a reservation stale vagy Card hiányában absent.

## Ellenőrzés

- `tools/validate-baseline.ps1`: PASS.
- `tools/run-v004-c004-tests.mjs`: PASS_TARGETED_MODEL.
- `tools/run-v004-c004-browser-tests.mjs`: PASS_TARGETED_CHROME Google Chrome-ban.
- Browser: confirmation/cancel/MAX, partial, multi-batch prefix, idempotent replay, stale + fallback tiltás, négy atomi rollback, full completion, 1 unit maradék, reload, output blocker és direct `file://`: PASS.
- Application-origin és direct-file console/page error: 0.
- Single-file gate: embedded CSS/JS, local runtime sidecar 0, application runtime file count 1.
- Full regression: `NOT_RUN_BY_SCOPE`.

Application SHA-256: `33f6d4264543184e92782af34dbc8454e02ce56f196cad5f29abb29863c5da99`.

A gépi bizonyíték a `test-artifacts/V004-C004/` mappában található. A célzott teszt a már jóváhagyott `tests/fixtures/v004-c003-reservation.json` output-szemantikai evidence-ét használja; nem talál ki Star Citizen adatot.

## Tudatosan nincs a C004-ban

- Craft History tab vagy lista UI.
- Undo vagy Redo.
- BroadcastChannel vagy multi-window invalidation UI.
- History delete/archive.
- C005 implementáció.

## Visszaállás

A C004 helyi checkpoint a `V004-C004-ATOMIC-CRAFT-COMPLETE-CORE` commit. Normál Git reverttel visszavonható; history rewrite, rebase, force push vagy remote push nem történt. A V003 baseline, tag és release artifact visszaállítást nem igényel.

## Lezárt állapot

`V004-C004 – ATOMIC CRAFT COMPLETE CORE PASS, C005 NOT STARTED`

C005 csak új, explicit feladatban kezdhető.
