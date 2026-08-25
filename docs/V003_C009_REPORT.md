# V003-C009 Final Main View report

- Cycle: `V003-C009`
- Branch: `develop/V003`
- Status: `AUTOMATED PASS + CHROME LOCALHOST PASS; USER VISUAL ACCEPTANCE PENDING`
- Stable baseline: `V002` unchanged

## Scope

The normal default view now follows the two supplied reference images at information-hierarchy level: the Blueprint Browser is on the left and the active compact Crafting Card is on the right. Other application modules remain available through the existing navigation and are not rendered as a long default dashboard.

Tracked references:

- `Info/A fö nézet.png`
- `Info/A Crafting card.png`

The C001-C008.1 ranking, allocation, cache, router, Back/reload and detail data models remain in use. No V003 release or tag was created, and C010 was not started.

## Exact source links

Normal and standalone user UI no longer renders a public Wiki action. The historical `resolvePublicWikiDeepLink()` audit model remains internal only. Exact API source links are resolved by:

- item: `resolveItemApiDeepLink()`
- material: `resolveMaterialApiDeepLink()`
- shared API normalizer: `resolveWikiApiDeepLink()`

Verified live source-record URLs for SC dataset `4.9.0-LIVE.12232306`:

- JS-300: `https://api.star-citizen.wiki/items/js-300?version=4.9.0-LIVE.12232306`
- Stileron: `https://api.star-citizen.wiki/commodities/stileron-ore?version=4.9.0-LIVE.12232306`
- Beryl: `https://api.star-citizen.wiki/commodities/beryl-raw?version=4.9.0-LIVE.12232306`
- Savrilium: `https://api.star-citizen.wiki/commodities/savrilium-ore?version=4.9.0-LIVE.12232306`

No name-derived or fuzzy API URL is accepted. Links use exact source `web_url`, or an API-provided slug explicitly marked as API-verified for compatible old normalized caches.

## Card projection

- Header facts: `S1`, `Military`, `Power Plant`, grade `A`.
- Crafting time: `15:00`.
- Cart action: the existing deterministic Crafting Card duplication model.
- Quantity: editable through the existing updater and Allocation Engine.
- Slot rows: Recipe Slot, exact material source link, per-one amount and suitable inventory.
- Intelligence: top mining recommendation per system, top refinery result per system and Radar chips from the VERIFIED curated registry only.
- Details: the existing C008 internal detail controller remains the only detail/navigation model.

Verified JS-300 Radar values:

- Stileron: `3185`, `6370`
- Beryl: `3540`, `7080`, `10620`, `14160`
- Savrilium: `3200`, `6400`

## Verification

- Targeted C009 tests and live exact API audit: PASS.
- Full C001-C008.1 + M1-M6.1 + C04 regression: PASS.
- Standalone export: PASS; embedded CSS/JS, valid snapshot, no runtime fetch, no external runtime dependency, exact API actions and no public Wiki action.
- Real Chrome localhost Technical Probe: `15 PASS / 0 FAIL`.
- Chrome main/detail browser Back and reload: PASS.
- Responsive Chrome check at 390 px: single column, Blueprint Browser before Crafting Card, no horizontal page overflow.
- Chrome application console warning/error: `0`.
- User Data fingerprint: `d7be3ccc -> d7be3ccc`.
- Frozen V002 tag commit and release HTML SHA-256: unchanged.

The earlier real Chrome `file://` technical baseline remains recorded as `USER MANUAL PASS_NOT_CODEX_AUTOMATION`: it was reported by the user and was not run by Codex automation.

## Artifacts

- `test-artifacts/V003-C009/chrome-main-view.png`
- `test-artifacts/V003-C009/exact-api-link-audit.json`
- `test-artifacts/V003-C009/standalone-js-300-final-card.html`
- `test-artifacts/V003-C009/summary.md`

Rollback: revert the C009 commit. The frozen fallback remains the unchanged `V002` tag and release artifact.
