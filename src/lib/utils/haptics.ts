/**
 * Haptic feedback utilities
 * Provides consistent vibration patterns across the app
 */

import { browser } from '$app/environment';

export function vibrateSuccess() {
	if (browser && 'vibrate' in navigator) {
		navigator.vibrate(50);
	}
}

export function vibrateRemove() {
	if (browser && 'vibrate' in navigator) {
		navigator.vibrate([30, 20, 30]);
	}
}
