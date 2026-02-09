# Fondora-X Design System & Color Palette

## Overview
Fondora-X uses a modern, professional design system with a vibrant gradient background and clean, organized component styling. The palette combines tech-forward colors with a focus on usability and visual hierarchy.

---

## 🎨 Core Color Palette

### Primary Gradient Background
- **Gradient**: Linear gradient (90deg) from **#3ec6c4** (Teal) to **#efdc63** (Golden Yellow)
- **Application**: Full page background, creates a modern, energetic feel
- **Used In**: Body background, root element background

### Primary Brand Colors
| Color | Hex Code | Purpose | Used In |
|-------|----------|---------|---------|
| **Teal** | `#0F766E` | Primary dark accent | Navbar, brand colors, important elements |
| **Green** | `#4CAF50` | Success/Positive actions | Buttons, links, badges, primary CTAs |
| **Blue** | `#0A66C2` | Secondary actions | Send buttons, chat input focus, secondary buttons |
| **Orange** | `#ff9800` | Warnings/Stages | Funding stages, alerts, emphasis |
| **Red** | `#f44336` | Errors/Delete actions | Error messages, delete buttons, danger states |

### Neutral Colors
| Color | Hex Code | Purpose |
|-------|----------|---------|
| **White** | `#ffffff` | Cards, containers, backgrounds |
| **Light Gray** | `#f9f9f9` | Secondary backgrounds, subtle emphasis |
| **Lighter Gray** | `#f0f0f0` | Hover states, borders |
| **Medium Gray** | `#ddd` | Borders, dividers |
| **Dark Gray** | `#666` | Secondary text |
| **Darker Gray** | `#555` | Labels |
| **Near Black** | `#333` | Primary text, headings |
| **Black** | `#000` | Text accents |

### Dark Mode Colors (Chat/Messaging)
| Color | Hex Code | Purpose |
|-------|----------|---------|
| **Dark BG** | `#1a1a1a` | Chat input, form backgrounds |
| **Darker BG** | `#2a2a2a` | Message containers, secondary elements |
| **Dark Border** | `#333` | Dark mode borders |
| **Light Text** | `#fff` | Text on dark backgrounds |
| **Muted Text** | `#aaa` | Secondary text on dark |

---

## 📱 Component Styling Guide

### NAVBAR
**Background**: `#0F766E` (Teal)
**Text Color**: `#ffffff` (White)
**Structure**:
```css
.navbar {
    background-color: #0F766E;
    padding: 10px 0;
    position: sticky;
    top: 0;
    z-index: 1000;
}
```
- **Logo**: White text, 22px font size, font-weight: 600
- **Menu Items**: White text with hover effects (rgba(255,255,255,0.1) background)
- **Back Button**: Transparent with white border, hover effect with slight background
- **Notification Badge**: `#f44336` (Red) background with white text

### POST CARDS
**Background**: `#ffffff` (White)
**Border Radius**: 8px
**Box Shadow**: `0 2px 10px rgba(0, 0, 0, 0.1)`
**Padding**: 20px
**Structure**:
```css
.post-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
```
- **Author Name**: `#333` (Dark gray), font-size: 16px, font-weight: bold
- **Author Role**: `#666` (Medium gray), font-size: 12px, capitalized
- **Timestamp**: `#999` (Light gray), font-size: 12px
- **Content Text**: `#333`, line-height: 1.6
- **Media**: Max-height: 500px, border-radius: 8px

#### Post Interactions Button Style
```css
.interaction-btn {
    background: transparent;
    border: none;
    color: #333;
    padding: 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s;
}

.interaction-btn.active {
    color: #0A66C2;
    background: rgba(10, 102, 194, 0.1);
}
```

### FUNDING CARDS
**Background**: `#f8f9fa` (Very light gray)
**Border**: 2px solid `#2196F3` (Blue - different from primary blue)
**Border Radius**: 8px
**Box Shadow**: `0 2px 8px rgba(33, 150, 243, 0.1)`
**Padding**: 15px
**Hover Effect**: 
- Box Shadow: `0 4px 12px rgba(33, 150, 243, 0.2)`
- Transform: `translateY(-2px)`

**Structure**:
```css
.funding-card {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    border: 2px solid #2196F3;
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
}
```

#### Funding Card Elements
- **Title**: `#333`, font-size: 20px, font-weight: 600
- **Description**: `#666`, line-height: 1.6, max 3 lines with ellipsis
- **Funding Stage Badge**: Orange (`#ff9800`) background, white text, 13px font
- **Details Background**: `#f9f9f9`, padding: 15px, border-radius: 8px

### STAT CARDS
**Background**: `#ffffff` (White)
**Border Radius**: 8px
**Box Shadow**: `0 2px 10px rgba(0, 0, 0, 0.1)`
**Padding**: 25px
**Text Align**: Center

**Structure**:
```css
.stat-card {
    background: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.stat-card h3 {
    font-size: 32px;
    margin: 0 0 10px 0;
    color: #4CAF50;
}

.stat-card p {
    margin: 0;
    color: #666;
    font-size: 14px;
}
```

### DASHBOARD CARDS
**Background**: `#f9f9f9` (Light gray)
**Border Left**: 3px solid `#4CAF50` (Green - accent)
**Border Radius**: 6px
**Padding**: 20px
**Box Shadow**: Subtle
**Hover Effect**: 
- Background: `#f0f0f0`
- Transform: `translateX(3px)`

**Structure**:
```css
.dashboard-card {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 6px;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s;
    border-left: 3px solid #4CAF50;
}

.dashboard-card:hover {
    background: #f0f0f0;
    transform: translateX(3px);
}
```

### CREATE POST CARD
**Background**: `#ffffff` (White)
**Border Radius**: 8px
**Box Shadow**: `0 2px 10px rgba(0, 0, 0, 0.1)`
**Padding**: 20px
**Margin Bottom**: 20px

- **Textarea**: White background, `#333` text
- **File Input Label**: `#4CAF50` (Green), font-weight: 500, cursor: pointer

---

## 🔘 BUTTON STYLES

### Primary Button
```css
.btn {
    width: 100%;
    padding: 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 18px;
    cursor: pointer;
    font-weight: 700;
    margin-top: 15px;
    transition: all 0.3s ease;
}

.btn:hover {
    background-color: #45a049;
}

.btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}
```
- **Base**: Green (`#4CAF50`)
- **Hover**: Darker green (`#45a049`)
- **Disabled**: Light gray (`#cccccc`)

### Secondary Button (Chat/Messages)
```css
.send-btn {
    padding: 10px 24px;
    background: #0A66C2;
    color: #fff;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    font-weight: 500;
}

.send-btn:hover {
    background: #084fa1;
}
```

### Small Buttons
**Padding**: 8px 14px
**Font Size**: 12-14px
**Border Radius**: 4-6px

---

## 📝 FORM ELEMENTS

### Input Fields
```css
.form-group input,
.form-group select {
    width: 100%;
    padding: 14px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #4CAF50;
}
```
- **Border**: 1px solid `#ddd`
- **Focus Border**: `#4CAF50` (Green)
- **Padding**: 14px
- **Border Radius**: 6px

### Form Labels
```css
.form-group label {
    display: block;
    margin-bottom: 10px;
    color: #555;
    font-weight: 600;
    font-size: 16px;
}
```
- **Color**: `#555` (Dark gray)
- **Font Weight**: 600

### Chat Input
```css
.chat-input {
    flex: 1;
    padding: 12px 15px;
    border: 1px solid #333;
    border-radius: 25px;
    font-size: 14px;
    background: #2a2a2a;
    color: #fff;
}

.chat-input:focus {
    outline: none;
    border-color: #0A66C2;
}

.chat-input::placeholder {
    color: #666;
}
```

---

## 💬 MESSAGE & ALERT STYLES

### Error Message
```css
.error-message {
    background-color: #f44336;
    color: white;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 15px;
    text-align: center;
}
```
- **Background**: Red (`#f44336`)
- **Text**: White

### Success Message
```css
.success-message {
    background-color: #4CAF50;
    color: white;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 15px;
    text-align: center;
}
```
- **Background**: Green (`#4CAF50`)
- **Text**: White

---

## 🔐 AUTH CONTAINER

```css
.auth-container {
    max-width: 600px;
    width: 600px;
    height: 600px;
    margin: auto;
    padding: 60px 40px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
}

.auth-logo h1 {
    margin: 0;
    color: #0F766E;
    font-size: 40px;
    margin-bottom: 10px;
    font-weight: 700;
}
```
- **Background**: White (`#ffffff`)
- **Border Radius**: 12px
- **Box Shadow**: Strong (0 8px 30px rgba(0,0,0,0.25))
- **Logo Color**: Teal (`#0F766E`)

---

## 📊 NOTIFICATION SYSTEM

### Notification Bell Badge
```css
.notification-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: #f44336;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}
```
- **Background**: Red (`#f44336`)

### Notification Menu
```css
.notification-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 10px;
    width: 380px;
    max-height: 500px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1000;
}
```
- **Background**: White
- **Border Radius**: 8px
- **Box Shadow**: Subtle

### Unread Notification
```css
.notification-item.unread {
    background: #e8f5e9;
}
```
- **Background**: Light green tint

---

## 🎯 COMMENT & REPLY SECTIONS

### Comment Container
```css
.comment {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
}
```
- **Padding**: 12px vertical
- **Border**: 1px solid `#f0f0f0`

### Comment Author Photo
```css
.comment-author-photo {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}
```

---

## 🏷️ TAGS & BADGES

### Card Tag (Dashboard)
```css
.card-tag {
    display: inline-block;
    background: #4CAF50;
    color: white;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
}
```
- **Background**: Green (`#4CAF50`)
- **Border Radius**: 12px (pill-shaped)

### Funding Stage Tag
```css
.funding-stage {
    background: #ff9800;
    color: white;
    font-size: 13px;
    padding: 4px 12px;
    border-radius: 12px;
    text-transform: capitalize;
}
```
- **Background**: Orange (`#ff9800`)

---

## 🔤 TYPOGRAPHY

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
```
System fonts for optimal readability and performance.

### Font Sizes
| Element | Size | Weight |
|---------|------|--------|
| Page Title | 40px | 700 |
| Auth Logo | 40px | 700 |
| Card Heading (H3) | 20px | 600 |
| Stat Card Large | 32px | Bold |
| Label | 16px | 600 |
| Regular Text | 16px | 400 |
| Secondary | 14px | 400 |
| Small Text | 12px | 400 |
| Extra Small | 11px | 400 |

---

## 🌓 DARK MODE (Chat Pages)

### Background Colors
- **Primary BG**: `#1a1a1a`
- **Secondary BG**: `#2a2a2a`
- **Tertiary BG**: `#333`

### Text Colors
- **Primary Text**: `#fff` (White)
- **Secondary Text**: `#aaa` (Light gray)
- **Muted Text**: `#666` (Medium gray)

### Accent Colors
- **Focus Color**: `#0A66C2` (Blue)
- **Accent**: `#0A66C2`

---

## ✨ SPECIAL EFFECTS & ANIMATIONS

### Box Shadow Hierarchy
| Level | Shadow |
|-------|--------|
| Subtle | `0 2px 10px rgba(0, 0, 0, 0.1)` |
| Medium | `0 4px 12px rgba(33, 150, 243, 0.2)` |
| Strong | `0 8px 30px rgba(0, 0, 0, 0.25)` |
| Dark Soft | `0 2px 8px rgba(0, 0, 0, 0.5)` |

### Hover Effects
- **Lift**: `translateY(-2px)` or `translateX(3px)`
- **Scale**: Slight increase in shadow
- **Background Shift**: Subtle color change
- **Duration**: 0.3s ease

### Typing Indicator
```css
@keyframes typing {
    0%, 60%, 100% {
        transform: translateY(0);
    }
    30% {
        transform: translateY(-10px);
    }
}
```

---

## 📐 Spacing & Layout

### Standard Padding/Margins
- **Containers**: 20px, 25px
- **Cards**: 15px, 20px
- **Small Gaps**: 8px, 10px
- **Medium Gaps**: 15px, 20px
- **Large Gaps**: 30px

### Border Radius Scale
- **Sharp**: 4px
- **Soft**: 6px
- **Rounded**: 8px
- **Pill**: 12px, 20px, 25px

---

## 📱 Responsive Design

### Breakpoint Considerations
- **Mobile Cards**: Padding reduced to 12px
- **Text Scaling**: Smaller font sizes on mobile (11px-14px)
- **Button Sizing**: Adjusted padding and font size
- **Container Padding**: 10px on mobile vs 20px on desktop

---

## Summary Table

| Component | Background | Border/Accent | Text Color | Shadow |
|-----------|-----------|---------------|-----------|---------|
| Navbar | `#0F766E` | - | White | Default |
| Post Card | White | None | `#333` | Subtle |
| Funding Card | `#f8f9fa` | `#2196F3` | `#333` | Subtle Blue |
| Stat Card | White | None | `#333`/`#4CAF50` | Subtle |
| Dashboard Card | `#f9f9f9` | `#4CAF50` Left | `#333` | Subtle |
| Primary Button | `#4CAF50` | None | White | None |
| Chat/Messages | `#2a2a2a` | `#333` | White | Dark |
| Auth Form | White | `#ddd` | `#333` | Strong |

This design system creates a clean, modern, professional interface with good accessibility and visual hierarchy. The combination of green accents for primary actions, blue for secondary, and the vibrant gradient background creates an energetic yet professional appearance suitable for a professional networking and funding platform.
