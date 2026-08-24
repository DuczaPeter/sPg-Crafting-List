# CHANGELOG

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
