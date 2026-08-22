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
- Egykattintasos, tizlepeses `Technikai proba`, benne tranzakcios rollback-, determinisztikus M2 allocation- es M3 mining modell-ellenorzessel.
- M1 verziozott raw/normalizalt blueprint index- es reszlet-cache.
- Lapozott Blueprint Browser, API-facetekkel es lusta teljes receptbetoltessel.
- Globalis Quality batch inventory es sorrendezheto Crafting Card User Data.
- Slotonkenti, tervezesi modu Allocation Engine reszletes batch-dontesi trace-szel.
- Tranzakcios raw/normalizalt Mining Game Data cache, dinamikus API-facetek es occurrence → spawn → maximum Quality rangsor.
- Perzisztens mining loadoutok dinamikus station-, module- es gadgetkezeléssel, USER_OVERRIDE es deprecated equipment jelolessel.

## Bizonyitott

- `V001-C001` `baseline-static`: PASS.
- Korabbi Chrome localhost M1 proba: 8/8 PASS; M2 helyi Chromium proba: 9/9 PASS.
- Aktualis Wiki API default game version: `4.9.0-LIVE.12232306`.
- JS-300: 3 recipe slot, 1 `DYNAMIC`, 2 `FIXED`.
- IndexedDB iras/visszaolvasas es ujratoltes utani perzisztencia: PASS.
- Standalone export string: kulso stylesheet nelkul, beagyazott CSS-sel, tavoli CSS-import nelkul.
- Chrome konzol warning/error: 0.
- Desktop es 390 px mobil vizualis ellenorzes: PASS.
- M1 index: 1591 blueprint 8 API-laprol; kikenyszeritett tranzakcios frissites es ujratoltes utani cache-visszaallitas PASS.
- Hofstede-S1 vegyes `SCU`/`ITEM` recept, raw/normalizalt elkulonites, provenance es User Data rekordszam-megorzes PASS.
- M2: Q517 HP_MIN_500 valasztas, Highest/Target Q, ketkartya-prioritas, IndexedDB reload es teljes User Data fingerprint-megorzes PASS.
- M3: 72 commodity, 14 vehicle, 20 head, 28 module, 6 gadget; 17/17 regresszio, 5000 location 44–45 ms, teljes loadout/User Data fingerprint-megorzes PASS.
- Aktualis Chrome localhost technikai proba: 10/10 PASS; M3 desktop UI es dinamikus 1/3/5 station/module elrendezes PASS; konzol warning/error 0.

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
