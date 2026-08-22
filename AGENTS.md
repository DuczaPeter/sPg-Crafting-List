# AGENTS.md

Ez a projekt rovid, kreditkimelo Codex-munkaszabalya.

## Elso olvasasi sorrend

Minden uj munkamenet elejen, modositas elott:

1. `CODEX_START_HERE.md`
2. `STATUS.md`
3. `TASKS.md`
4. `PROJECT_MAP.md`
5. `WORKLOG.md` aktualis osszefoglaloja es legutobbi 10-20 bejegyzese

Csak akkor olvasd teljesen:

- `USED_SKILLS.md`: ha skillt hasznalsz vagy skillproblemat vizsgalsz.
- `TEST_COMMANDS.md`: modositas elotti/utani ellenorzeshez.
- `VERSIONING_RULES.md` es `VERSION.json`: kiadasi, egyfajlos HTML, repair-cycle vagy stabilitas feladatnal.
- `BROWSER_DIAGNOSTICS.md`: csak ha a projekt explicit browser-diagnostics modult hasznal.
- opcionalis szabalyfajlok: csak ha a feladat indokolja.

## Feladat elotti terv

Nem trivialis modositas elott ird le roviden:

```text
Modositom:
Nem modositom:
Ellenorzes:
```

## Kreditkimelo munkamod

- Ne olvasd vegig automatikusan az egesz projektet.
- Nagy fajlnal eloszor keress fuggvenynevre, hibaszovegre, komponensre vagy DOM-azonositora.
- Ne olvasd ujra ugyanazt a nagy fajlt, ha a lenyeg mar szerepel a statuszban, naploban vagy terkepben.
- Csak az aktualis feladathoz szukseges fajlokat nyisd meg.
- Tartsd roviden a valaszokat, hacsak a felhasznalo nem ker reszletet.
- A kozos `C:\Users\ganos\OneDrive\Munka\Codex\REUSABLE_SOLUTIONS.md` fajlbol eloszor csak az indexet nezd meg, reszletet csak relevans talalatnal.
- Browser-diagnostics hiba utan eloszor a `browser-diagnostics-summary.json` es `diagnostic-excerpt.txt` fajlt olvasd; teljes konzol/app logot csak celzottan.

## Projektvedelem

- Mukodo stabil vagy baseline allapotot kozvetlenul ne irj felul.
- Regi mukodo verziot ne torolj es ne nevezd at engedely nelkul.
- Le nem futtatott tesztet, deployt, pusht, live checket vagy stabil allapotot ne nevezz sikeresnek.
- Titkos adatot, tokent, jelszot vagy kulcsot ne irj valaszba, naploba, dokumentacioba vagy Gitbe.

## Javitasi ciklus es HTML verziozas

Egyfajlos HTML vagy repair-cycle projektben:

- Stabil `Vxxx.html` fajlt ne modosits kozvetlenul; dolgozz `Vxxx-dev` celverzion vagy kulon agon.
- Sikertelen probalkozasbol ne keszits uj vegleges HTML-verziot.
- Minden javitasi vagy tesztelesi kor kapjon ciklusazonositot: `Vxxx-C001`, `Vxxx-C002`.
- `tools/new-cycle.ps1 -Checkpoint` csak tiszta Git working tree-bol indulhat; ha mar van modositas, a script alljon meg es listazza a fajlokat.
- A checkpoint csak `VERSION.json`, `STATUS.md`, `WORKLOG.md` es az aktualis ciklus `test-artifacts/<version>-<cycle>/` mappajat stage-elheti.
- Tesztet `tests/test-plan.json` szerinti `TestId` vagy engedelyezett executable inditson; `Invoke-Expression` nem hasznalhato.
- Az alap repair-cycle nem gyujt valodi app logot vagy browser console-t; ezek `NOT_CAPTURED` allapotot kapnak.
- A `browser-diagnostics` modul valodi Playwright-alapu capture-t ad, de csak explicit modulvalasztas es projektlokalis fuggosegek eseten.
- Ha a tesztterv kotelezo logot ker, de nincs valodi capture, a ciklus nem lehet `PASS`.
- Uj vegleges `Vxxx` csak sikeres kiadasi kapu utan keszulhet.

## Browser Diagnostics

Csak explicit modul eseten:

- A futtato: `tools/run-browser-diagnostics.ps1`.
- A Playwright runner: `tools/browser-diagnostics-runner.mjs`.
- A minta config: `tests/test-plan.browser-diagnostics.json`.
- Hianyzo Node, npm, Playwright, bongeszo, szerver vagy kotelezo app-log hozzaferes eseten az eredmeny `BLOCKED`.
- A modul nem telepit fuggoseget automatikusan, nem futtat OCR-t, es nem torol artifactot automatikusan.

## Artifact megorzes

- Minden ciklus rovid summary fajlja maradjon.
- Az utolso sikeres ciklus teljes artifactja maradjon.
- Legfeljebb az utolso harom sikertelen ciklus teljes artifactja maradjon.
- Nagy logok es kepernyokepek alapbol ne keruljenek Gitbe.
- Automatikus artifact torles csak kulon explicit kapcsoloval tortenhet; az alap modul jelenleg nem torol.

## Opcionlis dokumentumok

Ne hozz letre extra szabalyfajlt csak megszokasbol. Csak akkor kell:

- `CHANGELOG.md`: kiadott, publikalt vagy verziozott projekthez.
- `VERSIONING_RULES.md`: stable/candidate/agazott, repair-cycle vagy fajlverzios projekthez.
- `BROWSER_DIAGNOSTICS.md`: csak explicit browser-diagnostics igenynel; nem automatikus `one-file-html` modul.
- `BACKUP_RESTORE.md`: adatbazis, migracio, eles adat vagy nehezen visszaallithato allapot eseten.
- `WORKING.lock.example`: tobb gep, kozos mappa vagy parhuzamos fejlesztes eseten.
- `DECISIONS.md`: az elso tartos, kesobb nem ujratargyalando dontes megjelenesekor.
- `SKILL_POLICY.md`: projekt-specifikus skill vagy internetes skill audit eseten.

## Munkamenet vege

Erdemi munka utan frissitsd:

- `STATUS.md`
- `TASKS.md`
- `WORKLOG.md`
- `USED_SKILLS.md`, ha skillt hasznaltal
- `TEST_COMMANDS.md`, ha uj ellenorzes szuletett
- `VERSION.json`, ha verzio, ciklus vagy kiadasi allapot valtozott
- `DECISIONS.md`, ha tartos dontes szuletett es a fajl mar letezik vagy most kell letrehozni

Mindig ird le roviden:

- mi valtozott;
- mely fajlok modultak;
- milyen ellenorzes futott;
- mi maradt ellenorizendo;
- hogyan lehet visszaallni.

## Engedelyhez kotott muveletek

Kulon felhasznaloi engedely kell tavoli push, publikacio, production vagy eles adatbazis, adatveszteses muvelet, fizetos muvelet, internetrol talalt uj skill telepitese, stabil tag, main merge, mas projekt vagy jovahagyatlan skill modositasa elott.