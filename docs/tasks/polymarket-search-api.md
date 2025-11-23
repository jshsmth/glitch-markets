# Tasks: Polymarket Search API Implementation

**References**:

- [Requirements](../requirements/polymarket-search-api.md)
- [Design](../design/polymarket-search-api.md)

## Task Breakdown

### Phase 1: Type Definitions and Validation (Foundation)

#### [ ] Task 1: Add TypeScript Interfaces to polymarket-client.ts

**Location**: `src/lib/server/api/polymarket-client.ts`

**What to do**:

- Add `SearchTag` interface (extends Tag with `eventCount?: number | null`)
- Add `Profile` interface with all user profile fields
- Add `SearchPagination` interface with `hasMore` and `totalResults`
- Add `SearchResults` interface containing events, tags, profiles, pagination arrays

**Completion criteria**:

- All 4 interfaces defined with proper nullable types
- JSDoc comments added for each interface
- Types export correctly

**Requirements addressed**: AC6 (Response Structure)
**Design reference**: Data Models section

---

#### [ ] Task 2: Add Input Validation Function

**Location**: `src/lib/server/validation/input-validator.ts`

**What to do**:

- Create `validateSearchQueryParams()` function
- Validate required `q` parameter (non-empty string)
- Validate optional numeric params (limit_per_type, page, keep_closed_markets)
- Validate optional boolean params (cache, ascending, search_tags, search_profiles, optimized)
- Validate optional string params (events_status, sort, recurrence)
- Validate array params (events_tag, exclude_tag_id)

**Completion criteria**:

- Function validates all search parameters
- Throws ValidationError for invalid inputs
- Returns validated params object
- Follows existing validation patterns

**Requirements addressed**: AC5 (Input Validation)
**Design reference**: Component Design - Validation Strategy

---

#### [ ] Task 3: Add Response Validation Functions

**Location**: `src/lib/server/validation/response-validator.ts`

**What to do**:

- Create `validateSearchTag()` function
- Create `validateProfile()` function
- Create `validateSearchPagination()` function
- Create `validateSearchResults()` function (validates entire response)

**Completion criteria**:

- All functions validate according to API spec
- Nullable fields properly handled
- Throws ParsingError for malformed responses
- Follows existing validation patterns

**Requirements addressed**: AC6 (Response Structure), AC8 (Error Handling)
**Design reference**: Dependencies - New Validation Functions

---

### Phase 2: API Client Extension

#### [ ] Task 4: Implement fetchSearch() Method

**Location**: `src/lib/server/api/polymarket-client.ts`

**What to do**:

- Add `fetchSearch()` method to PolymarketClient class
- Construct URL: `${this.gammaBaseUrl}/public-search`
- Accept params object with all search parameters
- Convert array parameters to query string format
- Call `validateSearchQueryParams()` on inputs
- Make HTTP request with proper error handling
- Call `validateSearchResults()` on response
- Handle 404, timeout, network errors consistently

**Completion criteria**:

- Method signature matches design
- Uses existing error handling patterns (NetworkError, TimeoutError, etc.)
- Properly validates input and output
- Handles array parameters correctly
- Returns typed SearchResults object

**Requirements addressed**: AC1 (Endpoint), AC8 (Error Handling)
**Design reference**: Component Design - API Client Extension

---

### Phase 3: Service Layer

#### [ ] Task 5: Create SearchService Class

**Location**: `src/lib/server/services/search-service.ts`

**What to do**:

- Create `SearchOptions` interface
- Create `SearchService` class with:
  - Constructor accepting optional cacheTtl parameter
  - Private client, cache, logger, pendingRequests properties
  - Public `search()` method
  - Private `fetchAndCacheSearch()` method
  - Private `buildCacheKey()` method
- Implement caching with cache stampede protection
- Add logging for cache hits/misses, API calls, errors

**Completion criteria**:

- Class follows existing service patterns (MarketService, EventService)
- Implements cache stampede protection (pendingRequests map)
- Cache can be disabled via `cache: false` option
- Cache key includes all search parameters
- Comprehensive logging with structured context
- JSDoc comments for public methods

**Requirements addressed**: AC7 (Caching), NFR (Observability)
**Design reference**: Component Design - Service Layer

**Dependencies**: Tasks 1-4 must be completed

---

### Phase 4: Route Handler

#### [ ] Task 6: Create Route Handler

**Location**: `src/routes/api/search/+server.ts`

**What to do**:

- Create GET handler function
- Parse all query parameters from URL:
  - Required: `q`
  - Optional: cache, events_status, limit_per_type, page, events_tag, keep_closed_markets, sort, ascending, search_tags, search_profiles, recurrence, exclude_tag_id, optimized
- Implement array parameter parsing (both `tag=a&tag=b` and `tag=a,b`)
- Validate required parameter `q` is present and non-empty
- Validate numeric parameters are valid integers ≥ 0
- Validate boolean parameters are 'true' or 'false'
- Build SearchOptions object
- Call SearchService.search()
- Return JSON response with cache headers
- Handle all error types with formatErrorResponse()
- Add request timing and logging

**Completion criteria**:

- Route accessible at GET /api/search
- All parameters parsed correctly
- Array parameters support both formats
- Validation errors return 400 with clear messages
- Success returns 200 with SearchResults
- Cache headers set correctly
- Errors logged with full context
- Follows existing route patterns

**Requirements addressed**: AC1-AC5 (All endpoint requirements)
**Design reference**: Component Design - Route Handler

**Dependencies**: Tasks 1-5 must be completed

---

### Phase 5: Documentation

#### [ ] Task 7: Update API Reference Documentation

**Location**: `.claude/polymarket-api-reference.md`

**What to do**:

- Add Search section with link to Polymarket docs
- Add `/api/search` to "Our Implemented Endpoints" section
- Document all query parameters with types and descriptions
- Add request examples (simple search, filtered search, paginated search)
- Add response examples (success and error)
- Document error codes and scenarios
- Add usage notes and best practices

**Completion criteria**:

- Documentation is complete and accurate
- Examples are copy-paste ready
- Consistent with existing endpoint documentation
- Includes all 14 query parameters
- Shows response structure clearly

**Requirements addressed**: AC9 (Documentation)
**Design reference**: API Design section

**Dependencies**: None (can be done in parallel with implementation)

---

### Phase 6: Testing and Validation

#### [ ] Task 8: Manual Testing - Basic Functionality

**What to test**:

- [ ] Simple search: `GET /api/search?q=bitcoin`
- [ ] Empty query validation: `GET /api/search?q=` returns 400
- [ ] Missing query validation: `GET /api/search` returns 400
- [ ] Response contains all 4 top-level keys (events, tags, profiles, pagination)
- [ ] Pagination metadata is present and valid

**Completion criteria**:

- All basic requests work as expected
- Validation errors return appropriate 400 responses
- Response structure matches SearchResults type

**Requirements addressed**: AC1, AC5
**Correctness properties**: CP1, CP2, CP13

**Dependencies**: Task 6 must be completed

---

#### [ ] Task 9: Manual Testing - Filter Parameters

**What to test**:

- [ ] events_status: `GET /api/search?q=test&events_status=active`
- [ ] events_tag (single): `GET /api/search?q=test&events_tag=politics`
- [ ] events_tag (multiple): `GET /api/search?q=test&events_tag=politics&events_tag=crypto`
- [ ] keep_closed_markets: `GET /api/search?q=test&keep_closed_markets=0`
- [ ] recurrence: `GET /api/search?q=test&recurrence=daily`
- [ ] exclude_tag_id: `GET /api/search?q=test&exclude_tag_id=1,2,3`

**Completion criteria**:

- All filter parameters accepted
- Parameters correctly passed to upstream API
- Results reflect filters applied

**Requirements addressed**: AC2
**Correctness properties**: CP5, CP11

**Dependencies**: Task 6 must be completed

---

#### [ ] Task 10: Manual Testing - Result Control

**What to test**:

- [ ] limit_per_type: `GET /api/search?q=test&limit_per_type=5`
- [ ] page: `GET /api/search?q=test&page=2`
- [ ] search_tags=false: `GET /api/search?q=test&search_tags=false`
- [ ] search_profiles=false: `GET /api/search?q=test&search_profiles=false`
- [ ] sort and ascending: `GET /api/search?q=test&sort=volume&ascending=true`
- [ ] optimized: `GET /api/search?q=test&optimized=true`

**Completion criteria**:

- All result control parameters work
- Limits are respected
- Pagination works correctly
- Entity type filtering works

**Requirements addressed**: AC3, AC4
**Correctness properties**: CP12

**Dependencies**: Task 6 must be completed

---

#### [ ] Task 11: Manual Testing - Input Validation

**What to test**:

- [ ] Invalid limit_per_type: `GET /api/search?q=test&limit_per_type=abc` returns 400
- [ ] Negative page: `GET /api/search?q=test&page=-1` returns 400
- [ ] Invalid boolean: `GET /api/search?q=test&cache=yes` returns 400
- [ ] Invalid keep_closed_markets: `GET /api/search?q=test&keep_closed_markets=99` returns 400
- [ ] Whitespace-only query: `GET /api/search?q=%20%20` returns 400

**Completion criteria**:

- All invalid inputs return 400 with descriptive error messages
- Error responses follow standard format
- Validation happens before API call

**Requirements addressed**: AC5
**Correctness properties**: CP2, CP3, CP4

**Dependencies**: Task 6 must be completed

---

#### [ ] Task 12: Manual Testing - Caching

**What to test**:

- [ ] Make request: `GET /api/search?q=bitcoin` - check logs for cache miss
- [ ] Repeat immediately - check logs for cache hit
- [ ] Wait 61+ seconds, repeat - check logs for cache miss (TTL expired)
- [ ] Request with cache=false: `GET /api/search?q=bitcoin&cache=false` - always misses cache
- [ ] Different queries generate different cache keys

**Completion criteria**:

- Cache hits and misses logged correctly
- TTL of 60 seconds works
- cache=false bypasses cache
- Cache keys are unique per parameter combination

**Requirements addressed**: AC7
**Correctness properties**: CP6, CP8

**Dependencies**: Task 6 must be completed

---

#### [ ] Task 13: Manual Testing - Cache Stampede Protection

**What to test**:

- Create simple test script that makes 10 identical concurrent requests
- Monitor logs to verify only 1 upstream API call is made
- Verify all 10 requests receive the same response

**Completion criteria**:

- Concurrent identical requests are deduplicated
- Only one upstream API call for concurrent requests
- All requesters receive the response

**Requirements addressed**: AC7
**Correctness properties**: CP7

**Dependencies**: Task 6 must be completed

---

#### [ ] Task 14: Manual Testing - Error Handling

**What to test**:

- Network connectivity (if possible to simulate)
- Malformed response from upstream (may need mocking)
- Verify errors are logged with appropriate context
- Verify error responses follow standard format

**Completion criteria**:

- Errors handled gracefully
- User-friendly error messages
- Full error context logged
- No stack traces exposed to clients

**Requirements addressed**: AC8
**Correctness properties**: CP10

**Dependencies**: Task 6 must be completed

---

#### [ ] Task 15: Performance Testing

**What to test**:

- Measure response time for cache hits (should be <50ms)
- Measure response time for cache misses (should be <5s)
- Test with various query lengths and parameter combinations
- Monitor memory usage with cache enabled

**Completion criteria**:

- Cache hits respond in <50ms
- Cache misses respond in <5s
- No memory leaks observed
- Performance meets NFR targets

**Requirements addressed**: NFR (Performance)
**Correctness properties**: CP15

**Dependencies**: Task 6 must be completed

---

## Task Summary

**Total Tasks**: 15

**By Phase**:

- Phase 1 (Foundation): 3 tasks
- Phase 2 (API Client): 1 task
- Phase 3 (Service): 1 task
- Phase 4 (Route): 1 task
- Phase 5 (Documentation): 1 task
- Phase 6 (Testing): 8 tasks

**Critical Path**:

1. Tasks 1-3 (can be done in parallel)
2. Task 4 (depends on 1-3)
3. Task 5 (depends on 1-4)
4. Task 6 (depends on 1-5)
5. Tasks 8-15 (depend on 6, can be done in parallel)
6. Task 7 (can be done anytime)

**Estimated Effort**:

- Implementation (Tasks 1-6): ~3-4 hours
- Testing (Tasks 8-15): ~2-3 hours
- Documentation (Task 7): ~30 minutes
- **Total**: ~6-8 hours

## Implementation Order

**Recommended sequence**:

1. Task 1 - Type definitions (foundation)
2. Task 2 - Input validation (foundation)
3. Task 3 - Response validation (foundation)
4. Task 4 - API client method
5. Task 5 - Service layer
6. Task 6 - Route handler
7. Task 8 - Basic functionality test
8. Tasks 9-15 - Comprehensive testing (parallel)
9. Task 7 - Documentation (can be done anytime)

## Notes

- All tasks follow existing codebase patterns
- No breaking changes to existing code
- Testing tasks can be batched but should verify all correctness properties
- Documentation can be written in parallel with implementation
- Consider creating a simple test client/script for manual testing efficiency
