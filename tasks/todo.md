# Todo

## Goal

Replace the current monthly special with `KÜRBIS CRUNCH` and keep all visible and machine-readable menu representations consistent.

## Plan

- [x] Locate every visible and machine-readable representation of the current monthly special.
- [x] Update the title and supplied ingredients in the visible menu, JSON-LD, and `llms.txt`.
- [x] Verify that the old special is gone, the new content is complete, structured data parses, and the diff is clean.

## Review

- Replaced `Monatsspezial LUNCH x joschi` with `Monatsspezial KÜRBIS CRUNCH` in the visible menu, JSON-LD, and `llms.txt`.
- Added all seven supplied ingredients verbatim and removed the obsolete LUNCH Instagram link.
- Confirmed the old title, ingredients, and link are absent from the product files.
- Parsed the JSON-LD successfully and checked the new menu item contents.
- Visually verified the menu at desktop size and at a 390 × 844 mobile viewport; the special remains readable without horizontal overflow.
- `git diff --check` passed.
- No lesson added because there was no user correction in this task.
