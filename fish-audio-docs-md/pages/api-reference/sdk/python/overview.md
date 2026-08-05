# Overview

Source: https://docs.fish.audio/api-reference/sdk/python/overview

![python.png](https://raw.githubusercontent.com/fishaudio/fish-audio-python/refs/heads/main/.github/assets/python.png)

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#fish-audio-python-sdk)

Fish Audio Python SDK

    [![PyPI version](https://img.shields.io/pypi/v/fish-audio-sdk.svg)](https://badge.fury.io/py/fish-audio-sdk) [![Python Version](https://img.shields.io/badge/python-3.9+-blue)](https://pypi.org/project/fish-audio-sdk/) [![PyPI - Downloads](https://img.shields.io/pypi/dm/fish-audio-sdk)](https://pypi.org/project/fish-audio-sdk/) [![codecov](https://img.shields.io/codecov/c/github/fishaudio/fish-audio-python)](https://codecov.io/gh/fishaudio/fish-audio-python) [![License](https://img.shields.io/github/license/fishaudio/fish-audio-python)](https://github.com/fishaudio/fish-audio-python/blob/main/LICENSE) The official Python library for the Fish Audio API **Documentation:** [Python SDK Guide](https://docs.fish.audio/developer-guide/sdk-guide/python/) | [API Reference](https://docs.fish.audio/api-reference/sdk/python/)

> \[!IMPORTANT\]
> 
> ## 
> 
> [​
> 
> ](https://docs.fish.audio/api-reference/sdk/python/overview#changes-to-pypi-versioning)
> 
> Changes to PyPI Versioning
> 
> For existing users on Fish Audio Python SDK, please note that the starting version is now `1.0.0`. The last version before this was `2025.6.3`. You may need to adjust your version constraints accordingly. The original API in the `fish_audio_sdk` package has NOT been removed, but you will not receive any updates if you continue using the old versioning scheme. The simplest fix is to update your dependency to `fish-audio-sdk>=1.0.0` to continue receiving updates, or by pinning to a specific version like `fish-audio-sdk==1.0.0` when installing via your package manager. There are no changes to the API itself in this transition. If you’re using the legacy `fish_audio_sdk` and would like to switch to the newer, more robust `fishaudio` package, see the [migration guide](https://docs.fish.audio/archive/python-sdk-legacy/migration-guide) to upgrade.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#installation)

Installation

```
pip install fish-audio-sdk

# With audio playback utilities
pip install fish-audio-sdk[utils]
```

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#authentication)

Authentication

Get your API key from [fish.audio/app/api-keys](https://fish.audio/app/api-keys):

```
export FISH_API_KEY=your_api_key_here
```

Or provide directly:

```
from fishaudio import FishAudio

client = FishAudio(api_key="your_api_key")
```

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#quick-start)

Quick Start

**Synchronous:**

```
from fishaudio import FishAudio
from fishaudio.utils import play, save

client = FishAudio()

# Generate audio
audio = client.tts.convert(text="Hello, world!")

# Play or save
play(audio)
save(audio, "output.mp3")
```

**Asynchronous:**

```
import asyncio
from fishaudio import AsyncFishAudio
from fishaudio.utils import play, save

async def main():
    client = AsyncFishAudio()
    audio = await client.tts.convert(text="Hello, world!")
    play(audio)
    save(audio, "output.mp3")

asyncio.run(main())
```

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#core-features)

Core Features

### 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#text-to-speech)

Text-to-Speech

**With custom voice:**

```
# Use a specific voice by ID
audio = client.tts.convert(
    text="Custom voice",
    reference_id="9a9cf47702da476aa4629e2506d4a857"
)
```

**With speed control:**

```
audio = client.tts.convert(
    text="Speaking faster!",
    speed=1.5  # 1.5x speed
)
```

**Reusable configuration:**

```
from fishaudio.types import TTSConfig, Prosody

config = TTSConfig(
    prosody=Prosody(speed=1.2, volume=-5),
    reference_id="933563129e564b19a115bedd57b7406a",
    format="wav",
    latency="balanced"
)

# Reuse across generations
audio1 = client.tts.convert(text="First message", config=config)
audio2 = client.tts.convert(text="Second message", config=config)
```

**Chunk-by-chunk processing:**

```
# Stream and process chunks as they arrive
for chunk in client.tts.stream(text="Long content..."):
    send_to_websocket(chunk)

# Or collect all chunks
audio = client.tts.stream(text="Hello!").collect()
```

[Learn more](https://docs.fish.audio/features/text-to-speech)

### 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#speech-to-text)

Speech-to-Text

```
# Transcribe audio
with open("audio.wav", "rb") as f:
    result = client.asr.transcribe(audio=f.read(), language="en")

print(result.text)

# Access timestamped segments
for segment in result.segments:
    print(f"[{segment.start:.2f}s - {segment.end:.2f}s] {segment.text}")
```

[Learn more](https://docs.fish.audio/features/speech-to-text)

### 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#real-time-streaming)

Real-time Streaming

Stream dynamically generated text for conversational AI and live applications: **Synchronous:**

```
def text_chunks():
    yield "Hello, "
    yield "this is "
    yield "streaming!"

audio_stream = client.tts.stream_websocket(text_chunks(), latency="balanced")
play(audio_stream)
```

**Asynchronous:**

```
import asyncio
from fishaudio import AsyncFishAudio

async def text_chunks():
    yield "Hello, "
    yield "this is "
    yield "streaming!"

async def main():
    async with AsyncFishAudio() as client:
        # stream_websocket is an async generator — iterate it, don't await the call
        audio_stream = client.tts.stream_websocket(text_chunks(), latency="balanced")
        with open("out.mp3", "wb") as f:
            async for chunk in audio_stream:
                f.write(chunk)

asyncio.run(main())
```

[Learn more](https://docs.fish.audio/features/realtime-streaming)

### 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#voice-cloning)

Voice Cloning

**Instant cloning:**

```
from fishaudio.types import ReferenceAudio

# Clone voice on-the-fly
with open("reference.wav", "rb") as f:
    audio = client.tts.convert(
        text="Cloned voice speaking",
        references=[ReferenceAudio(
            audio=f.read(),
            text="Text spoken in reference"
        )]
    )
```

**Persistent voice models:**

```
# Create voice model for reuse
with open("voice_sample.wav", "rb") as f:
    voice = client.voices.create(
        title="My Voice",
        voices=[f.read()],
        description="Custom voice clone"
    )

# Use the created model
audio = client.tts.convert(
    text="Using my saved voice",
    reference_id=voice.id
)
```

[Learn more](https://docs.fish.audio/features/voice-cloning)

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#resource-clients)

Resource Clients

| Resource | Description | Key Methods |
| --- | --- | --- |
| `client.tts` | Text-to-speech | `convert()`, `stream()`, `stream_websocket()` |
| `client.asr` | Speech recognition | `transcribe()` |
| `client.voices` | Voice management | `list()`, `get()`, `create()`, `update()`, `delete()` |
| `client.account` | Account info | `get_credits()`, `get_package()` |

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#error-handling)

Error Handling

```
from fishaudio.exceptions import (
    AuthenticationError,
    RateLimitError,
    NotFoundError,
    APIError,
    FishAudioError,
)

try:
    audio = client.tts.convert(text="Hello!")
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Rate limit exceeded")
except NotFoundError:
    print("Voice model not found")
except APIError as e:
    print(f"API error {e.status}: {e.message}")  # any other HTTP error, including 422 validation
except FishAudioError as e:
    print(f"SDK error: {e}")
```

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#resources)

Resources

-   **Documentation:** [SDK Guide](https://docs.fish.audio/developer-guide/sdk-guide/python/) | [API Reference](https://docs.fish.audio/api-reference/sdk/python/)
-   **Package:** [PyPI](https://pypi.org/project/fish-audio-sdk/) | [GitHub](https://github.com/fishaudio/fish-audio-python)
-   **Legacy SDK:** [Documentation](https://docs.fish.audio/archive/python-sdk-legacy) | [Migration Guide](https://docs.fish.audio/archive/python-sdk-legacy/migration-guide)

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/overview#license)

License

This project is licensed under the Apache-2.0 License - see the [LICENSE](https://docs.fish.audio/api-reference/sdk/python/LICENSE) file for details.

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/sdk/python/overview.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/sdk/python/overview)
