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

### Module Structure
```
lib/
├── serialize.ts       # Shared serializeTask() / serializeSession() + types
├── tasks.ts           # parseTaskInput(), isTaskGoalMet()
├── points.ts          # calculateFocusPoints(), calculateGrowthStage(), GROWTH_STAGES
├── stats.ts           # calculateStreak()
├── local-storage.ts   # Guest-mode persistence helpers
├── fetch-helpers.ts   # readJson<T>(), readErrorMessage()
├── dates.ts           # getTodayIso(), getPastDates(), formatDateLabel()
└── ...

hooks/
├── use-chime.ts         # Web Audio chime (standard + mindful bell)
└── use-notifications.ts # Browser notification + sound management

components/timer/
├── timer-display.tsx      # Circular progress ring + countdown
├── task-link-dropdown.tsx # Mid-flow task linking UI
├── completion-screen.tsx  # Post-session task assignment prompt
├── session-overview.tsx   # Sidebar session stats
└── recent-sessions.tsx    # Sidebar recent sessions list

context/
└── focus-context.tsx    # State management + selector hooks
```

### API Route Pattern
All `app/api/` routes must:
1. Validate session via `getAuthSession()`
2. Connect to DB via `connectToDatabase()`
3. Ensure all queries are scoped by `userId`
4. Use `NextResponse` for JSON returns
5. Use shared `serializeTask()` / `serializeSession()` from `lib/serialize.ts`

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
- **Conversion**: ALWAYS use `serializeTask()` / `serializeSession()` from `lib/serialize.ts` inside routes before returning data.

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
  - **Guest**: `localStorage` via helpers in `lib/local-storage.ts` (keys: `cultivate-focus:tasks`, etc.)
  - **Auth**: Syncs with API.
- **Optimization**: Optimistic updates are encouraged for immediate UI feedback.
- **Selector Hooks** — prefer these over the full `useFocus()`:
  - `useFocusData()`: Read-only data for dashboards (tasks, sessions, stats, loading, error)
  - `useTaskActions()`: Task CRUD for planners (tasks, createTask, updateTask, deleteTask, loading)
  - `useSessionActions()`: Session operations for timers (tasks, sessions, logSession, updateSession)
  - `useFocus()`: Full context — use only when a component genuinely needs everything.

### 4. Shared Domain Logic
- **Task completion**: Use `isTaskGoalMet()` from `lib/tasks.ts` — never inline the goal check.
- **Serialization**: Use `serializeTask()` / `serializeSession()` from `lib/serialize.ts` — never duplicate type coercion in routes.
- **Growth stages**: Use `calculateGrowthStage()` from `lib/points.ts`.
- **Streaks**: Use `calculateStreak()` from `lib/stats.ts`.

## Domain Logic

### Tasks
- **Scheduling**: `scheduledDate` is `YYYY-MM-DD` or `"someday"`.
- **Ordering**: Handled via `order` field (drag-and-drop).
- **Normalization**: Handle legacy `focusMinutes` field by mapping to `focusMinutesGoal`.
- **Completion**: Determined by `isTaskGoalMet()` — supports both `focusMinutesGoal` and legacy `focusMinutes`.

### Sessions & Points
- **Timer**: Can run without a task (`taskId: null`).
- **Points**: 1 min = 1 point.
- **Growth Stages**: Seed (0) → Sprout (60) → Sapling (150) → Bloom (300).

### Streaks
- Calculated via `calculateStreak()` in `lib/stats.ts`.
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
- **Hooks**: Custom hooks go in `hooks/` with `use-` prefix (e.g., `use-chime.ts`).
- **Timer sub-components**: Presentational components go in `components/timer/`; state lives in `app/timer/page.tsx`.
