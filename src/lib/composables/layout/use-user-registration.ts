import { refreshProfile } from '$lib/stores/auth.svelte';

export async function handleUserRegistration() {
	try {
		const response = await fetch('/api/auth/register', { method: 'POST' });

		if (!response.ok) {
			return;
		}

		refreshProfile();
	} catch {
		// Silent fail - user can still use the app
	}
}
