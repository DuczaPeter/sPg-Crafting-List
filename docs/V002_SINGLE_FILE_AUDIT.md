# V002 egyfajlos alkalmazas audit es terv

Datum: 2026-08-24

Celverzio: `V002-dev`

## Audit

A V001 futasideju CSS-fuggesei:

1. A fo HTML `<link rel="stylesheet" href="Info/style.css">` elemmel tolti a feluletet.
2. Ugyanez a CSS base64 snapshotkent masodszor is szerepel a HTML-ben a `file://` exporthoz.
3. A `readApplicationCss()` CSSOM, fetch, embedded snapshot es IndexedDB cache kozul valaszt.
4. A baseline, M6, M6.1 es C04 tesztek kozvetlenul olvassak az `Info/style.css` fajlt.
5. A snapshot generator kulon forras- es masolatdriftet kezel.
6. A CSS Google Fonts `@import` hivatkozast tartalmaz, amely nem helyi fajl, de a vizualis reteget kulso halozati eroforrashoz koti.

## Biztonsagos V002 architektura

- Egyetlen kanonikus CSS-forras lesz: `<style id="spgApplicationStyles" data-source="embedded">` a fo HTML-ben.
- Nem marad kulso stylesheet link, base64 CSS-template, CSSOM-olvasas, CSS-fetch vagy CSS-cache fallback.
- A `readApplicationCss()` ugyanazt a style blokkot olvassa, amely a fo feluletet megjeleniti; a standalone kartyaexport ezt kapja meg.
- A Google Fonts import eltunik, a mar meglevo Arial/Helvetica/sans-serif fallback marad.
- A korabbi snapshot/drift generator helyett statikus embedded-CSS integritasellenorzes keszul. Mivel csak egy forras van, ket forras kozti drift tobbe nem letezhet.
- A baseline, M6, M6.1 es C04 tesztek a HTML-bol olvassak a CSS-t.
- Kulon teszt masolja a fo HTML-t egy ures ideiglenes mappaba, es bizonyitja, hogy helyi mellekfajl nelkul is teljes a dokumentumstruktura.

## Megorzesi hatar

- A `V001` tag, release commit es `releases/V001/` bundle valtozatlan marad.
- A gyoker `Info/` mappa referencia- es V001-fejlesztesi forraskent megmaradhat a repositoryban, de a V002 alkalmazas futasahoz nem hasznalhato es nem szukseges.
- IndexedDB schema, User Data, API-adapterek, allocation, backup/import es minden V001 funkcionalis modell valtozatlan marad.

## Ellenorzesi terv

1. Egyfajlos statikus kapu: nincs helyi stylesheet/script/image dependency; embedded CSS teljes es kulso fontimport nelkuli.
2. Teljes M1-M6.1 regresszio.
3. Uj C04 single-file CSS/export modellteszt file es HTTP protokollszimulacioval.
4. Standalone JS-300 export es snapshot JSON ellenorzes.
5. Valos Chrome `file://`: HTML egy ures mappabol, API-k, IndexedDB reload, technikai proba, export es console error = 0.

## Megvalositasi eredmeny

Az audit szerinti egyforrasos embedded architektura megvalosult. A `V002-C001` teljes regresszio PASS, a Chrome localhost kiegeszito proba 13/13 PASS es nulla konzolhiba. A valos Chrome `file://` navigaciot az automatizalasi URL-policy blokkolta, ezert ez a pont kezi kapukent `NOT TESTED` maradt; reszletes atadas: `docs/V002_SINGLE_FILE_REPORT.md`.
