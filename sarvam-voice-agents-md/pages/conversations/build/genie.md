# Genie

Source: https://docs.sarvam.ai/conversations/build/genie

Genie is the AI assistant built into Voice Agents that helps you build and refine agents - drafting prompts, suggesting improvements, and reviewing your configuration.

## Start from the Agents page

On **Build → Agents**, describe what your agent should do in the prompt box. Genie starts a session and drafts the agent for you. Use **Create from Scratch** if you prefer a blank canvas instead.

![The Agents page with the prompt "What should your agent do?", example text about a policy renewal reminder, Create from Scratch, and a Recents table.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/ece72fc4f618a55a0b8a4f72e3cb3acc4afcbf50e9b2008e44c472b18f64105b/voice-agents/images/agents-page.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091910Z&X-Amz-Expires=604800&X-Amz-Signature=dfc670d8b5d4c1d923fec2de47c785325169172dd7e9d6a5578c82e61a27fdba&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Build an agent with Genie from the Agents homepage.

## Sessions & context

Once you’re on the Canvas, open **Genie** from the top bar. Genie works against the agent you’re editing - it can see the current greeting, instructions, variables, tools, and settings, and suggests changes in that context.

Suggested prompts appear when you open the panel (for example, rename the agent, switch the voice, or attach a knowledge base). Type a request in **What’s on your mind?** to ask for a specific change.

![The Genie side panel open next to the Instructions editor, with suggested actions and a What's on your mind? input.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/17d737d0bdd99d14bc559b7a06d233830a651b935d35fcbd37ade488ba3103cb/voice-agents/images/system-prompt-initial-message.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091910Z&X-Amz-Expires=604800&X-Amz-Signature=88ea6119832e5d60351d466cd23c2ec76dac7a74e417c1b6ad7520e982a5a1b0&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Genie on the Canvas: suggested prompts and a free-text request field.

## Building and refining with Genie

Typical ways to use Genie:

1.  **Create** - describe the agent on the Agents page; Genie drafts the greeting and instructions.
2.  **Edit** - on the Canvas, ask Genie to rewrite a section, tighten the greeting, change language/voice, or add a knowledge base.
3.  **Inline** - in the instruction editor, select text and use _Describe a change_, or type `/` and ask Genie from the block menu. See [Navigating the build interface](https://docs.sarvam.ai/conversations/build/navigating-workspace).

## Suggestions and reviews

Genie also reviews your agent and surfaces suggestions you can act on:

-   **Suggestions**: flags issues and improvements across prompts, variables, and tools.
-   **Reviewing suggestions**: step through each suggestion and accept or dismiss it.
-   **View and hide suggestions**: toggle suggestions on or off to keep the canvas clean while you work.
-   **Inline editing**: apply a suggestion directly, or edit the proposed change before accepting it.
-   **Improve variable extraction prompt**: rewrite the prompt that extracts or updates a [variable](https://docs.sarvam.ai/conversations/build/variables-personalization).
-   **Improve tool prompt**: improve a [tool’s](https://docs.sarvam.ai/conversations/build/tools) description so the model calls it at the right time with the right arguments.

## What Genie can’t do (yet)

Genie helps you author and refine agent configuration. It does not deploy campaigns, manage telephony, or replace testing in [test agent](https://docs.sarvam.ai/conversations/build/navigating-workspace#testing-the-agent).
