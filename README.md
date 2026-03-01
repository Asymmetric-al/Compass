# Compass

A Next.js 16 application built with Turbopack, TypeScript, Tailwind CSS 4, and Bun. Deployed on Vercel with Supabase as the backend.

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env.local

# Start development server (Turbopack)
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with Turbopack |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run lint:fix` | Run ESLint with auto-fix |
| `bun run type-check` | TypeScript type checking |
| `bun run test` | Run unit tests (Vitest) |
| `bun run test:watch` | Run unit tests in watch mode |
| `bun run test:coverage` | Run unit tests with coverage |
| `bun run test:e2e` | Run E2E tests (Playwright) |
| `bun run format` | Format code with Prettier |
| `bun run format:check` | Check formatting |

Use `bunx turbo <task>` to run tasks with Turborepo caching.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Runtime:** Bun
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth
- **Email:** Resend
- **Deployment:** Vercel
- **Unit Testing:** Vitest + Testing Library
- **E2E Testing:** Playwright
- **Linting:** ESLint (flat config) + Prettier
- **Task Runner:** Turborepo
- **Git Hooks:** Husky + lint-staged

## Project Structure

```
compass/
├── src/
│   ├── app/              # Next.js App Router (pages, layouts, routes)
│   ├── components/       # Shared React components
│   ├── lib/              # Utility functions, Supabase client, etc.
│   ├── types/            # TypeScript type definitions
│   └── __tests__/        # Unit tests (Vitest)
├── e2e/                  # E2E tests (Playwright)
├── public/               # Static assets
├── test/                 # Test setup files
├── .agents/skills/       # AI agent skills (1,300+)
├── .husky/               # Git hooks
├── turbo.json            # Turborepo config
├── vitest.config.ts      # Vitest config
├── playwright.config.ts  # Playwright config
├── next.config.ts        # Next.js config
├── eslint.config.mjs     # ESLint flat config
├── .prettierrc           # Prettier config
├── bunfig.toml           # Bun config
├── tsconfig.json         # TypeScript config
└── .env.example          # Environment variables template
```
