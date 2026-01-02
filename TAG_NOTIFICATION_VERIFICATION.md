# Tagged User Notifications - Verification Guide

## Quick Setup Check

### Backend Files Modified ✓
- `backend/models/Notification.js` - Added 'post_tag' to enum
- `backend/controllers/postController.js` - Improved notification creation with error handling

### Frontend Files Modified ✓
- `frontend/src/components/NotificationDropdown.jsx` - Added post_tag icon and link routing
- `frontend/src/context/NotificationContext.jsx` - Added notification socket event listener

## Step-by-Step Testing

### Test 1: Create Post with Tagged User
1. Login as User A
2. Go to Feed
3. Click "Create a Post"
4. Write some content
5. Click "👥 Tag Users"
6. Search and select User B
7. Click "Post"

**Expected Results:**
- ✓ Post is created successfully
- ✓ Backend console shows: `Notification created for user [userId]: [notificationId]`
- ✓ Backend console shows: `Real-time notification emitted to user [userId]`

### Test 2: Check Notification in Dropdown
1. Login as User B
2. Refresh the page
3. Click the notification bell (🔔) in navbar

**Expected Results:**
- ✓ Notification appears in dropdown
- ✓ Notification has 🏷️ icon
- ✓ Shows message: "User A tagged you in a post"
- ✓ Shows User A's profile photo
- ✓ Shows time (e.g., "Just now", "5m ago")

### Test 3: Click Notification
1. Click the notification

**Expected Results:**
- ✓ User is taken to the feed post
- ✓ Notification is marked as read
- ✓ Notification badge count decreases
- ✓ Notification no longer appears unread (if refresh page)

### Test 4: Real-time Notification (Online User)
1. Open 2 browser windows
2. Login as User A in window 1
3. Login as User B in window 2
4. In window 1, create a post and tag User B
5. Watch window 2

**Expected Results:**
- ✓ Real-time notification appears in window 2's dropdown immediately
- ✓ Unread count increases
- ✓ Browser notification appears (if permission granted)

### Test 5: Offline Notification (User Not Online)
1. Login as User A
2. Create a post and tag User B
3. Later, User B logs in
4. Check notification center

**Expected Results:**
- ✓ Notification is still there (persisted in DB)
- ✓ Shows when User B logs in
- ✓ Has all correct information

## Debugging Commands

### Check Database Notifications
```javascript
// In MongoDB
db.notifications.find({ type: 'post_tag' }).pretty()

// View specific user's notifications
db.notifications.find({ recipient: ObjectId("userId") }).pretty()
```

### Check Browser Console
Look for these logs:
```
GET /api/notifications (when opening dropdown)
Notification created for user [userId]: [notificationId]
Real-time notification emitted to user [userId]
```

### Check Backend Console
```
Server running on port 5000
User connected: [userId]
Notification created for user [userId]: [notificationId]
Real-time notification emitted to user [userId]
```

## Common Issues & Fixes

### Issue: Notification not appearing
**Check:**
1. Is user logged in? ✓
2. Is socket connected? (Check browser console Network tab for socket.io)
3. Did post creation succeed? (Check Response tab)
4. Check notification type in DB - should be 'post_tag'

**Fix:**
- Refresh the page
- Clear browser cache
- Check backend logs for errors

### Issue: Real-time notification not appearing immediately
**Check:**
1. Is user online? (socket should show in Network tab)
2. Is socket.io initialized? (Check server console)
3. Check browser console for socket errors

**Fix:**
- Refresh the page
- Restart backend server
- Check firewall/CORS settings

### Issue: Notification appears but links to wrong place
**Check:**
1. Does notification have post ID? (Check DB)
2. Is getNotificationLink() returning correct URL?

**Fix:**
- Clear browser cache
- Force refresh (Ctrl+Shift+R)

### Issue: Notification type is not recognized
**Check:**
1. Verify 'post_tag' is in Notification model enum
2. Check postController is sending correct type

**Fix:**
- Restart backend server
- Clear any cached models

## Success Indicators

✓ Backend logs show notification creation
✓ Frontend dropdown displays notification with icon
✓ Notification shows correct sender and message
✓ Clicking notification navigates to post
✓ Notification can be marked as read
✓ Notification can be deleted
✓ Unread count updates correctly
✓ Works with both online and offline users

## Performance Notes

- Notifications are created in DB first (guaranteed)
- Real-time socket notifications are bonus (nice to have)
- If socket fails, notifications still work via DB
- Each tag creates 1 notification (efficient)
- No duplicate notifications

## Next Steps (Optional Enhancements)

1. Add notification for when someone likes a tagged post
2. Add notification for when someone comments on a tagged post
3. Add notification settings to disable/enable certain notification types
4. Add bulk delete for old notifications
5. Add notification filtering by type
