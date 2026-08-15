# Run-time

Source: https://docs.sarvam.ai/conversations/build/run-time

Run-time is what happens during a live conversation. On every turn, the agent runs a real-time loop: it **listens** to the caller, **thinks** about what to do, and **speaks** a response. Voice Agents coordinates this loop for you, turn after turn, for as long as the conversation lasts.

## The main turn loop

| Stage | Component | What it does |
| --- | --- | --- |
| **Listen** | Sarvam STT (ASR) | Transcribes the caller’s speech into text as they speak |
| **Think** | LLM | Decides the next response from the prompt, context, tools, and knowledge |
| **Speak** | Sarvam TTS | Voices the response in the selected Indic voice |
| **Turn-taking** | VAD | Detects when the caller starts and stops speaking, and handles interruptions |

The loop is orchestrated by [the harness](https://docs.sarvam.ai/conversations/build/concepts/harness), which assembles context, runs tools, and manages turn-taking. Each stage is powered by a Sarvam model; see [Models](https://docs.sarvam.ai/conversations/build/models) for the families and how to tune them.

## Composable run-time layers

The core loop is wrapped by composable layers that handle the messy realities of real calls. Each layer can be added, removed, or customised, so you can assemble bespoke pipelines for complex use cases without rebuilding the loop underneath.

Out of the box, the run-time automatically handles:

-   **Pronunciations**: names, numbers, and domain terms are spoken correctly.
-   **Language switching**: the agent follows the caller when they change language mid-call.
-   **Voicemail handling**: on outbound calls, the run-time detects voicemail and can leave a message.
-   **Hold**: the agent stays graceful if the caller puts the call on hold.
-   **Long silence**: if the caller goes quiet for too long, the run-time nudges and can wrap up cleanly.
-   **Interruptions and barge-in**: the agent stops and listens the moment the caller talks over it.
-   **Artificial background noise**: optional ambient audio behind the agent’s voice for a more natural feel.

**Human handover** is available today for enterprise deployments. Productising it more broadly, along with **DTMF (keypad) input**, is planned.

This composability is what lets the run-time support highly custom pipelines for complex use cases while keeping the reliability of the core loop.

## From run-time to transport

The turn loop is the same no matter how the caller reached the agent. A few layers connect it to the outside world:

-   **The LLM connects to an agent harness.** The reasoning model doesn’t run on its own; the [harness](https://docs.sarvam.ai/conversations/build/concepts/harness) wraps it and supplies context, tools, and knowledge on every turn.
-   **The voice layer connects to your channels.** Wherever the agent is deployed, the voice layer plugs into that transport: [telephony](https://docs.sarvam.ai/conversations/deploy/telephony) (phone lines and SIP), the web widget, and other channels. You can also drive the agent directly from your own application with the [API and SDK](https://docs.sarvam.ai/conversations/deploy/deploy-with-code).
-   **Campaign orchestration sits on top.** For outbound, a campaign orchestration layer decides whom to call and when. See [Deploy](https://docs.sarvam.ai/conversations/deploy/overview).

This separation is what lets you author an agent once and run it across every channel.

## Built for scale

**Built for enterprise-grade scale and reliability, available out of the box.**

Voice is unforgiving: each turn has to complete in well under a second to feel natural, and a production deployment may run many of these loops at once, every one holding open live audio in both directions. The run-time handles this at enterprise scale:

-   **Scale**: scale beyond **20,000+ concurrent calls**.
-   **Latency**: **sub-second latencies**, even at scale.
-   **Reliability**: high-grade reliability for enterprise deployments.

Sarvam delivers this by [self-hosting every model](https://docs.sarvam.ai/conversations/build/models) in the pipeline, co-located so there are no external network hops between stages, and by scaling the run-time horizontally as call volume grows.
