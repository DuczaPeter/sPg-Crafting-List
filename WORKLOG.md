# WORKLOG.md

Korábbi nyers napló byte-azonosan archiválva: `docs/archive/WORKLOG-through-V003-C012.5C2.md`.

## Aktuális ciklus

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
