# Development Modes

Glitch Markets supports two development workflows optimized for different scenarios: **Spec Mode** for complex features requiring planning, and **Vibe Mode** for rapid iteration and quick changes.

---

## Table of Contents

- [When to Use Each Mode](#when-to-use-each-mode)
- [Spec Mode (Structured Planning)](#spec-mode-structured-planning)
- [Vibe Mode (Rapid Implementation)](#vibe-mode-rapid-implementation)
- [Switching Between Modes](#switching-between-modes)

---

## When to Use Each Mode

### Use Spec Mode When:

- ✅ Building a **new feature** with multiple components
- ✅ Making **architectural changes** that affect multiple files
- ✅ **Unclear requirements** - need to explore and clarify
- ✅ **Multiple approaches** are possible and you want to choose the best
- ✅ Working on **complex business logic** that needs validation
- ✅ Adding features that require **database migrations** or API changes
- ✅ Need **stakeholder alignment** before implementation
- ✅ Estimated effort is **Medium, Large, or XL**

**Examples:**

- "Add user authentication system with social logins"
- "Implement real-time notifications with WebSockets"
- "Create a new betting interface for markets"
- "Redesign the portfolio page with charts and analytics"

### Use Vibe Mode When:

- ✅ Making **quick fixes** or small tweaks
- ✅ Adding **UI polish** or styling improvements
- ✅ Implementing **well-defined** tasks with clear requirements
- ✅ Creating **simple components** or utilities
- ✅ Bug fixes with **known solutions**
- ✅ Updating **copy, styles, or assets**
- ✅ Requirements are **crystal clear**
- ✅ Estimated effort is **Small**

**Examples:**

- "Change the primary button color to match brand"
- "Add a loading spinner to the search input"
- "Fix the navigation menu on mobile"
- "Update the footer links"

---

## Spec Mode (Structured Planning)

Spec Mode uses the **spec-architect agent** to guide you through structured feature planning with three phases: **Requirements → Design → Tasks**.

### How It Works

#### 1. **Phase 1: Requirements (What)**

Define **what** you're building:

- Feature overview and purpose
- User stories with acceptance criteria
- Success metrics
- Non-functional requirements (performance, security, accessibility)
- Explicit scope boundaries (out-of-scope items)

**Gate 1:** Review and approve requirements before moving forward.

#### 2. **Phase 2: Design (How)**

Plan **how** to build it:

- System architecture and data flow
- Component hierarchy and relationships
- API contracts and data models
- Technology choices and rationale
- File structure and organization
- Error handling strategy

**Gate 2:** Review and approve design before implementation planning.

#### 3. **Phase 3: Tasks (Steps)**

Break down into **actionable steps**:

- Ordered list of implementation tasks
- Dependencies between tasks
- Risk assessment per task
- Testing strategy
- Rollback plan

**Gate 3:** Final approval before implementation begins.

### Spec Mode Output

All planning is saved to `.claude/specs/[feature-name].md` for reference during implementation and future maintenance.

The spec document includes:

- Visual progress tracking with boxes and progress bars
- Clear sections with hierarchy
- Acceptance criteria for each story
- Architecture diagrams (text-based)
- File changes with before/after examples
- Testing checklist

### Starting Spec Mode

Simply tell Claude:

```
"I want to use Spec Mode for [feature description]"
```

Or Claude will ask if you want Spec Mode when you request a complex feature.

### Benefits of Spec Mode

- ✅ **Alignment** - Ensures everyone agrees before coding starts
- ✅ **Documentation** - Spec serves as feature documentation
- ✅ **Reduces rework** - Catches issues during planning
- ✅ **Better estimates** - Detailed task breakdown reveals complexity
- ✅ **Onboarding** - New developers can read specs to understand features
- ✅ **Architecture review** - Evaluate trade-offs before committing

### Spec Mode Best Practices

1. **Be thorough in Phase 1** - Good requirements prevent costly changes later
2. **Ask questions early** - Claude will ask clarifying questions; answer them fully
3. **Review each gate** - Don't rush through approvals
4. **Reference the spec** - Keep the spec open during implementation
5. **Update if needed** - If requirements change, update the spec document

---

## Vibe Mode (Rapid Implementation)

Vibe Mode is the **default workflow** for quick changes and well-defined tasks. Claude implements your request immediately without formal planning phases.

### How It Works

1. **You describe what you want**
2. **Claude implements it directly**
3. **You review and iterate**

No formal spec document, no gates, no planning phases—just rapid iteration.

### When Vibe Mode Works Best

- Requirements are clear and simple
- Single file or small set of files affected
- Low risk of breaking changes
- Quick feedback loop desired
- Experimentation and prototyping

### Vibe Mode Flow

```
Request → Implementation → Review → Iterate → Done
```

### Starting Vibe Mode

Vibe Mode is **automatic**—just describe what you want:

```
"Add a dark mode toggle to the settings page"
"Fix the broken search on mobile"
"Create a new Button variant called 'danger'"
```

Claude will implement immediately if the task is straightforward.

### Benefits of Vibe Mode

- ✅ **Fast** - See results immediately
- ✅ **Flexible** - Easy to pivot and try different approaches
- ✅ **Low overhead** - No planning ceremony
- ✅ **Great for learning** - Experiment quickly
- ✅ **Iterative** - Build, review, refine

### Vibe Mode Best Practices

1. **Be specific** - "Add a loading state to the button" vs "Make the button better"
2. **One thing at a time** - Avoid combining multiple unrelated changes
3. **Review carefully** - No formal spec means you're the QA
4. **Test thoroughly** - Run the app and verify changes work
5. **Consider Spec Mode** - If you find yourself iterating 5+ times, switch to Spec Mode

---

## Switching Between Modes

### Upgrading to Spec Mode

If a "Vibe Mode" task becomes complex:

```
"Let's switch to Spec Mode for this—it's more complex than I thought"
```

Claude will launch the spec-architect agent and start Phase 1.

### Downgrading to Vibe Mode

If you're in Spec Mode but realize it's simpler:

```
"Actually, let's skip the spec and just implement this quickly"
```

Claude will exit planning and implement directly.

### Hybrid Approach

You can use both:

1. **Spec Mode for the feature** - Plan the overall feature
2. **Vibe Mode for iterations** - Make quick tweaks during implementation

---

## Mode Comparison

| Aspect            | Spec Mode                               | Vibe Mode                                |
| ----------------- | --------------------------------------- | ---------------------------------------- |
| **When**          | Complex features, architectural changes | Quick fixes, simple changes              |
| **Planning**      | 3-phase structured planning             | Minimal/no planning                      |
| **Documentation** | Spec document in `.claude/specs/`       | None (code is documentation)             |
| **Gates**         | 3 approval gates                        | None                                     |
| **Speed**         | Slower upfront, faster overall          | Fast immediate results                   |
| **Risk**          | Low (validated before implementation)   | Higher (implement first, validate after) |
| **Best for**      | Features, systems, architecture         | Fixes, polish, experiments               |
| **Rework**        | Minimal (caught in planning)            | May require iteration                    |

---

## Examples

### Spec Mode Example

**Request:**

> "I want to add a wallet connection feature that supports MetaMask, WalletConnect, and email login with passkeys."

**Claude:**

> I'll guide you through Spec Mode for this wallet feature. This is a complex feature with authentication, multiple providers, and security considerations.
>
> Let's start Phase 1: Requirements...

**Result:** A comprehensive spec document covering auth flows, provider integration, error handling, security, and a task breakdown with 15+ implementation steps.

---

### Vibe Mode Example

**Request:**

> "Add a copy button next to the wallet address that copies to clipboard"

**Claude:**

> I'll add a copy button next to wallet addresses.

**Result:** Implementation is done immediately—new `CopyButton` component, integrated into address display, tested and working.

---

## Decision Tree

```
Is it a new feature with >3 files affected?
├─ YES → Use Spec Mode
└─ NO → Continue ↓

Are requirements unclear or multiple approaches possible?
├─ YES → Use Spec Mode
└─ NO → Continue ↓

Does it involve architecture, database, or API changes?
├─ YES → Use Spec Mode
└─ NO → Continue ↓

Is it a quick fix, polish, or well-defined task?
├─ YES → Use Vibe Mode ✅
└─ NO → Use Spec Mode
```

---

## Tips for Success

### For Complex Projects

1. Start with Spec Mode for the overall feature
2. Create a detailed task list in Phase 3
3. Use Vibe Mode to implement each task
4. Reference the spec document throughout

### For Rapid Development

1. Use Vibe Mode for all quick changes
2. Keep changes focused and small
3. Test thoroughly since there's no formal review
4. Consider Spec Mode if you iterate 3+ times on the same task

### For Teams

1. Use Spec Mode for features that affect multiple developers
2. Share spec documents for review and feedback
3. Use Vibe Mode for personal tasks that don't require coordination

---

## Summary

- **Spec Mode** = Structured, thorough, documented planning → implementation
- **Vibe Mode** = Rapid, iterative, experimental implementation → refinement

Choose the mode that fits your task complexity and risk tolerance. When in doubt, start with Vibe Mode—you can always upgrade to Spec Mode if needed.

For more information:

- [Spec Architect Agent](../.claude/agents/spec-architect.md) - Full spec mode documentation
- [Code Style Guide](./code-style.md) - Implementation patterns
- [Technical Documentation](./technical.md) - Architecture and setup
