# Browsers

Source: https://whiskeysockets-baileys-94.mintlify.app/api/browsers

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#overview)

Overview

The `Browsers` constant provides predefined browser configurations for WhatsApp Web connections. Different browser configurations can affect the connection behavior, message history sync, and device identification.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#type-definition)

Type Definition

```
type BrowsersMap = {
  ubuntu(browser: string): [string, string, string]
  macOS(browser: string): [string, string, string]
  baileys(browser: string): [string, string, string]
  windows(browser: string): [string, string, string]
  appropriate(browser: string): [string, string, string]
}
```

Each function returns a `WABrowserDescription` tuple: `[OS, Browser, Version]`

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#available-configurations)

Available Configurations

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#browsers-ubuntu)

Browsers.ubuntu()

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-browser)

browser

string

required

The browser name to use (e.g., ‘Chrome’, ‘Firefox’, ‘MyApp’).

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-return)

return

\[string, string, string\]

Returns `['Ubuntu', browser, '22.04.4']`

```
import { Browsers } from '@whiskeysockets/baileys'

const config = Browsers.ubuntu('Chrome')
// Returns: ['Ubuntu', 'Chrome', '22.04.4']

const sock = makeWASocket({
  browser: Browsers.ubuntu('MyApp'),
  auth: state
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#browsers-macos)

Browsers.macOS()

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-browser-1)

browser

string

required

The browser name to use (e.g., ‘Safari’, ‘Chrome’, ‘Desktop’).

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-return-1)

return

\[string, string, string\]

Returns `['Mac OS', browser, '14.4.1']`

```
import { Browsers } from '@whiskeysockets/baileys'

const config = Browsers.macOS('Safari')
// Returns: ['Mac OS', 'Safari', '14.4.1']

// This is the default configuration
const sock = makeWASocket({
  browser: Browsers.macOS('Chrome'), // Default
  auth: state
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#browsers-baileys)

Browsers.baileys()

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-browser-2)

browser

string

required

The browser/app name to use (e.g., ‘MyApp’, ‘Bot’).

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-return-2)

return

\[string, string, string\]

Returns `['Baileys', browser, '6.5.0']`

```
import { Browsers } from '@whiskeysockets/baileys'

const config = Browsers.baileys('MyBot')
// Returns: ['Baileys', 'MyBot', '6.5.0']

const sock = makeWASocket({
  browser: Browsers.baileys('WhatsAppBot'),
  auth: state
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#browsers-windows)

Browsers.windows()

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-browser-3)

browser

string

required

The browser name to use (e.g., ‘Edge’, ‘Chrome’).

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-return-3)

return

\[string, string, string\]

Returns `['Windows', browser, '10.0.22631']`

```
import { Browsers } from '@whiskeysockets/baileys'

const config = Browsers.windows('Edge')
// Returns: ['Windows', 'Edge', '10.0.22631']

const sock = makeWASocket({
  browser: Browsers.windows('Chrome'),
  auth: state
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#browsers-appropriate)

Browsers.appropriate()

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-browser-4)

browser

string

required

The browser name to use.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-return-4)

return

\[string, string, string\]

Returns browser configuration based on your current operating system and release version.

```
import { Browsers } from '@whiskeysockets/baileys'

// Automatically detects OS and uses appropriate configuration
const config = Browsers.appropriate('Chrome')
// On macOS: ['Mac OS', 'Chrome', '14.4.1']
// On Ubuntu: ['Ubuntu', 'Chrome', '22.04.4']
// On Windows: ['Windows', 'Chrome', '10.0.22631']
// On others: ['Ubuntu', 'Chrome', release()]

const sock = makeWASocket({
  browser: Browsers.appropriate('MyApp'),
  auth: state
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#platform-mapping)

Platform Mapping

The `appropriate()` function uses the following platform detection:

```
const PLATFORM_MAP = {
  aix: 'AIX',
  darwin: 'Mac OS',
  win32: 'Windows',
  android: 'Android',
  freebsd: 'FreeBSD',
  openbsd: 'OpenBSD',
  sunos: 'Solaris',
  linux: undefined,    // Falls back to 'Ubuntu'
  haiku: undefined,    // Falls back to 'Ubuntu'
  cygwin: undefined,   // Falls back to 'Ubuntu'
  netbsd: undefined    // Falls back to 'Ubuntu'
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#getplatformid)

getPlatformId()

Utility function to get the platform ID for a given browser string.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-browser-5)

browser

string

required

The browser name (case-insensitive).

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#param-return-5)

return

string

Returns the platform type ID. Defaults to ‘1’ (Chrome) if not found.

```
import { getPlatformId } from '@whiskeysockets/baileys'

const platformId = getPlatformId('chrome')
// Returns platform ID based on proto.DeviceProps.PlatformType
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#usage-examples)

Usage Examples

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#qr-code-connection-with-custom-browser)

QR Code Connection with Custom Browser

```
import makeWASocket, { Browsers } from '@whiskeysockets/baileys'

const sock = makeWASocket({
  browser: Browsers.ubuntu('MyApp'),
  printQRInTerminal: true,
  auth: state
})

// QR code will show "MyApp" on Ubuntu
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#desktop-configuration-for-full-history)

Desktop Configuration for Full History

To receive more message history, use a desktop configuration:

```
import makeWASocket, { Browsers } from '@whiskeysockets/baileys'

const sock = makeWASocket({
  browser: Browsers.macOS('Desktop'),
  syncFullHistory: true,
  auth: state
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#dynamic-browser-selection)

Dynamic Browser Selection

```
import makeWASocket, { Browsers } from '@whiskeysockets/baileys'

const useQR = true
const appName = 'MyWhatsAppBot'

const sock = makeWASocket({
  browser: useQR 
    ? Browsers.ubuntu(appName)  // Shows on QR code scan
    : Browsers.appropriate(appName), // Matches system
  printQRInTerminal: useQR,
  auth: state
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#pairing-code-with-custom-name)

Pairing Code with Custom Name

```
import makeWASocket, { Browsers } from '@whiskeysockets/baileys'

const sock = makeWASocket({
  browser: Browsers.baileys('MyCustomBot'),
  printQRInTerminal: false,
  auth: state
})

if (!sock.authState.creds.registered) {
  const code = await sock.requestPairingCode('1234567890')
  console.log(`Pairing code: ${code}`)
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#browser-configuration-impact)

Browser Configuration Impact

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#message-history)

Message History

Different browser configurations can affect how much message history you receive:

-   **Desktop configurations** (e.g., `Browsers.macOS('Desktop')`) typically receive more history
-   **Mobile-like configurations** may receive less history
-   Combined with `syncFullHistory: true` for maximum history sync

```
const sock = makeWASocket({
  browser: Browsers.macOS('Desktop'),
  syncFullHistory: true,
  auth: state
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#device-identification)

Device Identification

The browser configuration is visible in WhatsApp’s “Linked Devices” section:

```
// Shows as "Chrome on Ubuntu" in WhatsApp
browser: Browsers.ubuntu('Chrome')

// Shows as "MyApp on Baileys" in WhatsApp
browser: Browsers.baileys('MyApp')
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#default-configuration)

Default Configuration

When not specified, Baileys uses:

```
const DEFAULT_CONNECTION_CONFIG = {
  browser: Browsers.macOS('Chrome'),
  // ... other defaults
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#complete-example)

Complete Example

```
import makeWASocket, { 
  Browsers,
  useMultiFileAuthState,
  DisconnectReason 
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

const { state, saveCreds } = await useMultiFileAuthState('auth_info')

const sock = makeWASocket({
  browser: Browsers.ubuntu('MyWhatsAppClient'),
  syncFullHistory: true,
  auth: state
})

sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect, qr } = update
  
  if (connection === 'close') {
    const shouldReconnect = 
      (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
    
    if (shouldReconnect) {
      console.log('Reconnecting...')
      // Reconnect logic
    }
  } else if (connection === 'open') {
    console.log('Connected! Device shows as "MyWhatsAppClient on Ubuntu"')
  }
  
  if (qr) {
    console.log('Scan this QR code with WhatsApp')
    // QR will display "MyWhatsAppClient" as the client name
  }
})

sock.ev.on('creds.update', saveCreds)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#best-practices)

Best Practices

1.  **Use descriptive names**: Choose browser names that identify your application
    
    ```
    browser: Browsers.ubuntu('MyCompanyBot')
    ```
    
2.  **Match your deployment**: Use `appropriate()` for automatic OS detection
    
    ```
    browser: Browsers.appropriate('MyApp')
    ```
    
3.  **Desktop for history**: Use desktop configurations when full history is needed
    
    ```
    browser: Browsers.macOS('Desktop')
    syncFullHistory: true
    ```
    
4.  **Consistent branding**: Keep the same browser name across reconnections
    
    ```
    const APP_NAME = 'MyApp'
    browser: Browsers.ubuntu(APP_NAME)
    ```
    

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#source-code-reference)

Source Code Reference

From `src/Utils/browser-utils.ts:19-26`:

```
export const Browsers: BrowsersMap = {
  ubuntu: browser => ['Ubuntu', browser, '22.04.4'],
  macOS: browser => ['Mac OS', browser, '14.4.1'],
  baileys: browser => ['Baileys', browser, '6.5.0'],
  windows: browser => ['Windows', browser, '10.0.22631'],
  appropriate: browser => [PLATFORM_MAP[platform()] || 'Ubuntu', browser, release()]
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/browsers#see-also)

See Also

-   [makeWASocket](https://whiskeysockets-baileys-94.mintlify.app/api/makewasocket) - Main socket creation function
-   [SocketConfig](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config) - Complete socket configuration
-   [WABrowserDescription Type](https://github.com/WhiskeySockets/Baileys/blob/master/src/Types/Socket.ts#L11) - Type definition

[

SocketConfig

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/socket-config)[

AuthenticationState

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state)
