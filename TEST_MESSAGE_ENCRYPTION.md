# Message Encryption & Decryption Testing Guide

## Quick Test Steps

### Test 1: Basic Send & Receive (Requires 2 Browsers/Tabs)

**Browser A (Sender)**:
```
1. Open http://localhost:3000/messages
2. Open console (F12)
3. Select a conversation
4. Type message: "Hello World"
5. Send
6. Check console for:
   ✅ "Encrypting message..."
   ✅ "Message created: [ID]..."
   ✅ "Encrypted message content displayed locally"
```

**Browser B (Receiver)**:
```
1. Same conversation open
2. Check console for:
   ✅ "receiveMessage: [ID]"
   ✅ Message appears as "Hello World" (not encrypted)
   ✅ NO console errors about decryption
```

---

## Console Log Verification

### Expected Logs (In Order)

```javascript
// When opening conversation:
[1] "No shared key found for conversation [ID]" 
    OR "Using local shared key for conversation [ID]"
[2] "Generating new shared key for conversation [ID]"
[3] "Stored new shared key locally for conversation [ID]"
[4] "Successfully synced shared key to server..."
[5] "fetching messages..."

// When messages load:
[6] "Decrypted fetched message [ID]" (for each message)

// When you send a message:
[7] "Encrypting message..."
[8] "Message created: [ID]..."

// When recipient receives:
[9] "receiveMessage: [ID]"
[10] Message displays as plaintext
```

### ❌ Bad Signs (Errors to Avoid)

```javascript
❌ "[Encrypted message]" displayed in chat
❌ "Failed to decrypt message [ID]"
❌ "Decryption OperationError"
❌ "No shared key found" after 5 seconds
❌ "Encryption key not ready" after opening conversation
```

---

## Step-by-Step Test Plan

### Test Phase 1: Initial Setup

```bash
# Terminal 1: Start backend
cd backend
npm start
# Should see: "Connected to MongoDB"

# Terminal 2: Start frontend
cd frontend
npm run dev
# Should see: "Local: http://localhost:5173"
```

### Test Phase 2: Basic Encryption

**Actions:**
1. Log in on both devices/browsers
2. Navigate to Messages
3. Open same conversation on both
4. Wait 3 seconds for encryption to initialize
5. Send message from Browser A: "Test message 1"

**Expected Results:**
```
Browser A Console:
✅ "Encrypting message..."
✅ "Message created: [messageID]..."
✅ Message shows as "Test message 1" (plaintext)

Browser B Console:
✅ "receiveMessage: [messageID]"
✅ Message shows as "Test message 1" (plaintext)
✅ NO "[Encrypted message]" visible
```

**If Failed:**
```
❌ Message shows [Encrypted message]?
   → Check: "Decrypted fetched message" logs
   → Check: encryptionKey is set
   → Check: Browser console for crypto errors

❌ No message received on Browser B?
   → Check: Socket connection (green dot online)
   → Check: Network tab for socket events
   → Check: Both using same conversation ID
```

### Test Phase 3: Page Refresh

**Actions:**
1. Send a message from Browser A
2. Wait for message to appear on Browser B
3. Refresh Browser B (F5)
4. Wait 2 seconds for messages to load

**Expected Results:**
```
Browser B Console (after refresh):
✅ "Decrypted fetched message [ID1]"
✅ "Decrypted fetched message [ID2]"
✅ "Decrypted fetched message [ID3]"

All previous messages display as plaintext ✅
Latest message displays as plaintext ✅
```

**If Failed:**
```
❌ Messages show [Encrypted message]?
   → Check: fetchMessages() in console logs
   → Check: If "Decrypted fetched message" appears
   → Reload again (might be race condition)
```

### Test Phase 4: Media Upload

**Actions:**
1. Click paperclip icon
2. Select an image from computer
3. Send message

**Expected Results:**
```
Browser A:
✅ "Encrypting media..."
✅ Image preview appears
✅ Message shows with image

Browser B:
✅ "receiveMessage: [ID]"
✅ "Decrypted media for message [ID]"
✅ Image displays correctly
✅ NOT showing "Loading encrypted media..."
```

**If Failed:**
```
❌ Image doesn't decrypt?
   → Check: mediaIv is present
   → Check: encryptedMediaUrl is valid
   → Check: "Failed to decrypt media" logs

❌ Image shows loading forever?
   → Check: Network tab for media download
   → Check: Browser cache cleared
```

### Test Phase 5: Message Edit

**Actions:**
1. Send a message
2. Click ⋮ (three dots menu)
3. Click "Edit"
4. Change message to: "Edited message"
5. Click "Save"

**Expected Results:**
```
Browser A Console:
✅ "Encrypting edited message..."
✅ Message shows "Edited message"
✅ "(edited)" label appears

Browser B Console:
✅ "receiveMessage: [ID] with edit"
✅ Message shows "Edited message (edited)"
```

---

## Server-Side Verification

### Check 1: Message Stored Correctly

```javascript
// In MongoDB:
db.messages.findOne(
  { content: /^[A-Za-z0-9+/=]+$/ }, // Base64 pattern
  { sender: 1, content: 1, isEncrypted: 1 }
)

// Expected output:
{
  _id: ObjectId(...),
  sender: ObjectId(...),
  content: "aBc/+dEfGhIjKlMnOpQrStUvWxYzABC123==", // Encrypted base64
  isEncrypted: true
}
```

### Check 2: Shared Key Stored

```javascript
// In MongoDB:
db.conversations.findOne(
  { _id: ObjectId("[CONV_ID]") },
  { sharedEncryptionKey: 1, encryptionKeyInitialized: 1 }
)

// Expected output:
{
  _id: ObjectId(...),
  sharedEncryptionKey: "aBc/+dEfGhIjKlMnOpQrStUvWxYzABC123==",
  encryptionKeyInitialized: true
}
```

---

## Advanced Testing

### Test: Cross-Tab Communication

```javascript
// Browser A & B are different tabs of SAME browser:
1. Open conversation in Tab A
2. Open same conversation in Tab B
3. Send message in Tab A
4. Tab B should show message immediately

✅ Shows message in plaintext
✅ Shared localStorage key is used by both tabs
```

### Test: Offline Encryption

```javascript
1. Open conversation
2. Disconnect network (DevTools → Offline)
3. Type and try to send message
4. Encryption still works (all local)
5. Reconnect network
6. Message sends with encrypted content ✅
```

### Test: Key Rotation

```javascript
1. Open conversation A
2. Open conversation B  
3. Each should have different key ✅
4. Messages in A are NOT readable with key from B ✅
5. localStorage should have 2 separate keys ✅
```

---

## Performance Testing

### Test: Large Message History

```javascript
1. Conversation with 100+ messages
2. Open conversation
3. Measure time in console:
   console.time('decrypt');
   // (wait for all messages to load)
   console.timeEnd('decrypt');

Expected: < 1 second for 50 messages
Warning: 2-5 seconds for 100+ messages
```

### Test: Rapid Message Send

```javascript
1. Send 5 messages in quick succession
2. All should encrypt successfully ✅
3. Recipient receives all 5 ✅
4. All decrypt correctly (no mix-up) ✅
```

---

## Browser DevTools Debugging

### Network Tab

When sending a message:
```
POST /api/messages/send
Request Body:
{
  "conversationId": "[ID]",
  "content": "aBc/+dEf..." // Encrypted
  "isEncrypted": true,
  "messageType": "text"
}

Response:
{
  "_id": "[msgID]",
  "content": "aBc/+dEf...", // Still encrypted
  "isEncrypted": true
}
```

### Storage Tab

```
localStorage keys:
✅ e2e_shared_key_[CONV_ID1] = "aBc/+dEf..."
✅ e2e_shared_key_[CONV_ID2] = "xYz123..."
```

### Console Tab

```
Filter: "decrypt"
Should show:
✅ "Decrypted fetched message [ID1]"
✅ "Decrypted fetched message [ID2]"
✅ (etc for each message)
```

---

## Troubleshooting Flowchart

```
Message shows [Encrypted message]?
├─ Check: "Decrypted fetched message" in console?
│  ├─ YES → Key loaded late, wait 2 seconds
│  └─ NO → Skip to "Decryption Failed"
│
├─ Check: encryptionKey is set?
│  ├─ YES → Message might be corrupted
│  └─ NO → Key not initialized, wait for key
│
└─ SOLUTION:
   1. Clear localStorage (Ctrl+Shift+Delete)
   2. Refresh page (F5)
   3. Wait 3 seconds for key initialization
   4. Message should decrypt ✅

Decryption Failed?
├─ Check: OperationError in console?
│  ├─ YES → Key mismatch (device desync)
│  └─ NO → Other error
│
├─ SOLUTION:
   1. Clear this device's keys
   2. Fetch key from server
   3. Try again ✅

Key Not Initializing?
├─ Check: Network tab, 400 error on /conversation-key/init?
│  ├─ YES → Expected on first message
│  └─ NO → Server error
│
├─ SOLUTION:
   1. Send a message (triggers key sync)
   2. Wait 2 seconds
   3. Key should initialize ✅
```

---

## Success Criteria

✅ All tests pass = Implementation complete

```
[✅] Messages encrypt on send
[✅] Messages decrypt on receive
[✅] Page refresh decrypts history
[✅] Media encrypts/decrypts
[✅] Edit message works encrypted
[✅] Cross-tab works
[✅] No [Encrypted message] errors
[✅] Console shows decrypt logs
[✅] Database shows encrypted content
[✅] localStorage has shared keys
```

---

## Quick Debug Command

Copy-paste in browser console while in conversation:

```javascript
console.clear();
console.log('=== ENCRYPTION DEBUG ===');
console.log('Shared Keys:', Object.keys(localStorage).filter(k => k.startsWith('e2e_shared_key_')));
console.log('Messages:', document.querySelectorAll('[class*="message"]').length);
console.log('First Message Content:', document.querySelector('[class*="message"] p')?.textContent);
console.log('Is Encrypted?', document.querySelector('[class*="message"]')?.textContent?.includes('[Encrypted'));
```

Expected output:
```
=== ENCRYPTION DEBUG ===
Shared Keys: ['e2e_shared_key_607f1f77bcf86cd799439011']
Messages: 5
First Message Content: "Hello World"
Is Encrypted? false ✅
```
