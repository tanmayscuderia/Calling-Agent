# Vobiz

Source: https://docs.sarvam.ai/conversations/deploy/telephony/vobiz

Connect your own Vobiz account to Voice Agents for inbound and outbound voice calling.

Setup has two parts: add your Vobiz credentials on Voice Agents, then create a voice application on Vobiz’s platform.

Don’t have a Vobiz account? You don’t need one. Use [Rent from Sarvam](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam) instead — Sarvam manages everything for you, with no provider setup required.

**Before you start:** an active Vobiz account with admin access to its platform, at least one Vobiz phone number, and Voice Agents access with permission to add telephony connections (**Deploy → Phone Numbers**).

## Watch the setup

Connecting your Vobiz account to Voice Agents, end to end.

## Add the connection on Voice Agents

Voice Agents needs two account-level values from Vobiz — your **Auth ID** and **Auth Token**.

[1](https://docs.sarvam.ai/conversations/deploy/telephony/vobiz#get-your-auth-token-and-auth-id-on-vobiz)

### Get your Auth Token and Auth ID (on Vobiz)

Log in to the Vobiz platform. In the left panel, go to **Voice → Voice Applications** and open the **Overview** tab — your account’s **Auth Token** and **Auth ID** are shown there.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/vobiz#enter-and-save-on-voice-agents)

### Enter and save on Voice Agents

In Voice Agents, go to **Deploy → Phone Numbers → Add Connection**, select **Vobiz**, enter both values, and click **Save**. The connection now appears under **Deploy → Phone Numbers**.

* * *

## Create the voice application on Vobiz

Create a voice application that links incoming calls to your Sarvam agent, then attach your numbers to it.

[1](https://docs.sarvam.ai/conversations/deploy/telephony/vobiz#open-voice-applications)

### Open Voice Applications

In the Vobiz platform, go to **Voice → Voice Applications** and switch to the **Applications** tab.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/vobiz#create-a-new-application)

### Create a new application

Click **Create New Application** and enter:

| Field | Value |
| --- | --- |
| **Name** | Your choice (e.g. `sarvam-prod`) |
| **Answer URL** | `https://apps.sarvam.ai/api/app-runtime/v1/channels/vobiz` |
| **Hangup URL** | `https://apps.sarvam.ai/api/app-runtime/v1/channels/vobiz` |
| **HTTP method** | POST (for both URLs) |

The Answer URL and Hangup URL use the same Sarvam endpoint by design — Sarvam handles both call events at that address.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/vobiz#save-the-application)

### Save the application

Save the application.

[4](https://docs.sarvam.ai/conversations/deploy/telephony/vobiz#attach-phone-numbers)

### Attach phone numbers

Once the application is created, attach the phone numbers you want to use to it.

Phone numbers you add on Voice Agents must also be attached to this voice application on Vobiz. Both sides need to know about the number.

* * *

## After connecting

Once both sides are configured:

[1](https://docs.sarvam.ai/conversations/deploy/telephony/vobiz#add-your-phone-numbers)

### Add your phone numbers

In Voice Agents, open your Vobiz connection under **Deploy → Phone Numbers** and add the numbers. See [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers).

[2](https://docs.sarvam.ai/conversations/deploy/telephony/vobiz#route-calls-to-an-agent)

### Route calls to an agent

For incoming calls, create an [Inbound deployment](https://docs.sarvam.ai/conversations/deploy/inbounds) to route each number to an agent. To dial out, add the numbers to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns).

[3](https://docs.sarvam.ai/conversations/deploy/telephony/vobiz#verify-with-a-test-call)

### Verify with a test call

Place a test call to (or from) a number and confirm your agent connects. See [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers) for the test-call steps.

**Outbound calling** uses this same connection — dial out by adding the numbers to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns). No separate credentials are required.

## Next

[

Manage Phone Numbers

Add your numbers and route them to agents.







](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers)[

All providers

See other providers.







](https://docs.sarvam.ai/conversations/deploy/telephony/bring-your-own)
