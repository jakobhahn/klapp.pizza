# Todo

## Goal

Replace `Monatsspezial Nektarine` with the `Monatsspezial LUNCH x joschi`, translate the ingredients from the supplied image into German, and link `_lunchshop` on Instagram.

## Plan

- [x] Locate all visible and machine-readable mentions of the current monthly special and inspect existing Instagram link conventions.
- [x] Update the visible special with the new title, translated ingredients, and an accessible `_lunchshop` Instagram link.
- [x] Update JSON-LD and `llms.txt` to match the visible menu.
- [x] Verify the old special is gone, the new content and link are present, structured data parses, and the page markup remains valid.

## Review

- Replaced `Monatsspezial Nektarine` with `Monatsspezial LUNCH x joschi` in the visible menu, JSON-LD, and `llms.txt`.
- Translated the ingredients from the supplied image as `Za’atar, Sumach-Sesam-Olivenöl, geschmolzener gesalzener Käse, frische Rauke und Zitronenabrieb`.
- Linked `LUNCH` in the visible menu to `https://www.instagram.com/_lunchshop/` using the site's existing external-link and accessibility conventions.
- Added the collaboration Instagram URL to the machine-readable menu entry in `llms.txt`.
- Verification run:
- Confirmed the old title and ingredients are absent from `index.html` and `llms.txt`.
- Confirmed the rendered title remains contiguous and the new ingredients appear in all three menu representations.
- Confirmed the accessible Instagram link and its security attributes are present; the profile URL returned HTTP 200.
- Parsed the JSON-LD block successfully.
- `git diff --check` passed.
- No lesson added because there was no user correction in this task.
