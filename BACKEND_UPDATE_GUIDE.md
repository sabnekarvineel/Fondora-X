# Backend Update Guide - Multiple Media Upload Support

## Overview

The frontend now supports uploading multiple images/videos per post. The backend needs to be updated to handle arrays of media files instead of single files.

---

## API Changes Required

### 1. Create Post Endpoint

**Current (Old) Format:**
```
POST /api/posts
Content-Type: application/json

{
  "content": "Post text",
  "mediaUrl": "https://example.com/image.jpg",
  "mediaType": "image"
}
```

**Updated (New) Format:**
```
POST /api/posts
Content-Type: application/json

{
  "content": "Post text",
  "mediaUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/video.mp4"
  ],
  "mediaTypes": ["image", "video"]
}
```

---

## Backwards Compatibility

**Support both formats:**

```javascript
// Handle both old and new formats
const handlePostData = (req) => {
  let mediaUrls = [];
  let mediaTypes = [];

  // New format (array)
  if (Array.isArray(req.body.mediaUrls)) {
    mediaUrls = req.body.mediaUrls;
    mediaTypes = req.body.mediaTypes;
  } 
  // Old format (single file) - deprecated but supported
  else if (req.body.mediaUrl) {
    mediaUrls = [req.body.mediaUrl];
    mediaTypes = [req.body.mediaType];
  }

  return { mediaUrls, mediaTypes };
};
```

---

## Database Schema Updates

### MongoDB Post Model

**Current Schema:**
```javascript
{
  _id: ObjectId,
  content: String,
  mediaUrl: String,
  mediaType: String, // "image", "video", "none"
  createdAt: Date,
  updatedAt: Date,
  // ... other fields
}
```

**Updated Schema:**
```javascript
{
  _id: ObjectId,
  content: String,
  // Support both old and new formats
  mediaUrl: String,        // Deprecated - for backwards compat
  mediaType: String,       // Deprecated - for backwards compat
  mediaUrls: [String],     // New - array of URLs
  mediaTypes: [String],    // New - array of types
  createdAt: Date,
  updatedAt: Date,
  // ... other fields
}
```

**Mongoose Schema Update:**
```javascript
const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  // Deprecated fields (for backwards compatibility)
  mediaUrl: String,
  mediaType: {
    type: String,
    enum: ['image', 'video', 'none'],
    default: 'none'
  },
  // New fields (arrays)
  mediaUrls: {
    type: [String],
    default: []
  },
  mediaTypes: {
    type: [String],
    enum: ['image', 'video'],
    validate: {
      validator: function(v) {
        return v.every(type => ['image', 'video'].includes(type));
      }
    }
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // ... other fields
}, { timestamps: true });
```

---

## Route Handler Updates

### Create Post Route

**Current Implementation:**
```javascript
// OLD - Single file support
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, mediaUrl, mediaType } = req.body;

    if (!content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const post = new Post({
      content,
      mediaUrl,
      mediaType,
      postedBy: req.user.id
    });

    await post.save();
    
    const populatedPost = await post.populate('postedBy', 'name email');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post' });
  }
});
```

**Updated Implementation:**
```javascript
// NEW - Multiple files support
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, mediaUrls = [], mediaTypes = [] } = req.body;

    // Validation
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (mediaUrls.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 files allowed' });
    }

    // Validate arrays match
    if (mediaUrls.length !== mediaTypes.length) {
      return res.status(400).json({ 
        message: 'Media URLs and types count must match' 
      });
    }

    // Validate types are valid
    const validTypes = ['image', 'video'];
    const allValid = mediaTypes.every(type => validTypes.includes(type));
    
    if (!allValid) {
      return res.status(400).json({ 
        message: 'Invalid media types. Only "image" and "video" allowed' 
      });
    }

    // Create post
    const post = new Post({
      content: content.trim(),
      mediaUrls,
      mediaTypes,
      postedBy: req.user.id
    });

    await post.save();
    
    const populatedPost = await post
      .populate('postedBy', 'name profilePhoto role')
      .lean();
    
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post' });
  }
});
```

---

## Get Posts Endpoint

### Current (works as-is, but consider update):

```javascript
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    // Your current implementation
    const posts = await Post
      .find()
      .populate('postedBy', 'name profilePhoto role')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
});
```

### Enhanced Version (with media info):

```javascript
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post
      .find()
      .populate('postedBy', 'name profilePhoto role email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format response to ensure media arrays
    const formattedPosts = posts.map(post => ({
      ...post,
      mediaUrls: post.mediaUrls || (post.mediaUrl ? [post.mediaUrl] : []),
      mediaTypes: post.mediaTypes || (post.mediaType ? [post.mediaType] : [])
    }));

    const total = await Post.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      posts: formattedPosts,
      page,
      totalPages,
      total
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});
```

---

## Validation Helper Function

Add to your validation utilities:

```javascript
// utils/postValidation.js

const validatePostData = (content, mediaUrls = [], mediaTypes = []) => {
  const errors = [];

  // Content validation
  if (!content || !content.trim()) {
    errors.push('Content is required');
  }
  
  if (content.length > 2000) {
    errors.push('Content cannot exceed 2000 characters');
  }

  // Media count validation
  if (mediaUrls.length > 10) {
    errors.push('Maximum 10 files allowed per post');
  }

  // Array mismatch validation
  if (mediaUrls.length !== mediaTypes.length) {
    errors.push('Media URLs and types must match');
  }

  // Type validation
  const validTypes = ['image', 'video'];
  mediaTypes.forEach((type, index) => {
    if (!validTypes.includes(type)) {
      errors.push(`Invalid media type at index ${index}: ${type}`);
    }
  });

  // URL validation
  mediaUrls.forEach((url, index) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      errors.push(`Invalid URL at index ${index}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = { validatePostData };
```

---

## Migration Script

For existing database with single media format:

```javascript
// scripts/migratePostsToMultiMedia.js

const mongoose = require('mongoose');
const Post = require('../models/Post');

async function migrateToMultiMedia() {
  try {
    console.log('Starting migration...');

    // Find all posts with single media
    const posts = await Post.find({
      $or: [
        { mediaUrl: { $exists: true, $ne: null } },
        { mediaType: { $exists: true, $ne: null } }
      ]
    });

    console.log(`Found ${posts.length} posts to migrate`);

    for (const post of posts) {
      // Skip if already migrated
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        continue;
      }

      // Migrate single media to arrays
      if (post.mediaUrl) {
        post.mediaUrls = [post.mediaUrl];
        post.mediaTypes = [post.mediaType || 'image'];
      } else {
        post.mediaUrls = [];
        post.mediaTypes = [];
      }

      await post.save();
    }

    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Run: node scripts/migratePostsToMultiMedia.js
migrateToMultiMedia();
```

---

## Testing the New Endpoint

### Using cURL

```bash
# Single file (still works)
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check out this image!",
    "mediaUrls": ["https://example.com/image.jpg"],
    "mediaTypes": ["image"]
  }'

# Multiple files
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Gallery post with images and videos!",
    "mediaUrls": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/video.mp4"
    ],
    "mediaTypes": ["image", "image", "video"]
  }'
```

### Using Postman

1. Create new POST request to `http://localhost:5000/api/posts`
2. Add header: `Authorization: Bearer YOUR_TOKEN`
3. Body (JSON):
```json
{
  "content": "My new post with multiple media",
  "mediaUrls": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ],
  "mediaTypes": ["image", "image"]
}
```

---

## Response Format

**New Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "content": "Great day!",
  "mediaUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "mediaTypes": ["image", "image"],
  "postedBy": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "profilePhoto": "https://example.com/avatar.jpg",
    "role": "student"
  },
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

---

## Error Handling

Expected error responses:

```javascript
// Missing content
{ message: "Content is required" }

// Too many files
{ message: "Maximum 10 files allowed per post" }

// Array mismatch
{ message: "Media URLs and types count must match" }

// Invalid type
{ message: "Invalid media types. Only 'image' and 'video' allowed" }

// Server error
{ message: "Error creating post" }
```

---

## Frontend Compatibility

Frontend sends:
```json
{
  "content": "string",
  "mediaUrls": ["url1", "url2"],
  "mediaTypes": ["image", "video"]
}
```

Backend should:
- Accept array format
- Validate arrays
- Store arrays in database
- Return arrays in response

---

## Deployment Steps

1. **Update Database Schema**
   - Add `mediaUrls` and `mediaTypes` fields
   - Keep old fields for backwards compatibility

2. **Update Route Handlers**
   - Modify POST endpoint
   - Update validation logic
   - Ensure error handling

3. **Run Migration (if needed)**
   - Execute migration script for existing data
   - Verify data integrity

4. **Update Tests**
   - Test with single file
   - Test with multiple files
   - Test validation errors

5. **Deploy**
   - Deploy backend changes
   - Monitor logs
   - Verify frontend-backend integration

---

## Rollback Plan

If issues arise:

1. Revert route handlers to old version
2. Frontend will still work (sends arrays)
3. Backend converts arrays to single file
4. Minimal disruption

---

## Performance Considerations

- Index `mediaUrls` array for searches
- Consider pagination for posts with many comments
- Cache frequently accessed post data
- Monitor storage usage

```javascript
// Add indexes
postSchema.index({ mediaUrls: 1 });
postSchema.index({ 'postedBy': 1, 'createdAt': -1 });
```

---

## Summary

| Aspect | Details |
|--------|---------|
| Breaking Changes | Requires backend update |
| Backwards Compat | Optional (support both formats) |
| Database Update | Add arrays to schema |
| Migration Needed | For existing posts (optional) |
| Testing Required | Yes (validation, edge cases) |
| Deployment Risk | Low (with proper testing) |

---

**Next Steps:**
1. ✅ Frontend is ready
2. ⏳ Update backend routes
3. ⏳ Test thoroughly
4. ⏳ Deploy with confidence

