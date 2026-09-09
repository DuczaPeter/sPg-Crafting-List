# STATUS.md

## Jelenlegi állapot

- Branch `develop/V004`; C004 input `f7125a9...`; runtime `V004-dev`; DB `spg-crafting-list-v004` v1.
- C004.1 implementation deviation javítva: partial Card completionnél membership/order változás nélkül a `craftListRevision` nem nő.
- Chrome partial `21 → 16`: craft list `1 → 1`, Card revision `0 → 1`, inventory `1 → 2`, allocation `2 → 3`, history `0 → 1`; reservation `STALE`, explicit Reallocate kell.
- Full completion: Card removal és craft list `1 → 2`; későbbi Card revision csak tényleges persisted order-változáskor nő.
- Négy injected failure minden store-t és revisiont rollbackelt. Stale, idempotencia, History, prefix és 0-unit-loss semantics változatlanul PASS.
- Live read-only API audit: `4.10.0-LIVE.12519617`, 1606 blueprint, 27/27 output-class detail, output-count candidate field `0`.
- Production Card builder és stored/migrated default: `OUTPUT_COUNT_UNPROVEN`; exact production assignment `0`.
- Live eredmény: `LIVE_COMPLETION_CURRENTLY_BLOCKED_BY_OUTPUT_COUNT_UNPROVEN`. Output count találgatás nincs.
- Célzott model/static + Google Chrome + direct `file://`: PASS; console/page error `0`; full regression: NOT RUN BY SCOPE.
- Single-file sidecar `0`, runtime file `1`; SHA-256 `0a0a57ffe689134bb36f7cffc1443dbafbfbdbd8d5e3647affa9194770ee2764`.
- V001/V002/V003/tag/artifact változatlan. History UI/Undo/Redo/Broadcast/C005: NOT IMPLEMENTED. Push: NO.
- Riport: `docs/V004_C004_1_REVISION_OUTPUT_ELIGIBILITY_AUDIT.md`.

`V004-C004.1 – REVISION SEMANTICS PASS`

`LIVE_COMPLETION_CURRENTLY_BLOCKED_BY_OUTPUT_COUNT_UNPROVEN`
