# WORKLOG.md

Current cycle/session notes only. Previous raw log archived losslessly at `logs/archive/20260909-080507-788203-WORKLOG.md`.

## 2026-09-09 — V004-C001 Craft Complete Architecture Audit

- Induló `main 1658ec1...`, clean; hitelesített fetch után `origin/main 0a83e44...`, két remote-only commit.
- A remote nettó delta kizárólag `index.html` három ismert `V003-dev` → `V003` identity cseréje; protected path delta 0.
- `git pull --ff-only` után clean `develop/V004` készült `0a83e44...` alapról; push nincs.
- V003 annotált tag target `ebc8328...`; artifact `835820` byte és SHA `87382a8...` PASS; V001/V002 változatlan.
- Célzott kódaudit: DB/store/transaction, batch/canonical identity, allocation/reservation, Card, backup/import és cross-tab állapot.
- Külön V004 DB, exact snapshot/revision/stale, atomi Complete/History/Undo, V003→V004 migráció és 6 ciklusos terv dokumentálva.
- Bizonyított architektúra-blocker nincs; application code és feature implementation nem változott.
- Full regression, Chrome és feature teszt scope szerint nem futott.
- Riport: `docs/V004_C001_CRAFT_COMPLETE_ARCHITECTURE_AUDIT.md`.
- Visszaállás: a dokumentációs checkpoint normál revertje; a lokális V004 branch elhagyható, a V003 baseline/tag/artifact érintetlen.

## 2026-09-09 — V004-C002 Database/Schema + Safe V003 Migration Foundation

- Baseline: clean `develop/V004 @ 0b44909...`; authenticated fetch után `origin/main 0a83e44...` változatlan; Git-folyamat nincs.
- A kanonikus egyfájlos HTML runtime `V004-dev`, schema 7, külön `spg-crafting-list-v004` v1 adatbázisra váltott.
- A 26 meglévő store mellett `craftHistory` három indexszel és `userMeta` négy, 0-ról induló revision rekorddal létrejött.
- V003 safe discovery/version/topology, kizárólag readonly olvasás, kötelező schema-2 backup, explicit confirm és SHA-256 source fingerprint elkészült.
- Same fingerprint, changed source és non-pristine target BLOCKED; a migráció hét V004 store-t lefedő atomi tranzakció, injected failure teljes rollback.
- Schema-3 backup foundation elfogadja a V003 schema 1/2 inputot, History üres és meta determinisztikus; V004→V003 backward import nincs.
- Exact integer-copy fixture és Chrome bizonyítja az 1 és 200 unit megőrzését, a V003 forrás változatlanságát és a duplicate/changed-source blokkokat.
- Live Wiki audit: 1606 blueprint indexrekord/27 output type és 12 detail alapján explicit output-count mező nem bizonyított; C004 affected recipe BLOCKED prerequisite.
- Célzott model/static + valódi Chrome localhost/refresh/direct file PASS, console/page error 0; full regression nem futott.
- Single-file runtime sidecar 0; V001/V002/V003/tag/artifact/evidence változatlan; Craft Complete/Undo nincs; push nincs.
- Riport: `docs/V004_C002_DATABASE_SCHEMA_MIGRATION_REPORT.md`.
- Visszaállás: a C002 checkpoint normál revertje; V003 és a release-ek nem igényelnek rollbacket.

## 2026-09-09 — V004-C003 Revision + Reservation Snapshot Infrastructure

- Baseline: clean `develop/V004 @ d773dc2...`; authenticated fetch után `origin/main 0a83e44...` változatlan; Git-folyamat nincs.
- Durable globális és per-card revision készült, pontos szemantikai +1, presentation-only collapse +0, safe-integer overflow blockkal.
- Inventory/Card/quality/import/migration revision és rekordírás közös tranzakcióban; injected failure rekordot és revisiont is teljesen rollbackel.
- Runtime-only canonical reservation payload és Web Crypto SHA-256 hash készült; display label nem identity, szemantikai tömbsorrend megmarad.
- `VALID`/`STALE`/`BLOCKED`, reload/import/migration stale és explicit `Újraszámítás / Reallocate` UI elkészült; snapshot nem perzisztálódik.
- MAX és partial prefix kizárólag a látható reserved allocationt használja; output-count és crypto hiány fail-closed blocker.
- Célzott model/static + valódi Chrome mutation/Reallocate/output blocker/rollback/reload/direct file PASS; console/page error 0; full regression nem futott.
- Single-file runtime sidecar 0; V001/V002/V003/tag/artifact változatlan; Complete/deduction/History/Undo/Broadcast nincs; push nincs.
- Riport: `docs/V004_C003_REVISION_RESERVATION_SNAPSHOT_REPORT.md`.
- Visszaállás: a C003 checkpoint normál revertje; V003 és a release-ek nem igényelnek rollbacket.
