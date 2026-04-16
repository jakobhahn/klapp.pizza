# Todo

## Goal

Allow reservations on 2026-04-26 from 14:00 through 20:00.

## Plan

- [x] Inspect backend and frontend reservation slot generation to find the shared date/time rules.
- [x] Add a date-specific override for 2026-04-26 so available slots run from 14:00 to 20:00.
- [x] Update the frontend slot generation to match the backend exactly for that date.
- [x] Verify the generated slots and document the result.

## Review

- Added a date-specific reservation opening override for `2026-04-26` in the backend rules so that Sunday offers quarter-hour booking slots from `14:00` through `19:45` with `20:00` as the exclusive end boundary.
- Added the same `2026-04-26` override in the frontend slot generator so the website dropdown matches backend validation.
- Extended reservation capabilities with `special_openings` so machine-readable consumers can also discover the exception.
- Verification run:
- `node` assertion check confirmed backend slots for `2026-04-26` start at `14:00`, end at `19:45`, contain 24 slots, exclude `20:00`, and match `available_times`.
- `node` check confirmed the frontend contains the same `2026-04-26` override and `14:00`-`20:00` range.
