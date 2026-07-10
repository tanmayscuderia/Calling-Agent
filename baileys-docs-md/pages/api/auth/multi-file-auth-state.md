# useMultiFileAuthState

Source: https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state

The `useMultiFileAuthState` function provides a file-based implementation of authentication state storage. It’s more efficient than single-file storage but recommended for development/bot use only.

While more efficient than single-file storage, this is **not recommended for production** applications. Consider implementing authentication state storage with a proper SQL or NoSQL database for production use.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#function-signature)

Function Signature

```
const useMultiFileAuthState = async (
  folder: string
): Promise<{ 
  state: AuthenticationState; 
  saveCreds: () => Promise<void> 
}>
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#parameters)

Parameters

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#param-folder)

folder

string

required

Path to the folder where authentication state files will be stored. The folder will be created if it doesn’t exist.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#returns)

Returns

Returns a Promise that resolves to an object with:

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#param-state)

state

AuthenticationState

required

The authentication state object containing credentials and keysShow properties

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#param-creds)

creds

AuthenticationCreds

Authentication credentials loaded from `creds.json` or newly initialized

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#param-keys)

keys

SignalKeyStore

Key store implementation with file-based persistenceShow methods

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#param-get)

get

async function

Retrieve keys by type and IDs from JSON files

```
async (type: string, ids: string[]) => {
  // Reads files like: pre-key-1.json, session-abc.json
  // Returns: { [id]: value }
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#param-set)

set

async function

Store keys to JSON files, delete if value is null

```
async (data: SignalDataSet) => {
  // Writes/deletes files like: pre-key-1.json, session-abc.json
}
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#param-save-creds)

saveCreds

() => Promise<void>

required

Function to persist credentials to disk. Call this after credential updates to save changes.

```
await saveCreds() // Writes to creds.json
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#usage-example)

Usage Example

```
import { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('./auth_info')

// Use the state when creating a socket connection
const sock = makeWASocket({
  auth: state,
  // ... other options
})

// Listen for credential updates and save them
sock.ev.on('creds.update', saveCreds)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#file-structure)

File Structure

The function creates the following file structure:

```
auth_info/
├── creds.json                    # Main credentials
├── pre-key-1.json               # Individual pre-keys
├── pre-key-2.json
├── session-123456789.json        # Session data
├── app-state-sync-key-xyz.json  # App state keys
└── ...
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#key-features)

Key Features

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#file-locking)

File Locking

The implementation uses per-file mutex locks to prevent race conditions when reading/writing files concurrently:

```
const fileLocks = new Map<string, Mutex>()
const getFileLock = (path: string): Mutex => {
  let mutex = fileLocks.get(path)
  if (!mutex) {
    mutex = new Mutex()
    fileLocks.set(path, mutex)
  }
  return mutex
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#file-name-sanitization)

File Name Sanitization

Special characters in key IDs are sanitized for safe file system usage:

-   `/` → `__`
-   `:` → `-`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#automatic-initialization)

Automatic Initialization

If `creds.json` doesn’t exist, new credentials are automatically initialized using `initAuthCreds()`.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#special-handling-for-app-state-keys)

Special Handling for App State Keys

App state sync keys are deserialized using protobuf:

```
if (type === 'app-state-sync-key' && value) {
  value = proto.Message.AppStateSyncKeyData.fromObject(value)
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#error-handling)

Error Handling

The function will throw an error if a non-directory file exists at the specified folder path.

```
if (folderInfo && !folderInfo.isDirectory()) {
  throw new Error(
    `found something that is not a directory at ${folder}, ` +
    `either delete it or specify a different location`
  )
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state#related)

Related

-   [AuthenticationState](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state) - Authentication state types
-   [makeCacheableSignalKeyStore](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore) - Add caching to key stores

[

AuthenticationState

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state)[

makeCacheableSignalKeyStore

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore)
