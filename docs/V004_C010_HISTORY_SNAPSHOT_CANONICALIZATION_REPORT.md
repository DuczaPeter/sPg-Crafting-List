# V004-C010 History Snapshot Canonicalization Report

## Outcome

`V004-C010 – REPLACEMENT RELEASE CANDIDATE BLOCKED`

The bounded application repair and all targeted/static harness gates passed. The full replacement release gate ran once from the beginning and stopped at `v003-c0081-detail-fix`; no automatic repair or rerun followed.

## Root cause and boundary

Craft Complete stored a raw `preCraftCardSnapshot`, while backup/import canonicalized the active Card but not the nested History snapshot. Undo eligibility then compared canonical and raw normalization evidence with the strict Card semantic comparator and could incorrectly return `UNDO_CARD_STATE_CHANGED`.

Boundary B is retained: existing History snapshot bytes remain immutable durable evidence. A shared runtime helper delegates only to production `normalizeStoredCraftingCard()` and never rewrites stored legacy History events.

`PARTIAL UNDO MUTATION DOES NOT REQUIRE SNAPSHOT RESTORE CHANGE`

`BACKUP SCHEMA 3 REMAINS VALID`

## Application repair

- Commit: `a6a5d35592d9777c6b740eeb7ec44c4c58b27443` (`V004-C010-HISTORY-SNAPSHOT-CANONICALIZATION`).
- Diff against invalid C009 source: 8 insertions, 4 deletions, one HTML file.
- New Complete events store a production-canonical `preCraftCardSnapshot`.
- `v004ExpectedPostCraftCard()` canonicalizes before applying remaining quantity, original order and post-complete revision.
- Eligibility canonicalizes the current active Card with the same production normalizer before strict comparison.
- Full Undo canonicalizes the stored snapshot before applying restore order, new revision and timestamp.
- History durable normalization, migration, fingerprint algorithm, consumed deltas, transaction IDs, reservation hashes, strict semantic comparator and Partial Undo mutation are unchanged.

## Legacy History and semantic compatibility

Targeted evidence passed for raw History plus canonical current Card, canonical History plus raw current Card, canonical idempotency, real semantic-change blocking, immediate and backup/import A/B LIFO re-eligibility, canonical new snapshots, canonical Full Undo restore, unchanged Partial Undo, History deltas/revisions/reservation evidence, and schema-3 exact round-trip/fingerprint stability.

## Replacement candidate

- Source commit: `a6a5d35592d9777c6b740eeb7ec44c4c58b27443`.
- Path: `test-artifacts/V004-C010/fresh-release-candidate/sPg Crafting List V004 RC.html`.
- SHA-256: `16f186cc7a0ec3d614dbdd690c1ac448261713ff4fd6c32bdfa8876b68641af5`.
- Size: `1083886` bytes.
- Runtime identity: `V004`; `V004-dev` occurrence: `0`.
- Raw-byte source binding and single-file construction: PASS.
- Invalid C009 candidate remains unchanged at SHA-256 `e4763a54deca8755ec9604ccc16e2d00be53896040572b41a777d1e89357f8b4`, size `1083495`.

## Harness and targeted tests

- Harness commit: `9d17b68527f3f8df450c65bef8d5c146475ce47d` (`V004-C010-RELEASE-HARNESS-REBOUND`).
- M4: PASS.
- C0125C1: PASS.
- V004-C006.1: PASS.
- Required M4 runner wiring: 11; checkout fallback: 0; unresolved known dependency gap: 0.
- Legacy fixture regions: preserved.
- Full 1606-blueprint audit: NOT RERUN because dataset, adapters and exact quantity normalization did not change.

`NO OTHER KNOWN RELEASE-HARNESS DEPENDENCY GAP REMAINS`

## Full release gate

The C010 gate ran exactly once from the beginning. Identity freeze, both harness audits, isolated clone and the first 16 configured release leaves passed through `v003-c008-detail`.

The next leaf, `v003-c0081-detail-fix`, failed at `tools/run-v003-c0081-tests.mjs:54`: its historical standalone assertion rejects every `href="https://star-citizen.wiki/..."`. This is a new release-gate blocker and was not repaired automatically.

- Remaining integration leaves: NOT RUN after fail-fast stop.
- Candidate Chrome gate: NOT RUN.
- Responsive 1920×1080 and 390×844: NOT RUN.
- Candidate console/page error gate: NOT RUN.
- Automated direct `file://`: NOT RUN.
- Manual exact `file://`: NOT ELIGIBLE / NOT RUN.
- Stable artifact: NOT CREATED.
- V004 tag: NOT CREATED.
- Push: NO.
- GitHub Release: NO.
- V001/V002/V003 protected state: unchanged.

## Restore point

The repair is isolated in the application commit followed by the harness commit. Recovery, if explicitly requested, is by normal Git revert in reverse order; no reset, history rewrite or force push is required.
