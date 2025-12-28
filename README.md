<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/lib/assets/logo-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="src/lib/assets/logo-dark.svg">
    <img src="src/lib/assets/logo-dark.svg" alt="Glitch Markets" height="60">
  </picture>

#

**Experience the infinite money glitch.**

_A production-grade Progressive Web App for prediction markets_

</div>

---

## 📊 About

**What This Demonstrates:**

Full-stack TypeScript development with modern tooling (SvelteKit, TanStack Query, Vitest). Blockchain integration using viem for Polygon transactions. Secure architecture with encrypted key storage in Supabase. Progressive Web App implementation with offline support. Cross-chain deposit handling. Optimistic UI patterns for responsive interactions. Production deployment on Vercel's edge network.

**The Goal:**

Show I can build complete, production-quality applications, from system architecture and blockchain integration to polished user interfaces and comprehensive testing. Every piece demonstrates professional engineering practices: type safety, security-first design, performance optimization, and maintainable code.

---

## ✨ Features

- **Instant Trading** - Buy and sell positions in seconds with real-time price updates and zero friction
- **Smart Portfolio** - Track all positions, view performance metrics, and analyze trade history in one place
- **Flexible Deposits** - Deposit from any blockchain, funds automatically convert to the right format
- **Works Everywhere** - Install like a native app, works offline, syncs seamlessly across all your devices
- **Beautiful Design** - Polished interface that adapts to your preferences with automatic light/dark mode
- **Mobile-Optimized** - Built for phones first, scales perfectly to tablets and desktops

---

## 🛠️ Tech Stack

```
Frontend:      SvelteKit 2.x (SSR/SSG) • TypeScript 5.x • TanStack Query
Blockchain:    viem • Polymarket CLOB API • Server-side wallets
Database:      Supabase (PostgreSQL) • Encrypted key storage
State:         Optimistic updates • TanStack Query cache
PWA:           Vite PWA Plugin (Workbox) • Service workers
Build:         Vite • Code splitting • Tree shaking
Testing:       Vitest • Testing Library
Deployment:    Vercel Edge Network
```

**What This Demonstrates:**

- Production TypeScript patterns with strict typing and type safety
- Blockchain integration with encrypted server-side wallet management
- Progressive Web App with offline-first architecture and service workers
- Real-time data handling with TanStack Query and optimistic updates
- Mobile-first responsive design with accessibility (WCAG 2.1)
- Performance optimization (<1s load times, code splitting, lazy loading)

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte 5 components with runes
│   ├── queries/        # TanStack Query hooks
│   ├── stores/         # Global state management
│   ├── utils/          # Utilities + Logger
│   └── types/          # TypeScript definitions
├── routes/
│   ├── (app)/         # Authenticated app routes
│   ├── (auth)/        # Authentication flows
│   └── api/           # Server-side API endpoints
└── app.html

.claude/                # AI-assisted dev docs
tests/                  # Unit + integration tests
```

---

## 🚀 Quick Start

```bash
# Install
npm install

# Configure
cp .env.example .env.local
# Add your Supabase credentials

# Run
npm run dev

# Test
npm test

# Build
npm run build
```

**Environment Variables:**

```bash
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📚 Documentation

- **[Technical Guide](.claude/docs/technical.md)** - Architecture, development workflows
- **[Code Style Guide](.claude/docs/code-style.md)** - TypeScript, Svelte, CSS conventions
- **[API Reference](.claude/docs/polymarket-api-reference.md)** - Polymarket integration

---

## 📄 License

MIT License - See [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- **Polymarket** - For public API access
- **Svelte Community** - For excellent documentation
- **Vercel** - For hosting and developer experience

---

## 📧 Contact

**Your Name** - [X: @JoshSmithBuilds](https://x.com/JoshSmithBuilds)

**Project Link:** [https://github.com/jshsmth/glitch-markets](https://github.com/jshsmth/glitch-markets)

**Live Demo:** [https://glitch-markets.vercel.app](https://glitch-markets.vercel.app)

---

<div align="center">

**Built as a demonstration of production-grade full-stack engineering**

_Note: Glitch Markets is an independent project and is not officially affiliated with Polymarket._

</div>
