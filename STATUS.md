# STATUS.md

- Projekt: `sPg Crafting List`
- Branch: `develop/V003`
- Stabil release: `V002` (változatlan)
- Fejlesztési baseline: `V003-dev`
- Induló C012.5C baseline: `18004a5beb33303d08d7ba3bbc73b1a30cfa78cf`
- Aktuális ciklus: `V003-C012.5C1`
- Státusz: `PASS`; checkpoint: `V003-C012.5C1-RECIPE-SLOT-ASSIGNMENT-MODEL`

## Elkészült

- Assignment storage: `craftingCards[].recipeSlotQualityPoolAssignments[recipeSlotId]`; identity `cardId + recipeSlotId`.
- Valid módok: `ANY_Q`, `MINIMUM_Q_POOL`, `MAXIMUM_Q_POOL`.
- Hiányzó vagy ismeretlen stored érték: nincs explicit assignment, `LEGACY_FALLBACK`; a C012.3 Quality-viselkedés változatlan.
- FR-86 Shell/Field Array slot-függetlenség, két Card, Duplicate, reload, delete cleanup, backup/restore és régi backup: PASS.
- Új IndexedDB store, DB-version és backup-schema nincs.

## Ellenőrzés

- `validate-v003-c0125c1.ps1`: PASS.
- Static/JS, C012.5C1, C012.5B, C012.5A, C012.3 és V001/V002 integrity: PASS.
- Log: `test-artifacts/V003-C012.5C1/validation.log`.
- Chrome és teljes történeti regresszió a C1 scope szerint nem futott.

## Következő

- `V003-C012.5C2` UI: NOT STARTED.
- `V003-C012.5C3` allocation/Max/Combined: NOT STARTED.
- `V003-C012.5D`: NOT STARTED.
- `C013`: NOT STARTED; V003 tag/release/push/main merge nincs.

Végső státusz: `V003-C012.5C1 – ASSIGNMENT MODEL PASS, C012.5C2 NOT STARTED`
