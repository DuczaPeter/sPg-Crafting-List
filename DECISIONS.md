# DECISIONS.md

## 2026-08-22 - Egyfajlos HTML projekt es fajlverziozas

- Az alkalmazas neve: `sPg Crafring List`.
- A projekt tipusa: `one-file-html`; az alkalmazas mukodese egyetlen, onallo HTML-fajlban marad.
- Az elso fejlesztesi munkafajl tervezett helye: `src/sPg Crafring List V001-dev.html`.
- Az elso ellenorzott kiadas tervezett helye: `releases/sPg Crafring List V001.html`.
- Stabil kiadas csak tenylegesen lefuttatott kiadasi kapu utan keszulhet.

Ez a kezdeti dontes a kesobbi teljes specifikacio elott szuletett. A nev- es fajlszerkezeti reszet az alabbi dontes felulirja.

## 2026-08-22 - Vegleges nev, ketfajlos alkalmazas es V1.0 keret

- A vegleges alkalmazasnev: `sPg Crafting List`.
- A kanonikus fo fajl: `sPg Crafting List.html`.
- A fo alkalmazas kozponti, kulso stilusfajlja: `Info/style.css`; ezt nem kell a fo HTML-be agyazni.
- Az exportalt Crafting/Farm Card mindig standalone HTML, a szukseges CSS-t sajat `<style>` blokkban tartalmazza.
- Tamogatott kornyezet: Windows 11, aktualis Chrome es Edge; a `file://` mod valos tesztje kotelezo.
- Crafting Card keszletprioritas: a felhasznalo altal rendezheto kartya-sorrend, felulrol lefele.
- V1 keszletkezeles: tervezes es foglalas, vegleges inventory-levonas nelkul.
- V1/V002 torteneti location rangsor: occurrence csokkeno, spawn csokkeno, maximum Quality csokkeno; a kesobbi V003 dontes ezt felulirja.
- A 82 pontos specifikacio teljes V1.0 celallapot, belso milestone-okkal, funkcioelhagyas nelkul.
- A reszletes dontesforras: `docs/IMPLEMENTATION_DECISIONS.md`.

## 2026-08-24 - V001 stabil bundle es elfogadott release-waiverek

- A stabil V001 ketfajlos, fagyasztott bundle: `releases/V001/sPg Crafting List.html` es `releases/V001/Info/style.css`.
- A stabil HTML a kanonikus fajl funkcioazonos masolata, csak a harom futasideju `V001-dev` verziofelirat `V001` ertekre cserelt.
- A stabil bundle integritasat `releases/V001/SHA256SUMS.txt` rogziti; a kiadast a `V001` annotalt Git tag azonositja.
- O04 Windows-szintu offline hard-disconnect ujranyitas: `NOT TESTED – ACCEPTED RELEASE WAIVER`.
- Edge E01-E10 kezi acceptance: `NOT TESTED – ACCEPTED RELEASE WAIVER`.
- A waiverek nem valtoztatjak PASS-ra a kihagyott teszteket, de a felhasznalo kifejezett dontese alapjan nem blokkoljak a V001 stabil kiadasat.

## 2026-08-24 - V002 egyetlen futtathato HTML

- A V002 fo alkalmazas egyetlen `sPg Crafting List.html`; teljes CSS es JavaScript beagyazva.
- `Info/style.css` es semmilyen mas helyi mellekfajl nem lehet runtime-fuggoseg.
- Az export ugyanazt az embedded CSS-forrast olvassa, ezert kulon base64 snapshot, CSSOM/fetch fallback es ketforrasos driftellenorzes nem marad.
- A gyoker `Info/` referenciaanyag megmaradhat a repositoryban, de a felhasznalonak nem kell atadni.
- A V001 tag, release commit es `releases/V001/` tartalma valtozatlan.

## 2026-08-24 - V002 stabil single-file release-szabaly

- A stabil V002 felhasznaloi runtime artifact pontosan egy `sPg Crafting List.html`; a `releases/V002/RELEASE.md` es `SHA256SUMS.txt` csak repository-dokumentacio.
- Stabil V002-ben nincs `Info` mappa, kulon CSS/JavaScript, build-kovetelmeny vagy mas helyi sidecar.
- A stabil HTML a tesztelt V002-dev forrastol csak a harom `V002-dev -> V002` futasideju verziojelolesben terhet el.
- A `V002` tag csak teljes regresszio, valos Chrome `file://`, single-file gate, elo Wiki/UEX es valtozatlan V001 ellenorzes utan keszulhet.

## 2026-08-24 - V003 farm recommendation szemantika

- A V002 `occurrence -> spawn -> maximum Quality` location-rangsorat a V003 felulirja.
- Primary/relevant resource csak exact target commodity UUID es canonical API `resource.label` egyezes eseten; az `is_current` es a `materialIndex` erre nem alkalmas.
- Secondary/by-product resource a ranking elott `SECONDARY_EXCLUDED`.
- Rangsor rendszerenkent es normal/space kategoriankent: group probability/spawn, relative probability/occurrence, Q500+ quantized Quality ertekek, majd Quality range.
- Quality-valoszinuseg nem becsulheto, ha azt az API nem adja; kitalalt szazalek tilos.
- A raw/normalizalt location-resource-material adat megmarad, a recommendation kulon, visszakovetheto projekcio.
- A Material Database, Crafting/Combined snapshot es standalone export egyetlen kozos recommendation fuggvenyt hasznal.
- Stabil V003 kiadas vagy tag a C001 fejlesztesi korben nem keszulhet.

## 2026-08-24 - V003 Radar Signature mezohatar es Top-3 projekcio

- A user-facing Radar Signature kanonikus forrasa az `Info/Radar Signature.png` alapjan keszitett, beagyazott es verziozott registry; a kep projektbizonyitekkent megmarad, runtime sidecar nem lehet.
- A Star Citizen Wiki `signature` mezoje csak `API_RAW_NOT_USER_FACING` diagnosztika. Registry-egyezes hianyaban `Nincs adat`; Wiki fallback vagy talalgatas tilos.
- A C001 primary gate es spawn -> occurrence -> Quality sorrend valtozatlan. A rangsor utan rendszerenkent es NORMAL/SPACE kornyezetenkent maximum harom dense rank tier jelenik meg.
- Teljes rangtuple-tie azonos helyezest kap; a kovetkezo eltero tuple a kovetkezo egesz rank. A teljes raw location es decision trace megmarad.
- Ship Mining kaphat kulon NORMAL es SPACE listat; nem-Ship materialnak nem keszul ertelmetlen SPACE ajanlas.
- Az SCMDB csak read-only masodlagos, emberi naming/grouping sanity reference. Szazaleka nem Wiki spawn/occurrence, nem ranking input, es nincs runtime SCMDB-fugges.
- Stabil V003 release vagy tag a C004 fejlesztesi korben sem keszulhet kulon felhasznaloi jovahagyas nelkul.

## 2026-08-24 - V003-C005 forraskonzisztencia es final-card roadmap

- Radar Signature user-facing kanonikus forrasa kizárólag az `Info/Radar Signature.png`; a Wiki `signature` marad `API_RAW_NOT_USER_FACING`.
- Minden mas mining adat kanonikus forrasa a Star Citizen Wiki API `4.9.0-LIVE.12232306`: identity, UUID, rendszer, location, provider, resource, primary/secondary, spawn, occurrence, Quality es ranking.
- Az SCMDB `4.10.0-ptu.12497254` csak read-only comparison/naming/grouping sanity reference; verzioelterese nem automatikus hiba, es nem irhatja felul a Wiki eredmenyt.
- Lagrange F Aluminum primary resource a SPACE dense rank 2 resze. Csak az ugyanott levo Corundum resource Aluminum mellékanyaga secondary es kizarando. A C004 Top-3 nem valtozik.
- Radar kategoriak csak exact UUID + bizonyitott Wiki mining category flag/method alapjan vezethetok le. A Wiki `signature=3000` onmagaban nem FPS-bizonyitek; Carinite, Jaclium, Sadaryx es Saldynium ezert `Nincs adat`.
- A vegso V003 felhasznaloi alapnezet card-first lesz. A kartyan csak gameplayhez szukseges adatok maradnak: blueprint/item nev, Size, Class/Type, Grade/Quality, Crafting Time, requested quantity, max craftable, Recipe Slot, material, egy darabra es osszesen szukseges mennyiseg, keszlet, hiany/maradek, Quality rule, Mining+UEX snapshot es curated Radar.
- A Radar PNG szinei csak bizonyitott material mappingnel adhatnak nevszint, chip-hatteret es border/accentet; ismeretlen anyag neutralis fallbacket kap.
- Blueprint, material, mining, refinery es radar elemek kattinthatoak lesznek, de a reszletnezet ugyanabban az egyfajlos HTML-ben marad. Ott jelenhet meg teljes Top-3, spawn, occurrence, Quality, provider, source, radar, refinery es Wiki deep link.
- Nem keszul kulon runtime HTML. A default nezet Crafting Card + szukseges user UI; diagnosztika, baseline, debug es raw adatok Advanced/Diagnostics ala kerulnek.
- A standalone export ugyanazt a tiszta final-card adatmodellt hasznalja. A roadmap: V003-C006 adatkontraktus, V003-C007 card-first UI, V003-C008 in-app detail/deep link, V003-C009 Advanced/Diagnostics, V003-C010 standalone parity es acceptance.
- A roadmap zarasa nem V003 release-engedely. Stabil V003 tag/release csak kulon felhasznaloi jovahagyassal keszulhet.

## 2026-08-24 - V003-C006 final-card es material intelligence hydration

- A Crafting Card letrehozasa, alkalmazasinditas/reload es standalone export elott minden recipe ingredient automatikusan megkapja a cache-bol vagy Wiki API-bol elerheto material intelligence reszletet; a Material Database megnyitasa nem lehet elofeltetel.
- Cache talalat offline is teljes kartyaadatot ad. Offline es cache nelkul explicit nem elerheto allapot jelenik meg; nincs crash, kitalalt adat vagy csendes rosszabb fallback.
- A normal UI es az export ugyanazt a `buildFinalCraftingCardViewModel()` projekciot hasznalja, amely a valtozatlan determinisztikus Allocation Engine eredmenyet, a C001-C005 mining/radar projekciot es a biztonsagos UEX mappinget fogyasztja.
- Stileron UEX eredmenye exact `Nincs biztonságos UEX refinery adat`; fuzzy parositas tovabbra is tilos.
- A final cardon a material tokenek neutralis, jovobeli accent hookot es stabil UUID/nev data-attributumot kapnak. Uj materialszin vagy C008 reszletnezet nem resze a C006-nak.
- Stabil V003 release/tag tovabbra sem engedelyezett.

## 2026-08-24 - V003-C007 material color registry

- A materialszin kanonikus forrasa az `Info/Radar Signature.png` SHA-ellenorzott kep es az abbol pixelenkent auditalt, beagyazott `MATERIAL_COLOR_REGISTRY`; a PNG runtime sidecar nem lehet.
- A registry exact Wiki commodity UUID-t, canonical nevet, source sort/koordinatat, foregroundot, backgroundot, border/accentet, forrasverziot es `VERIFIED_COLOR` statuszt tarol.
- A kepen bizonyitott hue a foreground es border. A chip background ugyanennek a hue-nak determinisztikus 16%-os UI tintje; nem uj szemantikai szin es nem modositja az identity hue-t.
- Resolver sorrend: exact Wiki UUID, majd egyetlen exact canonical nev a legacy ingredient/cache rekordokhoz. Fuzzy, rarity, Quality, Wiki signature, SCMDB, mining-category, random vagy hash szinkovetkeztetes tilos.
- Bizonyitek nelkul `UNMAPPED_COLOR` neutralis fallback jar; a status diagnosztikaban megmarad, de a normal UI nem ir ki kulon UNKNOWN COLOR szoveget.
- Crafting Card, Radar accent, My Materials, Combined Materials, Material Database es standalone export ugyanazt a resolvert es generic CSS-valtozokat hasznalja.
- Stabil V003 release/tag es V003-C008 tovabbra sincs engedelyezve.

## 2026-08-25 - V003-C008 single-file detail route es Wiki deep link

- Blueprint/item, material, Radar Signature, mining es refinery reszlet ugyanabban a `sPg Crafting List.html` fajlban nyilik meg; kulon runtime oldal vagy sidecar nincs.
- A belso route `#spg-detail=<tipus>:<azonosito>`; a bongeszo Vissza/reload es a sajat kartyahoz visszatero gomb determinisztikusan kezelt. Ervenytelen cel explicit fallbacket kap, nem okoz crasht.
- Wiki link csak exact API `web_url` alapjan vagy elozetesen auditalt, API-bol szarmazo sluggal keszulhet. Nevbol kepzett/fuzzy URL tilos; bizonyitek nelkul `NO_PROVEN_WIKI_URL` es nincs link.
- A standalone export ugyanazt a detail modellt hasznalja, de minden reszletet az embedded snapshotbol renderel; runtime API fetch es kulso eroforras nincs. A Wiki link opcionlis internetes felhasznaloi muvelet.
- A C001-C007 ranking, grouping, naming, Radar, color, allocation es hydration modellje nem valtozik. Stabil V003 release/tag es V003-C009 tovabbra sincs engedelyezve.

## 2026-08-25 - V003-C008.1 public Wiki es API linkhatar

- A `Megnyitás a Star Citizen Wiki-ben` muvelet csak `https://star-citizen.wiki/` hoston levo, exact forrasbol vagy MediaWiki exact title/redirect audittal bizonyitott cikkre mutathat.
- A `https://api.star-citizen.wiki` host kizarolag a kulon `API adatlap megnyitása` muvelethez hasznalhato; a ket linktipus neve es resolvere nem moshato ossze.
- Public Wiki URL fuzzy, reszleges vagy canonical nevbol vakon kepzett talalattal nem hozhato letre. Bizonyitek nelkul `NO_PROVEN_PUBLIC_WIKI_URL`, es a normal UI-ban nincs public Wiki gomb.
- A feloldott public Wiki metadata a hydrated/output snapshot resze, a standalone nem futtat runtime MediaWiki/API keresest.
- JS-300 es Beryl public oldala VERIFIED; Stileron es Savrilium jelenleg bizonyitek nelkul marad. C009 es stabil V003 release/tag tovabbra sincs engedelyezve.

## 2026-08-25 - V003-C010.1 compact nyertesprojekcio

- A Final Card nem listazza a teljes nyers mining/refinery tie-keszletet. A raw lista es a rangsorolasi bizonyitek a snapshotban es a C008 detailben marad.
- Miningnel a C010 korabbi, determinisztikus elso top-tier kivalasztasa marad. Egy C002 presentation group sajat labelt kap; ugyanazon kivalasztott tier tobb exact azonos rank tuple-ju groupja `elso (+N azonos legjobb)` formaban jelenik meg. A NORMAL/SPACE tier nem olvaszthato ossze.
- Refinerynel a rendszer `rankingValue` exact nyertesei szamitanak. A megjelenites determinisztikus elso friendly terminalnev, tobb nyertesnel `(+N azonos legjobb)`; alacsonyabb rang nem szamolhato bele.
- A `Refinement Processing -` es `Refinement Center -` prefix, valamint az ismert rendszer-zarojelek csak a C010 prezentacios labelbol tunnek el; a raw UEX terminalnev nem modosul.

## 2026-08-25 - V003-C011 vegleges fonezeti reference lock

- A vegleges Blueprint Browser + Final Crafting Card vizualis acceptance referencia az `Info/A fö nézet.png` es `Info/A Crafting card.png`; a C011 celteszt mindket fajlt SHA-256-tal zarja.
- A normal Blueprint Browser fonezet nem renderel technikai cache-adatlapot. Blueprint-kivalasztas csak a bal oldali kijelolest es a jobb oldali Final Crafting Cardot frissiti.
- UUID, SC-verzio, source, fetchedAt es recipe slot technikai adat nem torolheto: a modellben, diagnosztikaban vagy Data / Settings alatt megmarad.
- A blueprint talalati lista sajat fuggoleges scrollt hasznal; a C010.1 Final Card es minden uzleti modell erintetlen.
- Stabil V003 release/tag tovabbra is csak kulon felhasznaloi jovahagyassal keszulhet.

## 2026-08-25 - V003-C012 Crafting List Final Card paritas

- A Blueprint Browser és a Crafting List Final Card megjelenítése egyetlen kanonikus `buildFinalCraftingCardViewModel()` + `renderFinalCraftingCardContent()` útvonalat használ; a listás kontextus csak kezelőréteget adhat hozzá, külön recipe/material/mining/refinery/radar renderert nem.
- Az expanded/collapsed és quantity állapot User Data, ezért reload után megmarad. A kártyasorrend marad az Allocation Engine foglalási prioritása.
- A C008 detail route listás megnyitáskor a forráskártya és forrásmodul azonosítóját is tárolja. Ez prezentációs/navigációs kontextus; a detail adatmodell és a ranking/allocation nem változik.
- A standalone export a kanonikus view-modelt használja és nem kap külön runtime adatforrást vagy külső erőforrást.
- Stabil V003 release/tag és C013 továbbra is csak külön felhasználói utasításra indulhat.

## 2026-08-29 - V003-C012.1 kozos effektív Quality policy

- A Final Card, Crafting List, Combined Materials, Allocation Engine es standalone egyetlen `resolveEffectiveMaterialQualityPolicy()` eredmenyet fogyasztja; kulon Quality vagy allocation logika nem keszulhet.
- Materialterv exact material UUID szerint, USER-scoped `user:materialQualityPlans` settingben tarolodik. Alapertelmezese `RECIPE`, ezert regi adatnal es explicit terv nelkul a C012 viselkedes marad.
- `TARGET_Q` nem gyengitheti a recept minimumat; `HIGHEST_Q` megtartja a baseline minimumot. A C012.3 pontositas szerint a `FIXED` recipe-szemantika nem valtozik, de explicit user materialterv allocation-korlatkent ervenyesulhet; `UNKNOWN` tovabbra is fail-safe es nem irhato felul.
- A Combined Quality-bucket `Lefoglalva` erteke kizarolag a determinisztikus Allocation Engine reservation eredmenye lehet. Batch nem szamolhato tobbszor, bucket-sum nem haladhatja meg a tenyleges inventoryt.
- A Combined detail a C008 router/renderer es a meglevo exact material API resolver bovítese; Mining/UEX/Radar nem kerul bele. A standalone csak a feloldott export-snapshotot hasznalja, runtime fetch nelkul.
- Schema bump nem indokolt, mert a terv a meglevo backup/restore USER settings csatornajat hasznalja. Stabil V003 release/tag es C013 tovabbra is csak kulon felhasznaloi utasitasra indulhat.

## 2026-08-29 - V003-C012.2 aktiv SC-verzio invarians

- Az aktualis user-facing snapshot kanonikus SC-verzioja az aktiv blueprint dataset verzioja. Main, Crafting List, C008 detail, material intelligence es standalone ugyanazt a `resolveActiveScVersion()` eredmenyt hasznalja.
- Raw es normalized cache-ek verzionkent megmaradhatnak. Aktualis projekcio/hydration csak exact aktivverzio-egyezessel fogyaszthat rekordot; UUID-egyezes onmagaban nem eleg.
- Ha a mining dataset nem az aktiv SC-verziohoz tartozik, nem cimkezheto at aktualisnak: explicit cross-version block/status kell, majd a megfelelo verzio betoltese.
- Exact API linknel a forrasbol bizonyitott host/path/slug marad, de a `version=` query az aktiv SC-verziohoz igazodik. Nevbol kepzett vagy fuzzy URL tovabbra is tilos.
- Aktualis snapshot `scVersion`, material source `gameVersion`, mining source `gameVersion`, API link `version=` es standalone detail verzio egymassal azonos. Tudatos torteneti cross-version adat csak kulon statuszban jelenhet meg.
- Stabil V003 release/tag es C013 tovabbra is csak kulon felhasznaloi utasitasra indulhat.

## 2026-08-29 - V003-C012.3 recipe baseline es user allocation constraint szetvalasztasa

- A `baselineRecipeQualityRule` a recept bizonyitott szemantikaja; ezt user beallitas nem irja at. A `userMaterialQualityConstraint` ettol kulon USER-scoped allocation-korlat.
- `FIXED + RECIPE` tovabbra is barmely Quality batch-et elfogad. `FIXED + TARGET_Q/HIGHEST_Q` mellett a recept FIXED marad, de az explicit felhasznaloi cel az allocation, missing Quality, Max craftable, Combined, Final Card, detail es standalone kozos effektív policyja.
- HP/receptminimum felhasznaloi tervvel nem gyengitheto. `UNKNOWN` tovabbra is fail-safe; bizonyitek nelkul nincs Quality-talalgatas.
- A megszakadt C013 release-candidate nem kiadasi bizonyitek: C013 commit nem volt, az artifact `INVALIDATED_BY_C012.3_RELEASE_BLOCKER` statuszt kapott. C013 csak uj felhasznaloi utasitasra indulhat ujra.

## 2026-08-30 - V003-C012.4 numerikus draft/commit eletciklus

- Numerikus input szerkesztese kozben a DOM-szoveg draft; nem User Data es nem indok teljes alkalmazas-renderre. Normalizalas, state-iras es fuggő ujraszamolas csak Enter/change/blur commitkor tortenhet.
- Kompakt numerikus mezonel az elso pointer- vagy keyboard-focus teljes ertekcseret segito kijelolest kap. Mar fokuszalt mezore kattintas a bongeszo nativ caret-viselkedeset hagyja ervenyesulni.
- A kozos editor nem irhatja felul a meglevo mezo-specifikus uzleti szabalyokat. Quantity a regi min/clamp logikat, Target Q a 0..1000 egesz validaciot, My Materials az eredeti SCU/ITEM parser es precision szabalyokat tartja meg.
- C013 csak uj, C012.4 utani byte-tartalombol indulhat uj felhasznaloi utasitasra. A regi candidate tovabbra is invalidalt.

## 2026-09-08 - V003-C013.7 canonical material authority

- A user-facing canonical material UUID nem függhet a tárolt User Data batch-ektől vagy azok beszúrási sorrendjétől.
- Authority sorrend: verified exact API identity relation, canonical commodity record, verified source relation, végül User Data provenance. User Data bizonyított canonical UUID-t nem írhat felül.
- A commodity `refined_version` mezője exact identity-bizonyíték akkor is, ha a hivatkozott source rekord nincs külön az aktív datasetben; a source UUID a runtime projectionben és provenance-ben megmarad.
- Régi batch-et nem kell törölni vagy destruktívan migrálni. Új batch canonical UUID-val mentődik, miközben az eredeti UUID `sourceMaterialUuid` provenance lehet.
- Fuzzy/name-only merge továbbra is tilos; bizonyítatlan duplicate név fail-safe módon unresolved marad.

## 2026-09-09 - V004 Craft Complete safety contract

- V004 külön IndexedDB adatbázist használ; a V003 adatbázis csak explicit user backup/migration confirmation után, read-only forrásként olvasható.
- Craft Complete kizárólag a Crafting Cardon látható, revision- és SHA-256 snapshot-hash által kötött reservationből fogyaszt; completion-time reallocation, fallback batch, Quality-csere és arányos multi-batch keverés tilos.
- Partial completion egész késztermék-darabszám, alapértéke 1; a fogyasztás recipe slotonként az Allocation Engine reservation-sorrendjének prefixe. Minden belső mennyiség egész unit, kerekítés és anyagvesztés nélkül.
- Locked invariáns minden érintett batchre: `before = consumed + after`, eltérés 0 unit. Nem egész vagy nem biztonságos eredmény, stale snapshot vagy megváltozott reserved entry teljes tranzakciós `BLOCKED` állapot.
- Craft Complete és Undo külön-külön egyetlen atomi IndexedDB tranzakció. A History append-only; státusz `COMPLETED` vagy `UNDONE`, Redo nincs, cardonként csak a legutóbbi aktív completed event Undozható.
- Undo exact deltát állít vissza, nem inventory snapshotot. Kompatibilis eredeti batch használható, különben új restored batch készül; inkompatibilis rekord nem írható felül.
- A részletes, kódból igazolt beillesztési terv: `docs/V004_C001_CRAFT_COMPLETE_ARCHITECTURE_AUDIT.md`.

## 2026-09-09 - V004 migration foundation conventions

- A négy V004 revision rekord determinisztikus kezdőértéke `0`; timestamp revisionként nem használható. A `migration:v003` rekord csak sikeres atomi migrációkor jön létre.
- A V003 alkalmazás/schema identity nincs bizonyíthatóan eltárolva a source adatbázisban, ezért a migration ledger e mezői `null` értékűek; a DB-név, DB-verzió, store-topology és SHA-256 payload bizonyított.
- A kötelező migráció előtti biztonsági mentés schema 2 marad, hogy hű V003 User Data backup legyen. A normál V004 export schema 3, benne üres vagy később valós `craftHistory` és durable `userMeta`.
- A direct migráció pristine célja csak üres User Data/History és pontosan négy 0 értékű revision meta; Game Data/cache és belső non-USER settings nem teszi dirtyvé.
- Live `4.10.0-LIVE.12519617` blueprint auditban nincs bizonyított output-count mező: `OUTPUT_COUNT_UNPROVEN – COMPLETION MUST BLOCK AFFECTED RECIPES` a C004 prerequisite.

## 2026-09-09 - V004 revision és reservation snapshot contract

- `inventoryRevision`, `craftListRevision`, `allocationRevision` és `cardRevision` nemnegatív safe integer. Szemantikai mutation tranzakciónként pontosan egyet növel; overflow fail-closed blocker, timestamp nem revision.
- Az érintett rekordok és revisionjeik ugyanabban az IndexedDB readwrite tranzakcióban íródnak. Részleges rekord- vagy revision-commit nem megengedett.
- A reservation snapshot kizárólag runtime állapot: IndexedDB-be és backupba nem kerül. Startup, reload, import és migráció után a Card stale, explicit Reallocate szükséges.
- A canonical payload szemantikai tömbsorrendet megőriz, objektumkulcsokat stabilan rendez, és a Card/revision/item/version/recipe slot/reserved batch exact evidence-et tartalmazza. Display label és collapse nem identity.
- Hash kizárólag Web Crypto SHA-256, lowercase hex. Crypto hiányakor nincs gyengébb fallback: `HASH_UNAVAILABLE` és BLOCKED.
- MAX és partial prefix csak a Cardon látható reservationből vezethető le; completion-time reallocation vagy más eligible batch fallback később sem engedélyezhető.

## 2026-09-09 - V004-C004 atomic completion commit contract

- A completion confirmation önmagában nem módosít durable állapotot. A `MAX` csak inputkitöltés; a `Mégse` nulla írás.
- A commit az összes snapshotban reserved entryt újraellenőrzi akkor is, ha a partial kérés csak prefixet fogyasztana. Bármely eltérés `STALE_RESERVATION`, nulla írás és explicit Reallocate.
- A batch deduction, derived inventory aggregate, Card update/removal, append-only History `add()` és revision/meta update ugyanazon öt-store readwrite tranzakció része; siker csak `transaction.oncomplete` után.
- A `craftTransactionId` a durable idempotenciakulcs. Replay `ALREADY_COMPLETED`, második levonás és második event nélkül.
- A completed History event megőrzi a full reservation snapshotot/hashét, exact batch-deltákat, pre-craft Cardot és before/after revisionöket. Ez a későbbi Undo alapja, de Undo és History UI nem C004 scope.
- Sikeres completion után nincs automatikus allocation. Partial Card reservationje stale, full eltávolítás után absent; további craft előtt explicit Reallocate kell.

## 2026-09-09 - V004-C004.1 craft list revision határ

- A `craftListRevision` kizárólag aktív Card membership vagy persisted order/priority változásakor nő. Egy partial quantity update önmagában craft list +0, miközben a módosított Card `cardRevision +1`.
- Full Card removal craft list +1. Más Card `cardRevision` csak akkor nő, ha a removal miatt saját persisted order értéke ténylegesen megváltozik.
- Partial után az inventory/allocation/history +1 és Card +1 önmagában stale-lé teszi a korábbi reservationt; a craft list mesterséges növelése nem használható invalidation-helyettesítőként.
- A jelenlegi production Card pipeline minden valódi és hiányos/migrált Cardot `OUTPUT_COUNT_UNPROVEN` állapotban tart. Bizonyított API/model semantics nélkül nincs exact-capable promotion és nincs output-count = 1 default.

## 2026-09-09 - V004-C004.2 production output proofhatár

- A source requirement mennyiség exact belső unitra alakíthatósága és a „per finished item” szemantika két külön bizonyítási kötelezettség. Egyik nem következik a másikból.
- Az OpenAPI singular „crafted item” vagy „ingredients required to craft the item” megfogalmazása nem output-count bizonyíték. Count=1 csak explicit mezőből vagy dokumentált univerzális invariánsból vezethető le.
- Root, nested, tier és kapcsolt item blueprint reprezentáció output count/yield mező nélkül nem jogosít `PER_FINISHED_ITEM_NORMALIZED_EXACT` promotionre, még akkor sem, ha az ingredient-mennyiségek egymással konzisztensen ismétlődnek.
- A negyedik SCU-tizedesjegy utáni nem nulla source számjegy 0-unit toleranciával nem minősíthető automatikusan lebegőpontos zajnak. Szándék bizonyítása nélkül az exact source-to-unit szemantika unproven.
- Bizonyítatlan production, régi vagy migrált Card full és partial completionje egyaránt fail-closed; nincs outputCount=1, más batch fallback vagy completion-time reallocation.
