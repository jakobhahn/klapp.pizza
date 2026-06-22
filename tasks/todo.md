# Todo

## Goal

Replace menu mentions of `Stracciatella` with `Stracciatella-Käse` everywhere the menu is exposed.

## Plan

- [x] Locate every visible and machine-readable menu mention of `Stracciatella`.
- [x] Update menu text consistently in `index.html` and `llms.txt`.
- [x] Verify no old menu wording remains and document the change.

## Review

- Updated visible menu items #1 and #2 in `index.html` from `Stracciatella` to `Stracciatella-Käse`.
- Updated matching JSON-LD menu descriptions and the restaurant description in `index.html`.
- Updated `llms.txt` menu highlights for #1 and #2.
- Verification run:
- `rg -P "Stracciatella(?!-Käse)" index.html llms.txt` found no old menu wording.
- `rg "Stracciatella-Käse" index.html llms.txt` confirmed seven updated occurrences.
- `node -e` parsed the JSON-LD block successfully.
- `git diff --check` passed.
