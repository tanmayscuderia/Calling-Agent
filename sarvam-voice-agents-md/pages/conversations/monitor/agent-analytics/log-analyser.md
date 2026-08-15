# Log Analyser

Source: https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser

**Log Analyser** is the deep-dive view for a single conversation. It lives under **Monitor → Agent Analytics** and opens from a call in [Call Logs](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs).

Open it once you have identified a call that failed and need to understand why a specific turn went wrong. From [Call Log Details](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs), click a transcript message or a lifecycle chip.

Until you select a turn, the view shows its empty state: **Select a transcript message to view log details.**

![Log Analyser view with the transcript on the left and, for the selected turn, User (ASR text, audio, language, confidence, ASR context), Agent (LLM input and output), and TTS (text, language, speaker, voice settings) cards on the right.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/6771d67e049d8ad5f6b8ecd4aa054517055c014bd242a4aba564917a47bfbc4a/voice-agents/images/log-analyser.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091909Z&X-Amz-Expires=604800&X-Amz-Signature=bb5d31c438bebe9e6912d4d31eb0c195af5dbe0730bb9cc68fba0461aacafa13&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Log Analyser

## What you can inspect

-   **Config at start** — the speaker, ASR model, and language in effect when the call began.
-   **ASR quality** — transcript text, confidence, audio waveform, and ASR context.
-   **Tool activity** — the exact inputs and outputs of each tool call, rather than the agent’s paraphrase of them.
-   **End state** — final variables, disposition flags, and open questions.

## Cards by moment in the call

###### Conversation Initiated

###### User turn

###### Agent turn

###### Conversation Ended

| Card | Contents |
| --- | --- |
| **Agent** | TTS Speaker, ASR Model, Language |
| **Variables** | Starting values, with **NEW** / **CHANGED** badges when relevant |
| **Server Logs** | Startup lifecycle events |

## How to debug a bad turn

[1](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser#start-at-conversation-initiated)

### Start at Conversation Initiated

Confirm the speaker, ASR model, and language before attributing a problem to a later turn.

[2](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser#compare-transcript-text-with-audio)

### Compare transcript text with audio

On user turns, review the waveform and confidence together. Low confidence combined with incorrect text usually indicates an ASR or language-switch issue.

[3](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser#inspect-tool-calls-before-rewriting-the-prompt)

### Inspect tool calls before rewriting the prompt

If the agent responded incorrectly after a lookup, open **Tool Call** and verify the arguments and output first.

[4](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser#check-end-state-variables)

### Check end-state variables

Confirm the conversation collected the values your CRM or on-end hook expects, and review which flags were set.

Call Logs finds the conversation; Log Analyser explains the turn. For aggregate patterns, start on the dashboards below, then sample a few calls here.

## Next

[

Call Logs

Return to the row-level history to find another call to inspect.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/call-logs)[

Connectivity

Investigate connect failures across many calls.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/connectivity)[

Engagement

Track how long callers stay and how far conversations progress.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/engagement)[

Agent Analytics

See aggregate dashboards and trends across your agents.







](https://docs.sarvam.ai/conversations/monitor/agent-analytics/overview)
