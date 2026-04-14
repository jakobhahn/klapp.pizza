# GPT Actions Setup

This project exposes a public OpenAPI schema for reservation booking via Custom GPT Actions.

## Schema URL

- Production schema: `https://klapp.pizza/.well-known/openapi-reservations.json`
- Privacy policy URL: `https://klapp.pizza/datenschutz.html`

## Recommended GPT Action Setup

1. In the GPT builder, add a new Action.
2. Use `None` for authentication if the GPT should create public reservation requests without user-specific credentials.
3. Import the OpenAPI schema from:
   - `https://klapp.pizza/.well-known/openapi-reservations.json`
4. In the GPT instructions, require this call order:
   - First call `getReservationCapabilities`
   - Then confirm the returned area/time constraints with the user
   - Only then call `createReservation`
5. Tell the GPT to always include `agent.name` and set `agent.customer_confirmed=true` only after the customer explicitly confirms the booking details.

## Important Notes

- The booking timezone is `Europe/Berlin`.
- `area` must be `innen` or `aussen`.
- Valid times depend on the selected date and should be read from `getReservationCapabilities`.
- The reservation API creates a `pending` request. It does not auto-confirm the table.
- The API is public, so any abuse protection should be handled separately if needed.

## OpenAI Builder Notes

- OpenAI documents GPT Actions as OpenAPI-defined API integrations configured inside a Custom GPT.
- For public GPTs, use `https://klapp.pizza/datenschutz.html` as the Privacy Policy URL in the GPT builder.

## Local Verification

- Validate the JSON schema file syntax:
  - `node -e "JSON.parse(require('fs').readFileSync('.well-known/openapi-reservations.json', 'utf8'))"`
- Validate the backing endpoints:
  - `node --check api/reservations.js`
  - `node --check api/reservations/capabilities.js`
