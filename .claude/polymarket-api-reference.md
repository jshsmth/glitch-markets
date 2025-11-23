# Polymarket API Reference - Documentation URLs

Quick reference for looking up official Polymarket API documentation.

## Base URLs

- **Gamma API**: `https://gamma-api.polymarket.com`
- **Data API**: `https://data-api.polymarket.com`
- **CLOB API**: `https://clob.polymarket.com`

---

## Gamma Endpoints

### Health

- **Health Check (Gamma)**: https://docs.polymarket.com/api-reference/health/health-check

### Sports

- **List Teams**: https://docs.polymarket.com/api-reference/sports/list-teams
- **Get Sports Matadata Information**: https://docs.polymarket.com/api-reference/sports/get-sports-metadata-information

### Tags

- **List Tags**: https://docs.polymarket.com/api-reference/tags/list-tags
- **Get Tag by ID**: https://docs.polymarket.com/api-reference/tags/get-tag-by-id
- **Get Tag by Slug**: https://docs.polymarket.com/api-reference/tags/get-tag-by-slug
- **Get Related Tags (Relationships) by Tag ID**: https://docs.polymarket.com/api-reference/tags/get-related-tags-relationships-by-tag-id
- **Get Related Tags (Relationships) by Tag Slug**: https://docs.polymarket.com/api-reference/tags/get-related-tags-relationships-by-tag-slug
- **Get Tags Related to a Tag ID**: https://docs.polymarket.com/api-reference/tags/get-tags-related-to-a-tag-id
- **Get Tags Related to a Tag Slug**: https://docs.polymarket.com/api-reference/tags/get-tags-related-to-a-tag-slug

### Events

- **List Events**: https://docs.polymarket.com/api-reference/events/list-events
- **Get Event by ID**: https://docs.polymarket.com/api-reference/events/get-event-by-id
- **Get Event Tags**: https://docs.polymarket.com/api-reference/events/get-event-tags
- **Get Event by Slug**: https://docs.polymarket.com/api-reference/events/get-event-by-slug

### Markets

- **List Markets**: https://docs.polymarket.com/api-reference/markets/list-markets
- **Get Market by ID**: https://docs.polymarket.com/api-reference/markets/get-market-by-id
- **Get Market Tags by ID**: https://docs.polymarket.com/api-reference/markets/get-market-tags-by-id
- **Get Market by Slug**: https://docs.polymarket.com/api-reference/markets/get-market-by-slug

### Series

- **List Series**: https://docs.polymarket.com/api-reference/series/list-series
- **Get Series by ID**: https://docs.polymarket.com/api-reference/series/get-series-by-id

### Comments

- **List Comments**: https://docs.polymarket.com/api-reference/comments/list-comments
- **Get Comment by ID**: https://docs.polymarket.com/api-reference/comments/get-comments-by-comment-id
- **Get Comments by User Address**: https://docs.polymarket.com/api-reference/comments/get-comments-by-user-address

### Search

- **Search Markets, Events, and Profiles**: https://docs.polymarket.com/api-reference/search/search-markets-events-and-profiles

---

## Data API Endpoints

### Health

- **Health Check (Data API)**: https://docs.polymarket.com/api-reference/health/health-check

### Core

- **Get Current Positions for a User**: https://docs.polymarket.com/api-reference/core/get-current-positions-for-a-user
- **Get Trades for a User or Markets**: https://docs.polymarket.com/api-reference/core/get-trades-for-a-user-or-markets
- **Get User Activity**: https://docs.polymarket.com/api-reference/core/get-user-activity
- **Get Top Holders for Markets**: https://docs.polymarket.com/api-reference/core/get-top-holders-for-markets
- **Get Total Value of a User's Positions**: https://docs.polymarket.com/api-reference/core/get-total-value-of-a-users-positions
- **Get Closed Positions for a User**: https://docs.polymarket.com/api-reference/core/get-closed-positions-for-a-user

### Misc

- **Get Total Markets a User Has Traded**: https://docs.polymarket.com/api-reference/misc/get-total-markets-a-user-has-traded
- **Get Open Interest**: https://docs.polymarket.com/api-reference/misc/get-open-interest
- **Get Live Volume for an Event**: https://docs.polymarket.com/api-reference/misc/get-live-volume-for-an-event

### Builders

- **Get Aggregated Builder Leaderboard**: https://docs.polymarket.com/api-reference/builders/get-aggregated-builder-leaderboard
- **Get Daily Builder Volume Time Series**: https://docs.polymarket.com/api-reference/builders/get-daily-builder-volume-time-series

---

## General Resources

### Gamma Markets API

- **Overview**: https://docs.polymarket.com/developers/gamma-markets-api/overview
- **Gamma Structure**: https://docs.polymarket.com/developers/gamma-markets-api/gamma-structure
- **Fetch Markets Guide**: https://docs.polymarket.com/developers/gamma-markets-api/fetch-markets-guide

### CLOB & Data API

- **CLOB Endpoints Overview**: https://docs.polymarket.com/developers/CLOB/endpoints
- **WebSocket Documentation**: https://docs.polymarket.com/developers/CLOB/websockets

### Developer Quickstart

- **Introduction**: https://docs.polymarket.com/quickstart/introduction/main
- **Showcase**: https://docs.polymarket.com/quickstart/introduction/showcase

---

## Our Implemented Endpoints

### Markets API

- `GET /api/markets` - List markets
- `GET /api/markets/:condition_id` - Get by condition ID
- `GET /api/markets/:id/tags` - Get market tags
- `GET /api/markets/slug/:slug` - Get by slug

### Events API

- `GET /api/events` - List events
- `GET /api/events/:id` - Get by ID
- `GET /api/events/:id/tags` - Get event tags
- `GET /api/events/slug/:slug` - Get by slug

### Series API

- `GET /api/series` - List series
- `GET /api/series/:id` - Get by ID

### Users API (Core)

- `GET /api/users/positions?user=<address>` - User positions
- `GET /api/users/activity?user=<address>` - User activity
- `GET /api/users/trades?user=<address>` - User trades
- `GET /api/users/closed-positions?user=<address>` - Closed positions
- `GET /api/users/value?user=<address>` - User value
- `GET /api/users/holders?conditionId=<id>` - Market holders

### Tags API

- `GET /api/tags` - List tags
- `GET /api/tags/:id` - Get by ID

### Comments API

- `GET /api/comments?parent_entity_type=<type>&parent_entity_id=<id>` - List comments
- `GET /api/comments/:id` - Get by ID
- `GET /api/comments/user/:address` - Get comments by user address

### Search API

- `GET /api/search?q=<query>` - Search markets, events, and profiles

---

## API Endpoint Details

### Search API

#### GET /api/search

Search across markets, events, and user profiles in a single request.

**Upstream API**: `GET https://gamma-api.polymarket.com/public-search`

**Query Parameters**:

| Parameter             | Type     | Required | Default | Description                                               |
| --------------------- | -------- | -------- | ------- | --------------------------------------------------------- |
| `q`                   | string   | Yes      | -       | Search query                                              |
| `cache`               | boolean  | No       | true    | Enable/disable caching                                    |
| `events_status`       | string   | No       | -       | Filter by event status (e.g., "active", "closed")         |
| `limit_per_type`      | integer  | No       | -       | Maximum results per entity type                           |
| `page`                | integer  | No       | -       | Page number for pagination                                |
| `events_tag`          | string[] | No       | -       | Filter by event tags (supports ?tag=a&tag=b or ?tag=a,b)  |
| `keep_closed_markets` | integer  | No       | -       | Include closed markets (0 or 1)                           |
| `sort`                | string   | No       | -       | Sort field                                                |
| `ascending`           | boolean  | No       | -       | Sort direction (true for ascending, false for descending) |
| `search_tags`         | boolean  | No       | true    | Include tags in results                                   |
| `search_profiles`     | boolean  | No       | true    | Include user profiles in results                          |
| `recurrence`          | string   | No       | -       | Filter by recurrence type                                 |
| `exclude_tag_id`      | number[] | No       | -       | Exclude specific tag IDs (supports ?id=1&id=2 or ?id=1,2) |
| `optimized`           | boolean  | No       | -       | Return optimized results                                  |

**Request Examples**:

```bash
# Simple search
GET /api/search?q=bitcoin

# Search with filters
GET /api/search?q=election&events_status=active&limit_per_type=10

# Search with tag filters
GET /api/search?q=crypto&events_tag=bitcoin&events_tag=ethereum

# Search with pagination
GET /api/search?q=sports&page=2&limit_per_type=20

# Search excluding tags
GET /api/search?q=politics&exclude_tag_id=1,2,3

# Disable caching
GET /api/search?q=markets&cache=false
```

**Response Format**:

```json
{
  "events": [
    {
      "id": "12345",
      "ticker": "TICKER",
      "title": "Event Title",
      "description": "Event description",
      "markets": [...],
      "volume": 1000000,
      "liquidity": 500000,
      ...
    }
  ],
  "tags": [
    {
      "id": "1",
      "label": "Bitcoin",
      "slug": "bitcoin",
      "eventCount": 42
    }
  ],
  "profiles": [
    {
      "id": "0x1234...",
      "name": "User Name",
      "pseudonym": "username",
      "bio": "User bio",
      "profileImage": "https://...",
      "profileImageOptimized": "https://...",
      "displayUsernamePublic": true
    }
  ],
  "pagination": {
    "hasMore": true,
    "totalResults": 150
  }
}
```

**Error Responses**:

```json
// 400 - Missing or invalid parameters
{
  "error": {
    "message": "q parameter is required and cannot be empty",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "timestamp": "2025-11-23T12:00:00.000Z"
  }
}

// 500 - Server error
{
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR",
    "statusCode": 500,
    "timestamp": "2025-11-23T12:00:00.000Z"
  }
}
```

**Caching**:

- Default TTL: 60 seconds
- Can be disabled with `cache=false`
- Cache stampede protection for concurrent requests
- Cache key includes all query parameters

**Performance**:

- Cached requests: <50ms response time
- Uncached requests: <5s response time (depends on upstream API)
- Supports concurrent requests efficiently

**Notes**:

- All response fields except pagination properties are nullable
- Array parameters support both formats: `?tag=a&tag=b` and `?tag=a,b`
- Empty arrays are returned when entity types are disabled (e.g., `search_tags=false`)
- Results are limited by Polymarket's upstream API constraints

---

**Last Updated**: 2025-11-23
