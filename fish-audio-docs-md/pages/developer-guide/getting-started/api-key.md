# Get Your API Key

Source: https://docs.fish.audio/developer-guide/getting-started/api-key

Everything you build with Fish Audio — the API, the Python library, JavaScript — authenticates with a single **API key**. Here’s how to get one and make your first call in a couple of minutes.

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/api-key#1-create-an-account-and-key)

1\. Create an account and key

1

Sign up

Go to [fish.audio/auth/signup](https://fish.audio/auth/signup), create an account, and verify your email.

2

Open the API Keys page

Sign in and open [fish.audio/app/api-keys](https://fish.audio/app/api-keys).

3

Create a key

Click **Create New Key**, give it a descriptive name (and an expiration if you want), then **copy the key and store it securely** — treat it like a password.

Never commit your API key to version control or share it publicly.

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/api-key#2-store-it-as-an-environment-variable)

2\. Store it as an environment variable

The SDKs and the examples throughout these docs read your key from `FISH_API_KEY`:

```
export FISH_API_KEY="your_api_key_here"
```

This keeps the key out of your code and lets you use different keys for development and production.

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/api-key#3-make-your-first-request)

3\. Make your first request

```
from fishaudio import FishAudio
from fishaudio.utils import save

client = FishAudio()  # reads FISH_API_KEY
audio = client.tts.convert(text="Hello from Fish Audio!")
save(audio, "hello.mp3")
```

You just generated your first audio. Where to next:

## Text to Speech

Voices, formats, speed, and streaming.

## Quick Start

A fuller first-request walkthrough.

## Voice Cloning

Build a custom voice from your own audio.

## Speech to Text

Transcribe audio with timestamps.

**Building with an AI coding agent?** Install the Fish Audio skill so it writes correct SDK/API code — `npx skills add docs.fish.audio`. See [AI Coding Agents](https://docs.fish.audio/developer-guide/resources/coding-agents).

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/getting-started/api-key.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/getting-started/api-key)
