# Code Review Checklist - Shared Encryption Keys

## Overview
This document provides exact code locations and changes for review before deployment.

## Files to Review

### 1. Backend Model: Conversation.js
**Location**: `backend/models/Conversation.js`

**Changes**: Lines 11-28 (NEW FIELDS)
```javascript
// ADDED:
sharedEncryptionKey: {
  type: String,
  default: '',
},
encryptionKeyInitialized: {
  type: Boolean,
  default: false,
},
encryptionKeyCreatedAt: {
  type: Date,
  default: null,
},
```

**Review Points**:
- [ ] Fields added after `lastMessage`
- [ ] Default values are appropriate
- [ ] No breaking changes to existing schema
- [ ] Index on `_id` still works

---

### 2. Backend Controller: encryptionController.js
**Location**: `backend/controllers/encryptionController.js`

**New Functions**: 
- `initializeConversationKey()` - Lines 97-180
- `getConversationKeysBatch()` - Lines 182-224

**Review Points**:
- [ ] `initializeConversationKey()` validates input
  - Check: `conversationId` required
  - Check: User is conversation participant
  - Check: Returns existing key if already initialized
  - Check: Creates new key if provided
  
- [ ] `getConversationKeysBatch()` handles multiple keys
  - Check: Accepts array of conversationIds
  - Check: Validates user in each conversation
  - Check: Returns only initialized conversations
  - Check: Error handling for invalid input

- [ ] Error responses are consistent
  - Check: 400 for missing fields
  - Check: 403 for unauthorized
  - Check: 500 for server errors

---

### 3. Backend Routes: encryptionRoutes.js
**Location**: `backend/routes/encryptionRoutes.js`

**New Routes** (Lines 31-42):
```javascript
router.post('/conversation-key/init', initializeConversationKey);
router.post('/conversation-keys/batch', getConversationKeysBatch);
```

**Review Points**:
- [ ] Routes properly registered
- [ ] Middleware `protect` applied (all routes protected)
- [ ] Routes before deprecated ones
- [ ] No conflicts with existing routes

---

### 4. Frontend Utility: sharedKeyEncryption.js
**Location**: `frontend/src/utils/sharedKeyEncryption.js` (NEW FILE)

**Functions to Review**:
1. `getOrCreateSharedKey()` (Line 56-95)
   - [ ] Checks localStorage first
   - [ ] Falls back to server
   - [ ] Generates new key if needed
   - [ ] Handles errors gracefully

2. `storeSharedKey()` (Line 6-28)
   - [ ] Validates input
   - [ ] Imports/exports key correctly
   - [ ] Uses correct localStorage prefix

3. `getSharedKey()` (Line 31-54)
   - [ ] Retrieves from localStorage
   - [ ] Handles missing keys
   - [ ] Imports key correctly

4. `getSharedKeyFromServer()` (Line 108-133)
   - [ ] Constructs correct API endpoint
   - [ ] Sends authorization header
   - [ ] Handles response correctly
   - [ ] Error handling

5. `initializeSharedKeyOnServer()` (Line 98-133)
   - [ ] POST to correct endpoint
   - [ ] Includes authorization
   - [ ] Sends both conversationId and sharedKey
   - [ ] Returns new key data

6. `getSharedKeysBatch()` (Line 205-246)
   - [ ] Accepts array of conversationIds
   - [ ] Stores each key locally
   - [ ] Returns map of all keys
   - [ ] Error handling

7. Helper functions (Line 248-261)
   - [ ] `arrayBufferToBase64()` - Correct conversion
   - [ ] `base64ToArrayBuffer()` - Correct conversion
   - [ ] Both handle edge cases

**Review Points**:
- [ ] No console.log in production (only log important events)
- [ ] Error messages don't expose sensitive data
- [ ] All async functions properly awaited
- [ ] No memory leaks (cleanup on error)
- [ ] Cross-browser compatibility (uses WebCrypto API correctly)

---

### 5. Frontend Component: ChatBox.jsx
**Location**: `frontend/src/components/ChatBox.jsx`

**Import Changes** (Line 7-12):
```javascript
// ADDED:
import { getOrCreateSharedKey } from '../utils/sharedKeyEncryption';
```

**Encryption Init Changes** (Line 47-62):
```javascript
// CHANGED FROM:
const key = await getOrCreateConversationKey(conversation._id);

// CHANGED TO:
const sharedKey = await getOrCreateSharedKey(
  conversation._id,
  user?.token,
  API
);
```

**Review Points**:
- [ ] Import added at correct location
- [ ] Function called with all required parameters
- [ ] `user?.token` is available in context
- [ ] `API` is defined in file
- [ ] Dependency array includes new dependencies
- [ ] Error handling still works
- [ ] No breaking changes to rest of component

---

## Security Review

### Access Control
- [ ] `initializeConversationKey()` validates user is participant
  ```javascript
  if (!conversation || !conversation.participants.includes(userId))
  ```

- [ ] `getConversationKeysBatch()` validates each conversation
  ```javascript
  conversations = await Conversation.find({
    _id: { $in: conversationIds },
    participants: userId,
  });
  ```

- [ ] No way to access other users' keys
- [ ] API returns 403 for unauthorized access

### Encryption
- [ ] Uses AES-256-GCM (same as before)
- [ ] New IV for each message
- [ ] Keys stored in base64 format
- [ ] No keys in logs

### Data Protection
- [ ] Keys only sent over HTTPS (in production)
- [ ] Authorization header on all requests
- [ ] No sensitive data in error messages

---

## Performance Review

### API Calls
- [ ] First message: 1 POST (init key) ✓
- [ ] Get key from server: 1 POST (retrieve) ✓
- [ ] Cached thereafter: 0 API calls ✓
- [ ] Batch retrieval: 1 POST for 50 conversations ✓

### Caching
- [ ] Keys stored in localStorage (fast)
- [ ] Check localStorage before API call
- [ ] LocalStorage has enough space (~5-10MB available)
- [ ] Cache persists across sessions

### Encryption/Decryption
- [ ] Uses native WebCrypto API (fast)
- [ ] No change to encryption algorithm
- [ ] Performance impact: <5ms per message

---

## Error Handling Review

### Frontend (`sharedKeyEncryption.js`)
- [ ] Missing conversationId caught
- [ ] Missing credentials handled
- [ ] Network errors caught
- [ ] Invalid JSON response handled
- [ ] Fallback to local key if server fails
- [ ] No uncaught promise rejections

### Backend (encryptionController.js)
- [ ] Missing fields return 400
- [ ] Non-participant returns 403
- [ ] Database errors return 500
- [ ] Logging includes error context
- [ ] No stack traces in response

---

## Backward Compatibility

### Existing Messages
- [ ] Old device-specific keys still work
- [ ] Device-specific encryption still supported
- [ ] No data loss
- [ ] Gradual migration as conversations continue

### Existing Conversations
- [ ] Can operate without sharedEncryptionKey
- [ ] New conversations use shared keys
- [ ] Old conversations continue normally

### API
- [ ] Old endpoints unchanged
- [ ] New endpoints don't conflict
- [ ] Version compatibility maintained

---

## Testing Coverage

### Unit Tests
- [ ] Test key generation
- [ ] Test key storage/retrieval
- [ ] Test encryption/decryption
- [ ] Test API endpoints
- [ ] Test error handling

### Integration Tests
- [ ] Device A sends message
- [ ] Device B retrieves and decrypts
- [ ] Device B sends reply
- [ ] Device A retrieves and decrypts

### Security Tests
- [ ] Non-participant can't access key (403)
- [ ] User can't access other conversations
- [ ] Keys properly validated
- [ ] No token bypass possible

---

## Database Review

### Schema Changes
- [ ] 3 new fields added to Conversation
- [ ] Backward compatible (optional fields)
- [ ] Default values appropriate
- [ ] No migration needed

### Indexes
- [ ] Existing index on `participants` still valid
- [ ] No new indexes needed
- [ ] Query performance not affected

### Data Size
- [ ] sharedEncryptionKey: ~200 bytes per conversation
- [ ] encryptionKeyInitialized: 1 byte
- [ ] encryptionKeyCreatedAt: 8 bytes
- [ ] Negligible DB growth

---

## Deployment Checklist

Pre-Deployment:
- [ ] All code reviewed
- [ ] Security validated
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Tests passing

Deployment:
- [ ] Backend deployed first
- [ ] Database changes verified (auto-applied)
- [ ] Frontend deployed
- [ ] API endpoints verified accessible

Post-Deployment:
- [ ] Monitor logs for errors
- [ ] Check API response times
- [ ] Test cross-device messaging
- [ ] Verify no data loss
- [ ] Monitor user feedback

---

## Sign-Off

**Code Review by**: _________________  
**Date**: _________________  
**Status**: 
- [ ] Approved - Ready to Deploy
- [ ] Changes Requested - See notes
- [ ] Rejected - Major issues found

**Notes**: 
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## Quick Code Locations Reference

| Component | File | Lines | Type |
|-----------|------|-------|------|
| Model Changes | `Conversation.js` | 11-28 | Schema |
| New Functions | `encryptionController.js` | 97-224 | Logic |
| New Routes | `encryptionRoutes.js` | 31-42 | API |
| New Utility | `sharedKeyEncryption.js` | 1-261 | Utils |
| Component Update | `ChatBox.jsx` | 7-62 | UI |

---

**Total Changes**: ~360 lines of code  
**Risk Level**: Low (backward compatible, isolated changes)  
**Breaking Changes**: None  
**Data Loss Risk**: None  
**Security Impact**: Positive (enables cross-device decryption safely)
