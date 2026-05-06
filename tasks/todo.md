# Todo

## Goal

Update the monthly special for May to the new ingredient list.

## Plan

- [x] Locate every source that renders or exposes the monthly special.
- [x] Update the May special text consistently in those sources.
- [x] Verify the final content and document the change.

## Review

- Updated the monthly special in the visible menu section of `index.html` from April to May.
- Updated the structured menu data in `index.html` so machine-readable consumers see the same May special.
- Updated `llms.txt` to keep the summarized menu highlights aligned with the website.
- Verification run:
- `rg` confirmed `#4 spezial mai` and the full ingredient list appear in both `index.html` locations and in `llms.txt`.
