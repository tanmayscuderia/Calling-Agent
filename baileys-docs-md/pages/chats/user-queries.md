# User Queries

Source: https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#check-if-id-exists-on-whatsapp)

Check If ID Exists on WhatsApp

Verify if a phone number or JID is registered on WhatsApp:

```
const [result] = await sock.onWhatsApp(jid)
if (result.exists) {
    console.log(`${jid} exists on WhatsApp, as jid: ${result.jid}`)
}
```

This is useful for validating phone numbers before attempting to send messages.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#query-chat-history)

Query Chat History

Fetch older messages from a chat (works for both individual and group chats):

```
// You need to have the oldest message in chat
const msg = await getOldestMessageInChat(jid) // implement this on your end
await sock.fetchMessageHistory(
    50, // quantity (max: 50 per query)
    msg.key,
    msg.messageTimestamp
)
```

Messages will be received in the `messaging.history-set` event. The maximum number of messages per query is 50.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#fetch-status)

Fetch Status

Get a user’s WhatsApp status/about text:

```
const status = await sock.fetchStatus(jid)
console.log('status: ' + status)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#fetch-profile-picture)

Fetch Profile Picture

Get the display picture of a person or group in different resolutions:

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#low-resolution-picture)

Low Resolution Picture

```
// for low res picture
const ppUrl = await sock.profilePictureUrl(jid)
console.log(ppUrl)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#high-resolution-picture)

High Resolution Picture

```
// for high res picture
const ppUrl = await sock.profilePictureUrl(jid, 'image')
console.log(ppUrl)
```

The function accepts `'preview'` for low resolution (default) or `'image'` for high resolution profile pictures.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#function-signature)

Function Signature

From `src/Socket/chats.ts:639-660`:

```
const profilePictureUrl = async (
    jid: string, 
    type: 'preview' | 'image' = 'preview', 
    timeoutMs?: number
) => {
    // Returns the URL string or undefined if no picture
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#fetch-business-profile)

Fetch Business Profile

Get detailed information about a business account:

```
const profile = await sock.getBusinessProfile(jid)
console.log('business description: ' + profile.description + ', category: ' + profile.category)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#business-profile-structure)

Business Profile Structure

The returned object contains:

```
interface WABusinessProfile {
    wid?: string                    // Business WhatsApp ID
    address?: string                // Business address
    description: string             // Business description
    website?: string[]              // Website URLs
    email?: string                  // Business email
    category?: string               // Business category
    business_hours?: {              // Operating hours
        timezone?: string
        business_config?: WABusinessHoursConfig[]
    }
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#example-response)

Example Response

```
{
    wid: '1234567890@s.whatsapp.net',
    description: 'Premium coffee shop',
    category: 'Food & Beverage',
    website: ['https://example.com'],
    email: 'contact@example.com',
    address: '123 Main St, City',
    business_hours: {
        timezone: 'America/New_York',
        business_config: [...]
    }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#fetch-presence-status)

Fetch Presence Status

Monitor if someone is typing or online:

```
// The presence update is fetched and called here
sock.ev.on('presence.update', console.log)

// Request updates for a chat
await sock.presenceSubscribe(jid)
```

See the [Presence Updates](https://whiskeysockets-baileys-94.mintlify.app/chats/presence) page for detailed information about presence handling.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries#implementation-references)

Implementation References

-   `onWhatsApp` - Uses USync protocol for number validation
-   `fetchStatus` - `src/Socket/chats.ts:246-257`
-   `profilePictureUrl` - `src/Socket/chats.ts:639-660`
-   `getBusinessProfile` - `src/Socket/chats.ts:393-441`
-   `fetchMessageHistory` - Implemented in messages socket
-   `presenceSubscribe` - `src/Socket/chats.ts:730-742`

[

Presence Updates

Previous



](https://whiskeysockets-baileys-94.mintlify.app/chats/presence)[

Privacy Settings

Next



](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings)
