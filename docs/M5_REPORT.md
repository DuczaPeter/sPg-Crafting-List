# M5 UEX Refinery Data jelentés

Datum: 2026-08-22

## Hasznalt endpoint es valos valasz

- Endpoint: `GET https://api.uexcorp.uk/2.0/refineries_yields`.
- Authorization: nincs; a valos keres `Authorization` fejlec nelkul HTTP 200 valaszt adott.
- Top-level valaszmezok: `status`, `http_code`, `data`, `message`.
- Valos rekordszam: 215 yield rekord.
- Valos UEX commodity: 24.
- Valos naprendszer: Stanton, Pyro, Nyx.
- Egyedi refinery terminal: 20.
- `value_month`: minimum -9, maximum +13, nulla rekord 0, negativ rekord 101.
- HTTP cache-fejlec: `public, max-age=86400, must-revalidate`.
- A valasz nem erte el a dokumentalt 500 rekordos limitet.

A reprodukalhato, csak olvaso semaproba: `node tools/probe-m5-api.mjs`.

## Elkülönitett UEX Game Data es cache

Az IndexedDB kulon store-okat hasznal:

- `uexRefineryRawCache`: valtozatlan UEX yield rekordok;
- `uexRefineryNormalizedCache`: tipizalt yield rekordok es teljes provenance;
- `uexRefineryDatasets`: az aktiv dataset metaadatai;
- `gameMetadata.activeUexRefineryDataset`: az egyetlen aktiv dataset mutatoja.

A TTL 86 400 000 ms. Friss cache-nel az indulasi sync halozati keres nelkul cache-hit. Lejart cache vagy kezi frissites egyetlen dokumentalt endpointkerest futtat. Nincs kitalalt pagination parameter.

A raw/normalizalt rekordok, dataset es aktiv metadata ugyanabban az IndexedDB tranzakcioban cserelodnek. Abort vagy fetch/schema hiba eseten az elozo aktiv dataset es rekordjai valtozatlanok. A technikai proba tenyleges, szimulalt commit-aborttal ellenorzi ezt.

## Normalizalt yield es provenance

Minden normalizalt rekord megorzi:

- UEX yield rekord ID;
- `id_commodity` / `commodity_name`;
- `id_star_system` / `star_system_name`;
- `id_terminal` / `terminal_name`;
- `value`, `value_week`, `value_month`;
- `date_added`, `date_modified` ISO idopontkent;
- source: `UEX`, forras-URL es fetch time;
- ranking field: `value_month`, ranking value.

A valos UEX epoch-masodperces datummezok ISO-idopontta normalizalodnak; a raw rekord valtozatlan marad.

## Wiki–UEX commodity mapping

Az automatikus mapping lepesei:

1. a Wiki kijelzesi nevbol csak a bizonyitott strukturális taxonomy-utotag (`UnrefinedOres`, `Raw_Minerals`) tavolodik el;
2. Unicode-normalizalas, kisbetusites, irasjelek es tobbszoros whitespace normalizalasa;
3. csak teljes normalizalt nevazonossag fogadhato el;
4. egy jelolt: `MATCHED / AUTO_NORMALIZED_EXACT`;
5. nulla jelolt: `UNMAPPED`;
6. tobb jelolt: `AMBIGUOUS`.

Nincs fuzzy vagy szosorrendet atiro talalgatas. A kesobbi, `user:uexCommodityMapping:<wikiUuid>` User Setting explicit `USER_OVERRIDE`; Game Data sync nem torli, backupba bekerul. Az override kulon UEX nevet is tarolhat, igy a sikeres mapping es a `Nincs refinery adat` allapot akkor is megkulonboztetheto, ha az aktiv yield datasetben nincs rekord.

Valos eredmeny a jelenlegi 72 Wiki mining commodity indexre:

- `MATCHED`: 19;
- `UNMAPPED`: 53;
- `AMBIGUOUS`: 0;
- `USER_OVERRIDE`: 0.

Az UEX 24 commodityjabol ot nev nem biztonsagos exact egyezes: Hephaestanite Raw, Silicon Raw, Ice Raw, Construction Material Salvage es Construction Material Rubble. Ezekhez nem keszult automatikus alias-talalgatas.

## Naprendszerenkenti rangsor

A rekordok UEX commodity, majd SC rendszer szerint csoportosulnak. Minden rendszerben a legnagyobb numerikus `value_month` a nyertes. Az osszes pontosan azonos maximumu terminal megmarad. A nulla es negativ maximum is megjelenik; csak negativ adatoknal a legkevesbe negativ ertek nyer.

Valos Agricium pelda:

- Nyx: Levski +8%;
- Pyro: -8%, ot azonos legjobb terminal;
- Stanton: MIC-L1 es Terra Gateway +8%, ket azonos legjobb terminal.

Valos Beryl pelda:

- Nyx: Levski +8%;
- Stanton: +7%, ot azonos legjobb terminal.

## Crafting Card es Combined Materials

Nincs masodik materialmodell. A runtime `materialIntelligence` snapshot a Wiki commodity UUID-jahoz kapcsolja:

- Radar Signature;
- mining method;
- rendszerenkenti legjobb mining location;
- occurrence, spawn, maximum Quality;
- mentett mining loadoutok;
- normalizalt UEX refinery recommendation es provenance.

Regi Crafting Card eseten a Recipe Slot eredeti normalizalt blueprint cache-e adja vissza az API-bol szarmazo `commodityUuid` kapcsolatot. Az aktiv kartyakhoz szukseges, hianyzo mining commodity reszletek igeny szerint toltodnek es cache-elodnek; nem tolti le az osszes commodity reszletet.

A Combined Materials ugyanazt az allocation requirement snapshotot vetiti ki. A valos Beryl Crafting Card es Combined sor lathato mining/refinery szovege es `refinerySnapshotFingerprint` erteke azonos. A snapshot `generatedFor: M6_STANDALONE_EXPORT` jelolessel mar API nelkul beagyazhato adatot tartalmaz, de a vegleges export UI meg nem M5 feladat.

## Diagnosztika

Az M1–M5 csomag tartalmazza:

- UEX URL, HTTP status, record count es duration;
- cache hit/miss, dataset age, TTL es aktiv dataset;
- pontosan 500 rekordnal limit warning;
- matched/unmapped/ambiguous/user-override osszegzes es teljes mapping lista;
- commoditynkénti rendszercsoport, maximum, tie es terminalok;
- nincs-adat es unresolved mapping allapotok;
- User Data fingerprint-megorzes;
- sync rollback es a megtartott dataset ID;
- Crafting/Combined refinery snapshot fingerprint.

A logger tovabbra is RAM-ban epul, es csak process-lezaraskor ir egyszer sessionStorage-ba.

## Teszteredmenyek

- `V001-C008`, `m5-regression`: PASS.
- 17/17 kotelezo M5 eset: PASS.
- Teljes M1–M4 regresszio: PASS.
- 500 rekord / 20 commodity mapping+rangsor performance fixture: kb. 11 ms.
- Valos UEX fetch: HTTP 200, auth nelkul, 215 rekord.
- Helyi in-app browser: 12/12 technikai proba PASS.
- Kezi UEX refresh: 215 rekord, User Data fingerprint `30efd6b4` elotte/utana azonos.
- TTL reload: ugyanaz az aktiv dataset ID maradt.
- Szimulalt UEX commit-abort: aktiv dataset es 215 raw/normalizalt rekord megmaradt.
- Desktop es 390 px mobil UEX panel: PASS.
- Bongeszo warning/error: 0/0.

## Talalt es javitott hibak

1. A Wiki strukturális taxonomy-utotag miatt a kezdeti valos mapping 0/72 volt. Csak a bizonyitott `UnrefinedOres` es `Raw_Minerals` utotag celzott eltavolitasaval 19 biztonsagos exact egyezes lett.
2. A korabban mentett Crafting Card csak ingredient UUID-t tartott, ezert a mining commodity snapshot nem kapcsolodott. A normalizalt Blueprint Recipe Slot API-provenance-ebol visszakeresett `commodityUuid` javitotta, nev-talalgatas nelkul.
3. A kartyak csak a mining indexet lattak, location reszletet nem. Az aktiv kartyak commodity reszleteinek lazy cache-betoltese bekerult.
4. A UEX `date_modified` valos valasza epoch masodperc volt. ISO-idopont normalizalas kerult be.

## M6 elott nyitott

- teljes standalone Crafting/Farm Card export a refinery snapshottal;
- az `Info` referencia-UI vegleges feldolgozasa;
- standalone export offline ujranyitasa;
- kozvetlen `file://` Chrome/Edge proba;
- kulon Edge regresszio;
- vegso V1 elfogadas es csak ezutan stabil release.

Az M5 nem stabil kiadas, nem keszult tag vagy release-fajl.
