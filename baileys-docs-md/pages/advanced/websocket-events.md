# WebSocket Events

Source: https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events

Baileys provides a powerful event system for intercepting and handling WebSocket frames before they’re processed by the main event handlers.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#event-callback-system)

Event Callback System

The WebSocket client emits events using a special callback prefix system that allows pattern matching against binary node properties.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#callback-prefixes)

Callback Prefixes

All WebSocket callback events use the prefix `CB:` followed by a pattern:

```
import type { BinaryNode } from '@whiskeysockets/baileys'

// Pattern: CB:{tag}
sock.ws.on('CB:message', (node: BinaryNode) => {
    console.log('Any message node received')
})
```

From `src/Defaults/index.ts:14`:

```
export const DEF_CALLBACK_PREFIX = 'CB:'
export const DEF_TAG_PREFIX = 'TAG:'
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#event-pattern-matching)

Event Pattern Matching

The event system supports hierarchical pattern matching based on the binary node structure.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#basic-tag-matching)

Basic Tag Matching

Match any message with a specific tag:

```
// Listen for all 'iq' nodes
sock.ws.on('CB:iq', (node: BinaryNode) => {
    console.log('IQ node:', node)
})

// Listen for all 'message' nodes
sock.ws.on('CB:message', (node: BinaryNode) => {
    console.log('Message node:', node)
})

// Listen for all 'presence' nodes
sock.ws.on('CB:presence', (node: BinaryNode) => {
    console.log('Presence update:', node)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#attribute-matching)

Attribute Matching

Match nodes with specific attribute values:

```
// Pattern: CB:{tag},{attr}:{value}
sock.ws.on('CB:iq,type:get', (node: BinaryNode) => {
    console.log('IQ get request:', node)
})

sock.ws.on('CB:iq,type:set', (node: BinaryNode) => {
    console.log('IQ set request:', node)
})

sock.ws.on('CB:iq,type:result', (node: BinaryNode) => {
    console.log('IQ result:', node)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#id-based-matching)

ID-Based Matching

Match messages by their unique ID attribute:

```
// Pattern: CB:{tag},id:{messageId}
const msgId = 'abcd1234'
sock.ws.on(`CB:iq,id:${msgId}`, (node: BinaryNode) => {
    console.log('Specific message response:', node)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#content-tag-matching)

Content Tag Matching

Match based on the first child node’s tag:

```
// Pattern: CB:{tag},,{contentTag}
sock.ws.on('CB:ib,,edge_routing', (node: BinaryNode) => {
    console.log('Edge routing message:', node)
})

sock.ws.on('CB:iq,,pair-success', (node: BinaryNode) => {
    console.log('Pairing successful:', node)
})

sock.ws.on('CB:notification,,encrypt', (node: BinaryNode) => {
    console.log('Encryption notification:', node)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#combined-matching)

Combined Matching

Combine tag, attributes, and content matching:

```
// Pattern: CB:{tag},{attr}:{value},{contentTag}
sock.ws.on('CB:iq,type:set,pair-device', (node: BinaryNode) => {
    console.log('Pair device request:', node)
})

sock.ws.on('CB:ib,from:@s.whatsapp.net,edge_routing', (node: BinaryNode) => {
    console.log('Server edge routing:', node)
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#how-event-matching-works)

How Event Matching Works

From `src/Socket/socket.ts:583-620`, the event matching logic:

```
const onMessageReceived = async (data: Buffer) => {
    await noise.decodeFrame(data, frame => {
        // Binary node processing
        if (!(frame instanceof Uint8Array)) {
            const msgId = frame.attrs.id
            
            // Emit tag-specific event with ID
            ws.emit(`TAG:${msgId}`, frame)
            
            // Extract matching components
            const l0 = frame.tag
            const l1 = frame.attrs || {}
            const l2 = Array.isArray(frame.content) ? frame.content[0]?.tag : ''
            
            // Emit hierarchical callback events
            for (const key of Object.keys(l1)) {
                // CB:tag,attr:value,content
                ws.emit(`CB:${l0},${key}:${l1[key]},${l2}`, frame)
                // CB:tag,attr:value
                ws.emit(`CB:${l0},${key}:${l1[key]}`, frame)
                // CB:tag,attr
                ws.emit(`CB:${l0},${key}`, frame)
            }
            
            // CB:tag,,content
            ws.emit(`CB:${l0},,${l2}`, frame)
            // CB:tag
            ws.emit(`CB:${l0}`, frame)
        }
    })
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#common-event-patterns)

Common Event Patterns

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#connection-events)

Connection Events

```
// Stream ended by server
sock.ws.on('CB:xmlstreamend', () => {
    console.log('Connection terminated by server')
})

// Stream errors
sock.ws.on('CB:stream:error', (node: BinaryNode) => {
    console.error('Stream error:', node)
})

// Connection success
sock.ws.on('CB:success', (node: BinaryNode) => {
    console.log('Login successful')
})

// Connection failure
sock.ws.on('CB:failure', (node: BinaryNode) => {
    console.error('Connection failed:', node.attrs)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#pairing-&-authentication)

Pairing & Authentication

```
// QR code pairing
sock.ws.on('CB:iq,type:set,pair-device', (node: BinaryNode) => {
    console.log('QR code pairing initiated')
})

// Pairing success
sock.ws.on('CB:iq,,pair-success', (node: BinaryNode) => {
    console.log('Device paired successfully')
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#message-synchronization)

Message Synchronization

```
// Offline message batch
sock.ws.on('CB:ib,,offline_preview', (node: BinaryNode) => {
    console.log('Offline preview received')
})

// All offline messages processed
sock.ws.on('CB:ib,,offline', (node: BinaryNode) => {
    const count = node.content?.[0]?.attrs?.count || 0
    console.log(`Processed ${count} offline messages`)
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#device-&-session-management)

Device & Session Management

```
// Edge routing updates
sock.ws.on('CB:ib,,edge_routing', (node: BinaryNode) => {
    console.log('Edge routing info updated')
})

// Multi-device downgrade
sock.ws.on('CB:ib,,downgrade_webclient', () => {
    console.error('Multi-device beta not joined')
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#tag-based-events)

Tag-Based Events

Besides callback events, you can listen for tag-based responses:

```
// Wait for a specific message ID response
const messageId = 'unique-msg-id'

sock.ws.on(`TAG:${messageId}`, (response: BinaryNode) => {
    console.log('Got response for message:', response)
})

// Send a message that expects a response
await sock.sendNode({
    tag: 'iq',
    attrs: {
        id: messageId,
        type: 'get',
        xmlns: 'w:profile:picture',
        to: 'some-jid'
    }
})
```

Baileys internally uses `TAG:` events with the `waitForMessage()` function to implement query/response patterns.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#practical-examples)

Practical Examples

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#battery-monitoring)

Battery Monitoring

```
sock.ws.on('CB:notification', (node: BinaryNode) => {
    if (Array.isArray(node.content)) {
        const batteryNode = node.content.find(
            n => typeof n === 'object' && n.tag === 'battery'
        )
        
        if (batteryNode && typeof batteryNode === 'object') {
            console.log('Battery level:', batteryNode.attrs?.value)
            console.log('Charging:', batteryNode.attrs?.live === '1')
        }
    }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#presence-tracking)

Presence Tracking

```
sock.ws.on('CB:presence', (node: BinaryNode) => {
    const from = node.attrs?.from
    const type = node.attrs?.type
    
    if (type === 'available') {
        console.log(`${from} is online`)
    } else if (type === 'unavailable') {
        console.log(`${from} is offline`)
    } else if (type === 'composing') {
        console.log(`${from} is typing`)
    }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#group-metadata-changes)

Group Metadata Changes

```
sock.ws.on('CB:notification,type:group_update', (node: BinaryNode) => {
    const groupJid = node.attrs?.from
    
    if (Array.isArray(node.content)) {
        for (const child of node.content) {
            if (typeof child === 'object') {
                if (child.tag === 'subject') {
                    console.log(`Group ${groupJid} name changed to:`, child.content)
                } else if (child.tag === 'description') {
                    console.log(`Group ${groupJid} description changed`)
                }
            }
        }
    }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#call-events)

Call Events

```
sock.ws.on('CB:call', (node: BinaryNode) => {
    const callId = node.attrs?.id
    const from = node.attrs?.from
    
    console.log(`Incoming call from ${from}, ID: ${callId}`)
    
    // Auto-reject calls
    await sock.rejectCall(callId, from)
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#event-handler-best-practices)

Event Handler Best Practices

**Avoid Memory Leaks**: Always clean up event listeners when they’re no longer needed.

```
// Good: Remove listener when done
const handler = (node: BinaryNode) => {
    console.log('Received:', node)
    // Remove after first call if one-time
    sock.ws.off('CB:iq', handler)
}
sock.ws.on('CB:iq', handler)

// Or use once() if available
sock.ws.once('CB:iq', (node: BinaryNode) => {
    console.log('Received once:', node)
})
```

**Error Handling**: Wrap callback logic in try-catch to prevent unhandled errors from crashing your application.

```
sock.ws.on('CB:message', async (node: BinaryNode) => {
    try {
        await processMessage(node)
    } catch (error) {
        console.error('Error processing message:', error)
    }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#debugging-event-matching)

Debugging Event Matching

To see which events are triggered, enable debug logging:

```
import P from 'pino'

const sock = makeWASocket({
    logger: P({ level: 'debug' })
})
```

Unhandled messages are logged:

```
{
    "unhandled": true,
    "msgId": "some-id",
    "fromMe": false,
    "frame": { ... },
    "msg": "communication recv"
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#complete-example)

Complete Example

```
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'
import type { BinaryNode } from '@whiskeysockets/baileys'
import P from 'pino'

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'debug' }),
        printQRInTerminal: true
    })
    
    // Connection lifecycle
    sock.ws.on('CB:success', (node: BinaryNode) => {
        console.log('✓ Connected successfully')
    })
    
    sock.ws.on('CB:failure', (node: BinaryNode) => {
        console.error('✗ Connection failed:', node.attrs?.reason)
    })
    
    sock.ws.on('CB:xmlstreamend', () => {
        console.log('✗ Stream ended by server')
    })
    
    // Message events
    sock.ws.on('CB:message', (node: BinaryNode) => {
        console.log('📨 Message received')
    })
    
    // Presence tracking
    sock.ws.on('CB:presence', (node: BinaryNode) => {
        console.log('👤 Presence update:', node.attrs)
    })
    
    // Offline messages
    sock.ws.on('CB:ib,,offline', (node: BinaryNode) => {
        console.log('📬 Offline messages synced')
    })
    
    sock.ev.on('creds.update', saveCreds)
}

start()
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events#next-steps)

Next Steps

-   [Custom Functionality](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality) - Writing custom message handlers
-   [Protocol Details](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details) - Understanding binary node structure
-   [Debugging](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging) - Troubleshooting event handlers

[

Writing Custom Functionality

Previous



](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality)[

Protocol Details

Next



](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details)
