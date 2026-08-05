# Batch-transcribe files with a language hint

Source: https://docs.fish.audio/developer-guide/sdk-guide/cookbook/batch-transcribe-with-language-hint

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/batch-transcribe-with-language-hint#prerequisites)

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

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/batch-transcribe-with-language-hint#recipe)

Recipe

Read each file’s bytes from disk and pass them to [`asr.transcribe()`](https://docs.fish.audio/api-reference/sdk/python/resources#transcribe) with an explicit `language`. A language hint is more reliable than auto-detection when you already know the source language, especially for phonetically similar languages. Collect one result row per file as you go.

```
from fishaudio import FishAudio

client = FishAudio()

paths = ["speech.wav"]  # add more file paths here
language = "en"

results = []
for path in paths:
    with open(path, "rb") as f:
        audio = f.read()

    transcript = client.asr.transcribe(audio=audio, language=language)
    results.append({
        "file": path,
        "text": transcript.text,
        "duration": transcript.duration,  # seconds
    })

for row in results:
    print(f"{row['file']} ({row['duration']:.1f}s): {row['text']}")
```

Each call returns an [`ASRResponse`](https://docs.fish.audio/api-reference/sdk/python/types#asrresponse-objects) with `.text`, a `.duration` in seconds, and per-phrase `.segments`. The loop keeps files independent, so one bad file does not block the rest of the batch.

Auto-detection (omit `language`) works well, but passing an explicit `language` improves accuracy for similar-sounding languages. Use one `language` per batch — split mixed-language files into separate lists.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/batch-transcribe-with-language-hint#related)

Related

-   [Speech-to-Text guide](https://docs.fish.audio/features/speech-to-text)
-   [Instant voice cloning](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/instant-voice-cloning)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/sdk-guide/cookbook/batch-transcribe-with-language-hint.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/sdk-guide/cookbook/batch-transcribe-with-language-hint)
