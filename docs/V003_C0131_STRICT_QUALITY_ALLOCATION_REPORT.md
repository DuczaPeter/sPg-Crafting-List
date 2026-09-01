# V003-C013.1 – Strict Quality Allocation + Mixed Shortage Classification

## Státusz

`V003-C013.1 – STRICT QUALITY ALLOCATION + MIXED SHORTAGE CLASSIFICATION PASS, FRESH RC REQUIRED`

A korábbi C013 release candidate kézi `file://` kapuja `BLOCKED`. A javításból nem készült új candidate, V003 tag vagy release.

## Root cause és javítás

Az Allocation Engine korábban a Recipe Slotok stabil megjelenítési sorrendjében foglalt. Az FR-86 Shell Q500+ ezért a Q512/Q517 után a Q910 batchből is fogyasztott, mielőtt a Field Array Q900+ requirement sorra került. Ez valódi application Quality-starvation volt.

Az új ütemezés:

1. Crafting Card priority;
2. ugyanazon Cardon exact canonical material + unit csoport;
3. a csoportban magasabb effektív minimum Quality előbb;
4. azonos thresholdnál stabil Recipe Slot sorrend.

A Cardok közötti prioritás nem változott. Az allocation belső feldolgozási sorrendje és a felhasználói Recipe Slot megjelenítési sorrend külön marad.

## Vegyes hiányosztályozás

Minden requirement a saját feldolgozási pontján rögzíti:

- a még fizikailag elérhető azonos canonical material + unit mennyiséget;
- a Quality szabályt teljesítő eligible mennyiséget;
- a tényleges foglalást.

Az osztályozás:

`missing = required - allocated`

`missingAmount = min(missing, max(0, required - physicalAvailable))`

`missingQuality = missing - missingAmount`

Így egy requirement egyszerre hordozhat mennyiségi és Quality-hiányt, double count nélkül. A Final Card és a standalone sor mindkét pozitív komponenst megjeleníti.

## Kötelező FR-86 fixture

Fixture: `FR86_MIXED_AMOUNT_AND_QUALITY_SHORTAGE`; quantity `17`; Shell Minimum Q500; Field Array MAX Q900; Stileron Q512 `16 SCU`, Q517 `1 SCU`, Q910 `6 SCU`.

| Requirement | Reserved | Mennyiséghiány | Quality-hiány |
|---|---:|---:|---:|
| Field Array Q900+ | 6 SCU | 9,3 SCU | 17 SCU |
| Shell Q500+ | 17 SCU | 3,4 SCU | 0 SCU |
| Összesen | 23 SCU | 12,7 SCU | 17 SCU |

Teljes hiány `29,7 SCU`; `12,7 + 17 = 29,7`; double reserve `0`: **PASS**.

## M4 Technical Baseline audit

Verdikt: **baseline/harness canonical identity bug**, nem application Combined parity bug.

A normál alkalmazás a Combined modellnek átadta a `state.knownMaterials` exact commodity↔ingredient UUID kapcsolatot. A Technical Baseline probe ezt az argumentumot kihagyta, ezért az ingredient UUID (`8cd317a3-df9b-4315-8ac3-0f1fca42dfd4`) és a canonical commodity UUID (`32bafbd4-c52a-476d-b31c-97c4b3102471`) külön kulcsnak látszott. A probe most ugyanazt az exact mapet használja; fuzzy/name merge nincs.

## Célzott ellenőrzés

- C013.1 exact mixed fixture, reverse Recipe Slot input és két-Card priority: PASS.
- Korábbi FR-86 happy path és Q550-only Quality shortage: PASS.
- Combined, Final Card, Crafting List, Maximum Craftable és standalone parity: PASS.
- M2, M4, C012.3, C012.5C3A/C3B1/C3B2 és integrált FR-86 célregresszió: PASS.
- Static syntax/single-file gate: PASS.
- V001/V002 integritás: PASS.
- Blokkolt C013 candidate SHA-256 változatlan: PASS.
- Teljes release regression: **NOT RUN BY SCOPE**.

Bizonyíték: `test-artifacts/V003-C013.1/`.
