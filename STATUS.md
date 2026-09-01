# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`
- Stabil fallback: `V002` – változatlan single-file release.
- Aktuális ciklus: `V003-C012.5D2A`
- Státusz: `PASS` – integrated Chrome localhost gate.
- Következő: `V003-C012.5D2B` – **NOT STARTED**.
- C013: **NOT STARTED**; a korábbi candidate invalidált marad.
- V003 tag/release/push/main merge: nincs.

## D2A Chrome localhost integráció

- Application code változás: **NO**; baseline `b3d2f1a4b7ff1e05c619142b37b68b1a4cc5ae81`.
- FR-86 happy, Q550-only Quality-shortage, exact Card-kötés, per-card assignment, Combined/Max paritás, reload és inventory-only/zero-card útvonal: PASS.
- Standalone read-only snapshot, 1920/1366/390 px overflow és Chrome console `0/0`: PASS.
- Exact kézi `file://`: **NOT RUN**.
- Teardown: mind az öt User Data store 0; fingerprint `9be961d3 → 9be961d3`; D2A marker 0.
- Game Data megmaradt: SC `4.10.0-LIVE.12519617`, UEX cache 215 rekord.
- D1 automated integration és backup/restore bizonyíték változatlanul PASS.

Evidence: `test-artifacts/V003-C012.5D2A/chrome-integration-evidence.json`
Riport: `docs/V003_C0125D2A_INTEGRATED_CHROME_GATE_REPORT.md`

`V003-C012.5D2A – INTEGRATED CHROME LOCALHOST GATE PASS, MANUAL file:// NOT RUN`
