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

- **Get Sports Metadata**: https://docs.polymarket.com/api-reference/sports/get-sports-metadata-information

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
- **Get Comment by ID**: https://docs.polymarket.com/api-reference/comments/get-comment-by-id
- **Get Comments by Event ID**: https://docs.polymarket.com/api-reference/comments/get-comments-by-event-id
- **Get Comments by Market ID**: https://docs.polymarket.com/api-reference/comments/get-comments-by-market-id
- **Get Replies to a Comment**: https://docs.polymarket.com/api-reference/comments/get-comment-replies

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
- `GET /api/markets/slug/:slug` - Get by slug

### Events API

- `GET /api/events` - List events
- `GET /api/events/:id` - Get by ID
- `GET /api/events/slug/:slug` - Get by slug

### Series API

- `GET /api/series` - List series
- `GET /api/series/:id` - Get by ID
- `GET /api/series/slug/:slug` - Get by slug

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
- `GET /api/comments/user/:address` - Get by user

---

**Last Updated**: 2025-11-23
