# Connection Lifecycle

Source: https://whiskeysockets-baileys-94.mintlify.app/concepts/connection

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#overview)

Overview

Baileys manages a WebSocket connection to WhatsApp servers. Understanding the connection lifecycle, disconnect reasons, and reconnection strategies is essential for building reliable applications.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#connection-states)

Connection States

The connection can be in one of three states:

```
type WAConnectionState = 'open' | 'connecting' | 'close'
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#connection-state-object)

Connection State Object

From `src/Types/State.ts:17`:

```
type ConnectionState = {
  /** Connection is now open, connecting or closed */
  connection: WAConnectionState
  
  /** The error that caused the connection to close */
  lastDisconnect?: {
    error: Boom | Error | undefined
    date: Date
  }
  
  /** Is this a new login */
  isNewLogin?: boolean
  
  /** The current QR code */
  qr?: string
  
  /** Has the device received all pending notifications */
  receivedPendingNotifications?: boolean
  
  /** If the client is shown as an active, online client */
  isOnline?: boolean
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#disconnect-reasons)

Disconnect Reasons

From `src/Types/index.ts:27`:

```
enum DisconnectReason {
  connectionClosed = 428,
  connectionLost = 408,
  connectionReplaced = 440,
  timedOut = 408,
  loggedOut = 401,
  badSession = 500,
  restartRequired = 515,
  multideviceMismatch = 411,
  forbidden = 403,
  unavailableService = 503
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#understanding-each-reason)

Understanding Each Reason

-   **`loggedOut` (401)** - User logged out from WhatsApp. Do NOT reconnect.
-   **`connectionClosed` (428)** - Normal connection closure. Safe to reconnect.
-   **`connectionLost` (408)** - Network issue or timeout. Reconnect.
-   **`connectionReplaced` (440)** - Another device took over. Reconnect carefully.
-   **`restartRequired` (515)** - Server requests restart. Reconnect immediately.
-   **`timedOut` (408)** - Connection attempt timed out. Retry.
-   **`badSession` (500)** - Invalid session data. May require re-authentication.
-   **`multideviceMismatch` (411)** - Multi-device protocol mismatch. Update library.
-   **`forbidden` (403)** - Access denied. Check credentials.
-   **`unavailableService` (503)** - WhatsApp service temporarily unavailable.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#handling-connection-updates)

Handling Connection Updates

Listen to `connection.update` events to track connection state:

```
import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

const sock = makeWASocket({ /* config */ })

sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect, qr } = update
  
  if (connection === 'close') {
    const shouldReconnect = 
      (lastDisconnect?.error as Boom)?.output?.statusCode 
        !== DisconnectReason.loggedOut
    
    console.log(
      'Connection closed:', 
      lastDisconnect?.error, 
      'Reconnecting:', 
      shouldReconnect
    )
    
    if (shouldReconnect) {
      connectToWhatsApp() // Reconnect
    }
  } else if (connection === 'open') {
    console.log('Connection opened')
  } else if (connection === 'connecting') {
    console.log('Connecting...')
  }
  
  if (qr) {
    console.log('QR Code:', qr)
    // Display QR code to user
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#complete-connection-example)

Complete Connection Example

From `Example/example.ts:40`:

```
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState 
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(
    'auth_info_baileys'
  )
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })
  
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    
    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)
        ?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      
      console.log(
        'Connection closed due to', 
        lastDisconnect?.error, 
        'reconnecting', 
        shouldReconnect
      )
      
      // Reconnect if not logged out
      if (shouldReconnect) {
        connectToWhatsApp()
      } else {
        console.log('Connection closed. You are logged out.')
      }
    } else if (connection === 'open') {
      console.log('Opened connection')
    }
  })
  
  // Save credentials when updated
  sock.ev.on('creds.update', saveCreds)
  
  return sock
}

connectToWhatsApp()
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#reconnection-strategies)

Reconnection Strategies

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#basic-reconnection)

Basic Reconnection

```
function reconnect() {
  setTimeout(() => {
    connectToWhatsApp()
  }, 3000) // Wait 3 seconds before reconnecting
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#exponential-backoff)

Exponential Backoff

```
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
const BASE_DELAY = 1000 // 1 second

function reconnectWithBackoff() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log('Max reconnection attempts reached')
    return
  }
  
  const delay = BASE_DELAY * Math.pow(2, reconnectAttempts)
  reconnectAttempts++
  
  console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)
  
  setTimeout(() => {
    connectToWhatsApp()
  }, delay)
}

sock.ev.on('connection.update', (update) => {
  if (update.connection === 'close') {
    reconnectWithBackoff()
  } else if (update.connection === 'open') {
    reconnectAttempts = 0 // Reset on successful connection
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#smart-reconnection)

Smart Reconnection

```
function shouldReconnect(
  statusCode: number | undefined
): boolean {
  // Never reconnect on logout
  if (statusCode === DisconnectReason.loggedOut) {
    return false
  }
  
  // Don't reconnect on bad session - may need re-auth
  if (statusCode === DisconnectReason.badSession) {
    console.log('Bad session - clearing auth state')
    // Clear auth state and restart
    return false
  }
  
  // Reconnect on all other errors
  return true
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#qr-code-generation)

QR Code Generation

When connecting for the first time, a QR code is generated:

```
sock.ev.on('connection.update', (update) => {
  const { qr } = update
  
  if (qr) {
    // Option 1: Print to terminal
    console.log('Scan this QR code:', qr)
    
    // Option 2: Generate QR code image
    // Use a library like 'qrcode' to generate an image
    QRCode.toDataURL(qr, (err, url) => {
      // Display url as image
    })
  }
})
```

Set `printQRInTerminal: true` in socket config to automatically print the QR code to the terminal.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#pairing-code-flow)

Pairing Code Flow

From `Example/example.ts:88`:

```
const usePairingCode = true

sock.ev.on('connection.update', async (update) => {
  const { qr } = update
  
  if (qr && usePairingCode && !sock.authState.creds.registered) {
    const phoneNumber = await question('Enter your phone number:\n')
    const code = await sock.requestPairingCode(phoneNumber)
    console.log(`Pairing code: ${code}`)
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#connection-configuration)

Connection Configuration

Important socket configuration options for connection management:

```
const sock = makeWASocket({
  // Browser identification
  browser: Browsers.ubuntu('My App'),
  
  // Print QR to terminal
  printQRInTerminal: true,
  
  // Receive full message history
  syncFullHistory: true,
  
  // Mark as online when connecting
  markOnlineOnConnect: true, // Set false for notifications
  
  // Connection retry settings
  connectTimeoutMs: 60_000,
  
  // Custom logger
  logger: pino({ level: 'info' })
})
```

If `markOnlineOnConnect` is `true`, your phone won’t receive notifications while Baileys is connected. Set to `false` if you want to receive notifications on your phone.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#monitoring-connection-health)

Monitoring Connection Health

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#check-if-connected)

Check if Connected

```
function isConnected(sock: WASocket): boolean {
  return sock.ws?.readyState === WebSocket.OPEN
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#presence-updates)

Presence Updates

```
// Send presence to indicate online status
await sock.sendPresenceUpdate('available', jid)

// Mark as unavailable to receive notifications
await sock.sendPresenceUpdate('unavailable')
```

If a desktop client is active, WhatsApp doesn’t send push notifications to the device. Mark your Baileys client as unavailable to receive notifications.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#received-pending-notifications)

Received Pending Notifications

The `receivedPendingNotifications` flag indicates when all offline messages have been received:

```
sock.ev.on('connection.update', (update) => {
  if (update.receivedPendingNotifications) {
    console.log('All pending notifications received')
    // Safe to proceed with operations
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#history-synchronization)

History Synchronization

On first connection, WhatsApp sends message history:

```
sock.ev.on('messaging-history.set', ({ 
  chats, 
  contacts, 
  messages, 
  isLatest 
}) => {
  console.log(`Received ${messages.length} messages`)
  console.log(`Received ${chats.length} chats`)
  console.log(`Received ${contacts.length} contacts`)
  console.log('Is latest history:', isLatest)
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#best-practices)

Best Practices

**Connection Management Tips:**

1.  **Always check `loggedOut`** - Never reconnect when user logged out
2.  **Implement backoff** - Use exponential backoff for reconnection attempts
3.  **Save credentials** - Listen to `creds.update` and save immediately
4.  **Handle QR expiry** - QR codes expire; generate new ones
5.  **Monitor health** - Track connection state and last disconnect reason
6.  **Graceful shutdown** - Properly close the socket before exiting
7.  **Log errors** - Log `lastDisconnect.error` for debugging

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#graceful-shutdown)

Graceful Shutdown

```
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  
  // Close the socket
  sock.ws?.close()
  
  // Save any pending data
  await saveCreds()
  
  process.exit(0)
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection#see-also)

See Also

-   [Authentication](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication) - Managing auth state
-   [Events](https://whiskeysockets-baileys-94.mintlify.app/concepts/events) - Connection-related events
-   [WhatsApp IDs](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids) - Understanding JID format

[

Authentication

Previous



](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication)[

Event System

Next



](https://whiskeysockets-baileys-94.mintlify.app/concepts/events)
