# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`; C013.4 source HEAD: `2c138cf8cdaccb5a746bc0de7b6537259cc8985d`; stabil fallback: változatlan `V002`.
- Aktuális ciklus: `V003-C013.4`; friss exact single-file release candidate automated + valódi Chrome localhost kapuja: **PASS**.
- Candidate: `test-artifacts/V003-C013.4/fresh-release-candidate/sPg Crafting List V003 RC.html`; `815774` byte; SHA-256 `38e5533da6b4699b98c3cf7c7f481f5755167fbab515336dd71e6d691bf9149b`.
- Single-file: embedded CSS/JavaScript, helyi runtime sidecar `0`; candidate a source commit nyers byte-másolata, az alkalmazáskód nem változott.
- Teljes releváns C001–C012.5, D1, C013.1, C013.3, M1–M6.1, C04, static/single-file és backup/standalone regresszió: **PASS**.
- C013.1 vegyes hiány és C013.3 Titanium diszjunkt pool/canonical grouping fixture: **PASS**; borrowing, fuzzy/name-only merge és double reserve nincs.
- Valódi Chrome localhost: Technical Baseline `15/15`, modulok `8/8`, 1920×1080 / 1366×768 / 390×844 overflow `0`, konzol WARN/ERROR `0/0`, Wiki/UEX/IndexedDB/reload **PASS**.
- Aktív SC-verzió: `4.10.0-LIVE.12519617`; RC hash a Chrome-kapu előtt/után azonos.
- C013.2 candidate változatlanul **BLOCKED / INVALIDATED**. Exact C013.4 candidate `file://` manual gate: **NOT RUN**.
- V001/V002 integritás **PASS**; V003 tag/release/push/main merge nincs.
- Riport: `docs/V003_C0134_RELEASE_CANDIDATE_REPORT.md`.

`V003-C013.4 – FRESH RC AFTER DISJOINT POOL + CANONICAL GROUPING REPAIR AUTOMATED + CHROME GATES PASS, EXACT MANUAL CANDIDATE file:// GATE NOT RUN`
