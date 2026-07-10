# Downloading Media

Source: https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#overview)

Overview

Baileys provides utilities to download media (images, videos, audio, documents) from received messages. Media is stored encrypted on WhatsApp’s servers and must be downloaded and decrypted.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#basic-media-download)

Basic Media Download

Download media from a message:

```
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { createWriteStream } from 'fs'

sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const m of messages) {
    if (!m.message) continue
    
    // Download as buffer
    const buffer = await downloadMediaMessage(
      m,
      'buffer',
      { },
      {
        logger,
        reuploadRequest: sock.updateMediaMessage
      }
    )
    
    // Save to file
    await fs.writeFile('./downloaded-media.jpg', buffer)
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#download-as-stream)

Download as Stream

For large files, use stream to avoid loading everything into memory:

```
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { createWriteStream } from 'fs'

sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const m of messages) {
    if (!m.message) continue
    
    // Download as stream
    const stream = await downloadMediaMessage(
      m,
      'stream',
      { },
      {
        logger,
        reuploadRequest: sock.updateMediaMessage
      }
    )
    
    // Pipe to file
    const writeStream = createWriteStream('./my-download.jpeg')
    stream.pipe(writeStream)
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#check-message-type)

Check Message Type

Before downloading, check if the message contains media:

```
import { getContentType } from '@whiskeysockets/baileys'

sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const m of messages) {
    if (!m.message) continue
    
    const messageType = getContentType(m.message)
    
    if (messageType === 'imageMessage') {
      // Download image
      const buffer = await downloadMediaMessage(m, 'buffer', {}, ctx)
      console.log('Downloaded image, size:', buffer.length)
    }
    else if (messageType === 'videoMessage') {
      // Download video
      const buffer = await downloadMediaMessage(m, 'buffer', {}, ctx)
      console.log('Downloaded video, size:', buffer.length)
    }
    else if (messageType === 'audioMessage') {
      // Download audio
      const buffer = await downloadMediaMessage(m, 'buffer', {}, ctx)
      console.log('Downloaded audio, size:', buffer.length)
    }
    else if (messageType === 'documentMessage') {
      // Download document
      const buffer = await downloadMediaMessage(m, 'buffer', {}, ctx)
      console.log('Downloaded document, size:', buffer.length)
    }
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#download-options)

Download Options

Control the download behavior:

```
type MediaDownloadOptions = {
  // Start downloading from a specific byte
  startByte?: number
  
  // End downloading at a specific byte
  endByte?: number
  
  // Custom fetch options (headers, etc.)
  options?: RequestInit
}

// Download only part of a file
const stream = await downloadMediaMessage(
  message,
  'stream',
  {
    startByte: 0,
    endByte: 1024 * 100 // First 100KB
  },
  ctx
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#media-reupload)

Media Reupload

WhatsApp automatically removes old media from servers. If a download fails, request a reupload:

```
const ctx = {
  logger,
  reuploadRequest: sock.updateMediaMessage
}

try {
  const buffer = await downloadMediaMessage(
    message,
    'buffer',
    {},
    ctx // Context with reupload function
  )
} catch (error) {
  if (error.status === 404 || error.status === 410) {
    console.log('Media expired, reupload was requested automatically')
  }
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#manual-reupload-request)

Manual Reupload Request

```
try {
  const buffer = await downloadMediaMessage(message, 'buffer', {}, ctx)
} catch (error) {
  if (error.status === 404) {
    // Request reupload manually
    await sock.updateMediaMessage(message)
    
    // Try download again
    const buffer = await downloadMediaMessage(message, 'buffer', {}, ctx)
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#download-from-content)

Download from Content

Directly download from message content:

```
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const message = m.message?.imageMessage

if (message) {
  const stream = await downloadContentFromMessage(
    message,
    'image'
  )
  
  // Convert to buffer
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#media-types)

Media Types

Supported media types for download:

```
type MediaType = 
  | 'image'
  | 'video' 
  | 'audio'
  | 'document'
  | 'sticker'
  | 'thumbnail-link'
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#get-file-extension)

Get File Extension

Determine the correct file extension:

```
import { extensionForMediaMessage } from '@whiskeysockets/baileys'

const extension = extensionForMediaMessage(m.message!)
const filename = `downloaded-${Date.now()}.${extension}`

await fs.writeFile(filename, buffer)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#complete-download-example)

Complete Download Example

Full example with type checking, error handling, and file saving:

```
import { 
  downloadMediaMessage,
  getContentType,
  extensionForMediaMessage 
} from '@whiskeysockets/baileys'
import { writeFile } from 'fs/promises'

sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const m of messages) {
    if (!m.message) continue
    
    const messageType = getContentType(m.message)
    
    // Check if it's a media message
    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage']
    
    if (messageType && mediaTypes.includes(messageType)) {
      try {
        console.log('Downloading media...')
        
        const buffer = await downloadMediaMessage(
          m,
          'buffer',
          {},
          {
            logger,
            reuploadRequest: sock.updateMediaMessage
          }
        )
        
        // Get appropriate file extension
        const extension = extensionForMediaMessage(m.message)
        const filename = `media-${Date.now()}.${extension}`
        
        // Save to file
        await writeFile(filename, buffer)
        
        console.log(`Saved media to ${filename}, size: ${buffer.length} bytes`)
        
      } catch (error) {
        console.error('Failed to download media:', error)
      }
    }
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#stream-processing-example)

Stream Processing Example

Process large media files without loading into memory:

```
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const m of messages) {
    if (!m.message?.videoMessage) continue
    
    const stream = await downloadMediaMessage(
      m,
      'stream',
      {},
      { logger, reuploadRequest: sock.updateMediaMessage }
    )
    
    const filename = `video-${Date.now()}.mp4`
    const writeStream = createWriteStream(filename)
    
    await pipeline(stream, writeStream)
    
    console.log(`Video saved to ${filename}`)
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#thumbnail-download)

Thumbnail Download

Some messages have thumbnails that can be extracted:

```
const message = m.message?.imageMessage

if (message?.jpegThumbnail) {
  // Thumbnail is already in the message
  const thumbnail = Buffer.from(message.jpegThumbnail)
  await writeFile('thumbnail.jpg', thumbnail)
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#media-message-properties)

Media Message Properties

Useful properties available on media messages:

```
const imageMsg = m.message?.imageMessage

if (imageMsg) {
  console.log('MIME type:', imageMsg.mimetype)
  console.log('File size:', imageMsg.fileLength)
  console.log('Width:', imageMsg.width)
  console.log('Height:', imageMsg.height)
  console.log('Caption:', imageMsg.caption)
  console.log('Media key:', imageMsg.mediaKey)
  console.log('Direct path:', imageMsg.directPath)
  console.log('URL:', imageMsg.url)
  console.log('SHA256:', imageMsg.fileSha256)
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#direct-download-from-url)

Direct Download from URL

If you have the direct path and media key:

```
import { 
  downloadContentFromMessage,
  getMediaKeys 
} from '@whiskeysockets/baileys'

const { directPath, mediaKey } = message.imageMessage!

const stream = await downloadContentFromMessage(
  { directPath, mediaKey },
  'image'
)

const chunks: Buffer[] = []
for await (const chunk of stream) {
  chunks.push(chunk)
}
const buffer = Buffer.concat(chunks)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#error-handling)

Error Handling

```
async function downloadMedia(message: WAMessage) {
  try {
    const buffer = await downloadMediaMessage(
      message,
      'buffer',
      {},
      { logger, reuploadRequest: sock.updateMediaMessage }
    )
    return buffer
  } catch (error: any) {
    if (error.status === 404) {
      console.error('Media not found (may have expired)')
    } else if (error.status === 410) {
      console.error('Media gone (expired and cannot be reuploaded)')
    } else if (error.message?.includes('Invalid media message')) {
      console.error('Not a media message')
    } else {
      console.error('Download failed:', error.message)
    }
    throw error
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#best-practices)

Best Practices

1.  **Use Streams**: For files larger than 10MB, use stream mode to avoid memory issues
2.  **Type Checking**: Always check message type before downloading
3.  **Error Handling**: Implement retry logic for failed downloads
4.  **Reupload Support**: Always provide `reuploadRequest` function
5.  **File Extensions**: Use `extensionForMediaMessage()` for correct extensions
6.  **Cleanup**: Remove downloaded files when no longer needed

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#performance-tips)

Performance Tips

```
// ❌ Bad - loads entire file into memory
const buffer = await downloadMediaMessage(message, 'buffer', {}, ctx)
processLargeVideo(buffer)

// ✅ Good - streams the file
const stream = await downloadMediaMessage(message, 'stream', {}, ctx)
processLargeVideoStream(stream)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media#next-steps)

Next Steps

## Media Messages

Learn how to send media messages

## Handling Events

Handle incoming messages

[

Modifying Messages

Previous



](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages)[

Creating Groups

Next



](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups)
