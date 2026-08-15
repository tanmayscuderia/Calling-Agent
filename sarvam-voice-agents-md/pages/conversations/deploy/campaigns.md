# Campaigns

Source: https://docs.sarvam.ai/conversations/deploy/campaigns

A campaign dials an audience for you. You upload a contact list, map personalization variables, set a schedule, and the campaign works through the list automatically — with retries, concurrency control, and live progress tracking.

Open **Deploy → Campaigns**.

**Outbound vs. inbound.** Campaigns are for **outbound** calling — your agent dials the audience (like appointment reminders or lead follow-ups). To answer **incoming** calls instead, use [Inbounds](https://docs.sarvam.ai/conversations/deploy/inbounds). They’re separate flows: a campaign needs a contact list and a schedule, while an inbound deployment just routes incoming numbers to an agent.

## Before you start

[1](https://docs.sarvam.ai/conversations/deploy/campaigns#set-up-telephony)

### Set up telephony

Add a [telephony connection](https://docs.sarvam.ai/conversations/deploy/telephony) and, ideally, a [group](https://docs.sarvam.ai/conversations/deploy/telephony/groups) so the campaign can rotate across numbers.

[2](https://docs.sarvam.ai/conversations/deploy/campaigns#prepare-a-contact-list)

### Prepare a contact list

A CSV with one contact per row — phone numbers plus any personalization fields your agent needs (name, account number, appointment date, and so on).

[3](https://docs.sarvam.ai/conversations/deploy/campaigns#have-a-configured-agent)

### Have a configured agent

Your agent must be configured and committed before you can schedule a campaign.

## The Campaigns page

The Campaigns page is your home base for outbound calling. When you open **Deploy → Campaigns**, the top of the page shows a **Calls / Concurrency** graph for the last 24 hours. Toggle between the two views and change the window with **1h**, **12h**, or **24h**:

-   **Calls** — the total number of calls placed across your campaigns over the period.
-   **Concurrency** — how many calls ran simultaneously, with the **peak concurrency** called out above the chart.

Below the graph, your campaigns are split across two tabs:

-   **Active campaigns** — everything currently running, paused, or scheduled. If you have no active campaigns, the page opens on **Past campaigns** instead.
-   **Past campaigns** — campaigns that have ended or been cancelled.

Each row in either tab shows the same columns:

| Column | Description |
| --- | --- |
| **Name** | The campaign name you set when creating it. |
| **Agent type** | The agent (or workflow) the campaign runs. |
| **Status** | The current [lifecycle state](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-lifecycle) — `Active`, `Paused`, or `Scheduled` on the Active tab; `Ended` or `Cancelled` on the Past tab. |
| **When** | When the campaign was launched. |

Use the search box to find a campaign by name, and the two dropdowns to filter by **status** and by **time** — **All time**, **This week**, **This month**, or a custom **date range**.

## What you can do from here

From the Campaigns page you take one of two actions — **create a new campaign**, or **open an existing one to view its details**. The **DND list** button (top-right) opens your org-wide suppression list, which applies across every campaign.

[

Create a campaign

Launch a new outbound campaign with the four-step wizard.







](https://docs.sarvam.ai/conversations/deploy/campaigns/create-campaign)[

Campaign details

Open a launched campaign to track metrics, cohorts, and schedules.







](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-details)[

Cohorts

Understand the contact batches that make up a campaign’s audience.







](https://docs.sarvam.ai/conversations/deploy/campaigns/cohorts)[

Dialing rate & concurrency

How attempts per second (CPS) and concurrency shape a campaign.







](https://docs.sarvam.ai/conversations/deploy/campaigns/dialing-rate)[

Campaign lifecycle

States and actions — pause, edit, resume, and cancel.







](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-lifecycle)[

Do Not Disturb (DND)

The org-wide suppression list applied to every campaign.







](https://docs.sarvam.ai/conversations/deploy/campaigns/dnd)[

Best practices

How to launch safely and protect your number health.







](https://docs.sarvam.ai/conversations/deploy/campaigns/best-practices)

## Where to go next

[

Inbounds

Route incoming calls to an agent.







](https://docs.sarvam.ai/conversations/deploy/inbounds)[

Phone Numbers

Set up connections, rent numbers, and create groups.







](https://docs.sarvam.ai/conversations/deploy/telephony)[

Agent Analytics

Monitor campaign performance — connect rates, engagement, and call logs.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics)[

Voicemail detection

Configure what happens when a voicemail box answers.







](https://docs.sarvam.ai/conversations/build/conversation-settings)
