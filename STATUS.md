# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`; release-forrás checkpoint: `b10462d27e67ac0f6b6aae1e7ec9a2eaa3c2983b`.
- Aktuális ciklus: `V003 STABLE RELEASE`; a változatlan C013.8 candidate helyi stable kiadássá emelve.
- Artifact: `releases/V003/sPg Crafting List.html`; `835832` byte; SHA-256 `bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469`; RC-vel byte-azonos.
- Automated release gate, Chrome localhost és exact manual `file://` M1–M12: **PASS**; változatlan artifact miatt nem futottak újra.
- Single-file gate: **PASS**; embedded CSS/JS, egy runtime HTML, local sidecar `0`.
- Application code és elfogadott RC change: `NO`; V001/V002 változatlan.
- Helyi annotált tag: `V003`; remote push/main merge: `NO`.
- Riport: `docs/V003_RELEASE_REPORT.md`; rollback: a release commit revertje a `b10462d...` checkpoint fölött.

`V003 STABLE RELEASE – SINGLE-FILE RELEASE GATE PASS`
