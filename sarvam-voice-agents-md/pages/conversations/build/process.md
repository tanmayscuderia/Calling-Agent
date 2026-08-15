# Building & improving agents

Source: https://docs.sarvam.ai/conversations/build/process

Building a production agent is a loop, not a one-shot. This page lays out the path from a first draft to a deployed agent you keep improving with real traffic.

[1](https://docs.sarvam.ai/conversations/build/process#build-the-first-version)

### Build the first version

Start with a [single-state agent](https://docs.sarvam.ai/conversations/build/single-state-agents): a clear [instruction](https://docs.sarvam.ai/conversations/build/system-prompt), a [voice and language](https://docs.sarvam.ai/conversations/build/voice-language), and only the [tools](https://docs.sarvam.ai/conversations/build/tools) the core flow needs. Resist adding states or tools you can’t yet test.

[2](https://docs.sarvam.ai/conversations/build/process#review--test-the-prompt)

### Review & test the prompt

Test every change before it ships:

-   **test agent**: talk to the agent live and listen for turn-taking, language, and tone.
-   **Simulate**: run scripted / simulated conversations to check behaviour repeatably.

[3](https://docs.sarvam.ai/conversations/build/process#set-up-outcome-variables)

### Set up outcome variables

Define the [output variables](https://docs.sarvam.ai/conversations/build/variables-personalization) that capture what happened, disposition, resolution, collected fields, and the [goal](https://docs.sarvam.ai/conversations/build/process#goals) that judges success. These are what you’ll measure and improve against.

[4](https://docs.sarvam.ai/conversations/build/process#deploy)

### Deploy

Ship the agent to a channel, [telephony](https://docs.sarvam.ai/conversations/deploy/telephony), a web [widget](https://docs.sarvam.ai/conversations/deploy/deploy-with-code), or [code](https://docs.sarvam.ai/conversations/deploy/deploy-with-code), deliberately, from a tested config version.

[5](https://docs.sarvam.ai/conversations/build/process#set-up-key-metrics--dashboards)

### Set up key metrics & dashboards

Wire up [Agent Analytics](https://docs.sarvam.ai/conversations/monitor/agent-analytics) and build the [boards](https://docs.sarvam.ai/conversations/monitor/boards) you’ll watch: connectivity, engagement, outcomes, and the business metric that actually matters.

[6](https://docs.sarvam.ai/conversations/build/process#improve)

### Improve

Use call logs, transcripts, and outcome metrics to find where the agent fails, tighten the prompt or tools, re-test, and roll forward. Repeat.

## Goals

A **goal** is the success criterion for an agent. It powers automated conversation evaluation against both live and test agent traffic, and its results feed the [Goals dashboard](https://docs.sarvam.ai/conversations/monitor/agent-analytics/goals) in Agent Analytics.

You can set **one goal per agent**. Keep it focused on the single business outcome that defines success; use [Agent Analytics](https://docs.sarvam.ai/conversations/monitor/agent-analytics) for broader operational metrics.

### Rule-based conditions

A goal is built from rules that check conversation outcomes - for example whether a required variable was set, whether a disposition matches an expected value, or whether a numeric score clears a threshold.

| Operator | Meaning |
| --- | --- |
| `equals` | Exact match |
| `not_equals` | Not equal |
| `in` | Value is in a set |
| `gt` | Greater than |
| `lt` | Less than |

Additional operators may appear in the dashboard as the evaluation system expands.

### See the results

Once a goal is configured, every connected call is evaluated against it. The outcomes appear in the [Goals tab](https://docs.sarvam.ai/conversations/monitor/agent-analytics/goals) under Agent Analytics - achievement rate, achieved-vs-not cohorts, and the patterns that correlate with success.
