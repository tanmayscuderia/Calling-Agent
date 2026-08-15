# Campaign details

Source: https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-details

Click any campaign on the [Campaigns page](https://docs.sarvam.ai/conversations/deploy/campaigns) to open its detail page. This is where you track a launched campaign — its results, contacts, and schedule.

## Headline metrics

Three metrics sit at the top of the page:

| Metric | What it measures |
| --- | --- |
| **Audience size** | The total contacts enrolled in the campaign — the **valid records** across all its cohorts. Valid records are the contacts that remain after each uploaded CSV is validated. |
| **Completion rate** | Of the enrolled contacts, the share that reached a **terminal status**. A contact is complete once it either connects and finishes the conversation, or exhausts all of its configured retries. |
| **Pick-up rate** | The share of contacts that answered — your connectivity rate. |

**How completion is counted.** With five retries configured, a contact is counted as complete when it connects on any attempt, or when all five attempts are used up.

## Call distribution

A graph of calls over time, split into **Connected**, **No answer**, **Busy**, and **Failed**. Change the window with **12h**, **24h**, or **All time**.

## Cohorts

Every [cohort](https://docs.sarvam.ai/conversations/deploy/campaigns/cohorts) uploaded to the campaign, with its upload status, **valid records**, **invalid records**, and upload time. On a running campaign (active, scheduled, or in progress), an **Add cohort** button lets you queue more contacts — see [Add a cohort](https://docs.sarvam.ai/conversations/deploy/campaigns/cohorts#add-a-cohort).

## Schedules

The per-contact call schedule: the calls that have already gone out and the calls still scheduled. Each row shows the (hashed) phone number, status, failure reason, and last attempt. Filter by status to narrow the list.

## Configuration

To inspect the agent behind the campaign, click **View details**. A panel shows the **Campaign ID** and **App ID**, plus the **Configuration**:

-   The **Agent** and its version.
-   The **Connection** and the numbers it dials from.
-   The **Schedule**.
-   The **Retries** pattern.

On an active campaign this panel is read-only. To change it, [pause the campaign](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-lifecycle) first.

## Where to go next

[

Campaign lifecycle

Pause, edit, resume, or cancel a running campaign.







](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-lifecycle)[

Agent Analytics

Dig deeper into connect rates, engagement, and call logs.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics)
