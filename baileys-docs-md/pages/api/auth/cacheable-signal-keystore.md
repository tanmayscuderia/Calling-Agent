# makeCacheableSignalKeyStore

Source: https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore

The `makeCacheableSignalKeyStore` function wraps a `SignalKeyStore` with an in-memory cache to reduce database queries and improve performance.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#function-signature)

Function Signature

```
function makeCacheableSignalKeyStore(
  store: SignalKeyStore,
  logger?: ILogger,
  _cache?: CacheStore
): SignalKeyStore
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#parameters)

Parameters

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#param-store)

store

SignalKeyStore

required

The underlying key store to add caching to. Can be any implementation of `SignalKeyStore`.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#param-logger)

logger

ILogger

Optional logger to trace cache operations. Logs events like:

-   Cache hits/misses
-   Number of items loaded from store
-   Cache update operations

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#param-cache)

\_cache

CacheStore

Optional custom cache implementation. If not provided, uses a default `NodeCache` with:

-   **TTL**: 5 minutes (300 seconds)
-   **useClones**: false (stores references, not copies)
-   **deleteOnExpire**: true (automatically removes expired entries)

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#returns)

Returns

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#param-signal-key-store)

SignalKeyStore

SignalKeyStore

required

A cached wrapper around the original store with the same interfaceShow methods

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#param-get)

get

async function

Retrieves keys, checking cache first before querying the store

```
async get<T extends keyof SignalDataTypeMap>(
  type: T, 
  ids: string[]
): Promise<{ [id: string]: SignalDataTypeMap[T] }>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#param-set)

set

async function

Writes to both cache and underlying store

```
async set(data: SignalDataSet): Promise<void>
```

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#param-clear)

clear

async function

Clears both cache and underlying store

```
async clear?(): Promise<void>
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#usage-example)

Usage Example

```
import { 
  makeCacheableSignalKeyStore,
  useMultiFileAuthState 
} from '@whiskeysockets/baileys'

// Create base auth state
const { state } = await useMultiFileAuthState('./auth_info')

// Wrap the key store with caching
const cachedState = {
  ...state,
  keys: makeCacheableSignalKeyStore(
    state.keys,
    logger, // your logger instance
    customCache // optional custom cache
  )
}

// Use cached state with socket
const sock = makeWASocket({ auth: cachedState })
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#how-it-works)

How It Works

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#cache-keys)

Cache Keys

Cache keys are generated using a combination of type and ID:

```
function getUniqueId(type: string, id: string) {
  return `${type}.${id}`
}

// Examples:
// "pre-key.1"
// "session.123456789@s.whatsapp.net"
// "app-state-sync-key.abc123"
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#get-operation-flow)

Get Operation Flow

1.  **Check cache** for each requested ID
2.  **Collect cache misses** in `idsToFetch` array
3.  **Query store** only for missing IDs
4.  **Update cache** with fetched items
5.  **Return combined** results (cached + fetched)

```
async get(type, ids) {
  return cacheMutex.runExclusive(async () => {
    const data = {}
    const idsToFetch = []

    // Check cache first
    for (const id of ids) {
      const item = await cache.get(getUniqueId(type, id))
      if (typeof item !== 'undefined') {
        data[id] = item
      } else {
        idsToFetch.push(id)
      }
    }

    // Fetch missing from store
    if (idsToFetch.length) {
      logger?.trace({ items: idsToFetch.length }, 'loading from store')
      const fetched = await store.get(type, idsToFetch)
      
      // Cache fetched items
      for (const id of idsToFetch) {
        const item = fetched[id]
        if (item) {
          data[id] = item
          await cache.set(getUniqueId(type, id), item)
        }
      }
    }

    return data
  })
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#set-operation-flow)

Set Operation Flow

1.  **Update cache** with all provided data
2.  **Write to store** (pass-through to underlying implementation)
3.  **Log operation** if logger provided

```
async set(data) {
  return cacheMutex.runExclusive(async () => {
    let keys = 0
    
    // Update cache
    for (const type in data) {
      for (const id in data[type]) {
        await cache.set(getUniqueId(type, id), data[type][id])
        keys += 1
      }
    }

    logger?.trace({ keys }, 'updated cache')
    
    // Write to store
    await store.set(data)
  })
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#thread-safety)

Thread Safety

All cache operations are protected by a mutex to prevent race conditions:

```
const cacheMutex = new Mutex()

// All operations run exclusively
await cacheMutex.runExclusive(async () => {
  // Cache operations here
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#performance-benefits)

Performance Benefits

Reduced Database Queries

Frequently accessed keys (like sessions) are served from memory, significantly reducing database load.

Lower Latency

In-memory cache access is orders of magnitude faster than disk/database access.

Automatic Expiration

Default 5-minute TTL ensures cache doesn’t grow unbounded while keeping hot data available.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#custom-cache-implementation)

Custom Cache Implementation

You can provide a custom cache that implements the `CacheStore` interface:

```
interface CacheStore {
  get<T>(key: string): Promise<T> | T | undefined
  set<T>(key: string, value: T): Promise<void> | void | number | boolean
  del(key: string): void | Promise<void> | number | boolean
  flushAll(): void | Promise<void>
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#example-redis-cache)

Example: Redis Cache

```
import { createClient } from 'redis'

const redisClient = await createClient().connect()

const redisCache: CacheStore = {
  async get(key) {
    const value = await redisClient.get(key)
    return value ? JSON.parse(value) : undefined
  },
  async set(key, value) {
    await redisClient.setEx(key, 300, JSON.stringify(value))
  },
  async del(key) {
    await redisClient.del(key)
  },
  async flushAll() {
    await redisClient.flushAll()
  }
}

const cachedStore = makeCacheableSignalKeyStore(
  baseStore,
  logger,
  redisCache
)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/auth/cacheable-signal-keystore#related)

Related

-   [SignalKeyStore](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state#signalkeystore) - Base key store interface
-   [useMultiFileAuthState](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state) - File-based auth state
-   [AuthenticationState](https://whiskeysockets-baileys-94.mintlify.app/api/auth/auth-state) - Complete authentication state documentation

[

useMultiFileAuthState

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/auth/multi-file-auth-state)[

Message Types

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages)
