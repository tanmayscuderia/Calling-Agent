# Create a campaign

Source: https://docs.sarvam.ai/conversations/deploy/campaigns/create-campaign

From **Deploy → Campaigns**, click **Create Campaign** to open the **Schedule campaign** wizard. It has four steps — **Agent**, **Recipients**, **Schedule**, and **Review & Launch** — shown as tabs across the top, with a **Step X of 4** counter at the bottom. Move forward with **Next** and back with **Back**; your progress is kept as you move between steps.

Closing the wizard before you launch prompts **Discard campaign?** — all progress is lost and the action can’t be undone. Choose **Keep editing** to return, or **Discard** to abandon it.

[1](https://docs.sarvam.ai/conversations/deploy/campaigns/create-campaign#agent)

### Agent

Choose what runs the campaign and where it dials from:

-   **Campaign name** — a clear name for the campaign.
-   **Select agent** — the agent, plus the committed **Version** to run.
-   **Connections** — pick a telephony **Connection**, then the **Phone numbers** to dial from. Toggle **By number** to choose individual numbers, or **By group** to use a whole [group](https://docs.sarvam.ai/conversations/deploy/telephony/groups).

Click **Next** to continue.

[2](https://docs.sarvam.ai/conversations/deploy/campaigns/create-campaign#recipients)

### Recipients

Upload your contact list (cohort) and map its columns to the agent’s variables.

-   **Upload cohort** — drop in a CSV. Each row must include a phone number plus any details your agent uses during the call. Use **Download Sample** if you need the expected format.
-   **Cohort name** — a name for this batch of contacts. (A [cohort](https://docs.sarvam.ai/conversations/deploy/campaigns/cohorts) is the batch you upload; every campaign starts with one and you can add more later.)
-   **Map phone number and agent variables to columns** — match each agent field to a CSV column. **Preview sample row** shows the mapped values for one row; use **Random** / **Pick random row** to spot-check different rows.

The mapping table has a row per field:

| Column | What it does |
| --- | --- |
| **Field** | The agent variable to fill (for example `Phone Number`, `developer_name`, `gender`). |
| **CSV column** | The column from your file to pull the value from — search the list, or set **None** to leave it unmapped. |
| **Required** | Marks the field as mandatory. **Phone Number** is always required. |
| **Formatting functions** | An optional transform applied to the raw CSV value before the call (see below). |
| **Preview** | The resulting value for the previewed row. |

###### Formatting functions

Add a transform under **Formatting functions → Add** to clean or reshape a column before it reaches the agent:

-   **Indian Currency** — format a number as Indian currency.
-   **Date** — normalize a date value.
-   **String Replace** — find and replace within the text.
-   **String Strip** — trim surrounding whitespace.
-   **String Capitalize** — capitalize the value.
-   **Indian State Language Map** — map an Indian state to its language.
-   **Format Language Name** — normalize a language name.

###### Override default values

Expand **Override default values** to map CSV columns onto per-contact conversation defaults — **Initial message**, **Initial state**, and **Initial language**. Left as **None**, each call uses the agent’s configured default; map a column to personalize it per contact.

Click **Validate** to check the file and mapping before continuing. Validation reports how many rows are **valid** versus **removed**.

[3](https://docs.sarvam.ai/conversations/deploy/campaigns/create-campaign#schedule)

### Schedule

Set when the campaign runs and how it retries:

-   **Campaign period** — **Start date time** (**Now**, or a **Custom** date and time) and **End date time** (**Today**, or **Custom**). Starting **Now** kicks off roughly two minutes after scheduling.
-   **Attempts per second** — the dialing rate (calls placed each second). Defaults to `2`. Dialing too aggressively can flag your numbers as spam — start low and watch [Connectivity](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity). See [Dialing rate & concurrency](https://docs.sarvam.ai/conversations/deploy/campaigns/dialing-rate) for how this interacts with concurrency and your plan limits.
-   **Allowed days** — the days of the week the campaign may dial.
-   **Calls allowed between** — the daily time window (for example `09:00 am`–`06:00 pm`).
-   **Retry configuration** — a toggle. Leave it **off** to dial each contact once; turn it **on** to retry unanswered contacts (see below).
-   **Advanced → Webhook URL** — an optional endpoint that receives an event as each call finishes.

###### Retry configuration

With retries **on**:

-   **Max retries** — `0`–`20` (default `3`).
-   **Retry interval** — minutes between attempts (default `30`). Tick **Customize interval per attempt** to set a different gap for each attempt.
-   **Retry on** — which outcomes trigger a retry:

| Outcome | Notes |
| --- | --- |
| **Busy** | Line was busy. |
| **No Answer** | Rang but wasn’t picked up. |
| **Failed** | The call failed to connect. |
| **Short Duration** | Connected but ended too quickly — set the **threshold (seconds)** below which it counts as short. |
| **Provider Error** | A telephony-provider error — set its own **Max retries** and **Interval (min)**. |
| **Internal Error** | A system-side error — set its own **Max retries** and **Interval (min)**. |

[4](https://docs.sarvam.ai/conversations/deploy/campaigns/create-campaign#review--launch)

### Review & Launch

A read-only summary of every step — **Agent** (agent and version, campaign name, connection, phone numbers), **Recipients** (file, valid/removed row counts, mappings), and **Schedule** (period, allowed time, days, CPS, retries). Expand a section to double-check the details.

Optionally run a **Test dial** (below), then tick **I have reviewed this campaign and I am ready to launch** and click **Launch**.

## Test dial

On the **Review & Launch** step, **Test dial** (_optional but recommended_) places an instant outbound call to a few internal numbers so you can verify the agent works end-to-end before going live.

-   Test calls dial **from this campaign’s numbers**, but **don’t count toward campaign metrics**.
-   The agent uses the variables from **one cohort row** — the previewed row is shown, and **Pick random row** swaps it. Complete the cohort mapping first, otherwise no preview variables are available.
-   Under **Test numbers**, select up to **5** numbers (or **Add a number**), then click **Place test calls**.

Start with a low **Attempts per second** and a small cohort, place a **Test dial** to confirm the agent behaves, then watch [Connectivity](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity) for the first hour before scaling up. See [Best practices](https://docs.sarvam.ai/conversations/deploy/campaigns/best-practices) for the full launch checklist.

## Where to go next

[

Cohorts

Add more contact batches to a running campaign.







](https://docs.sarvam.ai/conversations/deploy/campaigns/cohorts)[

Campaign details

Track metrics, cohorts, and schedules once it’s live.







](https://docs.sarvam.ai/conversations/deploy/campaigns/campaign-details)
