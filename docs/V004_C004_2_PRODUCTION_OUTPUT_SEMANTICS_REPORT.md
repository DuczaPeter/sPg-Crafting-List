# V004-C004.2 Production Output Semantics Report

## Eredmény

`V004-C004.2 – PRODUCTION OUTPUT SEMANTICS UNPROVEN, LIVE CRAFT COMPLETE REMAINS BLOCKED`

Gépi döntés:

- `PRODUCTION_OUTPUT_SEMANTICS_UNPROVEN`
- `OUTPUT_COUNT_UNPROVEN`
- `LIVE_CRAFT_COMPLETE_GATE_BLOCKED_BY_UNPROVEN_OUTPUT_SEMANTICS`

Az input checkpoint `82d4814afa2697ebc625f118dde57caa30e372f3`, az alkalmazás auditált SHA-256 értéke `0a0a57ffe689134bb36f7cffc1443dbafbfbdbd8d5e3647affa9194770ee2764`. A C004.2 audit-only ciklus: az alkalmazás HTML-bájtjai nem változtak, C005 nem indult el.

## Bizonyított és nem bizonyított állítások

A jelenlegi live dataset összetevő-mennyiségeinek unitkonverziója sem minősíthető teljes körűen exactnak. Az audit 1606 blueprint 4217 ingredientjét ellenőrizte: 3919 resource `quantity_scu` és 298 item `quantity`. Az item mennyiségek egész darabok, a resource mezők többsége közvetlenül képezhető le a `1 SCU = 10 000 unit` modellre. Hat rekord azonban `0.11000000000000001` vagy `3.0999999999999996` JSON-számot ad vissza. A runtime `Math.round(value * 10000)` ezeket 1100, illetve 31 000 unitra alakítja, de a source számoknak vannak a negyedik tizedesjegy utáni nem nulla jegyei. Ezek valószínűleg lebegőpontos reprezentációs zajból erednek, de erre az audit nem építhet: a `0 unit` tolerancia és a tiltott rounding loss miatt az exact source-to-unit szemantika nem bizonyított. Az érintett blueprint/ingredient párokat a gépi evidence név szerint tartalmazza.

A szabályosan reprezentálható rekordoknál a source requirement és a belső unit közötti leképezés bizonyítható, de ez még ott sem bizonyítja, hogy a requirement mennyiség pontosan egy elkészült output darabra vonatkozik. Ehhez explicit output count/yield mező vagy dokumentált, univerzális „egy blueprint végrehajtás = egy finished item” invariáns kellene. Ilyen bizonyítékot az audit nem talált.

Az OpenAPI „Ingredients required to craft the item” leírása és a singular `item`/`crafted item` szóhasználat nem elegendő output-cardinalitás bizonyítéknak. Ebből nem következtetünk automatikusan `outputCount = 1` értékre.

## Production adatút

Az ellenőrzött út:

1. `GET /api/blueprints` index rekord: output identity és condensed `ingredients`.
2. `GET /api/blueprints/{uuid}` detail: `aspects.aspects[].input.quantity_scu|quantity`, továbbá `ingredients`, `requirement_groups` és `tiers[].requirements` reprezentációk.
3. `blueprintAspectCandidates()` az `aspects.aspects` tömböt választja, hiányában `requirement_groups` fallbacket épít.
4. `normalizeBlueprint()` az SCU értéket `toScuUnits()` segítségével, az item értéket egészre alakítva `requiredQuantityUnits` mezőbe teszi.
5. `sanitizedCardRequirement()` ezt változatlanul a Crafting Cardra másolja.
6. Az Allocation Engine a `requiredQuantityUnits * card.quantity` képletet használja.
7. A UI ugyanezt „1 db-hoz” és „N db-hoz” címkével jeleníti meg.
8. A production Card builder és a stored/migrated Card normalizer `OUTPUT_COUNT_UNPROVEN` állapotot tart fenn; a completion gate csak `PER_FINISHED_ITEM_NORMALIZED_EXACT` evidence mellett engedne tovább.

A 6–7. pont jelenlegi elnevezése és szorzása alkalmazásoldali feltételezés, nem upstream forrásbizonyíték. A fail-closed completion gate ezért szükséges és változatlan maradt.

## Live, nested és linked minták

Négy eltérő production kategória detail és kapcsolt item endpointja került célzott ellenőrzésre:

| Output | Kategória | Blueprint UUID | Megfigyelt requirement típus |
|---|---|---|---|
| TH-01 Propulsor | Cargo | `00eabb01-d628-49f5-a1f6-7c9df4ad9259` | resource SCU |
| LumaCore | PowerPlant | `cb32c252-45b9-43d0-b1bf-f2755c2f320f` | több resource SCU |
| Omnisky III Cannon | WeaponGun | `280f47b7-8434-410c-b854-380768fdccec` | resource SCU és discrete item |
| Vendetta HMG | WeaponPersonal | `b2857c9f-e7ca-4e6f-9071-d352a58383d4` | több resource SCU |

Minden mintánál összevetettük az aspect inputot az `ingredients`, `requirement_groups`, raw `tiers[].requirements`, valamint a kapcsolt `GET /api/items/{outputUuid}?include=blueprints` által visszaágyazott blueprint reprezentációval. A requirement mennyiségek konzisztensen jelen vannak. Output count, output quantity, yield, produced quantity, batch size vagy quantity-per-craft mező egyik root, nested, tier vagy linked reprezentációban sincs.

## Hivatalos dokumentáció és forrás

Ellenőrzött hivatalos források:

- OpenAPI: `https://api.star-citizen.wiki/api/openapi`
- Dokumentáció: `https://docs.star-citizen.wiki`
- Repository: `https://github.com/StarCitizenWiki/API`
- Auditált branch: `develop`; exact commit `3cd0f1a0c17674d751345bb07e1f3eeabf18bc74`.
- `ImportBlueprints.php`: a `blueprints.json` raw payloadból `Output.UUID`, `Output.Name`, `Output.Class` és a teljes payload kerül tárolásra; output cardinality mapping nincs.
- `BlueprintResource.php`: a `blueprint_output` és `outputPayload()` identity/type/grade/link mezőket ad, count/yield nélkül.
- `BlueprintRequirementNormalizer.php`: a requirement `quantity` és `quantity_scu` mezőket normalizálja; output darabszámot nem vezet le.

Az OpenAPI `blueprint_output` mezői: `uuid`, `name`, `class`, `type`, `type_label`, `sub_type`, `subtype`, `grade`, `item_web_url`. Cardinalitásmező nincs. A repository célzott source keresése sem talált `Output.Count`, `Output.Quantity`, `output_count`, `output_quantity`, `produced_quantity`, `batch_size` vagy ekvivalens output-yield mappinget.

## Fail-closed döntés

- Egyetlen production Card vagy output class sem kap `PER_FINISHED_ITEM_NORMALIZED_EXACT` jelölést.
- Új production Card: `OUTPUT_COUNT_UNPROVEN`.
- Régi, hiányos vagy migrált Card: bizonyíték nélkül továbbra is `OUTPUT_COUNT_UNPROVEN`.
- Full és partial Craft Complete production adaton egyaránt blokkolt.
- `outputCount = 1` fallback nincs.
- Más batchből fallback fogyasztás továbbra sincs.
- Az alkalmazás HTML-je nem változott; a single-file runtime és a V001/V002/V003 védelem változatlan.

## Ellenőrzés és scope

Futtatott célzott kapu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-v004-c0042.ps1"
```

A kapu read-only GET auditot, production data-flow source-assertionöket, current-byte SHA-védelmet, unitkonverzió-auditot, négy kategóriás detail/linked ellenőrzést, OpenAPI/source mappinget, single-file statikus ellenőrzést, protected release integritást és `git diff --check` vizsgálatot végez. A jelenlegi audit kifejezetten megköveteli a megtalált nem-exact quantity evidence megőrzését; annak eltűnése új szemantikai felülvizsgálatot igényel. Full regression és Chrome nem futott, mert az alkalmazás bájtjai nem változtak; C005 nincs a scope-ban.

Gépi evidence:

- `test-artifacts/V004-C004.2/production-output-semantics.json`
- `test-artifacts/V004-C004.2/target-summary.json`
- `test-artifacts/V004-C004.2/validation.log`

## Rollback

A ciklus csak audit toolingot, evidence-et, riportot és projektmetát ad hozzá. Az alkalmazás rollbacket nem igényel. A C004.2 checkpoint normál Git reverttel visszavonható; V003 taghez vagy release artifacthoz nem kell és nem szabad nyúlni.
