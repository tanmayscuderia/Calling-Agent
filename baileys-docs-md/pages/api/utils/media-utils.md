# Media Utilities

Source: https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils

Media utility functions handle all aspects of media messages including downloading, encryption, thumbnail generation, and media upload preparation.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#downloadmediamessage)

downloadMediaMessage

Downloads media from a WhatsApp message.

```
export const downloadMediaMessage = async <Type extends 'buffer' | 'stream'>(
  message: WAMessage,
  type: Type,
  options: MediaDownloadOptions,
  ctx?: DownloadMediaMessageContext
): Promise<Type extends 'buffer' ? Buffer : Transform>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-message)

message

WAMessage

required

The message containing media to download

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-type)

type

'buffer' | 'stream'

required

Whether to return a Buffer or a Stream

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-options)

options

MediaDownloadOptions

required

Download options including byte range

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-ctx)

ctx

DownloadMediaMessageContext

Context with reupload request handler and logger

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#mediadownloadoptions)

MediaDownloadOptions

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-options-start-byte)

options.startByte

number

Start byte for partial download

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-options-end-byte)

options.endByte

number

End byte for partial download

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-options-options)

options.options

RequestInit

Fetch options for the download request

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-return)

return

Buffer | Transform

Downloaded media as Buffer (type=‘buffer’) or Stream (type=‘stream’)

**Example:**

```
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import fs from 'fs'

// Download as buffer
const buffer = await downloadMediaMessage(
  message,
  'buffer',
  { }
)
fs.writeFileSync('image.jpg', buffer)

// Download as stream
const stream = await downloadMediaMessage(
  message,
  'stream',
  { }
)
stream.pipe(fs.createWriteStream('video.mp4'))

// Partial download
const partialBuffer = await downloadMediaMessage(
  message,
  'buffer',
  {
    startByte: 0,
    endByte: 1024 // Download first 1KB
  }
)

// With reupload context
const bufferWithRetry = await downloadMediaMessage(
  message,
  'buffer',
  { },
  {
    reuploadRequest: async (msg) => {
      // Request media re-upload from sender
      return await sock.reuploadRequest(msg)
    },
    logger: myLogger
  }
)
```

**When to use:**

-   To download images, videos, audio, documents from messages
-   For saving media to disk
-   When processing media files (thumbnails, transcoding, etc.)
-   Automatically handles media decryption

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#downloadcontentfrommessage)

downloadContentFromMessage

Downloads and decrypts media content from a downloadable message.

```
export const downloadContentFromMessage = async (
  { mediaKey, directPath, url }: DownloadableMessage,
  type: MediaType,
  opts?: MediaDownloadOptions
): Promise<Transform>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-message-1)

message

DownloadableMessage

required

Object containing mediaKey, directPath, and/or url

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-type-1)

type

MediaType

required

Type of media: ‘image’, ‘video’, ‘audio’, ‘document’, ‘sticker’, etc.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-opts)

opts

MediaDownloadOptions

Download options

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-return-1)

return

Transform

Decrypted media stream

**Example:**

```
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const msg = message.message.imageMessage
const stream = await downloadContentFromMessage(
  {
    mediaKey: msg.mediaKey,
    directPath: msg.directPath,
    url: msg.url
  },
  'image'
)

const buffers = []
for await (const chunk of stream) {
  buffers.push(chunk)
}
const buffer = Buffer.concat(buffers)
```

**When to use:**

-   For lower-level media downloading
-   When you have the media message properties directly
-   For streaming large files

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#encryptedstream)

encryptedStream

Encrypts media for upload to WhatsApp servers.

```
export const encryptedStream = async (
  media: WAMediaUpload,
  mediaType: MediaType,
  options?: EncryptedStreamOptions
): Promise<{
  mediaKey: Buffer
  encFilePath: string
  originalFilePath?: string
  mac: Buffer
  fileEncSha256: Buffer
  fileSha256: Buffer
  fileLength: number
}>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-media)

media

WAMediaUpload

required

Media to encrypt (Buffer, Stream, or URL object)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-media-type)

mediaType

MediaType

required

Type of media being encrypted

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-options-1)

options

EncryptedStreamOptions

Encryption options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#encryptedstreamoptions)

EncryptedStreamOptions

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-options-save-original-file-if-required)

options.saveOriginalFileIfRequired

boolean

default:false

Whether to save the original unencrypted file

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-options-logger)

options.logger

ILogger

Logger instance

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-options-opts)

options.opts

RequestInit

Fetch options if media is a URL

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-return-2)

return

object

Object containing encryption keys, file paths, hashes, and file length

**Example:**

```
import { encryptedStream } from '@whiskeysockets/baileys'
import fs from 'fs'

// Encrypt from buffer
const buffer = fs.readFileSync('image.jpg')
const encrypted = await encryptedStream(
  buffer,
  'image',
  { logger: myLogger }
)

console.log(encrypted.mediaKey) // Encryption key
console.log(encrypted.encFilePath) // Path to encrypted file
console.log(encrypted.fileSha256) // SHA256 of original
console.log(encrypted.fileEncSha256) // SHA256 of encrypted

// Encrypt from URL
const encryptedFromUrl = await encryptedStream(
  { url: 'https://example.com/image.jpg' },
  'image'
)

// Encrypt from stream
const stream = fs.createReadStream('video.mp4')
const encryptedStream = await encryptedStream(
  { stream },
  'video',
  { saveOriginalFileIfRequired: true }
)

console.log(encryptedStream.originalFilePath) // Saved original file
```

**When to use:**

-   Before uploading media to WhatsApp
-   Automatically called by `sendMessage` with media
-   For manual media upload workflows

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#generatethumbnail)

generateThumbnail

Generates a JPEG thumbnail for images or videos.

```
export async function generateThumbnail(
  file: string,
  mediaType: 'video' | 'image',
  options: { logger?: ILogger }
): Promise<{
  thumbnail?: string
  originalImageDimensions?: { width: number; height: number }
}>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-file)

file

string

required

Path to the media file

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-media-type-1)

mediaType

'video' | 'image'

required

Type of media

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-options-2)

options

object

required

Options with optional logger

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-return-3)

return

object

Object with base64 thumbnail and original dimensions (for images)

**Example:**

```
import { generateThumbnail } from '@whiskeysockets/baileys'

// Generate image thumbnail
const { thumbnail, originalImageDimensions } = await generateThumbnail(
  '/path/to/image.jpg',
  'image',
  { logger: myLogger }
)

console.log(thumbnail) // Base64 encoded JPEG thumbnail
console.log(originalImageDimensions) // { width: 1920, height: 1080 }

// Generate video thumbnail
const { thumbnail: videoThumb } = await generateThumbnail(
  '/path/to/video.mp4',
  'video',
  { logger: myLogger }
)

console.log(videoThumb) // Base64 thumbnail from video frame
```

**When to use:**

-   Automatically used when sending images/videos
-   For generating preview thumbnails
-   Requires ffmpeg for video thumbnails
-   Requires sharp or jimp for image thumbnails

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#getaudioduration)

getAudioDuration

Gets the duration of an audio file in seconds.

```
export async function getAudioDuration(
  buffer: Buffer | string | Readable
): Promise<number | undefined>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-buffer)

buffer

Buffer | string | Readable

required

Audio file as Buffer, file path string, or Readable stream

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-return-4)

return

number | undefined

Audio duration in seconds

**Example:**

```
import { getAudioDuration } from '@whiskeysockets/baileys'
import fs from 'fs'

// From buffer
const buffer = fs.readFileSync('audio.mp3')
const duration = await getAudioDuration(buffer)
console.log(`Duration: ${duration} seconds`)

// From file path
const duration2 = await getAudioDuration('/path/to/audio.mp3')

// From stream
const stream = fs.createReadStream('audio.ogg')
const duration3 = await getAudioDuration(stream)
```

**When to use:**

-   Automatically used when sending audio messages
-   For displaying audio duration in UI
-   Requires music-metadata package

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#getrawmediauploaddata)

getRawMediaUploadData

Prepares raw media data for upload (used for newsletters).

```
export const getRawMediaUploadData = async (
  media: WAMediaUpload,
  mediaType: MediaType,
  logger?: ILogger
): Promise<{
  filePath: string
  fileSha256: Buffer
  fileLength: number
}>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-media-1)

media

WAMediaUpload

required

Media to prepare (Buffer, Stream, or URL)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-media-type-2)

mediaType

MediaType

required

Type of media

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-logger)

logger

ILogger

Logger instance

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-return-5)

return

object

Object with file path, SHA256 hash, and file length

**Example:**

```
import { getRawMediaUploadData } from '@whiskeysockets/baileys'
import fs from 'fs'

const buffer = fs.readFileSync('image.jpg')
const uploadData = await getRawMediaUploadData(
  buffer,
  'image',
  logger
)

console.log(uploadData.filePath) // Temp file path
console.log(uploadData.fileSha256) // SHA256 hash
console.log(uploadData.fileLength) // File size in bytes

// Use for newsletter upload
const { mediaUrl, directPath } = await sock.newsletterUpload(
  uploadData.filePath,
  {
    fileEncSha256B64: uploadData.fileSha256.toString('base64'),
    mediaType: 'image'
  }
)
```

**When to use:**

-   When uploading media to newsletters
-   For unencrypted media uploads
-   Automatically used internally for newsletter messages

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#generateprofilepicture)

generateProfilePicture

Generates a profile picture by resizing and cropping an image.

```
export const generateProfilePicture = async (
  mediaUpload: WAMediaUpload,
  dimensions?: { width: number; height: number }
): Promise<{ img: Buffer }>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-media-upload)

mediaUpload

WAMediaUpload

required

Image to process (Buffer, Stream, or URL)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-dimensions)

dimensions

{ width: number; height: number }

Target dimensions (default: 640x640)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils#param-return-6)

return

{ img: Buffer }

Processed profile picture as JPEG buffer

**Example:**

```
import { generateProfilePicture } from '@whiskeysockets/baileys'
import fs from 'fs'

const buffer = fs.readFileSync('photo.jpg')
const { img } = await generateProfilePicture(buffer)

// Update profile picture
await sock.updateProfilePicture(sock.user.id, img)

// Custom dimensions
const { img: smallImg } = await generateProfilePicture(
  buffer,
  { width: 320, height: 320 }
)
```

**When to use:**

-   When updating profile pictures
-   Automatically resizes and crops to square
-   Requires sharp or jimp library

[

Message Utilities

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils)[

Chat & JID Utilities

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils)
