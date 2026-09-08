# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`; C015 source baseline: `37f8852b4ddfd5b628d952a445f97ee5a5179a11`.
- Exact fresh RC: `test-artifacts/V003-C015/fresh-release-candidate/sPg Crafting List V003 RC.html`; `835820` byte; SHA-256 `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`.
- Runtime identity: `V003`; `V003-dev` runtime occurrence `0`; application code C015-ben nem változott.
- Teljes releváns C001–C012.5 + D1 + C013.1/.3/.5/.7 + C014 + M1–M6.1 + C04 release-regresszió: **PASS**.
- Valódi Chrome localhost: Technical Probe `15/15`, 8/8 modul, 1920/1366/390 overflow `0`, Wiki/UEX/IndexedDB/reload/backup/standalone és konzol `0/0`: **PASS**.
- Exact candidate manual `file://` gate: `NOT RUN`; stabil helyettesítő V003 release/tag még nem készülhet.
- A régi `045bd8c...` helyi V003 release/tag és `releases/V003/` evidence változatlanul pre-publication invalidált; push/main merge: `NO`.
- V001/V002 integritás: **PASS**; a legutóbbi érvényes stable release továbbra is V002.
- Riport: `docs/V003_C015_FRESH_RELEASE_CANDIDATE_REPORT.md`; rollback: a C015 checkpoint normál revertje.

`V003-C015 – FRESH RC AFTER VERSION IDENTITY REPAIR AUTOMATED + CHROME GATES PASS, EXACT MANUAL CANDIDATE file:// GATE NOT RUN`
