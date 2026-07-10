# Chat State Management

Source: https://whiskeysockets-baileys-94.mintlify.app/chats/chat-state

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/chat-state#reading-messages)

Reading Messages

A set of message keys must be explicitly marked read now. You cannot mark an entire ‘chat’ read as it were with Baileys Web. This means you have to keep track of unread messages.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/chat-state#mark-messages-as-read)

Mark Messages as Read

```
const key: WAMessageKey
// can pass multiple keys to read multiple messages as well
await sock.readMessages([key])
```

The message ID is the unique identifier of the message that you are marking as read. On a `WAMessage`, the `messageID` can be accessed using `messageID = message.key.id`.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/chat-state#message-key-structure)

Message Key Structure

The `WAMessageKey` contains the following properties:

```
interface WAMessageKey {
    remoteJid?: string    // The chat JID
    fromMe?: boolean      // Whether message was sent by you
    id?: string          // The message ID
    participant?: string  // For group messages, the sender
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/chat-state#mark-chat-read/unread)

Mark Chat Read/Unread

While you can’t mark an entire chat as read directly, you can use `chatModify` with the last message:

```
const lastMsgInChat = await getLastMessageInChat(jid) // implement this on your end

// Mark chat as unread
await sock.chatModify({ markRead: false, lastMessages: [lastMsgInChat] }, jid)

// Mark chat as read
await sock.chatModify({ markRead: true, lastMessages: [lastMsgInChat] }, jid)
```

You need to provide `lastMessages` array containing message metadata with the `key` and `messageTimestamp` properties.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/chat-state#tracking-unread-messages)

Tracking Unread Messages

Since Baileys requires explicit message keys to mark as read, you should implement your own unread message tracking:

```
// Example: Track incoming messages
sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
        if (!msg.key.fromMe && msg.message) {
            // Store unread message key
            // Later, mark as read:
            await sock.readMessages([msg.key])
        }
    }
})
```

The `readMessages` function is implemented in `src/Socket/messages-send.ts` and sends receipt acknowledgments to WhatsApp servers.

[

Modifying Chats

Previous



](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats)[

Presence Updates

Next



](https://whiskeysockets-baileys-94.mintlify.app/chats/presence)
