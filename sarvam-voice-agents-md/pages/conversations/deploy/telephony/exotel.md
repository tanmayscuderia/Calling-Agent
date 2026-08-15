# Exotel

Source: https://docs.sarvam.ai/conversations/deploy/telephony/exotel

Connect your Exotel account to Voice Agents for inbound and outbound voice calling.

Setup has two parts: add your Exotel credentials on Voice Agents, then configure the call flow on Exotel’s dashboard.

**Before you start:** an active Exotel account with admin access to its dashboard, at least one **Exophone** (Exotel’s term for a virtual phone number), and Voice Agents access with permission to add telephony connections (**Deploy → Phone Numbers**).

## Watch the setup

Connecting your Exotel account to Voice Agents, end to end.

## Add the connection on Voice Agents

Voice Agents needs four values from your Exotel account — the **Account SID**, **API Key**, **API Token**, and **Base URL**. Get them from the [Exotel dashboard](https://my.exotel.com/), then enter them on Sarvam.

[1](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#get-your-account-sid-on-exotel)

### Get your Account SID (on Exotel)

In the Exotel dashboard, go to **Settings → API Settings** and copy the **Account SID**.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#get-your-api-key-on-exotel)

### Get your API Key (on Exotel)

On the same page, under **API Credentials**, copy the **API Key**. Click **Create** to generate one if it doesn’t exist yet.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#get-your-api-token-on-exotel)

### Get your API Token (on Exotel)

Copy the **API Token** shown alongside the API Key.

The API Token is shown only once when generated. Save it immediately.

[4](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#find-your-base-url-on-exotel)

### Find your Base URL (on Exotel)

The Base URL is the API domain for your Exotel account’s region. India accounts use `api.in.exotel.com`; Singapore accounts use `api.exotel.com`. Confirm yours from the domain in your Exotel dashboard URL, or on the **API Credentials** page (top of your dashboard, or under **Developer Settings**).

[5](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#enter-and-save-on-voice-agents)

### Enter and save on Voice Agents

In Voice Agents, go to **Deploy → Phone Numbers → Add Connection**, select **Exotel**, and enter all four values — **Account SID**, **API Key**, **API Token**, and **Base URL** — then click **Save**. The connection now appears under **Deploy → Phone Numbers**.

* * *

## Configure the call flow on Exotel

Create an Exotel App that routes incoming calls to your Sarvam agent, then assign it to your Exophone.

[1](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#create-a-new-app)

### Create a new App

In the Exotel dashboard, open **App Bazaar** and click **Create** to add a new App. Give it a recognizable name (e.g. `sarvam-prod`).

[2](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#add-the-voicebot-applet)

### Add the Voicebot applet

In the App flow editor, drag the **Voicebot** applet into the **Call Start** flow. (If you don’t see it, search for “Voicebot” in the applet list.)

[3](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#configure-the-websocket-url)

### Configure the WebSocket URL

In the Voicebot applet, under **“Which bot you want to connect the enduser?”**, enter the Sarvam endpoint that streams call audio to your agent:

```
https://apps.sarvam.ai/api/app-runtime/channels/exotel
```

[4](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#set-recording-options)

### Set recording options

Configure the recording settings (recommended defaults):

| Setting | Value |
| --- | --- |
| **Record this?** | Checked |
| **Recording Channels?** | Single |
| **Recording Format?** | MP3 |
| **Encrypt DTMF?** | Unchecked |

[5](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#save-the-app)

### Save the App

Save and close the App editor.

[6](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#assign-to-your-exophone)

### Assign to your Exophone

Go to **My Numbers**, open the Exophone you want to use with Sarvam, and assign this App to it. Save the assignment.

* * *

## After connecting

Once both sides are configured:

[1](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#add-your-phone-number)

### Add your phone number

In Voice Agents, open your Exotel connection under **Deploy → Phone Numbers** and add the Exophone number. See [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers).

[2](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#route-calls-to-an-agent)

### Route calls to an agent

For incoming calls, create an [Inbound deployment](https://docs.sarvam.ai/conversations/deploy/inbounds) to route the number to an agent. To dial out, add the number to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns).

[3](https://docs.sarvam.ai/conversations/deploy/telephony/exotel#verify-with-a-test-call)

### Verify with a test call

Place a test call to the number and confirm your agent answers. See [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers) for the test-call steps.

**Outbound calling** uses this same connection — dial out by adding the number to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns). No separate credentials are required.

## Next

[

Manage Phone Numbers

Add your number and route it to an agent.







](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers)[

All providers

See other providers.







](https://docs.sarvam.ai/conversations/deploy/telephony/bring-your-own)
