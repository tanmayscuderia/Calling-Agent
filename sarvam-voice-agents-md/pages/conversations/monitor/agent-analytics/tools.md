# Tools

Source: https://docs.sarvam.ai/conversations/monitor/agent-analytics/tools

Tools is a tab under **Monitor → Agent Analytics**. It shows how your agent’s custom tools are performing — call volume, errors, latency, and a per-tool breakdown — so you can tell whether a tool is failing or slow before it affects live conversations.

Open **Monitor → Agent Analytics** and select the **Tools** tab.

The Tools tab is available for voice agents. It reports on the custom tools your agent calls, not built-in platform actions.

![Tools tab showing tool calls, tools invoked, errors, error rate, median latency, and p95 latency KPIs, a per-tool table with calls, errors, error rate, and latency, plus error-type and tool-latency breakdowns.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/ab999010e947596337f9363302ef9e3115dc1cbe452154047a1b284b52b24bd9/voice-agents/images/agent-analytics-tools.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091910Z&X-Amz-Expires=604800&X-Amz-Signature=ae3d9c542ba2535f5c43663f5a265d0982cbd57eee8c3ab28cd442ade1621f61&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Tools tab

## When to use Tools

-   A tool’s error rate is climbing and you want to find which one.
-   Tool latency is adding noticeable delay to the agent’s responses.
-   You want to confirm which tools are actually being called, and how often.

## KPI tiles

Each tile summarizes the selected period.

| Tile | Meaning |
| --- | --- |
| **Tool calls** | Total custom-tool attempts in the range |
| **Tools invoked** | Number of distinct tools that ran at least once |
| **Errors** | Tool-call failures in the range |
| **Error rate** | Errors as a percentage of tool calls |
| **Median latency** | Median (p50) tool latency, from dispatch to response (ms) |
| **p95 latency** | 95th-percentile tool latency, from dispatch to response (ms) |

## Tools called

A per-tool table, sorted by call volume by default.

| Column | Meaning |
| --- | --- |
| **Tool** | The custom tool name |
| **Calls** | How many times the tool was invoked |
| **Errors** | Failed calls for that tool |
| **Error rate** | Errors ÷ calls for that tool, highlighted when it reaches about 5% or higher |
| **p50 latency (ms)** | Median latency for that tool |
| **p95 latency (ms)** | 95th-percentile latency for that tool |

Latency is measured from tool dispatch to response.

## Error types

A breakdown of tool-call errors by type, ranked by frequency, with each type’s share of all tool errors. Use it to see whether failures cluster around one kind of error, for example a timeout or an exception from a single service.

## Tool latency

A per-tool latency breakdown ranked by p95, showing p50 and p95 side by side. Use it to spot the tools contributing the most delay to responses.

## How to investigate

[1](https://docs.sarvam.ai/conversations/monitor/agent-analytics/tools#scan-the-kpi-tiles)

### Scan the KPI tiles

Check the overall error rate and p95 latency first. If both look healthy, tools are not the problem.

[2](https://docs.sarvam.ai/conversations/monitor/agent-analytics/tools#find-the-offending-tool)

### Find the offending tool

Sort the **Tools called** table by error rate or p95 latency to see which tool is responsible.

[3](https://docs.sarvam.ai/conversations/monitor/agent-analytics/tools#classify-the-failure)

### Classify the failure

Use **Error types** to check whether the errors share a common cause.

[4](https://docs.sarvam.ai/conversations/monitor/agent-analytics/tools#confirm-on-a-real-call)

### Confirm on a real call

Open [Call Logs](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs) with the same filters, open a call, and use [Log Analyser](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser) to inspect the tool call on the turn where it failed.

## Where to go next

[

Log Analyser

Inspect tool calls turn by turn.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser)[

Call Logs

Find and open the calls behind a tool error.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs)[

Group by

Compare tool behavior across agents or campaigns.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/group-by)
