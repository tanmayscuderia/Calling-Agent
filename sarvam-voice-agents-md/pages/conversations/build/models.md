# Models

Source: https://docs.sarvam.ai/conversations/build/models

## A constellation of models

A voice agent runs on more than one model, and Voice Agents orchestrates them for you:

-   **Speech recognition (ASR)**: Saaras v3
-   **Speech synthesis (TTS)**: Bulbul v3
-   **Reasoning (LLM)**: a constellation of open-source models along with Sarvam 30B and Sarvam 105B. Workloads are routed automatically based on the kind of request.

Because these models are **co-designed with the [harness](https://docs.sarvam.ai/conversations/build/concepts/harness)**, a smaller, faster model backed by a tight harness often beats a bigger, slower one for real-time voice; latency is a feature.

For the end-to-end voice pipeline and how the stages hand off, see [Run-time](https://docs.sarvam.ai/conversations/build/run-time).

## ASR: Saaras v3

Saaras v3 is Sarvam’s speech-recognition model, built to make Indic speech LLM-comprehensible. It transcribes in the **native language** of the caller, and can also translate, romanise, or produce code-mixed text from the same audio.

-   **Native-language output**: transcribes speech in the original Indian language, with number and entity normalization.
-   **Multiple output modes**: transcribe, translate (to English), verbatim, transliterate (Roman script), and code-mix.
-   **Telephony-optimised**: tuned for 8 kHz phone audio and multi-speaker calls.
-   **Domain-aware**: hotword retention and domain prompting keep specialised vocabulary accurate.
-   **Entity preservation**: keeps proper nouns, names, and numbers accurate across languages.
-   **Speaker diarization**: separates speakers with precise timestamps (batch).
-   **Coverage**: 22 Indian languages and English, with automatic language detection and code-mixed audio support.

## LLM

The reasoning layer uses a mix of **Sarvam models**, **open-source models**, and **our fine-tunes of those** in the stack. Workloads are routed automatically based on the kind of request, so you don’t pick a model per agent.

These models are **fine-tuned and post-trained specifically for the Voice Agents use case**. They are **Indic-to-Indic** (they understand input in Indian languages and respond in natural, **code-mixed, colloquial** Indic, the way people actually speak), carry a natural **voice-agent personality**, and **call tools reliably**. That combination makes them highly capable as real-time voice agents out of the box, rather than general-purpose chatbots.

## TTS: Bulbul v3

Bulbul v3 is Sarvam’s text-to-speech model, designed for Indian languages and accents.

-   **30+ natural voices**: a wide selection of speakers (Shubh, Aditya, Ritu, Priya, Simran, Anand, Roopa, and many more) to fit different personas.
-   **Code-mixed input**: speaks text that mixes English and Indic scripts naturally.
-   **Natural prosody**: human-like intonation and expression.
-   **Pace control**: adjustable speed from 0.5x to 2.0x.
-   **Coverage**: 10 Indian languages and English.
-   **Quality options**: multiple sample rates, up to 48 kHz on the REST API.

Pick, preview, and tune voices in [Voice & Language](https://docs.sarvam.ai/conversations/build/voice-language).

## Self-hosting

Every model in the stack is self-hosted by Sarvam. This is a deliberate choice, and it is what makes the platform’s guarantees possible:

-   **Data residency in India**: all data, including any PII, stays within India.
-   **Sovereign token usage**: inference runs on Sarvam’s own infrastructure, so your usage stays sovereign and in-country.
-   **Models tuned for the stack**: because we host them, we can train and optimise the models specifically for the Voice Agents pipeline.
-   **Reliability and latency guarantees**: co-located models with no external hops let us commit to the latency and reliability the [run-time](https://docs.sarvam.ai/conversations/build/run-time#built-for-scale) needs.

## Bring your own models

Voice Agents does **not** support bringing your own models at any part of the stack (ASR, LLM, or TTS).

The stack is built, evaluated, and tuned end to end around our own set of models. Swapping in an external model would put reliability, latency, and accuracy at risk, and none of the guarantees above would hold. Wiring an outside model into the real-time loop, and doing the load and capacity calculations to run it reliably at scale, is also very hard to get right.

If you think you need this, talk to your Sarvam contact and we’ll help find the right approach.
