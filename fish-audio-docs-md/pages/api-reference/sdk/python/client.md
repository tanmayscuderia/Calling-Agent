# Client

Source: https://docs.fish.audio/api-reference/sdk/python/client

](https://docs.fish.audio/api-reference/sdk/python/client#fishaudio-client)

fishaudio.client

Main Fish Audio client classes.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#fishaudio-objects)

FishAudio Objects

```
class FishAudio()
```

Synchronous Fish Audio API client. **Example**:

```
from fishaudio import FishAudio

client = FishAudio(api_key="your_api_key")

# Generate speech
audio = client.tts.convert(text="Hello world")
with open("output.mp3", "wb") as f:
    for chunk in audio:
        f.write(chunk)

# List voices
voices = client.voices.list(page_size=20)
print(f"Found {voices.total} voices")
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#__init__)

\_\_init\_\_

```
def __init__(*,
             api_key: Optional[str] = None,
             base_url: str = "https://api.fish.audio",
             timeout: float = 240.0,
             httpx_client: Optional[httpx.Client] = None)
```

Initialize Fish Audio client. **Arguments**:

-   `api_key` - API key (can also use FISH\_API\_KEY env var)
-   `base_url` - API base URL
-   `timeout` - Request timeout in seconds
-   `httpx_client` - Optional custom HTTP client

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#tts)

tts

```
@property
def tts() -> TTSClient
```

Access TTS (text-to-speech) operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#asr)

asr

```
@property
def asr() -> ASRClient
```

Access ASR (speech-to-text) operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#voices)

voices

```
@property
def voices() -> VoicesClient
```

Access voice management operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#account)

account

```
@property
def account() -> AccountClient
```

Access account/billing operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#close)

close

```
def close() -> None
```

Close the HTTP client.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#asyncfishaudio-objects)

AsyncFishAudio Objects

```
class AsyncFishAudio()
```

Asynchronous Fish Audio API client. **Example**:

```
from fishaudio import AsyncFishAudio

async def main():
    client = AsyncFishAudio(api_key="your_api_key")

    # Generate speech
    audio = client.tts.convert(text="Hello world")
    async with aiofiles.open("output.mp3", "wb") as f:
        async for chunk in audio:
            await f.write(chunk)

    # List voices
    voices = await client.voices.list(page_size=20)
    print(f"Found {voices.total} voices")

asyncio.run(main())
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#__init__-2)

\_\_init\_\_

```
def __init__(*,
             api_key: Optional[str] = None,
             base_url: str = "https://api.fish.audio",
             timeout: float = 240.0,
             httpx_client: Optional[httpx.AsyncClient] = None)
```

Initialize async Fish Audio client. **Arguments**:

-   `api_key` - API key (can also use FISH\_API\_KEY env var)
-   `base_url` - API base URL
-   `timeout` - Request timeout in seconds
-   `httpx_client` - Optional custom async HTTP client

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#tts-2)

tts

```
@property
def tts() -> AsyncTTSClient
```

Access TTS (text-to-speech) operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#asr-2)

asr

```
@property
def asr() -> AsyncASRClient
```

Access ASR (speech-to-text) operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#voices-2)

voices

```
@property
def voices() -> AsyncVoicesClient
```

Access voice management operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#account-2)

account

```
@property
def account() -> AsyncAccountClient
```

Access account/billing operations.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/client#close-2)

close

```
async def close() -> None
```

Close the HTTP client.

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/sdk/python/client.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/sdk/python/client)
