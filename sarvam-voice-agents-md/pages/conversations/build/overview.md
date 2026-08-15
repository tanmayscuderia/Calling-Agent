# Overview

Source: https://docs.sarvam.ai/conversations/build/overview

This section covers everything about a voice agent: what a conversational agent is, how it’s architected, its core primitives, and how you design, write, build, and improve one. Use the links below to jump to any part.

## 1\. What is a conversational agent?

Start here for the mental model.

[

Introduction

Voice vs chat, channels, and what Voice Agents covers today.







](https://docs.sarvam.ai/conversations/build/concepts/introduction)[

Models

The constellation of models behind every turn.







](https://docs.sarvam.ai/conversations/build/models)[

The harness

Context, tools, and the agentic loop that make models useful.







](https://docs.sarvam.ai/conversations/build/concepts/harness)

## 2\. Core primitives & concepts

The building blocks of an agent.

| Concept | Guide |
| --- | --- |
| The agent and its parts | [Agent](https://docs.sarvam.ai/conversations/build/agent/overview) |
| How the agent behaves | [Instruction](https://docs.sarvam.ai/conversations/build/system-prompt) |
| Per-call data | [Variables & personalization](https://docs.sarvam.ai/conversations/build/variables-personalization) |
| Language & how it sounds | [Speakers & voice](https://docs.sarvam.ai/conversations/build/voice-language) |
| Acting on the world | [Tools](https://docs.sarvam.ai/conversations/build/tools) |
| Context at call boundaries | [On-start & on-end hooks](https://docs.sarvam.ai/conversations/build/on-start-on-end-hooks) |
| Grounding in your content | [Knowledge base](https://docs.sarvam.ai/conversations/build/knowledge-base) |
| Getting the prompt right | [Prompt Practices](https://docs.sarvam.ai/conversations/build/single-state-agents) |
| Turn-taking, timeouts, language | [Configuring settings](https://docs.sarvam.ai/conversations/build/conversation-settings) |

## 3\. Building & improving agents

The workflow from first draft to a deployed agent you keep improving.

[

The build loop

Draft → test → deploy → measure → improve.







](https://docs.sarvam.ai/conversations/build/process)[

Evaluation criteria

Define what “success” means and measure against it.







](https://docs.sarvam.ai/conversations/build/process#goals)

## 4\. Navigating the workspace & Genie

[

Navigating the build interface

Versions, canvas, settings, and the things to be careful about.







](https://docs.sarvam.ai/conversations/build/navigating-workspace)[

Genie

The AI assistant that helps you build and review agents.







](https://docs.sarvam.ai/conversations/build/genie)

## 5\. Advanced concepts

When a single prompt isn’t enough.

[

Multi-state agents

Split a conversation into phases with gated tools and transitions.







](https://docs.sarvam.ai/conversations/build/states-conversation-flow)
