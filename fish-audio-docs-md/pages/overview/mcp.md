# MCP Server

Source: https://docs.fish.audio/overview/mcp

The Fish Audio MCP server gives AI agents direct access to your Fish Audio account: they can browse the voice library, generate speech, and transcribe audio for you.

-   **Endpoint**: `https://api.fish.audio/mcp` (streamable HTTP)
-   **Authentication**: OAuth. Your MCP client opens a browser window and you sign in with your Fish Audio account — no API key required.
-   **Billing**: usage draws from your plan’s package credits, exactly like the [web app](https://fish.audio/app). It does not consume developer API credits.

## 

[​

](https://docs.fish.audio/overview/mcp#connect)

Connect

-   Claude Code
    
-   Claude.ai
    
-   Cursor
    
-   Codex CLI
    
-   Windsurf
    

```
claude mcp add --transport http fish-audio https://api.fish.audio/mcp
```

Run `/mcp` inside Claude Code to sign in, then ask “Generate a short greeting with a warm English voice.”

Go to **Settings → Connectors → Add custom connector** and enter `https://api.fish.audio/mcp`. Claude walks you through the sign-in.

Open the command palette (`Cmd/Ctrl+Shift+P`) → “Open MCP settings” → “Add custom MCP”, and add:

```
{
  "mcpServers": {
    "fish-audio": { "url": "https://api.fish.audio/mcp" }
  }
}
```

Cursor prompts you to sign in on first use.

```
codex mcp add fish-audio https://api.fish.audio/mcp
codex mcp login fish-audio
```

`codex mcp login` opens the browser sign-in. Verify with `codex mcp list`.

Go to `Settings → Cascade → MCP Servers → View raw config` (`~/.codeium/windsurf/mcp_config.json`) and add:

```
{
  "mcpServers": {
    "fish-audio": { "url": "https://api.fish.audio/mcp" }
  }
}
```

## 

[​

](https://docs.fish.audio/overview/mcp#try-it)

Try it

Once connected, ask in plain language — the agent picks the right tools:

## Narrate a script

“Find a calm English narration voice and read intro.md aloud — give me the audio link.”

## Voice casting

“Show me the three most popular Japanese voices and play their samples.”

## Transcribe a recording

“Transcribe meeting.mp3 and summarize the action items.” (the agent uploads the file, then transcribes it)

## Check spend

“How many Fish Audio credits do I have left?”

In coding agents like Claude Code and Codex, tools compose with the shell: the agent can download the generated audio URL with `curl`, upload local recordings for transcription, or batch-generate a directory of scripts.

## 

[​

](https://docs.fish.audio/overview/mcp#good-to-know)

Good to know

-   Add audio tags in square brackets inside the text to control delivery — `[whispering]`, `[excited]`, `[laughing]`. Tags are performed, never spoken.
-   If no voice is specified, a curated default voice for the requested language is used.
-   Generated audio is returned as a permanent URL; failed generations are refunded.
-   Local files can be transcribed too — the agent uploads them to a temporary slot that is deleted automatically after 7 days.

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/overview/mcp.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/overview/mcp)
