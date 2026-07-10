# Managing Participants

Source: https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#overview)

Overview

Baileys provides comprehensive methods for managing group participants, including adding/removing members and changing admin roles. Only group admins can perform these operations.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#group-participants-update)

Group Participants Update

The main method for managing participants is `groupParticipantsUpdate`, which handles multiple actions.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#function-signature)

Function Signature

```
groupParticipantsUpdate(
  jid: string,
  participants: string[],
  action: ParticipantAction
): Promise<Array<{ status: string; jid: string; content: any }>>
```

**Parameters:**

-   `jid` - The group JID
-   `participants` - Array of participant JIDs to update
-   `action` - One of: `'add'`, `'remove'`, `'promote'`, `'demote'`, or `'modify'`

**Returns:** Array of results showing the status for each participant

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#adding-participants)

Adding Participants

Add new members to an existing group.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#basic-example)

Basic Example

```
// Add participants to the group
await sock.groupParticipantsUpdate(
  'groupId@g.us',
  ['abcd@s.whatsapp.net', 'efgh@s.whatsapp.net'],
  'add'
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#handling-results)

Handling Results

```
const results = await sock.groupParticipantsUpdate(
  jid,
  ['1234@s.whatsapp.net', '5678@s.whatsapp.net'],
  'add'
)

// Check results for each participant
results.forEach(result => {
  if (result.status === '200') {
    console.log(`Successfully added ${result.jid}`)
  } else {
    console.log(`Failed to add ${result.jid}: ${result.status}`)
  }
})
```

**Success Status**: A status of `'200'` indicates successful operation. Other codes indicate errors.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#removing-participants)

Removing Participants

Remove members from the group.

```
// Remove participants from the group
await sock.groupParticipantsUpdate(
  jid,
  ['abcd@s.whatsapp.net', 'efgh@s.whatsapp.net'],
  'remove'
)
```

**Admin Permissions Required**: You must be a group admin to remove participants. Attempting to remove participants without admin rights will result in an error.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#safely-removing-participants)

Safely Removing Participants

```
const removeParticipants = async (
  groupJid: string,
  participantsToRemove: string[]
) => {
  try {
    const results = await sock.groupParticipantsUpdate(
      groupJid,
      participantsToRemove,
      'remove'
    )

    const successful = results.filter(r => r.status === '200')
    const failed = results.filter(r => r.status !== '200')

    console.log(`Removed ${successful.length} participants`)
    if (failed.length > 0) {
      console.log(`Failed to remove ${failed.length} participants`)
    }

    return { successful, failed }
  } catch (error) {
    console.error('Error removing participants:', error)
    throw error
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#promoting-participants)

Promoting Participants

Promote regular members to admin status.

```
// Promote participants to admin
await sock.groupParticipantsUpdate(
  jid,
  ['abcd@s.whatsapp.net', 'efgh@s.whatsapp.net'],
  'promote'
)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#promote-with-confirmation)

Promote with Confirmation

```
const promoteToAdmin = async (
  groupJid: string,
  participantJid: string
) => {
  try {
    const results = await sock.groupParticipantsUpdate(
      groupJid,
      [participantJid],
      'promote'
    )

    if (results[0].status === '200') {
      console.log(`${participantJid} is now an admin`)
      
      // Send notification to the group
      await sock.sendMessage(groupJid, {
        text: `Congratulations! @${participantJid.split('@')[0]} is now an admin.`,
        mentions: [participantJid]
      })
    }

    return results[0]
  } catch (error) {
    console.error('Failed to promote participant:', error)
    throw error
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#demoting-participants)

Demoting Participants

Demote admins back to regular member status.

```
// Demote participants from admin
await sock.groupParticipantsUpdate(
  jid,
  ['abcd@s.whatsapp.net', 'efgh@s.whatsapp.net'],
  'demote'
)
```

**Super Admin**: The group creator (super admin) cannot be demoted. Attempting to demote the creator will fail.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#managing-join-requests)

Managing Join Requests

For groups with join approval mode enabled, you can approve or reject join requests.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#get-join-request-list)

Get Join Request List

```
const requests = await sock.groupRequestParticipantsList(jid)
console.log(requests) // Array of pending requests with attrs
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#approve/reject-join-requests)

Approve/Reject Join Requests

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#function-signature-2)

Function Signature

```
groupRequestParticipantsUpdate(
  jid: string,
  participants: string[],
  action: 'approve' | 'reject'
): Promise<Array<{ status: string; jid: string }>>
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#approve-requests)

Approve Requests

```
const response = await sock.groupRequestParticipantsUpdate(
  jid,
  ['abcd@s.whatsapp.net', 'efgh@s.whatsapp.net'],
  'approve'
)
console.log(response)
```

#### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#reject-requests)

Reject Requests

```
const response = await sock.groupRequestParticipantsUpdate(
  jid,
  ['abcd@s.whatsapp.net', 'efgh@s.whatsapp.net'],
  'reject'
)
console.log(response)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#complete-join-request-handler)

Complete Join Request Handler

```
const handleJoinRequests = async (groupJid: string) => {
  // Get all pending requests
  const requests = await sock.groupRequestParticipantsList(groupJid)

  if (requests.length === 0) {
    console.log('No pending requests')
    return
  }

  console.log(`Found ${requests.length} pending requests`)

  // Example: Auto-approve all requests
  const jidsToApprove = requests.map(req => req.jid)
  
  const results = await sock.groupRequestParticipantsUpdate(
    groupJid,
    jidsToApprove,
    'approve'
  )

  // Check results
  results.forEach(result => {
    if (result.status === '200') {
      console.log(`Approved ${result.jid}`)
    } else {
      console.log(`Failed to approve ${result.jid}: ${result.status}`)
    }
  })
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#participant-structure)

Participant Structure

Participants in group metadata have the following structure:

```
interface GroupParticipant {
  id: string                              // Participant JID
  phoneNumber?: string                    // Phone number (for LID users)
  lid?: string                            // LID identifier
  admin: 'admin' | 'superadmin' | null   // Admin status
  isAdmin?: boolean                       // Deprecated: check admin field
  isSuperAdmin?: boolean                  // Deprecated: check if admin === 'superadmin'
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#best-practices)

Best Practices

1

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#)

Check admin status before operations

Verify you have admin permissions before attempting to modify participants.

```
const metadata = await sock.groupMetadata(groupJid)
const myJid = sock.user.id
const me = metadata.participants.find(p => p.id === myJid)

if (!me?.admin) {
  throw new Error('You must be an admin to perform this action')
}
```

2

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#)

Handle errors gracefully

Always check the status codes returned from participant updates.

```
const results = await sock.groupParticipantsUpdate(jid, participants, 'add')
const failures = results.filter(r => r.status !== '200')

if (failures.length > 0) {
  // Handle failures appropriately
}
```

3

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#)

Validate participant JIDs

Ensure JIDs are properly formatted before operations.

```
const formatJid = (phone: string) => {
  return phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#common-use-cases)

Common Use Cases

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#batch-add-with-error-handling)

Batch Add with Error Handling

```
const batchAddParticipants = async (
  groupJid: string,
  phoneNumbers: string[]
) => {
  // Format JIDs
  const jids = phoneNumbers.map(num => `${num}@s.whatsapp.net`)

  // Add in batches of 10 to avoid rate limits
  const batchSize = 10
  const results = []

  for (let i = 0; i < jids.length; i += batchSize) {
    const batch = jids.slice(i, i + batchSize)
    const batchResults = await sock.groupParticipantsUpdate(
      groupJid,
      batch,
      'add'
    )
    results.push(...batchResults)

    // Wait between batches
    if (i + batchSize < jids.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return results
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#automatic-admin-assignment)

Automatic Admin Assignment

```
const assignAdmins = async (groupJid: string, adminJids: string[]) => {
  // Get current group metadata
  const metadata = await sock.groupMetadata(groupJid)

  // Filter to only non-admin participants
  const toPromote = adminJids.filter(jid => {
    const participant = metadata.participants.find(p => p.id === jid)
    return participant && !participant.admin
  })

  if (toPromote.length === 0) {
    console.log('All specified participants are already admins')
    return
  }

  // Promote them
  const results = await sock.groupParticipantsUpdate(
    groupJid,
    toPromote,
    'promote'
  )

  return results
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants#related-methods)

Related Methods

-   [Group Metadata](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata) - Fetch participant information
-   [Group Settings](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings) - Configure who can add members
-   [Invite Codes](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes) - Alternative way to add members

[

Creating Groups

Previous



](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups)[

Group Settings

Next



](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings)
