<div align="center">

# 🌿 Cultivate Focus

**"Action First, Organization Later"**

A mindful productivity app that treats focus as gentle cultivation, not a grind.

</div>

## ✨ Philosophy

Most productivity tools demand tedious sign-ins and complex planning before you can start working. Cultivate Focus removes that friction—write a task, start a timer, enter flow state instantly.

- **No planning wall**: Jump straight into focus mode, organize later
- **Guest-first**: Full functionality works locally; sync when you're ready
- **Minimalism**: Every feature must justify its complexity
- **Reward all focus**: Quick sessions without a task are valid—every minute grows your garden

## 🛠 Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4 + custom Outfit typography
- MongoDB Atlas with Mongoose models
- Framer Motion for micro-interactions
- Lucide icons + Next Themes for dark/light mode

## 🚀 Getting Started

```bash
npm install
cp .env.local.example .env.local
# update MONGODB_URI and AUTH_SECRET in .env.local
npm run dev
```

Visit `http://localhost:3000` to explore the dashboard, focus timer, and task manager.

## 🔧 Environment

`MONGODB_URI` must point to a MongoDB Atlas cluster or compatible instance. The connection is established lazily and cached across requests.

`AUTH_SECRET` should be a long random string (e.g. output from `openssl rand -base64 32`) and is used by NextAuth to sign JWTs and sessions.

## 🔐 Authentication

- **Guest mode**: Full functionality works locally using localStorage—no sign-in required
- **Optional accounts**: Email/password with bcrypt hashing, stored in MongoDB
- **Seamless sync**: Guest data persists; signing up syncs to cloud automatically
- Routes: `/register` for sign-up, `/login` for sign-in
- Session management: NextAuth credentials provider with JWT strategy

## 📚 Features

- **Focus Timer** (`/timer`): Pomodoro-style timer with focus/break modes, mindful chimes (layered bell for deep 25+ min sessions), and optional task linking
- **Weekly Planner** (`/tasks`): Drag-and-drop week view with day columns + "Someday" horizon for unscheduled tasks
- **Growth Dashboard** (`/`): Daily stats, weekly trend chart, and plant lifecycle visualization
- **Focus Points**: Earn 1 point per minute of focus—every session counts, with or without a task
- **Plant Growth Stages**: Seed → Sprout → Sapling → Bloom based on total focus points earned
- **Garden Streak**: Track consecutive days with focus sessions, displayed as weekly leaves
- **Dark/Light Mode**: Calm emerald + amber palette with theme toggle

## 🧪 Quality

```bash
npm run lint    # ESLint
npm run build   # Production build (includes TypeScript checking)
```

## 📦 Deployment

1. Push to GitHub and import into [Vercel](https://vercel.com/)
2. Add `MONGODB_URI` and `AUTH_SECRET` in Vercel environment settings
3. Deploy—serverless API routes handle data access automatically

## 🗺️ Project Structure

```
app/
  page.tsx              # Dashboard with stats, plant growth, streak
  timer/page.tsx        # Focus/break timer with task linking
  tasks/page.tsx        # Weekly planner view
  api/                  # REST endpoints (tasks, sessions, auth)
components/
  dashboard/            # PlantLifecycle, GardenStreak, WeeklyTrend
  planner/              # WeeklyPlanner, DayColumn, SomedayHorizon
  layout/               # AppShell, ThemeToggle, UserMenu
  providers/            # ThemeProvider, AuthSessionProvider, FocusProvider
context/
  focus-context.tsx     # Dual-mode state (localStorage + API sync)
models/                 # Mongoose schemas (Task, Session, User)
lib/                    # Utilities (auth, mongodb, dates, points)
types/                  # DTO interfaces
```

## 🌈 Design Tokens

- **Font**: [Outfit](https://fonts.google.com/specimen/Outfit) for relaxed clarity
- **Focus**: `--focus` emerald (#34d399 light / #10b981 dark)
- **Break**: `--break` amber (#fbbf24 light / #f59e0b dark)
- **Backgrounds**: Light dove grey (#f1f5f9) / Midnight navy (#0f172a)

---

<div align="center">

Enjoy cultivating deep work, one mindful session at a time. 🌱

</div>
