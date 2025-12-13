# Glitch Markets - Technical Documentation

This document contains comprehensive technical documentation for developers working on Glitch Markets.

## Table of Contents

- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Roadmap](#roadmap)

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (or Docker)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/glitch-markets.git
cd glitch-markets

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the database (Docker)
npm run db:start

# Run migrations
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the application.

---

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) - Fast, modern web framework
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Testing**: [Vitest](https://vitest.dev/) + [fast-check](https://fast-check.dev/) for property-based testing
- **Data Source**: [Polymarket Gamma API](https://docs.polymarket.com/)
- **Future Auth**: [WebAuthn/Passkeys](https://webauthn.io/)

---

## Project Structure

```
glitch-markets/
├── .claude/                  # Claude Code configuration & docs
│   ├── CLAUDE.md            # This file
│   └── polymarket-api-reference.md
├── src/
│   ├── lib/
│   │   ├── server/           # Server-side code
│   │   │   ├── api/          # Polymarket API client
│   │   │   ├── cache/        # Caching layer
│   │   │   ├── config/       # Configuration management
│   │   │   ├── db/           # Database schema & queries
│   │   │   ├── errors/       # Custom error types
│   │   │   ├── services/     # Business logic layer
│   │   │   ├── utils/        # Utilities (logger, etc.)
│   │   │   └── validation/   # Input/output validation
│   │   └── components/       # Svelte components (coming soon)
│   ├── routes/
│   │   ├── api/              # API endpoints
│   │   │   ├── markets/      # Market endpoints
│   │   │   ├── events/       # Event endpoints
│   │   │   ├── series/       # Series endpoints
│   │   │   ├── tags/         # Tag endpoints
│   │   │   ├── comments/     # Comment endpoints
│   │   │   ├── users/        # User data endpoints
│   │   │   └── search/       # Search endpoint
│   │   └── (app)/            # Application pages (coming soon)
│   └── hooks.server.ts       # Server hooks (rate limiting)
├── docs/                     # Documentation
│   └── requirements/         # Feature requirements
├── tests/                    # Test files
├── SECURITY_AUDIT_REPORT.md  # Security audit findings
├── package.json
└── README.md
```

---

## Architecture

```
┌─────────────────────────────────┐
│     SvelteKit Frontend          │
│  (Coming Soon - Passkey Auth)   │
└───────────────┬─────────────────┘
                │
                │ HTTP/WebSocket
                │
┌───────────────▼─────────────────┐
│      API Layer (SvelteKit)      │
│  Rate Limiting • Validation     │
└───────────────┬─────────────────┘
                │
        ┌───────┴───────┐
        │               │
┌───────▼──────┐ ┌─────▼──────┐
│   Services   │ │   Cache    │
│   Layer      │ │   Manager  │
└───────┬──────┘ └─────┬──────┘
        │               │
        └───────┬───────┘
                │
┌───────────────▼─────────────────┐
│    Polymarket Client            │
│  HTTP Client • Error Handling   │
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│    Polymarket Gamma API         │
│    (External Data Source)       │
└─────────────────────────────────┘
```

### Key Components

- **Server Routes**: SvelteKit endpoints that handle HTTP requests
- **Services**: Business logic layer with caching and filtering
  - `MarketService` - Market data operations
  - `EventService` - Event data operations
  - `SeriesService` - Series data operations
  - `TagService` - Tag data operations
  - `UserDataService` - User-related data
  - `CommentService` - Comment operations
  - `SearchService` - Search functionality
- **API Client**: HTTP client for communicating with Polymarket Gamma API
- **Cache Manager**: In-memory LRU cache with TTL support
- **Validators**: Input and response validation
- **Error Handlers**: Consistent error formatting and logging

---

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run check            # Type checking
npm run lint             # Run ESLint
npm run format           # Format with Prettier

# Testing
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:run         # Run tests once (CI mode)

# Database
npm run db:start         # Start PostgreSQL (Docker)
npm run db:push          # Push schema changes
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio
npm run db:drop          # Drop migrations
npm run db:check         # Check migrations
npm run db:up            # Apply migrations
```

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm test`
4. Run type checking: `npm run check`
5. Format code: `npm run format`
6. Commit with descriptive message
7. Push and create PR

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test src/lib/server/services/market-service.test.ts

# Run with coverage
npm test -- --coverage

# Run with UI
npm run test:ui
```

### Test Coverage

- **Unit Tests**: Individual functions and components
- **Integration Tests**: End-to-end API flows
- **Property-Based Tests**: Validation logic with randomized inputs
- **Error Handling**: Comprehensive error scenario testing

### Writing Tests

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

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database (required)
DATABASE_URL="postgres://username:password@localhost:5432/glitch_markets"

# Polymarket API (optional - uses defaults if not specified)
POLYMARKET_API_URL="https://gamma-api.polymarket.com"
POLYMARKET_API_TIMEOUT="10000"
POLYMARKET_CACHE_TTL="60"
POLYMARKET_CACHE_ENABLED="true"
```

| Variable                   | Type    | Default                            | Description                    |
| -------------------------- | ------- | ---------------------------------- | ------------------------------ |
| `DATABASE_URL`             | string  | _required_                         | PostgreSQL connection string   |
| `POLYMARKET_API_URL`       | string  | `https://gamma-api.polymarket.com` | Polymarket API base URL        |
| `POLYMARKET_API_TIMEOUT`   | number  | `10000`                            | Request timeout (milliseconds) |
| `POLYMARKET_CACHE_TTL`     | number  | `60`                               | Cache TTL (seconds)            |
| `POLYMARKET_CACHE_ENABLED` | boolean | `true`                             | Enable/disable caching         |

### Caching Strategy

Glitch Markets uses a multi-layer caching strategy:

1. **In-memory LRU cache** (60s TTL) for API responses
2. **CDN caching** with public cache headers
3. **Deduplication** for concurrent requests to the same resource

Cache can be disabled for development by setting `POLYMARKET_CACHE_ENABLED="false"`.

### Rate Limiting

Rate limits are configured per route in `src/hooks.server.ts`:

- **Market/Event endpoints**: 100 requests/minute
- **Other endpoints**: 60 requests/minute

Rate limiting uses in-memory storage suitable for single-instance deployments. For production multi-instance deployments, consider implementing Redis-backed rate limiting.

---

## Deployment

### Production Considerations

1. **Environment Variables**: Set production values for all config
2. **Database**: Use managed PostgreSQL (e.g., Supabase, Neon, Railway)
3. **Rate Limiting**: Consider Redis for multi-instance deployments
4. **Security Headers**: Uncomment HSTS header in `src/hooks.server.ts`
5. **Monitoring**: Set up error tracking (Sentry, etc.)
6. **CDN**: Deploy behind CloudFlare or similar for global performance

### Deployment Platforms

Glitch Markets works with any SvelteKit-compatible platform:

- **Vercel** (recommended)
- **Netlify**
- **CloudFlare Pages**
- **Railway**
- **Your own VPS**

See [SvelteKit deployment docs](https://kit.svelte.dev/docs/adapters) for platform-specific instructions.

### Build for Production

```bash
# Build the application
npm run build

# Preview the production build locally
npm run preview
```

---

## API Documentation

See [polymarket-api-reference.md](./polymarket-api-reference.md) for complete API documentation.

### Quick Reference

| Endpoint                       | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| `GET /api/markets`             | List all markets with filtering                    |
| `GET /api/markets/[id]`        | Get specific market by ID                          |
| `GET /api/markets/[id]/tags`   | Get tags for a specific market                     |
| `GET /api/markets/slug/[slug]` | Get market by slug                                 |
| `GET /api/events`              | List all events                                    |
| `GET /api/events/[id]`         | Get specific event                                 |
| `GET /api/events/[id]/tags`    | Get tags for a specific event                      |
| `GET /api/series`              | List market series                                 |
| `GET /api/tags`                | List all category tags                             |
| `GET /api/search`              | Global search across markets, events, and profiles |
| `GET /api/comments`            | Get market comments                                |
| `GET /api/users/positions`     | Get user positions                                 |
| `GET /api/users/trades`        | Get user trade history                             |
| `GET /api/users/activity`      | Get user activity                                  |

### Rate Limiting

- **Default**: 60 requests/minute per IP
- **Markets/Events endpoints**: 100 requests/minute per IP

### Example Usage

```bash
# Fetch active crypto markets
curl "http://localhost:5173/api/markets?active=true&category=crypto&limit=10"

# Search for bitcoin-related markets
curl "http://localhost:5173/api/search?q=bitcoin&limit_per_type=5"

# Get user positions
curl "http://localhost:5173/api/users/positions?user=0x1234..."
```

---

## Security

Glitch Markets takes security seriously. See [SECURITY_AUDIT_REPORT.md](../SECURITY_AUDIT_REPORT.md) for the full security audit.

### Security Features

- ✅ **Input Validation**: All user inputs validated and sanitized
- ✅ **Rate Limiting**: Prevents abuse with IP-based throttling
- ✅ **Error Handling**: Sanitized error messages, no info leakage
- ✅ **Type Safety**: TypeScript throughout the stack
- ✅ **Security Headers**: Proper HTTP security headers configured
- ✅ **Dependency Scanning**: Regular security audits
- 🚧 **Passkey Auth**: Passwordless authentication (coming soon)

### Before Making Repository Public

1. **Remove `.env` from git tracking**:

   ```bash
   git rm --cached .env
   git commit -m "Remove .env from version control"
   ```

2. **Check git history for secrets**:

   ```bash
   git log --all --full-history -- .env
   ```

3. **Add security headers** to `src/hooks.server.ts` (see security audit report)

4. **Update dependencies**:
   ```bash
   npm audit
   npm update
   ```

---

## Roadmap

### Q1 2025 - Authentication & User Features 🚧

- [ ] Passkey authentication system
- [ ] User registration and login
- [ ] User profile pages
- [ ] Portfolio dashboard
- [ ] Market watchlists

### Q2 2025 - Trading & Interactions

- [ ] Market trading interface
- [ ] Position management
- [ ] Comment and discussion features
- [ ] Real-time price updates
- [ ] Mobile-responsive UI

### Q3 2025 - Advanced Features

- [ ] Chart visualizations
- [ ] Advanced analytics
- [ ] Market creation tools
- [ ] Social features
- [ ] Mobile apps (iOS/Android)

### Q4 2025 - Scale & Polish

- [ ] Performance optimizations
- [ ] Multi-language support
- [ ] Advanced search filters
- [ ] API webhooks
- [ ] Enterprise features

---

## Contributing Guidelines

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write tests for new features

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:

```
feat(auth): add passkey authentication

Implement WebAuthn-based passkey authentication for passwordless login.

Closes #123
```

### Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md (if applicable)
5. Request review from maintainers

---

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Start the database
npm run db:start

# Verify DATABASE_URL in .env
# Check Docker is running

# Run migrations
npm run db:push
```

#### API Connection Errors

- Verify `POLYMARKET_API_URL` is correct
- Check internet connection
- Try increasing `POLYMARKET_API_TIMEOUT`

#### Cache Issues

- Verify `POLYMARKET_CACHE_ENABLED="true"`
- Restart development server to clear cache
- Check logs for cache hit/miss information

#### TypeScript Errors

```bash
# Run type checking
npm run check

# Regenerate SvelteKit types
npm run prepare
```

---

## Additional Resources

- [Polymarket API Documentation](https://docs.polymarket.com/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [WebAuthn Guide](https://webauthn.guide/)
- [Security Audit Report](../SECURITY_AUDIT_REPORT.md)
