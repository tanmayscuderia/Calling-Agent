# Socket Configuration

Source: https://whiskeysockets-baileys-94.mintlify.app/api/types/socket

Configuration types for creating and managing WhatsApp socket connections.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#socketconfig)

SocketConfig

Complete configuration object for `makeWASocket()`.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#connection-settings)

Connection Settings

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-wa-web-socket-url)

waWebSocketUrl

string | URL

required

The WebSocket URL to connect to WhatsApp serversDefault: `'wss://web.whatsapp.com/ws/chat'`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-connect-timeout-ms)

connectTimeoutMs

number

required

Connection timeout in milliseconds. Fails if socket doesn’t connect within this time.Default: `20000` (20 seconds)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-default-query-timeout-ms)

defaultQueryTimeoutMs

number | undefined

required

Default timeout for queries in milliseconds. `undefined` for no timeout.Default: `60000` (60 seconds)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-keep-alive-interval-ms)

keepAliveIntervalMs

number

required

Ping-pong interval for WebSocket connection in millisecondsDefault: `25000` (25 seconds)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-agent)

agent

Agent

Proxy agent for WebSocket connection

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-fetch-agent)

fetchAgent

Agent

Agent used for HTTP fetch requests (uploading/downloading media)

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#client-identification)

Client Identification

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-version)

version

WAVersion

required

WhatsApp Web version to connect withType: `[number, number, number]`Example: `[2, 2323, 4]`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-browser)

browser

WABrowserDescription

required

Browser identification sent to WhatsAppType: `[string, string, string]`Example: `['Baileys', 'Chrome', '1.0.0']`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-country-code)

countryCode

string

required

Alphanumeric country code for the number (e.g., ‘US’, ‘BR’, ‘IN’)

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#authentication)

Authentication

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-auth)

auth

AuthenticationState

required

Authentication state object containing credentials and keysSee [AuthenticationState](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-transaction-opts)

transactionOpts

TransactionCapabilityOptions

required

Options for SignalKeyStore transaction capability

Show properties

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-max-commit-retries)

maxCommitRetries

number

required

Maximum number of retries for transaction commits

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-delay-between-tries-ms)

delayBetweenTriesMs

number

required

Delay between retry attempts in milliseconds

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#logging-and-events)

Logging and Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-logger)

logger

ILogger

required

Logger instance for debug output

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-emit-own-events)

emitOwnEvents

boolean

required

Whether to emit events for actions done by this socket connectionDefault: `true`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#history-and-sync)

History and Sync

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-sync-full-history)

syncFullHistory

boolean

required

Whether to ask the phone for full history (received asynchronously)Default: `false`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-should-sync-history-message)

shouldSyncHistoryMessage

function

required

Control which history messages to sync

```
(msg: proto.Message.IHistorySyncNotification) => boolean
```

Return `true` to sync, `false` to skip

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-fire-init-queries)

fireInitQueries

boolean

required

Whether to automatically fire initialization queriesDefault: `true`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#message-handling)

Message Handling

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-get-message)

getMessage

function

required

Fetch a message from your store for retry logic

```
(key: WAMessageKey) => Promise<proto.IMessage | undefined>
```

Required for handling “this message can take a while” issues

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-patch-message-before-sending)

patchMessageBeforeSending

function

required

Optionally modify messages before sending

```
(msg: proto.IMessage, recipientJids?: string[]) =>
  | Promise<PatchedMessageWithRecipientJID[] | PatchedMessageWithRecipientJID>
  | PatchedMessageWithRecipientJID[] 
  | PatchedMessageWithRecipientJID
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-should-ignore-jid)

shouldIgnoreJid

function

required

Determine if a JID should be ignored (no events, no decryption)

```
(jid: string) => boolean | undefined
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#media)

Media

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-custom-upload-hosts)

customUploadHosts

MediaConnInfo\['hosts'\]

required

Custom upload hosts for media

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-link-preview-image-thumbnail-width)

linkPreviewImageThumbnailWidth

number

required

Width for link preview images in pixelsDefault: `192`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-generate-high-quality-link-preview)

generateHighQualityLinkPreview

boolean

required

Generate high quality link previews (uploads jpegThumbnail to WhatsApp)Default: `false`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#retry-and-error-handling)

Retry and Error Handling

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-retry-request-delay-ms)

retryRequestDelayMs

number

required

Time to wait between sending retry requests in millisecondsDefault: `250`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-max-msg-retry-count)

maxMsgRetryCount

number

required

Maximum retry count for messagesDefault: `5`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-qr-timeout)

qrTimeout

number

Time to wait for QR code generation in millisecondsDefault: `60000` (60 seconds)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-enable-auto-session-recreation)

enableAutoSessionRecreation

boolean

required

Enable automatic session recreation for failed messagesDefault: `false`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-enable-recent-message-cache)

enableRecentMessageCache

boolean

required

Enable recent message caching for retry handlingDefault: `false`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#caching)

Caching

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-media-cache)

mediaCache

CacheStore

Cache to store media to avoid re-uploadingSee [CacheStore](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#cachestore)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-msg-retry-counter-cache)

msgRetryCounterCache

CacheStore

Cache to track retry counts for failed messages

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-user-devices-cache)

userDevicesCache

PossiblyExtendedCacheStore

Cache to store user device lists

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-call-offer-cache)

callOfferCache

CacheStore

Cache to store call offers

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-placeholder-resend-cache)

placeholderResendCache

CacheStore

Cache to track placeholder resends

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-cached-group-metadata)

cachedGroupMetadata

function

required

Fetch cached group metadata to speed up message sending

```
(jid: string) => Promise<GroupMetadata | undefined>
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#advanced)

Advanced

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-mark-online-on-connect)

markOnlineOnConnect

boolean

required

Mark client as online when socket connectsDefault: `true`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-app-state-mac-verification)

appStateMacVerification

object

required

Verify app state MACs

```
{
  patch: boolean
  snapshot: boolean
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-options)

options

RequestInit

required

Options for HTTP fetch requests

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-make-signal-repository)

makeSignalRepository

function

required

Factory function for creating signal repositories

```
(
  auth: SignalAuthState,
  logger: ILogger,
  pnToLIDFunc?: (jids: string[]) => Promise<LIDMapping[] | undefined>
) => SignalRepositoryWithLIDStore
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#cachestore)

CacheStore

Interface for cache implementations used throughout Baileys.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-get)

get

function

required

Get a cached key

```
get<T>(key: string): Promise<T> | T | undefined
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-set)

set

function

required

Set a key in the cache

```
set<T>(key: string, value: T): Promise<void> | void | number | boolean
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-del)

del

function

required

Delete a key from the cache

```
del(key: string): void | Promise<void> | number | boolean
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-flush-all)

flushAll

function

required

Flush all data from cache

```
flushAll(): void | Promise<void>
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#possiblyextendedcachestore)

PossiblyExtendedCacheStore

Extended cache store with batch operations:

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-mget)

mget

function

Get multiple keys at once

```
mget?<T>(keys: string[]): Promise<Record<string, T | undefined>>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-mset)

mset

function

Set multiple keys at once

```
mset?<T>(entries: { key: string; value: T }[]): 
  Promise<void> | void | number | boolean
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#param-mdel)

mdel

function

Delete multiple keys at once

```
mdel?(keys: string[]): void | Promise<void> | number | boolean
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#supporting-types)

Supporting Types

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#waversion)

WAVersion

```
type WAVersion = [number, number, number]

// Example:
const version: WAVersion = [2, 2323, 4]
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#wabrowserdescription)

WABrowserDescription

```
type WABrowserDescription = [string, string, string]

// Example:
const browser: WABrowserDescription = ['Baileys', 'Chrome', '1.0.0']
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#patchedmessagewithrecipientjid)

PatchedMessageWithRecipientJID

```
type PatchedMessageWithRecipientJID = proto.IMessage & {
  recipientJid?: string
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket#example-configuration)

Example Configuration

```
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  makeCacheableSignalKeyStore 
} from '@whiskeysockets/baileys'
import NodeCache from 'node-cache'
import pino from 'pino'

const logger = pino({ level: 'debug' })
const { state, saveCreds } = await useMultiFileAuthState('./auth_info')

// Create cache instances
const msgRetryCounterCache = new NodeCache()
const userDevicesCache = new NodeCache()

const sock = makeWASocket({
  version: [2, 2323, 4],
  logger,
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger)
  },
  browser: ['Baileys', 'Chrome', '1.0.0'],
  
  // Message handling
  getMessage: async (key) => {
    return await getMessageFromDB(key)
  },
  
  // Caching
  msgRetryCounterCache,
  userDevicesCache,
  
  // Group metadata caching
  cachedGroupMetadata: async (jid) => {
    return await getGroupMetadataFromDB(jid)
  },
  
  // Sync settings
  syncFullHistory: true,
  shouldSyncHistoryMessage: (msg) => {
    // Only sync last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    return msg.messageTimestamp > thirtyDaysAgo
  },
  
  // Connection settings
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 60000,
  keepAliveIntervalMs: 30000,
  
  // Advanced
  emitOwnEvents: false,
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true
})

// Save credentials on update
sock.ev.on('creds.update', saveCreds)
```

[

Event Types

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/types/events)[

Contact Types

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact)
