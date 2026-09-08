# V003-C013.8 Fresh Release Candidate Report

## Eredmény

`V003-C013.8 – FRESH RC AFTER USER-DATA-INDEPENDENT CANONICAL PICKER REPAIR AUTOMATED + CHROME GATES PASS, EXACT MANUAL CANDIDATE file:// GATE NOT RUN`

Az exact `develop/V003 @ 490ed6fc3e94f2361c7448650a08752fa5f3c8c7` forrásból új, byte-azonos single-file release candidate készült. Application code nem változott; a C013.6 jelölt továbbra is blokkolt és változatlan.

## Exact candidate

- Fájl: `test-artifacts/V003-C013.8/fresh-release-candidate/sPg Crafting List V003 RC.html`
- Méret: `835832` byte
- SHA-256 teszt előtt/után: `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469`
- Build: exact Git-commit raw-byte copy
- Runtime sidecar: `0`; CSS és JavaScript a HTML-ben
- Közvetlen `file://` kompatibilitás: statikus/automatizált kapu PASS; az exact candidate manuális `file://` kapuja még `NOT RUN`.

## Automatizált release regression

PASS: C001–C012.5, D1, C013.1, C013.3, C013.5, C013.7, M1–M6.1, C04, static HTML/JS, single-file, standalone, backup/restore és V001/V002 integritás.

A C013.7 invariancia Feynmaline, Titanium, Tungsten és Gold esetén PASS. A legacy Titanium Q784 batch megmaradt; az automatizált modellben a canonical Q866/Q920 batch-ekkel `1` logical material / `3` batch, source provenance, reload, backup, Combined, Allocation és no-double-reserve PASS. Fuzzy/name-only merge nincs; az unresolved duplicate fail-safe változatlan.

## Aktív 4.10 identity audit

- Aktív verzió: `4.10.0-LIVE.12519617`
- Live forrásrekordok: `40` mineable + `32` harvestable = `72` unique commodity; `84` harvestable item
- User-facing nevek / látható picker opciók: `128 / 126` (C013.6-tal azonos)
- Exact canonical multi-UUID materialok: `24 → 43`
- Unresolved duplicate nevek: `2 → 2`
- Látható duplikált picker-nevek: `0`
- Bizonyíték nélküli canonical UUID-k: `0`

A változás nem live elemszám-ingadozás: a lekért rekordmennyiségek változatlanok. A C013.7 kibővített exact `refinedVersion` identity relationje további bizonyított materialpárokat kapcsolt canonical identitáshoz.

## Valódi Chrome localhost

Ugyanez a hash-zárolt candidate futott a `127.0.0.1:42008` izolált originen.

- Technical Baseline: `15/15 PASS`
- Wiki / UEX / IndexedDB schema 4 / reload: PASS
- Nyolc fő modul: `8/8 PASS`
- `1920×1080`, `1366×768`, `390×844`: minden modul PASS, horizontal overflow `0`
- Chrome console WARN/ERROR: `0/0`
- Aktív SC-verzió: `4.10.0-LIVE.12519617`
- Candidate SHA a Chrome-kapu előtt/után azonos

Kritikus böngészős fixture: izolált legacy Titanium `07570c9f-...` Q784 batch mellett a My Materials egyetlen canonical Titanium csoportot mutatott, a user-facing `Titanium` kiválasztás pedig `64978449-...` UUID-t töltött ki. A legacy batch törlése nem történt meg; reload után a batch és ugyanaz a canonical autofill megmaradt.

## Integritás és scope

- V001 és V002: változatlan, integritás PASS
- C013.6 invalidált candidate SHA: változatlan `4489a48f...`
- Stabil V003 release/tag: nincs
- Push/main merge: nem történt
- Application code: NO CHANGE

## Nyitott kapu

Az exact candidate manuális, közvetlen `file://` kapuja még nincs lefuttatva. A C013.8 ezért nem stabil release.

## Visszaállás

A C013.8 checkpoint commit visszavonásával a branch visszaáll a `490ed6fc3e94f2361c7448650a08752fa5f3c8c7` C013.7 baseline-ra; a stabil fallback továbbra is V002.
