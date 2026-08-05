# WebSocket TTS Streaming

Source: https://docs.fish.audio/api-reference/endpoint/websocket/tts-live

Messages

```
{  "event": "start",  "request": {    "text": "",    "format": "mp3",    "chunk_length": 300,    "reference_id": "9a9cf47702da476aa4629e2506d4a857",    "latency": "normal"  }}
```

```
{  "event": "text",  "text": "Hello, this is streaming text. "}
```

```
{  "event": "flush"}
```

```
{  "event": "stop"}
```

```
{  "event": "audio",  "audio": "<binary audio data>"}
```

```
{  "event": "finish",  "reason": "stop"}
```

WSS

/

v1

/

tts

/

live

The WebSocket TTS endpoint enables bidirectional streaming for low-latency text-to-speech generation with MessagePack serialization.

The `request` payload inside `StartEvent` uses the same parameters as the HTTP [Text to Speech API](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech). For more detailed field guidance, model-specific behavior, and examples, see that page. In WebSocket mode, `request.text` is typically empty in `StartEvent`, and the text content is sent through subsequent `TextEvent` messages.

Messages

```
{  "event": "start",  "request": {    "text": "",    "format": "mp3",    "chunk_length": 300,    "reference_id": "9a9cf47702da476aa4629e2506d4a857",    "latency": "normal"  }}
```

```
{  "event": "text",  "text": "Hello, this is streaming text. "}
```

```
{  "event": "flush"}
```

```
{  "event": "stop"}
```

```
{  "event": "audio",  "audio": "<binary audio data>"}
```

```
{  "event": "finish",  "reason": "stop"}
```

bearerAuth

type:http

API key authentication using Bearer token.

Get your API key from [https://fish.audio/app/api-keys](https://fish.audio/app/api-keys)

Pass the token in the Authorization header: `Authorization: Bearer YOUR_API_KEY`

headers

type:object

model

type:enum

TTS model to use for this session. If omitted or set to an unrecognized value, the session falls back to `s2.1-pro`. Use `s2-pro` or an S2.1-Pro model for multi-speaker dialogue synthesis.

Available options: `s1`, `s2-pro`, `s2.1-pro`, `s2.1-pro-free`

Start TTS Session

type:object

Initiates a TTS streaming session with configuration.

This must be the first message sent after connecting. It contains all the configuration for voice, audio format, and generation parameters.

The `request` payload uses the same fields as the HTTP TTS API. In WebSocket mode, `request.text` is typically empty in the StartEvent and the actual text is streamed through subsequent TextEvent messages.

For full parameter details, examples, and model-specific guidance, see the HTTP [Text to Speech API](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech).

Send Text Chunk

type:object

Sends a chunk of text for synthesis.

You can send multiple TextEvent messages in sequence. The server will buffer and synthesize text according to the chunk\_length parameter from StartEvent.

Flush Buffered Text

type:object

Forces immediate synthesis of all buffered text.

Use this when you want audio generated immediately without waiting for more text or for the buffer to fill up. Useful for ensuring low latency in interactive applications.

End TTS Session

type:object

Signals the end of the text stream.

After sending this event, the server will finish synthesizing any remaining buffered text and send a FinishEvent before closing the connection.

Audio Chunk

type:object

Contains generated audio bytes.

You will receive multiple AudioEvent messages as audio is generated. Each message contains a chunk of audio in the format you specified. Concatenate all chunks to get the complete audio.

Session Complete

type:object

Signals that the TTS session has completed.

-   If reason='stop', synthesis completed successfully
-   If reason='error', an error occurred (client should handle gracefully)

The WebSocket connection will close after this event.

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/endpoint/websocket/tts-live.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/endpoint/websocket/tts-live)
