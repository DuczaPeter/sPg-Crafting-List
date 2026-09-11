# STATUS.md

## Jelenlegi állapot

- Branch `develop/V004`; C007.1 input checkpoint `8b7efea...`; runtime `V004-dev`.
- Mining Loadouts add/edit/default/delete kétfüles durable signal+reread PASS; payloadban loadout adat nincs.
- Backup import az exact preview-base fingerprintet ugyanabban az IndexedDB-tranzakcióban ellenőrzi; eltérés `IMPORT_BASE_STATE_CHANGED`, nulla import/snapshot írás.
- Konkurens Complete, Undo és Mining Loadout mutation megmarad; automatikus retry nincs; friss preview utáni import és exact pre-import snapshot PASS.
- Backup schema `3`; C006.1 pristine `REPLACE` structural exact, extra revision `0`, data loss `0`.
- Valós Chrome BFCache inputhibája reprodukálva; persisted return után channel `READY`, durable reread PASS, listener `1`, duplicate `0`.
- C006.1 és C007 current-byte regresszió, C007.1 model/Chrome és automated direct `file://` PASS.
- Application SHA-256 `9fc09f1884feedcea64390f5f4ce34b37e9798bf823c78f7e840d51406427798`.
- Runtime fájl `1`, sidecar `0`, overflow/console error `0`; full regression és release gate nem futott; push NO.
- V001/V002/V003, V003 tag és stable artifact változatlan; riport: `docs/V004_C007_1_MULTI_TAB_USER_DATA_SAFETY_REPORT.md`.

`V004-C007.1 – MULTI-TAB USER-DATA SAFETY PASS, RELEASE-GATE READY`
