# V003-C008.1 Public Wiki Deep-Link Correction

## Eredmeny

`V003-C008.1`: **PASS**. A C008 router, detailtartalom, Back/reload es standalone mukodes valtozatlan maradt; csak a korabban osszemosott publikus Wiki- es API-link lett ket egyertelmu muvelet.

Stabil V003 release/tag es C009 nem keszult. A fagyasztott V002 tag es HTML valtozatlan.

## Resolverek es UI

- `resolvePublicWikiDeepLink()`: csak `https://star-citizen.wiki/` hostot fogad el. Exact forras-URL vagy az elo MediaWiki exact title/redirect audittal bizonyitott registry rekord hasznalhato; fuzzy/reszleges/nevbol kepzett URL nincs.
- `resolveWikiApiDeepLink()`: a Star Citizen Wiki API `web_url`, illetve API-altal igazolt slug alapjan oldja fel a kulon API-adatlapot.
- `Megnyitás a Star Citizen Wiki-ben`: csak `VERIFIED` publikus cikkhez jelenik meg.
- `API adatlap megnyitása`: kulon Advanced / forrasadat muvelet, csak `https://api.star-citizen.wiki` URL-lel.
- Mindket link uj lapon nyilik `noopener noreferrer` vedelmmel.

## Exact public Wiki audit

Az elo MediaWiki `action=query&redirects=1&titles=...` audit eredmenye:

- JS-300: `VERIFIED` -> `https://star-citizen.wiki/JS-300` (page ID 11992).
- Beryl: `VERIFIED` -> `https://star-citizen.wiki/Beryl` (page ID 12236).
- Stileron: `NO_PROVEN_PUBLIC_WIKI_URL`.
- Savrilium: `NO_PROVEN_PUBLIC_WIKI_URL`.

A hianyzo ket oldalhoz a normal UI nem jelenit meg public Wiki gombot; az exact API-adatlap tovabbra is elerheto.

## Snapshot es standalone

A hydrated/output snapshot public feloldasa megorzi:

- `targetUuid`;
- `canonicalName`;
- `publicWikiUrl`;
- `resolutionStatus`;
- `resolutionOrigin`;
- `verifiedAt`.

A standalone export kizarolag ezt a mar feloldott snapshotot rendereli. Public Wiki/MediaWiki/API runtime lookup nincs, kulso runtime dependency nincs. A blueprint/item, material, Radar, mining es refinery detail ugyanazt a kozos linkmodellt hasznalja.

## Automatizalt tesztek

- C008.1 exact public Wiki audit: PASS.
- C008.1 host/felirat/snapshot/no-guess celteszt: PASS.
- C001-C008: PASS.
- M1-M6.1 + C04: PASS.
- Standalone snapshot, linkparitas, runtime fetch 0, kulso runtime eroforras 0: PASS.
- V002 tag commit: `b326aaff5838aafd5b1f13b16982c29a0e150e35`.
- V002 HTML SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`.

## Valodi Chrome localhost

- Technical Probe: `15 PASS / 0 FAIL`.
- JS-300 public + API, Beryl public + API, Stileron/Savrilium API-only: PASS.
- Radar/mining/refinery ugyanazt a Beryl public/API modellt hasznalja: PASS.
- Main app detail reload es Back: PASS.
- Standalone detail reload es Back: PASS.
- User Data fingerprint: `d7be3ccc -> d7be3ccc`.
- Main app es standalone konzol WARN/ERROR: `0 / 0`.

## Lezaras

A ciklus itt megall felhasznaloi ellenorzesre. C009 es stabil V003 release/tag nincs elinditva vagy engedelyezve.
