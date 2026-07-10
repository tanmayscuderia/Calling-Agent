# WhatsApp IDs (JIDs)

Source: https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#overview)

Overview

WhatsApp uses a special ID format called JID (Jabber ID) to identify users, groups, broadcast lists, and other entities. Understanding JID structure is essential for working with Baileys.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#jid-format)

JID Format

A JID consists of three parts: `user@server[:device]`

-   **user** - The unique identifier (phone number for users, timestamp for groups)
-   **server** - The server domain
-   **device** - Optional device ID for multi-device protocol

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#server-types)

Server Types

From `src/WABinary/jid-utils.ts:8`:

```
type JidServer =
  | 'c.us'           // User (legacy)
  | 'g.us'           // Group
  | 'broadcast'      // Broadcast list
  | 's.whatsapp.net' // User (new)
  | 'call'           // Call
  | 'lid'            // LID (Logged In Device)
  | 'newsletter'     // Newsletter/Channel
  | 'bot'            // Bot
  | 'hosted'         // Hosted PN
  | 'hosted.lid'     // Hosted LID
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#user-jids)

User JIDs

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#standard-user-format)

Standard User Format

```
[country_code][phone_number]@s.whatsapp.net
```

**Examples:**

-   US number: `19999999999@s.whatsapp.net`
-   UK number: `447777777777@s.whatsapp.net`
-   India: `919876543210@s.whatsapp.net`

User JIDs do **not** include `+`, `()`, or `-`. Only digits followed by `@s.whatsapp.net`.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#legacy-user-format)

Legacy User Format

```
[country_code][phone_number]@c.us
```

This format is deprecated but still encountered in some contexts.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#group-jids)

Group JIDs

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#format)

Format

```
[timestamp]-[creator_suffix]@g.us
```

**Example:** `123456789-1234567890@g.us`

-   The first number is typically a Unix timestamp of group creation
-   The second number identifies the group creator

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#broadcast-list-jids)

Broadcast List JIDs

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#format-2)

Format

```
[timestamp]@broadcast
```

**Example:** `1234567890@broadcast`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#stories/status)

Stories/Status

From `src/WABinary/jid-utils.ts:5`:

```
const STORIES_JID = 'status@broadcast'
```

Stories use the special JID `status@broadcast`.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#newsletter-jids)

Newsletter JIDs

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#format-3)

Format

```
[id]@newsletter
```

Newsletters (WhatsApp Channels) use the `@newsletter` server.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#jid-utilities)

JID Utilities

Baileys provides utility functions for working with JIDs.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#jiddecode)

jidDecode

Parse a JID into its components: From `src/WABinary/jid-utils.ts:55`:

```
function jidDecode(jid: string | undefined): FullJid | undefined

type FullJid = {
  server: JidServer
  user: string
  domainType?: number
  device?: number
}
```

**Example:**

```
import { jidDecode } from '@whiskeysockets/baileys'

const decoded = jidDecode('19999999999@s.whatsapp.net')
// {
//   server: 's.whatsapp.net',
//   user: '19999999999',
//   domainType: 0,
//   device: undefined
// }

const groupDecoded = jidDecode('123456789-1234567890@g.us')
// {
//   server: 'g.us',
//   user: '123456789-1234567890',
//   domainType: 0
// }
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#jidencode)

jidEncode

Construct a JID from components: From `src/WABinary/jid-utils.ts:51`:

```
function jidEncode(
  user: string | number | null,
  server: JidServer,
  device?: number,
  agent?: number
): string
```

**Example:**

```
import { jidEncode } from '@whiskeysockets/baileys'

const userJid = jidEncode('19999999999', 's.whatsapp.net')
// '19999999999@s.whatsapp.net'

const groupJid = jidEncode('123456789-1234567890', 'g.us')
// '123456789-1234567890@g.us'

// With device ID
const deviceJid = jidEncode('19999999999', 's.whatsapp.net', 0)
// '19999999999:0@s.whatsapp.net'
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#jidnormalizeduser)

jidNormalizedUser

Normalize a user JID (convert `c.us` to `s.whatsapp.net`): From `src/WABinary/jid-utils.ts:113`:

```
function jidNormalizedUser(jid: string | undefined): string
```

**Example:**

```
import { jidNormalizedUser } from '@whiskeysockets/baileys'

const normalized = jidNormalizedUser('19999999999@c.us')
// '19999999999@s.whatsapp.net'

const alreadyNormal = jidNormalizedUser('19999999999@s.whatsapp.net')
// '19999999999@s.whatsapp.net'
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#jid-type-checking)

JID Type Checking

Baileys provides functions to check JID types: From `src/WABinary/jid-utils.ts:87-108`:

```
// Check if same user
function areJidsSameUser(
  jid1: string | undefined,
  jid2: string | undefined
): boolean

// Check JID types
function isJidGroup(jid: string | undefined): boolean
function isJidBroadcast(jid: string | undefined): boolean
function isJidStatusBroadcast(jid: string): boolean
function isJidNewsletter(jid: string | undefined): boolean
function isPnUser(jid: string | undefined): boolean
function isLidUser(jid: string | undefined): boolean
function isJidBot(jid: string | undefined): boolean
function isJidMetaAI(jid: string | undefined): boolean
```

**Examples:**

```
import { 
  isJidGroup, 
  isJidBroadcast,
  areJidsSameUser,
  isJidStatusBroadcast
} from '@whiskeysockets/baileys'

// Check if group
if (isJidGroup('123456789@g.us')) {
  console.log('This is a group')
}

// Check if broadcast
if (isJidBroadcast('1234567890@broadcast')) {
  console.log('This is a broadcast list')
}

// Check if status/story
if (isJidStatusBroadcast('status@broadcast')) {
  console.log('This is a status update')
}

// Compare users (ignoring device ID)
if (areJidsSameUser(
  '19999999999:0@s.whatsapp.net',
  '19999999999@s.whatsapp.net'
)) {
  console.log('Same user, different device')
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#special-jids)

Special JIDs

From `src/WABinary/jid-utils.ts:1-6`:

```
const S_WHATSAPP_NET = '@s.whatsapp.net'
const OFFICIAL_BIZ_JID = '16505361212@c.us'
const SERVER_JID = 'server@c.us'
const PSA_WID = '0@c.us'
const STORIES_JID = 'status@broadcast'
const META_AI_JID = '13135550002@c.us'
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#meta-ai-bot)

Meta AI Bot

```
import { isJidBot, META_AI_JID } from '@whiskeysockets/baileys'

if (isJidBot(META_AI_JID)) {
  console.log('This is Meta AI')
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#multi-device-protocol)

Multi-Device Protocol

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#device-ids)

Device IDs

In multi-device protocol, JIDs can include a device ID:

```
19999999999:0@s.whatsapp.net
```

-   `:0` is the primary device (phone)
-   `:1`, `:2`, etc. are companion devices

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#transferring-device-id)

Transferring Device ID

From `src/WABinary/jid-utils.ts:123`:

```
function transferDevice(fromJid: string, toJid: string): string
```

**Example:**

```
import { transferDevice } from '@whiskeysockets/baileys'

const newJid = transferDevice(
  '19999999999:1@s.whatsapp.net',  // From device 1
  '17777777777@s.whatsapp.net'      // To another user
)
// '17777777777:1@s.whatsapp.net'
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#lid-logged-in-device)

LID (Logged In Device)

LID is a privacy-focused identifier used in some contexts:

```
[lid_id]@lid
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#lid-utilities)

LID Utilities

```
import { isLidUser } from '@whiskeysockets/baileys'

if (isLidUser('abc123@lid')) {
  console.log('This is a LID user')
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#practical-examples)

Practical Examples

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#sending-to-a-user)

Sending to a User

```
const phoneNumber = '19999999999'
const jid = `${phoneNumber}@s.whatsapp.net`

await sock.sendMessage(jid, { text: 'Hello!' })
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#extracting-phone-number)

Extracting Phone Number

```
import { jidDecode } from '@whiskeysockets/baileys'

function getPhoneNumber(jid: string): string | undefined {
  const decoded = jidDecode(jid)
  return decoded?.server === 's.whatsapp.net' 
    ? decoded.user 
    : undefined
}

const phone = getPhoneNumber('19999999999@s.whatsapp.net')
// '19999999999'
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#validating-group-jid)

Validating Group JID

```
import { isJidGroup } from '@whiskeysockets/baileys'

function isValidGroupJid(jid: string): boolean {
  return isJidGroup(jid) && jid.includes('-')
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#filtering-message-types)

Filtering Message Types

```
import { isJidNewsletter, isJidGroup } from '@whiskeysockets/baileys'

sock.ev.on('messages.upsert', ({ messages }) => {
  for (const msg of messages) {
    const jid = msg.key.remoteJid!
    
    if (isJidGroup(jid)) {
      console.log('Group message')
    } else if (isJidNewsletter(jid)) {
      console.log('Newsletter message')
    } else {
      console.log('Private message')
    }
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#jid-domain-types)

JID Domain Types

From `src/WABinary/jid-utils.ts:20`:

```
enum WAJIDDomains {
  WHATSAPP = 0,
  LID = 1,
  HOSTED = 128,
  HOSTED_LID = 129
}
```

Domain types are used internally to route messages to the correct server infrastructure.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#best-practices)

Best Practices

**JID Handling Tips:**

1.  **Always validate** - Use type checking functions before operations
2.  **Normalize user JIDs** - Use `jidNormalizedUser` for consistency
3.  **Handle device IDs** - Use `areJidsSameUser` to compare users across devices
4.  **Never hardcode formats** - Use `jidEncode` to construct JIDs
5.  **Check types** - Use `isJidGroup`, `isJidBroadcast`, etc. before group operations
6.  **Store normalized JIDs** - Always normalize before storing in database

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#common-mistakes)

Common Mistakes

**Avoid These Mistakes:**❌ Including `+` in JIDs: `+19999999999@s.whatsapp.net`✅ Use digits only: `19999999999@s.whatsapp.net`❌ Mixing server types: Using `c.us` for new messages✅ Use `s.whatsapp.net` for users: `jidNormalizedUser(jid)`❌ String concatenation: `phoneNumber + '@s.whatsapp.net'`✅ Use `jidEncode`: `jidEncode(phoneNumber, 's.whatsapp.net')`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids#see-also)

See Also

-   [Events](https://whiskeysockets-baileys-94.mintlify.app/concepts/events) - Working with message keys
-   [Message Store](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store) - Indexing messages by JID
-   [Connection](https://whiskeysockets-baileys-94.mintlify.app/concepts/connection) - User identification

[

Message Store

Previous



](https://whiskeysockets-baileys-94.mintlify.app/concepts/message-store)[

Connecting with QR Code

Next



](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code)
