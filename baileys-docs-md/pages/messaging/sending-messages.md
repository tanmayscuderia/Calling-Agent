# Sending Messages

Source: https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#overview)

Overview

Bailey provides a unified `sendMessage` API for sending all types of messages. Whether you’re sending text, media, or interactive content, the same function is used with different content types.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#basic-message-sending)

Basic Message Sending

All messages are sent using the `sendMessage` method:

```
const jid: string
const content: AnyMessageContent
const options: MiscMessageGenerationOptions

await sock.sendMessage(jid, content, options)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#parameters)

Parameters

-   **jid**: The recipient’s WhatsApp ID
    -   For individuals: `[country code][phone number]@s.whatsapp.net`
    -   For groups: `123456789-123345@g.us`
    -   For broadcast lists: `[timestamp]@broadcast`
    -   For stories: `status@broadcast`
-   **content**: The message content (see [AnyMessageContent](https://baileys.whiskeysockets.io/types/AnyMessageContent.html))
-   **options**: Message options like quoted messages, ephemeral settings (see [MiscMessageGenerationOptions](https://baileys.whiskeysockets.io/types/MiscMessageGenerationOptions.html))

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#whatsapp-id-format)

WhatsApp ID Format

Understanding the JID (Jabber ID) format is crucial for sending messages:

```
const jid = '19999999999@s.whatsapp.net' // +1 999-999-9999
```

```
const jid = '123456789-123345@g.us'
```

```
const jid = '1234567890@broadcast'
```

```
const jid = 'status@broadcast'
```

The JID must not include `+`, `()`, or `-` characters. Only include the country code and phone number digits.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#simple-text-message)

Simple Text Message

The most basic message type:

```
await sock.sendMessage(jid, { text: 'Hello World!' })
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#message-return-value)

Message Return Value

The `sendMessage` function returns a WAMessage object containing:

```
const msg = await sock.sendMessage(jid, { text: 'hello' })

// Message structure
msg.key // { remoteJid, fromMe, id }
msg.message // The message content
msg.messageTimestamp // Unix timestamp
msg.status // Message status (PENDING, SERVER_ACK, DELIVERY_ACK, READ, PLAYED)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#message-types-overview)

Message Types Overview

Baileys supports a wide variety of message types:

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#text-based-messages)

Text-Based Messages

-   Text messages with mentions
-   Link previews
-   Quoted/replied messages

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#media-messages)

Media Messages

-   Images (with captions)
-   Videos (including GIFs)
-   Audio (voice notes)
-   Documents
-   Stickers

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#location-&-contact)

Location & Contact

-   Location sharing
-   Contact cards

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#interactive-messages)

Interactive Messages

-   Polls
-   Reactions
-   Pin messages
-   Events

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#special-messages)

Special Messages

-   Forward messages
-   View-once messages
-   Disappearing messages

See the following pages for detailed examples of each message type:

-   [Text Messages](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages) - Text, mentions, quotes, links
-   [Media Messages](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages) - Images, videos, audio, documents
-   [Message Options](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options) - Ephemeral, quoted, mentions
-   [Modifying Messages](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages) - Edit and delete
-   [Downloading Media](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media) - Download received media

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#error-handling)

Error Handling

```
try {
  const msg = await sock.sendMessage(jid, { text: 'Hello!' })
  console.log('Message sent:', msg.key.id)
} catch (error) {
  console.error('Failed to send message:', error)
}
```

Messages may fail to send due to network issues, invalid JIDs, or the recipient blocking you. Always implement proper error handling.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages#next-steps)

Next Steps

## Text Messages

Learn about sending text with mentions, quotes, and links

## Media Messages

Send images, videos, audio, and documents

## Message Options

Configure ephemeral messages, quotes, and more

## Modify Messages

Edit and delete sent messages

[

Socket Configuration

Previous



](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration)[

Text Messages

Next



](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages)
