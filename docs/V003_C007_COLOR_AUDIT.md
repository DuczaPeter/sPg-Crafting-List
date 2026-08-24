# V003-C007 Material Color Audit

## Scope

This cycle adds material visual identity only. The C006 final-card view-model, hydration, deterministic allocation, mining ranking/grouping/Top-3, canonical naming, Radar values and UEX mapping remain unchanged. No V003 stable release or tag was created.

The canonical source is `Info/Radar Signature.png`:

- SHA-256: `f9c6e362a41bbbc28acbac984300d582a00bc4b79a7e9738f136e1da89cabdc6`
- Dimensions: `1182 × 879`
- Registry: `V003-C007-1`
- Verified material records: `33`
- User-facing unmapped materials: `31`
- Runtime image dependency: `0`

The complete per-record UUID, source row, source pixel coordinate and color evidence is stored in `test-artifacts/V003-C007/material-color-audit.json`. The audit decodes the PNG directly with built-in Node modules and checks all 33 sample pixels against the embedded registry.

## Verified source palette

| Source row group | Canonical materials | Exact foreground / border | Chip background |
| --- | --- | --- | --- |
| Quantainium–Savrilium | Quantainium, Stileron, Savrilium | `#ffaa33` | `rgba(255, 170, 51, 0.16)` |
| Ouratite–Lindinium | Ouratite, Riccite, Lindinium | `#cc66ff` | `rgba(204, 102, 255, 0.16)` |
| Beryl–Bexalite | Beryl, Taranite, Borase, Gold, Bexalite | `#3399ff` | `rgba(51, 153, 255, 0.16)` |
| Laranite–Torite | Laranite, Aslarite, Titanium, Tungsten, Agricium, Torite | `#33ccaa` | `rgba(51, 204, 170, 0.16)` |
| Hephaestanite–Ice | Hephaestanite, Tin, Quartz, Corundum, Copper, Silicon, Iron, Aluminum, Ice | `#8899aa` | `rgba(136, 153, 170, 0.16)` |
| ROC Mineables | Beradon, Feynmaline, Glacosite | `#66ddaa` | `rgba(102, 221, 170, 0.16)` |
| FPS Mineables | Aphorite, Dolivine, Hadanite, Janalite | `#77bbdd` | `rgba(119, 187, 221, 0.16)` |

The foreground and border are the exact source-image hue. The image does not define a separate filled chip background, therefore the background is a controlled 16% alpha UI tint of that same verified hue (`UI_TINT_FROM_VERIFIED_ACCENT_16_PERCENT`). This does not create a second semantic color. The source image also contains a Salvage row (`#aa9977`), but no exact Wiki material UUID in the current user-facing dataset proves a safe material mapping, so it creates no registry record.

## Resolver and fallback

`resolveMaterialColor()` uses one deterministic sequence:

1. exact Wiki commodity UUID;
2. one unique exact canonical material name for legacy ingredient UUID/cache records;
3. neutral `UNMAPPED_COLOR` fallback.

There is no fuzzy matching and no inference from rarity, Quality, Wiki signature, SCMDB, mining category, random values or hashes. `UNMAPPED_COLOR` uses neutral foreground/background/border values and is present in diagnostics/data attributes without adding visible “unknown color” text.

Current unmapped list:

`Altruciatoxin`, `Amioshi Plague`, `Bluemoon Fungus`, `Carinite`, `Carinite (Pure)`, `Comp Board`, `Construction Materials`, `Decari`, `Degnous`, `E'tam`, `Fotia`, `Fresh Food`, `Golden Medmon`, `Heart of the Woods`, `Jaclium`, `Maze`, `Neograph`, `Neon`, `Nitrogen`, `Organics`, `Pingala`, `Pitambu`, `Prota`, `Ranta Dung`, `Recycled Material Composite`, `Revenant`, `Sadaryx`, `Saldynium`, `SLAM`, `Sunset Berry`, `WiDoW`.

## Consumers

The same embedded registry, resolver and generic CSS-variable renderer is used by:

- Crafting Card material tokens;
- the subtle Radar Signature panel accent;
- My Materials;
- Combined Materials;
- Material Database result and detail labels;
- standalone Crafting/Farm Card export.

The existing `data-material-uuid`, `data-material-name` and `spg-material-token-accent-pending` hooks remain compatible. The standalone export embeds the resolved color metadata and generic CSS; it does not load the PNG or any external runtime resource.

## JS-300 reference

| Material | Wiki commodity UUID | Foreground / border | Background | Radar |
| --- | --- | --- | --- | --- |
| Stileron | `32bafbd4-c52a-476d-b31c-97c4b3102471` | `#ffaa33` | `rgba(255, 170, 51, 0.16)` | `3185–6370 (1–2× cluster)` |
| Beryl | `eb503701-389a-48a1-af28-eb7374009d5d` | `#3399ff` | `rgba(51, 153, 255, 0.16)` | `3540–14160 (1–4× cluster)` |
| Savrilium | `d76ea7ef-5116-488c-93d3-71e02bada13d` | `#ffaa33` | `rgba(255, 170, 51, 0.16)` | `3200–6400 (1–2× cluster)` |

The automated fixture kept requested quantity `2`, maximum craftable `3`, HP_MIN_500/FIXED allocation, mining recommendations and UEX snapshots unchanged.

## Verification

- Source image pixel audit: `33/33 PASS`.
- Targeted C007 registry/resolver/consumer/export tests: `PASS`.
- C001–C006 + M1–M6.1 + C04 full regression: `PASS`.
- Automated standalone JS-300 artifact: `108220` bytes, SHA-256 `4967a01c6a0eedfd7eaa405973ac080b762e5dde59c91bedaa6f9016b9b831fb`, external runtime resources `0`.
- Chrome localhost: registry `V003-C007-1`, `33 VERIFIED_COLOR / 31 UNMAPPED_COLOR`, Technical Probe `PASS`, reload fingerprint `52f14d76 → 52f14d76`, console warning/error `0`.
- Chrome downloaded standalone: color registry and snapshot JSON present, external runtime resources `0`. Browser policy blocked Codex automation from navigating to the downloaded `file://` URL; no workaround was attempted.
- User-reported C006 real Chrome `file://`: Crafting Card, quantity recalculation, material hydration and standalone export `MANUAL PASS`; this was performed by the user, not Codex automation.
- V002 tag commit: `b326aaff5838aafd5b1f13b16982c29a0e150e35` unchanged.
- V002 stable HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357` unchanged.

## Next step

Stop for user visual review. V003-C008, a stable V003 release and a V003 tag are not started or authorized.
