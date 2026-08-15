# Agent Analytics

Source: https://docs.sarvam.ai/conversations/monitor/agent-analytics

Agent Analytics is the dashboard for monitoring voice agent performance.

Use it to track whether calls are connecting, whether conversations progress, and to open any call when a metric looks wrong.

Open **Monitor → Agent Analytics**.

![Agent Analytics Overview with shared filters, KPI tiles, trend chart, and call outcomes.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/c9b6a7220d5acee4c2a9a904f83359f055e85b4486e191901de23af09fddbc88/voice-agents/images/agent-analytics-overview.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091909Z&X-Amz-Expires=604800&X-Amz-Signature=30f515ba6e1821bbda30269a542aa4b7b1939e1a59fbee57377320a0347a38d0&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Agent Analytics Overview

## The tabs

Agent Analytics is organized into tabs, each answering a different question about performance.

[

Overview

Period health check: attempts, connect rate, latency, and short calls.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/overview)[

Connectivity

Dial success, unique users, bot-number health, and failure reasons.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity)[

Engagement

Whether connected calls become real conversations (>3 turns).







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement)[

Tools

Custom-tool call volume, errors, and latency, with a per-tool breakdown.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/tools)[

Goals

Goal achievement rate, and what separates achieved calls from the rest.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/goals)[

Group by

Break down metrics by campaign, agent, language, bot number, or variable.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/group-by)[

Call Logs

Find a call, open its transcript, and export the results to a spreadsheet.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs)

For turn-level debugging, open a call from Call Logs and use [Log Analyser](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser).

## Set your scope

The toolbar at the top sets the scope for every tab. Configure it once before reading the charts, as the settings apply across all of Agent Analytics.

[1](https://docs.sarvam.ai/conversations/monitor/agent-analytics#agents)

### Agents

Pick one agent, or leave **All Agents**.

[2](https://docs.sarvam.ai/conversations/monitor/agent-analytics#campaigns)

### Campaigns

Narrow to a campaign, or leave **All Campaigns**.

[3](https://docs.sarvam.ai/conversations/monitor/agent-analytics#date-range)

### Date range

Choose the window. Time-of-day defaults span the full day.

[4](https://docs.sarvam.ai/conversations/monitor/agent-analytics#filters-optional)

### Filters (optional)

Add field-level conditions such as equals, contains, and greater than. Available fields depend on your organization, and agent variables can appear here too.

[5](https://docs.sarvam.ai/conversations/monitor/agent-analytics#---toggle)

### \# / % toggle

On Overview, Connectivity, and Engagement, switch rate tiles between count and percent.

## How to investigate

A typical investigation starts broad and narrows based on what the data shows. You do not need to open every tab for a routine check.

[1](https://docs.sarvam.ai/conversations/monitor/agent-analytics#start-on-overview)

### Start on Overview

Review attempts, picked-up rate, and short calls. If these look healthy, a routine check is complete.

[2](https://docs.sarvam.ai/conversations/monitor/agent-analytics#follow-the-failure-mode)

### Follow the failure mode

-   Connects look weak → [Connectivity](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity)
-   Connects look fine, but conversations are short → [Engagement](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement)
-   The aggregate looks fine, but one campaign, number, or language is off → [Group by](https://docs.sarvam.ai/conversations/monitor/agent-analytics/group-by)

[3](https://docs.sarvam.ai/conversations/monitor/agent-analytics#sample-real-calls)

### Sample real calls

Open [Call Logs](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs) with the **same** agents, campaigns, and dates, then review a few examples before changing the agent.

[4](https://docs.sarvam.ai/conversations/monitor/agent-analytics#debug-the-turn)

### Debug the turn

From Call Log Details, select the message that failed and open [Log Analyser](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser) to inspect ASR, tools, and variables.

## Where to go next

[

Boards

Build a custom report when you need a metric Agent Analytics does not show.







](https://docs.sarvam.ai/conversations/monitor/boards)[

SQL best practices

SQL dialect guidance, schema browsing, and AI query generation.







](https://docs.sarvam.ai/conversations/monitor/clickhouse-sql-best-practices)
