<script lang="ts">
	import type { SignInModalProps, AuthProvider } from '$lib/types/modal';
	import type { OTPVerification } from '@dynamic-labs-sdk/client';
	import Modal from '$lib/components/ui/Modal.svelte';
	import EmailIcon from '$lib/components/icons/EmailIcon.svelte';
	import GoogleIcon from '$lib/components/icons/GoogleIcon.svelte';
	import DiscordIcon from '$lib/components/icons/DiscordIcon.svelte';
	import { authenticateWithSocial, sendEmailOTP, verifyOTP } from '@dynamic-labs-sdk/client';
	import { authState } from '$lib/stores/auth.svelte';
	import { browser } from '$app/environment';

	// Constants
	const OTP_CODE_LENGTH = 6;
	const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const DEV = import.meta.env.DEV;

	let { isOpen, onClose }: SignInModalProps = $props();

	let isAuthenticating = $state<AuthProvider | null>(null);
	let errorMessage = $state<string | null>(null);

	// Email OTP flow state
	let emailStep = $state<'input' | 'verify'>('input');
	let emailAddress = $state('');
	let otpCode = $state('');
	let otpVerification = $state<OTPVerification | null>(null);

	function isValidEmail(email: string): boolean {
		return EMAIL_PATTERN.test(email);
	}

	function resetModalState() {
		errorMessage = null;
		isAuthenticating = null;
		emailStep = 'input';
		emailAddress = '';
		otpCode = '';
		otpVerification = null;
	}

	function handleModalClose() {
		resetModalState();
		onClose();
	}

	// Auto-close modal when user successfully authenticates
	$effect(() => {
		if (isOpen && authState.user) {
			// User just authenticated, close the modal
			onClose();
		}
	});

	async function handleSendEmailOTP() {
		if (!browser || !emailAddress.trim()) {
			errorMessage = 'Please enter a valid email address.';
			return;
		}

		// Validate email format
		if (!isValidEmail(emailAddress.trim())) {
			errorMessage = 'Please enter a valid email address.';
			return;
		}

		// Check if Dynamic client is initialized
		if (!authState.client) {
			errorMessage =
				'Authentication service is still initializing. Please wait a moment and try again.';
			return;
		}

		isAuthenticating = 'email';
		errorMessage = null;

		try {
			if (DEV) {
				console.log('[SignInModal] Attempting to send email OTP to:', emailAddress.trim());
				console.log('[SignInModal] Dynamic client state:', $state.snapshot(authState.client));
			}

			// Explicitly pass the client
			otpVerification = await sendEmailOTP(
				{ email: emailAddress.trim() },
				authState.client || undefined
			);

			if (DEV) {
				console.log('[SignInModal] OTP sent successfully, verification object:', otpVerification);
			}
			emailStep = 'verify';
		} catch (err) {
			console.error('[SignInModal] Email OTP send failed:', err);

			// Parse error and provide helpful message
			let userMessage = 'Failed to send verification code.';

			// Try to extract error message from response
			// Note: Response body might be consumed, so we catch that gracefully
			try {
				const errorObj = err as unknown;

				// Check if we can get the response text (might fail if already consumed)
				if (errorObj instanceof Response && !errorObj.bodyUsed) {
					const responseText = await errorObj.text();
					if (DEV) {
						console.error('[SignInModal] Response body:', responseText);
					}

					try {
						const responseJson = JSON.parse(responseText);
						if (responseJson.error) {
							// Handle specific error messages
							if (
								responseJson.error.toLowerCase().includes('invalid email') ||
								responseJson.error.toLowerCase().includes('email address')
							) {
								userMessage =
									'Invalid email address. Temporary or disposable email addresses are not allowed. Please use a valid personal or work email.';
							} else {
								userMessage = `Error: ${responseJson.error}`;
							}
						}
					} catch {
						// Not JSON
					}
				}
			} catch (parseErr) {
				// Body was already consumed or other error, continue with fallback messages
				if (DEV) {
					console.warn('[SignInModal] Could not parse error response:', parseErr);
				}
			}

			// Fallback error messages if we couldn't parse the response
			const errorObj = err as Record<string, unknown>;
			if (userMessage === 'Failed to send verification code.') {
				if (errorObj?.status === 422) {
					userMessage =
						'Invalid email address. Please use a valid personal or work email (temporary emails are not allowed).';
				} else if (
					typeof errorObj?.message === 'string' &&
					errorObj.message.includes('not enabled')
				) {
					userMessage = 'Email authentication is not enabled. Please try another sign-in method.';
				} else if (
					typeof errorObj?.message === 'string' &&
					errorObj.message.includes('rate limit')
				) {
					userMessage = 'Too many attempts. Please wait 10 minutes and try again.';
				} else if (typeof errorObj?.message === 'string') {
					userMessage = `Error: ${errorObj.message}`;
				} else if (errorObj?.status) {
					userMessage = `Error ${errorObj.status}: Unable to send verification code. Please try Google sign-in.`;
				}
			}

			errorMessage = userMessage;
		} finally {
			isAuthenticating = null;
		}
	}

	async function handleVerifyOTP() {
		if (!browser || !otpCode.trim()) {
			errorMessage = 'Please enter the verification code.';
			return;
		}

		if (!otpVerification) {
			errorMessage = 'Verification session expired. Please request a new code.';
			handleBackToEmail();
			return;
		}

		isAuthenticating = 'email';
		errorMessage = null;

		try {
			// Explicitly pass the client
			await verifyOTP(
				{ otpVerification, verificationToken: otpCode.trim() },
				authState.client || undefined
			);
			// Auth successful - modal will auto-close via $effect when authState.user updates
		} catch (err) {
			if (DEV) {
				console.error('[SignInModal] OTP verification failed:', err);
			}
			errorMessage = 'Invalid verification code. Please try again.';
		} finally {
			isAuthenticating = null;
		}
	}

	function handleBackToEmail() {
		emailStep = 'input';
		otpCode = '';
		errorMessage = null;
		otpVerification = null;
	}

	async function handleSocialAuth(provider: 'google' | 'discord') {
		if (!browser) return;

		// Check if Dynamic client is initialized
		if (!authState.client) {
			errorMessage =
				'Authentication service is still initializing. Please wait a moment and try again.';
			return;
		}

		isAuthenticating = provider;
		errorMessage = null;

		try {
			const redirectUrl = window.location.origin + window.location.pathname;
			if (DEV) {
				console.log(`[SignInModal] Initiating ${provider} OAuth with redirect:`, redirectUrl);
			}

			// Type assertion needed as Farcaster may not be in the SDK's type yet
			await authenticateWithSocial(
				{
					provider: provider as 'google',
					redirectUrl
				},
				authState.client
			);

			// User will be redirected to OAuth provider
			// Modal will auto-close when user returns and auth completes (handled by +layout.svelte)
			if (DEV) {
				console.log(`[SignInModal] OAuth redirect initiated for ${provider}`);
			}
		} catch (err) {
			if (DEV) {
				console.error(`[SignInModal] ${provider} auth failed:`, err);
			}

			// Parse error for better user feedback
			const errorObj = err as Record<string, unknown>;
			let userMessage = `Failed to authenticate with ${provider}.`;

			if (typeof errorObj?.message === 'string' && errorObj.message.includes('not enabled')) {
				userMessage = `${provider} authentication is not enabled. Please try another sign-in method.`;
			} else if (typeof errorObj?.message === 'string') {
				userMessage = `Error: ${errorObj.message}`;
			}

			errorMessage = userMessage;
			isAuthenticating = null;
		}
	}

	// Derived button text for cleaner templates
	let emailButtonText = $derived(
		isAuthenticating === 'email' ? 'Sending code...' : 'Continue with Email'
	);
	let googleButtonText = $derived(
		isAuthenticating === 'google' ? 'Authenticating...' : 'Continue with Google'
	);
	let discordButtonText = $derived(
		isAuthenticating === 'discord' ? 'Authenticating...' : 'Continue with Discord'
	);
</script>

<Modal {isOpen} onClose={handleModalClose} title="Welcome to Glitch Markets">
	<div class="modal-subtitle">Sign in or create your account to get started</div>
	<div class="sign-in-content">
		{#if emailStep === 'input'}
			<!-- Email input form -->
			<div class="email-form">
				<!-- svelte-ignore a11y_autofocus -->
				<input
					type="email"
					placeholder="Enter your email"
					bind:value={emailAddress}
					disabled={isAuthenticating !== null}
					class="email-input"
					autofocus
					autocomplete="email"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							handleSendEmailOTP();
						}
					}}
				/>
				<button
					class="auth-button primary"
					onclick={handleSendEmailOTP}
					disabled={isAuthenticating !== null || !emailAddress.trim()}
					aria-busy={isAuthenticating === 'email'}
				>
					{#if isAuthenticating === 'email'}
						<div class="spinner"></div>
					{:else}
						<EmailIcon size={22} />
					{/if}
					<span>{emailButtonText}</span>
				</button>
			</div>
		{:else}
			<!-- OTP verification form -->
			<div class="otp-form">
				<p class="otp-instruction">
					Enter the verification code sent to <strong>{emailAddress}</strong>
				</p>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					type="text"
					placeholder="Enter 6-digit code"
					bind:value={otpCode}
					disabled={isAuthenticating !== null}
					class="otp-input"
					maxlength={OTP_CODE_LENGTH}
					inputmode="numeric"
					pattern="[0-9]*"
					autocomplete="one-time-code"
					autofocus
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							handleVerifyOTP();
						}
					}}
				/>
				<button
					class="auth-button primary"
					onclick={handleVerifyOTP}
					disabled={isAuthenticating !== null || !otpCode.trim()}
					aria-busy={isAuthenticating === 'email'}
				>
					{#if isAuthenticating === 'email'}
						<div class="spinner"></div>
					{:else}
						<span>Verify Code</span>
					{/if}
				</button>
				<button
					class="back-button"
					onclick={handleBackToEmail}
					disabled={isAuthenticating !== null}
				>
					← Back to email
				</button>
			</div>
		{/if}

		<!-- Only show divider and social buttons on initial email input step -->
		{#if emailStep === 'input'}
			<!-- Divider -->
			<div class="divider">
				<span class="divider-line"></span>
				<span class="divider-text">or</span>
				<span class="divider-line"></span>
			</div>

			<!-- Social buttons -->
			<button
				class="auth-button google"
				onclick={() => handleSocialAuth('google')}
				disabled={isAuthenticating !== null}
				aria-busy={isAuthenticating === 'google'}
			>
				{#if isAuthenticating === 'google'}
					<div class="spinner"></div>
				{:else}
					<GoogleIcon size={20} />
				{/if}
				<span>{googleButtonText}</span>
			</button>

			<button
				class="auth-button discord"
				onclick={() => handleSocialAuth('discord')}
				disabled={isAuthenticating !== null}
				aria-busy={isAuthenticating === 'discord'}
			>
				{#if isAuthenticating === 'discord'}
					<div class="spinner"></div>
				{:else}
					<DiscordIcon size={20} />
				{/if}
				<span>{discordButtonText}</span>
			</button>
		{/if}

		<!-- Error message -->
		{#if errorMessage}
			<div class="error-message" role="alert" aria-live="polite">
				{errorMessage}
			</div>
		{/if}

		<!-- Privacy text -->
		{#if emailStep === 'input'}
			<p class="privacy-text">
				By continuing, you agree to our <a href="/terms" target="_blank" rel="noopener noreferrer"
					>Terms of Service</a
				>
				and
				<a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
			</p>
		{/if}
	</div>
</Modal>

<style>
	.modal-subtitle {
		color: var(--text-2);
		font-size: 14px;
		margin-top: -16px;
		margin-bottom: 24px;
		line-height: 1.5;
	}

	.sign-in-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.email-form,
	.otp-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.email-input,
	.otp-input {
		width: 100%;
		padding: 14px 16px;
		border: 1px solid var(--bg-4);
		border-radius: 8px;
		background: var(--bg-0);
		color: var(--text-0);
		font-size: 16px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.email-input:focus,
	.otp-input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 10%, transparent);
	}

	.email-input:disabled,
	.otp-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.email-input::placeholder {
		color: var(--text-3);
	}

	.otp-input::placeholder {
		color: var(--text-3);
		font-size: 14px;
		letter-spacing: normal;
		font-weight: 400;
	}

	.otp-instruction {
		font-size: 14px;
		color: var(--text-1);
		text-align: center;
		margin: 0;
		line-height: 1.5;
	}

	.otp-instruction strong {
		color: var(--text-0);
	}

	.otp-input {
		text-align: center;
		font-size: 24px;
		letter-spacing: 0.5em;
		font-weight: 600;
		padding-left: 1em;
	}

	/* Remove letter spacing when empty (showing placeholder) */
	.otp-input:placeholder-shown {
		letter-spacing: normal;
		padding-left: 16px;
		text-align: left;
	}

	.back-button {
		background: none;
		border: none;
		color: var(--text-2);
		font-size: 14px;
		cursor: pointer;
		padding: 8px;
		transition: color 0.2s;
		text-align: center;
	}

	.back-button:hover {
		color: var(--text-0);
	}

	.back-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.auth-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 14px 24px;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		height: 52px;
		width: 100%;
	}

	.auth-button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.auth-button:not(:disabled):hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px color-mix(in srgb, var(--text-0) 10%, transparent);
	}

	.auth-button:not(:disabled):active {
		transform: translateY(0);
	}

	.auth-button.primary {
		background: var(--primary);
		color: var(--text-0);
	}

	.auth-button.primary:not(:disabled):hover {
		background: var(--primary-hover);
	}

	.auth-button.google {
		background: #000000;
		color: #ffffff;
	}

	.auth-button.google:not(:disabled):hover {
		background: #1a1a1a;
	}

	.auth-button.discord {
		background: #5865f2;
		color: #ffffff;
	}

	.auth-button.discord:not(:disabled):hover {
		background: #4752c4;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 16px;
		margin: 4px 0;
	}

	.divider-line {
		flex: 1;
		height: 1px;
		background: var(--bg-4);
	}

	.divider-text {
		font-size: 14px;
		font-weight: 400;
		color: var(--text-2);
	}

	.error-message {
		padding: 12px 16px;
		background: color-mix(in srgb, var(--danger) 10%, transparent);
		border: 1px solid var(--danger);
		border-radius: 8px;
		color: var(--danger);
		font-size: 14px;
		text-align: center;
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

	.privacy-text {
		font-size: 12px;
		color: var(--text-3);
		text-align: center;
		margin: var(--spacing-2) 0 0 0;
		line-height: 1.5;
	}

	.privacy-text a {
		color: var(--primary);
		text-decoration: none;
		transition: color 0.2s;
	}

	.privacy-text a:hover {
		color: var(--primary-hover);
		text-decoration: underline;
	}

	/* Desktop sizing */
	@media (min-width: 768px) {
		.auth-button {
			height: 50px;
		}
	}

	/* Respect reduced motion preference */
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
