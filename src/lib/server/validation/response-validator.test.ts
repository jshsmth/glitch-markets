import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	validateMarket,
	validateMarkets,
	validateEvent,
	validateEvents,
	validateTag,
	validateTags,
	validatePosition,
	validatePositions,
	validateTrade,
	validateTrades,
	validateActivity,
	validateActivities,
	validateHolderInfo,
	validateMarketHolders,
	validateMarketHoldersList,
	validatePortfolioValue,
	validatePortfolioValues,
	validateClosedPosition,
	validateClosedPositions,
	validateSeries,
	validateSeriesList,
	validateCommentImageOptimized,
	validateUserPosition,
	validateCommentProfile,
	validateReaction,
	validateComment,
	validateComments
} from './response-validator';
import { ValidationError } from '../errors/api-errors';

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
						delete (invalidMarket as Record<string, unknown>)[fieldToRemove];

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
						delete (invalidMarket as Record<string, unknown>)[fieldToRemove];

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
						delete (invalidMarket as Record<string, unknown>)[fieldToRemove];

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
						delete (invalidMarket as Record<string, unknown>)[fieldToRemove];

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

						expect(() => validateMarket(invalidMarket as Record<string, unknown>)).toThrow(
							ValidationError
						);
						expect(() => validateMarket(invalidMarket as Record<string, unknown>)).toThrow(
							'Market validation failed'
						);
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
						delete (corruptedMarket as Record<string, unknown>).id;
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

						expect(() => validateMarket(invalidMarket as Record<string, unknown>)).toThrow(
							ValidationError
						);
						expect(() => validateMarket(invalidMarket as Record<string, unknown>)).toThrow(
							'Market validation failed'
						);
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

						expect(() => validateMarket(invalidMarket as Record<string, unknown>)).toThrow(
							ValidationError
						);
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

/**
 * Feature: polymarket-events, Property 16: Response validation checks required fields
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 *
 * For any API response, the system should validate that all required fields are present
 * and throw a parsing error if any are missing or have incorrect types.
 */
describe('Property 16: Response validation checks required fields', () => {
	// Generator for valid market objects (for nested validation)
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

	// Generator for valid event objects
	const validEventArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		ticker: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		title: fc.string({ minLength: 1 }),
		subtitle: fc.string(),
		description: fc.string(),
		resolutionSource: fc.string(),
		startDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		creationDate: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		endDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		image: fc.webUrl(),
		icon: fc.webUrl(),
		active: fc.boolean(),
		closed: fc.boolean(),
		archived: fc.boolean(),
		new: fc.boolean(),
		featured: fc.boolean(),
		restricted: fc.boolean(),
		liquidity: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		openInterest: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		category: fc.string({ minLength: 1 }),
		subcategory: fc.string(),
		volume24hr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1wk: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1mo: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1yr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		commentCount: fc.integer({ min: 0 }),
		markets: fc.array(validMarketArbitrary, { minLength: 0, maxLength: 5 }),
		categories: fc.array(
			fc.record({
				id: fc.string({ minLength: 1 }),
				name: fc.string({ minLength: 1 })
			}),
			{ minLength: 0, maxLength: 3 }
		),
		tags: fc.array(
			fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			}),
			{ minLength: 0, maxLength: 5 }
		)
	});

	it('should validate valid event objects without throwing errors', () => {
		fc.assert(
			fc.property(validEventArbitrary, (eventData) => {
				// Should not throw for valid data
				const result = validateEvent(eventData);

				// Result should be the same as input (validated)
				expect(result).toEqual(eventData);
			}),
			{ numRuns: 100 }
		);
	});

	it('should validate arrays of valid events without throwing errors', () => {
		fc.assert(
			fc.property(fc.array(validEventArbitrary, { minLength: 0, maxLength: 10 }), (events) => {
				// Should not throw for valid data
				const result = validateEvents(events);

				// Result should be the same as input (validated)
				expect(result).toEqual(events);
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
					expect(() => validateEvent(invalidData)).toThrow(ValidationError);
					expect(() => validateEvent(invalidData)).toThrow('Event data must be an object');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject events with missing required string fields', () => {
		const requiredStringFields = [
			'id',
			'ticker',
			'slug',
			'title',
			'description',
			'startDate',
			'creationDate',
			'endDate',
			'category'
		];

		fc.assert(
			fc.property(
				validEventArbitrary,
				fc.constantFrom(...requiredStringFields),
				(eventData, fieldToRemove) => {
					const invalidEvent = { ...eventData };
					delete (invalidEvent as Record<string, unknown>)[fieldToRemove];

					expect(() => validateEvent(invalidEvent)).toThrow(ValidationError);
					expect(() => validateEvent(invalidEvent)).toThrow('Event validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject events with missing required boolean fields', () => {
		const requiredBooleanFields = ['active', 'closed', 'archived', 'new', 'featured', 'restricted'];

		fc.assert(
			fc.property(
				validEventArbitrary,
				fc.constantFrom(...requiredBooleanFields),
				(eventData, fieldToRemove) => {
					const invalidEvent = { ...eventData };
					delete (invalidEvent as Record<string, unknown>)[fieldToRemove];

					expect(() => validateEvent(invalidEvent)).toThrow(ValidationError);
					expect(() => validateEvent(invalidEvent)).toThrow('Event validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject events with missing required number fields', () => {
		const requiredNumberFields = [
			'liquidity',
			'volume',
			'openInterest',
			'volume24hr',
			'volume1wk',
			'volume1mo',
			'volume1yr',
			'commentCount'
		];

		fc.assert(
			fc.property(
				validEventArbitrary,
				fc.constantFrom(...requiredNumberFields),
				(eventData, fieldToRemove) => {
					const invalidEvent = { ...eventData };
					delete (invalidEvent as Record<string, unknown>)[fieldToRemove];

					expect(() => validateEvent(invalidEvent)).toThrow(ValidationError);
					expect(() => validateEvent(invalidEvent)).toThrow('Event validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject events with missing required array fields', () => {
		fc.assert(
			fc.property(
				validEventArbitrary,
				fc.constantFrom('markets', 'tags'),
				(eventData, fieldToRemove) => {
					const invalidEvent = { ...eventData };
					delete (invalidEvent as Record<string, unknown>)[fieldToRemove];

					expect(() => validateEvent(invalidEvent)).toThrow(ValidationError);
					expect(() => validateEvent(invalidEvent)).toThrow('Event validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject events with incorrect string field types', () => {
		const requiredStringFields = [
			'id',
			'ticker',
			'slug',
			'title',
			'description',
			'startDate',
			'creationDate',
			'endDate',
			'category'
		];

		fc.assert(
			fc.property(
				validEventArbitrary,
				fc.constantFrom(...requiredStringFields),
				fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.array(fc.anything())),
				(eventData, fieldToChange, wrongValue) => {
					const invalidEvent = { ...eventData, [fieldToChange]: wrongValue };

					expect(() => validateEvent(invalidEvent)).toThrow(ValidationError);
					expect(() => validateEvent(invalidEvent)).toThrow('Event validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should accept events with null optional string fields', () => {
		fc.assert(
			fc.property(
				validEventArbitrary,
				fc.constantFrom('subtitle', 'subcategory', 'resolutionSource', 'image', 'icon'),
				(eventData, fieldToSetNull) => {
					const eventWithNull = { ...eventData, [fieldToSetNull]: null };
					expect(() => validateEvent(eventWithNull)).not.toThrow();
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject events with incorrect types for optional string fields', () => {
		const optionalStringFields = ['subtitle', 'subcategory', 'resolutionSource', 'image', 'icon'];

		fc.assert(
			fc.property(
				validEventArbitrary,
				fc.constantFrom(...optionalStringFields),
				fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.anything())),
				(eventData, fieldToChange, wrongValue) => {
					const invalidEvent = { ...eventData, [fieldToChange]: wrongValue };

					expect(() => validateEvent(invalidEvent)).toThrow(ValidationError);
					expect(() => validateEvent(invalidEvent)).toThrow('Event validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject events with incorrect number field types', () => {
		const numberFields = [
			'liquidity',
			'volume',
			'openInterest',
			'volume24hr',
			'volume1wk',
			'volume1mo',
			'volume1yr',
			'commentCount'
		];

		fc.assert(
			fc.property(
				validEventArbitrary,
				fc.constantFrom(...numberFields),
				fc.oneof(fc.string(), fc.boolean(), fc.constant(null), fc.constant(NaN)),
				(eventData, fieldToChange, wrongValue) => {
					const invalidEvent = { ...eventData, [fieldToChange]: wrongValue };

					expect(() => validateEvent(invalidEvent)).toThrow(ValidationError);
					expect(() => validateEvent(invalidEvent)).toThrow('Event validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject events with incorrect boolean field types', () => {
		const booleanFields = ['active', 'closed', 'archived', 'new', 'featured', 'restricted'];

		fc.assert(
			fc.property(
				validEventArbitrary,
				fc.constantFrom(...booleanFields),
				fc.oneof(fc.string(), fc.integer(), fc.constant(null)),
				(eventData, fieldToChange, wrongValue) => {
					const invalidEvent = { ...eventData, [fieldToChange]: wrongValue };

					expect(() => validateEvent(invalidEvent)).toThrow(ValidationError);
					expect(() => validateEvent(invalidEvent)).toThrow('Event validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject events with incorrect array field types', () => {
		fc.assert(
			fc.property(
				validEventArbitrary,
				fc.constantFrom('markets', 'tags'),
				fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
				(eventData, fieldToChange, wrongValue) => {
					const invalidEvent = { ...eventData, [fieldToChange]: wrongValue };

					expect(() => validateEvent(invalidEvent)).toThrow(ValidationError);
					expect(() => validateEvent(invalidEvent)).toThrow('Event validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should accept events with null categories field', () => {
		fc.assert(
			fc.property(validEventArbitrary, (eventData) => {
				const eventWithNull = { ...eventData, categories: null };
				expect(() => validateEvent(eventWithNull)).not.toThrow();
			}),
			{ numRuns: 100 }
		);
	});

	it('should reject events with incorrect types for categories field', () => {
		fc.assert(
			fc.property(
				validEventArbitrary,
				fc.oneof(fc.string(), fc.integer(), fc.boolean()),
				(eventData, wrongValue) => {
					const invalidEvent = { ...eventData, categories: wrongValue };

					expect(() => validateEvent(invalidEvent)).toThrow(ValidationError);
					expect(() => validateEvent(invalidEvent)).toThrow('Event validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject non-array data when validating events array', () => {
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
					expect(() => validateEvents(invalidData)).toThrow(ValidationError);
					expect(() => validateEvents(invalidData)).toThrow('Events data must be an array');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject arrays containing invalid event objects', () => {
		fc.assert(
			fc.property(
				fc.array(validEventArbitrary, { minLength: 1, maxLength: 5 }),
				fc.integer({ min: 0, max: 4 }),
				(events, indexToCorrupt) => {
					// Only corrupt if we have enough events
					if (indexToCorrupt >= events.length) return;

					const corruptedEvents = [...events];
					// Remove a required field from one event
					const corruptedEvent = { ...corruptedEvents[indexToCorrupt] };
					delete (corruptedEvent as Record<string, unknown>).id;
					corruptedEvents[indexToCorrupt] = corruptedEvent;

					expect(() => validateEvents(corruptedEvents)).toThrow(ValidationError);
					expect(() => validateEvents(corruptedEvents)).toThrow(/Event at index \d+ is invalid/);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should validate empty event arrays successfully', () => {
		const result = validateEvents([]);
		expect(result).toEqual([]);
	});
});

/**
 * Feature: polymarket-events, Property 17: Nested market data is validated
 * Validates: Requirements 6.5
 *
 * For any event with nested market data, the system should validate the nested structure
 * and throw a parsing error if invalid.
 */
describe('Property 17: Nested market data is validated', () => {
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

	// Generator for valid event objects with markets
	const validEventWithMarketsArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		ticker: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		title: fc.string({ minLength: 1 }),
		subtitle: fc.string(),
		description: fc.string(),
		resolutionSource: fc.string(),
		startDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		creationDate: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		endDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		image: fc.webUrl(),
		icon: fc.webUrl(),
		active: fc.boolean(),
		closed: fc.boolean(),
		archived: fc.boolean(),
		new: fc.boolean(),
		featured: fc.boolean(),
		restricted: fc.boolean(),
		liquidity: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		openInterest: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		category: fc.string({ minLength: 1 }),
		subcategory: fc.string(),
		volume24hr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1wk: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1mo: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1yr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		commentCount: fc.integer({ min: 0 }),
		markets: fc.array(validMarketArbitrary, { minLength: 1, maxLength: 5 }),
		categories: fc.array(
			fc.record({
				id: fc.string({ minLength: 1 }),
				name: fc.string({ minLength: 1 })
			}),
			{ minLength: 0, maxLength: 3 }
		),
		tags: fc.array(
			fc.record({
				id: fc.string({ minLength: 1 }),
				label: fc.string({ minLength: 1 }),
				slug: fc.string({ minLength: 1 })
			}),
			{ minLength: 0, maxLength: 5 }
		)
	});

	it('should validate events with valid nested market data', () => {
		fc.assert(
			fc.property(validEventWithMarketsArbitrary, (eventData) => {
				// Should not throw for valid nested data
				const result = validateEvent(eventData);

				// Result should be the same as input (validated)
				expect(result).toEqual(eventData);
				expect(result.markets).toEqual(eventData.markets);
			}),
			{ numRuns: 100 }
		);
	});

	it('should accept events with empty markets array', () => {
		fc.assert(
			fc.property(validEventWithMarketsArbitrary, (eventData) => {
				const eventWithEmptyMarkets = { ...eventData, markets: [] };

				// Should not throw for empty markets array
				const result = validateEvent(eventWithEmptyMarkets);

				expect(result.markets).toEqual([]);
			}),
			{ numRuns: 100 }
		);
	});
});

/**
 * Feature: polymarket-user-data, Property 3: Position response validation enforces required fields
 * Validates: Requirements 1.3
 *
 * For any position object, the validator should accept it if and only if it contains all required
 * fields (proxyWallet, asset, conditionId, size, currentValue) with valid types.
 */
describe('Property 3: Position response validation enforces required fields', () => {
	// Generator for valid position objects
	const validPositionArbitrary = fc.record({
		proxyWallet: fc.string({ minLength: 1 }),
		asset: fc.string({ minLength: 1 }),
		conditionId: fc.string({ minLength: 1 }),
		size: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		avgPrice: fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
		initialValue: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		currentValue: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		cashPnl: fc.float({ noNaN: true, noDefaultInfinity: true }),
		percentPnl: fc.float({ noNaN: true, noDefaultInfinity: true }),
		totalBought: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		realizedPnl: fc.float({ noNaN: true, noDefaultInfinity: true }),
		percentRealizedPnl: fc.float({ noNaN: true, noDefaultInfinity: true }),
		curPrice: fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
		redeemable: fc.boolean(),
		mergeable: fc.boolean(),
		title: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		icon: fc.webUrl(),
		eventSlug: fc.string({ minLength: 1 }),
		outcome: fc.string({ minLength: 1 }),
		outcomeIndex: fc.integer({ min: 0 }),
		oppositeOutcome: fc.string({ minLength: 1 }),
		oppositeAsset: fc.string({ minLength: 1 }),
		endDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		negativeRisk: fc.boolean()
	});

	it('should validate valid position objects without throwing errors', () => {
		fc.assert(
			fc.property(validPositionArbitrary, (positionData) => {
				const result = validatePosition(positionData);
				expect(result).toEqual(positionData);
			}),
			{ numRuns: 100 }
		);
	});

	it('should validate arrays of valid positions without throwing errors', () => {
		fc.assert(
			fc.property(
				fc.array(validPositionArbitrary, { minLength: 0, maxLength: 10 }),
				(positions) => {
					const result = validatePositions(positions);
					expect(result).toEqual(positions);
				}
			),
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
					expect(() => validatePosition(invalidData)).toThrow(ValidationError);
					expect(() => validatePosition(invalidData)).toThrow('Position data must be an object');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject positions with missing required string fields', () => {
		const requiredStringFields = [
			'proxyWallet',
			'asset',
			'conditionId',
			'title',
			'slug',
			'icon',
			'eventSlug',
			'outcome',
			'oppositeOutcome',
			'oppositeAsset',
			'endDate'
		];

		fc.assert(
			fc.property(
				validPositionArbitrary,
				fc.constantFrom(...requiredStringFields),
				(positionData, fieldToRemove) => {
					const invalidPosition = { ...positionData };
					delete (invalidPosition as Record<string, unknown>)[fieldToRemove];

					expect(() => validatePosition(invalidPosition)).toThrow(ValidationError);
					expect(() => validatePosition(invalidPosition)).toThrow('Position validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject positions with missing required number fields', () => {
		const requiredNumberFields = [
			'size',
			'avgPrice',
			'initialValue',
			'currentValue',
			'cashPnl',
			'percentPnl',
			'totalBought',
			'realizedPnl',
			'percentRealizedPnl',
			'curPrice',
			'outcomeIndex'
		];

		fc.assert(
			fc.property(
				validPositionArbitrary,
				fc.constantFrom(...requiredNumberFields),
				(positionData, fieldToRemove) => {
					const invalidPosition = { ...positionData };
					delete (invalidPosition as Record<string, unknown>)[fieldToRemove];

					expect(() => validatePosition(invalidPosition)).toThrow(ValidationError);
					expect(() => validatePosition(invalidPosition)).toThrow('Position validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject positions with missing required boolean fields', () => {
		fc.assert(
			fc.property(
				validPositionArbitrary,
				fc.constantFrom('redeemable', 'mergeable', 'negativeRisk'),
				(positionData, fieldToRemove) => {
					const invalidPosition = { ...positionData };
					delete (invalidPosition as Record<string, unknown>)[fieldToRemove];

					expect(() => validatePosition(invalidPosition)).toThrow(ValidationError);
					expect(() => validatePosition(invalidPosition)).toThrow('Position validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject positions with incorrect field types', () => {
		fc.assert(
			fc.property(
				validPositionArbitrary,
				fc.constantFrom('proxyWallet', 'asset', 'size', 'redeemable'),
				fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
				(positionData, fieldToChange, wrongValue) => {
					// Skip if the wrong value happens to be the correct type
					const correctType =
						fieldToChange === 'size'
							? 'number'
							: fieldToChange === 'redeemable'
								? 'boolean'
								: 'string';
					if (typeof wrongValue === correctType) return;

					const invalidPosition = { ...positionData, [fieldToChange]: wrongValue };

					expect(() => validatePosition(invalidPosition)).toThrow(ValidationError);
					expect(() => validatePosition(invalidPosition)).toThrow('Position validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject non-array data when validating positions array', () => {
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
					expect(() => validatePositions(invalidData)).toThrow(ValidationError);
					expect(() => validatePositions(invalidData)).toThrow('Positions data must be an array');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should validate empty position arrays successfully', () => {
		const result = validatePositions([]);
		expect(result).toEqual([]);
	});
});

/**
 * Feature: polymarket-user-data, Property 5: Trade response validation enforces required fields
 * Validates: Requirements 2.3
 *
 * For any trade object, the validator should accept it if and only if it contains all required
 * fields (proxyWallet, side, asset, size, price, timestamp) with valid types and side is either 'BUY' or 'SELL'.
 */
describe('Property 5: Trade response validation enforces required fields', () => {
	// Generator for valid trade objects
	const validTradeArbitrary = fc.record({
		proxyWallet: fc.string({ minLength: 1 }),
		side: fc.constantFrom('BUY' as const, 'SELL' as const),
		asset: fc.string({ minLength: 1 }),
		conditionId: fc.string({ minLength: 1 }),
		size: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		price: fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
		timestamp: fc.integer({ min: 0 }),
		title: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		icon: fc.webUrl(),
		eventSlug: fc.string({ minLength: 1 }),
		outcome: fc.string({ minLength: 1 }),
		outcomeIndex: fc.integer({ min: 0 }),
		name: fc.string(),
		pseudonym: fc.string(),
		bio: fc.string(),
		profileImage: fc.webUrl(),
		profileImageOptimized: fc.webUrl(),
		transactionHash: fc.string({ minLength: 1 })
	});

	it('should validate valid trade objects without throwing errors', () => {
		fc.assert(
			fc.property(validTradeArbitrary, (tradeData) => {
				const result = validateTrade(tradeData);
				expect(result).toEqual(tradeData);
			}),
			{ numRuns: 100 }
		);
	});

	it('should validate arrays of valid trades without throwing errors', () => {
		fc.assert(
			fc.property(fc.array(validTradeArbitrary, { minLength: 0, maxLength: 10 }), (trades) => {
				const result = validateTrades(trades);
				expect(result).toEqual(trades);
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
					expect(() => validateTrade(invalidData)).toThrow(ValidationError);
					expect(() => validateTrade(invalidData)).toThrow('Trade data must be an object');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject trades with missing required fields', () => {
		const requiredFields = [
			'proxyWallet',
			'side',
			'asset',
			'conditionId',
			'size',
			'price',
			'timestamp'
		];

		fc.assert(
			fc.property(
				validTradeArbitrary,
				fc.constantFrom(...requiredFields),
				(tradeData, fieldToRemove) => {
					const invalidTrade = { ...tradeData };
					delete (invalidTrade as Record<string, unknown>)[fieldToRemove];

					expect(() => validateTrade(invalidTrade)).toThrow(ValidationError);
					expect(() => validateTrade(invalidTrade)).toThrow('Trade validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject trades with invalid side values', () => {
		fc.assert(
			fc.property(
				validTradeArbitrary,
				fc.string().filter((s) => s !== 'BUY' && s !== 'SELL'),
				(tradeData, invalidSide) => {
					const invalidTrade = { ...tradeData, side: invalidSide };

					expect(() => validateTrade(invalidTrade as Record<string, unknown>)).toThrow(
						ValidationError
					);
					expect(() => validateTrade(invalidTrade as Record<string, unknown>)).toThrow(
						'Trade validation failed'
					);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject non-array data when validating trades array', () => {
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
					expect(() => validateTrades(invalidData)).toThrow(ValidationError);
					expect(() => validateTrades(invalidData)).toThrow('Trades data must be an array');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should validate empty trade arrays successfully', () => {
		const result = validateTrades([]);
		expect(result).toEqual([]);
	});
});

/**
 * Feature: polymarket-user-data, Property 6: Activity response validation enforces conditional fields
 * Validates: Requirements 3.2, 3.3
 *
 * For any activity object, when the type is 'TRADE', the validator should require trade-specific
 * fields (price, asset, side) in addition to base fields; for other types, these fields should be optional.
 */
describe('Property 6: Activity response validation enforces conditional fields', () => {
	// Generator for base activity fields
	const baseActivityFields = {
		proxyWallet: fc.string({ minLength: 1 }),
		timestamp: fc.integer({ min: 0 }),
		conditionId: fc.string({ minLength: 1 }),
		size: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		usdcSize: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		transactionHash: fc.string({ minLength: 1 }),
		title: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		icon: fc.webUrl(),
		eventSlug: fc.string({ minLength: 1 }),
		outcome: fc.string({ minLength: 1 }),
		name: fc.string(),
		pseudonym: fc.string(),
		bio: fc.string(),
		profileImage: fc.webUrl(),
		profileImageOptimized: fc.webUrl()
	};

	// Generator for trade activities
	const validTradeActivityArbitrary = fc.record({
		...baseActivityFields,
		type: fc.constant('TRADE' as const),
		price: fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
		asset: fc.string({ minLength: 1 }),
		side: fc.constantFrom('BUY' as const, 'SELL' as const),
		outcomeIndex: fc.integer({ min: 0 })
	});

	// Generator for non-trade activities
	const validNonTradeActivityArbitrary = fc.record({
		...baseActivityFields,
		type: fc.constantFrom('SPLIT' as const, 'MERGE' as const, 'REDEEM' as const)
	});

	it('should validate valid trade activities with all required fields', () => {
		fc.assert(
			fc.property(validTradeActivityArbitrary, (activityData) => {
				const result = validateActivity(activityData);
				expect(result).toEqual(activityData);
			}),
			{ numRuns: 100 }
		);
	});

	it('should validate valid non-trade activities without trade-specific fields', () => {
		fc.assert(
			fc.property(validNonTradeActivityArbitrary, (activityData) => {
				const result = validateActivity(activityData);
				expect(result).toEqual(activityData);
			}),
			{ numRuns: 100 }
		);
	});

	it('should reject trade activities missing trade-specific fields', () => {
		const tradeSpecificFields = ['price', 'asset', 'side', 'outcomeIndex'];

		fc.assert(
			fc.property(
				validTradeActivityArbitrary,
				fc.constantFrom(...tradeSpecificFields),
				(activityData, fieldToRemove) => {
					const invalidActivity = { ...activityData };
					delete (invalidActivity as Record<string, unknown>)[fieldToRemove];

					expect(() => validateActivity(invalidActivity)).toThrow(ValidationError);
					expect(() => validateActivity(invalidActivity)).toThrow('Activity validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject activities with invalid type values', () => {
		fc.assert(
			fc.property(
				validTradeActivityArbitrary,
				fc.string().filter((s) => !['TRADE', 'SPLIT', 'MERGE', 'REDEEM'].includes(s)),
				(activityData, invalidType) => {
					const invalidActivity = { ...activityData, type: invalidType };

					expect(() => validateActivity(invalidActivity as Record<string, unknown>)).toThrow(
						ValidationError
					);
					expect(() => validateActivity(invalidActivity as Record<string, unknown>)).toThrow(
						'Activity validation failed'
					);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should validate arrays of valid activities', () => {
		fc.assert(
			fc.property(
				fc.array(fc.oneof(validTradeActivityArbitrary, validNonTradeActivityArbitrary), {
					minLength: 0,
					maxLength: 10
				}),
				(activities) => {
					const result = validateActivities(activities);
					expect(result).toEqual(activities);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should validate empty activity arrays successfully', () => {
		const result = validateActivities([]);
		expect(result).toEqual([]);
	});
});

/**
 * Feature: polymarket-user-data, Property 8: Holder response validation enforces required fields
 * Validates: Requirements 4.2
 *
 * For any holder object, the validator should accept it if and only if it contains all required
 * fields (proxyWallet, asset, amount, outcomeIndex) with valid types.
 */
describe('Property 8: Holder response validation enforces required fields', () => {
	// Generator for valid holder info objects
	const validHolderInfoArbitrary = fc.record({
		proxyWallet: fc.string({ minLength: 1 }),
		bio: fc.string(),
		asset: fc.string({ minLength: 1 }),
		pseudonym: fc.string(),
		amount: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		displayUsernamePublic: fc.boolean(),
		outcomeIndex: fc.integer({ min: 0 }),
		name: fc.string(),
		profileImage: fc.webUrl(),
		profileImageOptimized: fc.webUrl()
	});

	// Generator for valid market holders objects
	const validMarketHoldersArbitrary = fc.record({
		token: fc.string({ minLength: 1 }),
		holders: fc.array(validHolderInfoArbitrary, { minLength: 0, maxLength: 10 })
	});

	it('should validate valid holder info objects without throwing errors', () => {
		fc.assert(
			fc.property(validHolderInfoArbitrary, (holderData) => {
				const result = validateHolderInfo(holderData);
				expect(result).toEqual(holderData);
			}),
			{ numRuns: 100 }
		);
	});

	it('should validate valid market holders objects without throwing errors', () => {
		fc.assert(
			fc.property(validMarketHoldersArbitrary, (marketHoldersData) => {
				const result = validateMarketHolders(marketHoldersData);
				expect(result).toEqual(marketHoldersData);
			}),
			{ numRuns: 100 }
		);
	});

	it('should validate arrays of valid market holders without throwing errors', () => {
		fc.assert(
			fc.property(
				fc.array(validMarketHoldersArbitrary, { minLength: 0, maxLength: 10 }),
				(marketHoldersList) => {
					const result = validateMarketHoldersList(marketHoldersList);
					expect(result).toEqual(marketHoldersList);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject holder info with missing required fields', () => {
		const requiredFields = ['proxyWallet', 'asset', 'amount', 'outcomeIndex'];

		fc.assert(
			fc.property(
				validHolderInfoArbitrary,
				fc.constantFrom(...requiredFields),
				(holderData, fieldToRemove) => {
					const invalidHolder = { ...holderData };
					delete (invalidHolder as Record<string, unknown>)[fieldToRemove];

					expect(() => validateHolderInfo(invalidHolder)).toThrow(ValidationError);
					expect(() => validateHolderInfo(invalidHolder)).toThrow('HolderInfo validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject market holders with missing required fields', () => {
		fc.assert(
			fc.property(
				validMarketHoldersArbitrary,
				fc.constantFrom('token', 'holders'),
				(marketHoldersData, fieldToRemove) => {
					const invalidMarketHolders = { ...marketHoldersData };
					delete (invalidMarketHolders as Record<string, unknown>)[fieldToRemove];

					expect(() => validateMarketHolders(invalidMarketHolders)).toThrow(ValidationError);
					expect(() => validateMarketHolders(invalidMarketHolders)).toThrow(
						'MarketHolders validation failed'
					);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should validate empty market holders lists successfully', () => {
		const result = validateMarketHoldersList([]);
		expect(result).toEqual([]);
	});
});

/**
 * Feature: polymarket-user-data, Property 10: Portfolio value response validation enforces required fields
 * Validates: Requirements 5.3
 *
 * For any portfolio value object, the validator should accept it if and only if it contains
 * both user and value fields with valid types.
 */
describe('Property 10: Portfolio value response validation enforces required fields', () => {
	// Generator for valid portfolio value objects
	const validPortfolioValueArbitrary = fc.record({
		user: fc.string({ minLength: 1 }),
		value: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true })
	});

	it('should validate valid portfolio value objects without throwing errors', () => {
		fc.assert(
			fc.property(validPortfolioValueArbitrary, (portfolioData) => {
				const result = validatePortfolioValue(portfolioData);
				expect(result).toEqual(portfolioData);
			}),
			{ numRuns: 100 }
		);
	});

	it('should validate arrays of valid portfolio values without throwing errors', () => {
		fc.assert(
			fc.property(
				fc.array(validPortfolioValueArbitrary, { minLength: 0, maxLength: 10 }),
				(portfolioValues) => {
					const result = validatePortfolioValues(portfolioValues);
					expect(result).toEqual(portfolioValues);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject portfolio values with missing required fields', () => {
		fc.assert(
			fc.property(
				validPortfolioValueArbitrary,
				fc.constantFrom('user', 'value'),
				(portfolioData, fieldToRemove) => {
					const invalidPortfolio = { ...portfolioData };
					delete (invalidPortfolio as Record<string, unknown>)[fieldToRemove];

					expect(() => validatePortfolioValue(invalidPortfolio)).toThrow(ValidationError);
					expect(() => validatePortfolioValue(invalidPortfolio)).toThrow(
						'PortfolioValue validation failed'
					);
				}
			),
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
					expect(() => validatePortfolioValue(invalidData)).toThrow(ValidationError);
					expect(() => validatePortfolioValue(invalidData)).toThrow(
						'PortfolioValue data must be an object'
					);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should validate empty portfolio value arrays successfully', () => {
		const result = validatePortfolioValues([]);
		expect(result).toEqual([]);
	});
});

/**
 * Feature: polymarket-user-data, Property 11: Closed position response validation enforces required fields
 * Validates: Requirements 6.2
 *
 * For any closed position object, the validator should accept it if and only if it contains all
 * required fields (proxyWallet, asset, conditionId, avgPrice, realizedPnl) with valid types.
 */
describe('Property 11: Closed position response validation enforces required fields', () => {
	// Generator for valid closed position objects
	const validClosedPositionArbitrary = fc.record({
		proxyWallet: fc.string({ minLength: 1 }),
		asset: fc.string({ minLength: 1 }),
		conditionId: fc.string({ minLength: 1 }),
		avgPrice: fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
		totalBought: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		realizedPnl: fc.float({ noNaN: true, noDefaultInfinity: true }),
		curPrice: fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
		timestamp: fc.integer({ min: 0 }),
		title: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		icon: fc.webUrl(),
		eventSlug: fc.string({ minLength: 1 }),
		outcome: fc.string({ minLength: 1 }),
		outcomeIndex: fc.integer({ min: 0 }),
		oppositeOutcome: fc.string({ minLength: 1 }),
		oppositeAsset: fc.string({ minLength: 1 }),
		endDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString())
	});

	it('should validate valid closed position objects without throwing errors', () => {
		fc.assert(
			fc.property(validClosedPositionArbitrary, (closedPositionData) => {
				const result = validateClosedPosition(closedPositionData);
				expect(result).toEqual(closedPositionData);
			}),
			{ numRuns: 100 }
		);
	});

	it('should validate arrays of valid closed positions without throwing errors', () => {
		fc.assert(
			fc.property(
				fc.array(validClosedPositionArbitrary, { minLength: 0, maxLength: 10 }),
				(closedPositions) => {
					const result = validateClosedPositions(closedPositions);
					expect(result).toEqual(closedPositions);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject closed positions with missing required fields', () => {
		const requiredFields = [
			'proxyWallet',
			'asset',
			'conditionId',
			'avgPrice',
			'realizedPnl',
			'timestamp'
		];

		fc.assert(
			fc.property(
				validClosedPositionArbitrary,
				fc.constantFrom(...requiredFields),
				(closedPositionData, fieldToRemove) => {
					const invalidClosedPosition = { ...closedPositionData };
					delete (invalidClosedPosition as Record<string, unknown>)[fieldToRemove];

					expect(() => validateClosedPosition(invalidClosedPosition)).toThrow(ValidationError);
					expect(() => validateClosedPosition(invalidClosedPosition)).toThrow(
						'ClosedPosition validation failed'
					);
				}
			),
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
					expect(() => validateClosedPosition(invalidData)).toThrow(ValidationError);
					expect(() => validateClosedPosition(invalidData)).toThrow(
						'ClosedPosition data must be an object'
					);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should validate empty closed position arrays successfully', () => {
		const result = validateClosedPositions([]);
		expect(result).toEqual([]);
	});
});

/**
 * Feature: polymarket-user-data, Property 12: Timestamp validation accepts valid Unix timestamps
 * Validates: Requirements 6.5
 *
 * For any closed position with a timestamp field, the validator should accept timestamps that are
 * positive integers representing valid Unix epoch times.
 */
describe('Property 12: Timestamp validation accepts valid Unix timestamps', () => {
	// Generator for valid closed position objects with valid timestamps
	const validClosedPositionWithTimestampArbitrary = fc.record({
		proxyWallet: fc.string({ minLength: 1 }),
		asset: fc.string({ minLength: 1 }),
		conditionId: fc.string({ minLength: 1 }),
		avgPrice: fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
		totalBought: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		realizedPnl: fc.float({ noNaN: true, noDefaultInfinity: true }),
		curPrice: fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
		timestamp: fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
		title: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		icon: fc.webUrl(),
		eventSlug: fc.string({ minLength: 1 }),
		outcome: fc.string({ minLength: 1 }),
		outcomeIndex: fc.integer({ min: 0 }),
		oppositeOutcome: fc.string({ minLength: 1 }),
		oppositeAsset: fc.string({ minLength: 1 }),
		endDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString())
	});

	it('should accept valid positive integer timestamps', () => {
		fc.assert(
			fc.property(validClosedPositionWithTimestampArbitrary, (closedPositionData) => {
				const result = validateClosedPosition(closedPositionData);
				expect(result).toEqual(closedPositionData);
				expect(result.timestamp).toBeGreaterThanOrEqual(0);
				expect(Number.isInteger(result.timestamp)).toBe(true);
			}),
			{ numRuns: 100 }
		);
	});

	it('should reject negative timestamps', () => {
		fc.assert(
			fc.property(
				validClosedPositionWithTimestampArbitrary,
				fc.integer({ max: -1 }),
				(closedPositionData, negativeTimestamp) => {
					const invalidClosedPosition = { ...closedPositionData, timestamp: negativeTimestamp };

					expect(() => validateClosedPosition(invalidClosedPosition)).toThrow(ValidationError);
					expect(() => validateClosedPosition(invalidClosedPosition)).toThrow(
						'ClosedPosition validation failed'
					);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject non-integer timestamps', () => {
		fc.assert(
			fc.property(
				validClosedPositionWithTimestampArbitrary,
				fc
					.float({
						min: Math.fround(0.1),
						max: Math.fround(1000.9),
						noDefaultInfinity: true,
						noNaN: true
					})
					.filter((n) => !Number.isInteger(n)),
				(closedPositionData, floatTimestamp) => {
					const invalidClosedPosition = { ...closedPositionData, timestamp: floatTimestamp };

					expect(() => validateClosedPosition(invalidClosedPosition)).toThrow(ValidationError);
					expect(() => validateClosedPosition(invalidClosedPosition)).toThrow(
						'ClosedPosition validation failed'
					);
				}
			),
			{ numRuns: 100 }
		);
	});
});

/**
 * Feature: polymarket-tags-api, Property 5: Response structure validation
 * Validates: Requirements 1.2
 *
 * For any API response data, the validation function should verify that all required fields
 * (id, label, slug) are present and are strings, throwing a ValidationError if any field is
 * missing or has the wrong type.
 */
describe('Property 5: Response structure validation', () => {
	// Generator for valid tag objects
	const validTagArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		label: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 })
	});

	it('should validate valid tag objects without throwing errors', () => {
		fc.assert(
			fc.property(validTagArbitrary, (tagData) => {
				const result = validateTag(tagData);
				expect(result).toEqual(tagData);
			}),
			{ numRuns: 100 }
		);
	});

	it('should validate arrays of valid tags without throwing errors', () => {
		fc.assert(
			fc.property(fc.array(validTagArbitrary, { minLength: 0, maxLength: 10 }), (tags) => {
				const result = validateTags(tags);
				expect(result).toEqual(tags);
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
					expect(() => validateTag(invalidData)).toThrow(ValidationError);
					expect(() => validateTag(invalidData)).toThrow('Tag data must be an object');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject tags with missing required string fields', () => {
		const requiredStringFields = ['id', 'label', 'slug'];

		fc.assert(
			fc.property(
				validTagArbitrary,
				fc.constantFrom(...requiredStringFields),
				(tagData, fieldToRemove) => {
					const invalidTag = { ...tagData };
					delete (invalidTag as Record<string, unknown>)[fieldToRemove];

					expect(() => validateTag(invalidTag)).toThrow(ValidationError);
					expect(() => validateTag(invalidTag)).toThrow('Tag validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject tags with incorrect string field types', () => {
		const stringFields = ['id', 'label', 'slug'];

		fc.assert(
			fc.property(
				validTagArbitrary,
				fc.constantFrom(...stringFields),
				fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.array(fc.anything())),
				(tagData, fieldToChange, wrongValue) => {
					const invalidTag = { ...tagData, [fieldToChange]: wrongValue };

					expect(() => validateTag(invalidTag)).toThrow(ValidationError);
					expect(() => validateTag(invalidTag)).toThrow('Tag validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject non-array data when validating tags array', () => {
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
					expect(() => validateTags(invalidData)).toThrow(ValidationError);
					expect(() => validateTags(invalidData)).toThrow('Tags data must be an array');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject arrays containing invalid tag objects', () => {
		fc.assert(
			fc.property(
				fc.array(validTagArbitrary, { minLength: 1, maxLength: 5 }),
				fc.integer({ min: 0, max: 4 }),
				(tags, indexToCorrupt) => {
					// Only corrupt if we have enough tags
					if (indexToCorrupt >= tags.length) return;

					const corruptedTags = [...tags];
					// Remove a required field from one tag
					const corruptedTag = { ...corruptedTags[indexToCorrupt] };
					delete (corruptedTag as Record<string, unknown>).id;
					corruptedTags[indexToCorrupt] = corruptedTag;

					expect(() => validateTags(corruptedTags)).toThrow(ValidationError);
					expect(() => validateTags(corruptedTags)).toThrow(/Tag at index \d+ is invalid/);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should validate empty tag arrays successfully', () => {
		const result = validateTags([]);
		expect(result).toEqual([]);
	});
});

/**
 * Feature: polymarket-series-api, Property 3: Series response structure validation
 * Validates: Requirements 1.2, 2.3, 10.1, 10.2, 10.5
 *
 * For any API response claiming to be a series object, validation should verify all required fields
 * are present with correct types, and should recursively validate nested objects (events, collections,
 * categories, tags).
 */
describe('Property 3: Series response structure validation', () => {
	// Generator for valid ImageOptimized objects
	const validImageOptimizedArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		imageUrlSource: fc.webUrl(),
		imageUrlOptimized: fc.webUrl(),
		imageSizeKbSource: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		imageSizeKbOptimized: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		imageOptimizedComplete: fc.boolean(),
		imageOptimizedLastUpdated: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		relID: fc.integer({ min: 0 }),
		field: fc.string({ minLength: 1 }),
		relname: fc.string({ minLength: 1 })
	});

	// Generator for valid Collection objects
	const validCollectionArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		ticker: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		title: fc.string({ minLength: 1 }),
		subtitle: fc.oneof(fc.string(), fc.constant(null)),
		collectionType: fc.string({ minLength: 1 }),
		description: fc.string(),
		tags: fc.string(),
		image: fc.oneof(fc.webUrl(), fc.constant(null)),
		icon: fc.oneof(fc.webUrl(), fc.constant(null)),
		headerImage: fc.oneof(fc.webUrl(), fc.constant(null)),
		layout: fc.string({ minLength: 1 }),
		active: fc.boolean(),
		closed: fc.boolean(),
		archived: fc.boolean(),
		new: fc.boolean(),
		featured: fc.boolean(),
		restricted: fc.boolean(),
		isTemplate: fc.boolean(),
		templateVariables: fc.string(),
		publishedAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		createdBy: fc.string({ minLength: 1 }),
		updatedBy: fc.string({ minLength: 1 }),
		createdAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		updatedAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		commentsEnabled: fc.boolean(),
		imageOptimized: fc.oneof(validImageOptimizedArbitrary, fc.constant(null)),
		iconOptimized: fc.oneof(validImageOptimizedArbitrary, fc.constant(null)),
		headerImageOptimized: fc.oneof(validImageOptimizedArbitrary, fc.constant(null))
	});

	// Generator for valid Chat objects
	const validChatArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		channelId: fc.string({ minLength: 1 }),
		channelName: fc.string({ minLength: 1 }),
		channelImage: fc.oneof(fc.webUrl(), fc.constant(null)),
		live: fc.boolean(),
		startTime: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		endTime: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString())
	});

	// Generator for valid Category objects
	const validCategoryArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		name: fc.string({ minLength: 1 })
	});

	// Generator for valid Tag objects (reuse from existing tests)
	const validTagArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		label: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 })
	});

	// Generator for valid Market objects (reuse from existing tests)
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

	// Generator for valid Event objects (reuse from existing tests)
	const validEventArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		ticker: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		title: fc.string({ minLength: 1 }),
		subtitle: fc.string(),
		description: fc.string(),
		resolutionSource: fc.string(),
		startDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		creationDate: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		endDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		image: fc.webUrl(),
		icon: fc.webUrl(),
		active: fc.boolean(),
		closed: fc.boolean(),
		archived: fc.boolean(),
		new: fc.boolean(),
		featured: fc.boolean(),
		restricted: fc.boolean(),
		liquidity: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		openInterest: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		category: fc.string({ minLength: 1 }),
		subcategory: fc.string(),
		volume24hr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1wk: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1mo: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1yr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		commentCount: fc.integer({ min: 0 }),
		markets: fc.array(validMarketArbitrary, { minLength: 0, maxLength: 3 }),
		categories: fc.array(validCategoryArbitrary, { minLength: 0, maxLength: 3 }),
		tags: fc.array(validTagArbitrary, { minLength: 0, maxLength: 3 })
	});

	// Generator for valid Series objects
	const validSeriesArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		ticker: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		slug: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		title: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		subtitle: fc.oneof(fc.string(), fc.constant(null)),
		seriesType: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		recurrence: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		description: fc.oneof(fc.string(), fc.constant(null)),
		image: fc.oneof(fc.webUrl(), fc.constant(null)),
		icon: fc.oneof(fc.webUrl(), fc.constant(null)),
		layout: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		active: fc.oneof(fc.boolean(), fc.constant(null)),
		closed: fc.oneof(fc.boolean(), fc.constant(null)),
		archived: fc.oneof(fc.boolean(), fc.constant(null)),
		featured: fc.oneof(fc.boolean(), fc.constant(null)),
		restricted: fc.oneof(fc.boolean(), fc.constant(null)),
		publishedAt: fc.oneof(
			fc.integer({ min: 0, max: Date.now() }).map((timestamp) => new Date(timestamp).toISOString()),
			fc.constant(null)
		),
		createdAt: fc.oneof(
			fc.integer({ min: 0, max: Date.now() }).map((timestamp) => new Date(timestamp).toISOString()),
			fc.constant(null)
		),
		updatedAt: fc.oneof(
			fc.integer({ min: 0, max: Date.now() }).map((timestamp) => new Date(timestamp).toISOString()),
			fc.constant(null)
		),
		volume24hr: fc.oneof(
			fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
			fc.constant(null)
		),
		volume: fc.oneof(fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }), fc.constant(null)),
		liquidity: fc.oneof(
			fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
			fc.constant(null)
		),
		pythTokenID: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		cgAssetName: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		score: fc.oneof(fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }), fc.constant(null)),
		events: fc.array(validEventArbitrary, { minLength: 0, maxLength: 3 }),
		collections: fc.array(validCollectionArbitrary, { minLength: 0, maxLength: 3 }),
		categories: fc.array(validCategoryArbitrary, { minLength: 0, maxLength: 3 }),
		tags: fc.array(validTagArbitrary, { minLength: 0, maxLength: 3 }),
		chats: fc.array(validChatArbitrary, { minLength: 0, maxLength: 3 })
	});

	it('should validate valid series objects without throwing errors', () => {
		fc.assert(
			fc.property(validSeriesArbitrary, (seriesData) => {
				// Should not throw for valid data
				const result = validateSeries(seriesData);

				// Result should be the same as input (validated)
				expect(result).toEqual(seriesData);
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
					expect(() => validateSeries(invalidData)).toThrow(ValidationError);
					expect(() => validateSeries(invalidData)).toThrow('Series data must be an object');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject series with missing required string fields', () => {
		const requiredStringFields = ['id'];

		fc.assert(
			fc.property(
				validSeriesArbitrary,
				fc.constantFrom(...requiredStringFields),
				(seriesData, fieldToRemove) => {
					const invalidSeries = { ...seriesData };
					delete (invalidSeries as Record<string, unknown>)[fieldToRemove];

					expect(() => validateSeries(invalidSeries)).toThrow(ValidationError);
					expect(() => validateSeries(invalidSeries)).toThrow('Series validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should not reject series with missing optional boolean fields', () => {
		const optionalBooleanFields = [
			'active',
			'closed',
			'archived',
			'new',
			'featured',
			'restricted',
			'isTemplate',
			'templateVariables',
			'commentsEnabled'
		];

		fc.assert(
			fc.property(
				validSeriesArbitrary,
				fc.constantFrom(...optionalBooleanFields),
				(seriesData, fieldToRemove) => {
					const invalidSeries = { ...seriesData };
					delete (invalidSeries as Record<string, unknown>)[fieldToRemove];

					const result = validateSeries(invalidSeries);
					expect(result).toBeTruthy();
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should not reject series with missing optional number fields', () => {
		const optionalNumberFields = ['volume24hr', 'volume', 'liquidity', 'score', 'commentCount'];

		fc.assert(
			fc.property(
				validSeriesArbitrary,
				fc.constantFrom(...optionalNumberFields),
				(seriesData, fieldToRemove) => {
					const invalidSeries = { ...seriesData };
					delete (invalidSeries as Record<string, unknown>)[fieldToRemove];

					const result = validateSeries(invalidSeries);
					expect(result).toBeTruthy();
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should not reject series with missing optional array fields', () => {
		fc.assert(
			fc.property(
				validSeriesArbitrary,
				fc.constantFrom('events', 'collections', 'categories', 'tags', 'chats'),
				(seriesData, fieldToRemove) => {
					const invalidSeries = { ...seriesData };
					delete (invalidSeries as Record<string, unknown>)[fieldToRemove];

					const result = validateSeries(invalidSeries);
					expect(result).toBeTruthy();
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject series with incorrect string field types', () => {
		const requiredStringFields = ['id'];
		const optionalStringFields = [
			'ticker',
			'slug',
			'title',
			'seriesType',
			'recurrence',
			'description',
			'layout'
		];

		fc.assert(
			fc.property(
				validSeriesArbitrary,
				fc.constantFrom(...requiredStringFields),
				fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.anything())),
				(seriesData, fieldToChange, wrongValue) => {
					const invalidSeries = { ...seriesData, [fieldToChange]: wrongValue };

					expect(() => validateSeries(invalidSeries)).toThrow(ValidationError);
					expect(() => validateSeries(invalidSeries)).toThrow('Series validation failed');
				}
			),
			{ numRuns: 50 }
		);

		fc.assert(
			fc.property(
				validSeriesArbitrary,
				fc.constantFrom(...optionalStringFields),
				fc.oneof(fc.integer(), fc.boolean(), fc.array(fc.anything())),
				(seriesData, fieldToChange, wrongValue) => {
					const invalidSeries = { ...seriesData, [fieldToChange]: wrongValue };

					expect(() => validateSeries(invalidSeries)).toThrow(ValidationError);
					expect(() => validateSeries(invalidSeries)).toThrow('Series validation failed');
				}
			),
			{ numRuns: 50 }
		);
	});

	it('should reject series with incorrect number field types', () => {
		const numberFields = ['volume24hr', 'volume', 'liquidity', 'score', 'commentCount'];

		fc.assert(
			fc.property(
				validSeriesArbitrary,
				fc.constantFrom(...numberFields),
				fc.oneof(fc.string(), fc.boolean(), fc.constant(NaN)),
				(seriesData, fieldToChange, wrongValue) => {
					const invalidSeries = { ...seriesData, [fieldToChange]: wrongValue };

					expect(() => validateSeries(invalidSeries)).toThrow(ValidationError);
					expect(() => validateSeries(invalidSeries)).toThrow('Series validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject series with incorrect boolean field types', () => {
		const booleanFields = [
			'active',
			'closed',
			'archived',
			'new',
			'featured',
			'restricted',
			'isTemplate',
			'templateVariables',
			'commentsEnabled'
		];

		fc.assert(
			fc.property(
				validSeriesArbitrary,
				fc.constantFrom(...booleanFields),
				fc.oneof(fc.string(), fc.integer()),
				(seriesData, fieldToChange, wrongValue) => {
					const invalidSeries = { ...seriesData, [fieldToChange]: wrongValue };

					expect(() => validateSeries(invalidSeries)).toThrow(ValidationError);
					expect(() => validateSeries(invalidSeries)).toThrow('Series validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject series with incorrect array field types', () => {
		fc.assert(
			fc.property(
				validSeriesArbitrary,
				fc.constantFrom('events', 'collections', 'categories', 'tags', 'chats'),
				fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
				(seriesData, fieldToChange, wrongValue) => {
					const invalidSeries = { ...seriesData, [fieldToChange]: wrongValue };

					expect(() => validateSeries(invalidSeries)).toThrow(ValidationError);
					expect(() => validateSeries(invalidSeries)).toThrow('Series validation failed');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should accept series with null optional string fields', () => {
		fc.assert(
			fc.property(
				validSeriesArbitrary,
				fc.constantFrom('subtitle', 'image', 'icon', 'pythTokenID', 'cgAssetName'),
				(seriesData, fieldToSetNull) => {
					const seriesWithNull = { ...seriesData, [fieldToSetNull]: null };
					expect(() => validateSeries(seriesWithNull)).not.toThrow();
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should accept series with events arrays without deep validation', () => {
		fc.assert(
			fc.property(validSeriesArbitrary, (seriesData) => {
				const result = validateSeries(seriesData);
				expect(result).toBeTruthy();
				expect(result.events).toEqual(seriesData.events);
			}),
			{ numRuns: 100 }
		);
	});

	it('should accept series with collections arrays without deep validation', () => {
		fc.assert(
			fc.property(validSeriesArbitrary, (seriesData) => {
				const result = validateSeries(seriesData);
				expect(result).toBeTruthy();
				expect(result.collections).toEqual(seriesData.collections);
			}),
			{ numRuns: 100 }
		);
	});

	it('should accept series with categories arrays without deep validation', () => {
		fc.assert(
			fc.property(validSeriesArbitrary, (seriesData) => {
				const result = validateSeries(seriesData);
				expect(result).toBeTruthy();
				expect(result.categories).toEqual(seriesData.categories);
			}),
			{ numRuns: 100 }
		);
	});

	it('should accept series with tags arrays without deep validation', () => {
		fc.assert(
			fc.property(validSeriesArbitrary, (seriesData) => {
				const result = validateSeries(seriesData);
				expect(result).toBeTruthy();
				expect(result.tags).toEqual(seriesData.tags);
			}),
			{ numRuns: 100 }
		);
	});

	it('should accept series with chats arrays without deep validation', () => {
		fc.assert(
			fc.property(validSeriesArbitrary, (seriesData) => {
				const result = validateSeries(seriesData);
				expect(result).toBeTruthy();
				expect(result.chats).toEqual(seriesData.chats);
			}),
			{ numRuns: 100 }
		);
	});
});

/**
 * Feature: polymarket-series-api, Property 4: Series array validation
 * Validates: Requirements 10.3
 *
 * For any API response claiming to be a series array, validation should verify it is an array
 * and that each element passes series validation.
 */
describe('Property 4: Series array validation', () => {
	// Reuse the series generator from Property 3
	const validImageOptimizedArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		imageUrlSource: fc.webUrl(),
		imageUrlOptimized: fc.webUrl(),
		imageSizeKbSource: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		imageSizeKbOptimized: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		imageOptimizedComplete: fc.boolean(),
		imageOptimizedLastUpdated: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		relID: fc.integer({ min: 0 }),
		field: fc.string({ minLength: 1 }),
		relname: fc.string({ minLength: 1 })
	});

	const validCollectionArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		ticker: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		title: fc.string({ minLength: 1 }),
		subtitle: fc.oneof(fc.string(), fc.constant(null)),
		collectionType: fc.string({ minLength: 1 }),
		description: fc.string(),
		tags: fc.string(),
		image: fc.oneof(fc.webUrl(), fc.constant(null)),
		icon: fc.oneof(fc.webUrl(), fc.constant(null)),
		headerImage: fc.oneof(fc.webUrl(), fc.constant(null)),
		layout: fc.string({ minLength: 1 }),
		active: fc.boolean(),
		closed: fc.boolean(),
		archived: fc.boolean(),
		new: fc.boolean(),
		featured: fc.boolean(),
		restricted: fc.boolean(),
		isTemplate: fc.boolean(),
		templateVariables: fc.string(),
		publishedAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		createdBy: fc.string({ minLength: 1 }),
		updatedBy: fc.string({ minLength: 1 }),
		createdAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		updatedAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		commentsEnabled: fc.boolean(),
		imageOptimized: fc.oneof(validImageOptimizedArbitrary, fc.constant(null)),
		iconOptimized: fc.oneof(validImageOptimizedArbitrary, fc.constant(null)),
		headerImageOptimized: fc.oneof(validImageOptimizedArbitrary, fc.constant(null))
	});

	const validChatArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		channelId: fc.string({ minLength: 1 }),
		channelName: fc.string({ minLength: 1 }),
		channelImage: fc.oneof(fc.webUrl(), fc.constant(null)),
		live: fc.boolean(),
		startTime: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		endTime: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString())
	});

	const validCategoryArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		name: fc.string({ minLength: 1 })
	});

	const validTagArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		label: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 })
	});

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

	const validEventArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		ticker: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		title: fc.string({ minLength: 1 }),
		subtitle: fc.string(),
		description: fc.string(),
		resolutionSource: fc.string(),
		startDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		creationDate: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		endDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		image: fc.webUrl(),
		icon: fc.webUrl(),
		active: fc.boolean(),
		closed: fc.boolean(),
		archived: fc.boolean(),
		new: fc.boolean(),
		featured: fc.boolean(),
		restricted: fc.boolean(),
		liquidity: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		openInterest: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		category: fc.string({ minLength: 1 }),
		subcategory: fc.string(),
		volume24hr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1wk: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1mo: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1yr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		commentCount: fc.integer({ min: 0 }),
		markets: fc.array(validMarketArbitrary, { minLength: 0, maxLength: 2 }),
		categories: fc.array(validCategoryArbitrary, { minLength: 0, maxLength: 2 }),
		tags: fc.array(validTagArbitrary, { minLength: 0, maxLength: 2 })
	});

	const validSeriesArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		ticker: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		slug: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		title: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		subtitle: fc.oneof(fc.string(), fc.constant(null)),
		seriesType: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		recurrence: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		description: fc.oneof(fc.string(), fc.constant(null)),
		image: fc.oneof(fc.webUrl(), fc.constant(null)),
		icon: fc.oneof(fc.webUrl(), fc.constant(null)),
		layout: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		active: fc.oneof(fc.boolean(), fc.constant(null)),
		closed: fc.oneof(fc.boolean(), fc.constant(null)),
		archived: fc.oneof(fc.boolean(), fc.constant(null)),
		new: fc.oneof(fc.boolean(), fc.constant(null)),
		featured: fc.oneof(fc.boolean(), fc.constant(null)),
		restricted: fc.oneof(fc.boolean(), fc.constant(null)),
		isTemplate: fc.oneof(fc.boolean(), fc.constant(null)),
		templateVariables: fc.oneof(fc.boolean(), fc.constant(null)),
		publishedAt: fc.oneof(
			fc.integer({ min: 0, max: Date.now() }).map((timestamp) => new Date(timestamp).toISOString()),
			fc.constant(null)
		),
		createdBy: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		updatedBy: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		createdAt: fc.oneof(
			fc.integer({ min: 0, max: Date.now() }).map((timestamp) => new Date(timestamp).toISOString()),
			fc.constant(null)
		),
		updatedAt: fc.oneof(
			fc.integer({ min: 0, max: Date.now() }).map((timestamp) => new Date(timestamp).toISOString()),
			fc.constant(null)
		),
		commentsEnabled: fc.oneof(fc.boolean(), fc.constant(null)),
		competitive: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		volume24hr: fc.oneof(
			fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
			fc.constant(null)
		),
		volume: fc.oneof(fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }), fc.constant(null)),
		liquidity: fc.oneof(
			fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
			fc.constant(null)
		),
		startDate: fc.oneof(
			fc
				.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
				.map((timestamp) => new Date(timestamp).toISOString()),
			fc.constant(null)
		),
		pythTokenID: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		cgAssetName: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		score: fc.oneof(fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }), fc.constant(null)),
		commentCount: fc.oneof(fc.integer({ min: 0 }), fc.constant(null)),
		events: fc.array(validEventArbitrary, { minLength: 0, maxLength: 2 }),
		collections: fc.array(validCollectionArbitrary, { minLength: 0, maxLength: 2 }),
		categories: fc.array(validCategoryArbitrary, { minLength: 0, maxLength: 2 }),
		tags: fc.array(validTagArbitrary, { minLength: 0, maxLength: 2 }),
		chats: fc.array(validChatArbitrary, { minLength: 0, maxLength: 2 })
	});

	it('should validate arrays of valid series without throwing errors', () => {
		fc.assert(
			fc.property(fc.array(validSeriesArbitrary, { minLength: 0, maxLength: 10 }), (seriesList) => {
				// Should not throw for valid data
				const result = validateSeriesList(seriesList);

				// Result should be the same as input (validated)
				expect(result).toEqual(seriesList);
			}),
			{ numRuns: 100 }
		);
	});

	it('should reject non-array data when validating series list', () => {
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
					expect(() => validateSeriesList(invalidData)).toThrow(ValidationError);
					expect(() => validateSeriesList(invalidData)).toThrow('Series data must be an array');
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should reject arrays containing invalid series objects', () => {
		fc.assert(
			fc.property(
				fc.array(validSeriesArbitrary, { minLength: 1, maxLength: 5 }),
				fc.integer({ min: 0, max: 4 }),
				(seriesList, indexToCorrupt) => {
					// Only corrupt if we have enough series
					if (indexToCorrupt >= seriesList.length) return;

					const corruptedSeriesList = [...seriesList];
					// Remove a required field from one series
					const corruptedSeries = { ...corruptedSeriesList[indexToCorrupt] };
					delete (corruptedSeries as Record<string, unknown>).id;
					corruptedSeriesList[indexToCorrupt] = corruptedSeries;

					expect(() => validateSeriesList(corruptedSeriesList)).toThrow(ValidationError);
					expect(() => validateSeriesList(corruptedSeriesList)).toThrow(
						/Series at index \d+ is invalid/
					);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should validate empty series arrays successfully', () => {
		const result = validateSeriesList([]);
		expect(result).toEqual([]);
	});

	it('should include index information in error messages for invalid series', () => {
		fc.assert(
			fc.property(
				fc.array(validSeriesArbitrary, { minLength: 2, maxLength: 5 }),
				fc.integer({ min: 0, max: 4 }),
				(seriesList, indexToCorrupt) => {
					if (indexToCorrupt >= seriesList.length) return;

					const corruptedSeriesList = [...seriesList];
					const corruptedSeries = { ...corruptedSeriesList[indexToCorrupt] };
					delete (corruptedSeries as Record<string, unknown>).id;
					corruptedSeriesList[indexToCorrupt] = corruptedSeries;

					try {
						validateSeriesList(corruptedSeriesList);
						expect(true).toBe(false);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.message).toContain(`Series at index ${indexToCorrupt}`);
							expect(error.details).toHaveProperty('index', indexToCorrupt);
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});
});

/**
 * Feature: polymarket-series-api, Property 5: Validation error reporting
 * Validates: Requirements 10.4
 *
 * For any invalid response data, validation should throw a ValidationError that includes
 * details about which field or structure failed validation.
 */
describe('Property 5: Validation error reporting', () => {
	// Reuse generators from previous tests
	const validImageOptimizedArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		imageUrlSource: fc.webUrl(),
		imageUrlOptimized: fc.webUrl(),
		imageSizeKbSource: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		imageSizeKbOptimized: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		imageOptimizedComplete: fc.boolean(),
		imageOptimizedLastUpdated: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		relID: fc.integer({ min: 0 }),
		field: fc.string({ minLength: 1 }),
		relname: fc.string({ minLength: 1 })
	});

	const validCollectionArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		ticker: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		title: fc.string({ minLength: 1 }),
		subtitle: fc.oneof(fc.string(), fc.constant(null)),
		collectionType: fc.string({ minLength: 1 }),
		description: fc.string(),
		tags: fc.string(),
		image: fc.oneof(fc.webUrl(), fc.constant(null)),
		icon: fc.oneof(fc.webUrl(), fc.constant(null)),
		headerImage: fc.oneof(fc.webUrl(), fc.constant(null)),
		layout: fc.string({ minLength: 1 }),
		active: fc.boolean(),
		closed: fc.boolean(),
		archived: fc.boolean(),
		new: fc.boolean(),
		featured: fc.boolean(),
		restricted: fc.boolean(),
		isTemplate: fc.boolean(),
		templateVariables: fc.string(),
		publishedAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		createdBy: fc.string({ minLength: 1 }),
		updatedBy: fc.string({ minLength: 1 }),
		createdAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		updatedAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		commentsEnabled: fc.boolean(),
		imageOptimized: fc.oneof(validImageOptimizedArbitrary, fc.constant(null)),
		iconOptimized: fc.oneof(validImageOptimizedArbitrary, fc.constant(null)),
		headerImageOptimized: fc.oneof(validImageOptimizedArbitrary, fc.constant(null))
	});

	const validChatArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		channelId: fc.string({ minLength: 1 }),
		channelName: fc.string({ minLength: 1 }),
		channelImage: fc.oneof(fc.webUrl(), fc.constant(null)),
		live: fc.boolean(),
		startTime: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		endTime: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString())
	});

	const validCategoryArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		name: fc.string({ minLength: 1 })
	});

	const validTagArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		label: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 })
	});

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

	const validEventArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		ticker: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		title: fc.string({ minLength: 1 }),
		subtitle: fc.string(),
		description: fc.string(),
		resolutionSource: fc.string(),
		startDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		creationDate: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		endDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		image: fc.webUrl(),
		icon: fc.webUrl(),
		active: fc.boolean(),
		closed: fc.boolean(),
		archived: fc.boolean(),
		new: fc.boolean(),
		featured: fc.boolean(),
		restricted: fc.boolean(),
		liquidity: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		openInterest: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		category: fc.string({ minLength: 1 }),
		subcategory: fc.string(),
		volume24hr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1wk: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1mo: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume1yr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		commentCount: fc.integer({ min: 0 }),
		markets: fc.array(validMarketArbitrary, { minLength: 0, maxLength: 2 }),
		categories: fc.array(validCategoryArbitrary, { minLength: 0, maxLength: 2 }),
		tags: fc.array(validTagArbitrary, { minLength: 0, maxLength: 2 })
	});

	const validSeriesArbitrary = fc.record({
		id: fc.string({ minLength: 1 }),
		ticker: fc.string({ minLength: 1 }),
		slug: fc.string({ minLength: 1 }),
		title: fc.string({ minLength: 1 }),
		subtitle: fc.oneof(fc.string(), fc.constant(null)),
		seriesType: fc.string({ minLength: 1 }),
		recurrence: fc.string({ minLength: 1 }),
		description: fc.string(),
		image: fc.oneof(fc.webUrl(), fc.constant(null)),
		icon: fc.oneof(fc.webUrl(), fc.constant(null)),
		layout: fc.string({ minLength: 1 }),
		active: fc.boolean(),
		closed: fc.boolean(),
		archived: fc.boolean(),
		new: fc.boolean(),
		featured: fc.boolean(),
		restricted: fc.boolean(),
		isTemplate: fc.boolean(),
		templateVariables: fc.boolean(),
		publishedAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		createdBy: fc.string({ minLength: 1 }),
		updatedBy: fc.string({ minLength: 1 }),
		createdAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		updatedAt: fc
			.integer({ min: 0, max: Date.now() })
			.map((timestamp) => new Date(timestamp).toISOString()),
		commentsEnabled: fc.boolean(),
		competitive: fc.string({ minLength: 1 }),
		volume24hr: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		volume: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		liquidity: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		startDate: fc
			.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
			.map((timestamp) => new Date(timestamp).toISOString()),
		pythTokenID: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		cgAssetName: fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)),
		score: fc.float({ min: 0, noNaN: true, noDefaultInfinity: true }),
		events: fc.array(validEventArbitrary, { minLength: 0, maxLength: 2 }),
		collections: fc.array(validCollectionArbitrary, { minLength: 0, maxLength: 2 }),
		categories: fc.array(validCategoryArbitrary, { minLength: 0, maxLength: 2 }),
		tags: fc.array(validTagArbitrary, { minLength: 0, maxLength: 2 }),
		commentCount: fc.integer({ min: 0 }),
		chats: fc.array(validChatArbitrary, { minLength: 0, maxLength: 2 })
	});

	it('should include missing field names in error details when required fields are missing', () => {
		fc.assert(
			fc.property(validSeriesArbitrary, fc.constantFrom('id'), (seriesData, fieldToRemove) => {
				const invalidSeries = { ...seriesData };
				delete (invalidSeries as Record<string, unknown>)[fieldToRemove];

				try {
					validateSeries(invalidSeries);
					expect(true).toBe(false);
				} catch (error) {
					expect(error).toBeInstanceOf(ValidationError);
					if (error instanceof ValidationError) {
						expect(error.message).toContain('Series validation failed');
						expect(error.details).toHaveProperty('missingFields');
						const details = error.details as { missingFields?: string[] };
						expect(details.missingFields).toContain(fieldToRemove);
					}
				}
			}),
			{ numRuns: 100 }
		);
	});

	it('should include invalid type information in error details when types are wrong', () => {
		fc.assert(
			fc.property(
				validSeriesArbitrary,
				fc.constantFrom('id', 'ticker', 'active', 'volume'),
				fc.oneof(fc.integer(), fc.boolean()),
				(seriesData, fieldToCorrupt, wrongValue) => {
					const currentValue = (seriesData as Record<string, unknown>)[fieldToCorrupt];
					if (typeof currentValue === typeof wrongValue) return;
					if (fieldToCorrupt !== 'id' && wrongValue === null) return;

					const invalidSeries = { ...seriesData, [fieldToCorrupt]: wrongValue };

					try {
						validateSeries(invalidSeries);
						expect(true).toBe(false);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							expect(error.message).toContain('Series validation failed');
							expect(error.details).toHaveProperty('invalidTypes');
							const details = error.details as { invalidTypes?: string[] };
							expect(details.invalidTypes?.some((msg) => msg.includes(fieldToCorrupt))).toBe(true);
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should accept series without deep validation of nested objects', () => {
		fc.assert(
			fc.property(validSeriesArbitrary, (seriesData) => {
				const result = validateSeries(seriesData);
				expect(result).toBeTruthy();
			}),
			{ numRuns: 100 }
		);
	});

	it('should throw ValidationError (not generic Error) for all validation failures', () => {
		fc.assert(
			fc.property(
				fc.oneof(
					fc.string(),
					fc.integer(),
					fc.boolean(),
					fc.constant(null),
					fc.record({}),
					validSeriesArbitrary.map((s) => ({ ...s, id: 123 }))
				),
				(invalidData) => {
					try {
						validateSeries(invalidData);
						expect(true).toBe(false);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						expect(error).toBeInstanceOf(Error);
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should include both missing fields and invalid types in error details when both exist', () => {
		fc.assert(
			fc.property(validSeriesArbitrary, (seriesData) => {
				const invalidSeries = { ...seriesData };
				delete (invalidSeries as Record<string, unknown>).id;
				(invalidSeries as Record<string, unknown>).active = 'not-a-boolean';

				try {
					validateSeries(invalidSeries);
					expect(true).toBe(false);
				} catch (error) {
					expect(error).toBeInstanceOf(ValidationError);
					if (error instanceof ValidationError) {
						expect(error.message).toContain('Series validation failed');
						expect(error.details).toHaveProperty('missingFields');
						expect(error.details).toHaveProperty('invalidTypes');
						const details = error.details as {
							missingFields?: string[];
							invalidTypes?: string[];
						};
						expect(details.missingFields).toContain('id');
						expect(details.invalidTypes?.some((msg) => msg.includes('active'))).toBe(true);
					}
				}
			}),
			{ numRuns: 100 }
		);
	});

	it('should provide clear error messages for array validation failures', () => {
		fc.assert(
			fc.property(
				fc.array(validSeriesArbitrary, { minLength: 1, maxLength: 3 }),
				fc.integer({ min: 0, max: 2 }),
				(seriesList, indexToCorrupt) => {
					// Only corrupt if we have enough series
					if (indexToCorrupt >= seriesList.length) return;

					const corruptedSeriesList = [...seriesList];
					const corruptedSeries = { ...corruptedSeriesList[indexToCorrupt] };
					delete (corruptedSeries as Record<string, unknown>).id;
					corruptedSeriesList[indexToCorrupt] = corruptedSeries;

					try {
						validateSeriesList(corruptedSeriesList);
						// Should not reach here
						expect(true).toBe(false);
					} catch (error) {
						expect(error).toBeInstanceOf(ValidationError);
						if (error instanceof ValidationError) {
							// Should mention the specific index
							expect(error.message).toContain(`Series at index ${indexToCorrupt}`);
							expect(error.details).toHaveProperty('index', indexToCorrupt);
							expect(error.details).toHaveProperty('originalError');
						}
					}
				}
			),
			{ numRuns: 100 }
		);
	});

	describe('Comment validation', () => {
		// Valid comment arbitraries
		const validCommentImageOptimizedArbitrary = fc.record({
			original: fc.oneof(fc.constant(null), fc.webUrl()),
			small: fc.oneof(fc.constant(null), fc.webUrl()),
			medium: fc.oneof(fc.constant(null), fc.webUrl()),
			large: fc.oneof(fc.constant(null), fc.webUrl())
		});

		const validUserPositionArbitrary = fc.record({
			tokenId: fc.string({ minLength: 1 }),
			positionSize: fc.double({ min: 0, noNaN: true })
		});

		const validCommentProfileArbitrary = fc.record({
			name: fc.oneof(fc.constant(null), fc.string()),
			pseudonym: fc.oneof(fc.constant(null), fc.string()),
			bio: fc.oneof(fc.constant(null), fc.string()),
			isMod: fc.boolean(),
			isCreator: fc.boolean(),
			walletAddress: fc.constant('0x' + 'a'.repeat(40)),
			proxyWalletAddress: fc.oneof(fc.constant(null), fc.constant('0x' + 'a'.repeat(40))),
			profileImage: fc.oneof(fc.constant(null), fc.webUrl()),
			profileImageOptimized: fc.oneof(fc.constant(null), validCommentImageOptimizedArbitrary),
			positions: fc.array(validUserPositionArbitrary, { maxLength: 5 })
		});

		const validReactionArbitrary = fc.record({
			id: fc.integer({ min: 0 }),
			commentID: fc.integer({ min: 0 }),
			reactionType: fc.constantFrom('like', 'love', 'haha', 'wow', 'sad', 'angry'),
			icon: fc.string({ minLength: 1 }),
			userAddress: fc.constant('0x' + 'a'.repeat(40)),
			createdAt: fc
				.integer({ min: 0, max: Date.now() })
				.map((timestamp) => new Date(timestamp).toISOString()),
			profile: validCommentProfileArbitrary
		});

		const validCommentArbitrary = fc.record({
			id: fc.integer({ min: 0 }),
			body: fc.string({ minLength: 1 }),
			parentEntityType: fc.constantFrom('Event', 'Series', 'market'),
			parentEntityID: fc.integer({ min: 0 }),
			parentCommentID: fc.oneof(fc.constant(null), fc.integer({ min: 0 })),
			userAddress: fc.constant('0x' + 'a'.repeat(40)),
			replyAddress: fc.oneof(fc.constant(null), fc.constant('0x' + 'a'.repeat(40))),
			createdAt: fc
				.integer({ min: 0, max: Date.now() })
				.map((timestamp) => new Date(timestamp).toISOString()),
			updatedAt: fc
				.integer({ min: 0, max: Date.now() })
				.map((timestamp) => new Date(timestamp).toISOString()),
			profile: validCommentProfileArbitrary,
			reactions: fc.array(validReactionArbitrary, { maxLength: 5 }),
			reportCount: fc.integer({ min: 0 }),
			reactionCount: fc.integer({ min: 0 })
		});

		it('should validate valid CommentImageOptimized', () => {
			fc.assert(
				fc.property(validCommentImageOptimizedArbitrary, (imageOpt) => {
					expect(() => validateCommentImageOptimized(imageOpt)).not.toThrow();
					const result = validateCommentImageOptimized(imageOpt);
					expect(result).toBeDefined();
					expect(typeof result).toBe('object');
				}),
				{ numRuns: 100 }
			);
		});

		it('should reject invalid CommentImageOptimized', () => {
			fc.assert(
				fc.property(
					fc.oneof(
						fc.constant(null),
						fc.string(),
						fc.integer(),
						fc.boolean(),
						fc.array(fc.anything())
					),
					(invalidImageOpt) => {
						expect(() => validateCommentImageOptimized(invalidImageOpt)).toThrow(ValidationError);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should validate valid UserPosition', () => {
			fc.assert(
				fc.property(validUserPositionArbitrary, (position) => {
					expect(() => validateUserPosition(position)).not.toThrow();
					const result = validateUserPosition(position);
					expect(result).toBeDefined();
					expect(typeof result.tokenId).toBe('string');
					expect(typeof result.positionSize).toBe('number');
				}),
				{ numRuns: 100 }
			);
		});

		it('should reject invalid UserPosition', () => {
			const invalidPosition = {
				tokenId: 123, // should be string
				positionSize: 1.5
			};
			expect(() => validateUserPosition(invalidPosition)).toThrow(ValidationError);
		});

		it('should validate valid CommentProfile', () => {
			fc.assert(
				fc.property(validCommentProfileArbitrary, (profile) => {
					expect(() => validateCommentProfile(profile)).not.toThrow();
					const result = validateCommentProfile(profile);
					expect(result).toBeDefined();
					expect(typeof result.isMod).toBe('boolean');
					expect(typeof result.isCreator).toBe('boolean');
					expect(typeof result.walletAddress).toBe('string');
					expect(Array.isArray(result.positions)).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		it('should reject CommentProfile with invalid required fields', () => {
			const invalidProfile = {
				name: null,
				pseudonym: null,
				bio: null,
				isMod: 'not-a-boolean', // should be boolean
				isCreator: true,
				walletAddress: '0x1234567890123456789012345678901234567890',
				proxyWalletAddress: null,
				profileImage: null,
				profileImageOptimized: null,
				positions: []
			};
			expect(() => validateCommentProfile(invalidProfile)).toThrow(ValidationError);
		});

		it('should validate valid Reaction', () => {
			fc.assert(
				fc.property(validReactionArbitrary, (reaction) => {
					expect(() => validateReaction(reaction)).not.toThrow();
					const result = validateReaction(reaction);
					expect(result).toBeDefined();
					expect(typeof result.id).toBe('number');
					expect(typeof result.commentID).toBe('number');
					expect(typeof result.reactionType).toBe('string');
				}),
				{ numRuns: 100 }
			);
		});

		it('should reject invalid Reaction', () => {
			const invalidReaction = {
				id: 'not-a-number', // should be number or numeric string
				commentID: 456,
				reactionType: 'like',
				icon: 'emoji',
				userAddress: '0x1234567890123456789012345678901234567890',
				createdAt: new Date().toISOString(),
				profile: {
					name: null,
					pseudonym: null,
					bio: null,
					isMod: true,
					isCreator: false,
					walletAddress: '0x1234567890123456789012345678901234567890',
					proxyWalletAddress: null,
					profileImage: null,
					profileImageOptimized: null,
					positions: []
				}
			};
			expect(() => validateReaction(invalidReaction)).toThrow(ValidationError);
		});

		it('should validate valid Comment', () => {
			fc.assert(
				fc.property(validCommentArbitrary, (comment) => {
					expect(() => validateComment(comment)).not.toThrow();
					const result = validateComment(comment);
					expect(result).toBeDefined();
					expect(typeof result.id).toBe('number');
					expect(typeof result.body).toBe('string');
					expect(['Event', 'Series', 'market']).toContain(result.parentEntityType);
					expect(typeof result.parentEntityID).toBe('number');
					expect(Array.isArray(result.reactions)).toBe(true);
				}),
				{ numRuns: 100 }
			);
		});

		it('should reject Comment with invalid parentEntityType', () => {
			const invalidComment = {
				id: 1,
				body: 'Test comment',
				parentEntityType: 'InvalidType', // should be Event, Series, or market
				parentEntityID: 123,
				parentCommentID: null,
				userAddress: '0x1234567890123456789012345678901234567890',
				replyAddress: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				profile: {
					name: null,
					pseudonym: null,
					bio: null,
					isMod: false,
					isCreator: false,
					walletAddress: '0x1234567890123456789012345678901234567890',
					proxyWalletAddress: null,
					profileImage: null,
					profileImageOptimized: null,
					positions: []
				},
				reactions: [],
				reportCount: 0,
				reactionCount: 0
			};
			expect(() => validateComment(invalidComment)).toThrow(ValidationError);
		});

		it('should reject Comment with missing required fields', () => {
			const invalidComment = {
				id: 1,
				body: 'Test comment'
				// missing other required fields
			};
			expect(() => validateComment(invalidComment)).toThrow(ValidationError);
		});

		it('should validate valid Comments array', () => {
			fc.assert(
				fc.property(fc.array(validCommentArbitrary, { maxLength: 5 }), (comments) => {
					expect(() => validateComments(comments)).not.toThrow();
					const result = validateComments(comments);
					expect(Array.isArray(result)).toBe(true);
					expect(result.length).toBe(comments.length);
				}),
				{ numRuns: 100 }
			);
		});

		it('should reject non-array Comments data', () => {
			fc.assert(
				fc.property(
					fc.oneof(fc.constant(null), fc.string(), fc.integer(), fc.boolean(), fc.object()),
					(invalidData) => {
						expect(() => validateComments(invalidData)).toThrow(ValidationError);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should provide clear error messages for array validation failures', () => {
			fc.assert(
				fc.property(
					fc.array(validCommentArbitrary, { minLength: 1, maxLength: 3 }),
					fc.integer({ min: 0, max: 2 }),
					(comments, indexToCorrupt) => {
						if (indexToCorrupt >= comments.length) return;

						const corruptedComments = [...comments];
						const corruptedComment = { ...corruptedComments[indexToCorrupt] };
						delete (corruptedComment as Record<string, unknown>).id;
						corruptedComments[indexToCorrupt] = corruptedComment;

						try {
							validateComments(corruptedComments);
							expect(true).toBe(false);
						} catch (error) {
							expect(error).toBeInstanceOf(ValidationError);
							if (error instanceof ValidationError) {
								expect(error.message).toContain(`Comment at index ${indexToCorrupt}`);
								expect(error.details).toHaveProperty('index', indexToCorrupt);
								expect(error.details).toHaveProperty('originalError');
							}
						}
					}
				),
				{ numRuns: 100 }
			);
		});
	});
});
