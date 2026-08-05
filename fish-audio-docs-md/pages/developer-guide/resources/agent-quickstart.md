# Agent Quickstart

Source: https://docs.fish.audio/developer-guide/resources/agent-quickstart

Install the Fish Audio **agent skill** and your coding agent — Claude Code, Cursor, Codex, and others — writes correct, current Fish Audio code: right method names, units, and error types, instead of guessing. Here’s the fastest path.

1

Install the skill

```
npx skills add https://docs.fish.audio
```

This installs both Fish Audio skills (a canonical copy in `.agents/skills/`, with symlinks for Claude Code and Cursor). Run `npx skills update` later to refresh them.

## fish-audio-sdk

Python (`fish-audio-sdk`) and JavaScript (`fish-audio`) — exact method signatures, sync + async, model selection, and the real exception types.

## fish-audio-api

Raw REST + WebSocket for any language — auth, endpoints, MessagePack/JSON/multipart rules, and the streaming protocol.

2

Set your API key

[Create a key](https://docs.fish.audio/developer-guide/getting-started/api-key) and export it — the code your agent writes reads it from the environment:

```
export FISH_API_KEY="your_api_key_here"
```

3

Ask your agent

Prompt in plain language — it uses the correct client, methods, and error types:

## TTS in a cloned voice

“Generate speech with Fish Audio in a cloned voice and save it to a file.”

## Transcribe with timestamps

“Transcribe `speech.wav` with Fish Audio and print the segments.”

## Stream from an LLM

“Stream an LLM’s tokens to Fish Audio TTS over the WebSocket.”

## Raw API, any language

“Call the Fish Audio TTS REST API from Go, no SDK.”

## 

[​

](https://docs.fish.audio/developer-guide/resources/agent-quickstart#install-options)

Install options

```
npx skills add https://docs.fish.audio
```

## AI Coding Agents — full guide

Targeting specific agents, the Fish Audio MCP server, and reading the skills before you install.

## 

[​

](https://docs.fish.audio/developer-guide/resources/agent-quickstart#next-steps)

Next steps

## Get your API key

Create a key and make your first request.

## Quick Start

Generate your first audio by hand, in any language.

## Text to Speech

Voices, formats, streaming, and the direct API.

## API reference

Endpoints, parameters, and the OpenAPI schema.

## 

[​

](https://docs.fish.audio/developer-guide/resources/agent-quickstart#for-autonomous-agents-&-rag-pipelines)

For autonomous agents & RAG pipelines

Not a coding agent installing a skill — an autonomous agent, RAG pipeline, or crawler? Start from these low-noise, machine-readable entry points:

-   [llms.txt](https://docs.fish.audio/llms.txt) — curated documentation index (read this first)
-   [llms-full.txt](https://docs.fish.audio/llms-full.txt) — broader context across the whole site
-   [OpenAPI](https://docs.fish.audio/api-reference/openapi.json) — REST schemas, parameters, and examples
-   [AsyncAPI](https://docs.fish.audio/api-reference/asyncapi.yml) — the WebSocket streaming protocol

Canonical API facts

-   Base API URL: `https://api.fish.audio`
-   Authentication: `Authorization: Bearer <FISH_API_KEY>`
-   TTS model selection: optional `model` header (`s1`, `s2-pro`, `s2.1-pro`, `s2.1-pro-free`). Recommended: `s2.1-pro` for production, `s2.1-pro-free` for the free developer tier. If omitted, the server uses `s2.1-pro`
-   Main REST endpoints:
    -   `POST /v1/tts`
    -   `POST /v1/asr`
    -   `GET /model`
    -   `POST /model`
    -   `GET /model/{id}`
    -   `PATCH /model/{id}`
    -   `DELETE /model/{id}`
-   Real-time streaming endpoint: `wss://api.fish.audio/v1/tts/live`

Retrieval order

1.  Read [llms.txt](https://docs.fish.audio/llms.txt) for the curated documentation index.
2.  Read [llms-full.txt](https://docs.fish.audio/llms-full.txt) when broad site context is needed.
3.  Read [OpenAPI](https://docs.fish.audio/api-reference/openapi.json) for REST schemas, parameters, and examples.
4.  Read [AsyncAPI](https://docs.fish.audio/api-reference/asyncapi.yml) for the WebSocket streaming protocol.
5.  Fetch individual `.md` pages only after narrowing to a specific task.

High-value URLs by task

**API specs**

-   [OpenAPI](https://docs.fish.audio/api-reference/openapi.json)
-   [AsyncAPI](https://docs.fish.audio/api-reference/asyncapi.yml)
-   [API Introduction](https://docs.fish.audio/api-reference/introduction.md)

**Auth & SDK setup**

-   [Python Authentication](https://docs.fish.audio/developer-guide/sdk-guide/python/authentication.md)
-   [JavaScript Authentication](https://docs.fish.audio/developer-guide/getting-started/api-key.md)
-   [Python SDK Overview](https://docs.fish.audio/api-reference/sdk/python/overview.md)
-   [JavaScript SDK Reference](https://docs.fish.audio/api-reference/sdk/javascript/api-reference.md)

**Core product tasks**

-   [Text to Speech Guide](https://docs.fish.audio/features/text-to-speech.md)
-   [Speech to Text Guide](https://docs.fish.audio/features/speech-to-text.md)
-   [Creating Voice Models](https://docs.fish.audio/features/voice-cloning.md)
-   [Emotion Control](https://docs.fish.audio/developer-guide/core-features/emotions.md)
-   [Fine-grained Control](https://docs.fish.audio/developer-guide/core-features/fine-grained-control.md)

**Real-time & integrations**

-   [WebSocket TTS Streaming](https://docs.fish.audio/api-reference/endpoint/websocket/tts-live.md)
-   [Real-time Streaming Best Practices](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming.md)
-   [Realtime Streaming (SDK)](https://docs.fish.audio/features/realtime-streaming.md)
-   [LiveKit Integration](https://docs.fish.audio/developer-guide/integrations/livekit.md)
-   [Pipecat Integration](https://docs.fish.audio/developer-guide/integrations/pipecat.md)

**Models, pricing & lifecycle**

-   [Models Overview](https://docs.fish.audio/developer-guide/models-pricing/models-overview.md)
-   [Choosing a Model](https://docs.fish.audio/developer-guide/models-pricing/choosing-a-model.md)
-   [Pricing & Rate Limits](https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits.md)
-   [Model Deprecations](https://docs.fish.audio/developer-guide/models-pricing/deprecations.md)

Task routing

-   **Generate speech** → Quick Start, the Text to Speech guide, and `POST /v1/tts`.
-   **Transcribe audio** → the Speech to Text guide and `POST /v1/asr`.
-   **Clone or manage voices** → Creating Voice Models and the `/model` endpoints.
-   **Stream audio in real time** → AsyncAPI, WebSocket TTS Streaming, and the realtime guides.
-   **Pick a model or estimate cost** → Models Overview and Pricing & Rate Limits.

Notes for agents

-   Prefer `openapi.json` and `asyncapi.yml` for machine-readable schemas.
-   Append `.md` to any page URL to fetch the human-authored page as plain Markdown.
-   Some richer pages use interactive MDX widgets. If a fetched page contains UI or component noise, fall back to `llms.txt`, `llms-full.txt`, or the API spec files.

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/resources/agent-quickstart.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/resources/agent-quickstart)
