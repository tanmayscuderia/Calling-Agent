# Harness

Source: https://docs.sarvam.ai/conversations/build/concepts/harness

The harness is a standard function-calling (agentic) harness around the [LLM](https://docs.sarvam.ai/conversations/build/models). It gives the model what it needs to act each turn: the **conversation history**, the current **[variables](https://docs.sarvam.ai/conversations/build/variables-personalization)**, and the **[tools](https://docs.sarvam.ai/conversations/build/tools)** it is allowed to call.

## The agentic loop

Each turn, the harness runs a simple loop around the LLM:

1.  Assemble context: conversation history, variables, and available tools.
2.  The LLM reasons, and either responds or calls a tool.
3.  If it calls a tool, the harness runs it and feeds the result back.
4.  Repeat until the LLM produces a response.

## Variables

The harness carries [variables](https://docs.sarvam.ai/conversations/build/variables-personalization) through the conversation. Values can also be injected into context (for example from an on-start hook or your backend), so the model always reasons over the right state.

## Tools

The model acts through [tools](https://docs.sarvam.ai/conversations/build/tools). Some are built-in core tools, and you can author your own to extend what the agent can do.
