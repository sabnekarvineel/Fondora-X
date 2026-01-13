# Architecture Diagrams - Shared Encryption Keys

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Fondora-X Messaging                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Device A (Laptop)          Server (Backend)       Device B (Phone)
│  ──────────────────         ────────────────       ──────────────
│                                                                 │
│  localStorage                                        localStorage
│  ┌──────────────────┐                              ┌─────────────┐
│  │e2e_shared_key_   │                              │e2e_shared_  │
│  │conv123: KEY      │◄────────────────────────────►│key_conv123: │
│  │e2e_shared_key_   │                              │KEY (same!)  │
│  │conv456: KEY      │        (sync on login)       │e2e_shared_  │
│  └──────────────────┘                              │key_conv456: │
│                                                    │KEY          │
│  Messages DB                                       └─────────────┘
│  ┌──────────────────┐   Conversation DB
│  │id: msg1          │   ┌──────────────────┐
│  │content: encrypted│◄─►│conv123:          │
│  │isEncrypted: true │   │sharedKey: KEY ✓  │
│  │                  │   │init: true        │
│  │id: msg2          │   └──────────────────┘
│  │content: encrypted│   ┌──────────────────┐
│  │isEncrypted: true │◄─►│conv456:          │
│  └──────────────────┘   │sharedKey: KEY ✓  │
│                          │init: true        │
│  User DB                 └──────────────────┘
│  ┌──────────────────┐   User DB
│  │userId: user1     │   ┌──────────────────┐
│  │encryptionKeys: {}│   │userId: user2     │
│  └──────────────────┘   │encryptionKeys: {}│
│                          └──────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

## Message Flow - First Device (Device A)

```
User sends message on Device A
│
├─→ Check localStorage for key
│   └─→ Not found (new conversation)
│
├─→ Call getOrCreateSharedKey()
│   ├─→ Generate new AES-256 key
│   ├─→ Store in localStorage: e2e_shared_key_conv123
│   └─→ Continue
│
├─→ Encrypt message content
│   ├─→ Input: "Hello friend"
│   ├─→ Key: AES-256 shared key
│   ├─→ Output: "a2x9k3m5p7q9r1s3t5u7v9w1x3y5z7..." (encrypted)
│   └─→ Continue
│
├─→ Send to API
│   ├─→ POST /api/messages/send
│   ├─→ body: { content: "a2x9k3m5...", isEncrypted: true }
│   └─→ Continue
│
├─→ API stores encrypted message
│   ├─→ Message saved: { content: "a2x9k3m5...", isEncrypted: true }
│   └─→ Continue
│
├─→ Initialize shared key on server (first message)
│   ├─→ POST /api/encryption/conversation-key/init
│   ├─→ body: { conversationId: "conv123", sharedKey: "KEY" }
│   ├─→ Server stores: Conversation { sharedEncryptionKey: "KEY" }
│   └─→ Continue
│
└─→ Display message
    ├─→ Decrypt with cached key
    ├─→ Output: "Hello friend" ✓
    └─→ User sees: "Hello friend"
```

## Message Flow - Second Device (Device B)

```
User logs in on Device B (same account)
│
├─→ Initialize ChatBox for conversation
│   ├─→ Check localStorage for key
│   └─→ Not found (first time on this device)
│
├─→ Call getOrCreateSharedKey()
│   ├─→ Try localStorage
│   │   └─→ Not found
│   │
│   ├─→ Try server
│   │   ├─→ POST /api/encryption/conversation-key/init
│   │   ├─→ body: { conversationId: "conv123" }
│   │   ├─→ Server finds key in Conversation doc
│   │   ├─→ Returns: { sharedKey: "KEY" (same as Device A!) }
│   │   └─→ Continue
│   │
│   └─→ Cache locally
│       └─→ Store in localStorage: e2e_shared_key_conv123
│
├─→ Load all messages for conversation
│   ├─→ GET /api/messages?conversationId=conv123
│   ├─→ Receives: [{ content: "a2x9k3m5...", isEncrypted: true }]
│   └─→ Continue
│
├─→ Decrypt each message
│   ├─→ For each encrypted message:
│   │   ├─→ Get shared key from localStorage
│   │   ├─→ Decrypt: "a2x9k3m5..." → "Hello friend" ✓
│   │   └─→ Store decrypted version
│   └─→ Continue
│
└─→ Display messages
    ├─→ OLD MESSAGE FROM DEVICE A: "Hello friend" ✓
    ├─→ (Instead of "[Encrypted message]" ✗)
    └─→ User sees: "Hello friend"
```

## Sequence Diagram

```
Device A          API            Database        Device B
   │               │                 │               │
   │ 1. Send msg   │                 │               │
   ├──────────────→│                 │               │
   │               │ 2. Store        │               │
   │               ├────────────────→│               │
   │               │                 │               │
   │ 3. Init key   │                 │               │
   ├──────────────→│                 │               │
   │               │ 4. Store key    │               │
   │               ├────────────────→│               │
   │               │ ✓ OK            │               │
   │               │←────────────────┤               │
   │ ✓ OK          │                 │               │
   │←──────────────┤                 │               │
   │               │                 │               │
   │               │                 │               ← 5. Login
   │               │                 │      6. Fetch key
   │               │←────────────────────────────────│
   │               │ 7. Return key                   │
   │               ├────────────────────────────────→│
   │               │                 │               │
   │               │                 │      8. Fetch messages
   │               │←────────────────────────────────│
   │               │ 9. Return msgs                  │
   │               ├────────────────────────────────→│
   │               │                 │               │
   │               │                 │    10. Decrypt with key
   │               │                 │      (KEY is same!)
   │               │                 │               │
   │               │                 │    11. Display ✓
   │               │                 │               │
```

## Data Flow - Cross-Device Message Decryption

```
┌──────────────────────────────────────────────────────────────┐
│                    Message Lifecycle                         │
├──────────────────────────────────────────────────────────────┤

STAGE 1: User Types Message
┌─────────────────┐
│ User Input:     │
│ "Hello friend"  │
└────────┬────────┘
         │
         ↓
STAGE 2: Encryption (Device A)
┌─────────────────────────────────────────┐
│ Key: AES-256 (shared)                   │
│ IV: Random 12-byte                      │
│ Plaintext: "Hello friend"               │
│           ↓ encrypt                     │
│ Ciphertext: "a2x9k3m5p7q9r1s3t5u7..."  │
└────────┬────────────────────────────────┘
         │
         ↓
STAGE 3: Storage (Server DB)
┌──────────────────────────────────────────┐
│ Message:                                 │
│ {                                        │
│   _id: ObjectId,                         │
│   content: "a2x9k3m5p7q9...", ✓ enc    │
│   isEncrypted: true,                     │
│   sender: user1Id,                       │
│   conversationId: "conv123"              │
│ }                                        │
│                                          │
│ Conversation:                            │
│ {                                        │
│   _id: "conv123",                        │
│   sharedEncryptionKey: "KEY" ✓ sync     │
│   encryptionKeyInitialized: true         │
│ }                                        │
└────────┬─────────────────────────────────┘
         │
         ↓
STAGE 4: Retrieval (Device B)
┌────────────────────────────────────┐
│ 1. Fetch Conversation               │
│    → Get sharedEncryptionKey: "KEY" │
│    → Store in localStorage          │
│                                    │
│ 2. Fetch Messages                   │
│    → Get ciphertext: "a2x9k3m5..."  │
│    → Retrieve key from localStorage │
└────────┬───────────────────────────┘
         │
         ↓
STAGE 5: Decryption (Device B)
┌──────────────────────────────────────┐
│ Key: "KEY" (same as Device A!) ✓    │
│ Ciphertext: "a2x9k3m5p7q9r1s3t5..."  │
│           ↓ decrypt                 │
│ Plaintext: "Hello friend" ✓         │
└────────┬─────────────────────────────┘
         │
         ↓
STAGE 6: Display (Device B)
┌──────────────────────────────┐
│ User sees:                   │
│ "Hello friend" ✓ DECRYPTED   │
│                              │
│ (Was: "[Encrypted]" before) │
└──────────────────────────────┘
```

## Cache Strategy

```
localStorage (Device-specific, persistent)
│
├─→ e2e_shared_key_conv123: "KEY1"
│   ├─→ Accessed: Instant (<1ms)
│   ├─→ Persists: Across browser sessions
│   ├─→ Size: ~200 bytes per key
│   └─→ Limit: Browser dependent (usually 5-10MB)
│
├─→ e2e_shared_key_conv456: "KEY2"
│   └─→ ...
│
└─→ e2e_shared_key_conv789: "KEY3"
    └─→ ...

Server Database (Persistent)
│
├─→ Conversation.sharedEncryptionKey
│   ├─→ Accessed: 150ms (API call)
│   ├─→ Cached in: localStorage after first retrieval
│   └─→ Updated: Only on conversation creation
│
└─→ User.encryptionKeys (master key backup)
    ├─→ For: Device restore and key backup
    └─→ Not needed for basic operation
```

## Error Handling Flow

```
Get or Create Shared Key
│
├─→ Check localStorage ────→ Found? ──→ Return ✓
│                           No
│
├─→ Fetch from Server ─────→ Success? ──→ Cache & Return ✓
│                           Error
│
├─→ Server Error Handler:
│   ├─→ 403 Unauthorized  → Not in conversation
│   ├─→ 404 Not Found     → Conversation doesn't exist
│   ├─→ 500 Server Error  → Retry or fallback
│   └─→ Network Error     → Use local key or fail gracefully
│
├─→ Generate New Key ───→ Cache Locally ─→ Return ✓
│   (if no server key)      Retry Sync Later
│
└─→ Decrypt with Key
    ├─→ Success  → Display plaintext ✓
    ├─→ Failure  → Display "[Encrypted message]"
    │             Log error for debugging
    └─→ Invalid  → Generate new key, retry
        Format
```

## Multiple Conversations

```
Device A                              Server                        Device B
│                                      │                            │
├─ Conversation1 + key1 ─────────────→├─ Conversation1: key1 ──────→├─ key1 cached
├─ Conversation2 + key2 ─────────────→├─ Conversation2: key2 ──────→├─ key2 cached
├─ Conversation3 + key3 ─────────────→├─ Conversation3: key3 ──────→├─ key3 cached
│                                      │                            │
│  (3 cached keys in localStorage)      (3 keys in DB)              │ Batch retrieve:
│  e2e_shared_key_conv1: key1          Conversation docs            │ 1 API call
│  e2e_shared_key_conv2: key2          + sharedEncryptionKey        │ All 3 keys
│  e2e_shared_key_conv3: key3          + encryptionKeyInitialized   │ ~200ms total
│                                                                    │
│  Performance: Instant                Performance: One-time 200ms   │ Performance:
│  (all in localStorage)                 API call per key            │ Fast (cached)
│                                        after first message         │
```

---

These diagrams show how shared encryption keys enable true cross-device message decryption in Fondora-X!
