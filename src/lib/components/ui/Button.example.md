# Button Component Usage

Reusable button component following UI Design Principle #3 (Single Primary Button).

## Variants

### Primary (High Emphasis)

Most important action on the page.

```svelte
<Button variant="primary">Place Bet</Button>
<Button variant="primary" size="large">Buy Shares</Button>
```

### Secondary (Medium Emphasis)

Alternative actions.

```svelte
<Button variant="secondary">Cancel</Button>
<Button variant="secondary">View Details</Button>
```

### Tertiary (Low Emphasis)

Least important actions.

```svelte
<Button variant="tertiary">Skip</Button>
<Button variant="tertiary">Learn More</Button>
```

## Sizes

All sizes meet WCAG minimum touch target (48px).

```svelte
<Button size="small">Small</Button>
<Button size="medium">Medium (default)</Button>
<Button size="large">Large</Button>
```

## With Icons

```svelte
<script>
	import Button from '$lib/components/ui/Button.svelte';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
</script>

<!-- Icon before text -->
<Button variant="primary">
	{#snippet iconBefore()}
		<SearchIcon size={16} />
	{/snippet}
	Search Markets
</Button>

<!-- Icon after text -->
<Button variant="secondary">
	View More
	{#snippet iconAfter()}
		<ArrowRightIcon size={16} />
	{/snippet}
</Button>
```

## Loading State

```svelte
<Button variant="primary" loading={true}>Processing...</Button>
```

## Disabled

```svelte
<Button variant="primary" disabled={true}>Sold Out</Button>
```

## Full Width

```svelte
<Button variant="primary" fullWidth={true}>Continue</Button>
```

## Button Hierarchy Best Practices

Following UI Design Principle #3:

**✅ Good:**

```svelte
<!-- One primary, rest secondary/tertiary -->
<div class="actions">
	<Button variant="primary">Submit</Button>
	<Button variant="secondary">Save Draft</Button>
	<Button variant="tertiary">Cancel</Button>
</div>
```

**❌ Bad:**

```svelte
<!-- Multiple primary buttons compete for attention -->
<div class="actions">
	<Button variant="primary">Submit</Button>
	<Button variant="primary">Delete</Button>
	<!-- Should be secondary or tertiary -->
</div>
```

## Accessibility

- ✅ Minimum 48px touch target (WCAG AA)
- ✅ Focus ring on keyboard focus
- ✅ Disabled state prevents interaction
- ✅ Loading state shows spinner
- ✅ Semantic `<button>` element

## Design Tokens Used

- Colors: `--primary`, `--bg-2`, `--bg-3`, `--bg-4`, `--text-0`, `--text-1`
- Spacing: `--space-xs`
- Radius: `--radius-button`, `--radius-md`, `--radius-lg`
- Transitions: `--transition-colors`
- Typography: `--font-sans`, `--font-semibold`
- Focus: `--focus-ring`
- Target: `--target-min`, `--target-comfortable`
