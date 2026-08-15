# Instruction

Source: https://docs.sarvam.ai/conversations/build/system-prompt

The **instruction** is what you author on the Canvas to define how the agent behaves. It has two parts:

-   **Greeting**: the opening message the agent speaks when the conversation starts.
-   **Instructions**: the agent’s behaviour, written as natural-language sections (Persona, Objective, Context, guardrails, and so on).

You write it in plain, declarative language with [variables](https://docs.sarvam.ai/conversations/build/variables-personalization) inserted inline. See [Prompt Practices](https://docs.sarvam.ai/conversations/build/single-state-agents) for how to write it well, and [Navigating the build interface](https://docs.sarvam.ai/conversations/build/navigating-workspace#instruction) for the editor (slash commands, mentions, and Genie).

## What goes in the instructions

Most instructions are organised into sections like:

-   **Persona**: who the agent is and its tone.
-   **Objective**: the goal of the conversation and what “done” looks like.
-   **Context**: background the agent should know (often filled from variables).
-   **Guardrails**: what the agent must and must not do.
-   **Steps / workflow**: how to move through the conversation, and when to call [tools](https://docs.sarvam.ai/conversations/build/tools).

## Writing for voice

-   Keep sentences short and speakable; long paragraphs synthesise poorly.
-   Say how to handle numbers, dates, and code-mixing in Indic languages.
-   Be explicit about what to collect, confirm, and read back.

See [Prompt Practices](https://docs.sarvam.ai/conversations/build/single-state-agents) for the full framework and worked examples.
