# Creating Groups

Source: https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#overview)

Overview

Baileys provides simple methods to create WhatsApp groups programmatically. To modify group properties, you need to be a group admin.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#creating-a-group)

Creating a Group

Use the `groupCreate` method to create a new WhatsApp group with a title and initial participants.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#function-signature)

Function Signature

```
groupCreate(subject: string, participants: string[]): Promise<GroupMetadata>
```

**Parameters:**

-   `subject` - The name/title of the group
-   `participants` - Array of participant JIDs (must be in format `number@s.whatsapp.net`)

**Returns:** A `GroupMetadata` object containing the newly created group’s information

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#basic-example)

Basic Example

1

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#)

Create the group

```
const group = await sock.groupCreate(
  'My Fab Group',
  ['1234@s.whatsapp.net', '4564@s.whatsapp.net']
)
```

2

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#)

Access group information

```
console.log('created group with id: ' + group.id)
```

The returned `GroupMetadata` object contains:

-   `id` - The group JID
-   `subject` - The group name
-   `participants` - Array of group participants
-   `creation` - Unix timestamp of creation
-   And more metadata fields

3

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#)

Send a welcome message

```
await sock.sendMessage(group.id, { text: 'hello there' })
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#complete-example)

Complete Example

```
import makeWASocket from '@whiskeysockets/baileys'

const sock = makeWASocket({
  // your config
})

const createGroupExample = async () => {
  try {
    // Create group with initial participants
    const group = await sock.groupCreate(
      'My Fab Group',
      ['1234@s.whatsapp.net', '4564@s.whatsapp.net']
    )

    console.log('Group created successfully!')
    console.log('Group ID:', group.id)
    console.log('Group Name:', group.subject)
    console.log('Participants:', group.participants.length)

    // Send welcome message
    await sock.sendMessage(group.id, {
      text: 'Welcome to the group! 👋'
    })
  } catch (error) {
    console.error('Failed to create group:', error)
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#group-metadata-structure)

Group Metadata Structure

The `GroupMetadata` interface returned by `groupCreate` contains:

```
interface GroupMetadata {
  id: string                          // Group JID
  subject: string                     // Group name
  owner: string | undefined           // Creator JID
  creation?: number                   // Creation timestamp
  participants: GroupParticipant[]    // List of participants
  size?: number                       // Number of participants
  desc?: string                       // Group description
  restrict?: boolean                  // Locked settings (admin only)
  announce?: boolean                  // Announcement mode (admin only messages)
  memberAddMode?: boolean             // Members can add participants
  joinApprovalMode?: boolean          // Approval required to join
  ephemeralDuration?: number          // Disappearing messages duration
  linkedParent?: string               // Parent community JID (if applicable)
  isCommunity?: boolean               // Is this a community
  // ... and more fields
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#best-practices)

Best Practices

**Participant Format**: Always ensure participant JIDs are in the correct format: `number@s.whatsapp.net`

**Minimum Participants**: WhatsApp may require a minimum number of participants to create a group. Always include at least 1 other participant besides yourself.

**Error Handling**: The `groupCreate` method will throw an error if the operation fails. Always wrap it in a try-catch block.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#tips)

Tips

1.  **Validate phone numbers** before adding them as participants
2.  **Check if numbers are registered** on WhatsApp using `onWhatsApp` method
3.  **Handle errors gracefully** - some numbers may not be valid WhatsApp accounts
4.  **Store the group ID** for future operations like sending messages or updating settings

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#common-use-cases)

Common Use Cases

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#creating-a-group-with-verified-participants)

Creating a group with verified participants

```
const createGroupWithVerification = async (
  groupName: string,
  phoneNumbers: string[]
) => {
  // Verify which numbers are on WhatsApp
  const jids = phoneNumbers.map(num => `${num}@s.whatsapp.net`)
  const verified = await sock.onWhatsApp(...jids)

  // Filter to only verified numbers
  const validParticipants = verified
    .filter(result => result.exists)
    .map(result => result.jid)

  if (validParticipants.length === 0) {
    throw new Error('No valid WhatsApp numbers found')
  }

  // Create the group
  const group = await sock.groupCreate(groupName, validParticipants)
  return group
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#creating-a-group-and-configuring-initial-settings)

Creating a group and configuring initial settings

```
const createConfiguredGroup = async () => {
  // Create the group
  const group = await sock.groupCreate(
    'My Group',
    ['1234@s.whatsapp.net', '5678@s.whatsapp.net']
  )

  // Set description
  await sock.groupUpdateDescription(
    group.id,
    'This is our group for project discussions'
  )

  // Enable announcement mode (only admins can send messages)
  await sock.groupSettingUpdate(group.id, 'announcement')

  // Lock settings (only admins can modify)
  await sock.groupSettingUpdate(group.id, 'locked')

  return group
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups#related-methods)

Related Methods

-   [Managing Participants](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants) - Add, remove, promote, and demote members
-   [Group Settings](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings) - Configure announcement mode, locked settings, and more
-   [Group Metadata](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata) - Fetch and understand group information

[

Downloading Media

Previous



](https://whiskeysockets-baileys-94.mintlify.app/messaging/downloading-media)[

Managing Participants

Next



](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants)
