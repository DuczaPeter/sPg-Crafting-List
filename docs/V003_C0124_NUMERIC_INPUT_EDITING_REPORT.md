# V003-C012.4 – Numeric Input Editing Lifecycle Repair

## Scope

This repair cycle fixes every existing numeric input without changing the C012.3 Quality Constraint business rules, allocation, ranking, hydration, standalone model, or the frozen V002 release.

## Root cause

The Craft quantity and Combined Target Q paths treated every `input` event as a committed number. Empty draft text was normalized immediately, application state changed during typing, and debounced full renders replaced the focused DOM input. This could restore `1`, lose the selection/caret, reorder digits, and make multi-digit replacement unreliable. The Mining station override had the same immediate-apply/rerender pattern.

## Shared solution

- `bindCommittedNumericEditor()` owns draft text, first-focus selection, native caret editing, and the Enter/change/blur commit lifecycle.
- `normalizeCommittedNumericDraft()` applies the existing per-field rules only when a draft is committed.
- `bindQualityTargetEditor()` applies the existing integer `0..1000` Target Q rule.
- Draft input is DOM-local: it does not write User Data and does not trigger a full render.
- First pointer or keyboard focus selects the current compact value. A later click while the input is already focused keeps native caret placement.
- Quantity keeps its former commit behavior: integer rounding, minimum `1`, clamp to `1`, and empty commit normalized to `1`.
- Target Q keeps its former valid range. Invalid or empty commit restores the previous committed value and reports validation feedback.
- Mining station override accepts an empty committed value as the existing automatic/default mode.
- My Materials quantity and Quality retain the existing form-submit parser and business validation; the shared helper only supplies the editing lifecycle.

## Audited numeric inputs

1. Blueprint Browser Final Card quantity.
2. Crafting List expanded card quantity.
3. Combined Materials Target Q.
4. Crafting requirement Target Q.
5. My Materials batch quantity.
6. My Materials batch Quality.
7. Mining Loadout station count override.

No additional numeric User Data editor exists in the current HTML.

## Decimal/unit audit

The cycle does not introduce a new locale parser. Dot decimal input remains supported where the existing field allowed it; comma input remains unsupported. My Materials keeps the existing SCU precision of four decimal places and the `1 SCU = 10 000` integer-unit conversion. ITEM quantity retains its existing integer validation.

## Automated evidence

- `tools/run-v003-c0124-tests.mjs`: PASS.
- Quantity replacements `1 -> 2`, `1 -> 11`, `1 -> 452`, `1 -> 11452`, `20 -> 3`, and `20 -> 300`: PASS.
- Target Q replacements `800 -> 900`, `800 -> 950`, and `950 -> 700`: PASS.
- Temporary empty draft, first-focus select-all, already-focused caret edit, Backspace/Delete draft path, Arrow/Home/End pass-through, Enter, change, blur, and Tab/blur: PASS.
- User Data writes during draft: `0`.
- Full `C001–C012.4 + M1–M6.1 + C04` validator: PASS.
- C012.3 Metamaterial Q800 constraint regression: PASS.
- Standalone/single-file and frozen V002 integrity: PASS.

## Real Chrome localhost evidence

Chrome received actual sequential key events, not a final DOM value injection.

- Blueprint Final Card quantity `1 -> 11452`: DOM stayed focused for `1`, `11`, `114`, `1145`, `11452`; application state remained at the committed value until Enter; final committed value `11452`.
- Crafting List quantity `11452 -> 3`: first-focus replacement and Tab/blur commit; final persisted User Data value `3` after reload.
- Combined Beryl Target Q `800 -> 950`: temporary empty draft followed by `9`, `95`, `950`; final persisted User Data value `950` after reload.
- Temporary empty draft and native caret edits with ArrowLeft, Home, End: PASS.
- Mining station override: typing `12` did not render station rows while in draft; Enter committed once and rendered 12 rows.
- Technical Probe: PASS, failed checks `0`.
- Browser console warning/error: `0`.
- User Data fingerprint across reload: `170845c4 -> 170845c4`.
- 1920x1080, 1366x768, and 390x844: all audited visible numeric fields remained bound and horizontal overflow was `0`.

This is Codex-run Chrome localhost evidence. No new C012.4 manual `file://` result is claimed.

## Release boundary and rollback

The interrupted C013 candidate remains `INVALIDATED_BY_C012.3_RELEASE_BLOCKER`. No V003 release, tag, push, or main merge is part of this cycle. Roll back by reverting the C012.4 commit; the stable fallback remains the unchanged V002 tag and release artifact.
