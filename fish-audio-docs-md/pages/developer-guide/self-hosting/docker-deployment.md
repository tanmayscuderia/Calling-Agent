# Docker Deployment

Source: https://docs.fish.audio/developer-guide/self-hosting/docker-deployment

Fish Audio provides Docker images for both WebUI and API server deployments. You can use pre-built images from Docker Hub or build custom images locally.

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#prerequisites)

Prerequisites

Before deploying with Docker, ensure you have:

-   **Docker** and **Docker Compose** installed
-   **NVIDIA Docker runtime** (for GPU support)
-   At least **12GB GPU memory** for CUDA inference
-   Downloaded model weights (see [Running Inference](https://docs.fish.audio/developer-guide/self-hosting/running-inference#download-weights))

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#pre-built-images)

Pre-built Images

Fish Audio provides ready-to-use Docker images on Docker Hub:

| Image | Description | Best For |
| --- | --- | --- |
| `fishaudio/fish-speech:latest-webui-cuda` | WebUI with CUDA support | Interactive development with GPU |
| `fishaudio/fish-speech:latest-webui-cpu` | WebUI CPU-only | Testing without GPU |
| `fishaudio/fish-speech:latest-server-cuda` | API server with CUDA | Production deployments with GPU |
| `fishaudio/fish-speech:latest-server-cpu` | API server CPU-only | Low-traffic CPU deployments |

For production use, we recommend using specific version tags instead of `latest` to ensure consistency across deployments.

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#quick-start-with-docker-run)

Quick Start with Docker Run

The fastest way to get started is using `docker run`:

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#webui-deployment)

WebUI Deployment

```
# Create directories for model weights and reference audio
mkdir -p checkpoints references

# Start WebUI with CUDA support (recommended)
docker run -d \
    --name fish-speech-webui \
    --gpus all \
    -p 7860:7860 \
    -v ./checkpoints:/app/checkpoints \
    -v ./references:/app/references \
    -e COMPILE=1 \
    fishaudio/fish-speech:latest-webui-cuda

# For CPU-only deployment
docker run -d \
    --name fish-speech-webui-cpu \
    -p 7860:7860 \
    -v ./checkpoints:/app/checkpoints \
    -v ./references:/app/references \
    fishaudio/fish-speech:latest-webui-cpu
```

Access the WebUI at `http://localhost:7860`

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#api-server-deployment)

API Server Deployment

```
# Start API server with CUDA support
docker run -d \
    --name fish-speech-server \
    --gpus all \
    -p 8080:8080 \
    -v ./checkpoints:/app/checkpoints \
    -v ./references:/app/references \
    -e COMPILE=1 \
    fishaudio/fish-speech:latest-server-cuda

# For CPU-only deployment
docker run -d \
    --name fish-speech-server-cpu \
    -p 8080:8080 \
    -v ./checkpoints:/app/checkpoints \
    -v ./references:/app/references \
    fishaudio/fish-speech:latest-server-cpu
```

Access the API documentation at `http://localhost:8080`

Enable the `COMPILE=1` environment variable for ~10x faster inference on CUDA deployments. This uses `torch.compile` to optimize the model.

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#docker-compose-deployment)

Docker Compose Deployment

For development or customization, Docker Compose provides easier configuration management:

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#setup)

Setup

```
# Clone the repository
git clone https://github.com/fishaudio/fish-speech.git
cd fish-speech
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#start-services)

Start Services

```
# Start WebUI with CUDA
docker compose --profile webui up

# Start WebUI with compile optimization
COMPILE=1 docker compose --profile webui up

# Start API server
docker compose --profile server up

# Start API server with compile optimization
COMPILE=1 docker compose --profile server up

# For CPU-only deployment
BACKEND=cpu docker compose --profile webui up
```

Run containers in detached mode by adding the `-d` flag: `docker compose --profile webui up -d`

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#environment-variables)

Environment Variables

Customize deployment using environment variables or a `.env` file:

```
# .env file example
BACKEND=cuda              # or cpu
COMPILE=1                 # Enable compile optimization
GRADIO_PORT=7860         # WebUI port
API_PORT=8080            # API server port
UV_VERSION=0.8.15        # UV package manager version
```

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#manual-docker-build)

Manual Docker Build

For advanced users who need custom configurations:

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#build-webui-image)

Build WebUI Image

```
# Build with CUDA support
docker build \
    --platform linux/amd64 \
    -f docker/Dockerfile \
    --build-arg BACKEND=cuda \
    --build-arg CUDA_VER=12.6.0 \
    --build-arg UV_EXTRA=cu126 \
    --target webui \
    -t fish-speech-webui:cuda .

# Build CPU-only (supports multi-platform)
docker build \
    --platform linux/amd64,linux/arm64 \
    -f docker/Dockerfile \
    --build-arg BACKEND=cpu \
    --target webui \
    -t fish-speech-webui:cpu .
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#build-api-server-image)

Build API Server Image

```
# Build with CUDA support
docker build \
    --platform linux/amd64 \
    -f docker/Dockerfile \
    --build-arg BACKEND=cuda \
    --build-arg CUDA_VER=12.6.0 \
    --build-arg UV_EXTRA=cu126 \
    --target server \
    -t fish-speech-server:cuda .
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#build-development-image)

Build Development Image

```
# Build development image with all tools
docker build \
    --platform linux/amd64 \
    -f docker/Dockerfile \
    --build-arg BACKEND=cuda \
    --target dev \
    -t fish-speech-dev:cuda .
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#build-arguments)

Build Arguments

| Argument | Options | Default | Description |
| --- | --- | --- | --- |
| `BACKEND` | `cuda`, `cpu` | `cuda` | Compute backend |
| `CUDA_VER` | `12.6.0`, etc. | `12.6.0` | CUDA version |
| `UV_EXTRA` | `cu126`, `cu128`, `cu129` | `cu126` | UV extra for CUDA |
| `UBUNTU_VER` | `24.04`, etc. | `24.04` | Ubuntu base version |
| `PY_VER` | `3.12`, etc. | `3.12` | Python version |

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#volume-mounts)

Volume Mounts

Both Docker run and Compose methods require these volume mounts:

| Host Path | Container Path | Purpose |
| --- | --- | --- |
| `./checkpoints` | `/app/checkpoints` | Model weights directory |
| `./references` | `/app/references` | Reference audio files for voice cloning |

Ensure model weights are downloaded and placed in the `./checkpoints` directory before starting containers. See [Running Inference](https://docs.fish.audio/developer-guide/self-hosting/running-inference#download-weights) for download instructions.

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#environment-variables-reference)

Environment Variables Reference

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#webui-configuration)

WebUI Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `GRADIO_SERVER_NAME` | `0.0.0.0` | WebUI server host |
| `GRADIO_SERVER_PORT` | `7860` | WebUI server port |
| `GRADIO_SHARE` | `false` | Enable Gradio public sharing |

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#api-server-configuration)

API Server Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `API_SERVER_NAME` | `0.0.0.0` | API server host |
| `API_SERVER_PORT` | `8080` | API server port |

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#model-configuration)

Model Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `LLAMA_CHECKPOINT_PATH` | `checkpoints/openaudio-s1-mini` | Path to model weights |
| `DECODER_CHECKPOINT_PATH` | `checkpoints/openaudio-s1-mini/codec.pth` | Path to decoder weights |
| `DECODER_CONFIG_NAME` | `modded_dac_vq` | Decoder configuration name |

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#performance-optimization)

Performance Optimization

| Variable | Default | Description |
| --- | --- | --- |
| `COMPILE` | `0` | Enable torch.compile for ~10x speedup (CUDA only) |

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#container-management)

Container Management

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#view-logs)

View Logs

```
# Docker run
docker logs fish-speech-webui

# Docker Compose
docker compose logs webui
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#stop-containers)

Stop Containers

```
# Docker run
docker stop fish-speech-webui

# Docker Compose
docker compose down
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#update-images)

Update Images

```
# Pull latest images
docker pull fishaudio/fish-speech:latest-webui-cuda

# Restart containers with new image
docker compose --profile webui up -d
```

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#gpu-support)

GPU Support

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#prerequisites-2)

Prerequisites

Install NVIDIA Container Toolkit:

```
# Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
    sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#verify-gpu-access)

Verify GPU Access

```
docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu24.04 nvidia-smi
```

GPU support requires NVIDIA Docker runtime. For CPU-only deployment, remove the `--gpus all` flag and use CPU images.

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#troubleshooting)

Troubleshooting

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#container-won%E2%80%99t-start)

Container Won’t Start

Check logs for errors:

```
docker logs fish-speech-webui
```

Common issues:

-   Missing model weights in `./checkpoints`
-   Port already in use (change port mapping)
-   Insufficient GPU memory

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#gpu-not-detected)

GPU Not Detected

Verify NVIDIA Docker runtime is installed:

```
docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu24.04 nvidia-smi
```

### 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#performance-issues)

Performance Issues

1.  Enable compile optimization: `COMPILE=1`
2.  Ensure GPU is being used (check with `nvidia-smi`)
3.  Verify sufficient GPU memory is available

## 

[​

](https://docs.fish.audio/developer-guide/self-hosting/docker-deployment#next-steps)

Next Steps

-   **[Run inference](https://docs.fish.audio/developer-guide/self-hosting/running-inference)** - Learn how to generate speech
-   **[Download models](https://huggingface.co/fishaudio)** - Get pre-trained weights
-   **[API documentation](https://docs.fish.audio/api-reference/introduction)** - Integrate with your applications

Was this page helpful?

[Suggest edits](https://github.com/fishaudio/docs/edit/main/developer-guide/self-hosting/docker-deployment.mdx)[Raise issue](https://github.com/fishaudio/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/developer-guide/self-hosting/docker-deployment)
