# Changelog

Source: https://docs.fish.audio/developer-guide/getting-started/changelog

Filters

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#fish-audio-s2)

Fish Audio

March 2026

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#fish-audio-s2)

Fish Audio S2

Next-generation text-to-speech model with inline emotion cues, multi-speaker dialogue support, and 80+ languages.S2 introduces `[bracket]` syntax for natural language control over emotion and paralinguistic cues (e.g., `[whisper]`, `[laugh]`, `[emphasis]`). Tags are treated as standard text rather than dedicated control tokens, so you are not limited to a fixed set of expressions. Built on the Qwen3-4B backbone and fully open-source.Use model ID `s2-pro` in the API. S1 remains supported for existing integrations.[GitHub](https://github.com/fishaudio/fish-speech) | [HuggingFace](https://huggingface.co/fishaudio)

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#fish-audio-s1)

Fish Audio

June 2025

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#fish-audio-s1)

Fish Audio S1

Historic rebrand from Fish Speech to Fish Audio. #1 ranking on TTS-Arena2 with industry-leading performance.S1 (4B params): 0.008 WER, 0.004 CER - Available on Fish Audio Playground S1-mini (0.5B params): 0.011 WER, 0.005 CER - Open source on Hugging Face64+ emotional expressions with RLHF integration and multilingual support for English, Chinese, Japanese, and more.[Read More about S1](https://fish.audio/blog/introducing-s1/)

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-5-1)

Fish Speech

May 27, 2025

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-5-1)

v1.5.1

Fixed critical PyTorch security settings and improved inference speed significantly. Added ONNX export support for better deployment options and enhanced text processing for Arabic and Hebrew languages. Includes bug fixes for Apple Silicon (MPS) compatibility and reorganized library structure for cleaner codebase.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-5-0)

Fish Speech

December 21, 2024

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-5-0)

v1.5.0

Introduced v1.5 model architecture with improved dataset handling and bearer token authentication for APIs.Added reference audio caching by hash for faster performance and better Apple Silicon support. Includes OpenAPI documentation refactoring and base64 reference data support in JSON format.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-4-3)

Fish Speech

November 23, 2024

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-4-3)

v1.4.3

Introduced Fish Agent for conversational AI with streaming capabilities and real-time interactions.Added comprehensive Korean language documentation and fixed critical non-English speech issues. Improved WebUI streaming functionality and PyTorch version compatibility.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-4-2)

Fish Speech

October 25, 2024

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-4-2)

v1.4.2

Documentation-focused release with comprehensive updates for v1.4, macOS support, and multiple language translations.Improved Docker support and API enhancements for JSON format handling. Added audio selection to WebUI and fixed various stability issues including cache handling and backend performance.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-4-1)

Fish Speech

September 15, 2024

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-4-1)

v1.4.1

Infrastructure improvements focused on Docker optimization and multi-platform builds.Updated PyTorch version and replaced audio backend from sox for better performance. Enhanced CI/CD pipeline with buildx support and fixed various Docker-related issues.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-4-0)

Fish Speech

September 12, 2024

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-4-0)

v1.4.0

Major release with new VQGAN architecture for improved audio quality and faster inference.Updated WebUI with enhanced interface and better language switching. Added Japanese documentation translation and fixed inference warmup issues for better performance.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-2-1)

Fish Speech

September 8, 2024

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-2-1)

v1.2.1

Replaced Whisper with SenseVoice for better ASR and added native Apple Silicon support.Includes Portuguese (Brazil) localization, streaming audio functionality, and CPU-only inference improvements. Pinned PyTorch to 2.3.1 to fix inference speed issues and aligned API with official closed-source version.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-2)

Fish Speech

July 18, 2024

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-2)

v1.2

Introduced auto-reranking system for better results along with bilingual support and model quantization.Replaced standard Whisper with Faster Whisper for improved speed and added Japanese documentation. Enhanced model stability and inference performance with optimized v1.2 architecture.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-1-2)

Fish Speech

June 27, 2024

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-1-2)

v1.1.2

Minor release adding Chinese text normalization support and a streaming audio download button in the WebUI.Fixed LoRA merging issues and improved Firefly performance.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-1-1)

Fish Speech

June 8, 2024

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-1-1)

v1.1.1

Breaking changes: Replaced zibai with uvicorn for API server, new text-splitter with byte-based length calculation, and license change to CC-BY-NC-SA 4.0.Added Apple Silicon (MPS) support, Windows one-click installation, and automatic model downloading with resume capability. Improved WebUI with better file selection and download progress indicators.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-1-0)

Fish Speech

May 11, 2024

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-1-0)

v1.1.0

Added VITS decoder integration with full streaming support and queue management for real-time audio generation.Introduced internationalization (i18n) with Spanish translation and improved Windows packaging. Optimized GPU memory usage and CPU-only inference performance while adding LoRA support to the Gradio UI.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-0-0)

Fish Speech

April 30, 2024

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v1-0-0)

v1.0.0

Major milestone release introducing new VQ-GAN architecture with VITS decoder support, LoRA fine-tuning, and streaming inference capabilities.Breaking changes include removal of the Rust-based data server, new tokenizer replacing phonemizer, and updated model architecture (VQ + DiT + Reflow). Achieved 4x memory reduction during loading and added WebUI for training and annotation.

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v0-2-0)

Fish Speech

December 23, 2023

## 

[​

](https://docs.fish.audio/developer-guide/getting-started/changelog#v0-2-0)

v0.2.0

First public release of Fish Speech featuring a complete text-to-speech pipeline with VQ-GAN audio codec and LLAMA-based language model.Includes multi-language support (Chinese, English, Japanese), Gradio WebUI for inference, HTTP API server, and Docker support. Added special optimizations for Chinese users including mirror downloads and localized documentation.

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/getting-started/changelog.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/getting-started/changelog)
