# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`; stabil fallback: változatlan `V002`.
- Aktuális ciklus: `V003-C013.1`; státusz: **STRICT QUALITY ALLOCATION + MIXED SHORTAGE CLASSIFICATION PASS**.
- Induló baseline HEAD: `5584f37a48357d666ecfba9ca3358c5d9a7d1f3f`.
- Javítás: Card-prioritás után same-card/canonical-material/unit csoportban a magasabb effektív minimum Quality kap először készletet; azonos küszöbnél stabil Recipe Slot sorrend.
- Kötelező `FR86_MIXED_AMOUNT_AND_QUALITY_SHORTAGE`: Field `6 / 9,3 / 17 SCU`, Shell `17 / 3,4 / 0 SCU`; globális foglalás `23 SCU`, teljes hiány `29,7 SCU`, double reserve `0`: **PASS**.
- Final Card, Crafting List, Combined, Maximum Craftable és standalone parity: **PASS**; a vegyes hiány mindkét komponense látható.
- M4 audit: **Technical Baseline harness bug**; a probe nem adta át az exact canonical identity mappinget. Az application Combined parity helyes volt.
- C013.1 célkapu: M2, M4, C012.3, C3A, C3B1, C3B2, integrált FR-86, static/single-file és V001/V002 integritás: **PASS**.
- Teljes release-regresszió: **NOT RUN BY SCOPE**. A régi C013 candidate változatlan, de a kézi gate-en talált blocker miatt nem kiadható.
- Friss RC szükséges; V003 tag/release/push/main merge nincs.
- Riport: `docs/V003_C0131_STRICT_QUALITY_ALLOCATION_REPORT.md`.

`V003-C013.1 – STRICT QUALITY ALLOCATION + MIXED SHORTAGE CLASSIFICATION PASS, FRESH RC REQUIRED`
