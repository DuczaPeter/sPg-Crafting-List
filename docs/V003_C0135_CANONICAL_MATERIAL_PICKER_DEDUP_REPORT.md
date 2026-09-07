# V003-C013.5 – Canonical Material Picker Dedup Repair

## Scope and blocker

The exact C013.4 `file://` manual gate exposed a My Materials picker blocker: one logical material could appear under more than one API UUID. The C013.4 candidate is therefore `BLOCKED / INVALIDATED`; it was not modified or reused. This cycle changes application code and targeted tests only. It does not build a release candidate or run the full release regression.

## Root cause and repair

`buildKnownMaterialOptions()` previously merged records only when their existing `sourceUuids` already overlapped. A commodity UUID and a related item/harvestable UUID arriving through separate sources could therefore remain two options. `resolveKnownMaterialSelection()` then refused name resolution because more than one exact-name match existed.

C013.5 adds the versioned `MATERIAL_IDENTITY_MODEL_VERSION = V003-C013.5-1` exact-identity layer:

- `normalizeExactMaterialIdentityRelation()` accepts only a single API `resource_container.default_composition` commodity relation with exact weight `1`;
- `selectExactMaterialIdentityAuditCandidates()` selects only exact normalized-name collisions for item-detail proof; this is candidate discovery, not name-based merging;
- `materialIdentityRelationsForVersion()` isolates relations to the active SC version and includes the verified Feynmaline fallback for legacy/offline 4.10 cache use;
- `buildCanonicalMaterialCatalog()` is the shared exact projection used by the picker, Material Database and mining commodity selectors/details;
- `buildKnownMaterialOptions()` applies the exact relation graph before final picker projection;
- `finalizeKnownMaterialPickerVisibility()` hides every still-unresolved same-name UUID set instead of presenting misleading duplicate rows;
- `auditKnownMaterialOptions()` exposes exact merges and `UNRESOLVED_DUPLICATE_MATERIAL_IDENTITY` name/UUID sets;
- `buildCanonicalMaterialBatchRecord()` stores the canonical UUID while retaining a differing source UUID as provenance.

Existing batches are not rewritten. `buildMaterialInventoryGroups()`, Allocation and Combined Materials consume the same canonical `knownMaterials` projection at runtime. No fuzzy, partial-name or name-only merge was added.

## Feynmaline acceptance

- Canonical commodity UUID: `7310c15d-359c-42b4-b61e-7da3d0da3384`
- Related item/harvestable UUID: `d7a21cac-3c2b-4695-95b7-2042d8f5755e`
- Exact origin: `resource_container.default_composition[0].commodity.uuid`, weight `1`
- Visible picker option count: `1`
- Name selection UUID autofill: canonical commodity UUID
- New batch: canonical UUID; differing submitted source UUID retained in `sourceMaterialUuid`

## Active 4.10 audit

Dataset: `4.10.0-LIVE.12519617`.

- Mineable commodity records: `40`
- Harvestable commodity records: `32`
- Unique commodity records: `72`
- Harvestable item index records: `84`
- Exact same-name item-detail candidates: `18`
- Proven exact item→commodity relations: `18`
- User-facing material names in the exhaustive potential-source audit: `128`
- Visible picker options: `126`
- Exact canonical multi-UUID materials: `24`
- Unresolved duplicate names: `2`

Exact multi-UUID logical materials:

`Amioshi Plague`, `Aphorite`, `Bluemoon Fungus`, `Carinite`, `Copper`, `Dolivine`, `Feynmaline`, `Glacosite`, `Gold`, `Golden Medmon`, `Hadanite`, `Heart of the Woods`, `Iron`, `Jaclium`, `Janalite`, `Lindinium`, `Pitambu`, `Prota`, `Ranta Dung`, `Riccite`, `Sadaryx`, `Saldynium`, `Silicon`, `Tungsten`.

Exact item-detail relation groups: `Amioshi Plague`, `Aphorite`, `Bluemoon Fungus`, `Carinite`, `Dolivine`, `Feynmaline`, `Glacosite`, `Golden Medmon`, `Hadanite`, `Heart of the Woods`, `Jaclium`, `Janalite`, `Pitambu`, `Prota`, `Ranta Dung`, `Sadaryx`, `Saldynium`. These 17 groups are backed by 18 detail relations because Carinite has two related source items.

Exact Wiki `refined_version` families: `Copper`, `Gold`, `Iron`, `Lindinium`, `Riccite`, `Silicon`, `Tungsten`.

Unresolved and hidden from a misleading duplicate picker projection:

- `Leyland's Tortoise`: `0e19caaa-44b9-4708-a86e-e4301ecdd0f8`, `a0a4e1f8-8c68-486f-b828-5b241d02337a`
- `Yormandi Tongue`: `2845e7ee-2f52-471b-a0a7-05ca11908fe6`, `6d8c8c22-12ce-4433-af1e-5c38f54ced1b`

No canonical UUID was invented for these unresolved pairs.

## Targeted verification

`tools/validate-v003-c0135.ps1` PASS:

- static single-file syntax/CSS gate;
- Feynmaline and Titanium picker dedup;
- exact UUID selection and material-name→UUID autofill;
- canonical new-batch save with source provenance;
- existing noncanonical batch runtime grouping without destructive migration;
- reload and backup/restore;
- Combined and Allocation parity;
- no double reserve;
- no fuzzy/name-only merge;
- unresolved duplicate audit;
- C013.3 Titanium, C012.5A, M2 and M4 targeted regressions;
- active 4.10 live API audit;
- V001/V002 integrity and unchanged invalidated C013.4 artifact.

Full release regression: `NOT RUN BY SCOPE`. Fresh RC: required in a later cycle.

Evidence:

- `test-artifacts/V003-C013.5/canonical-material-picker-evidence.json`
- `test-artifacts/V003-C013.5/active-4.10-material-identity-audit.json`
- `test-artifacts/V003-C013.5/target-summary.json`
- `test-artifacts/V003-C013.5/validation.log`

Rollback: revert the C013.5 checkpoint commit. Stable V001/V002 releases remain unchanged.
