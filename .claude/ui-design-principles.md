# UI Design Principles

A practical guide to creating clean, accessible, and user-friendly interfaces based on logic-driven design rules.

---

## Core Philosophy

Good UI design isn't magic — it's mostly logic. Design becomes 10x easier when you stop guessing and start applying a system. Spacing, contrast, alignment, type scale, and hierarchy can all be learned and systematized.

---

## 14 Essential UI Design Guidelines

### 1. Space Elements Based on Relatedness

**Principle**: The amount of spacing between interface elements should depend on how closely related they are.

**Guidelines**:

- More closely related elements should be closer together
- Use a predefined spacing scale to make decisions faster (e.g., 8pt, 16pt, 24pt, 32pt, 48pt, 80pt)
- Don't use only small spacing values — vary spacing to create clear grouping and separation

**Example**:

```
XS: 8pt   - Tightly related items (icon + label)
S: 16pt   - Related items within a section
M: 24pt   - Sections within a group
L: 32pt   - Different groups
XL: 48pt  - Major sections
XXL: 80pt - Completely separate areas
```

---

### 2. Ensure 3:1 Contrast Ratio for UI Elements

**Principle**: User interface elements (form fields, icons, buttons) need sufficient contrast for visibility.

**Guidelines**:

- Meet WCAG 2.1 level AA requirements
- Aim for at least 3:1 contrast ratio for UI elements
- Test with people with vision impairments in mind

**Applies to**: Icons, buttons, form fields, borders, interactive elements

---

### 3. Use a Single Primary Button

**Principle**: Highlight the most important action to guide users on what to do next.

**Button Hierarchy**:

1. **Primary** - Most important action (filled/high emphasis)
2. **Secondary** - Alternative actions (outlined/medium emphasis)
3. **Tertiary** - Least important actions (text only/low emphasis)

**Best Practice**: Only one primary button per section to avoid confusion

---

### 4. Sufficient Target Sizes

**Principle**: Small targets are difficult to click/touch, especially for users with impaired motor control or one-handed mobile use.

**Guidelines**:

- Minimum size: **48pt × 48pt** (exceeds WCAG's 44pt × 44pt)
- Frequently used buttons: Make even larger for efficiency
- Button separation: At least **8pt** between buttons to prevent mis-taps

---

### 5. Make Important Content Visible

**Principle**: People don't use what they can't see.

**Guidelines**:

- Don't hide important content behind menus unless necessary
- If space allows, show important content and actions when needed
- Balance minimalism with discoverability

**Risk**: Hidden features may be missed entirely by users

---

### 6. Decrease Letter Spacing for Large Text

**Principle**: Tighter letter spacing improves readability and aesthetics for headings.

**Guidelines**:

- Decrease letter spacing more as text size increases
- Amount depends on typeface and size
- Makes large headings look more polished and professional

**CSS Example**:

```css
h1 {
	letter-spacing: -0.02em;
}
h2 {
	letter-spacing: -0.01em;
}
```

---

### 7. Don't Rely on Color Alone

**Principle**: Color blindness and low vision users may not perceive color-based indicators.

**Guidelines**:

- Use additional visual cues (icons, text labels, patterns, borders)
- Don't use only color to distinguish states or categories
- Combine color with shape, position, or text

**Example**: Don't use only green/red for success/error — add checkmark/X icons

---

### 8. Minimize Different Alignments

**Principle**: Multiple alignments create visual complexity and force eyes to work harder.

**Guidelines**:

- Use as few alignments as possible (ideally 1-2)
- Stick to left, center, or right — don't mix unnecessarily
- Consistent alignment creates visual calm

---

### 9. Ensure 4.5:1 Text Contrast

**Principle**: Small text needs higher contrast for readability.

**Guidelines**:

- Text 18px and smaller: **4.5:1** contrast ratio (WCAG AA)
- Text larger than 18px: **3:1** contrast ratio acceptable
- Body text and small labels need highest contrast

**Testing**: Use browser DevTools or contrast checker tools

---

### 10. Remove Unnecessary Containers

**Principle**: Containers add visual weight — use them sparingly.

**Alternatives to Containers**:

- Move related elements close together (proximity)
- Make elements look similar (similarity)
- Align elements (alignment)
- Use subtle dividers or whitespace

**Result**: Cleaner, less cluttered interfaces

---

### 11. Use Regular and Bold Font Weights Only

**Principle**: Too many font weights add noise and make consistency difficult.

**Guidelines**:

- Stick to **regular** and **bold** (or semi-bold if bold is too heavy)
- Limit font weights to create visual hierarchy without clutter
- Simplifies design system and improves consistency

**Exception**: Display typefaces may use additional weights for specific branding

---

### 12. Be Consistent

**Principle**: Similar elements should look and work in similar ways.

**Consistency Areas**:

- Border radius (all rounded or all sharp)
- Button styles (same height, padding, border radius)
- Icon styles (same visual weight, style)
- Spacing scale (use predefined values)
- Color usage (same color for same meaning)

**Impact**: Creates a cohesive visual language and improves learnability

---

### 13. Don't Confuse Minimalism with Simplicity

**Principle**: Removing too much harms usability — clarity beats minimalism.

**Guidelines**:

- Don't hide crucial information for aesthetics
- Add text labels to icons, especially in navigation
- Provide enough context for users to understand actions
- Consider screen reader users who need text descriptions

**Example**: Bottom navigation needs both icons AND text labels for clarity

---

### 14. Balance Icon and Text Pairs

**Principle**: Icons and text should have similar visual prominence.

**Guidelines**:

- Match visual weight of icons and text
- If icons are bold, make text bold or darker
- Ensure text has sufficient contrast (4.5:1)
- Size should be proportional

**Example**:

```
❌ Light icon + light text = imbalanced
✅ Bold icon + dark text = balanced
```

---

## Application to Glitch Markets

### Spacing System

Use the existing CSS variable system with consistent spacing:

```css
--spacing-xs: 0.5rem; /* 8px */
--spacing-sm: 1rem; /* 16px */
--spacing-md: 1.5rem; /* 24px */
--spacing-lg: 2rem; /* 32px */
--spacing-xl: 3rem; /* 48px */
--spacing-2xl: 5rem; /* 80px */
```

### Button Hierarchy

- Primary: Market action buttons (Buy, Sell, Trade)
- Secondary: Filter, Sort, View options
- Tertiary: Less important actions like Share, More Info

### Accessibility Checklist

- [ ] UI elements: 3:1 contrast
- [ ] Text 18px and under: 4.5:1 contrast
- [ ] Buttons: 48pt × 48pt minimum
- [ ] Icons: Include text labels or ARIA labels
- [ ] Color: Never sole indicator of state

### Typography

- Use regular and bold weights only
- Decrease letter spacing on large headings
- Ensure 4.5:1 contrast on body text
- Use system font for performance

### Visual Consistency

- Consistent border radius across components
- Limited alignment variations
- Remove unnecessary containers/borders
- Balance icon/text pairs in navigation

---

## Quick Reference Checklist

Before finalizing any design:

- [ ] Spacing reflects element relationships
- [ ] 3:1 contrast on all UI elements
- [ ] 4.5:1 contrast on text ≤18px
- [ ] Buttons are 48pt × 48pt minimum
- [ ] Important content is visible
- [ ] Large text has tighter letter spacing
- [ ] Color not sole indicator of meaning
- [ ] Minimal alignment variations
- [ ] Only one primary button per section
- [ ] Unnecessary containers removed
- [ ] Only regular/bold font weights used
- [ ] Visual consistency maintained
- [ ] Text labels on navigation icons
- [ ] Icon/text pairs balanced

---

## Resources

- WCAG 2.1 Level AA: https://www.w3.org/WAI/WCAG21/quickref/
- Contrast Checker: https://webaim.org/resources/contrastchecker/
- practical-ui.com: Source of these guidelines

---

_Remember: UI design is mostly logic. Apply these systematic rules to create interfaces that are both beautiful and functional._
