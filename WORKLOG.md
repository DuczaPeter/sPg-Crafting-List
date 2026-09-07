# WORKLOG.md

Korábbi aktuális napló archiválva: `docs/archive/WORKLOG-V003-C013.4.md`.

## Aktuális ciklus

### V003-C013.5 Canonical Material Picker Dedup Repair – 2026-09-07

- A C013.4 exact manual `file://` kapu Feynmaline duplicate picker blockernél megállt; az RC BLOCKED/INVALIDATED maradt, artifactja nem változott.
- Root cause: `buildKnownMaterialOptions()` csak előre átfedő source-UUID halmazokat egyesített; külön item és commodity forrás esetén az exact relation nem került a picker lookupba.
- Beépült a verziózott exact identity modell: egyetlen weight-1 `default_composition` item→commodity relation, meglévő `refined_version` és verified source UUID; fuzzy/name-only merge nincs.
- Feynmaline és Titanium egy-egy canonical picker-opció; name→UUID autofill és canonical new-batch save PASS, source UUID provenance megmarad. Régi batch destruktív migráció nincs.
- Aktív 4.10 live audit: 40 mineable + 32 harvestable commodity, 84 harvestable item, 18 exact detail relation; 128 név, 126 látható picker-opció, 24 exact multi-UUID identity, 2 unresolved duplicate név.
- Unresolved: `Leyland's Tortoise` és `Yormandi Tongue`; egyikhez sem készült kitalált canonical UUID, a megtévesztő duplikált picker-sorok rejtve maradnak.
- C013.5 target, static single-file, C013.3 Titanium, C012.5A, M2, M4, reload/backup/Combined/allocation/no-double-reserve és V001/V002 integritás PASS.
- Teljes release-regresszió és friss RC scope szerint nem futott; V003 tag/release/push/main merge nincs.
- Visszaállás: a C013.5 checkpoint commit revertje; stabil fallback a változatlan V002.
