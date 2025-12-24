/**
 * Global modal state management
 * Provides centralized control for modals that need to be rendered at the root level
 */

/**
 * Creates a reactive modal state with open/close functions
 * @param defaultState - Additional state properties for the modal
 * @returns Modal state object with isOpen property and open/close methods
 */
function createModalState<T extends Record<string, unknown> = Record<string, never>>(
	defaultState: T = {} as T
) {
	const state = $state({ isOpen: false, ...defaultState });

	return {
		get state() {
			return state;
		},
		open: (updates?: Partial<T>) => {
			state.isOpen = true;
			if (updates) {
				Object.assign(state, updates);
			}
		},
		close: () => {
			state.isOpen = false;
		}
	};
}

// Sign-in modal with initial mode state
const signInModal = createModalState({ initialMode: 'signin' as 'signin' | 'signup' });

export const signInModalState = signInModal.state;
export function openSignInModal(mode: 'signin' | 'signup' = 'signin') {
	signInModal.open({ initialMode: mode });
}
export function closeSignInModal() {
	signInModal.close();
}

// Deposit modal
const depositModal = createModalState();

export const depositModalState = depositModal.state;
export function openDepositModal() {
	depositModal.open();
}
export function closeDepositModal() {
	depositModal.close();
}

// Withdraw modal
const withdrawModal = createModalState();

export const withdrawModalState = withdrawModal.state;
export function openWithdrawModal() {
	withdrawModal.open();
}
export function closeWithdrawModal() {
	withdrawModal.close();
}
