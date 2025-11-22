import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateMarket, validateMarkets } from './response-validator';
import { ValidationError } from '../errors/api-errors';
import type { Market } from '../api/polymarket-client';

describe('Response Validator', () => {
	/**
	 * Feature: polymarket-api-integration, Property 15: Response validation
	 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
	 *
	 * For any data received from the Gamma API, the server route should validate
	 * the response structure and return an error if validation fails.
	 */
	describe('Property 15: Response validation', () => {
		// Generator for valid market objects
		const validMarketArbitrary = fc.record({
			id: fc.string({ minLength: 1 }),
			question: fc.string({ minLength: 1 }),
			conditionId: fc.string({ minLength: 1 }),
			slug: fc.string({ minLength: 1 }),
			endDate: fc
				.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
				.map((timestamp) => new Date(timestamp).toISOString()),
			category: fc.string({ minLength: 1 }),
			liquidity: fc.string({ minLength: 1 }),
			image: fc.webUrl(),
			icon: fc.webUrl(),
			description: fc.string(),
			outcomes: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
			outcomePrices: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
			volume: fc.string({ minLength: 1 }),
			active: fc.boolean(),
			marketType: fc.constantFrom('normal' as const, 'scalar' as const),
			closed: fc.boolean(),
			volumeNum: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
			liquidityNum: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
			volume24hr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
			volume1wk: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
			volume1mo: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
			lastTradePrice: fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
			bestBid: fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
			bestAsk: fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true })
		});

		it('should validate valid market objects without throwing errors', () => {
			fc.assert(
				fc.property(validMarketArbitrary, (marketData) => {
					// Should not throw for valid data
					const result = validateMarket(marketData);

					// Result should be the same as input (validated)
					expect(result).toEqual(marketData);
				}),
				{ numRuns: 100 }
			);
		});

		it('should validate arrays of valid markets without throwing errors', () => {
			fc.assert(
				fc.property(fc.array(validMarketArbitrary, { minLength: 0, maxLength: 10 }), (markets) => {
					// Should not throw for valid data
					const result = validateMarkets(markets);

					// Result should be the same as input (validated)
					expect(result).toEqual(markets);
				}),
				{ numRuns: 100 }
			);
		});

		it('should reject non-object data', () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.string(),
						fc.integer(),
						fc.boolean(),
						fc.constant(null),
						fc.constant(undefined),
						fc.array(fc.anything())
					),
					(invalidData) => {
						expect(() => validateMarket(invalidData)).toThrow(ValidationError);
						expect(() => validateMarket(invalidData)).toThrow('Market data must be an object');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject markets with missing required string fields', () => {
			const requiredStringFields = [
				'id',
				'question',
				'conditionId',
				'slug',
				'endDate',
				'category',
				'liquidity',
				'image',
				'icon',
				'description',
				'volume',
				'marketType'
			];

			fc.assert(
				fc.property(
					validMarketArbitrary,
					fc.constantFrom(...requiredStringFields),
					(marketData, fieldToRemove) => {
						const invalidMarket = { ...marketData };
						delete (invalidMarket as any)[fieldToRemove];

						expect(() => validateMarket(invalidMarket)).toThrow(ValidationError);
						expect(() => validateMarket(invalidMarket)).toThrow('Market validation failed');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject markets with missing required array fields', () => {
			fc.assert(
				fc.property(
					validMarketArbitrary,
					fc.constantFrom('outcomes', 'outcomePrices'),
					(marketData, fieldToRemove) => {
						const invalidMarket = { ...marketData };
						delete (invalidMarket as any)[fieldToRemove];

						expect(() => validateMarket(invalidMarket)).toThrow(ValidationError);
						expect(() => validateMarket(invalidMarket)).toThrow('Market validation failed');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject markets with missing required boolean fields', () => {
			fc.assert(
				fc.property(
					validMarketArbitrary,
					fc.constantFrom('active', 'closed'),
					(marketData, fieldToRemove) => {
						const invalidMarket = { ...marketData };
						delete (invalidMarket as any)[fieldToRemove];

						expect(() => validateMarket(invalidMarket)).toThrow(ValidationError);
						expect(() => validateMarket(invalidMarket)).toThrow('Market validation failed');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject markets with missing required number fields', () => {
			const requiredNumberFields = [
				'volumeNum',
				'liquidityNum',
				'volume24hr',
				'volume1wk',
				'volume1mo',
				'lastTradePrice',
				'bestBid',
				'bestAsk'
			];

			fc.assert(
				fc.property(
					validMarketArbitrary,
					fc.constantFrom(...requiredNumberFields),
					(marketData, fieldToRemove) => {
						const invalidMarket = { ...marketData };
						delete (invalidMarket as any)[fieldToRemove];

						expect(() => validateMarket(invalidMarket)).toThrow(ValidationError);
						expect(() => validateMarket(invalidMarket)).toThrow('Market validation failed');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject markets with incorrect string field types', () => {
			const stringFields = [
				'id',
				'question',
				'conditionId',
				'slug',
				'endDate',
				'category',
				'liquidity',
				'image',
				'icon',
				'description',
				'volume'
			];

			fc.assert(
				fc.property(
					validMarketArbitrary,
					fc.constantFrom(...stringFields),
					fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.array(fc.anything())),
					(marketData, fieldToChange, wrongValue) => {
						const invalidMarket = { ...marketData, [fieldToChange]: wrongValue };

						expect(() => validateMarket(invalidMarket)).toThrow(ValidationError);
						expect(() => validateMarket(invalidMarket)).toThrow('Market validation failed');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject markets with incorrect number field types', () => {
			const numberFields = [
				'volumeNum',
				'liquidityNum',
				'volume24hr',
				'volume1wk',
				'volume1mo',
				'lastTradePrice',
				'bestBid',
				'bestAsk'
			];

			fc.assert(
				fc.property(
					validMarketArbitrary,
					fc.constantFrom(...numberFields),
					fc.oneof(fc.string(), fc.boolean(), fc.constant(null), fc.constant(NaN)),
					(marketData, fieldToChange, wrongValue) => {
						const invalidMarket = { ...marketData, [fieldToChange]: wrongValue };

						expect(() => validateMarket(invalidMarket)).toThrow(ValidationError);
						expect(() => validateMarket(invalidMarket)).toThrow('Market validation failed');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject markets with incorrect boolean field types', () => {
			fc.assert(
				fc.property(
					validMarketArbitrary,
					fc.constantFrom('active', 'closed'),
					fc.oneof(fc.string(), fc.integer(), fc.constant(null)),
					(marketData, fieldToChange, wrongValue) => {
						const invalidMarket = { ...marketData, [fieldToChange]: wrongValue };

						expect(() => validateMarket(invalidMarket)).toThrow(ValidationError);
						expect(() => validateMarket(invalidMarket)).toThrow('Market validation failed');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject markets with incorrect array field types', () => {
			fc.assert(
				fc.property(
					validMarketArbitrary,
					fc.constantFrom('outcomes', 'outcomePrices'),
					fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
					(marketData, fieldToChange, wrongValue) => {
						const invalidMarket = { ...marketData, [fieldToChange]: wrongValue };

						expect(() => validateMarket(invalidMarket)).toThrow(ValidationError);
						expect(() => validateMarket(invalidMarket)).toThrow('Market validation failed');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject markets with invalid marketType values', () => {
			fc.assert(
				fc.property(
					validMarketArbitrary,
					fc.string().filter((s) => s !== 'normal' && s !== 'scalar'),
					(marketData, invalidMarketType) => {
						const invalidMarket = { ...marketData, marketType: invalidMarketType };

						expect(() => validateMarket(invalidMarket as any)).toThrow(ValidationError);
						expect(() => validateMarket(invalidMarket as any)).toThrow('Market validation failed');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject non-array data when validating markets array', () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.string(),
						fc.integer(),
						fc.boolean(),
						fc.constant(null),
						fc.constant(undefined),
						fc.record({})
					),
					(invalidData) => {
						expect(() => validateMarkets(invalidData)).toThrow(ValidationError);
						expect(() => validateMarkets(invalidData)).toThrow('Markets data must be an array');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject arrays containing invalid market objects', () => {
			fc.assert(
				fc.property(
					fc.array(validMarketArbitrary, { minLength: 1, maxLength: 5 }),
					fc.integer({ min: 0, max: 4 }),
					(markets, indexToCorrupt) => {
						// Only corrupt if we have enough markets
						if (indexToCorrupt >= markets.length) return;

						const corruptedMarkets = [...markets];
						// Remove a required field from one market
						const corruptedMarket = { ...corruptedMarkets[indexToCorrupt] };
						delete (corruptedMarket as any).id;
						corruptedMarkets[indexToCorrupt] = corruptedMarket;

						expect(() => validateMarkets(corruptedMarkets)).toThrow(ValidationError);
						expect(() => validateMarkets(corruptedMarkets)).toThrow(
							/Market at index \d+ is invalid/
						);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should validate empty arrays successfully', () => {
			const result = validateMarkets([]);
			expect(result).toEqual([]);
		});

		it('should reject arrays with non-string elements in outcomes', () => {
			fc.assert(
				fc.property(
					validMarketArbitrary,
					fc.array(fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)), { minLength: 1 }),
					(marketData, invalidOutcomes) => {
						const invalidMarket = { ...marketData, outcomes: invalidOutcomes };

						expect(() => validateMarket(invalidMarket as any)).toThrow(ValidationError);
						expect(() => validateMarket(invalidMarket as any)).toThrow('Market validation failed');
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should reject arrays with non-string elements in outcomePrices', () => {
			fc.assert(
				fc.property(
					validMarketArbitrary,
					fc.array(fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)), { minLength: 1 }),
					(marketData, invalidPrices) => {
						const invalidMarket = { ...marketData, outcomePrices: invalidPrices };

						expect(() => validateMarket(invalidMarket as any)).toThrow(ValidationError);
						expect(() => validateMarket(invalidMarket as unknown)).toThrow(
							'Market validation failed'
						);
					}
				),
				{ numRuns: 100 }
			);
		});
	});
});
