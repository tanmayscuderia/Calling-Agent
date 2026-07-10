# Authentication

Source: https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#overview)

Overview

Baileys uses WhatsApp’s multi-device protocol for authentication. The library manages authentication state through credentials and cryptographic keys that enable secure communication with WhatsApp servers.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#authentication-state)

Authentication State

The authentication state consists of two primary components:

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#1-credentials-authenticationcreds)

1\. Credentials (`AuthenticationCreds`)

Credentials contain identity information and cryptographic material:

```
type AuthenticationCreds = {
  // Signal protocol keys
  readonly signedIdentityKey: KeyPair
  readonly signedPreKey: SignedKeyPair
  readonly registrationId: number
  readonly noiseKey: KeyPair
  readonly pairingEphemeralKeyPair: KeyPair
  
  // Account information
  advSecretKey: string
  me?: Contact
  account?: proto.IADVSignedDeviceIdentity
  
  // Session state
  registered: boolean
  pairingCode: string | undefined
  firstUnuploadedPreKeyId: number
  nextPreKeyId: number
  accountSyncCounter: number
  
  // Settings
  accountSettings: AccountSettings
  processedHistoryMessages: MinimalMessage[]
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#2-signal-keys-signalkeystore)

2\. Signal Keys (`SignalKeyStore`)

The key store manages cryptographic keys used for message encryption:

```
type SignalKeyStore = {
  get<T extends keyof SignalDataTypeMap>(
    type: T, 
    ids: string[]
  ): Promise<{ [id: string]: SignalDataTypeMap[T] }>
  
  set(data: SignalDataSet): Promise<void>
  
  clear?(): Promise<void>
}
```

**Key types stored:**

-   `pre-key` - Pre-keys for establishing sessions
-   `session` - Active session data
-   `sender-key` - Group encryption keys
-   `app-state-sync-key` - App state synchronization keys
-   `identity-key` - Identity verification keys

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#using-multi-file-auth-state)

Using Multi-File Auth State

Baileys provides `useMultiFileAuthState` for file-based credential storage:

```
import { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

const sock = makeWASocket({ 
  auth: state,
  printQRInTerminal: true 
})

// Save credentials when updated
sock.ev.on('creds.update', saveCreds)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#how-it-works)

How It Works

The multi-file auth state:

1.  **Stores credentials** in `creds.json`
2.  **Stores keys** in separate files: `{type}-{id}.json`
3.  **Uses file locks** to prevent race conditions
4.  **Serializes buffers** using `BufferJSON` for safe JSON storage

From `src/Utils/use-multi-file-auth-state.ts:33`:

```
export const useMultiFileAuthState = async (
  folder: string
): Promise<{ 
  state: AuthenticationState; 
  saveCreds: () => Promise<void> 
}> => {
  // Create folder if it doesn't exist
  const folderInfo = await stat(folder).catch(() => {})
  if (!folderInfo) {
    await mkdir(folder, { recursive: true })
  }
  
  // Load or initialize credentials
  const creds: AuthenticationCreds = 
    (await readData('creds.json')) || initAuthCreds()
  
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => { /* ... */ },
        set: async (data) => { /* ... */ }
      }
    },
    saveCreds: async () => writeData(creds, 'creds.json')
  }
}
```

The multi-file auth state is suitable for bots and small-scale applications, but **not recommended for production systems**. Implement a database-backed auth state for production use.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#qr-code-authentication)

QR Code Authentication

Connect by scanning a QR code with WhatsApp:

```
import makeWASocket, { Browsers } from '@whiskeysockets/baileys'

const sock = makeWASocket({
  printQRInTerminal: true,
  browser: Browsers.ubuntu('My App')
})
```

The QR code will be printed to the terminal. Scan it with WhatsApp to authenticate.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#pairing-code-authentication)

Pairing Code Authentication

Connect using a pairing code instead of QR:

```
const sock = makeWASocket({
  printQRInTerminal: false // Must be false for pairing code
})

if (!sock.authState.creds.registered) {
  const phoneNumber = '1234567890' // No +, (), or -
  const code = await sock.requestPairingCode(phoneNumber)
  console.log(`Pairing code: ${code}`)
}
```

The phone number must include the country code and contain only digits (no `+`, `()`, or `-`).

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#initializing-credentials)

Initializing Credentials

When no credentials exist, Baileys generates new ones using `initAuthCreds()`: From `src/Utils/auth-utils.ts:346`:

```
export const initAuthCreds = (): AuthenticationCreds => {
  const identityKey = Curve.generateKeyPair()
  return {
    noiseKey: Curve.generateKeyPair(),
    pairingEphemeralKeyPair: Curve.generateKeyPair(),
    signedIdentityKey: identityKey,
    signedPreKey: signedKeyPair(identityKey, 1),
    registrationId: generateRegistrationId(),
    advSecretKey: randomBytes(32).toString('base64'),
    processedHistoryMessages: [],
    nextPreKeyId: 1,
    firstUnuploadedPreKeyId: 1,
    accountSyncCounter: 0,
    accountSettings: { unarchiveChats: false },
    registered: false,
    pairingCode: undefined,
    lastPropHash: undefined,
    routingInfo: undefined
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#caching-signal-keys)

Caching Signal Keys

For better performance, use `makeCacheableSignalKeyStore` to cache frequently accessed keys:

```
import { makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info')

const sock = makeWASocket({
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger)
  }
})
```

This caches keys in memory (default TTL: 5 minutes) to reduce file I/O operations.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#key-management)

Key Management

**Critical:** When messages are sent/received, Signal sessions update. You **must** save the updated keys (`authState.keys.set()` is called) or messages won’t reach recipients and decryption will fail.

The `useMultiFileAuthState` function automatically handles this, but custom implementations must be careful:

```
// Custom key store implementation
const customKeyStore: SignalKeyStore = {
  async get(type, ids) {
    // Load keys from your database
    return await db.getKeys(type, ids)
  },
  
  async set(data) {
    // CRITICAL: Save all updated keys immediately
    await db.saveKeys(data)
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#account-settings)

Account Settings

Credentials include account-level settings:

```
type AccountSettings = {
  /** Unarchive chats when a new message is received */
  unarchiveChats: boolean
  
  /** Default disappearing message mode for new conversations */
  defaultDisappearingMode?: {
    ephemeralExpiration?: number
    ephemeralSettingTimestamp?: number
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#best-practices)

Best Practices

**Production Implementation Tips:**

1.  **Use a database** - Store credentials and keys in PostgreSQL, MongoDB, or similar
2.  **Encrypt sensitive data** - Encrypt credentials at rest
3.  **Handle key updates** - Always save keys when `authState.keys.set()` is called
4.  **Use caching** - Implement `makeCacheableSignalKeyStore` for performance
5.  **Backup regularly** - Auth state loss requires re-authentication
6.  **Monitor registration** - Track `registered` status to detect logout events

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#bufferjson-serialization)

BufferJSON Serialization

When storing auth state as JSON, use the `BufferJSON` utility for proper Buffer serialization:

```
import { BufferJSON } from '@whiskeysockets/baileys'

// Serializing
const json = JSON.stringify(creds, BufferJSON.replacer)

// Deserializing  
const creds = JSON.parse(json, BufferJSON.reviver)
```

This ensures Buffers and Uint8Arrays are correctly serialized and restored.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication#see-also)

See Also

-   [Connection Lifecycle](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection) - Managing socket connections
-   [Events](https://whiskeysockets-baileys-94.mintlify.app/concepts/events) - Handling authentication events
-   [WhatsApp IDs](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids) - Understanding JID format

[

Quick Start

Previous



](https://whiskeysockets-baileys-94.mintlify.app/quickstart)[

Connection Lifecycle

Next



](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection)
