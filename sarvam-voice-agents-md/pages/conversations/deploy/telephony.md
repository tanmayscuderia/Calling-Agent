# Phone Numbers

Source: https://docs.sarvam.ai/conversations/deploy/telephony

Telephony is how your agents make and receive phone calls.

Before your agent can pick up or dial a phone, you need phone lines. These come from a **telephony provider** (for example, Exotel or Twilio), which supplies the phone numbers and carries the calls. You can connect a provider account you already have, or rent one or more numbers directly from Sarvam.

Open **Deploy → Phone Numbers**.

![The Phone Numbers page for a Sarvam Vobiz connection, with Total/Active/Archived summary cards and a table of phone numbers.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/12ebc68866612aadd1853a14b6eace22cab0463f459ae1544d0ce6b4e5c6b8b4/voice-agents/images/telephony-phone-numbers.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091909Z&X-Amz-Expires=604800&X-Amz-Signature=1c2ab786444bde3ac7d5f8f8efd914c1e815533177b3dfb9716d18d4cdcec306&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Phone Numbers: manage connections and numbers under Deploy.

## How telephony fits together

Everything builds up from a connection:

| Building block | What it is |
| --- | --- |
| **Connection** | The link between Sarvam and a telephony provider. This is what actually carries your calls. You set it up once. |
| **Number** | A phone number that lives under a connection — the number people dial, or the one your agent dials from. |
| **Group** | An optional bundle of numbers you can assign together instead of one at a time. |

Once you have numbers, you decide how they’re used: **[Inbounds](https://docs.sarvam.ai/conversations/deploy/inbounds)** to answer incoming calls, or **[Campaigns](https://docs.sarvam.ai/conversations/deploy/campaigns)** to dial out to a list.

## Two ways to connect

[

Bring Your Own Telephony

Already have an Exotel, Twilio, Smartflo, Pulse, Intalk, or Vobiz account? Connect it to Sarvam and use your existing numbers.







](https://docs.sarvam.ai/conversations/deploy/telephony/bring-your-own)[

Rent from Sarvam

No provider account needed. Rent numbers directly inside Voice Agents, Sarvam handles the telephony for you.







](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam)

Not sure which to pick? If you don’t already run a telephony provider, **Rent from Sarvam** is the fastest way to get a working number. Choose **Bring Your Own** if you already have provider accounts and numbers you want to reuse.

## Guides

[

Manage Phone Numbers

Assign numbers to agents, reassign, or release.







](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers)[

Groups

Bundle numbers so calls spread across them, callers see a local number, and you can swap numbers in and out easily.







](https://docs.sarvam.ai/conversations/deploy/telephony/groups)

## Quick reference

| I want to… | Go to |
| --- | --- |
| Connect my Exotel account | [Exotel setup](https://docs.sarvam.ai/conversations/deploy/telephony/exotel) |
| Connect my Twilio account | [Twilio setup](https://docs.sarvam.ai/conversations/deploy/telephony/twilio) |
| Connect my Smartflo account | [Smartflo setup](https://docs.sarvam.ai/conversations/deploy/telephony/smartflo) |
| Connect my Pulse account | [Pulse setup](https://docs.sarvam.ai/conversations/deploy/telephony/pulse) |
| Connect my Intalk account | [Intalk setup](https://docs.sarvam.ai/conversations/deploy/telephony/intalk) |
| Connect my own Vobiz account | [Vobiz setup](https://docs.sarvam.ai/conversations/deploy/telephony/vobiz) |
| Get numbers without a provider | [Rent from Sarvam](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam) |
| Manage my numbers | [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers) |
| Receive incoming calls | [Inbounds](https://docs.sarvam.ai/conversations/deploy/inbounds) |
| Dial an audience | [Campaigns](https://docs.sarvam.ai/conversations/deploy/campaigns) |
| Bundle numbers for a campaign | [Groups](https://docs.sarvam.ai/conversations/deploy/telephony/groups) |
