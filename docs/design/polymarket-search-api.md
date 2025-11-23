# Design: Polymarket Search API

**References**: [Requirements Document](../requirements/polymarket-search-api.md)

## Architecture Overview

The search API follows the established three-layer architecture used throughout the codebase:

1. **Route Layer** (`/src/routes/api/search/+server.ts`) - SvelteKit server route that handles HTTP requests, parameter parsing, and validation
2. **Service Layer** (`/src/lib/server/services/search-service.ts`) - Business logic, caching, and orchestration
3. **Client Layer** (`/src/lib/server/api/polymarket-client.ts`) - HTTP communication with Polymarket Gamma API

This design maintains consistency with existing endpoints (Markets, Events, Series, Tags, Comments, Users) and leverages shared infrastructure (validation, caching, error handling, logging).

## Component Design

### 1. Route Handler (`/src/routes/api/search/+server.ts`)

**Responsibility**: HTTP request handling, query parameter parsing, input validation, and response formatting.

**Structure**:

```typescript
export async function GET({ url }: RequestEvent) {
	// 1. Parse all query parameters from URL
	// 2. Validate required parameter (q)
	// 3. Build search options object with type-safe parameters
	// 4. Call SearchService.search()
	// 5. Return JSON response with cache headers
	// 6. Handle errors with formatErrorResponse()
}
```

**Query Parameter Handling**:

- `q` (required string) - Search query
- `cache` (optional boolean) - Enable/disable caching
- `events_status` (optional string) - Filter by event status
- `limit_per_type` (optional integer) - Results per entity type
- `page` (optional integer) - Page number for pagination
- `events_tag` (optional string array) - Filter by tags
- `keep_closed_markets` (optional integer 0/1) - Include closed markets
- `sort` (optional string) - Sort field
- `ascending` (optional boolean) - Sort direction
- `search_tags` (optional boolean) - Include tags in results (default: true)
- `search_profiles` (optional boolean) - Include profiles in results (default: true)
- `recurrence` (optional string) - Filter by recurrence type
- `exclude_tag_id` (optional integer array) - Exclude tag IDs
- `optimized` (optional boolean) - Return optimized results

**Validation Strategy**:

- Required: `q` parameter must be non-empty string
- Numeric: `limit_per_type`, `page`, `keep_closed_markets` must be valid integers ≥ 0
- Boolean: `cache`, `ascending`, `search_tags`, `search_profiles`, `optimized` must be 'true' or 'false'
- Array: `events_tag` and `exclude_tag_id` must be properly formatted (comma-separated or repeated params)

### 2. Service Layer (`/src/lib/server/services/search-service.ts`)

**Responsibility**: Caching, cache stampede protection, business logic orchestration.

**Class Structure**:

```typescript
export interface SearchOptions {
	q: string;
	cache?: boolean;
	eventsStatus?: string;
	limitPerType?: number;
	page?: number;
	eventsTags?: string[];
	keepClosedMarkets?: number;
	sort?: string;
	ascending?: boolean;
	searchTags?: boolean;
	searchProfiles?: boolean;
	recurrence?: string;
	excludeTagIds?: number[];
	optimized?: boolean;
}

export class SearchService {
	private client: PolymarketClient;
	private cache: CacheManager;
	private logger: Logger;
	private cacheTtl: number;
	private pendingRequests: Map<string, Promise<SearchResults>>;

	constructor(cacheTtl: number = 60000);

	async search(options: SearchOptions): Promise<SearchResults>;
	private async fetchAndCacheSearch(
		cacheKey: string,
		options: SearchOptions
	): Promise<SearchResults>;
	private buildCacheKey(options: SearchOptions): string;
}
```

**Caching Strategy**:

- Cache key includes all search parameters (query + filters)
- Default TTL: 60 seconds (configurable)
- Cache can be disabled via `cache: false` option
- Implements cache stampede protection (pendingRequests map)

**Cache Key Generation**:

```typescript
private buildCacheKey(options: SearchOptions): string {
  return `search:${JSON.stringify(options)}`;
}
```

### 3. API Client Extension (`/src/lib/server/api/polymarket-client.ts`)

**New Method**:

```typescript
async fetchSearch(options: {
  params: Record<string, string | number | boolean | string[] | number[]>;
}): Promise<SearchResults>
```

**Implementation**:

- Constructs URL: `${this.gammaBaseUrl}/public-search`
- Converts array parameters to appropriate query string format
- Validates inputs using new `validateSearchQueryParams()` function
- Validates response using new `validateSearchResults()` function
- Handles errors consistently with existing methods

## Data Models

### New TypeScript Interfaces

```typescript
/**
 * Represents a search tag result
 */
export interface SearchTag {
	id: string;
	label: string | null;
	slug: string | null;
	eventCount?: number | null;
}

/**
 * Represents a user profile in search results
 */
export interface Profile {
	id: string;
	name: string | null;
	pseudonym: string | null;
	bio: string | null;
	profileImage: string | null;
	profileImageOptimized: string | null;
	displayUsernamePublic: boolean | null;
}

/**
 * Pagination metadata for search results
 */
export interface SearchPagination {
	hasMore: boolean;
	totalResults: number;
}

/**
 * Complete search results response
 */
export interface SearchResults {
	events: Event[];
	tags: SearchTag[];
	profiles: Profile[];
	pagination: SearchPagination;
}
```

**Design Notes**:

- `Event` type already exists and will be reused
- All fields except pagination properties are nullable per API spec
- `SearchTag` extends basic `Tag` with `eventCount`
- `Profile` represents user profile data

## API Design

### Endpoint

```
GET /api/search
```

### Request Parameters

| Parameter             | Type     | Required | Default | Description                  |
| --------------------- | -------- | -------- | ------- | ---------------------------- |
| `q`                   | string   | Yes      | -       | Search query                 |
| `cache`               | boolean  | No       | true    | Enable caching               |
| `events_status`       | string   | No       | -       | Filter by event status       |
| `limit_per_type`      | integer  | No       | -       | Results limit per type       |
| `page`                | integer  | No       | -       | Page number                  |
| `events_tag`          | string[] | No       | -       | Filter by event tags         |
| `keep_closed_markets` | integer  | No       | -       | Include closed markets (0/1) |
| `sort`                | string   | No       | -       | Sort field                   |
| `ascending`           | boolean  | No       | -       | Sort direction               |
| `search_tags`         | boolean  | No       | true    | Include tags in results      |
| `search_profiles`     | boolean  | No       | true    | Include profiles in results  |
| `recurrence`          | string   | No       | -       | Filter by recurrence type    |
| `exclude_tag_id`      | number[] | No       | -       | Exclude tag IDs              |
| `optimized`           | boolean  | No       | -       | Return optimized results     |

### Response Format

**Success Response (200)**:

```json
{
  "events": [
    {
      "id": "string",
      "ticker": "string",
      "title": "string",
      "markets": [...],
      ...
    }
  ],
  "tags": [
    {
      "id": "string",
      "label": "string",
      "slug": "string",
      "eventCount": 42
    }
  ],
  "profiles": [
    {
      "id": "string",
      "name": "string",
      "pseudonym": "string",
      "bio": "string",
      "profileImage": "string",
      "profileImageOptimized": "string",
      "displayUsernamePublic": true
    }
  ],
  "pagination": {
    "hasMore": true,
    "totalResults": 150
  }
}
```

**Error Response (400, 404, 500)**:

```json
{
	"error": {
		"message": "Error description",
		"code": "ERROR_CODE",
		"statusCode": 400,
		"timestamp": "2025-11-23T12:00:00.000Z",
		"details": {}
	}
}
```

### Cache Headers

```
Cache-Control: public, max-age=60, s-maxage=60
CDN-Cache-Control: public, max-age=60
Vercel-CDN-Cache-Control: public, max-age=60
```

## Correctness Properties

These properties map to acceptance criteria from requirements and ensure implementation correctness:

### CP1: Endpoint Existence (AC1)

**Property**: GET request to `/api/search?q=test` returns 200 status with SearchResults structure
**Test**: Make request with minimal params, verify response structure contains events, tags, profiles, pagination fields

### CP2: Required Parameter Validation (AC5)

**Property**: Missing or empty `q` parameter returns 400 with validation error
**Test**:

- Request without `q` → 400 error
- Request with `q=""` → 400 error
- Request with `q="  "` → 400 error (whitespace only)

### CP3: Numeric Parameter Validation (AC5)

**Property**: Invalid numeric parameters return 400 with descriptive error
**Test**:

- `limit_per_type=abc` → 400 error
- `page=-1` → 400 error
- `keep_closed_markets=2` → 400 error (only 0/1 allowed)

### CP4: Boolean Parameter Validation (AC5)

**Property**: Invalid boolean parameters return 400 with descriptive error
**Test**:

- `cache=yes` → 400 error
- `ascending=1` → 400 error
- `search_tags=invalid` → 400 error

### CP5: Array Parameter Parsing (AC2)

**Property**: Array parameters are correctly parsed and sent to upstream API
**Test**:

- `events_tag=politics&events_tag=crypto` → both tags included
- `exclude_tag_id=1,2,3` → all IDs excluded
- Verify upstream request contains properly formatted arrays

### CP6: Cache Functionality (AC7)

**Property**: Identical requests within TTL return cached results
**Test**:

- Make request → check cache miss log
- Make identical request within 60s → check cache hit log
- Verify second request doesn't hit upstream API

### CP7: Cache Stampede Protection (AC7)

**Property**: Concurrent identical requests only trigger one upstream API call
**Test**:

- Send 10 identical requests simultaneously
- Verify only 1 upstream API request is made
- All 10 requests receive same response

### CP8: Cache Key Uniqueness (AC7)

**Property**: Different search parameters generate different cache keys
**Test**:

- Request with `q=bitcoin` → cache miss
- Request with `q=ethereum` → cache miss (different key)
- Request with `q=bitcoin&page=2` → cache miss (different key)

### CP9: Response Nullability Handling (AC6)

**Property**: Null fields in API response don't cause errors and are preserved
**Test**:

- Mock response with null Event.title, Tag.label, Profile.name
- Verify response is valid and nulls are preserved

### CP10: Error Propagation (AC8)

**Property**: Upstream errors are properly caught, logged, and formatted
**Test**:

- Mock 404 from upstream → 404 with proper error format
- Mock network timeout → 500 with timeout error
- Mock malformed JSON → 500 with parsing error

### CP11: Filter Parameters (AC2)

**Property**: Filter parameters are correctly passed to upstream API
**Test**:

- Request with `events_status=active` → verify in upstream request
- Request with `recurrence=daily` → verify in upstream request
- Request with `keep_closed_markets=0` → verify in upstream request

### CP12: Result Control (AC3)

**Property**: Result control parameters affect response correctly
**Test**:

- `search_tags=false` → tags array should be empty or excluded
- `search_profiles=false` → profiles array should be empty or excluded
- `limit_per_type=5` → each result type has ≤ 5 items

### CP13: Pagination Metadata (AC1)

**Property**: Pagination object always contains hasMore and totalResults
**Test**:

- Any valid request → verify pagination.hasMore is boolean
- Any valid request → verify pagination.totalResults is number

### CP14: Logging Coverage (NFR: Observability)

**Property**: All critical operations are logged with appropriate context
**Test**: Verify logs contain:

- Request start with search options
- Cache hit/miss with query
- Upstream API call duration
- Error conditions with full context
- Request completion with result counts

### CP15: Performance SLA (NFR: Performance)

**Property**: Requests complete within 5 seconds under normal conditions
**Test**:

- Make 100 requests to `/api/search?q=test`
- Verify p99 latency < 5000ms
- Cached requests should be < 50ms

## Technical Decisions

### Decision 1: Reuse Existing Event Type

**Choice**: Use existing `Event` interface from polymarket-client
**Rationale**: Search returns standard Event objects; creating duplicate types violates DRY and creates maintenance burden
**Tradeoff**: None - Event type already supports all required fields

### Decision 2: Service Layer Caching

**Choice**: Implement caching in SearchService, not route layer
**Rationale**: Consistent with existing services (MarketService, EventService); enables cache control via service options
**Tradeoff**: Slightly more complex than route-level caching, but much more flexible

### Decision 3: Cache TTL of 60 Seconds

**Choice**: Default cache TTL of 60 seconds, configurable via constructor
**Rationale**: Matches existing services; balances freshness vs. performance; search results don't need real-time accuracy
**Tradeoff**: Users may see stale results for up to 60s, but can be overridden with `cache=false`

### Decision 4: Array Parameter Format

**Choice**: Support both repeated params (`tag=a&tag=b`) and comma-separated (`tag=a,b`)
**Rationale**: Flexible for different client implementations; common pattern in REST APIs
**Tradeoff**: Slightly more complex parsing logic

### Decision 5: Separate SearchTag Type

**Choice**: Create `SearchTag` interface extending base `Tag` with `eventCount`
**Rationale**: Search tags have additional metadata not present in regular tags
**Tradeoff**: One more type to maintain, but provides type safety

### Decision 6: Profile Type Creation

**Choice**: Create new `Profile` interface for user profiles
**Rationale**: Profile data structure is unique to search; doesn't match existing types
**Tradeoff**: New type to maintain, but necessary for type safety

### Decision 7: Input Validation in Route Layer

**Choice**: Validate and parse parameters in route handler before calling service
**Rationale**: Consistent with existing routes; fail fast on invalid input; keeps service layer clean
**Tradeoff**: Route handler is more complex, but separation of concerns is clear

### Decision 8: Cache Key Includes All Parameters

**Choice**: Generate cache key from JSON.stringify(options)
**Rationale**: Simple, correct, handles all parameter combinations including arrays
**Tradeoff**: Cache keys may be long, but CacheManager handles this fine

### Decision 9: Nullable Response Fields

**Choice**: Mark most response fields as nullable following API spec
**Rationale**: Polymarket API returns nulls for many fields; TypeScript types must reflect reality
**Tradeoff**: Consumers must handle nulls, but this prevents runtime errors

### Decision 10: Single Route File

**Choice**: Implement as `/api/search/+server.ts` (not nested under markets or events)
**Rationale**: Search is cross-entity (markets + events + profiles); doesn't belong under any single resource
**Tradeoff**: None - this is the correct RESTful structure

## Dependencies

### Existing Dependencies (No Changes)

- `@sveltejs/kit` - Server route framework
- `PolymarketClient` - HTTP client for Gamma API
- `CacheManager` - In-memory caching
- `Logger` - Structured logging
- `ApiError`, `formatErrorResponse` - Error handling
- `loadConfig` - Configuration loading

### New Validation Functions Required

**Input Validation** (`input-validator.ts`):

```typescript
export function validateSearchQueryParams(
	params: Record<string, string | number | boolean | string[] | number[]>
): Record<string, string | number | boolean | string[] | number[]>;
```

**Response Validation** (`response-validator.ts`):

```typescript
export function validateSearchResults(data: unknown): SearchResults;
export function validateSearchTag(data: unknown): SearchTag;
export function validateProfile(data: unknown): Profile;
export function validateSearchPagination(data: unknown): SearchPagination;
```

### New Utility Functions

**Array Parameter Parsing** (in route handler):

```typescript
function parseArrayParam(value: string | null): string[] | undefined;
function parseIntArrayParam(value: string | null): number[] | undefined;
```

## File Structure

```
src/
├── routes/
│   └── api/
│       └── search/
│           └── +server.ts                    [NEW] Route handler
├── lib/
│   └── server/
│       ├── services/
│       │   └── search-service.ts             [NEW] Service layer
│       ├── api/
│       │   └── polymarket-client.ts          [MODIFY] Add fetchSearch()
│       └── validation/
│           ├── input-validator.ts            [MODIFY] Add search validators
│           └── response-validator.ts         [MODIFY] Add search validators
docs/
├── requirements/
│   └── polymarket-search-api.md              [EXISTS] Requirements doc
└── design/
    └── polymarket-search-api.md              [NEW] This document
.claude/
└── polymarket-api-reference.md               [MODIFY] Add search docs
```

## Security Considerations

1. **Input Sanitization**: All query parameters validated before use
2. **Array Injection**: Array parameters validated to prevent injection attacks
3. **Query Length**: Search query `q` validated to prevent abuse (reasonable max length)
4. **Integer Bounds**: Numeric parameters validated within reasonable ranges
5. **No User Data**: Search is public endpoint; no sensitive user data exposed
6. **Rate Limiting**: Rely on upstream Polymarket API rate limits (no custom implementation)

## Performance Considerations

1. **Caching**: 60s TTL reduces upstream API load by ~95% for common queries
2. **Cache Stampede**: Prevents N concurrent requests from causing N upstream calls
3. **Response Size**: No artificial pagination beyond what upstream API provides
4. **Memory**: Cache limited to 100 entries by CacheManager default
5. **Logging**: All logs use structured format for efficient parsing/filtering

## Error Handling Strategy

Follows existing error handling patterns:

1. **Validation Errors** → 400 with ValidationError
2. **Not Found** → 404 if upstream returns 404
3. **Network Errors** → 500 with NetworkError
4. **Timeout Errors** → 500 with TimeoutError
5. **Parsing Errors** → 500 with ParsingError
6. **Unknown Errors** → 500 with generic error

All errors logged with:

- Error type/message
- Request parameters
- Duration
- Stack trace (for 500 errors)

## Testing Strategy

### Unit Tests

- Input validation for all parameter types
- Cache key generation
- Array parameter parsing
- Error handling branches

### Integration Tests

- Full request → response cycle
- Cache hit/miss scenarios
- Concurrent request handling
- Error propagation from upstream

### Manual Testing

- Test all parameter combinations
- Verify cache behavior
- Check error messages are user-friendly
- Validate response structure

## Migration/Rollout Plan

No migration required - this is a new endpoint. Rollout is straightforward:

1. Implement all files in order (types → validators → client → service → route)
2. Run tests to verify correctness properties
3. Deploy to staging
4. Test with real Polymarket API
5. Update documentation
6. Deploy to production

No breaking changes to existing code.
