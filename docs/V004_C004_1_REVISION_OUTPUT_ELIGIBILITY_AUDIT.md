# V004-C004.1 Revision Semantics + Output Eligibility Audit

## Eredmény

`V004-C004.1 – REVISION SEMANTICS PASS`

`LIVE_COMPLETION_CURRENTLY_BLOCKED_BY_OUTPUT_COUNT_UNPROVEN`

Az input C004 checkpoint `f7125a96d092ba2765ad48b09145d40d501f9edd`, az input application SHA-256 `33f6d4264543184e92782af34dbc8454e02ce56f196cad5f29abb29863c5da99`. A C004.1 a `develop/V004` ágon készült, C005 elindítása nélkül.

## Actual craftListRevision viselkedés és repair

Az actual C004 implementation auditja deviationt talált: a `v004BuildCraftCompletionMutation()` feltétel nélkül meghívta a `v004NextRevision()` függvényt a `craftListRevision` értékre. Ez partial completionnél is +1-et okozott, noha a Card membership, order és priority nem változott. Tehát nem pusztán riporthiba, hanem application-code deviation volt.

A minimális repair a `craftListRevisionAfter` számítását a tényleges listaváltozáshoz kötötte:

- `remainingAfter > 0`: a `craftListRevision` változatlan;
- `remainingAfter = 0`: Card removal miatt pontosan +1.

Más C004 semantics nem változott. Partial után továbbra is `inventoryRevision +1`, `allocationRevision +1`, `historySequence +1`, a megmaradó Card `cardRevision +1`, a reservation `STALE`, és explicit Reallocate szükséges. Full removalnál a későbbi Card csak akkor kap `cardRevision +1` értéket, ha persisted `order` mezője ténylegesen megváltozik.

## Exact célteszt

A valódi Chrome fixture kezdeti revisionjei a completion előtt: inventory `1`, craft list `1`, allocation `2`, history `0`, Card `0`.

Partial `21 → 16` után:

- inventory `2`;
- craft list változatlan `1`;
- allocation `3`;
- history `1`;
- ugyanazon Card revisionje `1`;
- reservation `STALE`, automatikus Reallocate nincs.

A maradék 16 teljes completionje után a Card eltűnt, a craft list revision `1 → 2`, az inventory `3`, allocation `4`, history `2`. Reload után ugyanezek a durable értékek maradtak.

A négy injected failure pont — batch deduction után, History add előtt, Card update után és meta update előtt — minden store-t és minden revisiont változatlanul hagyott. A C004 stale, idempotencia, exact-unit conservation és prefix-fogyasztás kapuja változatlanul PASS.

## Live output-count eligibility

A read-only audit 2026-09-09-én az aktuális Star Citizen Wiki API default `4.10.0-LIVE.12519617` verzióját vizsgálta:

- 1606 blueprint, 9 indexoldal;
- 27 output-osztály;
- mind a 27 osztályból egy aktuális detail rekord;
- index/root, detail/root és beágyazott `output` kulcsokban 0 output count/quantity/yield candidate field.

Példa tényleges API-evidence: `TH-01 Propulsor`, blueprint UUID `00eabb01-d628-49f5-a1f6-7c9df4ad9259`, output class `Cargo`, HTTP 200; root és nested output count candidate mező `0`.

Az application production Card modellje ettől függetlenül is fail-closed:

- `buildCraftingCard()` minden új valódi Cardot explicit `OUTPUT_COUNT_UNPROVEN` értékkel hoz létre;
- a stored/migrated Card normalizáló hiányzó evidence esetén ugyanerre defaultol;
- production `PER_FINISHED_ITEM_NORMALIZED_EXACT` assignment darabszám: `0`;
- az exact-capable út csak a jóváhagyott `tests/fixtures/v004-c003-reservation.json` tesztfixture-ben bizonyított.

Következtetés: a jelenlegi alkalmazás által valódi blueprintből létrehozott Crafting Cardok nem completion-capable állapotúak. A C004 atomic core PASS marad, de a live használat fail-closed módon blokkolt, amíg külön bizonyított output semantics nem készül. Nem került be `outputCount = 1` feltételezés vagy más találgatott fallback.

## Changed files

- `sPg Crafting List.html`: egyetlen revision-döntési repair; runtime sidecar nincs.
- `tools/run-v004-c004-tests.mjs`, `tools/run-v004-c004-browser-tests.mjs`, `tools/validate-v004-c004.ps1`: exact partial/full revision assertionök.
- `tools/audit-v004-c0041-output-eligibility.mjs`, `tools/validate-v004-c0041.ps1`: read-only live audit és bounded C004.1 gate.
- `test-artifacts/V004-C004/`, `test-artifacts/V004-C004.1/`: friss gépi evidence.
- C004/C004.1 riport és kötelező projektmeta; a korábbi WORKLOG nyers bájtazonos archívuma.

## Ellenőrzés és integritás

- C004 repaired model/static gate: PASS.
- Google Chrome partial/full/revision/rollback/reload: PASS.
- Direct `file://`: `PASS_AUTOMATED`.
- Console/page error: 0.
- Embedded CSS és JavaScript: PASS; local script src, stylesheet, runtime JSON és fixture runtime import: 0.
- `LOCAL_RUNTIME_SIDECARS = 0`; `APPLICATION_RUNTIME_FILE_COUNT = 1`.
- Repaired application SHA-256: `0a0a57ffe689134bb36f7cffc1443dbafbfbdbd8d5e3647affa9194770ee2764`.
- V001/V002/V003 release/RC/evidence: változatlan.
- V003 annotated tag target: `ebc83281769fd212d988ee55957b1c2754256490`.
- V003 artifact: 835820 byte; SHA-256 `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`.
- Full regression: `NOT_RUN_BY_SCOPE`; push/force push/release: NO.

## Deferred scope

History UI, Undo, Redo, BroadcastChannel, multi-window notification és C005 továbbra sincs implementálva.

## Checkpoint és rollback

A helyi repair-checkpoint commit subjectje: `V004-C004.1-REVISION-SEMANTICS-OUTPUT-ELIGIBILITY-AUDIT`. Normál Git reverttel visszavonható. A WORKLOG előző nyers tartalma lossless archívumban marad; a V003 baseline/tag/artifact nem igényel rollbacket.
