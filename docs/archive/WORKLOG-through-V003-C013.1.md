# WORKLOG.md

Korábbi aktuális napló archiválva: `docs/archive/WORKLOG-through-V003-C013.md`.

## Aktuális ciklus

### V003-C013.1 Strict Quality Allocation + Shortage Repair – 2026-09-01

- A kézi exact candidate `file://` gate FR-86 x17 fixture-je bizonyította: a recipe-sorrendben előbb futó Q500+ Shell elfogyasztotta a Q910 batch egy részét, ezért a Q900+ Field Array Quality-starvationt szenvedett.
- Az Allocation Engine megtartja a Card-prioritást, de Cardon belül canonical material + unit csoportonként a magasabb effektív minimum Quality requirementet futtatja előbb; az eredmény továbbra is stabil Recipe Slot sorrendben kerül vissza.
- A hiányosztályozás külön rögzíti a slot feldolgozásakor fizikailag elérhető és Quality-eligible mennyiséget. Vegyes hiánynál `missingAmount + missingQuality = total missing`, átfedés nélkül.
- Kötelező fixture PASS: Field `6 / 9,3 / 17 SCU`, Shell `17 / 3,4 / 0 SCU`; globális reserved `23`, hiány `29,7 SCU`, double reserve `0`.
- Final Card/Crafting List/Combined/Maximum Craftable/standalone parity PASS; a Final Card és standalone mindkét hiánykomponenst megjeleníti.
- Az M4 Technical Baseline eltérése harness-only hiba volt: a probe kihagyta a `state.knownMaterials` exact canonical mapet. Az application Combined számítás már helyesen adta át.
- C013.1 célkapu PASS: M2, M4, C012.3, C3A, C3B1, C3B2, integrált FR-86, static/single-file, V001/V002 integritás. Teljes release-regresszió scope szerint nem futott.
- A blokkolt C013 candidate byte-változatlan; friss RC kell. V003 tag/release/push/main merge nincs. Visszaállás: a C013.1 checkpoint revertje; stabil fallback a változatlan V002.
