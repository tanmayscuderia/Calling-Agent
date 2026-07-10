# Installation

Source: https://whiskeysockets-baileys-94.mintlify.app/installation

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#system-requirements)

System Requirements

Before installing Baileys, ensure your system meets these requirements:

-   **Node.js:** Version 20.0.0 or higher
-   **Package Manager:** npm, yarn, pnpm, or bun
-   **Operating System:** Linux, macOS, or Windows

Baileys requires Node.js 20+ due to its use of modern JavaScript features and native modules.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#installing-baileys)

Installing Baileys

Choose your preferred package manager to install Baileys:

```
npm install @whiskeysockets/baileys
```

```
yarn add @whiskeysockets/baileys
```

```
pnpm add @whiskeysockets/baileys
```

```
bun add @whiskeysockets/baileys
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#edge-version-latest-features)

Edge Version (Latest Features)

If you want the latest features and fixes (with no stability guarantee), install directly from GitHub:

```
npm install github:WhiskeySockets/Baileys
```

```
yarn add github:WhiskeySockets/Baileys
```

```
pnpm add github:WhiskeySockets/Baileys
```

```
bun add github:WhiskeySockets/Baileys
```

The edge version may contain breaking changes and unstable features. Use in production at your own risk.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#optional-dependencies)

Optional Dependencies

Baileys has several optional dependencies that enable additional features:

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#link-preview-generation)

Link Preview Generation

To generate link previews in messages:

```
npm install link-preview-js
```

```
yarn add link-preview-js
```

```
pnpm add link-preview-js
```

```
bun add link-preview-js
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#media-thumbnail-generation)

Media Thumbnail Generation

For automatic thumbnail generation in images and stickers, install one of:

-   jimp (JavaScript)
    
-   sharp (Native, Faster)
    

```
npm install jimp
```

```
yarn add jimp
```

```
pnpm add jimp
```

```
bun add jimp
```

```
npm install sharp
```

```
yarn add sharp
```

```
pnpm add sharp
```

```
bun add sharp
```

**sharp** is faster and more memory efficient, but requires native compilation. **jimp** is pure JavaScript and works everywhere.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#video-thumbnail-generation)

Video Thumbnail Generation

For video thumbnails, install **ffmpeg** on your system:

-   Ubuntu/Debian
    
-   macOS
    
-   Windows
    

```
sudo apt update
sudo apt install ffmpeg
```

```
brew install ffmpeg
```

Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#audio-processing)

Audio Processing

For audio format conversion (optional):

```
npm install audio-decode
```

```
yarn add audio-decode
```

```
pnpm add audio-decode
```

```
bun add audio-decode
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#typescript-setup)

TypeScript Setup

Baileys is written in TypeScript and includes full type definitions. For TypeScript projects, no additional setup is required.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#importing-in-your-project)

Importing in Your Project

```
import makeWASocket from '@whiskeysockets/baileys'
```

```
import makeWASocket from '@whiskeysockets/baileys'
```

```
const { default: makeWASocket } = require('@whiskeysockets/baileys')
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#verification)

Verification

Verify your installation by creating a simple test file:

test.ts

```
import makeWASocket from '@whiskeysockets/baileys'

console.log('Baileys imported successfully!')
console.log('makeWASocket is a', typeof makeWASocket)
```

Run it:

```
npx tsx test.ts
```

```
npx ts-node test.ts
```

You should see:

```
Baileys imported successfully!
makeWASocket is a function
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#breaking-changes-notice)

Breaking Changes Notice

**Version 7.0.0** introduced multiple breaking changes. If you’re upgrading from an earlier version, check the [migration guide](https://whiskey.so/migrate-latest).

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/installation#next-steps)

Next Steps

## Quick Start Guide

Create your first connection and send a message

## Authentication

Learn about authentication and session management

## Socket Configuration

Explore all available configuration options

## Example Code

View the complete example implementation

[

Baileys - WhatsApp Web API

Previous



](https://whiskeysockets-baileys-94.mintlify.app/introduction)[

Quick Start

Next



](https://whiskeysockets-baileys-94.mintlify.app/quickstart)
