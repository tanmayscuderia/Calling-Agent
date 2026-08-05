# Exceptions

Source: https://docs.fish.audio/api-reference/sdk/python/exceptions

](https://docs.fish.audio/api-reference/sdk/python/exceptions#fishaudio-exceptions)

fishaudio.exceptions

Custom exceptions for the Fish Audio SDK.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/exceptions#fishaudioerror-objects)

FishAudioError Objects

```
class FishAudioError(Exception)
```

Base exception for all Fish Audio SDK errors.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/exceptions#apierror-objects)

APIError Objects

```
class APIError(FishAudioError)
```

Raised when the API returns an error response.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/exceptions#authenticationerror-objects)

AuthenticationError Objects

```
class AuthenticationError(APIError)
```

Raised when authentication fails (401).

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/exceptions#permissionerror-objects)

PermissionError Objects

```
class PermissionError(APIError)
```

Raised when permission is denied (403).

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/exceptions#notfounderror-objects)

NotFoundError Objects

```
class NotFoundError(APIError)
```

Raised when a resource is not found (404).

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/exceptions#ratelimiterror-objects)

RateLimitError Objects

```
class RateLimitError(APIError)
```

Raised when rate limit is exceeded (429).

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/exceptions#servererror-objects)

ServerError Objects

```
class ServerError(APIError)
```

Raised when the server encounters an error (5xx).

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/exceptions#websocketerror-objects)

WebSocketError Objects

```
class WebSocketError(FishAudioError)
```

Raised when WebSocket connection or streaming fails.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/exceptions#validationerror-objects)

ValidationError Objects

```
class ValidationError(FishAudioError)
```

Raised when request validation fails.

## 

[​

](https://docs.fish.audio/api-reference/sdk/python/exceptions#dependencyerror-objects)

DependencyError Objects

```
class DependencyError(FishAudioError)
```

Raised when a required dependency is missing.

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/api-reference/sdk/python/exceptions.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/api-reference/sdk/python/exceptions)
