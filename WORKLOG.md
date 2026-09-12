# WORKLOG.md

Current cycle/session notes only. Previous raw log archived losslessly at `logs/archive/20260911-182941-874117-WORKLOG.md`.

## 2026-09-11 — V004-C010 History Snapshot Canonicalization + blocked replacement gate

- Resume: `candidate/V004 @ 3f94ad0...`; 26 dirty C009/C008.2 tooling/evidence változás staged state nélkül megőrizve; `$credit-efficient-project-runner`.
- Boundary B production repair: legacy History snapshot durable evidence változatlan; új Complete snapshot, eligibility két operandusa és Full Undo restore ugyanazzal a production Card normalizerrel canonical.
- Tízpontos snapshot/Undo proof, schema-3 round-trip/fingerprint, M4, C0125C1 és C006.1 targeted PASS; Partial Undo mutation és strict comparator változatlan.
- Application commit: `a6a5d35592d9777c6b740eeb7ec44c4c58b27443`; C010 candidate SHA `16f186cc...`, `1083886` byte; invalid C009 artifact változatlan.
- Harness commit: `9d17b68527f3f8df450c65bef8d5c146475ce47d`; required runner 11, checkout fallback 0, unresolved known gap 0, legacy fixture regions preserved.
- A teljes C010 gate pontosan egyszer indult az elejétől: preflight és 16 release leaf PASS, majd `v003-c0081-detail-fix` line 54 standalone public-Wiki-link assertion FAIL.
- Fail-fast STOP: további leaf, candidate Chrome, responsive, console/page, automated/manual `file://` nem futott; full 1606 audit nem ismétlődött.
- Stable artifact/tag/push/GitHub Release nincs; V001/V002/V003 változatlan; riport: `docs/V004_C010_HISTORY_SNAPSHOT_CANONICALIZATION_REPORT.md`.

## 2026-09-12 — V004 stable preparation, PLAN-V2

- V001 contract javítva: local annotated tag/bundle exact, remote absence történelmileg helyes; V001 remote írás nincs.
- Fresh H `0a83e4409e2c38442ca8f908dcf101d013061955`; H→validation HEAD fast-forward, 0/30 eltérés, protected release delta 0.
- 55/55 + 4 preflight és user manual file:// PASS újrafuttatás nélkül; confirmation date 2026-09-12.
- Izolált worktree; raw-byte stable copy, hat evidence átvéve, exact-path -text, csak engedélyezett metadata. Application/candidate change 0.
- S/tag/remote publication és külön P evidence commit következik; forrás checkout és historical evidence megőrizve.

## 2026-09-12 — V004 published, separate P evidence checkpoint

- S `a69dd9770877435ae986072b0074ebe3be3e78d2`; annotated V004 object `171bef2209d17d1c805343e9e919f5d0932145cb`, target S. Fast-forward main push és explicit V004 tag push PASS; V001 remote továbbra is absent, V002/V003 exact.
- ENOBUFS ellenőrző tooling streaming temp-fájllal lezárva; CRLF evidence byte-ok változatlanok, diff-check command-scope cr-at-eol mellett PASS; tartós whitespace-config nem változott.
- Draft Release ID `387667009`; asset ID `559757894`, tényleges név `sPg.Crafting.List.html`. Draft ID a Release-listából feloldva, újralétrehozás nélkül.
- Draft download PASS: `2026-09-12T18:40:12.046Z`; publikálás: `2026-09-12T18:40:34Z`; második, published download PASS: `2026-09-12T18:41:01.516Z`.
- Mindkét letöltés SHA `16f186cc7a0ec3d614dbdd690c1ac448261713ff4fd6c32bdfa8876b68641af5`, `1083886` byte, raw-byte equality PASS.
- Release URL: https://github.com/DuczaPeter/sPg-Crafting-List/releases/tag/V004; asset URL és további azonosítók: VERSION.json.
- Csak STATUS/VERSION/TASKS/WORKLOG publication-evidence frissül. P külön metadata-only commit; final P push/hash verification a snapshot után. Application, S/tag, release HTML és elfogadott evidence változatlan; nincs új tesztfutás.
