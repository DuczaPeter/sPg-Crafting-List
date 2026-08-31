# V003-C012.5C3B1 – Combined real pool metrics

## Scope

The existing Combined Materials canonical material card now projects real allocation results into its two existing Quality-pool blocks. No standalone, allocation-engine, numeric-editor, dropdown, release, or stable V002 code was changed.

## Model and UI

- `buildCombinedPoolAllocationMetrics()` aggregates only allocation usages whose explicit assignment is `MINIMUM_Q_POOL` or `MAXIMUM_Q_POOL`.
- The projection reads C3A results; it does not perform a second Combined-specific allocation.
- Each pool shows eligible inventory, required, reserved, physical amount shortage and Quality shortage.
- `ANY_Q` and `LEGACY_FALLBACK` remain in the global material totals but are excluded from both explicit pool subtotals.
- Eligible previews may overlap, while global physical inventory is counted once.
- `POOL_THRESHOLD_UNRESOLVED` remains fail-safe and is shown as unresolved rather than satisfied.
- Exact canonical UUID identity is retained; recipe-slot names are not rendered in the pool UI.
- Deleting the recipe Card removes pool demand while the inventory-only material card, thresholds and eligible preview remain.

## Automated evidence

- FR-86 happy path: Minimum Q500 `1.2/1.2/0 SCU`; MAX Q700 `1.9/1.9/0 SCU`; physical inventory `3.1 SCU`.
- Quality-shortage path: Q550 inventory `3.1 SCU`; MAX pool required `1.9`, reserved `0`, amount shortage `0`, Quality shortage `1.9 SCU`.
- Multiple Cards and priority-derived aggregation, no-double-count, exact UUID bridge, unresolved threshold, delete/inventory-only, ANY/legacy exclusion: PASS.
- C3B1 target + C3A/C2/C1/B/A direct regressions + static/single-file + V001/V002 integrity: PASS.
- Evidence: `test-artifacts/V003-C012.5C3B1/combined-pool-metrics-evidence.json`.
- Validation log: `test-artifacts/V003-C012.5C3B1/validation.log`.

## Real Chrome localhost

Isolated origin: `http://127.0.0.1:4184`.

- FR-86 happy path and Quality-shortage presentation: PASS.
- User-approved deletion affected the single FR-86 test Card only.
- Inventory-only Stileron and Feynmaline cards remained; all three marked batches remained.
- Stileron thresholds remained `Minimum Q = 500`, `MAX Q = 700`.
- Post-delete eligible preview remained `3.1 SCU` and `0 SCU` for the current Q550-only shortage inventory.
- Both pool required/reserved/amount-shortage/Quality-shortage metrics became `0`; status `NO_ASSIGNMENT`.
- Mutation-free reload fingerprint: `ab900bdc -> ab900bdc`.
- Desktop and `390 x 844` Combined Materials horizontal overflow: `0`.
- Console WARN/ERROR: `0/0`.

## Closure

- Branch: `develop/V003`.
- Baseline: `8fe5722f4f006f3346ff0b85d1425a7405315b2a`.
- V002 stable release: unchanged.
- C012.5C3B2, C012.5D and C013: not started.
- No tag, release, push or main merge.
- Rollback: revert the `V003-C012.5C3B1-COMBINED-POOL-METRICS` checkpoint; stable fallback remains V002.
