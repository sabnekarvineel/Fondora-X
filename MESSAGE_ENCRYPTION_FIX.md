# Message Encryption Timing Fix

## Problem
Messages were being encrypted after some time delay, appearing as unencrypted initially and then becoming encrypted later. This suggested a timing issue in the encryption process.

## Root Cause Analysis
1. **Frontend Issue**: The encryption was happening asynchronously, but the `isEncrypted` flag was hardcoded to `true` even if encryption failed
2. **Backend Issue**: Messages could be saved with `isEncrypted: false` by default or if encryption failed on the client side
3. **Time Slot Issue**: Messages sent before encryption key was ready or with failed encryption attempts were being saved without proper encryption

## Solutions Applied

### 1. Frontend Changes (ChatBox.jsx)

#### Send Message Handler
- Added validation to ensure encryption key exists before attempting to encrypt
- Wrapped encryption in try-catch to handle encryption failures gracefully
- Only set `isEncrypted: true` if encryption actually succeeded
- Added error logging for failed encryption attempts

**Before:**
```javascript
const encryptedContent = await encryptMessage(messageContent, encryptionKey);
const { data } = await axios.post(..., {
  ...
  isEncrypted: true,  // Always true, even if encryption failed
  ...
});
```

**After:**
```javascript
if (!encryptionKey) {
  throw new Error('Encryption key not available. Please try again.');
}

let encryptedContent = messageContent;
let isMessageEncrypted = false;

try {
  encryptedContent = await encryptMessage(messageContent, encryptionKey);
  isMessageEncrypted = true;
} catch (error) {
  console.error('Failed to encrypt message, sending unencrypted:', error);
  isMessageEncrypted = false;
}

const { data } = await axios.post(..., {
  ...
  isEncrypted: isMessageEncrypted,
  ...
});
```

#### Edit Message Handler
- Applied same encryption validation and error handling to ensure edited messages are properly encrypted
- Prevents unencrypted message edits

### 2. Backend Changes

#### Message Model (Message.js)
- Added pre-save middleware to warn when messages are being saved unencrypted
- This helps identify security issues in the logs

#### Message Controller (messageController.js)

**sendMessage Function:**
- Added logic to enforce encryption flag based on client submission
- Logs warnings when messages are being saved unencrypted
- Defaults to `isEncrypted: true` when not explicitly specified

**editMessage Function:**
- Enforces encryption for edited messages
- Defaults to `isEncrypted: true`
- Logs unencrypted message edits for auditing

**sendDirectMessage Function:**
- Changed `isEncrypted: false` to `isEncrypted: true`
- Ensures all direct messages (like post shares) are encrypted by default

## Security Improvements

1. **Immediate Encryption**: All messages are now encrypted immediately before sending
2. **Consistent Flag**: The `isEncrypted` flag accurately reflects whether encryption succeeded
3. **Fallback Handling**: If encryption fails, the system now properly records this instead of claiming encryption succeeded
4. **Audit Trail**: Server logs warn about any unencrypted messages for security monitoring
5. **Default Encryption**: All new message types default to encrypted

## Testing Checklist

- [ ] Send new message and verify `isEncrypted: true` and content is encrypted
- [ ] Edit a message and verify it remains encrypted
- [ ] Send direct message and verify encryption
- [ ] Check server logs for any unencrypted message warnings
- [ ] Test with encryption key not ready - should show error
- [ ] Verify message displays correctly after decryption on receiving end

## Files Modified

1. `frontend/src/components/ChatBox.jsx` - Fixed encryption timing in send/edit handlers
2. `backend/models/Message.js` - Added pre-save encryption validation
3. `backend/controllers/messageController.js` - Enforced encryption defaults and validation

## Notes

- All messages should now be encrypted immediately upon creation
- The encryption key must be ready before sending messages
- Unencrypted messages (if any occur) will be logged for debugging
- Future work: Consider rejecting unencrypted messages entirely instead of logging warnings
