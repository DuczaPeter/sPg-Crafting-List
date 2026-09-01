# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`; source checkpoint: `9a07de34643fed477399b070462aeb2be3d4f11a`; stabil fallback: változatlan `V002`.
- Aktuális ciklus: `V003-C013.2`; alkalmazáskód-módosítás: **NINCS**.
- Friss candidate: `test-artifacts/V003-C013.2/fresh-release-candidate/sPg Crafting List V003 RC.html`.
- Candidate: `806499` byte; SHA-256 előtte/utána `cdbac1a7977845061494aa148e6603db2597270bcbcf49c587009bd6b3a0ca31`; single-file runtime sidecar `0`.
- Teljes releváns regresszió: **PASS** (C001-C012.4, C012.5A-C3B2, D1, M1-M6.1, C04 és C013.1).
- Kötelező FR-86 vegyes hiány: Field `6 / 9,3 / 17 SCU`, Shell `17 / 3,4 / 0 SCU`; globális reserved `23`, shortage `29,7 SCU`, double reserve `0`: **PASS**.
- Final Card/Crafting List/Combined/Maximum Craftable/standalone parity: **PASS**.
- Valódi Chrome localhost: Technical Baseline `15/15`, 8/8 modul, 1920/1366/390 overflow `0`, konzol WARN/ERROR `0/0`, Wiki/UEX/IndexedDB/reload: **PASS**.
- Exact manual candidate `file://` gate: **NOT RUN**.
- A régi C013 candidate változatlan és BLOCKED; V001/V002 integritás **PASS**.
- V003 tag/release/push/main merge nincs. Riport: `docs/V003_C0132_RELEASE_CANDIDATE_REPORT.md`.

`V003-C013.2 – FRESH RC AFTER QUALITY REPAIR AUTOMATED + CHROME GATES PASS, EXACT MANUAL CANDIDATE file:// GATE NOT RUN`
