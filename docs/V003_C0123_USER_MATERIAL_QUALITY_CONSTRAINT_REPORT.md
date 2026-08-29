# V003-C012.3 – User Material Quality Constraint Repair

## Eredmeny

`PASS` – a recept Quality-szemantikaja es a felhasznalo material-allocation korlatja kulon modell. A megszakadt `V003-C013` release-candidate invalidalt; stabil V003 release, tag vagy push nem keszult.

## Gyokerok

A `resolveEffectiveMaterialQualityPolicy()` korabban csak nem-`FIXED`, nem-`UNKNOWN` baseline mellett alkalmazta az explicit `TARGET_Q` vagy `HIGHEST_Q` user materialtervet. Emiatt egy `FIXED` receptnel a felhasznaloi terv teljesen kimaradt az allocationbol: a Stileron Q747 batch a Q800 cel ellenere jogosultnak szamitott.

## Javított modell

- `baselineRecipeQualityRule`: a forrasrecept bizonyitott Quality-szemantikaja; user beallitas nem irja at.
- `userMaterialQualityConstraint`: exact material UUID-hoz tartozo `RECIPE`, `TARGET_Q` vagy `HIGHEST_Q` USER beallitas.
- `allocationRule`, `allocationTarget`, `allocationMinimum`: a ket forrasbol determinisztikusan feloldott tenyleges foglalasi policy.
- `FIXED + RECIPE`: tovabbra is `Barmely Q`.
- `FIXED + TARGET_Q/HIGHEST_Q`: a recipe FIXED marad, de az explicit user-cel az allocation, missing Quality es Max szamitasban ervenyesul.
- HP/receptminimum nem gyengitheto; `UNKNOWN` fail-safe marad.

A Final Card tooltip kulon mutatja a receptet, a sajat anyagcelt es az effektív allocationt.

## Valos fixture – Metamaterial Test #152 ×3

Aktiv SC-verzio: `4.10.0-LIVE.12519617`.

- Stileron Case: FIXED baseline, 0.5 SCU/db, osszesen 1.5 SCU.
- Ouratite: FIXED baseline, 0.3 SCU/db, osszesen 0.9 SCU.
- Q800 user-cel, csak Stileron Q747 es Ouratite Q860 mellett: Q747 ineligible, Stileron foglalas 0, `missingAmount=0`, `missingQuality=1.5 SCU`, a kartya nem teljesult, Max 0; Ouratite Q860 foglalas 0.9 SCU.
- Stileron Q850 1.5 SCU hozzaadasa utan: csak Q850 fogy, Q747 szabad marad, a kartya teljesult, Max 3.
- `HIGHEST_Q`: determinisztikus Q950 → Q850 sorrend; Q747 nem fogy, ha nincs ra szukseg.

## Paritas es perzisztencia

Ugyanaz az effektív policy hajtja a Final Cardot, Crafting Listet, Combined Materialst, Allocation Engine-t, Max craftable szamitast, detailt es standalone exportot. A materialtervek, kartyamennyiseg/sorrend/expanded allapot, batch-ek es loadout backup/restore utan megmaradnak; regi, terv nelkuli adat `RECIPE` alapertelmezest kap.

## Ellenorzes

- C012.3 celteszt: PASS.
- Teljes C001–C012.2 + M1–M6.1 + C04 regresszio: PASS.
- Priority/no-double-count: PASS.
- Combined/Final/standalone `Q800+` paritas: PASS.
- Standalone: 154483 byte; SHA-256 `c5d260c1ddffb6d3638c91c6af7bb650d4162d2d24c77e4890a73605707f30b6`; kulso runtime fetch/resource 0.
- Chrome localhost: Technical Probe PASS; valos Q800 hiany/Max 0 es Q850 teljesules/Max 3; reload fingerprint `749d1f60 -> 749d1f60`; alkalmazas WARN/ERROR 0.
- Stabil V002 tag es artifact: valtozatlan.

## C013 audit

C013 commit nem letezett. A helyi candidate/evidence megmaradt auditcelra, de `INVALIDATED_BY_C012.3_RELEASE_BLOCKER` statuszt kapott, es nem hasznalhato V003 kiadashoz. C013 csak uj felhasznaloi utasitasra indulhat ujra.

## Visszaallas

A C012.3 commit visszavonasaval a javitas eltavolithato. Stabil fallback a valtozatlan `V002` tag es `releases/V002/` artifact.
