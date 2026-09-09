# sPg Crafting List V003

Status: `V003 STABLE RELEASE – REPLACEMENT SINGLE-FILE RELEASE GATE PASS`

## Release identity

- Release: `V003`
- Stability: stable
- Replacement source checkpoint: `8194b7f2472bddd26c11e7fa3791cc2555244d14`
- Accepted RC: `test-artifacts/V003-C015/fresh-release-candidate/sPg Crafting List V003 RC.html`
- HTML size: `835820` byte
- HTML SHA-256: `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`
- Runtime identity: `V003`

## Acceptance

- Automated release gate: PASS on the unchanged accepted C015 candidate.
- Chrome localhost gate: PASS on the unchanged accepted C015 candidate.
- Exact manual `file://` gate: user-verified M1–M7 PASS.
- Single-file release gate: PASS.
- V001 and V002: unchanged.

## Replaced pre-publication attempt

The earlier local V003 release commit `045bd8ce38dde5e2ef43999a038c4d835d644b9a` and artifact SHA-256 `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469` were `PRE-PUBLICATION INVALIDATED BY V003 VERSION IDENTITY BLOCKER`. They were never pushed or published. The commit remains in Git history; this replacement release uses the corrected, fully accepted C015 candidate.

## Running the application

The only runtime file is `sPg Crafting List.html`. CSS and JavaScript are embedded; no `Info` directory, separate `style.css`, local JavaScript, build step, or other local runtime sidecar is required. The file can be opened directly with `file://`. Internet access is needed only when refreshing live Star Citizen Wiki or UEX data.

`RELEASE.md` and `SHA256SUMS` are repository documentation, not runtime dependencies.
