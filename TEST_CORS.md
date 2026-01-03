# CORS Testing Guide

## Quick Test in Browser Console

### 1. Test API Request (Login Endpoint)

```javascript
// This should succeed without CORS error
fetch('https://fondora-x.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'testpass'
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.log('CORS Error:', err));
```

**Expected Result:**
- ✅ No CORS error
- Response shows (auth may fail if wrong credentials, but CORS succeeds)
- Check Network tab for 2xx or 4xx status (not CORS error)

---

### 2. Test Socket.IO Connection

```javascript
// In console, after page loads
io().connected // Should be true

// Or check connection events
io().on('connect', () => console.log('Socket connected!'));
io().on('connect_error', (err) => console.log('Socket error:', err));

// Check handshake
io().handshake // View socket connection details
```

**Expected Result:**
- ✅ `io().connected === true`
- ✅ No "CORS policy" errors in console
- ✅ WebSocket or polling connection established

---

## DevTools Network Tab

### 1. API Requests
- Open DevTools → Network tab
- Make API request (login, get posts, etc.)
- Look for `OPTIONS` preflight request (may be cached)
- Check response headers:
  ```
  Access-Control-Allow-Origin: https://[your-vercel-url]
  Access-Control-Allow-Credentials: true
  ```

### 2. Socket.IO Requests
- Filter: "socket.io"
- Should see successful requests (200 or 101 status)
- Check headers in WebSocket connection:
  ```
  Sec-WebSocket-Accept: [hash]
  ```

---

## Complete Test Checklist

### From Production URL (https://fondora-x.vercel.app)
- [ ] Login page loads
- [ ] Can type in login form
- [ ] "Login" button click succeeds
- [ ] Redirects to dashboard
- [ ] Chat messages appear instantly
- [ ] Can send new message
- [ ] Typing indicator appears
- [ ] Message read receipts work
- [ ] No console errors

### From Preview URL (https://fondora-706krwpz9-sabnekarvineels-projects.vercel.app)
- [ ] All above tests pass
- [ ] CORS errors NOT present

### From Localhost (http://localhost:3000)
- [ ] All above tests pass
- [ ] Development environment works

---

## Debugging CORS Errors

### If you see CORS error:

1. **Check browser console** (Ctrl+Shift+J)
   - Look for red error with "CORS policy"
   - Note the origin that's blocked

2. **Check Network tab**
   - Look for failed requests (red)
   - Check Response headers (not Request headers!)
   - `Access-Control-Allow-Origin` header should match your origin

3. **Verify origin format**
   - Must be `https://` (not `http://` for production)
   - Must end with `.vercel.app` (exact match)
   - Check for typos in URL

4. **Clear cache**
   - Hard refresh: Ctrl+Shift+R
   - Clear cookies: DevTools → Application → Storage → Clear All

5. **Verify backend deployed**
   - Go to https://fondora-x.onrender.com
   - Should see "Fondora-X API is running"
   - Check Render deployment logs for errors

---

## Common Issues & Fixes

### Issue: "Origin not allowed"
```
CORS policy blocked request from https://fondora-706krwpz9-sabnekarvineels-projects.vercel.app
```

**Fix:**
- New Vercel preview URL not matching regex
- Check `backend/server.js` line 58 regex pattern
- Ensure pattern matches `https://[any-chars].vercel.app`

### Issue: "Preflight failed"
```
Response to preflight request doesn't pass access control check
```

**Fix:**
- OPTIONS method not allowed
- Check `methods` array in `server.js` includes 'OPTIONS'
- Verify `allowedHeaders` includes 'Content-Type' and 'Authorization'

### Issue: "Credentials not allowed"
```
The value of the 'Access-Control-Allow-Credentials' header in the response is '' which must be 'true' when the request's credentials mode (include) is 'include'
```

**Fix:**
- `credentials: true` missing from CORS config
- Check `backend/server.js` line 67 and 82 have `credentials: true`

### Issue: Socket connects but no messages
```
Socket shows connected but chat is empty
```

**Fix:**
- Socket connection OK (CORS fixed)
- Check socket event handlers (different issue)
- Verify JWT token is valid
- Check backend socket logs

---

## Testing Different Origins

### Test Regex Pattern

Run in Node.js:
```javascript
const pattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

// Should match (return true)
console.log(pattern.test('https://fondora-x.vercel.app')); // true
console.log(pattern.test('https://fondora-706krwpz9-sabnekarvineels-projects.vercel.app')); // true
console.log(pattern.test('https://my-custom-app.vercel.app')); // true

// Should NOT match (return false)
console.log(pattern.test('https://evil.com')); // false
console.log(pattern.test('https://evil.vercel.com')); // false
console.log(pattern.test('http://fondora-x.vercel.app')); // false - must be https
console.log(pattern.test('https://Fondora-X.vercel.app')); // false - must be lowercase
```

---

## Logs to Check

### Backend (Render Logs)
```
Server running on port 5000
User connected: [userId]
Message sent from [senderId] to [receiverId]
```

### Browser Console
- ✅ No red "CORS policy" errors
- ✅ Socket.IO messages about connection
- ✅ API response objects logged

---

## Success Indicators

When CORS is fixed:

1. **Network Requests**
   - API requests show 200/201 status (not CORS error)
   - Socket.IO shows 101 (WebSocket upgrade) or 200 (polling)

2. **Browser Console**
   - No CORS errors
   - Messages and typing indicators appear

3. **Chat Functionality**
   - Messages send instantly
   - Receive messages in real-time
   - Typing indicators appear
   - Read receipts work

4. **Multiple Deployments**
   - Production URL works
   - All preview URLs work
   - Development localhost works
   - No code changes between deployments
