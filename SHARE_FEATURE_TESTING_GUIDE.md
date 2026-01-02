# Share Feature - Testing Guide

## 🧪 Complete Testing Checklist

### Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- MongoDB connected
- Logged in with valid JWT token

---

## 1. User Search Endpoint Testing

### Test 1.1: Basic User Search
**Endpoint**: `GET /api/search/quick-search?query=john`

**Using Postman**:
1. Open Postman
2. Create new GET request
3. URL: `http://localhost:5000/api/search/quick-search?query=john`
4. Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
   - `Content-Type: application/json`
5. Click Send

**Expected Result** ✅:
- Status: 200 OK
- Response: Array of users with names/emails containing "john"
- Fields: `_id`, `name`, `email`, `profilePhoto`, `role`

**Example Response**:
```json
[
  {
    "_id": "65abc123def456789",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePhoto": "https://...",
    "role": "investor"
  }
]
```

---

### Test 1.2: Search with Special Characters
**Query**: `?query=test@example`

**Expected Result** ✅:
- Finds user with email containing "test@example"
- Case-insensitive search works

---

### Test 1.3: Empty Search Query
**Query**: `?query=` (empty)

**Expected Result** ❌:
- Status: 400 Bad Request
- Message: "Search query is required"

---

### Test 1.4: Non-Existent Query
**Query**: `?query=xyznonexistentuser123`

**Expected Result** ✅:
- Status: 200 OK
- Response: Empty array `[]`

---

### Test 1.5: Search Excludes Self
**Logged in as**: user123
**Query**: `?query=user123name`

**Expected Result** ✅:
- Does NOT return self in results
- Other users with matching name appear

---

### Test 1.6: Result Limit (20 max)
**Scenario**: Create 30 test users with similar names

**Expected Result** ✅:
- Returns only 20 results maximum
- Newest/most relevant first

---

## 2. Send Direct Message Endpoint Testing

### Test 2.1: Basic Message Send
**Endpoint**: `POST /api/messages/send-direct`

**Using Postman**:
1. Create new POST request
2. URL: `http://localhost:5000/api/messages/send-direct`
3. Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
   - `Content-Type: application/json`
4. Body (JSON):
```json
{
  "recipientId": "65abc123def456789",
  "content": "Check this amazing post!",
  "postId": "65xyz789abc123def"
}
```
5. Click Send

**Expected Result** ✅:
- Status: 201 Created
- Message created successfully
- Returns message object with sender and receiver populated
- Conversation created/updated

---

### Test 2.2: Message Without PostId
**Body**:
```json
{
  "recipientId": "65abc123def456789",
  "content": "Just a regular message"
}
```

**Expected Result** ✅:
- Status: 201 Created
- Works without postId
- postId field optional

---

### Test 2.3: Missing Recipient ID
**Body**:
```json
{
  "content": "No recipient"
}
```

**Expected Result** ❌:
- Status: 400 Bad Request
- Message: "Recipient ID is required"

---

### Test 2.4: Empty Message
**Body**:
```json
{
  "recipientId": "65abc123def456789",
  "content": "   "
}
```

**Expected Result** ❌:
- Status: 400 Bad Request
- Message: "Message content is required"

---

### Test 2.5: Self-Messaging Prevention
**Logged in as**: user123
**Body**:
```json
{
  "recipientId": "user123_same_id",
  "content": "Message to self"
}
```

**Expected Result** ❌:
- Status: 400 Bad Request
- Message: "Cannot send message to yourself"

---

### Test 2.6: Invalid Recipient ID
**Body**:
```json
{
  "recipientId": "65invalid999999999",
  "content": "Message"
}
```

**Expected Result** ⚠️:
- Depends on user existence validation
- Should either: create message OR return error
- Document actual behavior

---

### Test 2.7: Very Long Message
**Body**:
```json
{
  "recipientId": "65abc123def456789",
  "content": "[1000+ character message]"
}
```

**Expected Result** ✅:
- Status: 201 Created
- Message stored and returned

---

## 3. Frontend Integration Testing

### Test 3.1: Share Button Click
1. Navigate to Feed page
2. Find any post
3. Click "🔄 Share" button

**Expected Result** ✅:
- ShareModal opens
- Three tabs visible: Messages, Platforms, Copy Link
- Modal is centered and properly styled

---

### Test 3.2: User Search in ShareModal
1. Click Share on any post
2. Go to "Messages" tab
3. Type "john" in search box

**Expected Result** ✅:
- Users list populates
- Shows matching users
- Displays: name, email, role, profile photo
- No self in results

---

### Test 3.3: Select Multiple Users
1. Click Share
2. Search for users
3. Click checkboxes on 3 different users

**Expected Result** ✅:
- Checkboxes check
- Selected user tags appear below list
- Shows "Selected: 3" counter
- Can remove by clicking X on tag

---

### Test 3.4: Share to Messages
1. Select 2 users
2. Optionally edit message
3. Click "Share to Messages"

**Expected Result** ✅:
- Loading state shows
- Success message appears
- Modal closes after 2 seconds
- Message(s) sent (verify in messages)

---

### Test 3.5: Share to Twitter
1. Click Share
2. Go to "Platforms" tab
3. Click Twitter button

**Expected Result** ✅:
- New tab opens with Twitter share dialog
- Pre-filled with post content
- URL included

---

### Test 3.6: Share to Facebook
1. Click Share
2. Go to "Platforms" tab
3. Click Facebook button

**Expected Result** ✅:
- New tab opens with Facebook sharer
- Post URL included

---

### Test 3.7: Share to LinkedIn
1. Click Share
2. Go to "Platforms" tab
3. Click LinkedIn button

**Expected Result** ✅:
- New tab opens with LinkedIn share dialog
- Professional context

---

### Test 3.8: Share to WhatsApp
1. Click Share
2. Go to "Platforms" tab
3. Click WhatsApp button

**Expected Result** ✅:
- WhatsApp link opens (or dialog)
- Pre-filled with post content

---

### Test 3.9: Share to Telegram
1. Click Share
2. Go to "Platforms" tab
3. Click Telegram button

**Expected Result** ✅:
- Telegram share dialog opens
- Pre-filled with content

---

### Test 3.10: Copy Link
1. Click Share
2. Go to "Copy Link" tab
3. Click "Copy Link"

**Expected Result** ✅:
- Green success message appears
- Link copied to clipboard
- Can paste elsewhere
- Message disappears after 2 seconds

---

## 4. Error Handling Testing

### Test 4.1: Network Error
1. Stop backend server
2. Try to share to messages
3. Start backend server again

**Expected Result** ✅:
- Error message displays
- User can retry
- No crash

---

### Test 4.2: Invalid Token
1. Clear localStorage (remove token)
2. Try to use share feature

**Expected Result** ✅:
- 401 Unauthorized error
- User redirected to login
- Or error message shown

---

### Test 4.3: Concurrent Shares
1. Select 5 users
2. Click Share immediately
3. Spam-click button

**Expected Result** ✅:
- Button disabled while loading
- Only one request at a time
- Success count accurate

---

## 5. Mobile Responsive Testing

### Test 5.1: Mobile View (320px)
1. Open DevTools
2. Set to iPhone 12 mini (320px)
3. Click Share button

**Expected Result** ✅:
- Modal fits screen
- No horizontal scroll
- Touch-friendly buttons
- Text readable

---

### Test 5.2: Tablet View (768px)
1. Set viewport to iPad (768px)
2. Test share functionality

**Expected Result** ✅:
- Modal properly sized
- All buttons accessible
- Search works smoothly

---

### Test 5.3: Mobile Keyboard
1. On mobile, click search input
2. Type with keyboard
3. Select users

**Expected Result** ✅:
- Keyboard doesn't overlap content
- Can see results while typing
- Can interact with list

---

## 6. Performance Testing

### Test 6.1: Large User List
1. Have 500+ users in database
2. Search for common name

**Expected Result** ✅:
- Returns within 2 seconds
- Limited to 20 results
- No lag

---

### Test 6.2: Bulk Share
1. Select 10 users
2. Share message
3. Monitor API calls

**Expected Result** ✅:
- 10 API calls sent
- Completes within reasonable time
- Success feedback for each

---

### Test 6.3: Memory Leaks
1. Share many times
2. Open/close modal repeatedly
3. Monitor browser memory

**Expected Result** ✅:
- Memory stable
- No memory leaks
- Modal cleanup proper

---

## 7. Browser Compatibility Testing

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 120+ | ✅ Test | Latest |
| Firefox 121+ | ✅ Test | Latest |
| Safari 17+ | ✅ Test | Latest |
| Edge 120+ | ✅ Test | Latest |
| Mobile Chrome | ✅ Test | Android |
| Mobile Safari | ✅ Test | iOS |

**Test Steps**:
1. Open each browser
2. Navigate to feed
3. Test share feature
4. Test all three methods
5. Verify responsive design

---

## 8. Database Verification

### Check Conversations Created
```javascript
// MongoDB Query
db.conversations.find().pretty()

// Should show new conversations created by shares
```

### Check Messages Created
```javascript
// MongoDB Query
db.messages.find({ messageType: 'text' }).pretty()

// Should show shared messages
```

### Verify User Search Excludes Self
```javascript
// Check that user._id not in results
db.users.find({ _id: { $ne: "user_id" } }).count()
```

---

## 9. Logging Verification

### Check Server Logs
```bash
# In backend terminal, should see:
Shared message created: 65msg456def789012 from 65abc122def456788 to 65abc123def456789
```

### Check Console Errors
1. Open browser DevTools
2. Go to Console tab
3. Share posts
4. Should see NO errors
5. Only info/success messages

---

## 10. Final Integration Test

### Complete User Journey
1. User A logs in
2. User A navigates to Feed
3. User A clicks Share on post
4. User A searches for User B
5. User A selects User B
6. User A adds custom message
7. User A clicks Share
8. User B receives message in messages
9. User B opens message
10. User B sees shared post content

**Expected Result** ✅:
- All steps work smoothly
- No errors
- Message appears in User B's inbox
- Can click and view conversation

---

## 🐛 Bug Report Template

If you find issues:

```
**Bug Title**: [Description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Environment**:
- Browser: [Chrome/Firefox/Safari/Edge]
- Version: [Version number]
- Device: [Desktop/Mobile/Tablet]
- OS: [Windows/Mac/Linux/iOS/Android]

**Screenshots**: [If applicable]

**Console Errors**: [Any errors shown]

**Server Logs**: [Any backend errors]
```

---

## ✅ Verification Checklist

- [ ] User search returns results
- [ ] User search excludes self
- [ ] Messages send successfully
- [ ] Conversations created properly
- [ ] Social shares open correctly
- [ ] Copy link works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No performance issues
- [ ] All browsers compatible
- [ ] Error handling works
- [ ] Database populated correctly

---

## 🎉 Testing Complete!

Once all tests pass, the share feature is ready for production deployment!
