# Todo

## Goal

Update the monthly special to `Spezial weiße Bohne` everywhere the menu is exposed.

## Plan

- [x] Locate visible and machine-readable menu mentions of the current monthly special.
- [x] Update `index.html` visible menu and JSON-LD menu data.
- [x] Update `llms.txt` menu highlights.
- [x] Verify the old special is gone, the new wording is present, and structured data still parses.

## Review

- Updated the visible menu item in `index.html` to `Spezial weiße Bohne`.
- Updated the matching JSON-LD menu item in `index.html`.
- Updated `llms.txt` menu highlights to the same title and ingredients.
- Verification run:
- `rg -n "#4 spezial|spezial juni|spezial mai|Nduja|Soya|Petersillie|Erbsen-Joghurt|Schwarzkümmel" index.html llms.txt` found no old special wording.
- `rg -n "Spezial weiße Bohne|weiße Bohnen Püree|würzige Oliven|Kartoffelchips|Rosmarin und Salbei|schwarzer Pfeffer" index.html llms.txt` confirmed the new wording.
- `node -e` parsed the JSON-LD block successfully.
- `git diff --check` passed.
- No lesson added because there was no user correction in this task.
