# Todo

## Goal

Enable AI agents to complete a reservation on behalf of a customer through the website's reservation flow, with an explicit machine-readable contract for available inputs and times.

## Plan

- [x] Inspect the current reservation form, API, and data model for the cleanest agent integration point.
- [x] Add an agent-readable reservation capabilities endpoint so agents can discover valid fields, party-size limits, and available times without reverse-engineering browser JavaScript.
- [x] Extend reservation creation to accept optional agent metadata and persist it in reservation metadata for auditability.
- [x] Improve the reservation form markup with machine-readable metadata and an explicit agent hint so browser agents can map fields reliably.
- [x] Update `llms.txt` with the reservation contract and the website-first booking flow for external agents.
- [x] Verify the changed flows with targeted local checks and document results.

## Review

- Added `api/_reservation-rules.js` as the shared source of truth for party-size limits, time-slot generation, and date/time normalization.
- Added `GET /api/reservations/capabilities` for machine-readable discovery of valid fields, limits, opening rules, and date-specific available times.
- Tightened `POST /api/reservations` so invalid times outside opening hours are rejected server-side instead of only in browser JavaScript.
- Added optional `agent` metadata support that is persisted via Supabase RPC metadata for later auditing.
- Added machine-readable contract markers to the reservation form and documented the flow in `llms.txt`.
- Verification run:
  - `node --check api/_reservation-rules.js`
  - `node --check api/reservations.js`
  - `node --check api/reservations/capabilities.js`
  - `node -e "const rules=require('./api/_reservation-rules'); ..."`
- Remaining gap: no automated browser or deployed integration test exists in this repo, so the end-to-end Vercel/Supabase path was not executed locally.
