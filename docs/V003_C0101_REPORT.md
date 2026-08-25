# V003-C010.1 Compact Mining/Refinery projection report

- Cycle: `V003-C010.1`
- Branch: `develop/V003`
- Original C010 commit: `a4a442a20bcac95a2bc1c449c09d69cdf2fd180f`
- Status: `AUTOMATED PASS + CHROME LOCALHOST PASS; USER VISUAL ACCEPTANCE PENDING`
- Stable baseline: `V002` unchanged

## Scope

C010.1 changes only the compact presentation of Mining and UEX Refinery winners on the accepted C010 Final Card. Layout, allocation, hydration, C001-C010 ranking/grouping, Radar, colors, exact API links, C008 details and the standalone snapshot model remain unchanged. No V003 release or tag was created, and C011 was not started.

## Mining projection

- `c009TopMiningMethods()` and the C010 deterministic first top-tier selection remain unchanged in meaning.
- `c010MiningPresentationGroups()` reads only the already-proven C002 presentation groups; it does not regroup raw names.
- `c010CompactMiningLabel()` shows the single group label directly.
- Multiple separate groups inside the selected exact rank tier render as deterministic first friendly label plus `(+N azonos legjobb)`, where `N` excludes the first.
- NORMAL and SPACE top tiers are not merged merely because both have dense rank position 1.
- The Final Card never uses `+N további`; complete members, raw locations and decision trace remain in the snapshot and C008 Mining detail.

Real JS-300 cache projection:

- Stileron: Mining `Pyro: Bloom (+4 azonos legjobb)`; Stanton/Nyx no data.
- Beryl: Mining `Stanton: Wala`; Pyro/Nyx no data.
- Savrilium: Mining `Nyx: Glaciem Ring (+1 azonos legjobb)`; Stanton/Pyro no data.

## Refinery projection

- `c010FriendlyRefineryLabel()` maps only presentation text: `Refinement Processing - MIC-L5` to `MIC-L5`, `Refinement Center - Levski` to `Levski`, and `Refinement Processing - Pyro Gateway (Stanton)` to `Pyro Gateway`.
- `c010BestRefineryTerminals()` counts only terminals whose `valueMonth/value_month` exactly equals the system `rankingValue` when that evidence is present.
- `c010CompactRefinerySystem()` sorts those winners deterministically and renders one name or `first (+N azonos legjobb)`; lower-ranked rows never increase `N`.
- Raw terminal names are not rewritten and remain available in the snapshot and C008 Refinery detail.
- Stileron remains the exact unresolved message: `Nincs biztonságos refinery adat`.

Real JS-300 cache projection:

- Beryl: `Stanton: ARC-L1 (+4 azonos legjobb)` and `Nyx: Levski`.
- Savrilium: `Stanton: MIC-L5` and `Nyx: Levski`.

Synthetic exact-tie acceptance: two rank-8 terminals plus one rank-7 terminal produce raw winner count `2` and compact label `ARC-L1 (+1 azonos legjobb)`; the lower-ranked terminal is excluded.

## Shared standalone projection

The main Final Card and standalone export call the same helpers. The generated JS-300 standalone contains three recipe rows, three material blocks, embedded CSS/JavaScript, compact Mining/Refinery labels, valid snapshot JSON, runtime fetch `0` and external runtime resources `0`.

## Verification

- `tools/validate-v003-c0101.ps1`: PASS.
- Full C001-C010 + M1-M6.1 + C04 regression: PASS.
- C010.1 targeted grouping/friendly-label/exact-tie/lower-rank tests: PASS.
- Exact API audit for `4.9.0-LIVE.12232306`: PASS.
- Real Chrome localhost Technical Probe: `15 PASS / 0 FAIL`.
- Detail reload and browser Back: PASS.
- 390 px responsive check: three material blocks visible, page horizontal overflow `0`.
- Main and standalone console warning/error: `0`.
- User Data fingerprint: `d7be3ccc -> d7be3ccc`.
- Frozen V002 tag commit `b326aaff5838aafd5b1f13b16982c29a0e150e35` and HTML SHA-256 `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`: unchanged.

## Artifacts

- `test-artifacts/V003-C010.1/exact-api-link-audit.json`
- `test-artifacts/V003-C010.1/standalone-js-300-final-card.html`
- `test-artifacts/V003-C010.1/summary.md`
- `test-artifacts/V003-C010.1/chrome-final-main-view.png` (local screenshot, ignored by Git policy)

Rollback: revert the C010.1 commit. The accepted C010 commit and frozen V002 release remain available.
