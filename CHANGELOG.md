# CHANGELOG

## V003 - PRE-PUBLICATION INVALIDATED (2026-09-08)

The local `V003` release commit/tag is retained as evidence but must not be published: its embedded runtime identity still reports `V003-dev`. C014 repairs the development application identity to `V003`; a fresh RC and a new stable-release decision are required.

- Exact canonical material identity és source/legacy UUID provenance fuzzy vagy name-only merge nélkül.
- Diszjunkt Minimum/MAX Quality pool szemantika, mixed amount/Quality shortage és cross-view allocation parity.
- Canonical material picker dedup és User Data-tól független canonical UUID-feloldás.
- Legacy Titanium batch megtartása mellett canonical Titanium csoportosítás és új Quality batch támogatás.
- Single-file stable artifact az elfogadott C013.8 candidate byte-pontos másolataként.

### Acceptance

- Teljes releváns automated release gate: PASS az elfogadott, változatlan C013.8 candidate-en.
- Chrome localhost: PASS; Technical Baseline 15/15, nyolc modul, három viewport, konzol 0/0.
- Exact manual `file://` M1–M12: PASS.
- Release HTML: 835832 byte; SHA-256 `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469`.
- V001 és V002: változatlan.

## V002 - 2026-08-24

- A teljes alkalmazas CSS-e a `sPg Crafting List.html` fajlba kerult.
- Megszunt a runtime `Info/style.css`, CSSOM/fetch/cache fallback es duplikalt base64 CSS snapshot.
- Az alkalmazas es a standalone export ugyanazt az egyetlen embedded CSS-forrast hasznalja.
- A Google Fonts import megszunt; helyi rendszerfont fallback maradt.
- A valos Chrome `file://` kezi gate onallo Downloads-peldannyal 13 PASS / 0 FAIL eredmennyel lezart.
- A V001 stabil release es tag valtozatlan.

### Acceptance

- `V002-C002` teljes M1-M6.1 + C04 regresszio: PASS.
- Single-file release gate: PASS; runtime artifact pontosan egy `sPg Crafting List.html`.
- Standalone export, IndexedDB/User Data, Wiki API es UEX: PASS.
- Chrome localhost application warning/error es `file://` diagnostic error: 0.
- Release HTML: 489 492 byte; SHA-256 `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`.

## V001 - 2026-08-24

Elso stabil kiadas.

### Fo funkciok

- Verzizott Star Citizen Wiki blueprint- es mining-adatcache tranzakcios aktivalassal.
- Recipe Slot szintu receptmodell, Quality capability es determinisztikus Allocation Engine.
- Globalis My Materials Quality batch-ekkel, sorrendezheto Crafting Cardokkal.
- Mining location rangsor, equipment es perzisztens mining loadoutok.
- Combined Materials, teljes User Data backup/preview/migration/rollback es diagnosztikai csomag.
- UEX refinery cache, determinisztikus Wiki–UEX mapping es rendszerenkenti ajanlas.
- Teljes standalone Crafting/Farm Card export beagyazott CSS-sel es kulso runtime-eroforras nelkul.
- Material Database, Mining Loadouts es nyolc enabled V1 navigacios cel.

### Acceptance

- Automatizalt M1-M6.1 + C04 regresszio: PASS (`V001-C014`).
- Chrome C01-C17 normal `file://` kapu: PASS.
- Standalone O01-O03 es O05-O06: PASS.
- User Data loss: NO; Chrome B/C/D fingerprint `2667ea55`.
- O04: `NOT TESTED – ACCEPTED RELEASE WAIVER`.
- Edge E01-E10: `NOT TESTED – ACCEPTED RELEASE WAIVER`.
