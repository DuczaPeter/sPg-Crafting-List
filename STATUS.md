# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`; C013.5 baseline: `75950192ff73b49672aaf459de6ac3dffc3daf38`; stabil fallback: változatlan `V002`.
- Aktuális ciklus: `V003-C013.5`; canonical My Materials picker dedup repair: **PASS**, friss RC szükséges.
- Root cause: a picker csak már átfedő `sourceUuids` halmazokat merge-elt; külön érkező commodity és item/harvestable UUID két azonos nevű opció maradhatott.
- Új verziózott exact identity modell: API `default_composition` weight `1`, meglévő `refined_version` és verified source-UUID kapcsolat; fuzzy/name-only merge továbbra sincs.
- Feynmaline: picker `1`, canonical UUID `7310c15d-359c-42b4-b61e-7da3d0da3384`; source item UUID megőrzött. Titanium picker/grouping regresszió **PASS**.
- Új batch canonical UUID-val mentődik; eltérő source UUID provenance megmarad. Régi batch-eket a runtime projection kezel, destruktív User Data migráció nincs.
- Aktív `4.10.0-LIVE.12519617` audit: `128` materialnév, `126` látható picker-opció, `24` exact multi-UUID identity, `2` unresolved duplicate név. Utóbbiak rejtve és név+UUID diagnosztikával maradnak.
- C013.5 targeted validator, C013.3 Titanium, C012.5A, M2/M4, static single-file, reload/backup/Combined/allocation/no-double-reserve, V001/V002 integritás: **PASS**.
- Teljes release-regresszió: scope szerint **NOT RUN**. C013.4 RC: **BLOCKED / INVALIDATED**, byte-változatlan; manual gate nem folytatódott.
- V003 tag/release/push/main merge és új RC nincs.
- Riport: `docs/V003_C0135_CANONICAL_MATERIAL_PICKER_DEDUP_REPORT.md`.

`V003-C013.5 – CANONICAL MATERIAL PICKER DEDUP REPAIR PASS, FRESH RC REQUIRED`
