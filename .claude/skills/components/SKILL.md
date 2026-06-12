---
name: components
description: Add and extend shadcn UI components in this repo (base-vega, @base-ui/react). Use when adding shadcn components, the CLI hangs or prompts to overwrite files, wiring dialogs, or handling action errors in the UI.
---

# Components (shadcn + base-ui)

Read `components.json` and `AGENTS.md` (UI section) first. Components live in `src/components/`, styled with Tailwind v4 via `cn()` from `@/utils/styling`.

## Adding a component

Use the shadcn CLI — do not hand-roll primitives.

```bash
pnpm dlx shadcn@latest add <component> -y
```

### CLI hangs on "Would you like to overwrite?"

`-y` skips the initial confirm, **not** the overwrite prompt when a registry dependency (e.g. `button`) already exists.

**Default (keep existing files):**

```bash
printf 'n\n' | pnpm dlx shadcn@latest add <component> -y
```

**Replace with shadcn's version:**

```bash
pnpm dlx shadcn@latest add <component> -y -o
```

Never run the CLI without a plan for this prompt — it blocks in non-interactive environments.

### `components.json` aliases

`ui` and `components` both map to `@/components`. That is intentional (flat layout, no `components/ui/` folder). It does **not** cause the overwrite prompt — dependencies do.

| Alias              | Path              |
| ------------------ | ----------------- |
| `components`, `ui` | `@/components`    |
| `utils`            | `@/utils/styling` |
| `lib`, `hooks`     | `@/utils`         |

Generated imports use `@/components/...` and `@/utils/styling`.

## Stack

- Style: `base-vega` — primitives from `@base-ui/react`, not Radix.
- Icons: `lucide-react` (`components.json` → `iconLibrary: lucide`).
- Existing hand-edited components (e.g. `button.tsx`) may differ from the registry; prefer **no overwrite** unless intentionally upgrading.

## Extending generated components

Append project-specific APIs **below** the shadcn exports in the same file when possible (see `src/components/dialog.tsx`):

- `DialogProvider` — mount in `src/app/layout.tsx` inside `ThemeProvider`
- `dialog(...)` — imperative API; throws if provider missing
- Re-run `shadcn add dialog -o` only if you intend to merge/regenerate — custom additions will be lost

After adding a component that needs a provider, wire it in `layout.tsx` immediately.

## Error UI in client forms

From `AGENTS.md`: `invalidInput` → inline field errors; everything else → dialog.

```tsx
import { showErrorDialog } from '@/components/error'

const result = await someAction(...)
if (!result.ok && result.err.type !== 'INVALID_INPUT') showErrorDialog(result.err)
```

`showErrorDialog` uses `getErrorContent` + imperative `dialog()`. Requires `DialogProvider` in the layout.

## Checklist

- [ ] Add via CLI with non-interactive overwrite handling
- [ ] Run `pnpm typecheck` after adding or extending
- [ ] Mount any required provider in `layout.tsx`
- [ ] Form actions: field errors inline, other errors via `showErrorDialog`
