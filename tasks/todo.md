# Todo

## Goal

Improve local organic visibility for pizza, catering, events, venue hire, Christmas parties, St. Pauli, and Reeperbahn searches without keyword stuffing or unverifiable ranking promises.

## Plan

- [x] Audit the existing information architecture, metadata, crawlability, structured data, and visible copy.
- [x] Define a focused page and internal-link structure for restaurant and event-related search intent.
- [x] Improve the homepage title, description, headings, visible local copy, social metadata, and structured data.
- [x] Add focused landing pages for catering, eventlocation, and Christmas-party intent with matching structured data.
- [x] Update discovery files (`sitemap.xml`, `llms.txt`) and internal navigation.
- [x] Verify HTML/JSON-LD validity, keyword-to-page mapping, links, crawl directives, responsive layout, and the final diff.

## Review

- Added the missing homepage title and strengthened its H1, description, social metadata, local copy, navigation, and Restaurant/WebPage JSON-LD for Pizza, St. Pauli, and Reeperbahn intent.
- Added three substantive, internally linked landing pages: Pizza Catering Hamburg, Eventlocation St. Pauli, and Weihnachtsfeier Hamburg. Each has unique metadata, one H1, conversion copy, FAQ content, and Service/Breadcrumb/FAQ structured data.
- Normalized the visible address, added titles to legal pages, and marked the admin UI `noindex, nofollow, noarchive`.
- Updated `sitemap.xml` and `llms.txt`, and added a reusable `npm run check:seo` validation script.
- Verified all six public pages with the SEO check, parsed every JSON-LD block, validated the sitemap XML and API JavaScript syntax, and passed `git diff --check`.
- Visually checked the homepage and Eventlocation landing page on desktop and at a 390 × 844 mobile viewport; both remain readable with no horizontal overflow.
- Captured the user's explicit Eventlocation keyword emphasis in `tasks/lessons.md` and implemented it as its own page-level search target.

## LLM Discoverability Follow-up

- [x] Audit crawler access, `llms.txt`, page-level discovery links, structured data, and cross-file factual consistency.
- [x] Add current AI-search crawler directives and page-level machine-readable discovery where useful.
- [x] Expand `llms.txt` into a concise, citation-friendly source of restaurant, catering, eventlocation, and Christmas-party facts.
- [x] Extend automated checks to cover LLM discovery and verify all public representations remain consistent.

### Follow-up Review

- Reworked `llms.txt` into the proposed v2 layout: one H1, a concise blockquote summary, verified core facts, and annotated link lists.
- Added Markdown mirrors for the homepage, Pizza Catering, Eventlocation, and Weihnachtsfeier pages. Every matching HTML page now declares its Markdown alternate and the covering `llms.txt` file.
- Added explicit `OAI-SearchBot`, `Claude-SearchBot`, `Claude-User`, and `ClaudeBot` access while preserving other existing AI crawler rules.
- Expanded each landing page's structured data with a Service description, `mainEntityOfPage`, and a linked WebPage entity.
- Fixed the deployment workflow so `.well-known` machine-readable API resources are copied instead of being skipped by the shell glob.
- Removed an unsupported “Pizza inklusive” meta claim and kept event capacity language scoped to regular reservations.
- Extended `npm run check:seo` to validate Markdown discovery, `llms.txt` structure and links, AI crawler directives, `.well-known` JSON, and deployment coverage.
- Verified all LLM endpoints locally: `llms.txt`, four `.md` mirrors, and `robots.txt` return HTTP 200 with text-compatible content types.
- Re-ran the complete SEO/LLM check, sitemap XML validation, and `git diff --check` successfully.

## Seasonal Christmas Visibility

- [x] Inventory every visible Christmas-party reference across the public HTML pages.
- [x] Add one shared Europe/Berlin-aware season rule: visible from September 1 through December 15 inclusive.
- [x] Mark every Christmas link and text fragment for automatic off-season hiding and gate the dedicated landing page.
- [x] Add boundary-date tests and verify active/off-season behavior without breaking SEO/LLM checks.

### Seasonal Review

- Added shared `seasonal-content.js` and fail-closed `seasonal-content.css` used by all four marketing pages.
- Christmas content is active annually from September 1 at 00:00 through December 15 at 23:59:59 in the Europe/Berlin time zone, independent of the visitor's local time zone.
- Marked every visible Christmas link or mixed-text fragment on the homepage, Catering page, and Eventlocation page for automatic off-season hiding.
- The dedicated Christmas landing page starts hidden, becomes visible only in season, and redirects to the Eventlocation page outside the season without a content flash.
- Kept sitemap, structured data, and LLM resources available year-round so the seasonal URL retains search and AI discovery signals; only the visitor-facing content is seasonally gated.
- Added six Node tests covering Berlin boundary instants, annual recurrence, DOM state, direct-page redirect behavior, and markup completeness.
- `npm run check:seo`, sitemap XML validation, JavaScript syntax checking, and `git diff --check` all pass.
