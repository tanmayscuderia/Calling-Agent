# Variables & Personalization

Source: https://docs.sarvam.ai/conversations/build/variables-personalization

Variables carry data through a call: they personalize greetings, feed tool calls, capture structured results, and drive analytics. There are two kinds: **Sarvam variables** (system variables available by default on every agent) and **agent variables** (the ones you create).

## Sarvam variables

Sarvam variables are system variables available by default on every agent. No setup required. When you type `@` in the canvas, they appear alongside your agent variables. Insert them into greetings, instructions, and tool prompts the same way you would any other variable.

| Variable | Description | Example |
| --- | --- | --- |
| `current_date` | Today’s date | `2026-08-14` |
| `current_time` | Current time of day | `14:30:00` |
| `current_datetime` | Date and time combined | `2026-08-14 14:30:00` |
| `current_day` | Day of the week | `Thursday` |
| `start_datetime` | When the current call started | `2026-08-14 14:28:12` |
| `language_name` | The language configured for the current call | `Hindi` |

Sarvam variables are read-only. They are populated automatically at the start of each call and cannot be edited or deleted.

## Agent variables

Agent variables are the ones you create on the **Variables** tab. The tab splits them into **Input variables** and **Output variables**, but these are just frontend labels for how you use a variable. There is one underlying type, and the same variable can serve both roles.

| Role | What it does | Populated from | Example |
| --- | --- | --- | --- |
| **Input** | Personalizes the conversation before it begins | Telephony metadata (caller number), [on-start hook](https://docs.sarvam.ai/conversations/build/on-start-on-end-hooks) responses, [campaign](https://docs.sarvam.ai/conversations/deploy/campaigns) CSV columns | Greet a caller by name |
| **Output** | Extracted by the LLM after the call ends | The conversation itself, via an extraction prompt | Call disposition, interest level |

Because they share storage, [tools](https://docs.sarvam.ai/conversations/build/tools) can read and write any agent variable mid-call. An API tool can pass an input variable in its request body and store a response field back into an output variable.

![The Variables tab on Input variables, listing developer\_name and gender with default values, plus Search and Add.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/0c35651e4d489b4916b28d23f824a10020b0704f3576f3302aacfca59b664e82/voice-agents/images/variables-input.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091910Z&X-Amz-Expires=604800&X-Amz-Signature=6f46833582ad11473e5acd3125e768f804c7f0c0e7135bf04d2be74d62e86905&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Input variables: name, default value, and Add.

![The Variables tab on Output variables, with a Successful when goal rule and a table of output variables including call\_disposition and next\_step\_agreed.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/141eb1d92541e464d4ac8dfb830cf35b7a4a95dad47fe2b484ca46fce77a6a01/voice-agents/images/variables-output-goals.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091910Z&X-Amz-Expires=604800&X-Amz-Signature=9a4ef2ba2f229adee48a3bf7547830d7d4889ec8182619fcf5ed5948dfc357d6&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Output variables: data type, extraction description, and the call-goal rule.

## Input variables

Each input variable has a **name** and a **default value**. At runtime, values are populated from:

-   **Telephony metadata**: for example, the caller’s phone number on an inbound call.
-   **[On-start hook](https://docs.sarvam.ai/conversations/build/on-start-on-end-hooks)**: an API call fired at call start that returns CRM profiles, account details, or eligibility flags. The response fields are mapped into agent variables before the agent speaks.
-   **[Campaign](https://docs.sarvam.ai/conversations/deploy/campaigns) row fields**: for outbound calls, each contact’s CSV columns are mapped to agent variables so the agent knows who it’s calling and why.

### Controlling context sent to the LLM

Each input variable has a toggle that controls whether it’s sent to the LLM. It’s on by default, so the value is included in the agent’s context. Turn it off to keep the variable available for tools without consuming LLM context tokens.

## Output variables

Output variables are extracted from the conversation after the call ends. Each has:

-   **Data type**: **String** or **Enum**. For an Enum, define the allowed **values** (for example, `agreed_to_resume` / `not_interested`).
-   **Extraction prompt**: a natural-language description of what to extract and how. Genie can **Improve** the prompt for you.

![Edit output variable modal for next\_step\_agreed, with Data Type set to String, an Improve button on the Extraction Prompt, and Save Changes.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/6efacda5147f075d67cb11c5f87e029db0cb5f2ebcf926b14f0e0320f75c606c/voice-agents/images/output-variable-modal.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091910Z&X-Amz-Expires=604800&X-Amz-Signature=ecbfe713f8bd88f0b2cb0a575a8669b372cca4b27c08eb909c8eae5ebd6c376a&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Edit output variable: name, data type (String or Enum), and extraction prompt.

### Call goal

On the **Output variables** tab, define success with a **Successful when** rule: `<variable>` `<operator>` `<value>` (for example, `call_disposition` `=` `agreed_to_resume`). Every call is scored against this goal, which powers the success and outcome insights in [Agent Analytics](https://docs.sarvam.ai/conversations/monitor/agent-analytics).

![Output variables tab with Successful when call\_disposition equals, and a value dropdown open showing enum options such as wrong\_person.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/sarvam-api-docs.docs.buildwithfern.com/141eb1d92541e464d4ac8dfb830cf35b7a4a95dad47fe2b484ca46fce77a6a01/voice-agents/images/variables-output-goals.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260815%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260815T091910Z&X-Amz-Expires=604800&X-Amz-Signature=9a4ef2ba2f229adee48a3bf7547830d7d4889ec8182619fcf5ed5948dfc357d6&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Successful when: set the call goal from an output variable and value.

## Using variables in tools

[Tools](https://docs.sarvam.ai/conversations/build/tools) can read and write any agent variable. The [API tool](https://docs.sarvam.ai/conversations/build/tools/https-tool), for example, can pass agent variables in its request body and store response fields back into agent variables via **Save reply into variables**. This lets you chain lookups across a call: fetch an account on start, reference it in a mid-call tool, and capture the final disposition on end.

[1](https://docs.sarvam.ai/conversations/build/variables-personalization#pass-variables-into-a-tool)

### Pass variables into a tool

Reference agent variables in the tool’s request body, headers, or query parameters using `@` in the tool editor.

[2](https://docs.sarvam.ai/conversations/build/variables-personalization#store-the-response)

### Store the response

Map response fields back into agent variables with **Save reply into variables** so the agent can speak the result and downstream tools can read it.

## Variable lifecycle across a call

| Stage | What happens to variables |
| --- | --- |
| **Call starts** | Sarvam variables (`current_date`, `start_datetime`, etc.) are populated. Input variables are filled from telephony metadata, an on-start hook, or campaign row fields. |
| **During conversation** | The agent reads input variables from context. Tools can read and write agent variables mid-call. |
| **Call ends** | Output variables are extracted by the LLM via their extraction prompts. The on-end hook fires and pushes final variable values to your endpoint. |
| **Analytics** | Every agent variable surfaces as the call’s **final agent variables** in [Agent Analytics](https://docs.sarvam.ai/conversations/monitor/agent-analytics). The [call goal](https://docs.sarvam.ai/conversations/build/variables-personalization#call-goal) drives success metrics. In [Log Analyser](https://docs.sarvam.ai/conversations/monitor/agent-analytics/log-analyser), you can inspect starting and final variable values with **NEW** / **CHANGED** badges per turn. |

## PII flagging and privacy transforms

Mark variables that contain personal data and apply privacy transforms (mask, hash) as needed. PII-flagged variables are redacted in logs and analytics where appropriate.
