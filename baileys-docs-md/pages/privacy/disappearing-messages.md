# Disappearing Messages

Source: https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#overview)

Overview

Disappearing messages automatically delete after a set period. You can enable this feature for entire chats or send individual messages that disappear.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#ephemeral-durations)

Ephemeral Durations

Supported time periods for disappearing messages:

| Time | Seconds |
| --- | --- |
| Remove | 0 |
| 24h | 86,400 |
| 7d | 604,800 |
| 90d | 7,776,000 |

You need to pass in **seconds**, not milliseconds. The default is 7 days.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#wa_default_ephemeral-constant)

WA\_DEFAULT\_EPHEMERAL Constant

Baileys provides a constant for the default 7-day duration:

```
import { WA_DEFAULT_EPHEMERAL } from '@whiskeysockets/baileys'

// WA_DEFAULT_EPHEMERAL = 7 * 24 * 60 * 60 = 604,800 seconds
```

Defined in `src/Defaults/index.ts:23`:

```
export const WA_DEFAULT_EPHEMERAL = 7 * 24 * 60 * 60
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#enable-disappearing-messages-in-a-chat)

Enable Disappearing Messages in a Chat

Turn on disappearing messages for all future messages in a chat:

```
// Turn on disappearing messages (7 days)
await sock.sendMessage(
    jid,
    { disappearingMessagesInChat: WA_DEFAULT_EPHEMERAL }
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#custom-duration)

Custom Duration

```
// 24 hours
await sock.sendMessage(
    jid,
    { disappearingMessagesInChat: 86400 }
)

// 90 days  
await sock.sendMessage(
    jid,
    { disappearingMessagesInChat: 7776000 }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#disable-disappearing-messages)

Disable Disappearing Messages

Turn off disappearing messages in a chat:

```
await sock.sendMessage(
    jid,
    { disappearingMessagesInChat: false }
)
```

This only affects future messages. Previously sent disappearing messages will still delete at their scheduled time.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#send-individual-disappearing-messages)

Send Individual Disappearing Messages

Send a single message that will disappear without enabling the feature for the entire chat:

```
// Send a disappearing text message (7 days)
await sock.sendMessage(
    jid, 
    { text: 'hello' }, 
    { ephemeralExpiration: WA_DEFAULT_EPHEMERAL }
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#custom-expiration)

Custom Expiration

```
// Send a message that disappears after 24 hours
await sock.sendMessage(
    jid,
    { text: 'This message will disappear in 24 hours' },
    { ephemeralExpiration: 86400 }
)

// Send media with disappearing
await sock.sendMessage(
    jid,
    { 
        image: { url: './image.jpg' },
        caption: 'Disappearing image'
    },
    { ephemeralExpiration: WA_DEFAULT_EPHEMERAL }
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#complete-example)

Complete Example

```
import { makeWASocket, WA_DEFAULT_EPHEMERAL } from '@whiskeysockets/baileys'

const sock = makeWASocket({ /* config */ })
const jid = '1234567890@s.whatsapp.net'

// Enable disappearing messages for the chat (7 days)
await sock.sendMessage(jid, {
    disappearingMessagesInChat: WA_DEFAULT_EPHEMERAL
})

// Send a regular message (will disappear after 7 days)
await sock.sendMessage(jid, { text: 'This will disappear' })

// Send a one-time disappearing message (24 hours)
await sock.sendMessage(
    jid,
    { text: 'Custom expiration' },
    { ephemeralExpiration: 86400 }
)

// Disable disappearing messages
await sock.sendMessage(jid, {
    disappearingMessagesInChat: false
})

// Future messages won't disappear
await sock.sendMessage(jid, { text: 'This is permanent' })
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#update-default-disappearing-mode)

Update Default Disappearing Mode

Set a default disappearing message duration for all new chats:

```
// Set default to 24 hours for new chats
await sock.updateDefaultDisappearingMode(86400)

// Disable default disappearing mode
await sock.updateDefaultDisappearingMode(0)
```

See [Privacy Settings](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#update-default-disappearing-mode) for more details on default disappearing mode.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#implementation-details)

Implementation Details

From `src/Utils/messages.ts:465` and `src/Utils/messages.ts:717`:

```
// When enabling for chat
if (content.disappearingMessagesInChat !== undefined) {
    // Sets chat-level ephemeral setting
    // Uses WA_DEFAULT_EPHEMERAL if true
}

// When sending individual message
if (options.ephemeralExpiration) {
    message.ephemeralMessage = {
        message: message,
        expiration: options.ephemeralExpiration || WA_DEFAULT_EPHEMERAL
    }
}
```

-   Disappearing messages can still be saved by recipients through screenshots or forwarding before deletion
-   The timer starts when the message is read, not when it’s sent
-   Media files are deleted from WhatsApp servers when messages expire

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages#time-conversion-helper)

Time Conversion Helper

```
// Helper function to convert days/hours to seconds
const toSeconds = {
    hours: (h: number) => h * 60 * 60,
    days: (d: number) => d * 24 * 60 * 60
}

// Usage
await sock.sendMessage(jid, 
    { text: 'Disappears in 1 day' },
    { ephemeralExpiration: toSeconds.days(1) }
)
```

[

Blocking Users

Previous



](https://whiskeysockets-baileys-94.mintlify.app/privacy/blocking-users)[

Writing Custom Functionality

Next



](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality)
