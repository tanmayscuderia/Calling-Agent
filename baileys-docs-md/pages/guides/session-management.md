# Session Management

Source: https://whiskeysockets-baileys-94.mintlify.app/guides/session-management

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#overview)

Overview

Session management is critical in Baileys to avoid re-authenticating every time your application restarts. Proper session handling ensures:

-   No repeated QR code scanning
-   Persistent authentication across restarts
-   Proper message encryption/decryption
-   Reliable message delivery

Failing to properly save session state will cause message delivery failures and force users to re-authenticate frequently.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#authentication-state)

Authentication State

Baileys authentication state consists of two parts:

1.  **Credentials (`creds`)** - Your device’s identity and encryption keys
2.  **Keys (`keys`)** - Signal protocol keys for message encryption

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#using-multi-file-auth-state)

Using Multi-File Auth State

Baileys provides `useMultiFileAuthState` as the recommended way to manage sessions.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#basic-usage)

Basic Usage

```
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

const sock = makeWASocket({ 
    auth: state 
})

// Save credentials whenever they update
sock.ev.on('creds.update', saveCreds)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#how-it-works)

How It Works

1

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#)

Load Existing State

`useMultiFileAuthState` loads credentials and keys from the specified folder.

2

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#)

Create Socket

Pass the loaded `state` to `makeWASocket` via the `auth` option.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#)

Listen for Updates

Listen to `creds.update` event to know when credentials change.

4

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#)

Save Changes

Call `saveCreds()` to persist the updated credentials.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#file-structure)

File Structure

The auth state is stored in multiple files:

```
auth_info_baileys/
├── creds.json          # Main credentials
└── app-state-sync-key-*.json  # Signal protocol keys
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#complete-session-management-example)

Complete Session Management Example

```
import makeWASocket, { 
    DisconnectReason,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

async function connectToWhatsApp() {
    // Load or create auth state
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            // Cacheable store makes encryption faster
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: true
    })
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        
        if (connection === 'close') {
            const shouldReconnect = 
                (lastDisconnect?.error as Boom)?.output?.statusCode !== 
                DisconnectReason.loggedOut
            
            if (shouldReconnect) {
                connectToWhatsApp() // Reconnect with saved state
            } else {
                console.log('Logged out - session cleared')
            }
        } else if (connection === 'open') {
            console.log('Connected with saved session')
        }
    })
    
    // CRITICAL: Save credentials when updated
    sock.ev.on('creds.update', saveCreds)
}

connectToWhatsApp()
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#why-credentials-update)

Why Credentials Update

Credentials update in several scenarios:

-   New Messages
    
-   First Connection
    
-   Key Rotation
    
-   Device Changes
    

When messages are received or sent, Signal protocol sessions update, requiring key changes.

On initial authentication, credentials are created and must be saved.

WhatsApp periodically rotates encryption keys for security.

When devices are linked/unlinked or settings change.

The `creds.update` event may fire frequently (even on every message). Always save immediately to prevent issues.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#cacheable-signal-key-store)

Cacheable Signal Key Store

For better performance, use `makeCacheableSignalKeyStore` to cache encryption keys:

```
import { makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info')

const sock = makeWASocket({
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
    }
})
```

**Benefits:**

-   Faster message encryption/decryption
-   Reduced disk I/O
-   Better performance for high-volume bots

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#custom-auth-state-implementation)

Custom Auth State Implementation

`useMultiFileAuthState` is great for development, but production systems should use databases.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#database-example-conceptual)

Database Example (Conceptual)

```
import { AuthenticationState, SignalDataTypeMap } from '@whiskeysockets/baileys'

function useDatabaseAuthState(userId: string): AuthenticationState {
    return {
        creds: await loadCredsFromDB(userId),
        keys: {
            get: async (type, ids) => {
                const data = {}
                for (const id of ids) {
                    data[id] = await db.getKey(type, id)
                }
                return data
            },
            set: async (data) => {
                for (const [type, entries] of Object.entries(data)) {
                    for (const [id, value] of Object.entries(entries)) {
                        if (value) {
                            await db.setKey(type, id, value)
                        } else {
                            await db.deleteKey(type, id)
                        }
                    }
                }
            }
        }
    }
}

// Usage
const authState = await useDatabaseAuthState('user123')
const sock = makeWASocket({ auth: authState })

sock.ev.on('creds.update', async () => {
    await saveCredsToDB(authState.creds)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#mongodb-example)

MongoDB Example

```
import { MongoClient } from 'mongodb'
import { BufferJSON, initAuthCreds } from '@whiskeysockets/baileys'

async function useMongoAuthState(collection: Collection) {
    const writeData = async (id: string, data: any) => {
        await collection.updateOne(
            { _id: id },
            { $set: { data: JSON.stringify(data, BufferJSON.replacer) } },
            { upsert: true }
        )
    }
    
    const readData = async (id: string) => {
        const doc = await collection.findOne({ _id: id })
        return doc?.data ? JSON.parse(doc.data, BufferJSON.reviver) : null
    }
    
    const removeData = async (id: string) => {
        await collection.deleteOne({ _id: id })
    }
    
    const creds = await readData('creds') || initAuthCreds()
    
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {}
                    for (const id of ids) {
                        const value = await readData(`${type}-${id}`)
                        if (value) data[id] = value
                    }
                    return data
                },
                set: async (data) => {
                    for (const [type, entries] of Object.entries(data)) {
                        for (const [id, value] of Object.entries(entries)) {
                            const key = `${type}-${id}`
                            if (value) {
                                await writeData(key, value)
                            } else {
                                await removeData(key)
                            }
                        }
                    }
                }
            }
        },
        saveCreds: async () => {
            await writeData('creds', creds)
        }
    }
}
```

**Important:** Always use `BufferJSON` for proper serialization of Buffer objects in credentials.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#bufferjson-utility)

BufferJSON Utility

Baileys provides `BufferJSON` for properly handling Buffer objects in JSON:

```
import { BufferJSON } from '@whiskeysockets/baileys'

// Serializing
const json = JSON.stringify(authState.creds, BufferJSON.replacer)

// Deserializing  
const creds = JSON.parse(json, BufferJSON.reviver)
```

Without `BufferJSON`, Buffer objects will not serialize correctly, causing authentication failures.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#getmessage-implementation)

getMessage Implementation

For message retry and poll decryption, implement `getMessage`:

```
import { WAMessageKey, proto } from '@whiskeysockets/baileys'

const messageStore = new Map<string, proto.IMessage>()

// Store messages
sock.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages) {
        const key = `${msg.key.remoteJid}_${msg.key.id}`
        messageStore.set(key, msg.message!)
    }
})

// Implement getMessage
const getMessage = async (key: WAMessageKey): Promise<proto.IMessage | undefined> => {
    const msgKey = `${key.remoteJid}_${key.id}`
    return messageStore.get(msgKey)
}

// Use in socket config
const sock = makeWASocket({
    auth: state,
    getMessage
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#database-backed-getmessage)

Database-backed getMessage

```
const getMessage = async (key: WAMessageKey) => {
    const msg = await db.messages.findOne({
        remoteJid: key.remoteJid,
        id: key.id,
        fromMe: key.fromMe ?? false
    })
    
    return msg?.message
}

const sock = makeWASocket({
    auth: state,
    getMessage
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#in-memory-store)

In-Memory Store

As of Baileys v7.0.0, the built-in `makeInMemoryStore` has been removed. Implement a custom store instead.

Here’s a simple in-memory store example for quick prototyping:

```
import makeWASocket from '@whiskeysockets/baileys'
import { writeFile, readFile } from 'fs/promises'

// Simple in-memory store
const store = {
    chats: new Map(),
    contacts: new Map(),
    messages: new Map()
}

// Load from file
try {
    const data = await readFile('./baileys_store.json', 'utf-8')
    const saved = JSON.parse(data)
    store.chats = new Map(saved.chats || [])
    store.contacts = new Map(saved.contacts || [])
    store.messages = new Map(saved.messages || [])
} catch {}

// Auto-save every 10 seconds
setInterval(async () => {
    await writeFile('./baileys_store.json', JSON.stringify({
        chats: Array.from(store.chats.entries()),
        contacts: Array.from(store.contacts.entries()),
        messages: Array.from(store.messages.entries())
    }))
}, 10_000)

const sock = makeWASocket({ auth: state })

// Store data from events
sock.ev.on('chats.upsert', (chats) => {
    for (const chat of chats) store.chats.set(chat.id, chat)
})

sock.ev.on('contacts.upsert', (contacts) => {
    for (const contact of contacts) store.contacts.set(contact.id, contact)
})
```

The in-memory store is **not recommended for production** as it stores all data in RAM, which is wasteful for large chat histories.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#session-cleanup)

Session Cleanup

When a user logs out, clean up their session:

```
import fs from 'fs/promises'

sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    
    if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        
        if (statusCode === DisconnectReason.loggedOut) {
            // User logged out - delete session
            await fs.rm('auth_info_baileys', { recursive: true, force: true })
            console.log('Session deleted')
        }
    }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#multi-user-sessions)

Multi-User Sessions

Manage multiple WhatsApp accounts:

```
const sessions = new Map<string, WASocket>()

async function createSession(userId: string) {
    const { state, saveCreds } = await useMultiFileAuthState(`sessions/${userId}`)
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    })
    
    sock.ev.on('creds.update', saveCreds)
    
    sessions.set(userId, sock)
    return sock
}

function getSession(userId: string) {
    return sessions.get(userId)
}

function closeSession(userId: string) {
    const sock = sessions.get(userId)
    if (sock) {
        sock.end(undefined)
        sessions.delete(userId)
    }
}

// Create sessions for multiple users
await createSession('user1')
await createSession('user2')
await createSession('user3')
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#best-practices)

Best Practices

1

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#)

Always Save Credentials

Listen to `creds.update` and save immediately - this event may fire frequently.

2

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#)

Use Databases in Production

Don’t use `useMultiFileAuthState` in production - implement database-backed storage.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#)

Implement getMessage

For retry handling and poll decryption, always implement and provide `getMessage`.

4

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#)

Use BufferJSON

When serializing auth state to JSON, always use `BufferJSON.replacer` and `BufferJSON.reviver`.

5

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#)

Cache Signal Keys

Use `makeCacheableSignalKeyStore` for better performance.

6

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#)

Handle Logout

Detect logout events and clean up session data properly.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#troubleshooting)

Troubleshooting

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#messages-not-sending)

Messages Not Sending

-   **Cause:** Credentials not saved when `creds.update` fired
-   **Solution:** Ensure `saveCreds()` is called on every `creds.update` event

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#frequent-re-authentication)

Frequent Re-authentication

-   **Cause:** Auth state not persisted between restarts
-   **Solution:** Verify `useMultiFileAuthState` folder path is correct and writable

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#buffer-serialization-errors)

Buffer Serialization Errors

-   **Cause:** JSON.stringify/parse without BufferJSON
-   **Solution:** Use `BufferJSON.replacer` and `BufferJSON.reviver`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#key-update-errors)

Key Update Errors

-   **Cause:** Keys state `set()` method not saving properly
-   **Solution:** Ensure your custom `keys.set()` implementation saves all data correctly

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management#next-steps)

Next Steps

## Handling Events

Process messages and implement getMessage

## Socket Configuration

Configure getMessage and other options

## Sending Messages

Send messages with proper retry handling

[

Handling Events

Previous



](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events)[

Socket Configuration

Next



](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration)
