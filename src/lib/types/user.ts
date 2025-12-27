/**
 * User-related types for API responses
 */

export interface UserProfile {
	id: string;
	email: string | null;
	serverWalletAddress: string | null;
	proxyWalletAddress: string | null;
	isRegistered: boolean;
}

export interface Order {
	id: string;
	market: string;
	side: 'BUY' | 'SELL';
	type: 'LIMIT' | 'MARKET';
	price: number;
	size: number;
	filled: number;
	remaining: number;
	status: 'OPEN' | 'PARTIALLY_FILLED';
	timestamp: number;
	outcome: string;
	icon: string;
	eventSlug: string;
}
