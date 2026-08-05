# Pipecat

Source: https://docs.fish.audio/developer-guide/integrations/pipecat

[Pipecat](https://github.com/pipecat-ai/pipecat) is an open source framework for building voice and multimodal conversational AI. It handles the orchestration of audio, AI services, and conversation pipelines so you can focus on what makes your agent unique. Fish Audio integrates with Pipecat through `FishAudioTTSService`, which provides real-time text-to-speech synthesis using WebSocket streaming for low-latency conversational applications.

## 

[​

](https://docs.fish.audio/developer-guide/integrations/pipecat#prerequisites)

Prerequisites

-   A [Fish Audio account](https://fish.audio/) with an API key
-   Python 3.9 or higher

## 

[​

](https://docs.fish.audio/developer-guide/integrations/pipecat#installation)

Installation

Install Pipecat with Fish Audio support:

```
pip install "pipecat-ai[fish]"
```

## 

[​

](https://docs.fish.audio/developer-guide/integrations/pipecat#configuration)

Configuration

Set your Fish Audio API key as an environment variable:

```
export FISH_API_KEY=your_api_key_here
```

## 

[​

](https://docs.fish.audio/developer-guide/integrations/pipecat#basic-usage)

Basic usage

Add `FishAudioTTSService` to your Pipecat pipeline:

```
from pipecat.services.fish import FishAudioTTSService

tts = FishAudioTTSService(
    api_key=os.getenv("FISH_API_KEY"),
    reference_id="your_voice_model_id",  # Optional: use a specific voice
    model_id="s1",
    params=FishAudioTTSService.InputParams(
        latency="normal",
        prosody_speed=1.0
    )
)
```

### 

[​

](https://docs.fish.audio/developer-guide/integrations/pipecat#key-parameters)

Key parameters

| Parameter | Description |
| --- | --- |
| `api_key` | Your Fish Audio API key |
| `reference_id` | Voice model ID from the [Fish Audio library](https://fish.audio/discover) |
| `model_id` | TTS model version (default: `s1`) |
| `output_format` | Audio format: `pcm`, `mp3`, `wav`, or `opus` |

### 

[​

](https://docs.fish.audio/developer-guide/integrations/pipecat#prosody-controls)

Prosody controls

Customize speech characteristics with `InputParams`:

```
params=FishAudioTTSService.InputParams(
    latency="balanced",      # "normal" or "balanced"
    prosody_speed=1.2,       # 0.5 to 2.0
    prosody_volume=0,        # Volume adjustment in dB
    normalize=True           # Audio normalization
)
```

## 

[​

](https://docs.fish.audio/developer-guide/integrations/pipecat#resources)

Resources

-   [Pipecat Documentation](https://docs.pipecat.ai/server/services/tts/fish)
-   [Pipecat GitHub](https://github.com/pipecat-ai/pipecat)
-   [Fish Audio Voice Library](https://fish.audio/discovery)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/integrations/pipecat.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/integrations/pipecat)
