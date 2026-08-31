# STATUS.md

## Jelenlegi állapot

- Branch: `develop/V003`
- Stabil fallback: `V002` – változatlan single-file release.
- Aktuális ciklus: `V003-C012.5C2`
- Státusz: `PASS`
- Következő: `V003-C012.5C3` – **NOT STARTED**.
- V003 tag/release/push/main merge: nincs.

## C012.5C2 eredmény

- Browser Final Card és Crafting List közös `renderRecipeSlotQualityPoolSelect()` UI.
- Opciók: legacy recipe fallback, `ANY_Q`, `MINIMUM_Q_POOL`, `MAXIMUM_Q_POOL`.
- Csak a pool mód persistálódik; Minimum/MAX felirat az aktuális material thresholdból épül.
- Új blueprint transient `finalCardDraftQualityPoolAssignments` state-et használ; kosárkor az assignment az új Cardra másolódik.
- Browser/Crafting szinkron kizárólag exact `cardId`; blueprint UUID szerinti automatikus Card-választás nincs.
- Per-slot, per-card, azonos blueprint és Duplicate függetlenség PASS.
- Allocation/Max/Combined/standalone logika változatlan; C3 nincs elindítva.

## Ellenőrzés

- C012.5C2/C1/B/A/C012.3 + static/single-file + V001/V002 integrity: PASS.
- Chrome localhost: draft→Card, same-card, reload PASS; 1366×768 és 390×844 overflow 0; mobil dropdown 89 px; WARN/ERROR 0.
- Teardown: csak az egy jóváhagyott ideiglenes JS-300 Card törölve; Card count 5, explicit teszt-assignment 0.
- Fingerprint: `3e2bcb00 → b965ee32 → f3ad8800`; utolsó változtatásmentes reload `f3ad8800 → f3ad8800`. A biteltérés a meglévő Card-save `updatedAt` frissítése, nem adatvesztés.

## Végső fejlesztési státusz

`V003-C012.5C2 – RECIPE POOL DROPDOWN UI PASS, C012.5C3 NOT STARTED`
