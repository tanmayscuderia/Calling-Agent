# Real-time Voice Streaming

Source: https://docs.fish.audio/developer-guide/best-practices/real-time-streaming

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#overview)

Overview

Real-time streaming lets you generate speech as you type or speak, perfect for chatbots, virtual assistants, and live applications.

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#when-to-use-streaming)

When to Use Streaming

**Perfect for:**

-   Live chat applications
-   Virtual assistants
-   Interactive storytelling
-   Real-time translations
-   Gaming dialogue

**Not ideal for:**

-   Pre-recorded content
-   Batch processing

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#getting-started)

Getting Started

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#web-playground)

Web Playground

Try real-time streaming instantly:

1.  Visit [fish.audio](https://fish.audio/)
2.  Enable “Streaming Mode”
3.  Start typing and hear voice generation in real-time

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#using-the-sdk)

Using the SDK

Stream text as it’s being written:

-   Python
    
-   JavaScript
    

```
from fishaudio import FishAudio

# Initialize client
client = FishAudio(api_key="your_api_key")

# Stream text word by word
def stream_text():
    text = "Hello, this is being generated in real time"
    for word in text.split():
        yield word + " "

# Generate speech as text streams
audio_stream = client.tts.stream_websocket(
    stream_text(),
    reference_id="your_voice_model_id",
    temperature=0.7,  # Controls variation
    top_p=0.7,  # Controls diversity
    latency="balanced"
)

with open("output.mp3", "wb") as f:
    for audio_chunk in audio_stream:
        f.write(audio_chunk)
```

```
import { FishAudioClient, RealtimeEvents } from "fish-audio";
import { writeFile } from "fs/promises";
import path from "path";

const apiKey = "your_api_key";
const referenceId = "your_voice_model_id";

async function* makeTextStream() {
  const chunks = [
    "Hello from Fish Audio! ",
    "This is a realtime text-to-speech test. ",
    "We are streaming multiple chunks over WebSocket.",
  ];
  for (const chunk of chunks) {
    yield chunk;
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function main() {
  const client = new FishAudioClient({ apiKey });

  // For realtime, set text to "" and stream content via makeTextStream
  const request = {
    text: "",
    reference_id: referenceId,
  };

  const connection = await client.textToSpeech.convertRealtime(
    request,
    makeTextStream()
  );

  // Collect audio and write to a file when the stream ends
  const chunks = [];
  connection.on(RealtimeEvents.OPEN, () => console.log("WebSocket opened"));
  connection.on(RealtimeEvents.AUDIO_CHUNK, (audio) => {
    if (audio instanceof Uint8Array || Buffer.isBuffer(audio)) {
      chunks.push(Buffer.from(audio));
    }
  });
  connection.on(RealtimeEvents.ERROR, (err) =>
    console.error("WebSocket error:", err)
  );
  connection.on(RealtimeEvents.CLOSE, async () => {
    const outPath = path.resolve(process.cwd(), "out.mp3");
    await writeFile(outPath, Buffer.concat(chunks));
    console.log("Saved to", outPath);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#configuration-options)

Configuration Options

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#speed-vs-quality)

Speed vs Quality

**Latency Modes:**

-   **Normal:** Best quality, ~500ms latency
-   **Balanced:** Good quality, ~300ms latency

-   Python
    
-   JavaScript
    

```
# Use latency parameter with stream_websocket
audio_stream = client.tts.stream_websocket(
    text_chunks(),
    reference_id="model_id",
    latency="balanced"  # For faster response
)
```

```
const request = {
  text: "",
  reference_id: "model_id",
  latency: "balanced", // For faster response
};
```

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#voice-control)

Voice Control

**Temperature** (0.1 - 1.0):

-   Lower: More consistent, predictable
-   Higher: More varied, expressive

**Top-p** (0.1 - 1.0):

-   Lower: More focused
-   Higher: More diverse

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#real-time-applications)

Real-time Applications

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#chatbot-integration)

Chatbot Integration

Stream responses as they’re generated:

-   Python
    
-   JavaScript
    

```
def chatbot_response(user_input):
    # Get AI response (streaming)
    ai_text = get_ai_response(user_input)

    # Convert to speech in real-time
    audio_stream = client.tts.stream_websocket(ai_text)
    for audio_chunk in audio_stream:
        play_audio(audio_chunk)
```

```
async function chatbotResponse(userInput) {
  // Get AI response (streaming)
  const aiTextStream = getAiResponse(userInput); // async iterable of strings

  // Convert to speech in real-time
  for await (const textChunk of aiTextStream) {
    for await (const audioChunk of ttsStream(textChunk)) {
      playAudio(audioChunk);
    }
  }
}
```

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#live-translation)

Live Translation

Translate and speak simultaneously:

-   Python
    
-   JavaScript
    

```
def live_translate(source_audio):
    # Transcribe source audio
    text = transcribe(source_audio)
    
    # Translate text
    translated = translate(text, target_language)
    
    # Stream translated speech
    for chunk in stream_text(translated):
        generate_speech(chunk)
```

```
async function liveTranslate(sourceAudio) {
  // Transcribe source audio
  const text = await transcribe(sourceAudio);

  // Translate text
  const translated = await translate(text, targetLanguage);

  // Stream translated speech
  for await (const chunk of streamText(translated)) {
    generateSpeech(chunk);
  }
}
```

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#best-practices)

Best Practices

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#text-buffering)

Text Buffering

**Do:**

-   Send complete words with spaces
-   Use punctuation for natural pauses
-   Buffer 5-10 words for smoothness

**Don’t:**

-   Send individual characters
-   Forget spaces between words
-   Send huge chunks at once

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#connection-management)

Connection Management

1.  **Keep connections alive** for multiple generations
2.  **Handle disconnections** gracefully
3.  **Implement retry logic** for reliability

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#audio-playback)

Audio Playback

For smooth playback:

-   Buffer 2-3 audio chunks
-   Use cross-fading between chunks
-   Handle network delays gracefully

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#common-use-cases)

Common Use Cases

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#interactive-story)

Interactive Story

-   Python
    
-   JavaScript
    

```
def interactive_story():
    story_parts = [
        "Once upon a time,",
        "in a land far away,",
        "there lived a brave knight..."
    ]
    
    for part in story_parts:
        # Generate and play each part
        stream_speech(part)
        # Wait for user input
        user_choice = get_user_input()
        # Continue based on choice
```

```
function interactiveStory() {
  const storyParts = [
    "Once upon a time,",
    "in a land far away,",
    "there lived a brave knight...",
  ];

  for (const part of storyParts) {
    // Generate and play each part
    streamSpeech(part);
    // Wait for user input
    const userChoice = getUserInput();
    // Continue based on choice
  }
}
```

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#virtual-assistant)

Virtual Assistant

-   Python
    
-   JavaScript
    

```
def virtual_assistant():
    while True:
        # Listen for wake word
        if detect_wake_word():
            # Start streaming response
            response = process_command()
            stream_speech(response)
```

```
async function virtualAssistant() {
  while (true) {
    // Listen for wake word
    if (detectWakeWord()) {
      // Start streaming response
      const response = processCommand();
      streamSpeech(response);
    }
  }
}
```

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#live-commentary)

Live Commentary

-   Python
    
-   JavaScript
    

```
def live_commentary(event_stream):
    for event in event_stream:
        # Generate commentary
        commentary = generate_commentary(event)
        # Stream immediately
        stream_speech(commentary)
```

```
async function liveCommentary(eventStream) {
  for await (const event of eventStream) {
    // Generate commentary
    const commentary = generateCommentary(event);
    // Stream immediately
    streamSpeech(commentary);
  }
}
```

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#troubleshooting)

Troubleshooting

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#audio-gaps)

Audio Gaps

**Problem:** Gaps between audio chunks  
**Solution:**

-   Increase buffer size
-   Use balanced latency mode
-   Check network connection

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#delayed-response)

Delayed Response

**Problem:** Long wait before audio starts  
**Solution:**

-   Use balanced latency mode
-   Send initial text immediately
-   Reduce chunk size

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#choppy-playback)

Choppy Playback

**Problem:** Audio cuts in and out  
**Solution:**

-   Buffer more chunks before playing
-   Check network stability
-   Use consistent chunk sizes

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#advanced-features)

Advanced Features

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#dynamic-voice-switching)

Dynamic Voice Switching

Change voices mid-stream:

-   Python
    
-   JavaScript
    

```
# Start with one voice
def text1():
    yield "Hello from voice one."

audio1 = client.tts.stream_websocket(text1(), reference_id="voice1")
for chunk in audio1:
    play_audio(chunk)

# Switch to another
def text2():
    yield "And now voice two!"

audio2 = client.tts.stream_websocket(text2(), reference_id="voice2")
for chunk in audio2:
    play_audio(chunk)
```

```
// Start with one voice
const request1 = { reference_id: "voice1" };
streamSpeech("Hello from voice one.", request1);

// Switch to another
const request2 = { reference_id: "voice2" };
streamSpeech("And now voice two!", request2);
```

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#emotion-injection)

Emotion Injection

Add emotions dynamically:

-   Python
    
-   JavaScript
    

```
def emotional_speech(text, emotion):
    emotional_text = f"({emotion}) {text}"
    stream_speech(emotional_text)
```

```
function emotionalSpeech(text, emotion) {
  const emotionalText = `(${emotion}) ${text}`;
  streamSpeech(emotionalText);
}
```

### 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#speed-control)

Speed Control

Adjust speaking speed:

-   Python
    
-   JavaScript
    

```
from fishaudio.types import Prosody

# Use speed and volume with stream_websocket
audio_stream = client.tts.stream_websocket(
    text_chunks(),
    speed=1.5  # 1.5x speed
)
# Note: For full prosody control including volume, use TTSConfig
```

```
const request = {
  text: "",
  prosody: {
    speed: 1.5, // 1.5x speed
    volume: 0,  // Normal volume
  },
};
```

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#performance-tips)

Performance Tips

1.  **Pre-load voices** for instant start
2.  **Use connection pooling** for multiple streams
3.  **Monitor latency** and adjust settings
4.  **Cache common phrases** for instant playback

## 

[​

](https://docs.fish.audio/developer-guide/best-practices/real-time-streaming#get-support)

Get Support

Need help with streaming?

-   **Discord Community:** [Join our Discord](https://discord.gg/fish-audio)
-   **Email Support:** [support@fish.audio](mailto:support@fish.audio)
-   **Status Page:** [status.fish.audio](https://status.fish.audio/)

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/best-practices/real-time-streaming.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/best-practices/real-time-streaming)
