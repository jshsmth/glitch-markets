/**
 * Theme store for dark/light mode (Svelte 5 Runes version)
 * Provides reactive access to theme state throughout the app
 */

import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

/**
 * Theme state using Svelte 5 runes
 * On SSR: defaults to 'dark'
 * On client: will be synced by initializeTheme() which runs in onMount
 */
export const themeState = $state({
	current: 'dark' as Theme
});

/**
 * Initialize theme - reads the theme from DOM (set by inline script in app.html)
 * This MUST be called synchronously during component initialization
 */
export function initializeTheme() {
	if (!browser) return;

	// Read theme from data-theme attribute (set by inline script)
	const currentTheme = document.documentElement.getAttribute('data-theme') as Theme | null;

	if (currentTheme === 'light' || currentTheme === 'dark') {
		themeState.current = currentTheme;
	}
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
