# Modifying Messages

Source: https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#overview)

Overview

Baileys allows you to modify messages after sending them. You can:

-   Delete messages for everyone
-   Edit sent messages
-   Delete messages for yourself only (via chat modify)

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#deleting-messages)

Deleting Messages

Delete a message for everyone in the chat:

```
// Send a message
const msg = await sock.sendMessage(jid, { text: 'Hello World!' })

// Delete it for everyone
await sock.sendMessage(jid, { delete: msg.key })
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#delete-using-message-key)

Delete Using Message Key

If you have the message key from a previous message:

```
const messageKey: WAMessageKey = {
  remoteJid: jid,
  fromMe: true,
  id: 'ABCDEFGHIJKLMNOP'
}

await sock.sendMessage(jid, { delete: messageKey })
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#delete-received-messages)

Delete Received Messages

As a group admin, you can delete anyone’s message:

```
sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const msg of messages) {
    // Delete inappropriate messages
    if (shouldDelete(msg)) {
      await sock.sendMessage(
        msg.key.remoteJid!,
        { delete: msg.key }
      )
    }
  }
})
```

You can only delete messages for everyone within approximately 48 hours of sending. After that, you can only delete for yourself.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#editing-messages)

Editing Messages

Edit a previously sent message:

```
// Send original message
const msg = await sock.sendMessage(jid, { text: 'Original text' })

// Edit it
await sock.sendMessage(jid, {
  text: 'Updated text',
  edit: msg.key
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#edit-any-message-type)

Edit Any Message Type

You can edit various message types:

```
const msg = await sock.sendMessage(jid, { text: 'Hello' })

await sock.sendMessage(jid, {
  text: 'Hello World!',
  edit: msg.key
})
```

```
const msg = await sock.sendMessage(jid, {
  image: { url: './photo.jpg' },
  caption: 'Original caption'
})

await sock.sendMessage(jid, {
  text: 'Updated caption',
  edit: msg.key
})
```

```
const msg = await sock.sendMessage(jid, {
  text: 'Hello @12345',
  mentions: ['12345@s.whatsapp.net']
})

await sock.sendMessage(jid, {
  text: 'Updated with @67890',
  mentions: ['67890@s.whatsapp.net'],
  edit: msg.key
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#edit-using-stored-key)

Edit Using Stored Key

```
// Store the message key when sending
const sentMessage = await sock.sendMessage(jid, { text: 'Version 1' })
const messageKey = sentMessage.key

// Later, edit using the stored key
await sock.sendMessage(jid, {
  text: 'Version 2',
  edit: messageKey
})
```

Message edits are limited to approximately 15 minutes after sending. The exact time limit may vary based on WhatsApp’s policies.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#protocol-details)

Protocol Details

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#delete-message-protocol)

Delete Message Protocol

When you delete a message, Baileys sends a protocol message:

```
const deleteMessage = {
  protocolMessage: {
    key: messageKey,
    type: WAProto.Message.ProtocolMessage.Type.REVOKE
  }
}
```

This is handled automatically when you use:

```
await sock.sendMessage(jid, { delete: messageKey })
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#edit-message-protocol)

Edit Message Protocol

Editing sends a protocol message with the updated content:

```
const editMessage = {
  protocolMessage: {
    key: originalMessageKey,
    editedMessage: { /* new content */ },
    timestampMs: Date.now(),
    type: WAProto.Message.ProtocolMessage.Type.MESSAGE_EDIT
  }
}
```

Baileys handles this when you use:

```
await sock.sendMessage(jid, {
  text: 'new text',
  edit: originalMessageKey
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#delete-for-yourself-only)

Delete for Yourself Only

To delete messages only on your device (not for everyone):

```
await sock.chatModify(
  {
    clear: {
      messages: [
        {
          id: 'ATWYHDNNWU81732J',
          fromMe: true,
          timestamp: '1654823909'
        }
      ]
    }
  },
  jid
)
```

This removes the message from your chat history but doesn’t delete it for other participants. See [Modifying Chats](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats) for more details.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#best-practices)

Best Practices

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#1-store-message-keys)

1\. Store Message Keys

```
const messageStore = new Map<string, WAMessageKey>()

const msg = await sock.sendMessage(jid, { text: 'Hello' })
messageStore.set(msg.key.id!, msg.key)

// Later, retrieve and edit
const key = messageStore.get(messageId)
if (key) {
  await sock.sendMessage(jid, {
    text: 'Updated',
    edit: key
  })
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#2-implement-message-store)

2\. Implement Message Store

```
interface StoredMessage {
  key: WAMessageKey
  timestamp: number
  content: any
}

class MessageStore {
  private messages = new Map<string, StoredMessage>()
  
  store(msg: WAMessage) {
    this.messages.set(msg.key.id!, {
      key: msg.key,
      timestamp: msg.messageTimestamp as number,
      content: msg.message
    })
  }
  
  async delete(messageId: string, jid: string) {
    const msg = this.messages.get(messageId)
    if (msg) {
      await sock.sendMessage(jid, { delete: msg.key })
      this.messages.delete(messageId)
    }
  }
  
  async edit(messageId: string, jid: string, newText: string) {
    const msg = this.messages.get(messageId)
    if (msg) {
      await sock.sendMessage(jid, {
        text: newText,
        edit: msg.key
      })
    }
  }
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#3-handle-edit-events)

3\. Handle Edit Events

```
sock.ev.on('messages.update', async (updates) => {
  for (const { key, update } of updates) {
    if (update.message) {
      console.log('Message edited:', key.id)
      // Update in your database
      await updateMessageInDB(key.id!, update.message)
    }
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#4-validate-before-deleting)

4\. Validate Before Deleting

```
async function deleteMessage(messageKey: WAMessageKey, jid: string) {
  // Check if message is not too old
  const msg = await getMessageFromStore(messageKey)
  if (!msg) {
    throw new Error('Message not found')
  }
  
  const ageInHours = (Date.now() - msg.timestamp * 1000) / (1000 * 60 * 60)
  if (ageInHours > 48) {
    throw new Error('Message too old to delete for everyone')
  }
  
  // Delete for everyone
  await sock.sendMessage(jid, { delete: messageKey })
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#error-handling)

Error Handling

```
try {
  await sock.sendMessage(jid, { delete: messageKey })
  console.log('Message deleted successfully')
} catch (error) {
  if (error.message.includes('404')) {
    console.error('Message not found or already deleted')
  } else if (error.message.includes('403')) {
    console.error('No permission to delete this message')
  } else {
    console.error('Failed to delete message:', error)
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#limitations)

Limitations

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#delete-limitations)

Delete Limitations

-   Can only delete within ~48 hours of sending
-   Must be sent by you or (in groups) you must be admin
-   Cannot delete messages in newsletters (read-only)

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#edit-limitations)

Edit Limitations

-   Can only edit within ~15 minutes of sending
-   Can only edit your own messages
-   Edit history is visible to recipients (WhatsApp shows “edited” label)
-   Cannot edit media type (e.g., can’t change image to video)

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#message-update-events)

Message Update Events

Listen for message modifications:

```
sock.ev.on('messages.update', (updates) => {
  for (const { key, update } of updates) {
    if (update.message) {
      console.log('Message edited:', key.id)
    }
    if (update.status) {
      console.log('Message status changed:', update.status)
    }
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#examples-from-source)

Examples from Source

```
// From README.md
const msg = await sock.sendMessage(jid, { text: 'hello word' })
await sock.sendMessage(jid, { delete: msg.key })
```

```
// From README.md
await sock.sendMessage(jid, {
  text: 'updated text goes here',
  edit: response.key,
});
```

```
// From README.md
await sock.chatModify(
  {
    clear: {
      messages: [
        {
          id: 'ATWYHDNNWU81732J',
          fromMe: true,
          timestamp: '1654823909'
        }
      ]
    }
  },
  jid
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#complete-example)

Complete Example

```
import makeWASocket from '@whiskeysockets/baileys'

const sock = makeWASocket({ /* config */ })

// Message management
class MessageManager {
  private messages = new Map<string, WAMessage>()
  
  async send(jid: string, content: any) {
    const msg = await sock.sendMessage(jid, content)
    this.messages.set(msg.key.id!, msg)
    return msg
  }
  
  async edit(messageId: string, newText: string) {
    const msg = this.messages.get(messageId)
    if (!msg) throw new Error('Message not found')
    
    await sock.sendMessage(msg.key.remoteJid!, {
      text: newText,
      edit: msg.key
    })
  }
  
  async delete(messageId: string) {
    const msg = this.messages.get(messageId)
    if (!msg) throw new Error('Message not found')
    
    await sock.sendMessage(msg.key.remoteJid!, {
      delete: msg.key
    })
    this.messages.delete(messageId)
  }
}

// Usage
const manager = new MessageManager()

const msg = await manager.send(jid, { text: 'Hello' })
await manager.edit(msg.key.id!, 'Hello World!')
await manager.delete(msg.key.id!)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/messaging/modifying-messages#next-steps)

Next Steps

## Downloading Media

Learn to download media from messages

## Message Options

Configure ephemeral and other options

[

Message Options

Previous



](https://whiskeysockets-baileys-94.mintlify.app/messaging/message-options)[

Downloading Media

Next



](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media)
