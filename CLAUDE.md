# Claude Code Instructions for Glitch Markets

This is the main documentation hub for Claude Code. All detailed documentation lives in the `.claude/` directory.

---

## Quick Reference

### Core Documentation

- **[Technical Guide](.claude/TECHNICAL.md)** - Tech stack, architecture, development workflows, testing, deployment
- **[Development Modes](.claude/MODES.md)** - Spec Mode vs Vibe Mode workflows
- **[Code Style Guide](.claude/CODE_STYLE.md)** - TypeScript, Svelte, CSS conventions and best practices
- **[Design System](.claude/BRAND_COLORS.md)** - Color palette, CSS variables, component styling guidelines

### API References

- **[Polymarket API](.claude/polymarket-api-reference.md)** - Complete Polymarket API endpoint documentation
- **[Porto SDK](.claude/porto-api-reference.md)** - Porto SDK integration guides

---

## Project Overview

Glitch Markets is a modern prediction market platform built with SvelteKit and TypeScript. The platform provides an alternative interface for Polymarket data with a focus on speed, usability, and advanced features.

---

## Getting Started

### For New Features

1. **Choose your mode**: Claude will ask if you want Spec Mode (structured planning) or Vibe Mode (rapid implementation)
2. **Follow the workflow**: See [MODES.md](.claude/MODES.md) for details on each mode
3. **Use the design system**: Always use CSS variables from [BRAND_COLORS.md](.claude/BRAND_COLORS.md)
4. **Follow code style**: Check [CODE_STYLE.md](.claude/CODE_STYLE.md) for conventions

### For Technical Questions

- **Architecture & Setup**: See [TECHNICAL.md](.claude/TECHNICAL.md)
- **API Integration**: See API reference docs in `.claude/`
- **Code Patterns**: See [CODE_STYLE.md](.claude/CODE_STYLE.md)

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

1. **Mode Selection** - Always ask user to choose Spec or Vibe mode for new features
2. **Design System** - Never use hard-coded colors, always use CSS variables
3. **Type Safety** - Use TypeScript for all code, avoid `any`
4. **Testing** - Write tests for utilities and component behavior
5. **Accessibility** - Use semantic HTML and ARIA labels
6. **Performance** - Lazy load routes and optimize images
7. **Security** - Sanitize input, use environment variables for secrets

---

## Documentation Structure

```
.claude/
├── TECHNICAL.md              # Tech stack, architecture, workflows
├── MODES.md                  # Spec Mode & Vibe Mode documentation
├── CODE_STYLE.md             # Code style guide and best practices
├── BRAND_COLORS.md           # Design system and color palette
├── polymarket-api-reference.md  # Polymarket API docs
└── porto-api-reference.md    # Porto SDK docs
```

---

## Need Help?

- **Feature Planning**: See [MODES.md](.claude/MODES.md)
- **Code Style Questions**: See [CODE_STYLE.md](.claude/CODE_STYLE.md)
- **Design/Styling**: See [BRAND_COLORS.md](.claude/BRAND_COLORS.md)
- **Architecture**: See [TECHNICAL.md](.claude/TECHNICAL.md)
- **API Integration**: See API reference docs in `.claude/`
