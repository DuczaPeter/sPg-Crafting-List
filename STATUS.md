# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`; C013.8 source baseline: `490ed6fc3e94f2361c7448650a08752fa5f3c8c7`; stabil fallback: változatlan `V002`.
- Aktuális ciklus: `V003-C013.8`; fresh exact single-file RC a C013.7 canonical picker repair után: **AUTOMATED + CHROME PASS**.
- Candidate: `test-artifacts/V003-C013.8/fresh-release-candidate/sPg Crafting List V003 RC.html`; `835832` byte; SHA-256 `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469`; runtime sidecar `0`.
- Teljes releváns C001–C012.5, D1, C013.1/.3/.5/.7, M1–M6.1, C04, static/single-file/standalone/backup és V001/V002 regresszió: **PASS**.
- Aktív 4.10 audit: `128` név / `126` látható opció / `43` exact canonical multi-UUID / `2` unresolved; látható duplikált picker `0`, bizonyíték nélküli canonical UUID `0`.
- C013.7 invariancia Feynmaline/Titanium/Tungsten/Gold: **PASS**; legacy Titanium Q784 mellett canonical picker `64978449-...`, reload után is **PASS**.
- Valódi Chrome localhost: Technical Baseline `15/15`, 8 modul, 1920/1366/390 overflow `0`, Wiki/UEX/IndexedDB/reload **PASS**, konzol WARN/ERROR `0/0`.
- Application code nem változott; candidate SHA a Chrome-kapu után változatlan.
- Exact candidate manuális `file://` kapu: **NOT RUN**; stabil V003 tag/release/push/main merge nincs.
- C013.6 RC: **BLOCKED / INVALIDATED**, SHA változatlan `4489a48ff50e6652b89684dce522e35203557e33753d73b1c98aa5588193a7ed`.
- Riport: `docs/V003_C0138_RELEASE_CANDIDATE_REPORT.md`.

`V003-C013.8 – FRESH RC AFTER USER-DATA-INDEPENDENT CANONICAL PICKER REPAIR AUTOMATED + CHROME GATES PASS, EXACT MANUAL CANDIDATE file:// GATE NOT RUN`
