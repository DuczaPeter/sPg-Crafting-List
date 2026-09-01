# V003-C013 Fresh Release Candidate Report

## Eredmény

`V003-C013 – FRESH RELEASE CANDIDATE AUTOMATED + CHROME GATES PASS, EXACT MANUAL CANDIDATE file:// GATE NOT RUN`

Ez a candidate kizárólag a lezárt D2B checkpoint exact alkalmazásállapotából készült. Nem stabil release, nincs hozzá V003 tag, GitHub Release, push vagy `main` merge.

## Forrás és byte-lock

- Branch: `develop/V003`
- Exact forráscommit: `6abae928b7d2f81e0b5eee2976a652feb0577c8d`
- Forrás: `sPg Crafting List.html`
- Candidate: `test-artifacts/V003-C013/fresh-release-candidate/sPg Crafting List V003 RC.html`
- Méret: `802259` byte
- SHA-256 teszt előtt: `d4ce0fb9caea5e2f77597ce76ae05321d8d8a5c3721dfb91ebf431a7ebeef182`
- SHA-256 teszt után: `d4ce0fb9caea5e2f77597ce76ae05321d8d8a5c3721dfb91ebf431a7ebeef182`
- A candidate és a forráscommit HTML-je byte-azonos: **PASS**
- Embedded CSS/JavaScript, helyi runtime sidecar `0`: **PASS**
- Application code változás ebben a ciklusban: **NO**

A korábbi `388a...`, `a1c3...` és más C012.2/C012.4 candidate-ek továbbra is `INVALIDATED`; egyik sem release-forrás.

## Automatizált regresszió

Eredmény: **PASS**.

- C001–C012.2, M1–M6.1 és C04 teljes kapu: PASS
- C012.3 Quality constraint célteszt: PASS
- C012.4 numeric input lifecycle célteszt: PASS
- C012.5A–C012.5C3B2 kapuk: PASS
- C012.5D1 integrált FR-86 kapu a fresh candidate-en: PASS
- FR-86 happy path és Quality shortage: PASS
- Any-Q/recipe-minimum, unresolved-threshold fail-safe: PASS
- Kétkártyás prioritás és készlet-double-count védelem: PASS
- Recipe törlése utáni inventory-only állapot: PASS
- Backup/restore és régebbi backup kompatibilitás: PASS
- Final Card / Crafting List / Allocation / Combined / standalone parity: PASS
- Standalone export: read-only, embedded, szerkesztő/IndexedDB/fetch nélkül: PASS
- V001/V002 integritás: PASS

Az ellenőrzés közben talált eltérések kizárólag történeti izolált tesztharness-függőségek voltak. A C006/C007/C008/C012/C012.1/C012.3 runner megkapta a jelenlegi C012.5 modellhez szükséges dependency blokkokat; a fő HTML nem változott. A régi invalidált C012.4 wrapper státuszát nem írtuk át: a fresh validator C012.3-at és C012.4-et közvetlen céltesztként futtatta a teljes C012.2 előzménykapu után. A lezáró célteszt státusz-assertje az induló és a már lezárt manifestállapotot is elfogadja, így a kapu idempotensen újrafuttatható.

## Chrome localhost gate

Eredmény: **PASS** ugyanazon, hash-zárolt candidate fájlon.

- Origin: `http://127.0.0.1:41988`
- Valódi Google Chrome, Codex-vezérelt localhost futás
- Aktív SC-verzió: `4.10.0-LIVE.12519617`
- Technical Baseline: `13 PASS / 0 FAIL`
- Wiki API: PASS
- IndexedDB: elérhető, schema 4
- UEX Refinery: PASS, `215` yield rekord
- Crafting List: PASS
- Blueprint Browser: PASS
- My Materials: PASS
- Material Database: PASS
- Mining Loadouts: PASS
- UEX Refinery: PASS
- Combined Materials: PASS
- Data / Settings: PASS
- 1920×1080: PASS, horizontal overflow `0 px`
- 1366×768: PASS, horizontal overflow `0 px`
- 390×844: PASS, horizontal overflow `0 px`
- Chrome console WARN/ERROR: `0/0`
- Candidate SHA a Chrome gate előtt/után változatlan: PASS

Chrome evidence: `test-artifacts/V003-C013/fresh-release-candidate/chrome-localhost-evidence.json`.

## Nyitott kötelező kapu

Az exact candidate közvetlen `file://` kézi gate-je: **NOT RUN**.

Ezért a candidate nem nevezhető stabil V003 release-nek. A következő munkamenet csak külön felhasználói utasításra készítheti elő ennek az exact, fenti SHA-256 értékű fájlnak a kézi `file://` ellenőrzését.

## Visszaállás

A checkpoint revertálásával minden C013 builder/validator/harness/evidence és dokumentáció eltávolítható. Az alkalmazás baseline-ja továbbra is a `6abae928...` D2B commit, a stabil fallback pedig a változatlan V002.
