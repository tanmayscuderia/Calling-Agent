# Stream TTS to a file

Source: https://docs.fish.audio/developer-guide/sdk-guide/cookbook/streaming-to-file

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/streaming-to-file#prerequisites)

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

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/streaming-to-file#recipe)

Recipe

For long text, use [`stream()`](https://docs.fish.audio/api-reference/sdk/python/resources#stream) and write each chunk as it arrives instead of holding the whole file in memory.

```
from fishaudio import FishAudio

client = FishAudio()

with open("output.mp3", "wb") as f:
    for chunk in client.tts.stream(text="A very long passage of text..."):
        f.write(chunk)
```

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/streaming-to-file#collect-instead-of-iterate)

Collect instead of iterate

If you just want the full bytes, call `.collect()`:

```
audio = client.tts.stream(text="Hello!").collect()  # -> bytes
```

`convert()` already returns the complete audio as `bytes` — reach for `stream()` when you want to start writing/forwarding bytes before generation finishes, or to avoid buffering large files.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/streaming-to-file#related)

Related

-   [Text-to-Speech guide](https://docs.fish.audio/features/text-to-speech)
-   [Realtime: LLM tokens → speech](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/realtime-llm-to-speech)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/sdk-guide/cookbook/streaming-to-file.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/sdk-guide/cookbook/streaming-to-file)
