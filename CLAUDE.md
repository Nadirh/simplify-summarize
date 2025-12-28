# CLAUDE.md - Project Instructions

## Project Overview

Build a SaaS product that allows website owners to offer "Summarize" and "Simplify" functionality to their visitors. Website owners embed a JavaScript widget via a script tag. When visitors click the widget, they see pre-generated simplified or summarized versions of the page content.

Content is pre-processed at customer onboarding (not on-demand) so responses are instant and can be QA'd before going live.

## MVP Scope

- Widget with Simplify and Summarize buttons
- Edge function to serve pre-generated content
- Crawler that processes a list of URLs
- Basic QA dashboard to review and approve content

## Post-MVP

- On-demand processing for authenticated pages
- Automatic content change detection
- Analytics
- Follow-up questions via Chat Agent (see Architecture.md)

---

## Development Philosophy

1. **Think before coding** - Planning prevents rework
2. **Simplicity over cleverness** - Simple code is maintainable
3. **Small changes** - Incremental commits, easy to review
4. **Human verification** - Get approval before major changes

---

## Workflow

### For Complex Tasks (new features, architecture changes)

1. **Analyze** - Understand the problem, identify affected files, consider edge cases
2. **Plan** - Write plan in todo.md with checkboxes
3. **Wait for approval** - Do not code until human approves
4. **Branch** - Create `feature/descriptive-name`
5. **Implement** - One todo item at a time, commit after each
6. **Document** - Update relevant docs as you go
7. **Review** - Ask human to review before merging

### For Simple Tasks (bug fixes, small changes)

1. **Explain** what you'll change and why
2. **Implement** directly (no full planning doc needed)
3. **Commit** with clear message

---

## Code Principles

- **SOLID** - See Architecture.md for details
- **Simplicity** - Smallest change that solves the problem
- **No over-engineering** - Don't add features not requested
- **Small functions** - Prefer multiple small functions over one large one
- **New files over bloated files** - Split when files get large

---

## Project Structure

```
/app              # Next.js App Router pages
/components       # React components
/lib              # Shared utilities and services
  /services       # Business logic (processors, crawler)
  /db             # Database queries
/api              # API routes
/public           # Static assets including widget.js
```

---

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # Run linter
npm run test      # Run tests
```

---

## Key Files

- `Architecture.md` - System design and data flow
- `todo.md` - Current task planning and progress
- `.env.local` - Environment variables (never commit)

---

## Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```
