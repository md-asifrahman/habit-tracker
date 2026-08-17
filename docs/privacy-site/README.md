Static one-page site: the app's privacy policy, which Google Play requires as a public URL.

Deploy:

    cd docs/privacy-site
    npx vercel --prod

Kept separate from `web/` on purpose — the policy needs to be live long before the web app is,
and it must never depend on a backend being up.
