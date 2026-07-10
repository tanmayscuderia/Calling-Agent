# Invite Codes

Source: https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#overview)

Overview

Baileys provides comprehensive methods for working with WhatsApp group invite codes. You can generate invite links, revoke them, join groups using codes, and get information about groups before joining.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#getting-invite-codes)

Getting Invite Codes

Retrieve the current invite code for a group.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#function-signature)

Function Signature

```
groupInviteCode(jid: string): Promise<string>
```

**Parameters:**

-   `jid` - The group JID

**Returns:** The invite code as a string

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#get-invite-code)

Get Invite Code

```
const code = await sock.groupInviteCode(jid)
console.log('group code: ' + code)
```

Only group admins can retrieve the invite code.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#creating-an-invite-link)

Creating an Invite Link

To create a clickable WhatsApp invite link:

```
const getInviteLink = async (groupJid: string) => {
  const code = await sock.groupInviteCode(groupJid)
  const link = 'https://chat.whatsapp.com/' + code
  
  console.log('Invite link:', link)
  return link
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#complete-example)

Complete Example

```
const generateAndShareInvite = async (groupJid: string) => {
  try {
    // Get the invite code
    const code = await sock.groupInviteCode(groupJid)
    
    // Create full link
    const inviteLink = `https://chat.whatsapp.com/${code}`
    
    console.log('Group invite link generated:', inviteLink)
    
    // Send the link to a user
    await sock.sendMessage('1234@s.whatsapp.net', {
      text: `Join our group: ${inviteLink}`
    })
    
    return inviteLink
  } catch (error) {
    console.error('Failed to get invite code:', error)
    throw error
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#revoking-invite-codes)

Revoking Invite Codes

Revoke the current invite code and generate a new one.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#function-signature-2)

Function Signature

```
groupRevokeInvite(jid: string): Promise<string>
```

**Parameters:**

-   `jid` - The group JID

**Returns:** The new invite code

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#revoke-and-get-new-code)

Revoke and Get New Code

```
const code = await sock.groupRevokeInvite(jid)
console.log('New group code: ' + code)
```

Revoking an invite code immediately invalidates all previously shared invite links. Users with old links won’t be able to join.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#safe-revoke-pattern)

Safe Revoke Pattern

```
const revokeGroupInvite = async (groupJid: string) => {
  try {
    const newCode = await sock.groupRevokeInvite(groupJid)
    const newLink = `https://chat.whatsapp.com/${newCode}`
    
    console.log('Invite code revoked!')
    console.log('New invite link:', newLink)
    
    // Notify admins of the new link
    const metadata = await sock.groupMetadata(groupJid)
    const admins = metadata.participants.filter(p => p.admin)
    
    for (const admin of admins) {
      await sock.sendMessage(admin.id, {
        text: `Group invite link has been reset. New link: ${newLink}`
      })
    }
    
    return newLink
  } catch (error) {
    console.error('Failed to revoke invite:', error)
    throw error
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#revoking-v4-invites)

Revoking V4 Invites

Revoke a specific user’s V4 invite.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#function-signature-3)

Function Signature

```
groupRevokeInviteV4(groupJid: string, invitedJid: string): Promise<boolean>
```

**Parameters:**

-   `groupJid` - The group JID
-   `invitedJid` - JID of the person whose invite you want to revoke

**Returns:** `true` if successful

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#revoke-specific-user%E2%80%99s-invite)

Revoke Specific User’s Invite

```
const success = await sock.groupRevokeInviteV4(groupJid, '1234@s.whatsapp.net')
console.log('Invite revoked:', success)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#joining-groups-with-invite-codes)

Joining Groups with Invite Codes

Join a group using an invite code.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#function-signature-4)

Function Signature

```
groupAcceptInvite(code: string): Promise<string | undefined>
```

**Parameters:**

-   `code` - The invite code (without the URL prefix)

**Returns:** The group JID you joined

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#join-using-code)

Join Using Code

```
const response = await sock.groupAcceptInvite(code)
console.log('joined to: ' + response)
```

The code parameter should be **only the code**, not the full URL. Extract it from `https://chat.whatsapp.com/CODE`

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#join-with-error-handling)

Join with Error Handling

```
const joinGroupByCode = async (inviteCode: string) => {
  try {
    // Extract code if full URL was provided
    const code = inviteCode.replace('https://chat.whatsapp.com/', '')
    
    // Join the group
    const groupJid = await sock.groupAcceptInvite(code)
    
    console.log('Successfully joined group:', groupJid)
    
    // Send greeting message
    await sock.sendMessage(groupJid, {
      text: 'Hello everyone! 👋'
    })
    
    return groupJid
  } catch (error) {
    console.error('Failed to join group:', error)
    throw error
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#joining-with-groupinvitemessage-v4)

Joining with GroupInviteMessage (V4)

Accept a group invite using a GroupInviteMessage.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#function-signature-5)

Function Signature

```
groupAcceptInviteV4(
  key: string | WAMessageKey,
  inviteMessage: proto.Message.IGroupInviteMessage
): Promise<string>
```

**Parameters:**

-   `key` - The message key or sender JID
-   `inviteMessage` - The GroupInviteMessage object

**Returns:** The group JID

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#accept-v4-invite)

Accept V4 Invite

```
const response = await sock.groupAcceptInviteV4(jid, groupInviteMessage)
console.log('joined to: ' + response)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#handle-groupinvitemessage-from-events)

Handle GroupInviteMessage from Events

```
sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const msg of messages) {
    const inviteMessage = msg.message?.groupInviteMessage
    
    if (inviteMessage) {
      console.log('Received group invite!')
      console.log('Group:', inviteMessage.groupJid)
      console.log('Invite expires:', new Date(Number(inviteMessage.inviteExpiration) * 1000))
      
      // Auto-accept the invite
      try {
        const groupJid = await sock.groupAcceptInviteV4(
          msg.key,
          inviteMessage
        )
        console.log('Joined group:', groupJid)
      } catch (error) {
        console.error('Failed to accept invite:', error)
      }
    }
  }
})
```

When you accept a V4 invite, the library automatically expires the invite message in your chat.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#getting-group-info-before-joining)

Getting Group Info Before Joining

Fetch group metadata using just the invite code, without joining.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#function-signature-6)

Function Signature

```
groupGetInviteInfo(code: string): Promise<GroupMetadata>
```

**Parameters:**

-   `code` - The invite code (without URL prefix)

**Returns:** GroupMetadata object with group information

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#get-group-information)

Get Group Information

```
const response = await sock.groupGetInviteInfo(code)
console.log('group information: ' + response)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#preview-group-before-joining)

Preview Group Before Joining

```
const previewGroup = async (inviteCode: string) => {
  try {
    // Extract code if full URL was provided
    const code = inviteCode.replace('https://chat.whatsapp.com/', '')
    
    // Get group info without joining
    const info = await sock.groupGetInviteInfo(code)
    
    console.log('Group Preview:')
    console.log('Name:', info.subject)
    console.log('Description:', info.desc)
    console.log('Participants:', info.size)
    console.log('Created:', new Date(info.creation! * 1000).toLocaleDateString())
    
    // Decide whether to join based on criteria
    if (info.size && info.size > 100) {
      console.log('Group is too large, not joining')
      return null
    }
    
    // Join if criteria met
    const groupJid = await sock.groupAcceptInvite(code)
    console.log('Joined group:', groupJid)
    
    return groupJid
  } catch (error) {
    console.error('Failed to preview/join group:', error)
    throw error
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#complete-invite-management-system)

Complete Invite Management System

Comprehensive example combining all invite functionality:

1

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#)

Generate and share invite

```
const shareGroupInvite = async (
  groupJid: string,
  recipientJid: string
) => {
  // Get current invite code
  const code = await sock.groupInviteCode(groupJid)
  const link = `https://chat.whatsapp.com/${code}`
  
  // Get group info
  const metadata = await sock.groupMetadata(groupJid)
  
  // Send formatted invite
  await sock.sendMessage(recipientJid, {
    text: `You're invited to join "${metadata.subject}"!\n\n${link}\n\nGroup has ${metadata.participants.length} members.`
  })
  
  console.log('Invite sent to', recipientJid)
}
```

2

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#)

Manage invite security

```
const manageInviteSecurity = async (groupJid: string) => {
  // Revoke old invite
  const newCode = await sock.groupRevokeInvite(groupJid)
  console.log('Old invite revoked')
  
  // Enable join approval for extra security
  await sock.groupJoinApprovalMode(groupJid, 'on')
  console.log('Join approval enabled')
  
  // Get new link
  const newLink = `https://chat.whatsapp.com/${newCode}`
  console.log('New secure invite link:', newLink)
  
  return newLink
}
```

3

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#)

Smart join with validation

```
const smartJoinGroup = async (
  inviteLink: string,
  criteria?: {
    maxSize?: number
    requireDescription?: boolean
  }
) => {
  // Extract code
  const code = inviteLink.replace('https://chat.whatsapp.com/', '')
  
  // Preview group first
  const info = await sock.groupGetInviteInfo(code)
  
  console.log('Evaluating group:', info.subject)
  
  // Apply criteria
  if (criteria?.maxSize && info.size && info.size > criteria.maxSize) {
    throw new Error(`Group too large (${info.size} members)`)
  }
  
  if (criteria?.requireDescription && !info.desc) {
    throw new Error('Group has no description')
  }
  
  // All checks passed, join the group
  const groupJid = await sock.groupAcceptInvite(code)
  console.log('Successfully joined:', info.subject)
  
  return { groupJid, metadata: info }
}

// Usage
await smartJoinGroup('https://chat.whatsapp.com/ABC123', {
  maxSize: 100,
  requireDescription: true
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#best-practices)

Best Practices

**Rate Limiting**: Don’t revoke invite codes too frequently. WhatsApp may rate-limit this operation.

**Preview Before Joining**: Always use `groupGetInviteInfo` to check group details before joining with `groupAcceptInvite`.

**Code Format**: When using invite codes, ensure you pass only the code portion, not the full URL.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#security-tips)

Security Tips

1.  **Regular Rotation**: Periodically revoke and regenerate invite codes for sensitive groups
2.  **Approval Mode**: Enable join approval mode for additional security
3.  **Validate Before Joining**: Check group size and description before auto-joining
4.  **Track Invites**: Keep logs of when invite codes are generated and shared

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#helper-functions)

Helper Functions

```
// Extract code from various formats
const extractInviteCode = (input: string): string => {
  return input
    .replace('https://chat.whatsapp.com/', '')
    .replace('http://chat.whatsapp.com/', '')
    .replace('chat.whatsapp.com/', '')
    .trim()
}

// Validate invite code format
const isValidInviteCode = (code: string): boolean => {
  // WhatsApp invite codes are typically 22 characters
  return /^[A-Za-z0-9]{20,24}$/.test(code)
}

// Safe invite code getter
const getInviteCodeSafely = async (groupJid: string) => {
  try {
    const code = await sock.groupInviteCode(groupJid)
    return { success: true, code }
  } catch (error) {
    console.error('Not authorized to get invite code')
    return { success: false, code: null }
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#common-use-cases)

Common Use Cases

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#automated-invite-distribution)

Automated Invite Distribution

```
const distributeInvite = async (
  groupJid: string,
  recipients: string[]
) => {
  const code = await sock.groupInviteCode(groupJid)
  const link = `https://chat.whatsapp.com/${code}`
  const metadata = await sock.groupMetadata(groupJid)
  
  for (const recipient of recipients) {
    await sock.sendMessage(recipient, {
      text: `Join "${metadata.subject}": ${link}`
    })
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log(`Invite sent to ${recipients.length} people`)
}
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#temporary-invite-links)

Temporary Invite Links

```
const createTemporaryInvite = async (
  groupJid: string,
  durationMinutes: number
) => {
  const code = await sock.groupInviteCode(groupJid)
  const link = `https://chat.whatsapp.com/${code}`
  
  console.log('Temporary invite created:', link)
  console.log(`Valid for ${durationMinutes} minutes`)
  
  // Auto-revoke after duration
  setTimeout(async () => {
    await sock.groupRevokeInvite(groupJid)
    console.log('Temporary invite revoked')
  }, durationMinutes * 60 * 1000)
  
  return link
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/invite-codes#related-methods)

Related Methods

-   [Creating Groups](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups) - Create new groups
-   [Managing Participants](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants) - Handle join requests
-   [Group Settings](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings) - Configure join approval mode
-   [Group Metadata](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata) - View group information

[

Group Metadata

Previous



](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata)[

Modifying Chats

Next



](https://whiskeysockets-baileys-94.mintlify.app/chats/modifying-chats)
