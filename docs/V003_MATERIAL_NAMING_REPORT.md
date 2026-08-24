# V003-C003 material canonical naming audit es implementacios riport

Datum: 2026-08-24

Branch: `develop/V003`

Ciklus: `V003-C003`

Allapot: fejlesztesi verzio; stabil V003 release vagy tag nem keszult.

## Auditforras es scope

Az audit a Star Citizen Wiki API `4.9.0-LIVE.12232306` adatverziojat hasznalta.

- Teljes `/commodities` minta: 206 rekord.
- Az alkalmazas altal hasznalt `mineable` es `harvestable` filterek egyesitett, UUID szerint deduplikalt mintaja: 72 rekord.
- A raw API-rekordok, UUID-k, `name`, `display_name`, `key`, `slug`, `kind`, category/method, commodity group es `refined_version` adatok valtozatlanul megmaradnak.
- A normal UI egy kulon, centralizalt presentation projectiont kap; az audit nem irja at a Game Data cache raw rekordjait.
- Teljes gepi bizonyitek: `test-artifacts/V003-C003/material-name-audit.json`.

A teljes 206 rekordos mintaban a gyakoribb zarojeles suffixek: `ProcessedGoods` 32, `Organic` 26, `Mineral` 23, `Metal` 17, `Ore` 16, `UnrefinedOres` 16, `Vice` 16, `SyntheticMaterials` 12, `Bulk_Supplies` 11, `Food` 11, `Gas` 10, `Raw_Minerals` 10 es `Raw` 9. A suffixlista auditadat; a resolver csak szigoruan felsorolt terminalis technikai suffixet tavolit el.

## Centralizalt resolver

A kozos `resolveMaterialName()` modell minden rekordhoz ezt adja:

- `rawName`: az API-bol kapott eredeti megjelenitesi nev;
- `canonicalName`: stabil belso nevkulcs;
- `displayName`: a felhasznalonak mutatott tiszta nev;
- `aliases`: keresheto eredeti es ellenorzott alternativ nevek;
- `nameSource`: `EXPLICIT_ALIAS`, `SUFFIX_NORMALIZED` vagy `API_EXACT`;
- `nameStatus`: `RESOLVED`, `UNMAPPED` vagy `AMBIGUOUS`;
- `diagnosticStatus`: a rejtett vagy hibas rekord pontos oka.

Feloldasi sorrend:

1. verziozott, exact UUID-hoz kotott alias;
2. az API valos `name` mezojenek hasznalata es csak a szigoru terminalis `Ore`, `Raw` vagy `(R)` jeloles normalizalasa;
3. ha csak a dekoralt `display_name` erheto el, az auditban engedelyezett terminalis category suffix eltavolitasa;
4. ertelmes nev nelkul `UNMAPPED`; nincs key/slug alapjan kitalalt felhasznaloi nev.

Nincs fuzzy matching, altalanos szoatrendezes, hasonlosagi score vagy nem bizonyitott singular/plural atiras.

## Verzizott explicit alias registry

Registry: `V003-C003-1`; mind a 11 rekord exact UUID-hoz es a `4.9.0-LIVE.12232306` ellenorzott adatverziohoz kotott.

- `Beradom` -> `Beradon`
- `Compboard` -> `Comp Board`
- `Decari Pod` -> `Decari`
- `Degnous Root` -> `Degnous`
- `Fotia Seedpod` -> `Fotia`
- `Pingala Seeds` -> `Pingala`
- `Revenant Pod` -> `Revenant`
- `Sunset Berries` -> `Sunset Berry`
- `Raw Ice` -> `Ice`
- `Raw Ouratite` -> `Ouratite`
- `Raw Silicon` -> `Silicon`

A kert peldak kozul `Aniant`, `Flareweed` es `Woutan` nem szerepelnek ebben a rogzitett API-verzioban, ezert nincs hozzajuk talalgatott mapping. `Golden Medmon`, `Heart of the Woods`, `Pitambu` es `Prota` az API exact nevevel mar eleve helyes.

## Audit eredmeny

- raw material rekord: 72;
- feloldott canonical nev: 71;
- explicit alias: 11;
- biztonsagos suffix-normalizalas: 25;
- valtozatlan API-exact nev: 35;
- `UNMAPPED`: 1;
- `AMBIGUOUS`: 0;
- normal UI-bol rejtett invalid rekord: 1;
- deduplikalt felhasznaloi rekord: 64.

Az egyetlen rejtett aktiv rekord:

- UUID: `272539c8-e211-4c82-8bd0-6ecaabbc9c10`
- API key: `Vlk_Limpet`
- raw display: `(Organic)`
- status: `UNMAPPED`
- ok: `TECHNICAL_FRAGMENT_ONLY`

A rekord nem jelenik meg a Material Database normal listajaban vagy selectjeiben, de a raw cache-ben, az audit JSON-ban es a diagnosztikaban teljesen megmarad.

## Duplicate-semantika

Azonos tiszta nev onmagaban nem eleg osszevonashoz. A `buildMaterialDisplayIndex()` csak akkor egyesit rekordokat, ha az API exact `refined_version.uuid` kapcsolata ugyanabba a technikai anyagcsaladba koti oket. A rogzitett mintaban het bizonyitott par van:

- Copper
- Gold
- Iron
- Lindinium
- Riccite
- Silicon
- Tungsten

Mindegyiknel a raw/refined technikai par ket UUID-ja megmarad, a normal felhasznaloi listaban viszont egyetlen material jelenik meg. Azonos canonical nev, de bizonyitott kapcsolat nelkul a rekordok kulon maradnak; az algoritmus nem mos ossze bizonytalan anyagokat.

## Erintett fogyasztok

Ugyanazt a resolver/projection reteget hasznalja:

- Material Database lista, kereses, kategoriak, adatlap es select;
- Mining Loadouts materialnev es source-UUID lookup;
- My Materials es Quality batch megjelenites;
- Crafting Card es Combined Materials;
- farm recommendation materialazonosito/megjelenitesi nev;
- UEX Refinery valaszto es material-megjelenites, az M5 mapping algoritmus modositas nelkul;
- standalone Crafting/Farm Card snapshot es export;
- material datalistok es szerkeszto selectek;
- diagnosztikai snapshot es Technical Baseline.

A kereso a tiszta nev mellett az eredeti raw nevet, aliasokat, keyt, slugot es UUID-t is megtalalja. Pelda: `Agricium (Ore)` ugyanazt az egyetlen `Agricium` talalatot adja; `Beradom` az exact UUID-aliason keresztul `Beradon` eredmenyt ad.

## Regresszio es Chrome

- Celzott V003-C003: 20 naming/duplicate/invalid/consumer eset PASS, benne mas UUID es nem ellenorzott SC-verzio alias-elutasitasa.
- Elo API audit: PASS; 206 teljes es 72 aktiv rekord feldolgozva.
- Teljes M1-M6.1 + C04 es V003-C001/C002 regresszio: PASS.
- C001 primary/secondary gate, spawn -> occurrence -> Quality es NORMAL/SPACE szabaly: valtozatlan, PASS.
- C002 farmhely grouping: valtozatlan, PASS.
- Standalone export: PASS; beagyazott CSS, teljes kartya, tiszta materialnev, kulso runtime dependency nelkul.
- Valodi Chrome localhost Technical Baseline: 14/14 PASS, ebbol kulon `V003 material canonical naming` PASS.
- Chrome Material Database: `Tungsten` keresese 1 tiszta eredmeny; raw `Agricium (Ore)` es alias `Beradom` kereses PASS.
- User Data fingerprint a technikai proba es reload elott/utan: `e6d8dec8`; valtozatlan.
- Chrome alkalmazas-konzol WARN/ERROR: 0.
- A korabbi felhasznaloi valos Chrome `file://` gate tovabbra is MANUAL PASS; ezt a felhasznalo futtatta, nem Codex automation.

## Stabil release vedelme es visszaallas

- `V002^{}`: `b326aaff5838aafd5b1f13b16982c29a0e150e35`.
- Stabil V002 HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`.
- V002 tag, release es artifact valtozatlan.
- Stabil V003 release vagy tag nem keszult.

Visszaallas: a V003-C003 fejlesztesi commit visszaforditasa, vagy a valtozatlan `V002` tag/release hasznalata.
