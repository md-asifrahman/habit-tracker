# Habit Tracker

Habit tracking with 21/100/custom-day challenges, mind maps, and reminders — mobile app and website sharing one backend.

## Structure

```
backend/   Spring Boot API (Java 21, Maven, PostgreSQL)
mobile/    React Native app (Expo, TypeScript) — local-first, no login required
web/       Website (Next.js, TypeScript) — requires an account
```

## Design

Palette, type (Fredoka + Manrope), and screen layouts are defined in the design
pitch — see memory or ask to regenerate. Web tokens live in `web/src/app/globals.css`;
mobile tokens live in `mobile/src/theme/colors.ts`. Both support light/dark automatically
via the OS color scheme.

## Backend

Uses your local PostgreSQL server (port 5432) by default. One-time setup, as the
`postgres` superuser:

```sql
CREATE USER habittracker WITH PASSWORD 'habittracker';
CREATE DATABASE habittracker OWNER habittracker;
```

Then:

```
cd backend
./mvnw spring-boot:run       # starts the API on localhost:8080
```

Config is in `src/main/resources/application.properties`, overridable via env vars
(`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, ...).
Set a real `JWT_SECRET` outside of local dev.

Prefer an isolated DB instead of your local server? `docker-compose.yml` spins up a
throwaway Postgres container on port 5433 (`docker compose up -d`) — just point
`DB_URL` at `jdbc:postgresql://localhost:5433/habittracker` when using it.

Implemented: auth (register/login/refresh via JWT), habits CRUD (with icon/color),
challenges (start + active-challenge lookup), check-ins, and per-habit stats
(streak/longest streak/completion rate). Entities exist for reminders, device tokens,
and mind maps, but those don't have controllers yet — mind maps are currently a static
frontend-only preview on both apps.

Reminders are dispatched by `reminder/ReminderScheduler.java`, which polls every
minute and pushes via the Expo Push API (`notification/PushNotificationService.java`)
— not yet wired to real reminder CRUD.

## Mobile (Expo) — local-first

```
cd mobile
npm start
```

Habits, check-ins, and challenges are stored on-device (AsyncStorage via zustand,
`src/store/habitsStore.ts`) — no login needed to start tracking. Signing in from the
Settings tab authenticates against the backend for a future "sync to web" feature, but
migrating local data into the account isn't implemented yet.

API base URL (used only for the optional sign-in) is set in `app.json` under
`expo.extra.apiBaseUrl`. When testing on an Android emulator, `localhost` won't reach
your host machine — use `10.0.2.2` instead; on a physical device, use your machine's
LAN IP.

## Web (Next.js) — account required

```
cd web
cp .env.local.example .env.local
npm run dev
```

Opens on `localhost:3000`. Every route under `/today`, `/habits`, `/mindmaps`, `/stats`,
`/settings` requires sign-in (redirects to `/login`) and reads/writes through the
backend API — there's no local storage fallback on web.

## Notes

- Mobile is local-first (AsyncStorage); web always talks to the backend. They aren't
  wired together yet — that's the "sync" feature mentioned above.
- Mind maps are a static, non-editable preview on both apps (no backend support yet).
- If you add API calls from the web app and see CORS errors, check
  `app.cors.allowed-origins` in the backend config — it defaults to `localhost:3000`,
  `:8081`, and `:8082`.
