# Form Builder – Typeform Alternative for HubSpot

An open-source, self-contained conversational form builder that publishes hosted or embeddable forms and turns completed responses directly into HubSpot contacts. It is a focused Typeform alternative that needs no separate form account, automation service, or external API key.

**[Live product](https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/)** · **[Interactive demo](https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/demo)** · **[Setup guide](https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/docs/setup)** · **[Free pricing](https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/pricing)** · **[Production release](https://github.com/TheKingYouNeed/form-builder-typeform-alternative-hubspot/releases/tag/v0.1.4)**

HubSpot admins from independent organizations can help test the Marketplace release by following the [production beta checklist](BETA_TESTING.md).

## What it does

- Installs through HubSpot OAuth 2026-03.
- Requests only `oauth`, `crm.objects.contacts.read`, and `crm.objects.contacts.write`.
- Creates draft and published forms with short text, long text, email, multiple-choice, and yes/no fields.
- Publishes shareable and iframe-embeddable hosted form URLs.
- Maps each question to a HubSpot contact property.
- Updates by email without clearing unrelated HubSpot properties.
- Validates submissions, rejects bot honeypots, deduplicates deliveries, and retries failed HubSpot requests.
- Encrypts HubSpot secrets with AES-256-GCM.
- Processes answers transiently and retains no raw response payloads or complete email addresses.
- Calls HubSpot's official uninstall endpoint and deletes forms, connection data, and delivery logs on disconnect.

## Architecture

- Cloudflare Worker: OAuth, form editor, public form hosting, submission validation, docs, and HubSpot API calls.
- Cloudflare D1: encrypted connections, form configuration, and minimal delivery logs.
- HubSpot developer project 2026.03: Marketplace OAuth app configuration.
- HeyForm: upstream AGPL TypeScript field schema and renderer reference; no HeyForm service is required at runtime.

## Local development

1. Copy `.dev.vars.example` to `.dev.vars` and provide development secrets.
2. Replace the placeholder D1 ID in `wrangler.jsonc`, or create a local-only Wrangler configuration.
3. Run `pnpm install`.
4. Run `pnpm db:migrate:local`.
5. Run `pnpm dev`.

Generate a 32-byte encryption key:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

## Production deployment

```sh
npx wrangler d1 create form-builder-hubspot
npx wrangler d1 migrations apply form-builder-hubspot --remote
npx wrangler secret put HUBSPOT_CLIENT_ID
npx wrangler secret put HUBSPOT_CLIENT_SECRET
npx wrangler secret put TOKEN_ENCRYPTION_KEY
npx wrangler secret put SESSION_SECRET
pnpm deploy
```

Upload `hubspot/` using HubSpot CLI after authenticating the developer account:

```sh
cd hubspot
hs project upload
```

## Marketplace gating

HubSpot requires at least three active, unique installs in unaffiliated production accounts during the prior 30 days before a listing can be submitted. The listing also requires Super Admin access, live documentation/legal/support URLs, review instructions, and accurate shared-data declarations.

## License and upstream

This application is AGPL-3.0-only. Its field-kind and conversational-rendering concepts are adapted from [HeyForm](https://github.com/heyform/heyform), also licensed under AGPLv3. See `THIRD_PARTY_NOTICES.md`.
