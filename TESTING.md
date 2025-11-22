# Testing Guide

This project uses [Vitest](https://vitest.dev/) for testing, configured to work with Svelte 5 and SvelteKit.

## Available Test Commands

- `npm test` - Run tests in watch mode
- `npm run test:run` - Run all tests once
- `npm run test:ui` - Open Vitest UI

## Test Structure

Tests are located in:
- `src/lib/tests/` - Unit tests for utilities and reactive logic
- `src/lib/components/` - Component tests alongside components

## Writing Tests

### Unit Tests

For standard unit tests, use `.test.ts` extension:

```typescript
import { describe, it, expect } from 'vitest';

describe('my function', () => {
  it('should do something', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Testing Reactive Code (Runes)

When testing code that uses Svelte runes (`$state`, `$derived`, etc.), use `.svelte.test.ts` extension:

```typescript
import { describe, it, expect } from 'vitest';
import { flushSync } from 'svelte';

describe('reactive counter', () => {
  it('should update reactively', () => {
    let count = $state(0);

    expect(count).toBe(0);
    count = 5;
    expect(count).toBe(5);
  });
});
```

For code using `$effect`, wrap your test in `$effect.root()`:

```typescript
it('should handle effects', () => {
  const cleanup = $effect.root(() => {
    let count = $state(0);

    // Your effect-based code here

    flushSync(); // Flush effects synchronously
  });

  cleanup();
});
```

### Component Tests

Use `@testing-library/svelte` for component testing:

```typescript
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import MyComponent from './MyComponent.svelte';

test('component behavior', async () => {
  const user = userEvent.setup();
  render(MyComponent, { someProp: 'value' });

  const button = screen.getByRole('button');
  await user.click(button);

  expect(button).toHaveTextContent('Clicked');
});
```

## Configuration

Testing is configured in:
- `vite.config.ts` - Vitest configuration
- `src/lib/tests/setup.ts` - Test setup file with jest-dom matchers

## Examples

Check these example tests to get started:
- `src/lib/tests/example.test.ts` - Basic unit tests
- `src/lib/tests/utils.svelte.test.ts` - Runes and reactive code
- `src/lib/components/Counter.test.ts` - Component testing with user interactions

## Dependencies

- `vitest` - Test runner
- `jsdom` - DOM environment for tests
- `@testing-library/svelte` - Component testing utilities
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - Additional DOM matchers
