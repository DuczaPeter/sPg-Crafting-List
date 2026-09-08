# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`; C013.7 baseline: `87ae7d18aaa2bf3020654bc79ada433f6c8771a6`; stabil fallback: változatlan `V002`.
- Aktuális ciklus: `V003-C013.7`; User Data-tól független, exact canonical material picker repair: **PASS**.
- Gyökérok: az aktív commodity `refinedVersion.uuid` relationje kimaradt az identity graphból, ha a source rekord nem volt külön jelen; egy legacy batch emiatt külön picker identityvé válhatott.
- Canonical authority: verified exact API relation → canonical commodity record → verified source relation → User Data provenance; User Data bizonyított canonical UUID-t nem írhat felül.
- Feynmaline, Titanium, Tungsten és Gold legacy-batch nélküli/melletti canonical invariance: **PASS**; fuzzy/name-only merge továbbra sincs.
- Titanium: legacy Q784 megmaradt, canonical Q866 és Q920 hozzáadható; `1` logical material / `3` batch, provenance/reload/backup **PASS**.
- C013.7 + C013.5 + C013.3 + C012.5A + M2 + M4 célzott validatorlánc, Combined/Allocation/no-double-reserve és V001/V002 integritás: **PASS**.
- Teljes release-regresszió és Chrome gate: scope szerint **NOT RUN**; friss RC külön későbbi ciklusban szükséges.
- C013.6 RC: **BLOCKED / INVALIDATED**; HTML változatlan, SHA-256 `4489a48ff50e6652b89684dce522e35203557e33753d73b1c98aa5588193a7ed`.
- V003 tag/release/push/main merge nincs.
- Riport: `docs/V003_C0137_USER_DATA_INDEPENDENT_CANONICAL_PICKER_REPORT.md`.

`V003-C013.7 – USER-DATA-INDEPENDENT CANONICAL PICKER REPAIR PASS, FRESH RC REQUIRED`
