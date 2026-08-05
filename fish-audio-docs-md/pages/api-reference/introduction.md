# Introduction

Source: https://docs.fish.audio/api-reference/introduction

## 

[​

](https://docs.fish.audio/api-reference/introduction#welcome)

Welcome

You can generate a new API key at [https://fish.audio/app/api-keys/](https://fish.audio/app/api-keys/).

## 

[​

](https://docs.fish.audio/api-reference/introduction#quick-start)

Quick Start

See our [Quick Start](https://docs.fish.audio/developer-guide/getting-started/quickstart) guide to generate audio in under 2 minutes.

## 

[​

](https://docs.fish.audio/api-reference/introduction#errors)

Errors

Every error returns a JSON body with a `message` and a `status`. See [Errors](https://docs.fish.audio/api-reference/errors) for the full status-code table, retry guidance, and SDK exception handling.

## 

[​

](https://docs.fish.audio/api-reference/introduction#openapi-schema)

OpenAPI Schema

Fish Audio publishes a canonical OpenAPI schema at [https://api.fish.audio/openapi.json](https://api.fish.audio/openapi.json). When working with AI coding agents or IDE assistants, mention this schema URL as part of your prompt or project context so the agent can understand Fish Audio’s endpoints, request and response models, authentication requirements, and supported parameters directly from the machine-readable API contract.

## 

[​

](https://docs.fish.audio/api-reference/introduction#distributed-tracing)

Distributed Tracing

Fish Audio inference APIs accept the W3C `traceparent` header so your business-side trace and Fish Audio’s inference-side trace can share the same trace ID. See [Tracing & Performance Analysis](https://docs.fish.audio/api-reference/observability) for supported endpoints, examples, and enterprise performance analysis details.

## 

[​

](https://docs.fish.audio/api-reference/introduction#create-a-voice-clone)

Create a Voice Clone

Use our [/model endpoint](https://docs.fish.audio/api-reference/endpoint/model/create-model) to create a voice clone model.

## 

[​

](https://docs.fish.audio/api-reference/introduction#generate-speech)

Generate Speech

Use our [/v1/tts endpoint](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech) to generate speech.

## 

[​

](https://docs.fish.audio/api-reference/introduction#design-a-voice)

Design a Voice

Use our [/v1/voice-design endpoint](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design) to generate candidate voices from a prompt.

## 

[​

](https://docs.fish.audio/api-reference/introduction#real-time-streaming)

Real-time Streaming

Use our [Python SDK](https://docs.fish.audio/features/realtime-streaming) or [JavaScript SDK](https://docs.fish.audio/features/realtime-streaming) for real-time audio streaming with WebSocket.

## 

[​

](https://docs.fish.audio/api-reference/introduction#rate-limits)

Rate Limits

You can find the rate limits for each endpoint in the [Rate Limits](https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits) section.

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/introduction.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/introduction)
