# WORKLOG.md

Current cycle/session notes only. Previous raw log archived losslessly at `logs/archive/20260910-172400-000000-WORKLOG.md`.

## 2026-09-10 — V004-C006 Craft History Undo

- Resume: `develop/V004 @ 7972659...`; a credit-limit miatt félbemaradt dirty C006 diff megőrizve és célzottan auditálva; input app SHA `fd37d3a...`.
- Stored `consumedDeltas` truth, Cardonként latest-active LIFO, partial exact Card state és full `craftListRevision` authority elkészült; live recipe/renormalizálás/snapshot rollback nincs.
- Exact batch merge/recreate, same-ID collision blocker és más batchben történt független `+5000` unit megőrzése PASS.
- Öt-store atomi IndexedDB tranzakció; négy injected failure teljes rollback; Cancel és double Undo durable write 0.
- History confirmation exact product/craft/time/material/Q/batch/unit/Card result; `UNDONE`, `undoneAt`, egyedi Undo ID, immutable completion evidence és Redo nélküli UI elkészült.
- Omnisky Chrome 21→16→21; 5+3 LIFO vissza 21-re; full Card/batch restore; reload és 1920×1080/390×844 overflow 0; material loss 0.
- C004.4/C005 targeted regresszió, automated direct-file, single-file, git diff és protected V003 bounded validator PASS; full regression/push/C007 nincs.
- Riport: `docs/V004_C006_CRAFT_UNDO_REPORT.md`; rollback a helyi C006 commit normál revertje.
