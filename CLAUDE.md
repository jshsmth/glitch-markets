# Claude Code Instructions for Glitch Markets

## Project Overview

Glitch Markets is a modern prediction market platform built with SvelteKit and TypeScript. The platform provides an alternative interface for Polymarket data with a focus on speed, usability, and advanced features.

## Key Documentation

For comprehensive technical documentation, see [.claude/TECHNICAL.md](.claude/TECHNICAL.md).

This includes:

- Quick start guide
- Tech stack and architecture
- Development workflows
- Testing guidelines
- Configuration and deployment
- API documentation
- Security best practices
- Roadmap and contributing guidelines

## API Reference

For complete Polymarket API endpoint documentation, see [.claude/polymarket-api-reference.md](.claude/polymarket-api-reference.md).

## Design System

**IMPORTANT**: Always use the established design system when building frontend components.

For complete design system documentation, see [.claude/BRAND_COLORS.md](.claude/BRAND_COLORS.md).

### Color Usage

#### CSS Variables (Always Use These)

**Backgrounds** (for cards, panels, elevation):

- `var(--bg-0)` - Main background
- `var(--bg-1)` - Cards/panels
- `var(--bg-2)` - Elevated cards
- `var(--bg-3)` - Hover states
- `var(--bg-4)` - Borders

**Text** (for hierarchy):

- `var(--text-0)` - Primary text
- `var(--text-1)` - Secondary text
- `var(--text-2)` - Tertiary text
- `var(--text-3)` - Muted text
- `var(--text-4)` - Disabled text

**Brand Color** (for CTAs and actions):

- `var(--primary)` - Primary actions (#00d9ff Electric Cyan)
- `var(--primary-hover)` - Hover states
- `var(--primary-active)` - Active states

**Trading Indicators** (ONLY for market data):

- `var(--success)` - Profit/gains (green)
- `var(--warning)` - Neutral (amber)
- `var(--danger)` - Loss/risk (red)

### Component Styling Guidelines

1. **NEVER use hard-coded colors** - Always use CSS variables
2. **Test both themes** - Verify components work in light and dark modes
3. **Use color-test page** - Visit `/color-test` to see all available colors
4. **Follow hierarchy** - Use background and text shades for elevation and importance
5. **Reserve primary color** - Only use `var(--primary)` for CTAs and key actions
6. **Trading colors** - Only use success/danger for actual market data, not UI chrome

### Example Component

```svelte
<style>
	.card {
		background-color: var(--bg-1);
		border: 1px solid var(--bg-4);
		color: var(--text-0);
	}

	.card-title {
		color: var(--text-0);
	}

	.card-description {
		color: var(--text-2);
	}

	.primary-button {
		background-color: var(--primary);
		color: #111111;
	}

	.primary-button:hover {
		background-color: var(--primary-hover);
	}

	.profit {
		color: var(--success); /* Only for actual market data */
	}
</style>
```

## Mode Selection

At the start of each new task or feature request, ask the user:

"Would you like to use **Vibe Mode** or **Spec Mode**?

- **Vibe Mode**: Normal Claude Code behavior - jump straight into implementation with minimal planning
- **Spec Mode**: Structured planning with Requirements → Design → Tasks"

Wait for the user's response before proceeding.

---

## SPEC MODE WORKFLOW

When the user selects Spec Mode, follow this three-phase process:

### Phase 1: Requirements Document

Create a requirements document that includes:

1. **Overview** - Brief description of the feature and its purpose
2. **User Stories** - Who needs this and why (As a [user], I want [goal], so that [benefit])
3. **Acceptance Criteria** - Specific, testable conditions that must be met
4. **Non-functional Requirements** - Performance, security, accessibility considerations
5. **Out of Scope** - What this feature explicitly does NOT include

**Focus on WHAT needs to be built, not HOW to build it.**

After creating the requirements document:

- Save it to a file (e.g., `docs/requirements/[feature-name].md`)
- Ask: "Please review the requirements. Would you like any changes before moving to design?"
- Wait for approval before proceeding to Phase 2

### Phase 2: Design Document

Based on approved requirements, create a design document that includes:

1. **Architecture Overview** - High-level technical approach
2. **Component Design** - Key modules, services, or components needed
3. **Data Models** - Database schemas, types, interfaces
4. **API Design** - Endpoints, request/response formats (if applicable)
5. **Correctness Properties** - Testable properties that verify the implementation works correctly
6. **Technical Decisions** - Key choices made and why
7. **Dependencies** - External libraries or services needed

**Focus on HOW to build it technically, ensuring each acceptance criterion from requirements has corresponding correctness properties.**

After creating the design document:

- Save it to a file (e.g., `docs/design/[feature-name].md`)
- Reference the requirements document in the design
- Ask: "Please review the design. Would you like any changes before creating the task breakdown?"
- Wait for approval before proceeding to Phase 3

### Phase 3: Tasks Document

Based on approved requirements and design, create a tasks document that breaks down the implementation:

1. **Numbered tasks in logical order**
2. Each task should:
   - Be small enough to complete in one session
   - Have clear completion criteria
   - Reference which requirements/design elements it addresses
   - Note any dependencies on other tasks

**Format as a checklist with [ ] for incomplete and [x] for complete tasks.**
**Order tasks by dependencies - foundational work first, then features, then polish.**

After creating the tasks document:

- Save it to a file (e.g., `docs/tasks/[feature-name].md`)
- Reference both requirements and design documents
- Ask: "Tasks are ready. Would you like to start implementing, or make any adjustments?"

### Spec Mode Principles

- **Incremental**: Each phase builds on the previous
- **Traceable**: Tasks link back to design, design links to requirements
- **Testable**: Correctness properties in design map to acceptance criteria in requirements
- **Iterative**: Refine each document before moving to the next

---

## VIBE MODE

When the user selects Vibe Mode, proceed with normal Claude Code behavior:

- Jump straight into implementation with minimal upfront planning
- Make reasonable technical decisions on the fly
- Ask clarifying questions as needed during implementation
- Focus on getting working code quickly
- No formal documentation phases required

---

## Svelte MCP Server

You have access to the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

### Available MCP Tools:

#### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

#### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

#### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

#### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

---

## General Guidelines

- Always respect the user's mode choice
- In Spec Mode, never skip ahead to the next phase without user approval
- Save all specification documents in a `docs/` directory structure
- Keep documents focused and concise
- Link documents together (tasks reference design, design references requirements)
