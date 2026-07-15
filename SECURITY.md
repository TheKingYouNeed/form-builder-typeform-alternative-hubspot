# Security policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to `simo.dahmani1@gmail.com`. Do not open a public issue containing credentials, personal data, form answers, or exploit details.

Include the affected URL or component, reproduction steps, expected impact, and any suggested mitigation. DAHMANI LIMITED targets an initial response within two business days.

## Supported version

The production version deployed at `form-builder-typeform-alternative.simo-dahmani1.workers.dev` is supported. Security fixes are applied to the hosted service and the default branch.

## Data handling

The service encrypts HubSpot OAuth tokens with AES-256-GCM, signs administrator session cookies, validates public submissions against the stored form schema, and does not retain raw form answers or complete email addresses in its D1 database.
