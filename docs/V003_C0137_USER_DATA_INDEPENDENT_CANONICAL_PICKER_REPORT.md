# V003-C013.7 User-Data-Independent Canonical Picker Repair

## Outcome

`V003-C013.7 – USER-DATA-INDEPENDENT CANONICAL PICKER REPAIR PASS, FRESH RC REQUIRED`

- Branch: `develop/V003`
- Baseline: `87ae7d18aaa2bf3020654bc79ada433f6c8771a6`
- Scope: targeted repair; no full release regression, Chrome gate, new RC, V003 tag, release, push or main merge.
- C013.6 candidate: **BLOCKED / INVALIDATED**, HTML unchanged at SHA-256 `4489a48ff50e6652b89684dce522e35203557e33753d73b1c98aa5588193a7ed`.

## Root cause

`buildMaterialDisplayIndex()` retained the UUIDs of records physically present in the active commodity dataset, but omitted a proven `refinedVersion.uuid` when that related record was not separately present. A legacy User Data batch carrying that omitted UUID could therefore enter `buildKnownMaterialOptions()` as a second identity. Picker visibility and selection then depended on stored User Data.

The C013.5 audit did not cover this exact shape: Titanium's canonical commodity record was present, while the legacy/source UUID was only referenced through `refinedVersion` and was not injected as a legacy User Data batch.

## Repair

- `buildCanonicalMaterialCatalog()` now retains a proven `refined_version` UUID as an exact source identity even if the related source record is absent.
- `buildKnownMaterialOptions()` assigns explicit canonical authority and selects the highest-authority identity independently of insertion order.
- Authority order: verified exact API relation → canonical commodity record → verified source relation → User Data provenance.
- User Data may add provenance and batches but cannot replace a proven canonical UUID.
- `resolveKnownMaterialSelection()` therefore returns the same canonical option with or without legacy batches.
- `buildCanonicalMaterialBatchRecord()` stores a new batch under the canonical UUID while retaining a submitted legacy UUID as `sourceMaterialUuid`.
- My Materials update and allocation refresh explicitly pass the active identity graph and SC version instead of relying on implicit state fallback.
- Identity model: `V003-C013.7-1`.

No stored batch is deleted or automatically rewritten. Multiple Quality batches under one logical material remain supported.

## Targeted evidence

Canonical invariance passed both without User Data and beside an existing legacy/source batch:

- Feynmaline: `d7a21cac-3c2b-4695-95b7-2042d8f5755e` → `7310c15d-359c-42b4-b61e-7da3d0da3384`
- Titanium: `07570c9f-fdf6-4bca-a56b-c42809ec0e01` → `64978449-1d87-4a16-ba55-4b5f94fee217`
- Tungsten: `60f116f4-c02a-45b2-9ded-333747795124` → `addc9aa4-5d2d-4c0d-b01b-ad2b2e50a5d6`
- Gold: `21825507-7923-4683-9bf3-9cfe316940e3` → `57aba429-cf97-4fdd-8042-94b1d643f5bd`

Titanium retained its legacy Q784 batch, accepted new canonical Q866 and Q920 batches, rendered one logical material with three batches, and preserved source provenance. Reload and backup/restore reproduced the same canonical result.

PASS: My Materials grouping, Combined parity, Allocation parity, no double reserve, C013.3 disjoint Minimum/MAX pools, C013.5 picker behavior, C012.5A inventory independence, M2 allocation and M4 Combined/backup. Unresolved duplicate fail-safe and the prohibition on fuzzy/name-only merge remain unchanged.

## Integrity and next gate

- V001/V002 integrity: PASS.
- Destructive User Data migration: NO.
- Full release regression: NOT RUN BY SCOPE.
- Fresh V003 candidate: required in a later, separately authorized cycle.

Restore point: revert the `V003-C013.7-USER-DATA-INDEPENDENT-CANONICAL-PICKER-REPAIR` checkpoint commit. Stable fallback remains V002.
