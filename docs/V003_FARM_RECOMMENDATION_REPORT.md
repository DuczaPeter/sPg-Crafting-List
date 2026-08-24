# V003-dev farm recommendation audit es C001 riport

Datum: 2026-08-24

Branch: `develop/V003`

Ciklus: `V003-C001`

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

A besorolas API type/resource adatbol dolgozik, nem L1-L5 nevheurisztikabol. Az `All Lagrange Points` csak akkor jelenik meg, ha az adott rendszer minden relevans Lagrange-jeloltje a legjobb teljes rangtuple-lel egyezik.

## Determinisztikus rangsor

Rendszerenkent, kulon `NORMAL` es `SPACE` csoportban:

1. primary resource gate;
2. `group_probability_percent` / spawn csokkeno;
3. `relative_probability_percent` / occurrence csokkeno;
4. van-e Q500+ elerheto Quality;
5. a Q500+ `quality_quantized_values` csokkeno, lexikografikus osszehasonlitasa;
6. elerheto Quality maximum, majd minimum csokkeno;
7. teljes rangazonossagnal determinisztikus nev/ID sorrend es UI-osszevonas.

Az algoritmus nem szamol kitalalt Quality-szazalekot. A teljes normalizalt `location.resources[].materials[]` adat megmarad, a recommendation kulon projekcio. Minden erintett resource dontese visszakeresheto: `INCLUDED`, `SECONDARY_EXCLUDED`, `LOWER_RANKED`, `BEST_NORMAL`, `BEST_SPACE`.

## Kozos fogyasztok

A Material Database, a Crafting/Combined material-intelligence snapshot es a standalone Crafting/Farm Card export ugyanazt a `buildMiningFarmRecommendations()` fuggvenyt hasznalja. Kulon export-rangsor nincs.

## Tesztek

- `V003-C001` teljes M1-M6.1 + C04 regresszio: PASS.
- M3: 24 kotelezo eset, benne primary material nem nulla indexen, magas spawn/Q secondary csapda, spawn-elozes, quantized Quality, szigoru All Lagrange, Stanton/Pyro/Nyx, normal/space es 5 000 locationos fixture; PASS, kb. 131 ms.
- Elo API-proba: Aluminum (common), Agricium (uncommon), Stileron (legendary); PASS.
- Elo Agricium: magasabb spawnu secondary talalat bizonyitottan kizart.
- Standalone JS-300 artifact: 92 386 byte, SHA-256 `3d118c1ed495bd8d877d97e9694ed84473a2f5b1ff1c1963a4dcf5df323592ce`; PASS.
- Single-file/C04: embedded CSS, nulla local sidecar es export-regresszio PASS.
- V002 tag commit: `b326aaff5838aafd5b1f13b16982c29a0e150e35`; stabil HTML SHA-256 `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`; valtozatlan.

## Chrome

- Valodi Chrome localhost: 13/13 technikai proba PASS.
- User Data fingerprint: technikai proba elott `e6d8dec8`, reload utan `e6d8dec8`; valtozatlan.
- Chrome console warning/error: 0.
- Material Database vizualis ellenorzes: PASS.
- Valodi Chrome `file://`: `BLOCKED_BY_AUTOMATION_URL_POLICY`; nem lett PASS-nak jelolve es nem tortent security bypass. Kezi V003 `file://` ellenorzes marad nyitva.

Bizonyitek: `test-artifacts/V003-C001/`.

## Visszaallas

A V003 valtozas a fejlesztesi commit visszaforditasaval vagy a fagyasztott `V002` tag/release hasznalataval allithato vissza. A V001/V002 stabil artifactokhoz ez a ciklus nem nyult.
