# Compass

A ministry-first goals platform built for mission organizations.

Compass helps teams:

- Set organization, department, region, and personal **Aims**
- Track **Lead** and **Lag** measures with clear definitions
- Run a daily **Today commitments** workflow with priority + weight
- Submit weekly **Check-ins** with blockers, asks, and prayer
- Capture **Stories** and **Prayer items**
- Manage staff-only **Missionary records** and monthly updates
- Operate with role-aware access controls and Supabase RLS policies

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

## Environment Variables

At minimum, set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# optional fallback
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Supabase Schema + RLS

SQL migrations live in:

```bash
supabase/migrations/
```

They include:

- Core domain schema (aims, measures, commitments, check-ins, stories, prayer, missionaries)
- Trigger and helper functions
- Row-level security policies
- Bootstrap seed for default org + teams

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

## Application Sections

- `/today` — daily prioritized commitments
- `/my-work` — personal execution list
- `/my-team` — team pulse and check-in visibility
- `/network` — cross-team view
- `/aims` — aim definition and tracking
- `/map` — goal connections map
- `/check-ins` — weekly check-in submission
- `/stories` — quick and MSC-style stories
- `/prayer` — prayer request tracking
- `/missionaries` — missionary records and updates
- `/admin` — organizational setup and governance overview

## Project Structure

```
compass/
├── src/
│   ├── app/                    # App Router pages + API routes
│   ├── components/             # UI + domain components
│   ├── lib/                    # Auth, API helpers, Supabase clients, validation
│   ├── types/                  # Shared domain and DB types
│   └── __tests__/              # Unit tests
├── supabase/
│   ├── config.toml
│   └── migrations/             # Schema + RLS migrations
├── e2e/                        # Playwright tests
├── test/                       # Test setup files
├── proxy.ts                    # Next.js 16 auth/session proxy
└── .env.example                # Environment template
```
