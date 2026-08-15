# Overview

Source: https://docs.sarvam.ai/conversations/overview

## Where to find Voice Agents

Voice Agents lives in the Sarvam platform. Log in with your Sarvam account and open **Voice Agents** from the left menu to start building:

[

Open Voice Agents

Log in at indus.sarvam.ai/samvaad to create, deploy, and manage your agents.







](https://indus.sarvam.ai/samvaad)

![The Sarvam platform home screen. The left navigation lists Model APIs, Voice Agents, Content Agents, and Doc Agents; the main area shows product cards and a credits balance.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/3124f05358412ac8e5259ebb2904cf6ef18c1a6dffa1928330a5b8b3219e0ea4/voice-agents/images/wheretofind.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091906Z&X-Amz-Expires=604800&X-Amz-Signature=400164359e6133a604c542d8a4df5d14368ee0ce5d473811c28dc258ce8d042c&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

The Sarvam platform home. Select Voice Agents from the left menu to get started.

## What it is

Voice Agents is a platform for building, deploying, and monitoring **conversational agents (voice and text)** that let you talk to your customers at scale. Author an agent once and run it across the channels your customers already use, in 10 Indian languages and English.

[

Build

Design agent behavior, voice, language, tools, and conversation flow.







](https://docs.sarvam.ai/conversations/build/overview)[

Deploy

Test in test agent, connect telephony, and go live on phone numbers.







](https://docs.sarvam.ai/conversations/deploy/overview)[

Monitor

Track analytics and build custom boards for agent performance.







](https://docs.sarvam.ai/conversations/monitor/overview)

## What is a conversational agent?

A conversational agent is software that talks with your end customers in natural language to get something done: answer a question, collect information, complete a transaction, or hand off to a human. Instead of navigating a menu or filling a form, the customer simply speaks or types, and the agent responds.

Agents come in two primary modalities:

| Modality | The customer… | How it works |
| --- | --- | --- |
| **Voice** | Speaks and listens | A real-time ASR → LLM → TTS loop (see [Architecture](https://docs.sarvam.ai/conversations/overview#architecture)) |
| **Chat** | Types and reads | Text in, text out, with support for richer message types |

The same underlying agent design (prompts, tools, knowledge, and variables) powers both. What changes is how the customer sends and receives turns, and which [channel](https://docs.sarvam.ai/conversations/overview#channels) the agent runs on.

## Languages

Agents operate across **10 Indian languages and English**: Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Odia, plus English. They can also handle code-mixed speech, alphanumerics, and proper nouns.

Additional languages, including Assamese, Urdu, and Konkani, up to the full IN22 set of 22 scheduled Indian languages, are also available on the **enterprise tier** on request.

## Channels

The same agent can be deployed to multiple channels:

| Channel | Use it for |
| --- | --- |
| Telephony | Inbound and outbound phone calls |
| WhatsApp | Chat over WhatsApp |
| Web | A voice or chat widget embedded in your site |
| API | Driving the agent programmatically from your own application |
| SDK (agent as a service) | Embedding the agent into your application with our SDKs |

### Availability by agent type

Voice agents are generally available on every channel except WhatsApp. Text agents, and voice agents on WhatsApp, are available to enterprise customers on request.

| Channel | Voice agent | Text agent |
| --- | --- | --- |
| Telephony |  |  |
| Web |  |  |
| API |  |  |
| SDK (agent as a service) |  |  |
| WhatsApp |  |  |

Generally available   ·   Enterprise, on request

This documentation currently covers **voice agents**. Text agents and the enterprise-only options above aren’t covered here yet. To enable them, [contact us](https://www.sarvam.ai/contact-us) about the enterprise plan.

## What you can build

Common agents teams run on Voice Agents:

-   Appointment booking and reminders
-   Payment follow-ups and collections
-   Cart recovery
-   Inbound customer support
-   Marketing communication and lead generation

Many teams use Voice Agents as an alternative to traditional CRM-driven outreach: they engage users directly through conversation, drive strong outcomes, and capture rich feedback from the conversational data itself.

Agents can call your systems, CRM, core banking, payments, and others, through [tools](https://docs.sarvam.ai/conversations/build/tools), so they can act, not just answer.

## Self-hosted models

Every model in the Voice Agents stack, speech recognition, reasoning, and speech synthesis, is **self-hosted by Sarvam** rather than called out to a third-party provider. That gives you:

-   **Data residency in India**: all data, including any PII, stays within India, which matters for compliance and data-protection requirements.
-   **Lower latency**: no external network hops between stages, which matters most for real-time voice.
-   **Higher reliability**: the stack doesn’t depend on the uptime or rate limits of an outside API.
-   **More control over quality**: the models are tuned and versioned together as one stack.

See [Models](https://docs.sarvam.ai/conversations/build/models) for the models behind the stack.

## Build your first agent in 5 minutes

Follow the [Quickstart](https://docs.sarvam.ai/conversations/quickstart) to create a voice agent, test it in test agent, and place your first call.
