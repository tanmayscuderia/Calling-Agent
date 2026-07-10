# Blocking Users

Source: https://whiskeysockets-baileys-94.mintlify.app/privacy/blocking-users

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/blocking-users#block-a-user)

Block a User

Block a user to prevent them from sending you messages:

```
await sock.updateBlockStatus(jid, 'block')
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/blocking-users#unblock-a-user)

Unblock a User

Unblock a previously blocked user:

```
await sock.updateBlockStatus(jid, 'unblock')
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/blocking-users#function-signature)

Function Signature

The `updateBlockStatus` function is implemented in `src/Socket/chats.ts:373-391`:

```
const updateBlockStatus = async (jid: string, action: 'block' | 'unblock') => {
    await query({
        tag: 'iq',
        attrs: {
            xmlns: 'blocklist',
            to: S_WHATSAPP_NET,
            type: 'set'
        },
        content: [
            {
                tag: 'item',
                attrs: {
                    action,
                    jid
                }
            }
        ]
    })
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/blocking-users#fetch-blocklist)

Fetch Blocklist

Retrieve a list of all blocked contacts:

```
const blocklist = await sock.fetchBlocklist()
console.log(blocklist)
// Output: ['1234567890@s.whatsapp.net', '0987654321@s.whatsapp.net']
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/blocking-users#blocklist-implementation)

Blocklist Implementation

From `src/Socket/chats.ts:359-371`:

```
const fetchBlocklist = async () => {
    const result = await query({
        tag: 'iq',
        attrs: {
            xmlns: 'blocklist',
            to: S_WHATSAPP_NET,
            type: 'get'
        }
    })

    const listNode = getBinaryNodeChild(result, 'list')
    return getBinaryNodeChildren(listNode, 'item').map(n => n.attrs.jid)
}
```

The function returns an array of JID strings representing all blocked users.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/blocking-users#complete-example)

Complete Example

```
// Block a user
const userToBlock = '1234567890@s.whatsapp.net'
await sock.updateBlockStatus(userToBlock, 'block')
console.log(`Blocked ${userToBlock}`)

// Fetch and display blocklist
const blocklist = await sock.fetchBlocklist()
console.log('Current blocklist:', blocklist)

// Unblock a user
if (blocklist.includes(userToBlock)) {
    await sock.updateBlockStatus(userToBlock, 'unblock')
    console.log(`Unblocked ${userToBlock}`)
}

// Verify blocklist updated
const updatedBlocklist = await sock.fetchBlocklist()
console.log('Updated blocklist:', updatedBlocklist)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/blocking-users#listen-for-block-status-changes)

Listen for Block Status Changes

You can track block status changes through events:

```
sock.ev.on('blocklist.update', ({ blocklist }) => {
    console.log('Blocklist updated:', blocklist)
})
```

Blocking a user will:

-   Prevent them from sending you messages
-   Hide your last seen, online status, and status updates from them
-   Not notify them that they’ve been blocked

Use `fetchBlocklist()` during initialization to sync your local blocklist state with WhatsApp servers.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/blocking-users#implementation-details)

Implementation Details

Both functions use WhatsApp’s `blocklist` XML namespace:

-   **Block/Unblock**: Sends an IQ query with `type: 'set'` and an item containing the action
-   **Fetch Blocklist**: Sends an IQ query with `type: 'get'` and parses the returned item nodes

The functions are exported from the `makeChatsSocket` in `src/Socket/chats.ts:1225-1271`.

[

Privacy Settings

Previous



](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings)[

Disappearing Messages

Next



](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages)
