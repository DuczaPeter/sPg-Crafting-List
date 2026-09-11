# WORKLOG.md

Current cycle/session notes only. Previous raw log archived losslessly at `logs/archive/20260910-172400-000000-WORKLOG.md`.

## 2026-09-11 — V004-C007.1 Multi-Tab User Data Safety

- Resume: `develop/V004 @ 8b7efea...`, clean input, app SHA `9cf7952...`; `$credit-efficient-project-runner`.
- Mining Loadouts durable commit után `MINING_LOADOUTS_CHANGED`; kis signal payload, fogadó oldali IndexedDB force-reread, add/edit/default/delete kétfüles PASS.
- Backup import exact preview-base fingerprint precondition ugyanazon readwrite tranzakcióban; eltérés `IMPORT_BASE_STATE_CHANGED`, nulla import/snapshot írás és kötelező friss preview.
- Konkurens Complete/Undo/loadout állapot megmaradt; friss preview utáni import és exact durable pre-state snapshot PASS; schema 3, data loss 0.
- C007 checkpoint BFCache-hiba valós Chrome-ban reprodukálva; persisted pageshow reopen+reread után channel READY, listener 1, duplicate 0.
- C006.1/C007 current-byte regresszió, C007.1 model/Chrome/direct-file/single-file/diff/protected V003 bounded kapu PASS; full regression/release gate/push nincs.
- Riport: `docs/V004_C007_1_MULTI_TAB_USER_DATA_SAFETY_REPORT.md`; rollback a helyi C007.1 commit normál revertje.

## 2026-09-10 — V004-C007 Multi-Tab Coherence

- Resume: `develop/V004 @ da8515a...`; a megszakadt dirty C007 diff megőrizve; input app SHA `ecbb85c...`; `$credit-efficient-project-runner`.
- `BroadcastChannel` csak validált, kisméretű UI-signal; durable authority és receiver-refresh kizárólag IndexedDB. Malformed/self/duplicate/out-of-order ignorálás, debounce és egyszeres listener PASS.
- Kétfüles Complete/Undo, material/Card módosítások, History és stale-reservation UI-frissítés PASS; automatikus Reallocate nincs.
- Konkurens Complete egy commit, konkurens Undo egy restore; message-loss és unavailable fallback fail-closed; inventory conservation és Craft/Undo material loss 0 unit.
- Backup import és read-only V003 migráció dedikált force refresh, reload lifecycle, responsive és automated direct `file://` PASS.
- C004.4–C006.1 current-byte regresszió, VM/Chrome/single-file/git diff/protected V003 bounded kapu PASS; full regression/push nincs.
- Riport: `docs/V004_C007_MULTI_TAB_COHERENCE_REPORT.md`; rollback a helyi C007 commit normál revertje.

## 2026-09-10 — V004-C006.1 Undo Backup Round-Trip

- Resume: `develop/V004 @ 4bb3303...`, clean input, app SHA `ad0457c...`; `$credit-efficient-project-runner`, C007 nem indult.
- Hiba: tiszta V004 célba `REPLACE` import indokolatlanul revisiont növelt. Javítás: kizárólag bizonyított pristine célnál exact incoming állapot; non-pristine/MERGE invalidálás változatlan.
- Partial/full Complete→Undo→export→isolated clean DB import→reload: History/delta/restore/Card/inventory/meta exact; unknown event mező megmaradt; data loss 0.
- Import utáni grouping/LIFO PASS; double Undo `ALREADY_UNDONE`, 0 write; legacy schema 3 fail-closed, schema bump nélkül.
- C002 V003 read-only migration és C006 Undo current-byte regresszió, VM/Chrome/direct-file/single-file/protected V003 bounded kapu PASS; full regression/push nincs.
- Riport: `docs/V004_C006_1_UNDO_BACKUP_ROUNDTRIP_REPORT.md`; rollback a helyi C006.1 commit normál revertje.

## 2026-09-10 — V004-C006 Craft History Undo

- Resume: `develop/V004 @ 7972659...`; a credit-limit miatt félbemaradt dirty C006 diff megőrizve és célzottan auditálva; input app SHA `fd37d3a...`.
- Stored `consumedDeltas` truth, Cardonként latest-active LIFO, partial exact Card state és full `craftListRevision` authority elkészült; live recipe/renormalizálás/snapshot rollback nincs.
- Exact batch merge/recreate, same-ID collision blocker és más batchben történt független `+5000` unit megőrzése PASS.
- Öt-store atomi IndexedDB tranzakció; négy injected failure teljes rollback; Cancel és double Undo durable write 0.
- History confirmation exact product/craft/time/material/Q/batch/unit/Card result; `UNDONE`, `undoneAt`, egyedi Undo ID, immutable completion evidence és Redo nélküli UI elkészült.
- Omnisky Chrome 21→16→21; 5+3 LIFO vissza 21-re; full Card/batch restore; reload és 1920×1080/390×844 overflow 0; material loss 0.
- C004.4/C005 targeted regresszió, automated direct-file, single-file, git diff és protected V003 bounded validator PASS; full regression/push/C007 nincs.
- Riport: `docs/V004_C006_CRAFT_UNDO_REPORT.md`; rollback a helyi C006 commit normál revertje.
