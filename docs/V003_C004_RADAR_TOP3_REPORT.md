# V003-C004 Radar Signature registry, SCMDB audit és Top-3 farm recommendation

Dátum: 2026-08-24

Branch: `develop/V003`

Állapot: `PASS` fejlesztési ciklus; stabil V003 release vagy tag nem készült.

## Mezőszintű forrásprioritás

A Radar Signature felhasználói mezőjének elsődleges forrása az `Info/Radar Signature.png`. A forráskép SHA-256 értéke `f9c6e362a41bbbc28acbac984300d582a00bc4b79a7e9738f136e1da89cabdc6`, mérete 1182×879 pixel.

Az alkalmazás egy beágyazott, verziózott `V003-C004-1` registryt használ. Minden rekord megőrzi:

- az exact Wiki UUID-t és canonical materialnevet;
- a mining kategóriát;
- az alap Radar Signature értéket;
- a megengedett egész cluster-szorzókat és az ezekből számolt értéklistát;
- a forrás, forrásverzió, képhash, forrássor, derivation és státusz mezőket.

A registryben 26 közvetlen Ship Mining materialrekord és 7, a kép ROC/FPS kategóriasorából exact Wiki kategóriával levezetett rekord van. Három kategóriaszabály marad meg referenciaként: ROC, FPS és Salvage. Salvage materialra a jelenlegi alkalmazás-adatkészletben nem történt találgatott UUID-mapping.

A Star Citizen Wiki `signature` mezője nem kerül felhasználói fallbackként a felületre. Diagnosztikában `STAR_CITIZEN_WIKI_API / API_RAW_NOT_USER_FACING` eredettel megmarad. Registry-egyezés hiányában a megjelenítés pontosan `Nincs adat`.

Az élő `4.9.0-LIVE.12232306` audit eredménye:

- 72 aktív raw mineable/harvestable rekord;
- 64 user-facing materialprojekció;
- 33 `VERIFIED` Radar Signature;
- 31 `UNMAPPED` / `Nincs adat`;
- 3 forráskép-alapú kategóriaszabály.

## Top-3 dense rank szabály

A C001 sorrend változatlan:

1. exact primary resource gate;
2. spawn / `group_probability_percent` csökkenő;
3. occurrence / `relative_probability_percent` csökkenő;
4. quantized és range Quality csökkenő;
5. csak teljes tuple-egyezés után determinisztikus technikai tie-break.

A C004 a rendezés után dense-rank tiereket képez. Teljesen azonos rangtuple esetén több, akár külön presentation-csoport ugyanazt a helyezést kapja. A következő eltérő tuple a következő egész rang. Rendszerenként és környezetenként legfeljebb az első három rank tier látható; a teljes decision trace és minden raw location megmarad diagnosztikában. Ship Mining külön `NORMAL` és `SPACE` listát kap. Nem-Ship material csak a gameplay szerint értelmes `NORMAL` listát kapja, ezért nem jelenik meg mesterséges SPACE blokk.

Egy kártya tartalma: rank, emberi farmhelynév, member-summary, mining method, spawn, occurrence, Quality és curated Radar Signature. A Material Database, Crafting/Combined intelligence snapshot és standalone export ugyanazt a `buildMiningFarmRecommendations()` projekciót használja.

## Élő példák

Aluminum / Stanton:

- NORMAL #1–#3: `Hurston`, `Magda`, `Ita`;
- SPACE #1–#3: `Aaron Halo`, `Lagrange F`, `Lagrange A`.

Aluminum / Pyro SPACE #1: `Pyro Deep Space Asteroids`, 86 RMB helyszín.

Agricium / Pyro NORMAL #1: `Terminus · Vuur`, két külön bizonyított farmhelycsoport azonos rank tierben.

Agricium / Stanton SPACE #1: `Lagrange D`, `ARC-L3 · CRU-L5 · MIC-L4`.

Stileron / Pyro: külön NORMAL és SPACE #1; a SPACE név `Pyro Deep Space Asteroids`, summary `Akiro Cluster és RMB helyszínek`.

## SCMDB összehasonlító audit

Az [SCMDB PTU Resource Guide](https://scmdb.net/?page=mine&channel=ptu) csak read-only másodlagos referencia. Az auditkor megjelenített verzió `4.10.0-ptu.12497254` volt. Az oldal maga jelzi, hogy a százalék egy resource deposit groupon belüli részesedése, és nincs a group probabilityvel súlyozva. Emiatt az SCMDB százalék nem ranking input, nem Wiki spawn/occurrence megfelelő, és az alkalmazásnak nincs SCMDB runtime fetch-e vagy függése.

Az összevetés eredménye 6 `MATCH`, 1 `EXPLAINED_DIFFERENCE`, 2 `UNVERIFIED`. A `Yela Asteroid Belt` és `Terminus Ring` labelhez nem volt elég exact Wiki provider/parent bizonyíték, ezért nem kerültek automatikusan az alkalmazásba. A `Stileron / Pyro` eltérés megmagyarázott: az SCMDB deposit-group share-t mutat, míg az alkalmazás külön környezetben Wiki spawn → occurrence → Quality szerint rangsorol.

## Érintett függvények

- `resolveRadarSignature()`, `withRadarSignatureProjection()`, `auditRadarSignatures()`;
- `normalizeMiningCommodityIndex()`, `normalizeMiningCommodity()` és a cache-visszatöltési projekció;
- `m3PartitionRankingTiers()`, `m3RecommendationEnvironments()`, `buildMiningFarmRecommendations()`;
- Material Database lista/adatlap/ranking renderer;
- material-intelligence snapshot és diagnosztikai snapshot;
- `m6BuildStandaloneSnapshot()` / `m6RenderStandaloneHtml()` közös recommendation-fogyasztása.

## Talált és javított hibák

1. Valódi Chrome cache-visszatöltésnél egy régebbi detail rekordból hiányzó cluster-lista `undefined.slice()` indulási hibát okozott. Null-safe projekció javította.
2. A részletes Aluminum adatlap már curated radarértéket mutatott, de a régi index-cache-ből épülő listakártya még `Nincs adat` volt. Az index-visszatöltés is a közös radar-projekcióra került.

Mindkét hiba után az érintett teszt és a teljes regresszió újrafutott.

## Ellenőrzések

- célzott Radar/Top-3/tie/nem-Ship/consumer teszt: PASS;
- élő Wiki radar-lefedettség és Top-3 audit: PASS;
- C001 secondary-exclusion és spawn → occurrence → Quality: PASS;
- C002 grouping és C003 canonical naming: PASS;
- teljes M1–M6.1 + C04: PASS;
- standalone JS-300 Top-3 export: 95 529 byte, SHA-256 `8c42dbf9a68b3ede33ca108d74cddfe653aad817ae639eea5179d73572d63b8d`, PASS;
- valódi Chrome localhost: 15/15 PASS, vizuális Material Database ellenőrzés PASS;
- User Data fingerprint: `e6d8dec8` próba előtt, utána és reload után is;
- Chrome console warning/error: 0;
- felhasználó korábbi valós Chrome `file://` bizonyítéka: `MANUAL PASS`, nem Codex automation; a rögzített scope a V003 location-ranking technikai baseline;
- `V002^{}`: `b326aaff5838aafd5b1f13b16982c29a0e150e35`;
- stabil V002 HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`;
- V002 változatlan, V003 tag nincs.

Visszaállás: a V003-C004 commit revertje, vagy a fagyasztott V002 tag/release használata.
