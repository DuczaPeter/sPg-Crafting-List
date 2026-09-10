# V004-C007 Multi-Tab Coherence Report

## Baseline és scope

- Input checkpoint: `da8515accbc8e60f22a76d32be2427a314cef77f`.
- Input application SHA-256: `ecbb85cee6fc0ae92c0b2338e392806f7fac72befb430e2bbb40f3ab717f71b5`.
- Final application SHA-256: `9cf79521aa9d1e46ed2494cdbbed80723f6cb52c2937497f264bc146ed20d365`.
- Branch/runtime: `develop/V004`, `V004-dev`.
- C007 scope: több megnyitott fül UI-koherenciája, miközben a durable authority változatlanul IndexedDB. Stable release, schema bump, push és teljes regresszió nincs a scope-ban.

## Architektúra

Az `spg-crafting-list-v004` BroadcastChannel kis, verziózott UI-signal üzeneteket közvetít. A payload csak sender/session adatot, monoton sequence-et, mutation típust, négy durable revisiont és korlátozott érintett ID-listát tartalmaz. Inventory-, Card-, allocation- vagy History-rekordot nem tartalmaz és nem alkalmaz állapotként.

A receiver validál, self/duplicate/out-of-order üzenetet elvet, rövid időablakban összevon, majd a durable állapotot IndexedDB-ből olvassa újra. Normál signal csak monoton újabb durable revisionnél frissít. A backup import és migráció külön jelzést használ, mert exact restore esetén a revision egyenlő vagy alacsonyabb is lehet.

Minden cross-tab durable frissítés elavulttá teszi a reservationt, lezárja a korábbi Complete/Undo előkészítést, újrarendereli az érintett UI-t és explicit Reallocate műveletet kér. Automatikus reallocation nincs.

## Kétfüles Craft Complete és Undo

- Az egyik fül Complete commitja után a másik fül Card-, Inventory- és History-nézete durable újraolvasással frissült.
- A másik fül korábbi reservationje `STALE`; csendes reallocation vagy másik batchből fogyasztás nem történt.
- Undo után a másik fül az `UNDONE` History státuszt és az exact visszaállított inventoryt mutatta.
- Második Undo `ALREADY_UNDONE`; dupla restore 0 unit.

## Konkurencia és üzenetvesztés

- Két egyidejű Complete kísérletből pontosan egy `COMMITTED`, a másik `STALE_RESERVATION`; dupla fogyasztás és duplikált History event nincs.
- Két egyidejű Undo kísérletből pontosan egy `RESTORED`, a másik `ALREADY_UNDONE`; dupla visszaállítás nincs.
- Tesztben blokkolt channel delivery mellett a régi runtime állapottal indított Complete a commit előtti durable újraolvasáson blokkolt.
- BroadcastChannel hiányakor az alkalmazás működőképes maradt, diagnosztikát adott, és ugyanaz a stale guard megakadályozta a második fogyasztást.
- Inventory conservation: `before = consumed + after`; Craft/Undo material loss 0 unit.

## További cross-tab mutationök

Material add/edit/delete és Card add/delete/reorder/quantity/slot Quality/global Quality pool módosítás után a másik fül durable állapotból frissült és stale reservationt jelzett. Presentation-only History tab/expand művelet durable write és broadcast nélkül maradt.

Schema-3 backup import dedikált `BACKUP_IMPORTED` jelzéssel exact 0 revision állapotot is frissített. A V003 migráció `MIGRATION_COMPLETED` jelzést használt; a source hozzáférés read-only és a forrás változatlan maradt.

## Protokoll és életciklus

- Malformed, unsupported-version, self, duplicate és out-of-order üzenet: ignorálva.
- Reload után új tab ID és pontosan egy listener.
- Ismételt channel-open nem regisztrál második listenert.
- Sender oldalon nincs saját refresh-loop.
- Bounded session diagnosztika nem része a User Data backupnak.

## Célzott kapuk

- Baseline static: PASS.
- C004.4 deterministic normalization modell/Chrome regresszió: PASS.
- C005 History modell/Chrome regresszió: PASS.
- C006 Undo modell/Chrome regresszió: PASS.
- C006.1 backup round-trip modell/Chrome regresszió: PASS.
- C007 multi-tab modell és Google Chrome: PASS.
- Automated direct `file://` kétfüles signal: PASS; protocol `file:`; overflow 0.
- Runtime fájl: 1; helyi runtime sidecar: 0.
- Console/page error: 0.
- `git diff --check`: PASS.
- Teljes regresszió: `NOT_RUN_BY_SCOPE`.

Evidence:

- `test-artifacts/V004-C007/model-evidence.json`
- `test-artifacts/V004-C007/browser-evidence.json`
- `test-artifacts/V004-C007/validation.log`
- `test-artifacts/V004-C007/target-summary.json`

## Kötelező végállapot

- `V004-C007 – MULTI-TAB COHERENCE PASS`
- BroadcastChannel = UI SIGNAL ONLY
- IndexedDB = DURABLE AUTHORITY
- Two-tab Craft Complete = PASS
- Two-tab Undo = PASS
- Concurrent Complete = SINGLE COMMIT PASS
- Concurrent Undo = SINGLE RESTORE PASS
- Message-loss correctness = PASS
- Stale reservation protection = PASS
- Backup import cross-tab refresh = PASS
- Automatic Reallocate = NO
- BroadcastChannel unavailable fallback = PASS
- Craft/Undo material loss = 0 unit
- runtime files = 1
- sidecars = 0
- push = NO

## Protected baseline és rollback

- Annotated `V003` tag target: `ebc83281769fd212d988ee55957b1c2754256490`.
- V003 artifact: `835820` byte; SHA-256 `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`.
- V001/V002/V003 release path változatlan.

A C007 helyi checkpoint normál `git revert` műveletével állítható vissza. A V003 taget vagy artifactot nem kell és nem szabad módosítani.
