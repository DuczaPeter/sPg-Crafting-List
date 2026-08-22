# M1 jelentés – verziózott Blueprint cache és Browser

Dátum: 2026-08-22

## 1. API endpointok és filterek

- `GET /game-versions/default`: az új szinkron jelölt SC-verziója.
- `GET /blueprints/filters`: az `output.type`, `ingredient.uuid` és `resource.uuid` API-facetek; a Browser output-típus választója ebből épül fel.
- `GET /blueprints`: verziózott index `page[number]`, `page[size]=200` és `version` paraméterrel. A jelenlegi 1591 rekord 8 lap.
- Támogatott célzott API-filterek: `filter[output.type]` és `filter[ingredient.uuid]`. A technikai próba valós `PowerPlant` output-filtert is ellenőriz.
- `GET /blueprints/{uuid-or-slug}`: a teljes recept csak megnyitáskor töltődik le.
- A rendszer nem tölti le a teljes `/items` készletet.

## 2. Normalizált adatmodell

```text
Blueprint
└── recipeSlots[]  (egy API Aspect egy külön rekord)
    ├── recipeSlotKey / recipeSlotName / aspectIndex
    ├── requiredCount / selectionGroup / isSelected
    ├── Ingredient
    │   ├── uuid / resourceTypeUuid / itemUuid / commodityUuid
    │   ├── kind / name / apiUrl / webUrl
    │   └── provenance
    ├── Quantity
    │   ├── unit: SCU | ITEM | UNKNOWN
    │   ├── rawValue
    │   └── internalUnits (SCU esetén 1 SCU = 10 000)
    ├── Quality
    │   ├── capability: DYNAMIC | FIXED | UNKNOWN
    │   ├── min / initial / sliderMin / sliderMax
    │   └── modifiers[]
    └── provenance
```

Azonos material több Aspectban nem kerül összevonásra. Minden Blueprint-, Recipe Slot-, Ingredient- és Modifier-rekord visszavezeti az API UUID-t, a raw blueprint UUID-t, az SC-verziót, az adatforrást, a lekérési időt, az eredetet és a raw cache kulcsát. A `DYNAMIC`/`FIXED` érték csak explicit API-booleanból születik; különben `UNKNOWN`.

## 3. Verziózott cache működése

- `blueprintIndexRawCache`: verziózott raw indexrekordok és raw filterpayload.
- `blueprintIndexCache`: külön normalizált, kereshető index.
- `blueprintRawCache`: lusta betöltésű teljes raw blueprint.
- `blueprintNormalizedCache`: lusta betöltésű teljes normalizált recept.
- `blueprintDatasets`: verziónkénti dataset-metaadat.
- Cache-kulcs: `{SC-verzió}::{API UUID}`.
- A teljes lapozás és validáció memóriában stagingelődik; a jelölt verzió korábbi indexkulcsainak cseréje, az új index, a dataset-meta és az aktív pointer egy IndexedDB-tranzakcióban íródik. Más SC-verziók cache-e megmarad. Az állapot csak a tranzakció sikeres lezárása után vált az új verzióra.
- Hiba vagy abort esetén az előző aktív pointer és dataset változatlan. A rollback-próba ezt közvetlenül ellenőrzi.
- A Game Data tranzakció nem nyit meg User Data store-t; kényszerített frissítés előtt és után a User Data rekordszámok egyezését is ellenőrzi.
- Az alkalmazás csak megnyitott állapotban frissít a háttérben.

## 4. Valós blueprint tesztadatok

- Teljes aktív index: 1591 blueprint, aktuális `4.9.0-LIVE.12232306` adaton.
- JS-300 (`9585b0dc-b660-4e2a-9136-0092af1e72c1`): 3 külön slot; Stileron `0,35 SCU` DYNAMIC, Beryl `0,14 SCU` FIXED, Savrilium `0,24 SCU` FIXED.
- Hofstede-S1 Mining Laser (`ccbb801a-ad5e-4e15-a842-ad315f43dd4e`): vegyes egységek; Iron `0,36 SCU`, Sadaryx `7 ITEM`, Copper `0,11 SCU`.
- Mesterséges regressziós fixture: ugyanaz a Copper UUID két külön Aspectban; a normalizálás két külön slotot tart meg.

## 5. Teszteléskor talált és javított hibák

- A JavaScript `Number(null) === 0` viselkedése miatt a hiányzó mennyiség tévesen SCU-nak minősülhetett. Most csak ténylegesen megadott numerikus érték kap `SCU` vagy `ITEM` unitot.
- Az explicit, elvárt IndexedDB-abort eseményét a rollback-próba kezdetben hibának minősítette. Az `AbortError` most várt rollbackként kezelődik, majd az aktív pointer visszaolvasással igazolódik.
- Azonos SC-verzió újraszinkronizálásakor egy API-ból eltűnt rekord régi kulcsa bent maradhatott volna. A jelölt verzió korábbi indexkulcsai most az aktiváló tranzakción belül cserélődnek le.

## 6. Nyitott pontok M2 előtt

- A közvetlen `file://` Chrome/Edge kapu továbbra is kézi ellenőrzés; addig nincs stabil kiadás.
- Az exportált fájl tényleges offline újranyitása és külön Edge-regresszió még nyitott.
- M2-ben következik a My Materials, Quality batch-ek és a determinisztikus Allocation Engine. A jelenlegi slotonkénti modell ennek bemenete, inventoryt még nem fogyaszt véglegesen.

## M1 ellenőrzési eredmény

- `tools/validate-m1.ps1` és `V001-C003`: PASS.
- Chrome localhost: aktív index 1591, raw index 1592 rekord a külön filterpayload miatt, normalizált index 1591.
- Cache újratöltés után visszaállt; raw/normalizált payload elkülönítés és provenance: PASS.
- Technikai próba: 8/8 PASS.
- Chrome warning/error konzol: 0.
- Desktop és 390 px mobil vizuális ellenőrzés: PASS.
