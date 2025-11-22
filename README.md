# glitch-markets

A SvelteKit application for displaying prediction market data from Polymarket. This application integrates with the Polymarket Gamma API to fetch and display market information with caching, filtering, and search capabilities.

## Features

- 🔍 **Market Search**: Search markets by text query with case-insensitive matching
- 🎯 **Advanced Filtering**: Filter markets by category, status (active/closed), and more
- 📊 **Sorting**: Sort markets by volume, liquidity, or creation date
- ⚡ **Caching**: Built-in caching layer for improved performance
- 🛡️ **Type Safety**: Full TypeScript support with comprehensive type definitions
- 📝 **Logging**: Request/response logging with timestamps and duration tracking
- ✅ **Validation**: Input and response validation for data integrity
- 🧪 **Property-Based Testing**: Comprehensive test coverage using fast-check

## Table of Contents

- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Installation

1. Clone the repository:

```sh
git clone <repository-url>
cd glitch-markets
```

2. Install dependencies:

```sh
npm install
```

3. Set up environment variables (see [Environment Variables](#environment-variables))

4. Start the development server:

```sh
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required

```env
DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
```

### Optional (Polymarket API Configuration)

```env
# Polymarket Gamma API base URL
# Default: https://gamma-api.polymarket.com
POLYMARKET_API_URL="https://gamma-api.polymarket.com"

# Request timeout in milliseconds
# Default: 10000 (10 seconds)
POLYMARKET_API_TIMEOUT="10000"

# Cache TTL (Time To Live) in seconds
# Default: 60 (1 minute)
POLYMARKET_CACHE_TTL="60"

# Enable or disable caching
# Default: true
POLYMARKET_CACHE_ENABLED="true"
```

### Environment Variable Details

| Variable                   | Type    | Default                            | Description                           |
| -------------------------- | ------- | ---------------------------------- | ------------------------------------- |
| `POLYMARKET_API_URL`       | string  | `https://gamma-api.polymarket.com` | Base URL for the Polymarket Gamma API |
| `POLYMARKET_API_TIMEOUT`   | number  | `10000`                            | Request timeout in milliseconds       |
| `POLYMARKET_CACHE_TTL`     | number  | `60`                               | Cache time-to-live in seconds         |
| `POLYMARKET_CACHE_ENABLED` | boolean | `true`                             | Enable/disable response caching       |

## API Endpoints

### GET /api/markets

Fetch a list of markets with optional filtering and pagination.

**Query Parameters:**

| Parameter  | Type    | Description                                | Example            |
| ---------- | ------- | ------------------------------------------ | ------------------ |
| `limit`    | number  | Maximum number of results to return        | `?limit=50`        |
| `offset`   | number  | Number of results to skip (for pagination) | `?offset=100`      |
| `category` | string  | Filter by market category                  | `?category=crypto` |
| `active`   | boolean | Filter by active status                    | `?active=true`     |
| `closed`   | boolean | Filter by closed status                    | `?closed=false`    |

**Example Request:**

```sh
curl "http://localhost:5173/api/markets?limit=10&active=true&category=crypto"
```

**Example Response:**

```json
[
	{
		"id": "0x123...",
		"question": "Will Bitcoin reach $100k by end of 2024?",
		"conditionId": "0xabc...",
		"slug": "bitcoin-100k-2024",
		"endDate": "2024-12-31T23:59:59Z",
		"category": "crypto",
		"liquidity": "50000.00",
		"volume": "250000.00",
		"active": true,
		"closed": false,
		"outcomes": ["Yes", "No"],
		"outcomePrices": ["0.65", "0.35"],
		"volumeNum": 250000,
		"liquidityNum": 50000,
		"marketType": "normal"
	}
]
```

### GET /api/markets/[id]

Fetch a specific market by its ID.

**Path Parameters:**

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| `id`      | string | The unique market identifier |

**Example Request:**

```sh
curl "http://localhost:5173/api/markets/0x123..."
```

**Example Response:**

```json
{
	"id": "0x123...",
	"question": "Will Bitcoin reach $100k by end of 2024?",
	"conditionId": "0xabc...",
	"slug": "bitcoin-100k-2024",
	"endDate": "2024-12-31T23:59:59Z",
	"category": "crypto",
	"liquidity": "50000.00",
	"volume": "250000.00",
	"active": true,
	"closed": false,
	"outcomes": ["Yes", "No"],
	"outcomePrices": ["0.65", "0.35"],
	"volumeNum": 250000,
	"liquidityNum": 50000,
	"marketType": "normal"
}
```

**Error Response (404):**

```json
{
	"error": "NOT_FOUND",
	"message": "Market not found",
	"statusCode": 404
}
```

### GET /api/markets/slug/[slug]

Fetch a specific market by its URL-friendly slug.

**Path Parameters:**

| Parameter | Type   | Description                        |
| --------- | ------ | ---------------------------------- |
| `slug`    | string | The URL-friendly market identifier |

**Example Request:**

```sh
curl "http://localhost:5173/api/markets/slug/bitcoin-100k-2024"
```

**Example Response:**

Same as `/api/markets/[id]` endpoint.

### GET /api/markets/search

Search and filter markets with advanced options.

**Query Parameters:**

| Parameter   | Type    | Description                                       | Example            |
| ----------- | ------- | ------------------------------------------------- | ------------------ |
| `query`     | string  | Text search query (case-insensitive)              | `?query=bitcoin`   |
| `sortBy`    | string  | Sort field: `volume`, `liquidity`, or `createdAt` | `?sortBy=volume`   |
| `sortOrder` | string  | Sort order: `asc` or `desc`                       | `?sortOrder=desc`  |
| `limit`     | number  | Maximum number of results                         | `?limit=20`        |
| `offset`    | number  | Pagination offset                                 | `?offset=0`        |
| `category`  | string  | Filter by category                                | `?category=crypto` |
| `active`    | boolean | Filter by active status                           | `?active=true`     |
| `closed`    | boolean | Filter by closed status                           | `?closed=false`    |

**Example Request:**

```sh
curl "http://localhost:5173/api/markets/search?query=bitcoin&sortBy=volume&sortOrder=desc&limit=10"
```

**Example Response:**

Returns an array of markets matching the search criteria, sorted as specified.

## Usage Examples

### Example 1: Fetch Active Markets

```typescript
// Fetch all active markets in the crypto category
const response = await fetch('/api/markets?active=true&category=crypto&limit=50');
const markets = await response.json();

console.log(`Found ${markets.length} active crypto markets`);
```

### Example 2: Search Markets by Query

```typescript
// Search for markets containing "election"
const response = await fetch('/api/markets/search?query=election&sortBy=volume&sortOrder=desc');
const markets = await response.json();

markets.forEach((market) => {
	console.log(`${market.question} - Volume: $${market.volumeNum}`);
});
```

### Example 3: Get Market Details

```typescript
// Fetch a specific market by ID
const marketId = '0x123...';
const response = await fetch(`/api/markets/${marketId}`);

if (response.ok) {
	const market = await response.json();
	console.log(`Market: ${market.question}`);
	console.log(`Current prices: ${market.outcomePrices.join(', ')}`);
} else if (response.status === 404) {
	console.log('Market not found');
}
```

### Example 4: Using the Market Service Directly (Server-Side)

```typescript
import { MarketService } from '$lib/server/services/market-service';

// Create a service instance
const marketService = new MarketService();

// Fetch markets with filters
const markets = await marketService.getMarkets({
	category: 'crypto',
	active: true,
	limit: 10
});

// Search markets
const searchResults = await marketService.searchMarkets({
	query: 'bitcoin',
	sortBy: 'volume',
	sortOrder: 'desc'
});

// Get a specific market
const market = await marketService.getMarketById('0x123...');
```

### Example 5: Error Handling

```typescript
try {
	const response = await fetch('/api/markets?limit=invalid');

	if (!response.ok) {
		const error = await response.json();
		console.error(`Error ${error.statusCode}: ${error.message}`);
		// Error 400: Invalid limit parameter
	}
} catch (error) {
	console.error('Network error:', error);
}
```

## Architecture

The application follows a layered architecture:

```
┌─────────────────┐
│  SvelteKit      │
│  Frontend       │
└────────┬────────┘
         │
         │ HTTP Request
         │
┌────────▼────────┐
│  Server Routes  │  ← /api/markets/*
│  (+server.ts)   │
└────────┬────────┘
         │
┌────────▼────────┐
│  Market Service │  ← Business logic, caching
└────────┬────────┘
         │
┌────────▼────────┐
│  API Client     │  ← HTTP client for Gamma API
└────────┬────────┘
         │
┌────────▼────────┐
│  Polymarket     │
│  Gamma API      │
└─────────────────┘
```

### Key Components

- **Server Routes**: SvelteKit endpoints that handle HTTP requests
- **Market Service**: Business logic layer with caching and filtering
- **API Client**: HTTP client for communicating with Polymarket Gamma API
- **Cache Manager**: In-memory LRU cache with TTL support
- **Validators**: Input and response validation
- **Error Handlers**: Consistent error formatting and logging

## Development

### Available Scripts

```sh
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with UI
npm test:ui

# Run tests once (CI mode)
npm test:run

# Type checking
npm run check

# Linting
npm run lint

# Format code
npm run format

# Database commands
npm run db:start    # Start PostgreSQL with Docker
npm run db:push     # Push schema changes
npm run db:generate # Generate migrations
npm run db:migrate  # Run migrations
npm run db:studio   # Open Drizzle Studio
```

### Project Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── api/              # API client
│   │   ├── cache/            # Cache manager
│   │   ├── config/           # Configuration
│   │   ├── db/               # Database schema
│   │   ├── errors/           # Error types
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utilities (logger)
│   │   └── validation/       # Validators
│   └── components/           # Svelte components
└── routes/
    └── api/
        └── markets/          # API endpoints
```

## Testing

The project uses Vitest for unit testing and fast-check for property-based testing.

### Run Tests

```sh
# Run all tests
npm test

# Run tests once (no watch mode)
npm test:run

# Run tests with UI
npm test:ui
```

### Test Coverage

The test suite includes:

- **Unit Tests**: Test individual functions and components
- **Property-Based Tests**: Verify correctness properties across random inputs
- **Integration Tests**: Test end-to-end API flows

### Example Test

```typescript
import { test, expect } from 'vitest';
import { MarketService } from '$lib/server/services/market-service';

test('should filter markets by category', async () => {
	const service = new MarketService();
	const markets = await service.getMarkets({ category: 'crypto' });

	markets.forEach((market) => {
		expect(market.category).toBe('crypto');
	});
});
```

## Troubleshooting

### Common Issues

#### 1. API Connection Errors

**Problem**: Getting 503 errors or "Connection refused" messages.

**Solutions**:

- Verify the `POLYMARKET_API_URL` is correct in your `.env` file
- Check your internet connection
- Verify the Polymarket Gamma API is operational
- Try increasing `POLYMARKET_API_TIMEOUT` if requests are timing out

```env
# Increase timeout to 30 seconds
POLYMARKET_API_TIMEOUT="30000"
```

#### 2. Cache Not Working

**Problem**: Responses seem slow or cache isn't being used.

**Solutions**:

- Verify `POLYMARKET_CACHE_ENABLED` is set to `"true"`
- Check cache TTL isn't too short: `POLYMARKET_CACHE_TTL="60"`
- Clear the cache by restarting the development server
- Check logs for cache hit/miss information

#### 3. Invalid Environment Variables

**Problem**: Getting "ConfigurationError" on startup.

**Solutions**:

- Ensure all environment variables are properly formatted
- Check that numeric values (timeout, TTL) are valid numbers
- Verify boolean values are exactly `"true"` or `"false"` (as strings)
- Make sure the API URL is a valid HTTP/HTTPS URL

```env
# Correct format
POLYMARKET_API_TIMEOUT="10000"
POLYMARKET_CACHE_ENABLED="true"

# Incorrect format
POLYMARKET_API_TIMEOUT=10000        # Missing quotes
POLYMARKET_CACHE_ENABLED=true       # Missing quotes
```

#### 4. Validation Errors (400 Bad Request)

**Problem**: Getting validation errors when making API requests.

**Solutions**:

- Check query parameter types (e.g., `limit` must be a positive number)
- Verify boolean parameters are `"true"` or `"false"` (not `1` or `0`)
- Ensure `sortBy` is one of: `volume`, `liquidity`, `createdAt`
- Ensure `sortOrder` is either `asc` or `desc`

```sh
# Correct
curl "/api/markets?limit=10&active=true"

# Incorrect
curl "/api/markets?limit=-5&active=1"
```

#### 5. Market Not Found (404)

**Problem**: Getting 404 errors when fetching specific markets.

**Solutions**:

- Verify the market ID or slug is correct
- Check if the market exists by searching first
- Ensure you're using the correct endpoint (`/api/markets/[id]` vs `/api/markets/slug/[slug]`)
- Try fetching the market list to see available markets

#### 6. Slow Response Times

**Problem**: API responses are taking too long.

**Solutions**:

- Enable caching: `POLYMARKET_CACHE_ENABLED="true"`
- Reduce the number of results: use `limit` parameter
- Use pagination with `offset` for large datasets
- Check network latency to Polymarket API
- Consider increasing cache TTL for less frequently changing data

```sh
# Use pagination for better performance
curl "/api/markets?limit=20&offset=0"
```

#### 7. TypeScript Errors

**Problem**: Getting TypeScript compilation errors.

**Solutions**:

- Run `npm run check` to see all type errors
- Ensure all dependencies are installed: `npm install`
- Regenerate SvelteKit types: `npm run prepare`
- Check that you're using the correct types from the API

#### 8. Database Connection Issues

**Problem**: Database connection errors.

**Solutions**:

- Start the database: `npm run db:start`
- Verify `DATABASE_URL` in `.env` is correct
- Check Docker is running (if using Docker for PostgreSQL)
- Run migrations: `npm run db:migrate`

### Debugging Tips

#### Enable Verbose Logging

The application includes comprehensive logging. Check the console output for:

- Request details (URL, parameters)
- Response status and duration
- Cache hit/miss information
- Error details with stack traces

#### Check API Response

Test the Polymarket API directly:

```sh
curl "https://gamma-api.polymarket.com/markets?limit=1"
```

#### Inspect Cache State

The cache manager tracks access patterns. Check logs for:

- `Cache hit for markets` - Data served from cache
- `Cache miss for markets, fetching from API` - Fresh data fetched

#### Test Individual Components

You can test components in isolation:

```typescript
import { PolymarketClient } from '$lib/server/api/polymarket-client';
import { loadConfig } from '$lib/server/config/api-config';

const config = loadConfig();
const client = new PolymarketClient(config);

// Test direct API call
const markets = await client.fetchMarkets({ params: { limit: 5 } });
console.log(markets);
```

### Getting Help

If you're still experiencing issues:

1. Check the [Polymarket API Documentation](https://docs.polymarket.com/)
2. Review the application logs for detailed error messages
3. Verify your environment configuration
4. Check that all dependencies are up to date: `npm update`
5. Try clearing node_modules and reinstalling: `rm -rf node_modules && npm install`

### Performance Monitoring

Monitor these metrics for optimal performance:

- **Cache Hit Rate**: Should be > 70% for frequently accessed data
- **Response Time**: Should be < 100ms for cached responses, < 2s for API calls
- **Error Rate**: Should be < 1% under normal conditions

Check logs for duration information:

```
API request successful { url: '...', duration: 1234 }
```

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]
