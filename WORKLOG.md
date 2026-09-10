# WORKLOG.md

Current cycle/session notes only. Previous raw log archived losslessly at `logs/archive/20260909-181120-074755-WORKLOG.md`.

## 2026-09-10 — V004-C004.3 Craft Run Quantity Semantics

- Baseline: clean `develop/V004 @ db3d0a7...`; application SHA `0a0a57ff...`; C004.3 folytatás, C005 nélkül.
- Döntés: Card quantity = craft-run count; output item cardinality továbbra is unproven és nem állított.
- Exact input gate: SCU csak közvetlen `source * 10000` pozitív safe integerként, ITEM pozitív safe integerként; kerekítés és epsilon 0.
- Chrome exact production: Omnisky III Cannon, 21 → partial 5 → 16 → stale block → Reallocate → full; végső batchértékek 1/1/1 unit, loss 0.
- Chrome nonexact production: Steadfast `0.07 SCU`, látható/tervezhető, completion disabled, inventory write 0.
- Legacy: explicit `21 craftként használom`, quantity változatlan, Card +1/allocation +1, reservation stale, explicit Reallocate; markerless History unknown.
- C004 atomic rollback/idempotencia és C004.3 model/Chrome/direct-file/reload/single-file/protected V003 kapu PASS; full regression/push nincs.
- Riport: `docs/V004_C004_3_CRAFT_RUN_QUANTITY_SEMANTICS_REPORT.md`; rollback normál C004.3 commit-revert.

## 2026-09-09 — V004-C004.2 Production Output Semantics Audit

- Baseline: clean `develop/V004 @ 82d4814...`; application SHA `0a0a57ff...`; audit-only scope, runtime módosítás nélkül.
- Trace: API detail → aspects/input → `requiredQuantityUnits` → Card → allocation szorzás → „1/N db-hoz” UI → output-evidence completion gate.
- Live audit: 4.10.0, 1606 blueprint, 4217 ingredient; négy production kategória detail/nested/linked reprezentációja.
- Hat `quantity_scu` raw JSON érték 4 tizedesnél hosszabb (`0.11000000000000001`, `3.0999999999999996`); 0-unit toleranciával exact source-to-unit semantics nem igazolt.
- OpenAPI és official API source output count/yield mezőt vagy univerzális 1-output invariánst nem ad; singular szövegből count=1 következtetés nincs.
- Production exact assignment 0; új/régi/migrált Card `OUTPUT_COUNT_UNPROVEN`; partial/full live Craft Complete blokkolt.
- Célzott audit/single-file/protected release gate fut; Chrome/full regression/C005/push nincs. Riport: `docs/V004_C004_2_PRODUCTION_OUTPUT_SEMANTICS_REPORT.md`.

## 2026-09-09 — V004-C004.1 Revision Semantics + Output Eligibility Audit

- Baseline: clean `develop/V004 @ f7125a9...`; C004 report és actual mutation builder célzott auditja.
- Deviation: partial completion feltétel nélkül növelte a craft list revisiont; minimális membership/order-alapú repair készült.
- Chrome partial 21 → 16: craft list 1 → 1, Card 0 → 1; full removal: craft list 1 → 2; stale/Reallocate megmaradt.
- Négy injected failure minden store-t és revisiont változatlanul rollbackelt; C004 exact-unit/idempotencia/prefix kapu PASS.
- Read-only current Wiki audit: 4.10.0, 1606 blueprint, 27/27 output class detail, output-count candidate 0.
- Production Card exact assignment 0; eredmény `LIVE_COMPLETION_CURRENTLY_BLOCKED_BY_OUTPUT_COUNT_UNPROVEN`, találgatás nélkül.
- Model/static + Chrome + direct file + single-file/protected release PASS; full regression/push/C005 nincs.
- Riport: `docs/V004_C004_1_REVISION_OUTPUT_ELIGIBILITY_AUDIT.md`; rollback normál C004.1 commit-revert.
