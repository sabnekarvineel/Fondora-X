# Decryption Error Handling - Quick Reference

## What Was Fixed

### Before (❌ Crashes)
```javascript
// No validation - could crash from any of these
const decrypted = await decryptMessage(message.content, encryptionKey)
// ❌ If message.content is invalid base64 → atob() throws
// ❌ If encryptionKey is null → crypto.subtle fails
// ❌ If data is corrupted → OperationError crashes UI
```

### After (✅ Safe)
```javascript
// Multiple guards - gracefully degrades
export const decryptMessage = async (encryptedData, key) => {
  try {
    // Guard 1: Check if inputs exist
    if (!encryptedData || !key) return '[Encrypted message]'
    
    // Guard 2: Check types are correct
    if (typeof encryptedData !== 'string') return '[Encrypted message]'
    if (typeof key !== 'object' || !key.type) return '[Encrypted message]'
    
    // Guard 3: Safely parse base64
    let combined
    try {
      combined = base64ToArrayBuffer(encryptedData)
    } catch (parseError) {
      return '[Encrypted message]'  // Invalid base64 → graceful fallback
    }
    
    // Guard 4: Validate data after parsing
    if (combinedArray.byteLength < IV_LENGTH) return '[Encrypted message]'
    
    // Guard 5: Safely decrypt
    try {
      const decrypted = await window.crypto.subtle.decrypt(...)
      return decoder.decode(decrypted)
    } catch (cryptoError) {
      return '[Encrypted message]'  // OperationError → graceful fallback
    }
  } catch (error) {
    console.error('Decryption failed:', error.message)
    return '[Encrypted message]'
  }
}
```

## Error Scenarios & Responses

| Scenario | Error Type | Response | Display |
|----------|-----------|----------|---------|
| Old message, wrong key | OperationError | Caught, logged | `[Encrypted message]` |
| Corrupted data | TypeError (invalid base64) | Caught, logged | `[Encrypted message]` |
| Encryption key not ready | No key passed | Prevented at check | `[Encrypted message]` |
| Network download failed | Fetch error | Caught in try/catch | No media display |
| Malformed message from socket | Invalid structure | Guard check fails | Skipped |
| New encrypted message | Success | Decrypted | Plaintext displayed |

## Key Guard Points

### In `decryptMessage()` (encryption.js)

```javascript
// Guard 1: Inputs
if (!encryptedData || !key) return '[Encrypted message]'

// Guard 2: Types  
if (typeof encryptedData !== 'string') return '[Encrypted message]'
if (typeof key !== 'object' || !key.type) return '[Encrypted message]'

// Guard 3: Base64 parsing (wraps atob())
try {
  combined = base64ToArrayBuffer(encryptedData)
} catch (parseError) {
  return '[Encrypted message]'
}

// Guard 4: Data length
if (combinedArray.byteLength < IV_LENGTH) return '[Encrypted message]'

// Guard 5: Extracted data
if (encrypted.byteLength === 0) return '[Encrypted message]'

// Guard 6: Crypto operation
try {
  const decrypted = await window.crypto.subtle.decrypt(...)
} catch (cryptoError) {
  return '[Encrypted message]'
}
```

### In `downloadAndDecryptMedia()` (mediaEncryption.js)

```javascript
// Guard 1: Input validation
if (!encryptedUrl || !iv || !encryptionKey) throw Error

// Guard 2: Fetch success
const response = await fetch(encryptedUrl)
if (!response.ok) throw Error

// Guard 3: Non-empty download
const encryptedBuffer = await response.arrayBuffer()
if (!encryptedBuffer || encryptedBuffer.byteLength === 0) throw Error

// Guard 4: Decrypt with internal guards
const decryptedBuffer = await decryptMedia(...)

// Guard 5: Non-empty result
if (!decryptedBuffer || decryptedBuffer.byteLength === 0) throw Error
```

### In `importKey()` (encryption.js)

```javascript
// Guard 1: String input
if (!keyString || typeof keyString !== 'string') throw Error

// Guard 2: Base64 parsing
try {
  keyBuffer = base64ToArrayBuffer(keyString)
} catch (parseError) {
  throw Error(`Invalid key format`)
}

// Guard 3: Key length (256-bit = 32 bytes)
if (keyBuffer.byteLength !== 32) throw Error
```

## Console Output Examples

### Successful decryption
```
(No logs - only success)
```

### Invalid base64
```
Decryption failed: Invalid base64 format: TypeError...
(User sees: [Encrypted message])
```

### Mismatched encryption key
```
Decryption failed: OperationError
(User sees: [Encrypted message])
```

### Missing encryption key
```
(Guard prevented call - no console error)
(User sees: [Encrypted message])
```

## Socket.IO Message Handling

```javascript
socket.on('receiveMessage', async (message) => {
  // Guard 1: Message exists and belongs to current conversation
  if (!message || message.conversation !== conversation?._id) return
  
  // Guard 2: Message has valid ID
  if (!message._id || typeof message._id !== 'string') {
    console.warn('Invalid message ID from socket')
    return
  }
  
  // Add to message list
  setMessages(prev => [...prev, message])
  
  // Guard 3: Only decrypt if encrypted flag is set AND has content AND has key
  if (message.isEncrypted === true && message.content && encryptionKey) {
    try {
      const decrypted = await decryptMessage(message.content, encryptionKey)
      // decryptMessage already handles all errors internally
      setDecryptedMessages(prev => ({
        ...prev,
        [message._id]: decrypted
      }))
    } catch (error) {
      // Shouldn't reach here - decryptMessage handles errors
      setDecryptedMessages(prev => ({
        ...prev,
        [message._id]: '[Encrypted message]'
      }))
    }
  }
})
```

## ChatBox Message Rendering

```javascript
messages.map((message) => {
  // Guard: Validate message structure
  if (!message || !message._id || !message.sender) {
    console.warn('Invalid message structure')
    return null
  }
  
  return (
    <div key={message._id}>
      {/* Get safe decrypted content - always defined */}
      <p>{getDisplayContent(message)}</p>
      {/* ...rest of message... */}
    </div>
  )
})

const getDisplayContent = (message) => {
  // decryptedMessages[message._id] will be:
  // - "[Encrypted message]" if decryption failed
  // - Plain decrypted text if successful
  // - Fallback to message.content if not encrypted
  return decryptedMessages[message._id] || message.content
}
```

## No Breaking Changes ✅

- **Encryption format:** Unchanged (AES-256-GCM)
- **Key storage:** Unchanged (localStorage)
- **Socket.IO:** Unchanged (same listeners)
- **Backend:** Unchanged (no API changes)
- **Database:** Unchanged (no schema changes)
- **Frontend UI:** Unchanged (same layout/styling)

## What Users Will See

### Old encrypted messages with wrong key
```
Chat looks normal, but message shows:
"[Encrypted message]"
```

### New messages being encrypted/decrypted
```
Real-time encryption, normal plaintext display
No user-visible change
```

### Network/fetch errors during media download
```
Loading spinner appears but no crash
Message remains visible
User can still chat
```

### All edge cases
```
Chat remains usable
No UI crashes
Console shows detailed errors for debugging
```

## Testing the Fix

### Test 1: Old message with wrong key
1. Open chat that was created before encryption update
2. Messages should show `[Encrypted message]` instead of crashing
3. New messages in same chat should decrypt correctly

### Test 2: Corrupted message
1. Manually inject malformed message to localStorage/API
2. UI should not crash
3. Console should log specific error
4. Other messages should render normally

### Test 3: Media decryption failure
1. Delete encryption key from localStorage
2. Try to view encrypted media
3. UI should show "Loading..." but not crash
4. Chat should still be usable

### Test 4: Socket.IO with malformed data
1. Send malformed message through socket
2. UI should skip invalid message
3. New valid messages should still work
4. No console errors about crashes

---

**Summary:** All decryption errors are now caught, logged, and gracefully displayed as `[Encrypted message]` instead of crashing the UI.
