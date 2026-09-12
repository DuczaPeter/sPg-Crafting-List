# STATUS.md

## Jelenlegi állapot

- `LOCAL V004 STABLE PREPARED – REMOTE PUBLICATION PENDING`.
- Validation HEAD: `872699271937e53d48c1d5f9095f6e58bca2ac3c`; application source: `a6a5d35592d9777c6b740eeb7ec44c4c58b27443`.
- Stable: `releases/V004/sPg Crafting List.html`, a C010 candidate raw-byte másolata; runtime `V004`, `1083886` byte, SHA-256 `16f186cc7a0ec3d614dbdd690c1ac448261713ff4fd6c32bdfa8876b68641af5`.
- Teljes gate: 4 preflight + 55/55 release leaf PASS; Chrome, responsive, automated file:// PASS. Evidence: `test-artifacts/V004-C010.3/`; nem futott újra.
- Manual direct file://: `PASS_USER_VERIFIED`; megerősítés 2026-09-12, `USER_CONFIRMATION_DATE`; részletek: `VERSION.json.manualFileGate`.
- V001 local tag/bundle protected, remote történelmileg absent; V001-et nem publikáljuk. V002/V003 változatlan.
- A forrás checkout és régi untracked evidence megmarad. Publikálás elkülönített worktree-ben, fast-forward main és explicit V004 tag push útján.
- Következő: S stable commit/tag, main/tag push, draft és published asset letöltéses byte-ellenőrzése, külön P publication-evidence commit. Riport: `releases/V004/RELEASE.md`.
