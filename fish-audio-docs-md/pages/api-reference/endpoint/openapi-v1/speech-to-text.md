# Speech to Text

Source: https://docs.fish.audio/api-reference/endpoint/openapi-v1/speech-to-text

Speech to Text

```
curl --request POST \
  --url https://api.fish.audio/v1/asr \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '
{
  "audio": "<string>",
  "language": "<string>",
  "ignore_timestamps": true
}
'
```

```
{
  "text": "<string>",
  "duration": 123,
  "segments": [
    {
      "text": "<string>",
      "start": 123,
      "end": 123
    }
  ]
}
```

POST

/

v1

/

asr

Speech to Text

```
curl --request POST \
  --url https://api.fish.audio/v1/asr \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '
{
  "audio": "<string>",
  "language": "<string>",
  "ignore_timestamps": true
}
'
```

```
{
  "text": "<string>",
  "duration": 123,
  "segments": [
    {
      "text": "<string>",
      "start": 123,
      "end": 123
    }
  ]
}
```

This BETA endpoint only accepts `application/form-data` and `application/msgpack`.

#### Authorizations

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/speech-to-text#authorization-authorization)

Authorization

string

header

required

Bearer authentication header of the form `Bearer <token>`, where `<token>` is your auth token.

#### Body

application/jsonapplication/msgpack

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/speech-to-text#body-audio)

audio

file

required

Audio to be converted to text

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/speech-to-text#body-language-one-of-0)

language

string | null

Language to be used for the speech

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/speech-to-text#body-ignore-timestamps)

ignore\_timestamps

boolean

default:true

Whether to return precise timestamps in the text, this will increase the latency in audio shorter than 30 seconds

#### Response

Request fulfilled, document follows

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/speech-to-text#response-text)

text

string

required

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/speech-to-text#response-duration)

duration

number

required

Duration of the audio in seconds

[​

](https://docs.fish.audio/api-reference/endpoint/openapi-v1/speech-to-text#response-segments)

segments

ASRSegment · object\[\]

required

Show child attributes

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/endpoint/openapi-v1/speech-to-text.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/endpoint/openapi-v1/speech-to-text)
