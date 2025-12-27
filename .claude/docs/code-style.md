# Code Style Guide

This guide documents the code style and conventions used in Glitch Markets. These patterns ensure consistency, maintainability, and type safety across the codebase.

---

## Table of Contents

- [General Principles](#general-principles)
- [TypeScript](#typescript)
- [Svelte 5 Components](#svelte-5-components)
- [CSS & Styling](#css--styling)
- [File Naming](#file-naming)
- [Testing](#testing)
- [Comments](#comments)

---

## General Principles

### 1. Type Safety First

- **Never use `any`** - Always provide proper types
- Use `unknown` for truly unknown types, then narrow with type guards
- Leverage TypeScript's strict mode settings
- Export types for reuse across the codebase

### 2. Composition Over Complexity

- Break large components into smaller, focused pieces
- Use composables (`.svelte.ts`) for shared reactive logic
- Keep functions small and single-purpose
- Prefer pure functions when possible

### 3. Progressive Enhancement

- Code should work without JavaScript where possible
- Use semantic HTML as foundation
- Enhance with interactive features progressively
- Always consider accessibility (WCAG 2.1 AA minimum)

### 4. Comments Explain "Why", Not "What"

- Only add comments that explain intent, not mechanics
- Never write comments that restate the code
- Let clear code speak for itself
- Document edge cases and business logic

**Bad:**
```typescript
// Check cache first
if (cache.has(key)) {
  // Return cached result
  return cache.get(key);
}
```

**Good:**
```typescript
// Skip cache for real-time data to ensure users see latest market prices
if (options.realtime) {
  return fetchFromAPI();
}
```

---

## TypeScript

### Naming Conventions

- **PascalCase**: Types, interfaces, classes, enums
- **camelCase**: Functions, variables, parameters
- **SCREAMING_SNAKE_CASE**: Constants, environment variables

```typescript
// Types and interfaces
interface SearchOptions {
  query: string;
  limit?: number;
}

type Theme = 'light' | 'dark';

// Functions and variables
function formatNumber(value: number): string { }
const currentTheme = 'dark';

// Constants
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';
```

### Type Definitions

Always define types for:
- Function parameters and return values
- Object shapes and interfaces
- API responses
- Component props

```typescript
/**
 * Formats a number as currency with K/M suffixes
 *
 * @param num - The number to format (can be null or undefined)
 * @returns Formatted string like "$1.2M", "$500K", or "$123"
 *
 * @example
 * formatNumber(1234567) // "$1.2M"
 * formatNumber(123) // "$123"
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '$0';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}
```

### JSDoc Comments

Use JSDoc for exported functions and classes:

```typescript
/**
 * Service layer for search operations
 * Coordinates between API client and server routes, handles caching
 *
 * @example
 * ```typescript
 * const service = new SearchService();
 * const results = await service.search({ q: 'bitcoin', limitPerType: 10 });
 * ```
 */
export class SearchService extends BaseService {
  /**
   * Searches for markets, events, and profiles
   *
   * @param options - Search options including query and filters
   * @returns Promise resolving to search results
   * @throws {ApiError} When the API request fails
   */
  async search(options: SearchOptions): Promise<SearchResults> {
    // Implementation
  }
}
```

### File Headers

Add file-level JSDoc for client-side type files:

```typescript
/**
 * Client-side type definitions for bridge/deposit functionality
 * These mirror the server types but are available for frontend use
 */

export interface BridgeToken {
  name: string;
  symbol: string;
  // ...
}
```

### Error Handling

- Use proper error types, never `catch (error)` without type checking
- Throw specific error types from your error hierarchy
- Handle errors at appropriate boundaries

```typescript
try {
  await addToWatchlist(eventId, event);
} catch (error) {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    openSignInModal();
    return;
  }
  throw error; // Re-throw unexpected errors
}
```

---

## Svelte 5 Components

### Component Structure

Follow this order in `.svelte` files:

1. `<script lang="ts">` - Logic
2. Template - Markup
3. `<style>` - Scoped styles

### Props with Runes

Use the `$props()` rune with TypeScript interfaces:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'tertiary';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    children?: Snippet;
    onclick?: (event: MouseEvent) => void;
  }

  let {
    variant = 'primary',
    size = 'medium',
    loading = false,
    children,
    onclick,
    class: className,
    ...restProps
  }: Props = $props();

  const isDisabled = $derived(disabled || loading);
</script>
```

### Reactive State with Runes

**$state** - Reactive state:
```typescript
export const themeState = $state({
  current: 'dark' as Theme
});
```

**$derived** - Computed values:
```typescript
const isDisabled = $derived(disabled || loading);
const isEventBookmarked = $derived(isBookmarked(getEventId()));
```

**$effect** - Side effects:
```typescript
$effect(() => {
  console.log(`Theme changed to: ${themeState.current}`);
});
```

### Composables Pattern

Create reusable reactive logic in `.svelte.ts` files:

```typescript
// useBookmark.svelte.ts
export function useBookmark(getEventId: () => string) {
  const isEventBookmarked = $derived(isBookmarked(getEventId()));

  async function toggleBookmark() {
    if (!authState.user) {
      openSignInModal();
      return;
    }
    // Implementation
  }

  return {
    get isBookmarked() {
      return isEventBookmarked;
    },
    toggleBookmark
  };
}
```

Usage in components:
```svelte
<script lang="ts">
  import { useBookmark } from '$lib/composables/useBookmark.svelte';

  const bookmark = useBookmark(() => event.id);
</script>

<button onclick={bookmark.toggleBookmark}>
  {bookmark.isBookmarked ? 'Remove' : 'Add'}
</button>
```

### Template Syntax

**Snippets for composition:**
```svelte
<script lang="ts">
  interface Props {
    iconBefore?: Snippet;
    children?: Snippet;
  }
  let { iconBefore, children }: Props = $props();
</script>

{#if iconBefore}
  {@render iconBefore()}
{/if}
{@render children?.()}
```

**Conditional rendering:**
```svelte
{#if loading}
  <LoadingSpinner />
{:else if error}
  <ErrorMessage />
{:else}
  <Content />
{/if}
```

**List rendering:**
```svelte
{#each items as item (item.id)}
  <ItemCard {item} />
{/each}
```

---

## CSS & Styling

### Always Use CSS Variables

**Never hard-code colors or values.** Always use design system variables:

```css
/* ❌ BAD - Hard-coded values */
.button {
  background: #8b5cf6;
  color: #ffffff;
  padding: 12px 24px;
}

/* ✅ GOOD - CSS variables */
.button {
  background: var(--primary);
  color: var(--bg-0);
  padding: var(--spacing-3) var(--spacing-6);
}
```

See [brand-colors.md](./brand-colors.md) for the complete design system.

### Section Comments

Use bordered comments to separate major sections:

```css
/* ============================================
   BASE BUTTON STYLES
   ============================================ */

/* ============================================
   SIZE VARIANTS
   ============================================ */

/* ============================================
   PRIMARY VARIANT (High Emphasis)
   ============================================ */
```

### Class Naming

- Use semantic, descriptive class names
- Prefer kebab-case: `.search-result-item`
- Use BEM-like modifiers: `.button.variant-primary`
- Leverage `class:` directive for conditional classes

```svelte
<button
  class="button variant-{variant} size-{size} {className || ''}"
  class:full-width={fullWidth}
  class:loading
>
```

### Mobile-First Responsive

Write mobile styles first, then enhance for larger screens:

```css
/* Mobile first (default) */
.card {
  padding: var(--spacing-4);
  font-size: var(--text-base);
}

/* Tablet and up */
@media (min-width: 768px) {
  .card {
    padding: var(--spacing-6);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .card {
    padding: var(--spacing-8);
    font-size: var(--text-lg);
  }
}
```

### Touch Targets

Ensure interactive elements meet WCAG 2.2 AA (44×44px):

```css
.button.size-small {
  min-height: 36px;
}

/* Touch target expansion on touch devices */
.button.size-small::before {
  content: '';
  position: absolute;
  width: max(100%, var(--target-comfortable)); /* 44px */
  height: max(100%, var(--target-comfortable));
}

@media (pointer: fine) {
  .button.size-small::before {
    display: none; /* Remove on mouse/trackpad devices */
  }
}
```

---

## File Naming

### Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase.svelte | `Button.svelte`, `SearchResultItem.svelte` |
| Pages/Routes | +page.svelte | `+page.svelte`, `+layout.svelte` |
| Utilities | kebab-case.ts | `format.ts`, `cache-headers.ts` |
| Stores (Svelte 5) | kebab-case.svelte.ts | `theme.svelte.ts`, `auth.svelte.ts` |
| Composables | camelCase.svelte.ts | `useBookmark.svelte.ts`, `use-balance.svelte.ts` |
| Services | PascalCase-kebab.ts | `search-service.ts`, `user-data-service.ts` |
| Types | kebab-case.ts | `bridge.ts`, `modal.ts` |
| Tests | same-name.test.ts | `format.test.ts`, `search-service.test.ts` |

### Directory Structure

```
src/lib/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── icons/        # Icon components
│   ├── charts/       # Chart components
│   └── layout/       # Layout components
├── composables/      # Reusable reactive logic (.svelte.ts)
├── stores/           # Global state (.svelte.ts)
├── utils/            # Pure utility functions
├── types/            # Type definitions
├── server/
│   ├── api/          # API clients
│   ├── services/     # Business logic layer
│   ├── utils/        # Server utilities
│   └── validation/   # Input/output validation
└── config/           # Configuration files
```

---

## Testing

### Test File Location

Place tests next to the code they test:

```
src/lib/utils/
├── format.ts
└── format.test.ts
```

### Test Structure

Use `describe` blocks and descriptive test names:

```typescript
import { describe, it, expect } from 'vitest';
import { formatNumber } from './format';

describe('formatNumber', () => {
  it('formats millions correctly', () => {
    expect(formatNumber(1000000)).toBe('$1.0M');
    expect(formatNumber(1234567)).toBe('$1.2M');
  });

  it('formats thousands correctly', () => {
    expect(formatNumber(1000)).toBe('$1.0K');
  });

  it('handles null and undefined', () => {
    expect(formatNumber(null)).toBe('$0');
    expect(formatNumber(undefined)).toBe('$0');
  });
});
```

### What to Test

- **Pure functions** - Always test utilities and helpers
- **Business logic** - Test services and data transformations
- **Edge cases** - Null, undefined, empty arrays, boundary values
- **Error handling** - Ensure errors are caught and handled properly

See [vitest.md](./vitest.md) for more testing documentation.

---

## Comments

### When to Comment

**DO comment:**
- Complex business logic or algorithms
- Non-obvious workarounds or hacks
- Performance optimizations
- Security considerations
- WCAG compliance notes

**DON'T comment:**
- What the code does (should be self-evident)
- Variable assignments
- Standard control flow
- Obvious function calls

### Examples

**❌ Bad Comments (Restating Code):**
```typescript
// Set the user variable to null
const user = null;

// Loop through all items
for (const item of items) {
  // Add item to cart
  cart.add(item);
}

// Check if user is logged in
if (user.isLoggedIn) {
  // Redirect to dashboard
  redirect('/dashboard');
}
```

**✅ Good Comments (Explaining Why):**
```typescript
// Null initial state prevents flash of wrong user data during SSR
const user = null;

// Batch additions to trigger single cart recalculation instead of N
for (const item of items) {
  cart.add(item);
}

// Redirect must happen before layout renders to avoid auth state race condition
if (user.isLoggedIn) {
  redirect('/dashboard');
}
```

### JSDoc for Public APIs

Use JSDoc for all exported functions, classes, and types:

```typescript
/**
 * Initialize theme - reads from DOM (set by inline script in app.html)
 * This MUST be called synchronously during component initialization
 */
export function initializeTheme() {
  // Implementation
}
```

---

## Key Takeaways

1. **Type everything** - No `any`, leverage TypeScript fully
2. **Use CSS variables** - Never hard-code colors or spacing
3. **Svelte 5 runes** - Use `$state`, `$derived`, `$props` correctly
4. **Composables for logic** - Extract reactive logic to `.svelte.ts`
5. **Mobile-first** - Design for mobile, enhance for desktop
6. **Accessibility** - WCAG 2.1 AA minimum, touch targets 44×44px
7. **Comments explain why** - Let code explain what
8. **Test utilities** - All pure functions should have tests

For more details, see:
- [Technical Documentation](./technical.md)
- [Design System](./brand-colors.md)
- [Testing Guide](./vitest.md)
