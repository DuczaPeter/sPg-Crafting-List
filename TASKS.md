# TASKS.md

## Aktualis

### V003-C012.5D2B Exact manual file gate

- [x] A jelenlegi fő V003 HTML közvetlen `file://` megnyitása: USER MANUAL PASS.
- [x] 15/15 kézi pont: fő modulok, FR-86 Card, külön Shell/Field Array pool assignment, reload persistence és Combined metrikák.
- [x] Shell `Minimum Q · Q500+`; Field Array `MAX Q · Q900+`; Frequency Controller `Recept szerint`.
- [x] Nem blokkoló UX note: reload után JS-300 default; az új transient FR-86 preview nem írja felül a megmaradó bound Cardot.
- [x] Application code változás nincs; automated regression és Chrome automation nem futott.
- [ ] Új C013 candidate – NOT STARTED; a korábbi candidate invalidált marad.

### V003-dev farm recommendation

- [x] Kulon `develop/V003` branch a kozos main alapjan; V001/V002 fagyasztva.
- [x] Teljes Star Citizen Wiki commodity/location/resource semaaudit hivatalos API-forrassal.
- [x] Primary resource gate exact target UUID + canonical API resource label egyezessel; fuzzy es `materialIndex === 0` szabaly nelkul.
- [x] Secondary/by-product resource kizarasa a rangsor elott es reszletes recommendation decision trace.
- [x] C001 baseline: rendszerenkenti egy legjobb normal es egy legjobb space ajanlas, szigoru All Lagrange osszevonassal; C004 ezt a rangsor modositas nelkul Top-3 dense rank projekciora bovitette.
- [x] Spawn/group probability → occurrence/relative probability → quantized/range Quality determinisztikus rangsor.
- [x] Kozos recommendation fuggveny Material Database, Crafting/Combined snapshot es standalone export szamara.
- [x] Common/uncommon/legendary, secondary trap, Stanton/Pyro/Nyx, normal/space es 5 000 locationos tesztek.
- [x] `V003-C001` teljes M1-M6.1 + C04 + elo Wiki API + V002-integritas regresszio PASS.
- [x] Valodi Chrome localhost 13/13, reload fingerprint es konzolhiba 0 PASS.
- [x] `V003-C002`: ranking utani presentation/grouping reteg, nyers location lista es decision trace megorzesevel.
- [x] Lagrange provider-csalad rovid neve + konkret LP-lista; `All Lagrange Points` csak szigoru teljes tie eseten engedelyezett.
- [x] Pyro Akiro/RMB (es bizonyitek-gate-es jovobeli RAB), valamint Aaron Halo Mining Base emberi csoportok valos API provider/resource/parent bizonyitekkal.
- [x] Material Database, Crafting/Combined snapshot es standalone export ugyanazt a csoportositott recommendation modellt hasznalja.
- [x] `V003-C002` teljes regresszio, 33 M3 eset es elo Aluminum/Agricium/Stileron grouping-proba PASS.
- [x] Valodi Chrome `file://` kezi kapu: USER MANUAL PASS; a felhasznalo futtatta, nem Codex automation.
- [x] `V003-C003`: teljes Wiki commodity/material nev- es duplicate-audit a `4.9.0-LIVE.12232306` API-verzion.
- [x] Centralizalt `resolveMaterialName()` modell raw/canonical/display/alias/source/status mezokkel; fuzzy matching nelkul.
- [x] 11 exact UUID-hoz kotott verziozott alias, 25 biztonsagos suffix-normalizalas, 1 invalid technical fragment rejtese es 0 ambiguous eset.
- [x] Het `refined_version` kapcsolattal bizonyitott duplicate materialcsalad egyetlen felhasznaloi rekordra projektalva, raw UUID-k megorzesevel.
- [x] Material Database, loadout, inventory, crafting, Combined, farm, UEX, datalist/select es standalone export kozos materialnev-projekcioja.
- [x] `V003-C003` celzott 20 eset, elo 206/72 rekordos audit es teljes M1-M6.1 + C04 + C001/C002 regresszio PASS.
- [x] Valodi Chrome localhost 14/14, raw/alias kereses, duplicate UI, reload fingerprint es alkalmazas-konzol WARN/ERROR 0 PASS.
- [x] `V003-C004`: `Info/Radar Signature.png` forraskepbol 33 exact materialrekordos, 3 kategoriaszabalyos, verziozott Radar Signature registry.
- [x] Wiki Radar Signature csak `API_RAW_NOT_USER_FACING` diagnosztika; registry-hianyban explicit `Nincs adat`, találgatott fallback nélkül.
- [x] Rendszerenkent es `NORMAL`/`SPACE` kornyezetenkent maximum 3 dense rank tier; teljes tuple-tie azonos helyezes, nyers location/decision trace megorizve.
- [x] Nem-Ship materialnal ertelmetlen SPACE lista elnyomva; Material Database es standalone export azonos Top-3 projekciot hasznal.
- [x] SCMDB read-only masodlagos referenciaaudit: 6 MATCH, 1 EXPLAINED_DIFFERENCE, 2 UNVERIFIED; runtime/ranking fugges nincs.
- [x] `V003-C004` teljes M1-M6.1 + C04 + C001-C003 regresszio, elo Wiki audit, standalone export es V002-integritas PASS.
- [x] Valodi Chrome localhost 15/15; Aluminum 3 NORMAL + 3 SPACE tier, unmapped `Nincs adat`, fingerprint `e6d8dec8`, konzol warning/error 0 PASS.
- [x] `V003-C005`: Lagrange F exact Wiki decision trace; primary Aluminum #2 INCLUDED, sibling Corundum secondary EXCLUDED, Top-3 valtozatlan.
- [x] Teljes Radar reconciliation: 7/7 aktiv ROC/FPS bizonyitott es mar C004-ben VERIFIED; 31 jogos UNMAPPED, koztuk Carinite/Jaclium/Sadaryx/Saldynium bizonyitek nelkul `Nincs adat`.
- [x] Wiki/PNG/SCMDB forrashierarchia es a C004 SCMDB auditmondat konzisztenciajavitasanak rogzítese.
- [x] Korabbi valos Chrome `file://` location-ranking proba `USER MANUAL PASS` bizonyitekkent megorizve; nem Codex automationkent dokumentalva.
- [x] `V003-C005` teljes C001-C005 + M1-M6.1 + C04 + elo Wiki + standalone + V002-integritas regresszio PASS.
- [x] Valodi Chrome localhost 15/15; Aluminum/Carinite UI, reload fingerprint `e6d8dec8` es konzol warning/error 0 PASS.
- [x] V003-C005 utani valos Chrome `file://` ujrateszt: USER MANUAL PASS; a felhasznalo futtatta, nem Codex automation.
- [x] `V003-C006`: card-first vegso Crafting Card header, requested quantity/max craftable, slotonkenti inventory/hiany/maradek/Quality es harom gameplay-intelligence panel.
- [x] Minden kartyamaterial automatikus cache -> Wiki API hydrationje letrehozaskor, megnyitaskor/reloadkor es export elott; Material Database megnyitasa nem elofeltetel.
- [x] Kozos `buildFinalCraftingCardViewModel()` a normal UI es standalone export szamara; material/blueprint/mining/refinery/radar DOM hookok C008 elokesziteskent, teljes reszletnezet nelkul.
- [x] Offline cached/uncached, JS-300 fresh-cache, quantity, max craftable, HP_MIN_500, FIXED, enough/partial/missing, reload es standalone C006 fixture PASS.
- [x] Valodi Chrome localhost friss originen Material Database elozetes megnyitasa nelkul Stileron/Beryl/Savrilium hydration PASS; reload fingerprint `39341365`, konzol WARN/ERROR 0.
- [x] Valodi Chrome-bol letoltott JS-300 standalone export: 448 917 byte, harom teljes material snapshot, embedded CSS, ervenyes snapshot JSON, kulso runtime/network resource 0, PASS.
- [x] `V003-C007`: `Info/Radar Signature.png` SHA- es 33/33 mintapixel-auditbol felepitett, exact Wiki UUID-s, verziozott `MATERIAL_COLOR_REGISTRY`.
- [x] Kozos `resolveMaterialColor()` exact UUID -> egyedi exact canonical nev sorrenddel; 31 `UNMAPPED_COLOR` neutralis fallback, fuzzy/rarity/Quality/signature/SCMDB/hash kovetkeztetes nelkul.
- [x] Crafting Card, Radar panel, My Materials, Combined Materials, Material Database es standalone export azonos color resolvert es generic CSS valtozokat hasznal.
- [x] JS-300: Stileron `#ffaa33`, Beryl `#3399ff`, Savrilium `#ffaa33`; quantity 2, max craftable 3, Radar/Mining/UEX es allocation valtozatlan automatizalt fixture-ben.
- [x] `V003-C007` teljes C001-C006 + M1-M6.1 + C04, color audit, standalone es V002-integritas regresszio PASS.
- [x] Valodi Chrome localhost color/UI/reload/technical probe PASS; fingerprint `52f14d76`, konzol warning/error 0. A letoltott export statikusan ervenyes, kulso runtime resource 0.
- [x] A korabbi C006 valodi Chrome `file://` Crafting Card/quantity/hydration/export eredmeny USER MANUAL PASS-kent rogzitve; nem Codex automation.
- [x] `V003-C008`: ugyanazon egyfajlos HTML-en beluli blueprint/item, material, Radar Signature, mining es UEX refinery reszletnezet.
- [x] Kattinthato C006 hookok, hash/history route, bongeszo Vissza, sajat `Vissza a Crafting Cardhoz`, reload-helyreallitas es explicit invalid-target fallback.
- [x] Wiki deep link sorrend: exact API `web_url`, majd csak auditalt API slug; fuzzy vagy nevbol talalt URL nincs, bizonyitek nelkul nincs link.
- [x] Standalone export 13 elore renderelt, snapshot-alapu interaktiv detaillel; API fetch es kulso runtime resource 0.
- [x] `V003-C008` teljes C001-C008 + M1-M6.1 + C04, elo Wiki link audit, standalone es V002-integritas regresszio PASS.
- [x] Valodi Chrome localhost: 15/15 technical probe, main/standalone navigation+reload+invalid fallback, fingerprint `e6d8dec8`, konzol warning/error 0 PASS.
- [x] C007 valodi Chrome `file://` eredmeny USER MANUAL PASS-kent dokumentalva; nem Codex automation.
- [x] `V003-C008.1`: kulon public Wiki es API resolver/action; public felirat alatt csak exact `star-citizen.wiki` host, API-adatlap kulon Advanced muveletkent.
- [x] Exact MediaWiki title/redirect audit: JS-300 es Beryl VERIFIED; Stileron es Savrilium `NO_PROVEN_PUBLIC_WIKI_URL`; nevbol kepzett/fuzzy public URL nincs.
- [x] Hydrated/output snapshot public feloldasi metadata es ugyanennek standalone felhasznalasa runtime fetch nelkul.
- [x] `V003-C008.1` celteszt, teljes C001-C008 + M1-M6.1 + C04, standalone es V002-integritas regresszio PASS.
- [x] C008.1 valodi Chrome localhost: 15/15, ot detailtipus linkparitas, main/standalone Back+reload, fingerprint `d7be3ccc`, konzol warning/error 0 PASS.
- [x] `V003-C009`: a ket referencia-PNG repositoryban kovetett forras; default fo nezet csak Blueprint Browser + aktualis Crafting Card, desktop ketoszlopos es mobil egymas alatti elrendezessel.
- [x] C009 kompakt JS-300 kartya: S1/Military/Power Plant/A, `15:00`, meglevo duplikacio-modellt hasznalo kosar, szerkesztheto quantity, slotonkenti per-one mennyiseg es felhasznalhato keszlet.
- [x] C009 source-record-only exact API linkek: JS-300, Stileron, Beryl Raw es Savrilium; public Wiki gomb nincs normal vagy standalone user UI-ban.
- [x] Rendszerenkenti legjobb mining/refinery snapshot, csak VERIFIED registrybol szarmazo Radar chipek es ugyanazon C008 belso detail controller a normal es standalone kartyaban.
- [x] `V003-C009` celteszt, teljes C001-C008.1 + M1-M6.1 + C04, elo exact API audit, standalone es V002-integritas regresszio PASS.
- [x] C009 valodi Chrome localhost: 15/15 Technical Probe, desktop+390 px, Back/reload, quantity roundtrip, fingerprint `d7be3ccc`, konzol warning/error 0 PASS.
- [x] `V003-C010`: default nezetben bal Blueprint Browser es jobb egyetlen, nem perzisztalt Final Crafting Card; a teljes tobbkartyas Crafting List csak kulon navigacios modul.
- [x] C010 exact kartya-kompozicio: S1/Military/A, 15:00, kosar, editable quantity, kompakt max, harom slot/material/per-one/stock sor es harom semleges material intelligence blokk.
- [x] Final Card rendszersorrend Stanton -> Pyro -> Nyx, rendszerenkenti egy best mining/refinery tier-group, spawn/occurrence/Quality dashboard nelkul; nyolc exact curated Radar chip.
- [x] C010 standalone parity: egy kompakt Final Card, exact API linkek, belso Mining/Refinery/Radar detail, embedded CSS/JS, runtime fetch es kulso runtime resource 0.
- [x] `V003-C010` celteszt, teljes C001-C010 + M1-M6.1 + C04, elo exact API audit, standalone es V002-integritas regresszio PASS.
- [x] C010 valodi Chrome localhost: 15/15 Technical Probe, kulon Crafting List, main/standalone Back+reload, quantity `1 -> 2 -> 1`, 390 px, fingerprint `d7be3ccc`, konzol warning/error 0 PASS.
- [x] `V003-C010.1`: Final Card-only compact Mining/Refinery projection; egy bizonyitott nyertes csoport neve, tobb exact tie eseten determinisztikus elso `(+N azonos legjobb)` jeloles, `+N további` es terminal-nevfal nelkul.
- [x] C010.1 megorzi a C001 NORMAL/SPACE szetvalasztast es a C010 elso top-tier kivalasztasat; alacsonyabb refinery `value_month` rekord nem szamolhato tie-kent, raw snapshot es C008 detail valtozatlan.
- [x] `V003-C010.1` celteszt + teljes C001-C010/M1-M6.1/C04 + standalone + Chrome localhost + 390 px + Back/reload + fingerprint + console + V002-integritas PASS.
- [x] `V003-C011`: a normal Blueprint Browser `RÉSZLET-CACHE`/technikai detail blokkja eltavolitva, a modelladat es Data / Settings diagnosztika megorizve.
- [x] A blueprint lista viewportfuggo belso scrollt kapott; 1920x1080, 1366x768 es 390x844 mereten horizontal overflow 0.
- [x] A ket final UI referencia-PNG SHA-zar alatt; az arva embedded fontszoveg eltavolitva, kulso CSS/font runtime-fugges tovabbra sincs.
- [x] `V003-C011` celteszt + teljes C001-C010.1/M1-M6.1/C04 + standalone + Chrome 15/15 + Back/reload + fingerprint + console + V002-integritas PASS.
- [x] `V003-C012`: a teljes Crafting List ugyanazt a kanonikus Final Card view-modelt es kozos DOM renderert hasznalja, mint a Blueprint Browser; a management csak kompakt priority/action fejlec.
- [x] C012 expanded/collapsed perzisztencia, quantity/max, prioritas/allocation, forraskartya-aware C008 detail, 3- es 10-kartyas responsive stressz, standalone es teljes regresszio PASS.
- [x] C012 valodi Chrome localhost: 15/15 Technical Probe, 1920/1366/390, horizontal overflow 0, detail reload+Back a forraskartyahoz, fingerprint `78b870b4`, konzol WARN/ERROR 0.
- [x] `V003-C012.1`: exact material UUID-s RECIPE/TARGET_Q/HIGHEST_Q User Data terv es kozos effektív Quality policy a Final Card, Crafting List, Combined Materials, Allocation Engine es standalone szamara.
- [x] C012.1 Quality-bucketek a valodi allocation reservationbol, batch double-count nelkul; Combined Quality+allocation detail, exact material API link es backup/restore kompatibilitas schema bump nelkul.
- [x] C012.1 teljes C001-C012 + M1-M6.1 + C04 regresszio, Chrome 15/15, 1920/1366/390, detail Back/reload, fingerprint `c4a49ff0` es konzol WARN/ERROR 0 PASS.
- [x] `V003-C012.2`: az aktiv blueprint dataset SC-verzioja a main/Crafting/detail/standalone API linkek, material intelligence es mining provenance kozos kanonikus verzioja.
- [x] Verzios cache-izolacio: raw/normalized keyek megorzese mellett az aktiv projekcio es hydration exact SC-verziora szurt; regi cache nem szivarog az aktiv snapshotba.
- [x] Ketverzios VERSION_A/VERSION_B fixture, 4.10 JS-300/Stileron/Beryl/Savrilium link/source invariant, standalone es teljes C001-C012.1 + M1-M6.1 + C04 regresszio PASS.
- [x] C012.2 Chrome localhost 15/15, refresh/reload/detail/standalone, fingerprint `36b67809`, konzol WARN/ERROR 0; felhasznaloi valodi `file://` kapu `USER MANUAL FILE:// PASS` (nem Codex automation).
- [x] `V003-C012.3`: a FIXED recipe baseline es az explicit USER material-allocation constraint szetvalasztva; FIXED + RECIPE `Barmely Q`, explicit TARGET_Q/HIGHEST_Q viszont az allocation minden fogyasztojaban ervenyesul.
- [x] Metamaterial Test #152 x3 valos 4.10 fixture: Stileron Q747 a Q800 celhoz ineligible, `missingAmount=0`, `missingQuality=1.5 SCU`, kartya nem teljesult, Max 0; Q850 hozzaadasaval csak a Q850 fogy, kartya teljesult, Max 3.
- [x] Ouratite Q860, HIGHEST_Q csokkeno batch-sorrend, HP-minimum vedelme, UNKNOWN fail-safe, priority/no-double-count, Combined/Final/standalone parity es backup/restore PASS.
- [x] C012.3 teljes C001-C012.2 + M1-M6.1 + C04 regresszio es Chrome localhost PASS; fingerprint `749d1f60`, konzol WARN/ERROR 0, V002 valtozatlan.
- [x] A megszakadt C013 auditja: C013 commit nem letezett; a candidate/evidence invalidalt, a C013 lezaro ciklus nem folytatodott.
- [x] `V003-C012.4`: mind a 7 letezo numerikus input kozos draft/commit editorral; karakterenkenti User Data iras es teljes rerender eltavolitva.
- [x] Quantity es Target Q replacement matrix, temporary empty, first-focus select, mar fokuszalt caret, Backspace/Delete, nyil/Home/End, Enter/change/blur/Tab PASS; meglevo unit/parser szabalyok valtozatlanok.
- [x] Valodi Chrome localhost sequential typing: Craft `1 -> 11452`, Crafting List `11452 -> 3`, Target Q `800 -> 950`; reload fingerprint `170845c4`, console WARN/ERROR 0, 1920/1366/390 overflow 0.
- [x] C012.4 teljes C001-C012.3 + M1-M6.1 + C04 regresszio, standalone, C012.3 Q800 es V002-integritas PASS.
- [x] `V003-C013` kiserlet: uj, kizarolag C012.4 baseline-bol epulo determinisztikus single-file candidate; `756582` byte, SHA-256 `a1c3b86f6cda2ac992d4ee62d6186cce0c5dc2df499cfc7d85892b471fccb807`.
- [x] C013 teljes C001-C012.4 + M1-M6.1 + C04 + target, Quality/allocation/version/mining/radar/color/naming/UEX/backup/standalone/V001/V002 kapu PASS.
- [x] C013 valodi Chrome localhost Technical Probe, sequential numeric input, Final/Crafting/Combined/detail/Back/reload, baseline+Q900 standalone, 1920/1366/390 es konzol kapu PASS.
- [x] Az exact `a1c3b86f...807` candidate manual `file://` kapuja `NOT_RUN`; a candidate a kapu elott `INVALIDATED_BY_C012.5_RELEASE_BLOCKER` lett, ezert nem tesztelheto/release-elheto candidate-kent.
- [ ] `V003-C012.5`: kovetkezo kulon repair-cycle, ebben a lezarasban `NOT_STARTED`.
- [ ] Stabil V003 release/tag csak kulon jovahagyas es minden kotelezo kapu utan.

### V003-dev final Crafting Card roadmap

- [x] `V003-C006`: kozos final-card adatkontraktus, card-first layout es elokeszitett detail hookok; blueprint/item nev, Size, Class/Type, Grade, Crafting Time, requested quantity, max craftable, slot/material mennyisegek, inventory/hiany/maradek, Quality rule, Mining+UEX snapshot es curated Radar.
- [x] `V003-C007`: card-first alapnezet es a Radar PNG-bol bizonyitott material vizualis identitas; nevszin, chip background es border/accent csak igazolt mappinggel, kulonben neutralis fallback.
- [x] `V003-C008` + `V003-C008.1`: kattinthato blueprint/material/mining/refinery/radar reszletnezet, bizonyitott public Wiki-cikk es kulon API-adatlap.
- [x] `V003-C009`: referencia-alapu default Blueprint Browser + kompakt Crafting Card, exact forras-API linkek, rendszerenkenti mining/refinery es curated Radar; standalone parityval.
- [x] `V003-C010`: tiszta default Final Card, kulon tobbkartyas Crafting List, azonos kompakt standalone kartya, teljes single-file es browser regresszio; felhasznaloi vizualis acceptance meg nyitott.
- [x] `V003-C010.1`: a C010 elrendezes valtoztatasa nelkul rovid Mining/Refinery nyertesprojekcio es javitott C010/C010.1 bizonyitek.
- [x] `V003-C011`: vegleges user-facing fo UI cleanup es reference lock; felhasznaloi vizualis ellenorzesre atadva.
- [x] `V003-C012`: Crafting List Final Card visual parity, tobbkartyas prioritas/expanded-state es source-card detail return; felhasznaloi vizualis ellenorzesre atadva.
- [x] `V003-C012.1`: Material Quality Planner, effektív Recipe Quality felirat es allocation-aware Combined Materials; felhasznaloi vizualis es mukodesi ellenorzesre atadva.
- [x] `V003-C012.2`: Active SC Version Consistency Repair; felhasznaloi ellenorzesre atadva, C013 nem indult.
- [x] `V003-C012.3`: FIXED recipe + explicit user material Quality constraint repair; felhasznaloi ellenorzesre atadva, a korabban megkezdett C013 invalidalt.
- [x] `V003-C012.4`: Numeric Input Editing Lifecycle Repair; felhasznaloi kezi teszt PASS, ez lett az uj C013 baseline.
- [x] `V003-C013` kiserlet: automated es Chrome localhost PASS bizonyitek megorizve; user manual `file://` NOT_RUN; candidate `INVALIDATED_BY_C012.5_RELEASE_BLOCKER`.
- [ ] `V003-C012.5`: nem indult el.
- [ ] Stabil V003 release/tag csak kulon felhasznaloi jovahagyassal.

### V002 GitHub- es Discord-dokumentacio

- [x] Teljes angol V002 GitHub README a stabil single-file mukodesrol es a bizonyitott funkciokrol.
- [x] Termeszetes magyar V002 README az angol dokumentacioval azonos tartalmi lefedettseggel.
- [x] Tomor, kozvetlen magyar Discord hasznalati leiras.
- [x] Dokumentacios linkek, regi ketfajlos telepitesi szovegek, Git diff es V002 tag/artifact integritas ellenorzese.
- [x] A kulonallo helyi es GitHub `main` tortenet auditja es explicit, ket szulos integration merge-je.
- [x] Normal fast-forward `main` push force nelkul.
- [x] A valtozatlan annotalt `V002` tag es a stabil HTML GitHub Release publikacioja.
- [x] A GitHub API `browser_download_url` visszaolvasasa es a visszatoltott asset SHA-256 ellenorzese.
- [x] Kozvetlen V002 Release asset link az angol es magyar README tetejen es gyorsinditasaban.

### V002 stabil egyfajlos alkalmazas

- [x] Kulso `Info/style.css` runtime-fugges auditja es biztonsagos migracios terv.
- [x] Teljes CSS beagyazasa a `sPg Crafting List.html` fajlba.
- [x] Kulso stylesheet link, duplikalt base64 snapshot, CSSOM/fetch/cache CSS fallback es Google Fonts import eltavolitasa.
- [x] A standalone export atallitasa ugyanarra az egyetlen embedded CSS-forrasra.
- [x] Baseline, M6, M6.1 es C04 tesztek atallitasa HTML-bol olvasott CSS-re.
- [x] Ures ideiglenes mappaban csak az egyetlen HTML-lel vegzett sidecar-regresszio PASS.
- [x] `V002-C001` teljes regresszios ciklus PASS.
- [x] Valos Chrome localhost kiegeszito proba: 13/13 technikai proba, API/cache/reload/fingerprint es console error 0 PASS.
- [x] Valos Chrome `file://` proba onallo Downloads-peldannyal: V002-dev schema 6, 13 PASS / 0 FAIL, export PASS, external stylesheet/resource false es diagnostic errors 0.
- [x] V002 fejlesztesi riport es atadas.
- [x] `V002-C002` vegso teljes M1-M6.1 + C04 regresszio PASS.
- [x] Elo Wiki JS-300 es UEX refinery API release-proba PASS.
- [x] `releases/V002/` letrehozva pontosan egy futtathato HTML artifacttal.
- [x] V002 single-file release validator, checksum es release dokumentacio PASS.
- [x] Stabil V002 release commit es annotalt `V002` tag elkeszitese.

- [x] Projekt celja es projekt tipusa pontosan rogzitve a `CODEX_START_HERE.md` fajlban.
- [x] Fo belepesi fajl vagy inditasi struktura azonositva a `PROJECT_MAP.md` fajlban.
- [x] Projektstruktura-ellenorzes kitoltve a `TEST_COMMANDS.md` fajlban.
- [x] A teljes V1.0 specifikacio tartosan rogzitve a projektben.
- [x] A nev, ketfajlos futtatasi szerkezet es tovabbi vegleges dontesek rogzitve.
- [x] Elso fejlesztesi technikai baseline letrehozva.
- [x] Statikus baseline kapu es repair-cycle PASS.
- [x] Chrome localhost technikai proba, IndexedDB-perzisztencia es responsive vizualis ellenorzes PASS.
- [x] M1 verziozott raw/normalizalt blueprint cache es tranzakcios aktivalas.
- [x] M1 Blueprint Browser lapozott indexszel, API-facetekkel es lusta reszletbetoltessel.
- [x] Teljes slotonkenti normalizalt receptmodell, JS-300, Hofstede-S1 es duplicate-material fixture regresszio.
- [x] Globalis My Materials inventory es kulon Quality batch rekordok egeszpontos SCU tarolassal.
- [x] Sorrendezheto Crafting Cardok es determinisztikus, slotonkenti Allocation Engine.
- [x] HP_MIN_500, Highest Q, Target Q, FIXED es UNKNOWN Quality szabalyok.
- [x] Nyolc kotelezo M2 fixture, nagy terhelesi proba es helyi bongeszos User Data fingerprint regresszio.
- [x] Dinamikus mining commodity/location/equipment Game Data cache es naprendszerenkenti determinisztikus rangsor.
- [x] Tobb mining loadout materialonkénti defaulttal, dinamikus station/module sorokkal, tetszoleges gadgettel es USER_OVERRIDE forrassal.
- [x] Tizenhet kotelezo M3 fixture, 5000 locationos teljesitmenyproba es helyi Chrome loadout-fingerprint regresszio.
- [x] Combined Materials az Allocation Engine kozvetlen projekciojakent, slot- es Quality-reszletek megorzesevel.
- [x] Teljes User Data backup schema 2, read-only import preview, schema 1 migracio, automatikus snapshot es atomi rollback.
- [x] Egyetlen muvelettel masolhato M1-M4 diagnosztikai csomag es 12 kotelezo M4 regresszios eset.
- [x] Kulon UEX refinery raw/normalizalt cache napi TTL-lel, kezi frissitessel es tranzakcios rollbackkel.
- [x] Biztonsagos Wiki–UEX exact mapping, MATCHED/UNMAPPED/AMBIGUOUS es USER_OVERRIDE adatmodell.
- [x] `value_month` szerinti naprendszerenkenti rangsor, tie-, nulla- es negativ-ertek kezelessel.
- [x] Kozos Crafting Card/Combined mining+refinery snapshot M6 offline export-elokeszitessel.
- [x] Tizenhet kotelezo M5 regresszio, valos auth nelkuli UEX fetch es 12/12 helyi bongeszos technikai proba.
- [x] M5.1: ot igazolt, verziozott `VERIFIED_CANONICAL_ALIAS`; nincs altalanos fuzzy vagy Construction-szoeldobas.
- [x] M6 standalone export, referencia-UI es automatizalt M1-M6 release-candidate regresszio.
- [x] Pontos, visszakuldheto kezi V1 release-gate checklist elkeszitese.
- [x] M6.1 UI Completeness Audit: pontosan 8 enabled felso navigacio, hasznalhato Material Database es kulon Mining Loadouts kapu.
- [x] M6.1 teljes M1-M6 + 14 pontos UI regresszio, Chrome 13/13, IndexedDB reload, fingerprint es 390 px ellenorzes.
- [x] C04 CSSOM `SecurityError` javitasa kozponti CSS-bol reprodukalhato, drift-ellenorzott embedded export snapshot fallbackkel.
- [x] C04 celzott file-modellteszt, teljes M1-M6.1 regresszio es Chrome localhost 13/13 PASS.
- [x] C04 Technikai proba kezi ujrateszt normal Chrome `file://` modban.
- [x] Kozvetlen `file://` technikai proba aktualis Chrome-ban: C01-C17 PASS.
- [x] Vegso automatizalt M1-M6.1 + C04 regresszio, elo SC/UEX probe, CSS-drift es standalone exportartifact PASS (`V001-C013`).
- [x] V1 pre-release acceptance report elkeszitese a manualis PASS/NOT TESTED allapotok valosaghu megorzesevel.
- [x] O04 `NOT TESTED` allapot release-waiverkent kifejezetten elfogadva; a teszt nem lett PASS-ra atirva.
- [x] E01-E10 `NOT TESTED` allapot release-waiverkent kifejezetten elfogadva; a tesztek nem lettek PASS-ra atirva.
- [x] `V001-C014` vegso teljes regresszio PASS.
- [x] Fagyasztott `releases/V001/` ketfajlos stabil bundle, SHA-256 manifest es release dokumentacio elkeszitve.
- [x] V001 stabil release commit es `V001` tag engedelyezve es elkeszitve.

## Kovetkezo

- [x] `sPg Crafting List.html` technikai baseline letrehozasa.
- [x] API + IndexedDB + standalone export builder technikai proba localhost Chrome-ban.
- [x] API + `file://` + IndexedDB + standalone export kezi Chrome technikai proba.
- [x] M1: verziozott, igeny szerinti API cache es Blueprint Browser.
- [x] M2: My Materials, Quality batch-ek es determinisztikus Allocation Engine.
- [x] M3: mining adatok, location rangsor es loadoutok.
- [x] M4: Combined Materials, backup/restore preview es kibovitett diagnosztika.
- [x] M5: UEX Refinery Data es naprendszerenkenti legjobb finomito.
- [x] M6.1: V1 UI completeness audit es placeholder-feloldas a meglevo M3/M5 modellekkel.
- [x] M6 vegso acceptance: Chrome PASS; O04 es Edge NOT TESTED eredmeny elfogadott release-waiverrel lezart.
- [x] A teljes V1.0 belso milestone-jainak vegrehajtasa a specifikacio funkcioinak elhagyasa nelkul.
- [x] M1 ellenorzes futtatasa a `TEST_COMMANDS.md` alapjan.
- [x] M1 `STATUS.md`, `WORKLOG.md` es jelentés frissitese.
- [x] M2 `STATUS.md`, `WORKLOG.md` es jelentés frissitese.
- [x] M3 `STATUS.md`, `WORKLOG.md` es jelentes frissitese.
- [x] M4 `STATUS.md`, `WORKLOG.md`, `BACKUP_RESTORE.md` es jelentes frissitese.
- [x] M5 `STATUS.md`, `WORKLOG.md`, technikai baseline es jelentes frissitese.

## Blokkolo problema

- Nincs fejlesztesi blokkolo. A stabil V003 release/tag tovabbra sincs engedelyezve; a V002 stabil single-file release lezart, valtozatlan es visszaallithato.

