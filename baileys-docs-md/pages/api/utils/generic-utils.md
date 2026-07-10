# Generic Utilities

Source: https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils

Generic utilities provide common functionality needed throughout Baileys, including Buffer serialization, timing functions, and message key operations.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#bufferjson)

BufferJSON

JSON serialization utilities for handling Buffers and Uint8Arrays.

```
export const BufferJSON = {
  replacer: (k: any, value: any) => any
  reviver: (_: any, value: any) => any
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#replacer)

replacer

Converts Buffers to JSON-serializable objects.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-k)

k

any

The key being stringified

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-value)

value

any

The value being stringified

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-return)

return

any

JSON-serializable representation of the value

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#reviver)

reviver

Converts JSON objects back to Buffers.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param)

\_

any

The key (unused)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-value-1)

value

any

The value being parsed

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-return-1)

return

any

Reconstructed Buffer or original value

**Example:**

```
import { BufferJSON } from '@whiskeysockets/baileys'

// Object with Buffer
const data = {
  name: 'test',
  buffer: Buffer.from('hello world')
}

// Serialize with replacer
const json = JSON.stringify(data, BufferJSON.replacer)
console.log(json)
// {"name":"test","buffer":{"type":"Buffer","data":"aGVsbG8gd29ybGQ="}}

// Deserialize with reviver
const restored = JSON.parse(json, BufferJSON.reviver)
console.log(restored.buffer) // <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
console.log(restored.buffer.toString()) // "hello world"

// Works with nested objects
const nested = {
  user: {
    id: '123',
    keys: {
      publicKey: Buffer.from([1, 2, 3, 4])
    }
  }
}

const jsonNested = JSON.stringify(nested, BufferJSON.replacer)
const restoredNested = JSON.parse(jsonNested, BufferJSON.reviver)
console.log(restoredNested.user.keys.publicKey) // <Buffer 01 02 03 04>
```

**When to use:**

-   When storing authentication state to JSON files
-   For serializing keys and cryptographic data
-   With `useMultiFileAuthState` or custom auth state handlers
-   Any time you need to JSON.stringify/parse objects containing Buffers

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#getkeyauthor)

getKeyAuthor

Extracts the author/sender JID from a message key.

```
export const getKeyAuthor = (
  key: WAMessageKey | undefined | null,
  meId?: string
): string
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-key)

key

WAMessageKey | undefined | null

The message key to analyze

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-me-id)

meId

string

default:"'me'"

Your JID to use if the message is from you

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-return-2)

return

string

The JID of the message author

**Example:**

```
import { getKeyAuthor } from '@whiskeysockets/baileys'

// Message from you
const myMessageKey = {
  remoteJid: '1234567890@s.whatsapp.net',
  fromMe: true,
  id: 'ABC123'
}

const author1 = getKeyAuthor(myMessageKey, 'me@s.whatsapp.net')
console.log(author1) // "me@s.whatsapp.net"

// Message from another user
const theirMessageKey = {
  remoteJid: '1234567890@s.whatsapp.net',
  fromMe: false,
  id: 'DEF456'
}

const author2 = getKeyAuthor(theirMessageKey)
console.log(author2) // "1234567890@s.whatsapp.net"

// Group message
const groupMessageKey = {
  remoteJid: '123456789@g.us',
  fromMe: false,
  participant: '9876543210@s.whatsapp.net',
  id: 'GHI789'
}

const author3 = getKeyAuthor(groupMessageKey)
console.log(author3) // "9876543210@s.whatsapp.net"
```

**When to use:**

-   To identify who sent a message
-   For displaying sender information in UI
-   When processing reactions, poll updates, or event responses
-   Handles group messages with participants correctly

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#unixtimestampseconds)

unixTimestampSeconds

Converts a Date to Unix timestamp in seconds.

```
export const unixTimestampSeconds = (date?: Date): number
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-date)

date

Date

default:"new Date()"

The date to convert (defaults to current time)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-return-3)

return

number

Unix timestamp in seconds

**Example:**

```
import { unixTimestampSeconds } from '@whiskeysockets/baileys'

// Current timestamp
const now = unixTimestampSeconds()
console.log(now) // 1699564800

// Specific date
const specificDate = new Date('2024-01-01T00:00:00Z')
const timestamp = unixTimestampSeconds(specificDate)
console.log(timestamp) // 1704067200

// Use in message
const messageTimestamp = unixTimestampSeconds()
await sock.sendMessage(jid, {
  text: 'Hello',
  timestamp: messageTimestamp
})
```

**When to use:**

-   When creating messages (for messageTimestamp)
-   For comparing message times
-   Any time you need Unix timestamps for WhatsApp protocol

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#delay)

delay

Creates a promise that resolves after a specified time.

```
export const delay = (ms: number): Promise<void>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-ms)

ms

number

required

Milliseconds to delay

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-return-4)

return

Promise<void>

Promise that resolves after the delay

**Example:**

```
import { delay } from '@whiskeysockets/baileys'

// Wait 1 second
await delay(1000)
console.log('1 second has passed')

// Use in message sending
for (const recipient of recipients) {
  await sock.sendMessage(recipient, { text: 'Hello' })
  await delay(500) // Wait 500ms between messages
}

// Retry with delay
async function sendWithRetry(jid, content) {
  for (let i = 0; i < 3; i++) {
    try {
      await sock.sendMessage(jid, content)
      return
    } catch (err) {
      if (i < 2) {
        await delay(1000 * (i + 1)) // Exponential backoff
      }
    }
  }
}
```

**When to use:**

-   To add delays between operations
-   For rate limiting message sending
-   In retry logic with backoff
-   To avoid triggering WhatsApp’s anti-spam

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#generateregistrationid)

generateRegistrationId

Generates a random 14-bit registration ID for Signal protocol.

```
export const generateRegistrationId = (): number
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-return-5)

return

number

Random 14-bit number (0-16383)

**Example:**

```
import { generateRegistrationId } from '@whiskeysockets/baileys'

const regId = generateRegistrationId()
console.log(regId) // Random number between 0 and 16383

// Used internally during auth state initialization
const authState = {
  creds: {
    registrationId: generateRegistrationId(),
    // ... other credentials
  }
}
```

**When to use:**

-   Automatically used when creating new authentication credentials
-   You rarely need to call this directly
-   Part of the Signal protocol setup

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#fetchlatestbaileysversion)

fetchLatestBaileysVersion

Fetches the latest Baileys version from GitHub.

```
export const fetchLatestBaileysVersion = async (
  options?: RequestInit
): Promise<{
  version: WAVersion
  isLatest: boolean
  error?: any
}>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-options)

options

RequestInit

Fetch options (headers, dispatcher, etc.)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-return-6)

return

object

Object containing version array, isLatest flag, and optional error

**Example:**

```
import { fetchLatestBaileysVersion, makeWASocket } from '@whiskeysockets/baileys'

// Fetch and use latest version
const { version, isLatest } = await fetchLatestBaileysVersion()
console.log('Version:', version) // [2, 3000, 1033846690]
console.log('Is latest:', isLatest) // true

const sock = makeWASocket({
  version,
  // ... other options
})

// With custom fetch options
const { version: v2 } = await fetchLatestBaileysVersion({
  headers: {
    'User-Agent': 'MyBot/1.0'
  }
})
```

**When to use:**

-   To ensure your bot uses the latest WhatsApp Web version
-   Recommended for production bots
-   Call once on startup

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#fetchlatestwawebversion)

fetchLatestWaWebVersion

Fetches the latest WhatsApp Web version directly from WhatsApp servers.

```
export const fetchLatestWaWebVersion = async (
  options?: RequestInit
): Promise<{
  version: WAVersion
  isLatest: boolean
  error?: any
}>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-options-1)

options

RequestInit

Fetch options

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-return-7)

return

object

Object containing version array, isLatest flag, and optional error

**Example:**

```
import { fetchLatestWaWebVersion, makeWASocket } from '@whiskeysockets/baileys'

// Fetch latest WA Web version
const { version, isLatest } = await fetchLatestWaWebVersion()
console.log('WA Web Version:', version) // [2, 3000, 1033846690]

const sock = makeWASocket({
  version,
  // ... other options
})
```

**When to use:**

-   Alternative to `fetchLatestBaileysVersion`
-   Gets version directly from WhatsApp instead of Baileys repo
-   Use if you want the absolute latest WA Web version

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#tonumber)

toNumber

Converts Long or number types to JavaScript number.

```
export const toNumber = (
  t: Long | number | null | undefined
): number
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#paramt)

t

Long | number | null | undefined

Value to convert (from protobuf Long type)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils#param-return-8)

return

number

JavaScript number (returns 0 for null/undefined)

**Example:**

```
import { toNumber } from '@whiskeysockets/baileys'

// Convert protobuf Long
const timestamp = message.messageTimestamp // Long type
const timestampNum = toNumber(timestamp)
console.log(timestampNum) // 1699564800

// Handles null/undefined
const nullValue = toNumber(null)
console.log(nullValue) // 0

// Regular numbers pass through
const regularNum = toNumber(12345)
console.log(regularNum) // 12345
```

**When to use:**

-   When working with protobuf message fields
-   To convert timestamps from messages
-   Handles Long type from WAProto definitions

[

Chat & JID Utilities

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils)
