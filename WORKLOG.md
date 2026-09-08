# WORKLOG.md

Current cycle/session notes only. Previous raw log archived losslessly at `logs/archive/20260908-124105-960190-WORKLOG.md`.

## Aktuális ciklus

### V003 Stable Release – 2026-09-08

- Pre-release: `develop/V003 @ b10462d27e67ac0f6b6aae1e7ec9a2eaa3c2983b`, clean; V003 tag és stable mappa nem létezett.
- Az accepted C013.8 RC `835832` byte és SHA-256 `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469` invariánsa PASS.
- Stable HTML exact raw-byte copy; embedded CSS/JS, local runtime sidecar `0`, localhost/test-artifact runtime dependency `0`.
- Az accepted RC és stable HTML `-text` Git attribútuma védi az exact bytesorozatot a line-ending normalizálástól.
- C013.8 automated + Chrome localhost és C013.9 manual M1–M12 PASS újrafuttatás nélkül érvényes a változatlan bytesorozatra.
- Application code/RC change `NO`; V001/V002 változatlan; release docs/checksum/meta frissült.
- Helyi `V003-STABLE-RELEASE` commit és annotált `V003` tag; push/main merge `NO`.
- Visszaállás: a release commit revertje a `b10462d...` checkpoint fölött; V001/V002 továbbra is külön fagyasztott fallback.
