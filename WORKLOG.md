# WORKLOG.md

Korábbi nyers napló byte-azonosan archiválva: `docs/archive/WORKLOG-through-V003-C012.5C2.md`.

## Aktuális ciklus

### V003-C012.5D2A Integrated Chrome localhost gate – 2026-09-01

- Izolált `127.0.0.1:41986` originen FR-86 happy és Q550-only Quality-shortage, exact Card-kötés, per-card assignment, Combined/Max paritás és reload PASS.
- Standalone read-only snapshot PASS; 1920/1366/390 px overflow 0; Chrome console WARN/ERROR 0/0. Exact kézi `file://` NOT RUN.
- Nulla Card mellett inventory-only/canonical material útvonal PASS.
- Felhasználói jóváhagyással kizárólag a D2A tesztadatok törölve; import preview csak a `user:materialQualityPools` setting egy törlését mutatta.
- Teardown után minden User Data store 0; mutation-free fingerprint `9be961d3 → 9be961d3`; SC 4.10 és UEX 215 rekord Game Data cache megmaradt.
- Application code nem változott; D1 automated backup/restore evidence újrahasznosítva. D2B/C013 nem indult, tag/release/push/main merge nincs.
- Visszaállás: a D2A checkpoint revertje; stabil fallback a változatlan V002.

### V003-C012.5D1 Integrated automated gate – 2026-09-01

- Egyetlen FR-86 integrált fixture bizonyítja a Final Card, Crafting List, Allocation, Combined, Max DB és standalone paritását happy és Q550-only shortage állapotban.
- Legacy C012.3, ANY_Q + HP_MIN_500, unresolved fail-safe, kétkártyás priority/no-double-count, exact UUID és recipe delete/inventory-only PASS.
- Backup/restore visszaadta az inventoryt, Q500/Q700 thresholdot, slot assignmentet és allocationt; régi backup pool/assignment nélkül LEGACY_FALLBACK.
- Direkt C012.5 A/B/C1/C2/C3A/C3B1/C3B2, C012.3/C012.4, M4, M6, static/single-file és V001/V002 integrity PASS.
- Két harness-only javítás: M2 betölti a C012.5 canonical dependency blokkokat; M6 az aktuális unresolved fail-safe feliratot várja. Application HTML nem változott.
- Chrome/localhost/User Data nem indult; ez D2. Régi tesztek újragenerált artifact-zaja baseline-ra visszaállítva.
- D2/C013 nem indult; tag/release/push/main merge nincs. Visszaállás: a D1 checkpoint revertje; stabil fallback a változatlan V002.

### V003-C012.5C3B2 Standalone effective Quality – 2026-09-01

- A standalone Final Card külön presentation projectiont kapott a már feloldott C3A allocation/Quality snapshotból; recomputation, dropdown, editor és User Data írás nincs.
- Minimum/MAX, baseline > pool, ANY, legacy FIXED és unresolved fail-safe megjelenítés PASS.
- FR-86 Q550-only fixture: Shell `Q500+`, Field Array `Q700+`, ugyanaz az exact Stileron commodity UUID, `Quality-hiány 1,9 SCU`, Card `UNSATISFIED`.
- C3B2 target + C3B1/C3A/C2/C1/B/A + static/single-file + V001/V002 integrity PASS.
- Chrome `127.0.0.1:4185`, 1366×768: két Stileron sor, editable control 0, User Data write surface 0, console WARN/ERROR 0/0 PASS. Kézi `file://` NOT RUN; bypass nem történt.
- C012.5D/C013 nem indult; tag/release/push/main merge nincs. Visszaállás: a C3B2 checkpoint revertje; stabil fallback a változatlan V002.

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
