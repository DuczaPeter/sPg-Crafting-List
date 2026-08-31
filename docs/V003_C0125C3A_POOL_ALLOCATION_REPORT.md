# V003-C012.5C3A Pool Allocation + Max DB

## Eredmény

`PASS` – a Recipe Slot Quality pool-hozzárendelés az Allocation Engine és a Max DB közös effective Quality policy-ján keresztül érvényesül. C012.5C3B nincs elindítva.

## Effective precedence

1. A recipe baseline Quality-szemantika az alsó korlát.
2. Hiányzó assignment esetén a C012.3 legacy material plan változatlanul érvényesül (`LEGACY_FALLBACK`).
3. Explicit assignment csak további slot-szintű inventory-korlátot adhat; recipe minimumot nem gyengíthet.

`ANY_Q` nem ad új user thresholdot, de a recipe baseline megmarad. `MINIMUM_Q_POOL` a material `minimumQ`, `MAXIMUM_Q_POOL` a material `maximumQ` értékét használja alsó `Qxxx+` korlátként. A végső minimum `max(recipe baseline, pool threshold)`. Pool-korlátnál a legalacsonyabb megfelelő batch fogy először; ez nem `HIGHEST_Q`. A legacy `HIGHEST_Q` sorrend változatlan.

Hiányzó Minimum/MAX threshold nem kap kitalált 0/1000 értéket: `POOL_THRESHOLD_UNRESOLVED` fail-safe eredményt ad. `FIXED` recipe szemantika megmarad, explicit pool inventory-korlát alkalmazható. `UNKNOWN` továbbra is fail-safe.

## FR-86 fixture

- Shell / Stileron 1,2 SCU → `MINIMUM_Q_POOL`, Q500.
- Field Array / Stileron 1,9 SCU → `MAXIMUM_Q_POOL`, Q700.
- Q550 1,2 SCU + Q750 1,9 SCU: Shell Q550-et, Field Array Q750-et foglal; Card `SATISFIED`, no-double-count `PASS`, Max DB 1.
- Csak Q550 3,1 SCU: Shell `SATISFIED`; Field Array `INSUFFICIENT_QUALITY`, `missingAmount=0`, `missingQuality=1,9 SCU`; Card `UNSATISFIED`, Max DB 0.

Az exact commodity/ingredient UUID bridge közös fizikai inventoryt ad. Card-prioritás, per-card assignment és ugyanazon batch egyszeri foglalása célteszttel PASS.

## Chrome localhost

Valódi Chrome, izolált `http://127.0.0.1:4183/` origin:

- Q550/Q750 happy path, assignment és pool reload persistence: PASS.
- Dropdown `MAXIMUM_Q_POOL → ANY_Q → MAXIMUM_Q_POOL`: allocation, reserved/missing, Card státusz és Max DB reload nélkül frissült (`1 → 0`): PASS.
- Csak Q550 3,1 SCU Quality-hiány: PASS.
- Console WARN/ERROR: `0/0`.
- A felhasználó jóváhagyásával az izolált Site Data teljesen törölve; utána 0 Card, 0 batch, 0 pool.
- Mutation-free reload fingerprint: `9be961d3 → 9be961d3`.

## Ellenőrzés

- C3A targeted + C2/C1/B/A/C012.3 + static/single-file: PASS.
- V001/V002 integrity: PASS.
- Chrome closure: PASS.
- C012.5C3B, C012.5D és C013: NOT STARTED.

Visszaállás: a C3A checkpoint commit revertje; stabil fallback a változatlan V002.
