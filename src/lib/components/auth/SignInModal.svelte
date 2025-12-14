<script lang="ts">
	import type { SignInModalProps, AuthProvider } from '$lib/types/modal';
	import Modal from '$lib/components/ui/Modal.svelte';
	import EmailOTPForm from './EmailOTPForm.svelte';
	import SocialAuthButtons from './SocialAuthButtons.svelte';
	import { authState } from '$lib/stores/auth.svelte';

	let { isOpen, onClose, initialMode = 'signin' }: SignInModalProps = $props();

	let isAuthenticating = $state<AuthProvider | null>(null);
	let errorMessage = $state<string | null>(null);
	let showSocialButtons = $state(true);

	function resetModalState() {
		errorMessage = null;
		isAuthenticating = null;
		showSocialButtons = true;
	}

	function handleModalClose() {
		resetModalState();
		onClose();
	}

	function handleEmailAuthChange(isAuth: boolean) {
		isAuthenticating = isAuth ? 'email' : null;
	}

	function handleSocialAuthChange(provider: AuthProvider | null) {
		isAuthenticating = provider;
	}

	function handleError(message: string | null) {
		errorMessage = message;
	}

	$effect(() => {
		if (isOpen && authState.session) {
			onClose();
		}
	});
</script>

<Modal {isOpen} onClose={handleModalClose} title="Welcome to Glitch Markets">
	<div class="modal-subtitle">Sign in or create your account to get started</div>
	<div class="sign-in-content">
		<EmailOTPForm {initialMode} onAuthStateChange={handleEmailAuthChange} onError={handleError} />

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
		font-size: 15px;
		font-weight: 400;
		margin-top: 0;
		margin-bottom: 28px;
		padding-top: 20px;
		line-height: 1.6;
	}

	.sign-in-content {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 16px;
		margin: 8px 0;
	}

	.divider-line {
		flex: 1;
		height: 1px;
		background: linear-gradient(
			to right,
			transparent,
			var(--bg-4) 20%,
			var(--bg-4) 80%,
			transparent
		);
	}

	.divider-text {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.error-message {
		padding: 14px 18px;
		background: color-mix(in srgb, var(--danger) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--danger) 40%, transparent);
		border-radius: 10px;
		color: var(--danger);
		font-size: 14px;
		font-weight: 500;
		text-align: center;
		line-height: 1.5;
	}

	.privacy-text {
		font-size: 12.5px;
		color: var(--text-3);
		text-align: center;
		margin: 4px 0 0 0;
		line-height: 1.6;
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
