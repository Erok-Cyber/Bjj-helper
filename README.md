# GrappleLog

A mobile-first personal BJJ training companion inspired by the useful *categories* of modern training-log apps, but built around a stronger idea: **track -> analyze -> build a gameplan -> train decisions -> repeat**.

## What is implemented

- **Technique library** — category, position, Gi/No-Gi, notes, tags, tutorial link, confidence and drilling count.
- **Session logging** — date, Gi/No-Gi, format presets, duration, live rounds, positional rounds, submissions, taps, rating, focus position, techniques, partners and notes.
- **Gameplan / flow builder** — visual node-and-edge editor for positions, reactions, attacks and submissions, with editable step and reaction labels.
- **Decision trainer** — turns a user's own gameplan graph into quick recall prompts.
- **Analytics** — mat time, rounds, submissions, training consistency, library balance, low-confidence gaps and an automatic 7-day review.
- **Training focus / competition mode** — weekly session target, current focus position, event countdown and target division/weight.
- **AI Coach** — context-aware coaching from the user's own sessions, techniques, flows and competition focus. Runs through a Supabase Edge Function so the OpenAI API key never ships to the browser.
- **Local-first mode** — the app works without a backend and stores data only in the current browser.
- **Cloud-ready multi-user mode** — Supabase Auth + user-owned rows + RLS. Each athlete only sees their own data.
- **Offline shell** — lightweight service worker and web-app manifest for fast reopening on the mat.
- **Responsive UI** — desktop sidebar and phone bottom navigation.
- **Portable backups** — JSON import/export for user-controlled data portability.

## Architecture

```text
GitHub Pages / Vite React
        |
        +-- Local mode -> browser localStorage
        |
        +-- Cloud mode -> Supabase Auth + Postgres + RLS
                              |
                              +-- Edge Function -> OpenAI Responses API
```

The repository intentionally does **not** contain any private API keys.

## Run locally

```bash
npm install
npm run dev
```

The app works immediately in local-first mode.

## Enable private accounts and cross-device sync

1. Create a dedicated Supabase project.
2. Run `supabase/migrations/20260929_init.sql` on that project.
3. Copy `.env.example` to `.env.local` and set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

4. Deploy `supabase/functions/ai-coach/index.ts` as the `ai-coach` Edge Function.
5. Store `OPENAI_API_KEY` as a Supabase Edge Function secret. Never expose it through a `VITE_` variable.

The database migration enables RLS on every user-data table. Policies use `auth.uid()` ownership checks for reads and writes, so two athletes cannot see or modify each other's rows through the client API.

## GitHub Pages

The Vite base path is configured for:

```text
https://erok-cyber.github.io/Bjj-helper/
```

The included workflow builds and deploys `dist/` after changes land on `main`.

### Email confirmation redirects

In the hosted Supabase project's **Authentication → URL Configuration**, set:

- **Site URL:** `https://erok-cyber.github.io/Bjj-helper/`
- **Redirect URLs:** `https://erok-cyber.github.io/Bjj-helper/` (exact path, including the trailing slash).
- For local development only, optionally add `http://localhost:5173/`.

Keep email confirmation enabled. The app supplies the same app-directory URL for
both signup forms and the **Resend confirmation email** action. Supabase must allow
that URL; otherwise it falls back to Site URL, which defaults to localhost in new
projects. A frontend deployment alone does not update these dashboard settings.
If a custom confirmation email template is used, its confirmation link should use
`{{ .ConfirmationURL }}` so Supabase verifies the email before returning to the app.

After correcting the hosted settings, open the public app and request a new
confirmation email. Use the newest email; previously sent links may still carry
the old redirect or have expired. If the previous link already confirmed the
account before redirecting to localhost, simply sign in on the public app.

## AI design

The AI Coach receives a bounded subset of the signed-in user's own profile, technique library, recent sessions and flow graphs. The secret key is read only inside the Edge Function. The current default model is a cost-sensitive OpenAI model suitable for short coaching tasks.

## Next upgrades

- voice-to-session logging and structured note import
- media uploads for techniques (private Supabase Storage bucket)
- goal blocks / competition camps
- positional sparring tracker
- partner tags and anonymized partner archetypes
- shareable read-only gameplans via explicit invite links
- achievements/challenges without turning the app into a social feed by default
- smarter weekly review generated from analytics + AI
- installable PWA icon set and richer offline caching

## Privacy principle

**Private by default. Sharing is explicit.** A friend's account should start empty and should never inherit another user's techniques, sessions, analytics or gameplan unless the owner intentionally shares something in a future sharing feature.
