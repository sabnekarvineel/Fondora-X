# Account Deactivation Feature - Testing Guide

## Overview
This document outlines the complete account deactivation feature implementation including backend cascading deletes, audit logging, and frontend warning modal.

---

## Backend Implementation

### 1. **Cascading Deletes**
When a user deactivates their account, the following data is permanently deleted:

#### Posts
- All posts authored by the user are deleted from the database
- All comments made by the user on other posts are removed
- All likes given by the user are removed
- All shares made by the user are removed
- User is removed from any taggedUsers arrays

#### Messages
- All messages sent by the user are deleted
- All messages received by the user are deleted
- Conversations involving the user are deleted

#### Account Status
- User's `isActive` flag is set to `false`
- User data (profile, email, etc.) is preserved for potential legal/compliance reasons

### 2. **Audit Logging**
- All deactivation events are logged to `backend/logs/account_deactivations.log`
- Log format: `[ISO_TIMESTAMP] User ID: {userId} | Email: {email} | Action: Account Deactivated`
- File is automatically created if it doesn't exist

### 3. **Files Modified**
- `backend/controllers/settingsController.js`
  - Added imports: `Post`, `Message`, `Conversation` models
  - Added audit logging function: `logDeactivation()`
  - Enhanced `deactivateAccount()` with cascading deletes

---

## Frontend Implementation

### 1. **Deactivation Modal**
A prominent warning modal displays when user clicks "Deactivate Account" button:

**Warning Messages Displayed:**
- All your posts will be permanently deleted
- All your messages will be permanently deleted
- Your profile will no longer be visible
- Your account data cannot be recovered

**Modal Features:**
- Fixed overlay blocking background interaction
- Smooth slide-in animation
- Close button (X) in header
- Password verification required
- "Deactivate Permanently" button disabled until password is entered

### 2. **User Experience Flow**
1. User navigates to Settings page
2. Scrolls to "⚠️ Deactivate Account" section
3. Clicks "Deactivate Account" button
4. Modal appears with detailed warnings
5. User enters password
6. User clicks "Deactivate Permanently"
7. Backend processes deletion
8. User is logged out and redirected to login page

### 3. **Files Modified**
- `frontend/src/components/Settings.jsx`
  - Updated deactivation modal UI
  - Added comprehensive warning list
  - Enhanced modal styling with animations
  - Added password validation

---

## Testing Checklist

### Backend Testing

#### Test 1: Post Deletion
```
STEPS:
1. Create test user account
2. Create 3 posts as test user
3. Have another user comment on one post
4. Have another user like one post
5. Deactivate test user account (provide password)
6. Verify all 3 posts are deleted
7. Verify comments are removed from other users' posts
8. Verify likes are removed

EXPECTED RESULT: ✓ All posts deleted, cascading deletes applied
```

#### Test 2: Message Deletion
```
STEPS:
1. Create test user account
2. Have test user send messages to other users
3. Have other users send messages to test user
4. Create conversations
5. Deactivate test user account
6. Verify all messages are deleted
7. Verify conversations are deleted

EXPECTED RESULT: ✓ All messages and conversations deleted
```

#### Test 3: Audit Logging
```
STEPS:
1. Deactivate a test user account
2. Check backend/logs/account_deactivations.log
3. Verify entry is present with correct format

EXPECTED RESULT: ✓ Log entry created with timestamp, user ID, and email
```

#### Test 4: User Data Preservation
```
STEPS:
1. Deactivate test user account
2. Query User collection for deactivated user
3. Verify user document still exists
4. Verify user.isActive = false
5. Verify user email and other data preserved

EXPECTED RESULT: ✓ User record preserved with isActive = false
```

#### Test 5: Auth Blocking
```
STEPS:
1. Deactivate test user account
2. Try to make API request with deactivated user's token
3. Verify request returns 403 error

EXPECTED RESULT: ✓ API returns: "Account is deactivated. Please reactivate your account to continue."
```

### Frontend Testing

#### Test 6: Modal Display
```
STEPS:
1. Log in as test user
2. Navigate to Settings page
3. Scroll to "Deactivate Account" section
4. Click "Deactivate Account" button
5. Verify modal appears with overlay

EXPECTED RESULT: ✓ Modal displays with:
  - Dark overlay
  - Centered modal box
  - Warning title
  - All 4 warning items listed
  - Password input field
  - Cancel and Confirm buttons
```

#### Test 7: Password Validation
```
STEPS:
1. Open deactivation modal
2. Verify "Deactivate Permanently" button is disabled
3. Enter incorrect password
4. Click "Deactivate Permanently"
5. Verify error message appears
6. Try with correct password
7. Verify deactivation proceeds

EXPECTED RESULT: ✓ Button disabled until password entered, error on wrong password
```

#### Test 8: Modal Animations
```
STEPS:
1. Open deactivation modal
2. Observe slide-in animation
3. Close modal with X button
4. Verify smooth close animation

EXPECTED RESULT: ✓ Smooth 0.3s slide-in/out animations
```

#### Test 9: Logout After Deactivation
```
STEPS:
1. Open deactivation modal
2. Enter correct password
3. Click "Deactivate Permanently"
4. Verify success message displays
5. Wait 2 seconds
6. Verify redirect to login page
7. Verify user is logged out

EXPECTED RESULT: ✓ User logged out and redirected to /login
```

### Integration Testing

#### Test 10: Complete User Journey
```
STEPS:
1. Create test user with profile
2. Create 5 posts
3. Create 3 conversations with messages
4. Have other users interact (like, comment)
5. Navigate to Settings
6. Initiate account deactivation
7. Enter password and confirm
8. Verify:
   - User logged out
   - User redirected to login
   - All posts deleted
   - All messages deleted
   - Audit log entry created
   - User.isActive = false
   - User cannot log in (attempt shows appropriate error)

EXPECTED RESULT: ✓ Complete cascading delete with cleanup
```

---

## API Endpoint Reference

### Deactivate Account
```
PUT /api/settings/deactivate
Headers: Authorization: Bearer {token}
Body: { password: "user_password" }

Success Response (200):
{
  message: "Account deactivated successfully"
}

Error Responses:
- 400: "Please provide your password to deactivate account"
- 400: "Password is incorrect"
- 404: "User not found"
- 500: Server error
```

---

## Important Notes

1. **Data Deletion is Permanent**: Once deactivated, user posts and messages cannot be recovered
2. **User Record Preserved**: User documents remain in DB (soft delete) for compliance
3. **Cascading Deletes**: Comments, likes, and shares are cleaned up across all posts
4. **Audit Trail**: All deactivations logged with timestamp and user info
5. **Protected Routes**: Deactivated users are blocked from API access (403 error)

---

## Deployment Checklist

- [ ] Backend updated with cascading delete logic
- [ ] Audit logging implemented and tested
- [ ] Frontend modal styling complete
- [ ] Password validation on frontend
- [ ] Error handling for failed deactivations
- [ ] Testing completed for all scenarios
- [ ] Logs directory created and permissions set
- [ ] Documentation updated

---

## Support & Troubleshooting

### Issue: Modal doesn't appear
- Check browser console for errors
- Verify Settings component imported correctly
- Check z-index conflicts with other elements

### Issue: Logs not being created
- Verify backend/logs directory exists or has write permissions
- Check file system permissions
- Verify Node.js process has write access

### Issue: Cascading deletes not working
- Verify Post/Message models have correct references
- Check MongoDB query syntax
- Verify indexes are created

---

**Last Updated**: 2025-12-30
**Status**: Implementation Complete - Ready for Testing
