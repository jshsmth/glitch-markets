<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import EmailIcon from '$lib/components/icons/EmailIcon.svelte';
	import AuthButton from '$lib/components/ui/AuthButton.svelte';
	import { Logger } from '$lib/utils/logger';
	import { getErrorMessage } from '$lib/utils/error';

	const log = Logger.forComponent('EmailOTPForm');
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
		if (!browser) return;

		const email = emailAddress.trim();
		const pwd = password.trim();

		if (!email || !pwd) {
			onError?.('Please enter both email and password.');
			return;
		}

		if (!isValidEmail(email)) {
			onError?.('Please enter a valid email address.');
			return;
		}

		if (pwd.length < 6) {
			onError?.('Password must be at least 6 characters.');
			return;
		}

		setAuthenticating(true);
		onError?.(null);

		try {
			const supabase = $page.data.supabase;

			const { error } = await supabase.auth.signUp({
				email,
				password: pwd,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback`
				}
			});

			if (error) throw error;

			sentToEmail = email;
			emailSent = true;
		} catch (err) {
			log.error('Sign up failed', err);
			onError?.(getErrorMessage(err, 'Failed to create account. Please try again.'));
		} finally {
			setAuthenticating(false);
		}
	}

	async function handleSignIn() {
		if (!browser) return;

		const email = emailAddress.trim();
		const pwd = password.trim();

		if (!email || !pwd) {
			onError?.('Please enter both email and password.');
			return;
		}

		if (!isValidEmail(email)) {
			onError?.('Please enter a valid email address.');
			return;
		}

		setAuthenticating(true);
		onError?.(null);

		try {
			const supabase = $page.data.supabase;

			const { error } = await supabase.auth.signInWithPassword({
				email,
				password: pwd
			});

			if (error) throw error;

			onSuccess?.();
		} catch (err) {
			log.error('Sign in failed', err);
			onError?.(getErrorMessage(err, 'Invalid email or password.'));
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
		<AuthButton
			variant="secondary"
			onclick={() => {
				emailSent = false;
				emailAddress = '';
				password = '';
			}}
		>
			Back to sign in
		</AuthButton>
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
		<AuthButton
			variant="primary"
			onclick={handleSubmit}
			disabled={isAuthenticating || !emailAddress.trim() || !password.trim()}
			loading={isAuthenticating}
			ariaBusy={isAuthenticating}
		>
			{#snippet icon()}
				<EmailIcon size={22} />
			{/snippet}
			<span>{emailButtonText}</span>
		</AuthButton>
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
</style>
