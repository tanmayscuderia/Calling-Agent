# Introduction to conversational agents

Source: https://docs.sarvam.ai/conversations/build/concepts/introduction

A conversational agent is software that talks with your end customers in natural language to get something done, answer a question, collect information, complete a transaction, or hand off to a human. Instead of navigating a menu or filling a form, the customer simply speaks or types, and the agent responds.

Voice Agents is built to run these agents **across India’s languages**, on the channels your customers already use.

## Voice and chat

Agents operate in one of two primary modalities:

| Modality | The customer… | Typical latency budget | Notes |
| --- | --- | --- | --- |
| **Voice** | Speaks and listens | Sub-second, turn-by-turn | Runs a real-time ASR → LLM → TTS loop (see [Models](https://docs.sarvam.ai/conversations/build/models)) |
| **Chat** | Types and reads | Relaxed | Text-in, text-out; supports richer message types |

The same underlying agent design, prompts, tools, knowledge, variables, powers both. What changes is how the customer sends and receives turns.

## Channels of deployment

An agent is authored once and can be deployed to multiple channels:

-   **Telephony**: inbound and outbound phone calls (see [Telephony](https://docs.sarvam.ai/conversations/deploy/telephony))
-   **Website / embedded widget**: a voice or chat widget on your web app (see [Deploy with code](https://docs.sarvam.ai/conversations/deploy/deploy-with-code))
-   **WhatsApp**: chat over WhatsApp
-   **API & SDK**: drive the agent directly from your own application (see [Deploy with code](https://docs.sarvam.ai/conversations/deploy/deploy-with-code))

## Where to go next

[

Models

The constellation of models behind a voice agent.







](https://docs.sarvam.ai/conversations/build/models)[

The harness

Context, tools, and the agentic loop that wraps the models.







](https://docs.sarvam.ai/conversations/build/concepts/harness)
