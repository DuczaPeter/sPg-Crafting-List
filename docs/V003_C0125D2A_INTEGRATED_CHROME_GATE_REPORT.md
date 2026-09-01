# V003-C012.5D2A – Integrated Chrome localhost gate

## Eredmény

`V003-C012.5D2A – INTEGRATED CHROME LOCALHOST GATE PASS, MANUAL file:// NOT RUN`

- Branch/baseline: `develop/V003` / `b3d2f1a4b7ff1e05c619142b37b68b1a4cc5ae81`.
- Application code változás: **NO**.
- Origin: `http://127.0.0.1:41986`.
- Aktív Game Data: `4.10.0-LIVE.12519617`.
- Chrome console WARN/ERROR: `0/0`.

## Integrált FR-86 ellenőrzés

- Happy path: Shell `Minimum Q = 500` → Q550 `1,2 SCU`; Field Array `MAX Q = 700` → Q750 `1,9 SCU`; Feynmaline `170 ITEM`; Card `SATISFIED`; Maximum Craftable `1`.
- Quality-shortage: kizárólag Q550 Stileron `3,1 SCU`; Shell `SATISFIED`; Field Array `INSUFFICIENT_QUALITY`; mennyiséghiány `0`, Quality-hiány `1,9 SCU`; Card `UNSATISFIED`; Maximum Craftable `0`.
- A Final Card, Crafting List, allocation, Combined Materials és Max DB egymással egyezett.
- Exact Card-kötés, kártyánként független pool assignment, reload persistence és no-double-count: **PASS**.
- Nulla Crafting Card mellett az inventory-only állapot és a canonical material hozzáadás/reload: **PASS**.

## Standalone és responsive

- Chrome-ból generált artifact: `sPg Crafting List - FR-86.html`, `488664` byte, SHA-256 `6855908f0bff95a8c7a104449d54b5fe656073f855981a258d713123dcaafc53`.
- Read-only snapshot: `UNSATISFIED`, `Minimum Q · Q500+`, `MAX Q · Q700+`, `Quality-hiány 1,9 SCU`; editor, IndexedDB-hivatkozás és runtime újraszámítás nincs.
- 1920, 1366 és 390 px nézetben a dokumentum, Browser, Crafting és Combined horizontális overflow értéke `0`.
- Exact kézi `file://` kapu: **NOT RUN**. Biztonsági megkerülés nem történt.

## Teardown és User Data

- Az import előnézete kizárólag a `user:materialQualityPools` egyetlen User Settings rekord törlését jelezte; a másik négy store változása `0` volt.
- Az import után és mutation-free reload után mind az öt User Data store `0` rekordot tartalmazott.
- Fingerprint: `9be961d3 → 9be961d3`.
- D2A marker: `0`; console WARN/ERROR: `0/0`.
- A Game Data cache megmaradt: SC `4.10.0-LIVE.12519617`, UEX `215` rekord.
- A teljes Chrome backup→restore roundtrip a file-picker határ miatt nem futott; a D1 automatizált backup/restore PASS bizonyítéka változatlanul érvényes.

## Határ

- C012.5D2B: **NOT STARTED**.
- C013: **NOT STARTED**.
- V003 tag/release, push és main merge: nincs.
- Stabil fallback: változatlan V002.

Géppel olvasható evidence: `test-artifacts/V003-C012.5D2A/chrome-integration-evidence.json`.
