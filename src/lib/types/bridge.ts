/**
 * Client-side type definitions for bridge/deposit functionality
 * These mirror the server types but are available for frontend use
 */

/**
 * Token information for a supported bridge asset
 */
export interface BridgeToken {
	name: string;
	symbol: string;
	address: string;
	decimals: number;
}

/**
 * A single supported asset for bridging from a specific chain
 */
export interface SupportedAsset {
	chainId: string;
	chainName: string;
	token: BridgeToken;
	minCheckoutUsd: number;
}

/**
 * Response from GET /api/bridge/supported-assets endpoint
 */
export interface SupportedAssetsResponse {
	supportedAssets: SupportedAsset[];
}

/**
 * Deposit addresses grouped by chain type
 */
export interface DepositAddressMap {
	evm?: string;
	svm?: string;
	btc?: string;
}

/**
 * Response from POST /api/bridge/deposit endpoint
 */
export interface DepositAddressResponse {
	address: DepositAddressMap;
	note?: string;
}

/**
 * Chain type for deposit address selection
 */
export type ChainType = 'evm' | 'svm' | 'btc';

/**
 * Determines the chain type from a chain ID
 */
export function determineChainType(chainId: string): ChainType {
	const lowerId = chainId.toLowerCase();
	if (lowerId === 'bitcoin' || lowerId === 'btc') return 'btc';
	if (lowerId === 'solana' || lowerId === 'sol') return 'svm';
	return 'evm'; // Default to EVM for Ethereum, Polygon, etc.
}
