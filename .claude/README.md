# .claude/ Directory

This directory contains all Claude Code configuration and documentation for the Glitch Markets project. It serves as the central hub for AI-assisted development workflows, coding standards, and architectural documentation.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [Documentation Files](#documentation-files)
- [Configuration](#configuration)
- [Custom Agents](#custom-agents)
- [Skills](#skills)
- [Specs](#specs)
- [For Team Members](#for-team-members)

---

## Quick Start

**For Claude Code Users:**

1. Start with [CLAUDE.md](../CLAUDE.md) in the project root
2. Choose your development mode in [docs/modes.md](docs/modes.md)
3. Follow code style guidelines in [docs/code-style.md](docs/code-style.md)
4. Reference API docs in [docs/](docs/) as needed

**For Team Members:**

All documentation in this directory is version-controlled and represents our team's agreed-upon standards. When making changes:

1. Update documentation to reflect new patterns
2. Keep specs updated as features evolve
3. Commit documentation changes with code changes
4. Review the changelog when pulling updates

---

## Directory Structure

```
.claude/
├── README.md                    # This file
├── settings.local.json          # Claude Code permissions & MCP servers
├── docs/                        # Core documentation
│   ├── technical.md             # Tech stack, architecture, deployment
│   ├── modes.md                 # Spec Mode vs Vibe Mode workflows
│   ├── code-style.md            # TypeScript, Svelte, CSS conventions
│   ├── brand-colors.md          # Design system & color palette
│   ├── polymarket-api-reference.md   # Polymarket API docs
│   ├── tanstack-query-reference.md   # TanStack Query docs
│   └── vitest.md                # Testing guidelines
├── agents/                      # Custom Claude Code agents
│   └── spec-architect.md        # Spec Mode agent configuration
├── skills/                      # Reusable workflow skills (optional)
│   └── [skill-name]/            # Individual skill directories
└── specs/                       # Feature specifications (temporary)
    └── [feature-name].md        # Individual feature specs
```

---

## Documentation Files

### Core Documentation (`docs/`)

#### [technical.md](docs/technical.md)
Comprehensive technical guide covering:
- Tech stack (SvelteKit, TypeScript, PostgreSQL, etc.)
- Project architecture and patterns
- Development workflow and commands
- Testing strategy
- Deployment process
- Security considerations

**When to reference:** Setting up dev environment, understanding architecture, deploying to production.

#### [modes.md](docs/modes.md)
Development workflow documentation:
- **Spec Mode**: Structured planning for complex features (Requirements → Design → Tasks)
- **Vibe Mode**: Rapid iteration for quick changes
- Decision tree for choosing the right mode
- Examples and best practices

**When to reference:** Starting any new feature or making significant changes.

#### [code-style.md](docs/code-style.md)
Code style and conventions guide:
- TypeScript patterns and naming conventions
- Svelte 5 component structure with runes
- CSS styling with design system variables
- File naming and organization
- Testing patterns
- Comment guidelines

**When to reference:** Writing new code, reviewing PRs, onboarding new developers.

#### [brand-colors.md](docs/brand-colors.md)
Design system documentation:
- Complete color palette with CSS variables
- Spacing and typography scales
- Component styling guidelines
- Dark/light theme implementation
- Accessibility standards

**When to reference:** Styling components, creating new UI elements, ensuring design consistency.

#### [vitest.md](docs/vitest.md)
Testing documentation:
- Vitest configuration and setup
- Testing patterns for utilities and components
- Mock strategies
- Test organization

**When to reference:** Writing tests, debugging test failures.

### API References (`docs/`)

#### [polymarket-api-reference.md](docs/polymarket-api-reference.md)
Complete Polymarket API documentation:
- All available endpoints
- Request/response formats
- Query parameters
- Error handling
- Rate limits

**When to reference:** Integrating with Polymarket APIs, debugging API issues.

#### [tanstack-query-reference.md](docs/tanstack-query-reference.md)
TanStack Query (React Query) for Svelte:
- Query and mutation patterns
- Caching strategies
- Error handling
- Optimistic updates

**When to reference:** Working with data fetching, implementing queries or mutations.

---

## Configuration

### settings.local.json

This file configures Claude Code's behavior for this project:

```json
{
  "permissions": {
    "allow": [
      // Allowed MCP servers and tools
      "mcp__svelte__*",
      "WebSearch",
      "WebFetch(domain:svelte.dev)",
      "Bash(npm:*)",
      // ... more permissions
    ]
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["svelte"]
}
```

**Key sections:**
- `permissions.allow`: Tools and commands Claude can use without asking
- `enabledMcpjsonServers`: Approved MCP servers for the project

**When to modify:**
- Adding new approved domains for WebFetch
- Enabling new bash commands
- Configuring new MCP servers

**Note:** This file is version-controlled and shared across the team. Local overrides can be made in `~/.claude/settings.json`.

---

## Custom Agents

### agents/

Custom agents extend Claude Code's capabilities for specific workflows.

#### [spec-architect.md](agents/spec-architect.md)

The spec-architect agent implements **Spec Mode** for structured feature planning.

**Features:**
- Three-phase planning: Requirements → Design → Tasks
- Beautiful terminal UI with progress boxes
- Interactive approval gates
- Generates comprehensive spec documents

**Usage:**
```bash
# Claude automatically invokes this agent when you request Spec Mode
"I want to use Spec Mode to plan the wallet connection feature"
```

**Creating new agents:**

Place agent configuration files in `agents/` with frontmatter:

```markdown
---
name: my-agent
description: Brief description of what this agent does
model: sonnet  # or haiku, opus
color: blue
---

# Agent instructions here
```

---

## Skills

### skills/ (Optional)

Skills are reusable markdown-based workflows that Claude Code can invoke automatically.

**Example structure:**
```
skills/
├── pr-review/
│   └── SKILL.md
├── commit-format/
│   └── SKILL.md
└── api-test/
    └── SKILL.md
```

**When to create a skill:**
- Repetitive workflows you want automated
- Team-specific conventions (e.g., commit message format)
- Custom validation or testing procedures

**Learn more:** See [Claude Code Skills documentation](https://code.claude.com/docs/skills)

---

## Specs

### specs/

Feature specification documents generated by Spec Mode.

**Characteristics:**
- ⚠️ **Temporary** - Specs are working documents, not permanent
- Created during feature planning phase
- Include requirements, design decisions, and task breakdowns
- Can be archived or deleted once feature is complete

**Example spec:**
```
specs/
└── wallet-connection.md    # Generated by spec-architect agent
```

**Lifecycle:**
1. Generated during Spec Mode planning
2. Referenced during implementation
3. Updated if requirements change
4. Archived or deleted post-release

**Best practice:** Don't let old specs accumulate. Archive completed specs or remove them after features ship.

---

## For Team Members

### Contributing to Documentation

All files in `.claude/` are version-controlled. When you:

**Add a new pattern:**
1. Update [code-style.md](docs/code-style.md) with the new convention
2. Add examples
3. Commit with descriptive message

**Add a new API:**
1. Document in appropriate reference file (or create new one)
2. Add link from [CLAUDE.md](../CLAUDE.md)
3. Commit documentation before using the API

**Change architecture:**
1. Update [technical.md](docs/technical.md)
2. Update any affected code examples in other docs
3. Consider updating specs for in-flight features

### Documentation Standards

- **Markdown format** - All docs use GitHub-flavored markdown
- **Code examples** - Include working examples, not pseudocode
- **Keep current** - Docs should reflect reality, not aspirations
- **Be specific** - Avoid vague guidance like "follow best practices"
- **Link liberally** - Cross-reference related documentation

### Getting Help

**Questions about:**
- **Claude Code itself:** Run `/help` in Claude Code or visit [code.claude.com](https://code.claude.com)
- **Project architecture:** See [technical.md](docs/technical.md)
- **Code conventions:** See [code-style.md](docs/code-style.md)
- **Development workflow:** See [modes.md](docs/modes.md)
- **Design system:** See [brand-colors.md](docs/brand-colors.md)

### Onboarding Checklist

New to the project? Read these in order:

1. ✅ [CLAUDE.md](../CLAUDE.md) - Project overview
2. ✅ [technical.md](docs/technical.md) - Setup and architecture
3. ✅ [code-style.md](docs/code-style.md) - Coding conventions
4. ✅ [modes.md](docs/modes.md) - Development workflows
5. ✅ [brand-colors.md](docs/brand-colors.md) - Design system

Then reference API docs as needed during development.

---

## Version Control

**What's committed:**
- ✅ All documentation in `docs/`
- ✅ Agent configurations in `agents/`
- ✅ `settings.local.json` (project permissions)
- ✅ Skills in `skills/` (if created)
- ✅ This README

**What's NOT committed:**
- ❌ `specs/` - These are temporary working documents
- ❌ Personal settings overrides

**Why documentation is committed:**

Documentation represents team agreements and evolves with the codebase. Committing docs ensures:
- Everyone works from the same standards
- Changes are reviewed like code
- History is preserved
- New team members get current information

---

## Maintenance

### Regular Tasks

**Monthly:**
- Review `specs/` and archive/delete old specs
- Update API references if external APIs changed
- Check that code examples in docs still work

**Quarterly:**
- Review all documentation for accuracy
- Update technical.md with new patterns or tools
- Consolidate or split docs if they've grown too large

**As Needed:**
- Update code-style.md when adopting new conventions
- Update modes.md if workflow changes
- Update brand-colors.md when design system evolves

### Documentation Health

Good documentation:
- ✅ Is easy to find (clear names, good structure)
- ✅ Has working code examples
- ✅ Is current (matches the codebase)
- ✅ Is specific (actionable guidance)
- ✅ Is concise (no unnecessary words)

Poor documentation:
- ❌ Is outdated or contradicts the code
- ❌ Is vague or aspirational
- ❌ Has broken examples
- ❌ Is hard to navigate
- ❌ Is duplicated across files

---

## Questions?

For questions about:
- **This directory structure:** Ask in team chat or create an issue
- **Claude Code features:** See [code.claude.com/docs](https://code.claude.com/docs)
- **Specific APIs:** Check the relevant reference doc in `docs/`

**Happy coding! 🚀**
