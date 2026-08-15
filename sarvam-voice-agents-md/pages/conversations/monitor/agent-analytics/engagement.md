# Engagement

Source: https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement

Engagement is a tab under **Monitor → Agent Analytics**. Of the calls that connected, it measures how many became real conversations. Use it when connect rates look healthy but callers leave shortly after the greeting. For reachability problems that occur before a connect, use [Connectivity](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity).

A conversation is counted as **Engaged** when it has **more than 3 turns**. This filters out hang-ups, IVR-only calls, and one-line refusals.

![Engagement tab showing engagement rate, average call duration, average attempts to engage, and end-to-end latency KPIs, an engagement trend chart, a full pipeline funnel from attempted to connected to engaged, and an engagement-by-language table.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/4510d69c04e84cf63dcf5d617ea527be4ea80d9e6a424d560fe530affe7c4176/voice-agents/images/agent-analytics-engagement.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T054055Z&X-Amz-Expires=604800&X-Amz-Signature=511708f29b74ca089a8f777d847a8585004e3ee9c18513d04c0edd63e8a13521&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Engagement tab

## When to use Engagement

Engagement is most useful when:

-   The connect rate is healthy but conversations still feel shallow.
-   One language connects well but drops after a single turn.
-   Latency between turns feels high.
-   The funnel looks fine through Connected, then collapses at Engaged.

## KPI tiles

Each tile summarizes the selected period. Use the **\# / %** toggle to switch rate tiles between count and percentage.

| Tile | Meaning |
| --- | --- |
| **Engagement rate** | Engaged ÷ connected. In **#** mode: engaged conversation count |
| **Avg call duration** | Average call length across attempts |
| **Avg attempts to engage** | Total attempts ÷ engaged conversations |
| **End-to-end latency** | Average end-to-end response latency in conversations (ms) |

## Charts and insights

| Widget | What it shows |
| --- | --- |
| **Trend** | Time series for the selected KPI |
| **Full Pipeline Funnel** | Attempted → Connected → Engaged (counts or %) |
| **Engagement by Language** | Language mix, engagement rate, and 1-turn drop-off |
| **Engagement insights** | Hour of day, attempt count, turn distribution, and duration distribution |

The duration distribution buckets calls in roughly 10-second increments up to 5 minutes, then groups longer calls as **\>5 min**.

## How to investigate

[1](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement#read-the-funnel-first)

### Read the funnel first

A drop at Attempted → Connected is a reachability problem; investigate it in [Connectivity](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity). A drop at Connected → Engaged is a conversation problem, so stay on this tab.

[2](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement#compare-languages)

### Compare languages

A high connect rate with low engagement in one language often indicates voice, prompt, or ASR issues for that language.

[3](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement#check-turn-and-duration-shape)

### Check turn and duration shape

The turn and duration distributions separate early hang-ups from deeper conversations before you open any logs.

[4](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement#open-short-connected-calls)

### Open short connected calls

Sample them in [Call Logs](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs), then use [Log Analyser](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser) to examine the greeting turn.

## Next

[

Connectivity

Diagnose whether dials are reaching people.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity)[

Call Logs

Inspect individual connected calls.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs)[

Log Analyser

Debug conversations at the turn level.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser)
