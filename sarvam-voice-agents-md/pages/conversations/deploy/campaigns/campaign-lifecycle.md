# Campaign lifecycle

Source: https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-lifecycle

A campaign’s lifecycle is the set of states it moves through after you launch it — from waiting to dial, through live calling, to finished or cancelled. You use lifecycle actions when you need to change a running campaign, stop dialing for a while, or end it early.

Editing is only allowed before a campaign is running, or while it is paused. On an active campaign, change the configuration with **Pause → Edit → Save → Resume**.

## States

| State | What it means | Editable? |
| --- | --- | --- |
| **Scheduled** | Created with a future start time, waiting for its window to begin. | Yes |
| **Active** | Live and dialing. | No — pause first |
| **Paused** | Suspended — in-progress calls finish, no new calls start. | Yes |
| **Ended** | All contacts have been dialed (including retries). Terminal — no further actions. | No |
| **Cancelled** | Manually stopped. Terminal — the campaign can’t be resumed. | No |

Scheduled and Active campaigns appear on the **Active campaigns** tab of the [Campaigns page](https://docs.sarvam.ai/conversations/deploy/campaigns). Ended and Cancelled move to **Past campaigns**.

## Pause, edit, and resume

Use this flow whenever you need to change a live campaign — for example to switch the **agent version**, adjust the schedule, or update retries.

[1](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-lifecycle#pause)

### Pause

On the [campaign detail page](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-details), open the **Actions** menu and choose **Pause**. In-progress calls finish; no new calls start.

[2](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-lifecycle#edit-and-save)

### Edit and save

With the campaign paused, edit the configuration (including the agent version), then save. Editing while calls are in flight is intentionally blocked.

[3](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-lifecycle#resume)

### Resume

From **Actions**, choose **Resume**. The campaign picks up the remaining contacts with the updated configuration.

Always **Pause → Edit → Save → Resume**. Do not try to edit an active campaign.

## Actions

On any non-terminal campaign, the **Actions** menu (top-right of the [detail page](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-details)) exposes these lifecycle controls:

| Action | When it’s available | What it does |
| --- | --- | --- |
| **Add cohort** | Scheduled, Active, or Paused | Queue more contacts onto the campaign. See [Add a cohort](https://docs.sarvam.ai/conversations/deploy/campaigns/cohorts#add-a-cohort). |
| **Pause** | Active | Suspend dialing. In-progress calls finish; no new calls start. |
| **Resume** | Paused | Restart dialing with the current (possibly edited) configuration. |
| **Cancel campaign** | Scheduled, Active, or Paused | Stop the campaign permanently. This is a terminal state — it can’t be resumed. |

## Where to go next

[

Campaign details

Track metrics, cohorts, and schedules on a launched campaign.







](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-details)[

Cohorts

Add more contact batches to a running campaign.







](https://docs.sarvam.ai/conversations/deploy/campaigns/cohorts)[

Create a campaign

Launch a new outbound campaign with the four-step wizard.







](https://docs.sarvam.ai/conversations/deploy/campaigns/create-campaign)[

Best practices

Launch safely and protect your number health.







](https://docs.sarvam.ai/conversations/deploy/campaigns/best-practices)
