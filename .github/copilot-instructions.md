# Cultivate Focus - AI Coding Guide

## Philosophy

**"Action First, Organization Later"** — productivity as gentle cultivation, not a grind.

- **Friction-free start**: No mandatory sign-in, no planning wall. Write a task and start a timer instantly.
- **Guest-first design**: Full functionality works locally before auth; sessions sync when users choose to sign up.
- **Minimalism**: Every feature must justify its complexity. Prefer removing UI over adding toggles.
- **Calm aesthetics**: The interface should feel like a sanctuary, not a dashboard. Soft colors, subtle animations.
- **Reward all focus**: Quick timer sessions without a task are valid—every minute counts as growth.

When adding features, ask: "Does this let users focus faster, or does it add friction?"

## Architecture

Next.js 16 App Router + MongoDB Atlas. Data flows: `FocusContext` (client) ↔ REST API (`/api/*`) ↔ Mongoose → MongoDB.

**Core domains**: Tasks (focus goals), Sessions (logged focus periods earning points), Dashboard (stats/streaks).

**Provider hierarchy** in [app-providers.tsx](components/providers/app-providers.tsx):
```tsx
<ThemeProvider> → <AuthSessionProvider> → <FocusProvider> → <AppShell>
```

## API Route Pattern

All routes in `app/api/` must follow this structure:
```typescript
import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Types } from "mongoose";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "..." }, { status: 401 });
  }
  await connectToDatabase();
  const userObjectId = new Types.ObjectId(session.user.id);
  // Always scope queries by userId
}
```

## DTOs vs Documents

- **Documents** ([models/](models/)): Mongoose schemas with `InferSchemaType`, `_id` as ObjectId
- **DTOs** ([types/index.ts](types/index.ts)): Serialized JSON, `_id` as string, dates as ISO strings
- Each route defines local `serializeTask()`/`serializeSession()` helpers for conversion

## Client State - FocusContext

[context/focus-context.tsx](context/focus-context.tsx) provides dual-mode storage:
- **Guest mode**: localStorage (`cultivate-focus:tasks`, `cultivate-focus:sessions`)
- **Authenticated**: Syncs with API on auth state change via `useSession()`
- Uses `normalizeTask()`/`normalizeSession()` to handle legacy fields (e.g., `focusMinutes` → `focusMinutesGoal`)

## Styling

Use CSS variables from [globals.css](app/globals.css), NOT Tailwind color classes:
```tsx
className="bg-[var(--surface)] text-[var(--focus)]"  // ✓
className="bg-white text-emerald-400"                 // ✗
```

Key tokens: `--focus`/`--focus-soft` (emerald), `--break`/`--break-soft` (amber), `--surface`, `--muted`

## Auth

- NextAuth credentials provider with JWT strategy
- `getAuthSession()` wraps `getServerSession(authOptions)` - use this in API routes
- User ID: `session.user.id` (extended in [next-auth.d.ts](next-auth.d.ts))

## Commands

```bash
npm run dev     # localhost:3000
npm run lint    # ESLint
npm run build   # Production build (includes type checking)
```

## Env Variables

- `MONGODB_URI` - MongoDB Atlas connection string
- `AUTH_SECRET` - NextAuth JWT signing secret (`openssl rand -base64 32`)

## Conventions

- Files: kebab-case (`metric-card.tsx`), exports: PascalCase (`MetricCard`)
- Utilities in `lib/`: lowercase (`auth.ts`, `dates.ts`, `points.ts`)
- Models: singular (`task.ts`, `session.ts`, `user.ts`)
- Dates: ISO format `YYYY-MM-DD` strings, use helpers from [lib/dates.ts](lib/dates.ts)
