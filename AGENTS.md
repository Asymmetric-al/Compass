# Compass

## Cursor Cloud specific instructions

Next.js 16 app using **Bun** as the package manager, bundler, and test runner. Also uses Turbopack, TypeScript, Tailwind CSS 4, and ESLint (flat config).

### Key commands

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Dev server (Turbopack) | `bun run dev` |
| Production build | `bun run build` |
| Start production server | `bun run start` |
| Lint (ESLint) | `bun run lint` |
| Run tests | `bun test` |

### Non-obvious notes

- **Bun is the package manager.** The lockfile is `bun.lockb` (binary). Do not use npm/pnpm/yarn.
- After first `bun install`, run `bun pm trust unrs-resolver` to allow its postinstall script (needed by eslint-config-next).
- **Turbopack is the default bundler** for both `next dev` and `next build` in Next.js 16. No extra flags needed.
- **Bun's built-in test runner** is used (`bun test`). Tests live in `src/__tests__/`. The DOM environment is provided by `@happy-dom/global-registrator` via the preload in `bunfig.toml`.
- ESLint uses the flat config format (`eslint.config.mjs`), not `.eslintrc`.
- Tailwind CSS 4 uses `@tailwindcss/postcss` (no `tailwind.config.js` needed; config is via CSS).
- `@types/bun` is installed for Bun API type support in tests and scripts.
