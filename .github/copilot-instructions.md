# Cultivate Focus - AI Coding Guide

## Philosophy
**"Action First, Organization Later"** — productivity as gentle cultivation.
- **Friction-free**: No mandatory sign-in. Guest-first design.
- **Minimalism**: Remove UI rather than adding toggles.
- **Calm Aesthetics**: Soft colors, subtle animations (Framer Motion).
- **Growth**: Every focus minute counts, even without a task.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB Atlas via Mongoose
- **Auth**: NextAuth.js v4 (JWT strategy, Credentials provider)
- **Styling**: Tailwind CSS v4 (configured in CSS, usage via classes + CSS vars)
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Architecture
**Data Flow**: `FocusContext` (Client) ↔ `/api/*` (Server) ↔ Mongoose Models ↔ MongoDB

### Provider Hierarchy
`app/layout.tsx` wraps everything in:
```tsx
<ThemeProvider> → <AuthSessionProvider> → <FocusProvider> → <AppShell>
```

### API Route Pattern
All `app/api/` routes must:
1. Validate session via `getAuthSession()`
2. Connect to DB via `connectToDatabase()`
3. Ensure all queries are scoped by `userId`
4. Use `NextResponse` for JSON returns

```typescript
// Example Pattern
export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  
  await connectToDatabase();
  const userId = session.user.id;
  // ... db operations
}
```

## Critical Patterns

### 1. DTOs vs Documents
- **Mongoose Models** (`models/*.ts`): internal, `_id` is ObjectId.
- **DTOs** (`types/index.ts`): public API contract, `_id` is string, Dates are ISO strings.
- **Conversion**: ALWAYS use `serializeTask()` / `serializeSession()` helpers inside routes before returning data.

### 2. Styling System
- **Tailwind v4**: No `tailwind.config.js`. Theme is defined in `app/globals.css`.
- **Colors**: Use CSS variables for semantic theming.
  - Good: `bg-[var(--surface)] text-[var(--focus)]`
  - Bad: `bg-white text-emerald-400`
- **Key Tokens**:
  - `--focus`/`--focus-soft`: Primary action/success (Emerald)
  - `--break`/`--break-soft`: Rest periods (Amber)
  - `--surface`/`--muted`: Backgrounds and secondary text

### 3. Client State (FocusContext)
- Supports **Dual Mode**:
  - **Guest**: `localStorage` (keys: `cultivate-focus:tasks`, etc.)
  - **Auth**: Syncs with API.
- **Optimization**: Optimistic updates are encouraged for immediate UI feedback.

## Domain Logic

### Tasks
- **Scheduling**: `scheduledDate` is `YYYY-MM-DD` or `"someday"`.
- **Ordering**: Handled via `order` field (drag-and-drop).
- **Normalization**: Handle legacy `focusMinutes` field by mapping to `focusMinutesGoal`.

### Sessions & Points
- **Timer**: Can run without a task (`taskId: null`).
- **Points**: 1 min = 1 point.
- **Growth Stages**: Seed (0) → Sprout (60) → Sapling (150) → Bloom (300).

### Streaks
- Calculated in `FocusContext`.
- Requires ≥1 session per day to maintain.

## Development Workflows
- **Lint**: `npm run lint` handles ESLint.
- **Build**: `npm run build` serves as the primary type-checker.
- **Env**: `MONGODB_URI` and `AUTH_SECRET` are required.

## Conventions
- **Files**: kebab-case (`task-card.tsx`).
- **Exports**: PascalCase (`TaskCard`).
- **Imports**: Use `@/` alias for all internal imports.
- **Dates**: Use helpers in `lib/dates.ts` ensuring timezone consistency (ISO strings).
