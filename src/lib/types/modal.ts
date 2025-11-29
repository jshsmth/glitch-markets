/**
 * Modal component type definitions
 */

/**
 * Props for the base Modal component
 */
export interface ModalProps {
	/** Controls visibility of the modal */
	isOpen: boolean;
	/** Callback when modal should close */
	onClose: () => void;
	/** Optional modal title */
	title?: string;
	/** Show close button (X) - default: true */
	showCloseButton?: boolean;
	/** CSS max-width - default: '480px' */
	maxWidth?: string;
	/** Full screen on mobile - default: true */
	fullScreenMobile?: boolean;
	/** Child content */
	children?: import('svelte').Snippet;
}

/**
 * Props for the SignInModal component
 */
export interface SignInModalProps {
	/** Controls visibility of the modal */
	isOpen: boolean;
	/** Callback when modal should close */
	onClose: () => void;
}

/**
 * Social authentication providers
 */
export type SocialProvider = 'google' | 'discord';

/**
 * All authentication providers (email + social)
 */
export type AuthProvider = 'email' | SocialProvider;
