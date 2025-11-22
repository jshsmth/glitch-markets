<script lang="ts">
	let { initial = 0 }: { initial?: number } = $props();

	let count = $state(initial);

	function increment() {
		count++;
	}

	function decrement() {
		count--;
	}
</script>

<div class="counter">
	<button onclick={decrement} aria-label="Decrement">-</button>
	<span data-testid="count">{count}</span>
	<button onclick={increment} aria-label="Increment">+</button>
</div>

<style>
	.counter {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		cursor: pointer;
	}

	span {
		min-width: 2rem;
		text-align: center;
		font-size: 1.5rem;
	}
</style>
