# Quick Start

Source: https://whiskeysockets-baileys-94.mintlify.app/quickstart

This guide will walk you through creating a basic WhatsApp connection and sending your first message using Baileys.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#prerequisites)

Prerequisites

Before you begin, make sure you have:

-   Node.js 20.0.0 or higher installed
-   Baileys installed in your project (see [Installation](https://whiskeysockets-baileys-94.mintlify.app/installation))
-   A WhatsApp account on your phone

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#basic-connection-setup)

Basic Connection Setup

Follow these steps to create your first WhatsApp bot:

1

[

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#)

Create a new file

Create a new file called `bot.ts` (or `bot.js` for JavaScript):

bot.ts

```
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
```

2

[

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#)

Define the connection function

Create an async function to handle the connection:

```
async function connectToWhatsApp() {
  // Load or create authentication state
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
  
  // Create the socket connection
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })
  
  // Connection event handler will go here
}
```

`useMultiFileAuthState` saves your session credentials in the `auth_info_baileys` folder so you don’t have to scan the QR code every time.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#)

Handle connection events

Add event handlers for connection updates:

```
sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update
  
  if (connection === 'close') {
    const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
    console.log('connection closed due to', lastDisconnect?.error, ', reconnecting:', shouldReconnect)
    
    // Reconnect if not logged out
    if (shouldReconnect) {
      connectToWhatsApp()
    }
  } else if (connection === 'open') {
    console.log('opened connection')
  }
})
```

4

[

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#)

Save credentials on update

Save authentication credentials whenever they update:

```
sock.ev.on('creds.update', saveCreds)
```

Always save credentials when they update. Failing to do so will cause message decryption failures and prevent messages from reaching recipients.

5

[

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#)

Handle incoming messages

Listen for incoming messages and send a reply:

```
sock.ev.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0]
  
  if (!msg.key.fromMe && msg.message) {
    console.log('Received message:', msg.message)
    
    // Reply to the message
    await sock.sendMessage(msg.key.remoteJid!, { 
      text: 'Hello! I received your message.' 
    })
  }
})
```

6

[

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#)

Start the connection

Return the socket and start the connection:

```
return sock
}

// Run the connection
connectToWhatsApp()
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#complete-example)

Complete Example

Here’s the complete working code:

bot.ts

```
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })
  
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('connection closed due to', lastDisconnect?.error, ', reconnecting:', shouldReconnect)
      
      if (shouldReconnect) {
        connectToWhatsApp()
      }
    } else if (connection === 'open') {
      console.log('opened connection')
    }
  })
  
  sock.ev.on('creds.update', saveCreds)
  
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    
    if (!msg.key.fromMe && msg.message) {
      console.log('Received message:', msg.message)
      
      await sock.sendMessage(msg.key.remoteJid!, { 
        text: 'Hello! I received your message.' 
      })
    }
  })
  
  return sock
}

connectToWhatsApp()
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#running-your-bot)

Running Your Bot

1

[

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#)

Run the script

Execute your bot file:

```
npx tsx bot.ts
```

```
npx ts-node bot.ts
```

```
node bot.js
```

2

[

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#)

Scan the QR code

A QR code will appear in your terminal. Open WhatsApp on your phone:

1.  Go to **Settings** > **Linked Devices**
2.  Tap **Link a Device**
3.  Scan the QR code displayed in your terminal

The QR code expires after a short time. If it expires, restart your script to generate a new one.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#)

Test your bot

Once connected, send a message to your own WhatsApp number from another contact. Your bot should automatically reply!

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#using-pairing-code-alternative)

Using Pairing Code (Alternative)

If you prefer using a pairing code instead of QR code:

```
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'

async function connectWithPairingCode() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false  // Must be false for pairing code
  })
  
  // Request pairing code if not registered
  if (!sock.authState.creds.registered) {
    const phoneNumber = '1234567890'  // Your phone number without + or -
    const code = await sock.requestPairingCode(phoneNumber)
    console.log(`Pairing code: ${code}`)
  }
  
  // Add event handlers as before
  sock.ev.on('connection.update', (update) => { /* ... */ })
  sock.ev.on('creds.update', saveCreds)
  
  return sock
}

connectWithPairingCode()
```

Phone numbers for pairing must include the country code with no `+`, `()`, or `-` symbols. For example: `1234567890` for US numbers.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#sending-your-first-message)

Sending Your First Message

Once connected, you can send messages programmatically:

```
// Send a text message
await sock.sendMessage('1234567890@s.whatsapp.net', { 
  text: 'Hello from Baileys!' 
})

// Send to a group
await sock.sendMessage('123456789-987654321@g.us', {
  text: 'Hello group!'
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#whatsapp-id-format)

WhatsApp ID Format

WhatsApp IDs (JIDs) follow these formats:

-   **Individual:** `[country code][phone number]@s.whatsapp.net`
-   **Group:** `[group-id]@g.us`
-   **Broadcast:** `[timestamp]@broadcast`
-   **Status:** `status@broadcast`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#what%E2%80%99s-next)

What’s Next?

## Authentication Guide

Learn about session management and authentication states

## Handling Events

Master the event system for messages, groups, and more

## Sending Messages

Explore all message types: media, polls, reactions, and more

## Complete Example

View the full example with advanced features

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#common-issues)

Common Issues

QR code not appearing

Make sure `printQRInTerminal: true` is set in your socket configuration. Also ensure your terminal supports rendering QR codes.

Connection keeps closing

Check your internet connection. Also verify that you’re not logged out from WhatsApp. The bot will automatically reconnect unless you’ve been logged out.

Messages not being received

Make sure you’re saving credentials with `sock.ev.on('creds.update', saveCreds)`. Without this, message decryption will fail.

Cannot send messages to myself

Use the `!msg.key.fromMe` check to filter out your own messages and avoid loops.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/quickstart#production-considerations)

Production Considerations

This quickstart is for learning purposes. For production:

-   Use a database to store authentication state instead of files
-   Implement proper error handling and logging
-   Add rate limiting to prevent spam
-   Consider using the `getMessage` callback for message retry
-   Enable caching for group metadata
-   Review all [socket configuration options](https://whiskeysockets-baileys-94.mintlify.app/guides/socket-configuration)

[

Installation

Previous



](https://whiskeysockets-baileys-94.mintlify.app/installation)[

Authentication

Next



](https://whiskeysockets-baileys-94.mintlify.app/concepts/authentication)
