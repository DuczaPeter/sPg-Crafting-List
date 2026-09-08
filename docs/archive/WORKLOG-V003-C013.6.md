# WORKLOG.md

Korábbi aktuális napló archiválva: `docs/archive/WORKLOG-V003-C013.5.md`.

## Aktuális ciklus

### V003-C013.6 Fresh RC after Canonical Picker Dedup Repair – 2026-09-08

- Exact source lock: `e4bc51672c072a8c8ecb4c5cc0db8ed622cde057`; a candidate Git-commit raw-byte másolat, application code nem módosult.
- Candidate: `test-artifacts/V003-C013.6/fresh-release-candidate/sPg Crafting List V003 RC.html`; `832924` byte; SHA-256 `4489a48ff50e6652b89684dce522e35203557e33753d73b1c98aa5588193a7ed`.
- Első teljes futásban egy stale C003 harness assertion hibázott a C013.5 catalog refaktor után; csak az exact alkalmazásprojekcióhoz igazított validator módosult.
- A javított teljes C001–C012.5 + D1 + C013.1/C013.3/C013.5 + M1–M6.1 + C04 lánc PASS.
- Aktív 4.10 audit: 128 név, 126 látható picker-opció, 24 bizonyított exact identity, 2 unresolved duplicate; fuzzy/name-only merge nincs.
- Valódi Chrome localhost: 15/15 baseline, 8/8 modul, 1920/1366/390 overflow 0, konzol 0/0, Wiki/UEX/IndexedDB/reload PASS.
- Feynmaline és Titanium egyetlen canonical picker-opció, autofill/save/reload és Combined projection PASS.
- Candidate hash a Chrome-kapu után változatlan; C013.4 invalidált artifact és V001/V002 változatlan.
- Exact manual candidate `file://` gate nem futott; V003 tag/release/push/main merge nincs.
- Visszaállás: a C013.6 checkpoint commit revertje; stabil fallback a változatlan V002.
