# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V004`; C001 input: `0b44909256bb776d91717d6578a1088399cfb149`; `origin/main` változatlan: `0a83e4409e2c38442ca8f908dcf101d013061955`.
- Runtime: `V004-dev`; application schema `7`; külön IndexedDB: `spg-crafting-list-v004` version `1`.
- Új foundation store-ok: `craftHistory` és `userMeta`; revision kezdőértékek determinisztikusan `0`.
- V003 direct source: safe discovery után version-4/topology validáció és kizárólag `readonly`; automatikus startup migráció nincs.
- Migráció: kötelező V003 schema-2 backup + explicit confirm, SHA-256 fingerprint, pristine-target és durable replay/changed-source védelem, egyetlen atomi V004 tranzakció.
- Backup schema `3`; V003 schema 1/2 → üres History + V004 meta; exact integer `quantityUnits` copy, veszteség `0 unit`.
- Output-count: `OUTPUT_COUNT_UNPROVEN – COMPLETION MUST BLOCK AFFECTED RECIPES`.
- Célzott model/static és valódi Chrome startup/refresh/migration/rollback/direct `file://`: PASS; application-origin error `0`.
- `LOCAL_RUNTIME_SIDECARS = 0`; `APPLICATION_RUNTIME_FILE_COUNT = 1`.
- V001/V002/V003/tag/artifact/evidence változatlan; Craft Complete/partial/MAX/History UI/Undo/BroadcastChannel: NOT IMPLEMENTED; full regression: NOT RUN BY SCOPE; push: NO.
- Riport: `docs/V004_C002_DATABASE_SCHEMA_MIGRATION_REPORT.md`.

`V004-C002 – DATABASE/SCHEMA + SAFE V003 MIGRATION FOUNDATION PASS, C003 READY`
