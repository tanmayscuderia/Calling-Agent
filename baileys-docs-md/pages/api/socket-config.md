# SocketConfig

Source: https://whiskeysockets-baileys-94.mintlify.app/api/socket-config

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#overview)

Overview

The `SocketConfig` interface defines all available configuration options for a Baileys WhatsApp Web socket connection. When using `makeWASocket`, you pass a `UserFacingSocketConfig` which is `Partial<SocketConfig>` with a required `auth` property.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#type-definition)

Type Definition

```
type UserFacingSocketConfig = Partial<SocketConfig> & { auth: AuthenticationState }
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#configuration-properties)

Configuration Properties

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#connection-settings)

Connection Settings

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-wa-web-socket-url)

waWebSocketUrl

string | URL

default:"'wss://web.whatsapp.com/ws/chat'"

The WebSocket URL to connect to WhatsApp Web.

```
waWebSocketUrl: 'wss://web.whatsapp.com/ws/chat'
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-connect-timeout-ms)

connectTimeoutMs

number

default:"20000"

Fails the connection if the socket times out in this interval (milliseconds).

```
connectTimeoutMs: 20_000 // 20 seconds
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-default-query-timeout-ms)

defaultQueryTimeoutMs

number | undefined

default:"60000"

Default timeout for queries in milliseconds. Set to `undefined` for no timeout.

```
defaultQueryTimeoutMs: 60_000 // 60 seconds
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-keep-alive-interval-ms)

keepAliveIntervalMs

number

default:"30000"

Ping-pong interval for WebSocket connection (milliseconds).

```
keepAliveIntervalMs: 30_000 // 30 seconds
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#version-&-browser)

Version & Browser

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-version)

version

WAVersion

default:"\[2, 3000, 1033846690\]"

WhatsApp Web version to connect with. Type: `[number, number, number]`

```
import { fetchLatestBaileysVersion } from '@whiskeysockets/baileys'

const { version } = await fetchLatestBaileysVersion()
const sock = makeWASocket({ version, auth: state })
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-browser)

browser

WABrowserDescription

default:"Browsers.macOS('Chrome')"

Browser configuration as a tuple `[OS, Browser, Version]`. Use the `Browsers` constant for predefined configurations.

```
import { Browsers } from '@whiskeysockets/baileys'

// Options:
browser: Browsers.ubuntu('Chrome')
browser: Browsers.macOS('Safari')
browser: Browsers.windows('Edge')
browser: Browsers.baileys('MyApp')
browser: Browsers.appropriate('Chrome') // Based on your OS
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#network-&-proxy)

Network & Proxy

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-agent)

agent

Agent

HTTPS proxy agent for the WebSocket connection.

```
import { Agent } from 'https'
import { HttpsProxyAgent } from 'https-proxy-agent'

const agent = new HttpsProxyAgent('http://proxy-server:8080')
const sock = makeWASocket({ agent, auth: state })
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-fetch-agent)

fetchAgent

Agent

Agent used for fetch requests when uploading/downloading media.

```
fetchAgent: new Agent({ keepAlive: true })
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#logging)

Logging

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-logger)

logger

ILogger

default:"logger.child({ class: 'baileys' })"

Logger instance for debugging and logging. Compatible with Pino logger.

```
import P from 'pino'

const logger = P({ level: 'debug' })
const sock = makeWASocket({ logger, auth: state })
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#authentication)

Authentication

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-auth)

auth

AuthenticationState

required

Authentication state object to maintain the auth state. Use `useMultiFileAuthState()` to create this.

```
import { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info')
const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#events)

Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-emit-own-events)

emitOwnEvents

boolean

default:"true"

Whether events should be emitted for actions done by this socket connection.

```
emitOwnEvents: true // Emit events for messages you send
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#media-settings)

Media Settings

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-custom-upload-hosts)

customUploadHosts

MediaConnInfo\['hosts'\]

default:"\[\]"

Custom upload hosts to upload media to.

```
customUploadHosts: []
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-link-preview-image-thumbnail-width)

linkPreviewImageThumbnailWidth

number

default:"192"

Width for link preview images in pixels.

```
linkPreviewImageThumbnailWidth: 192
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-generate-high-quality-link-preview)

generateHighQualityLinkPreview

boolean

default:"false"

Generate high quality link preview by uploading the jpegThumbnail to WhatsApp.

```
generateHighQualityLinkPreview: true
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#retry-&-error-handling)

Retry & Error Handling

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-retry-request-delay-ms)

retryRequestDelayMs

number

default:"250"

Time to wait between sending new retry requests (milliseconds).

```
retryRequestDelayMs: 250
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-max-msg-retry-count)

maxMsgRetryCount

number

default:"5"

Maximum retry count for failed messages.

```
maxMsgRetryCount: 5
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-enable-auto-session-recreation)

enableAutoSessionRecreation

boolean

default:"true"

Enable automatic session recreation for failed messages.

```
enableAutoSessionRecreation: true
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-enable-recent-message-cache)

enableRecentMessageCache

boolean

default:"true"

Enable recent message caching for retry handling.

```
enableRecentMessageCache: true
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#qr-code-&-pairing)

QR Code & Pairing

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-qr-timeout)

qrTimeout

number

Time to wait for the generation of the next QR code in milliseconds.

```
qrTimeout: 60_000 // 60 seconds
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-print-qr-in-terminal)

printQRInTerminal

boolean

deprecated

This feature has been removed. Should the QR code be printed in the terminal.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#history-sync)

History Sync

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-sync-full-history)

syncFullHistory

boolean

default:"true"

Whether Baileys should ask the phone for full history (will be received async).

```
syncFullHistory: true
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-should-sync-history-message)

shouldSyncHistoryMessage

(msg: proto.Message.IHistorySyncNotification) => boolean

Function to manage history processing. By default, syncs everything except FULL sync type.

```
shouldSyncHistoryMessage: ({ syncType }) => {
  return syncType !== proto.HistorySync.HistorySyncType.FULL
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#initialization)

Initialization

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-fire-init-queries)

fireInitQueries

boolean

default:"true"

Whether Baileys should fire init queries automatically.

```
fireInitQueries: true
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-mark-online-on-connect)

markOnlineOnConnect

boolean

default:"true"

Marks the client as online whenever the socket successfully connects. Set to `false` to receive notifications in WhatsApp app.

```
markOnlineOnConnect: false // To receive notifications on phone
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#country-code)

Country Code

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-country-code)

countryCode

string

default:"'US'"

Alphanumeric country code (e.g., USA -> US) for the number used.

```
countryCode: 'US'
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#caching)

Caching

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-media-cache)

mediaCache

CacheStore

Cache to store media, so it doesn’t have to be re-uploaded.

```
import NodeCache from '@cacheable/node-cache'

const mediaCache = new NodeCache()
const sock = makeWASocket({ mediaCache, auth: state })
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-msg-retry-counter-cache)

msgRetryCounterCache

CacheStore

Map to store retry counts for failed messages; used to determine whether to retry a message.

```
import NodeCache from '@cacheable/node-cache'

const msgRetryCounterCache = new NodeCache()
const sock = makeWASocket({ msgRetryCounterCache, auth: state })
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-user-devices-cache)

userDevicesCache

PossiblyExtendedCacheStore

Cache to store a user’s device list.

```
const userDevicesCache = new NodeCache()
const sock = makeWASocket({ userDevicesCache, auth: state })
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-call-offer-cache)

callOfferCache

CacheStore

Cache to store call offers.

```
const callOfferCache = new NodeCache()
const sock = makeWASocket({ callOfferCache, auth: state })
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-placeholder-resend-cache)

placeholderResendCache

CacheStore

Cache to track placeholder resends.

```
const placeholderResendCache = new NodeCache()
const sock = makeWASocket({ placeholderResendCache, auth: state })
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#message-handling)

Message Handling

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-should-ignore-jid)

shouldIgnoreJid

(jid: string) => boolean | undefined

default:"() => false"

Function that returns if a JID should be ignored. No event for that JID will be triggered and messages from that JID will not be decrypted.

```
import { isJidBroadcast } from '@whiskeysockets/baileys'

shouldIgnoreJid: (jid) => isJidBroadcast(jid) // Ignore broadcasts
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-patch-message-before-sending)

patchMessageBeforeSending

Function

default:"msg => msg"

Optionally patch the message before sending out.

```
patchMessageBeforeSending: (msg, recipientJids) => {
  // Modify message before sending
  return msg
}
```

Full signature:

```
(msg: proto.IMessage, recipientJids?: string[]) => 
  Promise<PatchedMessageWithRecipientJID[] | PatchedMessageWithRecipientJID> |
  PatchedMessageWithRecipientJID[] | PatchedMessageWithRecipientJID
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-get-message)

getMessage

(key: WAMessageKey) => Promise<proto.IMessage | undefined>

default:"async () => undefined"

Fetch a message from your store. Implement this so that messages that failed to send can be retried. This solves the “this message can take a while” issue.

```
getMessage: async (key) => {
  // Retrieve message from your database/store
  const msg = await db.messages.findOne({ id: key.id })
  return msg?.message
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#group-metadata)

Group Metadata

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-cached-group-metadata)

cachedGroupMetadata

(jid: string) => Promise<GroupMetadata | undefined>

default:"async () => undefined"

Cached group metadata function to prevent redundant requests to WhatsApp and speed up message sending. Highly recommended for group usage.

```
import NodeCache from '@cacheable/node-cache'

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

const sock = makeWASocket({
  cachedGroupMetadata: async (jid) => groupCache.get(jid),
  auth: state
})

sock.ev.on('groups.update', async ([event]) => {
  const metadata = await sock.groupMetadata(event.id)
  groupCache.set(event.id, metadata)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#security-&-verification)

Security & Verification

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-app-state-mac-verification)

appStateMacVerification

object

default:"{ patch: false, snapshot: false }"

Verify app state MACs for enhanced security.

```
appStateMacVerification: {
  patch: false,
  snapshot: false
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#signal-repository)

Signal Repository

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-transaction-opts)

transactionOpts

TransactionCapabilityOptions

Transaction capability options for SignalKeyStore.

```
transactionOpts: {
  maxCommitRetries: 10,
  delayBetweenTriesMs: 3000
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-make-signal-repository)

makeSignalRepository

Function

default:"makeLibSignalRepository"

Function to create signal repository.

```
import { makeLibSignalRepository } from '@whiskeysockets/baileys'

makeSignalRepository: makeLibSignalRepository
```

Full signature:

```
(auth: SignalAuthState, logger: ILogger, 
 pnToLIDFunc?: (jids: string[]) => Promise<LIDMapping[] | undefined>) => 
  SignalRepositoryWithLIDStore
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#http-options)

HTTP Options

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-options)

options

RequestInit

default:"{}"

Options for HTTP fetch requests.

```
options: {
  headers: {
    'User-Agent': 'MyCustomAgent/1.0'
  }
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#deprecated-options)

Deprecated Options

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#param-mobile)

mobile

boolean

deprecated

This feature has been removed. Should Baileys use the mobile API instead of the multi-device API.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#cachestore-interface)

CacheStore Interface

```
type CacheStore = {
  /** Get a cached key and change the stats */
  get<T>(key: string): Promise<T> | T | undefined
  /** Set a key in the cache */
  set<T>(key: string, value: T): Promise<void> | void | number | boolean
  /** Delete a key from the cache */
  del(key: string): void | Promise<void> | number | boolean
  /** Flush all data */
  flushAll(): void | Promise<void>
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#possiblyextendedcachestore-interface)

PossiblyExtendedCacheStore Interface

```
type PossiblyExtendedCacheStore = CacheStore & {
  mget?: <T>(keys: string[]) => Promise<Record<string, T | undefined>>
  mset?: <T>(entries: { key: string; value: T }[]) => Promise<void> | void | number | boolean
  mdel?: (keys: string[]) => void | Promise<void> | number | boolean
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#complete-example)

Complete Example

```
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  Browsers
} from '@whiskeysockets/baileys'
import NodeCache from '@cacheable/node-cache'
import P from 'pino'

const logger = P({ level: 'info' })
const msgRetryCounterCache = new NodeCache()
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

const { state, saveCreds } = await useMultiFileAuthState('auth_info')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
  // Connection
  version,
  waWebSocketUrl: 'wss://web.whatsapp.com/ws/chat',
  connectTimeoutMs: 20_000,
  defaultQueryTimeoutMs: 60_000,
  keepAliveIntervalMs: 30_000,
  
  // Browser & Version
  browser: Browsers.ubuntu('MyApp'),
  
  // Auth
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger),
  },
  
  // Logging
  logger,
  
  // Events
  emitOwnEvents: true,
  
  // Retry
  retryRequestDelayMs: 250,
  maxMsgRetryCount: 5,
  msgRetryCounterCache,
  enableAutoSessionRecreation: true,
  enableRecentMessageCache: true,
  
  // History
  syncFullHistory: true,
  shouldSyncHistoryMessage: ({ syncType }) => {
    return syncType !== proto.HistorySync.HistorySyncType.FULL
  },
  
  // Media
  generateHighQualityLinkPreview: true,
  linkPreviewImageThumbnailWidth: 192,
  
  // Behavior
  markOnlineOnConnect: true,
  fireInitQueries: true,
  
  // Group metadata caching
  cachedGroupMetadata: async (jid) => groupCache.get(jid),
  
  // Message retrieval
  getMessage: async (key) => {
    // Implement message store retrieval
    return undefined
  },
  
  // Country
  countryCode: 'US',
})

// Save credentials on update
sock.ev.on('creds.update', saveCreds)

// Cache group metadata
sock.ev.on('groups.update', async ([event]) => {
  const metadata = await sock.groupMetadata(event.id)
  groupCache.set(event.id, metadata)
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config#see-also)

See Also

-   [makeWASocket](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket) - Main socket creation function
-   [Browsers](https://whiskeysockets-baileys-94.mintlify.app/api/browsers) - Browser configuration options
-   [DEFAULT\_CONNECTION\_CONFIG](https://github.com/WhiskeySockets/Baileys/blob/master/src/Defaults/index.ts) - Default configuration values

[

makeWASocket

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket)[

Browsers

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/browsers)
