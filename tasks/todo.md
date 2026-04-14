# Todo

## Goal

Enable a public-ready Custom GPT Action setup for reservations, including an OpenAPI schema and a privacy policy URL usable in the GPT builder.

## Plan

- [x] Review the existing reservation endpoints and the current OpenAI GPT Actions requirements.
- [x] Add a public OpenAPI schema that maps cleanly to the reservation endpoints.
- [x] Adjust endpoint request/response contracts only where needed for better GPT Action compatibility.
- [x] Add concise setup documentation for wiring the schema into a Custom GPT Action.
- [x] Verify schema consistency against the implemented API and document any deployment prerequisites.
- [x] Add a dedicated privacy policy page and surface its production URL for GPT builder use.

## Review

- Added a public OpenAPI schema at `.well-known/openapi-reservations.json` for Custom GPT Actions.
- Reused the existing public reservation endpoints:
  - `GET /api/reservations/capabilities`
  - `POST /api/reservations`
- Kept the backend contract minimal because the current request/response shape was already compatible with an action-driven reservation flow.
- Added `GPT_ACTIONS.md` with the exact schema URL, recommended GPT builder setup, and deployment caveats.
- Added `datenschutz.html` and linked it from the main footer so the site now exposes a dedicated privacy policy URL for GPT publication.
- Verification run:
  - `node -e "JSON.parse(require('fs').readFileSync('.well-known/openapi-reservations.json','utf8'))"`
  - `node --check api/reservations.js`
  - `node --check api/reservations/capabilities.js`
  - Node-based schema consistency check for operation IDs and required reservation fields
- GPT builder privacy policy URL:
  - `https://klapp.pizza/datenschutz.html`
