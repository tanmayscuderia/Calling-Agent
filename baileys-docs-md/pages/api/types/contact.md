# Contact Types

Source: https://whiskeysockets-baileys-94.mintlify.app/api/types/contact

Contact types represent WhatsApp user information including profile details and identifiers.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#contact)

Contact

Represents a WhatsApp contact with their profile information.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#param-id)

id

string

required

Contact ID in either LID or JID format (preferred)Examples:

-   `"1234567890@s.whatsapp.net"` (JID format)
-   `"1234567890@lid"` (LID format)

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#param-lid)

lid

string

Contact ID in LID format onlyExample: `"1234567890@lid"`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#param-phone-number)

phoneNumber

string

Contact ID in phone number formatExample: `"1234567890@s.whatsapp.net"`

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#param-name)

name

string

Name of the contact as you have saved it on your WhatsAppThis is the name you manually set for this contact in your phone’s contacts.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#param-notify)

notify

string

Name that the contact has set for themselves on WhatsAppThis is their WhatsApp display name, set by them in their profile.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#param-verified-name)

verifiedName

string

Verified business name (for business accounts)Only present for verified business accounts.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#param-img-url)

imgUrl

string | null

URL of the contact’s profile pictureBaileys-specific addition. Possible values:

-   `"changed"` - Profile picture has been updated
-   `null` - No profile picture set (using default)
-   `string` - URL to the profile picture

This field is populated by Baileys and may not always be present or up-to-date.

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#param-status)

status

string

Contact’s WhatsApp status messageBaileys-specific addition. Contains the “About” text from the contact’s profile.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#usage-examples)

Usage Examples

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#basic-contact-information)

Basic Contact Information

```
import { Contact } from '@whiskeysockets/baileys'

const contact: Contact = {
  id: '1234567890@s.whatsapp.net',
  name: 'John Doe',
  notify: 'Johnny',
  imgUrl: 'https://pps.whatsapp.net/...',
  status: 'Hey there! I am using WhatsApp.'
}

console.log(contact.name)   // Your saved name: "John Doe"
console.log(contact.notify) // Their display name: "Johnny"
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#handling-lid-and-phone-number-formats)

Handling LID and Phone Number Formats

```
const contact: Contact = {
  id: '1234567890@lid',
  lid: '1234567890@lid',
  phoneNumber: '1234567890@s.whatsapp.net',
  notify: 'Alice'
}

// Prefer LID format when available
const preferredId = contact.lid || contact.phoneNumber || contact.id
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#profile-picture-status)

Profile Picture Status

```
function getProfilePictureInfo(contact: Contact) {
  if (contact.imgUrl === null) {
    return 'Using default profile picture'
  } else if (contact.imgUrl === 'changed') {
    return 'Profile picture was recently updated'
  } else if (contact.imgUrl) {
    return `Profile picture URL: ${contact.imgUrl}`
  } else {
    return 'Profile picture status unknown'
  }
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#business-account-detection)

Business Account Detection

```
function isBusinessAccount(contact: Contact): boolean {
  return !!contact.verifiedName
}

const contact: Contact = {
  id: 'business@s.whatsapp.net',
  notify: 'ACME Corp',
  verifiedName: 'ACME Corporation'
}

console.log(isBusinessAccount(contact)) // true
console.log(contact.verifiedName) // "ACME Corporation"
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#events-emitting-contacts)

Events Emitting Contacts

Contacts are emitted in these events:

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#contacts-upsert)

contacts.upsert

New contacts added to your contact list:

```
sock.ev.on('contacts.upsert', (contacts: Contact[]) => {
  for (const contact of contacts) {
    console.log('New contact:', contact.notify || contact.id)
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#contacts-update)

contacts.update

Existing contacts updated:

```
sock.ev.on('contacts.update', (updates: Partial<Contact>[]) => {
  for (const update of updates) {
    if (update.id) {
      console.log(`Contact ${update.id} updated:`, update)
    }
  }
})
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#messaging-history-set)

messaging-history.set

Contacts synced from history:

```
sock.ev.on('messaging-history.set', ({ contacts, chats, messages }) => {
  console.log(`Synced ${contacts.length} contacts from history`)
  
  for (const contact of contacts) {
    // Store in your database
    await saveContact(contact)
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#fetching-contact-information)

Fetching Contact Information

Use socket methods to fetch contact information:

```
// Get profile picture URL
const ppUrl = await sock.profilePictureUrl(
  '1234567890@s.whatsapp.net',
  'image' // or 'preview' for thumbnail
)

// Get contact status
const status = await sock.fetchStatus('1234567890@s.whatsapp.net')
console.log(status.status) // "Hey there! I am using WhatsApp."

// Check if number exists on WhatsApp
const [result] = await sock.onWhatsApp('1234567890')
if (result.exists) {
  console.log('JID:', result.jid)
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#best-practices)

Best Practices

ID Format Preference

Always prefer the LID format when available:

```
const contactId = contact.lid || contact.phoneNumber || contact.id
```

LID (Local Identifier) is more stable than phone number-based JIDs.

Name Display Priority

Show names in this order of preference:

1.  `contact.name` (your saved name) - most personal
2.  `contact.notify` (their display name) - their choice
3.  `contact.verifiedName` (business name) - official name
4.  Phone number extracted from `contact.id`

```
function getDisplayName(contact: Contact): string {
  return contact.name 
    || contact.notify 
    || contact.verifiedName 
    || contact.id.split('@')[0]
}
```
Profile Picture Caching

Profile picture URLs can expire. Cache them but implement refresh logic:

```
async function getCachedProfilePicture(jid: string) {
  const cached = await cache.get(`pp:${jid}`)
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return cached.url
  }
  
  const url = await sock.profilePictureUrl(jid, 'image')
  await cache.set(`pp:${jid}`, { url, timestamp: Date.now() })
  return url
}
```
Contact Storage

Store contacts in your database for offline access:

```
sock.ev.on('contacts.upsert', async (contacts) => {
  await db.contacts.insertMany(
    contacts.map(c => ({
      id: c.id,
      lid: c.lid,
      phoneNumber: c.phoneNumber,
      name: c.name,
      notify: c.notify,
      verifiedName: c.verifiedName,
      status: c.status,
      updatedAt: new Date()
    }))
  )
})

sock.ev.on('contacts.update', async (updates) => {
  for (const update of updates) {
    if (update.id) {
      await db.contacts.updateOne(
        { id: update.id },
        { $set: { ...update, updatedAt: new Date() } }
      )
    }
  }
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/api/types/contact#related-types)

Related Types

-   [Chat](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat) - Chat information
-   [Message](https://whiskeysockets-baileys-94.mintlify.app/api/types/messages) - Message types
-   [Events](https://whiskeysockets-baileys-94.mintlify.app/api/types/events) - Event types including contact events

[

Socket Configuration

Previous



](https://whiskeysockets-baileys-94.mintlify.app/api/types/socket)[

Chat Types

Next



](https://whiskeysockets-baileys-94.mintlify.app/api/types/chat)
