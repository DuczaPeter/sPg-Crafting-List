# V003-C016 Exact Manual file:// Gate Report

## Eredmény

`V003-C016 – EXACT MANUAL CANDIDATE file:// GATE PASS, REPLACEMENT V003 RELEASE GATE COMPLETE`

Ez dokumentáció-only evidence closure. Az eredmény a felhasználó által, közvetlen `file://` módban ellenőrzött exact C015 candidate-re vonatkozik; nem Codex browser automation eredménye.

## Exact candidate és integritás

- C015 checkpoint: `ea8a39ca972e53fbd778599090d69836544d2692`
- Fájl: `test-artifacts/V003-C015/fresh-release-candidate/sPg Crafting List V003 RC.html`
- Méret: `835820` byte
- SHA-256: `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`
- A fő application HTML és az RC byte-azonos: PASS
- Application code change C016-ban: `NO`
- RC change C016-ban: `NO`

## Felhasználó által igazolt direct file:// kapu

### M1 – Direct file startup: PASS

- Az application közvetlen `file://` módban betöltött, startup hiba nélkül.
- Application: `V003 · schema 6`.
- Footer: `V003 · cache schema 4`.

### M2 – Technical Probe: PASS

- Technical Probe: `15/15 PASS`, FAIL nélkül.
- Wiki API, IndexedDB és standalone ellenőrzés PASS.
- Runtime identity: `V003`.

### M3 – Titanium canonical picker: PASS

- Egyetlen Titanium picker opció.
- Canonical UUID: `64978449-1d87-4a16-ba55-4b5f94fee217`.
- A legacy batch törlése nem volt szükséges; az autofill meglévő User Data mellett is canonical maradt.

### M4 – Reload persistence: PASS

- F5 után az alkalmazás, a `V003` application/footer identity és az egyetlen Titanium picker identity megmaradt.
- A canonical Titanium UUID változatlan maradt.

### M5 – Backup runtime version: PASS

- A friss `file://` backupban `applicationVersion = "V003"`.
- `V003-dev` nem szerepelt benne.

### M6 – Diagnostic runtime version: PASS

- A felhasználó által kimásolt diagnosztikai logban `application.version = "V003"`.
- `V003-dev` nem szerepelt a logban.

### M7 – Standalone export: PASS

- A standalone HTML létrejött és megnyílt.
- A CSS embedded; nincs `Info` mappa-, `style.css`- vagy külön helyi JavaScript-függés.
- Az export önálló HTML-ként működött.

## Evidence reuse

Az exact candidate bytejai nem változtak. Emiatt a C015 teljes releváns automated regression PASS és Chrome localhost PASS evidence újrafuttatás nélkül továbbra is érvényes. C016-ban automated regression és Chrome localhost gate nem futott.

## Verzió- és release-integritás

- V001/V002: változatlan, PASS.
- Régi, pre-publication invalidált helyi V003 tag target: `045bd8ce38dde5e2ef43999a038c4d835d644b9a`, változatlan.
- Régi, invalidált `releases/V003/` artifact SHA-256: `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469`, változatlan.
- Replacement stable V003 release: még nincs.
- Push/main merge: nem történt.

## Következő lépés és visszaállás

A replacement V003 release gate teljes. A régi invalidált helyi V003 release leváltása külön, explicit engedélyezett release-cycle feladata. A C016 checkpoint normál revertje csak az evidence/meta dokumentációt állítja vissza; az application és az RC nem érintett.
