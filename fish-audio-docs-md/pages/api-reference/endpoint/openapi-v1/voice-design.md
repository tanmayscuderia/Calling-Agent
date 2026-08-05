# Voice Design

Source: https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design

Voice Design

```
curl --request POST \
  --url https://api.fish.audio/v1/voice-design \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --header 'model: voice-design-1' \
  --data '{
    "instruction": "Warm, confident studio narrator with a natural tone",
    "reference_text": "Welcome to Fish Audio.",
    "language": "en",
    "n": 2,
    "speed": 1,
    "num_step": 32,
    "guidance_scale": 2,
    "instruct_guidance_scale": 0,
    "seed": 42
  }'
```

```
{
  "candidates": [
    {
      "id": "<string>",
      "index": 1,
      "audio_base64": "<string>",
      "sample_rate": 123,
      "duration_ms": 1,
      "text": "<string>",
      "instruct": "<string>",
      "language": "<string>"
    }
  ]
}
```

POST

/

v1

/

voice-design

Voice Design

```
curl --request POST \
  --url https://api.fish.audio/v1/voice-design \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --header 'model: voice-design-1' \
  --data '{
    "instruction": "Warm, confident studio narrator with a natural tone",
    "reference_text": "Welcome to Fish Audio.",
    "language": "en",
    "n": 2,
    "speed": 1,
    "num_step": 32,
    "guidance_scale": 2,
    "instruct_guidance_scale": 0,
    "seed": 42
  }'
```

```
{
  "candidates": [
    {
      "id": "<string>",
      "index": 1,
      "audio_base64": "<string>",
      "sample_rate": 123,
      "duration_ms": 1,
      "text": "<string>",
      "instruct": "<string>",
      "language": "<string>"
    }
  ]
}
```

This endpoint only accepts `application/json`.You must include the `model: voice-design-1` header. Extra request fields are rejected.

A successful request returns generated voice candidates with `audio_base64` audio payloads. Decode the base64 value to write the candidate audio to a file.

## 

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#example)

Example

```
curl --request POST https://api.fish.audio/v1/voice-design \
  --header "Authorization: Bearer $FISH_API_KEY" \
  --header "Content-Type: application/json" \
  --header "model: voice-design-1" \
  --data '{
    "instruction": "Warm, confident studio narrator with a natural tone",
    "reference_text": "Welcome to Fish Audio.",
    "language": "en",
    "n": 2,
    "speed": 1,
    "num_step": 32,
    "guidance_scale": 2,
    "instruct_guidance_scale": 0,
    "seed": 42
  }'
```

## 

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#usage-notes)

Usage notes

-   `instruction` is required and must be 1 to 2000 characters.
-   `reference_text` is optional preview text and can be up to 150 characters.
-   `n` controls how many candidates are returned. The supported range is 1 to 4.
-   `seed` is optional and can help reproduce candidate generation.
-   The endpoint is stateless: it does not create batches, samples, voice models, or presigned URLs.
-   Billing happens once per successful generation request, not once per candidate.

#### Authorizations

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#authorization-authorization)

Authorization

string

header

required

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

#### Headers

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#parameter-model)

model

string

default:voice-design-1

required

Specify which voice-design model to use.

Allowed value: `"voice-design-1"`

#### Body

application/json

Request body for synchronous voice design generation. The endpoint returns generated voice candidates with base64-encoded audio.

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#body-instruction)

instruction

string

required

Voice design prompt. Must contain 1 to 2000 characters.

Required string length: `1 - 2000`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#body-reference-text-one-of-0)

reference\_text

string | null

Optional text used as reference content for the generated voice.

Maximum string length: `150`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#body-language-one-of-0)

language

string | null

Optional BCP-47 language hint, such as `en`, `zh`, or `ja`.

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#body-n)

n

integer

default:2

Number of voice candidates to generate.

Required range: `1 <= x <= 4`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#body-speed)

speed

number

default:1

Speaking speed multiplier for candidate generation.

Required range: `x <= 3`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#body-num-step)

num\_step

integer

default:32

Number of diffusion steps used by the voice-design model.

Required range: `1 <= x <= 128`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#body-guidance-scale)

guidance\_scale

number

default:2

Classifier-free guidance scale. Higher values follow the prompt more strongly.

Required range: `x >= 0`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#body-instruct-guidance-scale)

instruct\_guidance\_scale

number

default:0

Instruction guidance scale for prompt conditioning.

Required range: `x >= 0`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#body-seed-one-of-0)

seed

integer | null

Optional deterministic seed for candidate generation.

#### Response

Request fulfilled, document follows

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/voice-design#response-candidates)

candidates

VoiceDesignCandidate · object\[\]

required

Generated voice candidates.

Show child attributes

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/endpoint/openapi-v1/voice-design.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/endpoint/openapi-v1/voice-design)
