# Code Review - Glitch Markets Header & UI Components

## Summary

Overall, your code follows Svelte 5 best practices well. You're using runes correctly, have good component composition, and proper TypeScript typing. There are two TypeScript errors that need fixing and some minor improvements recommended.

---

## ✅ What You're Doing Right

### 1. **Svelte 5 Runes Usage** ✅

- **$state**: Not needed in most of your components (correctly avoided)
- **$derived**: Used correctly in SubHeader for `activeCategory`
- **$props**: Properly destructured with TypeScript interfaces
- **$bindable**: Correctly used in Input and Search for two-way binding
- **Snippets**: Excellent use for `iconBefore`, `iconAfter`, and `children`

### 2. **Component Architecture** ✅

- **Base + Specialized Pattern**: Input.svelte → Search.svelte is excellent
- **Composition over Inheritance**: Using snippets for flexible content
- **Wrapper Components**: Button, Input, PortfolioStat properly extend HTML attributes
- **Proper `{@render}` syntax**: All snippet renders are correct

### 3. **TypeScript** ✅

- **Extends HTMLAttributes**: Proper use of `HTMLButtonAttributes`, `HTMLInputAttributes`
- **Interface Documentation**: Good JSDoc comments on props
- **Type Safety**: Props are well-typed with fallback values

### 4. **Accessibility** ✅

- **ARIA Labels**: `aria-label="Search"`, `aria-hidden="true"` on decorative elements
- **Touch Targets**: Components use `--target-comfortable` (44px) for WCAG 2.1 AA compliance
- **Minimum Compliance**: All targets meet WCAG 2.2 AA minimum (24px)
- **Focus States**: `:focus-visible` with proper outline and box-shadow
- **Keyboard Navigation**: "/" shortcut in Search component

### 5. **Design System Integration** ✅

- **CSS Variables**: All colors, spacing, and radii use design tokens
- **No Magic Numbers**: Uses `var(--space-xs)`, `var(--radius-md)`, etc.
- **Scoped Styles**: All component styles are properly scoped

### 6. **Performance** ✅

- **No Unnecessary Reactivity**: Minimal use of $state (only where needed)
- **Derived Values**: Only recalculate when dependencies change
- **No Side Effects in Load**: N/A for these components

---

## ❌ Issues to Fix

### 1. **TypeScript Error in Input.svelte** 🔴

**Location**: `src/lib/components/ui/Input.svelte:5`

**Problem**: `size` property conflicts between your Props and HTMLInputAttributes

```typescript
interface Props extends HTMLInputAttributes {
	size?: 'small' | 'medium' | 'large'; // ❌ Conflicts with HTMLInputAttributes.size (number)
}
```

**Solution**: Rename your prop to avoid conflict

```typescript
interface Props extends Omit<HTMLInputAttributes, 'size'> {
	/**
	 * Input size variant
	 */
	inputSize?: 'small' | 'medium' | 'large';
}

let {
	inputSize = 'medium'
	// ... rest
}: Props = $props();
```

**OR** use a different naming convention:

```typescript
interface Props extends Omit<HTMLInputAttributes, 'size'> {
	/**
	 * Visual size variant
	 */
	variant?: 'small' | 'medium' | 'large';
}
```

### 2. **TypeScript Error in Search.svelte** 🔴

**Location**: `src/lib/components/ui/Search.svelte:62`

**Problem**: Cannot bind component instance to HTMLInputElement type

```typescript
let inputRef = $state<HTMLInputElement>(); // ❌ Input is a component, not an element

<Input
    bind:this={inputRef} // ❌ Type mismatch
```

**Solution**: Bind to the component type or use a different approach

```typescript
// Option 1: Change type to Component
import Input from './Input.svelte';
let inputRef = $state<typeof Input>();

// Option 2: Expose the input element from Input component
// In Input.svelte, add:
export let inputElement: HTMLInputElement | undefined = $state();

// Then in Search.svelte:
let inputElement = $state<HTMLInputElement>();
<Input bind:inputElement />
```

**Recommended**: Option 2 - expose the actual input element for better control

---

## 🟡 Recommended Improvements

### 1. **SubHeader - Use Svelte 5 State Instead of Stores** 🟡

**Current** (Svelte 4 pattern):

```svelte
<script lang="ts">
	import { page } from '$app/stores'; // ❌ Legacy stores

	let activeCategory = $derived($page.url.searchParams.get('category') || 'trending');
</script>
```

**Recommended** (Svelte 5 pattern):

```svelte
<script lang="ts">
	import { page } from '$app/state'; // ✅ Svelte 5 runes-based state

	let activeCategory = $derived(page.url.searchParams.get('category') || 'trending');
</script>
```

**Why**: `$app/state` is the modern Svelte 5 approach and works better with runes.

### 2. **Input Component - Consider Using `bind:this` Safely** 🟡

If you need to expose the input element, add this to Input.svelte:

```svelte
<script lang="ts">
	// ... existing props

	// Export the input element ref
	let inputElement: HTMLInputElement | undefined = $state();
</script>

<input
	bind:this={inputElement}
	class="input {className || ''}"
	bind:value
	{oninput}
	{...restProps}
/>
```

Then consumers can access it:

```svelte
<Input bind:inputElement />
```

### 3. **Button Component - Loading State Could Use $effect** 🟡

Currently your loading state is passive. If you wanted to add auto-focus behavior after loading completes, you could use `$effect`:

```svelte
$effect(() => {
    if (!loading && wasLoading) {
        // Optionally refocus after loading
        buttonRef?.focus();
    }
});
```

But **this is optional** - your current implementation is fine.

### 4. **PortfolioStat - Consider Semantic HTML** 🟡

Using `<svelte:element>` is clever but consider this alternative:

```svelte
{#if href}
	<a {href} class="portfolio-stat {className || ''}" {...restProps}>
		<span class="stat-label">{label}</span>
		<span class="stat-value value-{valueColor}">{value}</span>
	</a>
{:else}
	<button {onclick} class="portfolio-stat {className || ''}" {...restProps}>
		<span class="stat-label">{label}</span>
		<span class="stat-value value-{valueColor}">{value}</span>
	</button>
{/if}
```

**Why**: More explicit, easier to read, better IDE support. But your current approach is valid too.

---

## 📋 Best Practices Checklist

| Category                 | Status    | Notes                                       |
| ------------------------ | --------- | ------------------------------------------- |
| ✅ Svelte 5 Runes        | Excellent | Proper use of $props, $derived, $bindable   |
| ✅ TypeScript            | Good      | 2 errors to fix, otherwise excellent typing |
| ✅ Accessibility         | Excellent | ARIA labels, focus states, touch targets    |
| ✅ Design System         | Excellent | Consistent use of CSS variables             |
| ✅ Component Composition | Excellent | Proper use of snippets and props            |
| ✅ Scoped Styles         | Excellent | All styles properly scoped                  |
| 🟡 State Management      | Good      | Could migrate from stores to $app/state     |
| ✅ No Side Effects       | Excellent | Components are pure                         |
| ✅ Performance           | Excellent | Minimal reactivity, good $derived usage     |

---

## 🎯 Priority Fixes

1. **HIGH**: Fix Input.svelte `size` prop conflict (rename to `inputSize` or use `Omit`)
2. **HIGH**: Fix Search.svelte `inputRef` type error (expose element from Input)
3. **MEDIUM**: Migrate SubHeader from `$app/stores` to `$app/state`
4. **LOW**: Consider semantic HTML in PortfolioStat (optional)

---

## 📚 Svelte 5 Best Practices You're Following

1. ✅ Using `$props()` instead of `export let`
2. ✅ Using `$derived()` for computed values
3. ✅ Using `$bindable()` for two-way binding
4. ✅ Using `{@render snippet()}` instead of slots
5. ✅ Proper TypeScript with interfaces extending HTML attributes
6. ✅ No unnecessary `$state` (you're not over-using reactivity)
7. ✅ Scoped styles with CSS variables
8. ✅ Good accessibility practices

---

## 🚀 Next Steps

1. Fix the two TypeScript errors
2. Run `npm run check` to verify no errors
3. Consider migrating `$app/stores` to `$app/state` in SubHeader
4. All components are production-ready after these fixes!

---

## 📖 Resources

- [Svelte 5 Runes Documentation](https://svelte.dev/docs/svelte/$state)
- [SvelteKit $app/state](https://kit.svelte.dev/docs/modules#$app-state)
- [TypeScript with Svelte](https://svelte.dev/docs/typescript)
- [Svelte Accessibility](https://svelte.dev/docs/accessibility-warnings)
