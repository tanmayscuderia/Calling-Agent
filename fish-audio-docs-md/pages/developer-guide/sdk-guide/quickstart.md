# SDK Quickstart

Source: https://docs.fish.audio/developer-guide/sdk-guide/quickstart

The fastest path from zero to playable audio with the official Fish Audio SDKs. By the end you’ll have a script that turns text into an MP3.

The Python SDK is the recommended starting point and is fully covered below. The JavaScript SDK is in early release — see the [JavaScript SDK guide](https://docs.fish.audio/api-reference/sdk/javascript/api-reference) for its current surface.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/quickstart#1-install)

1\. Install

```
pip install fish-audio-sdk

# optional: local audio playback (needs ffmpeg)
pip install "fish-audio-sdk[utils]"
```

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/quickstart#2-authenticate)

2\. Authenticate

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

Both SDKs read your key from the `FISH_API_KEY` environment variable:

```
export FISH_API_KEY=your_api_key_here
```

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/quickstart#3-generate-your-first-audio)

3\. Generate your first audio

```
from fishaudio import FishAudio
from fishaudio.utils import save

client = FishAudio()  # reads FISH_API_KEY

audio = client.tts.convert(text="Hello from Fish Audio!")
save(audio, "output.mp3")
```

Run it, and you’ll have `output.mp3` (Python) or local playback (JavaScript). That’s it — you’re generating speech.

Want async in Python? Every method mirrors onto `AsyncFishAudio`: `async with AsyncFishAudio() as client: audio = await client.tts.convert(text="...")`.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/quickstart#next-steps)

Next steps

## Text-to-Speech

Voices, formats, prosody, and model selection

## Voice Cloning

Instant cloning and persistent voice models

## Realtime WebSocket

Stream LLM tokens to speech as they arrive

## Errors & Retries

Exception types, retries, and timeouts

## Cookbook

Task-focused recipes

## API Reference

Full Python SDK reference

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/sdk-guide/quickstart.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/sdk-guide/quickstart)
