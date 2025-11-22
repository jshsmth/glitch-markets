# Project Structure

## Directory Organization

```
src/
├── lib/
│   ├── server/              # Server-side code only
│   │   ├── api/             # External API clients (Polymarket)
│   │   ├── cache/           # Cache manager (LRU with TTL)
│   │   ├── config/          # Configuration loading
│   │   ├── db/              # Database schema and connection
│   │   ├── errors/          # Custom error types
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Server utilities (logger)
│   │   └── validation/      # Input/response validators
│   ├── components/          # Svelte components
│   ├── tests/               # Integration and unit tests
│   └── utils.svelte.ts      # Client-side utilities
├── routes/                  # SvelteKit routes
│   └── api/                 # API endpoints (+server.ts files)
└── app.html                 # HTML template

drizzle/                     # Database migrations
static/                      # Static assets
```

## Key Conventions

### Server vs Client Code

- Code in `src/lib/server/` is server-only and never sent to client
- Use `.server.ts` suffix for server-only route files
- Client utilities use `.svelte.ts` extension

### File Naming

- Components: PascalCase (e.g., `Counter.svelte`)
- Utilities/services: kebab-case (e.g., `market-service.ts`)
- Tests: Same name as file with `.test.ts` suffix
- Routes: SvelteKit conventions (`+page.svelte`, `+server.ts`)

### Import Paths

- Use `$lib` alias for `src/lib` imports
- Use `.js` extensions in imports (TypeScript requirement)
- Example: `import { MarketService } from '$lib/server/services/market-service.js'`

### Testing

- Unit tests colocated with source files
- Integration tests in `src/lib/tests/`
- Use property-based testing (fast-check) for data validation
- Test setup in `src/lib/tests/setup.ts`

### Architecture Layers

1. **Routes** (`src/routes/api/`) - HTTP endpoints, request/response handling
2. **Services** (`src/lib/server/services/`) - Business logic, caching, orchestration
3. **API Clients** (`src/lib/server/api/`) - External API communication
4. **Database** (`src/lib/server/db/`) - Data persistence layer

Each layer should only depend on layers below it. Services coordinate between API clients and routes.

### Error Handling

- Custom error types in `src/lib/server/errors/`
- Consistent error formatting across API endpoints
- Logging with structured context via Logger utility

### Caching Strategy

- Cache manager in `src/lib/server/cache/`
- Cache stampede protection via pending request tracking
- TTL-based expiration with LRU eviction
- Cache keys use JSON-stringified parameters
