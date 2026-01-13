# Multi-Device Encryption Key Sync Implementation

## Problem
Messages appear encrypted on some devices but normal on others. This happens because encryption keys are stored in each device's localStorage - when a user accesses the app on a new device, that device generates its own unique key, causing key mismatch when trying to decrypt messages from other devices.

## Solution Overview
Implement server-side key storage where encrypted conversation keys are synced across devices. When a user logs in on a new device:
1. Device retrieves synced keys from server
2. User enters password to decrypt master key
3. All conversation keys are restored locally
4. Messages can now be decrypted correctly

## Architecture

```
Device A (Laptop)
├── localStorage encryption keys
├── Encrypt message
└── → Server stores encrypted key backup

Device B (Phone)
├── Login
├── Request synced keys from server
├── User enters password
├── Decrypt master key
├── Restore all conversation keys
├── Decrypt messages correctly
```

## Implementation Components

### 1. Backend Changes

#### User Model (User.js)
Added `encryptionKeys` field:
```javascript
encryptionKeys: {
  masterKeyEncrypted: String,      // Master key encrypted with user password
  masterKeySalt: String,            // Salt for key derivation
  masterKeyIv: String,              // IV for master key encryption
  conversationKeys: [                // Per-conversation keys
    {
      conversationId: ObjectId,
      encryptedKey: String,
      createdAt: Date
    }
  ],
  keysSyncedAt: Date
}
```

#### Encryption Controller (encryptionController.js)
New endpoints:
- `POST /api/encryption/sync-keys` - Upload encrypted keys to server
- `GET /api/encryption/sync-keys` - Retrieve synced keys from server
- `POST /api/encryption/conversation-key` - Add single conversation key
- `GET /api/encryption/conversation-keys` - Get specific conversation keys
- `DELETE /api/encryption/keys` - Clear all keys

#### Encryption Routes (encryptionRoutes.js)
All routes are protected with authentication middleware.

### 2. Frontend Changes

#### encryption.js utilities
New functions:
- `syncKeysWithServer(password, apiUrl, token)` - Export and sync keys
- `retrieveKeysFromServer(apiUrl, token)` - Get synced keys from server
- `restoreKeysFromServerBackup(password, serverBackup)` - Decrypt and restore keys

## Implementation Steps

### Step 1: Initialize on First Login
When user logs in on a device for the first time after this update:

```javascript
import { syncKeysWithServer } from '../utils/encryption.js';

// In login/auth success handler:
try {
  await syncKeysWithServer(userPassword, API_URL, token);
  console.log('Keys synced to server');
} catch (error) {
  console.error('Failed to sync keys:', error);
  // Optional: prompt user to enable sync
}
```

### Step 2: Restore Keys on New Device
When user logs in on a new device:

```javascript
import { retrieveKeysFromServer, restoreKeysFromServerBackup } from '../utils/encryption.js';

// In login/auth success handler:
try {
  const serverKeys = await retrieveKeysFromServer(API_URL, token);
  if (serverKeys && serverKeys.masterKeyEncrypted) {
    // Prompt user for password
    const password = prompt('Enter password to restore encryption keys');
    await restoreKeysFromServerBackup(password, serverKeys);
    console.log('Keys restored successfully');
  }
} catch (error) {
  console.warn('Could not restore keys from server:', error);
  // Will use local keys, won't affect functionality
}
```

### Step 3: Sync New Conversation Keys
When a new conversation is created:

```javascript
import { addConversationKey } from './api/encryptionApi.js';

// After generating encryption key for new conversation:
const conversationKey = await getOrCreateConversationKey(conversationId);
const exportedKey = await exportKey(conversationKey);

// Sync to server
await addConversationKey(conversationId, exportedKey);
```

## API Endpoints

### 1. Sync Keys to Server
```
POST /api/encryption/sync-keys
Authorization: Bearer {token}
Content-Type: application/json

{
  "masterKeyEncrypted": "base64-encrypted-master-key",
  "masterKeySalt": "base64-salt",
  "masterKeyIv": "base64-iv",
  "conversationKeys": [
    {
      "conversationId": "conv-id",
      "encryptedKey": "base64-encrypted-key"
    }
  ]
}

Response 200:
{
  "success": true,
  "message": "Encryption keys synced successfully",
  "data": {
    "keysSyncedAt": "2024-01-13T10:30:00Z",
    "conversationKeysCount": 5
  }
}
```

### 2. Retrieve Keys from Server
```
GET /api/encryption/sync-keys
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Encryption keys retrieved successfully",
  "data": {
    "masterKeyEncrypted": "base64-encrypted-master-key",
    "masterKeySalt": "base64-salt",
    "masterKeyIv": "base64-iv",
    "conversationKeys": [
      {
        "_id": "key-id",
        "conversationId": "conv-id",
        "encryptedKey": "base64-encrypted-key",
        "createdAt": "2024-01-10T15:20:00Z"
      }
    ],
    "keysSyncedAt": "2024-01-13T10:30:00Z"
  }
}

Response 404 (no keys synced yet):
{
  "success": false,
  "message": "No synced encryption keys found. Please set up encryption on your device.",
  "data": null
}
```

### 3. Add Conversation Key
```
POST /api/encryption/conversation-key
Authorization: Bearer {token}
Content-Type: application/json

{
  "conversationId": "conv-id",
  "encryptedKey": "base64-encrypted-key"
}

Response 201:
{
  "success": true,
  "message": "Conversation key added successfully",
  "data": {
    "conversationId": "conv-id",
    "addedAt": "2024-01-13T10:35:00Z"
  }
}
```

### 4. Get Conversation Keys
```
GET /api/encryption/conversation-keys?conversationIds=id1,id2,id3
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Conversation keys retrieved",
  "data": [
    {
      "_id": "key-id",
      "conversationId": "conv-id",
      "encryptedKey": "base64-encrypted-key",
      "createdAt": "2024-01-10T15:20:00Z"
    }
  ]
}
```

### 5. Clear All Keys
```
DELETE /api/encryption/keys
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "All encryption keys have been cleared"
}
```

## Security Considerations

1. **Master Key Protection**
   - Master key is never stored in plain text
   - Derived from user password using PBKDF2
   - Only stored on client side in localStorage

2. **Server Storage**
   - Server stores encrypted master key backup
   - Server does NOT store plain conversation keys
   - Conversation keys remain end-to-end encrypted

3. **Key Derivation**
   - Uses PBKDF2 with 100,000 iterations
   - 256-bit SHA-256 hash
   - Unique salt per user

4. **Transport Security**
   - All API requests use HTTPS (in production)
   - Bearer token authentication
   - CORS protection

## Testing Checklist

- [ ] User A sends message on Device 1 (encrypted)
- [ ] Message appears encrypted on Device 1
- [ ] Keys are synced to server after sending
- [ ] User logs in on Device 2
- [ ] System prompts for password
- [ ] Keys are retrieved from server
- [ ] Password decrypts master key successfully
- [ ] All conversation keys are restored
- [ ] Message from Device 1 now displays correctly (decrypted)
- [ ] User A sends new message on Device 2
- [ ] Message appears encrypted on Device 2
- [ ] Message displays correctly on Device 1
- [ ] New conversation key syncs to server
- [ ] User logs out and logs back in
- [ ] Keys are still available and functional

## Troubleshooting

### Messages still encrypted on second device?
1. Check if server has synced keys: `GET /api/encryption/sync-keys`
2. Verify password is correct
3. Check browser console for decryption errors
4. Ensure conversation key is stored on server

### "Invalid key length" error?
1. Key backup might be corrupted
2. Try clearing localStorage and re-syncing
3. Check if password is correct

### Keys not syncing?
1. Check network tab for POST to `/api/encryption/sync-keys`
2. Verify authentication token is valid
3. Check server logs for errors

## Files Modified/Created

1. **backend/models/User.js** - Added encryptionKeys field
2. **backend/controllers/encryptionController.js** - NEW (key sync logic)
3. **backend/routes/encryptionRoutes.js** - NEW (API endpoints)
4. **backend/server.js** - Added encryption routes
5. **frontend/src/utils/encryption.js** - Added sync functions
6. **frontend/src/components/ChatBox.jsx** - (To be updated: call syncKeysWithServer on login)
7. **frontend/src/context/AuthContext.js** - (To be updated: add key sync on login)

## Future Enhancements

1. **Automatic Key Backup** - Periodically sync keys without password prompt
2. **Key Rotation** - Support rotating conversation keys
3. **Multi-Device Notifications** - Notify when keys are synced to new device
4. **Key Recovery QR Code** - Generate QR for quick device pairing
5. **Hardware Security Key Support** - Use device's secure enclave for key storage
