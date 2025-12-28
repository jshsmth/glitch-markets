<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/lib/assets/logo-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="src/lib/assets/logo-dark.svg">
    <img src="src/lib/assets/logo-dark.svg" alt="Glitch Markets" height="60">
  </picture>

#

**Experience the infinite money glitch.**

*A production-grade Progressive Web App for prediction markets*

</div>

---

## 📊 About

A modern prediction market platform built as a production-quality side project. Demonstrates full-stack TypeScript development, blockchain integration, real-time data handling, and progressive web app architecture while solving real UX problems in the prediction market space.

**Key Focus:** Making crypto-based prediction markets as simple as using a social media app—eliminating wallet complexity through server-side management, optimizing for mobile performance, and delivering native-app experiences through PWA technology.

---

## ✨ Features

- **One-Click Trading** - Instant buy/sell with optimistic UI and real-time price feeds
- **Cross-Chain Bridge** - Deposit from any chain with automatic USDC swapping
- **Smart Portfolio** - Position tracking, performance analytics, trade history
- **PWA Experience** - Offline support, home screen install, background sync
- **Real-Time Updates** - WebSocket integration for live market data
- **Dark Mode** - Polished themes with CSS variable design system

---

## 🛠️ Tech Stack

```
Frontend:      SvelteKit 2.x (SSR/SSG) • TypeScript 5.x • TanStack Query
Blockchain:    viem • Polymarket CLOB API • Server-side wallets
Database:      Supabase (PostgreSQL) • Encrypted key storage
Real-Time:     WebSocket • Optimistic updates
PWA:           Vite PWA Plugin (Workbox) • Service workers
Build:         Vite • Code splitting • Tree shaking
Testing:       Vitest • Testing Library
Deployment:    Vercel Edge Network
```

**What This Demonstrates:**
- Production TypeScript patterns with strict typing and runtime validation (Zod)
- Blockchain integration with encrypted server-side wallet management
- Progressive Web App with offline-first architecture and service workers
- Real-time data handling with WebSocket and TanStack Query
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

**Your Name** - [X: @JoshSmithBuilds](https://x.com/JoshSmithBuilds) - your.email@example.com

**Project Link:** [https://github.com/jshsmth/glitch-markets](https://github.com/jshsmth/glitch-markets)

**Live Demo:** [https://glitch-markets.vercel.app](https://glitch-markets.vercel.app)

---

<div align="center">

**Built as a demonstration of production-grade full-stack engineering**

*Note: Glitch Markets is an independent project and is not officially affiliated with Polymarket.*

</div>
