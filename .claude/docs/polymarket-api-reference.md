# Polymarket API Reference - Documentation URLs

Quick reference for looking up official Polymarket API documentation.

---

## Base URLs

- **Gamma API**: `https://gamma-api.polymarket.com`
- **Data API**: `https://data-api.polymarket.com`
- **CLOB API**: `https://clob.polymarket.com`

---

## General Resources

### Developer Quickstart

- **Introduction**: https://docs.polymarket.com/quickstart/introduction/main
- **First Order**: https://docs.polymarket.com/quickstart/orders/first-order
- **Definitions**: https://docs.polymarket.com/quickstart/introduction/definitions
- **Rate Limits**: https://docs.polymarket.com/quickstart/introduction/rate-limits
- **Endpoints**: https://docs.polymarket.com/quickstart/introduction/endpoints

### Polymarket Builders Program

- **Builder Introduction**: https://docs.polymarket.com/developers/builders/builder-intro
- **Builder Tiers**: https://docs.polymarket.com/developers/builders/builder-tiers
- **Builder Profile**: https://docs.polymarket.com/developers/builders/builder-profile
- **Order Attribution**: https://docs.polymarket.com/developers/builders/order-attribution
- **Relayer Client**: https://docs.polymarket.com/developers/builders/relayer-client
- **Examples**: https://docs.polymarket.com/developers/builders/examples

### Central Limit Order Book

- **CLOB Introduction**: https://docs.polymarket.com/developers/CLOB/introduction
- **Status**: https://docs.polymarket.com/developers/CLOB/status
- **Clients**: https://docs.polymarket.com/developers/CLOB/clients
- **Authentication**: https://docs.polymarket.com/developers/CLOB/authentication

#### Clients

- **Methods Overview**: https://docs.polymarket.com/developers/CLOB/clients/methods-overview
- **Public Methods**: https://docs.polymarket.com/developers/CLOB/clients/methods-public
- **L1 Methods**: https://docs.polymarket.com/developers/CLOB/clients/methods-l1
- **L2 Methods**: https://docs.polymarket.com/developers/CLOB/clients/methods-l2
- **Builder Methods**: https://docs.polymarket.com/developers/CLOB/clients/methods-builder

#### Order Management

- **Orders Overview**: https://docs.polymarket.com/developers/CLOB/orders/orders
- **Create Order**: https://docs.polymarket.com/developers/CLOB/orders/create-order
- **Create Order Batch**: https://docs.polymarket.com/developers/CLOB/orders/create-order-batch
- **Get Order**: https://docs.polymarket.com/developers/CLOB/orders/get-order
- **Get Active Orders**: https://docs.polymarket.com/developers/CLOB/orders/get-active-order
- **Check Scoring**: https://docs.polymarket.com/developers/CLOB/orders/check-scoring
- **Cancel Orders**: https://docs.polymarket.com/developers/CLOB/orders/cancel-orders
- **On-chain Order Info**: https://docs.polymarket.com/developers/CLOB/orders/onchain-order-info

#### Trades

- **Trades Overview**: https://docs.polymarket.com/developers/CLOB/trades/trades-overview
- **Get Trades**: https://docs.polymarket.com/developers/CLOB/trades/trades

### WebSocket

- **WSS Overview**: https://docs.polymarket.com/developers/CLOB/websocket/wss-overview
- **WSS Quickstart**: https://docs.polymarket.com/quickstart/websocket/WSS-Quickstart
- **WSS Authentication**: https://docs.polymarket.com/developers/CLOB/websocket/wss-auth
- **User Channel**: https://docs.polymarket.com/developers/CLOB/websocket/user-channel
- **Market Channel**: https://docs.polymarket.com/developers/CLOB/websocket/market-channel

**WebSocket Endpoint:**

```
wss://ws-subscriptions-clob.polymarket.com/ws/
```

### Real Time Data Stream (RTDS)

- **RTDS Overview**: https://docs.polymarket.com/developers/RTDS/RTDS-overview
- **Crypto Prices**: https://docs.polymarket.com/developers/RTDS/RTDS-crypto-prices
- **Comments**: https://docs.polymarket.com/developers/RTDS/RTDS-comments

**RTDS Endpoint:**

```
wss://ws-live-data.polymarket.com
```

### Gamma Markets API

- **Overview**: https://docs.polymarket.com/developers/gamma-markets-api/overview
- **Gamma Structure**: https://docs.polymarket.com/developers/gamma-markets-api/gamma-structure
- **Fetch Markets Guide**: https://docs.polymarket.com/developers/gamma-markets-api/fetch-markets-guide

### Bridge & Swap

- **Overview**: https://docs.polymarket.com/developers/misc-endpoints/bridge-overview
- **Create Deposit**: https://docs.polymarket.com/developers/misc-endpoints/bridge-deposit
- **Get Supported Assets**: https://docs.polymarket.com/developers/misc-endpoints/bridge-supported-assets

### Resolution

- **UMA**: https://docs.polymarket.com/developers/resolution/UMA

### Rewards

- **Overview**: https://docs.polymarket.com/developers/rewards/overview

### Conditional Token Framework (CTF)

- **Overview**: https://docs.polymarket.com/developers/CTF/overview
- **Split**: https://docs.polymarket.com/developers/CTF/split
- **Merge**: https://docs.polymarket.com/developers/CTF/merge
- **Redeem**: https://docs.polymarket.com/developers/CTF/redeem
- **Deployment Resources**: https://docs.polymarket.com/developers/CTF/deployment-resources

### Proxy Wallet

- **Proxy Wallet**: https://docs.polymarket.com/developers/proxy-wallet

### Neg Risk

- **Overview**: https://docs.polymarket.com/developers/neg-risk/overview

---

## Gamma API Endpoints

### Health

- **Health Check (Gamma)**: https://docs.polymarket.com/api-reference/health/health-check

### Sports

- **List Teams**: https://docs.polymarket.com/api-reference/sports/list-teams
- **Get Sports Metadata Information**: https://docs.polymarket.com/api-reference/sports/get-sports-metadata-information

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

### Bridge API

- `POST /api/bridge/deposit` - Create deposit addresses for cross-chain transfers
- `GET /api/bridge/supported-assets` - Get supported chains and tokens

### Builders API

- `GET /api/builders/leaderboard` - Get aggregated builder rankings
- `GET /api/builders/volume` - Get daily builder volume time-series

### Health API

- `GET /api/health` - Check health status of upstream Polymarket APIs

**Key Resources:**

- **First Order Guide**: https://docs.polymarket.com/quickstart/orders/first-order
- **CLOB Introduction**: https://docs.polymarket.com/developers/CLOB/introduction
- **Relayer Client**: https://docs.polymarket.com/developers/builders/relayer-client
