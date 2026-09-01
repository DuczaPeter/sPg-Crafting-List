# WORKLOG.md

Korábbi nyers napló byte-azonosan archiválva: `docs/archive/WORKLOG-through-V003-C012.5D2A.md`.

## Aktuális ciklus

### V003-C012.5D2B Exact manual file gate – 2026-09-01

- A felhasználó a fő V003 HTML-t közvetlen `file://` módban ellenőrizte: 15/15 pont PASS, aktív SC `4.10.0-LIVE.12519617`.
- FR-86 Card, Shell Minimum Q500, Field Array MAX Q900, Frequency Controller recipe baseline, bound Browser/Crafting parity, reload persistence és Combined metrikák PASS.
- Nem blokkoló UX note: reload után a Browser JS-300 default; az új transient FR-86 preview recept szerinti állapota nem érinti a megmaradó bound Cardot/poolokat.
- Application code nem változott; automated regression, Chrome automation és localhost ebben a lezárásban nem futott.
- C013 nem indult; V003 tag/release/push/main merge nincs. Visszaállás: a D2B checkpoint revertje; stabil fallback a változatlan V002.
