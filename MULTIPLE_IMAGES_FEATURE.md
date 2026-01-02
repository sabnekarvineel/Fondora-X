# Multiple Images Post Feature

## Overview
Implemented LinkedIn-style multiple image posting with grid display, similar to LinkedIn's image layout.

## Changes Made

### Backend

#### 1. **Post Model** (`backend/models/Post.js`)
- Added `mediaUrls` array field to store multiple image URLs
- Kept `mediaUrl` for backward compatibility with single images

#### 2. **Post Controller** (`backend/controllers/postController.js`)
- Updated `createPost` to handle `mediaUrls` array
- Added new `uploadMultipleMedia` function to process multiple file uploads
- Returns array of media URLs

#### 3. **Post Routes** (`backend/routes/postRoutes.js`)
- Added `/upload/multiple` endpoint with `upload.array('media', 10)` middleware
- Allows up to 10 images per post
- Imported `uploadMultipleMedia` function

### Frontend

#### 1. **CreatePost Component** (`frontend/src/components/CreatePost.jsx`)
- Changed from single `mediaFile` to array of `mediaFiles`
- Added `mediaPreview` state for image previews
- Implemented preview grid display with remove functionality
- Multiple file selection in input (accept="image/*" + multiple)
- Sends files to `/api/posts/upload/multiple` endpoint
- Passes both `mediaUrl` (first image) and `mediaUrls` (all images) to post creation

#### 2. **PostCard Component** (`frontend/src/components/PostCard.jsx`)
- Added grid display for multiple images
- Displays images in responsive grid layout (1-4 columns)
- Falls back to single image display for backward compatibility
- Grid layout classes: `grid-1`, `grid-2`, `grid-3`, `grid-4`

#### 3. **CSS Styles** (`frontend/src/index.css`)
Added comprehensive styles for media grids:

**Media Grid Layout:**
- 1 image: Full width
- 2 images: 2 equal columns
- 3 images: First image spans 2 rows, other 2 on right
- 4 images: 2x2 grid

**Media Preview Grid:**
- Grid of 80px thumbnail previews
- Remove button (×) on each preview
- Hover effect on remove button

## Features

✅ **Multiple Image Selection**
- Select up to 10 images at once
- File input with `multiple` attribute

✅ **Live Preview**
- Grid of thumbnail previews before posting
- Shows number of selected images
- Remove button to delete individual images

✅ **LinkedIn-Style Grid**
- Responsive grid layout
- Different layouts based on image count
- Proper aspect ratio maintenance with object-fit: cover

✅ **Backward Compatibility**
- Old posts with single `mediaUrl` still display
- First image also stored in `mediaUrl` field
- Graceful fallback if `mediaUrls` is empty

## API Endpoints

### Upload Multiple Images
```
POST /api/posts/upload/multiple
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: FormData with 'media' field containing multiple files
Response: { message, mediaUrls: [...] }
```

### Create Post
```
POST /api/posts
{
  content: string,
  mediaUrl: string (first image for backward compatibility),
  mediaUrls: [...] (all images),
  mediaType: 'image' | 'none'
}
```

## Responsive Grid Classes

```css
.grid-1 { single column }
.grid-2 { 2 equal columns }
.grid-3 { 2 columns, first image spans 2 rows }
.grid-4 { 2x2 grid }
```

## Image Limits

- **Maximum images per post:** 10
- **Maximum file size:** Depends on server configuration
- **Supported formats:** JPEG, PNG, WebP, GIF, etc.

## Future Enhancements

- Drag-and-drop image reordering
- Image cropping/editing before upload
- Video support in grid layout
- Image carousel for better mobile experience
- Album/gallery feature
