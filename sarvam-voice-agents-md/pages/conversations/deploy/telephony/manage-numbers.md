# Manage Phone Numbers

Source: https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers

**Deploy → Phone Numbers** is the single place to see and manage every phone number across all your connections. This page covers how numbers get here, what you see, and what you can do with them.

![Phone Numbers page showing Total, Active, and Archived counts, plus a table of numbers with status, added, and updated columns.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/12ebc68866612aadd1853a14b6eace22cab0463f459ae1544d0ce6b4e5c6b8b4/voice-agents/images/telephony-phone-numbers.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091909Z&X-Amz-Expires=604800&X-Amz-Signature=1c2ab786444bde3ac7d5f8f8efd914c1e815533177b3dfb9716d18d4cdcec306&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Phone Numbers for a connection: summary counts and the numbers table.

## Add numbers

How a number gets into Sarvam depends on your connection type.

| Connection type | How numbers get in |
| --- | --- |
| **Rent from Sarvam** | Every number you [buy from the catalog](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam) appears here automatically — nothing else to do. |
| **Bring Your Own** | Import the numbers you want from your provider account (Exotel, Twilio, or any other). |

**Importing** pulls numbers from your provider into Sarvam. You pick which ones to bring — not necessarily all of them:

[1](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers#open-your-connection-and-click-import)

### Open your connection and click Import

On your Bring Your Own connection, click **Import**.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers#select-the-numbers-you-want)

### Select the numbers you want

You’ll see every number in your provider account — for example, all 100 numbers in your Exotel account. Select just the ones you want in Sarvam (say, 10 of them).

[3](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers#import)

### Import

The selected numbers are added and now appear in the list below.

## See your numbers

Each connection lists the numbers under it, with these columns:

| Column | What it shows |
| --- | --- |
| **Number** | The phone number |
| **Group** | The [group](https://docs.sarvam.ai/conversations/deploy/telephony/groups) this number belongs to, if any |
| **Status** | Whether the number is active or archived |
| **Added** | The date the number was added |
| **Updated** | The date of the last change (e.g. moving it to a group or archiving it) |

## Manage a number

###### Archive, then delete

Archive a number to take it out of active use. Once it’s archived, you can delete it.

###### Add it to a group

Bundle numbers together to assign and rotate them as a set. See [Groups](https://docs.sarvam.ai/conversations/deploy/telephony/groups).

###### Release or delete

How you remove a number depends on where it came from:

-   **Rent from Sarvam → Release.** You stop being charged for the number.
-   **Bring Your Own → Delete.** The number is removed from Sarvam only; you keep it in your provider account.

Before you archive, release, or delete a number, make sure no active inbound deployment or campaign is using it. Removing a number that’s in use causes dial failures.

## Put numbers to work

Once a number is active, route it based on the direction of the call:

| Direction | Where you set it up |
| --- | --- |
| **Inbound** | Create an [Inbound deployment](https://docs.sarvam.ai/conversations/deploy/inbounds) and assign the number (or [group](https://docs.sarvam.ai/conversations/deploy/telephony/groups)) to an agent |
| **Outbound** | Add the number (or group) to a [Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns) to dial from |

One number routes to one inbound deployment at a time. For outbound, the same number can be part of multiple campaigns (subject to concurrency limits).

## Next

[

Groups

Bundle numbers for load distribution and regional routing.







](https://docs.sarvam.ai/conversations/deploy/telephony/groups)[

Inbounds

Route incoming calls on your numbers to an agent.







](https://docs.sarvam.ai/conversations/deploy/inbounds)[

Campaigns

Use your numbers to dial an audience.







](https://docs.sarvam.ai/conversations/deploy/campaigns)
