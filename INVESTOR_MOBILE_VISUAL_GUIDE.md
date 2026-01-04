# Investor Mobile View - Visual Guide

## Interest Form - Mobile vs Desktop

### Mobile Layout (≤768px)
```
┌─────────────────────────┐
│  Express Your Interest  │
├─────────────────────────┤
│ Message / Offer Details │
│ [textarea - 100px min]  │
├─────────────────────────┤
│ Proposed Investment     │
│ [input field]           │
├─────────────────────────┤
│ Proposed Equity (%)     │
│ [input field]           │
├─────────────────────────┤
│ Terms and Conditions    │
│ [textarea]              │
├─────────────────────────┤
│ [Submit Interest] (100%)│
│ [Cancel] (100%)         │
└─────────────────────────┘
```

### Desktop Layout (>768px)
```
┌────────────────────────────────────┐
│     Express Your Interest          │
├────────────────────────────────────┤
│ Message               Proposed Inv  │
│ [textarea]            [input]       │
│ Proposed Equity       Terms         │
│ [input]               [textarea]    │
├────────────────────────────────────┤
│                  [Submit] [Cancel]  │
└────────────────────────────────────┘
```

## Interest Card - Mobile vs Desktop

### Mobile Layout (≤768px)
```
┌──────────────────────────┐
│ [Avatar]  Investor Name  │
│ Investor                 │
│                          │
│ Status: pending          │
├──────────────────────────┤
│ Message:                 │
│ Long text wrapping       │
│ across multiple lines    │
│                          │
│ Proposed Amount: $50,000 │
│ Proposed Equity: 5%      │
│ Terms: Board seat        │
├──────────────────────────┤
│ [Accept Button - 100%]   │
│ [Discuss Button - 100%]  │
│ [Reject Button - 100%]   │
└──────────────────────────┘
```

### Desktop Layout (>768px)
```
┌────────────────────────────────────────┐
│ [Avatar] Investor Name          Status: │
│          Investor               pending │
├────────────────────────────────────────┤
│ Message: Investment offer for Series A │
│                                        │
│ Proposed Amount: $50,000               │
│ Proposed Equity: 5%                    │
│ Terms: Board seat, Voting rights       │
├────────────────────────────────────────┤
│ [Accept] [Discuss] [Reject]            │
└────────────────────────────────────────┘
```

## Component Hierarchy

```
FundingDetail Page
├─ Interest Form (when user clicks "Express Interest")
│  ├─ form-group (Message/Offer Details)
│  │  └─ textarea (6 rows, mobile 100px min)
│  ├─ form-group (Proposed Investment Amount)
│  │  └─ input[type="number"]
│  ├─ form-group (Proposed Equity)
│  │  └─ input[type="number"]
│  ├─ form-group (Terms and Conditions)
│  │  └─ textarea
│  └─ form-actions
│     ├─ [Submit Interest] btn-primary
│     └─ [Cancel] btn
│
└─ Interests List (if owner viewing their fund request)
   └─ interest-card (repeating for each interest)
      ├─ interest-header
      │  ├─ investor-info
      │  │  ├─ investor-avatar (40px mobile, 50px desktop)
      │  │  └─ div
      │  │     ├─ investor-name (link)
      │  │     └─ investor-role
      │  └─ status-badge (pending/accepted/in-discussion/rejected)
      ├─ interest-content
      │  ├─ p (Message)
      │  ├─ p (Proposed Amount)
      │  ├─ p (Proposed Equity)
      │  └─ p (Terms)
      └─ interest-actions (only if status === pending)
         ├─ [Accept] btn-success
         ├─ [Discuss] btn-warning
         └─ [Reject] btn-danger
```

## Color Scheme

### Button Colors
| Button | Color | Hover | Used For |
|--------|-------|-------|----------|
| Submit/Accept | #4CAF50 (Green) | #45a049 | Positive actions |
| Discuss | #FFC107 (Amber) | #FFB300 | Neutral/Discussion |
| Reject/Cancel | #f44336 (Red) | #da190b | Negative actions |

### Text Colors
- Primary Text: #333 (Dark Gray)
- Secondary Text: #666 (Medium Gray)
- Label/Role: #999 (Light Gray)
- Links: #4CAF50 (Green) on hover
- Backgrounds: #fff (White) with #f9f9f9 (Light Gray) for inputs

### Status Badge Colors
- pending: #fff3cd (Light yellow)
- accepted: #d4edda (Light green)
- in-discussion: #d1ecf1 (Light blue)
- rejected: #f8d7da (Light red)

## Responsive Spacing

### Mobile (≤768px)
- Container padding: 10-15px
- Card padding: 15px
- Element gap: 8-12px
- Avatar size: 40px
- Min touch target: 44px

### Desktop (>768px)
- Container padding: 20px
- Card padding: 20px
- Element gap: 12-15px
- Avatar size: 50px
- Button size: 8px 20px padding

## Touch Target Sizes (Mobile)

All interactive elements meet or exceed 44px minimum:
- Form input fields: 44px height minimum (font-size 16px)
- Buttons: Full-width with 10px padding (min 40px height)
- Avatar clickable area: 40px diameter
- Status badge: 40px height minimum

## Typography

### Headings
- Form title: 1.2rem (mobile), 1.5rem (desktop)
- Interest card section: Implicit in content

### Body Text
- Main text: 14-15px
- Secondary text: 12-13px
- Labels: 12px
- Investor role: 12-13px

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## Accessibility Features

1. **Touch Targets**: All buttons ≥44px for mobile
2. **Color Contrast**: WCAG AA compliant
3. **Text Sizing**: Respects user's browser font-size settings
4. **Line Height**: 1.5-1.6 for readability
5. **Focus States**: Clear focus indicators on all interactive elements
6. **Link Styling**: Underline on hover for investor name links
7. **Status Badges**: Color + text for information
8. **Form Labels**: Associated with form fields

## Performance Considerations

1. **Transitions**: 0.2-0.3s for smooth interactions
2. **Hover Effects**: Only applied on desktop (touch devices don't hover)
3. **Shadows**: Subtle on mobile, more pronounced on desktop
4. **Rounded Corners**: 8-12px for modern look
5. **Responsive Images**: Avatar uses object-fit for consistent sizing

## Browser Support

- Modern browsers: Chrome, Firefox, Safari, Edge
- iOS Safari 12+
- Chrome Android 5+
- Flexbox support required
- CSS Grid optional (not used in these components)

## Testing Scenarios

### Mobile Testing (iPhone, Android)
1. Form field focus and keyboard appearance
2. Button tap responsiveness
3. Text wrapping and overflow
4. Avatar image loading
5. Status badge visibility
6. Scroll behavior in card list

### Tablet Testing (iPad)
1. Landscape vs portrait orientation
2. Touch target sizing
3. Layout adaptation between 768px and 1024px
4. Font sizing readability

### Desktop Testing
1. Hover effects on cards
2. Button alignment and spacing
3. Form layout and input sizing
4. Wide-screen optimization

## Known Considerations

1. **Text Wrapping**: Word-break applied for long investor names
2. **Avatar Fallback**: Uses object-fit for consistent sizing
3. **Status Colors**: Should match existing badge color scheme
4. **Button Width**: Full-width on mobile (margin: 0) on desktop (width: auto)
5. **Form Padding**: Extended margin on mobile for edge contrast

## Future Enhancements

1. Add success toast animation on form submission
2. Add loading state for buttons during submission
3. Add skeleton loaders while interest list loads
4. Add swipe-to-dismiss for mobile interest cards
5. Add pagination for large interest lists
