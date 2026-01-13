# Encryption Module Diagnostic Guide

## Quick Health Check (Browser Console)

### 1. Check if Shared Keys are Stored
```javascript
// In browser console:
Object.keys(localStorage).filter(k => k.startsWith('e2e_shared_key_'))
// Should return array of conversation IDs if any keys exist
// Example output: ["e2e_shared_key_507f1f77bcf86cd799439011"]
```

### 2. Check Message Decryption State
```javascript
// Send a test message and check console for:
// ✅ "Created new shared key for conversation [ID]"
// ✅ "receiveMessage: message [ID]"
// ✅ Message displays correctly (not [Encrypted message])
// ❌ "Decryption OperationError" indicates key mismatch
```

### 3. Verify Key Initialization Steps
```javascript
// Open conversation and look for sequence:
console.log output should show:
1. "No shared key found for conversation [ID]" (if new)
   OR
   "Using local shared key for conversation [ID]" (if cached)
   
2. "Generating new shared key for conversation [ID]" (if new)
   OR  
   "Retrieved and stored shared key from server for conversation [ID]" (if fetched)
   
3. Either:
   "Successfully synced shared key to server for conversation [ID]" ✅
   OR
   "Failed to sync shared key to server for conversation [ID], continuing with local key" ⚠️
```

---

## Troubleshooting OperationError

### Symptom
Messages showing as `[Encrypted message]` after successfully initializing key

### Root Causes and Fixes

#### 1. **Key Mismatch Across Devices**
**Symptom**: Works on device A, but not on device B
**Cause**: Each device generated its own key instead of sharing
**Fix**: Clear localStorage on other devices and re-sync
```javascript
// On affected device:
Object.keys(localStorage)
  .filter(k => k.startsWith('e2e_shared_key_'))
  .forEach(k => localStorage.removeItem(k));
// Refresh and open conversation - will fetch server's key
```

#### 2. **Corrupted Local Storage**
**Symptom**: OperationError persists on single device
**Cause**: Corrupted key in localStorage
**Fix**: Validate and clear
```javascript
// Check specific key:
const key = localStorage.getItem('e2e_shared_key_[CONV_ID]');
console.log('Key length:', key?.length); // Should be ~44 (base64 of 32 bytes)
console.log('Is base64:', /^[A-Za-z0-9+/=]+$/.test(key)); // Should be true

// If invalid, clear it:
localStorage.removeItem('e2e_shared_key_[CONV_ID]');
// Refresh and re-initialize
```

#### 3. **Server Key Sync Failed**
**Symptom**: Works initially, breaks after page refresh
**Cause**: Key was generated locally but never synced to server
**Fix**: Manually trigger sync
```javascript
// Trigger re-sync on next message send
// OR clear and regenerate:
localStorage.removeItem('e2e_shared_key_[CONV_ID]');
// Open conversation to fetch from server (will fail)
// Send message to generate and sync new key
```

#### 4. **Message Sent Before Key Initialized**
**Symptom**: First message from a new conversation shows as encrypted
**Cause**: Race condition in key initialization
**Fix**: This is now fixed - ChatBox waits for encryptionReady before allowing messages
```javascript
// Verify in console:
// Should show:
"encryptionReady = false" (while initializing)
"encryptionReady = true" (after key ready)
// Send button should be disabled until true
```

---

## Debug Mode - Enhanced Logging

### Enable Detailed Encryption Logging
Add this to your auth context or before message operations:
```javascript
// In component or utils
const enableEncryptionDebug = () => {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.log = (...args) => {
    if (args[0]?.includes?.('encryption') || 
        args[0]?.includes?.('shared') || 
        args[0]?.includes?.('decrypt')) {
      originalLog('%c[ENCRYPTION]', 'color: blue', ...args);
    } else {
      originalLog(...args);
    }
  };
  
  console.warn = (...args) => {
    if (args[0]?.includes?.('Decryption')) {
      originalWarn('%c[DECRYPTION ERROR]', 'color: red', ...args);
    } else {
      originalWarn(...args);
    }
  };
};

enableEncryptionDebug();
```

---

## Server-Side Diagnostics

### 1. Check Conversation Key Initialization Status
```javascript
// In MongoDB directly:
db.conversations.findOne(
  { _id: ObjectId("[CONVERSATION_ID]") },
  { sharedEncryptionKey: 1, encryptionKeyInitialized: 1, encryptionKeyCreatedAt: 1 }
)

// Expected output:
{
  _id: ObjectId(...),
  sharedEncryptionKey: "[BASE64_KEY_STRING]",
  encryptionKeyInitialized: true,
  encryptionKeyCreatedAt: ISODate(...)
}
```

### 2. Verify Key Format
```javascript
// Check if key stored is valid base64
const key = "[STORED_KEY_STRING]";
console.log('Key length:', key.length); // Should be ~44
console.log('Is valid base64:', /^[A-Za-z0-9+/=]+$/.test(key)); // Should be true

// Decode and check byte length
const bytes = Buffer.from(key, 'base64');
console.log('Decoded byte length:', bytes.length); // Should be 32
```

### 3. Check Multiple Conversations for Issues
```javascript
db.conversations.find(
  { 
    participants: ObjectId("[USER_ID]"),
    encryptionKeyInitialized: true
  },
  { _id: 1, encryptionKeyCreatedAt: 1 }
).limit(10)

// Should show recent key initializations
```

---

## Network Diagnostics

### Check API Requests in Network Tab

#### Successful Key Init
```
POST /api/encryption/conversation-key/init
Request:  { conversationId: "...", sharedKey: "[base64]" }
Response: { success: true, data: { conversationId: "...", sharedKey: "...", isNew: true } }
Status:   201 Created
```

#### Fetching Existing Key
```
POST /api/encryption/conversation-key/init
Request:  { conversationId: "..." }
Response: { success: true, data: { conversationId: "...", sharedKey: "...", isNew: false } }
Status:   200 OK
```

#### Expected Error (Normal)
```
POST /api/encryption/conversation-key/init
Request:  { conversationId: "..." }
Response: { success: false, message: "Shared key required to initialize..." }
Status:   400 Bad Request
EXPECTED: This is normal when conversation has no key and client doesn't send one
```

---

## Common Issues Checklist

- [ ] **"No shared key found"** → Click conversation to initialize
- [ ] **"[Encrypted message]" display** → Check if key synced (look at Network tab)
- [ ] **Different messages on different devices** → Clear localStorage on other device
- [ ] **Server returning 400** → Check if key initialization has retried (client-side)
- [ ] **Slow key initialization** → Check network - might be slow sync to server
- [ ] **Message visible on Device A, encrypted on Device B** → Key not fetched from server

---

## Performance Notes

- Key generation: ~50ms (happens once per conversation)
- Key import/export: ~5ms
- Message encryption: ~10ms per message
- Message decryption: ~10ms per message
- Server sync: Network dependent (typically 200-500ms)

If any operation takes significantly longer, check:
1. Network latency
2. Browser performance
3. CPU usage (crypto operations can be heavy)

---

## Recovery Steps

If messages won't decrypt after trying fixes above:

### Step 1: Clear All Encryption Keys
```javascript
localStorage.clear(); // WARNING: This clears all storage!
// Or selectively:
Object.keys(localStorage)
  .filter(k => k.startsWith('e2e_'))
  .forEach(k => localStorage.removeItem(k));
```

### Step 2: Restart Conversation
1. Close ChatBox
2. Select different conversation
3. Select original conversation again
4. Key will re-initialize automatically

### Step 3: Verify Fix
1. Send a new test message
2. Should see: "Created new shared key for conversation [ID]"
3. Message should display correctly
4. No [Encrypted message] errors

### Step 4: Cross-Device Sync
On other devices:
1. Log out completely
2. Clear browser cache/localStorage
3. Log back in
4. Should fetch key from server for existing conversations
5. Should be able to decrypt messages

---

## Still Having Issues?

Check these logs in order:

1. **Browser Console** - Encryption logs
2. **Network Tab** - API requests and responses
3. **MongoDB** - Conversation.sharedEncryptionKey exists
4. **Server Logs** - encryptionController.js logs
5. **User's Encryption Keys** - Might need reset

Contact support with:
- Conversation ID
- Browser/OS info
- Console logs (screenshot or paste)
- Network request/response (screenshot)
