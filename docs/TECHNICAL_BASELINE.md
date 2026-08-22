# V001 technikai baseline

Datum: 2026-08-22

## Megvalositva

- Kanonikus fo alkalmazas: `sPg Crafting List.html`.
- Kozponti kulso stilus: `Info/style.css`.
- `SCWikiAdapter`: timeout, korlatozott retry, HTTP/JSON/schema diagnosztika.
- `AppDatabase`: elkulonitett game- es user-data IndexedDB store-ok.
- Tranzakcios default game-version frissites staging rekorddal.
- JS-300 blueprint normalizalas recipe slot bontasban.
- Quality capability: `DYNAMIC`, `FIXED`, `UNKNOWN`.
- Pontos SCU helper: `1 SCU = 10 000` belso egesz egyseg.
- RAM-alapu process log, lezart blokkonkenti sessionStorage iras.
- Globalis `window.onerror` es `unhandledrejection` kezeles.
- Standalone export builder beagyazott CSS-sel es tavoli fontimport nelkul.
- Egykattintasos, hetlepeses `Technikai proba`.

## Bizonyitott

- `V001-C001` `baseline-static`: PASS.
- Chrome localhost proba: 7/7 PASS.
- Aktualis Wiki API default game version: `4.9.0-LIVE.12232306`.
- JS-300: 3 recipe slot, 1 `DYNAMIC`, 2 `FIXED`.
- IndexedDB iras/visszaolvasas es ujratoltes utani perzisztencia: PASS.
- Standalone export string: kulso stylesheet nelkul, beagyazott CSS-sel, tavoli CSS-import nelkul.
- Chrome konzol warning/error: 0.
- Desktop es 390 px mobil vizualis ellenorzes: PASS.

## Meg nem bizonyitott

- Kozvetlen `file://` Chrome/Edge proba. Az automatizalt Chrome-felulet biztonsagi szabaly miatt helyi fajl URL nem nyithato meg.
- A bongeszo altal tenylegesen letoltott exportfajl kulon offline megnyitasa; a builder tartalma es az alkalmazas exportfolyamata PASS, a letoltesi esemenyt az automatizalt Chrome-kapcsolat nem adta vissza.
- Edge kulon regresszio.

## Kezi file-kapu

1. Nyisd meg a `sPg Crafting List.html` fajlt aktualis Chrome-ban vagy Edge-ben.
2. Kattints a `Technikai proba` gombra.
3. Elvart: minden sor `PASS`, a futtatasi mod `Kozvetlen file:// futas`.
4. Futtasd a `Standalone tesztexport` muveletet, majd internet nelkul nyisd meg az exportalt HTML-t.

Amig ez nem tortent meg, a baseline fejlesztesi allapot, nem stabil kiadas.
