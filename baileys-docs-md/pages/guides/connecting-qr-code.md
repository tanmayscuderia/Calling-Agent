# Connecting with QR Code

Source: https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#overview)

Overview

QR code authentication is the primary method for connecting Baileys to WhatsApp. Your phone scans the QR code displayed by Baileys, establishing a multi-device connection.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#basic-qr-code-connection)

Basic QR Code Connection

The simplest way to connect with a QR code:

```
import makeWASocket from '@whiskeysockets/baileys'

const sock = makeWASocket({
    printQRInTerminal: true
})
```

When `printQRInTerminal` is set to `true`, the QR code will be displayed in your terminal for easy scanning.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#browser-configuration)

Browser Configuration

You can customize the browser identity that appears in your WhatsApp’s “Linked Devices” section using the `browser` parameter.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#available-browser-configs)

Available Browser Configs

Baileys provides predefined browser configurations:

```
import makeWASocket, { Browsers } from '@whiskeysockets/baileys'

const sock = makeWASocket({
    browser: Browsers.macOS('Chrome'),
    printQRInTerminal: true
})
// Appears as: Mac OS (Chrome)
```

```
import makeWASocket, { Browsers } from '@whiskeysockets/baileys'

const sock = makeWASocket({
    browser: Browsers.ubuntu('My App'),
    printQRInTerminal: true
})
// Appears as: Ubuntu (My App)
```

```
import makeWASocket, { Browsers } from '@whiskeysockets/baileys'

const sock = makeWASocket({
    browser: Browsers.windows('Desktop'),
    printQRInTerminal: true
})
// Appears as: Windows (Desktop)
```

```
import makeWASocket, { Browsers } from '@whiskeysockets/baileys'

const sock = makeWASocket({
    browser: Browsers.baileys('Bot'),
    printQRInTerminal: true
})
// Appears as: Baileys (Bot)
```

```
import makeWASocket, { Browsers } from '@whiskeysockets/baileys'

const sock = makeWASocket({
    browser: Browsers.appropriate('MyApp'),
    printQRInTerminal: true
})
// Uses your OS and release version automatically
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#browser-configuration-options)

Browser Configuration Options

| Browser | Platform | Version |
| --- | --- | --- |
| `Browsers.ubuntu()` | Ubuntu | 22.04.4 |
| `Browsers.macOS()` | Mac OS | 14.4.1 |
| `Browsers.windows()` | Windows | 10.0.22631 |
| `Browsers.baileys()` | Baileys | 6.5.0 |
| `Browsers.appropriate()` | Auto-detected | System release |

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#custom-browser-configuration)

Custom Browser Configuration

You can also provide a custom browser configuration:

```
const sock = makeWASocket({
    browser: ['My Custom OS', 'My App Name', '1.0.0'],
    printQRInTerminal: true
})
```

The browser parameter is a tuple: `[Platform, AppName, Version]`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#receiving-full-message-history)

Receiving Full Message History

To receive complete message history when connecting, configure these options:

```
import makeWASocket, { Browsers } from '@whiskeysockets/baileys'

const sock = makeWASocket({
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: true,
    printQRInTerminal: true
})
```

1

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#)

Set syncFullHistory

Enable `syncFullHistory: true` to request full chat history from WhatsApp.

2

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#)

Use Desktop Browser

Desktop browsers (macOS, Windows, Ubuntu) receive more message history than mobile browsers.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#)

Handle History Events

History will be received via the `messaging-history.set` event after connection.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#complete-connection-example)

Complete Connection Example

Here’s a complete example with QR code authentication and session persistence:

```
import makeWASocket, { 
    Browsers, 
    DisconnectReason, 
    useMultiFileAuthState 
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

async function connectToWhatsApp() {
    // Load saved session
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        auth: state,
        browser: Browsers.macOS('Chrome'),
        printQRInTerminal: true,
        syncFullHistory: true
    })
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            console.log('QR Code updated, scan with your phone')
        }
        
        if (connection === 'close') {
            const shouldReconnect = 
                (lastDisconnect?.error as Boom)?.output?.statusCode !== 
                DisconnectReason.loggedOut
            
            console.log('Connection closed:', lastDisconnect?.error)
            
            if (shouldReconnect) {
                connectToWhatsApp()
            }
        } else if (connection === 'open') {
            console.log('Connected successfully!')
        }
    })
    
    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds)
}

connectToWhatsApp()
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#qr-code-timeout)

QR Code Timeout

You can configure how long to wait for QR code generation:

```
const sock = makeWASocket({
    qrTimeout: 60000, // 60 seconds (in milliseconds)
    printQRInTerminal: true
})
```

QR codes expire after a short period. If the user doesn’t scan in time, a new QR code will be generated automatically and emitted via the `connection.update` event.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#connection-events)

Connection Events

Monitor the QR code and connection status:

```
sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update
    
    if (qr) {
        // New QR code available
        console.log('Scan this QR code:', qr)
    }
    
    if (connection === 'connecting') {
        console.log('Establishing connection...')
    }
    
    if (connection === 'open') {
        console.log('Connection opened')
    }
    
    if (connection === 'close') {
        console.log('Connection closed')
    }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#best-practices)

Best Practices

1

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#)

Choose the Right Browser Config

Use desktop browser configs (`macOS`, `windows`, `ubuntu`) to receive more message history.

2

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#)

Save Authentication State

Always use `useMultiFileAuthState` to save sessions and avoid repeated QR scanning.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#)

Handle Reconnections

Implement automatic reconnection logic for network failures (but not for logout).

4

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#)

Display QR Properly

If building a UI, extract the QR from the `connection.update` event rather than printing to terminal.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code#next-steps)

Next Steps

## Session Management

Learn how to save and restore sessions

## Pairing Code Method

Alternative authentication without QR codes

## Handling Events

Process messages and connection events

## Socket Configuration

Advanced socket configuration options

[

WhatsApp IDs (JIDs)

Previous



](https://whiskeysockets-baileys-94.mintlify.app/concepts/whatsapp-ids)[

Connecting with Pairing Code

Next



](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code)
