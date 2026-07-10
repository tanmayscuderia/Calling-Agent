# Chat Types

Source: https://whiskeysockets-baileys-94.mintlify.app/api/types/chat

Chat types represent WhatsApp conversations with their metadata and state.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#chat)

Chat

Extends `proto.IConversation` with additional Baileys-specific fields.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-id)

id

string

Chat JID (identifier)Examples:

-   `"1234567890@s.whatsapp.net"` (individual chat)
-   `"123456789@g.us"` (group chat)
-   `"status@broadcast"` (status broadcasts)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-conversation-timestamp)

conversationTimestamp

number | Long

Timestamp of the conversation

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-last-message-recv-timestamp)

lastMessageRecvTimestamp

number

Unix timestamp of when the last message was received in the chat (Baileys extension)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-unread-count)

unreadCount

number

Number of unread messages

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-archived)

archived

boolean

Whether the chat is archived

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-pinned)

pinned

number

Pin position (0 = not pinned, higher = pinned earlier)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-mute-end-time)

muteEndTime

number | Long

Unix timestamp when mute expires (0 = not muted)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-name)

name

string

Chat name (for groups, business accounts, or saved contacts)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-not-spam)

notSpam

boolean

Whether the chat is marked as not spam

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-ephemeral-expiration)

ephemeralExpiration

number

Disappearing messages expiration time in secondsCommon values:

-   `0` - disabled
-   `86400` - 24 hours
-   `604800` - 7 days
-   `7776000` - 90 days

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-ephemeral-setting-timestamp)

ephemeralSettingTimestamp

number | Long

When disappearing messages setting was last changed

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#chatupdate)

ChatUpdate

Partial update to a chat’s properties.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-conditional)

conditional

function

Optional condition to check before applying the update

```
(bufferedData: BufferedEventData) => boolean | undefined
```

Returns:

-   `true` - apply the update
-   `false` - discard the update
-   `undefined` - condition not yet fulfilled, buffer the update

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-timestamp)

timestamp

number

Unix timestamp of when the update occurred

All other fields are from `Partial<Chat>`.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#chatmodification)

ChatModification

Union type for modifying chat properties. Each modification has a specific structure:

Archive/Unarchive

```
{
  archive: boolean
  lastMessages: LastMessageList
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-archive)

archive

boolean

required

`true` to archive, `false` to unarchive

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-last-messages)

lastMessages

LastMessageList

required

Last messages in the chat for sync purposes

Pin/Unpin

```
{
  pin: boolean
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-pin)

pin

boolean

required

`true` to pin, `false` to unpin

Mute/Unmute

```
{
  mute: number | null
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-mute)

mute

number | null

required

-   `null` - unmute
-   Unix timestamp - mute until this time
-   Duration in seconds - mute for this long from now

Mark Read/Unread

```
{
  markRead: boolean
  lastMessages: LastMessageList
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-mark-read)

markRead

boolean

required

`true` to mark as read, `false` to mark as unread

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-last-messages-1)

lastMessages

LastMessageList

required

Last messages to mark

Clear Messages

```
{
  clear: boolean
  lastMessages: LastMessageList
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-clear)

clear

boolean

required

Must be `true`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-last-messages-2)

lastMessages

LastMessageList

required

Messages to clear

Delete Chat

```
{
  delete: true
  lastMessages: LastMessageList
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-delete)

delete

true

required

Must be `true`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-last-messages-3)

lastMessages

LastMessageList

required

Last messages in chat

Delete Message for Me

```
{
  deleteForMe: {
    deleteMedia: boolean
    key: WAMessageKey
    timestamp: number
  }
}
```
Star Messages

```
{
  star: {
    messages: { id: string; fromMe?: boolean }[]
    star: boolean
  }
}
```
Push Name Setting

```
{
  pushNameSetting: string
}
```
Contact Action

```
{
  contact: proto.SyncActionValue.IContactAction | null
}
```
Disable Link Previews

```
{
  disableLinkPreviews: proto.SyncActionValue.IPrivacySettingDisableLinkPreviewsAction
}
```
Label Actions

```
{ addLabel: LabelActionBody }
{ addChatLabel: ChatLabelAssociationActionBody }
{ removeChatLabel: ChatLabelAssociationActionBody }
{ addMessageLabel: MessageLabelAssociationActionBody }
{ removeMessageLabel: MessageLabelAssociationActionBody }
```
Quick Reply

```
{
  quick Reply: QuickReplyAction
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#supporting-types)

Supporting Types

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#lastmessagelist)

LastMessageList

```
type LastMessageList = 
  | MinimalMessage[] 
  | proto.SyncActionValue.ISyncActionMessageRange
```

List of messages sorted reverse-chronologically (latest first). For MD modifications, the last message in the array must be the last message received in the chat.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#presencedata)

PresenceData

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-last-known-presence)

lastKnownPresence

WAPresence

required

Last known presence statusValues: `'unavailable'`, `'available'`, `'composing'`, `'recording'`, `'paused'`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#param-last-seen)

lastSeen

number

Unix timestamp of when user was last seen

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#wapresence)

WAPresence

```
type WAPresence = 
  | 'unavailable' 
  | 'available' 
  | 'composing' 
  | 'recording' 
  | 'paused'
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#privacy-settings-types)

Privacy Settings Types

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#waprivacyvalue)

WAPrivacyValue

```
type WAPrivacyValue = 
  | 'all' 
  | 'contacts' 
  | 'contact_blacklist' 
  | 'none'
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#waprivacyonlinevalue)

WAPrivacyOnlineValue

```
type WAPrivacyOnlineValue = 'all' | 'match_last_seen'
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#waprivacygroupaddvalue)

WAPrivacyGroupAddValue

```
type WAPrivacyGroupAddValue = 
  | 'all' 
  | 'contacts' 
  | 'contact_blacklist'
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#wareadreceiptsvalue)

WAReadReceiptsValue

```
type WAReadReceiptsValue = 'all' | 'none'
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#waprivacycallvalue)

WAPrivacyCallValue

```
type WAPrivacyCallValue = 'all' | 'known'
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#waprivacymessagesvalue)

WAPrivacyMessagesValue

```
type WAPrivacyMessagesValue = 'all' | 'contacts'
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#usage-examples)

Usage Examples

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#handling-chat-events)

Handling Chat Events

```
import { Chat, ChatUpdate } from '@whiskeysockets/baileys'

// New chats
sock.ev.on('chats.upsert', (chats: Chat[]) => {
  for (const chat of chats) {
    console.log('New chat:', chat.id)
    console.log('Unread count:', chat.unreadCount)
    console.log('Archived:', chat.archived)
  }
})

// Chat updates
sock.ev.on('chats.update', (updates: ChatUpdate[]) => {
  for (const update of updates) {
    if (update.unreadCount !== undefined) {
      console.log(`${update.id}: ${update.unreadCount} unread`)
    }
    if (update.archived !== undefined) {
      console.log(`${update.id} ${update.archived ? 'archived' : 'unarchived'}`)
    }
  }
})

// Deleted chats
sock.ev.on('chats.delete', (deletedChats: string[]) => {
  console.log('Deleted chats:', deletedChats)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#modifying-chats)

Modifying Chats

```
// Archive a chat
await sock.chatModify(
  {
    archive: true,
    lastMessages: [lastMessage]
  },
  chatJid
)

// Pin a chat
await sock.chatModify({ pin: true }, chatJid)

// Mute for 8 hours
await sock.chatModify(
  { mute: 8 * 60 * 60 * 1000 },
  chatJid
)

// Unmute
await sock.chatModify({ mute: null }, chatJid)

// Mark as read
await sock.chatModify(
  {
    markRead: true,
    lastMessages: [lastMessage]
  },
  chatJid
)

// Delete chat
await sock.chatModify(
  {
    delete: true,
    lastMessages: [lastMessage]
  },
  chatJid
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#working-with-presence)

Working with Presence

```
// Subscribe to presence updates
await sock.presenceSubscribe(chatJid)

// Send presence
await sock.sendPresenceUpdate('composing', chatJid)
await sock.sendPresenceUpdate('paused', chatJid)

// Handle presence updates
sock.ev.on('presence.update', ({ id, presences }) => {
  for (const [jid, presence] of Object.entries(presences)) {
    console.log(`${jid} is ${presence.lastKnownPresence}`)
    
    if (presence.lastSeen) {
      const date = new Date(presence.lastSeen * 1000)
      console.log(`Last seen: ${date.toLocaleString()}`)
    }
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#checking-chat-state)

Checking Chat State

```
function getChatState(chat: Chat) {
  const state = {
    isPinned: (chat.pinned || 0) > 0,
    isArchived: chat.archived || false,
    isMuted: (chat.muteEndTime || 0) > Date.now() / 1000,
    hasUnread: (chat.unreadCount || 0) > 0,
    hasDisappearingMessages: (chat.ephemeralExpiration || 0) > 0
  }
  
  return state
}

const chat: Chat = { /* ... */ }
const state = getChatState(chat)

if (state.isMuted) {
  console.log('Chat is muted')
}
if (state.hasDisappearingMessages) {
  console.log(`Messages disappear after ${chat.ephemeralExpiration}s`)
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#chat-sorting)

Chat Sorting

```
function sortChats(chats: Chat[]): Chat[] {
  return chats.sort((a, b) => {
    // Pinned chats first (higher pin number = pinned earlier)
    const aPinned = a.pinned || 0
    const bPinned = b.pinned || 0
    if (aPinned !== bPinned) return bPinned - aPinned
    
    // Then by last message timestamp
    const aTime = a.lastMessageRecvTimestamp || a.conversationTimestamp || 0
    const bTime = b.lastMessageRecvTimestamp || b.conversationTimestamp || 0
    return Number(bTime) - Number(aTime)
  })
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat#related-types)

Related Types

-   [Contact](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact) - Contact information
-   [Message](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages) - Message types
-   [Events](https://whiskeysockets-baileys-94.mintlify.app/api/types/events) - Event types including chat events
-   [Groups](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata) - Group metadata and information

[

Contact Types

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact)[

Message Utilities

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/utils/message-utils)
