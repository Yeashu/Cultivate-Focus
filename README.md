<div align="center">

# 🌿 Cultivate Focus

Mindful productivity app that turns focus sessions into a calm growth ritual.

</div>

## ✨ Stack

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

## 🔐 Authentication Flow

- Email/password accounts stored in MongoDB with bcrypt hashing.
- Registration lives at `/register`, sign-in at `/login`.
- Protected routes (`/`, `/timer`, `/tasks`, API endpoints) require authentication and automatically scope data to the signed-in user.
- Session management powered by NextAuth credential provider with JWT strategy.

## 📚 Features

- Focus Points system: log sessions tied to tasks, auto-earn points.
- Animated focus/break timer with custom durations and mindful chime.
- Task management: create, edit, complete, and track progress toward planned minutes.
- Growth dashboard with weekly trend chart and achievement stages.
- Responsive, accessibility-conscious UI with calm emerald + amber palette and dark mode toggle.

## 🧪 Testing & Quality

- `npm run lint` – static analysis powered by ESLint and Next.js defaults.
- (Upcoming) API integration tests can live under `tests/` using Next testing utilities.

## 📦 Deployment

1. Push to GitHub and import into [Vercel](https://vercel.com/).
2. Add `MONGODB_URI` in Vercel project settings.
3. Deploy – serverless API routes handle data access automatically.

## 🗺️ Project Structure Highlights

- `app/` – App Router pages (`/`, `/timer`, `/tasks`) and global layout.
- `app/api/` – RESTful endpoints for tasks and focus sessions.
- `context/` – React context powering shared state across routes.
- `models/` & `lib/` – Mongoose schemas and utilities (database, points, dates).
- `components/` – Layout shell, dashboard widgets, timer UI, and theming helpers.

## 🌈 Design Tokens

- Font: [Outfit](https://fonts.google.com/specimen/Outfit) for relaxed clarity.
- Focus palette: `#34d399` (light) / `#10b981` (dark).
- Break palette: `#fbbf24` (light) / `#f59e0b` (dark).
- Backgrounds: `#f1f5f9` light dove grey & `#0f172a` midnight navy.

Enjoy cultivating deep work, one mindful session at a time. ✨
