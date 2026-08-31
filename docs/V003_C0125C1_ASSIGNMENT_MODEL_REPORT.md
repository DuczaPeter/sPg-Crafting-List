# V003-C012.5C1 – Recipe Slot assignment model

## Eredmény

`PASS` – kizárólag az assignment adatmodellje és perzisztenciája készült el. A C012.5C2 UI és a C012.5C3 allocation nincs elindítva.

## Storage model

- Helye: `craftingCards[].recipeSlotQualityPoolAssignments[recipeSlotId]`.
- A kártyarekord saját mezője miatt az identity ténylegesen `cardId + recipeSlotId`.
- Valid értékek: `ANY_Q`, `MINIMUM_Q_POOL`, `MAXIMUM_Q_POOL`.
- Új és régi kártyánál az alapérték üres objektum: nincs kitalált assignment.
- Hiányzó vagy ismeretlen érték (`SUPER_Q_POOL`) kiesik a normalizáláskor, és `LEGACY_FALLBACK` mellett a jelenlegi C012.3 Quality-viselkedés marad aktív.
- Nincs új IndexedDB store, DB-version vagy backup-schema.

## Függetlenség és lifecycle

- FR-86 Shell és Field Array ugyanazon Stileron ellenére külön slotkulcsot használ.
- Két FR-86 Crafting Card assignmentje külön rekordban marad.
- A Duplicate kezdetben mély másolatot örököl, utána függetlenül módosítható.
- Card törlésével az abba ágyazott assignment is eltűnik; másik Card, inventory, `materialQualityPools` és `materialQualityPlans` nem változik.
- Reload-normalizálás megőrzi a valid értékeket.

## Backup

- A meglévő Crafting Card backup automatikusan tartalmazza és pontosan visszaállítja az assignment mapet.
- Assignment mező nélküli régi backup betölthető; normalizált értéke `{}`, legacy Quality behavior mellett.

## Célzott ellenőrzés

- C012.5C1 modell/FR-86/per-slot/per-card/duplicate/reload/delete/backup/invalid fallback: `PASS`.
- Static/JavaScript gate: `PASS`.
- C012.5B pool persistence: `PASS`.
- C012.5A canonical identity: `PASS`.
- C012.3 legacy Quality fallback: `PASS`.
- V001/V002 integrity: `PASS`.
- Log: `test-artifacts/V003-C012.5C1/validation.log`.

## Visszaállás

A `V003-C012.5C1-RECIPE-SLOT-ASSIGNMENT-MODEL` commit revertje; stabil fallback a változatlan V002.
