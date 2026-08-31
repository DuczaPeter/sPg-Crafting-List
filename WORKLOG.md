# WORKLOG.md

Korábbi nyers napló byte-azonosan archiválva: `docs/archive/WORKLOG-through-V003-C012.5C2.md`.

## Aktuális ciklus

### V003-C012.5C3B1 Combined real pool metrics – 2026-08-31

- A Combined Materials két meglévő Quality-pool blokkja a C3A valódi allocation usage eredményét aggregálja; külön allocation-logika nem készült.
- Explicit Minimum/MAX részösszegek: required, reserved, mennyiséghiány, Quality-hiány; ANY/legacy csak a globális totalban marad.
- Eligible preview átfedhet, a fizikai inventory nem duplázódik; unresolved threshold fail-safe és exact canonical UUID megmaradt.
- C3B1 target + C3A/C2/C1/B/A + static/single-file + V001/V002 integrity PASS.
- Chrome `127.0.0.1:4184`: FR-86 happy path, Q550-only Quality-hiány, desktop/mobile overflow 0 és console WARN/ERROR 0/0 PASS.
- Felhasználói jóváhagyással csak az egyetlen FR-86 tesztkártya törölve. Inventory-only Stileron/Feynmaline, 3 batch, Q500/Q700 és eligible preview megmaradt; pool metrikák 0; fingerprint `ab900bdc → ab900bdc` reload után.
- C3B2/D/C013 nem indult; tag/release/push/main merge nincs. Visszaállás: a C3B1 checkpoint revertje; stabil fallback a változatlan V002.

### V003-C012.5C3A Pool Allocation + Max DB – 2026-08-31

- A C2 dropdown assignment az Allocation Engine közös effective policy-jába került. Precedence: recipe baseline, C012.3 legacy fallback, explicit slot pool inventory-korlát.
- `ANY_Q` nem gyengíti a recipe baseline-t; Minimum/MAX material threshold alsó korlát. Hiányzó threshold fail-safe `POOL_THRESHOLD_UNRESOLVED`.
- Pool thresholdnál lowest-eligible-first; legacy `HIGHEST_Q`, FIXED és UNKNOWN viselkedés megmaradt.
- Exact commodity/ingredient UUID bridge, Card-prioritás, per-card függetlenség és közös fizikai inventory/no-double-count PASS.
- FR-86: Q550 1,2 + Q750 1,9 SCU → SATISFIED/Max 1; csak Q550 3,1 SCU → Field Array insufficient Quality 1,9 SCU, Max 0.
- Targeted validator: C3A/C2/C1/B/A/C012.3, static/single-file és V001/V002 integrity PASS.
- Valódi Chrome `127.0.0.1:4183`: live dropdown recalculation, reload persistence, console WARN/ERROR 0/0 PASS.
- Felhasználói jóváhagyással az izolált Site Data törölve; 0 Card, 0 batch, 0 pool. Mutation-free fingerprint `9be961d3 → 9be961d3`.
- C3B/D/C013 nem indult; V003 tag/release/push/main merge nincs. Visszaállás: a C3A commit revertje; stabil fallback a változatlan V002.
