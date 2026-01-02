# Toast Notifications System

A lightweight, non-intrusive notification system that displays toast messages outside the sidebar on every page for all users.

## Setup

The toast system is already integrated into your app. It consists of:

1. **ToastContext** - Manages toast state globally
2. **Toast Component** - Renders all active toasts
3. **useToast Hook** - Easy access to toast functions
4. **CSS Styling** - Pre-styled toast notifications with animations

## Usage

### Basic Usage in Any Component

```jsx
import useToast from '../hooks/useToast';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  return (
    <div>
      <button onClick={() => showSuccess('Operation completed!')}>
        Show Success
      </button>
      <button onClick={() => showError('Something went wrong!')}>
        Show Error
      </button>
      <button onClick={() => showWarning('Please check this!')}>
        Show Warning
      </button>
      <button onClick={() => showInfo('Here is some info')}>
        Show Info
      </button>
    </div>
  );
}
```

### API Methods

#### `showSuccess(message, duration)`
Display a green success toast
```jsx
showSuccess('Profile updated successfully!', 4000);
```

#### `showError(message, duration)`
Display a red error toast
```jsx
showError('Failed to save changes. Please try again.', 4000);
```

#### `showWarning(message, duration)`
Display an orange warning toast
```jsx
showWarning('This action cannot be undone!', 4000);
```

#### `showInfo(message, duration)`
Display a blue info toast
```jsx
showInfo('New message received', 4000);
```

#### `addToast(message, type, duration)`
Add a custom toast with specific type
```jsx
const { addToast } = useToast();
addToast('Custom message', 'success', 5000);
// type can be: 'success', 'error', 'warning', 'info'
```

#### `removeToast(id)`
Manually remove a specific toast
```jsx
const { removeToast, addToast } = useToast();
const toastId = addToast('Message', 'info', 0); // duration: 0 = never auto-dismiss
removeToast(toastId);
```

### Parameters

- **message** (string, required): The text to display
- **type** (string): Toast type - 'success', 'error', 'warning', 'info' (default: 'info')
- **duration** (number): Auto-dismiss time in milliseconds (default: 4000)
  - Set to 0 for manual dismissal only
  - Set to negative value to never dismiss

## Real-World Examples

### Form Submission
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  const { showSuccess, showError } = useToast();
  
  try {
    await axios.post('/api/profile', data);
    showSuccess('Profile saved successfully!');
    navigate('/dashboard');
  } catch (error) {
    showError(error.response?.data?.message || 'Failed to save profile');
  }
};
```

### API Call with Loading
```jsx
const handleDelete = async (id) => {
  const { showWarning, showSuccess, showError } = useToast();
  
  if (!window.confirm('Are you sure?')) return;
  
  showWarning('Deleting...', 10000); // Long duration
  
  try {
    await axios.delete(`/api/items/${id}`);
    showSuccess('Item deleted successfully!');
  } catch (error) {
    showError('Failed to delete item');
  }
};
```

### Real-time Notifications from Socket
```jsx
useEffect(() => {
  const { showInfo } = useToast();
  
  if (socket) {
    socket.on('newMessage', (message) => {
      showInfo(`New message from ${message.sender.name}`);
    });
    
    return () => socket.off('newMessage');
  }
}, [socket]);
```

## Styling

Toasts appear in the top-right corner of the screen with:
- Smooth slide-in animation
- Color-coded by type
- Manual dismiss button (×)
- Auto-dismisses after duration (default 4 seconds)
- Mobile-responsive (adapts to smaller screens)

### Toast Types & Colors

| Type | Color | Icon |
|------|-------|------|
| success | Green (#4CAF50) | ✓ |
| error | Red (#f44336) | ✕ |
| warning | Orange (#ff9800) | ⚠ |
| info | Blue (#2196F3) | ℹ |

## CSS Classes

You can customize toast styling by overriding these CSS classes:

```css
.toast-container        /* Container holding all toasts */
.toast                  /* Individual toast wrapper */
.toast-success          /* Success toast variant */
.toast-error            /* Error toast variant */
.toast-warning          /* Warning toast variant */
.toast-info             /* Info toast variant */
.toast-icon             /* Icon element */
.toast-message          /* Message text */
.toast-close            /* Close button */
```

## Best Practices

1. **Use appropriate types**: Use `showSuccess` for successful operations, `showError` for failures
2. **Keep messages short**: Keep toast text concise and actionable
3. **Use with loading states**: Show warnings during long operations
4. **Avoid spam**: Don't show multiple toasts for the same action
5. **Accessibility**: Toasts auto-dismiss, provide alternative feedback methods

## Common Patterns

### Form Validation
```jsx
if (!email.includes('@')) {
  showWarning('Please enter a valid email address');
  return;
}
```

### Network Error Handling
```jsx
catch (error) {
  const message = error.response?.data?.message || 'Network error. Please try again.';
  showError(message);
}
```

### Success with Navigation
```jsx
showSuccess('Post created successfully!');
setTimeout(() => navigate('/feed'), 1500);
```

### Confirmation Before Action
```jsx
if (confirm('Delete this item?')) {
  try {
    await api.delete(id);
    showSuccess('Item deleted');
  } catch {
    showError('Failed to delete');
  }
}
```

## Integration Checklist

- ✅ ToastContext created
- ✅ Toast component created
- ✅ Toast styles added to index.css
- ✅ ToastProvider wrapped in main.jsx
- ✅ useToast hook created
- ✅ Available on all pages (global provider)

## Notes

- Toasts are completely independent of the notification dropdown
- Works on all pages and for all users
- No sidebar required - displays in top-right corner
- Animations are smooth and non-blocking
- Mobile-optimized with responsive positioning
