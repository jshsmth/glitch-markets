import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	validateMarket,
	validateMarkets,
	validateEvent,
	validateEvents
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
