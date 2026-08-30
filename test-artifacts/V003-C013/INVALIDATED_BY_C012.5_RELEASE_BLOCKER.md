# V003-C013 C012.4-based candidate invalidated

Status: `INVALIDATED_BY_C012.5_RELEASE_BLOCKER`

The C013 automated regression and real Chrome localhost gates passed, but the exact-candidate user manual `file://` gate was not run. A new release-blocking C012.5 requirement was identified before that manual gate, so this candidate must never be released or reused.

Candidate evidence:

- Path: `test-artifacts/V003-C013/release-candidate/sPg Crafting List.html`
- Baseline commit: `e519b0889a65b70e8ae6d8be6d869b52e206eb99`
- Bytes: `756582`
- SHA-256: `a1c3b86f6cda2ac992d4ee62d6186cce0c5dc2df499cfc7d85892b471fccb807`
- Automated regression: `PASS`
- Real Chrome localhost: `PASS`
- User manual exact-candidate `file://`: `NOT_RUN`

This record is separate from the older `388a9c04ff6c1a8c9cca06d82f0c226636e0180ba69ced58b59d5284cca4d98e` candidate, which remains `INVALIDATED_BY_C012.3_RELEASE_BLOCKER`.

C012.5 is not started by this closure. Any future release candidate must be built only after C012.5 is implemented, tested and accepted in a separate cycle.
