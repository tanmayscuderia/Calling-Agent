# Message Types

Source: https://whiskeysockets-baileys-94.mintlify.app/api/types/messages

Baileys provides comprehensive TypeScript types for working with WhatsApp messages.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#core-message-types)

Core Message Types

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#wamessage)

WAMessage

Extends `proto.IWebMessageInfo` with additional Baileys-specific fields.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-key)

key

WAMessageKey

required

Unique identifier for the message

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-message)

message

WAMessageContent

The actual message content (proto.IMessage)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-message-timestamp)

messageTimestamp

number | Long

Unix timestamp when message was sent

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-message-stub-parameters)

messageStubParameters

any

Parameters for stub messages (system messages)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-category)

category

string

Message category classification

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-retry-count)

retryCount

number

Number of times message delivery has been retried

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#wamessagekey)

WAMessageKey

Extends `proto.IMessageKey` with additional routing information.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-remote-jid)

remoteJid

string

JID of the chat (group or individual)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-from-me)

fromMe

boolean

Whether the message was sent by you

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-id)

id

string

Unique message ID

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-participant)

participant

string

Sender’s JID in group chats

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-remote-jid-alt)

remoteJidAlt

string

Alternative JID format (Baileys extension)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-participant-alt)

participantAlt

string

Alternative participant format (Baileys extension)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-server-id)

server\_id

string

Server-assigned ID (Baileys extension)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-addressing-mode)

addressingMode

string

Addressing mode: ‘pn’ or ‘lid’ (Baileys extension)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-is-view-once)

isViewOnce

boolean

Whether this is a view-once message (Baileys extension)

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#message-content-types)

Message Content Types

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#anymessagecontent)

AnyMessageContent

Union type for all possible message content:

```
type AnyMessageContent =
  | AnyRegularMessageContent
  | { forward: WAMessage; force?: boolean }
  | { delete: WAMessageKey }
  | { disappearingMessagesInChat: boolean | number }
  | { limitSharing: boolean }
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#anyregularmessagecontent)

AnyRegularMessageContent

Union of all regular message types you can send:

Text Messages

```
{
  text: string
  linkPreview?: WAUrlInfo | null
} & Mentionable & Contextable & Editable
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-text)

text

string

required

The message text

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-link-preview)

linkPreview

WAUrlInfo | null

Link preview metadata

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-mentions)

mentions

string\[\]

Array of mentioned JIDs

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-context-info)

contextInfo

proto.IContextInfo

Context info (quoted message, etc.)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-edit)

edit

WAMessageKey

Key of message to edit

Media Messages

See [AnyMediaMessageContent](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#anymediamessagecontent) below

Poll Messages

```
{
  poll: PollMessageOptions
} & Mentionable & Contextable & Editable
```
Contact Messages

```
{
  contacts: {
    displayName?: string
    contacts: proto.Message.IContactMessage[]
  }
}
```
Location Messages

```
{
  location: WALocationMessage
}
```
Reaction Messages

```
{
  react: proto.Message.IReactionMessage
}
```
Button Reply

```
{
  buttonReply: ButtonReplyInfo
  type: 'template' | 'plain'
}
```
Pin Messages

```
{
  pin: WAMessageKey
  type: proto.PinInChat.Type
  time?: 86400 | 604800 | 2592000 // 24h, 7d, or 30d
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#anymediamessagecontent)

AnyMediaMessageContent

Union type for all media message types:

-   Image
    
-   Video
    
-   Audio
    
-   Document
    
-   Sticker
    

```
{
  image: WAMediaUpload
  caption?: string
  jpegThumbnail?: string
  width?: number
  height?: number
  mentions?: string[]
  contextInfo?: proto.IContextInfo
}
```

```
{
  video: WAMediaUpload
  caption?: string
  gifPlayback?: boolean
  jpegThumbnail?: string
  ptv?: boolean // video note
  width?: number
  height?: number
  mentions?: string[]
  contextInfo?: proto.IContextInfo
}
```

```
{
  audio: WAMediaUpload
  ptt?: boolean // voice note
  seconds?: number // duration
}
```

```
{
  document: WAMediaUpload
  mimetype: string
  fileName?: string
  caption?: string
  contextInfo?: proto.IContextInfo
}
```

```
{
  sticker: WAMediaUpload
  isAnimated?: boolean
  width?: number
  height?: number
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#wamediaupload)

WAMediaUpload

Union type for media upload sources:

```
type WAMediaUpload = 
  | Buffer 
  | { stream: Readable } 
  | { url: URL | string }
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#special-message-types)

Special Message Types

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#pollmessageoptions)

PollMessageOptions

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-name)

name

string

required

Poll question

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-values)

values

string\[\]

required

Array of poll options

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-selectable-count)

selectableCount

number

Number of options users can select (default: 1)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-message-secret)

messageSecret

Uint8Array

32-byte secret to encrypt poll selections

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-to-announcement-group)

toAnnouncementGroup

boolean

Whether poll is for announcement group

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#eventmessageoptions)

EventMessageOptions

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-name-1)

name

string

required

Event title

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-start-date)

startDate

Date

required

Event start date/time

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-description)

description

string

Event description

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-end-date)

endDate

Date

Event end date/time

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-location)

location

WALocationMessage

Event location

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-call)

call

'audio' | 'video'

Type of call event

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-is-cancelled)

isCancelled

boolean

Whether event is cancelled

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-is-schedule-call)

isScheduleCall

boolean

Whether this is a scheduled call

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-extra-guests-allowed)

extraGuestsAllowed

boolean

Whether guests can bring +1

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#message-generation-options)

Message Generation Options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#messagegenerationoptions)

MessageGenerationOptions

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-timestamp)

timestamp

Date

Manual message timestamp

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-quoted)

quoted

WAMessage

Message to quote/reply to

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-ephemeral-expiration)

ephemeralExpiration

number | string

Disappearing message timer

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-message-id)

messageId

string

Custom message ID override

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-media-upload-timeout-ms)

mediaUploadTimeoutMs

number

Timeout for media uploads

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-status-jid-list)

statusJidList

string\[\]

JID list for status broadcasts

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-background-color)

backgroundColor

string

Background color for status

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-font)

font

number

Font type for status

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#message-updates-and-events)

Message Updates and Events

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#messageupserttype)

MessageUpsertType

```
type MessageUpsertType = 'append' | 'notify'
```

-   **notify**: New message that should trigger a notification
-   **append**: Historical message being synced, no notification needed

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#wamessageupdate)

WAMessageUpdate

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-key-1)

key

WAMessageKey

required

Key identifying the message to update

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-update)

update

Partial<WAMessage>

required

Partial message data with updates to apply

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#messageuserreceipt)

MessageUserReceipt

Alias for `proto.IUserReceipt` containing:

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-user-jid)

userJid

string

User who sent the receipt

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-receipt-timestamp)

receiptTimestamp

number | Long

When the receipt was sent

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-read-timestamp)

readTimestamp

number | Long

When the message was read

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-played-timestamp)

playedTimestamp

number | Long

When media was played

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#utility-types)

Utility Types

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#downloadablemessage)

DownloadableMessage

Messages that contain downloadable media:

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-media-key)

mediaKey

Uint8Array | null

Encryption key for media

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-direct-path)

directPath

string | null

Direct download path

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#param-url)

url

string | null

Download URL

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#messagereceipttype)

MessageReceiptType

```
type MessageReceiptType =
  | 'read'
  | 'read-self'
  | 'hist_sync'
  | 'peer_msg'
  | 'sender'
  | 'inactive'
  | 'played'
  | undefined
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#minimalmessage)

MinimalMessage

Minimal message data for references:

```
type MinimalMessage = Pick<WAMessage, 'key' | 'messageTimestamp'>
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages#example-usage)

Example Usage

```
import { AnyMessageContent } from '@whiskeysockets/baileys'

// Send a text message
const textMsg: AnyMessageContent = {
  text: 'Hello @1234567890',
  mentions: ['1234567890@s.whatsapp.net']
}

// Send an image
const imageMsg: AnyMessageContent = {
  image: { url: 'https://example.com/image.jpg' },
  caption: 'Check this out!',
  mentions: ['1234567890@s.whatsapp.net']
}

// Send a poll
const pollMsg: AnyMessageContent = {
  poll: {
    name: 'What\'s your favorite color?',
    values: ['Red', 'Blue', 'Green'],
    selectableCount: 1
  }
}

// Delete a message
const deleteMsg: AnyMessageContent = {
  delete: messageKey
}

// Forward a message
const forwardMsg: AnyMessageContent = {
  forward: originalMessage,
  force: true
}
```

[

makeCacheableSignalKeyStore

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore)[

Event Types

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/types/events)
