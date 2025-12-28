# Cultivate Focus - AI Coding Guide

## Architecture Overview

Next.js 16 App Router with MongoDB Atlas backend. Three core domains:
- **Tasks** - User-created focus goals with target minutes
- **Sessions** - Logged focus periods linked to tasks, earning points
- **Dashboard** - Stats aggregation and weekly progress visualization

Data flow: `FocusContext` (client) ↔ REST API routes (`/api/*`) ↔ Mongoose models → MongoDB

## Key Patterns

### API Route Structure
All routes in `app/api/` follow this pattern:
```typescript
import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "..." }, { status: 401 });
  }
  await connectToDatabase();
  // Query with userId filter for data scoping
}
```
Always scope queries by `userId` from session. Use `Types.ObjectId` for Mongoose queries.

### DTOs vs Documents
- **Documents** (`models/*.ts`): Mongoose schemas with `InferSchemaType`, `_id` as ObjectId
- **DTOs** (`types/index.ts`): Serialized JSON with `_id` as string, dates as ISO strings
- Convert with `serializeTask()`/`serializeSession()` helper functions in each route

### Client State Management
`FocusContext` (`context/focus-context.tsx`) provides:
- Dual-mode storage: localStorage for guests, API for authenticated users
- Automatic sync on auth state change via `useSession()`
- Normalized data with `normalizeTask()`/`normalizeSession()` helpers

### Provider Hierarchy
```tsx
<ThemeProvider>        // next-themes
  <AuthSessionProvider> // NextAuth SessionProvider
    <FocusProvider>     // App state
      <AppShell>        // Layout + navigation
```

## Styling Conventions

CSS variables defined in `app/globals.css` - use `var(--token)` not Tailwind colors:
- `--focus` / `--focus-soft` for primary actions (emerald)
- `--break` / `--break-soft` for break mode (amber)
- `--surface`, `--surface-muted` for cards/backgrounds
- `--muted` for secondary text

Components use inline Tailwind with CSS variable references:
```tsx
className="bg-[var(--surface)] text-[var(--focus)]"
```

## Auth Flow

- NextAuth with credentials provider, JWT strategy
- `getAuthSession()` helper wraps `getServerSession(authOptions)`
- User ID available as `session.user.id` (extended in `next-auth.d.ts`)
- Protected pages redirect via NextAuth `pages.signIn: "/login"`

## Commands

```bash
npm run dev     # Start dev server at localhost:3000
npm run lint    # ESLint check
npm run build   # Production build (runs type checking)
```

## Environment Variables

- `MONGODB_URI` - MongoDB Atlas connection string
- `AUTH_SECRET` - NextAuth signing secret (generate with `openssl rand -base64 32`)

## File Naming

- React components: PascalCase (`MetricCard.tsx` pattern, but currently kebab-case files)
- Utilities in `lib/`: lowercase (`auth.ts`, `mongodb.ts`, `points.ts`, `dates.ts`)
- Models: singular noun (`user.ts`, `task.ts`, `session.ts`)
