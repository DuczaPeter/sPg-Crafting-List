# C04 file:// standalone export CSS javitas

Datum: 2026-08-24  
Ciklus: `V001-C012`  
Allapot: automatizalt es localhost `PASS`; a valos Chrome `file://` C04 kezi ujrateszt meg kotelezo

## Hiba

A felhasznaloi Chrome 151 `file://` acceptance C04 eredmenye 12 PASS / 1 FAIL volt. A CSS normalisan betoltodott, de a standalone export `readApplicationCss()` utvonala a `link.sheet.cssRules` olvasasakor `SecurityError` kivetelt kapott. A hibalanc:

`CSS_CSSOM_READ_FAILED -> EXPORT_FAILED -> TECHNICAL_CHECK_FAILED`

## Javitas

- A fo alkalmazas tovabbra is a kulon `Info/style.css` fajlt hasznalja.
- A `tools/sync-export-css-snapshot.mjs` a kozponti CSS pontos byte-tartalmabol base64 snapshotot general a fo HTML nem vegrehajthato `<template>` elemebe.
- A snapshot SHA-256 es byte-hossz metaadatot tartalmaz.
- `file://` alatt `readApplicationCss()` kozvetlenul ezt a generalt snapshotot olvassa; a tiltott CSSOM `cssRules` utvonalat nem probalja meg.
- Localhost/HTTP alatt a korabbi CSSOM, majd fetch mukodes maradt az elsodleges.
- A standalone export tovabbra is eltavolitja a Google Fonts importot, es helyi font fallbacket agyaz be.
- A `validate-baseline.ps1` minden regresszioban ellenorzi, hogy a snapshot byte-azonos-e az aktualis `Info/style.css` fajllal. CSS-valtozas utan a generator futtatasa kotelezo; drift eseten a kapu FAIL.

## Bizonyitek

- Kozponti CSS: 80 617 byte.
- SHA-256: `463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb`.
- C04 `file://` modellteszt: CSSOM `cssRules` olvasas 0, WARN 0, snapshot-egyezes PASS.
- HTTP modellteszt: CSSOM utvonal 1 olvasassal megmaradt.
- M1-M6 + M6.1 + C04 teljes regresszio: PASS.
- Chrome localhost technikai proba: 13/13 PASS; standalone export 107 KiB.
- User Data fingerprint: `e6d8dec8` elotte es utana.
- Chrome DevTools warning/error: 0.

## Release gate

A kodjavitas nem bizonyitja helyettesitokent a felhasznaloi valos `file://` kornyezetet. A manualis acceptance elso kovetkezo lepese a C04 ujrafuttatasa ugyanabban a normal Chrome kornyezetben, security flag es localhost workaround nelkul. C05 csak C04 PASS utan folytathato.

