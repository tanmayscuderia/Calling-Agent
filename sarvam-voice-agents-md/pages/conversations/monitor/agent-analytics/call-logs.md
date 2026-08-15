# Call Logs

Source: https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs

**Call Logs** is the row-level history of every call your agents have handled. It lives under **Monitor → Agent Analytics → Call Logs**.

Use it to locate the exact call behind a change in connect rate or engagement, open its transcript and metadata, and then continue to [Log Analyser](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser) for turn-level detail.

![Call Logs table with interaction rows, connectivity, language, duration, and failure reason columns.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/8b26fbbdfef695dce2beb0b7fe413742bf4b5617c89764146969bda2a2269652/voice-agents/images/call-logs.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091909Z&X-Amz-Expires=604800&X-Amz-Signature=c48acab844167a3665033bf9969b73ef779d273f902fafba782b6ce1dc53fd0d&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Call Logs

## What you can do

1.  **Find a call** - filter by campaign, contact, failure reason, or test agent traffic.
2.  **Open its details** - click a row to view the transcript and metadata.
3.  **Debug a turn** - click a message to open Log Analyser.

## Filter the table

The shared toolbar filters (Agents, Campaigns, Date range, Filters) still apply. Call Logs adds a few controls of its own:

| Control | Behavior |
| --- | --- |
| **All / Connected** | Restrict to connected calls when you only care about conversations that started |
| **Show only test agent calls** / **Show all calls** | Include or exclude debug / test agent traffic |
| **Column visibility** | Show or hide table columns |
| **CSV export** | Available when a single agent is selected |
| **Clear all views** | Resets viewed-row highlighting |

Default sort is newest first. Click any column header to re-sort. Text filters support equals / contains / starts with; number filters support comparisons.

## How to review a call

[1](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs#keep-the-same-scope-as-your-chart)

### Keep the same scope as your chart

If Overview showed a change for a specific agent and date, apply the same filters here so the signal carries over.

[2](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs#review-several-examples-before-concluding)

### Review several examples before concluding

Open multiple rows that share a failure reason or a short duration. A single unusual call is not a reliable pattern.

[3](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs#open-call-log-details)

### Open Call Log Details

###### Transcript

###### Overview

Full conversation. Click a message, or the **Conversation Initiated** / **Conversation Ended** chips, to open [Log Analyser](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser).

[4](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs#hand-off-to-log-analyser)

### Hand off to Log Analyser

Use Call Logs to **find** the call, then use [Log Analyser](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser) to **explain** what happened during a turn.

![Unified View Details panel open on the Transcript tab, showing the agent and caller conversation with an audio player at the bottom.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/1de6cb724d0e15dbd4f40811695c0c1ca169278a803be62756dfc8b9b74bbe29/voice-agents/images/agent-analytics-call-detail.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091909Z&X-Amz-Expires=604800&X-Amz-Signature=db0e81e234a0cfd844b756968f1e9f5518acd49b0655f4ab76222bb9b5f66516&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Call detail (Unified View Details): transcript and recording.

## Column reference

Visible labels can vary by org. Expand a group when you need the dictionary.

###### Identity & routing

| Column | Meaning |
| --- | --- |
| **Interaction ID** | Unique ID for the call |
| **Campaign ID** | Outbound campaign (often shown as the name) |
| **Cohort ID** | Cohort within a campaign |
| **App Version** | Agent / app version |
| **Source Type** | How the call was originated |
| **User ID** | End-user identifier |
| **Bot Contact** | Bot / outbound phone number |
| **User Contact** | Caller or callee phone number |

###### Outcome & quality

| Column | Meaning |
| --- | --- |
| **Connectivity** | Whether the call connected |
| **Completion Status** | Completion / outcome status |
| **Language** | Detected or selected language |
| **Duration (s)** | Call duration in seconds |
| **Messages** | Number of messages / turns |
| **Avg Agent Resp (s)** | Average agent response time |
| **Avg User Resp (s)** | Average user response time |
| **Failure Reason** | Why a dial failed to connect |
| **End Reason** | Why a connected call ended |

###### Channel & extras

| Column | Meaning |
| --- | --- |
| **Channel Type** | Channel classification |
| **Channel Direction** | Inbound or outbound |

You may also see start/end datetime, job ID, retry attempts, provider type, Test Call / Live badges, agent variables, and goal status when configured for your org.

## Next

[

Log Analyser

Open a call for turn-level debugging of transcripts, tool calls, and end state.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser)[

Connectivity

Investigate connect failures across many calls before drilling into a single one.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity)[

Engagement

Track how long callers stay and how far conversations progress.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement)[

Agent Analytics

Return to the aggregate dashboards and trends.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/overview)
