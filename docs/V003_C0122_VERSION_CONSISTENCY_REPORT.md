# V003-C012.2 Active SC Version Consistency Report

## Eredmeny

`V003-C012.2` PASS a `develop/V003` agon. A stabil `V002` tag es artifact valtozatlan, stabil V003 release/tag nem keszult, C013 nem indult el.

Aktiv fixture-verzio: `4.10.0-LIVE.12519617`.

## Hiba oka

Ket, egymast erosito hiba volt:

1. A raw es normalized IndexedDB cache key mar korabban is tartalmazta az SC-verziot, de a material-intelligence projekcio a teljes `miningNormalizedCache` es `blueprintNormalizedCache` tartalmat olvasta, majd UUID/slot alapjan epitett mapet. Ezert a megorzott 4.9 cache-bol tenyleges normalized commodity/mining rekord szivaroghatott a 4.10 aktiv snapshotba. Nem csak a provenance felirat volt stale.
2. Az exact API `web_url` bizonyitekot a resolver valtozatlanul adta vissza. A helyes slug/path mellett igy a regi `version=4.9.0-LIVE.12232306` query megmaradhatott. Egyes call site-ok az aktiv dataset helyett a perzisztalt kartya regi `gameVersion` erteket is elore soroltak.

## Javitas

- `resolveActiveScVersion()` az aktiv blueprint datasetet tekinti a jelenlegi SC-verzio kanonikus forrasanak.
- `buildVersionScopedRecordProjection()` es `c0122SelectExactVersion()` csak az aktiv verziohoz tartozo normalized blueprint/output/mining rekordot engedi az aktualis snapshotba.
- A hydration key most `SC-verzio + UUID`; igy ket verzio azonos commodity UUID-ja nem utkozik.
- A regi cache megmarad, de aktiv snapshotba nem projektalhato. Cross-version dataset explicit `CROSS_VERSION_DATASET_BLOCKED` allapotot kap.
- `resolveWikiApiDeepLink()` megorzi az exact forras host/path/slug bizonyitekat, de a `version` parametert az aktiv SC-verziora illeszti. Nevbol kepzett vagy fuzzy URL tovabbra sincs.
- A main Blueprint Browser, Crafting List, C008 detail, reload, standalone export es dataset-refresh ugyanazt az aktivverzio-resolvert hasznalja.
- A material es mining source `gameVersion`, a snapshot `scVersion`, a detail verzio es az API deep-link `version=` azonos aktiv verziohoz kotott.

## Ketverzios izolacios fixture

A celteszt ugyanazzal az item/commodity UUID-val letrehoz `VERSION_A` es `VERSION_B` rekordot, eltero bizonyithato mezokkel, majd `VERSION_B`-t aktivalja.

PASS assertionok:

- item API link: VERSION_B;
- material API link: VERSION_B;
- material source: VERSION_B;
- mining source: VERSION_B;
- snapshot `scVersion`: VERSION_B;
- VERSION_A cache megmarad;
- VERSION_A adat nem szivarog a VERSION_B snapshotba;
- explicit cross-version adat nem jelenik meg aktualis adatkent.

## Aktualis bizonyitek

- JS-300 API: `https://api.star-citizen.wiki/items/js-300?version=4.10.0-LIVE.12519617`
- Stileron API: `https://api.star-citizen.wiki/commodities/stileron-ore?version=4.10.0-LIVE.12519617`
- Beryl material/mining source: `4.10.0-LIVE.12519617`
- Stileron material/mining source: `4.10.0-LIVE.12519617`
- Savrilium material/mining source: `4.10.0-LIVE.12519617`
- Standalone: snapshot, item/material linkek es material/mining source provenance mind 4.10; embedded CSS, ervenyes snapshot JSON, kulso runtime fetch/resource 0.

## Ellenorzes

- `tools/validate-v003-c0122.ps1`: teljes C001-C012.1 + M1-M6.1 + C04 + C012.2 + V002-integritas PASS.
- `tools/run-v003-c0122-tests.mjs`: two-version isolation es standalone PASS.
- Valodi Chrome localhost: Technical Probe `15 PASS / 0 FAIL`; main, Crafting List, C008 detail, refresh, reload es standalone 4.10-konzisztens.
- Chrome alkalmazas/standalone console WARN/ERROR: 0.
- User Data fingerprint: `36b67809 -> 36b67809`.
- Felhasznaloi bizonyitek: `USER MANUAL FILE:// PASS`; a felhasznalo futtatta, nem Codex automation. A technikai baseline minden sora PASS volt, a standalone export letrejott es megnyithato.
- V002 tag commit: `b326aaff5838aafd5b1f13b16982c29a0e150e35`.
- V002 HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`.

## Visszaallas

A C012.2 commit revertelheto. Stabil fallback a valtozatlan `V002` tag es `releases/V002/sPg Crafting List.html`.
