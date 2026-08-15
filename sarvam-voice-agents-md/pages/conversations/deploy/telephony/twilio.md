# Twilio

Source: https://docs.sarvam.ai/conversations/deploy/telephony/twilio

Connect your Twilio account to Voice Agents for inbound and outbound voice calling.

Setup has two parts: add your Twilio credentials on Voice Agents, then point your Twilio number’s webhook at Sarvam.

**Before you start:** an active Twilio account with Console access, at least one **voice-capable** Twilio phone number, and Voice Agents access with permission to add telephony connections (**Deploy → Phone Numbers**). A _webhook_ is simply the URL Twilio calls when someone dials your number — here it points to Sarvam.

## Watch the setup

Connecting your Twilio account to Voice Agents, end to end.

## Add the connection on Voice Agents

Voice Agents needs two values from your Twilio account — the **Account SID** and **Auth Token**. Get them from the [Twilio Console](https://console.twilio.com/), then enter them on Sarvam.

[1](https://docs.sarvam.ai/conversations/deploy/telephony/twilio#get-your-account-sid-on-twilio)

### Get your Account SID (on Twilio)

On the Console dashboard, find the **Account Info** section. The **Account SID** is shown at the top — copy it.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/twilio#get-your-auth-token-on-twilio)

### Get your Auth Token (on Twilio)

In the same **Account Info** section, the **Auth Token** is below the Account SID. Click **Show** to reveal it, then copy it.

Treat the Auth Token like a password. Don’t share it, and regenerate it in the Console if it’s ever exposed.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/twilio#enter-and-save-on-voice-agents)

### Enter and save on Voice Agents

In Voice Agents, go to **Deploy → Phone Numbers → Add Connection**, select **Twilio**, paste both values, and click **Save**. The connection now appears under **Deploy → Phone Numbers**.

* * *

## Configure the webhook on Twilio

Point your Twilio phone number at Sarvam so incoming calls route to your agent.

[1](https://docs.sarvam.ai/conversations/deploy/telephony/twilio#open-your-number)

### Open your number

In the Twilio Console, go to **Phone Numbers → Manage → Active numbers** and click the number you want to set up.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/twilio#configure-the-webhook)

### Configure the webhook

Scroll to **Voice Configuration**. Under **A call comes in**, set:

| Setting | Value |
| --- | --- |
| **A call comes in** | Webhook |
| **URL** | `https://apps.sarvam.ai/api/app-runtime/channels/twilio` |
| **HTTP method** | HTTP POST |

Twilio occasionally renames Console labels. If you don’t see **A call comes in**, look for the equivalent **Webhook**/**Voice Configuration** field on the number’s page.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/twilio#save)

### Save

Click **Save configuration**. Inbound calls on this number now route to Sarvam.

* * *

## After connecting

Once both sides are configured:

[1](https://docs.sarvam.ai/conversations/deploy/telephony/twilio#add-your-phone-number)

### Add your phone number

In Voice Agents, open your Twilio connection under **Deploy → Phone Numbers** and add the number. See [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers).

[2](https://docs.sarvam.ai/conversations/deploy/telephony/twilio#route-calls-to-an-agent)

### Route calls to an agent

For incoming calls, create an [Inbound deployment](https://docs.sarvam.ai/conversations/deploy/inbounds) to route the number to an agent. To dial out, add the number to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns).

[3](https://docs.sarvam.ai/conversations/deploy/telephony/twilio#verify-with-a-test-call)

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
