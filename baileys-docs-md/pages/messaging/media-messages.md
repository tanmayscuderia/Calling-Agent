# Media Messages

Source: https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#overview)

Overview

Baileys supports sending various media types efficiently. Media can be provided as a `Buffer`, `Stream`, or `URL`, and Baileys handles encryption and upload automatically.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#media-upload-types)

Media Upload Types

All media messages accept a `WAMediaUpload` type, which can be:

```
type WAMediaUpload = 
  | Buffer 
  | { stream: Readable } 
  | { url: URL | string }
```

Using `stream` or `url` is **recommended** to save memory, especially for large files. Baileys will encrypt the media as a stream without loading the entire file into memory.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#image-messages)

Image Messages

Send images with optional captions:

```
import { readFileSync } from 'fs'

await sock.sendMessage(
  jid,
  {
    image: readFileSync('./image.jpg'),
    caption: 'Hello World!'
  }
)
```

```
await sock.sendMessage(
  jid,
  {
    image: { url: './Media/image.png' },
    caption: 'Hello World!'
  }
)
```

```
await sock.sendMessage(
  jid,
  {
    image: { url: 'https://example.com/image.jpg' },
    caption: 'Remote image'
  }
)
```

```
import { createReadStream } from 'fs'

await sock.sendMessage(
  jid,
  {
    image: { stream: createReadStream('./image.jpg') },
    caption: 'Streamed image'
  }
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#image-with-mentions)

Image with Mentions

```
await sock.sendMessage(
  jid,
  {
    image: { url: './image.jpg' },
    caption: 'Look at this @12345678901!',
    mentions: ['12345678901@s.whatsapp.net']
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#video-messages)

Video Messages

Send video files with captions:

```
await sock.sendMessage(
  jid,
  {
    video: { url: './video.mp4' },
    caption: 'Check out this video!'
  }
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#video-notes-ptv)

Video Notes (PTV)

Send as a video note (circular video):

```
await sock.sendMessage(
  jid,
  {
    video: { url: './video.mp4' },
    ptv: true // Send as video note
  }
)
```

`ptv` stands for “picture-taking video” - WhatsApp’s internal name for video notes.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#gif-messages)

GIF Messages

WhatsApp doesn’t support actual `.gif` files. GIFs are sent as MP4 videos with the `gifPlayback` flag.

```
import { readFileSync } from 'fs'

await sock.sendMessage(
  jid,
  {
    video: readFileSync('./animation.mp4'),
    caption: 'Animated content',
    gifPlayback: true
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#audio-messages)

Audio Messages

Send audio files or voice notes:

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#regular-audio)

Regular Audio

```
await sock.sendMessage(
  jid,
  {
    audio: { url: './audio.mp3' },
    mimetype: 'audio/mp4'
  }
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#voice-notes-ptt)

Voice Notes (PTT)

```
await sock.sendMessage(
  jid,
  {
    audio: { url: './voice.ogg' },
    mimetype: 'audio/ogg; codecs=opus',
    ptt: true // Send as voice note
  }
)
```

`ptt` stands for “push to talk” - WhatsApp’s internal name for voice notes.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#audio-requirements)

Audio Requirements

For audio to work across all devices, convert to OGG format with `ffmpeg`:

```
ffmpeg -i input.mp4 -avoid_negative_ts make_zero -ac 1 output.ogg
```

Required flags:

-   `codec: libopus` - OGG file format
-   `ac: 1` - Single audio channel
-   `avoid_negative_ts make_zero` - Timestamp handling

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#audio-with-duration)

Audio with Duration

```
await sock.sendMessage(
  jid,
  {
    audio: { url: './audio.ogg' },
    mimetype: 'audio/ogg; codecs=opus',
    ptt: true,
    seconds: 60 // Optional duration in seconds
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#document-messages)

Document Messages

Send any file as a document:

```
await sock.sendMessage(
  jid,
  {
    document: { url: './file.pdf' },
    mimetype: 'application/pdf',
    fileName: 'document.pdf',
    caption: 'Here is the document'
  }
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#common-mime-types)

Common MIME Types

```
const mimeTypes = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
  txt: 'text/plain'
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#sticker-messages)

Sticker Messages

Send stickers (WebP format):

```
await sock.sendMessage(
  jid,
  {
    sticker: { url: './sticker.webp' }
  }
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#animated-stickers)

Animated Stickers

```
await sock.sendMessage(
  jid,
  {
    sticker: { url: './animated-sticker.webp' },
    isAnimated: true
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#view-once-messages)

View Once Messages

Send media that can only be viewed once:

```
await sock.sendMessage(
  jid,
  {
    image: { url: './secret.jpg' },
    viewOnce: true,
    caption: 'This can only be viewed once'
  }
)
```

`viewOnce` works with images, videos, and audio messages.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#thumbnails)

Thumbnails

Baileys can automatically generate thumbnails for media messages.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#automatic-thumbnail-generation)

Automatic Thumbnail Generation

Install image processing libraries:

```
# For images and stickers
yarn add sharp
# or
yarn add jimp

# For video thumbnails (requires ffmpeg installed on system)
# No additional packages needed
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#manual-thumbnail)

Manual Thumbnail

```
await sock.sendMessage(
  jid,
  {
    image: { url: './large-image.jpg' },
    jpegThumbnail: thumbnailBuffer, // Buffer or base64 string
    caption: 'Large image with custom thumbnail'
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#media-with-context)

Media with Context

Combine media with other message features:

```
await sock.sendMessage(
  jid,
  {
    image: { url: './photo.jpg' },
    caption: 'Check this out @12345678901!',
    mentions: ['12345678901@s.whatsapp.net']
  },
  {
    quoted: originalMessage,
    ephemeralExpiration: 86400 // 24 hours
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#media-upload-process)

Media Upload Process

Understanding how media is uploaded:

1.  **Encryption**: Media is encrypted using AES-256-CBC
2.  **Upload**: Encrypted media is uploaded to WhatsApp servers
3.  **Message**: A message containing the media key and URL is sent
4.  **Decryption**: Recipient decrypts media using the media key

```
// This all happens automatically
const msg = await sock.sendMessage(jid, {
  image: { url: './image.jpg' }
})

// The message contains:
// - directPath: WhatsApp CDN path
// - mediaKey: Encryption key
// - fileEncSha256: Encrypted file hash
// - fileSha256: Original file hash
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#media-configuration-options)

Media Configuration Options

Configure media upload behavior in socket config:

```
const sock = makeWASocket({
  // Timeout for media uploads (default: 30 seconds)
  mediaUploadTimeoutMs: 60000,
  
  // Cache media to avoid re-uploading
  mediaCache: new NodeCache({
    stdTTL: 3600 // 1 hour cache
  })
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#best-practices)

Best Practices

1.  **Use Streams**: For large files, use streams to avoid memory issues
2.  **Set MIME Types**: Always specify correct MIME types for documents
3.  **Optimize Images**: Compress images before sending
4.  **Generate Thumbnails**: Install sharp/jimp for automatic thumbnails
5.  **Handle Errors**: Wrap uploads in try-catch blocks
6.  **Rate Limiting**: Don’t send too many media messages rapidly

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#media-message-types)

Media Message Types

From the Baileys source code:

```
type AnyMediaMessageContent = 
  | { image: WAMediaUpload; caption?: string; jpegThumbnail?: string }
  | { video: WAMediaUpload; caption?: string; gifPlayback?: boolean; ptv?: boolean }
  | { audio: WAMediaUpload; ptt?: boolean; seconds?: number }
  | { sticker: WAMediaUpload; isAnimated?: boolean }
  | { document: WAMediaUpload; mimetype: string; fileName?: string; caption?: string }
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#troubleshooting)

Troubleshooting

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#upload-failures)

Upload Failures

```
try {
  await sock.sendMessage(jid, { image: { url: './image.jpg' } })
} catch (error) {
  if (error.message.includes('upload failed')) {
    // Retry with exponential backoff
  }
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#large-files)

Large Files

For files larger than 100MB, consider:

-   Breaking into smaller chunks
-   Using a more reliable network connection
-   Increasing `mediaUploadTimeoutMs`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages#next-steps)

Next Steps

## Downloading Media

Learn how to download media from received messages

## Message Options

Configure ephemeral and other message options

[

Text Messages

Previous



](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages)[

Message Options

Next



](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options)
