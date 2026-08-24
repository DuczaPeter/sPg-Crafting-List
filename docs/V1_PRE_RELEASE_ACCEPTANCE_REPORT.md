# V1 PRE-RELEASE ACCEPTANCE REPORT

Datum: 2026-08-24  
Candidate: `V001-dev`  
Cycle: `V001-C013`  
Branch: `develop/V001`

## AUTOMATED

**PASS**

- A teljes `M1 -> M2 -> M3 -> M4 -> M5 -> M5.1 -> M6 -> M6.1 -> C04` regresszio PASS.
- M1: JS-300 3 slot, `1 DYNAMIC + 2 FIXED`; duplicate-material 2 kulon normalizalt slot; `UNKNOWN` nem lett megtippelve.
- M2: 8/8 kotelezo allocation eset PASS, beleertve `HP_MIN_500`, `FIXED`, Highest/Target Q, Quality-hiany, bottleneck es kartya-prioritas. A 100 kartya / 300 slot / 1000 batch fixture 686 ms alatt futott.
- M3: 17/17 mining dataset, location ranking, equipment es loadoutmodell eset PASS; az 5000 locationos fixture 39 ms alatt futott.
- M4: 12/12 Combined Materials, backup preview/migration/rollback es fingerprint eset PASS; 1000 kartya / 3000 slot / 5000 batch 166 ms alatt futott.
- M5/M5.1: 18/18 refinery cache/ranking/mapping eset es mind az 5 verziozott canonical alias PASS.
- M6: 14/14 teljes standalone export eset PASS; snapshot JSON roundtrip ervenyes; a 120 slotos fixture 23 ms alatt futott.
- M6.1: 14/14 UI completeness eset PASS; pontosan 8 enabled navigacio, koztuk `Material Database` es `Mining Loadouts`.
- C04: `file://` modellben 0 CSSOM-olvasas es 0 warning; HTTP-modellben a CSSOM-utvonal megmaradt; a beagyazott CSS snapshot a kozponti CSS-sel byte-azonos.

Eloben ujraellenorzott adatok:

- SC dataset: `4.9.0-LIVE.12232306`.
- UEX `GET /2.0/refineries_yields`: HTTP 200, Authorization fejlec nelkul, 215 rekord, 24 commodity, Nyx/Pyro/Stanton.
- Wiki–UEX mapping: `MATCHED 24 / UNMAPPED 50 / AMBIGUOUS 0`.
- Kozponti CSS / export snapshot: 80 617 byte, SHA-256 `463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb`; drift nincs.

Automatikusan generalt JS-300 export:

- Artifact: `test-artifacts/V001-C013/standalone-js-300-automated.html`.
- Meret: 92 083 byte; SHA-256 `89b3c196f3495f1a14381f8a099b10fa867e57c8ad5c264d719ccb6a3a21892c`.
- Nem ures, 3 Recipe Slotot es teljes kartya-snapshotot tartalmaz.
- A CSS beagyazott; kulso stylesheet, remote `@import`, kulso `src`/`href`, `fetch()` vagy mas runtime network dependency nincs.
- A nem vegrehajthato snapshot JSON visszaolvashato es a forras-snapshottal azonos.

Bizonyitek: `test-artifacts/V001-C013/test-summary.json`, `test-output.log`, `pre-release-evidence.json` es a generalt HTML.

## MANUAL CHROME

**C01–C17 PASS**

A felhasznalo normal Chrome `file://` futasban vegigfuttatta a teljes kaput. A fo CSS, API-k, IndexedDB, Blueprint Browser, Crafting Card, batch/allocation, Material Database, refinery, mining loadout, Combined Materials es logmasolas mukodott.

## STANDALONE

- O01 PASS
- O02 PASS
- O03 PASS
- O04 NOT TESTED – user declined Windows-level offline test
- O05 PASS
- O06 PASS

A kezzel exportalt fajl: `sPg Crafting List - JS-300.html`. Chrome `file://` modban megnyilt, teljes JS-300/mining/refinery/loadout tartalommal. O04 nem minosul PASS-nak.

## EDGE

**E01–E10 NOT TESTED – user declined Edge manual gate**

Egyik Edge-pont sem lett PASS-ra atirva.

## USER DATA

- Chrome B = `2667ea55`
- Chrome C = `2667ea55`
- Chrome D = `2667ea55`
- User Data loss: **NO**

Refresh es `Adatok frissitese` utan is megmaradt a JS-300 kartya, quantity 2, a ket Q517 batch, valamint a `V1-GATE-CHROME` Beryl/MOLE default loadout.

## CONSOLE

- Chrome final C17: no application JS error
- Standalone O06: clean

Ezek kezi, felhasznaloi release-gate bizonyitekok; a C013 automatizalt ciklus nem allit kulon uj bongeszos console capture-t.

## NETWORK

**Standalone O05: no external HTTP/HTTPS request**

Csak a helyi export HTML jelent meg; Google Font, kulso CSS/script, Wiki API es UEX API keres nem indult.

## GIT

**clean** – a pre-release bizonyitekcommit utan ellenorizve; nem maradt generalatlan CSS snapshot vagy teszt-szemetfajl.

## FINAL STATUS

`V1 RELEASE CANDIDATE – automated regression PASS, Chrome manual gate PASS, standalone partial PASS, offline hard-disconnect and Edge manual gates NOT TESTED.`

Ez nem `V1 RELEASE PASS`. Stabil V1, release commit, tag, release vagy verzioemeles nem keszult. A kovetkezo dontes az O04 es az Edge gate esetleges release-waivere.
