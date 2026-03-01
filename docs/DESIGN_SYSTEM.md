# Maia Design System

The single source of truth for Compass UI/UX. Every component, page, and interaction must follow this spec. No exceptions.

## Core Principles

1. **Calm, predictable, fast.** Clean and breathable, not empty.
2. **Bold hierarchy for quick scanning.** Size, weight, spacing, then color — in that order.
3. **One product feel.** Every screen looks like it belongs to the same application.
4. **Tokens only.** Components use `bg-background`, `text-foreground`, `border-border`, `ring-ring`. Never hardcoded `zinc-*` in component files.
5. **Both modes designed.** Dark mode switches CSS variables. Components never add `dark:` overrides.

## Component Library

**shadcn/ui exclusively.** New York style, Zinc base, CSS variables. No mixed component libraries. Every UI element comes from shadcn or is built with shadcn primitives.

Install components: `bunx shadcn@latest add <component>`

## Typography

### Fonts

| Font | Usage |
|------|-------|
| **Inter** | All UI text. Set as `font-sans` in CSS theme. |
| **Geist Mono** | IDs, tokens, code, logs, number-heavy columns, metrics, hashes. Use `font-mono`. |

Use Geist Mono when the user might copy a value, compare digits, or scan repeated patterns. Keep it rare and intentional.

### Type Scale

| Element | Classes |
|---------|---------|
| Page title | `text-3xl font-semibold tracking-tight` |
| Page subtitle | `text-sm text-muted-foreground` |
| Section title | `text-base font-semibold` |
| Card title | `text-sm font-semibold` or `text-base font-semibold` |
| Body | `text-sm` |
| Muted support | `text-xs text-muted-foreground` or `text-sm text-muted-foreground` |
| Labels | `text-xs font-medium` |
| Table header | `text-xs font-medium` |

**Casing:** Sentence case by default. ALL CAPS only for short titles (1-2 words).

**Tabular figures:** Add `tabular-nums` anywhere users compare numbers — tables, KPIs, totals, chart axes.

## Color System (Zinc Palette)

Zinc is structure. Accent colors are for meaning only (status, warnings, success) — never decoration.

### Light Mode

| Layer | Token | Zinc Value | Usage |
|-------|-------|------------|-------|
| Page canvas | `bg-background` | zinc-50 | App background |
| Cards/panels | `bg-card` | white | Elevated surfaces |
| Hover fill | `bg-secondary` | zinc-100 | Hover rows, selected items |
| Default border | `border-border` | zinc-200 | Cards, inputs, tables |
| Primary text | `text-foreground` | zinc-950 | Titles, main content |
| Secondary text | — | zinc-700 | Body meta, timestamps |
| Muted text | `text-muted-foreground` | zinc-500 | Helper text, labels |
| Primary button | `bg-primary text-primary-foreground` | zinc-950 / zinc-50 | Main CTA |

### Dark Mode

| Layer | Token | Zinc Value | Usage |
|-------|-------|------------|-------|
| Page canvas | `bg-background` | zinc-950 | App background |
| Cards/panels | `bg-card` | zinc-900 | Elevated surfaces |
| Hover fill | `bg-secondary` | zinc-800 | Hover rows, selected items |
| Default border | `border-border` | zinc-800 | Cards, inputs, tables |
| Primary text | `text-foreground` | zinc-50 | Titles, main content |
| Muted text | `text-muted-foreground` | zinc-400 | Helper text, labels |
| Primary button | `bg-primary text-primary-foreground` | zinc-50 / zinc-950 | Main CTA |

## Layout

### Page Structure

Every page follows the same rhythm:

```
┌─────────────────────────────────────────────────────┐
│ Header Row                                           │
│   Left: title + optional breadcrumb + subtitle       │
│   Right: primary action group                        │
├─────────────────────────────────────────────────────┤
│ Controls Row                                         │
│   Search, filters, view toggles, quick counts        │
│   One row when possible                              │
├─────────────────────────────────────────────────────┤
│ Content Area                                         │
│   Cards for groups of controls                       │
│   Tables inside card containers                      │
│   Sticky headers for scrollable tables               │
└─────────────────────────────────────────────────────┘
```

### Spacing System

Use these and only these:

| Context | Scale |
|---------|-------|
| Major section gaps | `gap-6` to `gap-8` |
| Card padding | `p-4` to `p-6` |
| Form field spacing | `space-y-4` |
| Inline element spacing | `gap-2` to `gap-3` |

No one-off values. If a spacing need arises, pick the nearest value from this scale.

## Component Standards

### Buttons

Variants: `default` (primary), `secondary`, `outline`, `ghost`, `destructive`.

- Each page gets one clear primary action.
- Consistent heights across the product.
- Small buttons for row actions. Normal size for page actions.

### Forms

- Labels always visible.
- Helper/error text directly under the field.
- Group fields in cards or with subtle separators.
- Validation is inline, near the field — use destructive tokens.
- Avoid tabs inside tabs.

### Tables

- Always inside a card container.
- Header row: muted surface, not bold outlines.
- Hover: subtle surface step.
- Selected rows: clearly different, even in dense tables.
- Bulk actions: show a bar when rows are selected.

### Dialogs, Sheets, Popovers

- **Dialog:** Confirms and short forms.
- **Sheet:** Secondary flows, mobile nav.
- **Popover:** Short contextual choices.
- Escape closes. Click outside closes. Focus returns to trigger.

### Toasts

- Short and actionable.
- Success: confirm what happened. Error: what failed + next step.
- Cap toast count. Never stack forever.

## States

### Empty States

Every empty state must: explain what this area is, show the primary action, stay calm in tone.

### Loading States

- Skeletons for tables and cards (layout-preserving).
- Spinners for small inline actions.

### Validation

- Inline, close to the field.
- Use destructive tokens. Never custom reds in components.

## Motion

Motion clarifies, it does not entertain.

### Timing Tokens

| Token | Value |
|-------|-------|
| `--motion-fast` | 120ms |
| `--motion-base` | 180ms |
| `--motion-slow` | 240ms |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` |

### Where Motion Belongs

- Dialog/sheet open and close
- Dropdown/popover open and close
- Toast entrance
- Accordion expand/collapse
- Hover transitions (background, border)

### Where Motion Does Not Belong

- Long page transitions
- Bounce or overshoot
- Anything that delays interaction

### Reduced Motion

If `prefers-reduced-motion` is set, remove transforms and shorten transitions. This is handled globally in `globals.css`.

## Accessibility

Non-negotiable requirements:

- Visible focus ring on every interactive element.
- Correct `<label>` associations for all inputs.
- Full keyboard support: nav, tables, dialogs, selects, popovers.
- Contrast that meets WCAG AA in both light and dark.

## Quick Class Recipes

### Page Header

```tsx
<div className="flex items-start justify-between gap-6">
  <div className="space-y-1">
    <h1 className="text-3xl font-semibold tracking-tight">Page Title</h1>
    <p className="text-sm text-muted-foreground">
      Page description goes here.
    </p>
  </div>
  <div className="flex items-center gap-2">
    {/* primary actions */}
  </div>
</div>
```

### Section Header

```tsx
<h2 className="text-base font-semibold">Section Title</h2>
```

### Muted Label

```tsx
<span className="text-xs font-medium text-muted-foreground">Label</span>
```

### ID / Token Display

```tsx
<span className="font-mono text-xs tabular-nums">usr_9f31a2…c81d</span>
```

### Metric

```tsx
<div className="text-2xl font-semibold tabular-nums">12,480</div>
```

## PR Review Checklist

### Theme and Tokens

- [ ] Components use semantic classes (`bg-background`, `text-foreground`, `border-border`, `ring-ring`)
- [ ] No `zinc-*` classes inside component files
- [ ] Maia variables define light and dark; components do not add theme overrides
- [ ] Sidebar uses sidebar tokens, not custom values

### Typography

- [ ] Inter is the default font everywhere
- [ ] Geist Mono only for code, IDs, and number-heavy UI
- [ ] Page title uses the approved scale
- [ ] Tables and metrics use `tabular-nums`

### Color and Zinc

- [ ] Text uses 3-level hierarchy (primary, secondary, muted)
- [ ] Borders stay quiet; no heavy outlines
- [ ] Hover/selected states use subtle surface steps
- [ ] Accent colors show meaning, not decoration

### Layout and Spacing

- [ ] Page follows header → controls → content rhythm
- [ ] Spacing uses the shared scale; no one-off values
- [ ] Cards use consistent padding and borders
- [ ] Primary action in same position across pages

### Components

- [ ] Button variants limited and consistent
- [ ] Labels visible; errors near fields
- [ ] Tables in cards; header readable; hover subtle
- [ ] Dialog/sheet/popover behavior correct (escape, click-outside, focus-return)

### States and UX

- [ ] Empty states intentional with next action
- [ ] Loading states match layout (skeletons)
- [ ] Toasts short; no infinite stacking

### Accessibility

- [ ] Focus visible on all interactive elements
- [ ] Keyboard navigation works everywhere
- [ ] Contrast readable in light and dark
