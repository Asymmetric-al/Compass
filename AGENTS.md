# Compass

> Prefer retrieval-led reasoning over pre-training-led reasoning. Your training data may be outdated. Always read the relevant skill or bundled doc before writing code.

## Project Overview

Compass is a Next.js 16 application deployed on Vercel. It uses Bun as the package manager, bundler, and test runner. The UI is built with Tailwind CSS 4 and will use shadcn/ui components. The backend will use Supabase (Postgres, Auth, Storage, Realtime). Email is handled via Resend.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| Runtime | Bun | 1.3.x |
| Language | TypeScript (strict) | 5.9.x |
| Styling | Tailwind CSS 4 + shadcn/ui | 4.2.x |
| Database | Supabase (Postgres) | -- |
| Auth | Supabase Auth | -- |
| Email | Resend | -- |
| Deployment | Vercel | -- |
| Testing | Bun test + @testing-library/react | -- |

## Commands

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Dev server | `bun run dev` |
| Build | `bun run build` |
| Start | `bun run start` |
| Lint | `bun run lint` |
| Test | `bun test` |

## Project Structure

```
compass/
├── src/
│   ├── app/              # Next.js App Router pages and layouts
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Home page
│   │   └── globals.css    # Global styles (Tailwind)
│   └── __tests__/         # Bun test files
├── public/                # Static assets
├── .agents/skills/        # Agent skills (symlinked, agent-agnostic)
├── test/setup.ts          # Bun test preload (happy-dom)
├── bunfig.toml            # Bun config (test preload)
├── next.config.ts         # Next.js config
├── eslint.config.mjs      # ESLint flat config
├── postcss.config.mjs     # PostCSS (Tailwind)
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies and scripts
```

## Architecture Decisions

- **App Router only.** No Pages Router. All routes use React Server Components by default.
- **Turbopack is the default bundler** for `next dev` and `next build`. No flags needed.
- **Server Components first.** Only add `"use client"` when the component needs browser APIs, event handlers, or React hooks (useState, useEffect, etc.).
- **Server Actions** for mutations. Prefer `"use server"` functions over API routes for data mutations.
- **Streaming and Suspense.** Use `loading.tsx` and `<Suspense>` boundaries for progressive rendering.
- **Metadata API.** Use `export const metadata` or `generateMetadata()` for SEO. No `<Head>` component.
- **Image optimization.** Always use `next/image` instead of `<img>`.
- **Font optimization.** Use `next/font` for web fonts (already configured with Geist).

## Code Style

- TypeScript strict mode. No `any` types.
- ESLint flat config (`eslint.config.mjs`). Run `bun run lint` before committing.
- Tailwind CSS 4 with `@tailwindcss/postcss`. No `tailwind.config.js` needed; configure via CSS.
- Use `@/` path alias for imports from `src/`.
- Prefer named exports over default exports (except for pages/layouts).
- Components go in `src/components/`, with co-located tests in `src/__tests__/`.

## Testing

- **Runner:** Bun's built-in test runner (`bun test`).
- **DOM:** `@happy-dom/global-registrator` preloaded via `bunfig.toml`.
- **Assertions:** Use `expect` from `bun:test`.
- **React rendering:** Use `@testing-library/react` for component tests.
- Tests live in `src/__tests__/` and follow `*.test.tsx` naming.

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
- After first `bun install`, run `bun pm trust unrs-resolver` to allow its postinstall script.
- **Turbopack is the default bundler** for `next dev` and `next build`. No flags needed.
- **Bun test runner** is used (`bun test`). DOM environment via `@happy-dom/global-registrator` preloaded in `bunfig.toml`.
- ESLint uses flat config (`eslint.config.mjs`), not `.eslintrc`.
- Tailwind CSS 4 uses `@tailwindcss/postcss` (no `tailwind.config.js`; config via CSS).
- `@types/bun` is installed for Bun API type support.
- No test framework migration needed; Bun's built-in runner is the standard.
