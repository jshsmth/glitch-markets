/**
 * Tests for bridge response validators
 */

import { describe, test, expect } from 'vitest';
import { validateSupportedAssets, validateDepositAddresses } from './response-validator.js';
import { ValidationError } from '../errors/api-errors.js';

describe('Bridge Response Validation', () => {
	describe('validateSupportedAssets', () => {
		test('validates correct response structure', () => {
			const validResponse = {
				supportedAssets: [
					{
						chainId: '1',
						chainName: 'Ethereum',
						token: {
							name: 'USD Coin',
							symbol: 'USDC',
							address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
							decimals: 6
						},
						minCheckoutUsd: 45
					}
				]
			};

			const result = validateSupportedAssets(validResponse);
			expect(result.supportedAssets).toHaveLength(1);
			expect(result.supportedAssets[0].chainName).toBe('Ethereum');
		});

		test('validates empty supportedAssets array', () => {
			const validResponse = {
				supportedAssets: []
			};

			const result = validateSupportedAssets(validResponse);
			expect(result.supportedAssets).toHaveLength(0);
		});

		test('rejects non-object response', () => {
			expect(() => validateSupportedAssets(null)).toThrow(ValidationError);
			expect(() => validateSupportedAssets('string')).toThrow(ValidationError);
			expect(() => validateSupportedAssets([])).toThrow(ValidationError);
		});

		test('rejects missing supportedAssets field', () => {
			expect(() => validateSupportedAssets({})).toThrow(ValidationError);
			expect(() => validateSupportedAssets({})).toThrow(
				'SupportedAssets.supportedAssets must be an array'
			);
		});

		test('rejects invalid asset structure', () => {
			const invalidResponse = {
				supportedAssets: [
					{
						chainId: '1'
						// missing required fields
					}
				]
			};

			expect(() => validateSupportedAssets(invalidResponse)).toThrow(ValidationError);
		});

		test('rejects invalid token structure', () => {
			const invalidResponse = {
				supportedAssets: [
					{
						chainId: '1',
						chainName: 'Ethereum',
						token: {
							name: 'USD Coin'
							// missing required fields
						},
						minCheckoutUsd: 45
					}
				]
			};

			expect(() => validateSupportedAssets(invalidResponse)).toThrow(ValidationError);
		});
	});

	describe('validateDepositAddresses', () => {
		test('validates correct response structure', () => {
			const validResponse = {
				address: {
					evm: '0xfd83026deFFd3B800fEf2ce91E9e0383F687D385',
					svm: '9wSLP4wgThCVkKCPqq79mTX4M4x9b9JKLVhvcCQB4W32',
					btc: 'bc1qmn6yj2qvds65q3z7tnjyqdm0rf4p6yzh7jh45r'
				},
				note: 'Only certain chains and tokens are supported. See /supported-assets for details.'
			};

			const result = validateDepositAddresses(validResponse);
			expect(result.address.evm).toBe('0xfd83026deFFd3B800fEf2ce91E9e0383F687D385');
			expect(result.address.svm).toBe('9wSLP4wgThCVkKCPqq79mTX4M4x9b9JKLVhvcCQB4W32');
			expect(result.address.btc).toBe('bc1qmn6yj2qvds65q3z7tnjyqdm0rf4p6yzh7jh45r');
			expect(result.note).toBe(
				'Only certain chains and tokens are supported. See /supported-assets for details.'
			);
		});

		test('validates response with only EVM address', () => {
			const validResponse = {
				address: {
					evm: '0xfd83026deFFd3B800fEf2ce91E9e0383F687D385'
				}
			};

			const result = validateDepositAddresses(validResponse);
			expect(result.address.evm).toBe('0xfd83026deFFd3B800fEf2ce91E9e0383F687D385');
			expect(result.address.svm).toBeUndefined();
			expect(result.address.btc).toBeUndefined();
		});

		test('rejects non-object response', () => {
			expect(() => validateDepositAddresses(null)).toThrow(ValidationError);
			expect(() => validateDepositAddresses('string')).toThrow(ValidationError);
			expect(() => validateDepositAddresses([])).toThrow(ValidationError);
		});

		test('rejects missing address field', () => {
			const invalidResponse = {
				note: 'Some note'
			};

			expect(() => validateDepositAddresses(invalidResponse)).toThrow(ValidationError);
			expect(() => validateDepositAddresses(invalidResponse)).toThrow(
				'DepositAddresses.address must be an object'
			);
		});

		test('rejects non-object address field', () => {
			const invalidResponse = {
				address: '0x56687bf447db6ffa42ffe2204a05edaa20f55839'
			};

			expect(() => validateDepositAddresses(invalidResponse)).toThrow(ValidationError);
			expect(() => validateDepositAddresses(invalidResponse)).toThrow(
				'DepositAddresses.address must be an object'
			);
		});

		test('rejects empty address object', () => {
			const invalidResponse = {
				address: {}
			};

			expect(() => validateDepositAddresses(invalidResponse)).toThrow(ValidationError);
			expect(() => validateDepositAddresses(invalidResponse)).toThrow(
				'DepositAddressMap must contain at least one address'
			);
		});

		test('rejects invalid address types', () => {
			const invalidResponse = {
				address: {
					evm: 123 // should be string
				}
			};

			expect(() => validateDepositAddresses(invalidResponse)).toThrow(ValidationError);
			expect(() => validateDepositAddresses(invalidResponse)).toThrow(
				'DepositAddressMap.evm must be a string'
			);
		});
	});
});
