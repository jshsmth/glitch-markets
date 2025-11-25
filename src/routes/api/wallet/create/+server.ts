/**
 * API Endpoint: Create Embedded Wallet (WaaS)
 * POST /api/wallet/create
 *
 * Creates an embedded wallet for the authenticated user using Dynamic's WaaS API
 * Reference: https://www.dynamic.xyz/docs/api-reference/wallets/create-waas-wallet
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DYNAMIC_ENVIRONMENT_ID, DYNAMIC_API_TOKEN } from '$env/static/private';

// WaaS API base URL
const DYNAMIC_API_BASE = 'https://app.dynamic.xyz/api/v0';

// Supported chains for wallet creation
type WaasChain = 'EVM' | 'SVM' | 'SUI';

interface CreateWalletRequest {
	chains?: WaasChain[];
}

interface CreateWalletResponse {
	user: {
		id: string;
		alias?: string;
		email?: string;
		walletPublicKey?: string;
		verifiedCredentials: Array<{
			id: string;
			address: string;
			chain: string;
			walletName: string;
			walletProvider: string;
		}>;
	};
	status: 'created' | 'existing';
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// 1. Check authentication (JWT verified in hooks.server.ts)
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// 2. Extract user info from locals
		const { userId, email } = locals.user;

		if (!userId) {
			return json({ error: 'User ID not found' }, { status: 400 });
		}

		// 3. Parse request body
		const body = (await request.json()) as CreateWalletRequest;
		const chains = body.chains || ['EVM']; // Default to EVM if not specified

		// 4. Determine identifier type and value
		// Priority: email > user ID
		const identifier = email || userId;
		const identifierType = email ? 'email' : 'id';

		// 5. Call Dynamic WaaS API to create wallet
		const waasResponse = await fetch(
			`${DYNAMIC_API_BASE}/environments/${DYNAMIC_ENVIRONMENT_ID}/waas/create`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${DYNAMIC_API_TOKEN}`
				},
				body: JSON.stringify({
					identifier,
					type: identifierType,
					chains
				})
			}
		);

		// 6. Handle API errors
		if (!waasResponse.ok) {
			const errorData = await waasResponse.json().catch(() => ({}));
			console.error('Dynamic WaaS API error:', {
				status: waasResponse.status,
				statusText: waasResponse.statusText,
				error: errorData
			});

			// Return specific error messages
			if (waasResponse.status === 401) {
				return json({ error: 'Invalid API credentials' }, { status: 500 });
			} else if (waasResponse.status === 403) {
				return json({ error: 'Access denied - check API permissions' }, { status: 500 });
			} else if (waasResponse.status === 422) {
				return json(
					{ error: 'Conflict creating wallet - user may need to be merged' },
					{ status: 422 }
				);
			}

			return json(
				{ error: errorData.message || 'Failed to create wallet' },
				{ status: waasResponse.status }
			);
		}

		// 7. Parse successful response
		const walletData = (await waasResponse.json()) as { user: CreateWalletResponse['user'] };

		// 8. Determine if wallet was newly created or already existed
		const status = waasResponse.status === 201 ? 'created' : 'existing';

		// 9. Extract wallet addresses from verified credentials
		const wallets = walletData.user.verifiedCredentials
			.filter((cred) => cred.walletProvider === 'dynamicWaas')
			.map((cred) => ({
				address: cred.address,
				chain: cred.chain,
				walletName: cred.walletName
			}));

		// 10. Return success response
		const response: CreateWalletResponse = {
			user: walletData.user,
			status
		};

		return json(
			{
				success: true,
				...response,
				wallets,
				message:
					status === 'created'
						? 'Embedded wallet created successfully'
						: 'Embedded wallet already exists'
			},
			{ status: waasResponse.status }
		);
	} catch (error) {
		const errorId = crypto.randomUUID();
		console.error('Wallet creation error:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
			errorCode: 'WALLET_CREATION_FAILED',
			errorId
		});
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error',
				errorId
			},
			{ status: 500 }
		);
	}
};
