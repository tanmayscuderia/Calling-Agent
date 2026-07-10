# makeWASocket

Source: https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#overview)

Overview

`makeWASocket` is the primary function used to create a WhatsApp Web socket connection. It accepts a configuration object and returns a socket instance with all methods for interacting with the WhatsApp Web API.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#function-signature)

Function Signature

```
const makeWASocket = (config: UserFacingSocketConfig) => WASocket
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#parameters)

Parameters

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-config)

config

UserFacingSocketConfig

required

Configuration object for the socket connection. This is a combination of `Partial<SocketConfig>` with a required `auth` property.Show UserFacingSocketConfig properties

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-auth)

auth

AuthenticationState

required

Authentication state object to maintain the auth state. Use `useMultiFileAuthState()` to create this.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-version)

version

WAVersion

default:"\[2, 3000, 1033846690\]"

WhatsApp Web version to connect with. Array of three numbers `[major, minor, patch]`.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-browser)

browser

WABrowserDescription

default:"Browsers.macOS('Chrome')"

Browser description as a tuple `[OS, Browser, Version]`. Use the `Browsers` constant for predefined configurations.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-wa-web-socket-url)

waWebSocketUrl

string | URL

default:"'wss://web.whatsapp.com/ws/chat'"

The WebSocket URL to connect to WhatsApp.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-connect-timeout-ms)

connectTimeoutMs

number

default:"20000"

Timeout in milliseconds for the connection. Fails the connection if the socket times out.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-default-query-timeout-ms)

defaultQueryTimeoutMs

number | undefined

default:"60000"

Default timeout for queries in milliseconds. Set to `undefined` for no timeout.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-keep-alive-interval-ms)

keepAliveIntervalMs

number

default:"30000"

Ping-pong interval for WebSocket connection in milliseconds.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-logger)

logger

ILogger

default:"logger.child({ class: 'baileys' })"

Logger instance for debugging and logging.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-agent)

agent

Agent

HTTPS proxy agent for the WebSocket connection.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-fetch-agent)

fetchAgent

Agent

Agent used for fetch requests when uploading/downloading media.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-emit-own-events)

emitOwnEvents

boolean

default:"true"

Whether events should be emitted for actions done by this socket connection.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-custom-upload-hosts)

customUploadHosts

MediaConnInfo\['hosts'\]

default:"\[\]"

Custom upload hosts to upload media to.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-retry-request-delay-ms)

retryRequestDelayMs

number

default:"250"

Time to wait between sending new retry requests in milliseconds.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-max-msg-retry-count)

maxMsgRetryCount

number

default:"5"

Maximum retry count for failed messages.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-qr-timeout)

qrTimeout

number

Time to wait for the generation of the next QR code in milliseconds.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-should-sync-history-message)

shouldSyncHistoryMessage

(msg: proto.Message.IHistorySyncNotification) => boolean

Function to manage history processing. Default syncs everything except FULL sync type.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-transaction-opts)

transactionOpts

TransactionCapabilityOptions

Transaction capability options for SignalKeyStore.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-mark-online-on-connect)

markOnlineOnConnect

boolean

default:"true"

Marks the client as online whenever the socket successfully connects.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-country-code)

countryCode

string

default:"'US'"

Alphanumeric country code (e.g., USA -> US) for the number used.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-media-cache)

mediaCache

CacheStore

Cache to store media, so it doesn’t have to be re-uploaded.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-msg-retry-counter-cache)

msgRetryCounterCache

CacheStore

Map to store retry counts for failed messages; used to determine whether to retry a message.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-user-devices-cache)

userDevicesCache

PossiblyExtendedCacheStore

Cache to store a user’s device list.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-call-offer-cache)

callOfferCache

CacheStore

Cache to store call offers.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-placeholder-resend-cache)

placeholderResendCache

CacheStore

Cache to track placeholder resends.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-link-preview-image-thumbnail-width)

linkPreviewImageThumbnailWidth

number

default:"192"

Width for link preview images in pixels.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-sync-full-history)

syncFullHistory

boolean

default:"true"

Whether Baileys should ask the phone for full history (received async).

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-fire-init-queries)

fireInitQueries

boolean

default:"true"

Whether Baileys should fire init queries automatically.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-generate-high-quality-link-preview)

generateHighQualityLinkPreview

boolean

default:"false"

Generate high quality link preview by uploading the jpegThumbnail to WhatsApp.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-enable-auto-session-recreation)

enableAutoSessionRecreation

boolean

default:"true"

Enable automatic session recreation for failed messages.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-enable-recent-message-cache)

enableRecentMessageCache

boolean

default:"true"

Enable recent message caching for retry handling.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-should-ignore-jid)

shouldIgnoreJid

(jid: string) => boolean | undefined

default:"() => false"

Function that returns if a JID should be ignored. No event for that JID will be triggered and messages from that JID will not be decrypted.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-patch-message-before-sending)

patchMessageBeforeSending

Function

default:"msg => msg"

Optionally patch the message before sending out.

```
(msg: proto.IMessage, recipientJids?: string[]) => 
  Promise<PatchedMessageWithRecipientJID[] | PatchedMessageWithRecipientJID> |
  PatchedMessageWithRecipientJID[] | PatchedMessageWithRecipientJID
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-app-state-mac-verification)

appStateMacVerification

object

default:"{ patch: false, snapshot: false }"

Verify app state MACs.

Show properties

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-patch)

patch

boolean

default:"false"

Verify patch MACs.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-snapshot)

snapshot

boolean

default:"false"

Verify snapshot MACs.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-options)

options

RequestInit

default:"{}"

Options for HTTP fetch requests.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-get-message)

getMessage

(key: WAMessageKey) => Promise<proto.IMessage | undefined>

default:"async () => undefined"

Fetch a message from your store. Implement this so that messages that failed to send can be retried. Solves the “this message can take a while” issue.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-cached-group-metadata)

cachedGroupMetadata

(jid: string) => Promise<GroupMetadata | undefined>

default:"async () => undefined"

Cached group metadata function to prevent redundant requests to WhatsApp and speed up message sending.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-make-signal-repository)

makeSignalRepository

Function

default:"makeLibSignalRepository"

Function to create signal repository.

```
(auth: SignalAuthState, logger: ILogger, 
 pnToLIDFunc?: (jids: string[]) => Promise<LIDMapping[] | undefined>) => 
  SignalRepositoryWithLIDStore
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#return-value)

Return Value

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#param-sock)

sock

WASocket

Returns a socket instance with all methods for interacting with the WhatsApp Web API, including:

-   Message sending and receiving
-   Group management
-   Contact management
-   Media handling
-   Event listeners
-   And more

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#basic-example)

Basic Example

```
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true
})

// Listen for connection updates
sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update
  if(connection === 'close') {
    console.log('Connection closed')
  } else if(connection === 'open') {
    console.log('Connection opened')
  }
})

// Save credentials when updated
sock.ev.on('creds.update', saveCreds)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#advanced-example-with-caching)

Advanced Example with Caching

```
import makeWASocket, { 
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys'
import NodeCache from '@cacheable/node-cache'
import P from 'pino'

const logger = P({ level: 'trace' })
const msgRetryCounterCache = new NodeCache()

const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
  version,
  logger,
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger),
  },
  msgRetryCounterCache,
  generateHighQualityLinkPreview: true,
  getMessage: async (key) => {
    // Implement message retrieval from your store
    return undefined
  }
})

sock.ev.on('creds.update', saveCreds)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#pairing-code-example)

Pairing Code Example

```
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info')

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: false // Must be false for pairing code
})

if (!sock.authState.creds.registered) {
  const phoneNumber = '1234567890' // Without + or () or -
  const code = await sock.requestPairingCode(phoneNumber)
  console.log(`Pairing code: ${code}`)
}

sock.ev.on('creds.update', saveCreds)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#implementation-details)

Implementation Details

The `makeWASocket` function internally:

1.  Merges the provided config with `DEFAULT_CONNECTION_CONFIG`
2.  Creates a socket through the `makeCommunitiesSocket` layer
3.  Returns the fully configured socket instance

```
const makeWASocket = (config: UserFacingSocketConfig) => {
  const newConfig = {
    ...DEFAULT_CONNECTION_CONFIG,
    ...config
  }
  return makeCommunitiesSocket(newConfig)
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket#see-also)

See Also

-   [SocketConfig](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config) - Complete socket configuration reference
-   [Browsers](https://whiskeysockets-baileys-94.mintlify.app/api/browsers) - Browser configuration options
-   [Events](https://baileys.whiskeysockets.io/types/BaileysEventMap.html) - Available socket events

[

SocketConfig

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config)
