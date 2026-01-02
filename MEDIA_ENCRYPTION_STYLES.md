# Media Encryption - CSS Styling Guide

## CSS Classes Added/Used

The following CSS classes are used for encrypted media display. Add these to your stylesheet if not already present.

### Message Media Container

```css
.message-media-container {
  max-width: 300px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f0f0f0;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### Image Styling

```css
.message-image {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

.message-image:hover {
  opacity: 0.95;
}
```

### Video Player Styling

```css
.message-video {
  width: 100%;
  height: auto;
  max-height: 400px;
  background-color: #000;
  border-radius: 8px;
}

/* Video player controls */
.message-video::-webkit-media-controls-panel {
  background-color: rgba(0, 0, 0, 0.7);
}

.message-video::-webkit-media-controls-play-button {
  color: white;
}

.message-video::-webkit-media-controls-time-display {
  color: white;
}
```

### Media Loading State

```css
.media-loading {
  min-height: 200px;
  min-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
  color: #999;
  font-size: 14px;
  padding: 16px;
  text-align: center;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### Encryption Badge

```css
.encrypted-icon {
  font-size: 12px;
  margin-left: 6px;
  display: inline-block;
  opacity: 0.8;
}

/* Alternative: Show as badge */
.message.encrypted .encrypted-icon::after {
  content: ' End-to-end encrypted';
  font-size: 11px;
  opacity: 0.7;
  margin-left: 4px;
}
```

### Message Preview (Optional)

```css
.message-preview-thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
}

.message-preview-thumbnail:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}
```

## Complete Integration Example

Add this to your existing `index.css` or chat styles:

```css
/* ===== ENCRYPTED MEDIA STYLES ===== */

.message-media-container {
  max-width: 300px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f5f5f5;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.message-media-container:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message-image {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  display: block;
  background-color: #f0f0f0;
}

.message-image:hover {
  opacity: 0.95;
  cursor: pointer;
}

.message-video {
  width: 100%;
  height: auto;
  max-height: 400px;
  background-color: #1a1a1a;
  border-radius: 8px;
  outline: none;
}

.message-video:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.media-loading {
  min-height: 200px;
  min-width: 200px;
  max-width: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    90deg,
    #e8e8e8 0%,
    #f5f5f5 50%,
    #e8e8e8 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
  color: #999;
  font-size: 14px;
  padding: 16px;
  text-align: center;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.message.sent .message-media-container {
  /* Sent messages styling */
}

.message.received .message-media-container {
  /* Received messages styling */
}

/* ===== ENCRYPTION INDICATOR ===== */

.encrypted-icon {
  font-size: 12px;
  margin-left: 6px;
  display: inline-block;
  opacity: 0.7;
  vertical-align: middle;
  transition: opacity 0.2s ease;
}

.message:hover .encrypted-icon {
  opacity: 1;
}

/* ===== RESPONSIVE ===== */

@media (max-width: 768px) {
  .message-media-container {
    max-width: 250px;
  }

  .message-image,
  .message-video {
    max-height: 300px;
  }

  .media-loading {
    min-height: 150px;
    min-width: 150px;
  }
}

@media (max-width: 480px) {
  .message-media-container {
    max-width: 90vw;
    margin-left: auto;
    margin-right: auto;
  }

  .message-image,
  .message-video {
    max-height: 250px;
  }
}

/* ===== ACCESSIBILITY ===== */

@media (prefers-reduced-motion: reduce) {
  .media-loading {
    animation: none;
    background: #f0f0f0;
  }

  .message-preview-thumbnail {
    transition: none;
  }
}

@media (prefers-color-scheme: dark) {
  .message-media-container {
    background-color: #2a2a2a;
  }

  .media-loading {
    background: linear-gradient(
      90deg,
      #3a3a3a 0%,
      #4a4a4a 50%,
      #3a3a3a 100%
    );
    color: #666;
  }

  .message-video {
    background-color: #000;
  }
}
```

## Responsive Design

### Desktop (> 768px)
```css
.message-media-container {
  max-width: 300px;
}
```

### Tablet (481px - 768px)
```css
.message-media-container {
  max-width: 250px;
}
```

### Mobile (< 480px)
```css
.message-media-container {
  max-width: 90vw;
}
```

## Dark Mode Support

```css
@media (prefers-color-scheme: dark) {
  .message-media-container {
    background-color: #2a2a2a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .media-loading {
    background: linear-gradient(
      90deg,
      #333 0%,
      #444 50%,
      #333 100%
    );
    color: #777;
  }

  .message-video {
    background-color: #000;
  }
}
```

## Animation Alternatives

### Pulse Loading (Alternative)
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.media-loading {
  animation: pulse 1.5s ease-in-out infinite;
}
```

### Fade Loading (Simpler)
```css
@keyframes fade {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

.media-loading {
  animation: fade 1.5s ease-in-out infinite;
}
```

## Accessibility Considerations

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .media-loading {
    animation: none;
    background: #f0f0f0;
  }
}
```

### High Contrast
```css
@media (prefers-contrast: more) {
  .message-media-container {
    border: 2px solid #333;
  }

  .media-loading {
    border: 2px dashed #666;
  }
}
```

### Focus Visible
```css
.message-image:focus-visible {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.message-video:focus-visible {
  outline: 3px solid #007bff;
  outline-offset: 3px;
}
```

## Video Player Controls Styling

### Chrome/Safari
```css
.message-video::-webkit-media-controls-panel {
  background-color: rgba(0, 0, 0, 0.7);
}

.message-video::-webkit-media-controls-play-button {
  background-color: white;
  border-radius: 50%;
}
```

### Firefox
```css
.message-video::-moz-media-controls {
  background-color: rgba(0, 0, 0, 0.8);
}
```

## Example Integration

In your chat component:

```jsx
{message.messageType === 'image' && message.encryptedMediaUrl && (
  <div className="message-media-container">
    {decryptedMediaUrls[message._id] ? (
      <img 
        src={decryptedMediaUrls[message._id]} 
        alt="Encrypted message" 
        className="message-image"
        loading="lazy"
      />
    ) : (
      <div className="media-loading">Loading encrypted media...</div>
    )}
  </div>
)}

{message.messageType === 'video' && message.encryptedMediaUrl && (
  <div className="message-media-container">
    {decryptedMediaUrls[message._id] ? (
      <video 
        controls 
        className="message-video"
        preload="metadata"
      >
        <source 
          src={decryptedMediaUrls[message._id]} 
          type={message.mediaMimeType} 
        />
        Your browser does not support the video tag.
      </video>
    ) : (
      <div className="media-loading">Loading encrypted video...</div>
    )}
  </div>
)}
```

## Testing Styles

### Light Theme
- Media containers should have subtle shadow
- Loading animation should be smooth
- Images should fit within max-width

### Dark Theme
- Containers should blend with dark background
- Video player should be visible
- Text contrast should meet WCAG AA

### Mobile
- Media should not overflow screen
- Touch targets should be adequate
- Video controls should be accessible

## Performance Tips

1. **Lazy Loading**
   ```jsx
   <img ... loading="lazy" />
   ```

2. **Preload Video Metadata**
   ```jsx
   <video ... preload="metadata" />
   ```

3. **Optimize Images**
   - Compress before upload
   - Use WebP format if supported

4. **CSS Optimization**
   - Use CSS instead of JS animations
   - Minimize media queries
   - Cache styles

## Troubleshooting Styles

### Media Not Showing
- Check z-index of parent containers
- Verify media-loading div is being shown
- Check network tab for failed loads

### Video Controls Not Showing
- Different browsers style differently
- Test in multiple browsers
- Use HTML5 video attributes

### Layout Breaking
- Check max-width constraints
- Verify responsive breakpoints
- Test on actual devices
