# V003 Local Release Report — Pre-publication Invalidated

Date: 2026-09-08

Status: `PRE-PUBLICATION INVALIDATED BY V003 VERSION IDENTITY BLOCKER`

## Pre-publication invalidation

The local release commit `045bd8ce38dde5e2ef43999a038c4d835d644b9a` and its local annotated `V003` tag are retained unchanged as historical evidence. Publication is blocked because the byte-identical accepted artifact still identifies its runtime as `V003-dev`. C014 repairs the development application identity, but this report, the tagged release artifact and the tag are not rewritten. A fresh release candidate is required before a replacement stable V003 can be approved.

No remote push or `main` merge occurred.

## Release identity

- Stable artifact: `releases/V003/sPg Crafting List.html`
- Application source commit: `490ed6fc3e94f2361c7448650a08752fa5f3c8c7`
- Accepted RC checkpoint: `4b51db7c797ddc5705e03509b19e749149f835a9`
- Manual gate checkpoint: `b10462d27e67ac0f6b6aae1e7ec9a2eaa3c2983b`
- Accepted RC: `test-artifacts/V003-C013.8/fresh-release-candidate/sPg Crafting List V003 RC.html`
- Size: `835832` byte
- SHA-256: `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469`
- RC/stable byte identity: PASS.

## Acceptance evidence

- Full relevant automated C001–C012.5, D1, C013.1/.3/.5/.7, M1–M6.1 and C04 gate chain: PASS on the accepted C013.8 candidate.
- Chrome localhost: PASS; Technical Baseline `15/15`, eight modules, three viewports, horizontal overflow `0`, console WARN/ERROR `0/0`.
- Exact manual direct `file://` gate: user-verified M1–M12 PASS and temporary Q920 Titanium test batch removed.
- Single-file gate: PASS; one runtime HTML, embedded CSS and JavaScript, no local runtime sidecar, no `Info` or separate CSS/JS dependency.
- Backup/restore and read-only import preview: PASS in the accepted evidence.
- Combined Materials / Allocation Engine parity and no double reserve: PASS.

The automated and Chrome localhost gates were not rerun during the original release-only cycle. Their historical PASS evidence remains valid for the tagged bytes, but does not waive the subsequently identified stable-version identity blocker.

## V003 repair summary

- Canonical identity uses verified exact relations; source/legacy UUID provenance is retained without fuzzy or name-only merging.
- Minimum and MAX Quality pools use disjoint ranges. Invalid or overlapping configuration remains fail-safe, with allocation blocked rather than borrowed across pool ranges.
- The user-facing canonical material picker deduplicates exact logical materials and is independent of already stored legacy User Data batches.
- Titanium legacy/source UUID `07570c9f-fdf6-4bca-a56b-c42809ec0e01` resolves to canonical commodity UUID `64978449-1d87-4a16-ba55-4b5f94fee217` while retaining the source UUID as provenance; legacy batches are not destructively migrated or deleted.

## Integrity and lineage

- V001 tag and release tree: unchanged.
- V002 tag and release tree: unchanged.
- Stable V003 artifact is an exact raw-byte copy of the accepted C013.8 candidate.
- Git attributes mark both the accepted RC and stable HTML as `-text`, preventing line-ending normalization from changing their recorded bytes.
- Release directory runtime files: exactly one HTML. `RELEASE.md` and `SHA256SUMS` are documentation only.
- No localhost or C013.x test-artifact runtime dependency is present.
- No remote push or `main` merge is part of this cycle.

## Rollback

The release commit can be reverted to return the branch to the C013.9 checkpoint `b10462d27e67ac0f6b6aae1e7ec9a2eaa3c2983b` without rewriting history. Frozen V001 and V002 releases remain available through their unchanged tags and release directories.
