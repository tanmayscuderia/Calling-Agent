# Text Messages

Source: https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#basic-text-message)

Basic Text Message

Send a simple text message:

```
await sock.sendMessage(jid, { text: 'Hello World!' })
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#mentioning-users)

Mentioning Users

Mention users in your message by providing their JIDs in the `mentions` array:

```
await sock.sendMessage(
  jid,
  {
    text: '@12345678901',
    mentions: ['12345678901@s.whatsapp.net']
  }
)
```

The `@number` in the text is optional but recommended for clarity. The actual mentions are controlled by the `mentions` array.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#multiple-mentions)

Multiple Mentions

```
await sock.sendMessage(
  jid,
  {
    text: 'Hello @12345678901 and @10987654321!',
    mentions: [
      '12345678901@s.whatsapp.net',
      '10987654321@s.whatsapp.net'
    ]
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#quoting-messages)

Quoting Messages

Reply to a message by quoting it:

```
// You need the original message object
const originalMessage: WAMessage = /* get from store or messages.upsert event */

await sock.sendMessage(
  jid,
  { text: 'This is a reply' },
  { quoted: originalMessage }
)
```

The `quoted` parameter is passed in the **options** object (third parameter), not in the content object.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#getting-messages-to-quote)

Getting Messages to Quote

Messages can be obtained from the `messages.upsert` event:

```
sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const msg of messages) {
    // Store this message for later quoting
    await saveMessage(msg) // Your implementation
    
    // Reply to this specific message
    await sock.sendMessage(
      msg.key.remoteJid!,
      { text: 'Got your message!' },
      { quoted: msg }
    )
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#link-previews)

Link Previews

Baileys can automatically generate link previews when you send URLs:

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#prerequisites)

Prerequisites

First, install the link preview library:

```
yarn add link-preview-js
# or
npm install link-preview-js
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#automatic-link-preview)

Automatic Link Preview

```
await sock.sendMessage(
  jid,
  {
    text: 'Check this out: https://github.com/whiskeysockets/baileys'
  }
)
```

Baileys will automatically:

1.  Detect the URL in the text
2.  Fetch the page metadata
3.  Generate a preview with title, description, and thumbnail

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#manual-link-preview)

Manual Link Preview

You can provide your own link preview data:

```
await sock.sendMessage(
  jid,
  {
    text: 'Visit our site https://example.com',
    linkPreview: {
      'canonical-url': 'https://example.com',
      'matched-text': 'https://example.com',
      title: 'Example Site',
      description: 'This is an example website',
      jpegThumbnail: thumbnailBuffer // Optional Buffer
    }
  }
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#disable-link-preview)

Disable Link Preview

To send a URL without a preview:

```
await sock.sendMessage(
  jid,
  {
    text: 'https://example.com',
    linkPreview: null
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#advanced-text-features)

Advanced Text Features

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#context-info)

Context Info

Add additional context to your message:

```
await sock.sendMessage(
  jid,
  {
    text: 'Message with context',
    contextInfo: {
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

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#combined-features)

Combined Features

Combine mentions, quotes, and other features:

```
await sock.sendMessage(
  jid,
  {
    text: 'Hey @12345678901, check this link: https://example.com',
    mentions: ['12345678901@s.whatsapp.net']
  },
  {
    quoted: originalMessage,
    ephemeralExpiration: 86400 // 24 hour disappearing message
  }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#message-content-type-structure)

Message Content Type Structure

Text messages are sent as `extendedTextMessage` in the protocol:

```
type WATextMessage = {
  text: string
  matchedText?: string // For link preview
  description?: string // Link preview description
  title?: string // Link preview title
  jpegThumbnail?: Buffer // Link preview thumbnail
  contextInfo?: ContextInfo // For mentions, quotes, etc.
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#formatting-text)

Formatting Text

WhatsApp Web does not natively support markdown-style formatting (bold, italic, etc.) through the protocol. What you see in the WhatsApp mobile app is handled client-side.

While you can send special formatting characters, the rendering is client-dependent:

```
// These may or may not render as formatted depending on the client
await sock.sendMessage(jid, { 
  text: '*bold* _italic_ ~strikethrough~ ```monospace```' 
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#examples-from-source)

Examples from Source

Here are real examples from the Baileys codebase:

```
// From example.ts
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
  {
    text: '@12345678901',
    mentions: ['12345678901@s.whatsapp.net']
  }
)
```

```
// From README.md
await sock.sendMessage(
  jid, 
  { text: 'hello word' }, 
  { quoted: message }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#best-practices)

Best Practices

1.  **Store Messages**: Implement a message store to support quoting and other features
2.  **Validate JIDs**: Ensure the recipient JID is in the correct format
3.  **Handle Errors**: Wrap send operations in try-catch blocks
4.  **Rate Limiting**: Don’t send too many messages too quickly to avoid bans
5.  **Link Previews**: Use the library for automatic preview generation

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/text-messages#next-steps)

Next Steps

## Media Messages

Learn to send images, videos, and documents

## Message Options

Configure ephemeral messages and other options

[

Sending Messages

Previous



](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages)[

Media Messages

Next



](https://whiskeysockets-baileys-94.mintlify.app/messaging/media-messages)
