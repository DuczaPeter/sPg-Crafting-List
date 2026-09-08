# sPg Crafting List V003

Status: `V003 STABLE RELEASE – SINGLE-FILE RELEASE GATE PASS`

## Release identity

- Release: `V003`
- Stability: stable
- Source checkpoint: `b10462d27e67ac0f6b6aae1e7ec9a2eaa3c2983b`
- Accepted RC source: `test-artifacts/V003-C013.8/fresh-release-candidate/sPg Crafting List V003 RC.html`
- HTML size: `835832` byte
- HTML SHA-256: `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469`

## Acceptance

- Automated release gate: PASS on the unchanged accepted C013.8 candidate.
- Chrome localhost gate: PASS on the unchanged accepted C013.8 candidate.
- Exact manual `file://` gate: M1–M12 PASS.
- Single-file release gate: PASS.
- V001 and V002: unchanged.

## Running the application

The only runtime file is `sPg Crafting List.html`. CSS and JavaScript are embedded; no `Info` directory, separate `style.css`, local JavaScript, build step, or other local runtime sidecar is required. The file can be opened directly with `file://`. Internet access is needed only when refreshing live Star Citizen Wiki or UEX data.

`RELEASE.md` and `SHA256SUMS` are repository documentation, not runtime dependencies.
