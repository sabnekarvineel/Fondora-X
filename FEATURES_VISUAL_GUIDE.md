# Visual Guide - New Features

## 1. Mobile Notification Button

### Desktop View (≥992px)

```
┌──────────────────────────────────────────────────────────┐
│ [← Back] Logo        [Menu] [Bell] [Logout]              │
│ ← Home ← Dashboard   [Notifications in menu]             │
└──────────────────────────────────────────────────────────┘
```

- Notification bell inside hamburger menu
- Full menu visible on desktop

### Mobile View (<992px)

```
┌──────────────────────────────────────────────────────────┐
│ [← Back] Logo        [Bell] [☰]                          │
│                      [Always Visible]                    │
│                                                           │
│ [Sidebar Menu when ☰ opened]                             │
│ ├─ Home                                                   │
│ ├─ Dashboard                                             │
│ ├─ Messages                                              │
│ ├─ ... (without Notification button)                     │
│ └─ Logout                                                │
└──────────────────────────────────────────────────────────┘
```

- Notification bell **always visible** on navbar
- Hamburger menu contains only navigation & logout
- No duplicate notification in menu

---

## 2. Multiple Media Upload

### Create Post Form

```
┌─────────────────────────────────────────────────────────┐
│ Create a Post                                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────────────────────────────────────────────────┐    │
│ │ What's on your mind?                             │    │
│ │                                                   │    │
│ │                                                   │    │
│ │                                                   │    │
│ └──────────────────────────────────────────────────┘    │
│                                                          │
│ 📎 Add Images/Videos    2/10 files    [Post Button]     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ Selected Media (2)                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │ [✕]              │  │ [✕]              │             │
│  │                  │  │                  │             │
│  │  🖼️ Preview       │  │  🎬 Preview       │             │
│  │                  │  │                  │             │
│  │ landscape.jpg    │  │ intro_video.mp4  │             │
│  │ 3.2 MB           │  │ 45.8 MB          │             │
│  │ 🖼️ Image          │  │ 🎬 Video          │             │
│  └──────────────────┘  └──────────────────┘             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### File Selection Process

**Step 1: Click Add Button**
```
📎 Add Images/Videos  → Opens file picker
```

**Step 2: Select Multiple Files**
```
File Picker Dialog:
[Recent] [Desktop] [Pictures]
☑ photo1.jpg (2.1 MB)
☑ photo2.png (3.5 MB)
☐ video.mp4
☐ document.pdf    ← Can't select (wrong type)

[Cancel]  [Open]
```

**Step 3: Preview Appears**
```
Selected Media (2)
├─ photo1.jpg  [2/10]
└─ photo2.png  [3/10]
```

**Step 4: Can Add More**
```
📎 Add Images/Videos  → Opens again, can select 8 more files
```

---

## 3. Media Preview Grid

### Grid Layout (Desktop)

```
┌────────────┬────────────┬────────────┐
│  Image 1   │  Image 2   │  Video 1   │
│ 2.5 MB     │ 3.2 MB     │ 45.8 MB    │
│ 🖼️ Image    │ 🖼️ Image    │ 🎬 Video    │
└────────────┴────────────┴────────────┘
   [Hover: ✕]   [Hover: ✕]   [Hover: ✕]
```

### Grid Layout (Mobile)

```
┌────────────┬────────────┐
│  Image 1   │  Image 2   │
│ 2.5 MB     │ 3.2 MB     │
└────────────┴────────────┘
   [Hover: ✕]   [Hover: ✕]

┌────────────┐
│  Video 1   │
│ 45.8 MB    │
│ 🎬 Video    │
└────────────┘
   [Hover: ✕]
```

### Individual File Card

**Image Preview:**
```
┌─────────────────────────┐
│ [✕]                     │
│                         │
│ ┌──────────────────┐    │
│ │                  │    │
│ │  [Image Preview] │    │
│ │  🖼️ Image         │    │
│ │                  │    │
│ └──────────────────┘    │
│                         │
│ photo_name.jpg          │
│ 3.2 MB                  │
│                         │
└─────────────────────────┘
```

**Video Preview:**
```
┌─────────────────────────┐
│ [✕]                     │
│                         │
│ ┌──────────────────┐    │
│ │    ║►            │    │
│ │  [Purple BG]     │    │
│ │  🎬 Video         │    │
│ │                  │    │
│ └──────────────────┘    │
│                         │
│ intro.mp4               │
│ 45.8 MB                 │
│                         │
└─────────────────────────┘
```

---

## 4. Validation States

### File Count Validation

```
When user selects 11 files:
┌────────────────────────────┐
│ ⚠ Error                    │
│                            │
│ You can upload up to       │
│ 10 files                   │
└────────────────────────────┘

Status: 0/10 files
(11 files rejected)
```

### File Size Validation

```
When user selects 60MB file:
┌────────────────────────────────┐
│ ✕ Error                        │
│                                │
│ large_video.mp4 is too large   │
│ (max 50MB)                     │
└────────────────────────────────┘

Status: 0/10 files
(File rejected)
```

### File Type Validation

```
When user selects .pdf:
┌──────────────────────────────────┐
│ ✕ Error                          │
│                                  │
│ document.pdf is not a valid      │
│ image or video file              │
└──────────────────────────────────┘

Status: 0/10 files
(File rejected)
```

---

## 5. Toast Notifications

### Success Toast
```
┌─────────────────────────────────────┐
│ ✓ Post created successfully!        │ ✕
└─────────────────────────────────────┘
  [Green bar on left, auto-dismiss]
```

### Error Toast
```
┌──────────────────────────────────────┐
│ ✕ photo.png is too large (max 50MB) │ ✕
└──────────────────────────────────────┘
  [Red bar on left, auto-dismiss]
```

### Warning Toast
```
┌──────────────────────────────────────┐
│ ⚠ You can upload up to 10 files     │ ✕
└──────────────────────────────────────┘
  [Orange bar on left, auto-dismiss]
```

---

## 6. Upload Process Flow

```
Start
  ↓
User clicks "Add Images/Videos"
  ↓
File picker opens → User selects files
  ↓
Validation
  ├─ Count < 10? ✓
  ├─ Size < 50MB each? ✓
  └─ Type = image/video? ✓
  ↓
Previews appear ← User sees thumbnails
  ↓
User types content
  ↓
User clicks "Post"
  ↓
Upload phase
  ├─ For each file:
  │  ├─ Upload to server
  │  ├─ Get URL
  │  └─ Store in array
  ↓
Create post with all URLs
  ↓
Success! Toast appears
  ↓
Form clears → Feed refreshes
  ↓
End
```

---

## 7. Responsive Breakpoints

### Desktop (≥992px)
```
┌────────────────────────────────┐
│ Logo              [Notification] [Menu]
│ Full navbar, large components
└────────────────────────────────┘
```

### Tablet (768px - 992px)
```
┌──────────────────────────┐
│ Logo  [Notification]  [☰]
│ Smaller components
└──────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────┐
│ Logo [🔔] [☰]
│ Compact layout
└──────────────────────┘
```

---

## 8. Before & After Comparison

### Notification Button

**Before:**
- Only visible after opening menu
- Required extra tap/click
- Hidden on mobile

**After:**
- Always visible on mobile
- One tap to see notifications
- Better UX for alerts

### Media Upload

**Before:**
- Single file only
- Had to post multiple times for multiple media
- No preview
- Time consuming

**After:**
- Up to 10 files at once
- Instant preview
- File management (remove)
- One post for all media
- Better user experience

---

## 9. Accessibility

### Keyboard Navigation
- Tab through files
- Enter/Space to remove
- Tab to Post button

### Screen Readers
- File count announced
- File names read aloud
- Error messages described

### Color Contrast
- Toast colors meet WCAG standards
- All text readable on background
- Icons with text labels

---

## 10. Error Recovery

```
User Flow with Error:

1. Select files → Size error
   ✕ Toast appears
   
2. User clicks remove (✕) on large file
   File disappears from list
   
3. Select new, smaller file
   Preview appears
   
4. Try again → Success
   ✓ Toast appears
   
5. Post created!
```

---

## Quick Reference

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Notification Button | In menu | Always visible |
| Media Grid | 3-4 items/row | 1-2 items/row |
| File Selection | Multiple | Multiple |
| Max Files | 10 | 10 |
| Max Size | 50MB each | 50MB each |
| Preview | Yes | Yes |
| Toast Notifications | Yes | Yes |

