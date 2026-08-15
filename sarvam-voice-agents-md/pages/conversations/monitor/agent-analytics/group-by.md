# Group by

Source: https://docs.sarvam.ai/conversations/monitor/agent-analytics/group-by

Group by is a tab under **Monitor → Agent Analytics**. It lets you slice the same connectivity metrics by a chosen dimension: campaign, agent, language, bot number, or an agent variable. Use it when the Overview looks healthy in aggregate but you need to identify which campaign, number, or language is dragging the numbers down.

![Group by tab showing a table grouped by campaign, with attempts, connected, connectivity rate, unique recipients, unique connects, average duration, average turns, bot latency, average retry attempts per connect, and goal achieved columns.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/ea9468090ff2cb31d6b0c867484cc8442da726f6309e2b4459f2b3b13ec2bc08/voice-agents/images/agent-analytics-group-by.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091909Z&X-Amz-Expires=604800&X-Amz-Signature=33087d77f052237ec2b500d195544ec6fe7260620ac802ab8dbbf1eecb026c9f&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Group by tab

## When to use Group by

Group by is most useful when:

-   One campaign looks healthy in Overview but you suspect another is failing.
-   You want connectivity by bot number without relying on the Connectivity tab’s phone-health table alone.
-   You are comparing languages or agents side by side.
-   You need a rollup by a custom agent variable, which requires a single-agent selection.

## Choose a dimension

The dimension you select determines what a single row represents:

| Dimension | What each row is |
| --- | --- |
| **Campaign** | One campaign (includes an **Agent** column when the campaign maps to an agent) |
| **Agent** | One agent |
| **Language** | One language |
| **Bot number** | One outbound bot number |
| **Agent variable** | One value of a selected agent variable, available only when exactly **one agent** is selected in the toolbar |

The default dimension is **Campaign**. Changing the dimension resets the table to page 1.

**Agent variable** stays disabled until a single agent is selected. If you switch back to All Agents while that dimension is active, the tab falls back to Campaign.

## Columns

Every row shares the same metric columns:

| Column | Meaning |
| --- | --- |
| _\[Dimension\]_ | Campaign name, agent name, language, bot number, or variable value |
| **Agent** | Shown when grouping by campaign |
| **Attempts** | Total dial attempts |
| **Connected** | Connected calls |
| **Connectivity Rate** | Connected ÷ attempts |
| **Unique Recipients** | Distinct end users contacted |
| **Unique Connects** | Distinct users who connected |
| **Avg Duration** | Average connected-call duration |
| **Avg Turns** | Average conversation turns |
| **Bot Latency** | Average agent response latency |
| **Avg Retry Attempts per Connect** | Average retries needed per successful connect |

The default sort is **Attempts** descending. Click a column header to re-sort. The table is paginated.

## How to use Group by

[1](https://docs.sarvam.ai/conversations/monitor/agent-analytics/group-by#set-the-same-toolbar-filters-as-overview)

### Set the same toolbar filters as Overview

Choose agents, campaigns, and a date range first. Group by respects the shared Agent Analytics filters.

[2](https://docs.sarvam.ai/conversations/monitor/agent-analytics/group-by#pick-a-dimension)

### Pick a dimension

Start with **Campaign** or **Bot number** for outbound health. Use **Language** when engagement or connect quality differs by locale.

[3](https://docs.sarvam.ai/conversations/monitor/agent-analytics/group-by#sort-on-the-metric-that-moved)

### Sort on the metric that moved

If connectivity fell, sort by **Connectivity Rate**. If volume concentrated somewhere unexpected, sort by **Attempts**.

[4](https://docs.sarvam.ai/conversations/monitor/agent-analytics/group-by#confirm-with-call-logs)

### Confirm with Call Logs

Open [Call Logs](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs) with the same filters and sample rows from the underperforming group before you change the agent or campaign.

## Next

[

Connectivity

Break down failure reasons and phone-number health.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity)[

Engagement

Explore the funnel and conversation depth.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement)[

Call Logs

Inspect the calls behind an underperforming group.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs)
