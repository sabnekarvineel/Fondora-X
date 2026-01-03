# OperationError Handling - Comprehensive Fix

## Problem Statement

The app was crashing with `Decryption failed: OperationError` errors when attempting to decrypt messages and media. This is a **Web Crypto API error** that indicates the cryptographic operation failed.

## Root Causes (Why OperationError Occurs)

1. **Wrong decryption key** - Message encrypted with Key A, but decrypting with Key B
2. **Message not actually encrypted** - Code tries to decrypt plaintext
3. **Encryption key not ready yet** - UI runs decrypt before key initialization completes
4. **Corrupted/incomplete ciphertext** - Bad base64, truncated data, encoding mismatch
5. **IV/Algorithm mismatch** - IV length or algorithm differs even by 1 byte

## Solution Applied

### 1. Enhanced Error Detection in `encryption.js`

**File:** `frontend/src/utils/encryption.js` (lines 143-168)

Added specific handling for `OperationError` to distinguish it from other errors:

```javascript
try {
  const decrypted = await window.crypto.subtle.decrypt({
    name: ALGORITHM,
    iv: iv,
  }, key, encrypted);
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
} catch (error) {
  // Distinguish between different error types for better logging
  if (error.name === 'OperationError') {
    console.warn(
      'Decryption OperationError: The cryptographic operation failed. ' +
      'This can happen due to: wrong key, corrupted data, or key mismatch. ' +
      'Message will be shown as encrypted.',
      { errorMessage: error.message }
    );
  } else {
    console.error('Decryption failed:', error.message || error);
  }
  // Return user-friendly fallback without exposing crypto errors
  return '[Encrypted message]';
}
```

**Result:** All failed text decryptions gracefully return `[Encrypted message]` instead of crashing.

---

### 2. Enhanced Error Detection in `mediaEncryption.js`

**File:** `frontend/src/utils/mediaEncryption.js` (lines 90-105)

Added logging for `OperationError` while preserving the error throw behavior (so the caller can handle it):

```javascript
catch (error) {
  // Distinguish between different error types for better logging
  if (error.name === 'OperationError') {
    console.warn(
      'Media decryption OperationError: The cryptographic operation failed. ' +
      'This typically means the encryption key has changed or the media is corrupted. ' +
      'Media will not be displayed.',
      { errorMessage: error.message }
    );
  } else {
    console.error('Media decryption failed:', error.message || error);
  }
  // Re-throw so the caller can decide how to handle (fallback UI)
  throw error;
}
```

---

### 3. Media Decryption Fallback in `ChatBox.jsx`

**File:** `frontend/src/components/ChatBox.jsx` (lines 106-120)

When media decryption fails, set `decryptedMediaUrls[messageId] = null` to signal a failed state:

```javascript
try {
  const mediaUrl = await downloadAndDecryptMedia(
    message.encryptedMediaUrl,
    message.mediaIv,
    encryptionKey,
    message.mediaMimeType
  );
  setDecryptedMediaUrls((prev) => ({
    ...prev,
    [message._id]: mediaUrl,
  }));
} catch (error) {
  console.error(`Failed to decrypt media for message ${message._id}:`, error.message || error);
  // Set a fallback indicator so UI knows not to keep loading
  setDecryptedMediaUrls((prev) => ({
    ...prev,
    [message._id]: null, // null indicates decryption failed
  }));
}
```

---

### 4. Media Rendering Fallback UI in `ChatBox.jsx`

**File:** `frontend/src/components/ChatBox.jsx` (lines 716-739)

Updated image and video rendering to show a fallback message when `mediaUrl === null`:

**Before:**
```javascript
{decryptedMediaUrls[message._id] ? (
  <img src={decryptedMediaUrls[message._id]} alt="Encrypted" />
) : (
  <div className="media-loading">Loading encrypted media...</div>
)}
```

**After:**
```javascript
{decryptedMediaUrls[message._id] ? (
  <img src={decryptedMediaUrls[message._id]} alt="Encrypted" />
) : decryptedMediaUrls[message._id] === null ? (
  <div className="media-error">Unable to decrypt image. Encryption key may have changed.</div>
) : (
  <div className="media-loading">Loading encrypted media...</div>
)}
```

This provides three states:
- **Truthy URL** → Display the decrypted media
- **null** → Show error message (decryption failed)
- **undefined** → Show loading state (still attempting)

---

### 5. CSS Styles for Error States

**File:** `frontend/src/index.css` (added at end)

```css
/* Media decryption error handling */
.media-error {
    background-color: #ffe6e6;
    border: 1px solid #ff9999;
    border-radius: 8px;
    padding: 15px;
    text-align: center;
    color: #d32f2f;
    font-size: 14px;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px 0;
}

.media-loading {
    background-color: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    text-align: center;
    color: #999;
    font-size: 14px;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px 0;
}
```

---

## Existing Guards Already in Place

The codebase already had excellent validation guards:

1. **Text Decryption** (`encryption.js`):
   - ✓ Input validation (encryptedData, key)
   - ✓ Type validation
   - ✓ Base64 format validation
   - ✓ Data length validation
   - ✓ IV length validation
   - ✓ Try/catch around `crypto.subtle.decrypt`

2. **Media Decryption** (`mediaEncryption.js`):
   - ✓ Input validation (parameters exist)
   - ✓ Type validation
   - ✓ Base64 parsing validation
   - ✓ Encrypted data validation
   - ✓ IV length validation
   - ✓ Try/catch around `crypto.subtle.decrypt`

3. **ChatBox Message Handling** (`ChatBox.jsx`):
   - ✓ Message structure validation
   - ✓ Encryption key ready check
   - ✓ isEncrypted flag check
   - ✓ Try/catch around decryption calls
   - ✓ Fallback for missing keys

---

## Testing the Fix

### Test Case 1: Normal Operation
- Send and receive encrypted messages
- Both text and media should decrypt successfully
- No errors in console

### Test Case 2: Key Mismatch Simulation
- Clear localStorage conversation keys
- Reload the page
- Send encrypted message
- Open in another session without the key
- **Expected:** Message shows as `[Encrypted message]` (not a crash)

### Test Case 3: Corrupted Media
- Send an image/video
- Manually corrupt the encrypted URL in the browser
- **Expected:** Media error message displayed (not a crash)

### Test Case 4: Production Minified Code
- Messages still decrypt correctly
- No race conditions with key initialization
- Media loading states show properly

---

## Why This Fixes the Issue

| Issue | Before | After |
|-------|--------|-------|
| OperationError thrown | 💥 App crashes | ⚠️ Logged as warning, graceful fallback |
| Text message fails to decrypt | 💥 UI breaks | ✓ Shows `[Encrypted message]` |
| Media fails to decrypt | 💥 Infinite loading + crash | ✓ Shows error message |
| Key changes mid-session | 💥 Multiple errors | ✓ All handled with fallbacks |
| Corrupted ciphertext | 💥 Unhandled error | ✓ Caught and displayed |

---

## Console Behavior After Fix

**Before (Crashing):**
```
Decryption failed: OperationError
```

**After (Graceful Degradation):**
```
⚠️ Decryption OperationError: The cryptographic operation failed. 
This can happen due to: wrong key, corrupted data, or key mismatch. 
Message will be shown as encrypted.
errorMessage: "decryption operation failed"
```

---

## Key Principle Applied

> **Crypto must never crash the UI.**
>
> In real-world encrypted systems, decryption failures are **expected and normal**. The app must:
> 1. Catch the error
> 2. Log what happened
> 3. Show a safe fallback
> 4. Continue rendering

This is now the pattern throughout the codebase.
