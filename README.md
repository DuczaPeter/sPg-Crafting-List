# sPg Crafting List

English: **README.md** · Magyar: [README_HU.md](README_HU.md)

## Download V002

**[Download V002 – sPg Crafting List.html](https://github.com/DuczaPeter/sPg-Crafting-List/releases/download/V002/sPg.Crafting.List.html)**

## What is sPg Crafting List?

sPg Crafting List is a local Star Citizen planning tool for crafting recipes, material inventory, Quality-aware allocation, mining data, loadouts, and refinery recommendations. It runs in the browser and combines current game data with the materials and plans you keep locally.

**V002 is a true single-file release. No additional local files are required.** The application CSS and JavaScript are embedded in `sPg Crafting List.html`; there is no build step, runtime sidecar, separate stylesheet, or separate script to install.

## What is it for?

The application turns blueprint recipes and your material batches into a traceable crafting plan. It keeps Recipe Slots separate, applies the relevant Quality rule to each slot, reports quantity and Quality shortages, and can combine the demand of multiple Crafting Cards. Mining locations, saved mining loadouts, and UEX refinery data help with the next collection or refining step.

Allocation in V002 is a planning operation. It reserves material for the displayed plan but does not permanently deduct inventory.

## Download and run

1. Use the [direct V002 release download](https://github.com/DuczaPeter/sPg-Crafting-List/releases/download/V002/sPg.Crafting.List.html).
2. Open it in a current Google Chrome browser.
3. Click `Adatok frissítése` to load or refresh game data.
4. Use the Blueprint Browser or any of the other modules.

The file can be opened directly from disk in Chrome using `file://`. No `Info` directory, separate CSS file, separate JavaScript file, local web server, installation, or build process is needed.

## Main features

### Blueprint Browser

Browse the available blueprint index with filtering and pagination, then load recipe details when needed. Normalized records retain the source UUID, Star Citizen data version, source, retrieval time, and the original Recipe Slot / Aspect structure.

### Crafting List

Create multiple Crafting Cards, set requested quantities, choose per-slot Quality strategies where the source data supports them, and reorder cards. Card order is the deterministic inventory reservation priority: the top card receives eligible stock first.

### My Materials and Quality batches

Maintain a global material inventory. One material can have multiple Quality batches, each with its own amount. SCU amounts are stored with integer precision (`1 SCU = 10,000` internal units) to avoid floating-point drift.

### Quality-aware deterministic allocation

Allocation happens at Recipe Slot level, not only at aggregated material level. The same material can therefore follow different rules in different slots. Supported behavior includes:

- `HP_MIN_500`: use the lowest eligible batch above the minimum;
- `Highest Q`: consume the highest available Quality first;
- `Target Q`: use the lowest batch that meets or exceeds the target;
- `FIXED`: no user-selectable Quality strategy;
- `UNKNOWN`: preserve uncertainty instead of guessing.

The same input, card order, and inventory always produce the same allocation result. Quantity shortages, Quality shortages, missing amounts, and bottlenecks remain distinguishable in the result and diagnostics.

### Combined Materials

See the total demand across all Crafting Cards, including required, available, reserved, and missing amounts. The view can group identical materials for readability while preserving the contributing blueprints, Recipe Slots, and Quality requirements. It is a direct projection of the same Allocation Engine used by the individual cards.

### Material Database

Explore normalized commodity and harvestable data across Ship Mining, Vehicle Mining, FPS Mining, and Harvestable categories. Available source fields are shown without inventing missing values.

### Mining locations

For supported materials, the application displays available mining/farm locations by star system. Ranking uses occurrence, then spawn, then maximum Quality when those values are supplied by the API. Available details can include Radar Signature, occurrence, spawn, and maximum Quality; missing or unknown source values remain unknown.

### Mining Loadouts

Save multiple material-specific loadouts and mark one as the default. A loadout can retain its vehicle, mining stations, heads, modules, gadgets, and user overrides. Saved loadouts are User Data, so a game-data refresh does not delete them; unavailable equipment is retained visibly for review.

### UEX Refinery recommendations

UEX refinery yield records are cached separately and mapped to Wiki commodities using deterministic, traceable rules. Recommendations are ranked by the documented 30-day yield bonus (`value_month`) within the selected star system, including ties and explicit zero or negative values where present.

### Data / Settings

This module contains game-data refresh controls, User Data backup and import, import preview and validation, diagnostics, and `Log másolása` for copying a support-ready diagnostic package. Imports are previewed before application, use an automatic snapshot, and are applied transactionally so invalid or interrupted imports do not silently replace existing User Data.

### Standalone Crafting Card export

Export a Crafting Card as another standalone HTML file. The export embeds the required styling and data snapshot, including recipe, allocation, mining, refinery, and selected loadout information available to the card. It does not need the main application or an external CSS, font, script, Wiki, or UEX request when opened.

## Updating game data

Click `Adatok frissítése` while online. The application retrieves and normalizes the current supported Star Citizen Wiki and UEX data into versioned caches. A new game-data cache becomes active only after a successful transaction; a failed refresh keeps the previous working cache. Refreshing Game Data does not modify User Data.

## How local User Data works

Your material inventory, Quality batches, Crafting Cards, Quality strategies, mining loadouts, overrides, and settings are stored locally in the browser with IndexedDB. The application is not a cloud user-account system and does not provide automatic multi-device synchronization. Browser-profile removal or site-data clearing can remove this local data, so use the backup export before browser maintenance or moving to another computer/profile.

## Data sources

- [Star Citizen Wiki API](https://api.star-citizen.wiki/api) provides blueprint, commodity, mining equipment, vehicle, and related game data.
- [UEX Corp API](https://api.uexcorp.uk/2.0/refineries_yields) provides refinery yield data used by the recommendation view.

Source identifiers, data version, retrieval time, and mapping origin are retained where the normalized model supports them. API data and user-authored overrides remain distinguishable.

## Limitations

- The accepted V002 local-file environment is Windows 11 with a current Google Chrome browser. Other browsers and operating systems have not received the same manual acceptance coverage.
- A fresh game-data update requires internet access and depends on the availability and compatible schemas of the source APIs. Previously cached data can remain usable locally.
- Missing, ambiguous, or unsupported source data is shown as unknown or unmapped; the application does not use broad fuzzy matching to invent a result.
- Allocation is a plan only and does not permanently consume inventory.
- Mining-location and refinery results are recommendations derived from the available API data, not guarantees of in-game availability or outcome.
- User Data is local to the browser profile. There is no hosted account, cloud backup, or automatic device synchronization.

## Version information

- Version and Git tag: `V002`
- Release format: one standalone `sPg Crafting List.html`
- Runtime sidecars required: `0`
- Chrome `file://` Technical Baseline: `13/13 PASS`
- Full M1–M6.1 + C04 regression: `PASS`
- Star Citizen Wiki API and UEX API checks: `PASS`
- IndexedDB/User Data compatibility: `PASS`
- Standalone Crafting Card export: `PASS`
- Release HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`

See the [V002 release report](docs/V002_RELEASE_REPORT.md) for the recorded release evidence.

## Disclaimer

sPg Crafting List is a community-made tool and is not an official Cloud Imperium Games application. It is not affiliated with or endorsed by Cloud Imperium Games. Star Citizen, related names, and game data belong to their respective owners.
