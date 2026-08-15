# Agent

Source: https://docs.sarvam.ai/conversations/build/agent/overview

An **agent** is the unit you build, version, and deploy in Voice Agents. It bundles everything that defines how a conversation behaves.

## What makes up an agent

[

Instruction

The greeting and the instructions (persona, objective, context, guardrails) that define how the agent behaves.







](https://docs.sarvam.ai/conversations/build/system-prompt)[

Variables

Dynamic values read into and collected out of each conversation.







](https://docs.sarvam.ai/conversations/build/variables-personalization)[

Speakers & voice

Language, speaker, and how the agent sounds.







](https://docs.sarvam.ai/conversations/build/voice-language)[

Tools

Webhooks, data-validation, system tools, and integrations the agent can call.







](https://docs.sarvam.ai/conversations/build/tools)[

On-start & on-end hooks

Fetch context before the call and push results after it ends.







](https://docs.sarvam.ai/conversations/build/on-start-on-end-hooks)[

Knowledge base

Documents the agent grounds its answers in.







](https://docs.sarvam.ai/conversations/build/knowledge-base)

## How the pieces fit together

The **instruction** (greeting plus instructions) defines who the agent is and what it should do. **Variables** carry data through the call. **Tools** let it act on the outside world, and the **knowledge base** lets it answer from your content. **Speakers & voice** control how all of that is delivered to the customer.

Start simple (a single-prompt agent with a voice and maybe one tool), then layer in knowledge, more tools, and, when the flow genuinely branches, [multi-state](https://docs.sarvam.ai/conversations/build/states-conversation-flow) design.
