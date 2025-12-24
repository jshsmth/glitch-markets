/**
 * Toast notification store
 * Manages toast messages for user feedback
 */

export interface Toast {
	id: string;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error';
	duration?: number;
}

interface ToastState {
	toasts: Toast[];
}

const state = $state<ToastState>({
	toasts: []
});

let nextId = 0;

/**
 * Show a toast notification
 */
export function showToast(
	message: string,
	type: Toast['type'] = 'info',
	duration: number = 5000
): string {
	const id = `toast-${nextId++}`;
	const toast: Toast = { id, message, type, duration };

	state.toasts = [...state.toasts, toast];

	if (duration > 0) {
		setTimeout(() => {
			dismissToast(id);
		}, duration);
	}

	return id;
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(id: string): void {
	state.toasts = state.toasts.filter((t) => t.id !== id);
}

/**
 * Clear all toasts
 */
export function clearToasts(): void {
	state.toasts = [];
}

/**
 * Toast state - reactive access to all toasts
 */
export const toastState = {
	get toasts() {
		return state.toasts;
	}
};
