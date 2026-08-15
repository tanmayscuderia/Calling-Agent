# Prompt Practices

Source: https://docs.sarvam.ai/conversations/build/single-state-agents

Most agents should start as a **single-state agent**: one prompt, one set of tools, no explicit state machine. It’s the fastest thing to build, the easiest to test, and it’s enough for the majority of use cases. Reach for [multi-state](https://docs.sarvam.ai/conversations/build/states-conversation-flow) design only when the conversation genuinely branches into distinct phases.

## Prompt practices

-   **One goal per agent.** If you’re describing two unrelated jobs, that’s two agents (or a multi-state flow).
-   **Front-load the important rules.** State the goal, the guardrails, and the “done” condition early.
-   **Keep turns short and speakable.** Write the way you want the agent to talk.
-   **Be explicit about collection.** Say exactly what to ask for, in what order, and what to confirm.
-   **Handle the unhappy path.** Say what to do on refusal, silence, wrong number, or missing data.
-   **Reference tools by purpose.** Tell the agent _when_ to use a [tool](https://docs.sarvam.ai/conversations/build/tools), not just that it exists.

## Declarative style of prompting

Prefer describing the **outcome and the rules** over writing a rigid, line-by-line script. A declarative prompt adapts to what the customer actually says; a scripted prompt breaks the moment the conversation goes off the expected path.

| Scripted (avoid) | Declarative (prefer) |
| --- | --- |
| “Say: ‘Hello, am I speaking to X?’ Then say: ’…’” | Greet the caller, confirm you’re speaking to the account holder, then explain why you’re calling. |
| A fixed decision tree in prose | The rules that decide each branch, and the goal each branch serves |

The agent still needs specifics (what to collect, what to confirm), declarative doesn’t mean vague. It means expressing intent and constraints, and letting the model handle phrasing and ordering within them.

Use the [prompt checker / AI review](https://docs.sarvam.ai/conversations/build/system-prompt#prompt-checker) and [test agent](https://docs.sarvam.ai/conversations/deploy/overview) to iterate on a single-state agent before adding complexity.
