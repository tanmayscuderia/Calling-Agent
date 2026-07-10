# Group Metadata

Source: https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#overview)

Overview

Group metadata contains comprehensive information about a WhatsApp group, including its participants, settings, description, and various configuration options.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#fetching-group-metadata)

Fetching Group Metadata

Use the `groupMetadata` method to retrieve complete information about a group.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#function-signature)

Function Signature

```
groupMetadata(jid: string): Promise<GroupMetadata>
```

**Parameters:**

-   `jid` - The group JID (e.g., `'123456789@g.us'`)

**Returns:** A `GroupMetadata` object containing all group information

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#basic-example)

Basic Example

```
const metadata = await sock.groupMetadata(jid)
console.log(metadata.id + ', title: ' + metadata.subject + ', description: ' + metadata.desc)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#complete-usage)

Complete Usage

```
const getGroupInfo = async (groupJid: string) => {
  try {
    const metadata = await sock.groupMetadata(groupJid)

    console.log('Group Information:')
    console.log('ID:', metadata.id)
    console.log('Name:', metadata.subject)
    console.log('Description:', metadata.desc)
    console.log('Owner:', metadata.owner)
    console.log('Participants:', metadata.participants.length)
    console.log('Created:', new Date(metadata.creation! * 1000))

    return metadata
  } catch (error) {
    console.error('Failed to fetch group metadata:', error)
    throw error
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#groupmetadata-interface)

GroupMetadata Interface

The complete structure of group metadata:

```
interface GroupMetadata {
  // Basic Information
  id: string                          // Group JID
  subject: string                     // Group name/title
  notify?: string                     // Notification name
  size?: number                       // Number of participants
  creation?: number                   // Creation timestamp (Unix)

  // Owner Information
  owner: string | undefined           // Creator JID
  ownerPn?: string                    // Creator phone number
  owner_country_code?: string         // Creator country code

  // Subject (Name) Metadata
  subjectOwner?: string               // Who last changed the name
  subjectOwnerPn?: string             // Subject owner phone number
  subjectTime?: number                // When name was last changed

  // Description Metadata
  desc?: string                       // Group description text
  descId?: string                     // Description ID
  descOwner?: string                  // Who set the description
  descOwnerPn?: string                // Description owner phone number
  descTime?: number                   // When description was set

  // Settings
  addressingMode?: WAMessageAddressingMode  // 'lid' or 'pn' messaging mode
  restrict?: boolean                  // Locked settings (admin only)
  announce?: boolean                  // Announcement mode (admin only messages)
  memberAddMode?: boolean             // Members can add participants
  joinApprovalMode?: boolean          // Approval required to join
  ephemeralDuration?: number          // Disappearing messages duration

  // Community
  linkedParent?: string               // Parent community JID
  isCommunity?: boolean               // Is this a community
  isCommunityAnnounce?: boolean       // Is community announcement group

  // Participants
  participants: GroupParticipant[]    // Array of group members

  // Additional
  inviteCode?: string                 // Current invite code
  author?: string                     // Person who added you/changed setting
  authorPn?: string                   // Author phone number
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#groupparticipant-interface)

GroupParticipant Interface

Each participant in the group has the following structure:

```
interface GroupParticipant {
  id: string                              // Participant JID
  phoneNumber?: string                    // Phone number (for LID users)
  lid?: string                            // LID identifier
  admin: 'admin' | 'superadmin' | null   // Admin status
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#working-with-participants)

Working with Participants

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#list-all-participants)

List All Participants

```
const listParticipants = async (groupJid: string) => {
  const metadata = await sock.groupMetadata(groupJid)

  console.log(`Group has ${metadata.participants.length} participants:\n`)

  metadata.participants.forEach(participant => {
    const role = participant.admin || 'member'
    console.log(`${participant.id} - ${role}`)
  })
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#get-admins-only)

Get Admins Only

```
const getGroupAdmins = async (groupJid: string) => {
  const metadata = await sock.groupMetadata(groupJid)

  const admins = metadata.participants.filter(p => p.admin)

  console.log('Admins:')
  admins.forEach(admin => {
    console.log(`${admin.id} - ${admin.admin}`)
  })

  return admins
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#check-if-user-is-admin)

Check if User is Admin

```
const isUserAdmin = async (groupJid: string, userJid: string) => {
  const metadata = await sock.groupMetadata(groupJid)

  const participant = metadata.participants.find(p => p.id === userJid)

  return participant?.admin !== null && participant?.admin !== undefined
}

// Usage
const isAdmin = await isUserAdmin(groupJid, '1234@s.whatsapp.net')
console.log('Is admin:', isAdmin)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#check-if-user-is-super-admin-creator)

Check if User is Super Admin (Creator)

```
const isSuperAdmin = async (groupJid: string, userJid: string) => {
  const metadata = await sock.groupMetadata(groupJid)

  const participant = metadata.participants.find(p => p.id === userJid)

  return participant?.admin === 'superadmin'
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#checking-group-settings)

Checking Group Settings

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#display-all-settings)

Display All Settings

```
const displayGroupSettings = async (groupJid: string) => {
  const metadata = await sock.groupMetadata(groupJid)

  console.log('Group Settings:')
  console.log('Announcement Mode:', metadata.announce ? 'ON' : 'OFF')
  console.log('Locked Settings:', metadata.restrict ? 'ON' : 'OFF')
  console.log('Member Can Add:', metadata.memberAddMode ? 'YES' : 'NO')
  console.log('Join Approval:', metadata.joinApprovalMode ? 'ON' : 'OFF')

  if (metadata.ephemeralDuration) {
    const days = metadata.ephemeralDuration / 86400
    console.log(`Ephemeral Messages: ${days} day(s)`)
  } else {
    console.log('Ephemeral Messages: OFF')
  }
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#check-specific-setting)

Check Specific Setting

```
const isAnnouncementGroup = async (groupJid: string) => {
  const metadata = await sock.groupMetadata(groupJid)
  return metadata.announce === true
}

const hasEphemeralEnabled = async (groupJid: string) => {
  const metadata = await sock.groupMetadata(groupJid)
  return metadata.ephemeralDuration !== undefined && metadata.ephemeralDuration > 0
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#fetching-all-participating-groups)

Fetching All Participating Groups

Get metadata for all groups you’re a member of.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#function-signature-2)

Function Signature

```
groupFetchAllParticipating(): Promise<{ [jid: string]: GroupMetadata }>
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#fetch-all-groups)

Fetch All Groups

```
const response = await sock.groupFetchAllParticipating()
console.log(response)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#complete-example)

Complete Example

```
const getAllGroups = async () => {
  const groups = await sock.groupFetchAllParticipating()

  const groupList = Object.values(groups)

  console.log(`You are in ${groupList.length} groups:\n`)

  groupList.forEach(group => {
    console.log(`${group.subject} (${group.id})`)
    console.log(`  Participants: ${group.participants.length}`)
    console.log(`  Created: ${new Date(group.creation! * 1000).toLocaleDateString()}`)
    console.log('')
  })

  return groups
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#filter-groups-by-criteria)

Filter Groups by Criteria

```
const findGroupsByName = async (searchTerm: string) => {
  const groups = await sock.groupFetchAllParticipating()

  const matchingGroups = Object.values(groups).filter(group =>
    group.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return matchingGroups
}

const getGroupsWhereAdmin = async () => {
  const groups = await sock.groupFetchAllParticipating()
  const myJid = sock.user?.id

  const adminGroups = Object.values(groups).filter(group => {
    const me = group.participants.find(p => p.id === myJid)
    return me?.admin !== null && me?.admin !== undefined
  })

  return adminGroups
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#description-metadata)

Description Metadata

Working with group descriptions:

```
const getDescriptionInfo = async (groupJid: string) => {
  const metadata = await sock.groupMetadata(groupJid)

  if (!metadata.desc) {
    console.log('No description set')
    return null
  }

  console.log('Description:', metadata.desc)
  console.log('Set by:', metadata.descOwner)
  
  if (metadata.descTime) {
    const date = new Date(metadata.descTime * 1000)
    console.log('Set on:', date.toLocaleString())
  }

  return {
    text: metadata.desc,
    owner: metadata.descOwner,
    time: metadata.descTime,
    id: metadata.descId
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#community-groups)

Community Groups

Check if a group is part of a community:

```
const getCommunityInfo = async (groupJid: string) => {
  const metadata = await sock.groupMetadata(groupJid)

  if (metadata.isCommunity) {
    console.log('This is a community')
  } else if (metadata.linkedParent) {
    console.log('This group is part of community:', metadata.linkedParent)
  } else {
    console.log('This is a standalone group')
  }

  if (metadata.isCommunityAnnounce) {
    console.log('This is a community announcement group')
  }

  return {
    isCommunity: metadata.isCommunity,
    linkedParent: metadata.linkedParent,
    isCommunityAnnounce: metadata.isCommunityAnnounce
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#complete-analysis-function)

Complete Analysis Function

Comprehensive group analysis:

1

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#)

Fetch and analyze

```
const analyzeGroup = async (groupJid: string) => {
  const metadata = await sock.groupMetadata(groupJid)

  // Basic Info
  console.log('=== GROUP ANALYSIS ===')
  console.log('Name:', metadata.subject)
  console.log('ID:', metadata.id)
  console.log('Created:', new Date(metadata.creation! * 1000).toLocaleString())
  console.log('Owner:', metadata.owner)

  // Participants Analysis
  console.log('\n=== PARTICIPANTS ===')
  const admins = metadata.participants.filter(p => p.admin === 'admin')
  const superAdmins = metadata.participants.filter(p => p.admin === 'superadmin')
  const members = metadata.participants.filter(p => !p.admin)

  console.log(`Total: ${metadata.participants.length}`)
  console.log(`Super Admins: ${superAdmins.length}`)
  console.log(`Admins: ${admins.length}`)
  console.log(`Members: ${members.length}`)

  // Settings
  console.log('\n=== SETTINGS ===')
  console.log('Announcement Mode:', metadata.announce ? 'ON' : 'OFF')
  console.log('Locked:', metadata.restrict ? 'YES' : 'NO')
  console.log('Members Can Add:', metadata.memberAddMode ? 'YES' : 'NO')
  console.log('Join Approval:', metadata.joinApprovalMode ? 'REQUIRED' : 'NOT REQUIRED')

  if (metadata.ephemeralDuration) {
    console.log('Ephemeral:', `${metadata.ephemeralDuration / 86400} days`)
  }

  // Description
  if (metadata.desc) {
    console.log('\n=== DESCRIPTION ===')
    console.log(metadata.desc)
  }

  return metadata
}
```

2

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#)

Export data

```
const exportGroupData = async (groupJid: string) => {
  const metadata = await sock.groupMetadata(groupJid)

  const exportData = {
    basic: {
      id: metadata.id,
      name: metadata.subject,
      description: metadata.desc,
      created: new Date(metadata.creation! * 1000).toISOString(),
      owner: metadata.owner
    },
    settings: {
      announcementMode: metadata.announce,
      locked: metadata.restrict,
      memberCanAdd: metadata.memberAddMode,
      joinApproval: metadata.joinApprovalMode,
      ephemeralDuration: metadata.ephemeralDuration
    },
    participants: metadata.participants.map(p => ({
      jid: p.id,
      role: p.admin || 'member'
    })),
    community: {
      isCommunity: metadata.isCommunity,
      linkedParent: metadata.linkedParent,
      isCommunityAnnounce: metadata.isCommunityAnnounce
    }
  }

  return exportData
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#best-practices)

Best Practices

**Caching**: Group metadata doesn’t change frequently. Consider caching it to reduce API calls.

**Events**: The library emits `'groups.update'` events when metadata changes. Listen to these events to keep your cache updated.

**Privacy**: Be careful when storing or displaying participant information. Respect user privacy.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#efficient-metadata-usage)

Efficient Metadata Usage

```
// Cache metadata to avoid repeated fetches
const metadataCache = new Map<string, { data: GroupMetadata, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const getCachedMetadata = async (groupJid: string) => {
  const cached = metadataCache.get(groupJid)
  const now = Date.now()

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }

  const metadata = await sock.groupMetadata(groupJid)
  metadataCache.set(groupJid, { data: metadata, timestamp: now })

  return metadata
}

// Listen for updates to invalidate cache
sock.ev.on('groups.update', (updates) => {
  updates.forEach(update => {
    metadataCache.delete(update.id)
  })
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata#related-methods)

Related Methods

-   [Group Settings](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings) - Modify group configuration
-   [Managing Participants](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants) - Update participant roles
-   [Invite Codes](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes) - Get group invite information

[

Group Settings

Previous



](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings)[

Invite Codes

Next



](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes)
