# JavaScript SDK Reference

Source: https://docs.fish.audio/api-reference/sdk/javascript/api-reference

## 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#client)

Client

Import and initialize the client:

```
import { FishAudioClient } from "fish-audio";
const fishAudio = new FishAudioClient({ apiKey: process.env.FISH_API_KEY });
```

## 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#text-to-speech)

Text to Speech

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#convert)

convert()

Generate speech from text.

```
const audio = await fishAudio.textToSpeech.convert({ text: "Hello" });
```

Parameters: `request` (TTSRequest), `model?` (Backends)  
Returns: `Promise<ReadableStream<Uint8Array>>`

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#convertrealtime)

convertRealtime()

Realtime streaming TTS over WebSocket.

```
async function* textStream() { yield "Hello, "; yield "world!"; }
const conn = await fishAudio.textToSpeech.convertRealtime({ text: "" }, textStream());
```

Parameters: `request` (TTSRequest with `text: ""`), `textStream` (`AsyncIterable<string>`), `backend?` (Backends)  
Returns: `RealtimeConnection` (`EventEmitter`\-like connection) emitting `RealtimeEvents`

## 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#speech-to-text)

Speech to Text

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#convert-2)

convert()

Transcribe audio to text.

```
const res = await fishAudio.speechToText.convert({ audio: myAudio });
console.log(res.text);
```

Parameters: `request` (STTRequest)  
Returns: `STTResponse`

## 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#voices)

Voices

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#search)

search()

List/search available voice models.

```
const results = await fishAudio.voices.search();
```

Parameters: `request?` (ModelListRequest)  
Returns: `ModelListResponse`

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#get)

get()

Get model details.

```
const model = await fishAudio.voices.get("model_id");
```

Parameters: `voiceId` (string)  
Returns: `ModelEntity`

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#ivc-create)

ivc.create()

Create a new voice model from audio samples.

```
const res = await fishAudio.voices.ivc.create({ title, voices: [file], cover_image: file });
```

Parameters: `request` (ModelCreateRequest)  
Returns: `ModelEntity`

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#update)

update()

Update model metadata.

```
await fishAudio.voices.update("model_id", { title: "New Title" });
```

Parameters: `voiceId` (string), `request` (UpdateModelRequest)  
Returns: `UpdateVoiceResponse`

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#delete)

delete()

Delete a model.

```
await fishAudio.voices.delete("model_id");
```

Parameters: `voiceId` (string)  
Returns: `DeleteVoiceResponse`

## 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#user)

User

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#get_api_credit)

get\_api\_credit()

Check API credit balance.

```
await fishAudio.user.get_api_credit();
```

Returns: `APICreditResponse`

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#get_package)

get\_package()

Get subscription package details.

```
await fishAudio.user.get_package();
```

Returns: `PackageResponse`

## 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#request-classes)

Request Classes

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#ttsrequest)

TTSRequest

Text-to-speech parameters.

```
{
  text: "Hello",
  reference_id: "model_id",
  references: [ { audio: File, text: "sample" } ],
  format: "mp3",
  prosody: { speed: 1.0, volume: 0 },
}
```

Fields: `text`, `reference_id`, `references`, `format`, `mp3_bitrate`, `opus_bitrate`, `sample_rate`, `prosody`, `latency`, `chunk_length`, `normalize`, `temperature`, `top_p`

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#sttrequest)

STTRequest

Speech-to-text parameters.

```
{ audio: File, language?: "en", ignore_timestamps?: boolean }
```

Fields: `audio`, `language?`, `ignore_timestamps?`

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#referenceaudio)

ReferenceAudio

Reference audio for voice cloning.

```
{ audio: File, text: "spoken text" }
```

Fields: `audio`, `text`

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#prosody)

Prosody

Speed and volume control.

```
{ speed: 1.2, volume: 5 }
```

Fields: `speed` (0.5–2.0), `volume` (-20 to 20)

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#backends)

Backends

The backend model to use.

```
Backends = 's1' | 's2-pro';
```

The API also accepts `s2.1-pro` and `s2.1-pro-free`; the SDK’s `Backends` type has not been updated yet, so pass them with a type assertion (for example `'s2.1-pro' as Backends`) or call the [REST API](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech) directly.

## 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#response-classes)

Response Classes

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#sttresponse)

STTResponse

Transcription result.

```
response.text      // Complete transcription
response.duration  // Duration in seconds
response.segments  // ASRSegment[]
```

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#asrsegment)

ASRSegment

Timestamped text segment. Fields: `text` (string), `start` (number, seconds), `end` (number, seconds)

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#modelentity)

ModelEntity

Voice model information. Fields: `_id`, `title`, `description`, `visibility`, `created_at`, `updated_at`, `tags`

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#modellistresponse)

ModelListResponse

List response for voices. Fields: `items` (ModelEntity\[\]), `total` (number)

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#apicreditresponse)

APICreditResponse

API credit information. Fields: `_id` (string), `user_id` (string), `credit` (string), `created_at` (string), `updated_at` (string), `has_phone_sha256` (boolean), `has_free_credit?` (boolean)

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#packageresponse)

PackageResponse

Subscription package details. Fields: `user_id` (string), `type` (string), `total` (number), `balance` (number), `created_at` (string), `updated_at` (string), `finished_at` (string)

## 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#websocket-classes)

WebSocket Classes

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#realtimeevents)

RealtimeEvents

Events emitted by `convertRealtime` connections.

| Event | Meaning |
| --- | --- |
| `OPEN` | Connection established |
| `AUDIO_CHUNK` | Audio chunk received |
| `ERROR` | Error occurred |
| `CLOSE` | Connection closed |

## 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#event-classes)

Event Classes

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#startevent)

StartEvent

Stream start event. Fields: `event` (“start”), `request` (TTSRequest)

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#textevent)

TextEvent

Text chunk event. Fields: `event` (“text”), `text` (string)

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#flushevent)

FlushEvent

Flush text chunks event. Fields: `event` (“flush”)

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#closeevent)

CloseEvent

Stream close event. Fields: `event` (“stop”)

## 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#exceptions)

Exceptions

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#fishaudioerror)

FishAudioError

Generic error with status code, body, rawResponse.

### 

[​

](https://docs.fish.audio/api-reference/sdk/javascript/api-reference#fishaudiotimeouterror)

FishAudioTimeoutError

Connection timeout error.

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/sdk/javascript/api-reference.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/sdk/javascript/api-reference)
