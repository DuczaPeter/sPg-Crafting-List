# V003 Replacement Stable Release Report

Date: 2026-09-09

Status: `V003 STABLE RELEASE – REPLACEMENT SINGLE-FILE RELEASE GATE PASS`

## Final release identity

- Final artifact: `releases/V003/sPg Crafting List.html`
- Replacement source checkpoint: `8194b7f2472bddd26c11e7fa3791cc2555244d14`
- C015 candidate checkpoint: `ea8a39ca972e53fbd778599090d69836544d2692`
- C016 manual-gate checkpoint: `8194b7f2472bddd26c11e7fa3791cc2555244d14`
- Accepted RC: `test-artifacts/V003-C015/fresh-release-candidate/sPg Crafting List V003 RC.html`
- Final size: `835820` byte
- Final SHA-256: `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`
- RC/stable byte identity: PASS
- Runtime identity: `V003`; runtime `V003-dev` occurrence: `0`

## Acceptance evidence

- Full relevant automated release gate: reused PASS from the unchanged C015 candidate.
- Chrome localhost gate: reused PASS from the unchanged C015 candidate; Technical Probe `15/15`, eight modules, three viewports and console WARN/ERROR `0/0` were accepted in C015.
- Exact manual direct `file://` gate: user-verified M1–M7 PASS in C016.
- Backup export: `applicationVersion = "V003"`.
- Diagnostics: `application.version = "V003"`.
- Standalone export: PASS; embedded CSS, no `Info`, separate `style.css` or local JavaScript runtime dependency.
- Single-file release gate: PASS; one runtime HTML and local runtime sidecars `0`.

No automated, Chrome localhost or manual gate was rerun during this packaging-only cycle because the final artifact is a raw-byte copy of the unchanged accepted candidate.

## Verified V003 behavior represented by the accepted evidence

- Canonical material picker: PASS, including one canonical Titanium identity in the presence of a legacy/source UUID batch.
- User-Data-independent canonical identity: PASS; legacy source provenance remains available without destructive migration.
- Disjoint Minimum/MAX Quality pool semantics: PASS.
- Combined Materials / Allocation parity: PASS.
- No double reserve: PASS.
- Backup/restore: PASS in the C015 automated evidence; direct `file://` backup version identity PASS in C016.

## Pre-publication invalidated local release

- Invalidated release commit: `045bd8ce38dde5e2ef43999a038c4d835d644b9a`
- Invalidated artifact SHA-256: `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469`
- Reason: `PRE-PUBLICATION INVALIDATED BY V003 VERSION IDENTITY BLOCKER`

The invalidated attempt was never pushed or published. Its commit remains reachable in Git history; no duplicate runtime artifact is retained in the final release directory.

## Integrity and lineage

- V001 tag and release artifact: unchanged.
- V002 tag and release artifact: unchanged.
- The final V003 artifact is byte-identical to the accepted C015 candidate.
- The release directory contains one runtime HTML; `RELEASE.md` and `SHA256SUMS` are documentation only.
- No localhost or C013/C015 test-artifact runtime dependency is introduced.
- Application source code did not change in this release packaging cycle.
- Remote push and `main` merge: not performed.

## Rollback

Revert the replacement stable release commit to restore the prior tracked release directory and metadata without rewriting Git history. The invalidated local release commit `045bd8ce38dde5e2ef43999a038c4d835d644b9a` remains available for audit, while the unchanged V001 and V002 tags/releases remain independent recovery points.
