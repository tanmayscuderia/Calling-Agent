# Group Settings

Source: https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#overview)

Overview

Baileys provides methods to configure various group settings. Only group admins can modify these settings.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#announcement-mode)

Announcement Mode

Control who can send messages in the group.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#function-signature)

Function Signature

```
groupSettingUpdate(
  jid: string,
  setting: 'announcement' | 'not_announcement' | 'locked' | 'unlocked'
): Promise<void>
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#enable-announcement-mode)

Enable Announcement Mode

Only allow admins to send messages.

```
// Only admins can send messages
await sock.groupSettingUpdate(jid, 'announcement')
```

When announcement mode is enabled, regular members cannot send messages. Only admins can post to the group.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#disable-announcement-mode)

Disable Announcement Mode

Allow everyone to send messages.

```
// Allow everyone to send messages
await sock.groupSettingUpdate(jid, 'not_announcement')
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#locked-settings)

Locked Settings

Control who can modify group settings like the display picture, name, and description.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#lock-group-settings)

Lock Group Settings

Only allow admins to modify group settings.

```
// Only allow admins to modify the group's settings
await sock.groupSettingUpdate(jid, 'locked')
```

When locked, only admins can change the group’s display picture, name, description, and other settings.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#unlock-group-settings)

Unlock Group Settings

Allow everyone to modify group settings.

```
// Allow everyone to modify the group's settings
await sock.groupSettingUpdate(jid, 'unlocked')
```

When unlocked, any member can change the group picture, name, and description. This may lead to unwanted modifications.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#group-subject-name)

Group Subject (Name)

Update the group’s name.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#function-signature-2)

Function Signature

```
groupUpdateSubject(jid: string, subject: string): Promise<void>
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#update-group-name)

Update Group Name

```
await sock.groupUpdateSubject(jid, 'New Subject!')
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#example-with-validation)

Example with Validation

```
const updateGroupName = async (groupJid: string, newName: string) => {
  // Validate name length (WhatsApp limits to 25 characters)
  if (newName.length > 25) {
    throw new Error('Group name cannot exceed 25 characters')
  }

  if (newName.trim().length === 0) {
    throw new Error('Group name cannot be empty')
  }

  try {
    await sock.groupUpdateSubject(groupJid, newName)
    console.log(`Group name updated to: ${newName}`)
  } catch (error) {
    console.error('Failed to update group name:', error)
    throw error
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#group-description)

Group Description

Update the group’s description.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#function-signature-3)

Function Signature

```
groupUpdateDescription(jid: string, description?: string): Promise<void>
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#set-description)

Set Description

```
await sock.groupUpdateDescription(jid, 'New Description!')
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#remove-description)

Remove Description

Pass `undefined` or an empty string to remove the description.

```
// Remove description
await sock.groupUpdateDescription(jid, undefined)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#complete-example)

Complete Example

```
const updateGroupDescription = async (
  groupJid: string,
  description?: string
) => {
  try {
    await sock.groupUpdateDescription(groupJid, description)
    
    if (description) {
      console.log('Description updated')
    } else {
      console.log('Description removed')
    }
  } catch (error) {
    console.error('Failed to update description:', error)
    throw error
  }
}
```

The implementation automatically handles the previous description ID (`descId`) by fetching current metadata. This ensures proper description versioning.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#member-add-mode)

Member Add Mode

Control who can add new members to the group.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#function-signature-4)

Function Signature

```
groupMemberAddMode(
  jid: string,
  mode: 'admin_add' | 'all_member_add'
): Promise<void>
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#only-admins-can-add)

Only Admins Can Add

```
await sock.groupMemberAddMode(jid, 'admin_add')
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#all-members-can-add)

All Members Can Add

```
await sock.groupMemberAddMode(jid, 'all_member_add')
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#example-toggle-function)

Example Toggle Function

```
const toggleMemberAddMode = async (groupJid: string) => {
  // Get current metadata
  const metadata = await sock.groupMetadata(groupJid)

  // Toggle the setting
  const newMode = metadata.memberAddMode ? 'admin_add' : 'all_member_add'
  
  await sock.groupMemberAddMode(groupJid, newMode)

  console.log(`Member add mode set to: ${newMode}`)
  return newMode
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#join-approval-mode)

Join Approval Mode

Control whether join requests require admin approval.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#function-signature-5)

Function Signature

```
groupJoinApprovalMode(jid: string, mode: 'on' | 'off'): Promise<void>
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#enable-join-approval)

Enable Join Approval

```
// Require admin approval for new members
await sock.groupJoinApprovalMode(jid, 'on')
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#disable-join-approval)

Disable Join Approval

```
// Allow anyone with invite link to join directly
await sock.groupJoinApprovalMode(jid, 'off')
```

When join approval is enabled, users who click the invite link will need to request to join, and admins must approve them using `groupRequestParticipantsUpdate`.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#ephemeral-messages-disappearing-messages)

Ephemeral Messages (Disappearing Messages)

Enable or disable disappearing messages for the group.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#function-signature-6)

Function Signature

```
groupToggleEphemeral(jid: string, ephemeralExpiration: number): Promise<void>
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#ephemeral-durations)

Ephemeral Durations

| Duration | Seconds | Description |
| --- | --- | --- |
| Remove | 0 | Disable ephemeral |
| 24 hours | 86400 | Messages disappear in 1 day |
| 7 days | 604800 | Messages disappear in 1 week |
| 90 days | 7776000 | Messages disappear in 3 months |

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#enable-ephemeral-messages)

Enable Ephemeral Messages

```
// Enable 24-hour disappearing messages
await sock.groupToggleEphemeral(jid, 86400)

// Enable 7-day disappearing messages
await sock.groupToggleEphemeral(jid, 604800)

// Enable 90-day disappearing messages
await sock.groupToggleEphemeral(jid, 7776000)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#disable-ephemeral-messages)

Disable Ephemeral Messages

```
// Disable ephemeral messages
await sock.groupToggleEphemeral(jid, 0)
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#helper-function)

Helper Function

```
type EphemeralDuration = '24h' | '7d' | '90d' | 'off'

const setGroupEphemeral = async (
  groupJid: string,
  duration: EphemeralDuration
) => {
  const durations = {
    'off': 0,
    '24h': 86400,
    '7d': 604800,
    '90d': 7776000
  }

  const seconds = durations[duration]
  await sock.groupToggleEphemeral(groupJid, seconds)

  console.log(`Ephemeral messages set to: ${duration}`)
}

// Usage
await setGroupEphemeral(groupJid, '7d')
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#leave-group)

Leave Group

Leave a group you’re a member of.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#function-signature-7)

Function Signature

```
groupLeave(id: string): Promise<void>
```

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#leave-a-group)

Leave a Group

```
// Will throw error if it fails
await sock.groupLeave(jid)
```

This action is irreversible. You’ll need to be re-invited to rejoin the group.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#safe-leave-function)

Safe Leave Function

```
const leaveGroup = async (groupJid: string) => {
  try {
    await sock.groupLeave(groupJid)
    console.log('Successfully left the group')
  } catch (error) {
    console.error('Failed to leave group:', error)
    throw error
  }
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#complete-settings-configuration)

Complete Settings Configuration

Example of configuring multiple group settings:

1

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#)

Lock down the group

```
const lockdownGroup = async (groupJid: string) => {
  // Only admins can send messages
  await sock.groupSettingUpdate(groupJid, 'announcement')
  
  // Only admins can modify settings
  await sock.groupSettingUpdate(groupJid, 'locked')
  
  // Only admins can add members
  await sock.groupMemberAddMode(groupJid, 'admin_add')
  
  // Require approval to join
  await sock.groupJoinApprovalMode(groupJid, 'on')
  
  console.log('Group locked down successfully')
}
```

2

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#)

Open group settings

```
const openGroup = async (groupJid: string) => {
  // Everyone can send messages
  await sock.groupSettingUpdate(groupJid, 'not_announcement')
  
  // Everyone can modify settings
  await sock.groupSettingUpdate(groupJid, 'unlocked')
  
  // Everyone can add members
  await sock.groupMemberAddMode(groupJid, 'all_member_add')
  
  // No approval needed to join
  await sock.groupJoinApprovalMode(groupJid, 'off')
  
  console.log('Group opened successfully')
}
```

3

[

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#)

Configure privacy settings

```
const configureGroupPrivacy = async (groupJid: string) => {
  // Update name
  await sock.groupUpdateSubject(groupJid, 'Private Discussion Group')
  
  // Set description
  await sock.groupUpdateDescription(
    groupJid,
    'Confidential discussions only. Messages auto-delete after 7 days.'
  )
  
  // Enable 7-day ephemeral messages
  await sock.groupToggleEphemeral(groupJid, 604800)
  
  // Lock settings to admins only
  await sock.groupSettingUpdate(groupJid, 'locked')
  
  console.log('Privacy settings configured')
}
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#best-practices)

Best Practices

**Check Admin Status**: Always verify you have admin permissions before attempting to modify settings.

**Sequential Updates**: When making multiple setting changes, execute them sequentially to ensure each completes successfully.

**Rate Limiting**: Avoid making too many rapid setting changes. WhatsApp may rate-limit your requests.

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#error-handling-pattern)

Error Handling Pattern

```
const updateGroupSettings = async (
  groupJid: string,
  settings: {
    announcement?: boolean
    locked?: boolean
    ephemeral?: number
  }
) => {
  try {
    if (settings.announcement !== undefined) {
      await sock.groupSettingUpdate(
        groupJid,
        settings.announcement ? 'announcement' : 'not_announcement'
      )
    }

    if (settings.locked !== undefined) {
      await sock.groupSettingUpdate(
        groupJid,
        settings.locked ? 'locked' : 'unlocked'
      )
    }

    if (settings.ephemeral !== undefined) {
      await sock.groupToggleEphemeral(groupJid, settings.ephemeral)
    }

    console.log('Settings updated successfully')
  } catch (error) {
    console.error('Failed to update settings:', error)
    throw error
  }
}

// Usage
await updateGroupSettings(groupJid, {
  announcement: true,
  locked: true,
  ephemeral: 604800 // 7 days
})
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/groups/group-settings#related-methods)

Related Methods

-   [Group Metadata](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata) - Check current group settings
-   [Managing Participants](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants) - Control member permissions
-   [Creating Groups](https://whiskeysockets-baileys-94.mintlify.app/groups/creating-groups) - Initial group setup

[

Managing Participants

Previous



](https://whiskeysockets-baileys-94.mintlify.app/groups/managing-participants)[

Group Metadata

Next



](https://whiskeysockets-baileys-94.mintlify.app/groups/group-metadata)
