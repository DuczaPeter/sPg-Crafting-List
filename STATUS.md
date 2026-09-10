# STATUS.md

## Jelenlegi állapot

- Branch `develop/V004`; C006 input checkpoint `7972659...`; runtime `V004-dev`.
- Craft History Undo kizárólag stored `consumedDeltas` exact integer truthból dolgozik; live API/recipe/renormalizálás és full inventory snapshot rollback nincs.
- Cardonként LIFO: csak a legutóbbi aktív `COMPLETED` event Undozható; későbbi `UNDONE` után a korábbi válhat jogosulttá. Legacy, double Undo, megváltozott Card/list és batch-ID collision fail-closed, 0 write.
- Partial Undo: Card quantity/revision exact restore, inventory/allocation +1, craft list +0. Full Undo: pre-craft snapshotból azonos ID/order/settings/provenance, inventory/allocation/craft list +1.
- Kompatibilis batch exact merge, hiányzó exact recreate; független `+5000` unit inventory-delta megmaradt. Minden reservation stale, automatikus Reallocate nincs.
- Öt-store atomi IndexedDB commit; négy injected failure teljes rollback. Cancel és második Undo durable write 0; event `UNDONE`, `undoneAt`, egyedi Undo ID és revision/restore evidence megmarad.
- Omnisky Chrome: 21 → 5 → 16 → Undo → 21; majd 5+3 LIFO Undo → 21; full Card eltűnés/visszaállítás PASS; loss 0.
- C004.4/C005 targeted regresszió, reload, 1920×1080/390×844 overflow 0, automated direct `file://`, single-file és protected V003 PASS.
- Application SHA-256 `ad0457cdf9655bfb03dfb4b6e9f924d5db71c2e8c55d1d8be215c0beea3b6ce5`; runtime fájl 1, sidecar 0; full regression nem futott; push NO.
- Riport: `docs/V004_C006_CRAFT_UNDO_REPORT.md`.

`V004-C006 – CRAFT HISTORY UNDO PASS`
