# V003-C014 Stable Version Identity Repair Report

Date: 2026-09-08

Status: `V003-C014 – STABLE VERSION IDENTITY REPAIR PASS, FRESH RC REQUIRED`

## Blocker and scope

The local V003 release commit `045bd8ce38dde5e2ef43999a038c4d835d644b9a` promoted the accepted C013.8 bytes without changing the embedded application identity. The resulting runtime therefore reported `V003-dev` while its release documentation reported stable `V003`. This was a pre-publication release blocker; no remote push or `main` merge had occurred.

C014 changes only the three current runtime identity values in `sPg Crafting List.html`:

- `applicationStatus`: `V003-dev` → `V003`
- `footerRuntime`: `V003-dev` → `V003`
- `APP.version`: `V003-dev` → `V003`

The application diff is exactly the baseline HTML with those three replacements. Allocation, Quality pools, canonical material identity, User Data schemas, mining, UEX and all other business logic are unchanged.

## Propagation and targeted validation

- Static `V003-dev` runtime identity occurrences: `0`.
- Runtime application status: `V003 · schema 6`.
- Runtime footer: `V003 · cache schema 4`.
- Backup export `applicationVersion`: `V003`.
- Diagnostic bundle `application.version`: `V003`.
- Single-file static gate: PASS; embedded CSS and JavaScript, local runtime sidecar `0`.
- Technical Probe in real Chrome localhost: `15/15 PASS`, including IndexedDB, Wiki API and standalone HTML export.
- IndexedDB startup and reload: PASS; after reload the UI still reports `V003` and the persisted Technical Probe remains PASS.
- Standalone export row: PASS, `538 KiB`, embedded CSS, no external resource.
- Chrome application console WARN/ERROR: `0/0`.
- Full historical release regression: `NOT RUN BY SCOPE`.

Evidence:

- `test-artifacts/V003-C014/version-identity-evidence.json`
- `test-artifacts/V003-C014/target-summary.json`
- `test-artifacts/V003-C014/chrome-localhost-evidence.json`

## Invalidated local release evidence

The existing local release commit and annotated tag are retained unchanged as evidence:

- local release commit: `045bd8ce38dde5e2ef43999a038c4d835d644b9a`
- local `V003` tag target: `045bd8ce38dde5e2ef43999a038c4d835d644b9a`
- existing stable artifact SHA-256: `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469`
- status: `PRE-PUBLICATION INVALIDATED BY V003 VERSION IDENTITY BLOCKER`

The tag was not moved or deleted. `releases/V003/sPg Crafting List.html` and its release sidecars were not modified. No replacement RC or stable release was created in C014.

## Lineage and rollback

- V001 integrity: PASS, unchanged.
- V002 integrity: PASS, unchanged; it remains the latest valid stable release until a fresh V003 candidate completes its gates.
- Push: NO.
- `main` merge: NO.

Rollback is a normal revert of the C014 checkpoint commit. The invalidated local release evidence remains available at the unchanged `V003` tag and release commit.
