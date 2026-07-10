# Message Utilities

Source: https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils

Message utility functions help you work with WhatsApp messages, including generating message content, extracting URLs, normalizing messages, and creating forwarded messages.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#generatemessageidv2)

generateMessageIDV2

Generates a unique message ID v2 compatible with WhatsApp’s format.

```
export const generateMessageIDV2 = (userId?: string): string
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-user-id)

userId

string

The user’s JID to include in the message ID generation

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-return)

return

string

A unique message ID in the format `3EB0` followed by 18 hex characters

**Example:**

```
import { generateMessageIDV2 } from '@whiskeysockets/baileys'

const messageId = generateMessageIDV2()
console.log(messageId) // "3EB01A2B3C4D5E6F7G8H9I"

// With user ID
const messageIdWithUser = generateMessageIDV2('1234567890@s.whatsapp.net')
```

**When to use:**

-   When you need to generate a custom message ID
-   For creating messages programmatically
-   The ID includes timestamp and random data for uniqueness

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#getcontenttype)

getContentType

Extracts the content type key from a message object.

```
export const getContentType = (
  content: proto.IMessage | undefined
): keyof proto.IMessage | undefined
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-content)

content

proto.IMessage | undefined

The message content object to analyze

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-return-1)

return

keyof proto.IMessage | undefined

The message content type (e.g., ‘conversation’, ‘imageMessage’, ‘videoMessage’)

**Example:**

```
import { getContentType } from '@whiskeysockets/baileys'

const message = {
  conversation: 'Hello World'
}

const contentType = getContentType(message)
console.log(contentType) // "conversation"

const imageMessage = {
  imageMessage: {
    url: 'https://...',
    mimetype: 'image/jpeg'
  }
}

const imageType = getContentType(imageMessage)
console.log(imageType) // "imageMessage"
```

**When to use:**

-   To determine what type of message you’re dealing with
-   Before processing message content
-   For routing messages based on their type

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#extracturlfromtext)

extractUrlFromText

Extracts the first URL found in a text string using regex.

```
export const extractUrlFromText = (text: string): string | undefined
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-text)

text

string

required

The text string to search for URLs

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-return-2)

return

string | undefined

The first URL found in the text, or undefined if no URL is present

**Example:**

```
import { extractUrlFromText } from '@whiskeysockets/baileys'

const text1 = 'Check out https://google.com for more info'
const url1 = extractUrlFromText(text1)
console.log(url1) // "https://google.com"

const text2 = 'No links here'
const url2 = extractUrlFromText(text2)
console.log(url2) // undefined
```

**When to use:**

-   To detect if a message contains a URL
-   Before generating link previews
-   For URL validation or filtering

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#generatelinkpreviewifrequired)

generateLinkPreviewIfRequired

Generates link preview metadata for a URL in the text if a `getUrlInfo` function is provided.

```
export const generateLinkPreviewIfRequired = async (
  text: string,
  getUrlInfo: MessageGenerationOptions['getUrlInfo'],
  logger: MessageGenerationOptions['logger']
): Promise<WAUrlInfo | undefined>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-text-1)

text

string

required

The message text potentially containing a URL

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-get-url-info)

getUrlInfo

(url: string) => Promise<WAUrlInfo>

Function to fetch URL metadata (title, description, thumbnail)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-logger)

logger

ILogger

Logger instance for error tracking

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-return-3)

return

WAUrlInfo | undefined

Link preview information including title, description, and thumbnail

**Example:**

```
import { generateLinkPreviewIfRequired } from '@whiskeysockets/baileys'

const text = 'Check out https://github.com'
const getUrlInfo = async (url) => {
  // Fetch URL metadata
  return {
    'matched-text': url,
    title: 'GitHub',
    description: 'Where the world builds software',
    jpegThumbnail: Buffer.from('...')
  }
}

const preview = await generateLinkPreviewIfRequired(text, getUrlInfo, logger)
```

**When to use:**

-   To automatically generate link previews in messages
-   When sending text messages with URLs
-   For rich message formatting

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#normalizemessagecontent)

normalizeMessageContent

Normalizes ephemeral, view once, and other wrapped messages to their core content.

```
export const normalizeMessageContent = (
  content: WAMessageContent | null | undefined
): WAMessageContent | undefined
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-content-1)

content

WAMessageContent | null | undefined

The message content to normalize

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-return-4)

return

WAMessageContent | undefined

The normalized message content without wrappers

**Example:**

```
import { normalizeMessageContent } from '@whiskeysockets/baileys'

// Ephemeral message wrapper
const ephemeralMsg = {
  ephemeralMessage: {
    message: {
      conversation: 'This disappears'
    }
  }
}

const normalized = normalizeMessageContent(ephemeralMsg)
console.log(normalized)
// { conversation: 'This disappears' }

// View once message
const viewOnceMsg = {
  viewOnceMessage: {
    message: {
      imageMessage: { url: '...', mimetype: 'image/jpeg' }
    }
  }
}

const normalizedImage = normalizeMessageContent(viewOnceMsg)
console.log(normalizedImage)
// { imageMessage: { url: '...', mimetype: 'image/jpeg' } }
```

**When to use:**

-   To extract the actual message content from wrapped messages
-   Before processing or displaying message content
-   When you need the core message regardless of ephemeral/view-once status

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#generateforwardmessagecontent)

generateForwardMessageContent

Generates message content for forwarding a message, maintaining the forward chain.

```
export const generateForwardMessageContent = (
  message: WAMessage,
  forceForward?: boolean
): WAMessageContent
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-message)

message

WAMessage

required

The message to forward

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-force-forward)

forceForward

boolean

default:false

Whether to show the message as forwarded even if it’s from you

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-return-5)

return

WAMessageContent

Message content with forwarding metadata and score updated

**Example:**

```
import { generateForwardMessageContent } from '@whiskeysockets/baileys'

// Get the original message
const originalMessage = {
  key: { remoteJid: '1234@s.whatsapp.net', fromMe: false, id: 'ABC' },
  message: { conversation: 'Hello!' }
}

// Generate forward content
const forwardContent = generateForwardMessageContent(originalMessage)

// Send the forwarded message
await sock.sendMessage(jid, forwardContent)

// Force forward even if message is from you
const forceForwardContent = generateForwardMessageContent(
  originalMessage,
  true
)
```

**When to use:**

-   When implementing message forwarding
-   To maintain the forward chain (shows “Forwarded” label)
-   Automatically handles forwarding score incrementation

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#generatewamessagefromcontent)

generateWAMessageFromContent

Generates a complete WAMessage object from message content.

```
export const generateWAMessageFromContent = (
  jid: string,
  message: WAMessageContent,
  options: MessageGenerationOptionsFromContent
): WAMessage
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-jid)

jid

string

required

The recipient’s JID (e.g., ‘[1234567890@s.whatsapp.net](mailto:1234567890@s.whatsapp.net)’)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-message-1)

message

WAMessageContent

required

The message content to wrap

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-options)

options

MessageGenerationOptionsFromContent

required

Options for message generation

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#options)

Options

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-options-timestamp)

options.timestamp

Date

Message timestamp (defaults to current time)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-options-message-id)

options.messageId

string

Custom message ID (auto-generated if not provided)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-options-quoted)

options.quoted

WAMessage

Message to quote/reply to

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-options-user-jid)

options.userJid

string

required

Your user JID

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-options-ephemeral-expiration)

options.ephemeralExpiration

number

Ephemeral message expiration in seconds

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-return-6)

return

WAMessage

Complete message object ready to be sent

**Example:**

```
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

const jid = '1234567890@s.whatsapp.net'
const messageContent = proto.Message.fromObject({
  conversation: 'Hello World'
})

const message = generateWAMessageFromContent(
  jid,
  messageContent,
  {
    userJid: 'me@s.whatsapp.net',
    timestamp: new Date(),
    messageId: 'custom-id'
  }
)

console.log(message.key.id) // "custom-id"
console.log(message.messageTimestamp) // current timestamp

// With quoted message
const quotedMsg = generateWAMessageFromContent(
  jid,
  messageContent,
  {
    userJid: 'me@s.whatsapp.net',
    quoted: previousMessage // Quote another message
  }
)
```

**When to use:**

-   When you have raw message content and need a complete message object
-   For advanced message construction
-   When implementing custom message types

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#extractmessagecontent)

extractMessageContent

Extracts the actual message content from template messages and button messages.

```
export const extractMessageContent = (
  content: WAMessageContent | undefined | null
): WAMessageContent | undefined
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-content-2)

content

WAMessageContent | undefined | null

Message content to extract from

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-return-7)

return

WAMessageContent | undefined

The extracted core message content

**Example:**

```
import { extractMessageContent } from '@whiskeysockets/baileys'

// Button message
const buttonMsg = {
  buttonsMessage: {
    imageMessage: { url: '...', mimetype: 'image/jpeg' },
    contentText: 'Choose an option'
  }
}

const extracted = extractMessageContent(buttonMsg)
console.log(extracted)
// { imageMessage: { url: '...', mimetype: 'image/jpeg' } }

// Template message
const templateMsg = {
  templateMessage: {
    hydratedFourRowTemplate: {
      videoMessage: { url: '...', mimetype: 'video/mp4' }
    }
  }
}

const extractedVideo = extractMessageContent(templateMsg)
console.log(extractedVideo)
// { videoMessage: { url: '...', mimetype: 'video/mp4' } }
```

**When to use:**

-   To get the media from button/template messages
-   Before downloading media from interactive messages
-   When processing complex message types

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#getdevice)

getDevice

Returns the device type based on the message ID format.

```
export const getDevice = (id: string): 'ios' | 'web' | 'android' | 'desktop' | 'unknown'
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-id)

id

string

required

The message ID to analyze

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils#param-return-8)

return

'ios' | 'web' | 'android' | 'desktop' | 'unknown'

The predicted device type based on ID pattern

**Example:**

```
import { getDevice } from '@whiskeysockets/baileys'

const iosId = '3A123456789012345678'
const device1 = getDevice(iosId)
console.log(device1) // "ios"

const webId = '3E12345678901234567890'
const device2 = getDevice(webId)
console.log(device2) // "web"

const androidId = '123456789012345678901'
const device3 = getDevice(androidId)
console.log(device3) // "android"
```

**When to use:**

-   For analytics on which devices users are messaging from
-   To detect message origin
-   For debugging purposes

[

Chat Types

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat)[

Media Utilities

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils)
