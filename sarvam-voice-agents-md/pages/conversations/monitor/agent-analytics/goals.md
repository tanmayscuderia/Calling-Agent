# Goals

Source: https://docs.sarvam.ai/conversations/monitor/agent-analytics/goals

Goals is a tab under **Monitor → Agent Analytics**. It shows whether your agents are meeting their configured goals, and compares the calls that met the goal against those that did not — so you can see which call patterns correlate with success.

Open **Monitor → Agent Analytics** and select the **Goals** tab.

The Goals tab appears only when the selected agent has a [goal](https://docs.sarvam.ai/conversations/build/process#goals) configured, and is available for voice agents. Each agent can have one goal; if none of the selected agents have a goal configured, the tab prompts you to pick one.

## What counts as a goal

| Term | Meaning |
| --- | --- |
| **Goal-eligible call** | A connected call that was evaluated against the goal (passed, failed, or not evaluated) |
| **Goal achieved** | A goal-eligible call where the goal was met (passed) |
| **Goal achievement rate** | Goal achieved ÷ goal-eligible, as a percentage |

## KPI tiles

| Tile | Meaning |
| --- | --- |
| **Goal achievement rate** | Share of goal-eligible calls where the goal was met, with the achieved-of-eligible counts alongside |
| **Avg turns to goal** | Average number of conversation turns on goal-achieved calls, with the not-achieved cohort shown for comparison |

## Achieved vs not achieved

Two side-by-side cohorts — **Goal achieved** and **Goal not achieved** — compare the calls that met the goal against those that didn’t. Each cohort shows its call count and share of goal-eligible calls, plus:

| Metric | Meaning |
| --- | --- |
| **Avg call duration** | Average length of a call in the cohort |
| **Avg turns per call** | Average conversation turns in the cohort |
| **Avg latency** | Average agent response latency in the cohort |

The **Goal not achieved** cohort also shows how far each metric differs from the achieved cohort, so you can see whether failed calls run longer, take more turns, or respond more slowly.

## Breakdowns

| Chart | What it shows |
| --- | --- |
| **Turn distribution by cohort** | How achieved and not-achieved calls spread across turn buckets (1, 2, 3–4, 5–8, 9+) |
| **Language split by cohort** | Achievement compared across the top languages |
| **Goal achievement by time of day** | Achievement rate by hour of day (IST), with the peak and trough hours called out |
| **TTS voice × goal rate** | Achievement rate per speaker voice, to see which voice performs best |
| **Intro message × goal rate** | Achievement rate per opening line, ranked, to see which intro converts best |

## How to use Goals

[1](https://docs.sarvam.ai/conversations/monitor/agent-analytics/goals#start-with-the-achievement-rate)

### Start with the achievement rate

Read the **Goal achievement rate** for the period. Use the achieved-of-eligible count to judge how much data it is based on.

[2](https://docs.sarvam.ai/conversations/monitor/agent-analytics/goals#compare-the-two-cohorts)

### Compare the two cohorts

Check whether not-achieved calls run longer, take more turns, or have higher latency than achieved calls.

[3](https://docs.sarvam.ai/conversations/monitor/agent-analytics/goals#look-for-patterns)

### Look for patterns

Use the turn, language, time-of-day, voice, and intro breakdowns to find what correlates with success.

[4](https://docs.sarvam.ai/conversations/monitor/agent-analytics/goals#confirm-on-real-calls)

### Confirm on real calls

Open [Call Logs](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs) with the same filters and review a few not-achieved calls before changing the agent.

## Where to go next

[

Engagement

Check whether connected calls become real conversations.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement)[

Call Logs

Open the individual calls behind the goal numbers.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs)[

Overview

Return to the period-level health check.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/overview)
