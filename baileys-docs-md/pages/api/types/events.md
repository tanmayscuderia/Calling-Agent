# Event Types

Source: https://whiskeysockets-baileys-94.mintlify.app/api/types/events

Baileys uses an event-driven architecture. All socket events are typed through the `BaileysEventMap` interface.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#baileyseventemitter)

BaileysEventEmitter

The event emitter interface used by Baileys sockets.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-on)

on

function

required

Register an event listener

```
on<T extends keyof BaileysEventMap>(
  event: T, 
  listener: (arg: BaileysEventMap[T]) => void
): void
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-off)

off

function

required

Remove an event listener

```
off<T extends keyof BaileysEventMap>(
  event: T, 
  listener: (arg: BaileysEventMap[T]) => void
): void
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-remove-all-listeners)

removeAllListeners

function

required

Remove all listeners for an event

```
removeAllListeners<T extends keyof BaileysEventMap>(event: T): void
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-emit)

emit

function

required

Emit an event

```
emit<T extends keyof BaileysEventMap>(
  event: T, 
  arg: BaileysEventMap[T]
): boolean
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#baileyseventmap)

BaileysEventMap

Complete mapping of all events to their payload types.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#connection-events)

Connection Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-connection-update)

connection.update

Partial<ConnectionState>

Fired when connection state changes (WS opened, closed, connecting, etc.)

```
sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect, qr } = update
  if (connection === 'close') {
    // Handle disconnection
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#authentication-events)

Authentication Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-creds-update)

creds.update

Partial<AuthenticationCreds>

Fired when credentials are updated (keys, identity, etc.)

```
sock.ev.on('creds.update', saveCreds)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#message-events)

Message Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-messages-upsert)

messages.upsert

object

New messages received or synced from history

Show properties

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-messages)

messages

WAMessage\[\]

required

Array of messages

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-type)

type

MessageUpsertType

required

-   `"notify"`: New message, show notification
-   `"append"`: Historical message, no notification

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-request-id)

requestId

string

Present if messages were requested from phone due to unavailability

```
sock.ev.on('messages.upsert', ({ messages, type }) => {
  for (const msg of messages) {
    if (type === 'notify') {
      console.log('New message:', msg)
    }
  }
})
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-messages-update)

messages.update

WAMessageUpdate\[\]

Updates to existing messages (delivery receipts, edits, etc.)

```
sock.ev.on('messages.update', (updates) => {
  for (const { key, update } of updates) {
    // update.status: delivered, read, etc.
  }
})
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-messages-delete)

messages.delete

object

Messages deleted by user

```
// Specific messages
{ keys: WAMessageKey[] }

// All messages in a chat
{ jid: string; all: true }
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-messages-reaction)

messages.reaction

array

Reactions added/removed from messages

```
Array<{
  key: WAMessageKey
  reaction: proto.IReaction
}>
```

Example:

```
sock.ev.on('messages.reaction', (reactions) => {
  for (const { key, reaction } of reactions) {
    console.log(`${reaction.text} on message ${key.id}`)
  }
})
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-messages-media-update)

messages.media-update

array

Media encryption info updates

```
Array<{
  key: WAMessageKey
  media?: { ciphertext: Uint8Array; iv: Uint8Array }
  error?: Boom
}>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-message-receipt-update)

message-receipt.update

MessageUserReceiptUpdate\[\]

Individual user receipts (read, played, etc.)

```
sock.ev.on('message-receipt.update', (receipts) => {
  for (const { key, receipt } of receipts) {
    console.log(`${receipt.userJid} read at ${receipt.readTimestamp}`)
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#chat-events)

Chat Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-chats-upsert)

chats.upsert

Chat\[\]

New chats created

```
sock.ev.on('chats.upsert', (chats) => {
  console.log(`${chats.length} new chats`)
})
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-chats-update)

chats.update

ChatUpdate\[\]

Updates to existing chats (name, unread count, etc.)

```
sock.ev.on('chats.update', (updates) => {
  for (const update of updates) {
    if (update.unreadCount) {
      console.log(`${update.id}: ${update.unreadCount} unread`)
    }
  }
})
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-chats-delete)

chats.delete

string\[\]

Array of chat JIDs that were deleted

```
sock.ev.on('chats.delete', (deletedChats) => {
  console.log('Deleted:', deletedChats)
})
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-chats-lock)

chats.lock

object

Chat lock status changed

```
{ id: string; locked: boolean }
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#history-sync-events)

History Sync Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-messaging-history-set)

messaging-history.set

object

Bulk history sync from phone (reverse chronological order)

Show properties

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-chats)

chats

Chat\[\]

required

Array of chats

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-contacts)

contacts

Contact\[\]

required

Array of contacts

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-messages-1)

messages

WAMessage\[\]

required

Array of messages

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-lid-pn-mappings)

lidPnMappings

LIDMapping\[\]

LID to phone number mappings

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-is-latest)

isLatest

boolean

Whether this is the latest history batch

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-progress)

progress

number | null

Sync progress (0-1)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-sync-type)

syncType

proto.HistorySync.HistorySyncType | null

Type of history sync

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-peer-data-request-session-id)

peerDataRequestSessionId

string | null

Session ID for peer data request

```
sock.ev.on('messaging-history.set', (history) => {
  console.log(`Synced ${history.chats.length} chats`)
  console.log(`Synced ${history.messages.length} messages`)
  console.log(`Progress: ${history.progress * 100}%`)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#contact-events)

Contact Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-contacts-upsert)

contacts.upsert

Contact\[\]

New contacts added

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-contacts-update)

contacts.update

Partial<Contact>\[\]

Updates to existing contacts

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#group-events)

Group Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-groups-upsert)

groups.upsert

GroupMetadata\[\]

New groups joined

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-groups-update)

groups.update

Partial<GroupMetadata>\[\]

Updates to group metadata (name, subject, etc.)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-group-participants-update)

group-participants.update

object

Participant changes in a group

Show properties

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-id)

id

string

required

Group JID

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-author)

author

string

required

Who made the change

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-author-pn)

authorPn

string

Author’s phone number

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-participants)

participants

GroupParticipant\[\]

required

Affected participants

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-action)

action

ParticipantAction

required

Action: `'add'`, `'remove'`, `'promote'`, `'demote'`

```
sock.ev.on('group-participants.update', (update) => {
  console.log(`${update.action} in ${update.id}`)
  console.log('Participants:', update.participants)
})
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-group-join-request)

group.join-request

object

Someone requested to join a group

Show properties

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-id-1)

id

string

required

Group JID

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-author-1)

author

string

required

Who approved/rejected

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-author-pn-1)

authorPn

string

Author’s phone number

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-participant)

participant

string

required

Who wants to join

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-participant-pn)

participantPn

string

Participant’s phone number

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-action-1)

action

RequestJoinAction

required

`'create'` or `'revoke'`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-method)

method

RequestJoinMethod

required

How they requested: `'invite_link'`, etc.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-group-member-tag-update)

group.member-tag.update

object

Labels assigned to group member changed

```
{
  groupId: string
  participant: string
  participantAlt?: string
  label: string
  messageTimestamp?: number
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#presence-events)

Presence Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-presence-update)

presence.update

object

Contact presence changed (typing, online, etc.)

```
{
  id: string // chat JID
  presences: { 
    [participant: string]: PresenceData 
  }
}
```

Example:

```
sock.ev.on('presence.update', ({ id, presences }) => {
  for (const [jid, presence] of Object.entries(presences)) {
    console.log(`${jid} is ${presence.lastKnownPresence}`)
    // 'unavailable', 'available', 'composing', 'recording', 'paused'
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#blocklist-events)

Blocklist Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-blocklist-set)

blocklist.set

object

Entire blocklist replaced

```
{ blocklist: string[] }
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-blocklist-update)

blocklist.update

object

Blocklist updated incrementally

```
{
  blocklist: string[]
  type: 'add' | 'remove'
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#call-events)

Call Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-call)

call

WACallEvent\[\]

Incoming/outgoing call events

```
sock.ev.on('call', (calls) => {
  for (const call of calls) {
    console.log(`Call from ${call.from}: ${call.status}`)
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#label-events)

Label Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-labels-edit)

labels.edit

Label

Label created or edited

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-labels-association)

labels.association

object

Label associated/disassociated with item

```
{
  association: LabelAssociation
  type: 'add' | 'remove'
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#newsletter-events)

Newsletter Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-newsletter-reaction)

newsletter.reaction

object

Reaction on newsletter message

```
{
  id: string
  server_id: string
  reaction: { 
    code?: string
    count?: number
    removed?: boolean 
  }
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-newsletter-view)

newsletter.view

object

Newsletter message viewed

```
{
  id: string
  server_id: string
  count: number
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-newsletter-participants-update)

newsletter-participants.update

object

Newsletter participant role changed

```
{
  id: string
  author: string
  user: string
  new_role: string
  action: string
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-newsletter-settings-update)

newsletter-settings.update

object

Newsletter settings changed

```
{
  id: string
  update: any
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#settings-events)

Settings Events

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-settings-update)

settings.update

union

Account settings changed. Union of:

```
| { setting: 'unarchiveChats'; value: boolean }
| { setting: 'locale'; value: string }
| { setting: 'disableLinkPreviews'; value: proto.SyncActionValue.IPrivacySettingDisableLinkPreviewsAction }
| { setting: 'timeFormat'; value: proto.SyncActionValue.ITimeFormatAction }
| { setting: 'privacySettingRelayAllCalls'; value: proto.SyncActionValue.IPrivacySettingRelayAllCalls }
| { setting: 'statusPrivacy'; value: proto.SyncActionValue.IStatusPrivacyAction }
| { setting: 'notificationActivitySetting'; value: proto.SyncActionValue.NotificationActivitySettingAction.NotificationActivitySetting }
| { setting: 'channelsPersonalisedRecommendation'; value: proto.SyncActionValue.IPrivacySettingChannelsPersonalisedRecommendationAction }
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#param-lid-mapping-update)

lid-mapping.update

LIDMapping

LID to phone number mapping updated

```
{
  pn: string // phone number
  lid: string // LID
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#bufferedeventdata)

BufferedEventData

Internal type used for buffering events before emission:

```
type BufferedEventData = {
  historySets: { ... }
  chatUpserts: { [jid: string]: Chat }
  chatUpdates: { [jid: string]: ChatUpdate }
  chatDeletes: Set<string>
  contactUpserts: { [jid: string]: Contact }
  contactUpdates: { [jid: string]: Partial<Contact> }
  messageUpserts: { [key: string]: { type: MessageUpsertType; message: WAMessage } }
  messageUpdates: { [key: string]: WAMessageUpdate }
  messageDeletes: { [key: string]: WAMessageKey }
  messageReactions: { [key: string]: { key: WAMessageKey; reactions: proto.IReaction[] } }
  messageReceipts: { [key: string]: { key: WAMessageKey; userReceipt: proto.IUserReceipt[] } }
  groupUpdates: { [jid: string]: Partial<GroupMetadata> }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/events#example-complete-event-handler)

Example: Complete Event Handler

```
import makeWASocket from '@whiskeysockets/baileys'

const sock = makeWASocket({ /* config */ })

// Connection
sock.ev.on('connection.update', (update) => {
  console.log('Connection:', update.connection)
})

// Credentials
sock.ev.on('creds.update', saveCreds)

// Messages
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  for (const msg of messages) {
    if (type === 'notify' && !msg.key.fromMe) {
      await handleIncomingMessage(msg)
    }
  }
})

// Message updates
sock.ev.on('messages.update', (updates) => {
  for (const { key, update } of updates) {
    if (update.status) {
      console.log(`Message ${key.id} status: ${update.status}`)
    }
  }
})

// Presence
sock.ev.on('presence.update', ({ id, presences }) => {
  for (const [jid, presence] of Object.entries(presences)) {
    if (presence.lastKnownPresence === 'composing') {
      console.log(`${jid} is typing in ${id}`)
    }
  }
})

// Groups
sock.ev.on('group-participants.update', (update) => {
  console.log(`${update.action} in ${update.id}:`, update.participants)
})
```

[

Message Types

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages)[

Socket Configuration

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket)
