# Cohortix Web Application

The main web application for Cohortix - Your AI crew, ready for action.

## Getting Started

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Run the development server:**

   ```bash
   pnpm dev
   ```

4. **Open your browser:** Navigate to
   [http://localhost:3000](http://localhost:3000)

## Mission Control Dashboard

The Mission Control dashboard (`/`) provides an overview of your ecosystem:

- **KPI Cards:** Total Members, Active Rate, Retention, MRR with sparkline
  charts
- **Engagement Velocity:** Interactive chart showing member activity over time
- **Recent Activity:** Live feed of system events and user actions
- **Urgent Alerts:** Critical notifications requiring attention

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS, Lucide Icons
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Type Safety:** TypeScript with strict mode
- **State Management:** Zustand, TanStack Query

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   └── page.tsx        # Mission Control page
│   ├── sign-in/            # Authentication
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── kpi-cards.tsx
│   │   ├── engagement-chart.tsx
│   │   ├── recent-activity.tsx
│   │   └── urgent-alerts.tsx
│   └── ui/                 # Reusable UI components
│       └── sparkline.tsx
└── lib/
    └── utils.ts            # Utility functions
```

## Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript compiler
pnpm test             # Run tests
pnpm test:e2e         # Run E2E tests

# Database
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio
```

## Design Tokens

The application uses a Linear.app-inspired dark aesthetic:

- **Background:** `#0A0A0B` (Deep black)
- **Card Background:** `#141416` (Slightly lighter)
- **Primary Accent:** `#5E6AD2` (Blue-violet)
- **Border:** `#27282D` (Subtle gray)
- **Text:** `#FAFAFA` (Near white)
- **Muted Text:** `#6E7079` (Gray)

## Authentication

The dashboard is protected by Supabase authentication. Users must sign in to
access the Mission Control page. Authentication state is managed via middleware
and server-side checks.

## Real-time Updates

Components can subscribe to real-time updates using Supabase Realtime:

- Activity feed updates live
- Alert notifications appear instantly
- KPI metrics refresh automatically

## Contributing

See the main [CLAUDE.md](../../CLAUDE.md) file for development conventions and
guidelines.
