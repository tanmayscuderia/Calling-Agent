# Message Store

Source: https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#overview)

Overview

Baileys does not include built-in persistent storage for messages, chats, or contacts. You must implement your own data store to persist WhatsApp data across sessions.

Storing an entire chat history in memory is inefficient and not recommended for production applications. Implement database-backed storage for real-world use cases.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#why-you-need-a-store)

Why You Need a Store

A message store is essential for:

-   **Message retries** - Retrying failed message sends
-   **Poll vote decryption** - Decrypting poll vote updates
-   **Message history** - Accessing previous messages
-   **Chat context** - Maintaining conversation state
-   **Quote messages** - Retrieving quoted messages

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#in-memory-store-custom-implementation)

In-Memory Store (Custom Implementation)

As of Baileys v7.0.0, the built-in `makeInMemoryStore` function has been removed. You must implement your own data store.

While earlier versions of Baileys included a reference implementation, v7.0.0+ requires you to build a custom store tailored to your needs. This gives you more control and allows you to use databases that fit your scale requirements.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#basic-in-memory-store-example)

Basic In-Memory Store Example

Here’s a simple in-memory implementation for reference:

```
import makeWASocket from '@whiskeysockets/baileys'

// Simple in-memory storage
const store = {
  chats: new Map(),
  messages: new Map(),
  contacts: new Map()
}

const sock = makeWASocket({ auth: state })

// Listen to events and store data
sock.ev.on('chats.upsert', (chats) => {
  for (const chat of chats) {
    store.chats.set(chat.id, chat)
  }
})

sock.ev.on('messages.upsert', ({ messages }) => {
  for (const msg of messages) {
    const jid = msg.key.remoteJid
    if (!store.messages.has(jid)) {
      store.messages.set(jid, [])
    }
    store.messages.get(jid).push(msg)
  }
})

sock.ev.on('contacts.upsert', (contacts) => {
  for (const contact of contacts) {
    store.contacts.set(contact.id, contact)
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#recommended-store-features)

Recommended Store Features

Your custom store should provide:

-   **Chat storage** - Store chat metadata and state
-   **Message storage** - Indexed by JID for quick retrieval
-   **Contact storage** - User and group contact information
-   **Persistence** - Save to disk/database periodically
-   **Query methods** - Load messages by JID, pagination support

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#implementing-getmessage-for-retries)

Implementing getMessage for Retries

The socket config accepts a `getMessage` function for message retries and poll updates:

```
const sock = makeWASocket({
  getMessage: async (key) => await getMessageFromStore(key)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#getmessage-implementation)

getMessage Implementation

From `Example/example.ts:226`:

```
import { WAMessageKey, WAMessageContent } from '@whiskeysockets/baileys'

async function getMessage(
  key: WAMessageKey
): Promise<WAMessageContent | undefined> {
  // Retrieve message from your store
  // key.remoteJid - chat ID
  // key.id - message ID
  // key.fromMe - whether message was sent by you
  
  const message = await db.messages.findOne({
    remoteJid: key.remoteJid,
    id: key.id,
    fromMe: key.fromMe
  })
  
  return message?.message
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#using-getmessage-for-poll-votes)

Using getMessage for Poll Votes

From `Example/example.ts:167`:

```
sock.ev.on('messages.update', async (updates) => {
  for (const { key, update } of updates) {
    if (update.pollUpdates) {
      // Get poll creation message from store
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

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#database-store-implementation)

Database Store Implementation

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#mongodb-example)

MongoDB Example

```
import { MongoClient } from 'mongodb'

class MongoStore {
  private client: MongoClient
  private db: any
  
  async connect() {
    this.client = await MongoClient.connect('mongodb://localhost:27017')
    this.db = this.client.db('whatsapp')
  }
  
  async saveMessage(message: WAMessage) {
    await this.db.collection('messages').insertOne({
      remoteJid: message.key.remoteJid,
      id: message.key.id,
      fromMe: message.key.fromMe,
      message: message.message,
      messageTimestamp: message.messageTimestamp,
      pushName: message.pushName,
      createdAt: new Date()
    })
  }
  
  async getMessage(key: WAMessageKey): Promise<WAMessageContent | undefined> {
    const doc = await this.db.collection('messages').findOne({
      remoteJid: key.remoteJid,
      id: key.id,
      fromMe: key.fromMe
    })
    
    return doc?.message
  }
  
  async saveChat(chat: Chat) {
    await this.db.collection('chats').updateOne(
      { id: chat.id },
      { $set: chat },
      { upsert: true }
    )
  }
  
  async getChats() {
    return await this.db.collection('chats').find({}).toArray()
  }
}

// Usage
const store = new MongoStore()
await store.connect()

const sock = makeWASocket({
  getMessage: (key) => store.getMessage(key)
})

sock.ev.on('messages.upsert', ({ messages }) => {
  for (const msg of messages) {
    await store.saveMessage(msg)
  }
})

sock.ev.on('chats.upsert', (chats) => {
  for (const chat of chats) {
    await store.saveChat(chat)
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#postgresql-example)

PostgreSQL Example

```
import { Pool } from 'pg'

class PostgresStore {
  private pool: Pool
  
  constructor() {
    this.pool = new Pool({
      host: 'localhost',
      database: 'whatsapp',
      user: 'postgres',
      password: 'password'
    })
  }
  
  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        remote_jid TEXT NOT NULL,
        id TEXT NOT NULL,
        from_me BOOLEAN NOT NULL,
        message JSONB NOT NULL,
        message_timestamp BIGINT,
        push_name TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (remote_jid, id, from_me)
      )
    `)
    
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        name TEXT,
        unread_count INTEGER,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
  }
  
  async saveMessage(message: WAMessage) {
    await this.pool.query(
      `INSERT INTO messages 
       (remote_jid, id, from_me, message, message_timestamp, push_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (remote_jid, id, from_me) DO UPDATE
       SET message = EXCLUDED.message`,
      [
        message.key.remoteJid,
        message.key.id,
        message.key.fromMe,
        JSON.stringify(message.message),
        message.messageTimestamp,
        message.pushName
      ]
    )
  }
  
  async getMessage(key: WAMessageKey): Promise<WAMessageContent | undefined> {
    const result = await this.pool.query(
      `SELECT message FROM messages 
       WHERE remote_jid = $1 AND id = $2 AND from_me = $3`,
      [key.remoteJid, key.id, key.fromMe]
    )
    
    return result.rows[0]?.message
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#storing-events)

Storing Events

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#messages)

Messages

```
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  for (const message of messages) {
    await store.saveMessage({
      key: message.key,
      message: message.message,
      messageTimestamp: message.messageTimestamp,
      pushName: message.pushName,
      type: type // 'notify' or 'append'
    })
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#message-updates)

Message Updates

```
sock.ev.on('messages.update', async (updates) => {
  for (const { key, update } of updates) {
    await store.updateMessage(key, {
      status: update.status,
      reactions: update.reactions,
      pollUpdates: update.pollUpdates
    })
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#chats)

Chats

```
sock.ev.on('chats.upsert', async (chats) => {
  for (const chat of chats) {
    await store.saveChat(chat)
  }
})

sock.ev.on('chats.update', async (updates) => {
  for (const update of updates) {
    await store.updateChat(update.id!, update)
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#contacts)

Contacts

```
sock.ev.on('contacts.upsert', async (contacts) => {
  for (const contact of contacts) {
    await store.saveContact(contact)
  }
})

sock.ev.on('contacts.update', async (updates) => {
  for (const update of updates) {
    await store.updateContact(update.id!, update)
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#message-retrieval-helpers)

Message Retrieval Helpers

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#get-last-message-in-chat)

Get Last Message in Chat

```
async function getLastMessageInChat(jid: string): Promise<WAMessage | null> {
  return await db.messages.findOne(
    { remoteJid: jid },
    { sort: { messageTimestamp: -1 } }
  )
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#load-message-history)

Load Message History

```
async function loadMessages(
  jid: string,
  limit: number = 50,
  before?: number
): Promise<WAMessage[]> {
  const query: any = { remoteJid: jid }
  
  if (before) {
    query.messageTimestamp = { $lt: before }
  }
  
  return await db.messages
    .find(query)
    .sort({ messageTimestamp: -1 })
    .limit(limit)
    .toArray()
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#best-practices)

Best Practices

**Store Implementation Tips:**

1.  **Index efficiently** - Index by `remoteJid`, `id`, and `fromMe` for fast lookups
2.  **Serialize properly** - Use `BufferJSON` for Buffer/Uint8Array fields
3.  **Handle updates** - Use upsert operations for idempotency
4.  **Batch operations** - Batch database writes for performance
5.  **Clean old data** - Implement retention policies for old messages
6.  **Backup regularly** - Regular backups prevent data loss
7.  **Handle errors** - Gracefully handle database errors

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#performance-optimization)

Performance Optimization

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#batch-writes)

Batch Writes

```
const messageQueue: WAMessage[] = []
const BATCH_SIZE = 100

sock.ev.on('messages.upsert', ({ messages }) => {
  messageQueue.push(...messages)
  
  if (messageQueue.length >= BATCH_SIZE) {
    flushMessageQueue()
  }
})

async function flushMessageQueue() {
  if (messageQueue.length === 0) return
  
  const batch = messageQueue.splice(0, messageQueue.length)
  await store.saveMessagesBatch(batch)
}

// Flush remaining messages periodically
setInterval(flushMessageQueue, 5000)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#caching)

Caching

```
import NodeCache from '@cacheable/node-cache'

const messageCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  maxKeys: 1000 
})

async function getMessage(key: WAMessageKey) {
  const cacheKey = `${key.remoteJid}:${key.id}:${key.fromMe}`
  
  // Check cache first
  let message = messageCache.get(cacheKey)
  
  if (!message) {
    // Fetch from database
    message = await db.getMessage(key)
    
    if (message) {
      messageCache.set(cacheKey, message)
    }
  }
  
  return message
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#data-retention)

Data Retention

```
// Delete messages older than 90 days
async function cleanOldMessages() {
  const cutoffDate = Date.now() - (90 * 24 * 60 * 60 * 1000)
  
  await db.messages.deleteMany({
    messageTimestamp: { $lt: cutoffDate }
  })
}

// Run cleanup daily
setInterval(cleanOldMessages, 24 * 60 * 60 * 1000)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store#see-also)

See Also

-   [Events](https://whiskeysockets-baileys-94.mintlify.app/concepts/events) - Event system overview
-   [Authentication](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication) - Storing auth state
-   [WhatsApp IDs](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids) - Understanding message keys

[

Event System

Previous



](https://whiskeysockets-baileys-94.mintlify.app/concepts/events)[

WhatsApp IDs (JIDs)

Next



](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids)
