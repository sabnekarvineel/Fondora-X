# Engagement Dashboard - Design Guide

## 🎨 Visual Architecture

### Component Hierarchy
```
Settings Page
    ↓
    └── Engagement Dashboard
            ├── Header (Title + Toggle Buttons)
            ├── Stats Grid
            │   ├── StatCard (Profile Views)
            │   ├── StatCard (Followers)
            │   ├── StatCard (Total Likes)
            │   └── StatCard (Total Comments)
            │
            └── Details Section
                ├── Posts View
                │   ├── Performance Stats Grid
                │   │   ├── Avg Likes Box
                │   │   └── Avg Comments Box
                │   └── Top Posts List
                │
                └── Profile View
                    └── Profile Stats Grid
                        ├── Total Views Box
                        ├── Followers Growth Box
                        ├── View Increase Box
                        └── Current Followers Box
```

## 📐 Layout System

### Desktop Layout (>1200px)
```
┌─────────────────────────────────────────────────────┐
│  📊 Engagement Dashboard    [📝 Posts] [👤 Profile]  │
├─────────────────────────────────────────────────────┤
│  ┌─────────┬─────────┬─────────┬─────────┐           │
│  │ Metric1 │ Metric2 │ Metric3 │ Metric4 │           │
│  └─────────┴─────────┴─────────┴─────────┘           │
│  ┌──────────────────────────────────────┐            │
│  │ Section Header                       │            │
│  ├────────────┬─────────────────────────┤            │
│  │ Box 1      │ Box 2                   │            │
│  └────────────┴─────────────────────────┘            │
│  ┌──────────────────────────────────────┐            │
│  │ Top Post 1        │ Likes  │ Comments │            │
│  │ Top Post 2        │ Likes  │ Comments │            │
│  │ Top Post 3        │ Likes  │ Comments │            │
│  └──────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

### Tablet Layout (768-1199px)
```
┌────────────────────────────────────────┐
│  📊 Engagement Dashboard               │
│  [📝 Posts] [👤 Profile]               │
├────────────────────────────────────────┤
│  ┌──────────────┬──────────────┐       │
│  │   Metric1    │   Metric2    │       │
│  ├──────────────┼──────────────┤       │
│  │   Metric3    │   Metric4    │       │
│  └──────────────┴──────────────┘       │
│  ┌────────────────────────────┐        │
│  │ Box 1      │      Box 2    │        │
│  └────────────────────────────┘        │
│  ┌────────────────────────────┐        │
│  │ Top Post 1                 │        │
│  │ Top Post 2                 │        │
│  └────────────────────────────┘        │
└────────────────────────────────────────┘
```

### Mobile Layout (480-767px)
```
┌──────────────────────┐
│ 📊 Engagement        │
│ [Posts] [Profile]    │
├──────────────────────┤
│  ┌────────────────┐  │
│  │  Metric 1      │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │  Metric 2      │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │  Metric 3      │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │  Metric 4      │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Box 1          │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Top Post 1     │  │
│  └────────────────┘  │
└──────────────────────┘
```

## 🎨 Color Palette

### Primary Colors
```
Green (Primary)      #4CAF50
- Borders, buttons, highlights
- Trusted, growth-oriented feeling

White               #FFFFFF
- Card backgrounds, text on dark

Light Gray          #F8F9FA
- Container background

Dark Gray           #333333
- Primary text color
```

### Gradient Colors (for stat boxes)
```
Purple → Pink       #667eea → #764ba2
- Default stat box

Pink → Red          #f093fb → #f5576c
- Likes (red heart)

Blue → Cyan         #4facfe → #00f2fe
- Comments (blue speech bubble)

Green → Teal        #43e97b → #38f9d7
- Shares (green check)

Orange → Yellow     #fa709a → #fee140
- Views (yellow eye)
```

## 📏 Spacing & Sizing

### Spacing System (8px base)
```
xs: 4px    (1 unit)
sm: 8px    (1 unit)
md: 16px   (2 units)
lg: 20px   (2.5 units)
xl: 24px   (3 units)
xxl: 32px  (4 units)
```

### Stat Cards
```
Desktop:
- Width: minmax(200px, 1fr)
- Height: auto
- Padding: 20px
- Gap: 15px between columns

Tablet:
- Width: minmax(150px, 1fr)  
- Padding: 15px
- Gap: 12px

Mobile:
- Width: 100%
- Padding: 12px
- Gap: 10px
```

### Icons
```
Main Header: 32px
Stat Icons: 32px on desktop, 28px tablet, 24px mobile
Large Numbers: 28px on desktop, 24px tablet, 20px mobile
Small Labels: 12px across all
```

## 🔤 Typography

### Font Sizes
```
Header (h3)          24px / 20px mobile / 18px small
Section (h4)         16px / 14px mobile
Label                12px (uppercase, letter-spacing: 0.5px)
Value                28px / 24px mobile / 20px small
Change Text          12px (font-weight: 500)
Small Text           12px (color: #999)
```

### Font Weights
```
Label:   600 (semi-bold)
Value:   700 (bold)
Change:  500 (medium)
Normal:  400
```

## 🎯 Interactive Elements

### Buttons (Toggle)
```
Default State:
- Background: white
- Border: 2px solid #ddd
- Color: #333
- Padding: 8px 16px
- Border-radius: 4px

Active State:
- Background: #4CAF50
- Border: 2px solid #4CAF50
- Color: white
- Shadow: none

Hover State:
- Border-color: #4CAF50
- Color: #4CAF50 (if not active)
- Cursor: pointer
- Transition: 0.3s
```

### Stat Cards
```
Default State:
- Background: white
- Border-left: 4px solid #4CAF50
- Shadow: 0 2px 8px rgba(0,0,0,0.08)
- Border-radius: 8px

Hover State:
- Shadow: 0 4px 16px rgba(0,0,0,0.12)
- Transform: translateY(-2px)
- Transition: 0.3s

Post Items:
Hover Background: #f8f9fa
Padding adjustment: +10px horizontal
```

### Section Boxes
```
Style:
- Background: white
- Border-radius: 8px
- Shadow: 0 2px 8px rgba(0,0,0,0.08)
- Padding: 20px
- Margin-bottom: 20px
```

## 📊 Gradient Stat Boxes

### Visual Design
```
┌─────────────────────┐
│ ┌─────────────────┐ │
│ │  LABEL TEXT     │ │  Gradient top
│ │    45 LIKES     │ │  Semi-transparent
│ │                 │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘
```

### Gradient Rules
```
Default (Posts):        linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Likes (Red):           linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
Comments (Blue):       linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)
Shares (Green):        linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)
Views (Orange):        linear-gradient(135deg, #fa709a 0%, #fee140 100%)

Direction: 135deg (top-left to bottom-right)
Angle feels dynamic and modern
```

## 🎬 Animations & Transitions

### Transition Timing
```
Default: 0.3s ease
Fast: 0.15s ease
Slow: 0.5s ease
```

### Hover Effects
```
Stat Cards:
- Box-shadow: expand
- Transform: Y -2px
- Duration: 0.3s

Buttons:
- Color/border change
- Duration: 0.3s

Post Items:
- Background change
- Padding adjustment
- Duration: 0.3s
```

### Loading State
```
Text: "Loading engagement data..."
Color: #999
Font-size: 14px
Padding: 40px 20px
Text-align: center
```

## 📱 Mobile-Specific Design

### Touch Targets
```
Minimum size: 48px x 48px
Toggle buttons: 8px (vertical) x 16px (horizontal) padding
Stat card height: auto (allow height expansion)
```

### Text Readability
```
Font sizes increase on mobile for same visual weight
Line height: 1.6 for better readability
Color contrast: WCAG AA compliant
```

### Spacing for Mobile
```
Between elements: 10px (reduced from 15px)
Card padding: 12-15px (reduced from 20px)
Bottom margin: 15px (reduced from 20px)
```

## 🔍 Icon Strategy

### Emojis Used
```
Main: 📊 Engagement Dashboard
Posts: 📝 Posts toggle
Profile: 👤 Profile toggle
Total Posts: 📝
Likes: ❤️
Comments: 💬
Shares: 🔄
Views: 👁️
Followers: 👥
Stats: various (gradient boxes)
```

### Icon Sizing
```
Header emoji: 1em (auto-sizes with text)
Stat card icons: 32px desktop, 28px tablet, 24px mobile
Emoji weight: consistent across all
```

## 📊 Data Visualization

### Stat Card Layout
```
┌─────────────────────────┐
│ [ICON]  LABEL           │
│         VALUE           │
│         CHANGE %        │
└─────────────────────────┘
```

### Top Posts List
```
┌───────────────────────────────────────┐
│ Post Title Preview...   Likes Comments │
│ Post Title Preview...   Likes Comments │
│ Post Title Preview...   Likes Comments │
└───────────────────────────────────────┘
```

### Change Indicator
```
Positive: ↑ Green (#4CAF50)
Negative: ↓ Red (#f44336)
Font-size: 12px
Font-weight: 500
Format: "↑ 18% this month"
```

## 🌐 Responsive Breakpoints Summary

```css
/* Desktop */
@media (min-width: 1200px) {
  Stats grid: 4 columns
  Post stats: 2 columns
  Gap: 15px
}

/* Tablet */
@media (max-width: 768px) {
  Stats grid: flexible
  Post stats: 1-2 columns
  Gap: 10-12px
  Padding: 15px
}

/* Mobile */
@media (max-width: 480px) {
  Stats grid: 1 column
  All sections: full width
  Gap: 8-10px
  Padding: 10-12px
  Font sizes: reduced 10-20%
}
```

## ♿ Accessibility

### Color Contrast
- Text on white: #333 (ratio 12.6:1)
- Text on colored: white (ratio >4.5:1)
- Icons: inherit parent color

### Readable Fonts
- Base font: inherit from parent
- Min font size: 12px
- Line height: 1.6 minimum

### Keyboard Navigation
- Tab through buttons
- Enter to activate
- Focus visible on all interactive elements

## 🎯 Design Philosophy

1. **Modern**: Gradients, smooth transitions, contemporary spacing
2. **Readable**: Clear hierarchy, good contrast, appropriate sizing
3. **Mobile-First**: Optimized for mobile, enhances on desktop
4. **Intuitive**: Clear labels, familiar icons, obvious actions
5. **Performant**: Minimal animations, efficient layouts
6. **Accessible**: WCAG compliant, keyboard navigable

## 🖼️ Visual Examples

### Stat Card Example
```
With Icon + Text + Change Indicator
┌─────────────────────────────────┐
│ 👥   Followers                  │
│       324                        │
│       ↑ 45% this month          │
└─────────────────────────────────┘
```

### Gradient Box Example  
```
┌───────────────────────┐
│ TOTAL LIKES           │  <- Linear gradient
│    342                │     135deg direction
│                       │     Purple to Pink
└───────────────────────┘
```

### Toggle Example
```
[📝 Posts] [👤 Profile]

Active: Green bg, white text, green border
Inactive: White bg, gray text, gray border
Hover: Border changes to green
```

---

**Design System Version**: 1.0  
**Last Updated**: Jan 2026  
**Framework**: React + CSS  
**Responsive**: Yes (Mobile-first)  
**Accessibility**: WCAG AA ✅
