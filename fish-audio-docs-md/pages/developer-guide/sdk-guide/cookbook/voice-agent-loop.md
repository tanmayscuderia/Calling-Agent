# Build a voice agent loop: speech in, reply, speech out

Source: https://docs.fish.audio/developer-guide/sdk-guide/cookbook/voice-agent-loop

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/voice-agent-loop#prerequisites)

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

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/voice-agent-loop#recipe)

Recipe

A voice agent is three stages chained together: [`asr.transcribe()`](https://docs.fish.audio/api-reference/sdk/python/resources#transcribe) turns the caller’s audio into text, your own LLM turns that text into a reply, and [`tts.stream()`](https://docs.fish.audio/api-reference/sdk/python/resources#stream) turns the reply back into speech. The transcript and the reply are just strings, so the only Fish Audio-specific parts are the first and last calls. Streaming the reply lets you start writing (or forwarding) audio before the whole sentence is synthesized.

```
from fishaudio import FishAudio
from fishaudio.utils import save

client = FishAudio()

def reply_from_llm(text: str) -> str:
    # ---- PLACEHOLDER ----
    # Call your own LLM here and return its reply as a string.
    # e.g. return openai_client.chat.completions.create(...).choices[0].message.content
    return f"You said: {text}. How can I help?"

def voice_agent_turn(audio_path: str, out_path: str) -> str:
    with open(audio_path, "rb") as f:
        heard = client.asr.transcribe(audio=f.read())

    reply = reply_from_llm(heard.text)

    audio_stream = client.tts.stream(text=reply, reference_id="<voice-id>")
    save(audio_stream, out_path)  # writes chunks as they arrive
    return reply

reply = voice_agent_turn("speech.wav", "reply.mp3")
print("Agent:", reply)
```

`heard` is an [`ASRResponse`](https://docs.fish.audio/api-reference/sdk/python/types#asrresponse-objects): `heard.text` is the full transcript and `heard.duration` is the clip length in seconds. Pass `language="en"` to `transcribe()` to skip auto-detection when you already know the input language.

For the lowest latency, feed your LLM’s token stream straight into [`stream_websocket()`](https://docs.fish.audio/api-reference/sdk/python/resources#stream_websocket) instead of waiting for the full reply string — see [Realtime: LLM tokens → speech](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/realtime-llm-to-speech).

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/voice-agent-loop#reply-in-the-caller%E2%80%99s-voice)

Reply in the caller’s voice

`reference_id` points the reply at a saved voice. Drop it to use the default voice, or clone the caller’s voice from the same clip you just transcribed by passing `references` instead — see [Instant voice cloning](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/instant-voice-cloning).

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/voice-agent-loop#related)

Related

-   [Speech-to-Text guide](https://docs.fish.audio/features/speech-to-text)
-   [Realtime: LLM tokens → speech](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/realtime-llm-to-speech)
-   [Stream TTS to a file](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/streaming-to-file)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/sdk-guide/cookbook/voice-agent-loop.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/sdk-guide/cookbook/voice-agent-loop)
