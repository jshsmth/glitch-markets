# Glitch Markets - Brand Color System

## Design Philosophy

Following Google's approach: Create a palette of brand color shades from light to dark, almost white to almost black, all with a subtle brand tint. This creates an "almost unnoticeable but present brand feeling" throughout the interface.

**Key benefit for trading interfaces**: Works especially well where positive/negative colors (green/red) dominate, allowing brand presence without jarring conflicts.

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

## Primary Color Options

Based on the "infinite money glitch" concept, here are three recommended directions:

### Option 1: Electric Cyan (Recommended)

**Why**: Evokes "glitch" aesthetic, tech/digital feel, stands out in trading interfaces

- **Primary**: `#00d9ff` - Electric cyan (glitch/matrix aesthetic)
- **Concept**: Digital, futuristic, "money printer" vibes

### Option 2: Neon Green

**Why**: "Money" association, high energy, prediction market success

- **Primary**: `#00ff88` - Neon green (money/success)
- **Concept**: Profit, growth, winning trades

### Option 3: Purple/Violet

**Why**: Premium feel, stands out from typical finance apps (blue/green)

- **Primary**: `#8b5cf6` - Purple (premium/exclusive)
- **Concept**: Sophisticated, unique, exclusive alpha

---

## Complete Color System (Option 1 - Electric Cyan)

### Light Theme

```
Background Shades (cyan-tinted whites):
bg-0:   #fcfeff  (almost white with tiny cyan tint)
bg-1:   #f8fcfd
bg-2:   #f0f9fb
bg-3:   #e8f6f9
bg-4:   #d8f0f5

Text Shades (cyan-tinted blacks):
text-0: #111314  (almost black with tiny cyan tint)
text-1: #1a1e1f
text-2: #2a3133
text-3: #3a4447
text-4: #5a6c70

Primary (Brand Cyan):
primary-50:  #e6f9ff
primary-100: #ccf3ff
primary-200: #99e7ff
primary-300: #66dbff
primary-400: #33cfff
primary-500: #00d9ff  ← Main brand color
primary-600: #00aed9
primary-700: #0083a3
primary-800: #00586d
primary-900: #002d36

Accent Colors (for trading):
success:  #00ff88  (profit/gains)
warning:  #ffb800  (caution/neutral)
danger:   #ff3366  (loss/risk)
```

### Dark Theme

```
Background Shades (cyan-tinted blacks):
bg-0:   #0d1214  (almost black with tiny cyan tint)
bg-1:   #131719
bg-2:   #1a2023
bg-3:   #212a2e
bg-4:   #2a3539

Text Shades (cyan-tinted whites):
text-0: #fcfeff  (almost white with tiny cyan tint)
text-1: #f0f7f9
text-2: #d8eef3
text-3: #c0e5ed
text-4: #a8dce7

Primary (Brand Cyan):
primary-50:  #002d36
primary-100: #00586d
primary-200: #0083a3
primary-300: #00aed9
primary-400: #00c4f0
primary-500: #00d9ff  ← Main brand color
primary-600: #33dfff
primary-700: #66e5ff
primary-800: #99ebff
primary-900: #ccf3ff

Accent Colors (for trading):
success:  #00ff88  (profit/gains - slightly brighter for dark)
warning:  #ffc233  (caution/neutral)
danger:   #ff4477  (loss/risk - slightly brighter for dark)
```

---

## Alternative Color Systems

### Option 2: Neon Green System

**Light Theme Primary**:

- primary-500: `#00ff88`
- Backgrounds tinted with subtle green
- Text with subtle green undertone

**Dark Theme Primary**:

- primary-500: `#00ff88`
- Backgrounds: near-black with green tint
- Text: near-white with green tint

### Option 3: Purple System

**Light Theme Primary**:

- primary-500: `#8b5cf6`
- Backgrounds tinted with subtle purple
- Text with subtle purple undertone

**Dark Theme Primary**:

- primary-500: `#a78bfa` (slightly brighter for dark theme)
- Backgrounds: near-black with purple tint
- Text: near-white with purple tint

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
background: bg-1 (#f8fcfd)
border: bg-4 (#d8f0f5)
text: text-0 (#111314)
subtle-text: text-2 (#2a3133)
```

**Dark Theme Card**:

```css
background: bg-1 (#131719)
border: bg-4 (#2a3539)
text: text-0 (#fcfeff)
subtle-text: text-2 (#d8eef3)
```

**Primary Button**:

```css
background: primary-500 (#00d9ff)
hover: primary-600 (#00aed9)
active: primary-700 (#0083a3)
text: #111111 (dark logo color for contrast)
```

---

## CSS Variables Approach

```css
:root {
	/* Light theme default */
	--bg-0: #fcfeff;
	--bg-1: #f8fcfd;
	--bg-2: #f0f9fb;
	--bg-3: #e8f6f9;
	--bg-4: #d8f0f5;

	--text-0: #111314;
	--text-1: #1a1e1f;
	--text-2: #2a3133;
	--text-3: #3a4447;
	--text-4: #5a6c70;

	--primary: #00d9ff;
	--primary-hover: #00aed9;
	--primary-active: #0083a3;

	--success: #00ff88;
	--warning: #ffb800;
	--danger: #ff3366;

	/* Third-party brand colors */
	--google-blue: #4285f4;
	--twitter-blue: #1da1f2;
}

[data-theme='dark'] {
	--bg-0: #0d1214;
	--bg-1: #131719;
	--bg-2: #1a2023;
	--bg-3: #212a2e;
	--bg-4: #2a3539;

	--text-0: #fcfeff;
	--text-1: #f0f7f9;
	--text-2: #d8eef3;
	--text-3: #c0e5ed;
	--text-4: #a8dce7;

	--primary: #00d9ff;
	--primary-hover: #33dfff;
	--primary-active: #66e5ff;

	--success: #00ff88;
	--warning: #ffc233;
	--danger: #ff4477;

	/* Third-party brand colors */
	--google-blue: #4285f4;
	--twitter-blue: #1da1f2;
}
```

---

## Recommendation

**Go with Option 1: Electric Cyan**

**Reasons**:

1. ✅ Evokes "glitch" aesthetic perfectly
2. ✅ Tech/digital feel aligns with crypto/prediction markets
3. ✅ High contrast, accessible
4. ✅ Stands out from typical finance blues
5. ✅ Works well with trading red/green
6. ✅ Fresh, modern, energetic
7. ✅ "Money printer/infinite money glitch" digital vibes

**Alternative**: If you want to lean more into the "money" aspect, Option 2 (Neon Green) is strong, but might conflict more with profit/loss indicators.

---

## Next Steps

1. Choose primary color direction (Cyan, Green, or Purple)
2. I'll update the README with the logo
3. Create design tokens/CSS variables file
4. Apply to first component when starting frontend work
