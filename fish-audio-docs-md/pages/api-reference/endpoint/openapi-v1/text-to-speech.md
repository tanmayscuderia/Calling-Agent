# Text to Speech

Source: https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech

```
curl --request POST \
  --url https://api.fish.audio/v1/tts \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --header 'model: s2.1-pro-free' \
  --data '{
    "text": "Hello! Welcome to Fish Audio.",
    "reference_id": "model-id",
    "temperature": 0.7,
    "top_p": 0.7,
    "prosody": {
      "speed": 1,
      "volume": 0,
      "normalize_loudness": true
    },
    "chunk_length": 300,
    "normalize": true,
    "format": "mp3",
    "sample_rate": 44100,
    "mp3_bitrate": 128,
    "latency": "normal",
    "max_new_tokens": 1024,
    "repetition_penalty": 1.2,
    "min_chunk_length": 50,
    "condition_on_previous_chunks": true,
    "early_stop_threshold": 1
  }'
```

```
{
  "status": 123,
  "message": "<string>"
}
```

POST

/

v1

/

tts

```
curl --request POST \
  --url https://api.fish.audio/v1/tts \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --header 'model: s2.1-pro-free' \
  --data '{
    "text": "Hello! Welcome to Fish Audio.",
    "reference_id": "model-id",
    "temperature": 0.7,
    "top_p": 0.7,
    "prosody": {
      "speed": 1,
      "volume": 0,
      "normalize_loudness": true
    },
    "chunk_length": 300,
    "normalize": true,
    "format": "mp3",
    "sample_rate": 44100,
    "mp3_bitrate": 128,
    "latency": "normal",
    "max_new_tokens": 1024,
    "repetition_penalty": 1.2,
    "min_chunk_length": 50,
    "condition_on_previous_chunks": true,
    "early_stop_threshold": 1
  }'
```

```
{
  "status": 123,
  "message": "<string>"
}
```

This endpoint only accepts `application/json` and `application/msgpack`.For best results, upload reference audio using the [create model](https://docs.fish.audio/api-reference/endpoint/model/create-model) before using this one. This improves speech quality and reduces latency.To upload audio clips directly, without pre-uploading, serialize the request body with MessagePack as per the [instructions](https://docs.fish.audio/features/text-to-speech#direct-api-messagepack).

Audio formats supported:

-   WAV / PCM
    -   Sample Rate: 8kHz, 16kHz, 24kHz, 32kHz, 44.1kHz
    -   Default Sample Rate: 44.1kHz
    -   16-bit, mono
-   MP3
    -   Sample Rate: 32kHz, 44.1kHz
    -   Default Sample Rate: 44.1kHz
    -   mono
    -   Bitrate: 64kbps, 128kbps (default), 192kbps
-   Opus
    -   Sample Rate: 48kHz
    -   Default Sample Rate: 48kHz
    -   mono
    -   Bitrate: -1000 (auto), 24kbps, 32kbps (default), 48kbps, 64kbps

#### Authorizations

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#authorization-authorization)

Authorization

string

header

required

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

#### Headers

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#parameter-model)

model

enum<string>

default:s2.1-pro

Specify which TTS model to use. Use `s2.1-pro-free` for the free developer tier. If omitted or set to an unrecognized value, the request falls back to `s2.1-pro`.

Available options:

`s1`,

`s2-pro`,

`s2.1-pro`,

`s2.1-pro-free`

#### Body

application/jsonapplication/msgpack

Request body for text-to-speech synthesis. Supports single-speaker synthesis on all compatible TTS models. Multi-speaker dialogue synthesis is only available with the S2-Pro model.

## Single Speaker

Provide either `reference_id` (string) pointing to a voice model, or `references` (array of ReferenceAudio) for zero-shot cloning.

## Multiple Speakers (Dialogue, S2-Pro only)

For multi-speaker synthesis, provide:

-   `reference_id`: array of voice model IDs, e.g., \["speaker-0-id", "speaker-1-id"\]
-   `text`: use speaker tags `<|speaker:0|>`, `<|speaker:1|>`, etc. to indicate speaker changes, e.g., "<|speaker:0|>Hello!<|speaker:1|>Hi there!"

Alternatively, for zero-shot multi-speaker:

-   `references`: 2D array where each inner array contains references for one speaker
-   `reference_id`: array of identifiers (can be arbitrary strings for zero-shot)

## Example (Multi-Speaker with Model IDs)

`{     "text": "<|speaker:0|>Good morning!<|speaker:1|>Good morning! How are you?<|speaker:0|>I'm great, thanks!",     "reference_id": ["model-id-alice", "model-id-bob"]   }`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-text)

text

string

required

Text to convert to speech.

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-temperature)

temperature

number

default:0.7

Controls expressiveness. Higher is more varied, lower is more consistent.

Required range: `0 <= x <= 1`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-top-p)

top\_p

number

default:0.7

Controls diversity via nucleus sampling.

Required range: `0 <= x <= 1`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-references-one-of-0)

references

ReferenceAudio · object\[\]ReferenceAudio · object\[\]\[\]

Single speaker: array of reference audio samples

Show child attributes

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-reference-id-one-of-0)

reference\_id

stringstring\[\]

Single speaker: voice model ID string

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-prosody-one-of-0)

prosody

ProsodyControl · object | null

Speed and volume adjustments for the output.

Show child attributes

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-chunk-length)

chunk\_length

integer

default:300

Text segment size for processing.

Required range: `100 <= x <= 300`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-normalize)

normalize

boolean

default:true

Normalizes text for English and Chinese, improving stability for numbers.

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-format)

format

enum<string>

default:mp3

Output audio format.

Available options:

`wav`,

`pcm`,

`mp3`,

`opus`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-sample-rate-one-of-0)

sample\_rate

integer | null

Audio sample rate in Hz. When null, uses the format's default (44100 Hz for most formats, 48000 Hz for opus).

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-mp3-bitrate)

mp3\_bitrate

enum<integer>

default:128

MP3 bitrate in kbps. Only applies when format is mp3.

Available options:

`64`,

`128`,

`192`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-opus-bitrate)

opus\_bitrate

enum<integer>

default:\-1000

Opus bitrate in bps. -1000 for automatic. Only applies when format is opus.

Available options:

`-1000`,

`24000`,

`32000`,

`48000`,

`64000`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-latency)

latency

enum<string>

default:normal

Latency-quality trade-off. normal: best quality, balanced: reduced latency, low: lowest latency.

Available options:

`low`,

`normal`,

`balanced`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-max-new-tokens)

max\_new\_tokens

integer

default:1024

Maximum audio tokens to generate per text chunk.

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-repetition-penalty)

repetition\_penalty

number

default:1.2

Penalty for repeating audio patterns. Values above 1.0 reduce repetition.

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-min-chunk-length)

min\_chunk\_length

integer

default:50

Minimum characters before splitting into a new chunk.

Required range: `0 <= x <= 100`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-condition-on-previous-chunks)

condition\_on\_previous\_chunks

boolean

default:true

Use previous audio as context for voice consistency.

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-early-stop-threshold)

early\_stop\_threshold

number

default:1

Early stopping threshold for batch processing.

Required range: `0 <= x <= 1`

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech#body-features)

features

string\[\]

Optional request-scoped TTS feature flags forwarded verbatim to the inference backend. Use \["quality-guard"\] to enable the quality guard for this synthesis request. Feature availability is determined by the inference backend.

#### Response

Request fulfilled, document follows

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/endpoint/openapi-v1/text-to-speech.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/endpoint/openapi-v1/text-to-speech)
