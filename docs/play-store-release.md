# Publishing to Google Play

## The APK cannot be uploaded

Google Play has required **Android App Bundles (.aab)** for all new apps since August 2021.
`build/habit-tracker.apk` is for sideloading onto your own phone only — Play Console will reject
it.

Build the bundle instead:

```
cd mobile
npx eas build -p android --profile production
```

That produces an `.aab`. Everything else in this guide assumes that file.

The `production` profile builds the bundle with **all** CPU architectures on purpose. Google
splits it per device at download time, so users still only fetch ~20-25 MB — the arm64-only
trick we used for sideloading would just exclude people.

## Requirements this build already meets

| Requirement | Status |
|---|---|
| `targetSdkVersion` 36 (required from 31 Aug 2026) | 36 |
| `minSdkVersion` | 24 — Android 7.0 and up |
| Play App Signing | handled by EAS |
| Format | `.aab` from the `production` profile |

## The account requirement people get caught by

If your Play developer account is a **personal** account created **after 13 November 2023**, you
cannot publish to production until you have run a closed test with:

- **12 testers**, each a distinct Google account, opted in via your test link
- **opted in continuously for 14 days** — the clock starts when the 12th tester joins
- installs on real devices; emulators and duplicate accounts don't count

Only then can you apply for production access. Organisation accounts and personal accounts
created before that date are exempt.

Plan for this. It is two weeks of calendar time before the app can go public, so start the
closed test as soon as the account exists rather than after everything else is polished.

## Steps

1. **Create the developer account** — <https://play.google.com/console>, US$25 once.
   Note the account type: personal accounts are the ones subject to the testing rule above.

2. **Create the app.** Name `Daily Challenge Tracker`, default language, type App, free.

3. **Fill in the store listing** — copy is in `play-store-listing.md`.
   Short and full descriptions, icon (512×512), feature graphic (1024×500), and at least two
   phone screenshots (use four).

4. **Complete the mandatory declarations.** Play blocks release until all of these are done:
   - **Privacy policy URL** — required. Needed even though the app works offline, because it
     offers an account.
   - **Data safety** — declare email, name and challenge data; collected only when a user
     creates an account; encrypted in transit; deletable on request.
   - **Content rating** questionnaire
   - **Target audience** — not aimed at children keeps you out of Families policy
   - **Ads** — declare none
   - **Government apps**, **financial features**, **health apps** — all no

5. **Upload the bundle.** Testing → Closed testing → create a release → upload the `.aab`.
   Add release notes. EAS can push it for you instead:
   ```
   npx eas submit -p android --latest
   ```
   (Needs a Google Play service account key — Play Console → Setup → API access.)

6. **Run the closed test.** Add 12+ testers by email or Google Group, share the opt-in link,
   confirm they install. Wait 14 continuous days.

7. **Apply for production access**, then promote the release to Production.

Review takes anywhere from a few hours to about a week for a first submission.

## Every release after the first

`versionCode` must increase on every upload. It lives in `mobile/app.json` under
`android.versionCode` and `appVersionSource` is `local`, so bump it by hand:

```json
"versionCode": 2
```

Also bump `"version"` (the user-visible one, e.g. `1.0.1`) when the change is worth naming.
Forgetting the versionCode is the single most common upload rejection.

## Before you submit

- Decide about the account/sync feature. The `production` profile ships **offline-only** — no
  server, no sign-in. That is the honest thing to release today, and it makes the privacy policy
  and Data safety form much simpler. Switch to `production-synced` (and a real HTTPS API) only
  once the backend is actually deployed.
- The permissions the build inherits from dependencies (`READ/WRITE_EXTERNAL_STORAGE`,
  `SYSTEM_ALERT_WINDOW`, `DUMP`) are visible to reviewers and on the listing. Worth stripping.
- `com.ctrends.habittracker` is permanent once published. Change it now or never.
