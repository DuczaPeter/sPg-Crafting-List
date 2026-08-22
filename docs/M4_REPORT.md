# M4 jelentes – Combined Materials, backup es diagnosztika

Datum: 2026-08-22

## 1. Combined Materials modell es algoritmus

- A nezet nem tart fenn masodik szamitasi logikat: kizarolag a determinisztikus `allocateCardsDeterministically` eredmenyet vetiti material + unit csoportokra.
- Csoportonkent megmarad a teljes szukseglet, keszlet, foglalas, hiany, mennyiseg-/Quality-hiany, blueprint-, Recipe Slot- es Quality-szabalylista.
- Minden slotreszlet megorzi a kartya ID-t es prioritasat, blueprintet, slotot, Quality rule/Target Q-t es a konkret batch-foglalast.
- Beepitett invarians ellenorzi, hogy a csoportos foglalas bitpontosan egyezik az Allocation Engine `batchUsage` eredmenyevel. A kartya sorrendvaltozasa ugyanazon ujraszamolasi uton frissiti a Combined nezetet.

## 2. Backup schema

- Format: `spg-crafting-list-backup`, aktualis schema: 2.
- User Data blokkok: `userInventory`, `materialBatches`, `craftingCards`, `miningLoadouts`, `userSettings`.
- Metadata: alkalmazasnev/-verzio, exportido, aktiv SC-adatverzio es determinisztikus fingerprint.
- A Game Data cache szandekosan nincs a backupban.
- Schema 1 tamogatott: loadout-kulcs normalizalas es ures `userSettings` alapertelmezes utan schema 2 lesz. Ujabb/ismeretlen schema elutasitott.

## 3. Import preview, snapshot es rollback

- `MERGE`: rekordkulcsonkent hozzaad vagy felulir. `REPLACE`: az importalt User Data lesz a teljes celallapot.
- A preview store-onkent es osszesitve mutatja az aktualis/bejovo rekordot, hozzaadast, felulirast, konfliktust, valtozatlan rekordot es REPLACE torlest.
- A preview elotti/utani fingerprint kotelezoen azonos; ervenytelen backup semmit nem modosit.
- Alkalmazas elott kulon automatikus snapshot keszul. Az ot User Data store egy IndexedDB-tranzakcioban commitol; abortkor minden visszagorget.
- Sikeres import utan a tenyleges fingerprintet a tiszta MERGE/REPLACE modell vart fingerprintjehez hasonlitja.

## 4. Diagnosztikai log

- A process log esemenyei tovabbra is RAM-ban epulnek, es csak `finish` ir egyszer a sessionStorage-ba.
- A `Log masolasa` egyetlen JSON-ban adja az alkalmazas/cache/database/backup schemat, aktiv SC-verziot, Game Data cache allapotot es darabszamokat, User Data fingerprintet/darabszamokat, kartyasorrendet, allocation summaryt, teljes Combined eredmenyt, backup preview/export/import/migracio/rollback allapotot es warning/error szamokat.
- Uj fo esemenyek: `COMBINED_MATERIALS_CALCULATED`, `BACKUP_EXPORT_CREATED`, `BACKUP_IMPORT_PREVIEW`, `BACKUP_SCHEMA_MIGRATED`, `BACKUP_SNAPSHOT_CREATED`, `BACKUP_IMPORT_COMMITTED`, `BACKUP_IMPORT_ROLLBACK`, `BACKUP_ROUNDTRIP_PASS`, `DIAGNOSTIC_BUNDLE_BUILT`.

## 5. Teszteredmenyek

- `tools/validate-m4.ps1`: PASS, az M1-M3 teljes regresszioval egyutt.
- 12/12 M4 kotelezo eset PASS: kozos material, HP/funkcionalis slot, engine-egyezes, sorrend, bitazonos roundtrip, hibas JSON, ismeretlen schema, megszakitas/rollback, schema 1 migracio, read-only preview, logmarkerek es nagy terheles.
- Teljesitmeny: 1000 kartya, 3000 Recipe Slot es 5000 batch Combined osszesitese a `V001-C007` ciklusban 144 ms; 100 materialcsoport. Ismetelt helyi futasok 139-225 ms kozott maradtak.
- Helyi bongeszo: technikai proba 11/11 PASS; valos IndexedDB atomi REPLACE roundtrip es abort rollback ugyanazzal a `30efd6b4` User Data fingerprinttel.
- Schema 1 bongeszos REPLACE preview: 14 tervezett torles, fingerprint elotte/utana `30efd6b4`; User Data nem valtozott.
- `Log masolasa`: PASS, kb. 190 KiB M1-M4 csomag; Combined es Data / Settings vizualis ellenorzes PASS; bongeszokonzol warning/error 0.

## 6. Talalt es javitott pontok

- A korabbi User Data fingerprint nem tartalmazta a user-scope beallitasokat; az M4 fingerprint mar mind az ot backupteruletet lefedi.
- A backup `userSettings` validacioja csak `USER` scope-ot vagy `user:` kulcsot enged, igy belso technikai/cache-beallitast import nem irhat felul.
- A regi logmasolas csak lezart processblokkokat adott; bekerult az aktualis M1-M4 allapot snapshotja es a schema/migracio/rollback osszefoglalo.
- Az M4 navigacios gombok aktiv allapot- es fokuszkezelese bekerult a kozos navigacioba.
- A regresszios preview-fixture kezdeti vart torlesszama teves volt; a tesztadat pontos rekorddarabszamara javitva. Az alkalmazasban nem maradt ismert M4 runtime hiba.

## 7. M5 elott nyitva

- Kozvetlen `file://`, letoltott standalone export offline ujranyitasa es kulon Edge-regresszio tovabbra is release-gate; stabil kiadas nincs.
- M5-ben folytatando a standalone export teljes V1 kartyaival, referencia-UI-val es elfogadasi regresszioval.
- A UEX refinery ajanlo kulon kesobbi V1 milestone; hianya nem M4-hiba.
