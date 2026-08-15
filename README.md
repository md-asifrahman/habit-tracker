# Daily Challenge Tracker

Day-count challenges: pick a length, list the things you want to do every day, and tick
them off each night. Days score as a percentage, so partial days still count — and the
challenge ends with a report. Mobile app and website share one backend.

## Structure

```
backend/   Spring Boot API (Java 21, Maven, PostgreSQL)
mobile/    React Native app (Expo, TypeScript) — works fully offline, account optional
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

### Model

- `Challenge` — title, `durationDays`, start/end dates, status, and the reminder settings
  (`reminderTime`, `reminderSound`, `repeatEnabled`, `repeatEveryMin`).
- `ChallengeTask` — one line of the daily list.
- `DayLog` — one row per challenge per day, holding `completionPercent` /
  `completedCount` / `taskCount` snapshotted at save time.
- `DayTaskLog` — which individual tasks were ticked that day.

### Endpoints

```
GET    /api/challenges[?status=ACTIVE]
POST   /api/challenges                  create with a server-assigned id (web)
GET    /api/challenges/{id}
PUT    /api/challenges/{id}             create-or-replace under a caller-chosen id
POST   /api/challenges/{id}/abandon
DELETE /api/challenges/{id}
GET    /api/challenges/{id}/logs
GET    /api/challenges/{id}/logs/{date}
PUT    /api/challenges/{id}/logs        log a day (partial is fine; upserts by date)
GET    /api/challenges/{id}/report      averages, perfect days, day strip, per-task breakdown
```

### Timezone

A challenge is measured in days, so "today" has to mean the user's today. Clients send their zone
as an `X-Time-Zone` header and `common/RequestZone.java` resolves it (header → the zone stored on
the account at sign-in → UTC); nothing on the server calls a bare `LocalDate.now()`. Without this,
a user in UTC+6 logging after midnight gets told the day is still yesterday and the report's day
count disagrees with their phone.

### Ids and sync

Ids are assigned by the application, not generated on insert (`common/BaseEntity.java`), so a
challenge the phone created offline keeps the same id once it syncs — no id remapping anywhere.
`PUT /api/challenges/{id}` is what the mobile client pushes and what the web edit screen saves.
Both responses carry `updatedAt`, which is the tie-breaker when the same record changed in two
places.

Deleting a challenge takes its day logs with it, and dropping a task takes that task's ticks on
already-logged days — both cascade at the JPA level.

Days that were never logged count as 0% in the report's average, so the number reflects
the whole challenge rather than only the days you showed up for.

The schema is exactly five tables: `users`, `challenges`, `challenge_tasks`, `day_logs`,
`day_task_logs`. `ddl-auto=update` never drops anything, so a database created before challenges
became the only unit still carries the old habit/mind-map tables. Clear them with:

```
psql "$DB_URL" -f src/main/resources/db/drop-legacy-tables.sql
```

## Mobile (Expo) — local-first

```
cd mobile
npm start
```

Challenges and day logs are stored on-device (AsyncStorage via zustand,
`src/store/challengesStore.ts`). Every screen reads local state, so the app is fully usable
with no account and no internet — like any offline app on your phone.

### Signing in

Access tokens last 15 minutes. Both API clients renew them on their own: a 401/403 triggers one
shared refresh (parallel requests wait on it rather than each firing their own) and the request is
retried. Only a rejected *refresh* token signs you out — a network failure never does, since being
offline is normal here.

### Sync (only when signed in)

Signing in from the Settings tab turns on two-way sync with the backend
(`src/sync/syncService.ts`), so the same challenges can be edited from the phone *and* the
website. It runs at launch, whenever the app returns to the foreground, and right after any
local edit.

- The device stays the source of truth for the UI. Sync is a reconcile on top, never a gate.
- Per challenge and per day log, whichever side has the newer `updatedAt` wins.
- Ids are minted on the device (`uuid()` in `src/store/id.ts`) and accepted by the server, so a
  challenge created on a plane syncs under the id it already had.
- Deletes are remembered as tombstones (`deletedIds`) until the server confirms them, otherwise
  the next pull would just hand the challenge back.
- Any failure — no signal, server down, expired token — is reported as "offline" and changes
  nothing locally. Settings shows the last sync time and a **Sync now** button.

Signing out leaves all local data in place; the app simply goes back to being device-only.

Adding a challenge is a three-step flow (`src/screens/AddChallengeScreen.tsx`): setup
(name, length, reminder time, sound, repeat-if-missed), the daily task list, then a
summary you confirm before saving.

### Building an installable APK

Profiles live in `mobile/eas.json`. The `preview` profile builds an **offline, arm64-only APK**
for sideloading onto your own phone — no account, no server, nothing leaves the device.

`eas-cli` is a devDependency of `mobile/`, so `npx eas` resolves it (note: the *package* is
`eas-cli`, the *command* is `eas` — `npx eas` only works because it's installed here).

```
cd mobile
npm install                                # if you haven't since pulling
npx eas login                              # once, free Expo account
npx eas init                               # once, links this repo to an EAS project
npx eas build -p android --profile preview
```

Note that `eas.json` must be strict JSON — the EAS schema rejects unknown keys, so `"//"` comment
entries are not allowed in it. Keep explanations here instead.

You get a download link and a QR code; open it on the phone and install (Android will ask you to
allow installing from that source). Nothing is installed on your Mac — Expo's servers hold the
~2 GB Android NDK toolchain that a React Native build needs.

Prefer to build locally instead? You need the Android SDK + NDK (~2-3 GB), then:

```
cd mobile
npx expo prebuild -p android
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
# -> app/build/outputs/apk/release/app-release.apk
```

Size: the app's own compiled code is about 3.5 MB (2.95 MB JS bundle + 0.5 MB icons); the rest of
the APK is the React Native runtime and Hermes engine, per CPU architecture. arm64-only lands
around 25-30 MB. The Play Store `production` profile builds an AAB instead, which Google splits
per device so users download roughly 20-25 MB.

### Reminders

All on-device (`src/notifications/reminders.ts`) — nothing is pushed from the server.
Each active challenge schedules one repeating daily notification at its reminder time,
plus up to four "you haven't logged today" follow-ups spaced `repeatEveryMin` apart,
armed a week ahead for days that aren't logged yet. `syncAllReminders()` cancels and
re-arms everything; it runs on app open, on create/edit, and right after a day is logged.

Sound is the phone's own notification sound or nothing at all — there are no bundled audio
files. That means it works in Expo Go with no development build, it's the sound the user already
picked for their device, and it obeys Do Not Disturb and per-app sound settings. On Android the
sound belongs to the notification *channel* rather than the notification, so "Silent" schedules
onto a separate soundless channel; on iOS it's set per notification.

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

Opens on `localhost:3000`. Every route under `/today`, `/challenges`, `/settings`
requires sign-in (redirects to `/login`) and reads/writes through the backend API —
there's no local storage fallback on web.

`/today` is the checklist (with "Select all" and a live percentage), `/challenges` lists past
and running challenges, `/challenges/new` and `/challenges/[id]/edit` share the same three-step
flow as mobile (`src/components/ChallengeForm.tsx`), and `/challenges/[id]` is the report.

Full CRUD, same as the app — a signed-in user can work from either side. The one thing edit
won't change is the challenge's length or start date: days already logged are anchored to them.
Reminders never fire in the browser; the settings shown there describe what the phone will do.

## Security

### Before you deploy the backend anywhere

1. **Set `JWT_SECRET`.** There is deliberately no default. Unset, the server generates a random
   key per run (fine locally, signs everyone out on restart). Generate one with
   `openssl rand -base64 48`. It must be at least 32 bytes or the app refuses to start.
2. **Terminate TLS.** The API must be reachable only over HTTPS. Passwords and bearer tokens are
   in every request; over plain HTTP anyone on the same network can read and reuse them.
3. **Set `DDL_AUTO=validate`** so a schema mismatch is an error, not an automatic migration.
4. **Set `CORS_ALLOWED_ORIGINS`** to your website's origin only.
5. **Use a real database password** — `DB_PASSWORD` defaults to a dev value.

### How auth works

Access tokens (15 min) authenticate API calls; refresh tokens (7 days) may only be exchanged at
`/api/auth/refresh`. The two are not interchangeable — the token's `type` claim is checked on
every request, so a stolen refresh token can't be used to read data and an access token can't be
replayed to renew itself.

Every token also carries a `ver` claim matching the account's `tokenVersion`.
`POST /api/auth/logout-all` increments that version, which instantly invalidates every token
already issued — the remedy for a lost or stolen phone. It's exposed as "Sign out on all devices"
in both apps' settings.

### On the phone

Auth tokens live in the iOS Keychain / Android Keystore via `expo-secure-store`, not in
AsyncStorage — AsyncStorage is an unencrypted file that a rooted device or a backup can hand over.
Android backups are disabled (`allowBackup: false`) and cleartext HTTP is blocked
(`usesCleartextTraffic: false`). A release build refuses to start against a non-HTTPS API URL; set
`EXPO_PUBLIC_API_BASE_URL` (see `mobile/.env.example`).

Note that `usesCleartextTraffic: false` also blocks plain HTTP in development. For a device or
emulator pointed at your dev machine, either run the API behind HTTPS or flip that flag locally
while developing.

### Known limitations — decide if you accept these

- **No rate limiting on sign-in.** Nothing slows down password guessing. Put your reverse proxy
  or API gateway in front of `/api/auth/*` before this is public.
- **The website keeps tokens in `localStorage`**, which any XSS on the site could read. There is
  no `dangerouslySetInnerHTML` or equivalent sink in the app today, but httpOnly cookies would be
  the sturdier design if the site grows.
- **Registration reveals whether an email already has an account** (needed for a usable signup).
- **No email verification or password reset**, so there's no recovery path and no proof an address
  belongs to the person signing up.
- **Password rule is 8 characters, nothing else.** Consider checking against a breached-password
  list.

### Before submitting to Play Store

- Set `android.package` and `versionCode` (done: `com.ctrends.habittracker`, `1`) — the package
  name can never change once published.
- Build with EAS and let Google manage the signing key, or keep your upload key backed up
  somewhere you won't lose it. Losing it means you cannot update the app.
- Publish a privacy policy URL and fill in the Data safety form. This app collects an email
  address, a name, and the user's habit data, and it stores them on your server.
- The notification permission prompt appears on first launch; Android 13+ requires
  `POST_NOTIFICATIONS`, which the expo-notifications plugin adds for you.

## Notes

- No account: mobile only, everything on-device. With an account: the phone and the website
  stay in sync, and the phone still works offline in between.
- Habits-as-a-standalone-thing and mind maps were removed: a challenge is the only unit
  now, and its tasks are the list you tick off.
- If you add API calls from the web app and see CORS errors, check
  `app.cors.allowed-origins` in the backend config — it defaults to `localhost:3000`,
  `:8081`, and `:8082`.
