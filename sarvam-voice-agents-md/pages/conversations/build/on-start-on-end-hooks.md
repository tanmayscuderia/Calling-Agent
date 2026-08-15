# On-Start & On-End Hooks

Source: https://docs.sarvam.ai/conversations/build/on-start-on-end-hooks

Trigger API webhooks at conversation boundaries, load user context before the agent speaks, and push results when the call ends.

## On-start API config

Configure an on-start API to fetch user context before the conversation begins (CRM profile, open tickets, eligibility flags). Typical inputs include caller phone number and campaign metadata.

## Response template mapping

Map on-start API fields into agent variables and user info:

-   Populate greeting variables (name, plan, locale)
-   Prefill known account details so the agent does not re-ask
-   Gate tools or states based on returned flags

See [Variables & Personalization](https://docs.sarvam.ai/conversations/build/variables-personalization).

## On-end API config

Configure an on-end API to push results after the conversation:

-   Disposition and outcome variables
-   Collected fields
-   Transcript or recording references (when available)
