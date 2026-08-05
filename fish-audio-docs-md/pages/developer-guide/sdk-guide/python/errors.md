# Errors & Retries

Source: https://docs.fish.audio/developer-guide/sdk-guide/python/errors

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/python/errors#prerequisites)

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

](https://docs.fish.audio/developer-guide/sdk-guide/python/errors#exception-hierarchy)

Exception hierarchy

Every SDK error inherits from [`FishAudioError`](https://docs.fish.audio/api-reference/sdk/python/exceptions#fishaudioerror-objects). HTTP failures raise [`APIError`](https://docs.fish.audio/api-reference/sdk/python/exceptions#apierror-objects) or one of its subclasses, which expose `.status`, `.message`, and `.body`.

| Exception | Raised when | Notes |
| --- | --- | --- |
| `AuthenticationError` | `401` | Missing or invalid API key |
| `PermissionError` | `403` | Key lacks permission for the resource |
| `NotFoundError` | `404` | Voice model id not found |
| `RateLimitError` | `429` | Rate limit / quota exceeded |
| `ServerError` | `5xx` | Transient server-side failure |
| `APIError` | any other non-2xx | Base for the above; `status == 422` for invalid parameters |
| `WebSocketError` | realtime stream failed mid-session | Reconnect rather than retrying the same socket |
| `DependencyError` | a required system tool is missing (e.g. ffmpeg for `play()`) | Carries `.dependency` and `.install_command` |

There is no separate `ValidationError` raised at runtime. Invalid request parameters come back as an `APIError` with `status == 422` — catch `APIError`, not `ValidationError`.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/python/errors#handling-errors)

Handling errors

```
from fishaudio import FishAudio
from fishaudio.exceptions import (
    AuthenticationError,
    RateLimitError,
    NotFoundError,
    APIError,
    FishAudioError,
)

client = FishAudio()

try:
    audio = client.tts.convert(text="Hello!", reference_id="maybe-missing")
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Rate limited — back off and retry")
except NotFoundError:
    print("That voice model does not exist")
except APIError as e:
    print(f"API error {e.status}: {e.message}")  # includes 422 validation
except FishAudioError as e:
    print(f"SDK error: {e}")  # e.g. WebSocketError, DependencyError
```

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/python/errors#retries)

Retries

The Python client does **not** retry automatically — each call makes a single request and raises on failure. Add your own backoff where it matters, typically around `RateLimitError` and `ServerError`:

```
import time
from fishaudio import FishAudio
from fishaudio.exceptions import RateLimitError, ServerError

client = FishAudio()

def convert_with_retry(text: str, max_retries: int = 3) -> bytes:
    for attempt in range(max_retries):
        try:
            return client.tts.convert(text=text)
        except (RateLimitError, ServerError):
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # exponential backoff
    raise RuntimeError("unreachable")
```

`RequestOptions` accepts a `max_retries` field, but the current client does not act on it — use an explicit loop like the one above.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/python/errors#timeouts)

Timeouts

The request timeout is set on the client (seconds; default `240`):

```
from fishaudio import FishAudio

client = FishAudio(timeout=30.0)
```

Override headers or timeout for a single request with `request_options`:

```
from fishaudio.core.request_options import RequestOptions

audio = client.tts.convert(
    text="Hello!",
    request_options=RequestOptions(timeout=15.0, additional_headers={"X-Trace": "abc"}),
)
```

If you inject your own `httpx_client`, the SDK uses it as-is — the client-level `timeout`, `base_url`, and the `Authorization` header are **not** applied to it. Configure those on the client you pass in.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/python/errors#related)

Related

-   [Exceptions API reference](https://docs.fish.audio/api-reference/sdk/python/exceptions)
-   [Real-time WebSocket](https://docs.fish.audio/features/realtime-streaming) — `WebSocketError` handling

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/sdk-guide/python/errors.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/sdk-guide/python/errors)
