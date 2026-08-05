# Telephony-grade audio (8 kHz) for IVR and phone

Source: https://docs.fish.audio/developer-guide/sdk-guide/cookbook/telephony-8khz-audio

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/telephony-8khz-audio#prerequisites)

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

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/telephony-8khz-audio#recipe)

Recipe

Phone networks carry narrowband audio at 8 kHz. Generating at a higher rate just forces the carrier to downsample on the way through — wasting bandwidth and often softening the result. Synthesize at 8 kHz directly and the bytes are ready to hand to your IVR or SIP stack. Set the sample rate on [`TTSConfig`](https://docs.fish.audio/api-reference/sdk/python/types#ttsconfig-objects) (it is not a top-level argument) and write the WAV to disk.

```
from fishaudio import FishAudio
from fishaudio.types import TTSConfig
from fishaudio.utils import save

client = FishAudio()

audio = client.tts.convert(
    text="Thank you for calling. Press one to speak with an agent.",
    config=TTSConfig(format="wav", sample_rate=8000),
)

save(audio, "out.wav")
```

The output is a mono 8 kHz WAV — the standard for G.711 PCM telephony. For a headerless stream to feed straight into a SIP or RTP pipeline, switch to raw PCM with `format="pcm"`; the sample rate stays on `TTSConfig`.

```
audio = client.tts.convert(
    text="Thank you for calling. Press one to speak with an agent.",
    config=TTSConfig(format="pcm", sample_rate=8000),
)
```

API (curl)

```
curl --request POST https://api.fish.audio/v1/tts \
  --header "Authorization: Bearer $FISH_API_KEY" \
  --header "Content-Type: application/json" \
  --header "model: s2-pro" \
  --data '{ "text": "Thank you for calling. Press one to speak with an agent.", "format": "wav", "sample_rate": 8000 }' \
  --output out.wav
```

8 kHz discards everything above ~4 kHz, so plosives and sibilance lose detail. Keep prompts short and articulate, and reserve higher sample rates (16/24 kHz) for VoIP or recordings that never touch the legacy phone network.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/telephony-8khz-audio#related)

Related

-   [Text-to-Speech guide](https://docs.fish.audio/features/text-to-speech)
-   [Stream TTS to a file](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/streaming-to-file)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/sdk-guide/cookbook/telephony-8khz-audio.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/sdk-guide/cookbook/telephony-8khz-audio)
