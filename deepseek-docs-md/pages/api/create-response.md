# Responses API

Source: https://api-docs.deepseek.com/api/create-response

POST 

## /responses

Creates a model response in the OpenAI Responses API format.

The API is **stateless**: responses and conversations are not stored on the server. For multi-turn conversations, the client needs to send the full conversation history in `input` on each request. Please refer to the [Responses API Guide](https://api-docs.deepseek.com/guides/responses_api) for details, including the full parameter compatibility tables.

## Request[​](https://api-docs.deepseek.com/api/create-response#request "Direct link to Request")

-   application/json

### 

Body

**

required

**

**model** stringrequired

**Possible values:** \[`deepseek-flash`, `deepseek-v4-pro`\]

ID of the model to use. Use `deepseek-flash` or `deepseek-v4-pro`.

**input** string | object\[\]

nullable

The input to the model. Either a plain string (treated as a single `user` message), or a list of input items.

Supported input item types are `message` / `function_call` / `function_call_output` / `custom_tool_call` / `custom_tool_call_output` / `reasoning`; other types are ignored. Message roles can be `user` / `assistant` / `system` / `developer` (`developer` is treated as `user`). With the `deepseek-flash` model, `input_image` content parts are supported in `user` / `developer` message items and in the `output` of `function_call_output` / `custom_tool_call_output` items; images in `system` or `assistant` messages return a `400` error. File inputs are not supported.

At least one of `input` and `instructions` is required.

oneOf

-   Text input
-   Input item list

string

**instructions** stringnullable

A system-level instruction, inserted as the first system message of the model's context.

**

reasoning

**

object

nullable

Configuration of the thinking mode.

**effort** string

**Possible values:** \[`none`, `low`, `high`, `max`\]

Controls the thinking mode toggle and the thinking effort. `none` disables thinking mode; `low` / `high` / `max` enable thinking mode. If not set, the model's default thinking behavior is used (enabled by default). For compatibility with existing software, `minimal` is accepted and mapped to `low`, and `medium` / `xhigh` are accepted and mapped to `high`.

**max\_output\_tokens** integernullable

An upper bound for the number of tokens that can be generated in the response, including both the visible output tokens and the reasoning tokens.

**stream** booleannullable

If set to `true`, the response is streamed as semantic server-sent events. The final event is `response.completed` / `response.incomplete` / `response.failed` (there is no `data: [DONE]` message). Please refer to the [Responses API Guide](https://api-docs.deepseek.com/guides/responses_api#streaming) for the full event list.

**temperature** numbernullable

**Possible values:** `<= 2`

**Default value:** `1`

What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. Has no effect in thinking mode.

**top\_p** numbernullable

**Possible values:** `<= 1`

**Default value:** `1`

An alternative to sampling with temperature, called nucleus sampling. It only takes effect in thinking mode, where the effective range is 0.95–1.0: values below 0.95 are treated as 0.95. In non-thinking mode it is fixed at 1.0 and the value you pass is ignored.

**

text

**

object

nullable

Configuration of the text output.

**

format

**

object

The output format. `{"type": "text"}` (default) for plain text; `{"type": "json_object"}` for JSON mode; `{"type": "json_schema", "name": ..., "schema": ...}` for structured output conforming to the given JSON Schema.

**type** string

**Possible values:** \[`text`, `json_object`, `json_schema`\]

**Default value:** `text`

**name** string

The name of the schema. Required when `type` is `json_schema`.

**schema** object

The JSON Schema that the output must conform to. Required when `type` is `json_schema`.

**

tools

**

object\[\]

nullable

A list of tools the model may call. Function names must be non-empty, at most 128 characters, match `^[a-zA-Z0-9_-]+$`, and be unique across all tools. Built-in tool types are ignored. Please refer to the [Responses API Guide](https://api-docs.deepseek.com/guides/responses_api) for details.

-   Array \[
    

**type** stringrequired

**Possible values:** \[`function`\]

The type of the tool.

**name** string

For `function` tools. The name of the function. Must be non-empty, at most 128 characters, match `^[a-zA-Z0-9_-]+$`, and be unique across all tools.

**description** string

For `function` tools. A description of what the function does, used by the model to choose when and how to call the function.

**

parameters

**

object

The parameters the functions accepts, described as a JSON Schema object. See the [Tool Calls Guide](https://api-docs.deepseek.com/guides/tool_calls) for examples, and the [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for documentation about the format.

Omitting `parameters` defines a function with an empty parameter list.

**property name\*** any

The parameters the functions accepts, described as a JSON Schema object. See the [Tool Calls Guide](https://api-docs.deepseek.com/guides/tool_calls) for examples, and the [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for documentation about the format.

Omitting `parameters` defines a function with an empty parameter list.

-   \]
    

**tool\_choice** string | object

nullable

Controls which (if any) tool is called by the model.

`none` means the model will not call any tool and instead generates a message.

`auto` (default) means the model can pick between generating a message or calling one or more tools.

`required` means the model must call one or more tools.

Specifying a particular tool via `{"type": "function", "name": "my_function"}` forces the model to call that tool.

oneOf

-   Tool choice mode
-   Named tool choice

string

**Possible values:** \[`none`, `auto`, `required`\]

**top\_logprobs** integernullable

**Possible values:** `<= 20`

An integer between 0 and 20 specifying the number of most likely tokens to return at each token position, each with an associated log probability.

**user** stringnullable

A custom end-user identifier, with allowed character set \[a-zA-Z0-9\\-\_\] and a maximum length of 512. Do not include user privacy information.

-   It can be used to distinguish user identities on your side to help us with content safety review, for KVCache isolation, and for scheduling isolation. For more details, please refer to [Rate Limit & Isolation](https://api-docs.deepseek.com/quick_start/rate_limit)

## Responses[​](https://api-docs.deepseek.com/api/create-response#responses "Direct link to Responses")

-   200 (No streaming)
-   200 (Streaming)

OK, returns a `response` object

-   application/json

-   Schema
-   Example (from schema)
-   Example

**

Schema

**

**id** stringrequired

A unique identifier for the response.

**object** stringrequired

**Possible values:** \[`response`\]

The object type, which is always `response`.

**created\_at** integerrequired

The Unix timestamp (in seconds) of when the response was created.

**status** stringrequired

**Possible values:** \[`in_progress`, `completed`, `incomplete`, `failed`\]

The status of the response.

**error** objectnullable

The error object when the response failed, with `code` and `message` fields.

**

incomplete\_details

**

object

nullable

The details about why the response is incomplete. The `reason` field can be `max_output_tokens` or `content_filter`.

**reason** string

**Possible values:** \[`max_output_tokens`, `content_filter`\]

**model** stringrequired

The model used for the response.

**

output

**

object\[\]

required

The list of output items generated by the model. In thinking mode, the chain-of-thought is returned as a `reasoning` item before the `message` item. Function calls are returned as `function_call` items.

-   Array \[
    

**type** string

**Possible values:** \[`message`, `reasoning`, `function_call`\]

The type of the output item.

**id** string

The unique ID of the output item.

**status** string

**Possible values:** \[`in_progress`, `completed`, `incomplete`\]

The status of the output item.

**role** string

**Possible values:** \[`assistant`\]

For `message` items. Always `assistant`.

**

content

**

object\[\]

For `message` items, a list of `output_text` content parts. For `reasoning` items, a list of `reasoning_text` content parts carrying the chain-of-thought in plain text.

-   Array \[
    

**type** string

**Possible values:** \[`output_text`, `reasoning_text`\]

**text** string

-   \]
    

**call\_id** string

For `function_call` items. An identifier used when passing the function output back to the API.

**name** string

For `function_call` items. The name of the function to call.

**arguments** string

For `function_call` items. The arguments to call the function with, as generated by the model in JSON format. Note that the model does not always generate valid JSON, and may hallucinate parameters not defined by your function schema. Validate the arguments in your code before calling your function.

-   \]
    

**

usage

**

object

Token usage statistics for the response.

**input\_tokens** integerrequired

Number of input tokens.

**

input\_tokens\_details

**

object

Breakdown of the input tokens.

**cached\_tokens** integer

Number of input tokens that hit the context cache. See [Context Caching](https://api-docs.deepseek.com/guides/kv_cache).

**output\_tokens** integerrequired

Number of output tokens.

**

output\_tokens\_details

**

object

Breakdown of the output tokens.

**reasoning\_tokens** integer

Number of reasoning (chain-of-thought) tokens generated by the model.

**total\_tokens** integerrequired

Total number of tokens used in the request (input + output).

Loading...
