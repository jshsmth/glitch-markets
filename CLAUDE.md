# Claude Code Instructions for Glitch Markets

This is the main documentation hub for Claude Code. All detailed documentation lives in the `.claude/` directory.

---

## Quick Reference

### Core Documentation

- **[Technical Guide](.claude/docs/technical.md)** - Tech stack, architecture, development workflows, testing, deployment
- **[Development Modes](.claude/docs/modes.md)** - Spec Mode vs Vibe Mode workflows
- **[Code Style Guide](.claude/docs/code-style.md)** - TypeScript, Svelte, CSS conventions and best practices
- **[Design System](.claude/docs/brand-colors.md)** - Color palette, CSS variables, component styling guidelines

### API References

- **[Polymarket API](.claude/docs/polymarket-api-reference.md)** - Complete Polymarket API endpoint documentation
- **[TanStack Query](.claude/docs/tanstack-query-reference.md)** - TanStack Query (React Query) documentation for Svelte
- **[Vite PWA Plugin](.claude/docs/vite-pwa-reference.md)** - Vite PWA Plugin documentation and patterns

---

## Project Overview

Glitch Markets is a modern prediction market platform built with SvelteKit and TypeScript. The platform provides an alternative interface for Polymarket data with a focus on speed, usability, and advanced features.

---

## Getting Started

### For New Features

1. **Choose your mode**: Claude will ask if you want Spec Mode (structured planning) or Vibe Mode (rapid implementation)
2. **Follow the workflow**: See [modes.md](.claude/docs/modes.md) for details on each mode
3. **Use the design system**: Always use CSS variables from [brand-colors.md](.claude/docs/brand-colors.md)
4. **Follow code style**: Check [code-style.md](.claude/docs/code-style.md) for conventions

### For Technical Questions

- **Architecture & Setup**: See [technical.md](.claude/docs/technical.md)
- **API Integration**: See API reference docs in `.claude/docs/`
- **Code Patterns**: See [code-style.md](.claude/docs/code-style.md)

---

## Svelte MCP Server

You have access to the Svelte MCP server with comprehensive Svelte 5 and SvelteKit documentation:

### Available Tools

1. **list-sections** - Discover all available documentation sections (use this first)
2. **get-documentation** - Retrieve full documentation for specific sections
3. **svelte-autofixer** - Analyze Svelte code and get suggestions (use before sending code to user)
4. **playground-link** - Generate Svelte Playground links (ask user first)

### Usage Guidelines

- Always call `list-sections` first when working with Svelte
- Analyze the `use_cases` field to find relevant sections
- Fetch ALL relevant documentation sections at once
- Run `svelte-autofixer` on all Svelte code until no issues remain
- Only generate playground links after user confirmation

---

## Key Principles

1. **PWA-First, Desktop-Ready** - This is a Progressive Web App first that should scale gracefully into a simple, clean desktop app. Prioritize mobile web experience (touch-friendly interfaces, responsive layouts, offline capabilities, app-like interactions) while ensuring designs can scale up to larger screens with a clean, uncluttered desktop aesthetic. Think mobile-first responsive design that enhances naturally on desktop without becoming complex.
2. **Mode Selection** - Always ask user to choose Spec or Vibe mode for new features
3. **Design System** - Never use hard-coded colors, always use CSS variables
4. **Type Safety** - Use TypeScript for all code, avoid `any`
5. **Logging** - Always use the `Logger` utility instead of `console.log`. Import with `import { Logger } from '$lib/utils/logger'` and create a logger instance with `const log = Logger.forComponent('ComponentName')`. Use appropriate log levels: `log.debug()`, `log.info()`, `log.warn()`, `log.error()`.
6. **Testing** - Write tests for utilities and component behavior
7. **Accessibility** - Use semantic HTML and ARIA labels
8. **Performance** - Lazy load routes and optimize images
9. **Security** - Sanitize input, use environment variables for secrets
10. **Comments** - Only add comments that explain _why_, not _what_. Never write comments that restate the code (e.g., `// Cache the result` before a cache assignment, `// Check cache first` before an if statement). Let clear code speak for itself.

---

## Wallet Architecture

Glitch Markets uses a dual-wallet architecture for Polymarket integration:

### Server Wallet (EOA)

**Purpose:** Signs transactions and authenticates with Polymarket's CLOB API (L1). Controls and owns the proxy wallet.
**Usage:** Pass as `wallet` parameter in `ClobClient`, generate API credentials, sign relayer transactions. Never shown to users.

### Proxy Wallet (Smart Contract)

**Purpose:** Holds user's assets (USDC, positions) and acts as the "funder" address. This is the user-facing wallet shown on Polymarket.com.
**Usage:** Pass as `funder` parameter in `ClobClient`, display in UI, check balances, query user data (`?user=<proxyWalletAddress>`), withdraw funds.

### Usage Examples

```typescript
// ✅ CORRECT: L2 Client (Trading)
const client = new ClobClient(
  CLOB_API_URL,
  CHAIN_ID,
  serverWallet,           // Signer (server wallet for signing)
  credentials,            // API credentials
  SIGNATURE_TYPE,
  proxyWalletAddress      // Funder (proxy wallet holds funds)
);

// ✅ CORRECT: Fetching user positions
const res = await fetch(`/api/users/positions?user=${walletState.proxyWalletAddress}`);

// ✅ CORRECT: Checking balance
const balance = await getUSDCBalance(proxyWalletAddress);

// ❌ WRONG: Don't use server wallet for user-facing operations
const balance = await getUSDCBalance(serverWalletAddress); // Wrong!

// ❌ WRONG: Don't show server wallet to users
<span>{walletState.serverWalletAddress}</span> // Wrong!
```

## Documentation Structure

```
.claude/
├── docs/
│   ├── technical.md                 # Tech stack, architecture, workflows
│   ├── modes.md                     # Spec Mode & Vibe Mode documentation
│   ├── code-style.md                # Code style guide and best practices
│   ├── brand-colors.md              # Design system and color palette
│   ├── polymarket-api-reference.md  # Polymarket API docs
│   ├── tanstack-query-reference.md  # TanStack Query docs
│   ├── vite-pwa-reference.md        # Vite PWA Plugin docs
│   └── vitest.md                    # Testing documentation
├── agents/
│   └── spec-architect.md            # Spec Mode agent configuration
├── specs/                           # Feature specifications (temporary)
│   └── [feature-name].md            # Individual feature specs
└── settings.local.json              # Claude Code settings & permissions
```

---

## Need Help?

- **Feature Planning**: See [modes.md](.claude/docs/modes.md)
- **Code Style Questions**: See [code-style.md](.claude/docs/code-style.md)
- **Design/Styling**: See [brand-colors.md](.claude/docs/brand-colors.md)
- **Architecture**: See [technical.md](.claude/docs/technical.md)
- **Testing**: See [vitest.md](.claude/docs/vitest.md)
- **API Integration**: See API reference docs in `.claude/docs/`
