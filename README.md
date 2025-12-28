# Simplify & Summarize

A SaaS product that allows website owners to offer "Summarize" and "Simplify" functionality to their visitors via an embeddable JavaScript widget.

## How It Works

1. Website owners embed a widget via `<script>` tag
2. Content is pre-processed at onboarding (not on-demand)
3. Visitors click widget to see simplified/summarized content
4. Instant responses (<50ms) from pre-generated content

## Tech Stack

| Layer           | Technology                          |
|-----------------|-------------------------------------|
| Framework       | Next.js (App Router) + TypeScript   |
| Styling         | Tailwind CSS                        |
| Auth            | Clerk                               |
| Database        | Supabase (PostgreSQL)               |
| AI              | Vercel AI SDK + Anthropic           |
| Deployment      | Vercel                              |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account
- Anthropic API key

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/your-org/simplify-summarize.git
   cd simplify-summarize
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Copy environment variables
   ```bash
   cp .env.example .env.local
   ```

4. Fill in your environment variables in `.env.local`

5. Run development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Documentation

| File | Purpose |
|------|---------|
| [CLAUDE.md](./CLAUDE.md) | Development workflow and AI instructions |
| [Architecture.md](./Architecture.md) | System design, API, data flow |

## Development

This project follows a structured workflow:

1. **Plan** - Analyze and document in todo.md
2. **Approve** - Get human review before coding
3. **Branch** - Work on `feature/[name]` branches
4. **Implement** - Small, incremental commits
5. **Review** - PR review before merging

See [CLAUDE.md](./CLAUDE.md) for full development guidelines.

## License

[MIT](./LICENSE)
