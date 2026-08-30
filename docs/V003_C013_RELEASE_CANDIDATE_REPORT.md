# V003-C013 Release Candidate Report

## Status

`V003 C013 ATTEMPT – AUTOMATED PASS, CHROME LOCALHOST PASS, USER MANUAL file:// NOT RUN, INVALIDATED BY C012.5 RELEASE BLOCKER`

This cycle validates and packages the already closed C012.4 application. It does not change application HTML, UI, business logic, data models, allocation, ranking, mining, Quality or refinery behavior.

## Candidate identity

- Branch: `develop/V003`
- C012.4 baseline commit: `e519b0889a65b70e8ae6d8be6d869b52e206eb99`
- Candidate path: `test-artifacts/V003-C013/release-candidate/sPg Crafting List.html`
- Candidate bytes: `756582`
- Candidate SHA-256: `a1c3b86f6cda2ac992d4ee62d6186cce0c5dc2df499cfc7d85892b471fccb807`
- Build model: `GIT_COMMIT_RAW_BYTE_COPY`
- Source byte identity: PASS
- Deterministic rebuild from the same commit: PASS
- Runtime files required: `1`
- Local runtime sidecars: `0`

The previous `388a9c04ff6c1a8c9cca06d82f0c226636e0180ba69ced58b59d5284cca4d98e` candidate remains permanently `INVALIDATED_BY_C012.3_RELEASE_BLOCKER`. Its immutable metadata is retained separately and its bytes were not reused.

The current C012.4-based candidate is also no longer release-eligible. A new C012.5 release blocker was identified before the exact-candidate manual `file://` gate, so the current candidate is `INVALIDATED_BY_C012.5_RELEASE_BLOCKER`. This status does not erase or downgrade the automated and Chrome localhost PASS evidence; it prevents release or reuse of these candidate bytes.

## Automated gate

- `M1–M6.1`: PASS
- `C04`: PASS
- `C001–C012.4`: PASS
- `C013` targeted gate: PASS
- JS-300, FR-66 and XL-1 coverage: PASS
- Blueprint Browser, Final Card, Crafting List, expanded/collapsed, quantity, priority, Max DB, Combined Materials, detail and reload/Back: PASS
- Single-file structure, embedded CSS/JavaScript, no local runtime sidecar: PASS
- V001 and V002 frozen integrity: PASS

## Quality and allocation gate

Metamaterial Test #152 ×3 remains the release-blocker fixture. With Stileron Q747 and Target Q800, the batch is ineligible, reserved amount is 0, `missingAmount` is 0, `missingQuality` is 1.5 SCU, the card is unsatisfied and Max DB is 0. Ouratite Q860 reserves 0.9 SCU. Adding qualified Stileron Q850 restores craftability and leaves Q747 unused.

RECIPE, TARGET_Q, HIGHEST_Q, FIXED + RECIPE, FIXED + TARGET_Q, FIXED + HIGHEST_Q, DYNAMIC, HP_MIN_500 and UNKNOWN fail-safe are PASS. Recipe minimum cannot be weakened; Target Q consumes the lowest eligible batch; Highest Q starts from the highest batch. Priority, no-double-count, shared Combined allocation and Quality-filtered Max DB are PASS.

## Numeric input gate

All seven audited numeric editors remain connected to the shared C012.4 draft/commit lifecycle. Automated replacement, temporary empty, first-focus selection, already-focused caret, Enter/change/blur/Tab, zero User Data writes during draft and no draft-time full render are PASS.

Real Chrome localhost on the exact candidate also passed sequential typing for Final Card `1 → 11452 → 3`, Crafting List `→ 11452 → 3`, Combined Target Q `800 → 950`, temporary empty, focus/DOM identity, Enter, Tab/blur and reload persistence.

The save fixtures intentionally write the same logical values through the real persistence path. That updates the record `updatedAt` audit fields, so the complete fingerprint changed from `170845c4` to `683b3f50` even though quantity `3` and Target Q `950` were restored and no User Data was lost. From the restored post-fixture state, a mutation-free reload proved `683b3f50 → 683b3f50`. This metadata-only change is recorded rather than misreported as a byte-identical restore.

## Active SC version and isolation

- Active SC version: `4.10.0-LIVE.12519617`
- Blueprint/mining dataset, source provenance, material intelligence, detail, standalone and API query consistency: PASS
- VERSION_A retained in cache: PASS
- VERSION_A leakage into active VERSION_B snapshot: NO
- Exact source item/material/detail/standalone API links: PASS
- Name-derived or fuzzy API URL: NO

## Mining, Radar, color, naming and UEX

Primary-resource gating, secondary exclusion, spawn → occurrence → quantized Quality, NORMAL/SPACE separation and Top-3 dense tiers are PASS. Radar and material-color registries, canonical material naming, UEX exact mapping, per-system best refinery, TTL, tie/negative and unmapped/ambiguous handling are PASS. No data was altered to satisfy a test.

## Standalone artifacts

- Baseline: `test-artifacts/V003-C013/standalone/sPg Crafting List - JS-300 baseline.html` — `186132` bytes — SHA-256 `21359755d84cad54f90b00704f9ee4aac14969c09a9652191d71c1adf68267e5`
- Q900: `test-artifacts/V003-C013/standalone/sPg Crafting List - JS-300 Q900.html` — `186364` bytes — SHA-256 `a85010611402703d0db623079e79dc112008fdbdce246006a64693ca65bf9c69`

Both contain embedded CSS, JavaScript and snapshot JSON; external local runtime resources and runtime snapshot fetches are 0. Active version, exact API-link version, Quality Plan, allocation and internal detail navigation are PASS in automated and Chrome localhost checks.

## Chrome localhost gate

- Technical Probe: PASS (`15` checks, `0` failed)
- Final Card / Crafting List / Combined Materials / detail: PASS
- Detail reload and browser Back: PASS
- 1920×1080 horizontal overflow: `0`
- 1366×768 horizontal overflow: `0`
- 390×844 main/detail horizontal overflow: `0`
- Candidate console WARN: `0`
- Candidate console ERROR: `0`
- Standalone console WARN/ERROR: `0 / 0`

This is Codex real Chrome localhost evidence, not a `file://` claim.

## Frozen release integrity and remaining gate

- V001 tag/artifacts: unchanged
- V002 tag commit: `b326aaff5838aafd5b1f13b16982c29a0e150e35`
- V002 HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`
- V003 tag: none
- Stable V003 release: none
- Push/main merge: none
- Exact candidate manual `file://` gate: `NOT_RUN`
- Candidate validity: `INVALIDATED_BY_C012.5_RELEASE_BLOCKER`
- C012.5 implementation: `NOT_STARTED`

The next development step, only after explicit user instruction, is a separate C012.5 repair cycle. This candidate must not be tested as a release candidate, released, or reused for a later stable release.

## Rollback

Revert the single `V003-C013-ABORTED-BY-C012.5` closure commit to remove candidate/test/evidence/documentation changes. The application remains the C012.4 baseline throughout; stable fallback remains the frozen V002 tag and release.
