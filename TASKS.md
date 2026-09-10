# TASKS.md

## Aktualis

### V004-C005 Craft History UI

- [x] C004.4 checkpoint, clean `develop/V004`, input application SHA és meglévő History schema/indexek ellenőrizve.
- [x] Crafting List `Aktív Craftok | Craft History` presentation-only tab, default Active és sidebar nélkül elkészült.
- [x] Exact `craftingCardId` grouping; `historySequence DESC`, legacy timestamp/stabil fallback; full completion után is megmaradó group.
- [x] `Kész`/`Visszavonva`/unknown fail-safe status, active COMPLETED craft-run total és markerless legacy fail-closed megjelenítés elkészült.
- [x] Expanded event kizárólag stored History evidence-ből mutat identityt, timestampeket, hash/revisionöket és külön exact material/Q/batch/unit/provenance sorokat.
- [x] Production partial/full, két Card group, COMPLETED/UNDONE/unknown/legacy, reload, keyboard, 1920×1080 és 390×844 overflow 0 PASS.
- [x] History nézet/expand műveletsor durable write 0; revision/allocation/reservation változás 0; History delete és Undo/Redo nincs.
- [x] C004.4 Craft Complete regresszió, automated direct `file://`, single-file és protected V003 bounded validator PASS; full regression/push nincs.
- [ ] C006 csak új, explicit feladatban indulhat; C005 checkpoint után itt megállunk.

### V004-C004.4 Deterministic 4-Decimal SCU Normalization

- [x] A megszakadt dirty C004.4 állapot visszaállítás nélkül auditálva; branch/HEAD/staged scope és meglévő production evidence ellenőrizve.
- [x] API/source SCU `Number` kanonikus `String(Number)` decimális reprezentációja determinisztikus BigInt parserrel, 4 tizedes HALF-UP szabállyal egész unitra normalizálódik.
- [x] `1 SCU = 10 000 unit`; az egyszeri boundary után Card/allocation/reservation/completion/History egész egységeket használ, 0-unit toleranciával.
- [x] ITEM csak pozitív safe integer; `0.00004 SCU → 0.0000 → 0 unit` fail-closed `ROUNDS_TO_ZERO`, világos hibaállapot és nulla írás.
- [x] Teljes production audit PASS: 1606 blueprint, 4217 ingredient; SCU 3919/3919 és ITEM 298/298 normalizálva, blocker/affected blueprint 0.
- [x] LumaCore 0.14, Steadfast 0.07 és 0.11000000000000001, valamint Omnisky production API/cache/normalize/Card/Chrome út PASS.
- [x] Omnisky 21 → 5 → 16 → stale/Reallocate → full; exact History deltas, My Materials, reload, 1/1/1 unit maradék és 0 loss PASS.
- [x] C004 atomikus model, C004.4 model/production/Chrome, automated direct `file://`, single-file és protected V003 bounded validator PASS; full regression és push nincs.
- [ ] C005 csak új, explicit feladatban indulhat; C004.4 checkpoint után itt megállunk.

### V004-C004.3 Craft Run Quantity Semantics + Live Completion Enablement

- [x] C004.2 checkpoint, clean `develop/V004` és exact input SHA ellenőrizve; C005 nem indult.
- [x] A Card quantity explicit craft-run count; output item cardinality továbbra is `OUTPUT_COUNT_UNPROVEN`, és nincs count=1 állítás.
- [x] Source requirement evidence megőrzése és szigorú exact normalizálás: SCU közvetlen `source * 10000`, ITEM pozitív safe integer; rounding/epsilon/floor/ceil nincs.
- [x] Exact production Omnisky III Cannon partial 21 → 16, stale/reallocate, majd full completion és minden batchben 1 unit maradék PASS; anyagveszteség 0.
- [x] Nonexact production Steadfast látható és tervezhető, de `CRAFT_RUN_INPUTS_UNPROVEN` miatt completion tiltva, inventory write 0.
- [x] Régi Card explicit `LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED`; a `21 craftként használom` megerősítés számváltoztatás nélkül stale + explicit Reallocate állapotot hoz.
- [x] Markerless History és schema-3 kompatibilitás explicit legacy/unknown osztályozása, craft-run következtetés nélkül.
- [x] C004/C004.3 model, valódi Chrome, rollback/idempotencia/reload, automatizált direct `file://`, single-file és protected V003 kapu PASS; full regression és push nincs.
- [ ] C005 csak új, explicit feladatban indulhat; C004.3 checkpoint után itt megállunk.

### V004-C004.2 Production Output Semantics Audit

- [x] C004.1 checkpoint, clean `develop/V004` és exact application SHA audit-only baselineként ellenőrizve.
- [x] API → normalized blueprint → Card → quantity conversion → allocation multiplication → UI → completion-gate production data-flow feltérképezve.
- [x] 1606 live blueprint 4217 ingredient quantity mezője auditálva; hat 4 tizedesnél hosszabb raw `quantity_scu` exactness blocker rögzítve.
- [x] Cargo, PowerPlant, WeaponGun és WeaponPersonal detail/nested/tier/linked item reprezentáció auditálva.
- [x] OpenAPI és hivatalos `StarCitizenWiki/API` source mapping ellenőrizve; output count/yield mező és dokumentált univerzális 1-output invariáns nincs.
- [x] Production exact assignment 0; új/régi/migrált Card `OUTPUT_COUNT_UNPROVEN`; full és partial live completion fail-closed.
- [x] Runtime HTML változatlan; single-file és V001/V002/V003/tag/artifact védelem; Chrome/full regression nincs scope szerint; push nincs.
- [ ] C005 csak új, explicit feladatban indulhat; C004.2 checkpoint után itt megállunk.

### V004-C004.1 Revision Semantics + Output Eligibility Audit

- [x] C004 checkpoint, `develop/V004`, clean resume és C004 actual code path auditálva; full regression nélkül.
- [x] Implementation deviation igazolva és minimálisan javítva: partial completion craft list revision +0, current Card revision +1.
- [x] Full Card removal craft list revision +1; más Card revision csak tényleges persisted order-változáskor nő.
- [x] Partial 21 → 16 és remaining full completion exact model + Chrome teszt PASS; négy injected rollback minden revisiont megőriz.
- [x] Read-only live API audit: 1606 blueprint, 27/27 output class detail, output-count candidate field 0.
- [x] Production Card exact assignment 0; live állapot `LIVE_COMPLETION_CURRENTLY_BLOCKED_BY_OUTPUT_COUNT_UNPROVEN`, találgatott count nélkül.
- [x] Single-file/direct `file://` és V001/V002/V003/tag/artifact integritás PASS; push nincs.
- [ ] C005 csak új, explicit feladatban indulhat; C004.1 checkpoint után itt megállunk.

### V004-C004 Atomic Craft Complete Core

- [x] C003 checkpoint, clean `develop/V004`, authenticated fetch és változatlan `origin/main`/V003 baseline ellenőrizve.
- [x] Cardon egész output-darabszám, default 1, fill-only MAX, exact batch/SCU/unit confirmation és cancel 0 write.
- [x] Exact current reservation/revision/Card/slot/batch/canonical/source/Q/unit validáció; stale fail-closed és explicit Reallocate, fallback nélkül.
- [x] Egyetlen öt-store readwrite tranzakció, exact integer batch-deduction, partial decrement/full removal és siker csak `transaction.oncomplete` után.
- [x] `craftTransactionId` idempotencia, History `add()` és gazdag append-only completed event; replay második levonás nélkül.
- [x] Inventory conservation 0-unit toleranciával; 1-unit maradék, négy injected rollback és reload persistence PASS.
- [x] Célzott model/static + valódi Chrome partial/full/stale/replay/rollback/output-block/direct `file://` PASS; console/page error 0.
- [x] V001/V002/V003/tag/artifact változatlan; History UI/Undo/Redo/Broadcast nincs; full regression nem futott; push nincs.
- [ ] V004-C005 csak új, explicit feladatban indulhat; C004 checkpoint után itt megállunk.

### V004-C003 Revision + Reservation Snapshot Infrastructure

- [x] C002 checkpoint, clean `develop/V004`, Git-folyamat és hitelesített remote baseline ellenőrizve; `origin/main` nem mozdult.
- [x] Három durable globális revision és per-card `cardRevision`; szemantikai mutation pontosan +1, collapse +0, overflow fail-closed.
- [x] Inventory/Card/quality/import/migration rekord- és revision-írás közös IndexedDB tranzakcióban; injected failure teljes rollback.
- [x] Canonical runtime reservation payload és Web Crypto SHA-256 hash; szemantikai sorrend megmarad, display label nem identity.
- [x] `VALID` / `STALE` / `BLOCKED`, startup/reload/import/migration stale és explicit `Újraszámítás / Reallocate` elkészült.
- [x] MAX és partial prefix csak a látható reservation alapján; `OUTPUT_COUNT_UNPROVEN` és `HASH_UNAVAILABLE` blokkol.
- [x] Célzott model/static + valódi Chrome mutation/Reallocate/reload/rollback/direct `file://` PASS, console/page error 0.
- [x] V001/V002/V003/tag/artifact változatlan; Complete/deduction/partial execution/History/Undo/Broadcast nincs; full regression nem futott; push nincs.
- [ ] V004-C004 csak új, explicit feladatban indulhat; C003 checkpoint után itt megállunk.

### V004-C002 Database/Schema + Safe V003 Migration Foundation

- [x] C001 checkpoint, clean branch, Git-folyamat és hitelesített remote baseline ellenőrizve; `origin/main` nem mozdult.
- [x] Runtime `V004-dev`, schema 7, külön `spg-crafting-list-v004` version-1 database és 28-store topology elkészült.
- [x] Üres `craftHistory`, három index, `userMeta` és determinisztikus 0 revision foundation elkészült.
- [x] Safe V003 discovery/version/topology, kizárólag read-only source, explicit backup + confirm UI és SHA-256 fingerprint elkészült.
- [x] Pristine-target, same-fingerprint replay, changed-source és atomi rollback védelem célzott modell- és Chrome-teszttel PASS.
- [x] Exact 1/200 unit migráció, schema 1/2 → 3, History empty, single-file/runtime sidecar `0` PASS.
- [x] Live Wiki blueprint output-count audit: `OUTPUT_COUNT_UNPROVEN – COMPLETION MUST BLOCK AFFECTED RECIPES`.
- [x] V001/V002/V003/tag/artifact/evidence változatlan; Craft Complete és Undo nincs; full regression nem futott.
- [x] Következő külön ciklus: V004-C003 revision + reservation snapshot infrastructure elkészült.

### V004-C001 Craft Complete Architecture Audit

- [x] Hitelesített fetch; a `1658ec1...` utáni remote `index.html` identity-only delta auditálva.
- [x] `main` fast-forward `0a83e44...` értékre; clean `develop/V004` branch létrehozva, push nélkül.
- [x] Annotált V003 tag target és exact stable artifact méret/SHA PASS; V001/V002/protected release path változatlan.
- [x] V003 IndexedDB/store/transaction, material batch, allocation, Card, backup/import és multi-window architektúra célzottan feltérképezve.
- [x] Külön V004 DB, read-only V003 migráció, revision/snapshot/stale, atomi Complete/History/Undo terv elkészült.
- [x] Legfeljebb 6 következő szűk cycle, rollback és célzott jövőbeli tesztlista dokumentálva.
- [x] Application code és feature implementation: NO; full regression/Chrome/feature test: NOT RUN BY SCOPE.
- [x] Következő külön ciklus: V004-C002 database/schema foundation + migration shell elkészült.

### V003-C018 Safe Main Divergence Integration

- [x] Friss `origin/main` audit: `15ec5c1...`; merge base `5cc0093...`; divergencia `12/44` commit.
- [x] A remote-only végső delta kizárólag `index.html`; protected application/RC/release/V001/V002 útvonalat nem érintett.
- [x] `git merge-tree` szimuláció konfliktus, rename/delete és protected-path változás nélkül PASS.
- [x] Normál kétparentes merge commit: `fafd669...`; remote landing page byte-pontosan megőrzött.
- [x] Stable V003 tag, artifact és accepted RC változatlan; mindkét parent lineage ancestry PASS.
- [x] Push, force, main publication, V003 tag push és GitHub Release nem történt.
- [ ] Következő külön ciklus: tényleges main + V003 tag + GitHub Release publikálás, csak explicit engedéllyel.

### V003 Replacement Stable Release

- [x] Remote audit: nincs távoli/publikált `V003` tag vagy GitHub Release.
- [x] Az accepted C015 RC raw-byte módon a stable artifact helyére került; `835820` byte és SHA `87382a8f...` byte-azonos.
- [x] Runtime identity `V003`, `V003-dev` occurrence `0`; egy runtime HTML, embedded CSS/JS és sidecar `0`.
- [x] C015 automated/Chrome és C016 manual `file://` PASS evidence a változatlan candidate-ről újrafelhasználva.
- [x] V001/V002 változatlan; application code nem módosult; a régi invalidált commit/history megmarad.
- [x] Replacement stable commit után a régi local `V003` tag egyszeri cseréje az új commitra.
- [x] Push és main merge nem történt ebben a ciklusban.

### V003-C016 Exact Manual file:// Gate Evidence Closure

- [x] Exact C015 RC méret/SHA és a fő HTML-lel való byte-egyezés ellenőrizve.
- [x] Felhasználói direct `file://` M1–M7 evidence PASS: V003 UI/backup/diagnosztika identity, Technical Probe, Titanium picker, reload és standalone.
- [x] Változatlan C015 automated + Chrome localhost PASS evidence újrafelhasználva; új regression/Chrome automation nem futott.
- [x] Application code, RC, V001/V002, a régi invalidált V003 tag és `releases/V003/` változatlan.
- [x] Replacement V003 release gate complete; a tényleges leváltás külön, engedélyezett release-cycle feladata.

### V003-C015 Fresh RC after Version Identity Repair

- [x] Exact `37f8852...` C014 source HEAD-ből determinisztikus, byte-azonos single-file candidate; application code változatlan.
- [x] Runtime identity `V003`; `V003-dev` occurrence `0`; embedded CSS/JS és runtime sidecar `0`.
- [x] Teljes releváns C001–C012.5 + D1 + C013.1/.3/.5/.7 + C014 + M1–M6.1 + C04 release-regresszió PASS.
- [x] Legacy Titanium canonical picker és diszjunkt Q500–Q799 / Q800+ pool Combined/Allocation/no-double-reserve fixture valódi Chrome-ban PASS.
- [x] Chrome localhost 15/15, nyolc modul, 1920/1366/390 overflow 0, Wiki/UEX/IndexedDB/reload/backup/standalone és console 0/0 PASS.
- [x] Exact C015 candidate kézi `file://` gate C016-ban, felhasználói M1–M7 evidence alapján PASS.
- [x] Stabil helyettesítő V003 release/tag a külön, engedélyezett replacement release-cycle-ben elkészült.

### V003-C014 Stable Version Identity Repair

- [x] A három aktuális runtime identity `V003-dev` → `V003`; más application logic változás nincs.
- [x] UI, backup `applicationVersion` és diagnosztikai `application.version` egységesen `V003`.
- [x] Célzott statikus/single-file kapu és valódi Chrome localhost Technical Probe `15/15`, IndexedDB reload, standalone és konzol `0/0` PASS.
- [x] V001/V002 és a régi V003 release artifact változatlan; teljes történeti regresszió scope szerint nem futott.
- [x] A helyi `045bd8c...` release/tag pre-publication invalidált evidence; tag nem mozdult, push/main merge nincs.
- [x] Friss RC C015-ben elkészült és automated + Chrome localhost kaput teljesített; új stable V003 lezárás még külön ciklus.

### V003 Stable Release — PRE-PUBLICATION INVALIDATED

- [x] Az elfogadott C013.8 RC `835832` byte és SHA-256 `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469` invariánsa release előtt PASS.
- [x] `releases/V003/sPg Crafting List.html` byte-pontos RC-másolat; embedded CSS/JS, egy runtime HTML, sidecar `0`.
- [x] Automated, Chrome localhost és exact manual `file://` kapu PASS bizonyítéka a változatlan candidate-ről újrafelhasználva.
- [x] Stable release report, `RELEASE.md` és `SHA256SUMS` elkészült; V001/V002 változatlan.
- [x] Helyi `V003-STABLE-RELEASE` commit és annotált `V003` tag; push/main merge nincs.
- [x] C014 audit: a tagged artifact runtime identityje `V003-dev`, ezért publikálás előtt invalidált; az evidence változatlanul megőrizve.

### V003-C013.9 Exact Manual file:// Gate Evidence Closure

- [x] A felhasználó az exact C013.8 candidate-et közvetlen `file://` módban ellenőrizte: M1–M12 PASS.
- [x] Legacy Titanium melletti canonical picker, új Q920 batch, reload, Combined parity és Feynmaline/Tungsten/Gold picker PASS.
- [x] Technical Probe 15/15, backup preview és standalone export PASS; Q920 tesztbatch törölve, valódi batch-ek megmaradtak.
- [x] Application code és RC változatlan; automated és Chrome localhost eredmény újrafuttatás nélkül újrafelhasználva.
- [x] V003 release gate complete; stable release/tag továbbra is külön engedélyhez és ciklushoz kötött.

### V003-C013.8 Fresh RC after User-Data-Independent Canonical Picker Repair

- [x] Exact `490ed6fc...` source HEAD-ből determinisztikus, byte-azonos single-file candidate; application code változatlan.
- [x] Teljes releváns C001–C012.5 + D1 + C013.1/.3/.5/.7 + M1–M6.1 + C04 release-regresszió PASS.
- [x] Feynmaline/Titanium/Tungsten/Gold picker invariancia, Titanium legacy/new batch, Combined/Allocation/no-double-reserve/reload/backup/standalone PASS.
- [x] Aktív 4.10 identity audit: 128 név, 126 látható opció, 43 exact canonical multi-UUID, 2 unresolved, 0 látható duplikátum és 0 guessed canonical UUID.
- [x] Valódi Chrome localhost: 15/15 Technical Baseline, 8/8 modul, 1920/1366/390 overflow 0, konzol 0/0, Wiki/UEX/IndexedDB/reload PASS.
- [x] Legacy Titanium batch mellett a user-facing picker canonical UUID-ja és reload-invarianciája PASS.
- [x] Exact C013.8 candidate manuális `file://` kapu M1–M12 PASS; stable V003 továbbra is külön release-ciklushoz kötött.

### V003-C013.7 User-Data-Independent Canonical Picker Repair

- [x] C013.6 exact manual `file://` canonical identity blockere rögzítve; a candidate BLOCKED/INVALIDATED, HTML-je változatlan.
- [x] Verified exact canonical authority független a User Data batch-ek jelenlététől és beszúrási sorrendjétől.
- [x] A commodity `refinedVersion.uuid` exact source relationként bekerül az identity graphba akkor is, ha a source rekord nincs külön jelen.
- [x] Feynmaline, Titanium, Tungsten és Gold legacy-batch nélküli/melletti picker invariance PASS.
- [x] Titanium legacy batch megmarad; új canonical Q batch-ek mellett `1` logical material / `3` batch, provenance/reload/backup PASS.
- [x] My Materials, Combined, Allocation, no-double-reserve, no-fuzzy és unresolved duplicate regresszió PASS.
- [x] Teljes release-regresszió/Chrome/új RC scope szerint nem futott; friss RC külön következő ciklusban szükséges.

### V003-C013.6 Fresh RC after Canonical Picker Dedup Repair

- [x] Exact `e4bc5167...` source HEAD-ből determinisztikus single-file candidate; application code változatlan.
- [x] Teljes releváns C001–C012.5 + D1 + C013.1 + C013.3 + C013.5 + M1–M6.1 + C04 release-regresszió PASS.
- [x] Titanium diszjunkt poolok, mixed shortage, Feynmaline/Titanium picker dedup, 24 exact identity és 2 unresolved duplicate gate PASS.
- [x] Valódi Chrome localhost: 15/15 Technical Baseline, 8/8 modul, 1920/1366/390 overflow 0, konzol 0/0, Wiki/UEX/IndexedDB/reload PASS.
- [x] Candidate SHA változatlan; C013.4 invalidált RC és V001/V002 változatlan.
- [x] Exact C013.6 candidate kézi `file://` kapu canonical identity blockert talált; candidate BLOCKED/INVALIDATED, nem releaselhető.

### V003-C013.5 Canonical Material Picker Dedup Repair

- [x] C013.4 exact manual `file://` gate canonical-picker blockere rögzítve; a candidate BLOCKED/INVALIDATED és változatlan.
- [x] Verziózott exact item/harvestable→commodity identity modell, Feynmaline canonical UUID és source UUID provenance.
- [x] My Materials picker: egy exact logical material = egy opció; name change canonical UUID autofill; új batch canonical mentés.
- [x] Bizonyítatlan azonos nevű UUID-k name/fuzzy merge nélkül `UNRESOLVED_DUPLICATE_MATERIAL_IDENTITY` státusszal rejtve és auditálva.
- [x] Aktív 4.10 audit: 128 név, 126 látható opció, 24 exact multi-UUID identity, 2 unresolved duplicate név.
- [x] Feynmaline/Titanium, inventory grouping, reload, backup, Combined, Allocation, no-double-reserve és célzott regresszió PASS.
- [x] V001/V002 és C013.4 artifact változatlan; teljes release-regresszió/új RC scope szerint nem futott.
- [x] Friss V003 release candidate a külön `V003-C013.6` ciklusban elkészült; automated + Chrome localhost gate PASS.

### V003-C013.4 Fresh RC after Disjoint Pool + Canonical Grouping Repair

- [x] Exact `2c138cf8...` source HEAD-ből determinisztikus, új single-file candidate külön C013.4 artifactban; application code változatlan.
- [x] Teljes releváns C001–C012.5 + D1 + C013.1 + C013.3 + M1–M6.1 + C04 release-regresszió PASS.
- [x] Diszjunkt Titanium Q784/Q866, Q866-only, Minimum-only, MAX-only, invalid-range, no-borrow/no-double-reserve és exact canonical UUID fixture PASS.
- [x] Valódi Chrome localhost: 15/15 Technical Baseline, 8/8 modul, 1920/1366/390 overflow 0, konzol 0/0, Wiki/UEX/IndexedDB/reload PASS.
- [x] Candidate SHA-256 változatlan; C013.2 BLOCKED/INVALIDATED és V001/V002 változatlan.
- [x] Exact C013.4 candidate `file://` manual gate canonical-picker blocker miatt megállt; candidate BLOCKED/INVALIDATED, nem folytatható.

### V003-C013.3 Disjoint Quality Pools + Canonical Grouping Repair

- [x] Minimum pool `[minimumQ, maximumQ)`, MAX pool `[maximumQ, +∞)`; borrowing és magasabb tartományú fallback nincs.
- [x] MAX threshold nélkül a Minimum pool felső korlát nélküli; `minimumQ >= maximumQ` fail-safe `POOL_RANGE_INVALID` és látható UI-státusz.
- [x] Exact commodity↔ingredient canonical UUID mapping alapján a Titanium multi-source batch-ek egy My Materials kártyába kerülnek; name/fuzzy merge nincs.
- [x] Allocation, Combined, My Materials, Maximum Craftable, Final/Crafting, standalone, reload, backup/restore és no-double-reserve céltesztek PASS.
- [x] M2/M4, C012.5A–C3B2, D1 és C013.1 közvetlen regresszió PASS; teljes release-regresszió scope szerint nem futott.
- [x] C013.2 candidate változatlan, de BLOCKED/INVALIDATED; V001/V002 integritás PASS.
- [x] Friss RC a külön `V003-C013.4` ciklusban elkészült és automated + Chrome localhost kapuja PASS.

### V003-C013.2 Fresh Release Candidate – BLOCKED / INVALIDATED

- [x] Exact source lock: `9a07de34643fed477399b070462aeb2be3d4f11a`; application code byte-változatlan.
- [x] Új, determinisztikus single-file candidate külön C013.2 artifactban; a régi C013 candidate változatlan és BLOCKED.
- [x] Teljes releváns C001-C012.5C3B2 + D1 + M1-M6.1 + C04 + C013.1 regresszió PASS.
- [x] `FR86_MIXED_AMOUNT_AND_QUALITY_SHORTAGE`, reverse-row, Card priority, no-double-reserve és cross-view parity PASS.
- [x] Valódi Chrome localhost: 15/15 Technical Baseline, 8/8 modul, 1920/1366/390 overflow 0, konzol 0/0, Wiki/UEX/IndexedDB/reload PASS.
- [x] Candidate SHA-256 a Chrome-kapu után is `cdbac1a7977845061494aa148e6603db2597270bcbcf49c587009bd6b3a0ca31`.
- [x] V001/V002 integritás PASS; V003 tag/release/push/main merge nincs.
- [x] Exact manual candidate `file://` gate két C013.3 blockerrel megállt; a candidate nem újrahasználható és nem releaselhető.

### V003-C013.1 Strict Quality Allocation + Shortage Repair

- [x] A C013 candidate exact kézi `file://` kapuján talált Quality-starvation blocker rögzítve; stable V003 továbbra is BLOCKED.
- [x] Card-prioritás elsődleges; same-card/canonical-material/unit groupon belül szigorúbb effektív minimum Quality előbb, azonos thresholdnál stabil slot-sorrend.
- [x] `FR86_MIXED_AMOUNT_AND_QUALITY_SHORTAGE`: Field `6 / 9,3 / 17 SCU`, Shell `17 / 3,4 / 0 SCU`; globális reserved `23`, shortage `29,7 SCU`, double reserve `0`.
- [x] Vegyes amount + Quality shortage külön, átfedés nélkül számolva és együtt megjelenítve a Final Card/standalone sorban.
- [x] Korábbi FR-86 happy path, Q550-only, reverse-order, két-Card priority, Combined/Final/Crafting/Maximum/standalone parity PASS.
- [x] M4 hiba audit: harness-only exact canonical identity argument hiány; az application parity helyes.
- [x] C013.1 célzott validator PASS; teljes release regression szándékosan NOT RUN.
- [x] V001/V002 és a blokkolt C013 candidate változatlan; V003 tag/release/push/main merge nincs.
- [x] Friss V003 release candidate elkészült a külön `V003-C013.2` ciklusban.

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
- [x] Stabil V003 release/tag a felhasználó külön jóváhagyásával, release-only ciklusban elkészült.

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

- Nincs. A V003 stable release helyben lezárt; távoli push és `main` merge nem történt.

