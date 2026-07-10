# Event System

Source: https://whiskeysockets-baileys-94.mintlify.app/concepts/events

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#overview)

Overview

Baileys uses an EventEmitter-based system to notify your application of WhatsApp events like new messages, connection changes, and contact updates. All events are strongly typed through the `BaileysEventMap` interface.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#baileyseventmap)

BaileysEventMap

From `src/Types/Events.ts:20`:

```
type BaileysEventMap = {
  // Connection events
  'connection.update': Partial<ConnectionState>
  'creds.update': Partial<AuthenticationCreds>
  
  // Message events
  'messages.upsert': { 
    messages: WAMessage[]; 
    type: MessageUpsertType;
    requestId?: string 
  }
  'messages.update': WAMessageUpdate[]
  'messages.delete': { keys: WAMessageKey[] } | { jid: string; all: true }
  'messages.reaction': { key: WAMessageKey; reaction: proto.IReaction }[]
  'messages.media-update': { 
    key: WAMessageKey; 
    media?: { ciphertext: Uint8Array; iv: Uint8Array }; 
    error?: Boom 
  }[]
  
  // Chat events
  'chats.upsert': Chat[]
  'chats.update': ChatUpdate[]
  'chats.delete': string[]
  'chats.lock': { id: string; locked: boolean }
  
  // Contact events
  'contacts.upsert': Contact[]
  'contacts.update': Partial<Contact>[]
  
  // History sync
  'messaging-history.set': {
    chats: Chat[]
    contacts: Contact[]
    messages: WAMessage[]
    isLatest?: boolean
    progress?: number | null
    syncType?: proto.HistorySync.HistorySyncType | null
  }
  
  // Presence
  'presence.update': { 
    id: string; 
    presences: { [participant: string]: PresenceData } 
  }
  
  // Groups
  'groups.upsert': GroupMetadata[]
  'groups.update': Partial<GroupMetadata>[]
  'group-participants.update': {
    id: string
    author: string
    participants: GroupParticipant[]
    action: ParticipantAction
  }
  'group.join-request': {
    id: string
    author: string
    participant: string
    action: RequestJoinAction
    method: RequestJoinMethod
  }
  'group.member-tag.update': {
    groupId: string
    participant: string
    label: string
    messageTimestamp?: number
  }
  
  // Calls
  'call': WACallEvent[]
  
  // Labels
  'labels.edit': Label
  'labels.association': { 
    association: LabelAssociation; 
    type: 'add' | 'remove' 
  }
  
  // Receipts
  'message-receipt.update': MessageUserReceiptUpdate[]
  
  // Blocklist
  'blocklist.set': { blocklist: string[] }
  'blocklist.update': { blocklist: string[]; type: 'add' | 'remove' }
  
  // Settings
  'settings.update': /* various setting types */
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#event-emitter-interface)

Event Emitter Interface

From `src/Types/Events.ts:154`:

```
interface BaileysEventEmitter {
  on<T extends keyof BaileysEventMap>(
    event: T, 
    listener: (arg: BaileysEventMap[T]) => void
  ): void
  
  off<T extends keyof BaileysEventMap>(
    event: T, 
    listener: (arg: BaileysEventMap[T]) => void
  ): void
  
  removeAllListeners<T extends keyof BaileysEventMap>(event: T): void
  
  emit<T extends keyof BaileysEventMap>(
    event: T, 
    arg: BaileysEventMap[T]
  ): boolean
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#basic-event-handling)

Basic Event Handling

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#single-event-listener)

Single Event Listener

```
const sock = makeWASocket()

sock.ev.on('messages.upsert', ({ messages, type }) => {
  console.log('Received messages:', messages)
  console.log('Type:', type) // 'notify' | 'append'
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#multiple-event-listeners)

Multiple Event Listeners

```
sock.ev.on('connection.update', (update) => {
  console.log('Connection update:', update)
})

sock.ev.on('creds.update', async () => {
  await saveCreds()
})

sock.ev.on('chats.upsert', (chats) => {
  console.log('New chats:', chats)
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#event-processing-pattern)

Event Processing Pattern

Baileys provides `ev.process()` for batch event processing. From `Example/example.ts:70`:

```
sock.ev.process(
  async (events) => {
    // Connection updates
    if (events['connection.update']) {
      const update = events['connection.update']
      const { connection, lastDisconnect, qr } = update
      
      if (connection === 'close') {
        const shouldReconnect = 
          (lastDisconnect?.error as Boom)?.output?.statusCode 
            !== DisconnectReason.loggedOut
        
        if (shouldReconnect) {
          startSock()
        }
      }
      
      if (qr) {
        console.log('QR Code:', qr)
      }
    }
    
    // Credential updates
    if (events['creds.update']) {
      await saveCreds()
    }
    
    // New messages
    if (events['messages.upsert']) {
      const { messages, type } = events['messages.upsert']
      
      for (const msg of messages) {
        console.log('Message:', msg)
      }
    }
    
    // Message updates
    if (events['messages.update']) {
      for (const { key, update } of events['messages.update']) {
        if (update.pollUpdates) {
          // Handle poll vote updates
        }
      }
    }
    
    // History sync
    if (events['messaging-history.set']) {
      const { chats, contacts, messages, isLatest } = 
        events['messaging-history.set']
      
      console.log(
        `Received ${messages.length} messages, `,
        `${chats.length} chats, `,
        `${contacts.length} contacts`
      )
    }
  }
)
```

Using `ev.process()` is more efficient than individual listeners when handling multiple related events, as it batches updates together.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#message-events)

Message Events

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#messages-upsert)

messages.upsert

Fired when new messages arrive or are added to history:

```
sock.ev.on('messages.upsert', ({ messages, type, requestId }) => {
  // type = 'notify' - new message from WhatsApp
  // type = 'append' - message from history sync
  // requestId - if message was requested via placeholder resync
  
  for (const msg of messages) {
    const text = msg.message?.conversation || 
                 msg.message?.extendedTextMessage?.text
    
    if (text && !msg.key.fromMe) {
      console.log('Received:', text, 'from', msg.key.remoteJid)
      
      // Reply to message
      await sock.sendMessage(
        msg.key.remoteJid!, 
        { text: 'Hello!' },
        { quoted: msg }
      )
    }
  }
})
```

**Always use a loop** when handling `messages.upsert` as the `messages` array can contain multiple messages.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#messages-update)

messages.update

Fired when message status changes (delivered, read, deleted, edited):

```
sock.ev.on('messages.update', (updates) => {
  for (const { key, update } of updates) {
    if (update.status) {
      console.log(
        `Message ${key.id} status:`, 
        update.status // 0=ERROR, 1=PENDING, 2=SERVER_ACK, 3=DELIVERY_ACK, 4=READ, 5=PLAYED
      )
    }
    
    // Handle poll updates
    if (update.pollUpdates) {
      const pollCreation = await getMessage(key)
      if (pollCreation) {
        const votes = getAggregateVotesInPollMessage({
          message: pollCreation,
          pollUpdates: update.pollUpdates
        })
        console.log('Poll votes:', votes)
      }
    }
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#messages-reaction)

messages.reaction

Fired when a message receives a reaction:

```
sock.ev.on('messages.reaction', (reactions) => {
  for (const { key, reaction } of reactions) {
    console.log(
      `Message ${key.id} reacted with:`, 
      reaction.text || '(removed)'
    )
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#messages-delete)

messages.delete

Fired when messages are deleted:

```
sock.ev.on('messages.delete', (deletion) => {
  if ('all' in deletion) {
    console.log('All messages deleted in:', deletion.jid)
  } else {
    console.log('Deleted messages:', deletion.keys)
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#chat-events)

Chat Events

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#chats-upsert)

chats.upsert

```
sock.ev.on('chats.upsert', (chats) => {
  for (const chat of chats) {
    console.log('New chat:', chat.id, chat.name)
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#chats-update)

chats.update

```
sock.ev.on('chats.update', (updates) => {
  for (const update of updates) {
    console.log('Chat updated:', update.id)
    if (update.unreadCount !== undefined) {
      console.log('Unread count:', update.unreadCount)
    }
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#contact-events)

Contact Events

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#contacts-upsert)

contacts.upsert

```
sock.ev.on('contacts.upsert', (contacts) => {
  for (const contact of contacts) {
    console.log('Contact:', contact.id, contact.name)
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#contacts-update)

contacts.update

From `Example/example.ts:204`:

```
sock.ev.on('contacts.update', async (updates) => {
  for (const contact of updates) {
    if (typeof contact.imgUrl !== 'undefined') {
      const newUrl = contact.imgUrl === null
        ? null
        : await sock.profilePictureUrl(contact.id!)
          .catch(() => null)
      
      console.log(`${contact.id} has new profile pic:`, newUrl)
    }
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#group-events)

Group Events

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#group-participants-update)

group-participants.update

```
sock.ev.on('group-participants.update', ({ id, participants, action }) => {
  console.log(`Group ${id}: ${action}`, participants)
  // action: 'add' | 'remove' | 'promote' | 'demote'
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#groups-update)

groups.update

```
sock.ev.on('groups.update', (updates) => {
  for (const update of updates) {
    console.log('Group updated:', update.id)
    if (update.subject) {
      console.log('New subject:', update.subject)
    }
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#presence-events)

Presence Events

```
// Subscribe to presence updates
await sock.presenceSubscribe(jid)

sock.ev.on('presence.update', ({ id, presences }) => {
  for (const [participant, presence] of Object.entries(presences)) {
    console.log(`${participant} is ${presence.lastKnownPresence}`)
    // 'unavailable' | 'available' | 'composing' | 'recording' | 'paused'
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#call-events)

Call Events

```
sock.ev.on('call', (calls) => {
  for (const call of calls) {
    console.log('Call from:', call.from)
    console.log('Call status:', call.status)
    
    if (call.status === 'offer') {
      // Reject call
      await sock.rejectCall(call.id, call.from)
    }
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#history-sync-events)

History Sync Events

From `Example/example.ts:119`:

```
sock.ev.on('messaging-history.set', ({
  chats,
  contacts,
  messages,
  isLatest,
  progress,
  syncType
}) => {
  console.log(`
    Received history:
    - ${messages.length} messages
    - ${chats.length} chats  
    - ${contacts.length} contacts
    - Is latest: ${isLatest}
    - Progress: ${progress}
    - Sync type: ${syncType}
  `)
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#event-order-on-first-connection)

Event Order on First Connection

1.  **`connection.update`** - Connection state changes to ‘connecting’
2.  **`connection.update`** - QR code received (if not authenticated)
3.  **`connection.update`** - Connection opens
4.  **`creds.update`** - Credentials updated
5.  **`messaging-history.set`** - Message history received
6.  **`chats.upsert`** - Chats loaded
7.  **`contacts.upsert`** - Contacts loaded
8.  **`connection.update`** - `receivedPendingNotifications: true`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#removing-event-listeners)

Removing Event Listeners

```
const messageHandler = ({ messages }) => {
  console.log('Messages:', messages)
}

// Add listener
sock.ev.on('messages.upsert', messageHandler)

// Remove specific listener
sock.ev.off('messages.upsert', messageHandler)

// Remove all listeners for an event
sock.ev.removeAllListeners('messages.upsert')
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#best-practices)

Best Practices

**Event Handling Best Practices:**

1.  **Use `ev.process()`** - Batch related events for efficiency
2.  **Handle errors** - Wrap handlers in try-catch blocks
3.  **Async handlers** - Use async/await for async operations
4.  **Loop messages** - Always iterate `messages` array in `messages.upsert`
5.  **Save credentials** - Always handle `creds.update` to save auth state
6.  **Avoid blocking** - Don’t block event handlers with long operations
7.  **Clean up listeners** - Remove listeners when done to prevent memory leaks

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#error-handling)

Error Handling

```
sock.ev.process(async (events) => {
  try {
    if (events['messages.upsert']) {
      const { messages } = events['messages.upsert']
      // Handle messages
    }
  } catch (error) {
    console.error('Error handling events:', error)
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#typescript-type-safety)

TypeScript Type Safety

Baileys provides full TypeScript support for events:

```
// ✅ Type-safe event handling
sock.ev.on('messages.upsert', ({ messages, type }) => {
  // messages: WAMessage[]
  // type: MessageUpsertType
})

// ❌ TypeScript will error on invalid events
sock.ev.on('invalid.event', (data) => {
  // Error: Argument of type '"invalid.event"' is not assignable...
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/events#see-also)

See Also

-   [Connection Lifecycle](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection) - Connection events
-   [Authentication](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication) - Credential events
-   [Message Store](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store) - Storing event data

[

Connection Lifecycle

Previous



](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection)[

Message Store

Next



](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store)
