# Chat & JID Utilities

Source: https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils

JID (Jabber ID) utilities help you work with WhatsApp’s user and chat identifiers, validate them, and extract information from them.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#jidnormalizeduser)

jidNormalizedUser

Normalizes a JID to use the standard WhatsApp server format.

```
export const jidNormalizedUser = (jid: string | undefined): string
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-jid)

jid

string | undefined

The JID to normalize

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-return)

return

string

Normalized JID (converts ‘c.us’ to ‘s.whatsapp.net’)

**Example:**

```
import { jidNormalizedUser } from '@whiskeysockets/baileys'

const jid1 = '1234567890@c.us'
const normalized1 = jidNormalizedUser(jid1)
console.log(normalized1) // "1234567890@s.whatsapp.net"

const jid2 = '1234567890@s.whatsapp.net'
const normalized2 = jidNormalizedUser(jid2)
console.log(normalized2) // "1234567890@s.whatsapp.net"

const groupJid = '123456789@g.us'
const normalizedGroup = jidNormalizedUser(groupJid)
console.log(normalizedGroup) // "123456789@g.us" (unchanged)
```

**When to use:**

-   Before comparing JIDs
-   When storing JIDs in databases
-   To ensure consistent JID format across your application

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#jiddecode)

jidDecode

Decodes a JID into its component parts.

```
export const jidDecode = (jid: string | undefined): FullJid | undefined
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-jid-1)

jid

string | undefined

The JID to decode

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-return-1)

return

FullJid | undefined

Object containing user, server, device, and domainType, or undefined if invalid

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#fulljid-type)

FullJid Type

```
type FullJid = {
  user: string
  server: JidServer
  device?: number
  domainType?: number
}
```

**Example:**

```
import { jidDecode } from '@whiskeysockets/baileys'

// Regular user
const decoded1 = jidDecode('1234567890@s.whatsapp.net')
console.log(decoded1)
// {
//   user: '1234567890',
//   server: 's.whatsapp.net',
//   domainType: 0
// }

// User with device ID
const decoded2 = jidDecode('1234567890:5@s.whatsapp.net')
console.log(decoded2)
// {
//   user: '1234567890',
//   server: 's.whatsapp.net',
//   device: 5,
//   domainType: 0
// }

// Group
const decoded3 = jidDecode('123456789@g.us')
console.log(decoded3)
// {
//   user: '123456789',
//   server: 'g.us',
//   domainType: 0
// }

// LID (Linked ID)
const decoded4 = jidDecode('abcd1234@lid')
console.log(decoded4)
// {
//   user: 'abcd1234',
//   server: 'lid',
//   domainType: 1
// }
```

**When to use:**

-   To extract the user ID from a JID
-   To determine the server type
-   To get device information from multi-device JIDs

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#jidencode)

jidEncode

Encodes JID components into a complete JID string.

```
export const jidEncode = (
  user: string | number | null,
  server: JidServer,
  device?: number,
  agent?: number
): string
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-user)

user

string | number | null

required

The user identifier

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-server)

server

JidServer

required

Server type: ‘c.us’, ‘g.us’, ‘s.whatsapp.net’, ‘broadcast’, ‘lid’, etc.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-device)

device

number

Device ID for multi-device

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-agent)

agent

number

Agent ID

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-return-2)

return

string

Complete JID string

**Example:**

```
import { jidEncode } from '@whiskeysockets/baileys'

// Regular user
const jid1 = jidEncode('1234567890', 's.whatsapp.net')
console.log(jid1) // "1234567890@s.whatsapp.net"

// Group
const jid2 = jidEncode('123456789', 'g.us')
console.log(jid2) // "123456789@g.us"

// With device ID
const jid3 = jidEncode('1234567890', 's.whatsapp.net', 5)
console.log(jid3) // "1234567890:5@s.whatsapp.net"

// Status broadcast
const jid4 = jidEncode('status', 'broadcast')
console.log(jid4) // "status@broadcast"
```

**When to use:**

-   To construct JIDs programmatically
-   When building multi-device JIDs
-   For creating group or broadcast JIDs

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#isjidgroup)

isJidGroup

Checks if a JID represents a group.

```
export const isJidGroup = (jid: string | undefined): boolean
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-jid-2)

jid

string | undefined

The JID to check

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-return-3)

return

boolean

True if the JID is a group (@g.us)

**Example:**

```
import { isJidGroup } from '@whiskeysockets/baileys'

const groupJid = '123456789@g.us'
console.log(isJidGroup(groupJid)) // true

const userJid = '1234567890@s.whatsapp.net'
console.log(isJidGroup(userJid)) // false

const broadcastJid = 'status@broadcast'
console.log(isJidGroup(broadcastJid)) // false
```

**When to use:**

-   To determine if a message is from a group
-   Before performing group-specific operations
-   For routing logic based on chat type

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#isjidbroadcast)

isJidBroadcast

Checks if a JID represents a broadcast list.

```
export const isJidBroadcast = (jid: string | undefined): boolean
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-jid-3)

jid

string | undefined

The JID to check

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-return-4)

return

boolean

True if the JID is a broadcast (@broadcast)

**Example:**

```
import { isJidBroadcast } from '@whiskeysockets/baileys'

const broadcastJid = 'status@broadcast'
console.log(isJidBroadcast(broadcastJid)) // true

const userJid = '1234567890@s.whatsapp.net'
console.log(isJidBroadcast(userJid)) // false
```

**When to use:**

-   To identify broadcast messages
-   For handling status updates
-   To filter broadcast-specific events

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#isjidstatusbroadcast)

isJidStatusBroadcast

Checks if a JID is specifically the status broadcast.

```
export const isJidStatusBroadcast = (jid: string): boolean
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-jid-4)

jid

string

required

The JID to check

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-return-5)

return

boolean

True if the JID is exactly ‘status@broadcast’

**Example:**

```
import { isJidStatusBroadcast } from '@whiskeysockets/baileys'

const statusJid = 'status@broadcast'
console.log(isJidStatusBroadcast(statusJid)) // true

const userJid = '1234567890@s.whatsapp.net'
console.log(isJidStatusBroadcast(userJid)) // false
```

**When to use:**

-   To identify WhatsApp status messages
-   For filtering status updates
-   Different from regular broadcasts

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#isjidnewsletter)

isJidNewsletter

Checks if a JID represents a newsletter/channel.

```
export const isJidNewsletter = (jid: string | undefined): boolean
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-jid-5)

jid

string | undefined

The JID to check

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-return-6)

return

boolean

True if the JID is a newsletter (@newsletter)

**Example:**

```
import { isJidNewsletter } from '@whiskeysockets/baileys'

const newsletterJid = '123456789@newsletter'
console.log(isJidNewsletter(newsletterJid)) // true

const groupJid = '123456789@g.us'
console.log(isJidNewsletter(groupJid)) // false
```

**When to use:**

-   To identify newsletter/channel messages
-   Before performing newsletter-specific operations
-   Newsletter messages use different upload mechanisms

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#isliduser)

isLidUser

Checks if a JID is a LID (Linked ID) user.

```
export const isLidUser = (jid: string | undefined): boolean
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-jid-6)

jid

string | undefined

The JID to check

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-return-7)

return

boolean

True if the JID ends with ‘@lid’

**Example:**

```
import { isLidUser } from '@whiskeysockets/baileys'

const lidJid = 'abcd1234@lid'
console.log(isLidUser(lidJid)) // true

const regularJid = '1234567890@s.whatsapp.net'
console.log(isLidUser(regularJid)) // false
```

**When to use:**

-   To identify linked device users
-   For handling privacy-focused identifiers
-   LIDs are used for enhanced privacy in some regions

* * *

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#arejidssameuser)

areJidsSameUser

Checks if two JIDs represent the same user (ignoring device ID).

```
export const areJidsSameUser = (
  jid1: string | undefined,
  jid2: string | undefined
): boolean
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-jid1)

jid1

string | undefined

First JID to compare

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-jid2)

jid2

string | undefined

Second JID to compare

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/utils/chat-utils#param-return-8)

return

boolean

True if both JIDs have the same user ID

**Example:**

```
import { areJidsSameUser } from '@whiskeysockets/baileys'

// Same user, different devices
const jid1 = '1234567890@s.whatsapp.net'
const jid2 = '1234567890:5@s.whatsapp.net'
console.log(areJidsSameUser(jid1, jid2)) // true

// Different users
const jid3 = '1234567890@s.whatsapp.net'
const jid4 = '9876543210@s.whatsapp.net'
console.log(areJidsSameUser(jid3, jid4)) // false

// Same user, different server formats
const jid5 = '1234567890@c.us'
const jid6 = '1234567890@s.whatsapp.net'
console.log(areJidsSameUser(jid5, jid6)) // true
```

**When to use:**

-   To compare users across different devices
-   For deduplication
-   When checking message participants

[

Media Utilities

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/utils/media-utils)[

Generic Utilities

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/utils/generic-utils)
