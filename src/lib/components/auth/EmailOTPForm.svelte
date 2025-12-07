<script lang="ts">
	import type { OTPVerification } from '@dynamic-labs-sdk/client';
	import { sendEmailOTP, verifyOTP } from '@dynamic-labs-sdk/client';
	import { authState } from '$lib/stores/auth.svelte';
	import { browser } from '$app/environment';
	import EmailIcon from '$lib/components/icons/EmailIcon.svelte';

	const OTP_CODE_LENGTH = 6;
	const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const DEV = import.meta.env.DEV;

	interface Props {
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

	let { onSuccess, onAuthStateChange, onError }: Props = $props();

	let isAuthenticating = $state(false);

	let emailStep = $state<'input' | 'verify'>('input');
	let emailAddress = $state('');
	let otpCode = $state('');
	let otpVerification = $state<OTPVerification | null>(null);

	function isValidEmail(email: string): boolean {
		return EMAIL_PATTERN.test(email);
	}

	function setAuthenticating(value: boolean) {
		isAuthenticating = value;
		onAuthStateChange?.(value);
	}

	async function handleSendEmailOTP() {
		if (!browser || !emailAddress.trim()) {
			onError?.('Please enter a valid email address.');
			return;
		}

		if (!isValidEmail(emailAddress.trim())) {
			onError?.('Please enter a valid email address.');
			return;
		}

		if (!authState.client) {
			onError?.(
				'Authentication service is still initializing. Please wait a moment and try again.'
			);
			return;
		}

		setAuthenticating(true);
		onError?.(null);

		try {
			if (DEV) {
				const maskedEmail = emailAddress.trim().replace(/(.{2}).*(@.*)/, '$1***$2');
				console.log('[EmailOTPForm] Attempting to send email OTP to:', maskedEmail);
				console.log('[EmailOTPForm] Dynamic client initialized:', !!authState.client);
			}

			otpVerification = await sendEmailOTP(
				{ email: emailAddress.trim() },
				authState.client || undefined
			);

			if (DEV) {
				console.log('[EmailOTPForm] OTP sent successfully');
			}
			emailStep = 'verify';
		} catch (err) {
			console.error('[EmailOTPForm] Email OTP send failed:', err);
			let userMessage = 'Failed to send verification code.';

			try {
				const errorObj = err as unknown;
				if (errorObj instanceof Response && !errorObj.bodyUsed) {
					const responseText = await errorObj.text();
					if (DEV) {
						console.error('[EmailOTPForm] Response body:', responseText);
					}

					try {
						const responseJson = JSON.parse(responseText);
						if (responseJson.error) {
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
				if (DEV) {
					console.warn('[EmailOTPForm] Could not parse error response:', parseErr);
				}
			}

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

			onError?.(userMessage);
		} finally {
			setAuthenticating(false);
		}
	}

	async function handleVerifyOTP() {
		if (!browser || !otpCode.trim()) {
			onError?.('Please enter the verification code.');
			return;
		}

		if (!otpVerification) {
			onError?.('Verification session expired. Please request a new code.');
			handleBackToEmail();
			return;
		}

		setAuthenticating(true);
		onError?.(null);

		try {
			await verifyOTP(
				{ otpVerification, verificationToken: otpCode.trim() },
				authState.client || undefined
			);
			onSuccess?.();
		} catch (err) {
			if (DEV) {
				console.error('[EmailOTPForm] OTP verification failed:', err);
			}
			onError?.('Invalid verification code. Please try again.');
		} finally {
			setAuthenticating(false);
		}
	}

	function handleBackToEmail() {
		emailStep = 'input';
		otpCode = '';
		onError?.(null);
		otpVerification = null;
	}

	let emailButtonText = $derived(isAuthenticating ? 'Sending code...' : 'Continue with Email');
</script>

{#if emailStep === 'input'}
	<div class="email-form">
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="email"
			placeholder="Enter your email"
			bind:value={emailAddress}
			disabled={isAuthenticating}
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
			disabled={isAuthenticating || !emailAddress.trim()}
			aria-busy={isAuthenticating}
		>
			{#if isAuthenticating}
				<div class="spinner"></div>
			{:else}
				<EmailIcon size={22} />
			{/if}
			<span>{emailButtonText}</span>
		</button>
	</div>
{:else}
	<div class="otp-form">
		<p class="otp-instruction">
			Enter the verification code sent to <strong>{emailAddress}</strong>
		</p>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="text"
			placeholder="Enter 6-digit code"
			bind:value={otpCode}
			disabled={isAuthenticating}
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
			disabled={isAuthenticating || !otpCode.trim()}
			aria-busy={isAuthenticating}
		>
			{#if isAuthenticating}
				<div class="spinner"></div>
			{:else}
				<span>Verify Code</span>
			{/if}
		</button>
		<button class="back-button" onclick={handleBackToEmail} disabled={isAuthenticating}>
			← Back to email
		</button>
	</div>
{/if}

<style>
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
			height: 50px;
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
