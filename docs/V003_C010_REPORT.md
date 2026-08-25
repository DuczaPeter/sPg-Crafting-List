# V003-C010 Exact Final Crafting Card report

- Cycle: `V003-C010`
- Branch: `develop/V003`
- Original C010 commit: `a4a442a20bcac95a2bc1c449c09d69cdf2fd180f`
- Status: `AUTOMATED PASS + CHROME LOCALHOST PASS; USER VISUAL ACCEPTANCE PENDING`
- Stable baseline: `V002` unchanged

## Scope

The default application view now separates blueprint selection from multi-card planning. The left side contains the Blueprint Browser; the right side contains exactly one non-persistent Final Crafting Card for the selected blueprint. The complete sortable multi-card Crafting List remains available only through its dedicated navigation item. No V003 release or tag was created, and C011 was not started.

The information hierarchy follows:

- `Info/A fö nézet.png`
- `Info/A Crafting card.png`

C001-C009 ranking, grouping, hydration, allocation, Radar, material color, exact API link, detail routing and cache behavior remain shared and unchanged.

## Final Card composition

- Header: `S1`, `Military`, `A`; crafting time `15:00`; compact cart action.
- Item: exact JS-300 source API link.
- Quantity: compact editable `1 DB`; debounced input and final change both recalculate the deterministic preview allocation without persisting the preview.
- Maximum: compact `Max: n DB`, supplied by the Allocation Engine.
- Recipe: exactly three compact rows with slot name, material, per-craft amount and suitable stock/shortage at the right.
- Material intelligence: one neutral compact block per material; only the verified material name token and Radar chips use the C007 material color.
- System order: `Stanton → Pyro → Nyx`, followed by additional known systems alphabetically.
- Mining/refinery: only the best recommendation tier/group per system; no spawn, occurrence or Quality values on the Final Card.
- Radar: eight unique curated values for JS-300, increasing and formatted as individual chips.
- Detail actions: Mining, Refinery and Radar reuse the C008 controller, route, reload and browser Back behavior.
- User-facing links: exact `api.star-citizen.wiki` item/material records only; no public Wiki button and no name-derived URL.

Verified Radar chips:

- Stileron: `3185`, `6370`
- Beryl: `3540`, `7080`, `10 620`, `14 160`
- Savrilium: `3200`, `6400`

## Standalone export

The visible standalone main content uses the same compact C010 Final Card projection:

- one Final Card;
- three recipe rows and three material blocks;
- item/time/quantity/max/stock;
- exact API links;
- compact Mining, Refinery and Radar results;
- snapshot-driven internal detail views;
- embedded CSS/JavaScript;
- runtime fetch `0` and external runtime resources `0`.

Legacy allocation/source evidence remains available only in a collapsed Advanced section so the main card does not regress into the Crafting List dashboard.

## Verification

- Targeted C010 exact-composition test: PASS (`3` recipe rows, `3` material blocks, `8` Radar chips, `4` exact API targets).
- Full C001-C010 + M1-M6.1 + C04 regression: PASS.
- Live exact API source audit for `4.9.0-LIVE.12232306`: PASS.
- Real Chrome localhost Technical Probe: `15 PASS / 0 FAIL`.
- Real Chrome default/separate Crafting List navigation: PASS.
- Quantity `1 → 2 → 1`: deterministic shortage recalculation PASS; User Data fingerprint stayed `d7be3ccc`.
- Main and standalone Mining/Refinery/Radar detail navigation, reload and browser Back: PASS.
- 390 px responsive check: single column, no horizontal page overflow, all three material blocks usable.
- Main and standalone Chrome console WARN/ERROR: `0`.
- Frozen V002 tag commit `b326aaff5838aafd5b1f13b16982c29a0e150e35` and release HTML SHA-256 `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`: unchanged.

The earlier real Chrome `file://` result remains recorded as `USER MANUAL PASS_NOT_CODEX_AUTOMATION`; C010 itself was verified by Codex on localhost, not as a new `file://` automation claim.

## Evidence audit correction

This document was re-audited during `V003-C010.1`. It describes the actual C010 implementation and its original commit above; it is not a renamed or reused V002 release report. The frozen V002 report, tag and release artifact remain separate and unchanged. C010.1 presentation-only results are recorded in `docs/V003_C0101_REPORT.md`.

## Artifacts

- `test-artifacts/V003-C010/chrome-final-main-view.png` (local screenshot, ignored by Git policy)
- `test-artifacts/V003-C010/chrome-final-mobile.png` (local screenshot, ignored by Git policy)
- `test-artifacts/V003-C010/exact-api-link-audit.json`
- `test-artifacts/V003-C010/standalone-js-300-final-card.html`
- `test-artifacts/V003-C010/summary.md`

Rollback: revert the C010 commit. The frozen fallback remains the unchanged `V002` tag and release artifact.
