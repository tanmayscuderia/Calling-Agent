# Debugging & Troubleshooting

Source: https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging

Effective debugging is crucial when working with the WhatsApp protocol. This guide covers logging configuration, common issues, and troubleshooting strategies.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#logging-configuration)

Logging Configuration

Baileys uses [Pino](https://github.com/pinojs/pino) for logging. Configure the logger when creating a socket.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#log-levels)

Log Levels

From least to most verbose:

-   `fatal` - Only fatal errors
-   `error` - Error messages
-   `warn` - Warnings
-   `info` - Informational messages (default)
-   `debug` - Debug information, unhandled messages
-   `trace` - Full protocol traces, XML representations

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#basic-configuration)

Basic Configuration

```
import makeWASocket from '@whiskeysockets/baileys'
import P from 'pino'

const sock = makeWASocket({
    logger: P({ level: 'debug' })
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#pretty-printing)

Pretty Printing

For human-readable console output:

```
import P from 'pino'

const logger = P({
    level: 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname'
        }
    }
})

const sock = makeWASocket({ logger })
```

Install pino-pretty:

```
npm install pino-pretty
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#logging-to-file)

Logging to File

From `Example/example.ts:7-23`:

```
import P from 'pino'

const logger = P({
    level: 'trace',
    transport: {
        targets: [
            {
                target: 'pino-pretty',
                options: { colorize: true },
                level: 'trace'
            },
            {
                target: 'pino/file',
                options: { destination: './wa-logs.txt' },
                level: 'trace'
            }
        ]
    }
})

const sock = makeWASocket({ logger })
```

This logs to both console (pretty) and file (raw JSON).

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#custom-logger)

Custom Logger

Implement the logger interface:

```
import type { ILogger } from '@whiskeysockets/baileys'

class CustomLogger implements ILogger {
    level = 'debug'
    
    child(obj: Record<string, unknown>): ILogger {
        return this
    }
    
    trace(obj: unknown, msg?: string): void {
        console.log('[TRACE]', msg, obj)
    }
    
    debug(obj: unknown, msg?: string): void {
        console.log('[DEBUG]', msg, obj)
    }
    
    info(obj: unknown, msg?: string): void {
        console.log('[INFO]', msg, obj)
    }
    
    warn(obj: unknown, msg?: string): void {
        console.warn('[WARN]', msg, obj)
    }
    
    error(obj: unknown, msg?: string): void {
        console.error('[ERROR]', msg, obj)
    }
}

const sock = makeWASocket({ 
    logger: new CustomLogger() 
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#debug-output)

Debug Output

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#unhandled-messages)

Unhandled Messages

With debug logging enabled, Baileys logs unhandled protocol messages:

```
{
    "unhandled": true,
    "msgId": "some-message-id",
    "fromMe": false,
    "frame": {
        "tag": "notification",
        "attrs": { "type": "battery" },
        "content": [ ... ]
    },
    "msg": "communication recv"
}
```

These indicate messages you might want to handle with custom callbacks.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#xml-trace-output)

XML Trace Output

With `trace` level, see binary nodes as XML:

```
{
    "xml": "<iq id='1' type='get' xmlns='encrypt'><count/></iq>",
    "msg": "xml send"
}

{
    "xml": "<iq id='1' type='result'><count value='5'/></iq>",
    "msg": "recv xml"
}
```

From `src/Socket/socket.ts:146-148`:

```
const sendNode = (frame: BinaryNode) => {
    if (logger.level === 'trace') {
        logger.trace({ xml: binaryNodeToString(frame), msg: 'xml send' })
    }
    // ...
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#common-issues)

Common Issues

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#connection-issues)

Connection Issues

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#qr-code-timeout)

QR Code Timeout

**Symptom**: QR code expires before scanning

```
// Increase QR timeout
const sock = makeWASocket({
    qrTimeout: 60_000  // 60 seconds (default: 60s)
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#connection-closed)

Connection Closed

**Symptom**: `DisconnectReason.connectionClosed`

```
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        
        console.log('Disconnect reason:', statusCode)
        console.log('Error:', lastDisconnect?.error)
        
        // Check if should reconnect
        if (statusCode !== DisconnectReason.loggedOut) {
            // Reconnect
        }
    }
})
```

**Common causes**:

-   Network interruption
-   Server restart
-   WebSocket timeout

**Solution**: Implement automatic reconnection.

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#multi-device-not-joined)

Multi-Device Not Joined

**Symptom**: `DisconnectReason.multideviceMismatch`

```
sock.ws.on('CB:ib,,downgrade_webclient', () => {
    console.error('Multi-device beta not joined on phone')
})
```

**Solution**: Enable multi-device on your WhatsApp mobile app.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#authentication-issues)

Authentication Issues

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#logged-out)

Logged Out

**Symptom**: `DisconnectReason.loggedOut`

```
if (statusCode === DisconnectReason.loggedOut) {
    console.log('Session expired, need to re-authenticate')
    // Delete auth state and start fresh
}
```

**Causes**:

-   Logged out from phone
-   Session expired
-   Invalid credentials

**Solution**: Delete auth folder and re-authenticate.

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#pre-key-issues)

Pre-Key Issues

**Symptom**: `encrypt/get digest returned no digest node`

```
// From src/Socket/socket.ts:224-234
const digestKeyBundle = async (): Promise<void> => {
    const res = await query({
        tag: 'iq',
        attrs: { to: S_WHATSAPP_NET, type: 'get', xmlns: 'encrypt' },
        content: [{ tag: 'digest', attrs: {} }]
    })
    const digestNode = getBinaryNodeChild(res, 'digest')
    if (!digestNode) {
        await uploadPreKeys()
        throw new Error('encrypt/get digest returned no digest node')
    }
}
```

**Solution**: Pre-keys are automatically re-uploaded. Ensure auth state is persistent.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#message-issues)

Message Issues

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#message-send-failures)

Message Send Failures

**Enable getMessage for retries**:

```
// Store messages in a Map (or use a database)
const messageStore = new Map()

sock.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages) {
        const key = `${msg.key.remoteJid}_${msg.key.id}`
        messageStore.set(key, msg)
    }
})

const sock = makeWASocket({
    getMessage: async (key) => {
        const msgKey = `${key.remoteJid}_${key.id}`
        const msg = messageStore.get(msgKey)
        return msg?.message || undefined
    }
})
```

**Why it’s needed**: Baileys needs to retrieve messages for retry logic and poll vote decryption.

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#poll-updates-not-decrypting)

Poll Updates Not Decrypting

**Symptom**: Poll votes show as encrypted

```
sock.ev.on('messages.update', async (updates) => {
    for (const { key, update } of updates) {
        if (update.pollUpdates) {
            // Need original poll creation message
            const pollCreation = await getMessage(key)
            if (pollCreation) {
                const votes = getAggregateVotesInPollMessage({
                    message: pollCreation,
                    pollUpdates: update.pollUpdates
                })
                console.log('Poll votes:', votes)
            }
        }
    }
})
```

**Solution**: Implement `getMessage` to retrieve the original poll message.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#performance-issues)

Performance Issues

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#high-memory-usage)

High Memory Usage

**Cause**: Storing entire chat history in memory

```
// Avoid storing all messages in memory
const messages = new Map()  // Will grow unbounded!
```

**Solution**: Implement database storage with TTL or size limits:

```
const sock = makeWASocket({
    getMessage: async (key) => {
        // Fetch from database
        return await db.messages.findOne({ 
            remoteJid: key.remoteJid, 
            id: key.id 
        })
    }
})

// Store messages in database
sock.ev.on('messages.upsert', async ({ messages }) => {
    await db.messages.insertMany(messages)
})
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#slow-message-processing)

Slow Message Processing

**Problem**: Blocking event handlers

```
// Bad: Blocks event loop
sock.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages) {
        processMessageSynchronously(msg)  // Blocks!
    }
})

// Good: Non-blocking
sock.ev.on('messages.upsert', async ({ messages }) => {
    // Queue for background processing
    await messageQueue.addBatch(messages)
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#debugging-techniques)

Debugging Techniques

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#inspect-binary-nodes)

Inspect Binary Nodes

```
import { binaryNodeToString } from '@whiskeysockets/baileys'
import type { BinaryNode } from '@whiskeysockets/baileys'

sock.ws.on('CB:iq', (node: BinaryNode) => {
    console.log('Node structure:', JSON.stringify(node, null, 2))
    console.log('XML representation:', binaryNodeToString(node))
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#trace-websocket-events)

Trace WebSocket Events

```
import { WebSocketClient } from '@whiskeysockets/baileys'

const originalEmit = sock.ws.emit
sock.ws.emit = function (event: string, ...args: any[]) {
    if (event.startsWith('CB:')) {
        console.log('Event:', event, 'Args:', args)
    }
    return originalEmit.call(this, event, ...args)
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#monitor-connection-state)

Monitor Connection State

```
sock.ev.on('connection.update', (update) => {
    console.log('Connection update:', {
        connection: update.connection,
        receivedPendingNotifications: update.receivedPendingNotifications,
        isNewLogin: update.isNewLogin,
        qr: update.qr ? 'present' : 'none',
        lastDisconnect: update.lastDisconnect?.error?.message
    })
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#debug-auth-state)

Debug Auth State

```
import { BufferJSON } from '@whiskeysockets/baileys'
import fs from 'fs'

// Inspect auth state
const authState = JSON.parse(
    fs.readFileSync('./auth_info/creds.json', 'utf-8'),
    BufferJSON.reviver
)

console.log('Registered:', authState.registered)
console.log('Phone:', authState.me?.id)
console.log('Pre-key ID:', authState.nextPreKeyId)
console.log('Signed pre-key ID:', authState.signedPreKey?.keyId)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#error-handling)

Error Handling

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#global-error-handler)

Global Error Handler

```
sock.ev.on('connection.update', (update) => {
    if (update.lastDisconnect?.error) {
        const error = update.lastDisconnect.error
        
        if (error instanceof Boom) {
            const statusCode = error.output?.statusCode
            const errorData = error.data
            
            console.error('Boom error:', {
                statusCode,
                message: error.message,
                data: errorData
            })
            
            // Handle specific errors
            switch (statusCode) {
                case DisconnectReason.badSession:
                    console.log('Bad session, deleting auth state')
                    // Delete and re-auth
                    break
                case DisconnectReason.connectionClosed:
                    console.log('Connection closed, reconnecting...')
                    // Reconnect
                    break
                case DisconnectReason.loggedOut:
                    console.log('Logged out, need manual re-auth')
                    // Don't reconnect
                    break
            }
        } else {
            console.error('Unknown error:', error)
        }
    }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#catch-unhandled-rejections)

Catch Unhandled Rejections

```
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error)
})

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error)
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#diagnostic-tools)

Diagnostic Tools

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#check-pre-keys-on-server)

Check Pre-Keys on Server

```
const checkPreKeys = async () => {
    const result = await sock.query({
        tag: 'iq',
        attrs: {
            xmlns: 'encrypt',
            type: 'get',
            to: 's.whatsapp.net'
        },
        content: [{ tag: 'count', attrs: {} }]
    })
    
    const count = result.content?.[0]?.attrs?.value
    console.log('Pre-keys on server:', count)
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#verify-device-registration)

Verify Device Registration

```
const checkRegistration = () => {
    console.log('Registered:', sock.authState.creds.registered)
    console.log('Phone number:', sock.authState.creds.me?.id)
    console.log('Device ID:', sock.authState.creds.me?.device)
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#test-message-send)

Test Message Send

```
const testSend = async () => {
    try {
        const result = await sock.sendMessage(
            'test@s.whatsapp.net',
            { text: 'Test message' }
        )
        console.log('Send successful:', result)
    } catch (error) {
        console.error('Send failed:', error)
    }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#production-recommendations)

Production Recommendations

**Never log sensitive data in production**:

-   Pre-keys, session keys
-   Message content
-   User phone numbers

```
// Production logger
const logger = P({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    redact: {
        paths: [
            'creds.noiseKey',
            'creds.signedPreKey',
            'creds.advSecretKey',
            'keys.*'
        ],
        remove: true
    }
})
```

**Monitor these metrics**:

-   Connection uptime
-   Message send success rate
-   Pre-key count on server
-   Memory usage
-   Event processing latency

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#useful-commands)

Useful Commands

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#clear-auth-state)

Clear Auth State

```
rm -rf auth_info_baileys/
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#view-logs-in-real-time)

View Logs in Real-Time

```
tail -f wa-logs.txt | pino-pretty
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#search-logs)

Search Logs

```
grep "connection.update" wa-logs.txt | pino-pretty
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#getting-help)

Getting Help

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#gather-debug-info)

Gather Debug Info

When reporting issues, include:

1.  **Baileys version**: `npm list @whiskeysockets/baileys`
2.  **Node version**: `node --version`
3.  **Logs**: With debug level enabled
4.  **Connection state**: During the issue
5.  **Reproduction steps**: Minimal code to reproduce

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#example-debug-log)

Example Debug Log

```
const logger = P({
    level: 'trace',
    transport: {
        target: 'pino/file',
        options: { destination: './debug.log' }
    }
})

const sock = makeWASocket({ logger })

// Reproduce the issue, then share debug.log
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging#next-steps)

Next Steps

-   [Custom Functionality](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality) - Building custom handlers
-   [WebSocket Events](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events) - Event callback patterns
-   [Protocol Details](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details) - Understanding the protocol

[

Protocol Details

Previous



](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details)
