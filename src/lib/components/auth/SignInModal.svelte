<script lang="ts">
	import type { SignInModalProps, AuthProvider } from '$lib/types/modal';
	import Modal from '$lib/components/ui/Modal.svelte';
	import EmailOTPForm from './EmailOTPForm.svelte';
	import SocialAuthButtons from './SocialAuthButtons.svelte';
	import { authState } from '$lib/stores/auth.svelte';

	let { isOpen, onClose }: SignInModalProps = $props();

	let isAuthenticating = $state<AuthProvider | null>(null);
	let errorMessage = $state<string | null>(null);
	let emailFormRef = $state<EmailOTPForm>();
	let showSocialButtons = $state(true);

	function resetModalState() {
		errorMessage = null;
		isAuthenticating = null;
		showSocialButtons = true;
		emailFormRef?.reset();
	}

	function handleModalClose() {
		resetModalState();
		onClose();
	}

	function handleEmailAuthChange(isAuth: boolean) {
		isAuthenticating = isAuth ? 'email' : null;
		// Hide social buttons when email OTP verification is active
		// The EmailOTPForm internally handles email step vs verify step
	}

	function handleSocialAuthChange(provider: AuthProvider | null) {
		isAuthenticating = provider;
	}

	function handleError(message: string | null) {
		errorMessage = message;
	}

	// Auto-close modal when user successfully authenticates
	$effect(() => {
		if (isOpen && authState.user) {
			onClose();
		}
	});
</script>

<Modal {isOpen} onClose={handleModalClose} title="Welcome to Glitch Markets">
	<div class="modal-subtitle">Sign in or create your account to get started</div>
	<div class="sign-in-content">
		<EmailOTPForm
			bind:this={emailFormRef}
			onAuthStateChange={handleEmailAuthChange}
			onError={handleError}
		/>

		{#if showSocialButtons}
			<div class="divider">
				<span class="divider-line"></span>
				<span class="divider-text">or</span>
				<span class="divider-line"></span>
			</div>

			<SocialAuthButtons
				authenticatingProvider={isAuthenticating}
				onAuthStateChange={handleSocialAuthChange}
				onError={handleError}
			/>
		{/if}

		{#if errorMessage}
			<div class="error-message" role="alert" aria-live="polite">
				{errorMessage}
			</div>
		{/if}

		{#if showSocialButtons}
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
</style>
