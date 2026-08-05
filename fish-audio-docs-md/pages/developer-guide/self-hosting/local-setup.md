# Local Model Setup

Source: https://docs.fish.audio/developer-guide/self-hosting/local-setup

This guide is for advanced users who want to self-host Fish Audio models. For most users, we recommend using the [Fish Audio API](https://fish.audio/) for easier integration and automatic updates.

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#prerequisites)

Prerequisites

Before you begin, ensure you have:

-   **GPU**: 12GB VRAM minimum (for inference)
-   **OS**: Linux or WSL (Windows Subsystem for Linux)
-   **System dependencies**: Audio processing libraries

Install required system packages:

```
apt install portaudio19-dev libsox-dev ffmpeg
```

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#installation-methods)

Installation Methods

Fish Audio supports multiple installation methods. Choose the one that best fits your development environment.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#conda-installation)

Conda Installation

Conda provides a stable, isolated Python environment:

```
# Create a new environment with Python 3.12
conda create -n fish-speech python=3.12
conda activate fish-speech

# GPU installation (choose your CUDA version: cu126, cu128, cu129)
pip install -e .[cu129]

# CPU-only installation (slower, not recommended for production)
pip install -e .[cpu]

# Default installation (uses PyTorch default index)
pip install -e .
```

For best performance, match your CUDA version with your GPU driver. Use `nvidia-smi` to check your CUDA version.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#uv-installation)

UV Installation

[UV](https://github.com/astral-sh/uv) provides faster dependency resolution and installation:

```
# GPU installation (choose your CUDA version: cu126, cu128, cu129)
uv sync --python 3.12 --extra cu129

# CPU-only installation
uv sync --python 3.12 --extra cpu
```

UV is recommended for faster setup times, especially when working with large dependency trees.

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#intel-arc-xpu-support)

Intel Arc XPU Support

For Intel Arc GPU users, install with XPU support:

```
# Create environment
conda create -n fish-speech python=3.12
conda activate fish-speech

# Install required C++ standard library
conda install libstdcxx -c conda-forge

# Install PyTorch with Intel XPU support
pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/xpu

# Install Fish Speech
pip install -e .
```

The `--compile` optimization flag is not supported on Windows and macOS. To use compile acceleration, you need to install Triton manually.

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#repository-setup)

Repository Setup

Clone the Fish Speech repository to get started:

```
git clone https://github.com/fishaudio/fish-speech.git
cd fish-speech
```

Then follow one of the installation methods above.

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#next-steps)

Next Steps

Once installation is complete, you can:

-   **[Set up Docker deployment](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment)** - Use containerized deployment for easier management
-   **[Run inference](https://docs.fish.audio/developer-guide/self-hosting/running-inference)** - Start generating speech with your local models
-   **Download models** - Get pre-trained weights from [Hugging Face](https://huggingface.co/fishaudio)

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#hardware-recommendations)

Hardware Recommendations

For optimal performance:

| Use Case | Recommended GPU | VRAM | Expected Speed |
| --- | --- | --- | --- |
| Development | RTX 3060 | 12GB | ~1:15 real-time factor |
| Production | RTX 4090 | 24GB | ~1:7 real-time factor |
| Enterprise | A100 | 40GB+ | ~1:5 real-time factor |

Real-time factor indicates how much faster than real-time the model can generate audio. For example, 1:7 means generating 1 minute of audio takes ~8.5 seconds.

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#troubleshooting)

Troubleshooting

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#cuda-out-of-memory)

CUDA Out of Memory

If you encounter CUDA out of memory errors:

1.  Reduce batch size in inference settings
2.  Use `--half` flag for FP16 inference
3.  Close other GPU-intensive applications

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#package-installation-errors)

Package Installation Errors

If you encounter dependency conflicts:

1.  Try using UV instead of pip for better dependency resolution
2.  Create a fresh conda environment
3.  Ensure you’re using Python 3.12 (other versions may have compatibility issues)

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/local-setup#community-support)

Community Support

Need help with local setup?

-   Join our [Discord community](https://discord.gg/dF9Db2Tt3Y) for community support
-   Check [GitHub Issues](https://github.com/fishaudio/fish-speech/issues) for known problems
-   Contact [enterprise support](mailto:support@fish.audio) for commercial deployments

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/self-hosting/local-setup.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/self-hosting/local-setup)
