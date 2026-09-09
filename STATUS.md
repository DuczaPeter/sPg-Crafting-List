# STATUS.md

## Jelenlegi állapot

- Branch `develop/V004`; C004.2 input `82d4814...`; runtime `V004-dev`; alkalmazás változatlan.
- Production adatút auditálva: API index/detail → nested aspect input → `requiredQuantityUnits` → Card → allocation szorzás → UI → completion output gate.
- Live Wiki `4.10.0-LIVE.12519617`: 1606 blueprint, 4217 ingredient; 3919 resource és 298 item quantity.
- Négy eltérő output kategória detail/nested/linked item reprezentációja auditálva: Cargo, PowerPlant, WeaponGun, WeaponPersonal.
- Output count/yield/cardinality mező nincs az indexben, detailben, nested/tier/linked adatban, OpenAPI-ban vagy a hivatalos API source mappingben.
- Hat resource quantity raw JSON értéke `0.11000000000000001` vagy `3.0999999999999996`; 0-unit toleranciával ezek exact source-to-unit szemantikája sem bizonyított.
- Production exact assignment `0`; új/régi/migrált Card `OUTPUT_COUNT_UNPROVEN`; count=1 következtetés nincs.
- Full és partial live Craft Complete: `LIVE_CRAFT_COMPLETE_GATE_BLOCKED_BY_UNPROVEN_OUTPUT_SEMANTICS`.
- Célzott read-only audit, single-file/current-byte és protected V001/V002/V003 kapu: PASS; Chrome/full regression nem futott scope szerint.
- Application SHA-256 `0a0a57ffe689134bb36f7cffc1443dbafbfbdbd8d5e3647affa9194770ee2764`; C005 NOT STARTED; push NO.
- Riport: `docs/V004_C004_2_PRODUCTION_OUTPUT_SEMANTICS_REPORT.md`.

`V004-C004.2 – PRODUCTION OUTPUT SEMANTICS UNPROVEN, LIVE CRAFT COMPLETE REMAINS BLOCKED`

`PRODUCTION_OUTPUT_SEMANTICS_UNPROVEN | OUTPUT_COUNT_UNPROVEN`
