# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`
- Stabil fallback: `V002` – változatlan single-file release.
- Aktuális ciklus: `V003-C012.5C3B1`
- Státusz: `PASS`
- Következő: `V003-C012.5C3B2` – **NOT STARTED**.
- C012.5D / C013: **NOT STARTED**.
- V003 tag/release/push/main merge: nincs.

## C012.5C3B1 eredmény

- A Combined Materials Minimum/MAX blokkok a C3A tényleges allocation usage eredményét aggregálják; nincs második allocation-logika.
- Csak explicit `MINIMUM_Q_POOL` / `MAXIMUM_Q_POOL` usage kerül a saját poolba; `ANY_Q` és `LEGACY_FALLBACK` csak a globális totalban marad.
- Required/reserved/mennyiséghiány/Quality-hiány, unresolved fail-safe, exact canonical UUID, multiple Card/prioritás és no-double-count PASS.
- Card törlés után az inventory-only Stileron card, `Q500/Q700` threshold és eligible preview megmarad; minden pool demand/reservation/missing érték 0.

## Ellenőrzés

- C3B1 target + C3A/C2/C1/B/A + static/single-file + V001/V002 integrity: PASS.
- Chrome `127.0.0.1:4184`: FR-86 happy/Quality-shortage/delete/reload PASS; desktop/mobile overflow 0; console WARN/ERROR `0/0`.
- Mutation-free fingerprint: `ab900bdc → ab900bdc`.
- Riport: `docs/V003_C0125C3B1_COMBINED_POOL_METRICS_REPORT.md`.

## Végső fejlesztési státusz

`V003-C012.5C3B1 – COMBINED REAL POOL METRICS PASS, C012.5C3B2 NOT STARTED`
