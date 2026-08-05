# Core

Source: https://docs.fish.audio/api-reference/sdk/python/core

](https://docs.fish.audio/api-reference/sdk/python/core#fishaudio-core-client_wrapper)

fishaudio.core.client\_wrapper

HTTP client wrapper for managing requests and authentication.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#baseclientwrapper-objects)

BaseClientWrapper Objects

```
class BaseClientWrapper()
```

Base wrapper with shared logic for sync/async clients.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#get_headers)

get\_headers

```
def get_headers(
        additional_headers: Optional[dict[str, str]] = None) -> dict[str, str]
```

Build headers including authentication and user agent.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#clientwrapper-objects)

ClientWrapper Objects

```
class ClientWrapper(BaseClientWrapper)
```

Wrapper for httpx.Client that handles authentication and error handling.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#request)

request

```
def request(method: str,
            path: str,
            *,
            request_options: Optional[RequestOptions] = None,
            **kwargs: Any) -> httpx.Response
```

Make an HTTP request with error handling. **Arguments**:

-   `method` - HTTP method (GET, POST, etc.)
-   `path` - API endpoint path
-   `request_options` - Optional request-level overrides
-   `**kwargs` - Additional arguments to pass to httpx.request

**Returns**: httpx.Response object **Raises**:

-   `APIError` - On non-2xx responses

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#client)

client

```
@property
def client() -> httpx.Client
```

Get underlying httpx.Client for advanced usage (e.g., WebSockets).

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#close)

close

```
def close() -> None
```

Close the HTTP client.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#asyncclientwrapper-objects)

AsyncClientWrapper Objects

```
class AsyncClientWrapper(BaseClientWrapper)
```

Wrapper for httpx.AsyncClient that handles authentication and error handling.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#request-2)

request

```
async def request(method: str,
                  path: str,
                  *,
                  request_options: Optional[RequestOptions] = None,
                  **kwargs: Any) -> httpx.Response
```

Make an async HTTP request with error handling. **Arguments**:

-   `method` - HTTP method (GET, POST, etc.)
-   `path` - API endpoint path
-   `request_options` - Optional request-level overrides
-   `**kwargs` - Additional arguments to pass to httpx.request

**Returns**: httpx.Response object **Raises**:

-   `APIError` - On non-2xx responses

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#client-2)

client

```
@property
def client() -> httpx.AsyncClient
```

Get underlying httpx.AsyncClient for advanced usage (e.g., WebSockets).

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#close-2)

close

```
async def close() -> None
```

Close the HTTP client.

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#fishaudio-core-request_options)

fishaudio.core.request\_options

Request-level options for API calls.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#requestoptions-objects)

RequestOptions Objects

```
class RequestOptions()
```

Options that can be provided on a per-request basis to override client defaults. **Attributes**:

-   `timeout` - Override the client’s default timeout (in seconds)
-   `max_retries` - Override the client’s default max retries
-   `additional_headers` - Additional headers to include in the request
-   `additional_query_params` - Additional query parameters to include

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#get_timeout)

get\_timeout

```
def get_timeout() -> Optional[httpx.Timeout]
```

Convert timeout to httpx.Timeout if set.

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#fishaudio-core-iterators)

fishaudio.core.iterators

Audio stream wrappers with collection utilities.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#audiostream-objects)

AudioStream Objects

```
class AudioStream()
```

Wrapper for sync audio byte streams with collection utilities. This class wraps an iterator of audio bytes and provides a convenient `.collect()` method to gather all chunks into a single bytes object. **Examples**:

```
from fishaudio import FishAudio

client = FishAudio(api_key="...")

# Collect all audio at once
audio = client.tts.stream(text="Hello!").collect()

# Or stream chunks manually
for chunk in client.tts.stream(text="Hello!"):
    process_chunk(chunk)
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#__init__)

\_\_init\_\_

```
def __init__(iterator: Iterator[bytes])
```

Initialize the audio iterator wrapper. **Arguments**:

-   `iterator` - The underlying iterator of audio bytes

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#__iter__)

\_\_iter\_\_

```
def __iter__() -> Iterator[bytes]
```

Allow direct iteration over audio chunks.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#collect)

collect

```
def collect() -> bytes
```

Collect all audio chunks into a single bytes object. This consumes the iterator and returns all audio data as bytes. After calling this method, the iterator cannot be used again. **Returns**: Complete audio data as bytes **Examples**:

```
audio = client.tts.stream(text="Hello!").collect()
with open("output.mp3", "wb") as f:
    f.write(audio)
```

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#asyncaudiostream-objects)

AsyncAudioStream Objects

```
class AsyncAudioStream()
```

Wrapper for async audio byte streams with collection utilities. This class wraps an async iterator of audio bytes and provides a convenient `.collect()` method to gather all chunks into a single bytes object. **Examples**:

```
from fishaudio import AsyncFishAudio

client = AsyncFishAudio(api_key="...")

# Collect all audio at once
stream = await client.tts.stream(text="Hello!")
audio = await stream.collect()

# Or stream chunks manually
async for chunk in await client.tts.stream(text="Hello!"):
    await process_chunk(chunk)
```

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#__init__-2)

\_\_init\_\_

```
def __init__(async_iterator: AsyncIterator[bytes])
```

Initialize the async audio iterator wrapper. **Arguments**:

-   `async_iterator` - The underlying async iterator of audio bytes

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#__aiter__)

\_\_aiter\_\_

```
def __aiter__() -> AsyncIterator[bytes]
```

Allow direct async iteration over audio chunks.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#collect-2)

collect

```
async def collect() -> bytes
```

Collect all audio chunks into a single bytes object. This consumes the async iterator and returns all audio data as bytes. After calling this method, the iterator cannot be used again. **Returns**: Complete audio data as bytes **Examples**:

```
stream = await client.tts.stream(text="Hello!")
audio = await stream.collect()
with open("output.mp3", "wb") as f:
    f.write(audio)
```

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#fishaudio-core-websocket_options)

fishaudio.core.websocket\_options

WebSocket-level options for WebSocket connections.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#websocketoptions-objects)

WebSocketOptions Objects

```
class WebSocketOptions()
```

Options for configuring WebSocket connections. These options are passed directly to httpx\_ws’s connect\_ws/aconnect\_ws functions. For complete documentation, see [https://frankie567.github.io/httpx-ws/reference/httpx\_ws/](https://frankie567.github.io/httpx-ws/reference/httpx_ws/) **Attributes**:

-   `keepalive_ping_timeout_seconds` - Maximum delay the client will wait for an answer to its Ping event. If the delay is exceeded, WebSocketNetworkError will be raised and the connection closed. Default: 20 seconds.
-   `keepalive_ping_interval_seconds` - Interval at which the client will automatically send a Ping event to keep the connection alive. Set to None to disable this mechanism. Default: 20 seconds.
-   `max_message_size_bytes` - Message size in bytes to receive from the server.
-   `Default` - 65536 bytes (64 KiB).
-   `queue_size` - Size of the queue where received messages will be held until they are consumed. If the queue is full, the client will stop receiving messages from the server until the queue has room available. Default: 512.

**Notes**: Parameter descriptions adapted from httpx\_ws documentation.

#### 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#to_httpx_ws_kwargs)

to\_httpx\_ws\_kwargs

```
def to_httpx_ws_kwargs() -> dict[str, Any]
```

Convert to kwargs dict for httpx\_ws aconnect\_ws/connect\_ws.

# 

[​

](https://docs.fish.audio/api-reference/sdk/python/core#fishaudio-core-omit)

fishaudio.core.omit

OMIT sentinel for distinguishing None from not-provided parameters.

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/sdk/python/core.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/sdk/python/core)
