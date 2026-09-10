# STATUS.md

## Jelenlegi állapot

- Branch `develop/V004`; C004.3 input `db3d0a7...`; runtime `V004-dev`.
- A Crafting Card `quantity` mezője most explicit `CRAFT_RUN_COUNT`; nem késztermék-darabszám, és output-cardinalitást nem állít.
- Completion gate: `CRAFT_RUN_INPUTS_EXACT`. SCU csak akkor exact, ha a közvetlen `source * 10000` pozitív safe integer; ITEM csak pozitív safe integer. Kerekítés/epsilon/floor/ceil nincs.
- Exact production példa: Omnisky III Cannon, három exact input; partial 21 → 16, majd full completion PASS. Minden batchben exact 1 unit maradt; anyagveszteség 0 unit.
- Nonexact production példa: Steadfast, `0.07 SCU`; `CRAFT_RUN_INPUTS_UNPROVEN`, completion tiltva, inventory write 0.
- `OUTPUT_COUNT_UNPROVEN` megmarad diagnosztikai evidence-ként, de nem completion gate; output count = 1 állítás nincs.
- Régi Card `LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED`; a látható `21 craftként használom` megerősítés a számot nem módosítja, revisionöket szabályosan lépteti, reservationt stale-re teszi, majd explicit Reallocate kell.
- Full és partial completion kizárólag az aktuálisan látható reserved batch allocationt fogyasztja; stale esetben nulla írás, nincs fallback vagy completion-time reallocation.
- C004/C004.3 model + valódi Chrome + automatizált direct `file://`, reload, rollback, idempotencia, single-file és protected V003 kapu: PASS.
- Application SHA-256 `1cc18a53ea41e27ae05f69e8195c4120cd5cc4e401446c62c8c2ee3742bcc0eb`; runtime fájl 1, sidecar 0; full regression nem futott; C005 NOT STARTED; push NO.
- Riport: `docs/V004_C004_3_CRAFT_RUN_QUANTITY_SEMANTICS_REPORT.md`.

`V004-C004.3 – CRAFT RUN SEMANTICS PASS, LIVE EXACT-INPUT CRAFT COMPLETE ENABLED`
