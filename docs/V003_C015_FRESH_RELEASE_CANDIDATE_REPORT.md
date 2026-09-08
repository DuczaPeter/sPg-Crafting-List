# V003-C015 Fresh Release Candidate Report

## Eredmény

`V003-C015 – FRESH RC AFTER VERSION IDENTITY REPAIR AUTOMATED + CHROME GATES PASS, EXACT MANUAL CANDIDATE file:// GATE NOT RUN`

Az exact `develop/V003 @ 37f8852b4ddfd5b628d952a445f97ee5a5179a11` C014 forrásból új, byte-azonos single-file release candidate készült. Application code ebben a ciklusban nem változott. A régi, pre-publication invalidált V003 release commit, helyi tag és `releases/V003/` evidence változatlan maradt.

## Exact candidate

- Fájl: `test-artifacts/V003-C015/fresh-release-candidate/sPg Crafting List V003 RC.html`
- Méret: `835820` byte
- SHA-256 teszt előtt/után: `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`
- Build: exact Git-commit raw-byte copy
- Runtime identity: `V003`; `V003-dev` runtime előfordulás: `0`
- Runtime sidecar: `0`; CSS és JavaScript a HTML-ben

## Automatizált release regression

PASS: C001–C012.5, D1, C013.1, C013.3, C013.5, C013.7, C014, M1–M6.1, C04, static HTML/JS, single-file, standalone, backup/restore és V001/V002 integritás.

A C013.1 mixed-shortage, C013.3 diszjunkt Minimum/MAX pool és canonical Titanium grouping, C013.5 picker dedup, valamint C013.7 User-Data-independent canonical picker fixture PASS. Exact canonical identity, Combined/Allocation parity, no-borrowing, no-double-reserve, reload és backup/restore PASS; fuzzy/name-only merge továbbra is tiltott.

## Valódi Chrome localhost

Ugyanez a hash-zárolt candidate futott a `127.0.0.1:42015` izolált originen.

- Technical Baseline: `15/15 PASS`
- Aktív SC-verzió: `4.10.0-LIVE.12519617`
- Wiki / UEX / IndexedDB schema 4 / reload: PASS
- Nyolc fő modul: `8/8 PASS`
- `1920×1080`, `1366×768`, `390×844`: minden modul PASS, horizontal overflow `0`
- Chrome application-origin console WARN/ERROR: `0/0`
- UI: `V003 · schema 6`; footer: `V003 · cache schema 4`
- Backup `applicationVersion`: `V003`
- Candidate SHA a Chrome-kapu előtt/után azonos

Az izolált legacy Titanium `07570c9f-...` Q784 batch mellett a user-facing picker egyetlen Titanium opciója a canonical `64978449-...` UUID-t hordozta, reload után is. A legacy batch nem migrálódott destruktívan.

A böngészős diszjunkt pool fixture Q500–Q799 tartományban csak a Q784 `1,744 SCU`, Q800+ tartományban csak a Q866 `3,124 SCU` batch-et tekintette eligible-nek. A Combined nézet `4,868 SCU` fizikai készletből `2,744 SCU` foglalást és `0,256 SCU` hiányt adott; borrowing és double reserve nem történt. Reload parity PASS.

## Standalone és verzióazonosság

A Chrome-ban ténylegesen létrehozott standalone fixture embedded CSS/JavaScriptet tartalmaz, nincs helyi CSS/JS, localhost vagy test-artifact runtime hivatkozása, és `V003-dev` előfordulása `0`. Az automated standalone parity ugyanezt a közös snapshot/allocation modellt ellenőrzi.

## Integritás és scope

- V001 és V002: változatlan, integritás PASS
- Régi helyi `V003` tag target: változatlan `045bd8ce38dde5e2ef43999a038c4d835d644b9a`
- Régi `releases/V003/` tree és artifact SHA: változatlan
- Application code: NO CHANGE
- Stabil helyettesítő release/tag: nem készült
- Push/main merge: nem történt

## Exact manual candidate `file://` kapu

`EXACT MANUAL CANDIDATE file:// GATE: NOT RUN`

A candidate automated és valódi Chrome localhost kapuja PASS, de az exact candidate közvetlen `file://` kézi kapuja külön felhasználói ciklus marad. Stabil V003 helyettesítő release csak annak explicit eredménye és külön engedély után készülhet.

## Visszaállás

A C015 checkpoint commit normál revertjével csak a C015 builder/validator/evidence/report és ciklusmeta távolítható el; a forrásalkalmazás a `37f8852...` C014 commiton, a régi invalidált release/tag pedig változatlanul megmarad.
