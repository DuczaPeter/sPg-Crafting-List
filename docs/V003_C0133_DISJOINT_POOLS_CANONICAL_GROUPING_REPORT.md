# V003-C013.3 Disjoint Quality Pools + Canonical Grouping Repair

## Eredmény

`V003-C013.3 – DISJOINT QUALITY POOLS + CANONICAL MATERIAL GROUPING REPAIR PASS, FRESH RC REQUIRED`

A C013.2 exact manual `file://` kapuja két blocker miatt megállt. A candidate változatlan maradt, de `BLOCKED / INVALIDATED`; új RC csak külön későbbi ciklusban készülhet.

## Gyökérok és javítás

Az eddigi Minimum és MAX preview/allocation ugyanazt a `quality >= threshold` szabályt használta, ezért a két tartomány átfedett. A közös `resolveMaterialQualityPoolRange()` most explicit tartományt ad:

- Minimum: `quality >= minimumQ && quality < maximumQ`;
- MAX: `quality >= maximumQ`;
- MAX nélkül a Minimum felső korlát nélküli;
- `minimumQ >= maximumQ`: `POOL_RANGE_INVALID`, allocation blokkolva és a UI-ban látható.

Nincs borrowing vagy magasabb tartományú fallback. A Card-prioritás nem változott; a módosítás kizárólag az eligibility szemantikája.

A My Materials duplikációt az okozta, hogy egy batch recipe ingredient UUID-val, a másik canonical commodity UUID-val érkezett. A `buildMaterialInventoryGroups()` csak bizonyított exact `sourceUuids`/commodity↔ingredient kapcsolatból canonicalizál. Név-, résznév- és fuzzy merge nincs. A batch eredeti `sourceMaterialUuid` mezője audit célból megmarad.

## Titanium fixture

- ingredient/source UUID: `07570c9f-fdf6-4bca-a56b-c42809ec0e01`;
- canonical commodity UUID: `64978449-1d87-4a16-ba55-4b5f94fee217`;
- Q784: `1,744 SCU`; Q866: `3,124 SCU`; total: `4,868 SCU`;
- logical/displayed material: `1`; batch: `2`;
- Minimum Q500–Q799 eligible: csak Q784;
- MAX Q800+ eligible: csak Q866;
- fizikai batch kettős foglalása: `0`.

## Érintett modell

- `resolveMaterialQualityPoolRange()` és `formatMaterialQualityPoolRange()`;
- `resolveRecipeSlotPoolAllocationPolicy()` és `batchEligibility()`;
- `calculateQualityPoolEligibleInventoryUnits()`;
- `buildMaterialInventoryGroups()` és a My Materials renderer;
- Combined pool metrics/UI és standalone effective Quality projection.

## Ellenőrzés

- `DISJOINT_MINIMUM_MAX_QUALITY_POOLS`: PASS;
- `CANONICAL_MATERIAL_MULTI_SOURCE_UUID_GROUPING`: PASS;
- same-card két slot, két-Card priority, fordított recipe-sorrend, Combined/My Materials/Max/Final/Crafting/standalone parity, reload, backup/restore, no-double-reserve és exact canonical mapping: PASS;
- közvetlen M2, M4, C012.5A–C3B2, D1 és C013.1 regresszió: PASS;
- static single-file és V001/V002 integritás: PASS;
- teljes release-regresszió: `NOT RUN BY SCOPE`;
- Chrome/manual gate: nem futott ebben a célzott repair-ciklusban.

Evidence: `test-artifacts/V003-C013.3/`.
