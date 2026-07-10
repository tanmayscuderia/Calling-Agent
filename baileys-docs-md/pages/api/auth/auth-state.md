# AuthenticationState

Source: https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state

The authentication state manages credentials and cryptographic keys required for WhatsApp Web sessions.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#authenticationstate)

AuthenticationState

The main authentication state object that combines credentials and key storage.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-creds)

creds

AuthenticationCreds

required

Authentication credentials containing identity keys and account information

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-keys)

keys

SignalKeyStore

required

Key store for managing Signal protocol keys (pre-keys, sessions, etc.)

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#authenticationcreds)

AuthenticationCreds

Extends `SignalCreds` with additional WhatsApp-specific authentication data.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-signed-identity-key)

signedIdentityKey

KeyPair

required

The signed identity key pair (readonly)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-signed-pre-key)

signedPreKey

SignedKeyPair

required

The signed pre-key pair (readonly)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-registration-id)

registrationId

number

required

Signal protocol registration ID (readonly)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-noise-key)

noiseKey

KeyPair

required

Noise protocol key pair for encryption (readonly)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-pairing-ephemeral-key-pair)

pairingEphemeralKeyPair

KeyPair

required

Ephemeral key pair used during device pairing (readonly)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-adv-secret-key)

advSecretKey

string

required

Advanced secret key for device identity

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-me)

me

Contact

Your own contact information

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-account)

account

proto.IADVSignedDeviceIdentity

Signed device identity from WhatsApp

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-signal-identities)

signalIdentities

SignalIdentity\[\]

Array of signal identities for registered devices

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-my-app-state-key-id)

myAppStateKeyId

string

Key ID for app state synchronization

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-first-unuploaded-pre-key-id)

firstUnuploadedPreKeyId

number

required

ID of the first pre-key that hasn’t been uploaded to servers

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-next-pre-key-id)

nextPreKeyId

number

required

The next pre-key ID to generate

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-last-account-sync-timestamp)

lastAccountSyncTimestamp

number

Unix timestamp of last account synchronization

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-platform)

platform

string

Platform identifier (e.g., “android”, “ios”)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-processed-history-messages)

processedHistoryMessages

MinimalMessage\[\]

required

Array of history messages that have been processed

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-account-sync-counter)

accountSyncCounter

number

required

Number of times history and app state has been synced

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-account-settings)

accountSettings

AccountSettings

required

Account-level settings

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-registered)

registered

boolean

required

Whether the account is fully registered

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-pairing-code)

pairingCode

string | undefined

required

Pairing code for linking devices

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-last-prop-hash)

lastPropHash

string | undefined

required

Hash of last properties update

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-routing-info)

routingInfo

Buffer | undefined

required

Routing information for message delivery

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-additional-data)

additionalData

any | undefined

Additional custom data

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#supporting-types)

Supporting Types

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#keypair)

KeyPair

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-public)

public

Uint8Array

required

Public key bytes

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-private)

private

Uint8Array

required

Private key bytes

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#signedkeypair)

SignedKeyPair

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-key-pair)

keyPair

KeyPair

required

The key pair

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-signature)

signature

Uint8Array

required

Signature of the key pair

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-key-id)

keyId

number

required

Unique identifier for this key

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-timestamps)

timestampS

number

Timestamp in seconds when the key was created

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#signalidentity)

SignalIdentity

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-identifier)

identifier

ProtocolAddress

required

Protocol address containing JID and device ID

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-identifier-key)

identifierKey

Uint8Array

required

Identity key bytes

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#protocoladdress)

ProtocolAddress

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-name)

name

string

required

The JID (WhatsApp ID)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-device-id)

deviceId

number

required

Device identifier

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#accountsettings)

AccountSettings

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-unarchive-chats)

unarchiveChats

boolean

required

Whether to unarchive chats when a new message is received

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-default-disappearing-mode)

defaultDisappearingMode

Pick<proto.IConversation, 'ephemeralExpiration' | 'ephemeralSettingTimestamp'>

The default mode to start new conversations with for disappearing messages

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#signalkeystore)

SignalKeyStore

Interface for storing and retrieving Signal protocol keys.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-get)

get

function

required

Retrieve keys from the store

```
get<T extends keyof SignalDataTypeMap>(
  type: T, 
  ids: string[]
): Awaitable<{ [id: string]: SignalDataTypeMap[T] }>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-set)

set

function

required

Store keys in the store

```
set(data: SignalDataSet): Awaitable<void>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-clear)

clear

function

Clear all data in the store

```
clear?(): Awaitable<void>
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#signaldatatypemap)

SignalDataTypeMap

Mapping of Signal data types to their value types:

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-pre-key)

pre-key

KeyPair

Pre-key pairs for establishing sessions

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-session)

session

Uint8Array

Encrypted session state

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-sender-key)

sender-key

Uint8Array

Group message sender keys

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-sender-key-memory)

sender-key-memory

{ \[jid: string\]: boolean }

Cache of distributed sender keys

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-app-state-sync-key)

app-state-sync-key

proto.Message.IAppStateSyncKeyData

Keys for syncing app state

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-app-state-sync-version)

app-state-sync-version

LTHashState

Version info for app state sync

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-lid-mapping)

lid-mapping

string

Mapping between phone numbers and LIDs

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-device-list)

device-list

string\[\]

List of devices associated with an account

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-tctoken)

tctoken

{ token: Buffer; timestamp?: string }

Temporary credentials token

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#param-identity-key)

identity-key

Uint8Array

Identity keys for contacts

[

Browsers

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/browsers)[

useMultiFileAuthState

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state)
