# V002 STABLE RELEASE REPORT

Datum: 2026-08-24

Verzio: `V002`

Vegso ciklus: `V002-C002`

Tag: `V002`

## Release approval

`V002 STABLE RELEASE – SINGLE-FILE RELEASE GATE PASS`

A felhasznalo kifejezetten engedelyezte a stabil V002 release commitot es az annotalt `V002` taget. Release-waiver nincs.

## Acceptance summary

- Teljes M1-M6.1 + C04 regresszio: **PASS**.
- V002 single-file release gate: **PASS**.
- Valos Chrome `file://` manual gate: **13 PASS / 0 FAIL**.
- Chrome localhost application warning/error: **0**.
- Valos `file://` diagnostic error: **0**.
- Standalone Crafting Card export: **PASS**.
- IndexedDB/User Data kompatibilitas: **PASS**; a stabil fajl a tesztelt forrastol csak a harom verziojelolesben ter el.
- Wiki API: **PASS**, JS-300 HTTP 200, 3 recipe slot, SC `4.9.0-LIVE.12232306`.
- UEX API: **PASS**, HTTP 200, 215 refinery rekord, Authorization fejlec nelkul.
- V001 tag es fagyasztott bundle: **VALTOZATLAN**.

## Stable release artifact

A felhasznaloi alkalmazas pontosan egyetlen futtathato fajl:

- `releases/V002/sPg Crafting List.html`

Az alkalmazas futasahoz nem kell `Info` mappa, kulon CSS, kulon JavaScript, build folyamat vagy mas helyi sidecar. A release mappaban levo `RELEASE.md` es `SHA256SUMS.txt` csak repository-dokumentacio; egyik sem runtime-fuggoseg.

- HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`.
- HTML fajlmeret: `489 492` byte.
- Runtime verziojeloles: `V002`.
- Helyi runtime sidecar: `0`.

## Release-integritas

A `tools/verify-v002-release.mjs` ellenorzi:

- a release mappa megengedett fajlkeszletet;
- az egyetlen HTML artifactot;
- a `V002-dev -> V002` verzio-only transzformaciot;
- az embedded CSS/JavaScript es sidecar-mentes markup integritasat;
- a SHA256SUMS egyezest;
- a Chrome localhost es valos `file://` acceptance-bizonyitekot;
- az IndexedDB, API es standalone export kodutvonalak megorzeset.

A `tools/validate-v002-release.ps1` ezen felul ujrafuttatja a teljes regressziot, az elo Wiki/UEX probat es a V001-integritasellenorzest.

## Git identification

- Release commit: az annotalt `V002` tag altal mutatott commit (`git rev-list -n 1 V002`).
- Tag: `V002`.
- Tavoli push, publikacio vagy main merge nem tortent.

## Restore

A V002 stabil allapot visszaallithato a `V002` tagbol vagy kozvetlenul a `releases/V002/sPg Crafting List.html` egyetlen fajl masolasaval. A V001 tovabbra is elerheto a valtozatlan `V001` tagbol es `releases/V001/` bundle-bol.
