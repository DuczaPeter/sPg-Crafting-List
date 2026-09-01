# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`
- Stabil fallback: `V002` – változatlan single-file release.
- Aktuális ciklus: `V003-C012.5D1`
- Státusz: `PASS` – automated integration gate.
- Következő: `V003-C012.5D2` – **NOT STARTED**.
- C013: **NOT STARTED**; a korábbi candidate invalidált marad.
- V003 tag/release/push/main merge: nincs.

## D1 integráció

- Application code változás: **NO**.
- FR-86 happy: Shell Q550 `1,2 SCU`, Field Array Q750 `1,9 SCU`, Card SATISFIED, Max DB 1; Combined Minimum/MAX required-reserved `1,2/1,2` és `1,9/1,9`.
- Q550-only: Shell SATISFIED, Field Array `INSUFFICIENT_QUALITY`, amount-hiány 0, Quality-hiány `1,9 SCU`, Card UNSATISFIED, Max DB 0; Combined/standalone egyezik.
- Legacy C012.3, ANY_Q recipe-minimum, unresolved fail-safe, kétkártyás prioritás/no-double-count, exact UUID, recipe delete/inventory-only, backup/restore és régi backup PASS.
- Standalone: main computes → snapshot stores → standalone renders; recomputation/editor/User Data write nincs; single-file PASS.

## Ellenőrzés

- C012.5 A/B/C1/C2/C3A/C3B1/C3B2 + C012.3/C012.4 + M4/M6 + static/single-file + V001/V002 integrity: PASS.
- Két elavult tesztharness-függőség/assertion célzottan javítva; application bug nem volt.
- Chrome/localhost/User Data: D1-ben nem indult, a D2 kapu feladata.
- Evidence: `test-artifacts/V003-C012.5D1/integration-evidence.json`.
- Riport: `docs/V003_C0125D1_INTEGRATION_AUTOMATED_GATE_REPORT.md`.

`V003-C012.5D1 – INTEGRATED AUTOMATED GATE PASS, C012.5D2 NOT STARTED`
