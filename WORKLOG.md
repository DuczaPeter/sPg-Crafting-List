# WORKLOG.md

Current cycle/session notes only. Previous raw log archived losslessly at `logs/archive/20260908-130300-572448-WORKLOG.md`.

## 2026-09-08 — V003-C014 Stable Version Identity Repair

- Baseline: `develop/V003 @ 045bd8ce38dde5e2ef43999a038c4d835d644b9a`, clean; local `V003` tag ugyanide mutatott, push/main merge nem történt.
- Root cause: a byte-pontos C013.8 candidate promóciója a három embedded `V003-dev` runtime identity értéket is változatlanul vitte a helyi release-be.
- Módosítás: csak a fő HTML `applicationStatus`, `footerRuntime` és `APP.version` értéke lett `V003`; business logic és schema nem változott.
- Célzott statikus validator: PASS; `V003-dev` runtime occurrence `0`, single-file sidecar `0`, V001/V002 és régi V003 artifact/tag változatlan.
- Valódi Chrome localhost: Technical Probe `15/15 PASS`, UI `V003 · schema 6`, footer `V003 · cache schema 4`, IndexedDB startup/reload, backup `applicationVersion=V003`, diagnosztika `application.version=V003`, standalone PASS, konzol `0/0`.
- A teljes történeti release regression scope szerint nem futott; új RC nem készült.
- A régi helyi V003 release/tag státusza: `PRE-PUBLICATION INVALIDATED BY V003 VERSION IDENTITY BLOCKER`; tag nem mozdult és release artifact nem változott.
- Következő lépés: külön fresh-RC ciklus, majd új release-döntés.
- Visszaállás: a C014 checkpoint commit normál revertje; a régi invalidált tag/artifact evidence változatlanul megmarad.
