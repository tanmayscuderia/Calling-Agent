# Multi-state agents

Source: https://docs.sarvam.ai/conversations/build/states-conversation-flow

When a conversation genuinely branches into distinct phases, promote it from a [single-state agent](https://docs.sarvam.ai/conversations/build/single-state-agents) to a **multi-state agent**. States let you split a call into clear phases, each with its own instructions, tools, and transitions.

Multi-state is an **older paradigm** that we are moving away from in favour of a **multi-agent** architecture. It remains available for specific use-cases and will reach end-of-life once multi-agent launches.

Start single-state. Reach for multi-state only when one prompt can no longer express the flow cleanly, or when you need to gate tools to specific phases.

## What are states?

A state is a named phase of the conversation. Each state typically includes:

| Field | Description |
| --- | --- |
| Name | Human-readable label (for example, `collect_issue`) |
| Instructions | What the agent should do while in this state |
| Tools | Tools available in this state |
| Next states | Allowed transitions out of this state |

## Defining state transitions and conditions

Transitions move the agent from one state to the next when conditions are met, for example, after collecting a required field, verifying identity, or detecting that the caller wants to escalate.

-   Prefer explicit transition conditions over burying all routing logic in a single prompt.
-   Keep each state’s goal narrow so transitions stay predictable.
-   Document what must be true before leaving a state (variables set, confirmation spoken, tool success).

## Variables in context per state

States can read and update [variables](https://docs.sarvam.ai/conversations/build/variables-personalization) in conversation context. Use variables to carry data across states (customer ID, issue type, callback preference) without repeating collection steps.

## Initial state configuration

Every multi-state agent needs an initial state, the first phase after the call connects (often after the initial message). Configure:

1.  Which state is the entry point
2.  What the agent should say or ask first
3.  Which tools are available immediately

## State-level tool assignment

Assign tools at the state level when they should only be available in certain phases, for example, a payment webhook only after identity verification. For tools shared everywhere, use [global tools](https://docs.sarvam.ai/conversations/build/tools).
