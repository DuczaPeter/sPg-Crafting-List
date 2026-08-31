# V003-C012.5B – Combined Quality Pools

## Eredmény

`PASS` – a Combined Materials minden canonical materialhoz két külön, perzisztens Quality thresholdot ad: `Minimum Q` és `MAX Q`. C012.5C és C013 nem indult el.

## Adatmodell és együttélés

- Új User Data kulcs: `user:materialQualityPools`.
- Rekord: canonical material UUID → `{ minimumQ, maximumQ }`.
- Mindkét érték 0–1000 közötti egész szám; a C012.4 `bindCommittedNumericEditor()` és `normalizeCommittedNumericDraft()` kezeli.
- A meglévő `materialQualityPlans` változatlan, nem migrálódik és nem íródik felül.
- A poolok C012.5B-ben nem módosítják a recipe slot policyt, az Allocation Engine-t vagy a standalone snapshotot.

## Eligible inventory előnézet

Mindkét blokk az adott canonical material, unit és `Quality >= threshold` feltételnek megfelelő inventory-batchek összegét mutatja. A Minimum és MAX halmaz átfedhet. Ez csak két nézeti projekció: a teljes fizikai készlet továbbra is egyszer szerepel, és egyik preview sem foglal készletet.

Példa: Stileron Q550 2 SCU + Q975 1 SCU esetén Minimum Q500 = 3 SCU eligible, MAX Q950 = 1 SCU eligible, miközben a teljes készlet 3 SCU marad.

## Canonical identity

Az exact API `commodityUuid ↔ ingredientUuid` kapcsolat közös canonical pool kulcsot ad. Azonos név, prefix vagy fuzzy egyezés nem von össze rekordokat. A nyers source UUID-k megmaradnak a canonical lookupban.

## Perzisztencia és backup

- Reload után mindkét threshold megmarad.
- Recipe hozzáadása vagy eltávolítása nem törli a poolokat; inventory-only Combined kártyán is megmaradnak.
- Backup export/import az általános `userSettings` részeként őrzi az új kulcsot.
- Régi backup, amely nem tartalmaz pool-beállítást, üres pool-mapre áll és nem módosítja a meglévő Quality plan adatot.

## Targeted tesztek

- Három inventory-only material: PASS.
- Stileron Minimum Q500 / MAX Q950 eligible 3 SCU / 1 SCU: PASS.
- Pool-átfedés fizikai készletduplázás nélkül: PASS.
- Exact commodity/ingredient UUID közös beállítás: PASS.
- Azonos név exact kapcsolat nélkül külön marad: PASS.
- Materialonként független beállítás: PASS.
- Recipe add/remove és reload: PASS.
- Backup/restore és régi backup kompatibilitás: PASS.
- C012.5A, C012.4 és C012.3 közvetlen regresszió: PASS.
- Static/JavaScript és V001/V002 integrity: PASS.

Validator: `tools/validate-v003-c0125b.ps1`

Log: `test-artifacts/V003-C012.5B/validation.log`

## Chrome localhost

A valós Chrome UI-ban a két threshold karakterenkénti bevitellel, temporary empty drafttal, Enter/Tab committal és caret-közepi szerkesztéssel működött. JS-300 hozzáadása után ugyanaz az egy Stileron canonical kártya 0,35 SCU igényt/foglalást mutatott; törlés és reload után visszaállt az inventory-only 0/0/0 állapot, a 500/950 pool megmaradt.

- 1920×1080: overflow 0.
- 390×844: overflow 0.
- Console: WARN 0 / ERROR 0.
- Záró User Data fingerprint: `ea5989f9`.

Végső státusz: `V003-C012.5B – COMBINED QUALITY POOLS PASS, C012.5C NOT STARTED`
