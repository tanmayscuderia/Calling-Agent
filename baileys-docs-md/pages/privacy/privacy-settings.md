# Privacy Settings

Source: https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#fetch-privacy-settings)

Fetch Privacy Settings

Retrieve all current privacy settings for your account:

```
const privacySettings = await sock.fetchPrivacySettings(true)
console.log('privacy settings: ' + privacySettings)
```

Pass `true` to force refresh the settings, or `false` to use cached values. The function is implemented in `src/Socket/chats.ts:119-134`.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#privacy-value-types)

Privacy Value Types

Most privacy settings accept these values:

-   `'all'` - Everyone can see
-   `'contacts'` - Only your contacts can see
-   `'contact_blacklist'` - Contacts except blocked ones
-   `'none'` - Nobody can see

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#update-last-seen-privacy)

Update Last Seen Privacy

Control who can see when you were last online:

```
const value = 'all' // 'contacts' | 'contact_blacklist' | 'none'
await sock.updateLastSeenPrivacy(value)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#update-online-privacy)

Update Online Privacy

Control who can see when you’re online:

```
const value = 'all' // 'match_last_seen'
await sock.updateOnlinePrivacy(value)
```

Online privacy has two options: `'all'` or `'match_last_seen'` (same as last seen setting).

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#update-profile-picture-privacy)

Update Profile Picture Privacy

Control who can see your profile picture:

```
const value = 'all' // 'contacts' | 'contact_blacklist' | 'none'
await sock.updateProfilePicturePrivacy(value)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#update-status-privacy)

Update Status Privacy

Control who can see your WhatsApp status/about:

```
const value = 'all' // 'contacts' | 'contact_blacklist' | 'none'
await sock.updateStatusPrivacy(value)
```

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#update-read-receipts-privacy)

Update Read Receipts Privacy

Control whether you send read receipts (blue ticks):

```
const value = 'all' // 'none'
await sock.updateReadReceiptsPrivacy(value)
```

Disabling read receipts (`'none'`) also prevents you from seeing others’ read receipts.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#update-groups-add-privacy)

Update Groups Add Privacy

Control who can add you to groups:

```
const value = 'all' // 'contacts' | 'contact_blacklist'
await sock.updateGroupsAddPrivacy(value)
```

Groups add privacy only supports `'all'`, `'contacts'`, or `'contact_blacklist'`. The `'none'` option is not available.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#update-default-disappearing-mode)

Update Default Disappearing Mode

Set the default duration for disappearing messages in new chats:

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#supported-times)

Supported Times

| Time | Seconds |
| --- | --- |
| Remove | 0 |
| 24h | 86,400 |
| 7d | 604,800 |
| 90d | 7,776,000 |

### 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#example)

Example

```
const ephemeral = 86400 // 24 hours in seconds
await sock.updateDefaultDisappearingMode(ephemeral)

// Disable default disappearing mode
await sock.updateDefaultDisappearingMode(0)
```

The default is 7 days (604,800 seconds). Use `WA_DEFAULT_EPHEMERAL` constant which equals `7 * 24 * 60 * 60` seconds.

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#privacy-functions-reference)

Privacy Functions Reference

All privacy update functions are implemented in `src/Socket/chats.ts`:

| Function | Line | Description |
| --- | --- | --- |
| `fetchPrivacySettings` | 119-134 | Fetch all privacy settings |
| `updateLastSeenPrivacy` | 168-170 | Update last seen visibility |
| `updateOnlinePrivacy` | 172-174 | Update online status visibility |
| `updateProfilePicturePrivacy` | 176-178 | Update profile picture visibility |
| `updateStatusPrivacy` | 180-182 | Update status/about visibility |
| `updateReadReceiptsPrivacy` | 184-186 | Update read receipt settings |
| `updateGroupsAddPrivacy` | 188-190 | Update who can add to groups |
| `updateDefaultDisappearingMode` | 192-209 | Update default disappearing messages |

## 

[​

](https://whiskeysockets-baileys-94.mintlify.app/privacy/privacy-settings#complete-example)

Complete Example

```
// Fetch current settings
const settings = await sock.fetchPrivacySettings(true)
console.log('Current privacy settings:', settings)

// Update multiple privacy settings
await sock.updateLastSeenPrivacy('contacts')
await sock.updateOnlinePrivacy('match_last_seen')
await sock.updateProfilePicturePrivacy('contacts')
await sock.updateStatusPrivacy('contacts')
await sock.updateReadReceiptsPrivacy('all')
await sock.updateGroupsAddPrivacy('contacts')

// Set default disappearing messages to 24 hours
await sock.updateDefaultDisappearingMode(86400)
```

All privacy functions use the internal `privacyQuery` helper which sends IQ queries to WhatsApp servers with the appropriate XML namespace.

[

User Queries

Previous



](https://whiskeysockets-baileys-94.mintlify.app/chats/user-queries)[

Blocking Users

Next



](https://whiskeysockets-baileys-94.mintlify.app/privacy/blocking-users)
