import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { PolymarketClient, type Market, type Event } from './polymarket-client';
import type { ApiConfig } from '../config/api-config';

describe('PolymarketClient', () => {
	let client: PolymarketClient;
	let config: ApiConfig;
	let originalFetch: typeof global.fetch;

	beforeEach(() => {
		config = {
			baseUrl: 'https://gamma-api.polymarket.com',
			dataApiUrl: 'https://data-api.polymarket.com',
			timeout: 10000,
			cacheTtl: 60,
			enableCache: true
		};
		client = new PolymarketClient(config);
		originalFetch = global.fetch;
	});

	afterEach(() => {
		global.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	/**
	 * Feature: polymarket-api-integration, Property 2: Query parameter forwarding
	 * Validates: Requirements 1.2
	 *
	 * For any set of query parameters provided to the server route, those parameters
	 * should be correctly forwarded to the Gamma API request.
	 */
	describe('Property 2: Query parameter forwarding', () => {
		it('should forward all query parameters to the API request', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						limit: fc.option(fc.integer({ min: 1, max: 100 })),
						offset: fc.option(fc.integer({ min: 0, max: 1000 })),
						category: fc.option(
							fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0)
						),
						active: fc.option(fc.boolean()),
						closed: fc.option(fc.boolean())
					}),
					async (params) => {
						// Filter out undefined values
						const cleanParams = Object.fromEntries(
							Object.entries(params).filter(([, v]) => v !== null)
						) as Record<string, string | number | boolean>;

						// Mock fetch to capture the URL
						let capturedUrl: string | undefined;
						(global.fetch as unknown as typeof global.fetch) = vi.fn(
							async (url: string | URL | Request) => {
								capturedUrl = url.toString();
								return new Response(JSON.stringify([]), {
									status: 200,
									headers: { 'Content-Type': 'application/json' }
								});
							}
						);

						await client.fetchMarkets({ params: cleanParams });

						// Verify fetch was called
						expect(global.fetch).toHaveBeenCalled();
						expect(capturedUrl).toBeDefined();

						// Parse the URL and check all parameters are present
						const url = new URL(capturedUrl!);
						Object.entries(cleanParams).forEach(([key, value]) => {
							expect(url.searchParams.get(key)).toBe(String(value));
						});
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should handle empty parameters correctly', async () => {
			let capturedUrl: string | undefined;
			(global.fetch as unknown as typeof global.fetch) = vi.fn(
				async (url: string | URL | Request) => {
					capturedUrl = url.toString();
					return new Response(JSON.stringify([]), {
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					});
				}
			);

			await client.fetchMarkets();

			expect(global.fetch).toHaveBeenCalled();
			expect(capturedUrl).toBeDefined();

			const url = new URL(capturedUrl!);
			// Should have no query parameters
			expect(Array.from(url.searchParams.keys()).length).toBe(0);
		});

		it('should correctly encode special characters in parameters', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.record({
						category: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0) // Exclude whitespace-only strings
					}),
					async (params) => {
						let capturedUrl: string | undefined;
						(global.fetch as unknown as typeof global.fetch) = vi.fn(
							async (url: string | URL | Request) => {
								capturedUrl = url.toString();
								return new Response(JSON.stringify([]), {
									status: 200,
									headers: { 'Content-Type': 'application/json' }
								});
							}
						);

						await client.fetchMarkets({ params });

						const url = new URL(capturedUrl!);
						// The parameter should be properly URL-encoded and decodable
						expect(url.searchParams.get('category')).toBe(params.category);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-api-integration, Property 5: Market retrieval by identifier
	 * Validates: Requirements 2.1, 2.2, 2.3, 2.5
	 *
	 * For any valid market ID or slug, the server route should fetch and return
	 * the correct market data with all required fields present.
	 */
	describe('Property 5: Market retrieval by identifier', () => {
		const createMockMarket = (id: string, slug: string): Market => ({
			id,
			question: `Test question for ${id}`,
			conditionId: `condition-${id}`,
			slug,
			endDate: new Date().toISOString(),
			category: 'test',
			liquidity: '1000',
			image: 'https://example.com/image.jpg',
			icon: 'https://example.com/icon.jpg',
			description: 'Test description',
			outcomes: ['Yes', 'No'],
			outcomePrices: ['0.5', '0.5'],
			volume: '5000',
			active: true,
			marketType: 'normal',
			closed: false,
			volumeNum: 5000,
			liquidityNum: 1000,
			volume24hr: 1000,
			volume1wk: 3000,
			volume1mo: 5000,
			lastTradePrice: 0.5,
			bestBid: 0.49,
			bestAsk: 0.51
		});

		it('should fetch market by ID with all required fields', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
					async (marketId) => {
						const mockMarket = createMockMarket(marketId, `slug-${marketId}`);

						(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
							return new Response(JSON.stringify(mockMarket), {
								status: 200,
								headers: { 'Content-Type': 'application/json' }
							});
						});

						const result = await client.fetchMarketById(marketId);

						// Verify all required fields are present
						expect(result).toHaveProperty('id');
						expect(result).toHaveProperty('question');
						expect(result).toHaveProperty('conditionId');
						expect(result).toHaveProperty('slug');
						expect(result).toHaveProperty('endDate');
						expect(result).toHaveProperty('category');
						expect(result).toHaveProperty('liquidity');
						expect(result).toHaveProperty('image');
						expect(result).toHaveProperty('icon');
						expect(result).toHaveProperty('description');
						expect(result).toHaveProperty('outcomes');
						expect(result).toHaveProperty('outcomePrices');
						expect(result).toHaveProperty('volume');
						expect(result).toHaveProperty('active');
						expect(result).toHaveProperty('marketType');
						expect(result).toHaveProperty('closed');
						expect(result).toHaveProperty('volumeNum');
						expect(result).toHaveProperty('liquidityNum');
						expect(result).toHaveProperty('volume24hr');
						expect(result).toHaveProperty('volume1wk');
						expect(result).toHaveProperty('volume1mo');
						expect(result).toHaveProperty('lastTradePrice');
						expect(result).toHaveProperty('bestBid');
						expect(result).toHaveProperty('bestAsk');

						// Verify the ID matches
						expect(result.id).toBe(marketId);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should fetch market by slug with all required fields', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc
						.string({ minLength: 1, maxLength: 50 })
						.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
					async (slug) => {
						const mockMarket = createMockMarket(`id-${slug}`, slug);

						(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
							return new Response(JSON.stringify(mockMarket), {
								status: 200,
								headers: { 'Content-Type': 'application/json' }
							});
						});

						const result = await client.fetchMarketBySlug(slug);

						// Verify all required fields are present
						expect(result).toHaveProperty('id');
						expect(result).toHaveProperty('question');
						expect(result).toHaveProperty('slug');
						expect(result).toHaveProperty('outcomes');
						expect(result).toHaveProperty('outcomePrices');
						expect(result).toHaveProperty('volume');
						expect(result).toHaveProperty('liquidity');

						// Verify the slug matches
						expect(result.slug).toBe(slug);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should use correct endpoint for ID-based retrieval', async () => {
			await fc.assert(
				fc.asyncProperty(
					// Generate alphanumeric IDs with hyphens and underscores (typical market ID format)
					fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter((s) => s.length > 0 && s.length <= 50),
					async (marketId) => {
						let capturedUrl: string | undefined;
						const mockMarket = createMockMarket(marketId, `slug-${marketId}`);

						(global.fetch as unknown as typeof global.fetch) = vi.fn(
							async (url: string | URL | Request) => {
								capturedUrl = url.toString();
								return new Response(JSON.stringify(mockMarket), {
									status: 200,
									headers: { 'Content-Type': 'application/json' }
								});
							}
						);

						await client.fetchMarketById(marketId);

						expect(capturedUrl).toBeDefined();
						// Check that the URL has the correct structure (base + /markets/ + ID)
						const url = new URL(capturedUrl!);
						expect(url.pathname).toBe(`/markets/${marketId}`);
						expect(url.origin).toBe(config.baseUrl);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should use correct endpoint for slug-based retrieval', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc
						.string({ minLength: 1, maxLength: 50 })
						.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
					async (slug) => {
						let capturedUrl: string | undefined;
						const mockMarket = createMockMarket(`id-${slug}`, slug);

						(global.fetch as unknown as typeof global.fetch) = vi.fn(
							async (url: string | URL | Request) => {
								capturedUrl = url.toString();
								return new Response(JSON.stringify(mockMarket), {
									status: 200,
									headers: { 'Content-Type': 'application/json' }
								});
							}
						);

						await client.fetchMarketBySlug(slug);

						expect(capturedUrl).toBeDefined();
						expect(capturedUrl).toContain(`/markets/slug/${slug}`);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-events, Property 1: Event fetch returns valid structure
	 * Validates: Requirements 1.1
	 *
	 * For any successful API request for events, all returned event objects should
	 * contain the required fields (id, title, slug, markets) with correct types.
	 */
	describe('Property 1: Event fetch returns valid structure', () => {
		const createMockEvent = (id: string, slug: string): Event => ({
			id,
			ticker: `TICKER-${id}`,
			slug,
			title: `Test Event ${id}`,
			subtitle: 'Test subtitle',
			description: 'Test description',
			resolutionSource: 'Test source',
			startDate: new Date().toISOString(),
			creationDate: new Date().toISOString(),
			endDate: new Date().toISOString(),
			image: 'https://example.com/image.jpg',
			icon: 'https://example.com/icon.jpg',
			active: true,
			closed: false,
			archived: false,
			new: false,
			featured: false,
			restricted: false,
			liquidity: 1000,
			volume: 5000,
			openInterest: 2000,
			category: 'test',
			subcategory: 'test-sub',
			volume24hr: 1000,
			volume1wk: 3000,
			volume1mo: 5000,
			volume1yr: 10000,
			commentCount: 10,
			markets: [],
			categories: [],
			tags: []
		});

		it('should fetch events with all required fields', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(
						fc.record({
							id: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
							slug: fc
								.string({ minLength: 1, maxLength: 50 })
								.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '-'))
								.filter((s) => s.length > 0)
						}),
						{ minLength: 0, maxLength: 10 }
					),
					async (eventData) => {
						const mockEvents = eventData.map((e) => createMockEvent(e.id, e.slug));

						(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
							return new Response(JSON.stringify(mockEvents), {
								status: 200,
								headers: { 'Content-Type': 'application/json' }
							});
						});

						const result = await client.fetchEvents();

						// Verify result is an array
						expect(Array.isArray(result)).toBe(true);
						expect(result.length).toBe(mockEvents.length);

						// Verify each event has all required fields
						result.forEach((event) => {
							expect(event).toHaveProperty('id');
							expect(event).toHaveProperty('title');
							expect(event).toHaveProperty('slug');
							expect(event).toHaveProperty('markets');
							expect(Array.isArray(event.markets)).toBe(true);
							expect(typeof event.id).toBe('string');
							expect(typeof event.title).toBe('string');
							expect(typeof event.slug).toBe('string');
						});
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should fetch event by ID with all required fields', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
					async (eventId) => {
						const mockEvent = createMockEvent(eventId, `slug-${eventId}`);

						(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
							return new Response(JSON.stringify(mockEvent), {
								status: 200,
								headers: { 'Content-Type': 'application/json' }
							});
						});

						const result = await client.fetchEventById(eventId);

						// Verify all required fields are present
						expect(result).toHaveProperty('id');
						expect(result).toHaveProperty('ticker');
						expect(result).toHaveProperty('slug');
						expect(result).toHaveProperty('title');
						expect(result).toHaveProperty('subtitle');
						expect(result).toHaveProperty('description');
						expect(result).toHaveProperty('markets');
						expect(result).toHaveProperty('categories');
						expect(result).toHaveProperty('tags');
						expect(result).toHaveProperty('active');
						expect(result).toHaveProperty('closed');
						expect(result).toHaveProperty('volume');
						expect(result).toHaveProperty('liquidity');

						// Verify the ID matches
						expect(result.id).toBe(eventId);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should fetch event by slug with all required fields', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc
						.string({ minLength: 1, maxLength: 50 })
						.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '-'))
						.filter((s) => s.length > 0),
					async (slug) => {
						const mockEvent = createMockEvent(`id-${slug}`, slug);

						(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
							return new Response(JSON.stringify(mockEvent), {
								status: 200,
								headers: { 'Content-Type': 'application/json' }
							});
						});

						const result = await client.fetchEventBySlug(slug);

						// Verify all required fields are present
						expect(result).toHaveProperty('id');
						expect(result).toHaveProperty('title');
						expect(result).toHaveProperty('slug');
						expect(result).toHaveProperty('markets');

						// Verify the slug matches
						expect(result.slug).toBe(slug);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	/**
	 * Feature: polymarket-events, Property 4: Failed requests throw appropriate errors
	 * Validates: Requirements 1.5
	 *
	 * For any API request that fails, the system should throw an error with the
	 * appropriate status code and error details.
	 */
	describe('Property 4: Failed requests throw appropriate errors', () => {
		it('should throw appropriate errors for various HTTP status codes', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.integer({ min: 400, max: 599 }),
					fc.constantFrom('events', 'event-by-id', 'event-by-slug'),
					async (statusCode, endpoint) => {
						(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
							return new Response(JSON.stringify({ error: 'Test error' }), {
								status: statusCode,
								statusText: 'Error'
							});
						});

						let error: Error | undefined;
						try {
							if (endpoint === 'events') {
								await client.fetchEvents();
							} else if (endpoint === 'event-by-id') {
								await client.fetchEventById('test-id');
							} else {
								await client.fetchEventBySlug('test-slug');
							}
						} catch (e) {
							error = e as Error;
						}

						// Verify an error was thrown
						expect(error).toBeDefined();
						expect(error?.message).toBeTruthy();
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should handle network errors for event requests', async () => {
			(global.fetch as unknown as typeof global.fetch) = vi
				.fn()
				.mockRejectedValue(new Error('Network error'));

			await expect(client.fetchEvents()).rejects.toThrow('Network error');
			await expect(client.fetchEventById('test-id')).rejects.toThrow('Network error');
			await expect(client.fetchEventBySlug('test-slug')).rejects.toThrow('Network error');
		});

		it('should handle timeout errors for event requests', async () => {
			const shortTimeoutConfig = { ...config, timeout: 100 };
			const shortTimeoutClient = new PolymarketClient(shortTimeoutConfig);

			(global.fetch as unknown as typeof global.fetch) = vi
				.fn()
				.mockImplementation(async (_url: string | URL | Request, init?: RequestInit) => {
					return new Promise<Response>((resolve, reject) => {
						const timeout = setTimeout(
							() =>
								resolve(
									new Response(JSON.stringify([]), {
										status: 200,
										headers: { 'Content-Type': 'application/json' }
									})
								),
							200
						);

						if (init?.signal) {
							init.signal.addEventListener('abort', () => {
								clearTimeout(timeout);
								reject(new DOMException('The operation was aborted', 'AbortError'));
							});
						}
					});
				});

			await expect(shortTimeoutClient.fetchEvents()).rejects.toThrow('Request timeout');
		});
	});

	describe('Error handling', () => {
		it('should handle timeout errors', async () => {
			const shortTimeoutConfig = { ...config, timeout: 100 };
			const shortTimeoutClient = new PolymarketClient(shortTimeoutConfig);

			(global.fetch as unknown as typeof global.fetch) = vi
				.fn()
				.mockImplementation(async (_url: string | URL | Request, init?: RequestInit) => {
					// Simulate a long-running request that gets aborted
					return new Promise<Response>((resolve, reject) => {
						const timeout = setTimeout(
							() =>
								resolve(
									new Response(JSON.stringify([]), {
										status: 200,
										headers: { 'Content-Type': 'application/json' }
									})
								),
							200
						);

						// Listen for abort signal
						if (init?.signal) {
							init.signal.addEventListener('abort', () => {
								clearTimeout(timeout);
								reject(new DOMException('The operation was aborted', 'AbortError'));
							});
						}
					});
				});

			await expect(shortTimeoutClient.fetchMarkets()).rejects.toThrow('Request timeout');
		});

		it('should handle HTTP errors', async () => {
			(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
				return new Response('Not Found', { status: 404, statusText: 'Not Found' });
			});

			await expect(client.fetchMarketById('nonexistent')).rejects.toThrow('API request failed');
		});

		it('should handle network errors', async () => {
			(global.fetch as unknown as typeof global.fetch) = vi
				.fn()
				.mockRejectedValue(new Error('Network error'));

			await expect(client.fetchMarkets()).rejects.toThrow('Network error');
		});
	});

	/**
	 * Unit tests for Series API methods
	 * Validates: Requirements 1.3, 1.4, 1.5, 2.4
	 */
	describe('Series API methods', () => {
		const createMockSeries = (id: string, slug: string) => ({
			id,
			ticker: `TICKER-${id}`,
			slug,
			title: `Test Series ${id}`,
			subtitle: 'Test subtitle',
			seriesType: 'recurring',
			recurrence: 'weekly',
			description: 'Test description',
			image: 'https://example.com/image.jpg',
			icon: 'https://example.com/icon.jpg',
			layout: 'default',
			active: true,
			closed: false,
			archived: false,
			new: false,
			featured: false,
			restricted: false,
			isTemplate: false,
			templateVariables: false,
			publishedAt: new Date().toISOString(),
			createdBy: 'creator-id',
			updatedBy: 'updater-id',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			commentsEnabled: true,
			competitive: 'high',
			volume24hr: 1000,
			volume: 5000,
			liquidity: 2000,
			startDate: new Date().toISOString(),
			pythTokenID: null,
			cgAssetName: null,
			score: 100,
			events: [],
			collections: [],
			categories: [],
			tags: [],
			commentCount: 10,
			chats: []
		});

		describe('fetchSeries', () => {
			it('should successfully fetch series with various parameters', async () => {
				await fc.assert(
					fc.asyncProperty(
						fc.record({
							limit: fc.option(fc.integer({ min: 1, max: 100 })),
							offset: fc.option(fc.integer({ min: 0, max: 1000 })),
							category: fc.option(
								fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0)
							),
							active: fc.option(fc.boolean()),
							closed: fc.option(fc.boolean())
						}),
						async (params) => {
							// Filter out undefined values
							const cleanParams = Object.fromEntries(
								Object.entries(params).filter(([, v]) => v !== null)
							) as Record<string, string | number | boolean>;

							const mockSeries = [createMockSeries('series-1', 'test-series-1')];

							(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
								return new Response(JSON.stringify(mockSeries), {
									status: 200,
									headers: { 'Content-Type': 'application/json' }
								});
							});

							const result = await client.fetchSeries({ params: cleanParams });

							expect(Array.isArray(result)).toBe(true);
							expect(result.length).toBe(mockSeries.length);
							result.forEach((series) => {
								expect(series).toHaveProperty('id');
								expect(series).toHaveProperty('title');
								expect(series).toHaveProperty('slug');
								expect(series).toHaveProperty('events');
								expect(series).toHaveProperty('collections');
								expect(series).toHaveProperty('categories');
								expect(series).toHaveProperty('tags');
							});
						}
					),
					{ numRuns: 100 }
				);
			});

			it('should handle network failures', async () => {
				(global.fetch as unknown as typeof global.fetch) = vi
					.fn()
					.mockRejectedValue(new Error('Network error'));

				await expect(client.fetchSeries()).rejects.toThrow('Network error');
			});

			it('should handle timeout errors', async () => {
				const shortTimeoutConfig = { ...config, timeout: 100 };
				const shortTimeoutClient = new PolymarketClient(shortTimeoutConfig);

				(global.fetch as unknown as typeof global.fetch) = vi
					.fn()
					.mockImplementation(async (_url: string | URL | Request, init?: RequestInit) => {
						return new Promise<Response>((resolve, reject) => {
							const timeout = setTimeout(
								() =>
									resolve(
										new Response(JSON.stringify([]), {
											status: 200,
											headers: { 'Content-Type': 'application/json' }
										})
									),
								200
							);

							if (init?.signal) {
								init.signal.addEventListener('abort', () => {
									clearTimeout(timeout);
									reject(new DOMException('The operation was aborted', 'AbortError'));
								});
							}
						});
					});

				await expect(shortTimeoutClient.fetchSeries()).rejects.toThrow('Request timeout');
			});

			it('should handle 404 errors', async () => {
				(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
					return new Response('Not Found', { status: 404, statusText: 'Not Found' });
				});

				await expect(client.fetchSeries()).rejects.toThrow('API request failed');
			});

			it('should construct URL with query parameters correctly', async () => {
				let capturedUrl: string | undefined;
				const params = { limit: 10, active: true, category: 'crypto' };

				(global.fetch as unknown as typeof global.fetch) = vi.fn(
					async (url: string | URL | Request) => {
						capturedUrl = url.toString();
						return new Response(JSON.stringify([]), {
							status: 200,
							headers: { 'Content-Type': 'application/json' }
						});
					}
				);

				await client.fetchSeries({ params });

				expect(capturedUrl).toBeDefined();
				const url = new URL(capturedUrl!);
				expect(url.pathname).toBe('/series');
				expect(url.searchParams.get('limit')).toBe('10');
				expect(url.searchParams.get('active')).toBe('true');
				expect(url.searchParams.get('category')).toBe('crypto');
			});
		});

		describe('fetchSeriesById', () => {
			it('should successfully fetch series by ID', async () => {
				await fc.assert(
					fc.asyncProperty(
						fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
						async (seriesId) => {
							const mockSeries = createMockSeries(seriesId, `slug-${seriesId}`);

							(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
								return new Response(JSON.stringify(mockSeries), {
									status: 200,
									headers: { 'Content-Type': 'application/json' }
								});
							});

							const result = await client.fetchSeriesById(seriesId);

							expect(result).toHaveProperty('id');
							expect(result).toHaveProperty('title');
							expect(result).toHaveProperty('slug');
							expect(result).toHaveProperty('events');
							expect(result).toHaveProperty('collections');
							expect(result.id).toBe(seriesId);
						}
					),
					{ numRuns: 100 }
				);
			});

			it('should handle network failures', async () => {
				(global.fetch as unknown as typeof global.fetch) = vi
					.fn()
					.mockRejectedValue(new Error('Network error'));

				await expect(client.fetchSeriesById('test-id')).rejects.toThrow('Network error');
			});

			it('should handle timeout errors', async () => {
				const shortTimeoutConfig = { ...config, timeout: 100 };
				const shortTimeoutClient = new PolymarketClient(shortTimeoutConfig);

				(global.fetch as unknown as typeof global.fetch) = vi
					.fn()
					.mockImplementation(async (_url: string | URL | Request, init?: RequestInit) => {
						return new Promise<Response>((resolve, reject) => {
							const timeout = setTimeout(
								() =>
									resolve(
										new Response(JSON.stringify({}), {
											status: 200,
											headers: { 'Content-Type': 'application/json' }
										})
									),
								200
							);

							if (init?.signal) {
								init.signal.addEventListener('abort', () => {
									clearTimeout(timeout);
									reject(new DOMException('The operation was aborted', 'AbortError'));
								});
							}
						});
					});

				await expect(shortTimeoutClient.fetchSeriesById('test-id')).rejects.toThrow(
					'Request timeout'
				);
			});

			it('should handle 404 errors', async () => {
				(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
					return new Response('Not Found', { status: 404, statusText: 'Not Found' });
				});

				await expect(client.fetchSeriesById('nonexistent')).rejects.toThrow('API request failed');
			});

			it('should construct URL correctly', async () => {
				let capturedUrl: string | undefined;
				const seriesId = 'test-series-123';

				(global.fetch as unknown as typeof global.fetch) = vi.fn(
					async (url: string | URL | Request) => {
						capturedUrl = url.toString();
						return new Response(JSON.stringify(createMockSeries(seriesId, 'test-slug')), {
							status: 200,
							headers: { 'Content-Type': 'application/json' }
						});
					}
				);

				await client.fetchSeriesById(seriesId);

				expect(capturedUrl).toBeDefined();
				const url = new URL(capturedUrl!);
				expect(url.pathname).toBe(`/series/${seriesId}`);
			});
		});

		describe('fetchSeriesBySlug', () => {
			it('should successfully fetch series by slug', async () => {
				await fc.assert(
					fc.asyncProperty(
						fc
							.string({ minLength: 1, maxLength: 50 })
							.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '-'))
							.filter((s) => s.length > 0),
						async (slug) => {
							const mockSeries = createMockSeries(`id-${slug}`, slug);

							(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
								return new Response(JSON.stringify(mockSeries), {
									status: 200,
									headers: { 'Content-Type': 'application/json' }
								});
							});

							const result = await client.fetchSeriesBySlug(slug);

							expect(result).toHaveProperty('id');
							expect(result).toHaveProperty('title');
							expect(result).toHaveProperty('slug');
							expect(result).toHaveProperty('events');
							expect(result).toHaveProperty('collections');
							expect(result.slug).toBe(slug);
						}
					),
					{ numRuns: 100 }
				);
			});

			it('should handle network failures', async () => {
				(global.fetch as unknown as typeof global.fetch) = vi
					.fn()
					.mockRejectedValue(new Error('Network error'));

				await expect(client.fetchSeriesBySlug('test-slug')).rejects.toThrow('Network error');
			});

			it('should handle timeout errors', async () => {
				const shortTimeoutConfig = { ...config, timeout: 100 };
				const shortTimeoutClient = new PolymarketClient(shortTimeoutConfig);

				(global.fetch as unknown as typeof global.fetch) = vi
					.fn()
					.mockImplementation(async (_url: string | URL | Request, init?: RequestInit) => {
						return new Promise<Response>((resolve, reject) => {
							const timeout = setTimeout(
								() =>
									resolve(
										new Response(JSON.stringify({}), {
											status: 200,
											headers: { 'Content-Type': 'application/json' }
										})
									),
								200
							);

							if (init?.signal) {
								init.signal.addEventListener('abort', () => {
									clearTimeout(timeout);
									reject(new DOMException('The operation was aborted', 'AbortError'));
								});
							}
						});
					});

				await expect(shortTimeoutClient.fetchSeriesBySlug('test-slug')).rejects.toThrow(
					'Request timeout'
				);
			});

			it('should handle 404 errors', async () => {
				(global.fetch as unknown as typeof global.fetch) = vi.fn(async () => {
					return new Response('Not Found', { status: 404, statusText: 'Not Found' });
				});

				await expect(client.fetchSeriesBySlug('nonexistent')).rejects.toThrow('API request failed');
			});

			it('should construct URL correctly', async () => {
				let capturedUrl: string | undefined;
				const slug = 'test-series-slug';

				(global.fetch as unknown as typeof global.fetch) = vi.fn(
					async (url: string | URL | Request) => {
						capturedUrl = url.toString();
						return new Response(JSON.stringify(createMockSeries('test-id', slug)), {
							status: 200,
							headers: { 'Content-Type': 'application/json' }
						});
					}
				);

				await client.fetchSeriesBySlug(slug);

				expect(capturedUrl).toBeDefined();
				const url = new URL(capturedUrl!);
				expect(url.pathname).toBe(`/series/slug/${slug}`);
			});
		});
	});
});
