# WORKLOG.md

Current cycle/session notes only. Previous raw log archived losslessly at `logs/archive/20260908-130300-572448-WORKLOG.md`.

## 2026-09-09 — V003 Replacement Stable Release

- Baseline: `develop/V003 @ 8194b7f2472bddd26c11e7fa3791cc2555244d14`, clean; remote/published V003 tag és release nem létezett.
- Az accepted C015 RC raw-byte másolata lett a stable artifact: `835820` byte, SHA-256 `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`.
- Runtime identity `V003`, `V003-dev` occurrence `0`; single-file, embedded CSS/JS, local runtime sidecar `0`.
- C015 automated + Chrome localhost és C016 user manual direct `file://` PASS evidence a változatlan byteokra újrafelhasználva; kapu nem futott újra.
- Application code nem változott; V001/V002 változatlan.
- A pre-publication invalidált `045bd8c...` commit és `bb35a1a...` artifact evidence Git historyban megőrzött; final release directory az accepted replacement artifactot tartalmazza.
- Remote push és main merge nincs; a local V003 tag csak a tiszta release commit utáni végső auditban cserélhető.
- Visszaállás: a replacement release commit normál revertje; a történeti invalidált commit külön megmarad.

## 2026-09-09 — V003-C016 Exact Manual file:// Gate Evidence Closure

- Baseline: `develop/V003 @ ea8a39ca972e53fbd778599090d69836544d2692`, clean.
- Exact C015 RC változatlan: `835820` byte, SHA-256 `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`; a fő HTML-lel byte-azonos.
- Felhasználói direct `file://` M1–M7: PASS; UI/footer, backup és diagnosztika identity `V003`, Technical Probe `15/15`, Titanium canonical picker/reload és standalone PASS.
- Az automated és Chrome localhost PASS evidence a byte-változatlan C015 candidate-ről újrafuttatás nélkül érvényes.
- Application code és RC nem változott; V001/V002, a régi invalidált V003 tag és `releases/V003/` változatlan.
- Replacement V003 release gate complete; stable leváltás, tagmozgatás, push és main merge nem történt.
- Következő lépés: a régi invalidált helyi V003 release külön, explicit release-cycle-ben váltható le.
- Visszaállás: a C016 checkpoint normál revertje; application/RC/release artifact nem érintett.

## 2026-09-08 — V003-C015 Fresh Release Candidate

- Baseline: `develop/V003 @ 37f8852b4ddfd5b628d952a445f97ee5a5179a11`, clean; a régi helyi `V003` tag továbbra is `045bd8c...`, push/main merge nincs.
- Exact Git-commit raw-byte candidate készült: `835820` byte, SHA-256 `87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8`; runtime identity `V003`, sidecar `0`.
- Teljes releváns C001–C012.5 + D1 + C013.1/.3/.5/.7 + C014 + M1–M6.1 + C04 regression PASS; V001/V002 és régi V003 release/tag változatlan.
- Valódi Chrome localhost: 15/15 Technical Probe, 8/8 modul, 1920/1366/390 overflow `0`, aktív 4.10, Wiki/UEX/IndexedDB/reload és console `0/0` PASS.
- Legacy Titanium melletti canonical picker egy opcióval `64978449-...`; reload PASS, destructive migration nincs.
- Diszjunkt Titanium pool: Q500–Q799 `1,744 SCU`, Q800+ `3,124 SCU`; Combined foglalás `2,744 SCU`, hiány `0,256 SCU`, borrowing/double reserve nincs.
- Backup `applicationVersion=V003`; tényleges standalone export embedded CSS/JS, local/localhost/test-artifact runtime ref `0`, `V003-dev` occurrence `0`.
- Application code nem változott; exact manual candidate `file://` gate `NOT RUN`; stabil helyettesítő release/tag nincs.
- Következő lépés: az exact C015 RC felhasználói manuális `file://` kapuja külön ciklusban.
- Visszaállás: a C015 checkpoint normál revertje; a C014 forrás és a régi invalidált release evidence változatlan.

## 2026-09-08 — V003-C014 Stable Version Identity Repair

- Baseline: `develop/V003 @ 045bd8ce38dde5e2ef43999a038c4d835d644b9a`, clean; local `V003` tag ugyanide mutatott, push/main merge nem történt.
- Root cause: a byte-pontos C013.8 candidate promóciója a három embedded `V003-dev` runtime identity értéket is változatlanul vitte a helyi release-be.
- Módosítás: csak a fő HTML `applicationStatus`, `footerRuntime` és `APP.version` értéke lett `V003`; business logic és schema nem változott.
- Célzott statikus validator: PASS; `V003-dev` runtime occurrence `0`, single-file sidecar `0`, V001/V002 és régi V003 artifact/tag változatlan.
- Valódi Chrome localhost: Technical Probe `15/15 PASS`, UI `V003 · schema 6`, footer `V003 · cache schema 4`, IndexedDB startup/reload, backup `applicationVersion=V003`, diagnosztika `application.version=V003`, standalone PASS, konzol `0/0`.
- A teljes történeti release regression scope szerint nem futott; új RC nem készült.
- A régi helyi V003 release/tag státusza: `PRE-PUBLICATION INVALIDATED BY V003 VERSION IDENTITY BLOCKER`; tag nem mozdult és release artifact nem változott.
- Következő lépés: külön fresh-RC ciklus, majd új release-döntés.
- Visszaállás: a C014 checkpoint commit normál revertje; a régi invalidált tag/artifact evidence változatlanul megmarad.
