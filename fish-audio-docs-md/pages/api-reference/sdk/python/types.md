# Types

Source: https://docs.fish.audio/api-reference/sdk/python/types

](https://docs.fish.audio/api-reference/sdk/python/types#fishaudio-types-voices)

fishaudio.types.voices

Voice and model management types.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#sample-objects)

Sample Objects

```
class Sample(BaseModel)
```

A sample audio for a voice model. **Attributes**:

-   `title` - Title/name of the audio sample
-   `text` - Transcription of the spoken content in the sample
-   `task_id` - Unique identifier for the sample task
-   `audio` - URL or path to the audio file

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#author-objects)

Author Objects

```
class Author(BaseModel)
```

Voice model author information. **Attributes**:

-   `id` - Unique author identifier
-   `nickname` - Author’s display name
-   `avatar` - URL to author’s avatar image

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#voice-objects)

Voice Objects

```
class Voice(BaseModel)
```

A voice model. Represents a TTS voice that can be used for synthesis. **Attributes**:

-   `id` - Unique voice model identifier (use as reference\_id in TTS)
-   `type` - Model type. Options: “svc” (singing voice conversion), “tts” (text-to-speech)
-   `title` - Voice model title/name
-   `description` - Detailed description of the voice model
-   `cover_image` - URL to the voice model’s cover image
-   `train_mode` - Training mode used. Options: “fast”
-   `state` - Current model state: “created”, “training”, “trained”, or “failed”
-   `tags` - List of tags for categorization (e.g., \[“male”, “english”, “young”\])
-   `samples` - List of audio samples demonstrating the voice
-   `created_at` - Timestamp when the model was created
-   `updated_at` - Timestamp when the model was last updated
-   `languages` - List of supported language codes (e.g., \[“en”, “zh”\])
-   `visibility` - Model visibility. Options: “public”, “private”, “unlist”
-   `lock_visibility` - Whether visibility setting is locked
-   `like_count` - Number of likes the model has received
-   `mark_count` - Number of bookmarks/favorites
-   `shared_count` - Number of times the model has been shared
-   `task_count` - Number of times the model has been used for generation
-   `liked` - Whether the current user has liked this model. Default: False
-   `marked` - Whether the current user has bookmarked this model. Default: False
-   `author` - Information about the voice model’s creator

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#fishaudio-types-account)

fishaudio.types.account

Account-related types (credits, packages, etc.).

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#credits-objects)

Credits Objects

```
class Credits(BaseModel)
```

User’s API credit balance. **Attributes**:

-   `id` - Unique credits record identifier
-   `user_id` - User identifier
-   `credit` - Current credit balance (decimal for precise accounting)
-   `created_at` - Timestamp when the credits record was created
-   `updated_at` - Timestamp when the credits were last updated
-   `has_phone_sha256` - Whether the user has a verified phone number. Optional
-   `has_free_credit` - Whether the user has received free credits. Optional

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#package-objects)

Package Objects

```
class Package(BaseModel)
```

User’s prepaid package information. **Attributes**:

-   `id` - Unique package identifier
-   `user_id` - User identifier
-   `type` - Package type identifier
-   `total` - Total units in the package
-   `balance` - Remaining units in the package
-   `created_at` - Timestamp when the package was purchased
-   `updated_at` - Timestamp when the package was last updated
-   `finished_at` - Timestamp when the package was fully consumed. None if still active

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#fishaudio-types-tts)

fishaudio.types.tts

TTS-related types.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#referenceaudio-objects)

ReferenceAudio Objects

```
class ReferenceAudio(BaseModel)
```

Reference audio for voice cloning/style. **Attributes**:

-   `audio` - Audio file bytes for the reference sample
-   `text` - Transcription of what is spoken in the reference audio. Should match exactly what’s spoken and include punctuation for proper prosody.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#prosody-objects)

Prosody Objects

```
class Prosody(BaseModel)
```

Speech prosody settings (speed and volume). **Attributes**:

-   `speed` - Speech speed multiplier. Range: 0.5-2.0. Default: 1.0.
-   `Examples` - 1.5 = 50% faster, 0.8 = 20% slower
-   `volume` - Volume adjustment in decibels. Range: -20.0 to 20.0. Default: 0.0 (no change). Positive values increase volume, negative values decrease it.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#from_speed_override)

from\_speed\_override

```
@classmethod
def from_speed_override(cls,
                        speed: float,
                        base: Optional["Prosody"] = None) -> "Prosody"
```

Create Prosody with speed override, preserving volume from base. **Arguments**:

-   `speed` - Speed value to use
-   `base` - Base prosody to preserve volume from (if any)

**Returns**: New Prosody instance with overridden speed

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#ttsconfig-objects)

TTSConfig Objects

```
class TTSConfig(BaseModel)
```

TTS generation configuration. Reusable configuration for text-to-speech requests. Create once, use multiple times. All parameters have sensible defaults. **Attributes**:

-   `format` - Audio output format. Options: “mp3”, “wav”, “pcm”, “opus”. Default: “mp3”
-   `sample_rate` - Audio sample rate in Hz. If None, uses format-specific default.
-   `mp3_bitrate` - MP3 bitrate in kbps. Options: 64, 128, 192. Default: 128
-   `opus_bitrate` - Opus bitrate in kbps. Options: -1000, 24, 32, 48, 64. Default: 32
-   `normalize` - Whether to normalize/clean the input text. Default: True
-   `chunk_length` - Characters per generation chunk. Range: 100-300. Default: 200. Lower values = faster initial response, higher values = better quality
-   `latency` - Generation mode. Options: “normal” (higher quality), “balanced” (faster). Default: “balanced”
-   `reference_id` - Voice model ID from fish.audio (e.g., “9a9cf47702da476aa4629e2506d4a857”). Find IDs in voice URLs or via voices.list()
-   `references` - List of reference audio samples for instant voice cloning. Default: \[\]
-   `prosody` - Speech speed and volume settings. Default: None (uses natural prosody)
-   `top_p` - Nucleus sampling parameter for token selection. Range: 0.0-1.0. Default: 0.7
-   `temperature` - Randomness in generation. Range: 0.0-1.0. Default: 0.7. Higher = more varied, lower = more consistent
-   `max_new_tokens` - Maximum number of tokens to generate. Default: 1024
-   `repetition_penalty` - Penalty for repeated tokens. Default: 1.2
-   `min_chunk_length` - Minimum chunk length for generation. Default: 50
-   `condition_on_previous_chunks` - Whether to condition generation on previous chunks. Default: True
-   `early_stop_threshold` - Threshold for early stopping. Default: 1.0

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#ttsrequest-objects)

TTSRequest Objects

```
class TTSRequest(BaseModel)
```

Request parameters for text-to-speech generation. This model is used internally for WebSocket streaming. For the HTTP API, parameters are passed directly to methods. **Attributes**:

-   `text` - Text to synthesize into speech
-   `chunk_length` - Characters per generation chunk. Range: 100-300. Default: 200
-   `format` - Audio output format. Options: “mp3”, “wav”, “pcm”, “opus”. Default: “mp3”
-   `sample_rate` - Audio sample rate in Hz. If None, uses format-specific default
-   `mp3_bitrate` - MP3 bitrate in kbps. Options: 64, 128, 192. Default: 128
-   `opus_bitrate` - Opus bitrate in kbps. Options: -1000, 24, 32, 48, 64. Default: 32
-   `references` - List of reference audio samples for voice cloning. Default: \[\]
-   `reference_id` - Voice model ID for using a specific voice. Default: None
-   `normalize` - Whether to normalize/clean the input text. Default: True
-   `latency` - Generation mode. Options: “normal”, “balanced”. Default: “balanced”
-   `prosody` - Speech speed and volume settings. Default: None
-   `top_p` - Nucleus sampling for token selection. Range: 0.0-1.0. Default: 0.7
-   `temperature` - Randomness in generation. Range: 0.0-1.0. Default: 0.7
-   `max_new_tokens` - Maximum number of tokens to generate. Default: 1024
-   `repetition_penalty` - Penalty for repeated tokens. Default: 1.2
-   `min_chunk_length` - Minimum chunk length for generation. Default: 50
-   `condition_on_previous_chunks` - Whether to condition generation on previous chunks. Default: True
-   `early_stop_threshold` - Threshold for early stopping. Default: 1.0

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#startevent-objects)

StartEvent Objects

```
class StartEvent(BaseModel)
```

WebSocket start event to initiate TTS streaming. **Attributes**:

-   `event` - Event type identifier, always “start”
-   `request` - TTS configuration for the streaming session

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#textevent-objects)

TextEvent Objects

```
class TextEvent(BaseModel)
```

WebSocket event to send a text chunk for synthesis. **Attributes**:

-   `event` - Event type identifier, always “text”
-   `text` - Text chunk to synthesize

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#flushevent-objects)

FlushEvent Objects

```
class FlushEvent(BaseModel)
```

WebSocket event to force immediate audio generation from buffered text. Use this to ensure all buffered text is synthesized without waiting for more input. **Attributes**:

-   `event` - Event type identifier, always “flush”

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#closeevent-objects)

CloseEvent Objects

```
class CloseEvent(BaseModel)
```

WebSocket event to end the streaming session. **Attributes**:

-   `event` - Event type identifier, always “stop”

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#fishaudio-types-shared)

fishaudio.types.shared

Shared types used across the SDK.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#paginatedresponse-objects)

PaginatedResponse Objects

```
class PaginatedResponse(BaseModel, Generic[T])
```

Generic paginated response. **Attributes**:

-   `total` - Total number of items across all pages
-   `items` - List of items on the current page

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#warn_if_deprecated_model)

warn\_if\_deprecated\_model

```
def warn_if_deprecated_model(model: str) -> None
```

Emit a deprecation warning if a legacy model is used.

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#fishaudio-types-asr)

fishaudio.types.asr

ASR (Automatic Speech Recognition) related types.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#asrsegment-objects)

ASRSegment Objects

```
class ASRSegment(BaseModel)
```

A timestamped segment of transcribed text. **Attributes**:

-   `text` - The transcribed text for this segment
-   `start` - Segment start time in seconds
-   `end` - Segment end time in seconds

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#asrresponse-objects)

ASRResponse Objects

```
class ASRResponse(BaseModel)
```

Response from speech-to-text transcription. **Attributes**:

-   `text` - Complete transcription of the entire audio
-   `duration` - Total audio duration in seconds
-   `segments` - List of timestamped text segments. Empty if include\_timestamps=False

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/types#duration)

duration

Duration in seconds

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/sdk/python/types.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/sdk/python/types)
