# V003-C013.2 Fresh Release Candidate Report

## Scope

- Cycle: `V003-C013.2`
- Source branch: `develop/V003`
- Exact source commit: `9a07de34643fed477399b070462aeb2be3d4f11a`
- Application-code change in this cycle: **NO**
- The earlier C013 candidate remains unchanged and blocked (`d4ce0fb9caea5e2f77597ce76ae05321d8d8a5c3721dfb91ebf431a7ebeef182`). It was not reused or patched.

## Candidate

- Path: `test-artifacts/V003-C013.2/fresh-release-candidate/sPg Crafting List V003 RC.html`
- Build model: exact Git-commit raw-byte copy
- Size: `806499` bytes
- SHA-256 before validation: `cdbac1a7977845061494aa148e6603db2597270bcbcf49c587009bd6b3a0ca31`
- SHA-256 after automated and Chrome validation: `cdbac1a7977845061494aa148e6603db2597270bcbcf49c587009bd6b3a0ca31`
- Single-file runtime: **PASS**; embedded CSS and JavaScript, local runtime sidecars: `0`

## Automated gate

`tools/validate-v003-c0132-fresh.ps1`: **PASS**.

- C001-C012.2 + M1-M6.1 + C04: PASS
- C012.3 Quality semantics: PASS
- C012.4 numeric lifecycle: PASS
- C012.5A-C012.5C3B2: PASS
- C012.5D1 candidate-scoped integration: PASS
- C013.1 strict Quality allocation and mixed-shortage repair: PASS
- backup/restore, static and single-file integrity: PASS

The mandatory `FR86_MIXED_AMOUNT_AND_QUALITY_SHORTAGE` candidate fixture passed:

- Field Array: reserved `6 SCU`, amount shortage `9.3 SCU`, Quality shortage `17 SCU`
- Shell: reserved `17 SCU`, amount shortage `3.4 SCU`, Quality shortage `0 SCU`
- Global: inventory/reserved `23 SCU`, total shortage `29.7 SCU`, double reserve `0`
- Reverse recipe rows and Card priority: PASS
- Final Card, Crafting List, Combined Materials, Maximum Craftable and standalone parity: PASS

The generated mixed-shortage standalone artifact is read-only, has no IndexedDB write surface, performs no allocation recomputation and has no external runtime dependency.

## Real Chrome localhost gate

Real Google Chrome was run against the exact hash-locked candidate at isolated origin `http://127.0.0.1:41990`.

- Technical Baseline: `15/15 PASS`
- All eight modules: PASS
- Viewports: `1920x1080`, `1366x768`, `390x844`
- Horizontal overflow: `0` at every tested module and viewport
- Console warnings/errors: `0/0`
- Active SC version: `4.10.0-LIVE.12519617`
- Wiki API, UEX API, IndexedDB schema 4 and reload persistence: PASS

This was Chrome localhost automation. It is not evidence for the exact manual candidate `file://` gate.

## Frozen release integrity and status

- V001 commit: `b22dbc3c2ef0765e30aa3806537854298c873dff`
- V002 commit: `b326aaff5838aafd5b1f13b16982c29a0e150e35`
- V002 artifact SHA-256: `de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357`
- V001/V002 integrity: **PASS**
- Exact manual candidate `file://` gate: **NOT RUN**
- Stable V003 release/tag/push/main merge: **NONE**

`V003-C013.2 – FRESH RC AFTER QUALITY REPAIR AUTOMATED + CHROME GATES PASS, EXACT MANUAL CANDIDATE file:// GATE NOT RUN`
