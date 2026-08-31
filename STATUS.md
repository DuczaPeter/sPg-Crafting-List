# STATUS.md

- Projekt: `sPg Crafting List`
- Stabil baseline: `V002` (`V002` tag és `releases/V002/` változatlan)
- Fejlesztési ág: `develop/V003`
- Fejlesztési verzió: `V003-dev`
- Aktuális ciklus: `V003-C012.5B`
- Baseline commit: `24166b958391c6e2b57fe244ec8bf030ce132b0a`
- Állapot: `PASS`
- Következő ciklus: `V003-C012.5C NOT STARTED`
- Release: nincs V003 tag, release, push vagy main merge

## Aktuális eredmény

- A C012.5A inventory ∪ requirement és exact canonical UUID modell változatlanul megmaradt.
- Minden canonical material külön `Minimum Q` és `MAX Q` egész (0–1000) User Data beállítást kapott; ez külön tárolódik a meglévő `materialQualityPlans` modelltől.
- A két blokk csak eligible inventory előnézet: `Q >= threshold`. Az átfedés megengedett, a fizikai készletet nem duplázza és allocation/recipe-hozzárendelést nem módosít.
- Exact `commodityUuid ↔ ingredientUuid` ugyanazt a pool-beállítást használja; név/fuzzy alias nincs.
- A Combined főnézet nem renderel Recipe Slot listát vagy dropdownot. Standalone, allocation, Quality policy és V002 nem változott.

## Bizonyíték

- Target validator: `PASS`; C012.5B fixture, C012.5A, C012.4 numeric, C012.3 Quality, static/JS és V001/V002 integrity zöld.
- Chrome localhost: inventory-only 3 material; Stileron Q550 2 SCU + Q975 1 SCU; Minimum Q500 eligible 3 SCU, MAX Q950 eligible 1 SCU; JS-300 add/remove és reload után a beállítások megmaradtak.
- Chrome 1920×1080 és 390×844: overflow `0`; console `WARN 0 / ERROR 0`; záró fingerprint `ea5989f9`.
- Régi backup új pool kulcs nélkül kompatibilis; meglévő Quality plan nem íródik felül.
- C013 candidate invalidált marad; C012.5C és C013 nincs elindítva.

Végső státusz: `V003-C012.5B – COMBINED QUALITY POOLS PASS, C012.5C NOT STARTED`
