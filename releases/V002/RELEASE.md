# sPg Crafting List V002

Statusz: `V002 STABLE RELEASE – SINGLE-FILE RELEASE GATE PASS`

## Inditas

A futtathato alkalmazas pontosan egy fajl:

- `sPg Crafting List.html`

Masold tetszoleges mappaba, majd Windows 11 alatt nyisd meg aktualis Chrome-ban. Az alkalmazas kozvetlen `file://` modban mukodik.

Az alkalmazas futasahoz nem kell az `Info` mappa, kulon CSS, kulon JavaScript, a jelen `RELEASE.md` vagy a `SHA256SUMS.txt`.

## Acceptance

- Teljes M1-M6.1 + C04 regresszio: PASS.
- Valos Chrome `file://` manual gate: 13 PASS / 0 FAIL.
- Standalone Crafting Card export: PASS.
- IndexedDB/User Data kompatibilitas: PASS.
- Wiki API es UEX: PASS.
- Kulso stylesheet vagy helyi runtime sidecar: nincs.
- Application console/diagnostic error: 0.

## Integritas

Az egyetlen futtathato HTML SHA-256 erteke a `SHA256SUMS.txt` fajlban van. A kiadast a `V002` annotalt Git tag azonositja.
