# Todo

## Goal

Birthday banner should no longer render, while its code remains commented out for later reuse.

## Plan

- [x] Locate the banner markup and related layout styling.
- [x] Comment out the banner and its banner-only spacing/styling without deleting it.
- [x] Verify the banner text no longer renders as active HTML and document the change.

## Review

- Commented out the birthday banner markup in `index.html` so it no longer renders but remains available for reuse.
- Commented out the banner-only CSS and top padding so the page does not keep an empty banner gap.
- Verification run:
- `node -e` stripped HTML/CSS comments and confirmed the birthday text, banner classes, and banner top padding are absent from active content.
