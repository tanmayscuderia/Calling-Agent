# API tool

Source: https://docs.sarvam.ai/conversations/build/tools/https-tool

An API tool is a webhook the agent can call mid-conversation to talk to an external system, look up an order, book a slot, or post a lead to your CRM. At runtime the agent invokes it by name (`call tool:your_tool_name` in the instructions), the platform makes the HTTP request, and the response comes back for the agent to use in its reply.

## Lifecycle: when the tool runs

Set **When should this tool run?** to one of:

-   **run** (default, shown as _During conversation_): the LLM-callable webhook, invoked by the agent mid-conversation.
-   **on\_start**: fires automatically at call start, typically to pull data into [agent variables](https://docs.sarvam.ai/conversations/build/variables-personalization) before the conversation begins.
-   **on\_end**: fires automatically at call end, typically to push captured variables out to your endpoint.

`on_start` and `on_end` are **lifecycle hooks**: there is no LLM in the loop, so they are never referenced from the instructions and cannot use a response template. See [On-start & on-end hooks](https://docs.sarvam.ai/conversations/build/on-start-on-end-hooks).

## Two ways to create one

### Mock tool

For prototyping, or when you don’t have a real backend yet (or just have example response JSON). Supply a **name** and a **canned response**; the platform fills in sensible defaults (a test URL, JSON body, playground mock config) and returns your canned response every time. Great for designing and testing the conversation flow before the real API exists. See [Mocking a tool](https://docs.sarvam.ai/conversations/build/tools/mocking-a-tool).

### Real integration

Provide the actual **endpoint URL**, **HTTP method** (GET / POST / PUT / PATCH / DELETE), any static **headers**, **body**, **query** or **path** parameters, and the **auth** setup. The fastest way is to paste a **cURL** command, the builder fills in the method, URL, headers, and body, and everything stays editable. You can also map fields from the response into agent variables so the agent can speak them back.

## Authoring an API tool

1.  **Name and describe the tool.** Use a snake\_case **name** (for example, `get_order_status`) and a clear **description**, the agent uses both to decide when to call it.
2.  **Set your API call.** Choose the **method** and **URL**, configure **Path**, **Params**, **Headers**, **Body**, and **Auth**, then press **Test** to try it live. Pasting a **cURL** command still fills these in for you.
3.  **Say what the agent gets back.** Write a response template for how the agent should use the result (for example, `The account balance is {{balance}}`); type `@` to insert a field from the reply.
4.  **Advanced.** Set **Max wait** (timeout), **If it fails** (what the agent says on a timeout or error), and **Save reply into variables** (store response fields into [agent variables](https://docs.sarvam.ai/conversations/build/variables-personalization)).

![Animated walkthrough of the Create tool panel - naming the tool, generating with AI, and setting method, URL, headers, and other API options.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/bc26d3038cd39e3c2c42810cfc799219ed25406da5ca1839c04c45e96e6835b4/voice-agents/images/https-tool.gif?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091909Z&X-Amz-Expires=604800&X-Amz-Signature=a1c7d9a4ed96cc32e16e54f82b2de039ca3a1494d934759eeb006b4cfd91466a&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Create tool: name and describe the tool, then configure the HTTP API call.

## Authentication

Supported auth types: **none**, **bearer token**, **api\_key**, and **basic**.

For any authenticated tool, the credential value is **never typed into the tool config**. You enter it through a secure masked input, the secret is stored safely in your workspace (see [Secrets](https://docs.sarvam.ai/conversations/settings/secrets)), and the tool references it, so tokens and keys never sit in plain text in the agent definition.

## Network access

If your endpoint sits behind a firewall or VPC (for example, an internal CRM), allowlist Sarvam’s IP so the platform can reach it:

`4.213.167.70`

Add this IP to your firewall or security group rules before testing the tool.

## Typical build order

1.  Create the tool (mock or real).
2.  Enable it on the agent.
3.  Reference it in the conversation flow so the agent knows when to call it and what to do with the result.
4.  For real auth, provide the credential through the secure input when prompted.

## Practical notes

-   **Keep timeouts tight** (configurable up to 30s) so the caller isn’t left waiting in silence.
-   **Map the response into variables** so the agent can use what it fetched (“I see your order shipped Tuesday”).
-   **Design around latency**: a mid-call API hit means a pause on the line, so have the agent say something like “let me pull that up” first.
