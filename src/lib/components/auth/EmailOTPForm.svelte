<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import EmailIcon from '$lib/components/icons/EmailIcon.svelte';

	const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	interface Props {
		/**
		 * Initial mode - 'signin' or 'signup'
		 */
		initialMode?: 'signin' | 'signup';

		/**
		 * Callback when authentication succeeds
		 */
		onSuccess?: () => void;

		/**
		 * Callback to set authentication state
		 */
		onAuthStateChange?: (isAuthenticating: boolean) => void;

		/**
		 * Callback to set error message
		 */
		onError?: (message: string | null) => void;
	}

	let { initialMode = 'signin', onSuccess, onAuthStateChange, onError }: Props = $props();

	let isAuthenticating = $state(false);
	let emailAddress = $state('');
	let password = $state('');
	// svelte-ignore state_referenced_locally
	let isSignUp = $state(initialMode === 'signup');
	let emailSent = $state(false);
	let sentToEmail = $state('');

	function isValidEmail(email: string): boolean {
		return EMAIL_PATTERN.test(email);
	}

	function setAuthenticating(value: boolean) {
		isAuthenticating = value;
		onAuthStateChange?.(value);
	}

	async function handleSignUp() {
		if (!browser || !emailAddress.trim() || !password.trim()) {
			onError?.('Please enter both email and password.');
			return;
		}

		if (!isValidEmail(emailAddress.trim())) {
			onError?.('Please enter a valid email address.');
			return;
		}

		if (password.length < 6) {
			onError?.('Password must be at least 6 characters.');
			return;
		}

		setAuthenticating(true);
		onError?.(null);

		try {
			const supabase = $page.data.supabase;
			const email = emailAddress.trim();

			const { error } = await supabase.auth.signUp({
				email,
				password: password.trim(),
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback`
				}
			});

			if (error) throw error;

			sentToEmail = email;
			emailSent = true;
		} catch (err) {
			console.error('[EmailOTPForm] Sign up failed:', err);
			const error = err as { message?: string };
			onError?.(error.message || 'Failed to create account. Please try again.');
		} finally {
			setAuthenticating(false);
		}
	}

	async function handleSignIn() {
		if (!browser || !emailAddress.trim() || !password.trim()) {
			onError?.('Please enter both email and password.');
			return;
		}

		if (!isValidEmail(emailAddress.trim())) {
			onError?.('Please enter a valid email address.');
			return;
		}

		setAuthenticating(true);
		onError?.(null);

		try {
			const supabase = $page.data.supabase;

			const { error } = await supabase.auth.signInWithPassword({
				email: emailAddress.trim(),
				password: password.trim()
			});

			if (error) throw error;

			onSuccess?.();
		} catch (err) {
			console.error('[EmailOTPForm] Sign in failed:', err);
			const error = err as { message?: string };
			onError?.(error.message || 'Invalid email or password.');
		} finally {
			setAuthenticating(false);
		}
	}

	async function handleSubmit() {
		if (isSignUp) {
			await handleSignUp();
		} else {
			await handleSignIn();
		}
	}

	let emailButtonText = $derived(
		isAuthenticating
			? isSignUp
				? 'Creating account...'
				: 'Signing in...'
			: isSignUp
				? 'Create Account'
				: 'Sign In'
	);
</script>

{#if emailSent}
	<div class="email-sent">
		<div class="email-sent-icon">
			<EmailIcon size={48} />
		</div>
		<h3 class="email-sent-title">Check your email</h3>
		<p class="email-sent-message">
			We've sent a confirmation link to <strong>{sentToEmail}</strong>. Click the link in the email
			to verify your account.
		</p>
		<button
			class="auth-button secondary"
			onclick={() => {
				emailSent = false;
				emailAddress = '';
				password = '';
			}}
		>
			Back to sign in
		</button>
	</div>
{:else}
	<div class="email-form">
		<label for="email-input" class="sr-only">Email address</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			id="email-input"
			type="email"
			placeholder="Enter your email"
			bind:value={emailAddress}
			disabled={isAuthenticating}
			class="email-input"
			autofocus
			autocomplete="email"
			aria-label="Email address"
			onkeydown={(e) => {
				if (e.key === 'Enter' && password.trim()) {
					handleSubmit();
				}
			}}
		/>
		<label for="password-input" class="sr-only">Password</label>
		<input
			id="password-input"
			type="password"
			placeholder="Enter your password"
			bind:value={password}
			disabled={isAuthenticating}
			class="email-input"
			autocomplete={isSignUp ? 'new-password' : 'current-password'}
			aria-label="Password"
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					handleSubmit();
				}
			}}
		/>
		<button
			class="auth-button primary"
			onclick={handleSubmit}
			disabled={isAuthenticating || !emailAddress.trim() || !password.trim()}
			aria-busy={isAuthenticating}
		>
			{#if isAuthenticating}
				<div class="spinner"></div>
			{:else}
				<EmailIcon size={22} />
			{/if}
			<span>{emailButtonText}</span>
		</button>
		<button
			class="toggle-mode-button"
			type="button"
			onclick={() => {
				isSignUp = !isSignUp;
				onError?.(null);
			}}
			disabled={isAuthenticating}
		>
			{isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
		</button>
	</div>
{/if}

<style>
	.email-sent {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 16px;
		padding: 24px 0;
	}

	.email-sent-icon {
		color: var(--primary);
		opacity: 0.9;
	}

	.email-sent-title {
		font-size: 20px;
		font-weight: 600;
		color: var(--text-0);
		margin: 0;
	}

	.email-sent-message {
		font-size: 14px;
		color: var(--text-2);
		margin: 0;
		line-height: 1.5;
	}

	.email-sent-message strong {
		color: var(--text-1);
	}

	.email-form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.email-input {
		width: 100%;
		padding: 15px 18px;
		border: 1.5px solid var(--bg-4);
		border-radius: 10px;
		background: var(--bg-1);
		color: var(--text-0);
		font-size: 16px;
		line-height: 1.5;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.email-input:focus {
		outline: none;
		border-color: var(--primary);
		background: var(--bg-0);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 12%, transparent);
	}

	.email-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.email-input::placeholder {
		color: var(--text-3);
		font-weight: 400;
	}

	.auth-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 16px 24px;
		border: none;
		border-radius: 10px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		height: 54px;
		width: 100%;
	}

	.auth-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
		filter: saturate(0.8);
	}

	.auth-button:not(:disabled):hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-button-lift);
	}

	.auth-button:not(:disabled):active {
		transform: translateY(0);
	}

	.auth-button.primary {
		background: var(--primary);
		color: white;
		box-shadow: 0 2px 8px color-mix(in srgb, var(--primary) 25%, transparent);
	}

	.auth-button.primary:not(:disabled):hover {
		background: var(--primary-hover);
		box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 35%, transparent);
	}

	.auth-button.secondary {
		background: var(--bg-2);
		color: var(--text-1);
		border: 1px solid var(--bg-4);
	}

	.auth-button.secondary:not(:disabled):hover {
		background: var(--bg-3);
		color: var(--text-0);
	}

	.toggle-mode-button {
		background: none;
		border: none;
		color: var(--text-2);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		padding: 12px 8px;
		margin-top: 4px;
		transition: color 0.2s;
		text-align: center;
	}

	.toggle-mode-button:hover {
		color: var(--primary);
	}

	.toggle-mode-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (min-width: 768px) {
		.auth-button {
			height: 52px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.auth-button {
			transition: none;
		}

		.spinner {
			animation: none;
			border-top-color: currentColor;
		}
	}
</style>
