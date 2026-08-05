# LiveKit

Source: https://docs.fish.audio/developer-guide/integrations/livekit

[LiveKit Agents](https://github.com/livekit/agents) is an open source framework for building real-time voice and multimodal AI agents. It handles streaming audio pipelines, turn detection, interruptions, and LLM orchestration so you can focus on your agent’s behavior. Fish Audio integrates with LiveKit through the `fishaudio` plugin, providing text-to-speech synthesis with support for both chunked and real-time WebSocket streaming modes.

## 

[​

](https://docs.fish.audio/developer-guide/integrations/livekit#prerequisites)

Prerequisites

-   A [Fish Audio account](https://fish.audio/) with an API key
-   Python 3.9 or higher

## 

[​

](https://docs.fish.audio/developer-guide/integrations/livekit#installation)

Installation

Install LiveKit Agents with Fish Audio support:

```
pip install "livekit-agents[fishaudio]"
```

## 

[​

](https://docs.fish.audio/developer-guide/integrations/livekit#configuration)

Configuration

Set your Fish Audio API key as an environment variable:

```
export FISH_API_KEY=your_api_key_here
```

## 

[​

](https://docs.fish.audio/developer-guide/integrations/livekit#basic-usage)

Basic usage

Add Fish Audio TTS to your LiveKit agent:

```
from livekit.plugins.fishaudio import TTS

tts = TTS(
    reference_id="your_voice_model_id",  # Optional: use a specific voice
    model="s1",
    sample_rate=24000,
    latency_mode="balanced"
)
```

### 

[​

](https://docs.fish.audio/developer-guide/integrations/livekit#key-parameters)

Key parameters

| Parameter | Description |
| --- | --- |
| `api_key` | Your Fish Audio API key (or use `FISH_API_KEY` env var) |
| `model` | TTS model/backend to use (default: `s1`) |
| `reference_id` | Voice model ID from the [Fish Audio library](https://fish.audio/discover) |
| `output_format` | Audio format: `pcm`, `mp3`, `wav`, or `opus` (default: `pcm`) |
| `sample_rate` | Audio sample rate in Hz (default: `24000`) |
| `num_channels` | Number of audio channels (default: `1`) |
| `base_url` | Custom API endpoint (default: `https://api.fish.audio`) |
| `latency_mode` | `normal` (~500ms) or `balanced` (~300ms, default) |

### 

[​

](https://docs.fish.audio/developer-guide/integrations/livekit#streaming-modes)

Streaming modes

The plugin supports two synthesis modes:

```
# Chunked (non-streaming) synthesis
stream = tts.synthesize("Hello, world!")

# Real-time WebSocket streaming
stream = tts.stream()
```

## 

[​

](https://docs.fish.audio/developer-guide/integrations/livekit#resources)

Resources

-   [LiveKit Agents Documentation](https://docs.livekit.io/agents/)
-   [LiveKit GitHub](https://github.com/livekit/agents)
-   [Fish Audio Plugin Reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/fishaudio/index.html)
-   [Fish Audio Voice Library](https://fish.audio/discovery)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/integrations/livekit.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/integrations/livekit)
