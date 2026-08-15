# Deploy with Code (API & SDK)

Source: https://docs.sarvam.ai/conversations/deploy/deploy-with-code

Integrate Voice Agents programmatically with APIs and SDKs. For platform speech APIs, see the [API Reference](https://docs.sarvam.ai/api-reference/introduction).

## What will be covered

| Topic | Description |
| --- | --- |
| **API recipes** | Ready-to-use code for common operations, creating agents, starting sessions, triggering outbound calls, fetching transcripts |
| **WebSocket integration** | Real-time voice sessions with audio frames, turn events, and tool-call signals |
| **SDK usage** | Typed client libraries for session lifecycle, agent management, and outcome retrieval |
| **Authentication** | API key usage and best practices for keeping secrets server-side |

Authenticate all requests with your [API key](https://docs.sarvam.ai/conversations/settings/api-key).

## Getting started (preview)

Use the dashboard API recipes as a starting point:

1.  **Create or update an agent configuration**: set up agents programmatically instead of through the UI
2.  **Start a conversation session**: initiate a voice or text session via API
3.  **Trigger outbound calls**: kick off calls to specific numbers with variable payloads
4.  **Fetch transcripts and outcomes**: pull conversation data into your systems for analysis or CRM updates

## WebSocket integration

For real-time voice sessions, connect over the Voice Agents WebSocket interface. Handle audio frames, turn events, and tool-call signals according to the API contract.

Never expose production API keys in browser code. Keep secrets server-side and proxy WebSocket connections through your backend when building client-facing applications.

## Embed the agent (widget)

To put a voice or chat agent on your website, embed the widget:

1.  Open your agent and go to the **Embed** option in Deploy with Code.
2.  Copy the embed snippet from the dashboard.
3.  Paste it into your site, typically before `</body>`.
4.  Load the page and confirm the widget initializes.

Customize the launcher position, theme, and which agent the widget uses from the dashboard, and re-test in [test agent](https://docs.sarvam.ai/conversations/deploy/overview) after changes.
