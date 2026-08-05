# Todo

## Goal

Update the August monthly special to `Monatsspezial Nektarine` everywhere the menu is exposed.

## Plan

- [x] Locate visible and machine-readable mentions of the current monthly special.
- [x] Update `index.html` visible menu and JSON-LD menu data.
- [x] Update `llms.txt` menu highlights.
- [x] Verify the old special is gone, the new wording is present, and structured data still parses.

## Review

- Updated the visible menu item in `index.html` to `Monatsspezial Nektarine`.
- Updated the matching JSON-LD menu item in `index.html`.
- Updated `llms.txt` menu highlights to the same title and ingredients.
- Verification run:
- Confirmed the old `Spezial weiße Bohne` title and ingredients are absent from `index.html` and `llms.txt`.
- Confirmed the new title and ingredient wording appears in all three expected menu representations.
- Parsed the JSON-LD block successfully.
- `git diff --check` passed.
- No lesson added because there was no user correction in this task.
