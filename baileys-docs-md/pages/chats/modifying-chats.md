# Modifying Chats

Source: https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats

WA uses an encrypted form of communication to send chat/app updates. This has been implemented mostly and you can send the following updates:

If you mess up one of your updates, WA can log you out of all your devices and you’ll have to log in again.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats#archive-a-chat)

Archive a Chat

To archive a chat, you need to provide the last message in that chat:

```
const lastMsgInChat = await getLastMessageInChat(jid) // implement this on your end
await sock.chatModify({ archive: true, lastMessages: [lastMsgInChat] }, jid)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats#mute/unmute-a-chat)

Mute/Unmute a Chat

You can mute a chat for specific durations or unmute it completely.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats#supported-times)

Supported Times

| Time | Milliseconds |
| --- | --- |
| Remove | null |
| 8h | 86,400,000 |
| 7d | 604,800,000 |

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats#examples)

Examples

```
// mute for 8 hours
await sock.chatModify({ mute: 8 * 60 * 60 * 1000 }, jid)

// unmute
await sock.chatModify({ mute: null }, jid)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats#mark-a-chat-read/unread)

Mark a Chat Read/Unread

You can mark entire chats as read or unread by providing the last message:

```
const lastMsgInChat = await getLastMessageInChat(jid) // implement this on your end
// mark it unread
await sock.chatModify({ markRead: false, lastMessages: [lastMsgInChat] }, jid)
```

To mark as read, use `markRead: true`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats#delete-a-message-for-me)

Delete a Message for Me

Delete specific messages from your chat history:

```
await sock.chatModify(
    {
        clear: {
            messages: [
                {
                    id: 'ATWYHDNNWU81732J',
                    fromMe: true,
                    timestamp: '1654823909'
                }
            ]
        }
    },
    jid
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats#delete-a-chat)

Delete a Chat

Completely delete a chat conversation:

```
const lastMsgInChat = await getLastMessageInChat(jid) // implement this on your end
await sock.chatModify({
        delete: true,
        lastMessages: [
            {
                key: lastMsgInChat.key,
                messageTimestamp: lastMsgInChat.messageTimestamp
            }
        ]
    },
    jid
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats#pin/unpin-a-chat)

Pin/Unpin a Chat

Pin important chats to the top of your chat list:

```
await sock.chatModify({
        pin: true // or `false` to unpin
    },
    jid
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats#star/unstar-a-message)

Star/Unstar a Message

Mark messages as starred for easy reference:

```
await sock.chatModify({
        star: {
            messages: [
                {
                    id: 'messageID',
                    fromMe: true // or `false`
                }
            ],
            star: true // true: Star Message; false: Unstar Message
        }
    },
    jid
)
```

The `chatModify` function is defined in `src/Socket/chats.ts:899` and uses app state patches to sync changes across devices.

[

Invite Codes

Previous



](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes)[

Chat State Management

Next



](https://whiskeysockets-baileys-94.mintlify.app/chats/chat-state)
