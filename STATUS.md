# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`
- Stabil fallback: `V002` – változatlan single-file release.
- Aktuális ciklus: `V003-C012.5C3A`
- Státusz: `PASS`
- Következő: `V003-C012.5C3B` – **NOT STARTED**.
- C012.5D / C013: **NOT STARTED**.
- V003 tag/release/push/main merge: nincs.

## C012.5C3A eredmény

- Effective precedence: recipe baseline → legacy C012.3 fallback → explicit slot pool constraint; baseline nem gyengíthető.
- `ANY_Q`: nincs extra threshold; Minimum/MAX: material threshold alsó `Qxxx+` korlát; unresolved threshold fail-safe.
- Pool-módok lowest-eligible-first; legacy `HIGHEST_Q`, FIXED és UNKNOWN szemantika megmaradt.
- Exact canonical UUID, per-card prioritás, közös fizikai inventory és no-double-count PASS.
- FR-86 Q550 1,2 + Q750 1,9 SCU: SATISFIED, Max DB 1. Csak Q550 3,1 SCU: Field Array `INSUFFICIENT_QUALITY`, missing amount 0, missing Quality 1,9 SCU, Max DB 0.

## Ellenőrzés

- C3A/C2/C1/B/A/C012.3 + static/single-file + V001/V002 integrity: PASS.
- Chrome localhost: assignment/pool reload, live allocation/Card/Max frissítés PASS; console WARN/ERROR `0/0`.
- Izolált `127.0.0.1:4183` Site Data teardown: 0 Card, 0 batch, 0 pool.
- Mutation-free fingerprint: `9be961d3 → 9be961d3`.

## Végső fejlesztési státusz

`V003-C012.5C3A – POOL ALLOCATION + MAX DB PASS, C012.5C3B NOT STARTED`
