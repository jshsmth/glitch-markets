/**
 * Tests for BridgeService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BridgeService } from './bridge-service.js';
import { ValidationError } from '../errors/api-errors.js';
import { resetSharedInstances } from '../cache/shared-instances.js';

// Mock dependencies (but NOT cache-manager, we need it to work for caching tests)
vi.mock('../api/polymarket-client.js');
vi.mock('../config/api-config.js');
vi.mock('../utils/logger.js');

describe('BridgeService', () => {
	let service: BridgeService;

	beforeEach(() => {
		vi.resetAllMocks();
		resetSharedInstances();
		service = new BridgeService(300000); // 5 minute cache
	});

	describe('createDeposit', () => {
		it('validates ethereum address', async () => {
			await expect(service.createDeposit('invalid-address')).rejects.toThrow(ValidationError);
		});

		it('rejects non-string addresses', async () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await expect(service.createDeposit(123 as any)).rejects.toThrow(ValidationError);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await expect(service.createDeposit(null as any)).rejects.toThrow(ValidationError);
		});

		it('normalizes address to lowercase', async () => {
			const upperAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';

			// Mock the client method
			const mockResult = {
				address: {
					evm: upperAddress.toLowerCase()
				}
			};

			vi.spyOn(service['client'], 'createBridgeDeposit').mockResolvedValue(mockResult);

			const result = await service.createDeposit(upperAddress);

			expect(service['client'].createBridgeDeposit).toHaveBeenCalledWith(
				upperAddress.toLowerCase()
			);
			expect(result.address.evm).toBe(upperAddress.toLowerCase());
		});
	});

	describe('getSupportedAssets', () => {
		it('caches results', async () => {
			const mockAssets = {
				supportedAssets: [
					{
						chainId: '1',
						chainName: 'Ethereum',
						token: {
							name: 'USDC',
							symbol: 'USDC',
							address: '0x...',
							decimals: 6
						},
						minCheckoutUsd: 45
					}
				]
			};

			// Create a spy on the fetchSupportedBridgeAssets method directly
			const fetchSpy = vi.fn().mockResolvedValue(mockAssets);
			service['client'].fetchSupportedBridgeAssets = fetchSpy;

			// First call - should hit API
			const result1 = await service.getSupportedAssets();
			expect(result1).toEqual(mockAssets);
			expect(fetchSpy).toHaveBeenCalledTimes(1);

			// Second call - should hit cache
			const result2 = await service.getSupportedAssets();
			expect(result2).toEqual(mockAssets);
			expect(fetchSpy).toHaveBeenCalledTimes(1); // Still 1!
		});

		it('handles cache stampede protection', async () => {
			const mockAssets = {
				supportedAssets: []
			};

			vi.spyOn(service['client'], 'fetchSupportedBridgeAssets').mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockAssets), 100))
			);

			// Fire multiple requests simultaneously
			const promises = [
				service.getSupportedAssets(),
				service.getSupportedAssets(),
				service.getSupportedAssets()
			];

			const results = await Promise.all(promises);

			// All should return same data
			results.forEach((result) => expect(result).toEqual(mockAssets));

			// But only one API call should have been made
			expect(service['client'].fetchSupportedBridgeAssets).toHaveBeenCalledTimes(1);
		});
	});
});
