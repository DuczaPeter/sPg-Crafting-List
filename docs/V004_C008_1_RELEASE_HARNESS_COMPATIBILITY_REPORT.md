# V004-C008.1 Release Harness Compatibility Report

## Állapot

`V004-C008 – RELEASE CANDIDATE BLOCKED`

Az M1 exact-quantity harness repair célzottan sikeres, de az egyszer, elölről újraindított teljes C008 gate az `m4-combined-backup` leafnél egy új harness dependency hiány miatt megállt. További javítás és újrafuttatás nem történt.

## Frozen candidate

- Source commit: `c4fef88d5d0a910437b814aa2bd9f90b9375c877`
- Artifact: `test-artifacts/V004-C008/fresh-release-candidate/sPg Crafting List V004 RC.html`
- SHA-256 előtte és utána: `7ac2c27bc7a35f719f4a4526e6839f8460a51e2ab6d881e1a95c3ed16f58b050`
- Méret előtte és utána: `1083258` byte
- Runtime identity: `V004`
- Candidate-regenerálás és application módosítás: `NO`

## C008.1 root cause és repair

Az örökölt M1 VM-harness csak az `M1_PURE_MODEL` blokkot töltötte be, miközben a `normalizeBlueprint()` már a későbbi production `v004BuildExactRequirementQuantityEvidence()` helperre támaszkodott. Ez harness dependency gap volt, nem bizonyított runtime application hiba.

A shared loader nyers byte-ként egyszer olvassa a megadott application fájlt, ellenőrzi az explicit méretet és SHA-256-ot, majd strict UTF-8 dekódolást végez. Release módban checkout fallback nincs. Az M1 és minden további production blokk ugyanabból a verified candidate HTML stringből származik.

Explicit dependency closure:

- `V004_REQUIREMENT_QUANTITY_EXACTNESS`
- `V004_QUANTITY_NORMALIZATION_STATUS`
- `V004_SCU_NORMALIZATION_RULE`
- `V004_ITEM_NORMALIZATION_RULE`
- `v004FixedScuTextFromUnitBigInt`
- `v004ParsePositiveDecimalToFourDpUnits`
- `v004BuildExactRequirementQuantityEvidence`

A source extraction unique anchorral, helyes sorrenddel és C003 markerhatárral fail-closed. Az M1 direct versioned allowlist explicit; comment és string literal nem dependency. Production helper másolata és teljes C003 betöltés nincs.

## Affected runner audit és célteszt

- Érintett release leaf: `10`
- Unresolved affected harness: `0`
- Checkout-HTML release fallback: `0`
- Shared loader és tíz runner syntax: `PASS`
- `m1-model-cache` targeted: `PASS`
- `m2-inventory-allocation` targeted: `PASS`
- Full ten-leaf pre-run: `NOT REQUIRED / NOT RUN`
- Tooling-only repair commit: `ab6b081` (`V004-C008.1-RELEASE-HARNESS-COMPATIBILITY`)
- Application diff a frozen source commit óta: `0`

## Teljes C008 rerun

Az integrated validator a repair commit után egyszer, az elejétől indult újra. Candidate build/regenerálás nem futott.

PASS a blokkolás előtt:

- identity/dataset/adapter freeze
- harness dependency/wiring audit
- isolated candidate clone
- baseline static
- M1
- M2
- M3

Új blocker:

`m4-combined-backup`: `ReferenceError: v004NormalizeImportedCards is not defined`

Az M4 `validateM4UserData()` útja egy C003 production helperre támaszkodik, amelyet az örökölt M4 VM-harness nem tölt be. A prompt szerint ez új tooling/harness blocker; nem történt automatikus további repair vagy gate-resume.

## Release állapot

- Full integration regression: `BLOCKED_AT_M4`
- Chrome candidate gate: `NOT RUN`
- Automated direct `file://`: `NOT RUN`
- Manual exact candidate `file://`: `NOT REACHED / REQUIRED AFTER AUTOMATED PASS`
- Stable artifact: `NOT CREATED`
- V004 tag: `NOT CREATED`
- Main/remote push: `NO`
