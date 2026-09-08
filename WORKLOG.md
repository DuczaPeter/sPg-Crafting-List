# WORKLOG.md

Korábbi aktuális napló archiválva: `docs/archive/WORKLOG-V003-C013.7.md`.

## Aktuális ciklus

### V003-C013.8 Fresh RC after User-Data-Independent Canonical Picker Repair – 2026-09-08

- Exact source baseline: `490ed6fc3e94f2361c7448650a08752fa5f3c8c7`; application code nem változott.
- Determinisztikus single-file candidate: `835832` byte, SHA-256 `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469`, runtime sidecar `0`.
- Teljes releváns C001–C012.5/D1/C013.1/.3/.5/.7/M1–M6.1/C04/static/single-file/standalone/backup/V001/V002 kapu PASS.
- Live 4.10 audit: 128 név, 126 látható opció, 43 exact canonical multi-UUID, 2 unresolved, 0 látható duplikált picker és 0 guessed canonical UUID.
- Valódi Chrome localhost: 15/15 Technical Baseline, 8/8 modul, 1920/1366/390 overflow 0, Wiki/UEX/IndexedDB/reload és legacy Titanium canonical picker PASS, console 0/0.
- Candidate hash a teszt előtt/után azonos; V001/V002 és az invalidált C013.6 candidate változatlan.
- Exact candidate manual `file://` kapu NOT RUN; stable V003 tag/release/push/main merge nincs.
- Visszaállás: a C013.8 checkpoint commit revertje; stabil fallback a változatlan V002.
