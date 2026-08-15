# Connectivity

Source: https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity

Connectivity is a tab under **Monitor → Agent Analytics**. It answers a single question: are your dials reaching people? The tab reports how reliably dial attempts turn into connected calls, which lets you separate a reachability problem from a conversation-quality problem.

Open this tab when calls are not being answered, rather than when the agent is handling conversations poorly. To investigate conversation quality after a connect, use [Engagement](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement).

![Connectivity tab showing calls attempted, connectivity rate, unique users, average attempts to connect, and failure percentage KPIs, a connectivity trend chart, a phone number health table, and connectivity insights by hour of day.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/2d7240c43fedffde2e6feeb460fb638b900a1f2ea53ff30472807664716069fe/voice-agents/images/agent-analytics-connectivity.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T052142Z&X-Amz-Expires=604800&X-Amz-Signature=8c1902a0817aa775b87bdbca580dcc6bdf5f71e6fa12c9833c98681c8e4db8e2&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Connectivity tab

## When to use Connectivity

Connectivity is most useful when:

-   The connectivity rate is falling while attempts stay high.
-   One bot number is underperforming the others.
-   It takes too many dials to reach a single connect.
-   Failures cluster around credits, DND, busy, or carrier errors.

## KPI tiles

Each tile summarizes the selected period. Use the **\# / %** toggle to switch rate tiles between count and percentage.

| Tile | Meaning |
| --- | --- |
| **Calls attempted** | All attempts, including not-picked and failed |
| **Connectivity rate** | Connected ÷ attempted. In **#** mode: connected count |
| **Total unique users** | Distinct end-user phone numbers contacted (a number dialed five times still counts once) |
| **Avg attempts to connect** | Total attempts ÷ connected calls |
| **Failure %** | Share of attempts that failed (credits, telephony error, DND, outside business hours, and similar). In **#** mode: failure count |

## Charts and insights

###### Trend

###### Phone Number Health

###### Insights

A time series for the selected KPI. Granularity can be set to Day, Week, Month, or Quarter.

## How to investigate

[1](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity#check-the-rate-before-the-volume)

### Check the rate before the volume

High attempts with a falling connectivity rate usually point to number health, timing, or provider issues rather than prompt quality.

[2](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity#inspect-phone-number-health)

### Inspect phone-number health

Compare bot numbers, and fix or rotate the weakest one first.

[3](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity#use-the-insights-views)

### Use the insights views

The hour-of-day and attempt-count breakdowns show whether to adjust dial windows or retry policy.

[4](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity#sample-failed-rows-in-call-logs)

### Sample failed rows in Call Logs

Open [Call Logs](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs), keep the same filters, and review the **Failure Reason** on a few examples.

## Next

[

Engagement

See whether connected calls become real conversations.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement)[

Group by

Compare connectivity across campaigns, agents, languages, or bot numbers.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/group-by)[

Call Logs

Inspect the individual calls behind a connectivity dip.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs)
