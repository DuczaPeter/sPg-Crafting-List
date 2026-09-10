# STATUS.md

## Jelenlegi állapot

- Branch `develop/V004`; C004.4 input `0b35f8e...`; runtime `V004-dev`.
- SCU boundary: API/source `Number` → `String(Number)` → determinisztikus decimális parser → 4 tizedes HALF-UP → egész unit. `1 SCU = 10 000 unit`; utána minden inventory/allocation/reservation/complete/history/undo mennyiség egész, tolerancia 0 unit.
- ITEM requirement csak véges, pozitív safe integer. A `0.00004 SCU` eredménye `0.0000 / 0 unit`, `ROUNDS_TO_ZERO`, tiltott completion és nulla írás.
- Production audit `4.10.0-LIVE.12519617`: 1606 blueprint, 4217 ingredient; SCU 3919/3919, ITEM 298/298 normalizálva, blocker 0. LumaCore `0.14 → 0.1400 → 1400`, Steadfast detail `0.07 → 0.0700 → 700`, index aggregate `0.11000000000000001 → 0.1100 → 1100`; completion-ready.
- Omnisky III Cannon Chrome: 21 → partial 5 → 16 → stale block → Reallocate → full 16; batch maradék 1/1/1 unit, anyagveszteség 0. My Materials és reload exact értékeket mutat.
- `CRAFT_RUN_COUNT` megmaradt; `OUTPUT_COUNT_UNPROVEN` nem gating és output-cardinalitás nincs állítva. Markerless legacy Card explicit megerősítést, majd Reallocate lépést kér.
- C004 atomikus model, C004.4 model, teljes production audit, Google Chrome, automated direct `file://`, single-file és protected V003 kapu PASS.
- Application SHA-256 `b2b18b94196783984b2164084d184852eea79f2e686fa9b5c6e3ccaf01cdc706`; runtime fájl 1, sidecar 0; full regression nem futott; C005 NOT STARTED; push NO.
- Riport: `docs/V004_C004_4_SCU_NORMALIZATION_REPORT.md`.

`V004-C004.4 – 4-DECIMAL SCU NORMALIZATION PASS, C005 READY`
