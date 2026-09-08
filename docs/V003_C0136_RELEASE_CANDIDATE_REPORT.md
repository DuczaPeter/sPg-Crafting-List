# V003-C013.6 Fresh Release Candidate Report

## Outcome

`V003-C013.6 – FRESH RC AFTER CANONICAL PICKER DEDUP REPAIR AUTOMATED + CHROME GATES PASS, EXACT MANUAL CANDIDATE file:// GATE NOT RUN`

- Branch: `develop/V003`
- Exact source HEAD: `e4bc51672c072a8c8ecb4c5cc0db8ed622cde057`
- Candidate: `test-artifacts/V003-C013.6/fresh-release-candidate/sPg Crafting List V003 RC.html`
- Size: `832924` bytes
- SHA-256 before and after Chrome: `4489a48ff50e6652b89684dce522e35203557e33753d73b1c98aa5588193a7ed`
- Build model: deterministic Git-commit raw-byte copy; the candidate is byte-identical to the source HTML at the locked HEAD.
- Application-code change in C013.6: **NO**.
- Release status: candidate only; no V003 tag, stable release, push or main merge.

## Single-file gate

PASS: one HTML file contains the CSS and JavaScript, needs no local runtime sidecar, and remains compatible with direct `file://` use. Internet is only needed for explicit live Wiki/UEX refreshes. The exported Crafting Card remains self-contained and read-only: no editor controls, IndexedDB write surface or allocation recomputation.

## Automated release regression

PASS: the current release validator completed the relevant C001–C012.5, D1, C013.1, C013.3 and C013.5 chain, M1–M6.1, C04, static HTML/JavaScript and frozen V001/V002 checks. The first run exposed only a stale C003 harness assertion after the C013.5 catalog refactor; the assertion was aligned to the same exact canonical catalog used by the application. No application code changed.

Critical C013.3/C013.5 results:

- Titanium relation `07570c9f-fdf6-4bca-a56b-c42809ec0e01` → `64978449-1d87-4a16-ba55-4b5f94fee217`: PASS.
- Q784 `1.744 SCU` is eligible only for Minimum Q500; Q866 `3.124 SCU` only for MAX Q800; total physical `4.868 SCU`; one logical material, two batches, no borrowing or double reserve; provenance retained.
- Q866-only, Minimum-only, MAX-only, invalid range, same-card/reverse-row/two-card priority, Combined/Final/Crafting/Maximum/standalone parity: PASS.
- C013.1 mixed amount + Quality shortage fixture: PASS.
- Feynmaline and Titanium each resolve to one canonical picker option; canonical save, reload, backup and Combined projection: PASS.
- Fuzzy or name-only identity merge: absent and prohibited.

Active `4.10.0-LIVE.12519617` audit: `128` user-facing names, `126` visible picker options, `24` proven multi-UUID canonical identities and `2` unresolved duplicate names. The 24 proven identities are Amioshi Plague, Aphorite, Bluemoon Fungus, Carinite, Copper, Dolivine, Feynmaline, Glacosite, Gold, Golden Medmon, Hadanite, Heart of the Woods, Iron, Jaclium, Janalite, Lindinium, Pitambu, Prota, Ranta Dung, Riccite, Sadaryx, Saldynium, Silicon and Tungsten.

Unresolved identities remain hidden from the picker and preserved in diagnostics without a guessed merge:

- Leyland's Tortoise: `0e19caaa-44b9-4708-a86e-e4301ecdd0f8`, `a0a4e1f8-8c68-486f-b828-5b241d02337a`
- Yormandi Tongue: `2845e7ee-2f52-471b-a0a7-05ca11908fe6`, `6d8c8c22-12ce-4433-af1e-5c38f54ced1b`

## Real Chrome localhost gate

The exact hash-locked candidate was exercised in Google Chrome through the visible browser-control surface at `http://127.0.0.1:41996`.

- Technical Baseline: `15/15 PASS`
- Modules: `8/8 PASS`
- Viewports: `1920×1080`, `1366×768`, `390×844`
- Horizontal overflow: `0`
- Browser console WARN/ERROR: `0/0`
- Active SC version: `4.10.0-LIVE.12519617`
- Wiki API, UEX API and IndexedDB: PASS
- Feynmaline/Titanium canonical picker dedup, canonical UUID autofill/save and reload persistence: PASS
- Candidate hash after the browser run: unchanged

This is Chrome localhost evidence, not the exact manual candidate `file://` gate.

## Integrity and remaining gate

- Blocked/invalidated C013.4 candidate: unchanged and not reusable.
- V001/V002 integrity: PASS; V002 artifact SHA-256 remains `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`.
- Exact manual C013.6 candidate `file://` gate: **NOT RUN**.
- Stable V003 release/tag: **NOT CREATED**.

Restore point: revert the `V003-C013.6-FRESH-RELEASE-CANDIDATE` checkpoint commit. The frozen V002 remains the stable fallback.
