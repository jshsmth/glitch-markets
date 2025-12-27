/**
 * Shared Fast-Check Arbitraries for Testing
 *
 * This file contains reusable property-based testing arbitraries
 * to avoid duplication across test files.
 */

import * as fc from 'fast-check';
import type { Series } from '$lib/server/api/polymarket-client';

/**
 * Generates valid timestamp strings within a reasonable date range
 * (2020-01-01 to 2030-12-31)
 */
export const timestampArbitrary = fc
	.integer({ min: Date.parse('2020-01-01'), max: Date.parse('2030-12-31') })
	.map((ts) => new Date(ts).toISOString());

/**
 * Generates valid Market objects for property-based testing
 */
export const marketArbitrary = fc.record({
	id: fc.string({ minLength: 1 }),
	question: fc.string({ minLength: 1 }),
	conditionId: fc.string({ minLength: 1 }),
	slug: fc.string({ minLength: 1 }),
	endDate: timestampArbitrary,
	category: fc.string({ minLength: 1 }),
	liquidity: fc.float({ min: 0, max: 1000000 }).map(String),
	image: fc.webUrl(),
	icon: fc.webUrl(),
	description: fc.string(),
	outcomes: fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 2 }),
	outcomePrices: fc.array(fc.float({ min: 0, max: 1 }).map(String), { minLength: 2, maxLength: 2 }),
	volume: fc.float({ min: 0, max: 1000000 }).map(String),
	active: fc.boolean(),
	marketType: fc.constantFrom('normal' as const, 'scalar' as const),
	closed: fc.boolean(),
	volumeNum: fc.float({ min: 0, max: 1000000 }),
	liquidityNum: fc.float({ min: 0, max: 1000000 }),
	volume24hr: fc.float({ min: 0, max: 100000 }),
	volume1wk: fc.float({ min: 0, max: 500000 }),
	volume1mo: fc.float({ min: 0, max: 1000000 }),
	lastTradePrice: fc.float({ min: 0, max: 1 }),
	bestBid: fc.float({ min: 0, max: 1 }),
	bestAsk: fc.float({ min: 0, max: 1 })
});

/**
 * Generates valid Event objects for property-based testing
 */
export const eventArbitrary = fc.record({
	id: fc.string({ minLength: 1 }),
	ticker: fc.string({ minLength: 1 }),
	slug: fc.string({ minLength: 1 }),
	title: fc.string({ minLength: 1 }),
	subtitle: fc.string(),
	description: fc.string(),
	resolutionSource: fc.string(),
	startDate: timestampArbitrary,
	creationDate: timestampArbitrary,
	endDate: timestampArbitrary,
	image: fc.webUrl(),
	icon: fc.webUrl(),
	active: fc.boolean(),
	closed: fc.boolean(),
	archived: fc.boolean(),
	new: fc.boolean(),
	featured: fc.boolean(),
	restricted: fc.boolean(),
	liquidity: fc.float({ min: 0, max: 1000000 }),
	volume: fc.float({ min: 0, max: 1000000 }),
	openInterest: fc.float({ min: 0, max: 1000000 }),
	category: fc.string({ minLength: 1 }),
	subcategory: fc.string(),
	volume24hr: fc.float({ min: 0, max: 100000 }),
	volume1wk: fc.float({ min: 0, max: 500000 }),
	volume1mo: fc.float({ min: 0, max: 1000000 }),
	volume1yr: fc.float({ min: 0, max: 5000000 }),
	commentCount: fc.integer({ min: 0, max: 10000 }),
	markets: fc.array(marketArbitrary, { minLength: 0, maxLength: 10 }),
	categories: fc.array(
		fc.record({
			id: fc.string(),
			name: fc.oneof(
				fc.constant('crypto'),
				fc.constant('sports'),
				fc.constant('politics'),
				fc.constant('entertainment')
			)
		})
	),
	tags: fc.array(fc.record({ id: fc.string(), label: fc.string(), slug: fc.string() }))
});

/**
 * Generates valid Series objects for property-based testing
 */
export const seriesArbitrary = fc.record({
	id: fc.string({ minLength: 1 }),
	ticker: fc.string({ minLength: 1 }),
	slug: fc.string({ minLength: 1 }),
	title: fc.string({ minLength: 1 }),
	subtitle: fc.option(fc.string(), { nil: null }),
	seriesType: fc.string(),
	recurrence: fc.string(),
	description: fc.string(),
	image: fc.option(fc.webUrl(), { nil: null }),
	icon: fc.option(fc.webUrl(), { nil: null }),
	layout: fc.string(),
	active: fc.boolean(),
	closed: fc.boolean(),
	archived: fc.boolean(),
	new: fc.boolean(),
	featured: fc.boolean(),
	restricted: fc.boolean(),
	isTemplate: fc.boolean(),
	templateVariables: fc.boolean(),
	publishedAt: timestampArbitrary,
	createdBy: fc.string(),
	updatedBy: fc.string(),
	createdAt: timestampArbitrary,
	updatedAt: timestampArbitrary,
	commentsEnabled: fc.boolean(),
	competitive: fc.string(),
	volume24hr: fc.float({ min: 0, max: 10000, noNaN: true }),
	volume: fc.float({ min: 0, max: 10000, noNaN: true }),
	liquidity: fc.float({ min: 0, max: 10000, noNaN: true }),
	startDate: timestampArbitrary,
	pythTokenID: fc.option(fc.string(), { nil: null }),
	cgAssetName: fc.option(fc.string(), { nil: null }),
	score: fc.float({ min: 0, max: 100, noNaN: true }),
	events: fc.array(fc.record({ id: fc.string() })),
	collections: fc.array(fc.record({ id: fc.string() })),
	categories: fc.array(
		fc.record({
			id: fc.string(),
			name: fc.oneof(
				fc.constant('crypto'),
				fc.constant('sports'),
				fc.constant('politics'),
				fc.constant('entertainment')
			)
		})
	),
	tags: fc.array(fc.record({ id: fc.string(), name: fc.string() })),
	commentCount: fc.integer({ min: 0, max: 1000 }),
	chats: fc.array(fc.record({ id: fc.string() }))
}) as unknown as fc.Arbitrary<Series>;
