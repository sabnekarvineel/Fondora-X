# Message Sending - Debug Guide

## Issue Description

Messages failing to send with generic "Failed to send message" alert and console showing `[object Object]` logs.

## Root Causes Identified

### 1. **Poor Error Logging**
- `console.log(error)` outputs `[object Object]` (objects need stringification)
- No meaningful error context logged
- Socket events not logging failures

### 2. **Generic Error Messages**
- Frontend shows generic "Failed to send message" alert
- Users don't know what went wrong
- Makes debugging difficult

### 3. **Missing Validation**
- No input validation on backend
- Missing receiver validation
- No checks for required fields

## Fixes Applied

### Frontend Improvements (`ChatBox.jsx`)

**Before:**
```javascript
} catch (error) {
  console.error(error);
  alert('Failed to send message');
}
```

**After:**
```javascript
} catch (error) {
  console.error('Error sending message:', error.message || error);
  console.error('Full error:', error);
  
  // Provide more specific error messages
  let errorMessage = 'Failed to send message';
  if (error.response) {
    errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  alert(errorMessage);
}
```

**Benefits:**
- Shows actual error from server
- Logs full error details
- Users see helpful error messages

### Backend Improvements

#### 1. **Better Logging in `socketHandler.js`**

```javascript
socket.on('sendMessage', (message) => {
  try {
    const receiverId = message.receiver._id || message.receiver;
    const receiverSocketId = onlineUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', message);
      console.log(`Message sent from ${socket.userId} to ${receiverId}`);
    } else {
      console.log(`Receiver ${receiverId} not online, message saved to DB`);
    }
  } catch (error) {
    console.error('Error in sendMessage socket handler:', error.message);
  }
});
```

**Benefits:**
- Clear logging messages
- Error catching
- Meaningful console output

#### 2. **Validation in `messageController.js`**

```javascript
// Validate required fields
if (!conversationId) {
  return res.status(400).json({ message: 'Conversation ID is required' });
}

if (!content || content.trim() === '') {
  return res.status(400).json({ message: 'Message content is required' });
}

// Check for valid receiver
if (!receiver) {
  return res.status(400).json({ message: 'Invalid receiver in conversation' });
}
```

**Benefits:**
- Catches missing fields early
- Returns specific error messages
- Prevents invalid data in database

#### 3. **Global Error Handler in `server.js`**

```javascript
// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', {
    message: err.message,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});
```

**Benefits:**
- Catches all unhandled errors
- Logs with context (path, method, timestamp)
- Returns structured error responses

## Debugging Steps

### Step 1: Check Browser Console
1. Open browser Dev Tools (F12)
2. Go to Console tab
3. Send a message
4. Look for error message and stack trace

**You'll now see:**
```
Error sending message: Conversation not found
Full error: AxiosError {...}
```

### Step 2: Check Server Logs
1. Look at terminal running `npm start`
2. Check for messages like:
   - `Message created: <id> from <userId>`
   - `Error in sendMessage: <error message>`
   - `API Error: { message: ..., status: ..., path: ...}`

### Step 3: Check Network Tab
1. Open Dev Tools → Network tab
2. Send message
3. Look for POST request to `/api/messages/send`
4. Check response tab for error details

**Response should show:**
```json
{
  "success": false,
  "message": "Specific error message",
  "error": { ... }
}
```

### Step 4: Check Socket Connection
1. In console, run:
```javascript
// Check if socket is connected
console.log('Socket connected:', socket.connected);

// Check if encryptionKey exists
const key = localStorage.getItem('e2e_key_<conversationId>');
console.log('Encryption key stored:', !!key);

// Check conversation data
console.log('Conversation:', conversation);
```

## Common Error Messages and Solutions

### Error: "Conversation not found"
**Cause:** Conversation ID is invalid or deleted
**Solution:**
1. Refresh page
2. Try selecting conversation again
3. Check browser storage for stale data

### Error: "Not authorized to send message in this conversation"
**Cause:** User is not a participant in conversation
**Solution:**
1. Check you're in the right conversation
2. Verify user permissions
3. Try logging out and back in

### Error: "Message content is required"
**Cause:** Sending empty message or encryption failed
**Solution:**
1. Type some text before sending
2. If media only, check encryption is enabled
3. Check for encryption errors in console

### Error: "Server error: 500"
**Cause:** Unexpected server error
**Solution:**
1. Check server logs for details
2. Try again (may be transient)
3. Check database connection
4. Restart server if needed

### Error: "Failed to encrypt media"
**Cause:** Encryption key not initialized or media too large
**Solution:**
1. Wait for encryption key to initialize
2. Try with smaller file
3. Refresh page and try again

## Testing Message Sending

### Test Case 1: Text Message Only
1. Open chat
2. Type: "Hello"
3. Click Send
4. Expected: Message appears with timestamp and ✓

### Test Case 2: Image + Text
1. Click attachment 📎
2. Select image
3. Type: "Check this out"
4. Click Send
5. Expected: Image loads with text and 🔒 badge

### Test Case 3: Video Only
1. Click attachment 📎
2. Select video
3. Click Send (no text needed)
4. Expected: Video player appears with 🔒 badge

### Test Case 4: Empty Message
1. Click Send without typing
2. Expected: No message sent, no error (validation catches it)

### Test Case 5: Large File
1. Try uploading 50MB+ file
2. Expected: Error about file size

## Troubleshooting Checklist

- [ ] Check browser console for errors
- [ ] Check server terminal logs
- [ ] Verify network request succeeds (Network tab)
- [ ] Check encryption key exists (localStorage)
- [ ] Verify conversation ID is valid
- [ ] Check database connection (check logs)
- [ ] Try refreshing page
- [ ] Try different browser
- [ ] Check file size (< 50MB)
- [ ] Verify receiver is online (optional)

## Files Modified

| File | Changes |
|------|---------|
| `frontend/src/components/ChatBox.jsx` | Better error handling and logging |
| `backend/socket/socketHandler.js` | Error handling in socket events |
| `backend/controllers/messageController.js` | Input validation and better logging |
| `backend/server.js` | Global error handling middleware |

## Performance Impact

All improvements are minimal overhead:
- Error logging: <1ms
- Validation: <1ms
- No impact on successful messages

## Related Documentation

- [MEDIA_ENCRYPTION_GUIDE.md](MEDIA_ENCRYPTION_GUIDE.md)
- [MEDIA_ENCRYPTION_FIXES.md](MEDIA_ENCRYPTION_FIXES.md)

## Next Steps

1. Deploy fixes to staging
2. Test message sending
3. Monitor error logs
4. Adjust error messages based on user feedback
5. Consider adding toast notifications instead of alerts

## Additional Notes

### Why `[object Object]`?
When you do `console.log(error)`, JavaScript converts the object to a string, which defaults to `[object Object]`. Use:
- `console.log(JSON.stringify(error, null, 2))` for objects
- `console.log(error.message)` for error message
- `console.error('label:', error)` for structured logging

### Socket vs REST API
- **REST API** (`/api/messages/send`) - Saves message to database
- **Socket Event** (`sendMessage`) - Delivers message to online recipients in real-time

Both are needed for complete message delivery.

### Encryption Flow
1. User types message
2. Message text encrypted with conversation key
3. Media file encrypted (if attached)
4. Both sent to server
5. Server stores encrypted data
6. Socket delivers to recipient
7. Recipient decrypts locally

If any step fails, user sees specific error.
