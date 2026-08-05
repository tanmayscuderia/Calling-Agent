# Realtime: LLM tokens → speech

Source: https://docs.fish.audio/developer-guide/sdk-guide/cookbook/realtime-llm-to-speech

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/realtime-llm-to-speech#prerequisites)

Prerequisites

Create a Fish Audio account

Sign up for a free Fish Audio account to get started with our API.

1.  Go to [fish.audio/auth/signup](https://fish.audio/auth/signup)
2.  Fill in your details to create an account, complete steps to verify your account.
3.  Log in to your account and navigate to the [API section](https://fish.audio/app/api-keys)

Get your API key

Once you have an account, you’ll need an API key to authenticate your requests.

1.  Log in to your [Fish Audio Dashboard](https://fish.audio/app/api-keys/)
2.  Navigate to the API Keys section
3.  Click “Create New Key” and give it a descriptive name, set a expiration if desired
4.  Copy your key and store it securely

Keep your API key secret! Never commit it to version control or share it publicly.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/realtime-llm-to-speech#recipe)

Recipe

[`stream_websocket()`](https://docs.fish.audio/api-reference/sdk/python/resources#stream_websocket) takes an iterable of text chunks and yields audio chunks in real time. Feed it your LLM’s token stream and play or forward the audio as it’s produced.

```
from fishaudio import FishAudio
from fishaudio.utils import play

client = FishAudio()

def llm_tokens():
    # Replace with your real streaming LLM call
    for token in ["The ", "first ", "move ", "sets ", "everything ", "in ", "motion."]:
        yield token

audio_stream = client.tts.stream_websocket(llm_tokens(), reference_id="<voice-id>")
play(audio_stream)  # or: for chunk in audio_stream: send_to_client(chunk)
```

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/realtime-llm-to-speech#force-generation-at-a-boundary)

Force generation at a boundary

By default the engine buffers text until it has enough for natural prosody. Yield a [`FlushEvent`](https://docs.fish.audio/api-reference/sdk/python/types#flushevent-objects) to force synthesis of what’s buffered — useful for turn-taking in a conversation:

```
from fishaudio.types import TextEvent, FlushEvent

def turns():
    yield TextEvent(text="Are you ready?")
    yield FlushEvent()              # speak the question now
    yield TextEvent(text="Let's begin.")
```

The SDK sends the start/stop frames for you — you only supply text and optional flushes.

Errors mid-stream surface as `WebSocketError`. Reconnect with a fresh call rather than retrying on the same socket.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/realtime-llm-to-speech#related)

Related

-   [Realtime WebSocket guide](https://docs.fish.audio/features/realtime-streaming)
-   [Errors & Retries](https://docs.fish.audio/developer-guide/sdk-guide/python/errors)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/sdk-guide/cookbook/realtime-llm-to-speech.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/sdk-guide/cookbook/realtime-llm-to-speech)
