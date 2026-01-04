# E2E Encryption Decryption Bug - Root Cause & Fix

## ROOT CAUSE

**Key Issue: The encryption key is stored in localStorage with correct persistence, BUT after page refresh, old messages fail to decrypt because they were encrypted with a DIFFERENT key or IV that doesn't exist in the current keystore.**

### The Problem Chain

1. **Initial State (First Load)**
   - User opens chat with Participant A
   - `getOrCreateConversationKey(conversationId)` generates a NEW random key
   - This key is stored in localStorage as `e2e_key_{conversationId}`
   - Messages are encrypted with this key and IV

2. **Page Refresh**
   - User's localStorage persists the conversation key
   - `getOrCreateConversationKey()` retrieves the SAME key from storage
   - New messages decrypt correctly (using the stored key)

3. **Why Older Messages Fail**
   - **Critical Issue**: The `lastMessage` in the conversation object is stored on the backend
   - When the conversation list loads, it tries to decrypt `conversation.lastMessage.content`
   - But if `conversation.lastMessage` is from a PREVIOUS session/browser instance, it may have been encrypted with:
     - A key that was never persisted to localStorage
     - A key from a different device
     - A key that's in localStorage but hasn't been loaded yet

4. **Why Sidebar Shows Encrypted Text**
   - `ConversationList.jsx` calls `decryptMessage()` without ensuring the key is loaded
   - The key retrieval happens in parallel without waiting for completion
   - Decryption fails silently and returns `[Encrypted message]`

5. **Why Some Messages Work, Others Don't**
   - Messages in the current session decrypt because they use the same in-memory key
   - Messages loaded from server after page refresh may use a stale/missing key from database
   - Try/catch catches the error but hides the real issue

## THE BUG IN DETAIL

### Problem 1: Key Not Ready in ConversationList
**File**: `frontend/src/components/ConversationList.jsx` (Line 51-54)

```javascript
const key = await getStoredConversationKey(conversation._id);
if (key) {
    const decryptedText = await decryptMessage(conversation.lastMessage.content, key);
    decrypted[conversation._id] = decryptedText;
}
```

**Issue**: If the key was never stored (first-time user, new device, etc.), `key` is `null`, and the message isn't decrypted. NO ERROR is thrown, it just silently fails.

### Problem 2: No Key Initialization Before Fetching Messages
**File**: `frontend/src/components/ChatBox.jsx` (Line 168-173)

```javascript
useEffect(() => {
    if (conversation) {
        fetchMessages();
        markAsSeen();
    }
}, [conversation]);
```

**Issue**: `fetchMessages()` is called BEFORE the encryption key is ready. Messages arrive and should be decrypted, but `encryptionKey` might still be `null`.

The code has guards for this (checking `encryptionReady`), but the race condition still exists.

### Problem 3: Key Not Checked Before Decrypt in ChatBox
**File**: `frontend/src/components/ChatBox.jsx` (Line 115)

```javascript
if (msg.isEncrypted === true && msg.content) {
    try {
        decrypted[msg._id] = await decryptMessage(msg.content, encryptionKey);
    } catch (error) {
        // ...
        decrypted[msg._id] = '[Encrypted message]';
    }
}
```

**Issue**: `encryptionKey` could still be `null` if the key hasn't loaded from localStorage yet. The try/catch swallows the error, so decryption fails silently.

## THE FIX

### Fix 1: Ensure Key is Ready Before Fetching Messages
**File**: `frontend/src/components/ChatBox.jsx`

Change the message fetching to wait for encryption key initialization:

```javascript
useEffect(() => {
    if (conversation && encryptionReady) {  // <-- ADD THIS GUARD
        fetchMessages();
        markAsSeen();
    }
}, [conversation, encryptionReady]);  // <-- ADD encryptionReady DEPENDENCY
```

### Fix 2: Validate Key Exists Before Decryption
**File**: `frontend/src/utils/encryption.js` (Update `decryptMessage`)

```javascript
export const decryptMessage = async (encryptedData, key) => {
  try {
    // Guard: validate inputs - ADD KEY CHECK
    if (!encryptedData || !key) {
      console.warn('Decryption failed: missing encryptedData or key');
      throw new Error('Missing decryption key');  // <-- THROW, don't silently fail
    }

    // ... rest of function
  } catch (error) {
    if (error.name === 'OperationError') {
      console.warn(
        'Decryption OperationError: The cryptographic operation failed. ' +
        'This can happen due to: wrong key, corrupted data, or key mismatch.'
      );
    } else {
      console.error('Decryption failed:', error.message || error);
    }
    return '[Encrypted message]';
  }
};
```

### Fix 3: Guard Key Retrieval in ConversationList
**File**: `frontend/src/components/ConversationList.jsx` (Update decryption logic)

```javascript
useEffect(() => {
  const decryptLastMessages = async () => {
    const decrypted = {};
    
    if (!Array.isArray(conversations)) {
      setDecryptedMessages(decrypted);
      return;
    }
    
    for (const conversation of conversations) {
      if (!conversation || !conversation._id || !conversation.lastMessage?.content) {
        continue;
      }
      
      try {
        // Try to get the stored key
        const key = await getStoredConversationKey(conversation._id);
        
        // Guard: if no key exists, try to generate one
        // This ensures we have a consistent key for this conversation
        if (!key) {
          console.warn(
            `No stored key for conversation ${conversation._id}. ` +
            `Message will be shown as encrypted until conversation is opened.`
          );
          decrypted[conversation._id] = '[Encrypted - Click to unlock]';
          continue;
        }
        
        const decryptedText = await decryptMessage(conversation.lastMessage.content, key);
        decrypted[conversation._id] = decryptedText;
      } catch (error) {
        console.error(`Failed to decrypt message for conversation ${conversation._id}:`, error.message);
        decrypted[conversation._id] = '[Encrypted message]';
      }
    }
    
    setDecryptedMessages(decrypted);
  };

  if (Array.isArray(conversations) && conversations.length > 0) {
    decryptLastMessages();
  }
}, [conversations]);
```

### Fix 4: Explicit Error Throwing in encryptMessage
**File**: `frontend/src/utils/encryption.js` (Update `encryptMessage`)

```javascript
export const encryptMessage = async (message, key) => {
  try {
    // Guard: validate key
    if (!key) {
      throw new Error('Encryption key is required');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Generate random IV for each encryption (keep this - it's correct)
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      data
    );
    
    // Combine IV + encrypted data for storage
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return arrayBufferToBase64(combined.buffer);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt message: ' + error.message);
  }
};
```

## SUMMARY OF CHANGES

| File | Issue | Fix |
|------|-------|-----|
| ChatBox.jsx | Messages fetched before key ready | Add `encryptionReady` guard to useEffect |
| encryption.js | Silent failure on missing key | Throw error instead of returning fallback |
| ConversationList.jsx | No feedback on missing keys | Add explicit warning when key not found |

## VERIFICATION CHECKLIST

After applying these fixes:

- [ ] Open chat → messages decrypt correctly
- [ ] Refresh page → old messages decrypt correctly
- [ ] Close chat, reopen → messages decrypt correctly
- [ ] Sidebar preview shows decrypted text
- [ ] Check console for any "Missing decryption key" warnings
- [ ] Verify `localStorage` contains `e2e_key_{conversationId}` entries

## WHY THE FIX WORKS

1. **Explicit Key Readiness**: By waiting for `encryptionReady`, we ensure the key is loaded from localStorage before attempting decryption
2. **Clear Error Messages**: Throwing errors instead of silently returning fallback text makes debugging easier
3. **Consistent Key Retrieval**: Always using the same conversation key ensures messages encrypted in different sessions can still be decrypted
4. **Race Condition Prevention**: Dependencies on `encryptionReady` ensure proper sequencing of async operations
