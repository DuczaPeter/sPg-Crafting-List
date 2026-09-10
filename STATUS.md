# STATUS.md

## Jelenlegi állapot

- Branch `develop/V004`; C007 input checkpoint `da8515a...`; runtime `V004-dev`.
- `BroadcastChannel` csak kis UI-változásjelzés; minden durable authority és újraolvasás IndexedDB-alapú.
- Kétfüles Craft Complete és Undo azonnali UI-frissítése PASS; minden reservation stale, automatikus Reallocate nincs.
- Konkurens Complete pontosan egy commit; konkurens Undo pontosan egy restore; dupla fogyasztás/visszaállítás és negatív inventory nincs.
- Elveszett üzenet és BroadcastChannel-hiány mellett a tranzakciós stale guard fail-closed; material loss 0 unit.
- Material és Card add/edit/delete/reorder/quantity/Quality pool keresztfüles frissítése PASS.
- Backup import és read-only V003 migráció dedikált force-refresh jelzése PASS; importált revision exact megmarad.
- Reloadkor új tab ID és pontosan egy listener; malformed/self/duplicate/out-of-order jelzés ignorálva.
- Google Chrome és direct `file://` PASS; runtime fájl 1, sidecar 0, overflow és console/page error 0.
- Application SHA-256 `9cf79521aa9d1e46ed2494cdbbed80723f6cb52c2937497f264bc146ed20d365`.
- C004.4–C006.1 célzott regresszió PASS; full regression nem futott; V001/V002/V003/tag/artifact változatlan; push NO.
- Riport: `docs/V004_C007_MULTI_TAB_COHERENCE_REPORT.md`.

`V004-C007 – MULTI-TAB COHERENCE PASS`
