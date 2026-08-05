# AI Coding Agents

Source: https://docs.fish.audio/developer-guide/resources/coding-agents

Install the Fish Audio **agent skill**, and your coding agent — Claude Code, Cursor, Codex, and others — writes correct, current Fish Audio code: right method names, units, and error types, instead of guessing.

## 

[​

](https://docs.fish.audio/developer-guide/resources/coding-agents#install-the-skill)

Install the skill

```
npx skills add https://docs.fish.audio
```

This installs both Fish Audio skills into your agent (a canonical copy in `.agents/skills/`, with symlinks for Claude Code and Cursor). Run `npx skills update` later to refresh them.

## fish-audio-sdk

Python (`fish-audio-sdk`) and JavaScript (`fish-audio`) — exact method signatures and defaults, sync + async, model selection, and the real exception types.

## fish-audio-api

Raw REST + WebSocket for any language or edge runtime — auth, endpoints, MessagePack/JSON/multipart rules, and the streaming protocol.

### 

[​

](https://docs.fish.audio/developer-guide/resources/coding-agents#install-options)

Install options

```
npx skills add https://docs.fish.audio
```

Want to read them before installing? The skills are served at [/.well-known/agent-skills/index.json](https://docs.fish.audio/.well-known/agent-skills/index.json), with each skill’s markdown at `/.well-known/agent-skills/<name>/SKILL.md`.

## 

[​

](https://docs.fish.audio/developer-guide/resources/coding-agents#try-it)

Try it

Once installed, ask your agent in plain language — it will use the correct client, methods, and error types:

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

](https://docs.fish.audio/developer-guide/resources/coding-agents#or-connect-via-mcp)

Or connect via MCP

The [Fish Audio MCP server](https://docs.fish.audio/overview/mcp) at `https://api.fish.audio/mcp` gives your agent tools instead of docs: it can search the voice library, generate speech, and transcribe audio with your Fish Audio account (OAuth sign-in, no API key). See the [MCP server guide](https://docs.fish.audio/overview/mcp) for client setup and the tool list.

This site also exposes [llms.txt](https://docs.fish.audio/llms.txt) and [llms-full.txt](https://docs.fish.audio/llms-full.txt) for agents that fetch docs directly.

## 

[​

](https://docs.fish.audio/developer-guide/resources/coding-agents#next-steps)

Next steps

## Get your API key

Create a key and make your first request.

## Text to Speech

Voices, formats, streaming, and the direct API.

## API reference

Endpoints, parameters, and the OpenAPI schema.

## Errors

Status codes, retries, and SDK exception handling.

## 

[​

](https://docs.fish.audio/developer-guide/resources/coding-agents#support)

Support

-   **Technical support**: [support@fish.audio](mailto:support@fish.audio)
-   **Issues**: [GitHub](https://github.com/fishaudio)
-   **Community**: [Discord](https://discord.gg/dF9Db2Tt3Y)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/resources/coding-agents.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/resources/coding-agents)
