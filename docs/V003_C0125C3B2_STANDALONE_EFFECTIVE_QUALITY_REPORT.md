# V003-C012.5C3B2 – Standalone effective Quality

## Scope

The standalone Final Crafting Card now presents the effective Recipe Slot Quality result already resolved by the C3A allocation path. Allocation, eligibility, threshold resolution, Max DB, Combined Materials, dropdowns, numeric editors and User Data semantics were not changed.

## Data flow and read-only boundary

`main allocation → C3A resolved requirement/qualityPolicy → output snapshot → projectStandaloneEffectiveQuality() → standalone renderer`

- The export stores the resolved assignment source/mode, recipe baseline, pool threshold, effective rule/target/minimum, resolution status and block reason.
- The standalone renderer does not call allocation, inventory eligibility, pool threshold or Max DB resolvers.
- No pool editor is rendered and no IndexedDB/local/session storage write surface is included.
- The same canonical commodity UUID is preserved when one material appears in multiple Recipe Slots.

## Presentation semantics

- Explicit Minimum pool with Q500: `Minimum Q · Q500+`.
- Explicit MAX pool with Q700: `MAX Q · Q700+`.
- Recipe baseline stricter than pool: the effective stricter minimum is shown.
- `ANY_Q`: the recipe baseline remains visible and cannot be weakened.
- Legacy FIXED: `Recept szerint · Bármely Q`; FIXED baseline context remains visible.
- Unknown or unresolved threshold: fail-safe `Quality nem feloldható`; never shown as satisfied by guesswork.
- Amount shortage and Quality shortage remain separate.

## Automated evidence

- FR-86 Q550-only fixture: Shell `Minimum Q · Q500+`; Field Array `MAX Q · Q700+`.
- Both rows reference exact commodity UUID `32bafbd4-c52a-476d-b31c-97c4b3102471`.
- Field Array: `Quality-hiány: 1,9 SCU`; full Card: `UNSATISFIED`.
- Baseline > pool, ANY, legacy FIXED, unknown/unresolved, no-recomputation, no-editable-control, no-write-surface and single-file assertions: PASS.
- Direct C3B2 + C3B1/C3A/C2/C1/B/A, static/single-file and V001/V002 integrity: PASS.
- Evidence: `test-artifacts/V003-C012.5C3B2/standalone-effective-quality-evidence.json`.
- Validation log: `test-artifacts/V003-C012.5C3B2/validation.log`.

## Chrome localhost

Artifact: `test-artifacts/V003-C012.5C3B2/standalone-fr86-quality-shortage.html` at isolated `http://127.0.0.1:4185`, desktop `1366 × 768`.

- Shell/Field Array labels, two Stileron recipe rows, `1,9 SCU` Quality shortage and `UNSATISFIED`: PASS.
- Editable controls: `0`; User Data write surface: `false`.
- Console WARN/ERROR: `0/0`.
- Evidence: `test-artifacts/V003-C012.5C3B2/chrome-localhost-evidence.json`.
- Exact manual Chrome `file://`: `NOT RUN`; the browser-control security boundary was not bypassed.

## Integrity and closure

- Read-only fixture fingerprint: `41ab6696ed3a9f2ae950292e45d76e3da149495e011b97384e781d702f7f5a62 → 41ab6696ed3a9f2ae950292e45d76e3da149495e011b97384e781d702f7f5a62`.
- Stable V002 release: unchanged.
- C012.5D and C013: not started.
- No V003 tag, release, push or main merge.
- Rollback: revert the C3B2 checkpoint; stable fallback remains V002.
