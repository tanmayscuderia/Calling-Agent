# Rent from Sarvam

Source: https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam

Rent from Sarvam lets you provision phone numbers directly within Voice Agents, without an external telephony provider account, credentials, or provider-side configuration. Sarvam manages the underlying telephony for you through its native Vobiz integration.

## How it works

|  | Bring Your Own | Rent from Sarvam |
| --- | --- | --- |
| **Provider account** | You own and manage it | Sarvam manages it for you |
| **Phone numbers** | You bring existing numbers | You rent numbers in the dashboard |
| **Credentials** | You enter API keys, tokens, SIDs | None needed |
| **Provider-side setup** | Webhooks, WSS endpoints, voice apps | None needed |
| **Billing** | Through your provider | Through your Sarvam account |

* * *

## Set up the connection

[1](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam#open-add-connection)

### Open Add Connection

Go to **Deploy → Phone Numbers**, click **Add Connection**, and select **Rent from Sarvam**.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam#choose-your-account-type)

### Choose your account type

Select whether you’re an **Individual** or a **Corporate**, and enter your email ID.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam#complete-kyc)

### Complete KYC

Begin and complete the KYC verification. This is required before you can rent numbers.

[4](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam#purchase-your-first-number)

### Purchase your first number

Once KYC is approved, purchase your first phone number. Sarvam provisions the connection automatically — it appears under **Deploy → Phone Numbers** as **Sarvam Vobiz**.

* * *

## Rent a number

Once your connection is live, rent additional numbers at any time.

[1](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam#open-the-connection)

### Open the connection

Go to **Deploy → Phone Numbers** and open the **Sarvam Vobiz** connection.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam#open-the-number-catalog)

### Open the number catalog

Click **Buy Number** to see the catalog of available numbers. Use the search and filters (region, type) to narrow down the list.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam#buy-the-number)

### Buy the number

Select a number and click **Buy**. It’s provisioned instantly.

[4](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam#route-the-number)

### Route the number

Assign the number to an agent in an [Inbound deployment](https://docs.sarvam.ai/conversations/deploy/inbounds) for incoming calls, or add it to a [group](https://docs.sarvam.ai/conversations/deploy/telephony/groups) for outbound campaigns.

Rented numbers are billed through your Sarvam account. Check your plan for pricing and included allocations. To release a number and stop being billed for it, see [Manage Phone Numbers](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers).

* * *

## What’s next after renting?

[1](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam#route-numbers-to-agents)

### Route numbers to agents

Create an [Inbound deployment](https://docs.sarvam.ai/conversations/deploy/inbounds) to route incoming calls on rented numbers to an agent.

[2](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam#create-groups-for-campaigns)

### Create groups for campaigns

Bundle numbers into [groups](https://docs.sarvam.ai/conversations/deploy/telephony/groups) for outbound campaigns, automatic number rotation protects number health.

[3](https://docs.sarvam.ai/conversations/deploy/telephony/rent-from-sarvam#launch-a-campaign)

### Launch a campaign

Use your rented numbers (or groups) to run an outbound [campaign](https://docs.sarvam.ai/conversations/deploy/campaigns).

* * *

## FAQ

###### How much do these phone numbers cost?

Pricing depends on the number. Different numbers have different pricing, which you’ll see in the catalog on the UI when you browse available numbers.

###### What is the minimum duration I can purchase this for?

Numbers are rented for 30 calendar days. After that, the rental auto-renews unless you cancel it.

###### Do I need to add a credit card to purchase this?

No. The cost of the number is deducted from your Sarvam wallet.

###### I already have phone numbers in my Vobiz account. Can I use those?

Yes, but not through Rent from Sarvam. If you already have an existing Vobiz account, connect it as [Bring Your Own Telephony](https://docs.sarvam.ai/conversations/deploy/telephony/vobiz) instead.

###### When I call my number it says it doesn't exist. Why?

Numbers that start with `080` or `079` are **landline numbers**, not mobile numbers. They require a dialing prefix: add a `0` (national format) or `+91` (international format) before the number. Without the prefix, the carrier may report that the number does not exist.

## Next

[

Manage Phone Numbers

Assign, reassign, and release numbers.







](https://docs.sarvam.ai/conversations/deploy/telephony/manage-numbers)[

Groups

Bundle numbers for campaigns and routing.







](https://docs.sarvam.ai/conversations/deploy/telephony/groups)
