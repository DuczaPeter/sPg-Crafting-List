# Backup es visszaallitas

## Mit tartalmaz a backup

A schema 2 JSON minden User Data-t tartalmaz: `userInventory`, `materialBatches`, `craftingCards`, `miningLoadouts` es `userSettings`. A Game Data cache nem resze a backupnak.

## Export

1. Nyisd meg a `Data / Settings` reszt.
2. Valaszd a `Backup JSON letoltese` muveletet.
3. A fajl tartalmazza az alkalmazas- es SC-verziot, az export idejet, a schema verziot es a teljes tartalom fingerprintjet.

## Import

1. Valassz modot: `MERGE` hozzaad/felulir, `REPLACE` a teljes User Data-t a backup tartalmara csereli.
2. Valaszd ki a JSON-fajlt, majd futtasd az `Import elonezet` muveletet.
3. Ellenorizd az uj, felulirt, konfliktusos es torlendo rekordok szamat.
4. Csak a validalt elonezet utan engedelyezett az alkalmazas.

Az elonezet read-only. Hibas JSON, ismeretlen format/schema, ervenytelen rekord vagy fingerprint-elteres eseten semmi nem irodik felul. A backup `userSettings` blokkja csak `USER` scope-ot vagy `user:` kulcsot fogad el, belso alkalmazasbeallitast nem irhat felul. A tamogatott schema 1 fajl schema 2-re migralodik, es a migracios lepesek megjelennek az elonezetben.

## Snapshot es rollback

Alkalmazas elott automatikus, fingerprinttel ellatott snapshot keszul az IndexedDB `snapshots` store-jaban. Az ot User Data-terulet egyetlen tranzakcioban valtozik. Sikertelen vagy felbeszakadt import eseten a tranzakcio visszagorget, az eredeti fingerprint valtozatlan marad. A snapshot az importtol fuggetlenul megmarad diagnosztikai es kesobbi helyreallitasi celra.

Az import utan ellenorzott fingerprintnek egyeznie kell a MERGE/REPLACE modelltol vart eredmennyel. Elteres hibakent zarja a folyamatot es bekerul a diagnosztikai logba.
