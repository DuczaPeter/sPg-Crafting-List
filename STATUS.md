# STATUS.md

## Jelenlegi állapot

- Branch `develop/V004`; C006.1 input checkpoint `4bb3303...`; runtime `V004-dev`; C007 nem indult el.
- C006 Undo durable állapot partial és full Complete → Undo → export → tiszta izolált DB import → reload után exact megmarad.
- A tiszta céladatbázisba történő schema-3 `REPLACE` exact restore: revision-, Card-, inventory-, History- és meta-adat nem változik az importhatáron.
- Nem üres cél vagy `MERGE` továbbra is revision-invalidálást használ; startup/import után a reservation stale és explicit Reallocate kell.
- `UNDONE` History, consumed delta, restored-batch/revision evidence, ismeretlen extra History mező, Card és inventory round-trip PASS; backup data loss 0.
- Import után grouping/order `2,1`, státusz `UNDONE,COMPLETED`, LIFO PASS; második Undo `ALREADY_UNDONE`, durable write 0.
- Legacy schema 3 fail-closed kompatibilis, Undo evidence nem fabrikálódik. Backup schema maradt 3.
- V003 migráció read-only és változatlan; source DB write 0. C006 célzott regresszió PASS.
- Google Chrome és direct `file://` PASS; runtime fájl 1, sidecar 0, overflow 0, console/page error 0.
- Application SHA-256 `ecbb85cee6fc0ae92c0b2338e392806f7fac72befb430e2bbb40f3ab717f71b5`.
- Full regression nem futott; V001/V002/V003/tag/artifact változatlan; push NO.
- Riport: `docs/V004_C006_1_UNDO_BACKUP_ROUNDTRIP_REPORT.md`.

`V004-C006.1 – UNDO BACKUP ROUND-TRIP PASS, C007 READY`
