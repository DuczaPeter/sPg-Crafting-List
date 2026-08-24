# V1 STABLE RELEASE REPORT

Datum: 2026-08-24

Verzio: `V001`

Vegso ciklus: `V001-C014`

Tag: `V001`

## Release approval

`V1 STABLE RELEASE – APPROVED WITH ACCEPTED MANUAL TEST WAIVERS`

A felhasznalo kifejezetten elfogadta release-waiverkent a ket ki nem probalt manualis kaput. Ezek eredmenye tovabbra is `NOT TESTED`, nem PASS.

## Acceptance summary

- Automated regression: **PASS**
- Chrome C01-C17: **PASS**
- Standalone O01-O03, O05-O06: **PASS**
- O04: **NOT TESTED – ACCEPTED RELEASE WAIVER**
- Edge E01-E10: **NOT TESTED – ACCEPTED RELEASE WAIVER**
- User Data loss: **NO**
- Git: **CLEAN** a release commit es tag utan

Chrome User Data fingerprint:

- B = `2667ea55`
- C = `2667ea55`
- D = `2667ea55`

## Final automated verification

A `V001-C014` ciklusban a teljes `M1 -> M2 -> M3 -> M4 -> M5 -> M5.1 -> M6 -> M6.1 -> C04` csomag PASS.

- SC dataset: `4.9.0-LIVE.12232306`.
- Wiki–UEX mapping: `24 MATCHED / 50 UNMAPPED / 0 AMBIGUOUS` a C013 elo API-probe alapjan; a C014 determinisztikus M5/M5.1 regresszio PASS.
- Kozponti CSS/export snapshot: 80 617 byte, SHA-256 `463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb`, drift nincs.
- C04 file-modell: CSSOM-olvasas 0, warning 0; HTTP-modell megmaradt.
- Standalone export: embedded CSS, ervenyes snapshot JSON, kulso runtime/network dependency nelkul.

## Stable release bundle

- HTML: `releases/V001/sPg Crafting List.html`
- CSS: `releases/V001/Info/style.css`
- Integritas: `releases/V001/SHA256SUMS.txt`
- Hasznalat es waiver: `releases/V001/RELEASE.md`

SHA-256:

- HTML: `c422c4dabb3f60378de4a28c441ee8a79c9e180b8bf5853d46ab02a64a6ec259`
- CSS: `463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb`

A stabil bundle a kanonikus alkalmazas pontos masolata, kizarolag a harom `V001-dev` futasideju verziofelirat `V001` ertekre cserelesevel. Funkcionalis valtozas nem tortent.

## Git identification

- Release commit: a `V001` annotalt tag altal mutatott commit (`git rev-list -n 1 V001`).
- Tag: `V001`.
- Tavoli push vagy publikacio nem tortent.

## Restore

A stabil allapot visszaallithato a `V001` tagbol, vagy kozvetlenul a `releases/V001/` ketfajlos bundle masolasaval. A fejlesztesi forras es a korabbi ciklusartifactok megmaradtak.
