# Protocol Details

Source: https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details

Baileys uses WhatsApp’s binary protocol for efficient communication. This guide explains the protocol structure and how messages are encoded/decoded.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#binary-protocol-overview)

Binary Protocol Overview

WhatsApp uses a custom binary protocol instead of plain XML to reduce bandwidth and improve performance. Messages are encoded as binary nodes with a compact token-based encoding system.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#key-components)

Key Components

-   **Binary Nodes**: Structured data units with tags, attributes, and content
-   **Token Dictionary**: Predefined tokens for common strings
-   **Binary Encoding**: Efficient byte-level encoding
-   **Compression**: Optional frame compression

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#binary-node-structure)

Binary Node Structure

From `src/WABinary/types.ts:9-13`:

```
export type BinaryNode = {
    tag: string
    attrs: { [key: string]: string }
    content?: BinaryNode[] | string | Uint8Array
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#components)

Components

**Tag**: Identifies the node type

```
const node = {
    tag: 'message',  // Node type
    attrs: { ... },
    content: [ ... ]
}
```

**Attributes**: Key-value metadata

```
const node = {
    tag: 'iq',
    attrs: {
        id: 'msg-id-123',
        type: 'get',
        xmlns: 'encrypt'
    },
    content: [ ... ]
}
```

**Content**: Can be nested nodes, strings, or binary data

```
// Nested nodes
const nodeWithChildren = {
    tag: 'iq',
    attrs: { id: '1' },
    content: [
        { tag: 'query', attrs: {}, content: 'some data' },
        { tag: 'list', attrs: {}, content: [ ... ] }
    ]
}

// String content
const textNode = {
    tag: 'body',
    attrs: {},
    content: 'Hello, World!'
}

// Binary content
const binaryNode = {
    tag: 'enc',
    attrs: {},
    content: new Uint8Array([1, 2, 3, 4])
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#token-based-encoding)

Token-Based Encoding

To reduce message size, WhatsApp uses a dictionary of predefined tokens for common strings.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#token-types)

Token Types

From `src/WABinary/constants.ts:1-19`:

```
export const TAGS = {
    LIST_EMPTY: 0,
    DICTIONARY_0: 236,
    DICTIONARY_1: 237,
    DICTIONARY_2: 238,
    DICTIONARY_3: 239,
    INTEROP_JID: 245,
    FB_JID: 246,
    AD_JID: 247,
    LIST_8: 248,
    LIST_16: 249,
    JID_PAIR: 250,
    HEX_8: 251,
    BINARY_8: 252,
    BINARY_20: 253,
    BINARY_32: 254,
    NIBBLE_8: 255,
    PACKED_MAX: 127
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#single-byte-tokens)

Single-Byte Tokens

Common strings encoded as single bytes (0-235):

```
// From constants.ts:1056-1293
export const SINGLE_BYTE_TOKENS = [
    '',
    'xmlstreamstart',
    'xmlstreamend',
    's.whatsapp.net',
    'type',
    'participant',
    'from',
    'receipt',
    'id',
    'notification',
    // ... 200+ more tokens
]
```

Example: The string `"type"` is encoded as byte `4` instead of 4 bytes.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#double-byte-tokens)

Double-Byte Tokens

Less common strings use two bytes (dictionary index + token index):

```
// From constants.ts:21-1054
export const DOUBLE_BYTE_TOKENS = [
    [  // Dictionary 0
        'read-self',
        'active',
        'fbns',
        'protocol',
        // ...
    ],
    [  // Dictionary 1
        'reject',
        'dirty',
        'announcement',
        // ...
    ],
    // ... more dictionaries
]
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#encoding-process)

Encoding Process

From `src/WABinary/encode.ts:5-12`:

```
export const encodeBinaryNode = (
    node: BinaryNode,
    opts = constants,
    buffer: number[] = [0]
): Buffer => {
    const encoded = encodeBinaryNodeInner(node, opts, buffer)
    return Buffer.from(encoded)
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#encoding-steps)

Encoding Steps

1.  **Write list header** - Number of elements (tag + attributes + content)
2.  **Write tag** - Encoded as token or raw string
3.  **Write attributes** - Each key-value pair encoded
4.  **Write content** - Recursively encode based on type

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#string-encoding)

String Encoding

From `src/WABinary/encode.ts:179-209`:

```
const writeString = (str?: string) => {
    if (str === undefined || str === null) {
        pushByte(TAGS.LIST_EMPTY)
        return
    }
    
    // Check if string is in token map
    const tokenIndex = TOKEN_MAP[str]
    if (tokenIndex) {
        if (typeof tokenIndex.dict === 'number') {
            pushByte(TAGS.DICTIONARY_0 + tokenIndex.dict)
        }
        pushByte(tokenIndex.index)
    } 
    // Check if string can be packed as nibbles (numbers, -, .)
    else if (isNibble(str)) {
        writePackedBytes(str, 'nibble')
    } 
    // Check if string can be packed as hex
    else if (isHex(str)) {
        writePackedBytes(str, 'hex')
    } 
    // Try to encode as JID
    else {
        const decodedJid = jidDecode(str)
        if (decodedJid) {
            writeJid(decodedJid)
        } else {
            writeStringRaw(str)  // Fallback: raw UTF-8
        }
    }
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#packed-encoding)

Packed Encoding

**Nibble Packing**: Stores numbers and special chars (-, .) as 4-bit values

```
// "123-456" packed into fewer bytes
const packNibble = (char: string) => {
    switch (char) {
        case '-': return 10
        case '.': return 11
        case '\0': return 15
        default:
            if (char >= '0' && char <= '9') {
                return char.charCodeAt(0) - '0'.charCodeAt(0)
            }
    }
}
```

**Hex Packing**: Stores hex strings (0-9, A-F) efficiently

```
// "ABCD1234" packed as 4-bit values
const packHex = (char: string) => {
    if (char >= '0' && char <= '9') {
        return char.charCodeAt(0) - '0'.charCodeAt(0)
    }
    if (char >= 'A' && char <= 'F') {
        return 10 + char.charCodeAt(0) - 'A'.charCodeAt(0)
    }
    // ...
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#jid-encoding)

JID Encoding

WhatsApp IDs (JIDs) are specially encoded:

```
const writeJid = ({ domainType, device, user, server }: FullJid) => {
    if (typeof device !== 'undefined') {
        // Device JID (e.g., "123@s.whatsapp.net:1")
        pushByte(TAGS.AD_JID)
        pushByte(domainType || 0)
        pushByte(device || 0)
        writeString(user)
    } else {
        // Simple JID pair (e.g., "123@s.whatsapp.net")
        pushByte(TAGS.JID_PAIR)
        if (user.length) {
            writeString(user)
        } else {
            pushByte(TAGS.LIST_EMPTY)
        }
        writeString(server)
    }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#decoding-process)

Decoding Process

From `src/WABinary/decode.ts:9-18`:

```
export const decompressingIfRequired = async (buffer: Buffer) => {
    if (2 & buffer.readUInt8()) {
        // Bit 1 set: compressed
        buffer = await inflatePromise(buffer.slice(1))
    } else {
        // No compression, skip 0x00 prefix
        buffer = buffer.slice(1)
    }
    return buffer
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#decoding-steps)

Decoding Steps

1.  **Decompress** - If compression flag is set
2.  **Read list size** - Number of elements
3.  **Read tag** - First element is always the tag
4.  **Read attributes** - Pairs of key-value strings
5.  **Read content** - If list size is even, read content

From `src/WABinary/decode.ts:251-296`:

```
const listSize = readListSize(readByte()!)
const header = readString(readByte()!)

const attrs: BinaryNode['attrs'] = {}
let data: BinaryNode['content']

// Read attributes (pairs)
const attributesLength = (listSize - 1) >> 1
for (let i = 0; i < attributesLength; i++) {
    const key = readString(readByte()!)
    const value = readString(readByte()!)
    attrs[key] = value
}

// Read content if present
if (listSize % 2 === 0) {
    const tag = readByte()!
    if (isListTag(tag)) {
        data = readList(tag)  // Child nodes
    } else {
        // Binary or string content
        switch (tag) {
            case TAGS.BINARY_8:
                data = readBytes(readByte()!)
                break
            case TAGS.BINARY_20:
                data = readBytes(readInt20())
                break
            case TAGS.BINARY_32:
                data = readBytes(readInt(4))
                break
            default:
                data = readString(tag)
        }
    }
}

return { tag: header, attrs, content: data }
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#frame-format)

Frame Format

WhatsApp frames are wrapped with:

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#header)

Header

From `src/Defaults/index.ts:34`:

```
export const NOISE_WA_HEADER = Buffer.from([87, 65, 6, DICT_VERSION])
// WA (0x57 0x41) + Protocol Version (6) + Dictionary Version (3)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#compression)

Compression

Frames can be optionally compressed using zlib:

```
// First byte indicates compression
// 0x00 = uncompressed
// 0x02 = compressed (zlib inflate)
if (2 & buffer.readUInt8()) {
    buffer = await inflatePromise(buffer.slice(1))
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#common-node-examples)

Common Node Examples

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#query-node)

Query Node

```
const queryNode: BinaryNode = {
    tag: 'iq',
    attrs: {
        id: 'msg-123',
        type: 'get',
        xmlns: 'encrypt',
        to: 's.whatsapp.net'
    },
    content: [
        {
            tag: 'count',
            attrs: {},
            content: undefined
        }
    ]
}
```

This queries the server for pre-key count.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#message-node)

Message Node

```
const messageNode: BinaryNode = {
    tag: 'message',
    attrs: {
        id: 'msg-456',
        type: 'text',
        from: '1234567890@s.whatsapp.net',
        to: '0987654321@s.whatsapp.net',
        t: '1678901234'
    },
    content: [
        {
            tag: 'enc',
            attrs: { v: '2', type: 'msg' },
            content: new Uint8Array([/* encrypted data */])
        }
    ]
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#presence-node)

Presence Node

```
const presenceNode: BinaryNode = {
    tag: 'presence',
    attrs: {
        name: 'John Doe',
        type: 'available'
    }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#working-with-binary-nodes)

Working with Binary Nodes

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#creating-nodes)

Creating Nodes

```
import { encodeBinaryNode } from '@whiskeysockets/baileys'

const node: BinaryNode = {
    tag: 'iq',
    attrs: { id: '1', type: 'get' },
    content: [
        { tag: 'ping', attrs: {} }
    ]
}

const encoded = encodeBinaryNode(node)
// Send via WebSocket
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#parsing-nodes)

Parsing Nodes

```
import { decodeBinaryNode } from '@whiskeysockets/baileys'

const buffer = Buffer.from([/* binary data */])
const node = await decodeBinaryNode(buffer)

console.log('Tag:', node.tag)
console.log('Attrs:', node.attrs)
console.log('Content:', node.content)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#extracting-content)

Extracting Content

```
import { 
    getBinaryNodeChild, 
    getBinaryNodeChildren,
    getAllBinaryNodeChildren 
} from '@whiskeysockets/baileys'

// Get first child with specific tag
const countNode = getBinaryNodeChild(node, 'count')

// Get all children with specific tag
const refNodes = getBinaryNodeChildren(node, 'ref')

// Get all child nodes (of any type)
const allChildren = getAllBinaryNodeChildren(node)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#converting-to-string-debug)

Converting to String (Debug)

```
import { binaryNodeToString } from '@whiskeysockets/baileys'

const xmlString = binaryNodeToString(node)
console.log(xmlString)
// Output: <iq id="1" type="get"><ping/></iq>
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#protocol-constants)

Protocol Constants

From `src/Defaults/index.ts`:

```
// Noise protocol header
export const NOISE_MODE = 'Noise_XX_25519_AESGCM_SHA256\0\0\0\0'
export const NOISE_WA_HEADER = Buffer.from([87, 65, 6, 3])

// Dictionary version
export const DICT_VERSION = 3

// Key bundle type
export const KEY_BUNDLE_TYPE = Buffer.from([5])

// Default ephemeral message duration
export const WA_DEFAULT_EPHEMERAL = 7 * 24 * 60 * 60
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#best-practices)

Best Practices

**Use Helper Functions**: Baileys provides utilities for working with binary nodes. Use them instead of manual parsing.

```
// Good
const child = getBinaryNodeChild(node, 'query')

// Avoid
const child = Array.isArray(node.content) 
    ? node.content.find(n => typeof n === 'object' && n.tag === 'query')
    : null
```

**Type Safety**: Always check content types before accessing:

```
if (Array.isArray(node.content)) {
    // Process as child nodes
    for (const child of node.content) {
        if (typeof child === 'object' && child.tag) {
            // Process child node
        }
    }
} else if (typeof node.content === 'string') {
    // Process as text
} else if (node.content instanceof Uint8Array) {
    // Process as binary
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#debugging-tools)

Debugging Tools

Enable trace logging to see binary node XML representations:

```
import makeWASocket from '@whiskeysockets/baileys'
import P from 'pino'

const sock = makeWASocket({
    logger: P({ level: 'trace' })
})
```

Output example:

```
{
    "xml": "<iq id='1' type='get'><ping/></iq>",
    "msg": "xml send"
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#learn-more)

Learn More

To understand the underlying cryptography:

-   **Libsignal Protocol**: End-to-end encryption protocol
-   **Noise Protocol Framework**: Handshake patterns and session keys

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/advanced/protocol-details#next-steps)

Next Steps

-   [Custom Functionality](https://whiskeysockets-baileys-94.mintlify.app/advanced/custom-functionality) - Using binary nodes in handlers
-   [WebSocket Events](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events) - Intercepting protocol messages
-   [Debugging](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging) - Troubleshooting protocol issues

[

WebSocket Events

Previous



](https://whiskeysockets-baileys-94.mintlify.app/advanced/websocket-events)[

Debugging & Troubleshooting

Next



](https://whiskeysockets-baileys-94.mintlify.app/advanced/debugging)
