# Changelog

## 0.1.4 — 2026-07-15

- Refined landing-page, form-editor, and conversational-form visual hierarchy and responsive spacing.
- Added clearer hover, focus, disabled, progress, and reduced-motion states without changing app behavior or dependencies.

## 0.1.3 — 2026-07-15

- Linked the live app and open-source disclosure to an immutable production GitHub release for reviewer traceability.

## 0.1.2 — 2026-07-15

- Added a Cloudflare secret-backed IndexNow ownership endpoint without committing the verification key.
- Scoped Worker-first asset routing to the IndexNow verification path.
- Preflighted and submitted the landing, setup, pricing, and open-source pages to IndexNow; the API accepted all four URLs.

## 0.1.1 — 2026-07-15

- Added Marketplace-ready app icon, product screenshots, listing copy, reviewer checklist, and independent production beta instructions.
- Added a public free-pricing page and screenshot-backed setup, disconnect, and uninstall documentation.
- Added SoftwareApplication, Product, and FAQ structured data; canonical metadata; sitemap coverage; and explicit AI crawler rules.
- Removed external font requests, added a favicon and HSTS, and corrected all Lighthouse accessibility findings in the editor and public form.
- Removed the development OAuth redirect from the production HubSpot app configuration.
- Verified a real published-form submission created the expected HubSpot contact in production.

## 0.1.0 — 2026-07-15

- Initial self-contained Form Builder — Typeform Alternative release.
- Added HubSpot OAuth 2026.03 with contact read/write scopes.
- Added draft and published forms, share links, iframe embedding, and conversational one-question-at-a-time rendering.
- Added direct HubSpot contact create/update by email, token refresh, retry handling, and duplicate submission protection.
- Added transient answer processing, encrypted OAuth secrets, masked delivery logs, disconnect cleanup, public setup documentation, privacy policy, terms, and support pages.
- Adapted a limited AGPL subset of HeyForm field-kind and plain-answer concepts from commit `4bfca60ee1bbc215dc308bd918a50c6c8dfe77ab`.
