# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`; C013.6 source: `e4bc51672c072a8c8ecb4c5cc0db8ed622cde057`; stabil fallback: változatlan `V002`.
- Aktuális ciklus: `V003-C013.6`; friss, exact single-file RC a C013.5 canonical picker dedup javítása után.
- Candidate: `test-artifacts/V003-C013.6/fresh-release-candidate/sPg Crafting List V003 RC.html`, `832924` byte, SHA-256 `4489a48ff50e6652b89684dce522e35203557e33753d73b1c98aa5588193a7ed`.
- Teljes releváns C001–C012.5 + D1 + C013.1 + C013.3 + C013.5 + M1–M6.1 + C04 release-regresszió: **PASS**.
- Aktív 4.10 audit: `128` név / `126` látható opció / `24` exact multi-UUID identity / `2` unresolved; fuzzy/name-only merge nincs.
- Valódi Chrome localhost: Technical Baseline `15/15`, modulok `8/8`, 1920/1366/390 overflow `0`, konzol WARN/ERROR `0/0`, Wiki/UEX/IndexedDB/reload **PASS**.
- Candidate SHA-256 a Chrome-kapu után változatlan; application code C013.6-ban nem módosult.
- C013.4 RC továbbra is **BLOCKED / INVALIDATED** és változatlan; V001/V002 integritás **PASS**.
- Exact C013.6 candidate `file://` kézi kapu: **NOT RUN**.
- V003 tag/release/push/main merge nincs.
- Riport: `docs/V003_C0136_RELEASE_CANDIDATE_REPORT.md`.

`V003-C013.6 – FRESH RC AFTER CANONICAL PICKER DEDUP REPAIR AUTOMATED + CHROME GATES PASS, EXACT MANUAL CANDIDATE file:// GATE NOT RUN`
