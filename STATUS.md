# STATUS.md

## Jelenlegi állapot

- Branch `candidate/V004`; application repair `a6a5d35592d9777c6b740eeb7ec44c4c58b27443`; harness commit `9d17b68527f3f8df450c65bef8d5c146475ce47d`.
- C010 candidate: `test-artifacts/V004-C010/fresh-release-candidate/sPg Crafting List V004 RC.html`; SHA-256 `16f186cc7a0ec3d614dbdd690c1ac448261713ff4fd6c32bdfa8876b68641af5`; `1083886` byte; runtime `V004`.
- Boundary B repair: régi History snapshot durable evidence változatlan; új Complete snapshot, eligibility projection és Full Undo restore production-canonical.
- Snapshot compatibility, M4, C0125C1 és C006.1 targeted PASS; schema 3/fingerprint stabil; Partial Undo mutation változatlan.
- Static harness gate PASS: required runner `11`, checkout fallback `0`, unresolved known dependency gap `0`, legacy fixture jelentés megőrizve.
- A teljes C010 gate pontosan egyszer elölről futott; 16 release leaf PASS, majd `v003-c0081-detail-fix` line 54 standalone-link assertion FAIL.
- Candidate Chrome, automated direct `file://` és manual `file://` nem futott; stable artifact/tag/push/GitHub Release nincs.
- C008/C009 invalid candidate evidence és V001/V002/V003 változatlan; riport: `docs/V004_C010_HISTORY_SNAPSHOT_CANONICALIZATION_REPORT.md`.

`V004-C010 – REPLACEMENT RELEASE CANDIDATE BLOCKED`
