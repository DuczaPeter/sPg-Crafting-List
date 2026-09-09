# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V004`; C003 baseline `4a65c6a...`; `origin/main 0a83e44...` változatlan.
- Runtime `V004-dev`; schema `7`; IndexedDB `spg-crafting-list-v004` v1; backup schema `3`.
- Crafting Card: egész output-darabszám, default `1`, fill-only `MAX`, explicit confirmation; cancel `0` write.
- Complete csak a látható `VALID` C003 reservation exact batch-prefixét fogyasztja. Snapshot/revision/Card/slot/batch/canonical/source/Q/unit eltérés: `STALE_RESERVATION`, explicit Reallocate. Fallback és completion-time reallocation nincs.
- Egy readwrite tranzakció: `materialBatches`, `userInventory`, `craftingCards`, `craftHistory`, `userMeta`; siker csak `transaction.oncomplete`. Négy injected failure teljes rollback.
- `craftTransactionId` + History `add()` idempotencia; replay `ALREADY_COMPLETED`, második levonás nincs. `V004_CRAFT_HISTORY_EVENT_1` exact delta/pre-card/revision evidence-szel.
- Partial csökkenti, full eltávolítja a Cardot. Inventory/allocation/craftList/history revision completionönként +1; auto-Reallocate nincs.
- Exact conservation: `before = consumed + after`, tolerancia 0; `160001 - 160000 = 1` reload után is PASS; rounding call `0`.
- `OUTPUT_COUNT_UNPROVEN` blokkol. Célzott model/static + Google Chrome partial/full/stale/replay/rollback/reload/direct `file://`: PASS; console/page error `0`.
- Single-file: sidecar `0`, runtime file `1`; SHA-256 `33f6d4264543184e92782af34dbc8454e02ce56f196cad5f29abb29863c5da99`.
- V001/V002/V003/tag/artifact változatlan. History UI/Undo/Redo/Broadcast: NOT IMPLEMENTED. Full regression: NOT RUN BY SCOPE. Push: NO.
- Riport: `docs/V004_C004_ATOMIC_CRAFT_COMPLETE_REPORT.md`.

`V004-C004 – ATOMIC CRAFT COMPLETE CORE PASS, C005 NOT STARTED`
