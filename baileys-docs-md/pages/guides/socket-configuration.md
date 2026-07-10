# Socket Configuration

Source: https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#overview)

Overview

The `makeWASocket` function accepts a comprehensive configuration object that controls every aspect of your WhatsApp connection. This guide covers all available options from the `SocketConfig` type.

All configuration options are optional and have sensible defaults from `DEFAULT_CONNECTION_CONFIG`.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#basic-configuration)

Basic Configuration

```
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state } = await useMultiFileAuthState('auth_info')

const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#connection-options)

Connection Options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#wawebsocketurl)

waWebSocketUrl

The WebSocket URL to connect to WhatsApp servers.

```
const sock = makeWASocket({
    waWebSocketUrl: 'wss://web.whatsapp.com/ws/chat' // default
})
```

**Default:** `'wss://web.whatsapp.com/ws/chat'`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#connecttimeoutms)

connectTimeoutMs

Timeout for establishing the WebSocket connection.

```
const sock = makeWASocket({
    connectTimeoutMs: 20_000 // 20 seconds (default)
})
```

**Default:** `20000` (20 seconds)  
**Type:** `number` (milliseconds)

If the connection doesn’t establish within this timeout, it will fail and you’ll need to retry.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#keepaliveintervalms)

keepAliveIntervalMs

Interval for ping-pong messages to keep the WebSocket alive.

```
const sock = makeWASocket({
    keepAliveIntervalMs: 30_000 // 30 seconds (default)
})
```

**Default:** `30000` (30 seconds)  
**Type:** `number` (milliseconds)

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#defaultquerytimeoutms)

defaultQueryTimeoutMs

Default timeout for query requests to WhatsApp.

```
const sock = makeWASocket({
    defaultQueryTimeoutMs: 60_000 // 60 seconds (default)
})
```

**Default:** `60000` (60 seconds)  
**Type:** `number | undefined`

Set to `undefined` for no timeout, but this is not recommended.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#authentication-options)

Authentication Options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#auth)

auth

**Required.** Authentication state containing credentials and keys.

```
import { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state } = await useMultiFileAuthState('auth_info')

const sock = makeWASocket({
    auth: state
})
```

**Type:** `AuthenticationState`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#printqrinterminal)

printQRInTerminal

Automatically print QR code to terminal (deprecated in favor of manual handling).

```
const sock = makeWASocket({
    printQRInTerminal: true // or false for pairing code
})
```

**Default:** Not set  
**Type:** `boolean`

This feature is deprecated. Handle QR codes via the `connection.update` event instead.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#qrtimeout)

qrTimeout

Time to wait for QR code generation.

```
const sock = makeWASocket({
    qrTimeout: 60000 // 60 seconds
})
```

**Default:** Not set  
**Type:** `number` (milliseconds)

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#browser-configuration)

Browser Configuration

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#browser)

browser

Browser identity shown in WhatsApp’s “Linked Devices”.

```
import { Browsers } from '@whiskeysockets/baileys'

const sock = makeWASocket({
    browser: Browsers.macOS('Chrome') // ['Mac OS', 'Chrome', '14.4.1']
})
```

**Default:** `Browsers.macOS('Chrome')`  
**Type:** `[platform: string, appName: string, version: string]` **Available presets:**

-   `Browsers.ubuntu(appName)` - Ubuntu 22.04.4
-   `Browsers.macOS(appName)` - Mac OS 14.4.1
-   `Browsers.windows(appName)` - Windows 10.0.22631
-   `Browsers.baileys(appName)` - Baileys 6.5.0
-   `Browsers.appropriate(appName)` - Auto-detect from OS

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#version)

version

WhatsApp Web version to use.

```
import { fetchLatestBaileysVersion } from '@whiskeysockets/baileys'

const { version, isLatest } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
    version // Use latest version
})
```

**Default:** `[2, 3000, 1033846690]`  
**Type:** `[major: number, minor: number, patch: number]`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#message-&-media-options)

Message & Media Options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#getmessage)

getMessage

Fetch messages from your store for retry handling and poll decryption.

```
import { WAMessageKey, proto } from '@whiskeysockets/baileys'

const getMessage = async (key: WAMessageKey): Promise<proto.IMessage | undefined> => {
    // Retrieve from your database/store
    return await messageDB.findOne({ 
        remoteJid: key.remoteJid, 
        id: key.id 
    })
}

const sock = makeWASocket({
    getMessage
})
```

**Default:** `async () => undefined`  
**Type:** `(key: WAMessageKey) => Promise<proto.IMessage | undefined>`

Not implementing `getMessage` will prevent message retries and poll vote decryption.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#customuploadhosts)

customUploadHosts

Custom media upload servers.

```
const sock = makeWASocket({
    customUploadHosts: [
        { hostname: 'upload.whatsapp.net', maxContentLengthBytes: 16_000_000 }
    ]
})
```

**Default:** `[]`  
**Type:** `MediaConnInfo['hosts']`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#generatehighqualitylinkpreview)

generateHighQualityLinkPreview

Generate high-quality link previews by uploading thumbnails.

```
const sock = makeWASocket({
    generateHighQualityLinkPreview: true
})
```

**Default:** `false`  
**Type:** `boolean`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#linkpreviewimagethumbnailwidth)

linkPreviewImageThumbnailWidth

Width for link preview thumbnails.

```
const sock = makeWASocket({
    linkPreviewImageThumbnailWidth: 192 // default
})
```

**Default:** `192`  
**Type:** `number` (pixels)

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#history-&-sync-options)

History & Sync Options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#syncfullhistory)

syncFullHistory

Request full chat history from WhatsApp.

```
const sock = makeWASocket({
    syncFullHistory: true
})
```

**Default:** `true`  
**Type:** `boolean`

Desktop browsers receive more history than mobile browsers when this is enabled.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#shouldsynchistorymessage)

shouldSyncHistoryMessage

Control which history messages to process.

```
import { proto } from '@whiskeysockets/baileys'

const sock = makeWASocket({
    shouldSyncHistoryMessage: (msg) => {
        // Skip FULL history sync, process others
        return msg.syncType !== proto.HistorySync.HistorySyncType.FULL
    }
})
```

**Default:** Skips FULL sync  
**Type:** `(msg: proto.Message.IHistorySyncNotification) => boolean`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#fireinitqueries)

fireInitQueries

Automatically fire initialization queries on connection.

```
const sock = makeWASocket({
    fireInitQueries: true // default
})
```

**Default:** `true`  
**Type:** `boolean`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#behavior-options)

Behavior Options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#markonlineonconnect)

markOnlineOnConnect

Automatically mark as online when socket connects.

```
const sock = makeWASocket({
    markOnlineOnConnect: false // Stay offline
})
```

**Default:** `true`  
**Type:** `boolean`

Set to `false` if you want to receive push notifications on your phone.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#emitownevents)

emitOwnEvents

Emit events for actions performed by this socket.

```
const sock = makeWASocket({
    emitOwnEvents: true // default
})
```

**Default:** `true`  
**Type:** `boolean`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#shouldignorejid)

shouldIgnoreJid

Ignore events from specific JIDs.

```
import { isJidBroadcast } from '@whiskeysockets/baileys'

const sock = makeWASocket({
    shouldIgnoreJid: (jid) => {
        // Ignore all broadcast messages
        return isJidBroadcast(jid)
    }
})
```

**Default:** `() => false`  
**Type:** `(jid: string) => boolean | undefined`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#patchmessagebeforesending)

patchMessageBeforeSending

Modify messages before sending.

```
const sock = makeWASocket({
    patchMessageBeforeSending: (msg, recipientJids) => {
        // Add watermark to all messages
        if (msg.conversation) {
            msg.conversation += '\n\nSent via MyBot'
        }
        return msg
    }
})
```

**Default:** `msg => msg` (no modification)  
**Type:** Function that returns patched message(s)

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#retry-&-cache-options)

Retry & Cache Options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#retryrequestdelayms)

retryRequestDelayMs

Delay between retry attempts for failed messages.

```
const sock = makeWASocket({
    retryRequestDelayMs: 250 // default
})
```

**Default:** `250` (milliseconds)  
**Type:** `number`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#maxmsgretrycount)

maxMsgRetryCount

Maximum number of retry attempts.

```
const sock = makeWASocket({
    maxMsgRetryCount: 5 // default
})
```

**Default:** `5`  
**Type:** `number`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#msgretrycountercache)

msgRetryCounterCache

Cache for tracking message retry counts.

```
import NodeCache from '@cacheable/node-cache'
import { CacheStore } from '@whiskeysockets/baileys'

const msgRetryCounterCache = new NodeCache() as CacheStore

const sock = makeWASocket({
    msgRetryCounterCache
})
```

**Default:** Not set  
**Type:** `CacheStore`

Keep this cache outside the socket to prevent retry loops across reconnections.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#mediacache)

mediaCache

Cache for media uploads to avoid re-uploading.

```
import NodeCache from '@cacheable/node-cache'

const mediaCache = new NodeCache({ stdTTL: 3600 })

const sock = makeWASocket({
    mediaCache
})
```

**Default:** Not set  
**Type:** `CacheStore`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#userdevicescache)

userDevicesCache

Cache for user device lists.

```
import NodeCache from '@cacheable/node-cache'

const userDevicesCache = new NodeCache({ stdTTL: 300 })

const sock = makeWASocket({
    userDevicesCache
})
```

**Default:** Not set  
**Type:** `PossiblyExtendedCacheStore`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#calloffercache)

callOfferCache

Cache for call offers.

```
import NodeCache from '@cacheable/node-cache'

const callOfferCache = new NodeCache({ stdTTL: 300 })

const sock = makeWASocket({
    callOfferCache
})
```

**Default:** Not set  
**Type:** `CacheStore`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#placeholderresendcache)

placeholderResendCache

Cache for tracking placeholder resend requests.

```
import NodeCache from '@cacheable/node-cache'

const placeholderResendCache = new NodeCache()

const sock = makeWASocket({
    placeholderResendCache
})
```

**Default:** Not set  
**Type:** `CacheStore`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#performance-options)

Performance Options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#cachedgroupmetadata)

cachedGroupMetadata

Cache group metadata to reduce API calls.

```
import NodeCache from '@cacheable/node-cache'
import { GroupMetadata } from '@whiskeysockets/baileys'

const groupCache = new NodeCache({ stdTTL: 300 })

const sock = makeWASocket({
    cachedGroupMetadata: async (jid) => {
        return groupCache.get(jid) as GroupMetadata | undefined
    }
})

// Update cache when group metadata changes
sock.ev.on('groups.update', async ([event]) => {
    const metadata = await sock.groupMetadata(event.id)
    groupCache.set(event.id, metadata)
})

sock.ev.on('group-participants.update', async (event) => {
    const metadata = await sock.groupMetadata(event.id)
    groupCache.set(event.id, metadata)
})
```

**Default:** `async () => undefined`  
**Type:** `(jid: string) => Promise<GroupMetadata | undefined>`

Highly recommended for bots that interact with groups to reduce API load.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#enableautosessionrecreation)

enableAutoSessionRecreation

Automatically recreate sessions for failed messages.

```
const sock = makeWASocket({
    enableAutoSessionRecreation: true // default
})
```

**Default:** `true`  
**Type:** `boolean`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#enablerecentmessagecache)

enableRecentMessageCache

Cache recent messages for retry handling.

```
const sock = makeWASocket({
    enableRecentMessageCache: true // default
})
```

**Default:** `true`  
**Type:** `boolean`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#network-options)

Network Options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#agent)

agent

Proxy agent for WebSocket connection.

```
import { Agent } from 'https'
import { HttpsProxyAgent } from 'https-proxy-agent'

const agent = new HttpsProxyAgent('http://proxy.example.com:8080')

const sock = makeWASocket({
    agent
})
```

**Default:** Not set  
**Type:** `Agent`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#fetchagent)

fetchAgent

Agent for HTTP fetch requests (media upload/download).

```
import { HttpsProxyAgent } from 'https-proxy-agent'

const fetchAgent = new HttpsProxyAgent('http://proxy.example.com:8080')

const sock = makeWASocket({
    fetchAgent
})
```

**Default:** Not set  
**Type:** `Agent`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#options)

options

Options for HTTP fetch requests.

```
const sock = makeWASocket({
    options: {
        headers: {
            'User-Agent': 'MyCustomUserAgent/1.0'
        }
    }
})
```

**Default:** `{}`  
**Type:** `RequestInit`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#advanced-options)

Advanced Options

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#countrycode)

countryCode

Alphanumeric country code for the phone number.

```
const sock = makeWASocket({
    countryCode: 'BR' // Brazil
})
```

**Default:** `'US'`  
**Type:** `string`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#logger)

logger

Logger instance for debugging.

```
import P from 'pino'

const logger = P({ level: 'debug' })

const sock = makeWASocket({
    logger
})
```

**Default:** Pino logger with level ‘info’  
**Type:** `ILogger`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#transactionopts)

transactionOpts

Transaction options for Signal key store operations.

```
const sock = makeWASocket({
    transactionOpts: {
        maxCommitRetries: 10,
        delayBetweenTriesMs: 3000
    }
})
```

**Default:** `{ maxCommitRetries: 10, delayBetweenTriesMs: 3000 }`  
**Type:** `TransactionCapabilityOptions`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#appstatemacverification)

appStateMacVerification

Verify app state MACs for security.

```
const sock = makeWASocket({
    appStateMacVerification: {
        patch: false,
        snapshot: false
    }
})
```

**Default:** `{ patch: false, snapshot: false }`  
**Type:** `{ patch: boolean; snapshot: boolean }`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#makesignalrepository)

makeSignalRepository

Custom Signal protocol repository factory.

```
import { makeLibSignalRepository } from '@whiskeysockets/baileys'

const sock = makeWASocket({
    makeSignalRepository: makeLibSignalRepository // default
})
```

**Default:** `makeLibSignalRepository`  
**Type:** Function

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#complete-configuration-example)

Complete Configuration Example

```
import makeWASocket, {
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    Browsers,
    fetchLatestBaileysVersion,
    CacheStore
} from '@whiskeysockets/baileys'
import NodeCache from '@cacheable/node-cache'
import P from 'pino'

const logger = P({ level: 'debug' })

const { state, saveCreds } = await useMultiFileAuthState('auth_info')
const { version } = await fetchLatestBaileysVersion()

const msgRetryCounterCache = new NodeCache() as CacheStore
const groupCache = new NodeCache({ stdTTL: 300 })

const sock = makeWASocket({
    // Authentication
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    
    // Connection
    version,
    browser: Browsers.macOS('Chrome'),
    connectTimeoutMs: 20_000,
    keepAliveIntervalMs: 30_000,
    defaultQueryTimeoutMs: 60_000,
    
    // Behavior
    markOnlineOnConnect: false,
    syncFullHistory: true,
    fireInitQueries: true,
    emitOwnEvents: true,
    
    // Message handling
    getMessage: async (key) => await getMessageFromDB(key),
    
    // Caching
    msgRetryCounterCache,
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
    
    // Performance
    enableAutoSessionRecreation: true,
    enableRecentMessageCache: true,
    
    // Media
    generateHighQualityLinkPreview: true,
    linkPreviewImageThumbnailWidth: 192,
    
    // Retry
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 5,
    
    // Logging
    logger,
})

sock.ev.on('creds.update', saveCreds)

// Update group cache
sock.ev.on('groups.update', async ([event]) => {
    const metadata = await sock.groupMetadata(event.id)
    groupCache.set(event.id, metadata)
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#configuration-best-practices)

Configuration Best Practices

1

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#)

Implement getMessage

Always implement `getMessage` for message retry and poll decryption support.

2

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#)

Use Latest Version

Fetch and use the latest WhatsApp Web version with `fetchLatestBaileysVersion()`.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#)

Cache Group Metadata

Implement `cachedGroupMetadata` if your bot works with groups to reduce API calls.

4

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#)

External Retry Cache

Keep `msgRetryCounterCache` outside the socket to prevent retry loops on reconnection.

5

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#)

Adjust for Environment

Set `markOnlineOnConnect: false` if users should receive phone notifications.

6

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#)

Enable High Quality Previews

Set `generateHighQualityLinkPreview: true` for better link preview images.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration#next-steps)

Next Steps

## Session Management

Implement getMessage and auth state

## Handling Events

Use socket to handle events

## Sending Messages

Send messages with your configured socket

[

Session Management

Previous



](https://whiskeysockets-baileys-94.mintlify.app/guides/session-management)[

Sending Messages

Next



](https://whiskeysockets-baileys-94.mintlify.app/messaging/sending-messages)
