# Compass

> Prefer retrieval-led reasoning over pre-training-led reasoning. Your training data may be outdated. Always read the relevant skill or bundled doc before writing code.

## Project Overview

Compass is a Next.js 16 application deployed on Vercel. It uses Bun as the package manager, bundler, and test runner. The UI is built with Tailwind CSS 4 and will use shadcn/ui components. The backend will use Supabase (Postgres, Auth, Storage, Realtime). Email is handled via Resend.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| Runtime | Bun | 1.3.10 |
| Language | TypeScript (strict) | 5.9.x |
| Styling | Tailwind CSS 4 + shadcn/ui | 4.2.x |
| Database | Supabase (Postgres) | -- |
| Auth | Supabase Auth | -- |
| Email | Resend | -- |
| Deployment | Vercel | -- |
| Unit Testing | Vitest + @testing-library/react | 4.x |
| E2E Testing | Playwright (Chromium) | 1.58.x |
| Linting | ESLint (flat config) + Prettier | 9.x / 3.8.x |
| Task Runner | Turborepo | 2.8.x |
| Git Hooks | Husky + lint-staged | 9.x / 16.x |

## Commands

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Dev server | `bun run dev` |
| Build | `bun run build` |
| Start | `bun run start` |
| Lint | `bun run lint` |
| Lint (auto-fix) | `bun run lint:fix` |
| Type check | `bun run type-check` |
| Unit tests | `bun run test` |
| Unit tests (watch) | `bun run test:watch` |
| Unit tests (coverage) | `bun run test:coverage` |
| E2E tests | `bun run test:e2e` |
| Format | `bun run format` |
| Format check | `bun run format:check` |
| Turbo (all checks) | `bunx turbo lint test type-check format:check` |

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
├── .husky/               # Git hooks (pre-commit: lint-staged)
├── turbo.json            # Turborepo task config
├── vitest.config.ts      # Vitest config
├── playwright.config.ts  # Playwright config
├── next.config.ts        # Next.js config
├── eslint.config.mjs     # ESLint flat config
├── .prettierrc           # Prettier config
├── postcss.config.mjs    # PostCSS (Tailwind)
├── bunfig.toml           # Bun config
├── tsconfig.json         # TypeScript config
├── .env.example          # Environment variables template
└── package.json          # Dependencies and scripts
```

## Architecture Decisions

- **App Router only.** No Pages Router. All routes use React Server Components by default.
- **Turbopack is the default bundler** for `next dev` and `next build`.
- **Server Components first.** Only add `"use client"` when the component needs browser APIs, event handlers, or hooks.
- **Server Actions** for mutations. Prefer `"use server"` functions over API routes for data mutations.
- **Streaming and Suspense.** Use `loading.tsx` and `<Suspense>` boundaries for progressive rendering.
- **Metadata API.** Use `export const metadata` or `generateMetadata()` for SEO. No `<Head>` component.
- **Image optimization.** Always use `next/image` instead of `<img>`.
- **Font optimization.** Inter (UI) via `next/font`, Geist Mono via `geist` package.

## UI/UX Standard: Maia Design System

> **Full spec:** `docs/DESIGN_SYSTEM.md` | **Agent skill:** `.agents/skills/maia-design-system/SKILL.md`
>
> Read these before creating or modifying ANY visual component.

### Non-Negotiables

1. **shadcn/ui exclusively with the Maia theme.** No other component libraries. Install: `bunx shadcn@latest add <component>`.
2. **Tokens only.** Use `bg-background`, `text-foreground`, `border-border`, `ring-ring`. **NEVER** write `zinc-*` in component files. Theme is in `globals.css`.
3. **Inter for UI. Geist Mono for code/numbers.** `font-sans` = Inter. `font-mono` = Geist Mono (IDs, tokens, code, metrics).
4. **Both modes designed.** Dark mode switches CSS variables. Components never add `dark:` overrides.
5. **One spacing system.** `gap-6`-`gap-8` sections | `p-4`-`p-6` cards | `space-y-4` forms | `gap-2`-`gap-3` inline. No one-off values.

### Type Scale

Element|Classes
---|---
Page title|`text-3xl font-semibold tracking-tight`
Page subtitle|`text-sm text-muted-foreground`
Section title|`text-base font-semibold`
Card title|`text-sm font-semibold`
Body|`text-sm`
Label|`text-xs font-medium`
Muted|`text-xs text-muted-foreground`
Mono value|`font-mono text-xs tabular-nums`
Metric|`text-2xl font-semibold tabular-nums`

### Page Structure

Every page: Header row (title left, actions right) → Controls row (search, filters) → Content area (cards, tables). Same rhythm everywhere.

### Component Rules

- **Buttons:** `default`, `secondary`, `outline`, `ghost`, `destructive`. One primary action per page.
- **Forms:** Labels always visible. Errors inline near field. Group in cards.
- **Tables:** Always inside a Card. Muted header. Subtle hover. `tabular-nums` on number columns.
- **Dialogs/Sheets/Popovers:** Escape closes. Click-outside closes. Focus returns to trigger.
- **Toasts:** Short and actionable. Cap count. Never stack forever.
- **Empty states:** Explain what this area is, show primary action, calm tone.
- **Loading:** Skeletons for tables/cards. Spinners for inline actions.

### Motion

`--motion-fast: 120ms` | `--motion-base: 180ms` | `--motion-slow: 240ms` | `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`. No bounce. No overshoot. Respect `prefers-reduced-motion`.

### Accessibility

Visible focus on all interactive elements. Label every input. Keyboard nav everywhere. WCAG AA contrast in both modes.

## Code Style

- TypeScript strict mode. No `any` types.
- ESLint flat config (`eslint.config.mjs`). Run `bun run lint` before committing.
- Tailwind CSS 4 with `@tailwindcss/postcss`. No `tailwind.config.js` needed; configure via CSS.
- Use `@/` path alias for imports from `src/`.
- Prefer named exports over default exports (except for pages/layouts).
- Components go in `src/components/`, with co-located tests in `src/__tests__/`.

## Testing

### Unit Tests (Vitest)

- **Runner:** Vitest (`bun run test`).
- **DOM:** jsdom via `vitest.config.ts`.
- **Setup:** `test/setup.vitest.ts` loads `@testing-library/jest-dom/vitest` matchers.
- **React rendering:** `@testing-library/react` for component tests.
- Tests live in `src/__tests__/` and follow `*.test.tsx` or `*.spec.tsx` naming.
- Path alias `@/` resolves to `src/` in tests.

### E2E Tests (Playwright)

- **Runner:** Playwright (`bun run test:e2e`).
- **Browser:** Chromium only (add Firefox/WebKit in `playwright.config.ts` if needed).
- **Base URL:** `http://localhost:3000` (dev server auto-started by Playwright).
- Tests live in `e2e/` and follow `*.spec.ts` naming.

### Test Coverage

- Run `bun run test:coverage` for V8-based coverage reports.
- Coverage output goes to `coverage/` (gitignored).

## Deployment

- **Platform:** Vercel (auto-deploys from main branch).
- **Build command:** `bun run build` (Turbopack).
- **Environment variables:** Managed in Vercel dashboard. Never commit secrets.

## Security

- Never print or commit secret values (API keys, tokens, connection strings).
- Use environment variables for all sensitive configuration.
- Always validate and sanitize user input on the server side.
- Use Supabase RLS (Row Level Security) for database access control.

<!-- BEGIN:nextjs-agent-rules -->

## Next.js: ALWAYS read docs before coding

Before any Next.js work, read the relevant skill in `.agents/skills/` for the topic you are working on. Your training data may be outdated. The skills are the source of truth.

### Next.js Quick Reference (App Router)

Route|File|Purpose
---|---|---
Page|`page.tsx`|UI for a route, makes route publicly accessible
Layout|`layout.tsx`|Shared UI wrapping child routes, preserves state
Loading|`loading.tsx`|Loading UI with Suspense boundary
Error|`error.tsx`|Error boundary for a route segment
Not Found|`not-found.tsx`|404 UI for a route
Template|`template.tsx`|Like layout but re-renders on navigation
Route Handler|`route.ts`|API endpoint (GET, POST, etc.)
Middleware|`middleware.ts`|Runs before requests, rewrites/redirects

### Server vs Client Components

```tsx
// Server Component (default) - runs on server, can be async
export default async function Page() {
  const data = await db.query(...)  // Direct data access
  return <div>{data.title}</div>
}

// Client Component - runs in browser
"use client"
export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Server Actions

```tsx
"use server"
export async function createItem(formData: FormData) {
  const title = formData.get("title") as string
  await db.insert({ title })
  revalidatePath("/items")
}
```

### Data Fetching

```tsx
// In Server Components - fetch directly (deduplicated and cached)
const data = await fetch("https://api.example.com/data")

// Dynamic data
export const dynamic = "force-dynamic"

// Revalidation
export const revalidate = 3600 // seconds
```

### Image and Font

```tsx
import Image from "next/image"
import { Geist } from "next/font/google"

const font = Geist({ subsets: ["latin"] })
<Image src="/photo.jpg" width={800} height={600} alt="Description" />
```

<!-- END:nextjs-agent-rules -->

## Skills

Skills are installed in `.agents/skills/`. They provide specialized, on-demand instructions for specific tasks. Before starting work on any topic below, read the relevant `SKILL.md` file.

### When to use skills

**Always check for a relevant skill before:**
- Creating or modifying React/Next.js components
- Setting up or modifying Supabase (auth, database, RLS, storage)
- Writing or modifying Tailwind CSS / shadcn/ui components
- Configuring Vercel deployment
- Sending emails via Resend
- Writing tests
- Designing UI/UX
- Working with TypeScript advanced patterns

### Core skills index (high-priority for this project)

| Skill | Path | Use when |
|-------|------|----------|
| Next.js Best Practices | `.agents/skills/next-best-practices/SKILL.md` | Any Next.js routing, rendering, or API work |
| Next.js Cache Components | `.agents/skills/next-cache-components/SKILL.md` | Caching, revalidation, ISR patterns |
| Vercel React Best Practices | `.agents/skills/vercel-react-best-practices/SKILL.md` | React component patterns, Server Components |
| Vercel Composition Patterns | `.agents/skills/vercel-composition-patterns/SKILL.md` | Component composition, data flow patterns |
| Web Design Guidelines | `.agents/skills/web-design-guidelines/SKILL.md` | Layout, typography, spacing, visual design |
| shadcn/ui | `.agents/skills/shadcn-ui/SKILL.md` | Adding or modifying UI components |
| Tailwind Design System | `.agents/skills/tailwind-design-system/SKILL.md` | Design tokens, color, spacing system |
| Tailwind CSS v4 | `.agents/skills/tailwindcss-fundamentals-v4/SKILL.md` | Tailwind CSS 4 specific patterns |
| Supabase + Next.js | `.agents/skills/supabase-nextjs/SKILL.md` | Supabase integration with Next.js |
| Supabase Postgres | `.agents/skills/supabase-postgres-best-practices/SKILL.md` | Database schema, queries, RLS |
| Supabase Auth (Next.js) | `.agents/skills/nextjs-supabase-auth/SKILL.md` | Authentication flows |
| Supabase Auth Config Audit | `.agents/skills/supabase-audit-auth-config/SKILL.md` | Security audit of auth configuration |
| Resend Email | `.agents/skills/resend/SKILL.md` | Sending emails via Resend |
| Email Best Practices | `.agents/skills/email-best-practices/SKILL.md` | Email templates, deliverability |
| Frontend Design | `.agents/skills/frontend-design/SKILL.md` | UI implementation patterns |
| Interface Design | `.agents/skills/interface-design/SKILL.md` | UX patterns, interaction design |
| UI/UX Pro Max | `.agents/skills/ui-ux-pro-max/SKILL.md` | Comprehensive UI/UX guidelines |
| React Doctor | `.agents/skills/react-doctor/SKILL.md` | React performance diagnostics |
| TypeScript Advanced Types | `.agents/skills/typescript-advanced-types/SKILL.md` | Complex type patterns |
| Interaction Design | `.agents/skills/interaction-design/SKILL.md` | Micro-interactions, animations |
| Turborepo | `.agents/skills/turborepo/SKILL.md` | Monorepo tooling (if needed) |
| Vitest | `.agents/skills/vitest/SKILL.md` | Test patterns and best practices |
| Find Skills | `.agents/skills/find-skills/SKILL.md` | Discover additional skills |
| Remotion | `.agents/skills/remotion-best-practices/SKILL.md` | Video generation with Remotion |
| Vercel Deploy | `.agents/skills/vercel-deploy-claimable/SKILL.md` | Vercel deployment configuration |

### Full skills directory

Over 1,300 skills are installed covering Next.js, React, Supabase, Tailwind, TypeScript, security, testing, deployment, and more. Run `ls .agents/skills/` to browse all available skills, or read `.agents/skills/find-skills/SKILL.md` for search guidance.

## Cursor Cloud specific instructions

- **Bun is the package manager.** The lockfile is `bun.lock`. Do not use npm/pnpm/yarn.
- After `bun install`, run `bun pm trust --all` if postinstall scripts are blocked (sharp, esbuild, unrs-resolver).
- **Turbopack is the default bundler** for `next dev` and `next build`. The `dev` script includes `--turbopack` explicitly.
- **Vitest** is the unit test runner (`bun run test`). Do not use `bun test` (the old Bun runner setup is still in `bunfig.toml` but Vitest is the standard).
- **Playwright** is the E2E test runner (`bun run test:e2e`). Only Chromium is installed; run `bunx playwright install` to add more browsers.
- **Turborepo** (`turbo.json`) caches lint/test/type-check/format tasks. Use `bunx turbo <task>` for cached runs.
- **Husky + lint-staged** run on pre-commit: ESLint fix + Prettier on staged `.ts/.tsx` files.
- ESLint uses flat config (`eslint.config.mjs`), not `.eslintrc`.
- Prettier config is in `.prettierrc` with the `prettier-plugin-tailwindcss` plugin for class sorting.
- Tailwind CSS 4 uses `@tailwindcss/postcss` (no `tailwind.config.js`; configure via CSS).
- Environment variables template is in `.env.example`. Copy to `.env.local` before running.
- Directories `src/components/`, `src/lib/`, `src/types/` are scaffolded and ready for use.
