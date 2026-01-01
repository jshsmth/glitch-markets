/**
 * Focus trap action for modal dialogs
 * Traps keyboard focus within the element to ensure accessibility
 */

const FOCUSABLE_SELECTOR =
	'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface FocusTrapParams {
	enabled?: boolean;
}

export function focusTrap(node: HTMLElement, params: FocusTrapParams = {}) {
	let previousFocusElement: HTMLElement | null = null;
	let enabled = params.enabled ?? true;

	function getFocusableElements(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
	}

	function handleTabKey(e: KeyboardEvent) {
		if (!enabled || e.key !== 'Tab') return;

		const focusableElements = getFocusableElements();

		if (focusableElements.length === 0) return;

		const firstFocusable = focusableElements[0];
		const lastFocusable = focusableElements[focusableElements.length - 1];

		if (e.shiftKey && document.activeElement === firstFocusable) {
			e.preventDefault();
			lastFocusable.focus();
		} else if (!e.shiftKey && document.activeElement === lastFocusable) {
			e.preventDefault();
			firstFocusable.focus();
		}
	}

	function activate() {
		if (!enabled) return;

		previousFocusElement = document.activeElement as HTMLElement;

		const focusableElements = getFocusableElements();
		if (focusableElements.length > 0) {
			focusableElements[0].focus();
		}

		document.addEventListener('keydown', handleTabKey);
	}

	function deactivate() {
		document.removeEventListener('keydown', handleTabKey);
		previousFocusElement?.focus();
		previousFocusElement = null;
	}

	activate();

	return {
		update(newParams: FocusTrapParams) {
			const wasEnabled = enabled;
			enabled = newParams.enabled ?? true;

			if (!wasEnabled && enabled) {
				activate();
			} else if (wasEnabled && !enabled) {
				deactivate();
			}
		},
		destroy() {
			deactivate();
		}
	};
}
