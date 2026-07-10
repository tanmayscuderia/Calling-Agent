# Presence Updates

Source: https://whiskeysockets-baileys-94.mintlify.app/chats/presence

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/presence#send-presence-update)

Send Presence Update

Let contacts know whether you’re online, offline, typing, recording audio, or viewing their status.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/presence#basic-usage)

Basic Usage

```
await sock.sendPresenceUpdate('available', jid)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/presence#wapresence-types)

WAPresence Types

The `presence` parameter can be one of the following [WAPresence](https://baileys.whiskeysockets.io/types/WAPresence.html) values:

-   `'unavailable'` - Offline/not available
-   `'available'` - Online/available
-   `'composing'` - Typing a message
-   `'recording'` - Recording audio message
-   `'paused'` - Stopped typing (treated as available)

The presence expires after about 10 seconds. You need to send periodic updates to maintain an active presence state.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/presence#update-your-global-presence)

Update Your Global Presence

To update your overall online/offline status:

```
// Go online
await sock.sendPresenceUpdate('available')

// Go offline  
await sock.sendPresenceUpdate('unavailable')
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/presence#send-typing-indicator)

Send Typing Indicator

Let the other person know you’re typing in their chat:

```
// Start typing
await sock.sendPresenceUpdate('composing', jid)

// Stop typing (go back to available)
await sock.sendPresenceUpdate('paused', jid)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/presence#send-recording-indicator)

Send Recording Indicator

Show that you’re recording an audio message:

```
await sock.sendPresenceUpdate('recording', jid)
```

When using ‘composing’ or ‘recording’, always provide the `jid` parameter to specify which chat you’re active in.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/presence#subscribe-to-presence-updates)

Subscribe to Presence Updates

To receive presence updates from a contact or group:

```
// Request updates for a chat
await sock.presenceSubscribe(jid)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/presence#listen-for-presence-updates)

Listen for Presence Updates

Receive notifications when contacts change their presence:

```
// The presence update is fetched and called here
sock.ev.on('presence.update', (update) => {
    console.log(update)
    // {
    //   id: 'jid@s.whatsapp.net',
    //   presences: {
    //     'participant@s.whatsapp.net': {
    //       lastKnownPresence: 'available' | 'unavailable' | 'composing' | 'recording',
    //       lastSeen?: number // Unix timestamp
    //     }
    //   }
    // }
})

// Request updates for a chat
await sock.presenceSubscribe(jid)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/presence#push-notifications)

Push Notifications

If a desktop client is active, WA doesn’t send push notifications to the device. If you would like to receive said notifications — mark your Baileys client offline using `sock.sendPresenceUpdate('unavailable')`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/presence#implementation-details)

Implementation Details

The `sendPresenceUpdate` function is implemented in `src/Socket/chats.ts:684-724`:

-   For `available`/`unavailable`: Sends a global presence update
-   For `composing`/`recording`/`paused`: Sends a chatstate update to specific JID
-   Automatically handles LID (Lightweight Identity) for supported users
-   Recording presence is sent as composing with media type ‘audio’

The function automatically replaces ’@’ symbols in your display name when sending presence updates.

[

Chat State Management

Previous



](https://whiskeysockets-baileys-94.mintlify.app/chats/chat-state)[

User Queries

Next



](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries)
