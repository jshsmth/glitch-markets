<script lang="ts">
	/**
	 * Authentication Test Page
	 * Tests Dynamic wallet authentication and Polymarket registration
	 */
	import AuthButton from '$lib/components/Auth/AuthButton.svelte';
	import UserRegistration from '$lib/components/Auth/UserRegistration.svelte';
	import PolymarketAuth from '$lib/components/Auth/PolymarketAuth.svelte';
	import { authState, isAuthenticated } from '$lib/stores/auth.svelte';

	const authenticated = $derived(isAuthenticated());
</script>

<div class="auth-test-page">
	<header>
		<h1>Authentication Test Page</h1>
		<p class="subtitle">Test Dynamic Wallet + Polymarket Integration</p>
	</header>

	<main>
		<section class="test-section">
			<div class="section-header">
				<h2>Step 1: Sign In</h2>
				<span class="status-badge" class:active={authenticated}>
					{authenticated ? '✓ Signed In' : '○ Not Signed In'}
				</span>
			</div>
			<p class="description">
				Click "Sign In" to authenticate with Dynamic. You can use email + OTP or social login
				(Google, Twitter).
			</p>
			<AuthButton />

			{#if authenticated && authState.user}
				<div class="user-info-panel">
					<h3>User Info</h3>
					<dl>
						<dt>Email:</dt>
						<dd>{authState.user.email || 'N/A'}</dd>

						<dt>User ID:</dt>
						<dd class="mono">{authState.user.id || 'N/A'}</dd>
					</dl>
				</div>
			{/if}
		</section>

		{#if authenticated}
			<section class="test-section">
				<div class="section-header">
					<h2>Step 2: User Registration & Server Wallet</h2>
					<span class="status-badge active">✓ Auto-creating</span>
				</div>
				<p class="description">
					Your account and server wallet are created automatically in the background. The server
					wallet is a backend-controlled MPC wallet that will be used for automated Polymarket
					trading without requiring transaction approvals.
				</p>
				<UserRegistration />
			</section>

			<section class="test-section">
				<div class="section-header">
					<h2>Step 3: Enable Polymarket Trading</h2>
					<span class="status-badge info">○ Action Required</span>
				</div>
				<p class="description">
					Sign a one-time message to authorize Polymarket trading. Your credentials will be
					encrypted and stored securely.
				</p>
				<PolymarketAuth />
			</section>
		{/if}

		{#if authenticated}
			<section class="test-section debug">
				<h3>Debug Information</h3>
				<details>
					<summary>View Raw Data</summary>
					<pre>{JSON.stringify(
							{
								isAuthenticated: authenticated,
								user: authState.user
							},
							null,
							2
						)}</pre>
				</details>
			</section>
		{/if}
	</main>
</div>

<style>
	.auth-test-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-0);
		margin: 0 0 0.5rem 0;
	}

	.subtitle {
		font-size: 1.125rem;
		color: var(--text-2);
		margin: 0;
	}

	main {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.test-section {
		background-color: var(--bg-1);
		border: 1px solid var(--bg-4);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.test-section.debug {
		background-color: var(--bg-2);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-0);
		margin: 0;
	}

	h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-0);
		margin: 0 0 1rem 0;
	}

	.status-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		background-color: var(--bg-3);
		color: var(--text-2);
	}

	.status-badge.active {
		background-color: var(--success-bg, #efe);
		color: var(--success-text, #0a0);
	}

	.status-badge.info {
		background-color: var(--info-bg, #eef);
		color: var(--info-text, #00a);
	}

	.description {
		margin: 0 0 1.5rem 0;
		color: var(--text-2);
		line-height: 1.6;
	}

	.user-info-panel {
		margin-top: 1.5rem;
		padding: 1rem;
		background-color: var(--bg-2);
		border-radius: 0.5rem;
	}

	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem 1rem;
		margin: 0;
	}

	dt {
		font-weight: 600;
		color: var(--text-1);
	}

	dd {
		margin: 0;
		color: var(--text-0);
	}

	dd.mono {
		font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
		font-size: 0.875rem;
	}

	details {
		margin-top: 1rem;
	}

	summary {
		cursor: pointer;
		font-weight: 500;
		color: var(--text-1);
		padding: 0.5rem;
		border-radius: 0.25rem;
		transition: background-color 0.2s;
	}

	summary:hover {
		background-color: var(--bg-3);
	}

	pre {
		margin: 1rem 0 0 0;
		padding: 1rem;
		background-color: var(--bg-1);
		border-radius: 0.375rem;
		overflow-x: auto;
		font-size: 0.875rem;
		line-height: 1.5;
	}
</style>
