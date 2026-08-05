# Clone a voice and wait until it is ready

Source: https://docs.fish.audio/developer-guide/sdk-guide/cookbook/clone-and-wait-until-ready

A persistent voice is trained asynchronously: `voices.create()` returns immediately with a voice whose `state` is `created` or `training`. Before you can synthesize with it, you need to wait until its `state` becomes `trained`. This recipe creates a voice from `reference.wav`, polls [`voices.get()`](https://docs.fish.audio/api-reference/sdk/python/resources#get) until training finishes (with a timeout), then synthesizes with `reference_id`.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/clone-and-wait-until-ready#prerequisites)

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

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/clone-and-wait-until-ready#recipe)

Recipe

Poll `voices.get(voice.id).state` on an interval, stopping when it reaches `trained` (or raising if it `failed` or the timeout elapses). Then pass the voice id as `reference_id` on `convert()`.

```
import time

from fishaudio import FishAudio
from fishaudio.utils import save

client = FishAudio()

# 1. Create a persistent voice from a reference clip.
with open("reference.wav", "rb") as f:
    voice = client.voices.create(title="My Voice", voices=[f.read()])

# 2. Poll until the voice finishes training.
deadline = time.time() + 300  # 5-minute timeout
while voice.state != "trained":
    if voice.state == "failed":
        raise RuntimeError(f"Voice {voice.id} failed to train")
    if time.time() > deadline:
        raise TimeoutError(f"Voice {voice.id} not ready (state={voice.state})")
    time.sleep(5)
    voice = client.voices.get(voice.id)

# 3. Synthesize with the trained voice.
audio = client.tts.convert(
    text="My voice is ready to use.",
    reference_id=voice.id,
)
save(audio, "out.mp3")
```

A voice moves through `created` → `training` → `trained`, or ends in `failed`. Always handle `failed` and the timeout so a stuck voice cannot loop forever.

Training a persistent voice takes time, so only create one when you will reuse the voice across many requests. For one-off synthesis, skip the wait entirely and pass a `ReferenceAudio` inline — see [Instant voice cloning](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/instant-voice-cloning).

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/clone-and-wait-until-ready#related)

Related

-   [Instant voice cloning](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/instant-voice-cloning)
-   [Voice Cloning guide](https://docs.fish.audio/features/voice-cloning)
-   [Voices API reference](https://docs.fish.audio/api-reference/sdk/python/resources#voices)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/sdk-guide/cookbook/clone-and-wait-until-ready.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/sdk-guide/cookbook/clone-and-wait-until-ready)
