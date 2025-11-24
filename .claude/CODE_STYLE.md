# Code Style Guide

This document defines the code style and best practices for Glitch Markets.

---

## TypeScript Style

### General Guidelines

1. **Use TypeScript for all new code** - No plain JavaScript files
2. **Enable strict mode** - All TypeScript strict checks should be enabled
3. **Prefer type inference** - Let TypeScript infer types when obvious
4. **Use interfaces for objects** - Prefer interfaces over type aliases for object shapes
5. **Avoid `any`** - Use `unknown` or proper types instead

### Naming Conventions

- **Variables/Functions**: camelCase (`getUserData`, `isActive`)
- **Types/Interfaces**: PascalCase (`User`, `MarketData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Private properties**: prefix with underscore (`_internalState`)
- **Boolean variables**: prefix with `is`, `has`, `should` (`isLoading`, `hasError`)

### Example

```typescript
// Good
interface UserProfile {
	id: string;
	displayName: string;
	isVerified: boolean;
}

const MAX_RETRY_ATTEMPTS = 3;

function getUserProfile(userId: string): Promise<UserProfile> {
	// Implementation
}

// Avoid
type user_profile = {
	ID: string;
	display_name: string;
	verified: boolean;
};

const maxRetries = 3;

function get_user_profile(user_id: string): Promise<any> {
	// Implementation
}
```

---

## Svelte Style

### Component Structure

Components should follow this order:

1. Script tag (TypeScript)
2. Markup
3. Style tag (scoped)

```svelte
<script lang="ts">
	// Imports
	import { onMount } from 'svelte';

	// Props
	interface Props {
		title: string;
		count?: number;
	}

	let { title, count = 0 }: Props = $props();

	// State
	let isLoading = $state(false);

	// Derived state
	let displayText = $derived(`${title}: ${count}`);

	// Effects
	$effect(() => {
		console.log('Count changed:', count);
	});

	// Functions
	function handleClick() {
		count++;
	}
</script>

<div class="container">
	<h1>{displayText}</h1>
	<button onclick={handleClick}>Increment</button>
</div>

<style>
	.container {
		background-color: var(--bg-1);
		padding: 1rem;
	}
</style>
```

### Svelte 5 Runes

Always use Svelte 5 runes for state management:

- `$state()` - For reactive state
- `$derived()` - For computed values
- `$effect()` - For side effects
- `$props()` - For component props
- `$bindable()` - For two-way binding

### Props Definition

Always define props with TypeScript interfaces:

```svelte
<script lang="ts">
	interface Props {
		title: string;
		count?: number;
		onUpdate?: (value: number) => void;
	}

	let { title, count = 0, onUpdate }: Props = $props();
</script>
```

---

## CSS Style

### Design System

**ALWAYS use CSS variables from the design system** - See [BRAND_COLORS.md](./BRAND_COLORS.md)

```css
/* Good */
.card {
	background-color: var(--bg-1);
	color: var(--text-0);
	border: 1px solid var(--bg-4);
}

/* Bad - Never use hard-coded colors */
.card {
	background-color: #1a1a1a;
	color: #ffffff;
	border: 1px solid #333333;
}
```

### CSS Organization

1. **Layout** (display, position, flex/grid)
2. **Box model** (width, height, padding, margin)
3. **Typography** (font, text-align, line-height)
4. **Visual** (background, border, shadow)
5. **Misc** (cursor, transition, etc.)

```css
.example {
	/* Layout */
	display: flex;
	flex-direction: column;

	/* Box model */
	width: 100%;
	padding: 1rem;
	margin-bottom: 1rem;

	/* Typography */
	font-size: 1rem;
	line-height: 1.5;

	/* Visual */
	background-color: var(--bg-1);
	border-radius: 0.5rem;

	/* Misc */
	cursor: pointer;
	transition: background-color 0.2s;
}
```

### Responsive Design

Use mobile-first approach with min-width media queries:

```css
.container {
	padding: 1rem;
}

@media (min-width: 768px) {
	.container {
		padding: 2rem;
	}
}

@media (min-width: 1024px) {
	.container {
		padding: 3rem;
	}
}
```

---

## File Organization

### Directory Structure

```
src/
├── lib/
│   ├── components/     # Reusable Svelte components
│   ├── types/          # TypeScript types and interfaces
│   ├── utils/          # Utility functions
│   ├── stores/         # Svelte stores
│   └── api/            # API client code
├── routes/             # SvelteKit routes
└── app.css             # Global styles
```

### File Naming

- **Components**: PascalCase (`MarketCard.svelte`, `UserProfile.svelte`)
- **Utilities**: camelCase (`formatCurrency.ts`, `dateUtils.ts`)
- **Types**: camelCase with .types suffix (`market.types.ts`, `user.types.ts`)
- **Routes**: lowercase with hyphens (`+page.svelte`, `[id]/+page.svelte`)

---

## API Integration

### Error Handling

Always handle errors gracefully:

```typescript
async function fetchMarketData(id: string): Promise<Market | null> {
	try {
		const response = await fetch(`/api/markets/${id}`);

		if (!response.ok) {
			console.error(`Failed to fetch market ${id}:`, response.statusText);
			return null;
		}

		return await response.json();
	} catch (error) {
		console.error('Network error:', error);
		return null;
	}
}
```

### Loading States

Always provide loading feedback:

```svelte
<script lang="ts">
	let data = $state<Market | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			data = await fetchMarketData(id);
		} catch (err) {
			error = 'Failed to load market data';
		} finally {
			isLoading = false;
		}
	});
</script>

{#if isLoading}
	<LoadingSpinner />
{:else if error}
	<ErrorMessage message={error} />
{:else if data}
	<MarketCard market={data} />
{/if}
```

---

## Testing

### Unit Tests

Write tests for all utility functions:

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
	it('formats USD correctly', () => {
		expect(formatCurrency(1234.56)).toBe('$1,234.56');
	});

	it('handles zero', () => {
		expect(formatCurrency(0)).toBe('$0.00');
	});

	it('handles negative values', () => {
		expect(formatCurrency(-50)).toBe('-$50.00');
	});
});
```

### Component Tests

Test component behavior, not implementation:

```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MarketCard from './MarketCard.svelte';

describe('MarketCard', () => {
	it('displays market title', () => {
		render(MarketCard, {
			props: {
				market: {
					id: '1',
					title: 'Test Market',
					probability: 0.65
				}
			}
		});

		expect(screen.getByText('Test Market')).toBeInTheDocument();
	});
});
```

---

## Git Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(markets): Add filtering by category

Implement category filtering for market list page with
URL state management and loading states.

Closes #123
```

```
fix(api): Handle rate limiting errors

Add exponential backoff retry logic for Polymarket API
rate limit responses (429 status).
```

---

## Performance Guidelines

### 1. Lazy Loading

Lazy load routes and heavy components:

```typescript
// In +page.ts
export const load = async () => {
	const { default: HeavyComponent } = await import('$lib/components/Heavy.svelte');
	return { HeavyComponent };
};
```

### 2. Avoid Unnecessary Reactivity

Use `$derived` instead of reactive statements when possible:

```svelte
<script lang="ts">
	let count = $state(0);

	// Good - only recomputes when count changes
	let doubled = $derived(count * 2);

	// Avoid - less clear intent
	$: doubled = count * 2;
</script>
```

### 3. Optimize Images

- Use WebP format when possible
- Include width/height attributes
- Use lazy loading for below-fold images

```svelte
<img src={marketImage} alt={marketTitle} width={400} height={300} loading="lazy" />
```

---

## Accessibility

### 1. Semantic HTML

Use semantic HTML elements:

```svelte
<!-- Good -->
<nav>
	<ul>
		<li><a href="/markets">Markets</a></li>
	</ul>
</nav>

<!-- Bad -->
<div>
	<div>
		<div><a href="/markets">Markets</a></div>
	</div>
</div>
```

### 2. ARIA Labels

Add ARIA labels for interactive elements:

```svelte
<button onclick={handleClose} aria-label="Close dialog">
	<CloseIcon />
</button>
```

### 3. Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```svelte
<div
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			handleClick();
		}
	}}
>
	Click me
</div>
```

---

## Security

### 1. Input Sanitization

Always sanitize user input:

```typescript
import DOMPurify from 'isomorphic-dompurify';

function renderUserContent(html: string) {
	return DOMPurify.sanitize(html);
}
```

### 2. Environment Variables

Never commit secrets:

```typescript
// Good - use environment variables
const apiKey = import.meta.env.VITE_API_KEY;

// Bad - hardcoded secrets
const apiKey = 'sk_live_1234567890';
```

### 3. CORS Headers

Configure CORS appropriately in `svelte.config.js`:

```javascript
export default {
	kit: {
		csrf: {
			checkOrigin: true
		}
	}
};
```

---

## Documentation

### JSDoc Comments

Add JSDoc comments for public functions:

```typescript
/**
 * Formats a number as USD currency
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 * @example
 * formatCurrency(1234.56) // Returns "$1,234.56"
 */
export function formatCurrency(amount: number, decimals = 2): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	}).format(amount);
}
```

### Component Documentation

Document complex components with comments:

```svelte
<!--
	MarketCard Component

	Displays a prediction market with title, probability, and trading controls.

	Props:
	- market: Market data object
	- compact: Use compact layout (optional)

	Events:
	- on:trade: Fired when user initiates a trade

	Usage:
	<MarketCard market={data} on:trade={handleTrade} />
-->
<script lang="ts">
	// Component implementation
</script>
```
