# WanderWorld Global

AI-assisted travel booking platform — v1 core loop (browse → search → book →
pay → confirm), built for both African and international travelers.

See `CLAUDE.md` for the full spec and design system before making changes.

## Deploy to Vercel (no local commands needed)

1. Push this repo to GitHub, then **Import Project** in Vercel.
2. In **Project Settings → Environment Variables**, add (Production *and*
   Preview, so branch deploys work too):

   | Variable | Where to get it |
   |---|---|
   | `DATABASE_URL` | Neon Postgres **pooled** connection string (hostname has `-pooler` in it) — reuse your WanderWorld Travels Neon project or create a new branch there |
   | `DIRECT_URL` | Neon's **unpooled** connection string — required for schema pushes, see note below |
   | `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
   | `STRIPE_WEBHOOK_SECRET` | see step 4 below |
   | `PAYSTACK_SECRET_KEY` | Paystack dashboard → Settings → API Keys & Webhooks |
   | `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | developer.paypal.com → Apps & Credentials |
   | `PAYPAL_WEBHOOK_ID` | see step 5 below |
   | `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` / `MPESA_SHORTCODE` / `MPESA_PASSKEY` | developer.safaricom.co.ke — Daraja API app |
   | `NEXTAUTH_SECRET` | any random string, e.g. `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | your Vercel deployment URL, once you have one |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth Client ID. Set the authorized redirect URI to `https://<your-vercel-domain>/api/auth/callback/google` |
   | `OPENAI_API_KEY` | platform.openai.com → API keys — powers `/planner` |
   | `RESEND_API_KEY` | resend.com → API Keys — powers real booking confirmation emails |
   | `CRON_SECRET` | any random string you invent — see step 8 below |

   **Why two database URLs?** Vercel serverless functions can run many
   concurrent instances, each potentially opening its own Postgres
   connection — without pooling this exhausts Neon's connection limit
   under real traffic (a very common production surprise with this exact
   stack). `DATABASE_URL` should be Neon's pooled connection string
   (PgBouncer, hostname has `-pooler`), used by the app at runtime.
   `DIRECT_URL` is the unpooled one, used only for schema pushes — pooled
   connections don't support what `prisma db push`/`migrate` need. Neon's
   dashboard gives you both.

3. Click **Deploy**. Vercel runs `npm install` (which triggers
   `prisma generate` automatically via `postinstall`), then runs the
   `vercel-build` script, which does, in order:
   - `prisma generate`
   - `prisma db push` — creates/updates tables from `prisma/schema.prisma`
     (against `DIRECT_URL`, no migration files needed)
   - `npm run db:seed` — loads the 6 destinations / 6 hotels from
     `lib/data.ts` (safe to re-run — it upserts by slug)
   - `next build`

   **In short: every deploy syncs the schema and seeds the database for
   you.** You don't need to run `prisma db push` or `db:seed` from a
   terminal.

4. **Wire the Stripe webhook** (needed to confirm bookings — without it,
   payments succeed on Stripe's side but bookings never flip to
   `CONFIRMED` in the database):
   - Stripe dashboard → Developers → Webhooks → **Add endpoint**
   - URL: `https://<your-vercel-domain>/api/webhooks/stripe`
   - Event to send: `checkout.session.completed` (and optionally
     `checkout.session.expired`)
   - Copy the **Signing secret** it gives you into `STRIPE_WEBHOOK_SECRET`
     in Vercel, then redeploy (or just wait for the next deploy)

5. **Wire the Paystack webhook**:
   - Paystack dashboard → Settings → API Keys & Webhooks
   - Webhook URL: `https://<your-vercel-domain>/api/webhooks/paystack`
   - Paystack signs every webhook with your secret key automatically — no
     separate signing secret to copy

6. **Wire the PayPal webhook**:
   - developer.paypal.com → your app → **Add Webhook**
   - URL: `https://<your-vercel-domain>/api/webhooks/paypal`
   - Events: `CHECKOUT.ORDER.APPROVED` and `PAYMENT.CAPTURE.DENIED`
   - Copy the **Webhook ID** it gives you into `PAYPAL_WEBHOOK_ID` in
     Vercel

7. **M-Pesa needs no dashboard webhook setup** — Daraja's STK push API
   takes a callback URL on every payment request rather than a
   dashboard-configured one, and it's already pointed at
   `/api/webhooks/mpesa` in code.

8. **Abandoned-booking cleanup runs automatically** once `CRON_SECRET` is
   set in Vercel (any random string — Vercel echoes it back as the
   `Authorization` header when the scheduled job fires; you're not
   fetching this value from Vercel, you're inventing it and Vercel plays
   it back to verify itself). The schedule lives in `vercel.json` and
   registers itself on deploy — no dashboard step needed beyond the env
   var. Runs once daily by design; see "How availability works" below
   for why that's not a correctness problem.

That's the whole setup. Every subsequent `git push` to your deploy branch
re-syncs the schema and re-seeds automatically.

## How availability works

Every hotel has a `totalUnits` (capacity — defaults to 1, since these are
boutique whole-property stays, not multi-room hotels with room types).
Booking creation checks overlapping `CONFIRMED` bookings, plus `PENDING`
ones younger than 30 minutes (a "soft hold" — long enough to finish
checkout, short enough that an abandoned attempt doesn't block real
guests). This check happens inside a database-level Serializable
transaction, so two people racing for the last unit can't both succeed —
one gets a clean "sold out" error and the other's booking goes through.

The hotel page shows a "sold out" state before the guest fills in payment
details if a quick pre-check fails, but that's just a UX nicety — the
transaction at booking-creation time is what's actually enforcing this,
not the UI hint.

## ⚠️ Important tradeoff — read before you have real bookings

`prisma db push --accept-data-loss` runs on **every deploy** so you never
have to touch a terminal. That's convenient now, while the schema is still
moving and there's no real customer data. But `db push` can silently drop
columns/tables if a future schema change is destructive, and the
auto-seed step will overwrite the `Destination`/`Hotel` rows back to the
hardcoded values in `lib/data.ts` on every deploy.

**Before you take real bookings or add an admin panel that edits hotel
data directly in the database:**
1. Switch `vercel-build` to `prisma generate && prisma migrate deploy && next build`
   and start using `prisma migrate dev` to generate real migration files.
2. Remove the `db:seed` step from `vercel-build` (keep `npm run db:seed`
   available to run manually/once instead).

This is flagged in `CLAUDE.md` too so it doesn't get missed.

## What's real vs. what's next

- **Real**: full booking UI flow, Postgres-backed data layer, all four
  payment rails live and webhook-confirmed — Stripe, Paystack, PayPal,
  M-Pesa (`lib/payments/`), sign-in with Google or email/password
  (`lib/auth.ts`), guest checkout that auto-links to an account signed in
  later with the same email, `/trips` showing a signed-in user's real
  bookings, the AI planner (`/planner`) generating real itineraries
  grounded in actual DB hotel data, real booking confirmation emails via
  Resend (`lib/email.ts`), race-safe availability checking that actually
  prevents double-booking (see "How availability works" below), and
  automatic cleanup of abandoned bookings.
- **Known gap**: M-Pesa is wired correctly against Daraja's API but is
  functionally incomplete — STK push is KES-only and our seed hotels are
  priced in USD, so there's no currency conversion happening yet. See
  `lib/payments/mpesa.ts`.
- **Not yet built**: reviews, admin dashboard.

## How the AI planner works

- `POST /api/planner` takes a destination + nights + budget level + pace
  + free-text interests, fetches that destination's real hotels from the
  DB, and asks OpenAI (`gpt-4o-mini`, Structured Outputs / strict JSON
  schema) for a day-by-day itinerary.
- **Hotel suggestions are grounded, not hallucinated**: the model is only
  allowed to suggest a `hotelSlug` from the exact list of real hotels
  passed in for that destination. `lib/ai/planner.ts` also strips out any
  slug that somehow doesn't match — belt and suspenders against a broken
  link ever reaching the UI.
- No conversation/itinerary history is persisted — deliberately stateless
  for now. See `CLAUDE.md` roadmap for when that'd be worth adding.

## How sign-in works

- NextAuth with JWT sessions — deliberately **not** using NextAuth's
  Prisma adapter, which would need its own `Account`/`Session`/
  `VerificationToken` tables. Instead, `lib/auth.ts`'s callbacks upsert
  directly into the same `User` model that guest checkout writes to.
- **Google OAuth**: on first sign-in, upserts a `User` row by email.
- **Email + password**: `/api/auth/signup` hashes the password with
  bcrypt and stores it on `User.passwordHash`. If someone already has a
  passwordless `User` row from a past guest checkout, signup "claims" it
  instead of creating a duplicate — so their booking history shows up
  immediately.
- Practical effect: book a stay as a guest with `jane@example.com`, then
  later sign up or sign in with Google using that same email — `/trips`
  shows that booking, no manual linking step.

## How payment works end to end

**Stripe, Paystack, PayPal** (hosted checkout page):
1. Guest fills out the checkout form on `/booking/[slug]` and picks a
   provider.
2. `POST /api/checkout` creates a `PENDING` `Booking` row (price computed
   server-side from the DB — the client's displayed total is never
   trusted), calls the provider's hosted checkout API, creates a `PENDING`
   `Payment` row, and returns a redirect URL.
3. The browser is sent to the provider's hosted payment page.
4. On success, the provider calls our webhook
   (`/api/webhooks/{stripe,paystack,paypal}`), which is the only thing
   that flips `Payment.status` to `SUCCEEDED` and `Booking.status` to
   `CONFIRMED`. The browser is separately redirected back to
   `/booking/confirmation?bookingId=...`, which reads the booking straight
   from the database and auto-polls (`PendingPoller`) if the webhook
   hasn't landed yet.

**M-Pesa** (no hosted page — different by design):
1. Same first two steps, but `createCheckoutSession` triggers an STK push
   — a PIN prompt straight to the guest's phone — instead of returning a
   redirect URL.
2. The browser goes directly to `/booking/confirmation?bookingId=...`
   and polls while the guest enters their PIN.
3. Safaricom calls `/api/webhooks/mpesa` with the result (success or
   cancelled/failed), which updates the booking the same way the other
   three do.

## Services with keys but no feature built yet

If you're holding API keys for Cloudinary, MapTiler, OpenWeather, Apify,
Thunderbit, or FlightAPI: none of these are wired into the app, because
no corresponding feature exists yet. Adding the key alone does nothing.
`.env.example` lists what each would actually need:

- **Cloudinary** → an image upload UI (admin panel or user-submitted
  photos). Hotel images are currently hardcoded Unsplash URLs.
- **MapTiler** → a map view on hotel/destination pages.
- **OpenWeather** → a weather widget somewhere in the booking flow.
- **FlightAPI** → flight search — this build is hotels-only; flights were
  never part of the core loop.
- **Apify / Thunderbit** → the "Travel Intelligence" scraping module from
  early planning, deliberately cut from v1 as premature scope.

Say the word on any of these and it's a real, scoped build — just flagging
that having the key isn't the same as having the feature.

**Never commit real API keys to this repo, even in `.env.example`** — that
file only ever contains variable names. Put actual values directly in
Vercel's Environment Variables dashboard.

## Local development (optional)

You don't need this to deploy, but if you want to run it locally:

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum
npx prisma db push
npm run db:seed
npm run dev
```

Stripe/Paystack webhooks won't reach `localhost` unless you use the
Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
or a tunnel like ngrok for Paystack.

## Design system

Fraunces + Inter Tight, warm charcoal/linen/amber palette, no
glassmorphism. Full rationale in `CLAUDE.md`.
