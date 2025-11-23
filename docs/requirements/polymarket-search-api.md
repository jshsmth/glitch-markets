# Requirements: Polymarket Search API

## Overview

Implement a unified search endpoint that allows users to search across markets, events, and user profiles using the Polymarket `/public-search` API. This feature will provide a single, powerful search interface that returns multiple entity types in one request, enabling users to quickly find relevant content across the entire Polymarket platform.

## User Stories

1. **As a developer**, I want to search for markets, events, and profiles in a single API call, so that I can build efficient search interfaces without making multiple requests.

2. **As an API consumer**, I want to filter search results by entity type (markets, events, profiles), so that I can focus on specific content types when needed.

3. **As a developer**, I want to control result limits per entity type, so that I can optimize response sizes and page layout.

4. **As a developer**, I want to filter search results by event status and tags, so that I can provide targeted search experiences for different use cases.

5. **As an API consumer**, I want pagination support with metadata, so that I can implement infinite scroll or traditional pagination UIs.

6. **As a developer**, I want cached search results, so that I can reduce API load and improve response times for common queries.

## Acceptance Criteria

### AC1: Unified Search Endpoint

- MUST expose a `GET /api/search` endpoint
- MUST accept a required `q` query parameter (search query string)
- MUST return results containing events, tags, and profiles arrays
- MUST return pagination metadata (`hasMore`, `totalResults`)

### AC2: Search Filtering

- MUST support `events_status` parameter to filter events by status
- MUST support `events_tag` parameter (array) to filter by event tags
- MUST support `exclude_tag_id` parameter (array) to exclude specific tags
- MUST support `recurrence` parameter to filter by recurrence type
- MUST support `keep_closed_markets` parameter (integer) to include/exclude closed markets

### AC3: Result Control

- MUST support `limit_per_type` parameter to control results per entity type
- MUST support `page` parameter for pagination
- MUST support `search_tags` boolean to include/exclude tags from results
- MUST support `search_profiles` boolean to include/exclude profiles from results

### AC4: Result Optimization

- MUST support `optimized` boolean parameter for optimized result format
- MUST support `cache` boolean parameter to enable/disable caching
- MUST support `sort` parameter to specify sort field
- MUST support `ascending` boolean for sort direction

### AC5: Input Validation

- MUST validate that `q` parameter is provided and non-empty
- MUST validate numeric parameters (page, limit_per_type, keep_closed_markets) are valid integers
- MUST validate boolean parameters are valid boolean values
- MUST validate array parameters (events_tag, exclude_tag_id) are properly formatted
- MUST return 400 status with descriptive error messages for invalid inputs

### AC6: Response Structure

- MUST return events as array of Event objects with market data
- MUST return tags as array of SearchTag objects
- MUST return profiles as array of Profile objects
- MUST handle nullable fields according to API specification
- MUST maintain consistent error response format with other endpoints

### AC7: Caching and Performance

- MUST implement caching with configurable TTL (default 60 seconds)
- MUST implement cache stampede protection for concurrent identical requests
- MUST use cache keys that include all query parameters
- MUST log cache hits/misses for monitoring
- MUST return appropriate cache control headers

### AC8: Error Handling

- MUST handle 404 responses from upstream API gracefully
- MUST handle network errors and timeouts consistently
- MUST handle malformed responses from upstream API
- MUST log all errors with appropriate context
- MUST return user-friendly error messages

### AC9: Documentation

- MUST update `.claude/polymarket-api-reference.md` with new endpoint documentation
- MUST include request/response examples
- MUST document all query parameters with types and descriptions
- MUST document error scenarios

## Non-functional Requirements

### Performance

- Search requests MUST complete within 5 seconds under normal conditions
- Cache hit rate SHOULD exceed 60% for common queries
- Concurrent identical requests MUST be deduplicated via cache stampede protection

### Security

- MUST sanitize all user inputs to prevent injection attacks
- MUST validate all inputs before passing to upstream API
- MUST not expose internal error details to clients

### Reliability

- MUST handle partial upstream API failures gracefully
- MUST implement retry logic with exponential backoff for transient failures
- MUST log sufficient information for debugging issues

### Observability

- MUST log request start/completion with duration
- MUST log cache operations (hits/misses)
- MUST log all error conditions with context
- MUST include query parameters in log metadata

### Maintainability

- MUST follow existing codebase patterns (service layer, validation, error handling)
- MUST use TypeScript types for all API interactions
- MUST include JSDoc comments for public methods
- MUST maintain consistency with other API endpoints (Markets, Events, Series, etc.)

## Out of Scope

1. **Search result ranking customization** - Will use Polymarket's default ranking algorithm
2. **Advanced filtering beyond what Polymarket API supports** - No custom filtering logic
3. **Search analytics/tracking** - No user behavior tracking or search analytics
4. **Autocomplete/suggestions** - This is a pure search endpoint, not an autocomplete service
5. **Search result highlighting** - No text highlighting or snippet generation
6. **Full-text search on cached data** - Searches always go to upstream API
7. **Rate limiting** - Will rely on upstream API rate limits (not implementing custom limits)
8. **Authentication** - Public endpoint, no auth required
9. **Custom result aggregation** - Will use Polymarket's response structure as-is
10. **Historical search queries** - No storage of past searches

## Dependencies

- Existing `PolymarketClient` class for HTTP communication
- Existing `CacheManager` for result caching
- Existing validation utilities for input/output validation
- Existing error handling framework (`ApiError`, `formatErrorResponse`)
- Existing logging infrastructure (`Logger`)

## Constraints

- MUST use Polymarket's `/public-search` endpoint (cannot use alternative search APIs)
- MUST work within SvelteKit's server route architecture
- MUST maintain backward compatibility with existing API patterns
- MUST not exceed 200ms additional latency from caching/validation overhead
