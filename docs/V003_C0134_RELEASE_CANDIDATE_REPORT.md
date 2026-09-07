# V003-C013.4 Fresh Release Candidate Report

## Eredmény

`V003-C013.4 – FRESH RC AFTER DISJOINT POOL + CANONICAL GROUPING REPAIR AUTOMATED + CHROME GATES PASS, EXACT MANUAL CANDIDATE file:// GATE NOT RUN`

A C013.2 release candidate változatlanul `BLOCKED / INVALIDATED`; nem lett újrahasználva vagy patch-elve. Az új candidate kizárólag a `develop/V003` branch `2c138cf8cdaccb5a746bc0de7b6537259cc8985d` C013.3 checkpointjából készült.

## Exact candidate

- path: `test-artifacts/V003-C013.4/fresh-release-candidate/sPg Crafting List V003 RC.html`;
- source HEAD: `2c138cf8cdaccb5a746bc0de7b6537259cc8985d`;
- build: Git commit raw-byte copy;
- méret: `815774` byte;
- SHA-256: `38e5533da6b4699b98c3cf7c7f481f5755167fbab515336dd71e6d691bf9149b`;
- embedded CSS: PASS; embedded JavaScript: PASS; helyi runtime sidecar: `0`;
- application code change: `NO`.

Az RC SHA-256 a build, az automated suite és a Chrome-kapu után azonos maradt.

## Automatizált release-regresszió

PASS:

- static HTML/JavaScript és single-file/C04;
- teljes releváns C001–C012.5 lánc, D1, M1–M6.1;
- C013.1 `FR86_MIXED_AMOUNT_AND_QUALITY_SHORTAGE` és cross-view/standalone parity;
- C013.3 diszjunkt Minimum/MAX pool és exact canonical material grouping;
- reload persistence, backup/restore, Final Card, Crafting List, Combined Materials, My Materials, Maximum Craftable és standalone parity;
- exact UUID mapping; fuzzy/name-only merge tiltása; borrowing és double reserve hiánya;
- V001/V002 integritás, C013.2 candidate immutability és V003 tag/release hiánya.

Titanium evidence:

- source UUID `07570c9f-fdf6-4bca-a56b-c42809ec0e01` → canonical UUID `64978449-1d87-4a16-ba55-4b5f94fee217`;
- Q784 `1,744 SCU`, Q866 `3,124 SCU`, összesen `4,868 SCU`;
- Minimum Q500–Q799: kizárólag Q784; MAX Q800+: kizárólag Q866;
- csak Q866: Minimum `0`, MAX `3,124 SCU`;
- Minimum-only: `4,868 SCU`; MAX-only: `3,124 SCU`;
- logical material `1`, batch `2`, double reserve `0`, provenance megmarad;
- `minimumQ >= maximumQ`: `POOL_RANGE_INVALID`, allocation blokk.

## Valódi Chrome localhost kapu

Ugyanaz az exact hash-zárolt RC futott `http://127.0.0.1:41991/` originen, Codex computer-use Chrome extension vezérléssel.

- Technical Baseline: `15/15 PASS`;
- modulok: `8/8 PASS` – Blueprint Browser, Crafting List, My Materials, Combined Materials, Material Database, Mining Loadouts, UEX Refinery, Data / Settings;
- viewport: `1920×1080`, `1366×768`, `390×844`; horizontal overflow mindegyiken `0`;
- browser console WARN/ERROR: `0/0`;
- aktív SC-verzió: `4.10.0-LIVE.12519617`;
- Wiki: PASS; UEX: PASS (`215` yield rekord); IndexedDB: PASS (`schema 4`);
- reload: dataset és a PASS technikai próba megmaradt;
- külső stylesheet/script a fő single-file RC-ben: `0/0`.

## Nyitott kapu

Az exact C013.4 candidate közvetlen `file://` kézi kapuja ebben a ciklusban **NOT RUN**. Ez nem automated PASS, és stabil V003 release/tag nem készült.

Evidence: `test-artifacts/V003-C013.4/fresh-release-candidate/`.
