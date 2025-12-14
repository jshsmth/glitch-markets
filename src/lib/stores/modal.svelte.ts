/**
 * Global modal state management
 * Provides centralized control for modals that need to be rendered at the root level
 */

export const signInModalState = $state({
	isOpen: false,
	initialMode: 'signin' as 'signin' | 'signup'
});

export function openSignInModal(mode: 'signin' | 'signup' = 'signin') {
	signInModalState.isOpen = true;
	signInModalState.initialMode = mode;
}

export function closeSignInModal() {
	signInModalState.isOpen = false;
}

export const depositModalState = $state({
	isOpen: false
});

export function openDepositModal() {
	depositModalState.isOpen = true;
}

export function closeDepositModal() {
	depositModalState.isOpen = false;
}

export const withdrawModalState = $state({
	isOpen: false
});

export function openWithdrawModal() {
	withdrawModalState.isOpen = true;
}

export function closeWithdrawModal() {
	withdrawModalState.isOpen = false;
}
