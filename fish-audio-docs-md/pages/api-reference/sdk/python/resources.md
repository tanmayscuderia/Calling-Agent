# Resources

Source: https://docs.fish.audio/api-reference/sdk/python/resources

](https://docs.fish.audio/api-reference/sdk/python/resources#fishaudio-resources-voices)

fishaudio.resources.voices

Voice management namespace client.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#voicesclient-objects)

VoicesClient Objects

```
class VoicesClient()
```

Synchronous voice management operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#list)

list

```
def list(
    *,
    page_size: int = 10,
    page_number: int = 1,
    title: Optional[str] = OMIT,
    tags: Optional[Union[list[str], str]] = OMIT,
    self_only: bool = False,
    author_id: Optional[str] = OMIT,
    language: Optional[Union[list[str], str]] = OMIT,
    title_language: Optional[Union[list[str], str]] = OMIT,
    sort_by: str = "task_count",
    request_options: Optional[RequestOptions] = None
) -> PaginatedResponse[Voice]
```

List available voices/models. **Arguments**:

-   `page_size` - Number of results per page
-   `page_number` - Page number (1-indexed)
-   `title` - Filter by title
-   `tags` - Filter by tags (single tag or list)
-   `self_only` - Only return user’s own voices
-   `author_id` - Filter by author ID
-   `language` - Filter by language(s)
-   `title_language` - Filter by title language(s)
-   `sort_by` - Sort field (“task\_count” or “created\_at”)
-   `request_options` - Request-level overrides

**Returns**: Paginated response with total count and voice items **Example**:

```
client = FishAudio(api_key="...")

# List all voices
voices = client.voices.list(page_size=20)
print(f"Total: {voices.total}")
for voice in voices.items:
    print(f"{voice.title}: {voice.id}")

# Filter by tags
tagged = client.voices.list(tags=["male", "english"])
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#get)

get

```
def get(voice_id: str,
        *,
        request_options: Optional[RequestOptions] = None) -> Voice
```

Get voice by ID. **Arguments**:

-   `voice_id` - Voice model ID
-   `request_options` - Request-level overrides

**Returns**: Voice model details **Example**:

```
client = FishAudio(api_key="...")
voice = client.voices.get("voice_id_here")
print(voice.title, voice.description)
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#create)

create

```
def create(*,
           title: str,
           voices: builtins.list[bytes],
           description: Optional[str] = OMIT,
           texts: Optional[builtins.list[str]] = OMIT,
           tags: Optional[builtins.list[str]] = OMIT,
           cover_image: Optional[bytes] = OMIT,
           visibility: Visibility = "private",
           train_mode: str = "fast",
           enhance_audio_quality: bool = True,
           request_options: Optional[RequestOptions] = None) -> Voice
```

Create/clone a new voice. **Arguments**:

-   `title` - Voice model name
-   `voices` - List of audio file bytes for training
-   `description` - Voice description
-   `texts` - Transcripts for voice samples
-   `tags` - Tags for categorization
-   `cover_image` - Cover image bytes
-   `visibility` - Visibility setting (public, unlist, private)
-   `train_mode` - Training mode (currently only “fast” supported)
-   `enhance_audio_quality` - Whether to enhance audio quality
-   `request_options` - Request-level overrides

**Returns**: Created voice model **Example**:

```
client = FishAudio(api_key="...")

with open("voice1.wav", "rb") as f1, open("voice2.wav", "rb") as f2:
    voice = client.voices.create(
        title="My Voice",
        voices=[f1.read(), f2.read()],
        description="Custom voice clone",
        tags=["custom", "english"]
    )
print(f"Created: {voice.id}")
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#update)

update

```
def update(voice_id: str,
           *,
           title: Optional[str] = OMIT,
           description: Optional[str] = OMIT,
           cover_image: Optional[bytes] = OMIT,
           visibility: Optional[Visibility] = OMIT,
           tags: Optional[builtins.list[str]] = OMIT,
           request_options: Optional[RequestOptions] = None) -> None
```

Update voice metadata. **Arguments**:

-   `voice_id` - Voice model ID
-   `title` - New title
-   `description` - New description
-   `cover_image` - New cover image bytes
-   `visibility` - New visibility setting
-   `tags` - New tags
-   `request_options` - Request-level overrides

**Example**:

```
client = FishAudio(api_key="...")
client.voices.update(
    "voice_id_here",
    title="Updated Title",
    visibility="public"
)
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#delete)

delete

```
def delete(voice_id: str,
           *,
           request_options: Optional[RequestOptions] = None) -> None
```

Delete a voice. **Arguments**:

-   `voice_id` - Voice model ID
-   `request_options` - Request-level overrides

**Example**:

```
client = FishAudio(api_key="...")
client.voices.delete("voice_id_here")
```

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#asyncvoicesclient-objects)

AsyncVoicesClient Objects

```
class AsyncVoicesClient()
```

Asynchronous voice management operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#list-2)

list

```
async def list(
    *,
    page_size: int = 10,
    page_number: int = 1,
    title: Optional[str] = OMIT,
    tags: Optional[Union[list[str], str]] = OMIT,
    self_only: bool = False,
    author_id: Optional[str] = OMIT,
    language: Optional[Union[list[str], str]] = OMIT,
    title_language: Optional[Union[list[str], str]] = OMIT,
    sort_by: str = "task_count",
    request_options: Optional[RequestOptions] = None
) -> PaginatedResponse[Voice]
```

List available voices/models (async). See sync version for details.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#get-2)

get

```
async def get(voice_id: str,
              *,
              request_options: Optional[RequestOptions] = None) -> Voice
```

Get voice by ID (async). See sync version for details.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#create-2)

create

```
async def create(*,
                 title: str,
                 voices: builtins.list[bytes],
                 description: Optional[str] = OMIT,
                 texts: Optional[builtins.list[str]] = OMIT,
                 tags: Optional[builtins.list[str]] = OMIT,
                 cover_image: Optional[bytes] = OMIT,
                 visibility: Visibility = "private",
                 train_mode: str = "fast",
                 enhance_audio_quality: bool = True,
                 request_options: Optional[RequestOptions] = None) -> Voice
```

Create/clone a new voice (async). See sync version for details.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#update-2)

update

```
async def update(voice_id: str,
                 *,
                 title: Optional[str] = OMIT,
                 description: Optional[str] = OMIT,
                 cover_image: Optional[bytes] = OMIT,
                 visibility: Optional[Visibility] = OMIT,
                 tags: Optional[builtins.list[str]] = OMIT,
                 request_options: Optional[RequestOptions] = None) -> None
```

Update voice metadata (async). See sync version for details.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#delete-2)

delete

```
async def delete(voice_id: str,
                 *,
                 request_options: Optional[RequestOptions] = None) -> None
```

Delete a voice (async). See sync version for details.

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#fishaudio-resources-account)

fishaudio.resources.account

Account namespace client for billing and credits.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#accountclient-objects)

AccountClient Objects

```
class AccountClient()
```

Synchronous account operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#get_credits)

get\_credits

```
def get_credits(*,
                check_free_credit: Optional[bool] = OMIT,
                request_options: Optional[RequestOptions] = None) -> Credits
```

Get API credit balance. **Arguments**:

-   `check_free_credit` - Whether to check free credit availability
-   `request_options` - Request-level overrides

**Returns**: Credits information **Example**:

```
client = FishAudio(api_key="...")
credits = client.account.get_credits()
print(f"Available credits: {float(credits.credit)}")

# Check free credit availability
credits = client.account.get_credits(check_free_credit=True)
if credits.has_free_credit:
    print("Free credits available!")
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#get_package)

get\_package

```
def get_package(*,
                request_options: Optional[RequestOptions] = None) -> Package
```

Get package information. **Arguments**:

-   `request_options` - Request-level overrides

**Returns**: Package information **Example**:

```
client = FishAudio(api_key="...")
package = client.account.get_package()
print(f"Balance: {package.balance}/{package.total}")
```

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#asyncaccountclient-objects)

AsyncAccountClient Objects

```
class AsyncAccountClient()
```

Asynchronous account operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#get_credits-2)

get\_credits

```
async def get_credits(
        *,
        check_free_credit: Optional[bool] = OMIT,
        request_options: Optional[RequestOptions] = None) -> Credits
```

Get API credit balance (async). **Arguments**:

-   `check_free_credit` - Whether to check free credit availability
-   `request_options` - Request-level overrides

**Returns**: Credits information **Example**:

```
client = AsyncFishAudio(api_key="...")
credits = await client.account.get_credits()
print(f"Available credits: {float(credits.credit)}")

# Check free credit availability
credits = await client.account.get_credits(check_free_credit=True)
if credits.has_free_credit:
    print("Free credits available!")
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#get_package-2)

get\_package

```
async def get_package(*,
                      request_options: Optional[RequestOptions] = None
                      ) -> Package
```

Get package information (async). **Arguments**:

-   `request_options` - Request-level overrides

**Returns**: Package information **Example**:

```
client = AsyncFishAudio(api_key="...")
package = await client.account.get_package()
print(f"Balance: {package.balance}/{package.total}")
```

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#fishaudio-resources-tts)

fishaudio.resources.tts

TTS (Text-to-Speech) namespace client.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#ttsclient-objects)

TTSClient Objects

```
class TTSClient()
```

Synchronous TTS operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#stream)

stream

```
def stream(*,
           text: str,
           reference_id: Optional[str] = None,
           references: Optional[list[ReferenceAudio]] = None,
           format: Optional[AudioFormat] = None,
           latency: Optional[LatencyMode] = None,
           speed: Optional[float] = None,
           config: TTSConfig = TTSConfig(),
           model: Model = "s2-pro",
           request_options: Optional[RequestOptions] = None) -> AudioStream
```

Stream text-to-speech audio chunks. **Arguments**:

-   `text` - Text to synthesize
-   `reference_id` - Voice reference ID (overrides config.reference\_id if provided)
-   `references` - Reference audio samples (overrides config.references if provided)
-   `format` - Audio format - “mp3”, “wav”, “pcm”, or “opus” (overrides config.format if provided)
-   `latency` - Latency mode - “normal” or “balanced” (overrides config.latency if provided)
-   `speed` - Speech speed multiplier, e.g. 1.5 for 1.5x speed (overrides config.prosody.speed if provided)
-   `config` - TTS configuration (audio settings, voice, model parameters)
-   `model` - TTS model to use
-   `request_options` - Request-level overrides

**Returns**: AudioStream object that can be iterated for audio chunks **Example**:

```
from fishaudio import FishAudio

client = FishAudio(api_key="...")

# Stream and process chunks
for chunk in client.tts.stream(text="Hello world"):
    process_audio_chunk(chunk)

# Or collect all at once
audio = client.tts.stream(text="Hello world").collect()
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#convert)

convert

```
def convert(*,
            text: str,
            reference_id: Optional[str] = None,
            references: Optional[list[ReferenceAudio]] = None,
            format: Optional[AudioFormat] = None,
            latency: Optional[LatencyMode] = None,
            speed: Optional[float] = None,
            config: TTSConfig = TTSConfig(),
            model: Model = "s2-pro",
            request_options: Optional[RequestOptions] = None) -> bytes
```

Convert text to speech and return complete audio as bytes. This is a convenience method that streams all audio chunks and combines them. For chunk-by-chunk processing, use stream() instead. **Arguments**:

-   `text` - Text to synthesize
-   `reference_id` - Voice reference ID (overrides config.reference\_id if provided)
-   `references` - Reference audio samples (overrides config.references if provided)
-   `format` - Audio format - “mp3”, “wav”, “pcm”, or “opus” (overrides config.format if provided)
-   `latency` - Latency mode - “normal” or “balanced” (overrides config.latency if provided)
-   `speed` - Speech speed multiplier, e.g. 1.5 for 1.5x speed (overrides config.prosody.speed if provided)
-   `config` - TTS configuration (audio settings, voice, model parameters)
-   `model` - TTS model to use
-   `request_options` - Request-level overrides

**Returns**: Complete audio as bytes **Example**:

```
from fishaudio import FishAudio
from fishaudio.utils import play, save

client = FishAudio(api_key="...")

# Get complete audio
audio = client.tts.convert(text="Hello world")

# Play it
play(audio)

# Or save it
save(audio, "output.mp3")
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#stream_websocket)

stream\_websocket

```
def stream_websocket(
        text_stream: Iterable[Union[str, TextEvent, FlushEvent]],
        *,
        reference_id: Optional[str] = None,
        references: Optional[list[ReferenceAudio]] = None,
        format: Optional[AudioFormat] = None,
        latency: Optional[LatencyMode] = None,
        speed: Optional[float] = None,
        config: TTSConfig = TTSConfig(),
        model: Model = "s2-pro",
        max_workers: int = 10,
        ws_options: Optional[WebSocketOptions] = None) -> Iterator[bytes]
```

Stream text and receive audio in real-time via WebSocket. Perfect for conversational AI, live captioning, and streaming applications. **Arguments**:

-   `text_stream` - Iterator of text chunks to stream
-   `reference_id` - Voice reference ID (overrides config.reference\_id if provided)
-   `references` - Reference audio samples (overrides config.references if provided)
-   `format` - Audio format - “mp3”, “wav”, “pcm”, or “opus” (overrides config.format if provided)
-   `latency` - Latency mode - “normal” or “balanced” (overrides config.latency if provided)
-   `speed` - Speech speed multiplier, e.g. 1.5 for 1.5x speed (overrides config.prosody.speed if provided)
-   `config` - TTS configuration (audio settings, voice, model parameters)
-   `model` - TTS model to use
-   `max_workers` - ThreadPoolExecutor workers for concurrent sender
-   `ws_options` - WebSocket connection options for configuring timeouts, message size limits, etc. Useful for long-running generations that may exceed default timeout values. See WebSocketOptions class for available parameters.

**Returns**: Iterator of audio bytes **Example**:

```
from fishaudio import FishAudio, TTSConfig, ReferenceAudio, WebSocketOptions

client = FishAudio(api_key="...")

def text_generator():
    yield "Hello, "
    yield "this is "
    yield "streaming text!"

# Simple usage with defaults
with open("output.mp3", "wb") as f:
    for audio_chunk in client.tts.stream_websocket(text_generator()):
        f.write(audio_chunk)

# With format and speed parameters
with open("output.wav", "wb") as f:
    for audio_chunk in client.tts.stream_websocket(
        text_generator(),
        format="wav",
        speed=1.3
    ):
        f.write(audio_chunk)

# With reference_id parameter
with open("output.mp3", "wb") as f:
    for audio_chunk in client.tts.stream_websocket(text_generator(), reference_id="your_model_id"):
        f.write(audio_chunk)

# With references parameter
with open("output.mp3", "wb") as f:
    for audio_chunk in client.tts.stream_websocket(
        text_generator(),
        references=[ReferenceAudio(audio=audio_bytes, text="sample")]
    ):
        f.write(audio_chunk)

# With WebSocket options for long-running generations
# Useful if you're generating very long responses that may take >20 seconds
ws_options = WebSocketOptions(keepalive_ping_timeout_seconds=60.0)
with open("output.mp3", "wb") as f:
    for audio_chunk in client.tts.stream_websocket(
        text_generator(),
        ws_options=ws_options
    ):
        f.write(audio_chunk)

# Parameters override config values
config = TTSConfig(format="mp3", latency="balanced")
with open("output.wav", "wb") as f:
    for audio_chunk in client.tts.stream_websocket(
        text_generator(),
        format="wav",  # Parameter wins
        config=config
    ):
        f.write(audio_chunk)
```

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#asyncttsclient-objects)

AsyncTTSClient Objects

```
class AsyncTTSClient()
```

Asynchronous TTS operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#stream-2)

stream

```
async def stream(
        *,
        text: str,
        reference_id: Optional[str] = None,
        references: Optional[list[ReferenceAudio]] = None,
        format: Optional[AudioFormat] = None,
        latency: Optional[LatencyMode] = None,
        speed: Optional[float] = None,
        config: TTSConfig = TTSConfig(),
        model: Model = "s2-pro",
        request_options: Optional[RequestOptions] = None) -> AsyncAudioStream
```

Stream text-to-speech audio chunks (async). **Arguments**:

-   `text` - Text to synthesize
-   `reference_id` - Voice reference ID (overrides config.reference\_id if provided)
-   `references` - Reference audio samples (overrides config.references if provided)
-   `format` - Audio format - “mp3”, “wav”, “pcm”, or “opus” (overrides config.format if provided)
-   `latency` - Latency mode - “normal” or “balanced” (overrides config.latency if provided)
-   `speed` - Speech speed multiplier, e.g. 1.5 for 1.5x speed (overrides config.prosody.speed if provided)
-   `config` - TTS configuration (audio settings, voice, model parameters)
-   `model` - TTS model to use
-   `request_options` - Request-level overrides

**Returns**: AsyncAudioStream object that can be iterated for audio chunks **Example**:

```
from fishaudio import AsyncFishAudio

client = AsyncFishAudio(api_key="...")

# Stream and process chunks
async for chunk in await client.tts.stream(text="Hello world"):
    await process_audio_chunk(chunk)

# Or collect all at once
stream = await client.tts.stream(text="Hello world")
audio = await stream.collect()
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#convert-2)

convert

```
async def convert(*,
                  text: str,
                  reference_id: Optional[str] = None,
                  references: Optional[list[ReferenceAudio]] = None,
                  format: Optional[AudioFormat] = None,
                  latency: Optional[LatencyMode] = None,
                  speed: Optional[float] = None,
                  config: TTSConfig = TTSConfig(),
                  model: Model = "s2-pro",
                  request_options: Optional[RequestOptions] = None) -> bytes
```

Convert text to speech and return complete audio as bytes (async). This is a convenience method that streams all audio chunks and combines them. For chunk-by-chunk processing, use stream() instead. **Arguments**:

-   `text` - Text to synthesize
-   `reference_id` - Voice reference ID (overrides config.reference\_id if provided)
-   `references` - Reference audio samples (overrides config.references if provided)
-   `format` - Audio format - “mp3”, “wav”, “pcm”, or “opus” (overrides config.format if provided)
-   `latency` - Latency mode - “normal” or “balanced” (overrides config.latency if provided)
-   `speed` - Speech speed multiplier, e.g. 1.5 for 1.5x speed (overrides config.prosody.speed if provided)
-   `config` - TTS configuration (audio settings, voice, model parameters)
-   `model` - TTS model to use
-   `request_options` - Request-level overrides

**Returns**: Complete audio as bytes **Example**:

```
from fishaudio import AsyncFishAudio
from fishaudio.utils import play, save

client = AsyncFishAudio(api_key="...")

# Get complete audio
audio = await client.tts.convert(text="Hello world")

# Play it
play(audio)

# Or save it
save(audio, "output.mp3")
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#stream_websocket-2)

stream\_websocket

```
async def stream_websocket(text_stream: AsyncIterable[Union[str, TextEvent,
                                                            FlushEvent]],
                           *,
                           reference_id: Optional[str] = None,
                           references: Optional[list[ReferenceAudio]] = None,
                           format: Optional[AudioFormat] = None,
                           latency: Optional[LatencyMode] = None,
                           speed: Optional[float] = None,
                           config: TTSConfig = TTSConfig(),
                           model: Model = "s2-pro",
                           ws_options: Optional[WebSocketOptions] = None)
```

Stream text and receive audio in real-time via WebSocket (async). Perfect for conversational AI, live captioning, and streaming applications. **Arguments**:

-   `text_stream` - Async iterator of text chunks to stream
-   `reference_id` - Voice reference ID (overrides config.reference\_id if provided)
-   `references` - Reference audio samples (overrides config.references if provided)
-   `format` - Audio format - “mp3”, “wav”, “pcm”, or “opus” (overrides config.format if provided)
-   `latency` - Latency mode - “normal” or “balanced” (overrides config.latency if provided)
-   `speed` - Speech speed multiplier, e.g. 1.5 for 1.5x speed (overrides config.prosody.speed if provided)
-   `config` - TTS configuration (audio settings, voice, model parameters)
-   `model` - TTS model to use
-   `ws_options` - WebSocket connection options for configuring timeouts, message size limits, etc. Useful for long-running generations that may exceed default timeout values. See WebSocketOptions class for available parameters.

**Returns**: Async iterator of audio bytes **Example**:

```
from fishaudio import AsyncFishAudio, TTSConfig, ReferenceAudio, WebSocketOptions

client = AsyncFishAudio(api_key="...")

async def text_generator():
    yield "Hello, "
    yield "this is "
    yield "async streaming!"

# Simple usage with defaults
async with aiofiles.open("output.mp3", "wb") as f:
    async for audio_chunk in client.tts.stream_websocket(text_generator()):
        await f.write(audio_chunk)

# With format and speed parameters
async with aiofiles.open("output.wav", "wb") as f:
    async for audio_chunk in client.tts.stream_websocket(
        text_generator(),
        format="wav",
        speed=1.3
    ):
        await f.write(audio_chunk)

# With reference_id parameter
async with aiofiles.open("output.mp3", "wb") as f:
    async for audio_chunk in client.tts.stream_websocket(text_generator(), reference_id="your_model_id"):
        await f.write(audio_chunk)

# With references parameter
async with aiofiles.open("output.mp3", "wb") as f:
    async for audio_chunk in client.tts.stream_websocket(
        text_generator(),
        references=[ReferenceAudio(audio=audio_bytes, text="sample")]
    ):
        await f.write(audio_chunk)

# With WebSocket options for long-running generations
# Useful if you're generating very long responses that may take >20 seconds
ws_options = WebSocketOptions(keepalive_ping_timeout_seconds=60.0)
async with aiofiles.open("output.mp3", "wb") as f:
    async for audio_chunk in client.tts.stream_websocket(
        text_generator(),
        ws_options=ws_options
    ):
        await f.write(audio_chunk)

# Parameters override config values
config = TTSConfig(format="mp3", latency="balanced")
async with aiofiles.open("output.wav", "wb") as f:
    async for audio_chunk in client.tts.stream_websocket(
        text_generator(),
        format="wav",  # Parameter wins
        config=config
    ):
        await f.write(audio_chunk)
```

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#fishaudio-resources-realtime)

fishaudio.resources.realtime

Real-time WebSocket streaming helpers.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#iter_websocket_audio)

iter\_websocket\_audio

```
def iter_websocket_audio(ws) -> Iterator[bytes]
```

Process WebSocket audio messages (sync). Receives messages from WebSocket, yields audio chunks, handles errors. Unknown events are ignored and iteration continues. **Arguments**:

-   `ws` - WebSocket connection from httpx\_ws.connect\_ws

**Yields**: Audio bytes **Raises**:

-   `WebSocketError` - On disconnect or error finish event

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#aiter_websocket_audio)

aiter\_websocket\_audio

```
async def aiter_websocket_audio(ws) -> AsyncIterator[bytes]
```

Process WebSocket audio messages (async). Receives messages from WebSocket, yields audio chunks, handles errors. Unknown events are ignored and iteration continues. **Arguments**:

-   `ws` - WebSocket connection from httpx\_ws.aconnect\_ws

**Yields**: Audio bytes **Raises**:

-   `WebSocketError` - On disconnect or error finish event

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#fishaudio-resources-asr)

fishaudio.resources.asr

ASR (Automatic Speech Recognition) namespace client.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#asrclient-objects)

ASRClient Objects

```
class ASRClient()
```

Synchronous ASR operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#transcribe)

transcribe

```
def transcribe(
        *,
        audio: bytes,
        language: Optional[str] = OMIT,
        include_timestamps: bool = True,
        request_options: Optional[RequestOptions] = None) -> ASRResponse
```

Transcribe audio to text. **Arguments**:

-   `audio` - Audio file bytes
-   `language` - Language code (e.g., “en”, “zh”). Auto-detected if not provided.
-   `include_timestamps` - Whether to include timestamp information for segments
-   `request_options` - Request-level overrides

**Returns**: ASRResponse with transcription text, duration, and segments **Example**:

```
client = FishAudio(api_key="...")

with open("audio.mp3", "rb") as f:
    audio_bytes = f.read()

result = client.asr.transcribe(audio=audio_bytes, language="en")
print(result.text)
for segment in result.segments:
    print(f"{segment.start}-{segment.end}: {segment.text}")
```

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#asyncasrclient-objects)

AsyncASRClient Objects

```
class AsyncASRClient()
```

Asynchronous ASR operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/resources#transcribe-2)

transcribe

```
async def transcribe(
        *,
        audio: bytes,
        language: Optional[str] = OMIT,
        include_timestamps: bool = True,
        request_options: Optional[RequestOptions] = None) -> ASRResponse
```

Transcribe audio to text (async). **Arguments**:

-   `audio` - Audio file bytes
-   `language` - Language code (e.g., “en”, “zh”). Auto-detected if not provided.
-   `include_timestamps` - Whether to include timestamp information for segments
-   `request_options` - Request-level overrides

**Returns**: ASRResponse with transcription text, duration, and segments **Example**:

```
client = AsyncFishAudio(api_key="...")

async with aiofiles.open("audio.mp3", "rb") as f:
    audio_bytes = await f.read()

result = await client.asr.transcribe(audio=audio_bytes, language="en")
print(result.text)
for segment in result.segments:
    print(f"{segment.start}-{segment.end}: {segment.text}")
```

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/sdk/python/resources.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/sdk/python/resources)
