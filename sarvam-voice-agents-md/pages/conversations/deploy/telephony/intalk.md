# Intalk

Source: https://docs.sarvam.ai/conversations/deploy/telephony/intalk

Connect your Intalk account to Voice Agents for inbound and outbound voice calling.

Setup has two parts: configure the WebSocket connection on Intalk’s platform, then add your Intalk credentials on Voice Agents.

Unlike most providers, Intalk is configured **provider-first**: set up the WSS connection on Intalk before adding the connection on Sarvam.

**Before you start:** an active Intalk account with admin access to **WSS Config** and **API Keys**, at least one Intalk number (**DID** — the phone number that receives calls), your account **hostname**, and Voice Agents access with permission to add telephony connections (**Deploy → Phone Numbers**). _WSS_ (WebSocket Secure) is how call audio is streamed to Sarvam.

* * *

## Configure the WebSocket connection on Intalk

Configure the WebSocket connection so Intalk routes calls to your Sarvam agent.

[1](https://docs.sarvam.ai/conversations/deploy/telephony/intalk#open-wss-config)

### Open WSS Config

Log in to the Intalk platform and open **WSS Config** in the sidebar.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/intalk#set-connection-type)

### Set Connection Type

Set **Connection Type** to **WSS**.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/intalk#enter-the-wss-url)

### Enter the WSS URL

Set the WSS URL to:

```
wss://apps.sarvam.ai/api/app-runtime/channels/intalk?bot_phone_number={{did_number}}&user_phone_number={{origination_number}}
```

Leave `{{did_number}}` and `{{origination_number}}` exactly as-is — Intalk substitutes them automatically for each call.

[4](https://docs.sarvam.ai/conversations/deploy/telephony/intalk#save)

### Save

Save the WSS configuration.

* * *

## Add the connection on Voice Agents

Voice Agents needs two values from your Intalk account — your **hostname** and a **Product API key**.

[1](https://docs.sarvam.ai/conversations/deploy/telephony/intalk#get-your-hostname-on-intalk)

### Get your hostname (on Intalk)

Intalk provides a unique hostname for your account (for example, `youraccount.intalk.io`). Find it in your Intalk account settings, or contact your Intalk account manager if you don’t have it.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/intalk#generate-an-api-key-on-intalk)

### Generate an API Key (on Intalk)

In the Intalk dashboard, navigate to **Settings → API Keys** and generate a new key with these settings:

| Setting | Value |
| --- | --- |
| **Key type** | Product API |
| **Expiry** | Never expire |
| **Endpoints** | Select **all available** endpoints (these include Outbound Call, Call Status, and Assigned List) |

[3](https://docs.sarvam.ai/conversations/deploy/telephony/intalk#enter-and-save-on-voice-agents)

### Enter and save on Voice Agents

In Voice Agents, go to **Deploy → Phone Numbers → Add Connection**, select **Intalk**, enter the values below, and click **Save**. The connection now appears under **Deploy → Phone Numbers**.

-   **Hostname**: the unique hostname from Intalk
-   **API Key**: the Product API key you just generated

* * *

## After connecting

Once both sides are configured:

[1](https://docs.sarvam.ai/conversations/deploy/telephony/intalk#add-your-phone-number)

### Add your phone number

In Voice Agents, open your Intalk connection under **Deploy → Phone Numbers** and add the DID number. See [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers).

[2](https://docs.sarvam.ai/conversations/deploy/telephony/intalk#route-calls-to-an-agent)

### Route calls to an agent

For incoming calls, create an [Inbound deployment](https://docs.sarvam.ai/conversations/deploy/inbounds) to route the number to an agent. To dial out, add the number to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns).

[3](https://docs.sarvam.ai/conversations/deploy/telephony/intalk#verify-with-a-test-call)

### Verify with a test call

Place a test call to (or from) the number and confirm your agent connects. See [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers) for the test-call steps.

**Outbound calling** uses this same connection (via the Outbound Call endpoint on your API key) — dial out by adding the number to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns).

## Next

[

Manage Phone Numbers

Add your number and route it to an agent.







](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers)[

All providers

See other providers.







](https://docs.sarvam.ai/conversations/deploy/telephony/bring-your-own)
