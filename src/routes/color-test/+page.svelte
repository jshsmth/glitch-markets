<script lang="ts">
	let theme = $state<'light' | 'dark'>('light');

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', theme);
		}
	}
</script>

<svelte:head>
	<title>Color System Test - Glitch Markets</title>
</svelte:head>

<div class="test-container">
	<header class="test-header">
		<h1>Glitch Markets - Color System Test</h1>
		<button class="theme-toggle" onclick={toggleTheme}>
			Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
		</button>
	</header>

	<!-- Background Shades -->
	<section class="test-section">
		<h2>Background Shades (Cyan-tinted)</h2>
		<div class="color-grid">
			<div class="color-card bg-0">
				<div class="color-label">bg-0</div>
				<div class="color-info">Main background</div>
			</div>
			<div class="color-card bg-1">
				<div class="color-label">bg-1</div>
				<div class="color-info">Cards/panels</div>
			</div>
			<div class="color-card bg-2">
				<div class="color-label">bg-2</div>
				<div class="color-info">Elevated cards</div>
			</div>
			<div class="color-card bg-3">
				<div class="color-label">bg-3</div>
				<div class="color-info">Hover states</div>
			</div>
			<div class="color-card bg-4">
				<div class="color-label">bg-4</div>
				<div class="color-info">Borders</div>
			</div>
		</div>
	</section>

	<!-- Text Shades -->
	<section class="test-section">
		<h2>Text Shades (Cyan-tinted)</h2>
		<div class="text-examples">
			<p class="text-0">text-0: Primary text - The quick brown fox jumps over the lazy dog</p>
			<p class="text-1">text-1: Secondary text - The quick brown fox jumps over the lazy dog</p>
			<p class="text-2">text-2: Tertiary text - The quick brown fox jumps over the lazy dog</p>
			<p class="text-3">text-3: Muted text - The quick brown fox jumps over the lazy dog</p>
			<p class="text-4">text-4: Disabled text - The quick brown fox jumps over the lazy dog</p>
		</div>
	</section>

	<!-- Primary Brand Color -->
	<section class="test-section">
		<h2>Primary Brand Color (Electric Cyan)</h2>
		<div class="color-grid">
			<div class="color-card primary-50">
				<div class="color-label">primary-50</div>
			</div>
			<div class="color-card primary-100">
				<div class="color-label">primary-100</div>
			</div>
			<div class="color-card primary-200">
				<div class="color-label">primary-200</div>
			</div>
			<div class="color-card primary-300">
				<div class="color-label">primary-300</div>
			</div>
			<div class="color-card primary-400">
				<div class="color-label">primary-400</div>
			</div>
			<div class="color-card primary-500">
				<div class="color-label primary-text">primary-500</div>
				<div class="color-info primary-text">Main brand</div>
			</div>
			<div class="color-card primary-600">
				<div class="color-label primary-text">primary-600</div>
				<div class="color-info primary-text">Hover</div>
			</div>
			<div class="color-card primary-700">
				<div class="color-label primary-text">primary-700</div>
				<div class="color-info primary-text">Active</div>
			</div>
			<div class="color-card primary-800">
				<div class="color-label primary-text">primary-800</div>
			</div>
			<div class="color-card primary-900">
				<div class="color-label primary-text">primary-900</div>
			</div>
		</div>
	</section>

	<!-- Accent Colors -->
	<section class="test-section">
		<h2>Trading Indicator Colors</h2>
		<div class="accent-grid">
			<div class="accent-card">
				<div class="accent-example success">
					<span class="accent-label">Success (Profit)</span>
					<span class="accent-value">+$1,234.56</span>
				</div>
			</div>
			<div class="accent-card">
				<div class="accent-example warning">
					<span class="accent-label">Warning (Neutral)</span>
					<span class="accent-value">~$0.00</span>
				</div>
			</div>
			<div class="accent-card">
				<div class="accent-example danger">
					<span class="accent-label">Danger (Loss)</span>
					<span class="accent-value">-$567.89</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Component Examples -->
	<section class="test-section">
		<h2>Component Examples</h2>

		<div class="component-examples">
			<!-- Buttons -->
			<div class="example-group">
				<h3>Buttons</h3>
				<div class="button-group">
					<button class="button-primary">Primary Button</button>
					<button class="button-secondary">Secondary Button</button>
					<button class="button-ghost">Ghost Button</button>
				</div>
			</div>

			<!-- Cards -->
			<div class="example-group">
				<h3>Cards</h3>
				<div class="card-examples">
					<div class="card">
						<h4>Market Card</h4>
						<p class="text-2">Will Bitcoin reach $100k in 2025?</p>
						<div class="card-footer">
							<span class="success">Yes: 67%</span>
							<span class="danger">No: 33%</span>
						</div>
					</div>
					<div class="card card-elevated">
						<h4>Elevated Card</h4>
						<p class="text-2">Enhanced elevation for focus</p>
					</div>
				</div>
			</div>

			<!-- Links -->
			<div class="example-group">
				<h3>Links</h3>
				<p>
					This is a paragraph with <a href="#test">a link</a> that uses the primary color and
					changes on hover.
				</p>
			</div>
		</div>
	</section>
</div>

<style>
	.test-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.test-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 3rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--bg-4);
	}

	.test-header h1 {
		color: var(--text-0);
		font-size: 2rem;
	}

	.theme-toggle {
		background-color: var(--primary);
		color: #111111;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.theme-toggle:hover {
		background-color: var(--primary-hover);
	}

	.test-section {
		margin-bottom: 3rem;
	}

	.test-section h2 {
		color: var(--text-0);
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.test-section h3 {
		color: var(--text-1);
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}

	/* Background Shades */
	.color-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.color-card {
		padding: 2rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--bg-4);
		text-align: center;
	}

	.color-label {
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text-0);
	}

	.color-info {
		font-size: 0.875rem;
		color: var(--text-2);
	}

	/* Text color for primary swatches - adaptive based on theme */
	.primary-text {
		color: #111111; /* Default: black text for light mode */
	}

	/* Light mode: white text on darker shades */
	.primary-700 .primary-text,
	.primary-800 .primary-text,
	.primary-900 .primary-text {
		color: #ffffff;
	}


	/* Background variants */
	.bg-0 {
		background-color: var(--bg-0);
	}
	.bg-1 {
		background-color: var(--bg-1);
	}
	.bg-2 {
		background-color: var(--bg-2);
	}
	.bg-3 {
		background-color: var(--bg-3);
	}
	.bg-4 {
		background-color: var(--bg-4);
	}

	/* Primary variants */
	.primary-50 {
		background-color: var(--primary-50);
	}
	.primary-100 {
		background-color: var(--primary-100);
	}
	.primary-200 {
		background-color: var(--primary-200);
	}
	.primary-300 {
		background-color: var(--primary-300);
	}
	.primary-400 {
		background-color: var(--primary-400);
	}
	.primary-500 {
		background-color: var(--primary-500);
	}
	.primary-600 {
		background-color: var(--primary-600);
	}
	.primary-700 {
		background-color: var(--primary-700);
	}
	.primary-800 {
		background-color: var(--primary-800);
	}
	.primary-900 {
		background-color: var(--primary-900);
	}

	/* Text Shades */
	.text-examples {
		background-color: var(--bg-1);
		padding: 2rem;
		border-radius: 8px;
		border: 1px solid var(--bg-4);
	}

	.text-examples p {
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	.text-0 {
		color: var(--text-0);
	}
	.text-1 {
		color: var(--text-1);
	}
	.text-2 {
		color: var(--text-2);
	}
	.text-3 {
		color: var(--text-3);
	}
	.text-4 {
		color: var(--text-4);
	}

	/* Accent Colors */
	.accent-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.accent-card {
		background-color: var(--bg-1);
		padding: 2rem;
		border-radius: 8px;
		border: 1px solid var(--bg-4);
	}

	.accent-example {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.accent-label {
		font-size: 0.875rem;
		color: var(--text-2);
	}

	.accent-value {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.success {
		color: var(--success);
	}

	.warning {
		color: var(--warning);
	}

	.danger {
		color: var(--danger);
	}

	/* Component Examples */
	.component-examples {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.example-group {
		background-color: var(--bg-1);
		padding: 2rem;
		border-radius: 8px;
		border: 1px solid var(--bg-4);
	}

	/* Buttons */
	.button-group {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.button-primary {
		background-color: var(--primary);
		color: #111111;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.button-primary:hover {
		background-color: var(--primary-hover);
	}

	.button-primary:active {
		background-color: var(--primary-active);
	}

	.button-secondary {
		background-color: var(--bg-2);
		color: var(--text-0);
		border: 1px solid var(--bg-4);
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color 0.2s,
			border-color 0.2s;
	}

	.button-secondary:hover {
		background-color: var(--bg-3);
		border-color: var(--primary);
	}

	.button-ghost {
		background-color: transparent;
		color: var(--primary);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.button-ghost:hover {
		background-color: var(--bg-2);
	}

	/* Cards */
	.card-examples {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.card {
		background-color: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.card h4 {
		color: var(--text-0);
		margin-bottom: 0.5rem;
	}

	.card p {
		margin-bottom: 1rem;
	}

	.card-elevated {
		background-color: var(--bg-2);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		font-weight: 600;
	}

	/* Links */
	a {
		color: var(--primary);
		text-decoration: none;
		transition: color 0.2s;
	}

	a:hover {
		color: var(--primary-hover);
		text-decoration: underline;
	}

	/* Dark mode text contrast - using :global block */
	:global {
		/* Dark backgrounds (50-200) need white text */
		[data-theme='dark'] .primary-50 .primary-text,
		[data-theme='dark'] .primary-100 .primary-text,
		[data-theme='dark'] .primary-200 .primary-text {
			color: #ffffff;
		}

		/* Bright backgrounds (300-900) need black text */
		[data-theme='dark'] .primary-300 .primary-text,
		[data-theme='dark'] .primary-400 .primary-text,
		[data-theme='dark'] .primary-500 .primary-text,
		[data-theme='dark'] .primary-600 .primary-text,
		[data-theme='dark'] .primary-700 .primary-text,
		[data-theme='dark'] .primary-800 .primary-text,
		[data-theme='dark'] .primary-900 .primary-text {
			color: #111111;
		}
	}
</style>
