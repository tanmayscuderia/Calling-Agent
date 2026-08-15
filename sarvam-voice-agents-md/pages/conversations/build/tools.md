# Tools

Source: https://docs.sarvam.ai/conversations/build/tools

Tools let an agent _act_: call your APIs, validate what it collected, and run built-in behaviours. The model decides when to call a tool via function calling; the [harness](https://docs.sarvam.ai/conversations/build/concepts/harness) validates and executes it.

[

Core tools

Built-in tools the harness provides.







](https://docs.sarvam.ai/conversations/build/tools/core-tools)[

API tool

Call your own APIs over HTTPS.







](https://docs.sarvam.ai/conversations/build/tools/https-tool)[

Data validation & verification

Validate or verify what the agent collects.







](https://docs.sarvam.ai/conversations/build/tools/data-validation)[

Mocking a tool

Test agents without calling the real backend.







](https://docs.sarvam.ai/conversations/build/tools/mocking-a-tool)

## Global vs state-level tools

-   **Global tools** are available across all states, for capabilities needed anywhere (for example, look up a customer by phone).
-   **State-level tools** are scoped to specific states, to gate sensitive actions (for example, only allow a payment tool after verification). See [Multi-state agents](https://docs.sarvam.ai/conversations/build/states-conversation-flow).

## Controlling context sent to the LLM

Each tool has a toggle that controls whether it’s sent to the LLM. It’s on by default, so the agent sees the tool and can call it. Turn it off to not send it in the context anymore.
