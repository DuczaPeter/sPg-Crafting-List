# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`; C013.3 baseline: `5bcfd32b29539010108b4ccfcde2e29e04eddf2c`; stabil fallback: változatlan `V002`.
- Aktuális ciklus: `V003-C013.3`; diszjunkt Quality pool és exact canonical material grouping repair: **PASS**.
- Minimum/MAX pool: Minimum `[minimumQ, maximumQ)`, MAX `[maximumQ, +∞)`; nincs borrowing/fallback. MAX threshold nélkül a Minimum felső korlát nélküli. `minimumQ >= maximumQ` esetén fail-safe `POOL_RANGE_INVALID`.
- Titanium exact mapping: ingredient `07570c9f-fdf6-4bca-a56b-c42809ec0e01` → canonical commodity `64978449-1d87-4a16-ba55-4b5f94fee217`; My Materials egy kártya, két batch, `4,868 SCU`, source provenance megőrizve.
- C013.3 célzott suite, M2/M4, C012.5A–C3B2, D1 és C013.1 közvetlen regresszió: **PASS**. Teljes release-regresszió: **NOT RUN BY SCOPE**.
- Combined/My Materials/Final Card/Crafting List/Maximum Craftable/standalone/reload/backup/no-double-reserve parity: **PASS**.
- Fő HTML SHA-256 teszt előtt/után: `38e5533da6b4699b98c3cf7c7f481f5755167fbab515336dd71e6d691bf9149b`.
- C013.2 RC változatlan SHA-256 mellett **BLOCKED / INVALIDATED**; új RC szükséges külön ciklusban.
- V001/V002 integritás **PASS**; V003 tag/release/push/main merge nincs.
- Riport: `docs/V003_C0133_DISJOINT_POOLS_CANONICAL_GROUPING_REPORT.md`.

`V003-C013.3 – DISJOINT QUALITY POOLS + CANONICAL MATERIAL GROUPING REPAIR PASS, FRESH RC REQUIRED`
