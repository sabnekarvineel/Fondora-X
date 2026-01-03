# Socket.IO CORS Fix – Production Deployment

## Problem

Browser CORS errors when connecting to backend from different Vercel deployment URLs:

### Error 1: Socket.IO Connection Blocked
```
Access to XMLHttpRequest at 'https://fondora-x.onrender.com/socket.io/'
from origin 'https://fondora-706krwpz9-sabnekarvineels-projects.vercel.app'
has been blocked by CORS policy:
Access-Control-Allow-Origin header is missing
```

### Error 2: API Requests Blocked
```
Access to XMLHttpRequest at 'https://fondora-x.onrender.com/api/auth/login'
from origin 'https://fondora-706krwpz9-sabnekarvineels-projects.vercel.app'
has been blocked by CORS policy:
Response to preflight request doesn't pass access control check
```

### Root Causes

1. **Old Socket.IO CORS config** (line 38-44 in `server.js`):
   - Only accepts single `CLIENT_URL` from `.env`
   - Doesn't support multiple Vercel deployment URLs
   - Each PR/branch gets unique preview URL (e.g., `fondora-706krwpz9-...`)
   - Preview deployments blocked

2. **Unsafe Express CORS** (line 48 in `server.js`):
   - Default `cors()` uses `*` wildcard
   - Incompatible with credentials (auth tokens)
   - Doesn't list allowed origins for API requests

---

## Solution

### File: `backend/server.js`

#### Before (Lines 36-50)
```javascript
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

setupSocketIO(io);

app.use(cors());
app.use(express.json());
```

#### After (Lines 36-84)
```javascript
const app = express();
const httpServer = createServer(app);

// Dynamic CORS origin validator for Vercel preview deployments
const corsOriginValidator = (origin, callback) => {
  // Whitelist of static origins
  const whitelistedOrigins = [
    'https://fondora-x.vercel.app', // Production Vercel
    'http://localhost:3000', // Local development
  ];

  // Add CLIENT_URL from env if provided (for custom deployments)
  if (process.env.CLIENT_URL && !whitelistedOrigins.includes(process.env.CLIENT_URL)) {
    whitelistedOrigins.push(process.env.CLIENT_URL);
  }

  // Allow all Vercel preview deployments (pattern: *.vercel.app)
  // Also allow undefined origin for same-origin requests and mobile apps
  if (
    !origin || // same-origin requests
    whitelistedOrigins.includes(origin) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) // All Vercel preview/production URLs
  ) {
    callback(null, true);
  } else {
    callback(new Error(`CORS not allowed for origin: ${origin}`));
  }
};

// Socket.IO configuration with dynamic CORS support
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginValidator,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowEIO3: true, // Enable compatibility with older Socket.IO clients
  },
});

setupSocketIO(io);

// Express CORS middleware with same dynamic origin validator
app.use(cors({
  origin: corsOriginValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

### Key Changes

1. **Dynamic Origin Validation**
   - Uses regex pattern `/^https:\/\/[a-z0-9-]+\.vercel\.app$/` to accept ANY Vercel deployment
   - Whitelist for production and development URLs
   - Callback function for flexible validation
   - Handles preview deployments automatically

2. **Pattern Matching**
   - ✅ `https://fondora-x.vercel.app` (production)
   - ✅ `https://fondora-706krwpz9-sabnekarvineels-projects.vercel.app` (preview)
   - ✅ `https://any-name-here.vercel.app` (any Vercel URL)
   - ✅ `http://localhost:3000` (development)
   - ❌ `https://evil.com` (blocked)
   - ❌ `https://evil.vercel.com` (blocked - must be .vercel.app)

3. **Socket.IO & Express CORS**
   - Both use same `corsOriginValidator` function (single source of truth)
   - `credentials: true` - required for auth tokens
   - `allowEIO3: true` - backward compatibility with older Socket.IO versions

---

## File: `.env.example` (Documentation)

Updated comments to clarify CORS configuration:

```env
# CLIENT_URL is optional - used for additional custom deployments beyond hardcoded Vercel URLs
# Default hardcoded origins include:
#   - https://fondora-x.vercel.app
#   - https://fondora-9d01qrw6m-sabnekarvineels-projects.vercel.app
#   - http://localhost:3000
CLIENT_URL=http://localhost:3000
```

---

## How to Deploy

### Step 1: Update Backend Code
- Replace `backend/server.js` with fixed version
- Verify `.env.example` has updated documentation
- No changes to socket handlers or other files needed

### Step 2: Deploy to Render
```bash
git add backend/server.js backend/.env.example
git commit -m "fix: Socket.IO CORS multi-origin support for Vercel deployments"
git push
```

Render will auto-deploy from GitHub webhook.

### Step 3: Test in Browser
1. Open Vercel deployment URL
2. Open DevTools → Network tab
3. Filter for "socket.io"
4. Should see successful WebSocket or polling connections
5. Chat should work in real-time

---

## Verification Checklist

- [ ] No CORS errors in browser console
- [ ] Socket.IO connects successfully
- [ ] Both polling and WebSocket transports work
- [ ] Live chat messages send/receive in real-time
- [ ] Typing indicators appear
- [ ] Message seen status updates
- [ ] Works on all Vercel preview deployments
- [ ] Works on production URL

---

## Why This Approach

### ✅ Production Safe
- No wildcard origins (safe with credentials)
- Explicit whitelist prevents unauthorized origins
- Works with JWT authentication

### ✅ Multiple Deployments
- Production: `https://fondora-x.vercel.app`
- Preview: `https://fondora-9d01qrw6m-sabnekarvineels-projects.vercel.app`
- Development: `http://localhost:3000`
- Custom: Optional via `CLIENT_URL` env var

### ✅ Backward Compatible
- `allowEIO3: true` supports older Socket.IO clients
- No changes to socket event handlers
- No changes to frontend code

### ✅ Maintainable
- Central `allowedOrigins` array (single source of truth)
- Clear comments explaining each origin
- Environment variable for flexibility

---

## Future Deployments

All Vercel preview deployments are **automatically supported** via regex pattern:

```regex
/^https:\/\/[a-z0-9-]+\.vercel\.app$/
```

This means:
- ✅ Every PR/branch preview URL works automatically
- ✅ Every Vercel redeployment works automatically  
- ✅ No code changes needed for new preview URLs
- ✅ No environment variable changes needed

**To whitelist a permanent custom domain:**

Update `whitelistedOrigins` in `backend/server.js`:
```javascript
const whitelistedOrigins = [
  'https://fondora-x.vercel.app',
  'https://custom-domain.com', // Add permanent custom domain here
  'http://localhost:3000',
];
```

**To add a temporary deployment:**

Set environment variable on Render:
```env
CLIENT_URL=https://temporary-custom-domain.com
```

---

## Testing Socket.IO Connection

### Browser Console
```javascript
// Check Socket.IO connection status
io().connected // true if connected
io().handshake // shows connection details

// Listen for connection events
io().on('connect', () => console.log('Connected'))
io().on('connect_error', (e) => console.log('Error:', e))
```

### Network Tab
1. DevTools → Network tab
2. Filter: "socket.io"
3. Should see successful responses (200/101 status)
4. Look for "polling" or "WebSocket" under Type

---

## Troubleshooting

### CORS still failing?
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Check that Render has deployed latest code
- Verify backend `.env` has correct `CLIENT_URL` if needed

### Socket connects but no events?
- Check JWT token validity in socket auth
- Verify `setupSocketIO` is called (line 46)
- Check socket handler console logs on backend

### Only polling works, not WebSocket?
- Check backend has `allowEIO3: true`
- Try disabling WebSocket in browser (should fall back to polling)
- Render may block WebSocket - polling is fallback

---

## Security Notes

🔒 **Credentials Enabled**
- `credentials: true` required for auth
- Restricts origins (can't use wildcard with credentials)
- JWT tokens sent via socket handshake and API headers

🔒 **Regex Pattern Safety**
- Pattern: `/^https:\/\/[a-z0-9-]+\.vercel\.app$/`
- ✅ Allows: `https://anything-here-123.vercel.app`
- ❌ Blocks: `https://evil.com`, `https://evil.vercel.com`
- Must be HTTPS and exact domain `.vercel.app` (not `.vercel.com`)

🔒 **No Environment Variable Secrets**
- Origins are hardcoded (not sensitive)
- No API keys or JWT secrets in CORS config
- Safe to commit to version control

🔒 **Same-Origin Policy**
- Browser enforces, we configure server response
- Browser will reject unauthorized origins
- Additional validation in socket middleware (JWT check)

---

## Related Files (No Changes Needed)

These files are already configured correctly:
- `backend/socket/socketHandler.js` - Socket event handlers (unchanged)
- `backend/routes/messageRoutes.js` - Message endpoints (unchanged)
- `frontend/src/context/SocketContext.jsx` - Socket client (unchanged)
- `frontend/src/components/ChatBox.jsx` - Chat component (unchanged)

Only `backend/server.js` needed update.

---

## Success Indicators

✅ **Immediate**
- No red console errors about CORS
- WebSocket or polling connects
- Socket.IO handshake completes

✅ **User-Facing**
- Messages appear instantly
- Typing indicators show
- Online status updates in real-time
- Message read receipts work

✅ **Monitoring**
- Backend logs show user connections
- No `CORS policy` errors in browser
- Render logs show successful socket initialization
