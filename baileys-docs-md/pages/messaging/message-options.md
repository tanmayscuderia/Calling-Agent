# Message Options

Source: https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#overview)

Overview

Message options control how messages are sent and displayed. These options are passed as the third parameter to `sendMessage`:

```
await sock.sendMessage(
  jid,
  { text: 'Hello' }, // Content
  { /* options here */ } // Options
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#quoted-messages)

Quoted Messages

Reply to a specific message:

```
const originalMessage: WAMessage = /* from store or event */

await sock.sendMessage(
  jid,
  { text: 'This is a reply' },
  { quoted: originalMessage }
)
```

Quoted messages work with all message types - text, media, locations, contacts, etc.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#quote-any-message-type)

Quote Any Message Type

```
// Quote and send media
await sock.sendMessage(
  jid,
  { image: { url: './response.jpg' } },
  { quoted: originalMessage }
)

// Quote and send location
await sock.sendMessage(
  jid,
  { 
    location: {
      degreesLatitude: 24.121231,
      degreesLongitude: 55.1121221
    }
  },
  { quoted: originalMessage }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#ephemeral-messages)

Ephemeral Messages

Send disappearing messages that auto-delete after a specified time:

```
await sock.sendMessage(
  jid,
  { text: 'This will disappear' },
  { ephemeralExpiration: 86400 } // 24 hours in seconds
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#supported-durations)

Supported Durations

| Duration | Seconds | Constant |
| --- | --- | --- |
| 24 hours | 86400 | \- |
| 7 days | 604800 | `WA_DEFAULT_EPHEMERAL` |
| 90 days | 7776000 | \- |

```
import { WA_DEFAULT_EPHEMERAL } from '@whiskeysockets/baileys'

// 7 day disappearing message (WhatsApp default)
await sock.sendMessage(
  jid,
  { text: 'Disappears in 7 days' },
  { ephemeralExpiration: WA_DEFAULT_EPHEMERAL }
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#enable-disappearing-messages-in-chat)

Enable Disappearing Messages in Chat

Turn on disappearing messages for all future messages in a chat:

```
// Enable disappearing messages (7 days)
await sock.sendMessage(
  jid,
  { disappearingMessagesInChat: WA_DEFAULT_EPHEMERAL }
)

// Send a message (will automatically be ephemeral)
await sock.sendMessage(
  jid, 
  { text: 'This will disappear in 7 days' }
)

// Disable disappearing messages
await sock.sendMessage(
  jid,
  { disappearingMessagesInChat: false }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#custom-message-id)

Custom Message ID

Override the auto-generated message ID:

```
import { generateMessageIDV2 } from '@whiskeysockets/baileys'

const customId = generateMessageIDV2(sock.user?.id)

await sock.sendMessage(
  jid,
  { text: 'Message with custom ID' },
  { messageId: customId }
)
```

Custom message IDs must follow WhatsApp’s format. Use `generateMessageIDV2()` to ensure compatibility.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#custom-timestamp)

Custom Timestamp

Set a custom timestamp for the message:

```
await sock.sendMessage(
  jid,
  { text: 'Backdated message' },
  { timestamp: new Date('2024-01-01') }
)
```

WhatsApp may reject messages with timestamps too far in the past or future.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#broadcast-messages)

Broadcast Messages

Send to multiple recipients or as a status:

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#status/story-broadcast)

Status/Story Broadcast

```
await sock.sendMessage(
  'status@broadcast',
  {
    image: { url: './story.jpg' },
    caption: 'My status update'
  },
  {
    backgroundColor: '#FF5733', // Background color for text status
    font: 1, // Font style
    statusJidList: [
      '1111111111@s.whatsapp.net',
      '2222222222@s.whatsapp.net'
    ], // Who can see this status
    broadcast: true
  }
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#message-options-for-broadcasts)

Message Options for Broadcasts

```
type BroadcastOptions = {
  // Background color for text status (hex or ARGB number)
  backgroundColor?: string | number
  
  // Font type for status
  font?: number
  
  // List of JIDs who should receive the broadcast
  statusJidList?: string[]
  
  // Enable broadcast mode
  broadcast?: boolean
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#media-upload-options)

Media Upload Options

Control media upload behavior:

```
await sock.sendMessage(
  jid,
  { image: { url: './large-image.jpg' } },
  {
    // Timeout for media upload (milliseconds)
    mediaUploadTimeoutMs: 60000 // 1 minute
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#cached-group-metadata)

Cached Group Metadata

Control whether to use cached group metadata:

```
await sock.sendMessage(
  groupJid,
  { text: 'Hello group' },
  {
    // Force fetch fresh group metadata
    useCachedGroupMetadata: false
  }
)
```

By default, Baileys uses cached group metadata to improve performance. Set to `false` to always fetch fresh data.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#all-message-options)

All Message Options

Here’s the complete type definition from the source:

```
type MiscMessageGenerationOptions = {
  // Message ID override
  messageId?: string
  
  // Custom timestamp
  timestamp?: Date
  
  // Quote another message
  quoted?: WAMessage
  
  // Ephemeral/disappearing message duration (seconds)
  ephemeralExpiration?: number | string
  
  // Media upload timeout
  mediaUploadTimeoutMs?: number
  
  // Status broadcast recipient list
  statusJidList?: string[]
  
  // Background color for status
  backgroundColor?: string
  
  // Font type for status
  font?: number
  
  // Enable broadcast mode
  broadcast?: boolean
  
  // Use cached group metadata
  useCachedGroupMetadata?: boolean
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#combining-options)

Combining Options

You can combine multiple options:

```
import { generateMessageIDV2, WA_DEFAULT_EPHEMERAL } from '@whiskeysockets/baileys'

const msg = await sock.sendMessage(
  jid,
  {
    image: { url: './photo.jpg' },
    caption: 'Check this out @12345678901!',
    mentions: ['12345678901@s.whatsapp.net']
  },
  {
    quoted: originalMessage,
    ephemeralExpiration: WA_DEFAULT_EPHEMERAL,
    messageId: generateMessageIDV2(sock.user?.id),
    mediaUploadTimeoutMs: 60000
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#message-context-info)

Message Context Info

Add context info directly in the message content:

```
await sock.sendMessage(
  jid,
  {
    text: 'Message with context',
    contextInfo: {
      // Quoted message info (alternative to using 'quoted' option)
      stanzaId: quotedMessage.key.id,
      participant: quotedMessage.key.participant,
      quotedMessage: quotedMessage.message,
      
      // Mentioned JIDs
      mentionedJid: ['12345678901@s.whatsapp.net'],
      
      // Disappearing message expiration
      expiration: 86400,
      
      // External ad reply (for links)
      externalAdReply: {
        title: 'Custom Title',
        body: 'Custom Description',
        thumbnailUrl: 'https://example.com/image.jpg',
        sourceUrl: 'https://example.com'
      }
    }
  }
)
```

While you can set context info manually, using the `quoted` option and `mentions` array is recommended as Baileys handles the context info automatically.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#special-message-options)

Special Message Options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#forward-message)

Forward Message

```
const messageToForward: WAMessage = /* from store */

await sock.sendMessage(
  jid,
  { 
    forward: messageToForward,
    force: true // Show as forwarded even if from you
  }
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#view-once)

View Once

```
await sock.sendMessage(
  jid,
  {
    image: { url: './private.jpg' },
    viewOnce: true
  }
)
```

`viewOnce` is part of the message content, not options.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#best-practices)

Best Practices

1.  **Ephemeral Messages**: Use standard durations (24h, 7d, 90d) for compatibility
2.  **Message IDs**: Only use custom IDs when necessary; let Baileys generate them
3.  **Timestamps**: Avoid setting custom timestamps unless required
4.  **Media Timeouts**: Increase timeout for large files or slow connections
5.  **Group Metadata**: Use cached metadata for better performance
6.  **Broadcast Lists**: Ensure all JIDs in `statusJidList` are valid

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#examples-from-source)

Examples from Source

```
// From example.ts
const id = generateMessageIDV2(sock.user?.id)
await sock.sendMessage(
  msg.key.remoteJid!,
  { text: 'pong ' + msg.key.id },
  { messageId: id }
)
```

```
// From README.md
await sock.sendMessage(
  jid,
  { text: 'hello' },
  { ephemeralExpiration: WA_DEFAULT_EPHEMERAL }
)
```

```
// From README.md
await sock.sendMessage(
  jid,
  {
    image: { url: url },
    caption: caption
  },
  {
    backgroundColor: backgroundColor,
    font: font,
    statusJidList: statusJidList,
    broadcast: true
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#troubleshooting)

Troubleshooting

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#quoted-message-not-showing)

Quoted Message Not Showing

Ensure the quoted message object is complete:

```
// ✅ Correct
const quotedMsg: WAMessage = {
  key: { ... },
  message: { ... },
  messageTimestamp: ...
}

// ❌ Missing required fields
const quotedMsg = { key: { id: '...' } }
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#ephemeral-not-working)

Ephemeral Not Working

Check that:

1.  The duration is in seconds (not milliseconds)
2.  You’re using a supported duration (24h, 7d, 90d)
3.  The chat supports ephemeral messages

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#broadcast-not-delivering)

Broadcast Not Delivering

Verify:

1.  `broadcast: true` is set in options
2.  `statusJidList` contains valid JIDs
3.  JID format is correct (`@s.whatsapp.net`)

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options#next-steps)

Next Steps

## Modifying Messages

Learn to edit and delete messages

## Text Messages

Back to text message basics

[

Media Messages

Previous



](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages)[

Modifying Messages

Next



](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages)
