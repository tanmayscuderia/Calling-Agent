# Pulse

Source: https://docs.sarvam.ai/conversations/deploy/telephony/pulse

Connect your Pulse account to Voice Agents for inbound and outbound voice calling.

Setup has two parts: add your Pulse token on Voice Agents, then map your Pulse number’s WebSocket URL for inbound routing.

**Before you start:** an active Pulse account, your non-expiring **bearer token**, at least one **CLI number** (the caller-line-identity phone number Pulse assigns you), and Voice Agents access with permission to add telephony connections (**Deploy → Phone Numbers**).

## Watch the setup

Connecting your Pulse account to Voice Agents, end to end.

## Add the connection on Voice Agents

Voice Agents needs one value — a non-expiring bearer token provided by Pulse.

[1](https://docs.sarvam.ai/conversations/deploy/telephony/pulse#get-your-pulse-token-on-pulse)

### Get your Pulse token (on Pulse)

Obtain the bearer token from your Pulse account dashboard, or ask your Pulse account manager if you can’t find it. This token does not expire.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/pulse#enter-and-save-on-voice-agents)

### Enter and save on Voice Agents

In Voice Agents, go to **Deploy → Phone Numbers → Add Connection**, select **Pulse**, paste the token, and click **Save**. The connection now appears under **Deploy → Phone Numbers**.

* * *

## Set up inbound routing

For inbound calls to reach Sarvam, map the WebSocket URL to your Pulse number using the Pulse API.

Run the following API call, replacing `<token>` with your Pulse bearer token and `<clinumber>` with your CLI number from Pulse:

```bash
curl --location 'https://connecthub.pulsework360.com/telephony/clinumber/map/callflow/integration' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <token>' \
  --data '{
    "clinumbername": "<clinumber>",
    "wssurl": "wss://apps.sarvam.ai/api/app-runtime/channels/pulse/call",
    "frequency": "8000"
  }'
```

| Parameter | Value |
| --- | --- |
| `clinumbername` | The CLI number provided by Pulse |
| `wssurl` | `wss://apps.sarvam.ai/api/app-runtime/channels/pulse/call` |
| `frequency` | `8000` (8 kHz audio) |

A `2xx` response means the mapping succeeded. A `401` means the bearer token is wrong or expired; a `4xx` on `clinumbername` usually means the CLI number is incorrect. Fix the value and re-run.

* * *

## After connecting

Once both sides are configured:

[1](https://docs.sarvam.ai/conversations/deploy/telephony/pulse#add-your-phone-number)

### Add your phone number

In Voice Agents, open your Pulse connection under **Deploy → Phone Numbers** and add the CLI number. See [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers).

[2](https://docs.sarvam.ai/conversations/deploy/telephony/pulse#route-calls-to-an-agent)

### Route calls to an agent

For incoming calls, create an [Inbound deployment](https://docs.sarvam.ai/conversations/deploy/inbounds) to route the number to an agent. To dial out, add the number to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns).

[3](https://docs.sarvam.ai/conversations/deploy/telephony/pulse#verify-with-a-test-call)

### Verify with a test call

Dial the number from a phone and confirm your agent answers. See [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers) for the test-call steps.

**Outbound calling** uses this same connection — dial out by adding the number to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns). No separate credentials are required.

## Next

[

Manage Phone Numbers

Add your number and route it to an agent.







](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers)[

All providers

See other providers.







](https://docs.sarvam.ai/conversations/deploy/telephony/bring-your-own)
