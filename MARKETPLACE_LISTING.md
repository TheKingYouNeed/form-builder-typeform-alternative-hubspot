# HubSpot Marketplace listing package

Prepared July 15, 2026 for HubSpot app ID `45798313`.

## Listing info

- Public app name: **Form Builder - Typeform Alternative**
- Company: **DAHMANI LIMITED**
- Tagline: **Build conversational forms and sync every response directly to HubSpot contacts.**
- Primary language: English
- Categories: Data Management; Marketing
- Suggested URL path: `form-builder-typeform-alternative`
- Search terms: `form builder`, `Typeform alternative`, `conversational forms`, `multi-step forms`, `lead capture`, `HubSpot contacts`
- Partner sign-in: Not required. HubSpot OAuth is the only account authentication.
- Install entry point: `https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/api/oauth/start`
- App icon: `outputs/marketplace/app-icon-800.png`

## App overview

Form Builder - Typeform Alternative is a self-contained conversational form builder for HubSpot. Create a form, map each answer to a HubSpot contact property, publish a hosted link or iframe, and receive submissions directly in HubSpot.

The app solves the gap between collecting a response and making it useful in the CRM. A required email field identifies the contact. Form Builder updates the matching HubSpot contact or creates one when no match exists, while leaving unrelated contact data unchanged.

The form editor, form hosting, submission validation, duplicate protection, and contact sync are included. Customers do not need a separate form account, automation service, or external API key. The source is published under GNU AGPLv3.

### Common use cases

- Capture sales leads with a hosted multi-step form.
- Embed a conversational contact form on a website.
- Qualify inbound requests with multiple-choice questions.
- Update standard or custom HubSpot contact properties from form answers.
- Replace a separate form-plus-automation workflow with one focused app.

## Shared data

| App object | HubSpot object | Direction | Description |
| --- | --- | --- | --- |
| Form response | Contact | Bidirectional | Form Builder reads contact email and ID to find an existing record, then creates or updates mapped HubSpot contact properties from the submitted response. |

This accurately reflects the requested `crm.objects.contacts.read` and `crm.objects.contacts.write` scopes. The app does not continuously import HubSpot contacts into its database.

## HubSpot features

- Contacts
- Contact properties
- CRM
- OAuth

## Languages

- App interface: English
- Customer support: English

## Pricing

- Currency: USD
- Model: Free forever
- Plan name: Free
- Price: $0
- Tagline: Complete form builder and HubSpot contact sync at no charge.
- Details: Includes the form editor, hosted forms, iframe embedding, direct contact create/update, recent sync status, and email support.
- Pricing URL: `https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/pricing`

## Features

### Self-contained form builder

Create short-text, long-text, email, multiple-choice, and yes/no questions without a separate form service or API key.

### Hosted and embeddable forms

Publish a responsive conversational form, share its public URL, or copy the generated iframe snippet into a website.

### Direct HubSpot contact sync

Map answers to HubSpot contact property internal names. Completed responses create or update a contact by email.

### Safe delivery pipeline

Required-field validation, allowed-choice validation, honeypot protection, minimum-completion timing, idempotency keys, retries, and masked delivery logs reduce bad data and duplicate writes.

### Privacy-minded response handling

Raw answers are processed transiently. Form Builder stores delivery status, IDs, and a masked email preview rather than retaining complete response payloads.

## Screenshots and alt text

1. `outputs/marketplace/01-form-builder-dashboard.png`
   - Alt: **Form Builder Typeform alternative dashboard showing the form editor, HubSpot field mapping, and recent contact syncs**
2. `outputs/marketplace/02-conversational-form.png`
   - Alt: **Hosted conversational form created with Form Builder for direct HubSpot contact capture**
3. `outputs/marketplace/03-self-contained-form-builder.png`
   - Alt: **Form Builder landing page explaining self-contained forms and direct HubSpot contact sync**

All images use placeholder `.example` data and contain no personal information.

## Support and legal URLs

- Website: `https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/`
- Setup documentation: `https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/docs/setup`
- Support: `https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/support`
- Support email: `simo.dahmani1@gmail.com`
- Privacy policy: `https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/privacy`
- Terms of service: `https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/terms`
- Pricing: `https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/pricing`
- Open-source disclosure: `https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/open-source`
- Source: `https://github.com/TheKingYouNeed/form-builder-typeform-alternative-hubspot`

## App review instructions

No external account or test credentials are required.

1. Install the app into a HubSpot production or developer test account through the provided OAuth flow.
2. Confirm the requested scopes are OAuth plus HubSpot contact read and write access.
3. After OAuth, confirm the app redirects to the Form Builder dashboard and displays **HubSpot connected**.
4. Click **New** and configure at least two questions: a required Email question mapped to `email`, and a Short text question mapped to `firstname`.
5. Set the form status to **Published** and click **Save form**.
6. Open the generated public form URL in a private browser window.
7. Submit a unique email address and first name.
8. Return to the dashboard and confirm the masked email appears under **Recent syncs**.
9. In HubSpot Contacts, confirm a contact exists with the submitted email and first name.
10. Click **Disconnect & erase**. Confirm the connection, forms, and delivery logs are removed; the already-created HubSpot contact remains.

Expected end-to-end runtime is under five minutes.

## Current eligibility status

- OAuth: configured and production-tested
- Active install count shown by HubSpot: 1
- Required for listing editor selection: 3 active, unique, unaffiliated production installs with successful API activity in the previous 30 days
- Listing creation: gated by the install requirement

