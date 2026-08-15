# Smartflo

Source: https://docs.sarvam.ai/conversations/deploy/telephony/smartflo

Connect your Tata Tele Smartflo account to Voice Agents for inbound and outbound voice calling.

Smartflo uses **two credentials**: an **Account API Token** to create the connection, and a **Click to Call API Key** you provide when adding each number. Setup has two parts: create the connection on Voice Agents, then configure voice streaming and Click to Call on Smartflo’s dashboard.

**Before you start:** an active Tata Tele Smartflo account with admin/dashboard access, at least one Smartflo phone number, and Voice Agents access with permission to add telephony connections (**Deploy → Phone Numbers**).

**The two credentials, at a glance:**

-   **Account API Token** — identifies your Smartflo account. Used once to create the connection.
-   **Click to Call API Key** — authorizes a specific number for voice streaming. Provided per number when you add it on Sarvam.

* * *

## Create the connection on Voice Agents

[1](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#get-your-account-api-token-on-smartflo)

### Get your Account API Token (on Smartflo)

Log in to the [Smartflo dashboard](https://smartflo.tatateleservices.com/) and open **API Connect** in the left navigation menu. Copy your **Account API Token**.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#enter-and-save-on-voice-agents)

### Enter and save on Voice Agents

In Voice Agents, go to **Deploy → Phone Numbers → Add Connection**, select **Smartflo**, paste the token, and click **Save**. The connection now appears under **Deploy → Phone Numbers**.

* * *

## Configure Smartflo’s dashboard

Configure voice streaming so Smartflo sends call audio to your Sarvam agent, then generate the Click to Call API Key you’ll use when adding numbers.

### Set up the voice streaming endpoint

[1](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#open-voice-settings)

### Open Voice settings

Go to **Settings → Channels** and open the **Voice** section.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#open-voice-streaming)

### Open Voice Streaming

Within the Voice section, open the **Voice Streaming** tab.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#add-the-wss-endpoint)

### Add the WSS endpoint

Add a new endpoint and set the WSS URL to:

```
wss://apps.sarvam.ai/api/app-runtime/channels/smartflo/call
```

[4](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#save)

### Save

Save the endpoint.

### Get the Click to Call API Key

You’ll need this key when adding numbers on Voice Agents.

[1](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#open-click-to-call-support-api)

### Open Click to Call Support API

In **API Connect → Click to Call Support API**, copy an existing key, or click **Generate API Key** to create one.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#configure-the-key)

### Configure the key

When creating or configuring the key:

-   Under **My Numbers**, select the numbers you’ll use on Voice Agents.
-   Set **Destination Type** to **Voice Streaming**.
-   Select the voice streaming endpoint you created above.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#copy-the-key)

### Copy the key

Copy the **Click to Call API Key** — you’ll paste it alongside each number when adding it on Voice Agents.

* * *

## After connecting

Once both sides are configured:

[1](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#add-your-phone-number)

### Add your phone number

In Voice Agents, open your Smartflo connection under **Deploy → Phone Numbers**, add the number, and provide its **Click to Call API Key** when prompted. See [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers).

[2](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#route-calls-to-an-agent)

### Route calls to an agent

For incoming calls, create an [Inbound deployment](https://docs.sarvam.ai/conversations/deploy/inbounds) to route the number to an agent. To dial out, add the number to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns).

[3](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo#verify-with-a-test-call)

### Verify with a test call

Place a test call to (or from) the number and confirm your agent connects. See [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers) for the test-call steps.

**Outbound calling** uses this same connection and the Click to Call API Key — dial out by adding the number to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns).

## Next

[

Manage Phone Numbers

Add your number and route it to an agent.







](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers)[

All providers

See other providers.







](https://docs.sarvam.ai/conversations/deploy/telephony/bring-your-own)
