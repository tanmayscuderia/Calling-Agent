# Quick Start

Source: https://docs.fish.audio/developer-guide/getting-started/quickstart

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/quickstart#overview)

Overview

This guide will walk you through generating your first text-to-speech audio with Fish Audio. By the end, you’ll have converted text into natural-sounding speech using our API.

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/quickstart#prerequisites)

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

](https://docs.fish.audio/developer-guide/getting-started/quickstart#your-first-tts-request)

Your First TTS Request

Choose your preferred method to generate speech:

-   cURL
    
-   Python
    
-   JavaScript
    

1

Set your API key

Store your API key as an environment variable (recommended approach):

```
export FISH_API_KEY="replace_me"
```

2

Make the TTS request

Run this [cURL](https://curl.se/) command to generate your first speech:

```
curl -X POST https://api.fish.audio/v1/tts \
  -H "Authorization: Bearer $FISH_API_KEY" \
  -H "Content-Type: application/json" \
  -H "model: s2-pro" \
  -d '{
    "text": "Hello! Welcome to Fish Audio. This is my first AI-generated voice.",
    "format": "mp3"
  }' \
  --output welcome.mp3
```

3

Play your audio

The audio has been saved as `welcome.mp3`. You can play it by:

-   Double-clicking the file or opening it in any media player
-   Or using the command line:

```
# On macOS
afplay welcome.mp3

# On Linux
mpg123 welcome.mp3

# On Windows
start welcome.mp3
```

1

Install the SDK

```
pip install fish-audio-sdk
```

2

Generate speech

Create a Python script:

```
from fishaudio import FishAudio
from fishaudio.utils import save

# Initialize with your API key
client = FishAudio()  # reads FISH_API_KEY

# Generate speech
audio = client.tts.convert(text="Hello! Welcome to Fish Audio.")
save(audio, "welcome.mp3")

print("✓ Audio saved to welcome.mp3")
```

3

Run the script

```
python generate_speech.py
```

4

Play your audio

The audio has been saved as `welcome.mp3`. You can play it by:

-   Double-clicking the file or opening it in any media player
-   Or using the command line:

```
# On macOS
afplay welcome.mp3

# On Linux
mpg123 welcome.mp3

# On Windows
start welcome.mp3
```

1

Install the SDK

```
npm install fish-audio
```

2

Generate speech

Create a JavaScript script:

```
import { FishAudioClient } from "fish-audio";
import { writeFile } from "fs/promises";

const fishAudio = new FishAudioClient({ apiKey: process.env.FISH_API_KEY });

const audio = await fishAudio.textToSpeech.convert({
  text: "Hello, world!",
});

const buffer = Buffer.from(await new Response(audio).arrayBuffer());
await writeFile("welcome.mp3", buffer);

console.log("✓ Audio saved to welcome.mp3");
```

3

Run the script

```
node generate_speech.mjs
```

4

Play your audio

The audio has been saved as `welcome.mp3`. You can play it by:

-   Double-clicking the file or opening it in any media player
-   Or using the command line:

```
# On macOS
afplay welcome.mp3

# On Linux
mpg123 welcome.mp3

# On Windows
start welcome.mp3
```

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/quickstart#if-your-first-request-fails)

If your first request fails

| Status | Likely cause | Fix |
| --- | --- | --- |
| `401` | Invalid or missing API key | Check `FISH_API_KEY` and your key on [API Keys](https://fish.audio/app/api-keys). |
| `402` | Out of credits | Top up on [Billing](https://fish.audio/app/billing). |
| `400` | Bad `reference_id` / parameters | Verify the voice id; read the error `message`. |
| `429` | Rate limit | Wait and retry with backoff. |

See [Errors](https://docs.fish.audio/api-reference/errors) for the full table and retry handling.

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/quickstart#customizing-your-voice)

Customizing Your Voice

The examples above use the default voice. To use a different voice, add the `reference_id` parameter with a model ID from [fish.audio](https://fish.audio/). You can find the model ID in the URL or use the copy button when viewing any voice. Choose a voice to try:

-   E-Girl Voice
    
-   Energetic Male
    

From: [https://fish.audio/m/ca3007f96ae7499ab87d27ea3599956a](https://fish.audio/m/ca3007f96ae7499ab87d27ea3599956a)

```
export REFERENCE_ID="ca3007f96ae7499ab87d27ea3599956a"
```

From: [https://fish.audio/m/9a9cf47702da476aa4629e2506d4a857](https://fish.audio/m/9a9cf47702da476aa4629e2506d4a857)

```
export REFERENCE_ID="9a9cf47702da476aa4629e2506d4a857"
```

Then generate speech with your chosen voice:

-   cURL
    
-   Python
    
-   JavaScript
    

```
curl -X POST https://api.fish.audio/v1/tts \
  -H "Authorization: Bearer $FISH_API_KEY" \
  -H "Content-Type: application/json" \
  -H "model: s2-pro" \
  -d '{
    "text": "This is a custom voice from Fish Audio! You can explore hundreds of different voices on the platform, or even create your own.",
    "reference_id": "'"$REFERENCE_ID"'",
    "format": "mp3"
  }' \
  --output custom_voice.mp3
```

```
import os
from fishaudio import FishAudio
from fishaudio.utils import save

client = FishAudio()  # reads FISH_API_KEY

# Generate speech with custom voice
audio = client.tts.convert(
    text="This is a custom voice from Fish Audio! You can explore hundreds of different voices on the platform, or even create your own.",
    reference_id=os.environ.get("REFERENCE_ID")
)
save(audio, "custom_voice.mp3")
```

```
import { FishAudioClient } from "fish-audio";
import { writeFile } from "fs/promises";

const fishAudio = new FishAudioClient({ apiKey: process.env.FISH_API_KEY });

const audio = await fishAudio.textToSpeech.convert({
  text: "This is a custom voice from Fish Audio! You can explore hundreds of different voices on the platform, or even create your own.",
  reference_id: process.env.REFERENCE_ID,
});

const buffer = Buffer.from(await new Response(audio).arrayBuffer());
await writeFile("custom_voice.mp3", buffer);

console.log("✓ Audio saved to custom_voice.mp3");
```

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/quickstart#support)

Support

Need help? Check out these resources:

-   [API Reference](https://docs.fish.audio/api-reference/introduction) - Complete API documentation
-   [Create a Voice Clone](https://docs.fish.audio/api-reference/endpoint/model/create-model) - Create a voice clone model
-   [Generate Speech](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech) - Generate realistic speech
-   [Real-time Streaming](https://docs.fish.audio/features/realtime-streaming) - WebSocket for real-time streaming
-   [Discord Community](https://discord.com/invite/dF9Db2Tt3Y) - Get help from the community
-   [Support Email](mailto:support@fish.audio) - Contact our support team

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/getting-started/quickstart.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/getting-started/quickstart)
