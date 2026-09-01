# WORKLOG.md

Korábbi aktuális napló archiválva: `docs/archive/WORKLOG-through-V003-C013.1.md`.

## Aktuális ciklus

### V003-C013.2 Fresh Release Candidate – 2026-09-01

- Az exact `9a07de34643fed477399b070462aeb2be3d4f11a` C013.1 checkpointból új candidate készült Git-commit raw-byte copy módszerrel; a fő HTML és az alkalmazáskód nem változott.
- Candidate: `806499` byte, SHA-256 `cdbac1a7977845061494aa148e6603db2597270bcbcf49c587009bd6b3a0ca31`; automatizált és Chrome ellenőrzés után byte-azonos, runtime sidecar `0`.
- Teljes releváns C001-C012.5C3B2 + D1 + M1-M6.1 + C04 + C013.1 regresszió PASS.
- A kötelező FR-86 vegyes amount/Quality shortage, recipe-row fordítás, Card priority, no-double-reserve és Final/Crafting/Combined/Maximum/standalone parity PASS.
- Valódi Chrome localhost Technical Baseline `15/15`, nyolc modul, 1920/1366/390 overflow `0`, konzol WARN/ERROR `0/0`, aktív SC 4.10, Wiki/UEX/IndexedDB/reload PASS.
- A korábbi C013 candidate változatlan és továbbra is BLOCKED; V001/V002 integritás PASS.
- Exact manual candidate `file://` gate NOT RUN; stabil V003 tag/release/push/main merge nincs.
- Visszaállás: a C013.2 checkpoint commit revertje; stabil fallback a változatlan V002.
