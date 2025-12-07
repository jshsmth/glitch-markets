/**
 * Global modal state management
 * Provides centralized control for modals that need to be rendered at the root level
 */

export const signInModalState = $state({
	isOpen: false
});

export function openSignInModal() {
	signInModalState.isOpen = true;
}

export function closeSignInModal() {
	signInModalState.isOpen = false;
}
