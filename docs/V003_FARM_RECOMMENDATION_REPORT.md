# V003-dev farm recommendation audit es C001-C002 riport

Datum: 2026-08-24

Branch: `develop/V003`

Ciklus: `V003-C002`

Allapot: fejlesztesi verzio; stabil V003 release vagy tag nem keszult.

## Auditforras es bizonyitek

Az audit a Star Citizen Wiki API elo `4.9.0-LIVE.12232306` commodity-valaszaira es az API hivatalos forraskodjara epult.

- Hivatalos API-forras: [StarCitizenWiki/API](https://github.com/StarCitizenWiki/API), audit commit `c2e6e7d25ee6d581d75862c077df93730b496515`.
- Teljes mineable minta: 40 commodity, 2 505 location, 3 246 resource es 4 641 target-material bejegyzes.
- Exact target UUID + canonical resource-label egyezes: 3 287 bejegyzes.
- Target UUID jelen van, de a resource label mas depositot nevez meg: 1 354 bejegyzes.
- A target material minden vizsgalt elofordulasban `is_current=true`, primary es secondary esetben egyarant. Ezert az `is_current` nem primary-jelzo.
- A primary material `materialIndex` erteke 0/1/2 is lehetett (1 892 / 1 237 / 158 eset). Ez bizonyitja, hogy a `materialIndex === 0` szabaly hibas lenne.

A forraskod szerint a `resource.label` a deposit/resource kulcsabol kepzett megnevezes. A `group_probability_percent` annak eselye, hogy az adott resource/deposit csoport elofordul a helyen; a `relative_probability_percent` a commodity relativ eselye a csoporton belul. Emiatt a felhasznaloi celhoz a helyes sorrend spawn/group probability, majd occurrence/relative probability.

## A V002 hiba oka

A V002 location-szintu osszesitese minden target UUID-tal rendelkezo resource-ot beengedett. A secondary/by-product material ezert egy masik deposit magas occurrence/spawn vagy elmeleti maximum Quality ertekevel megelozhette a valodi target depositot. A locationok teljes anyaglistajan szamolt maximum Quality tovabb erositeni tudta ezt a teves eredmenyt.

## V003 primary es secondary szabaly

Egy resource csak akkor primary/relevant:

1. a `resource.materials` tartalmazza a keresett commodity exact API UUID-jat; es
2. a canonical `resource.label` azonos a keresett commodity canonical API-nevevel.

A szuk canonicalizalas csak az API ismert `Ore`/`Raw` jeloleseit es nem alfanumerikus elvalasztoit kezeli; nincs fuzzy matching. UUID-egyezes label-egyezes nelkul `SECONDARY_EXCLUDED`.

## Space es normal besorolas

- `Asteroid` es `Asteroid_ValidQT` location type: `SPACE`.
- `Star` location asteroid resource keyvel: `SPACE` (Aaron Halo tipusu API-rekord).
- `Moon`, `Planet`, `Outpost`: `NORMAL`.
- Mas type: `UNKNOWN`; nem vesz reszt normal/space ajanlasban.

A besorolas API type/resource adatbol dolgozik, nem L1-L5 nevheurisztikabol. Az `allLagrangePoints` diagnosztikai jelzo csak akkor igaz, ha az adott rendszer minden relevans Lagrange-jeloltje a legjobb teljes rangtuple-lel egyezik.

## Determinisztikus rangsor

Rendszerenkent, kulon `NORMAL` es `SPACE` csoportban:

1. primary resource gate;
2. `group_probability_percent` / spawn csokkeno;
3. `relative_probability_percent` / occurrence csokkeno;
4. van-e Q500+ elerheto Quality;
5. a Q500+ `quality_quantized_values` csokkeno, lexikografikus osszehasonlitasa;
6. elerheto Quality maximum, majd minimum csokkeno;
7. teljes rangazonossagnal determinisztikus nev/ID sorrend, majd kulon C002 presentation/grouping reteg.

Az algoritmus nem szamol kitalalt Quality-szazalekot. A teljes normalizalt `location.resources[].materials[]` adat megmarad, a recommendation kulon projekcio. Minden erintett resource dontese visszakeresheto: `INCLUDED`, `SECONDARY_EXCLUDED`, `LOWER_RANKED`, `BEST_NORMAL`, `BEST_SPACE`.

## Kozos fogyasztok

A Material Database, a Crafting/Combined material-intelligence snapshot es a standalone Crafting/Farm Card export ugyanazt a `buildMiningFarmRecommendations()` fuggvenyt hasznalja. Kulon export-rangsor nincs.

## C002 presentation/grouping

A C002 nem modositja a primary/secondary kaput, a spawn -> occurrence -> Quality sorrendet vagy a `NORMAL`/`SPACE` szetvalasztast. A teljesen azonos rangtuple-lel rendelkezo nyertesek csak a rangsor utan kerulnek presentation-csoportokba.

Minden recommendation ket parhuzamos nezettel rendelkezik:

- normal UI/export: rovid `groupLabel` es `memberSummary`;
- diagnosztika/debug: teljes `locationNames`, `locationIds`, csoportonkenti raw member lista, provider-, parent-, type- es resource-bizonyitek.

### Lagrange feltetel

- Csak az adott rendszer es `SPACE` kategoria mar kivalasztott, teljesen azonos legjobb rank tuple-u rekordjai kerulhetnek egy csoportba.
- A csaladhoz exact azonos API provider, azonos system, parent es resource identity kell.
- `HPP_Lagrange_X` provider eseten a rovid nev `Lagrange X`; a konkret LP-k kulon, normalizalt listaban jelennek meg, peldaul `ARC-L3 · CRU-L5 · MIC-L4`.
- Mas exact kozos providerrel rendelkezo Lagrange-rekord altalanos, rendszerszintu Lagrange labelt kap; nincs nev-prefixbol kitalalt csalad.
- Az `allLagrangePoints` jelzo csak akkor igaz, ha az adott rendszer/kategoria minden relevans Lagrange primary jeloltje ugyanazzal a teljes legjobb rank tuple-lel rendelkezik. A UI a bizonyitott provider-csalad rovid nevet reszesiti elonyben, ezert nem ir automatikusan `All Lagrange Points` feliratot.

### Pyro deep-space feltetel

- Exact, verziozott provider-registry: `HPP_Pyro_AkiroCluster` es `HPP_Pyro_DeepSpaceAsteroids`.
- Emellett `Pyro System`, `SPACE`, `Asteroid`/`Asteroid_ValidQT`, azonos parent es azonos resource identity, valamint mar bizonyitottan azonos rank tuple kotelezo.
- A fo label `Pyro Deep Space Asteroids`; a member summary csak a provider-gate utan roviditi az Akiro/RAB/RMB neveket.
- Az elo `4.9.0-LIVE.12232306` commodity-location adatokban az audit nem talalt RAB primary rekordot. A RAB kodut szintetikus, provider-gate-es regresszios fixture bizonyitja; a program nem allitja, hogy a jelenlegi eloadatban RAB talalat van.

### Mining Base / Aaron Halo bizonyitek

Az elo Aluminum/Stanton nyerteshalmaz 50 `Mining Base #...` rekordbol es egy rendszer-szintu `Stanton` rekordbol all. Mindegyik exact `HPP_AaronHalo` providerrel, azonos Stanton rendszerrel, azonos Aluminum resource identityvel es azonos teljes rank tuple-lel rendelkezik. Ezert a csoport neve `Aaron Halo`, a rovid reszlet `50 Mining Base helyszín · 1 rendszer-szintű API-rekord`. A `Mining Base` nev-prefix csak a mar providerrel bizonyitott csoport member-summaryjaban szamol; maga a csaladkepzes nem prefixheurisztika.

Ha azonos ranku rekordokhoz nincs kozos, bizonyithato provider/resource/parent csalad, kulon presentation groupok maradnak. Pelda: Agricium/Pyro `Terminus` es `Vuur` ket kulon csoport, osszefoglalojuk `2 azonos rangú farmhely`.

## Tesztek

- `V003-C002` teljes M1-M6.1 + C04 regresszio: PASS.
- M3: 33 kotelezo eset, benne a C001 primary/secondary es ranking regresszioi, szigoru Lagrange, Pyro Akiro/RAB/RMB fixture, Aluminum Lagrange F, egyetlen nyertes, bizonyitek nelkul kulon marado tie es 5 000 locationos fixture; PASS, kb. 134 ms.
- Elo API-proba: Aluminum (common), Agricium (uncommon), Stileron (legendary); ranking es grouping PASS.
- Elo Agricium: magasabb spawnu secondary talalat bizonyitottan kizart.
- Elo grouping: Aluminum/Pyro `Pyro Deep Space Asteroids` (86 raw RMB), Aluminum/Stanton `Aaron Halo` (51 raw rekord), Agricium/Stanton `Lagrange D`, Agricium/Pyro ket bizonyitek nelkul kulonallo normal csoport, Stileron/Pyro `Pyro Deep Space Asteroids` (87 raw rekord); PASS.
- Standalone export: a kozos grouped recommendation label es member summary jelenik meg, a technikai RMB/RAB raw lista nem a normal exportkartyaban jelenik meg; 92 792 byte, SHA-256 `f7bdb1f2340967b20ad1507fc9cc7d1decef88350cfbf0455bf1f292e4ba36e0`; PASS.
- Single-file/C04: embedded CSS, nulla local sidecar es export-regresszio PASS.
- V002 tag commit: `b326aaff5838aafd5b1f13b16982c29a0e150e35`; stabil HTML SHA-256 `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`; valtozatlan.

## Chrome

- Valodi Chrome localhost: 13/13 technikai proba PASS.
- User Data fingerprint: technikai proba elott `e6d8dec8`, reload utan `e6d8dec8`; valtozatlan.
- Chrome console warning/error: 0.
- C002 localhost Material Database vizualis ellenorzes: PASS; Aluminum/Pyro, Aaron Halo, Agricium kulonallo tie es Lagrange D label/summary a vart modon renderelt, konzol warning/error 0.
- Valodi Chrome `file://`: `MANUAL PASS`. Ezt a felhasznalo futtatta: a Technikai baseline minden sora zold volt, beleertve a kozvetlen `file://` futast, IndexedDB-t, Wiki API-t, az uj location-ranking szabalyokat, az M3 modellt es a standalone exportot. Ez nem Codex automation eredmeny.

Bizonyitek: `test-artifacts/V003-C001/`, `test-artifacts/V003-C002/`.

## Visszaallas

A V003 valtozas a fejlesztesi commit visszaforditasaval vagy a fagyasztott `V002` tag/release hasznalataval allithato vissza. A V001/V002 stabil artifactokhoz ez a ciklus nem nyult.
