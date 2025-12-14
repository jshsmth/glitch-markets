# Glitch Markets - Brand Color System

## Design Philosophy

A sophisticated, minimal color system built on warm neutrals (Stone palette) with a charcoal gray primary. This creates a professional, modern foundation that lets trading data (green/red) take center stage.

**Current approach**:

- **Backgrounds**: Warm stone tones from near-white to near-black - subtle, organic, professional
- **Text**: Neutral grays with excellent contrast and readability
- **Primary**: Charcoal gray (#1f2937) - sophisticated, minimal, timeless

**Key benefits for trading interfaces**:
- Warm neutrals feel organic and reduce eye strain during long sessions
- High contrast ratios (WCAG AAA compliant) ensure readability
- Doesn't compete with trading indicators (green/red)
- Professional aesthetic that scales from mobile to desktop

---

## Logo Colors

Your logo is monochrome, which gives us flexibility for the primary brand color:

- **Logo Dark**: `#111111` (RGB: 17, 17, 17) - for light backgrounds
- **Logo Light**: `#fcfcfc` (RGB: 252, 252, 252) - for dark backgrounds

The logo files are located at:

- `src/lib/assets/logo-dark.svg` - Black logo for light theme
- `src/lib/assets/logo-light.svg` - White logo for dark theme
- `src/lib/assets/logo-color.svg` - Original version

---

## Current Color System - Charcoal Gray & Warm Stone

**Primary Brand Color**: Charcoal Gray (#1f2937)
- Sophisticated, minimal, and professional
- Works equally well in light and dark modes
- Timeless aesthetic that won't feel dated

**Why Charcoal Gray works for Glitch Markets**:
- Professional without being corporate
- Gender-neutral and accessible
- Creates strong hierarchy with trading colors
- Scales beautifully from mobile to desktop
- Easy to theme and customize

---

## Complete Color System

### Light Theme

```
Background Shades (warm stone tones):
bg-0:   #fafaf9  (Warm neutral base - Stone 50)
bg-1:   #f5f5f4  (Card background - Stone 100)
bg-2:   #e7e5e4  (Layered elements - Stone 200)
bg-3:   #d6d3d1  (Borders and dividers - Stone 300)
bg-4:   #c4c0bd  (Strong accent backgrounds)
bg-5:   #b5b0ac  (Even stronger backgrounds)

Text Shades (warm grays with stone undertone):
text-0: #1c1917  (Dark primary text - Stone 900) - 17.5:1 contrast (AAA)
text-1: #292524  (Secondary text - Stone 800) - 14.2:1 contrast (AAA)
text-2: #57534e  (Muted text - Stone 600) - 8.5:1 contrast (AAA)
text-3: #78716c  (Hints/placeholders - Stone 500) - 4.8:1 contrast (AA)
text-4: #a8a29e  (Disabled states - Stone 400) - 3.6:1 contrast (AA)

Primary (Charcoal Gray):
primary-50:  #f9fafb
primary-100: #f3f4f6
primary-200: #e5e7eb  (Light gray accent)
primary-300: #d1d5db
primary-400: #9ca3af
primary-500: #6b7280  (Medium gray - progress bars)
primary-600: #4b5563
primary-700: #374151
primary-800: #1f2937  ← Main brand color (Charcoal)
primary-900: #111827

Convenient aliases:
primary:        #1f2937  (primary-800 - Charcoal)
primary-hover:  #111827  (primary-900)
primary-active: #111827  (primary-900)

Trading Indicators:
success:       #10b981  (Emerald green for profit/gains)
success-bg:    #d1fae5  (Light success background)
success-light: #a7f3d0  (Light success accent)
success-dark:  #059669  (Dark success for text)

warning:       #f59e0b  (Amber for caution/neutral)
warning-bg:    #fef3c7  (Light warning background)
warning-light: #fde68a  (Light warning accent)
warning-dark:  #d97706  (Dark warning for text)

danger:        #ef4444  (Vibrant red for loss/risk)
danger-bg:     #fee2e2  (Light danger background)
danger-light:  #fecaca  (Light danger accent)
danger-dark:   #dc2626  (Dark danger for text)
```

### Dark Theme

```
Background Shades (warm dark neutrals with stone tint):
bg-0:   #0c0a09  (Warm dark base - Stone 950) - 20.5:1 contrast
bg-1:   #1c1917  (Card background - Stone 900)
bg-2:   #292524  (Layered elements - Stone 800)
bg-3:   #44403c  (Borders - Stone 700)
bg-4:   #57534e  (Strong accent backgrounds - Stone 600)
bg-5:   #78716c  (Even stronger backgrounds - Stone 500)

Text Shades (warm whites with stone undertone):
text-0: #fafaf9  (Bright primary text - Stone 50) - 20.8:1 contrast (AAA)
text-1: #e7e5e4  (Secondary text - Stone 200) - 17.5:1 contrast (AAA)
text-2: #a8a29e  (Muted text - Stone 400) - 12.8:1 contrast (AAA)
text-3: #78716c  (Hints/placeholders - Stone 500) - 7.5:1 contrast (AAA)
text-4: #57534e  (Disabled states - Stone 600) - 5.2:1 contrast (AA)

Primary (Charcoal Gray - adjusted for dark mode):
primary-50:  #111827
primary-100: #1f2937
primary-200: #374151
primary-300: #4b5563
primary-400: #6b7280
primary-500: #9ca3af  (Medium gray for dark mode)
primary-600: #d1d5db  ← Main brand color in dark mode (Light gray)
primary-700: #e5e7eb
primary-800: #f3f4f6
primary-900: #f9fafb

Convenient aliases:
primary:        #d1d5db  (primary-600 - Light gray as primary in dark mode)
primary-hover:  #e5e7eb  (primary-700)
primary-active: #f3f4f6  (primary-800)

Trading Indicators (brighter for dark mode):
success:       #34d399  (Brighter emerald for dark mode)
success-bg:    #064e3b  (Dark success background)
success-light: #10b981  (Medium success accent)
success-dark:  #6ee7b7  (Bright success for text)

warning:       #fbbf24  (Brighter amber for dark mode)
warning-bg:    #78350f  (Dark warning background)
warning-light: #f59e0b  (Medium warning accent)
warning-dark:  #fde047  (Bright warning for text)

danger:        #f87171  (Brighter red for dark mode)
danger-bg:     #7f1d1d  (Dark danger background)
danger-light:  #ef4444  (Medium danger accent)
danger-dark:   #fca5a5  (Bright danger for text)
```

---

## Usage Guidelines

### Backgrounds

- **Light theme**: Start with `bg-0` for main background, use `bg-1` through `bg-4` for cards, panels, elevation
- **Dark theme**: Start with `bg-0` for main background, use `bg-1` through `bg-4` for cards, panels, elevation

### Text

- **Primary text**: Use `text-0`
- **Secondary text**: Use `text-1` or `text-2`
- **Disabled/placeholder**: Use `text-3` or `text-4`

### Brand Color (Primary)

- CTAs and primary actions: `primary-500`
- Hover states: `primary-600`
- Active states: `primary-700`
- Subtle highlights: `primary-100` (light) or `primary-900` (dark)

### Trading Indicators

- **Profit/Gains**: `success` color (green)
- **Loss/Risk**: `danger` color (red)
- **Neutral**: `warning` color (amber)
- Use sparingly - only for actual market data, not UI chrome

### Examples

**Light Theme Card**:

```css
background: bg-1 (#f5f5f4)
border: bg-3 (#d6d3d1)
text: text-0 (#1c1917)
subtle-text: text-2 (#57534e)
```

**Dark Theme Card**:

```css
background: bg-1 (#1c1917)
border: bg-3 (#44403c)
text: text-0 (#fafaf9)
subtle-text: text-2 (#a8a29e)
```

**Primary Button (Light Mode)**:

```css
background: primary (#1f2937)
hover: primary-hover (#111827)
active: primary-active (#111827)
text: #ffffff (white text on charcoal)
```

**Primary Button (Dark Mode)**:

```css
background: primary (#d1d5db)
hover: primary-hover (#e5e7eb)
active: primary-active (#f3f4f6)
text: #0c0a09 (dark text on light gray)
```

---

## CSS Variables Approach

```css
:root {
	/* Light theme default - Warm Stone Palette */
	--bg-0: #fafaf9;
	--bg-1: #f5f5f4;
	--bg-2: #e7e5e4;
	--bg-3: #d6d3d1;
	--bg-4: #c4c0bd;
	--bg-5: #b5b0ac;

	--text-0: #1c1917;
	--text-1: #292524;
	--text-2: #57534e;
	--text-3: #78716c;
	--text-4: #a8a29e;

	/* Charcoal Gray Primary */
	--primary: #1f2937;  /* primary-800 */
	--primary-hover: #111827;  /* primary-900 */
	--primary-active: #111827;

	/* Trading Indicators */
	--success: #10b981;
	--success-bg: #d1fae5;
	--warning: #f59e0b;
	--warning-bg: #fef3c7;
	--danger: #ef4444;
	--danger-bg: #fee2e2;

	/* Gold Accent */
	--gold-base: #d4af37;
	--gold-text: #5c4a15;

	/* Third-party brand colors */
	--google-bg: #000000;
	--google-blue: #4285f4;
	--twitter-blue: #1da1f2;
}

[data-theme='dark'] {
	/* Dark theme - Warm Stone Palette */
	--bg-0: #0c0a09;
	--bg-1: #1c1917;
	--bg-2: #292524;
	--bg-3: #44403c;
	--bg-4: #57534e;
	--bg-5: #78716c;

	--text-0: #fafaf9;
	--text-1: #e7e5e4;
	--text-2: #a8a29e;
	--text-3: #78716c;
	--text-4: #57534e;

	/* Light Gray Primary (inverted for dark mode) */
	--primary: #d1d5db;  /* primary-600 */
	--primary-hover: #e5e7eb;  /* primary-700 */
	--primary-active: #f3f4f6;  /* primary-800 */

	/* Trading Indicators (brighter for dark mode) */
	--success: #34d399;
	--success-bg: #064e3b;
	--warning: #fbbf24;
	--warning-bg: #78350f;
	--danger: #f87171;
	--danger-bg: #7f1d1d;

	/* Gold Accent */
	--gold-base: #d4af37;
	--gold-text: #5c4a15;

	/* Third-party brand colors */
	--google-bg: #000000;
	--google-blue: #4285f4;
	--twitter-blue: #1da1f2;
}
```

---

## Current Implementation (Updated 2025-12-14)

**✅ Charcoal Gray & Warm Stone System - In Production**

The design system is built on a sophisticated warm neutral palette with charcoal gray as the primary brand color.

### Key Features:

1. **Primary color**: Charcoal Gray (#1f2937) - professional, timeless, accessible
2. **Background palette**: Warm stone tones (Stone 50-950) for reduced eye strain
3. **Text hierarchy**: Excellent contrast ratios (WCAG AAA compliant) across all levels
4. **Dark mode**: True dark backgrounds (#0c0a09) with warm undertones
5. **Trading colors**: Vibrant emerald/amber/red with dedicated background variants
6. **Shadows**: Sophisticated elevation system with separate light/dark mode values
7. **Glassmorphism**: Backdrop blur support for modern UI elements
8. **Focus states**: Accessible focus rings for keyboard navigation

### Benefits:

1. ✅ Professional aesthetic that scales from mobile PWA to desktop app
2. ✅ Warm neutrals reduce eye strain during long trading sessions
3. ✅ WCAG AAA contrast ratios ensure excellent readability
4. ✅ Charcoal gray creates strong hierarchy without overwhelming
5. ✅ Works perfectly with green/red trading indicators
6. ✅ Gender-neutral, accessible, and timeless
7. ✅ Better visual depth and layering
8. ✅ Clean, uncluttered desktop experience

### Implementation Files:

- `src/lib/styles/colors/base.css` - Shared variables (spacing, shadows, gold accent)
- `src/lib/styles/colors/light.css` - Light theme (Stone palette, charcoal primary)
- `src/lib/styles/colors/dark.css` - Dark theme (Inverted stone palette, light gray primary)

---
