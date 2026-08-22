# USED_SKILLS.md

Ebben a fajlban roviden vezesd, mely Codex skillek segitettek a projektben. Csak akkor olvasd teljesen, ha skillt hasznalsz, skillt javitasz, vagy skillproblemat vizsgalsz.

## Format

- Skill neve:
- Mikor hasznaltuk:
- Mire segitett:
- Mely fajlokat vagy donteseket erintett:
- Kell-e kesobb tanulsagot visszairni a skillbe: igen/nem

## Kezdo allapot

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-22`, a projekt inditasakor.
- Mire segitett: a karcsu `one-file-html` projektvaz, verziozas es javitasi ciklus letrehozasara.
- Mely fajlokat vagy donteseket erintett: a teljes indulasi mappastrukturat, a vezirlo dokumentumokat, a `V001-dev` celverziot es a `releases/` kiadasi helyet.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem, jelenleg nincs uj altalanos tanulsag`.

## Chrome baseline ellenorzes

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-22`, a technikai baseline valos Chrome-ellenorzesekor.
- Mire segitett: localhost API/IndexedDB/export proba, konzolhiba-ellenorzes, desktop es 390 px mobil vizualis ellenorzes.
- Mely fajlokat vagy donteseket erintett: `docs/TECHNICAL_BASELINE.md` es `test-artifacts/V001-C001/browser-manual-summary.json`; a `file://` automatizalt tesztje biztonsagi korlat miatt kezi kapu maradt.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem; nincs user-owned skillmodositasra alkalmas altalanos tanulsag`.

## Chrome M1 regresszio

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-22`, az M1 verziozott cache es Blueprint Browser valos bongeszos kapujanal.
- Mire segitett: 1591 rekordos lapozott cache-frissites, IndexedDB-perzisztencia, rollback, Hofstede-S1 lazy load, API-filter, konzol es responsive UI ellenorzes.
- Mely fajlokat vagy donteseket erintett: `docs/M1_REPORT.md`, `docs/TECHNICAL_BASELINE.md`; a `file://` kapu tovabbra is kezi maradt.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M2 projektfolytatas

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-22`, az M2 inventory es Allocation Engine megvalositasakor.
- Mire segitett: haromsoros modositas elotti terv, kis kontextusu projektterkep, M2 related-regression es `V001-C004` javitasi ciklus.
- Mely fajlokat vagy donteseket erintett: `TEST_COMMANDS.md`, `tests/test-plan.json`, `STATUS.md`, `WORKLOG.md`, `VERSION.json` es az M2 artifactok.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M2 bongeszos regresszio

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-22`, a helyi M2 UI, IndexedDB es Game Data/User Data hatar ellenorzesekor.
- Mire segitett: JS-300 es S00 Hofstede valos blueprint, tobb kartya, Quality batch, Target Q perzisztencia, 1591 rekordos sync, 9/9 technikai kapu, desktop es 390 px mobil nezet.
- Mely fajlokat vagy donteseket erintett: `docs/M2_REPORT.md`, `docs/TECHNICAL_BASELINE.md` es `test-artifacts/V001-C004/browser-manual-summary.json`.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## M3 projektfolytatas

- Skill neve: `uj-projekt`
- Mikor hasznaltuk: `2026-08-22`, az M3 Mining Game Data, location rangsor es loadout rendszer megvalositasakor.
- Mire segitett: haromsoros modositas elotti terv, feladatfokuszu fajlolvasas, M3 related-regression es `V001-C005` javitasi ciklus.
- Mely fajlokat vagy donteseket erintett: `TEST_COMMANDS.md`, `tests/test-plan.json`, `STATUS.md`, `WORKLOG.md`, `VERSION.json`, `docs/M3_REPORT.md` es az M3 artifactok.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.

## Chrome M3 regresszio

- Skill neve: `chrome:control-chrome`
- Mikor hasznaltuk: `2026-08-22`, a valos Mining API-cache, IndexedDB loadout es dinamikus UI ellenorzesekor.
- Mire segitett: 72/14/20/28/6 API-index, Agricium/Aphorite location es signature, MOLE/Prospector, Helix II/Arbor MH1, default loadout, USER_OVERRIDE, fingerprint, 10/10 probe, konzol es desktop layout ellenorzese.
- Mely fajlokat vagy donteseket erintett: `docs/M3_REPORT.md`, `docs/TECHNICAL_BASELINE.md` es `test-artifacts/V001-C005/browser-manual-summary.json`.
- Kell-e kesobb tanulsagot visszairni a skillbe: `nem`.
