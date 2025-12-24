# TanStack Query API Reference - Documentation URLs

Quick reference for looking up official TanStack Query (formerly React Query) documentation for Svelte.

---

## Base URL

- **TanStack Query Docs**: `https://tanstack.com/query/latest`

---

## Framework Guides (Svelte)

### Getting Started

- **Overview**: https://tanstack.com/query/latest/docs/framework/svelte/overview
- **Installation**: https://tanstack.com/query/latest/docs/framework/svelte/installation
- **Devtools**: https://tanstack.com/query/latest/docs/framework/svelte/devtools
- **SSR (Server-Side Rendering)**: https://tanstack.com/query/latest/docs/framework/svelte/ssr
- **Migration Guide (v5 to v6)**: https://tanstack.com/query/latest/docs/framework/svelte/migrate-from-v5-to-v6

---

## Core API Reference

### Clients & Caches

- **QueryClient**: https://tanstack.com/query/latest/docs/reference/QueryClient
- **QueryCache**: https://tanstack.com/query/latest/docs/reference/QueryCache
- **MutationCache**: https://tanstack.com/query/latest/docs/reference/MutationCache

### Observers

- **QueryObserver**: https://tanstack.com/query/latest/docs/reference/QueryObserver
- **InfiniteQueryObserver**: https://tanstack.com/query/latest/docs/reference/InfiniteQueryObserver
- **QueriesObserver**: https://tanstack.com/query/latest/docs/reference/QueriesObserver

### Utilities

- **streamedQuery**: https://tanstack.com/query/latest/docs/reference/streamedQuery
- **focusManager**: https://tanstack.com/query/latest/docs/reference/focusManager
- **onlineManager**: https://tanstack.com/query/latest/docs/reference/onlineManager
- **notifyManager**: https://tanstack.com/query/latest/docs/reference/notifyManager
- **timeoutManager**: https://tanstack.com/query/latest/docs/reference/timeoutManager

---

## Svelte-Specific API Reference

### Overview

- **Svelte API Index**: https://tanstack.com/query/latest/docs/framework/svelte/reference/index

### Query Functions

- **createQuery**: https://tanstack.com/query/latest/docs/framework/svelte/reference/functions/createQuery
- **createQueries**: https://tanstack.com/query/latest/docs/framework/svelte/reference/functions/createQueries
- **createInfiniteQuery**: https://tanstack.com/query/latest/docs/framework/svelte/reference/functions/createInfiniteQuery

### Mutation Functions

- **createMutation**: https://tanstack.com/query/latest/docs/framework/svelte/reference/functions/createMutation

### Status Hooks

- **useIsFetching**: https://tanstack.com/query/latest/docs/framework/svelte/reference/functions/useIsFetching
- **useIsMutating**: https://tanstack.com/query/latest/docs/framework/svelte/reference/functions/useIsMutating
- **useMutationState**: https://tanstack.com/query/latest/docs/framework/svelte/reference/functions/useMutationState

### Options Helpers

- **queryOptions**: https://tanstack.com/query/latest/docs/framework/svelte/reference/functions/queryOptions
- **infiniteQueryOptions**: https://tanstack.com/query/latest/docs/framework/svelte/reference/functions/infiniteQueryOptions

---

## Key Concepts

TanStack Query is a powerful data synchronization library that provides:

- **Automatic caching** - Smart background updates and stale-while-revalidate
- **Automatic refetching** - On window focus, network reconnect, and intervals
- **Request deduplication** - Multiple components requesting same data get single request
- **Parallel queries** - Efficiently manage multiple async operations
- **Infinite queries** - Built-in support for pagination and infinite scrolling
- **SSR support** - Full server-side rendering capabilities
- **Devtools** - Visual debugging of queries, mutations, and cache state

---

## Common Patterns

### Basic Query

```typescript
const result = createQuery({
  queryKey: ['markets'],
  queryFn: fetchMarkets
});
```

### Query with Parameters

```typescript
const result = createQuery({
  queryKey: ['market', marketId],
  queryFn: () => fetchMarket(marketId)
});
```

### Infinite Query

```typescript
const result = createInfiniteQuery({
  queryKey: ['events'],
  queryFn: ({ pageParam = 0 }) => fetchEvents(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor
});
```

### Mutation

```typescript
const mutation = createMutation({
  mutationFn: createMarket,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['markets'] });
  }
});
```

---

## Best Practices

1. **Query Keys** - Use array-based query keys with hierarchical structure
2. **Stale Time** - Configure appropriate stale time for your data freshness needs
3. **Cache Time** - Set cache time to control how long unused data stays in memory
4. **Enabled Queries** - Use `enabled` option to conditionally fetch data
5. **Prefetching** - Prefetch data on hover or predicted navigation for better UX
6. **Error Handling** - Handle errors with `onError` callbacks and error boundaries
7. **Optimistic Updates** - Use mutation callbacks for instant UI feedback

---

**Key Resources:**

- **Main Documentation**: https://tanstack.com/query/latest
- **Svelte Guide**: https://tanstack.com/query/latest/docs/framework/svelte/overview
- **GitHub Repository**: https://github.com/TanStack/query
