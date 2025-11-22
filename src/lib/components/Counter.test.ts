import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Counter from './Counter.svelte';

describe('Counter Component', () => {
	it('should render with default initial value', () => {
		render(Counter);
		const count = screen.getByTestId('count');
		expect(count).toHaveTextContent('0');
	});

	it('should render with custom initial value', () => {
		render(Counter, { initial: 5 });
		const count = screen.getByTestId('count');
		expect(count).toHaveTextContent('5');
	});

	it('should increment when clicking the + button', async () => {
		const user = userEvent.setup();
		render(Counter);

		const incrementButton = screen.getByLabelText('Increment');
		const count = screen.getByTestId('count');

		expect(count).toHaveTextContent('0');

		await user.click(incrementButton);
		expect(count).toHaveTextContent('1');

		await user.click(incrementButton);
		expect(count).toHaveTextContent('2');
	});

	it('should decrement when clicking the - button', async () => {
		const user = userEvent.setup();
		render(Counter, { initial: 10 });

		const decrementButton = screen.getByLabelText('Decrement');
		const count = screen.getByTestId('count');

		expect(count).toHaveTextContent('10');

		await user.click(decrementButton);
		expect(count).toHaveTextContent('9');

		await user.click(decrementButton);
		expect(count).toHaveTextContent('8');
	});

	it('should handle both increment and decrement', async () => {
		const user = userEvent.setup();
		render(Counter);

		const incrementButton = screen.getByLabelText('Increment');
		const decrementButton = screen.getByLabelText('Decrement');
		const count = screen.getByTestId('count');

		await user.click(incrementButton);
		await user.click(incrementButton);
		await user.click(incrementButton);
		expect(count).toHaveTextContent('3');

		await user.click(decrementButton);
		expect(count).toHaveTextContent('2');
	});
});
