# VERSIONING_RULES.md

## Cel

A legutolso mukodo allapot mindig visszaallithato maradjon, de sikertelen javitasi probalkozasokbol ne keszuljon uj vegleges kiadasi fajl.

## Implementalt

- Haromszintu stabil/dev/ciklus verziozasi szabaly.
- `repair-cycle` alapmodul: ciklusazonosito, rovid artifactok, `VERSION.json`, `STATUS.md`, `WORKLOG.md` frissites.
- Biztonsagosabb Git checkpoint: `-Checkpoint` csak tiszta Git working tree-bol indulhat, es csak dokumentalt pathspec-eket stage-elhet.
- `tests/test-plan.json` alapu engedelyezett tesztinditas `Invoke-Expression` nelkul.
- `NOT_CAPTURED` allapot, ha app log vagy browser console nincs tenylegesen begyujtve.

## Opcionlis

- `browser-diagnostics`: kulon modul a jovobeli Chrome/Playwright/app-log diagnosztikahoz. Nem resze automatikusan a `one-file-html` profilnak.

## Tervezett, meg nem implementalt

- Valodi Chrome vagy Playwright futtato.
- Valodi alkalmazaslog export a bongeszobol.
- Valodi browser console capture.
- Automatikus artifact torles retention szabaly alapjan.

## Git es stabilitas

- `main`: ellenorzott stabil allapot, ha a projekt ezt hasznalja.
- `develop/Vxxx`, `candidate/...`, `work/...`, `feature/...` vagy `fix/...`: aktualis munka.
- Ne hasznalj force pusht, tortenetatiro rebase-t vagy meglevo tag felulirasat.
- Tavoli push, publikacio, main merge es stable tag kulon engedelyhez kotott.

## Haromszintu verziozas

1. Stabil kiadas: a tenylegesen hasznalt, ellenorzott fajl, peldaul `Projekt V137.html`.
2. Fejlesztesi celverzio: a kovetkezo kiadas munkafajlja, peldaul `Projekt V138-dev.html`.
3. Javitasi ciklus: tesztelheto allapot az aktualis celverzion belul, peldaul `V138-C001`.

Sikertelen korbol ne legyen `V139.html`, `V140.html` vagy `final-jo.html`. A ciklusokat checkpoint es `test-artifacts/` naplo azonositsa.

## Egyfajlos HTML projektek

- Mukodo stabil HTML-kiadast ne irj felul.
- Jelentos munka elott dolgozz `Vxxx-dev` fajlon vagy kulon fejlesztesi agon.
- A regi stabil verzio maradjon erintetlen a `releases/` mappaban vagy a projekt eddigi stabil helyen.
- A legutolso stabil verzio, aktualis celverzio es aktualis ciklus legyen rogzitve a `STATUS.md` es `VERSION.json` fajlban.

## Javitasi ciklus

Minden javitasi vagy tesztelesi kor kapjon egyedi azonosito ciklust: `Vxxx-C001`, `Vxxx-C002`, `Vxxx-C003`.

Kotelezo cikluslepesek:

1. Ellenorizd a rovid allapotot: `STATUS.md`, `VERSION.json`, relevans `WORKLOG.md` resz.
2. Modositsd csak az aktualis hiba javitasahoz szukseges kodot.
3. Futtasd a ciklust a `tools/new-cycle.ps1` scripttel.
4. Tesztet csak `tests/test-plan.json` szerinti `TestId` vagy engedelyezett executable indithat.
5. Mentsd a rovid tesztosszefoglalot es a `NOT_CAPTURED` diagnosztikai allapotot a ciklus mappajaba.
6. Zarj `PASS`, `FAIL`, `BLOCKED` vagy `PENDING` eredmennyel.
7. `PASS` utan futtasd a kapcsolodo regressziot; teljes regresszio csak kiadasi kapuhoz vagy kozos kod erintesekor kotelezo.

`-Checkpoint` modban a ciklus csak tiszta Git working tree-bol indulhat. Ha mar van modosult, uj vagy torolt fajl, a script megall, listazza a fajlokat, es nem commitol, nem torol, nem resetel, nem stash-el.

## Log es tesztadat

- Az alap `repair-cycle` nem gyujt valodi app logot es nem gyujt browser console-t.
- Amig nincs valodi begyujtes, `app-log.json` es `browser-console.log` egyertelmuen `NOT_CAPTURED` allapotot tartalmaz.
- A `test-summary.json` jelzi: `appLogCaptured`, `browserConsoleCaptured`, `captureRequired`, `missingCaptures`.
- Ha a tesztterv kotelezo logot ir elo, de nincs valodi begyujtes, a ciklus nem lehet `PASS`; `BLOCKED` vagy `FAIL` lesz.
- A HTML alkalmazas opcionalsan keszulhet gepileg olvashato diagnosztikai objektummal vagy JSON log exporttal, de ehhez kulon browser runner kell.

## Artifact megorzes

- Minden ciklus rovid `test-summary.json` fajlja maradjon meg.
- Az utolso sikeres ciklus teljes artifactja maradjon meg.
- Legfeljebb az utolso harom sikertelen ciklus teljes artifactja maradjon meg.
- A regebbi nagy artifactok archivalhatok vagy torolhetok.
- Nagy logok es kepernyokepek alapbol ne keruljenek Gitbe.
- Automatikus torles csak kulon, explicit kapcsoloval tortenhet; az alap `repair-cycle` jelenleg nem torol artifactot.

## Kiadasi kapu

Uj vegleges `Vxxx` csak akkor keszulhet, ha:

- a celzott teszt sikeres;
- a kapcsolodo regresszio sikeres;
- a kotelezo teljes regresszio sikeres, ha a projekt eloirt ilyet;
- a valoban begyujtott alkalmazaslogban nincs megmagyarazatlan `ERROR`, ha app log capture engedelyezett;
- a valoban begyujtott browser console tiszta, ha browser diagnostics engedelyezett;
- UI valtozasnal vizualis ellenorzes tortent;
- a stabil verzio nem lett felulirva;
- a `STATUS.md`, `WORKLOG.md` es ha van, a `CHANGELOG.md` frissult;
- a kiadas commitja, tagje vagy hash erteke rogzult.

## Dokumentalas

Verziozas szempontjabol fontos munka utan frissuljon a `STATUS.md`, `TASKS.md`, `WORKLOG.md`, `VERSION.json`, es ha van, a `CHANGELOG.md`.