# sPg Crafting List V004

V004 is a single-file HTML release for Star Citizen crafting, exact-unit inventory planning, Craft History/Undo, mining and refinery workflows.

## Artifact and provenance

- User artifact: [sPg Crafting List.html](sPg%20Crafting%20List.html).
- Bytes: `1083886`; SHA-256: `16f186cc7a0ec3d614dbdd690c1ac448261713ff4fd6c32bdfa8876b68641af5`.
- Runtime: `V004`; backup schema: `3`; one HTML with embedded CSS/JavaScript, no local CSS/JS/Info/runtime sidecars. Internet is needed only for intended live Wiki/UEX data.
- Raw-byte source: [accepted C010 candidate](../../test-artifacts/V004-C010/fresh-release-candidate/sPg%20Crafting%20List%20V004%20RC.html).
- Application source commit: `a6a5d35592d9777c6b740eeb7ec44c4c58b27443`.
- Validation HEAD: `872699271937e53d48c1d5f9095f6e58bca2ac3c`.
- Stable commit is the exact commit targeted by the annotated `V004` tag; later publication facts are recorded separately in [VERSION.json](../../VERSION.json). No self-referential commit hash is embedded in this release commit.

## Accepted gates

- Complete integrated release run: four preflight checks and 55/55 release leaves PASS, including repaired C003/C004 browser paths.
- Chrome: 1920×1080 and 390×844 PASS; automated direct `file://` PASS; console/page errors 0; single-file and protected-release checks PASS.
- [Automated summary](../../test-artifacts/V004-C010.3/target-summary.json), [integration evidence](../../test-artifacts/V004-C010.3/release-regression-evidence.json), [browser evidence](../../test-artifacts/V004-C010.3/candidate-browser-evidence.json) and [validation log](../../test-artifacts/V004-C010.3/validation.log) are unchanged historical outputs. Their manual-required/not-created fields describe that automated run, not later publication state.
- Manual direct `file://`: `PASS_USER_VERIFIED`; user confirmation date `2026-09-12`, `dateKind=USER_CONFIRMATION_DATE`, not an inferred execution timestamp. Exact candidate identity and reported coverage are recorded in `VERSION.json.manualFileGate`.
- Automated/manual gates were reused, not rerun during publication. The full 1606-blueprint audit was not repeated: accepted dataset/adapter/normalization contract remains unchanged.

## Release scope and protection

- Craft quantities count craft runs; output item cardinality is not inferred. Completion consumes exact reserved integer units, blocks stale reservations and preserves every remaining unit.
- Partial/full Complete, History, exact batch-delta LIFO Undo, canonical snapshots and schema-3 backup/import are included, with IndexedDB durable authority and multi-tab/concurrency safety.
- V001/V002/V003 tags and artifacts remain protected. V001 was released locally, not historically pushed; remote V001 is intentionally absent and is not published by this V004 workflow.
- PLAN-V2: local stable preparation precedes remote publication. Draft and published assets must each be downloaded and match these exact bytes. Current publication status, tag/asset identifiers and verified URLs are in `VERSION.json.v004ReleasePublication` and [STATUS.md](../../STATUS.md).
