# Cohortix Design Tokens

**Source of truth:** `apps/web/tailwind.config.ts`

All UI components MUST use these Tailwind tokens — never hardcode hex values.

## Color Tokens

### Core

| Token              | Hex       | Usage                           |
| ------------------ | --------- | ------------------------------- |
| `bg-background`    | `#0A0A0B` | Page backgrounds                |
| `text-foreground`  | `#FAFAFA` | Primary text                    |
| `bg-card`          | `#141416` | Card backgrounds                |
| `bg-card-elevated` | `#101012` | Elevated card/modal backgrounds |
| `border-border`    | `#27282D` | Borders, dividers               |
| `border-input`     | `#27282D` | Input borders                   |

### Brand / Interactive

| Token                     | Hex       | Usage                                 |
| ------------------------- | --------- | ------------------------------------- |
| `bg-primary`              | `#5E6AD2` | Primary buttons, active states, links |
| `bg-primary-hover`        | `#7C8ADE` | Primary button hover                  |
| `text-primary`            | `#5E6AD2` | Accent text, links                    |
| `text-primary-foreground` | `#FFFFFF` | Text on primary backgrounds           |
| `ring-ring`               | `#5E6AD2` | Focus rings                           |

### Secondary

| Token                       | Hex       | Usage                                |
| --------------------------- | --------- | ------------------------------------ |
| `bg-secondary`              | `#1E1F24` | Secondary buttons, hover backgrounds |
| `text-secondary-foreground` | `#A6A8AD` | Secondary text                       |

### Muted

| Token                   | Hex       | Usage                           |
| ----------------------- | --------- | ------------------------------- |
| `text-muted-foreground` | `#6E7079` | Placeholder text, hints, labels |
| `bg-muted`              | `#1E1F24` | Muted backgrounds               |

### Status

| Token              | Hex       | Usage                         |
| ------------------ | --------- | ----------------------------- |
| `text-destructive` | `#EF4444` | Errors, delete actions        |
| `text-success`     | `#10B981` | Success states, confirmations |
| `text-warning`     | `#F59E0B` | Warnings, caution states      |
| `text-info`        | `#3B82F6` | Informational highlights      |

## Rules

1. **Never use hardcoded hex values** in components — always use the token
   classes above
2. **For radial gradients** (CSS `style` prop), use HSL values from tokens:
   `hsl(235 58% 60%)` for primary
3. **For opacity variants**, use Tailwind opacity: `text-foreground/90`,
   `bg-primary/80`
4. **New status colors** must be added to `tailwind.config.ts` first, then used
   via tokens
5. **Dark mode is default** — this is a dark-first app. No light mode variants
   needed currently.

## Typography

| Class                     | Usage                      |
| ------------------------- | -------------------------- |
| `text-[13px] font-medium` | Sidebar nav items          |
| `text-sm`                 | Body text, descriptions    |
| `text-xs`                 | Hints, badges, status text |
| `text-base`               | Standard body              |
| `text-xl font-bold`       | Section headings           |
| `text-2xl font-bold`      | Page headings              |
| `text-3xl font-bold`      | Hero headings              |

## Spacing & Layout

| Token        | Value      | Usage                                   |
| ------------ | ---------- | --------------------------------------- |
| `rounded-lg` | `0.5rem`   | Cards, modals                           |
| `rounded-md` | `0.375rem` | Buttons, inputs                         |
| `rounded-sm` | `0.25rem`  | Small badges                            |
| `rounded-xl` | —          | Large cards (onboarding, access-denied) |

## Font Stack

- **Sans:** Inter, system-ui, sans-serif
- **Mono:** Fira Code, monospace
