# Overview tab

Source: https://docs.sarvam.ai/conversations/monitor/agent-analytics/overview

The Overview tab provides a period-level health check for your voice agents. In a single screen it shows volume, connect rate, latency, and early hang-ups without opening a transcript.

Open **Monitor → Agent Analytics** and select the **Overview** tab.

![Overview tab showing KPI tiles (calls attempted, connected calls, latency, average call duration, total minutes, short calls), a trend chart, a call outcomes donut, top failure reasons, and an agents overview table.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/59fa197793b3f5850cd30bbdeff75166a47a4df1c84afa032d2b3c59c7c4593e/voice-agents/images/agent-analytics-overview-tab.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T054053Z&X-Amz-Expires=604800&X-Amz-Signature=c61031b9de818c665d1ddf60cc9b2ee325c5352fa2ac6bd07dc90c9e77891435&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Overview tab

## Questions Overview answers

-   How many calls did we attempt, and how many connected?
-   Did latency or average duration move the wrong way?
-   Are too many connected calls ending after a single turn?
-   Which agents or campaigns carry volume and connectivity?

## KPI tiles

Click a tile to drive the trend chart below. Use the **\# / %** toggle to switch rate tiles between count and percent.

| Tile | Meaning |
| --- | --- |
| **Calls attempted** | All dial attempts in the period, including not-picked and failed |
| **Picked-up rate** | Connected ÷ attempted. In **#** mode this shows connected call count |
| **Latency** | Average agent response latency on connected calls (ms) |
| **Avg call duration** | Average length of a connected call |
| **Total minutes** | Billable audio minutes. Each call is rounded to the nearest minute, then summed |
| **Short calls** | Share of connected calls that ended after a single turn, an early drop-off signal |

A **Goal achievement** tile appears when a selected agent has a goal configured.

## Charts on this tab

| Chart | What it shows |
| --- | --- |
| **Trend** | Time series for the selected KPI (Day / Week / Month / Quarter) |
| **Call outcomes** | Answered, Not picked, Busy, Failed, Other, total attempts in the center |
| **Top failure reasons** | Ranked reasons calls failed to connect |
| **Agents / Campaign overview** | Rollups for volume, connectivity, unique users, duration, turns, latency, retries |

## How to use Overview

[1](https://docs.sarvam.ai/conversations/monitor/agent-analytics/overview#read-the-headline-tiles)

### Read the headline tiles

Start with **Calls attempted**, **Picked-up rate**, and **Short calls**. Large moves here usually mean a telephony, prompt, or campaign change is worth investigating.

[2](https://docs.sarvam.ai/conversations/monitor/agent-analytics/overview#separate-didnt-answer-from-couldnt-dial)

### Separate “didn't answer” from “couldn't dial”

Use **Call outcomes** and **Top failure reasons**. Not picked is different from a carrier or credits failure.

[3](https://docs.sarvam.ai/conversations/monitor/agent-analytics/overview#find-which-entity-moved)

### Find which entity moved

Open the Agents or Campaign tables when the aggregate number looks wrong but you don’t know who caused it.

[4](https://docs.sarvam.ai/conversations/monitor/agent-analytics/overview#confirm-with-real-calls)

### Confirm with real calls

If a metric still looks suspicious, open [Call Logs](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs) with the same filters and sample a few rows before changing the agent.

## Where to go next

[

Connectivity

Dig into dial success and phone-number health.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity)[

Engagement

Check whether connected calls become real conversations.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement)[

Call Logs

Inspect individual calls.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs)
