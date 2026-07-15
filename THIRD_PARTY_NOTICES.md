# Third-party notices

## HeyForm

- Project: https://github.com/heyform/heyform
- Source snapshot inspected: commit `4bfca60ee1bbc215dc308bd918a50c6c8dfe77ab`
- License: GNU Affero General Public License v3
- Upstream packages reviewed: `shared-types-enums`, `answer-utils`, `form-renderer`, `embed`, and `webapp`

This Cloudflare/HubSpot port adapts a limited subset of HeyForm's field-kind and plain-answer concepts and its conversational one-question-at-a-time interaction. The implementation was reduced to the HubSpot contact use case, uses D1 rather than HeyForm's server stack, and adds direct HubSpot OAuth synchronization. Customers do not need a HeyForm account or API.

The exact adapted source identifies the upstream snapshot and modifications in `src/heyform-port.ts`. The complete hosted application is distributed under AGPLv3.

HeyForm, Typeform, and HubSpot are trademarks of their respective owners. No affiliation or endorsement is implied.
