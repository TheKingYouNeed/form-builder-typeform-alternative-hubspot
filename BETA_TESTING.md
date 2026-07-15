# Production beta checklist

Form Builder needs three active, unique, unaffiliated HubSpot production installs before HubSpot enables Marketplace listing submission. HubSpot developer test accounts and accounts affiliated with DAHMANI LIMITED do not count.

Only participate if you are authorized to install apps in a real HubSpot production account owned by an independent organization.

## Five-minute test

1. Review the [privacy policy](https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/privacy), [requested permissions](https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/docs/setup), and [open-source code](https://github.com/TheKingYouNeed/form-builder-typeform-alternative-hubspot).
2. Open the [production install flow](https://form-builder-typeform-alternative.simo-dahmani1.workers.dev/api/oauth/start).
3. Select an independent HubSpot production account and approve OAuth plus contact read/write access.
4. In Form Builder, create a form with a required Email question mapped to `email` and a Short text question mapped to `firstname`.
5. Publish the form and open its public URL.
6. Submit an email address and first name that you are permitted to add to your HubSpot account.
7. Confirm the masked email appears under **Recent syncs** and the new or updated contact appears in HubSpot.
8. Keep the app installed through the Marketplace submission date so HubSpot can verify an active install within the prior 30 days.

## What the test stores

Form Builder stores the OAuth connection, form configuration, sync status, HubSpot contact ID, and a masked email preview. It processes mapped form answers transiently and does not retain the raw response payload or complete email address in its database.

## Cleanup

Click **Disconnect & erase** to uninstall the app and delete the connection, forms, and delivery logs. Existing HubSpot contacts remain in your HubSpot account and can be deleted there if they were only created for testing.

Report problems to [simo.dahmani1@gmail.com](mailto:simo.dahmani1@gmail.com) without sending OAuth tokens or complete form responses.
