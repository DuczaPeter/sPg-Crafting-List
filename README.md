# sPg Crafting List

[Magyar dokumentáció](README_HU.md)

**sPg Crafting List** is a local Star Citizen crafting, inventory, Quality, mining and refinery planning tool. It runs directly in a browser and is designed to combine blueprint requirements, the player's stored materials, Quality rules, mining locations, mining loadouts and refinery recommendations in one place.

Current stable release: **V001**  
Release status: **V1 STABLE RELEASE – APPROVED WITH ACCEPTED MANUAL TEST WAIVERS**

## What is it for?

The main goal is to answer a practical crafting question:

> What do I want to craft, what materials do I need, what Quality is required, what do I already have, what is still missing, where can I farm it, and where should I refine it?

Instead of treating a recipe as a simple material total, the application keeps the original **Blueprint → Recipe Slot → Ingredient** structure. This matters because the same material can appear in multiple recipe slots with different Quality behaviour or stat effects.

## Main features

| Module | Purpose |
| --- | --- |
| **Crafting List** | Add one or more blueprints, set the desired quantity, calculate required/reserved/missing materials and control card priority. |
| **Blueprint Browser** | Search the current Star Citizen blueprint dataset and open the full slot-level recipe only when needed. |
| **My Materials** | Store your own material batches with material, Quality, quantity and unit. Each Quality batch remains separate. |
| **Material Database** | Browse mineable/harvestable materials, mining method, Radar Signature, rarity, instability, resistance, location data, refinery data and saved default loadout where available. |
| **Mining Loadouts** | Save per-material mining setups with vehicle, mining heads, modules and gadgets. Vehicle station count and head module slots are taken from API data where possible. |
| **UEX Refinery** | Show the best available refinery recommendation per star system from UEX data. |
| **Combined Materials** | Merge requirements from all active Crafting Cards while preserving Recipe Slot and Quality details. |
| **Data / Settings** | Export/import User Data backups and copy diagnostic logs. |

## Quality and allocation logic

The application never silently invents Quality behaviour.

- **FIXED**: the blueprint input is fixed; no Quality strategy is applied.
- **DYNAMIC**: the input supports Quality-aware allocation.
- **UNKNOWN**: the source data is not sufficient, so the application does not guess.

For HP/Integrity-only dynamic inputs, the V001 rule is **Q500+ is sufficient**, and the lowest suitable batch is reserved first. Functional Quality inputs can use Quality strategies supported by the current blueprint data and UI, such as **Highest Q** or **Target Q**.

Allocation is a **planning reservation only**. It does not permanently subtract materials from `My Materials`.

When several Crafting Cards are active, the card order defines reservation priority: the top card reserves first.

## Data sources

### 1. Star Citizen Wiki API

Primary Star Citizen game-data source:

- Developer documentation: `https://api.star-citizen.wiki/developers`
- API base: `https://api.star-citizen.wiki/api`

V001 uses the API for versioned game data, including:

- `GET /game-versions/default`
- `GET /blueprints/filters`
- `GET /blueprints`
- `GET /blueprints/{uuid-or-slug}`
- `GET /commodities/filters`
- `GET /commodities`
- `GET /commodities/{uuid}`
- `GET /items/filters`
- `GET /items`
- `GET /items/{uuid}`
- `GET /vehicles/filters`
- `GET /vehicles`
- `GET /vehicles/{uuid}?include=ports,components`

These records are used for blueprints, Recipe Slots, ingredients, mining commodities, Radar Signature and mining-location data, mining equipment classifications, mining head module slots and mining-vehicle station detection.

The V001 release validation was performed against Star Citizen data version:

`4.9.0-LIVE.12232306`

The application is designed to follow the API's current default game version on later refreshes, so the runtime data version may be newer than the release-validation version.

### 2. UEX Corp API

Refinery source:

- `GET https://api.uexcorp.uk/2.0/refineries_yields`

The application keeps UEX refinery data separate from Star Citizen Wiki Game Data and User Data. V001 ranks refinery results per star system by UEX `value_month` and keeps ties instead of arbitrarily selecting one terminal.

Wiki ↔ UEX commodity matching is intentionally strict. The application does **not** use fuzzy name guessing. Unknown or unsafe matches remain `UNMAPPED`/`AMBIGUOUS` instead of being forced into a result.

Release-verified mapping state:

`24 MATCHED / 50 UNMAPPED / 0 AMBIGUOUS`

### 3. Local development/UI reference

The project also used this local reference during UI/export development:

`Info/Star_Citizen_alapanyag_farm_kartyak_BP_API_C788_P6_P8_Killshot_bovitve.html`

The main visual stylesheet is:

`Info/style.css`

This is a design/reference source, not a live game-data source.

## Installation and starting the application

No installer, build system or local server is required for normal V001 use.

Keep these two files in their original relative structure:

```text
sPg Crafting List.html
Info/
└── style.css
```

Recommended environment:

- Windows 11
- Current Google Chrome
- Open the HTML directly from Windows Explorer (`file://` mode)

The V001 Chrome `file://` acceptance gate passed completely.

Microsoft Edge was not separately manually accepted for V001. This was an explicitly accepted release waiver, so **Chrome is the recommended browser for the stable V001 release**.

## Quick start

1. Open `sPg Crafting List.html` in Chrome.
2. Click **Adatok frissítése** to refresh Star Citizen Wiki and related cached Game Data when internet access is available.
3. Optional: click **Technikai próba** to run the built-in technical checks.
4. Open **Blueprint Browser** and search for the component/item you want to craft.
5. Open the blueprint and click **Megnyitott blueprint hozzáadása**.
6. Go to **Crafting List** and set the desired crafting quantity.
7. Open **My Materials** and add the material batches you actually own.
8. Return to **Crafting List** to see reserved, missing and Quality-missing amounts.
9. Use **Combined Materials** if you have multiple active crafting projects.
10. Use **Material Database**, **Mining Loadouts** and **UEX Refinery** to plan where and how to obtain/refine missing resources.
11. Use **Export HTML** on a Crafting Card when you want a standalone crafting/farming card.
12. Use **Data / Settings → Backup JSON letöltése** regularly to save your User Data.

## Module usage

### Blueprint Browser

Search by blueprint/output name or UUID and optionally filter by output type. The blueprint index is cached, while the full recipe is loaded only when a blueprint is opened.

### Crafting List

Add the currently opened blueprint, set how many items you want to craft, and review each Recipe Slot separately.

The card shows, depending on the available source data:

- required quantity;
- available quantity;
- reserved quantity;
- missing quantity;
- Quality shortage;
- Quality rule/strategy;
- allocated Quality batches;
- mining/farm information;
- UEX refinery recommendation;
- saved mining loadout.

Multiple cards are supported. Reordering the cards changes allocation priority.

### My Materials

Each material batch is stored separately.

Fields:

- Material name
- Material UUID
- Quality (`0–1000` when applicable)
- Quantity
- Unit (`SCU` or item count)
- Optional note

If you select a known material from the material-name suggestion list, the application can fill its API UUID automatically.

Internally, SCU is stored using whole-number precision:

`1 SCU = 10,000 internal units`

### Material Database

Use the search and category filters to inspect available materials:

- All
- Ship Mining
- Vehicle Mining
- FPS Mining
- Harvestable

Where supported by the API, the detail page can show:

- mining method;
- Radar Signature;
- rarity;
- instability;
- resistance;
- best locations per star system;
- occurrence;
- spawn value;
- maximum Quality;
- UEX refinery recommendation;
- your saved default mining loadout.

Location ranking is based on real source fields rather than a synthetic score: occurrence first, then spawn, then maximum Quality.

### Mining Loadouts

Select a material and create one or more loadouts.

A loadout can contain:

- name;
- mining vehicle;
- mining station/head count;
- mining head per station;
- the number of module slots exposed by that head;
- modules;
- any number of gadgets;
- default-loadout flag.

Where the API cannot safely determine station count, the UI allows a manual station override. Missing equipment from a newer/older game dataset is preserved and marked instead of silently deleted.

### UEX Refinery

Choose a Wiki mining commodity and view the best refinery results per star system.

The ranking field is UEX `value_month`.

- Equal best values remain as ties.
- Zero or negative values are not silently hidden.
- If there is no safe Wiki ↔ UEX mapping, the application says so instead of guessing.

The UEX cache normally refreshes at most once per day unless you trigger a manual refresh.

### Combined Materials

This is the combined view of all active Crafting Cards. It helps prepare a shopping/mining list for several crafting goals at once while still retaining the original Recipe Slot and Quality details.

### Data / Settings

Use **Backup JSON letöltése** to export User Data.

Backup contains User Data, not the refreshable Game Data cache. Import supports preview and validated merge/replace modes.

The diagnostic area can copy a compact log containing API/cache/allocation/refinery/export/error information for troubleshooting.

## Local storage and cache behaviour

User-created data is stored locally in the browser using **IndexedDB**. This includes material batches, Crafting Cards, mining loadouts and related settings.

Game Data is cached separately and can be refreshed from the external APIs. UEX Game Data is also stored separately from Wiki Game Data and User Data.

Browser profiles do not share the same IndexedDB automatically. For example, Chrome and Edge should be treated as separate local data stores. Use the JSON backup if you need to move User Data.

If a valid Game Data cache is already available, the application can fall back to stored data when live refresh is unavailable. A fresh data synchronization requires internet access.

## Standalone Crafting/Farm Card export

Each Crafting Card can be exported with **Export HTML**.

The exported file contains a snapshot of the card data and embedded styling so it can be opened separately from the main application. V001 verification confirmed that the generated standalone export does not request external HTTP/HTTPS runtime resources during reload.

The Windows-level hard-disconnect reopen test was not manually performed for V001 and was accepted as a release waiver. This does not change the fact that the export is generated without external runtime dependencies; it only documents the exact manual test coverage.

## V001 test status

- Automated M1–M6.1 + C04 regression: **PASS**
- Chrome C01–C17 direct `file://` acceptance: **PASS**
- Standalone O01–O03 and O05–O06: **PASS**
- O04 Windows-level hard-disconnect reopen: **NOT TESTED – ACCEPTED RELEASE WAIVER**
- Edge E01–E10 manual acceptance: **NOT TESTED – ACCEPTED RELEASE WAIVER**
- User Data loss during acceptance: **NO**

## Project layout

```text
sPg Crafting List.html          Main application
Info/style.css                  Main stylesheet
releases/V001/                  Frozen stable V001 bundle
docs/                           Technical/project documentation
tests/                          Regression fixtures/test plan
tools/                          Validation and test scripts
test-artifacts/                 Cycle-by-cycle evidence
```

For the stable release, use the frozen bundle under:

`releases/V001/`

## Important behaviour

- The tool does not guess missing Quality rules.
- The same material in different Recipe Slots is kept separate until the allocation/result stage where appropriate.
- Mining equipment lists come from API classifications instead of a manually hard-coded equipment list.
- New API items are intended to appear without application-code changes when their API classification/schema remains compatible.
- User Data and Game Data are deliberately separated.
- Always keep a backup before major data changes or imports.

