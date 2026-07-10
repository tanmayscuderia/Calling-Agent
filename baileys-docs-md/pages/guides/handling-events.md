# Handling Events

Source: https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#overview)

Overview

Baileys uses an EventEmitter-based architecture for all WhatsApp interactions. Every action - from receiving messages to connection updates - is emitted as a typed event.

All events are fully typed with TypeScript, providing excellent IntelliSense support in modern editors like VS Code.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#event-architecture)

Event Architecture

Baileys provides two ways to handle events:

-   Individual Listeners
    
-   Batch Processing
    

```
sock.ev.on('messages.upsert', ({ messages }) => {
    console.log('Received messages:', messages)
})

sock.ev.on('connection.update', (update) => {
    console.log('Connection status:', update.connection)
})
```

```
sock.ev.process(async (events) => {
    // Process multiple event types efficiently
    if (events['messages.upsert']) {
        // Handle messages
    }
    
    if (events['connection.update']) {
        // Handle connection
    }
})
```

The batch processing method (`ev.process`) is more efficient as it processes events in batches, reducing overhead.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#core-events)

Core Events

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#connection-events)

Connection Events

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#connection-update)

connection.update

Emitted when connection state changes (connecting, open, close).

```
import { Boom } from '@hapi/boom'
import { DisconnectReason } from '@whiskeysockets/baileys'

sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    
    if (qr) {
        console.log('QR Code:', qr)
    }
    
    if (connection === 'close') {
        const shouldReconnect = 
            (lastDisconnect?.error as Boom)?.output?.statusCode !== 
            DisconnectReason.loggedOut
        
        if (shouldReconnect) {
            startSock() // Reconnect
        } else {
            console.log('Logged out!')
        }
    } else if (connection === 'open') {
        console.log('Connection opened')
    }
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#creds-update)

creds.update

Emitted when authentication credentials are updated. **Critical** for session persistence.

```
import { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

const sock = makeWASocket({ auth: state })

// Save credentials whenever they update
sock.ev.on('creds.update', saveCreds)
```

Failing to save credentials when `creds.update` fires will cause message delivery issues and require re-authentication.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#message-events)

Message Events

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#messages-upsert)

messages.upsert

Receive new messages or message history.

```
sock.ev.on('messages.upsert', ({ messages, type }) => {
    console.log('Message type:', type) // 'notify' | 'append' | 'prepend'
    
    for (const msg of messages) {
        if (!msg.message) continue // Ignore empty messages
        
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text
        
        console.log('From:', msg.key.remoteJid)
        console.log('Text:', text)
        console.log('From me:', msg.key.fromMe)
    }
})
```

**Important:** Always use a loop like `for (const message of messages)` to handle all messages in the array. The event may contain multiple messages.

##### Message Types

-   `notify` - New message received while online
-   `append` - Message added to the end of history
-   `prepend` - Message added to the beginning of history

##### Auto-Reply Example

```
import { generateMessageIDV2, isJidNewsletter } from '@whiskeysockets/baileys'

sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return // Only respond to new messages
    
    for (const msg of messages) {
        // Skip messages from self, no message content, or newsletters
        if (msg.key.fromMe || !msg.message || isJidNewsletter(msg.key.remoteJid)) {
            continue
        }
        
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text
        
        if (text) {
            const messageId = generateMessageIDV2(sock.user?.id)
            await sock.sendMessage(
                msg.key.remoteJid!, 
                { text: `Echo: ${text}` },
                { messageId }
            )
        }
    }
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#messages-update)

messages.update

Emitted when message metadata changes (delivered, read, deleted, edited, poll votes).

```
sock.ev.on('messages.update', (updates) => {
    for (const { key, update } of updates) {
        console.log('Message ID:', key.id)
        console.log('Update:', update)
        
        // Check for poll updates
        if (update.pollUpdates) {
            console.log('Poll votes received')
        }
    }
})
```

##### Decrypt Poll Votes

```
import { getAggregateVotesInPollMessage } from '@whiskeysockets/baileys'

// You need a getMessage implementation (store)
const getMessage = async (key: WAMessageKey) => {
    // Retrieve message from your store
    return await getMessageFromStore(key)
}

sock.ev.on('messages.update', async (updates) => {
    for (const { key, update } of updates) {
        if (update.pollUpdates) {
            const pollCreation = await getMessage(key)
            
            if (pollCreation) {
                const aggregatedVotes = getAggregateVotesInPollMessage({
                    message: pollCreation,
                    pollUpdates: update.pollUpdates,
                })
                
                console.log('Poll results:', aggregatedVotes)
            }
        }
    }
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#messages-delete)

messages.delete

Emitted when messages are deleted.

```
sock.ev.on('messages.delete', (deletion) => {
    if ('keys' in deletion) {
        // Specific messages deleted
        console.log('Deleted message keys:', deletion.keys)
    } else if (deletion.all) {
        // All messages in chat deleted
        console.log('All messages deleted from:', deletion.jid)
    }
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#messages-reaction)

messages.reaction

Emitted when a message receives a reaction.

```
sock.ev.on('messages.reaction', (reactions) => {
    for (const { key, reaction } of reactions) {
        console.log('Message:', key.id)
        console.log('Reaction:', reaction.text) // emoji or empty string if removed
        console.log('From:', reaction.key?.remoteJid)
    }
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#message-receipt-update)

message-receipt.update

Emitted when message read/delivery status changes.

```
sock.ev.on('message-receipt.update', (receipts) => {
    for (const receipt of receipts) {
        console.log('Message:', receipt.key.id)
        console.log('Receipt:', receipt.receipt)
    }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#chat-events)

Chat Events

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#chats-upsert)

chats.upsert

New chats added.

```
sock.ev.on('chats.upsert', (chats) => {
    console.log('New chats:', chats.length)
    
    for (const chat of chats) {
        console.log('Chat ID:', chat.id)
        console.log('Name:', chat.name)
        console.log('Unread count:', chat.unreadCount)
    }
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#chats-update)

chats.update

Chat metadata updated (unread count, last message, etc.).

```
sock.ev.on('chats.update', (updates) => {
    for (const update of updates) {
        console.log('Updated chat:', update.id)
        
        if (typeof update.unreadCount !== 'undefined') {
            console.log('New unread count:', update.unreadCount)
        }
    }
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#chats-delete)

chats.delete

Chats deleted.

```
sock.ev.on('chats.delete', (deletedChats) => {
    console.log('Deleted chat IDs:', deletedChats)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#contact-events)

Contact Events

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#contacts-upsert)

contacts.upsert

New contacts added or discovered.

```
sock.ev.on('contacts.upsert', (contacts) => {
    for (const contact of contacts) {
        console.log('Contact:', contact.id)
        console.log('Name:', contact.name)
        console.log('Notify:', contact.notify)
    }
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#contacts-update)

contacts.update

Contact information updated (profile picture, name, etc.).

```
sock.ev.on('contacts.update', async (updates) => {
    for (const contact of updates) {
        if (typeof contact.imgUrl !== 'undefined') {
            // Profile picture changed
            const newUrl = contact.imgUrl === null
                ? null
                : await sock.profilePictureUrl(contact.id!).catch(() => null)
            
            console.log(`${contact.id} has new profile pic:`, newUrl)
        }
    }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#group-events)

Group Events

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#groups-upsert)

groups.upsert

New groups discovered.

```
sock.ev.on('groups.upsert', (groups) => {
    for (const group of groups) {
        console.log('Group:', group.id)
        console.log('Subject:', group.subject)
        console.log('Participants:', group.participants.length)
    }
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#groups-update)

groups.update

Group metadata changed (subject, description, settings).

```
sock.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
        console.log('Group updated:', update.id)
        
        if (update.subject) {
            console.log('New subject:', update.subject)
        }
        
        if (update.desc) {
            console.log('New description:', update.desc)
        }
    }
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#group-participants-update)

group-participants.update

Group participants added, removed, promoted, or demoted.

```
sock.ev.on('group-participants.update', (update) => {
    console.log('Group:', update.id)
    console.log('Action:', update.action) // 'add' | 'remove' | 'promote' | 'demote'
    console.log('Participants:', update.participants)
    console.log('By:', update.author)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#presence-events)

Presence Events

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#presence-update)

presence.update

User’s online/offline/typing status changed.

```
// First, subscribe to presence updates for a chat
await sock.presenceSubscribe(jid)

// Then listen for updates
sock.ev.on('presence.update', ({ id, presences }) => {
    console.log('Presence update in:', id)
    
    for (const [participant, presence] of Object.entries(presences)) {
        console.log(`${participant}:`, presence.lastKnownPresence)
        // 'available' | 'unavailable' | 'composing' | 'recording'
    }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#call-events)

Call Events

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#call)

call

Incoming or outgoing call events.

```
sock.ev.on('call', (calls) => {
    for (const call of calls) {
        console.log('Call from:', call.from)
        console.log('Call ID:', call.id)
        console.log('Status:', call.status) // 'offer' | 'ringing' | 'timeout'
        console.log('IsVideo:', call.isVideo)
        
        // Reject call
        if (call.status === 'offer') {
            await sock.rejectCall(call.id, call.from)
        }
    }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#history-events)

History Events

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#messaging-history-set)

messaging-history.set

Received chat history after initial connection.

```
sock.ev.on('messaging-history.set', ({ chats, contacts, messages, isLatest, progress, syncType }) => {
    console.log('History sync type:', syncType)
    console.log('Chats:', chats.length)
    console.log('Contacts:', contacts.length)  
    console.log('Messages:', messages.length)
    console.log('Is latest:', isLatest)
    console.log('Progress:', progress)
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#complete-event-handler-example)

Complete Event Handler Example

From the official example.ts:

```
import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import P from 'pino'

const logger = P({ level: 'trace' })

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
    
    const sock = makeWASocket({
        logger,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: true
    })
    
    // Batch event processing (recommended)
    sock.ev.process(async (events) => {
        // Connection updates
        if (events['connection.update']) {
            const update = events['connection.update']
            const { connection, lastDisconnect, qr } = update
            
            if (connection === 'close') {
                if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                    startSock()
                } else {
                    logger.fatal('Connection closed. You are logged out.')
                }
            }
            
            logger.debug(update, 'connection update')
        }
        
        // Save credentials
        if (events['creds.update']) {
            await saveCreds()
        }
        
        // New messages
        if (events['messages.upsert']) {
            const { messages, type } = events['messages.upsert']
            logger.debug({ count: messages.length, type }, 'messages.upsert')
        }
        
        // Message updates
        if (events['messages.update']) {
            logger.debug(events['messages.update'], 'messages.update')
        }
        
        // Message receipts
        if (events['message-receipt.update']) {
            logger.debug(events['message-receipt.update'])
        }
        
        // Reactions
        if (events['messages.reaction']) {
            logger.debug(events['messages.reaction'])
        }
        
        // Presence
        if (events['presence.update']) {
            logger.debug(events['presence.update'])
        }
        
        // Chats
        if (events['chats.update']) {
            logger.debug(events['chats.update'])
        }
        
        // Contacts
        if (events['contacts.update']) {
            for (const contact of events['contacts.update']) {
                if (typeof contact.imgUrl !== 'undefined') {
                    const newUrl = contact.imgUrl === null
                        ? null
                        : await sock.profilePictureUrl(contact.id!).catch(() => null)
                    logger.debug({ id: contact.id, newUrl }, 'contact profile pic updated')
                }
            }
        }
        
        // Chat deletions
        if (events['chats.delete']) {
            logger.debug('chats deleted', events['chats.delete'])
        }
        
        // Calls
        if (events['call']) {
            logger.debug(events['call'], 'call event')
        }
        
        // History
        if (events['messaging-history.set']) {
            const { chats, contacts, messages, isLatest, progress, syncType } = events['messaging-history.set']
            logger.debug({
                contacts: contacts.length,
                chats: chats.length,
                messages: messages.length,
                isLatest,
                progress,
                syncType: syncType?.toString()
            }, 'messaging-history.set')
        }
    })
    
    return sock
}

startSock()
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#event-summary-on-first-connection)

Event Summary on First Connection

1

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#)

connection.update (connecting)

Socket begins establishing connection to WhatsApp servers.

2

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#)

connection.update (qr or pairing)

QR code or pairing code available for authentication.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#)

connection.update (open)

Connection successfully opened.

4

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#)

messaging-history.set

Chat history, contacts, and messages are synced.

5

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#)

chats.upsert / contacts.upsert

Individual chats and contacts are upserted.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#best-practices)

Best Practices

1

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#)

Use Batch Processing

Prefer `sock.ev.process()` over individual `sock.ev.on()` calls for better performance.

2

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#)

Always Save Credentials

Listen to `creds.update` and save immediately to prevent authentication issues.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#)

Loop Through Arrays

Always use `for` loops when handling arrays in events like `messages.upsert`.

4

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#)

Check Message Content

Always verify message content exists before processing to avoid null/undefined errors.

5

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#)

Handle Reconnections

Implement proper reconnection logic in `connection.update` that distinguishes between logout and network failures.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#all-available-events)

All Available Events

Here’s a complete list of all events in BaileysEventMap:

| Event | Description |
| --- | --- |
| `connection.update` | Connection state changed |
| `creds.update` | Authentication credentials updated |
| `messaging-history.set` | History sync received |
| `messages.upsert` | New messages received |
| `messages.update` | Message metadata updated |
| `messages.delete` | Messages deleted |
| `messages.reaction` | Reaction added/removed |
| `message-receipt.update` | Delivery/read receipt updated |
| `chats.upsert` | New chats added |
| `chats.update` | Chat metadata updated |
| `chats.delete` | Chats deleted |
| `contacts.upsert` | New contacts added |
| `contacts.update` | Contact info updated |
| `groups.upsert` | New groups discovered |
| `groups.update` | Group metadata updated |
| `group-participants.update` | Group participants changed |
| `presence.update` | User presence changed |
| `call` | Call received/status changed |
| `labels.edit` | Label edited |
| `labels.association` | Label association changed |
| `blocklist.set` | Block list set |
| `blocklist.update` | Block list updated |

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events#next-steps)

Next Steps

## Session Management

Implement getMessage for retry handling

## Sending Messages

Learn how to send messages

## Socket Configuration

Configure getMessage and other options

[

Connecting with Pairing Code

Previous



](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code)[

Session Management

Next



](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management)
