# V003-C012.5D1 – Integration automated gate

## Scope

Automated integration closure of C012.5A through C012.5C3B2 on baseline `42f94e9ecc40076174ac1c732e70d26402ea291f`. No browser, localhost server, temporary browser User Data, release candidate, tag, release, push or main merge was used.

Application code changed: **NO**.

## Integrated FR-86 fixture

The same Card, inventory, material pool and assignment state was evaluated across Final Card, Crafting List, Allocation Engine, Combined Materials, Max DB and standalone snapshot/render.

- Shell / Stileron: `1.2 SCU`, `MINIMUM_Q_POOL`, threshold Q500.
- Field Array / Stileron: `1.9 SCU`, `MAXIMUM_Q_POOL`, threshold Q700.
- Canonical identity: exact commodity UUID `32bafbd4-c52a-476d-b31c-97c4b3102471`; fuzzy merge is not used.

Happy inventory (`Q550 1.2 SCU`, `Q750 1.9 SCU`):

- Shell reserves Q550 `1.2 SCU`; Field Array reserves Q750 `1.9 SCU`.
- Card `SATISFIED`; Max DB `1`.
- Combined Minimum required/reserved `1.2/1.2 SCU`; MAX `1.9/1.9 SCU`.
- Standalone labels: `Minimum Q · Q500+`, `MAX Q · Q700+`.

Q550-only inventory (`3.1 SCU`):

- Shell `SATISFIED`; Field Array `INSUFFICIENT_QUALITY`.
- `missingAmount = 0`; `missingQuality = 1.9 SCU`.
- Card `UNSATISFIED`; Max DB `0`; Combined MAX Quality shortage `1.9 SCU`.
- Standalone keeps `MAX Q · Q700+` and `Quality-hiány: 1,9 SCU`.

## Compatibility and fail-safe checks

- No explicit assignment: exact C012.3 `LEGACY_FALLBACK`; unused pool data does not alter allocation.
- Direct C012.3 fixtures cover RECIPE, TARGET_Q, HIGHEST_Q, FIXED, UNKNOWN and HP_MIN_500.
- Explicit ANY_Q adds no user threshold and cannot weaken the HP_MIN_500 recipe baseline.
- Missing Minimum/MAX threshold remains `POOL_THRESHOLD_UNRESOLVED` in allocation, Card, Combined and standalone; no Q0/Q1000 is invented.
- Two Cards with different assignments and scarce high-Q inventory preserve deterministic priority and never double-reserve a batch.
- Card deletion removes assignment demand and Combined metrics while inventory, thresholds and eligible previews remain.

## Persistence and standalone

- Backup → mutation → restore returns inventory batches, Q500/Q700 pools, Recipe Slot assignments and the happy allocation/Max DB result.
- Older backup without explicit pool/assignment restores an empty pool setting and `LEGACY_FALLBACK`.
- Standalone invariant: main computes → snapshot stores → standalone renders.
- Standalone allocation/pool recomputation, dropdown, numeric editor and User Data write surface: absent.
- Embedded CSS/JS and zero required local runtime sidecars: PASS.

## Gate chain

- C012.5A/B/C1/C2/C3A/C3B1/C3B2: PASS.
- C012.3 and C012.4 numeric: PASS.
- M4 backup/restore and M6 standalone: PASS.
- Static/JS and single-file structural gate: PASS.
- V001/V002 integrity: PASS; stable V002 artifact unchanged.

Two obsolete test-harness assumptions were repaired without application changes: the M2 harness now loads the canonical lookup dependencies used by the current engine, and the M6 assertion expects the C3B2 fail-safe `Quality nem feloldható` presentation instead of the old `Q?` text.

Evidence: `test-artifacts/V003-C012.5D1/integration-evidence.json`.

Final status: `V003-C012.5D1 – INTEGRATED AUTOMATED GATE PASS, C012.5D2 NOT STARTED`.
