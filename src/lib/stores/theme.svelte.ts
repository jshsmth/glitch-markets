/**
 * Theme store for dark/light mode (Svelte 5 Runes version)
 * Provides reactive access to theme state throughout the app
 */

import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

/**
 * Theme state using Svelte 5 runes
 */
export const themeState = $state({
	current: (browser ? (localStorage.getItem('theme') as Theme) || 'dark' : 'dark') as Theme
});

/**
 * Initialize theme from localStorage and apply to document
 * Call this once on app initialization
 */
export function initializeTheme() {
	if (!browser) return;

	const storedTheme = localStorage.getItem('theme') as Theme | null;
	themeState.current = storedTheme || 'dark';

	applyTheme(themeState.current);
}

/**
 * Toggle between light and dark theme
 */
export function toggleTheme() {
	if (!browser) return;

	const newTheme = themeState.current === 'dark' ? 'light' : 'dark';
	themeState.current = newTheme;

	localStorage.setItem('theme', newTheme);
	applyTheme(newTheme);
}

/**
 * Set specific theme
 */
export function setTheme(theme: Theme) {
	if (!browser) return;

	themeState.current = theme;

	localStorage.setItem('theme', theme);
	applyTheme(theme);
}

/**
 * Apply theme data attribute to document
 */
function applyTheme(theme: Theme) {
	if (!browser) return;

	document.documentElement.setAttribute('data-theme', theme);
}
