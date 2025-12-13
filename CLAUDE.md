# Claude Code Instructions for Glitch Markets

This is the main documentation hub for Claude Code. All detailed documentation lives in the `.claude/` directory.

---

## Quick Reference

### Core Documentation

- **[Technical Guide](.claude/technical.md)** - Tech stack, architecture, development workflows, testing, deployment
- **[Development Modes](.claude/modes.md)** - Spec Mode vs Vibe Mode workflows
- **[Code Style Guide](.claude/code-style.md)** - TypeScript, Svelte, CSS conventions and best practices
- **[Design System](.claude/brand-colors.md)** - Color palette, CSS variables, component styling guidelines

### API References

- **[Polymarket API](.claude/polymarket-api-reference.md)** - Complete Polymarket API endpoint documentation
- **[Porto SDK](.claude/porto-api-reference.md)** - Porto SDK integration guides
- **[Dynamic Docs](.claude/dynamic.txt)** - Comprehensive Dynamic.xyz documentation with all API endpoints and guides

---

## Project Overview

Glitch Markets is a modern prediction market platform built with SvelteKit and TypeScript. The platform provides an alternative interface for Polymarket data with a focus on speed, usability, and advanced features.

---

## Getting Started

### For New Features

1. **Choose your mode**: Claude will ask if you want Spec Mode (structured planning) or Vibe Mode (rapid implementation)
2. **Follow the workflow**: See [modes.md](.claude/modes.md) for details on each mode
3. **Use the design system**: Always use CSS variables from [brand-colors.md](.claude/brand-colors.md)
4. **Follow code style**: Check [code-style.md](.claude/code-style.md) for conventions

### For Technical Questions

- **Architecture & Setup**: See [technical.md](.claude/technical.md)
- **API Integration**: See API reference docs in `.claude/`
- **Code Patterns**: See [code-style.md](.claude/code-style.md)

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
5. **Testing** - Write tests for utilities and component behavior
6. **Accessibility** - Use semantic HTML and ARIA labels
7. **Performance** - Lazy load routes and optimize images
8. **Security** - Sanitize input, use environment variables for secrets
9. **Comments** - Only add comments that explain _why_, not _what_. Never write comments that restate the code (e.g., `// Cache the result` before a cache assignment, `// Check cache first` before an if statement). Let clear code speak for itself.

---

## Documentation Structure

```
.claude/
├── technical.md              # Tech stack, architecture, workflows
├── modes.md                  # Spec Mode & Vibe Mode documentation
├── code-style.md             # Code style guide and best practices
├── brand-colors.md           # Design system and color palette
├── polymarket-api-reference.md  # Polymarket API docs
├── porto-api-reference.md    # Porto SDK docs
└── dynamic.txt               # Complete Dynamic.xyz documentation
```

---

## Need Help?

- **Feature Planning**: See [modes.md](.claude/modes.md)
- **Code Style Questions**: See [code-style.md](.claude/code-style.md)
- **Design/Styling**: See [brand-colors.md](.claude/brand-colors.md)
- **Architecture**: See [technical.md](.claude/technical.md)
- **API Integration**: See API reference docs in `.claude/`
