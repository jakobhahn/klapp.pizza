# Todo

## Goal

Expose stronger hidden machine-readable discovery signals so AI models can recognize that reservations can be executed via API, without adding visible website copy.

## Plan

- [x] Inspect the current hidden reservation discovery signals already present on `main`.
- [x] Add stronger hidden discovery metadata in the homepage head and structured data.
- [x] Add a `.well-known` API manifest describing reservation execution for models.
- [x] Update `llms.txt` to state clearly that reservations are executable via API, not only via manual form usage.
- [x] Verify syntax and cross-link consistency, then document remaining platform limitations.

## Review

- Added `.well-known/ai-plugin.json` as a hidden API manifest that explicitly tells models the site supports executable reservations via API.
- Added hidden discovery links in the homepage head:
  - `rel="alternate"` to `llms.txt`
  - `rel="service-desc"` to the OpenAPI schema
  - `rel="service-doc"` to the API manifest
- Extended homepage JSON-LD with:
  - `WebAPI` node for the reservation API
  - `ReserveAction` node with `GET /api/reservations/capabilities` and `POST /api/reservations` entry points
- Updated `llms.txt` so it now states explicitly that reservations are executable via API and links both discovery files.
- Verification run:
  - `node -e "JSON.parse(require('fs').readFileSync('.well-known/ai-plugin.json','utf8'))"`
  - Node-based checks that `index.html` contains the new hidden discovery links and JSON-LD nodes
  - Node-based checks that `llms.txt` contains the executable-API wording and discovery URLs
- Remaining limitation:
  - These hidden signals improve discoverability for crawlers, agents, and model pipelines that ingest `llms.txt`, structured data, or `.well-known` manifests.
  - They still cannot force the standard consumer ChatGPT product to execute API calls unless that product mode actually supports external actions for the current session.
