# V003-C013 candidate invalidated

Status: `INVALIDATED_BY_C012.3_RELEASE_BLOCKER`

The interrupted C013 cycle did not create a Git commit. Its checksum and baseline are retained only as historical evidence and must never be used as a stable V003 artifact.

Release blocker: under C012.2, an explicit material-level `TARGET_Q` constraint was ignored when the recipe baseline was `FIXED`. The Metamaterial Test #152 reproduction accepted and reserved a Q747 Stileron batch despite the user's Q800 target.

Historical candidate evidence:

- Historical path at the time: `test-artifacts/V003-C013/release-candidate/sPg Crafting List.html`
- Bytes: `749270`
- SHA-256: `388a9c04ff6c1a8c9cca06d82f0c226636e0180ba69ced58b59d5284cca4d98e`
- Baseline commit: `24b55890a4d97176d756f3f1e3c05f80ee987ab7`

The historical bytes are no longer stored at that path. The current file at the same cycle path belongs to the C012.4-based C013 attempt, has a different manifest and SHA-256, and is separately `INVALIDATED_BY_C012.5_RELEASE_BLOCKER`. The immutable older record also exists in `release-candidate/invalidated-candidate-manifest.json`.

All subsequent candidate or stable work must start only after a separate C012.5 repair cycle is implemented, tested and accepted.
