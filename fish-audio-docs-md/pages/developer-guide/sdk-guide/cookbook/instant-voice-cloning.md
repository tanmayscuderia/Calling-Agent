# Instant voice cloning

Source: https://docs.fish.audio/developer-guide/sdk-guide/cookbook/instant-voice-cloning

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/instant-voice-cloning#prerequisites)

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

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/instant-voice-cloning#recipe)

Recipe

Pass a [`ReferenceAudio`](https://docs.fish.audio/api-reference/sdk/python/types#referenceaudio-objects) (raw audio bytes + an exact transcript) on the `convert` call. Nothing is saved server-side — the clone applies to that request only.

```
from fishaudio import FishAudio
from fishaudio.types import ReferenceAudio
from fishaudio.utils import save

client = FishAudio()

with open("reference.wav", "rb") as f:
    audio = client.tts.convert(
        text="This sentence is spoken in the cloned voice.",
        references=[ReferenceAudio(
            audio=f.read(),
            text="Exact transcript of what is said in reference.wav.",
        )],
    )

save(audio, "cloned.mp3")
```

Use 10–30 s of clean speech, and make `text` match the audio exactly (including punctuation) for the best prosody.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/instant-voice-cloning#reuse-a-voice-across-many-requests)

Reuse a voice across many requests

If you’ll use the voice repeatedly, create a persistent model once and pass its id as `reference_id` — see the [Voice Cloning guide](https://docs.fish.audio/features/voice-cloning).

```
with open("sample.wav", "rb") as f:
    voice = client.voices.create(title="My Voice", voices=[f.read()])

audio = client.tts.convert(text="Reusing my saved voice.", reference_id=voice.id)
```

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/instant-voice-cloning#related)

Related

-   [Voice Cloning guide](https://docs.fish.audio/features/voice-cloning)
-   [Stream TTS to a file](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/streaming-to-file)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/sdk-guide/cookbook/instant-voice-cloning.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/sdk-guide/cookbook/instant-voice-cloning)
