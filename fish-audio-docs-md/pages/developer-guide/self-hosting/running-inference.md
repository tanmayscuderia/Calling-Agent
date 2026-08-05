# Running Inference

Source: https://docs.fish.audio/developer-guide/self-hosting/running-inference

Fish Audio supports multiple inference methods: command line, HTTP API, WebUI, and GUI. Choose the method that best fits your workflow.

This guide assumes you have already [installed Fish Audio locally](https://docs.fish.audio/developer-guide/self-hosting/local-setup) or [set up Docker deployment](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment).

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#download-weights)

Download Weights

Before running inference, download the required model weights from Hugging Face:

```
# Install Hugging Face CLI (if not already installed)
pip install huggingface_hub[cli]
# or
uv tool install huggingface_hub[cli]

# Download Fish Audio S1-mini weights
hf download fishaudio/openaudio-s1-mini --local-dir checkpoints/openaudio-s1-mini
```

**Fish Audio S1-mini** is the open-source distilled version (0.5B parameters) optimized for local deployment. The full **S1** model (4B parameters) is available exclusively on [Fish Audio cloud](https://fish.audio/).

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#command-line-inference)

Command Line Inference

Command line inference provides maximum control and is ideal for scripting and batch processing.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#step-1-extract-vq-tokens-from-reference-audio)

Step 1: Extract VQ Tokens from Reference Audio

First, encode your reference audio to get voice characteristics:

```
python fish_speech/models/dac/inference.py \
    -i "reference_audio.wav" \
    --checkpoint-path "checkpoints/openaudio-s1-mini/codec.pth"
```

This generates two files:

-   `fake.npy` - VQ tokens representing voice characteristics
-   `fake.wav` - Reconstructed audio for verification

**Skip this step if you want random voice generation** - the model can generate speech without reference audio.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#step-2-generate-semantic-tokens-from-text)

Step 2: Generate Semantic Tokens from Text

Convert your text to semantic tokens using the language model:

```
python fish_speech/models/text2semantic/inference.py \
    --text "The text you want to convert to speech" \
    --prompt-text "Transcription of your reference audio" \
    --prompt-tokens "fake.npy" \
    --compile
```

**Parameters:**

-   `--text`: The text to synthesize
-   `--prompt-text`: Transcription of the reference audio (for voice cloning)
-   `--prompt-tokens`: Path to VQ tokens from Step 1 (for voice cloning)
-   `--compile`: Enable kernel fusion for faster inference (~10x speedup on RTX 4090)

For random voice generation, omit `--prompt-text` and `--prompt-tokens` parameters.

This creates a file named `codes_N.npy` (where N starts from 0) containing semantic tokens.

For GPUs that don’t support bf16 (bfloat16), add the `--half` flag to use fp16 instead.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#step-3-generate-audio-from-semantic-tokens)

Step 3: Generate Audio from Semantic Tokens

Finally, convert semantic tokens to audio:

```
python fish_speech/models/dac/inference.py \
    -i "codes_0.npy"
```

This generates the final audio file.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#full-example)

Full Example

Here’s a complete workflow for voice cloning:

```
# 1. Encode reference audio
python fish_speech/models/dac/inference.py \
    -i "my_voice.wav" \
    --checkpoint-path "checkpoints/openaudio-s1-mini/codec.pth"

# 2. Generate semantic tokens
python fish_speech/models/text2semantic/inference.py \
    --text "Hello, this is a test of voice cloning." \
    --prompt-text "This is my reference voice recording." \
    --prompt-tokens "fake.npy" \
    --compile

# 3. Generate final audio
python fish_speech/models/dac/inference.py \
    -i "codes_0.npy"
```

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#http-api-inference)

HTTP API Inference

The HTTP API provides a programmatic interface for integrations and production deployments.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#start-api-server)

Start API Server

```
# With local installation
python -m tools.api_server \
    --listen 0.0.0.0:8080 \
    --llama-checkpoint-path "checkpoints/openaudio-s1-mini" \
    --decoder-checkpoint-path "checkpoints/openaudio-s1-mini/codec.pth" \
    --decoder-config-name modded_dac_vq

# With UV
uv run tools/api_server.py \
    --listen 0.0.0.0:8080 \
    --llama-checkpoint-path "checkpoints/openaudio-s1-mini" \
    --decoder-checkpoint-path "checkpoints/openaudio-s1-mini/codec.pth" \
    --decoder-config-name modded_dac_vq
```

Add the `--compile` flag to enable torch.compile optimization for faster inference.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#access-api-documentation)

Access API Documentation

Once the server is running, access the interactive API documentation at:

```
http://localhost:8080/docs
```

The API provides endpoints for:

-   Text-to-speech synthesis
-   Voice cloning with reference audio
-   Batch processing
-   Model information

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#example-api-request)

Example API Request

```
curl -X POST "http://localhost:8080/v1/tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test",
    "reference_audio": "base64_encoded_audio",
    "reference_text": "Reference transcription"
  }'
```

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#webui-inference)

WebUI Inference

The WebUI provides an intuitive interface for interactive testing and development.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#start-webui)

Start WebUI

```
# With all parameters
python -m tools.run_webui \
    --llama-checkpoint-path "checkpoints/openaudio-s1-mini" \
    --decoder-checkpoint-path "checkpoints/openaudio-s1-mini/codec.pth" \
    --decoder-config-name modded_dac_vq

# Or use defaults (auto-detects models in checkpoints/)
python -m tools.run_webui
```

Add the `--compile` flag for faster inference during interactive sessions.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#access-webui)

Access WebUI

The WebUI starts on port 7860 by default. Access it at:

```
http://localhost:7860
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#configure-with-environment-variables)

Configure with Environment Variables

Customize the WebUI using Gradio environment variables:

```
# Enable public sharing
GRADIO_SHARE=1 python -m tools.run_webui

# Change server port
GRADIO_SERVER_PORT=8080 python -m tools.run_webui

# Change server name
GRADIO_SERVER_NAME=0.0.0.0 python -m tools.run_webui
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#using-reference-audio-library)

Using Reference Audio Library

For faster workflow, pre-save reference audio:

1.  Create a `references/` directory in the project root
2.  Create subdirectories named by voice ID: `references/<voice_id>/`
3.  Place files in each subdirectory:
    -   `sample.wav` - Reference audio file
    -   `sample.lab` - Text transcription of the audio

Example structure:

```
references/
├── alice/
│   ├── sample.wav
│   └── sample.lab
└── bob/
    ├── sample.wav
    └── sample.lab
```

These references will appear as selectable options in the WebUI.

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#gui-inference)

GUI Inference

For users who prefer a native desktop application, a PyQt6-based GUI is available.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#download-gui-client)

Download GUI Client

Download the latest release from the [Fish Speech GUI repository](https://github.com/AnyaCoder/fish-speech-gui/releases). **Supported platforms:**

-   Linux
-   Windows
-   macOS

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#connect-to-api-server)

Connect to API Server

The GUI client connects to a running API server (see [HTTP API Inference](https://docs.fish.audio/developer-guide/self-hosting/running-inference#http-api-inference) above).

1.  Start the API server
2.  Launch the GUI client
3.  Configure the API endpoint (default: `http://localhost:8080`)

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#docker-inference)

Docker Inference

If you’re using Docker deployment, refer to the [Docker Deployment guide](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment) for detailed instructions on:

-   Running pre-built WebUI containers
-   Running pre-built API server containers
-   Customizing container configuration
-   Volume mounts for models and references

Quick example:

```
# Start WebUI with Docker
docker run -d \
    --name fish-speech-webui \
    --gpus all \
    -p 7860:7860 \
    -v ./checkpoints:/app/checkpoints \
    -v ./references:/app/references \
    -e COMPILE=1 \
    fishaudio/fish-speech:latest-webui-cuda
```

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#performance-optimization)

Performance Optimization

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#enable-compilation)

Enable Compilation

Torch compilation provides ~10x speedup on compatible GPUs:

```
# Add --compile flag to any inference command
python -m tools.api_server --compile ...
```

Compilation requires:

-   CUDA-compatible GPU
-   Triton library (not supported on Windows/macOS)
-   First run will be slow due to compilation overhead

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#use-mixed-precision)

Use Mixed Precision

For GPUs without bf16 support, use fp16:

```
python fish_speech/models/text2semantic/inference.py --half ...
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#batch-processing)

Batch Processing

For multiple audio generations, use batch processing to amortize model loading overhead:

```
# Example batch processing script
import fish_speech

model = fish_speech.load_model("checkpoints/openaudio-s1-mini")

texts = ["First sentence", "Second sentence", "Third sentence"]
for text in texts:
    audio = model.synthesize(text)
    audio.save(f"output_{texts.index(text)}.wav")
```

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#emotion-control)

Emotion Control

Fish Audio S1 supports emotional markers for expressive speech synthesis:

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#basic-emotions)

Basic Emotions

```
(angry) (sad) (excited) (surprised) (satisfied) (delighted)
(scared) (worried) (upset) (nervous) (frustrated) (depressed)
(empathetic) (embarrassed) (disgusted) (moved) (proud) (relaxed)
(grateful) (confident) (interested) (curious) (confused) (joyful)
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#advanced-emotions)

Advanced Emotions

```
(disdainful) (unhappy) (anxious) (hysterical) (indifferent)
(impatient) (guilty) (scornful) (panicked) (furious) (reluctant)
(keen) (disapproving) (negative) (denying) (astonished) (serious)
(sarcastic) (conciliative) (comforting) (sincere) (sneering)
(hesitating) (yielding) (painful) (awkward) (amused)
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#tone-markers)

Tone Markers

```
(in a hurry tone) (shouting) (screaming) (whispering) (soft tone)
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#special-effects)

Special Effects

```
(laughing) (chuckling) (sobbing) (crying loudly) (sighing) (panting)
(groaning) (crowd laughing) (background laughter) (audience laughing)
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#example-usage)

Example Usage

```
python fish_speech/models/text2semantic/inference.py \
    --text "(excited)This is amazing! (laughing)Ha ha ha!" \
    --compile
```

Emotion control is currently supported for English, Chinese, and Japanese. More languages coming soon!

For more details, see the [Emotion Control guide](https://docs.fish.audio/developer-guide/core-features/emotions).

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#troubleshooting)

Troubleshooting

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#out-of-memory-errors)

Out of Memory Errors

If you encounter CUDA out of memory errors:

1.  Reduce input text length
2.  Use `--half` flag for fp16 inference
3.  Close other GPU applications
4.  Use a smaller batch size

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#slow-inference)

Slow Inference

To improve speed:

1.  Enable `--compile` flag
2.  Verify GPU is being used (check with `nvidia-smi`)
3.  Ensure CUDA version matches PyTorch installation
4.  Use fp16 instead of bf16 on older GPUs

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#poor-audio-quality)

Poor Audio Quality

For better quality:

1.  Use high-quality reference audio (clear, no background noise)
2.  Ensure reference text accurately matches reference audio
3.  Use 10-30 seconds of reference audio
4.  See [Voice Cloning Best Practices](https://docs.fish.audio/developer-guide/best-practices/voice-cloning)

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#model-loading-errors)

Model Loading Errors

If models fail to load:

1.  Verify model weights are downloaded completely
2.  Check checkpoint paths are correct
3.  Ensure sufficient disk space
4.  Re-download weights if corrupted

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/running-inference#next-steps)

Next Steps

-   **[Emotion Control Best Practices](https://docs.fish.audio/developer-guide/best-practices/emotion-control)** - Master expressive speech
-   **[Voice Cloning Best Practices](https://docs.fish.audio/developer-guide/best-practices/voice-cloning)** - Optimize voice cloning quality
-   **[API Reference](https://docs.fish.audio/api-reference/introduction)** - Integrate with your applications
-   **[Cloud API](https://fish.audio/)** - Compare with managed service performance

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/self-hosting/running-inference.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/self-hosting/running-inference)
