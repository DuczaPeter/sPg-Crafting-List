# WORKLOG.md

Korábbi aktuális napló archiválva: `docs/archive/WORKLOG-V003-C013.6.md`.

## Aktuális ciklus

### V003-C013.7 User-Data-Independent Canonical Picker Repair – 2026-09-08

- Baseline: `87ae7d18aaa2bf3020654bc79ada433f6c8771a6`; a C013.6 exact manual kapun talált blocker miatt az RC BLOCKED/INVALIDATED lett, HTML-je változatlan.
- Gyökérok: a fizikailag hiányzó source rekord `refinedVersion.uuid` relationje kimaradt az identity graphból, így egy legacy User Data batch külön picker identityként visszaszivároghatott.
- Javítás: exact refined-version source relation és explicit canonical authority; User Data csak provenance/batch source, bizonyított canonical UUID-t nem írhat felül.
- Feynmaline, Titanium, Tungsten és Gold picker canonical UUID-ja legacy batch nélkül és mellett azonos: PASS.
- Titanium legacy Q784 megmaradt; canonical Q866/Q920 batch-ekkel `1` logical material / `3` batch, reload és backup/restore PASS.
- My Materials grouping, Combined/Allocation parity, no-double-reserve, no-fuzzy és unresolved duplicate fail-safe PASS.
- C013.7 célkapu és C013.5/C013.3/C012.5A/M2/M4 regresszió PASS; teljes release-regresszió és Chrome scope szerint nem futott.
- V001/V002 változatlan; V003 tag/release/push/main merge nincs; friss RC külön ciklusban szükséges.
- Visszaállás: a C013.7 checkpoint commit revertje; stabil fallback a változatlan V002.
