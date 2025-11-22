# Product Overview

glitch-markets is a SvelteKit application that displays prediction market data from Polymarket. It integrates with the Polymarket Gamma API to fetch and display market information.

## Core Features

- Market search with case-insensitive text matching
- Advanced filtering by category, status (active/closed)
- Sorting by volume, liquidity, or creation date
- Built-in caching layer for performance
- Request/response logging with timestamps
- Input and response validation
- Property-based testing with fast-check

## API Endpoints

- `GET /api/markets` - List markets with filtering and pagination
- `GET /api/markets/[id]` - Get market by ID
- `GET /api/markets/slug/[slug]` - Get market by slug
- `GET /api/markets/search` - Search with advanced options

## Architecture

Layered architecture: SvelteKit Routes → Market Service → API Client → Polymarket Gamma API

The service layer handles caching, filtering, and business logic. Cache stampede protection prevents duplicate concurrent requests.
