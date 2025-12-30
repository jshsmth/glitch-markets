/**
 * Tests for RelayerService
 * Tests gasless transaction execution through Polymarket's relayer
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { RelayerService } from './relayer-service.js';

vi.mock('@polymarket/builder-relayer-client', () => ({
	RelayClient: vi.fn(),
	RelayerTxType: { PROXY: 'PROXY' }
}));
vi.mock('@polymarket/builder-signing-sdk', () => ({
	BuilderConfig: vi.fn()
}));
vi.mock('@ethersproject/wallet', () => ({
	Wallet: vi.fn()
}));
vi.mock('@ethersproject/providers', () => ({
	JsonRpcProvider: vi.fn()
}));
vi.mock('viem');
vi.mock('../utils/encryption.js');
vi.mock('$lib/supabase/admin');
vi.mock('$lib/utils/logger', () => ({
	Logger: {
		forComponent: vi.fn().mockReturnValue({
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn()
		})
	}
}));
vi.mock('$env/static/private', () => ({
	SERVER_WALLET_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
	SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
}));
vi.mock('$env/dynamic/private', () => ({
	env: {
		POLYGON_RPC_URL: 'https://polygon-rpc.com',
		BUILDER_API_KEY: 'test-api-key',
		BUILDER_SECRET: 'test-secret',
		BUILDER_PASSPHRASE: 'test-passphrase',
		RELAYER_ENDPOINT: 'https://test-relayer.com'
	}
}));

const TEST_USER_ID = 'user-123';
const TEST_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
const TEST_ENCRYPTED_KEYS = 'encrypted-key-data';
const TEST_PRIVATE_KEY = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
const TEST_TO_ADDRESS = '0x0987654321098765432109876543210987654321';
const USDC_CONTRACT = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

describe('RelayerService', () => {
	let service: RelayerService;
	let mockRelayClient: {
		execute: Mock;
		getDeployed: Mock;
		deploy: Mock;
	};
	let mockDecryptData: Mock;
	let mockEncodeFunctionData: Mock;
	let mockFrom: Mock;
	let mockSelect: Mock;
	let mockEq: Mock;
	let mockSingle: Mock;

	beforeEach(async () => {
		vi.resetAllMocks();

		mockRelayClient = {
			execute: vi.fn(),
			getDeployed: vi.fn(),
			deploy: vi.fn()
		};

		const { RelayClient } = await import('@polymarket/builder-relayer-client');
		const { BuilderConfig } = await import('@polymarket/builder-signing-sdk');
		const { Wallet } = await import('@ethersproject/wallet');
		const { JsonRpcProvider } = await import('@ethersproject/providers');

		vi.mocked(RelayClient).mockImplementation(function (this: typeof mockRelayClient) {
			Object.assign(this, mockRelayClient);
			return this;
		} as unknown as typeof RelayClient);

		vi.mocked(BuilderConfig).mockImplementation(function (this: object, config: unknown) {
			return config;
		} as unknown as typeof BuilderConfig);

		vi.mocked(Wallet).mockImplementation(function (this: { address: string }) {
			this.address = TEST_WALLET_ADDRESS;
			return this;
		} as unknown as typeof Wallet);

		vi.mocked(JsonRpcProvider).mockImplementation(function (this: object) {
			return this;
		} as unknown as typeof JsonRpcProvider);

		const viem = await import('viem');
		mockEncodeFunctionData = vi.fn().mockReturnValue('0xencoded');
		vi.mocked(viem.encodeFunctionData).mockImplementation(mockEncodeFunctionData);

		const encryption = await import('../utils/encryption.js');
		mockDecryptData = vi.fn().mockReturnValue(TEST_PRIVATE_KEY);
		vi.mocked(encryption.decryptData).mockImplementation(mockDecryptData);

		mockSingle = vi.fn().mockResolvedValue({
			data: {
				encrypted_server_key_shares: TEST_ENCRYPTED_KEYS,
				server_wallet_address: TEST_WALLET_ADDRESS
			},
			error: null
		});
		mockEq = vi.fn().mockReturnValue({ single: mockSingle });
		mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
		mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

		const supabase = await import('$lib/supabase/admin');
		vi.spyOn(supabase.supabaseAdmin, 'from').mockImplementation(mockFrom);

		service = new RelayerService();
	});

	describe('transferERC20', () => {
		it('should execute successful ERC20 transfer', async () => {
			const mockResponse = {
				transactionID: 'tx-123',
				hash: '0xhash123',
				wait: vi.fn().mockResolvedValue({
					transactionHash: '0xtxhash456'
				})
			};

			mockRelayClient.execute.mockResolvedValue(mockResponse);

			const result = await service.transferERC20(TEST_USER_ID, {
				from: TEST_WALLET_ADDRESS,
				to: TEST_TO_ADDRESS,
				amount: '1000000',
				tokenAddress: USDC_CONTRACT
			});

			expect(result.success).toBe(true);
			expect(result.transactionHash).toBe('0xtxhash456');
			expect(result.transactionId).toBe('tx-123');
			expect(mockRelayClient.execute).toHaveBeenCalledWith(
				[
					{
						to: USDC_CONTRACT,
						data: '0xencoded',
						value: '0'
					}
				],
				'Transfer USDC'
			);
		});

		it('should use hash if transactionHash not available', async () => {
			const mockResponse = {
				transactionID: 'tx-123',
				hash: '0xhash123',
				wait: vi.fn().mockResolvedValue({
					transactionHash: undefined
				})
			};

			mockRelayClient.execute.mockResolvedValue(mockResponse);

			const result = await service.transferERC20(TEST_USER_ID, {
				from: TEST_WALLET_ADDRESS,
				to: TEST_TO_ADDRESS,
				amount: '1000000',
				tokenAddress: USDC_CONTRACT
			});

			expect(result.success).toBe(true);
			expect(result.transactionHash).toBe('0xhash123');
		});

		it('should encode transfer function correctly', async () => {
			const mockResponse = {
				transactionID: 'tx-123',
				hash: '0xhash123',
				wait: vi.fn().mockResolvedValue({ transactionHash: '0xtxhash456' })
			};

			mockRelayClient.execute.mockResolvedValue(mockResponse);

			await service.transferERC20(TEST_USER_ID, {
				from: TEST_WALLET_ADDRESS,
				to: TEST_TO_ADDRESS,
				amount: '1000000',
				tokenAddress: USDC_CONTRACT
			});

			expect(mockEncodeFunctionData).toHaveBeenCalledWith({
				abi: [
					{
						inputs: [
							{ name: 'recipient', type: 'address' },
							{ name: 'amount', type: 'uint256' }
						],
						name: 'transfer',
						outputs: [{ name: '', type: 'bool' }],
						stateMutability: 'nonpayable',
						type: 'function'
					}
				],
				functionName: 'transfer',
				args: [TEST_TO_ADDRESS, BigInt('1000000')]
			});
		});

		it('should handle relayer execution errors', async () => {
			mockRelayClient.execute.mockRejectedValue(new Error('Relayer error: insufficient funds'));

			const result = await service.transferERC20(TEST_USER_ID, {
				from: TEST_WALLET_ADDRESS,
				to: TEST_TO_ADDRESS,
				amount: '1000000',
				tokenAddress: USDC_CONTRACT
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Relayer error: insufficient funds');
			expect(result.transactionHash).toBeUndefined();
		});

		it('should handle unknown errors', async () => {
			mockRelayClient.execute.mockRejectedValue('unknown error');

			const result = await service.transferERC20(TEST_USER_ID, {
				from: TEST_WALLET_ADDRESS,
				to: TEST_TO_ADDRESS,
				amount: '1000000',
				tokenAddress: USDC_CONTRACT
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Transfer failed');
		});

		it('should handle missing user in database', async () => {
			mockSingle.mockResolvedValue({
				data: null,
				error: { message: 'User not found' }
			});

			const result = await service.transferERC20(TEST_USER_ID, {
				from: TEST_WALLET_ADDRESS,
				to: TEST_TO_ADDRESS,
				amount: '1000000',
				tokenAddress: USDC_CONTRACT
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Server wallet not found');
		});

		it('should handle missing encrypted key shares', async () => {
			mockSingle.mockResolvedValue({
				data: {
					encrypted_server_key_shares: null,
					server_wallet_address: TEST_WALLET_ADDRESS
				},
				error: null
			});

			const result = await service.transferERC20(TEST_USER_ID, {
				from: TEST_WALLET_ADDRESS,
				to: TEST_TO_ADDRESS,
				amount: '1000000',
				tokenAddress: USDC_CONTRACT
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Server wallet not found');
		});
	});

	describe('isWalletDeployed', () => {
		it('should return true for deployed wallet', async () => {
			mockRelayClient.getDeployed.mockResolvedValue(true);

			const result = await service.isWalletDeployed(TEST_USER_ID, TEST_WALLET_ADDRESS);

			expect(result).toBe(true);
			expect(mockRelayClient.getDeployed).toHaveBeenCalledWith(TEST_WALLET_ADDRESS);
		});

		it('should return false for undeployed wallet', async () => {
			mockRelayClient.getDeployed.mockResolvedValue(false);

			const result = await service.isWalletDeployed(TEST_USER_ID, TEST_WALLET_ADDRESS);

			expect(result).toBe(false);
		});

		it('should return false on error', async () => {
			mockRelayClient.getDeployed.mockRejectedValue(new Error('Network error'));

			const result = await service.isWalletDeployed(TEST_USER_ID, TEST_WALLET_ADDRESS);

			expect(result).toBe(false);
		});

		it('should handle non-Error exceptions', async () => {
			mockRelayClient.getDeployed.mockRejectedValue('unknown error');

			const result = await service.isWalletDeployed(TEST_USER_ID, TEST_WALLET_ADDRESS);

			expect(result).toBe(false);
		});
	});

	describe('deploySafeWallet', () => {
		it('should successfully deploy Safe wallet', async () => {
			const mockResponse = {
				transactionID: 'deploy-tx-123',
				hash: '0xdeployhash123',
				wait: vi.fn().mockResolvedValue({
					transactionHash: '0xdeploytxhash456'
				})
			};

			mockRelayClient.deploy.mockResolvedValue(mockResponse);

			const result = await service.deploySafeWallet(TEST_USER_ID);

			expect(result.success).toBe(true);
			expect(result.transactionHash).toBe('0xdeploytxhash456');
			expect(result.transactionId).toBe('deploy-tx-123');
			expect(mockRelayClient.deploy).toHaveBeenCalled();
		});

		it('should use hash if transactionHash not available', async () => {
			const mockResponse = {
				transactionID: 'deploy-tx-123',
				hash: '0xdeployhash123',
				wait: vi.fn().mockResolvedValue({
					transactionHash: undefined
				})
			};

			mockRelayClient.deploy.mockResolvedValue(mockResponse);

			const result = await service.deploySafeWallet(TEST_USER_ID);

			expect(result.success).toBe(true);
			expect(result.transactionHash).toBe('0xdeployhash123');
		});

		it('should handle deployment errors', async () => {
			mockRelayClient.deploy.mockRejectedValue(new Error('Deployment failed: gas too low'));

			const result = await service.deploySafeWallet(TEST_USER_ID);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Deployment failed: gas too low');
		});

		it('should handle unknown deployment errors', async () => {
			mockRelayClient.deploy.mockRejectedValue('unknown error');

			const result = await service.deploySafeWallet(TEST_USER_ID);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Deployment failed');
		});

		it('should handle missing user data', async () => {
			mockSingle.mockResolvedValue({
				data: null,
				error: { message: 'User not found' }
			});

			const result = await service.deploySafeWallet(TEST_USER_ID);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Server wallet not found');
		});
	});

	describe('Integration scenarios', () => {
		it('should decrypt user keys correctly', async () => {
			const mockResponse = {
				transactionID: 'tx-123',
				hash: '0xhash123',
				wait: vi.fn().mockResolvedValue({ transactionHash: '0xtxhash456' })
			};

			mockRelayClient.execute.mockResolvedValue(mockResponse);

			await service.transferERC20(TEST_USER_ID, {
				from: TEST_WALLET_ADDRESS,
				to: TEST_TO_ADDRESS,
				amount: '1000000',
				tokenAddress: USDC_CONTRACT
			});

			expect(mockDecryptData).toHaveBeenCalledWith(TEST_ENCRYPTED_KEYS);
		});

		it('should query correct user from database', async () => {
			const mockResponse = {
				transactionID: 'tx-123',
				hash: '0xhash123',
				wait: vi.fn().mockResolvedValue({ transactionHash: '0xtxhash456' })
			};

			mockRelayClient.execute.mockResolvedValue(mockResponse);

			await service.transferERC20(TEST_USER_ID, {
				from: TEST_WALLET_ADDRESS,
				to: TEST_TO_ADDRESS,
				amount: '1000000',
				tokenAddress: USDC_CONTRACT
			});

			expect(mockFrom).toHaveBeenCalledWith('users');
		});

		it('should handle large transfer amounts', async () => {
			const mockResponse = {
				transactionID: 'tx-123',
				hash: '0xhash123',
				wait: vi.fn().mockResolvedValue({ transactionHash: '0xtxhash456' })
			};

			mockRelayClient.execute.mockResolvedValue(mockResponse);

			const largeAmount = '999999999999999';
			const result = await service.transferERC20(TEST_USER_ID, {
				from: TEST_WALLET_ADDRESS,
				to: TEST_TO_ADDRESS,
				amount: largeAmount,
				tokenAddress: USDC_CONTRACT
			});

			expect(result.success).toBe(true);
			expect(mockEncodeFunctionData).toHaveBeenCalledWith(
				expect.objectContaining({
					args: [TEST_TO_ADDRESS, BigInt(largeAmount)]
				})
			);
		});
	});
});
