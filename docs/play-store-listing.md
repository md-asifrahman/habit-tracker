# Play Store listing

Copy for the Play Console listing, plus the reasoning behind it.

Google Play has **no keyword field**. Search only indexes the title, short description and
full description, so every keyword has to earn its place in readable copy.

| Field | Limit |
|---|---|
| App title | 30 characters |
| Short description | 80 characters |
| Full description | 4,000 characters (~252 shown before "Read more") |

## The strategy

We cannot win "habit tracker". That term is owned by apps with millions of installs and years
of reviews — Habitica, Streaks, Loop, HabitNow, Done. Ranking there is not a copywriting
problem, it is an install-volume problem.

What we can win is the long tail this app is actually built for:

- `21 day challenge`, `30 day challenge`, `75 day challenge`, `100 day challenge`
- `challenge tracker`, `daily challenge app`
- `offline habit tracker`, `habit tracker no account`
- `daily checklist`, `routine tracker`

These have far less competition and much higher intent — somebody searching "21 day challenge"
wants exactly this app, not a general habit tracker.

The four genuine differentiators, which the copy leans on:

1. **Partial credit.** Days score as a percentage, not pass/fail. Almost every competitor is
   binary — miss one item and the whole day is a failure.
2. **Rest days.** Planned days off don't break streaks or drag the average down.
3. **Works offline with no account.** No sign-up wall, no data leaving the phone.
4. **An end-of-challenge report.** Average completion, perfect days, per-task breakdown.

## Title — 30 characters

**Play Console listing title:** `Daily Challenge Tracker` (23)

**Launcher label on the phone:** `Challenges` (set in `mobile/app.json`)

These are deliberately different. The store title is entered in Play Console and carries the
keywords; the launcher label lives in the APK and only has to survive a home screen, where
Android truncates at roughly 10-12 characters. "Daily Challenge Tracker" under an icon becomes
"Daily Challen…".

Alternatives:

- `21 Day Challenge Tracker` (24) — narrower, ranks harder for one high-intent term, but looks
  wrong to someone running 100 days.
- `Challenge Tracker: Streaks` (26) — adds "streaks", loses "daily".

Avoid "Habit Tracker" in the title. It's the most contested phrase in the category and spends
your highest-weighted field on a term you cannot rank for.

## Short description — 80 characters

**Recommended** (75):

```
Run 21, 30 or 100-day challenges. Tick your daily list. Rest days included.
```

Alternatives:

```
Pick your days. List your habits. Tick them off nightly. Partial days count.  (76)
Offline challenge tracker: daily checklist, rest days, streaks, no account.   (74)
```

## Full description

The first ~252 characters are all most people see, so the hook and the main keywords sit there.

```
Pick how many days. List the things you want to do each day. Tick them off every night and
watch your progress build.

Daily Challenge Tracker is a challenge tracker for 21-day, 30-day, 75-day and 100-day
challenges — and any custom length you want.

WHY THIS ONE IS DIFFERENT

Most habit trackers are all-or-nothing. Miss one item and the whole day is a failure. Here
every day scores as a percentage, so doing four things out of five still counts for
something. Progress, not perfection.

REST DAYS THAT ACTUALLY REST
Choose the weekdays your challenge takes off. No reminder fires, and rest days never count
against you — they don't break your streak and they don't drag your average down. Perfect for
gym routines, weekday habits and 6-day-a-week plans.

WORKS COMPLETELY OFFLINE
No account. No sign-up. No internet. Everything stays on your phone. Create an account only
if you want to sync with the website.

WHAT YOU GET

• Custom challenge lengths — 21, 30, 75, 100 days or any number you choose
• A daily checklist with a Select all shortcut
• Percentage scoring, so partial days still count
• Rest days on the weekdays you pick
• A nightly reminder, with follow-up nudges until you log the day
• Log a day you missed — one forgotten night doesn't ruin your record
• A note on any day, to remember how it went
• An end-of-challenge report: average completion, perfect days, best streak and a breakdown
  of which habits you actually kept
• A trend chart of your daily completion
• Run it again — restart a finished challenge with one tap
• Light and dark themes

BUILT FOR REAL CHALLENGES

75 Hard. 30-day fitness challenges. 21 days to build a habit. No-sugar months. Morning
routines. Reading goals. Anything you want to do every day for a set number of days.

Set your daily reminder for whatever time suits you — 10 PM by default — and the app will
keep nudging you until the day is logged.

No ads. No subscription. No account required.
```

Character count sits around 1,900, well inside the 4,000 limit. Leave room to add lines later
rather than filling it now — thin, honest copy converts better than padding.

## Play Console fields

- **Category:** Health & Fitness. (Productivity is more crowded and a worse match for the
  challenge framing.)
- **Tags:** habit, challenge, routine, checklist, streak.
- **Contact email:** required and shown publicly.
- **Privacy policy URL:** required. Needed even offline-only, because an account is offered.
- **Data safety form:** declare email, name and challenge data, collected only when the user
  creates an account, transmitted over HTTPS, deletable on request.

## Graphics

These do not affect ranking directly, but they drive conversion — and conversion rate does
feed ranking.

- **Icon:** 512×512 PNG, 32-bit
- **Feature graphic:** 1024×500 — shown at the top of the listing
- **Phone screenshots:** minimum 2, up to 8. Use at least 4.

Screenshots that would sell this app, in order:

1. Today, with two challenges collapsed — the calm, uncluttered state
2. A card expanded mid-tick, showing "3/5 · 60%" — the partial-credit idea in one image
3. The rest-day picker, with Sat and Sun selected
4. The report — average %, perfect days, day strip and trend chart
5. The reminder notification on a lock screen

Caption each with a short benefit line rather than shipping bare screenshots.

## What actually drives ranking

Metadata gets you into the results. Staying there is driven by:

- **Install velocity** — installs per day, relative to competitors
- **Retention** — Play heavily penalises apps people uninstall quickly
- **Ratings and reviews** — both count and recency
- **Android vitals** — crash and ANR rates directly suppress ranking

Which means the highest-leverage work is not copy. It is: ask for a rating after somebody
finishes their first challenge, keep the app crash-free, and get the first 50–100 genuine
installs from somewhere real.

The rating prompt is now built in (`mobile/src/store/reviewPrompt.ts`). It fires once per
install, only after a challenge has finished, and only if the user logged at least 5 days at 60%
or better — asking someone who abandoned a challenge is how you collect one-star reviews.

## Localisation

Each added language is a separate index in Play search. Bangla and Hindi are the obvious first
two — far less competition than English, and a large audience.

## Honest expectation

Good ASO moves you from unfindable to findable for the long-tail terms above. It will not put
a brand-new app with no reviews into "Trending". Nothing in a listing can. Trending follows
install velocity and retention, which follow a product people keep using and somewhere real to
tell them it exists.
