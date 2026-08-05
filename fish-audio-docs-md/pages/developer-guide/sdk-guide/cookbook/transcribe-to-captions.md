# Transcribe audio to SRT/VTT captions

Source: https://docs.fish.audio/developer-guide/sdk-guide/cookbook/transcribe-to-captions

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/transcribe-to-captions#prerequisites)

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

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/transcribe-to-captions#recipe)

Recipe

Call [`asr.transcribe()`](https://docs.fish.audio/api-reference/sdk/python/resources#transcribe) with `include_timestamps=True`, then turn each [`ASRSegment`](https://docs.fish.audio/api-reference/sdk/python/types#asrsegment-objects) into a numbered cue. Segment `start` / `end` are in **seconds**, so the only real work is formatting them — SRT wants `HH:MM:SS,mmm` (comma), WebVTT wants `HH:MM:SS.mmm` (dot).

```
from fishaudio import FishAudio

client = FishAudio()


def to_srt_timestamp(seconds: float) -> str:
    """Format a time in seconds as an SRT timestamp: HH:MM:SS,mmm."""
    millis = round(seconds * 1000)
    hours, millis = divmod(millis, 3_600_000)
    minutes, millis = divmod(millis, 60_000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


with open("speech.wav", "rb") as f:
    result = client.asr.transcribe(audio=f.read(), include_timestamps=True)

# SRT: 1-based index, comma decimal separator, blank line between cues.
with open("captions.srt", "w", encoding="utf-8") as srt:
    for i, segment in enumerate(result.segments, start=1):
        start = to_srt_timestamp(segment.start)
        end = to_srt_timestamp(segment.end)
        srt.write(f"{i}\n{start} --> {end}\n{segment.text.strip()}\n\n")

# WebVTT: same cues, "WEBVTT" header, dot decimal separator.
with open("captions.vtt", "w", encoding="utf-8") as vtt:
    vtt.write("WEBVTT\n\n")
    for segment in result.segments:
        start = to_srt_timestamp(segment.start).replace(",", ".")
        end = to_srt_timestamp(segment.end).replace(",", ".")
        vtt.write(f"{start} --> {end}\n{segment.text.strip()}\n\n")

print(f"Wrote {len(result.segments)} cues to captions.srt and captions.vtt")
```

Both files share one timestamp helper — WebVTT is just the SRT formatting with `,` swapped for `.`, so there is no second formatter to keep in sync.

Pass `language=` (for example `"en"` or `"zh"`) when you know it — explicit language selection sharpens segment boundaries, which keeps your cue timing tight.

## 

[​

](https://docs.fish.audio/developer-guide/sdk-guide/cookbook/transcribe-to-captions#related)

Related

-   [Speech-to-Text guide](https://docs.fish.audio/features/speech-to-text)
-   [ASR Types Reference](https://docs.fish.audio/api-reference/sdk/python/types#asr)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/sdk-guide/cookbook/transcribe-to-captions.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/sdk-guide/cookbook/transcribe-to-captions)
