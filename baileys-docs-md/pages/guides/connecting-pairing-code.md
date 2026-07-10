# Connecting with Pairing Code

Source: https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#overview)

Overview

Pairing code authentication allows you to connect Baileys to WhatsApp without scanning a QR code. Instead, you enter a phone number and receive a pairing code to enter in the WhatsApp app.

Pairing code is **not** the Mobile API - it’s a method to connect WhatsApp Web without QR codes. You can still only connect one device. [Learn more](https://faq.whatsapp.com/1324084875126592/?cms_platform=web)

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#basic-pairing-code-setup)

Basic Pairing Code Setup

1

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Disable QR Printing

Set `printQRInTerminal` to `false` when using pairing codes.

2

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Check Registration Status

Verify if credentials are already registered before requesting a pairing code.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Request Pairing Code

Call `requestPairingCode()` with the phone number.

4

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Enter Code in WhatsApp

User enters the pairing code in their WhatsApp app under “Linked Devices”.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#implementation)

Implementation

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#basic-example)

Basic Example

```
import makeWASocket from '@whiskeysockets/baileys'

const sock = makeWASocket({
    printQRInTerminal: false // REQUIRED for pairing code
})

if (!sock.authState.creds.registered) {
    const phoneNumber = '1234567890' // Without +, (), or -
    const code = await sock.requestPairingCode(phoneNumber)
    console.log(`Pairing code: ${code}`)
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#interactive-cli-example)

Interactive CLI Example

From the official example.ts:

```
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'
import readline from 'readline'

const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout 
})

const question = (text: string) => 
    new Promise<string>((resolve) => rl.question(text, resolve))

async function connectWithPairingCode() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    })
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update
        
        if (qr) {
            // Pairing code for Web clients
            if (!sock.authState.creds.registered) {
                const phoneNumber = await question('Please enter your phone number:\n')
                const code = await sock.requestPairingCode(phoneNumber)
                console.log(`Pairing code: ${code}`)
            }
        }
        
        if (connection === 'open') {
            console.log('Connected successfully!')
        }
    })
    
    sock.ev.on('creds.update', saveCreds)
}

connectWithPairingCode()
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#phone-number-format)

Phone Number Format

The phone number must be in a specific format:

-   **Include** country code
-   **No** `+` prefix
-   **No** `()` parentheses
-   **No** `-` hyphens
-   **Only** numbers

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#format-examples)

Format Examples

```
// US number: +1 (555) 123-4567
const code = await sock.requestPairingCode('15551234567')

// UK number: +44 20 1234 5678
const code = await sock.requestPairingCode('442012345678')

// Brazil: +55 11 98765-4321
const code = await sock.requestPairingCode('5511987654321')
```

```
// DON'T include +
const code = await sock.requestPairingCode('+15551234567') // ❌

// DON'T use hyphens
const code = await sock.requestPairingCode('1-555-123-4567') // ❌

// DON'T use parentheses
const code = await sock.requestPairingCode('1(555)1234567') // ❌

// DON'T use spaces
const code = await sock.requestPairingCode('1 555 123 4567') // ❌
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#phone-number-validation)

Phone Number Validation

Always sanitize user input:

```
function sanitizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    return phone.replace(/\D/g, '')
}

const userInput = '+1 (555) 123-4567'
const cleanNumber = sanitizePhoneNumber(userInput)
const code = await sock.requestPairingCode(cleanNumber)
console.log(`Code: ${code}`)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#complete-example-with-error-handling)

Complete Example with Error Handling

```
import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState 
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import readline from 'readline'

const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout 
})

const question = (text: string) => 
    new Promise<string>((resolve) => rl.question(text, resolve))

function sanitizePhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '')
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        syncFullHistory: true
    })
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr && !sock.authState.creds.registered) {
            try {
                const phoneNumber = await question(
                    'Enter phone number (with country code, no +): '
                )
                const sanitized = sanitizePhoneNumber(phoneNumber)
                
                if (!sanitized) {
                    console.error('Invalid phone number')
                    return
                }
                
                const code = await sock.requestPairingCode(sanitized)
                console.log(`\n🔐 Pairing Code: ${code}\n`)
                console.log('Enter this code in WhatsApp > Linked Devices > Link a Device')
            } catch (error) {
                console.error('Failed to request pairing code:', error)
            }
        }
        
        if (connection === 'close') {
            const shouldReconnect = 
                (lastDisconnect?.error as Boom)?.output?.statusCode !== 
                DisconnectReason.loggedOut
            
            console.log('Connection closed:', lastDisconnect?.error?.message)
            
            if (shouldReconnect) {
                console.log('Reconnecting...')
                connectToWhatsApp()
            } else {
                console.log('Logged out. Please restart to reconnect.')
                rl.close()
            }
        } else if (connection === 'open') {
            console.log('✅ Connected successfully!')
        }
    })
    
    sock.ev.on('creds.update', saveCreds)
}

connectToWhatsApp()
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#how-to-use-pairing-code-in-whatsapp)

How to Use Pairing Code in WhatsApp

1

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Open WhatsApp on Your Phone

Open the WhatsApp mobile app on your device.

2

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Go to Linked Devices

Tap on **Settings** > **Linked Devices**.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Link a Device

Tap on **“Link a Device”** button.

4

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Enter Pairing Code

Instead of scanning QR, tap **“Link with phone number instead”** and enter the pairing code displayed in your terminal.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#checking-registration-status)

Checking Registration Status

Before requesting a pairing code, check if already registered:

```
if (!sock.authState.creds.registered) {
    // Not registered yet, request pairing code
    const code = await sock.requestPairingCode(phoneNumber)
} else {
    // Already registered and authenticated
    console.log('Already registered, waiting for connection...')
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#pairing-code-vs-qr-code)

Pairing Code vs QR Code

-   Pairing Code
    
-   QR Code
    

**Advantages:**

-   Works in headless environments
-   No need to display graphics
-   Better for CLI applications
-   Can be sent via SMS/email

**Disadvantages:**

-   Requires phone number input
-   Slightly more steps for user
-   Only works with WhatsApp Web protocol

**Advantages:**

-   Faster to scan
-   No typing required
-   More familiar to users
-   Visual confirmation

**Disadvantages:**

-   Requires graphical display
-   Not suitable for headless servers
-   User must be near the screen

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#environment-detection)

Environment Detection

Automatically choose method based on environment:

```
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'

const isHeadless = !process.stdout.isTTY
const usePairingCode = process.argv.includes('--use-pairing-code') || isHeadless

async function connect() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: !usePairingCode
    })
    
    sock.ev.on('connection.update', async (update) => {
        if (update.qr) {
            if (usePairingCode && !sock.authState.creds.registered) {
                // Use pairing code in headless/CLI mode
                const phone = process.env.PHONE_NUMBER || 
                    await question('Phone number: ')
                const code = await sock.requestPairingCode(phone)
                console.log('Pairing code:', code)
            } else {
                // QR code already printed to terminal
                console.log('Scan the QR code above')
            }
        }
    })
    
    sock.ev.on('creds.update', saveCreds)
}

connect()
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#best-practices)

Best Practices

1

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Validate Phone Numbers

Always sanitize and validate phone numbers before calling `requestPairingCode()`.

2

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Save Credentials

Use `useMultiFileAuthState` to avoid requesting new pairing codes on every restart.

3

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Check Registration

Only request pairing codes when `creds.registered` is false.

4

[

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#)

Handle Timeouts

Pairing codes expire. Implement retry logic if the user takes too long to enter the code.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#troubleshooting)

Troubleshooting

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#pairing-code-not-working)

Pairing Code Not Working

-   Ensure phone number includes country code
-   Remove all special characters (+, -, spaces, parentheses)
-   Check that `printQRInTerminal` is set to `false`
-   Verify you’re checking `creds.registered` status correctly

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#connection-closes-immediately)

Connection Closes Immediately

-   Make sure to save credentials with `creds.update` event
-   Check internet connectivity
-   Verify WhatsApp app is updated to latest version

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-pairing-code#next-steps)

Next Steps

## QR Code Method

Use QR code authentication instead

## Session Management

Learn how to save and restore sessions

## Handling Events

Process messages and connection events

## Socket Configuration

Advanced socket configuration options

[

Connecting with QR Code

Previous



](https://whiskeysockets-baileys-94.mintlify.app/guides/connecting-qr-code)[

Handling Events

Next



](https://whiskeysockets-baileys-94.mintlify.app/guides/handling-events)
