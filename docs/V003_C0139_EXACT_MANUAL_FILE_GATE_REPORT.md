# V003-C013.9 Exact Manual file:// Gate Report

## Eredmény

`V003-C013.9 – EXACT MANUAL CANDIDATE file:// GATE PASS, V003 RELEASE GATE COMPLETE`

Ez dokumentáció-only checkpoint. A böngészős ellenőrzést a felhasználó végezte közvetlen `file://` módban; nem Codex automation. Application code és release candidate nem változott.

## Vizsgált exact candidate

- C013.8 checkpoint: `4b51db7c797ddc5705e03509b19e749149f835a9`
- Fájl: `test-artifacts/V003-C013.8/fresh-release-candidate/sPg Crafting List V003 RC.html`
- Méret: `835832` byte
- SHA-256: `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469`
- Futtatás: közvetlen `file://`

## Felhasználó által igazolt manuális eredmények

1. M1 Direct file startup — PASS: az alkalmazás betöltött, startup hiba nélkül, működő státuszokkal.
2. M2 Titanium canonical picker legacy batch mellett — PASS: egyetlen Titanium opció; `07570c9f-...` legacy UUID mellett az autofill `64978449-1d87-4a16-ba55-4b5f94fee217`, törlés nélkül.
3. M3 Új Titanium Quality batch — PASS: Q920 / 0.1000 SCU hozzáadható volt; egy logical Titanium maradt, canonical UUID-val.
4. M4 Reload persistence — PASS: legacy és Q920 batch, egy logical material és canonical picker autofill megmaradt.
5. M5 Combined Materials parity — PASS: egy logical Titanium, nincs duplicate card vagy látható double count.
6. M6 Feynmaline picker — PASS: egy opció, canonical UUID `7310c15d-359c-42b4-b61e-7da3d0da3384`.
7. M7 Tungsten picker — PASS: egy opció, canonical UUID `addc9aa4-5d2d-4c0d-b01b-ad2b2e50a5d6`.
8. M8 Gold picker — PASS: egy opció, canonical UUID `57aba429-cf97-4fdd-8042-94b1d643f5bd`.
9. M9 Technical Probe — PASS: `15/15`, direct file, Wiki API, IndexedDB és standalone ellenőrzés PASS, FAIL nélkül.
10. M10 Backup — PASS: JSON letöltés, visszaválasztás és read-only Import Preview működött; import apply nem futott.
11. M11 Standalone export — PASS: HTML létrejött és megnyílt, embedded CSS-sel, helyi runtime sidecar vagy Info mappa nélkül.
12. M12 Tesztadat-takarítás — PASS: a manuális Q920 / 0.1000 SCU Titanium tesztbatch törölve; valódi batch-ek megmaradtak, egy logical Titanium és a canonical picker UUID változatlan.

## Újrafelhasznált bizonyíték

- A C013.8 teljes automated regression PASS eredménye újrafuttatás nélkül érvényes, mert az application HTML és az exact candidate byte-változatlan.
- A C013.8 Chrome localhost PASS eredménye újrafuttatás nélkül érvényes ugyanezen változatlan candidate-re.
- Application code change: `NO`.
- RC change: `NO`.
- V001/V002: változatlan.
- C013.6 invalidált RC: változatlan.

## Release állapot

Az exact candidate automated, Chrome localhost és manuális `file://` release gate-je teljes. Stabil V003 release/tag még nincs; push vagy main merge nem történt. A stabil kiadás külön felhasználói engedélyt és release-ciklust igényel.

## Visszaállás

A C013.9 dokumentációs checkpoint revertjével a repository visszaáll a változatlan `4b51db7c797ddc5705e03509b19e749149f835a9` C013.8 checkpoint állapotára; az RC bytejai ettől függetlenül nem változnak.
