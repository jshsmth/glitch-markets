# Tech Stack

## Framework & Build

- **SvelteKit** (v2.48+) with Svelte 5 (v5.43+)
- **Vite** (v7.2+) for build tooling
- **TypeScript** (v5.9+) with strict mode enabled
- **adapter-auto** for deployment

## Database

- **PostgreSQL** via Docker Compose
- **Drizzle ORM** (v0.44+) for database operations
- **Drizzle Kit** for migrations and schema management

## Testing

- **Vitest** (v4.0+) with jsdom environment
- **@testing-library/svelte** for component testing
- **fast-check** for property-based testing
- Test setup file: `src/lib/tests/setup.ts`

## Code Quality

- **ESLint** with TypeScript and Svelte plugins
- **Prettier** with Svelte plugin for formatting
- **svelte-check** for type checking

## Additional Tools

- **mdsvex** for Markdown in Svelte components
- **postgres** driver for database connections

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm test                 # Run tests in watch mode
npm test:run             # Run tests once (CI)
npm test:ui              # Run tests with UI

# Code Quality
npm run check            # Type check
npm run lint             # Lint code
npm run format           # Format code

# Database
npm run db:start         # Start PostgreSQL (Docker)
npm run db:push          # Push schema changes
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio
```

## Environment Variables

Required: `DATABASE_URL`

Optional Polymarket API config:

- `POLYMARKET_API_URL` (default: https://gamma-api.polymarket.com)
- `POLYMARKET_API_TIMEOUT` (default: 10000ms)
- `POLYMARKET_CACHE_TTL` (default: 60s)
- `POLYMARKET_CACHE_ENABLED` (default: true)
