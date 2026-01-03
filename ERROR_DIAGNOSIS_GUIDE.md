# Error Diagnosis Guide

## What We Just Added

Added global error handlers to `frontend/src/main.jsx` that will catch and log all unhandled errors with full context in the browser console.

## How to Use It

1. **Open Browser Console** (F12 → Console tab)
2. **Reproduce the error** (the action that causes it)
3. **Look for these logs:**
   - `"Unhandled promise rejection:"` 
   - `"Uncaught error:"`
4. **Copy the full output** including:
   - `reason` / `message`
   - `stack` 
   - The filename and line number

## Error Handlers Added

### Unhandled Promise Rejection Handler
Catches async errors that weren't caught with try/catch:
```javascript
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', {
    reason: event.reason,
    message: event.reason?.message,
    stack: event.reason?.stack,
    timestamp: new Date().toISOString(),
  });
});
```

### Uncaught Error Handler
Catches synchronous errors:
```javascript
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack,
    timestamp: new Date().toISOString(),
  });
});
```

## Next Steps to Debug

When you see an error:

1. **Note the error message** (e.g., "Cannot read properties of null")
2. **Note the function name** from the stack trace
3. **Note the line number** if visible
4. **Find the component** that's failing
5. **Add null checks** around the problematic property access

## Common Patterns to Look For

### Pattern 1: Array method on undefined
```javascript
// ❌ Dangerous
data.map(item => item._id)  // data could be undefined
posts.filter(p => p._id !== id)  // posts could be undefined

// ✅ Safe
data?.map(item => item._id)
posts?.filter(p => p?._id !== id)
```

### Pattern 2: Nested property access
```javascript
// ❌ Dangerous
message.sender._id  // sender could be null
post.author.profile.bio  // any level could be null

// ✅ Safe
message?.sender?._id
post?.author?.profile?.bio
```

### Pattern 3: Object in state
```javascript
// ❌ Dangerous
const { user } = useContext(AuthContext);
useEffect(() => {
  doSomething(user._id);  // user might still be null
}, []);

// ✅ Safe
useEffect(() => {
  if (!user?._id) return;
  doSomething(user._id);
}, [user?._id]);
```

## Files Recently Protected

1. **main.jsx** - Global error handlers (NEW)
2. **ChatBox.jsx** - Message queue + null checks
3. **Profile.jsx** - Null checks on user/post
4. **EditProfile.jsx** - User readiness guards
5. **PostCard.jsx** - Early return if post null
6. **Feed.jsx** - Null checks on handlers
7. **FundingDetail.jsx** - Array predicate null checks
8. **JobDetail.jsx** - Array predicate null checks

## Quick Fix Templates

### For API response handling
```javascript
const { data } = await axios.get(url);
if (!data || !data._id) {
  console.warn('Invalid response:', data);
  return;
}
// Safe to use data._id
```

### For array operations
```javascript
if (!Array.isArray(items)) {
  console.warn('Items is not an array:', items);
  return;
}
items.filter(item => item && item._id !== id)
```

### For component props
```javascript
const MyComponent = ({ data }) => {
  if (!data || !data._id) {
    console.warn('Invalid prop:', data);
    return null;
  }
  // Safe to render
};
```

## What to Do When You See an Error

1. Copy the full console error output
2. Identify which file/function is throwing
3. Check if that property could be null
4. Add a guard before accessing it
5. Test that the fix works
6. Commit the fix

## Prevention Checklist

- [ ] All user/auth context accesses have `user?.property` or guard
- [ ] All API responses are validated before use
- [ ] All array .map() checks the item is not null
- [ ] All nested property access uses optional chaining `?.`
- [ ] All components validate required props at entry
- [ ] All state updates check value exists before use

---

**The key principle: Verify data exists before using it.**
