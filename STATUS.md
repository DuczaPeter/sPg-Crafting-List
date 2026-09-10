# STATUS.md

## Jelenlegi állapot

- Branch `develop/V004`; C005 input checkpoint `99744c3...`; runtime `V004-dev`.
- Crafting Listen belül elkészült az `Aktív Craftok | Craft History` presentation-only tab; default Aktív Craftok, sidebar-modul nincs.
- History exact eredeti `craftingCardId` szerint csoportosít. Group/event sorrend elsődlegesen `historySequence DESC`, legacy timestamp + stabil nem-locale fallback.
- A group full completion után is megmarad. `COMPLETED → Kész`, `UNDONE → Visszavonva`; unknown és legacy fail-closed, bizonyítatlan craft-run összeg nélkül.
- Expanded event kizárólag tárolt evidence-et mutat: identity, transaction, craft-run/remaining, timestamp, version/hash/revisions és külön material/Q/batch/canonical/source/exact integer delta sorok. Aktuális Card/Inventory/live API/renormalizálás nem History-truth.
- Omnisky production Chrome: 21 → partial 5 (`18000/35/35` unit) → 16 → Reallocate → full 16; egy group, két event 2,1 sorrendben, total 21, Card eltűnt, batch maradék 1/1/1, loss 0.
- History tab + group/event expand + visszaváltás: durable write 0; revision/allocation/reservation változás 0. Reload, multi-group/status/legacy, keyboard és 1920×1080/390×844 overflow 0 PASS.
- C004.4 model/production Chrome completion regresszió, automated direct `file://`, single-file és protected V003 kapu PASS. History delete/Undo/Redo NOT IMPLEMENTED; C006 NOT STARTED.
- Application SHA-256 `fd37d3a951e95266a15e8807fd09d4dc477351897a60060b59375062f65b3569`; runtime fájl 1, sidecar 0; full regression nem futott; push NO.
- Riport: `docs/V004_C005_CRAFT_HISTORY_UI_REPORT.md`.

`V004-C005 – CRAFT HISTORY UI PASS, C006 READY`
