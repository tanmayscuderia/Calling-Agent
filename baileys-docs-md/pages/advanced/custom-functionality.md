# Writing Custom Functionality

Source: https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality

Baileys is designed with extensibility in mind. Instead of forking the project and modifying internals, you can write custom extensions to handle specialized WhatsApp protocol messages.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#overview)

Overview

Custom functionality allows you to:

-   Intercept specific WhatsApp protocol messages
-   Handle custom binary nodes not processed by Baileys
-   Track device state (battery, connectivity, etc.)
-   Implement protocol-level features

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#enabling-debug-logging)

Enabling Debug Logging

First, enable debug-level logging to see all messages WhatsApp sends:

```
import makeWASocket from '@whiskeysockets/baileys'
import P from 'pino'

const sock = makeWASocket({
    logger: P({ level: 'debug' }),
})
```

For even more detailed protocol information, use `trace` level:

```
const sock = makeWASocket({
    logger: P({ level: 'trace' }),
})
```

At `trace` level, you’ll see the full XML representation of each binary node sent and received.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#understanding-whatsapp-communication)

Understanding WhatsApp Communication

WhatsApp uses binary nodes for communication. When debug logging is enabled, you’ll see messages like:

```
{
    "level": 10,
    "fromMe": false,
    "frame": {
        "tag": "ib",
        "attrs": {
            "from": "@s.whatsapp.net"
        },
        "content": [
            {
                "tag": "edge_routing",
                "attrs": {},
                "content": [
                    {
                        "tag": "routing_info",
                        "attrs": {},
                        "content": {
                            "type": "Buffer",
                            "data": [8,2,8,5]
                        }
                    }
                ]
            }
        ]
    },
    "msg": "communication"
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#binary-node-structure)

Binary Node Structure

Each frame has three components:

-   **`tag`** - Identifies what the frame is about (e.g., `message`, `ib`, `iq`)
-   **`attrs`** - String key-value pairs with metadata (often contains message ID)
-   **`content`** - The actual data (can be nested nodes, strings, or buffers)

See [Protocol Details](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details) for more information on binary node encoding.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#registering-custom-callbacks)

Registering Custom Callbacks

Use the WebSocket event system to register callbacks for specific message patterns:

```
import type { BinaryNode } from '@whiskeysockets/baileys'

// Listen for any message with tag 'edge_routing'
sock.ws.on('CB:edge_routing', (node: BinaryNode) => {
    console.log('Edge routing message received:', node)
})

// Listen for message with tag 'ib' and specific attributes
sock.ws.on('CB:ib,from:@s.whatsapp.net', (node: BinaryNode) => {
    console.log('IB message from WhatsApp server:', node)
})
```

See [WebSocket Events](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events) for detailed callback patterns.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#example-battery-tracking)

Example: Battery Tracking

Here’s a complete example tracking your phone’s battery percentage:

```
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import type { BinaryNode } from '@whiskeysockets/baileys'
import P from 'pino'
import { Boom } from '@hapi/boom'

const logger = P({ level: 'debug' })

async function startBatteryTracking() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    
    const sock = makeWASocket({
        auth: state,
        logger,
        printQRInTerminal: true
    })

    // Register callback for battery status messages
    sock.ws.on('CB:ib,,notification', (node: BinaryNode) => {
        // Check if this is a battery notification
        const notificationNode = node.content?.[0]
        if (notificationNode && typeof notificationNode === 'object' && 
            notificationNode.tag === 'battery') {
            
            const batteryLevel = notificationNode.attrs?.value
            const isCharging = notificationNode.attrs?.live === '1'
            
            console.log(`Phone battery: ${batteryLevel}%`)
            console.log(`Charging: ${isCharging ? 'Yes' : 'No'}`)
        }
    })

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = 
                (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) {
                startBatteryTracking()
            }
        } else if (connection === 'open') {
            console.log('Connected! Battery tracking active.')
        }
    })

    sock.ev.on('creds.update', saveCreds)
}

startBatteryTracking()
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#example-custom-message-handler)

Example: Custom Message Handler

Intercept and process custom protocol extensions:

```
// Handle custom business metadata
sock.ws.on('CB:ib,,business_profile', (node: BinaryNode) => {
    const profileNode = Array.isArray(node.content) 
        ? node.content.find(n => typeof n === 'object' && n.tag === 'business_profile')
        : null
    
    if (profileNode && typeof profileNode === 'object') {
        const businessData = {
            description: profileNode.attrs?.description,
            category: profileNode.attrs?.category,
            email: profileNode.attrs?.email,
            website: profileNode.attrs?.website
        }
        
        console.log('Business profile received:', businessData)
        // Store or process business data
    }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#best-practices)

Best Practices

**Selective Callbacks**: Register callbacks only for the messages you need to avoid performance overhead.

**Avoid Blocking Operations**: Keep callback functions fast and non-blocking. Use async operations or queue heavy processing.

```
// Good: Non-blocking callback
sock.ws.on('CB:message', async (node: BinaryNode) => {
    // Queue for background processing
    messageQueue.add(node)
})

// Bad: Blocking callback
sock.ws.on('CB:message', (node: BinaryNode) => {
    // Heavy synchronous processing
    processHeavyOperation(node) // Blocks event loop!
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#typescript-types)

TypeScript Types

Baileys exports TypeScript types for binary nodes:

```
import type { 
    BinaryNode, 
    BinaryNodeAttributes, 
    BinaryNodeData 
} from '@whiskeysockets/baileys'

const processNode = (node: BinaryNode) => {
    const tag: string = node.tag
    const attrs: BinaryNodeAttributes = node.attrs
    const content: BinaryNodeData = node.content
    
    // Content can be:
    // - BinaryNode[] (array of child nodes)
    // - string (text content)
    // - Uint8Array (binary data)
    // - undefined (no content)
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#debugging-tips)

Debugging Tips

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#log-unhandled-messages)

Log Unhandled Messages

With debug logging enabled, Baileys logs unhandled messages:

```
{
    "unhandled": true,
    "msgId": "some-id",
    "fromMe": false,
    "frame": { ... },
    "msg": "communication recv"
}
```

These indicate protocol messages you might want to handle.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#inspect-message-flow)

Inspect Message Flow

Use trace-level logging to see both sent and received XML:

```
const sock = makeWASocket({
    logger: P({ 
        level: 'trace',
        transport: {
            target: 'pino-pretty',
            options: { colorize: true }
        }
    }),
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#learning-resources)

Learning Resources

To understand the WhatsApp protocol in depth, study:

-   **Libsignal Protocol** - End-to-end encryption
-   **Noise Protocol** - Handshake and session establishment

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality#next-steps)

Next Steps

-   [WebSocket Events](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events) - Detailed callback registration patterns
-   [Protocol Details](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details) - Binary node encoding/decoding
-   [Debugging](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging) - Troubleshooting and logging

[

Disappearing Messages

Previous



](https://whiskeysockets-baileys-94.mintlify.app/privacy/disappearing-messages)[

WebSocket Events

Next



](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events)
