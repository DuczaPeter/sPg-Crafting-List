# WORKLOG.md

Korábbi aktuális napló archiválva: `docs/archive/WORKLOG-through-V003-C013.2.md`.

## Aktuális ciklus

### V003-C013.3 Disjoint Quality Pools + Canonical Grouping Repair – 2026-09-07

- A C013.2 exact manual `file://` kapuján talált átfedő Minimum/MAX eligibility és multi-source Titanium duplikáció célzott javítása elkészült.
- Pool resolver: Minimum `[minimumQ, maximumQ)`, MAX `[maximumQ, +∞)`; nincs borrowing/fallback. MAX nélkül Minimum felső korlát nélküli; hibás vagy azonos küszöb `POOL_RANGE_INVALID` fail-safe.
- Az exact commodity↔ingredient UUID kapcsolat canonicalizálja a groupingot és allocationt, miközben a batch `sourceMaterialUuid` provenance megmarad; név/fuzzy összemosás nincs.
- A Titanium fixture egy logical materialt, két batch-et és `4,868 SCU` teljes inventoryt igazol; Minimum Q500–Q799 csak Q784-et, MAX Q800+ csak Q866-ot használ.
- C013.3 célteszt és közvetlen M2/M4, C012.5A–C3B2, D1, C013.1 regresszió PASS; teljes release-regresszió scope szerint nem futott.
- Fő HTML teszt előtti/utáni SHA egyezik; C013.2 candidate változatlan, de BLOCKED/INVALIDATED; V001/V002 integritás PASS.
- Új RC, stabil release, tag, push és main merge nem készült.
- Visszaállás: a C013.3 checkpoint commit revertje; stabil fallback a változatlan V002.
