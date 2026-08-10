# WanderWorld Global — Project Spec

Read this before touching code. This is the one file that matters — not 40
prompts, not a 500-page handbook. Keep it under 2 pages. If it grows past
that, something has been over-engineered.

## What this is

WanderWorld Global is the next version of WanderWorld Travels: an
AI-assisted travel booking platform, now built for international users in
addition to Kenya/Africa. Same codebase lineage, same design language,
expanded payment rails and audience.

## What v1 actually does (core loop — build this first, fully, before anything else)

Browse destinations → search stays → view a hotel → reserve dates → check
out with Stripe or Paystack → get a confirmation. That's it. Everything
else (AI planner, dashboards, CMS, reviews UI) is v1.1+.

## Tech stack

- Next.js 14 (App Router), React 18, TypeScript strict
- Tailwind CSS, no component library — hand-built components matching the
  design system below
- Prisma + Postgres (Neon)
- NextAuth (email + Google)
- Stripe + Paystack live in v1. PayPal + M-Pesa are stubbed behind the same
  `PaymentProvider` interface in `lib/payments.ts` — implement, don't
  redesign, when it's time to add them.
- Resend for transactional email
- Cloudinary for image storage
- Deploy: Vercel

## Design system — non-negotiable

"Cinematic editorial luxury." This was decided once already; don't
relitigate it per-feature.

- Display face: **Fraunces** (used sparingly — headings, pull quotes)
- Body face: **Inter Tight**
- Palette: warm charcoal (`#2A241F`), linen (`#F4EEE3`), cream (`#FBF8F2`),
  amber accent (`#B97A3D`), rust (`#9C4A2B`) for errors/warnings
- **No glassmorphism.** No frosted-glass panels, no backdrop-blur-as-decor.
- Zero-to-minimal border radius. Hairline rules (`border-ink/10`) over
  shadows for separation.
- Motion is restrained: hover states and page-load fades only. No
  scroll-jacking, no parallax for its own sake.

If a future session proposes glassmorphism, bright gradients, or generic
SaaS-template patterns (bento grids, floating gradient blobs), that's a
regression — check this file and correct it.

## Database

`prisma/schema.prisma` has 9 models: User, Destination, Hotel, Room,
Booking, Payment, Review, WishlistItem, plus enums. This is intentionally
small. Add a table when a real feature needs it — not speculatively for
"CMS" or "analytics" before either exists.

## Payments

`lib/payments/` defines the `PaymentProvider` interface every rail
implements: `createCheckoutSession(input) → { redirectUrl?, reference }`.
UI and booking logic call this interface only — never a provider SDK
directly from a component or page.

All four rails are live: Stripe, Paystack, PayPal
(`lib/payments/paypal.ts`), and M-Pesa (`lib/payments/mpesa.ts`).
Confirmation is webhook-driven for all of them
(`app/api/webhooks/{stripe,paystack,paypal,mpesa}`), not
redirect-driven — the browser redirect back to the app is a UX nicety;
the webhook is what actually flips `Booking.status`.

- The client-displayed total is never trusted. `POST /api/checkout`
  recomputes price from the DB before creating a booking or talking to a
  provider.
- **M-Pesa is structurally different from the other three**: Daraja's
  STK push has no hosted checkout page — it sends a PIN prompt straight
  to the customer's phone, so `createCheckoutSession` returns no
  `redirectUrl`. `CheckoutForm` branches on that and sends the browser
  straight to the confirmation page instead, which polls
  (`PendingPoller`) until the webhook lands. M-Pesa is also KES-only and
  our seed hotel prices are in USD — there's no currency conversion layer
  yet, so treat M-Pesa as functionally incomplete until that's added.
- PayPal's webhook verification is a server-to-server call to PayPal's
  own API (no local HMAC like Stripe/Paystack), and creating an order
  doesn't move money — the webhook handler calls PayPal's capture
  endpoint itself once it sees `CHECKOUT.ORDER.APPROVED`.

## Deployment

Vercel-only, deploy pipeline auto-syncs the schema and seeds on every
push (`vercel-build` in `package.json`) — see README for the exact setup.
**This uses `prisma db push --accept-data-loss` on every deploy**, which
is fine while there's no real customer data but becomes dangerous once
there is. Switch to `prisma migrate deploy` + real migration files before
launch, and drop auto-seeding once hotel data is ever edited by hand or
through an admin panel (auto-seed will silently overwrite those edits
back to `lib/data.ts` values on the next deploy otherwise).

## Production hardening (done)

- **Webhook idempotency**: `markPaymentSucceeded`/`markPaymentFailed`
  guard against duplicate delivery (all providers redeliver webhooks
  at-least-once) and — the important one — a "failed" event can never
  downgrade an already-`SUCCEEDED` payment. Webhook order isn't
  guaranteed; without this a delayed/duplicate failure event could
  cancel a booking someone already paid for.
- **DB connection pooling**: `DATABASE_URL` must be Neon's pooled
  connection string, `DIRECT_URL` the unpooled one (schema.prisma,
  .env.example). Vercel's concurrent serverless instances will exhaust
  Neon's connection limit fast without this.
- **Rate limiting**: `lib/rate-limit.ts`, applied to `/api/checkout`,
  `/api/auth/signup`, `/api/planner` (the OpenAI-cost one is throttled
  hardest). Honestly documented as per-instance/best-effort, not a
  distributed limiter — fine for now, swap for Upstash before real
  traffic.
- **Booking sanity limits**: no past check-in dates, 60-night cap
  (`lib/bookings.ts`).
- Security headers (`next.config.js`), `robots.ts` + `sitemap.ts`,
  `not-found.tsx` + `error.tsx`, `loading.tsx` skeletons on data-fetching
  routes, per-page `generateMetadata` on hotel/destination detail pages,
  `metadataBase` + Open Graph/Twitter defaults on the root layout.
- **Inventory/availability model**: `Hotel.totalUnits` (default 1 — these
  are boutique whole-property stays, not multi-room hotels) plus
  `getAvailability()` in `lib/bookings.ts`, which counts overlapping
  `CONFIRMED` bookings and *recent* `PENDING` ones (see hold TTL below)
  against capacity. `createPendingBooking` re-checks this inside a
  **Serializable** transaction with one retry on conflict
  (`Prisma.TransactionIsolationLevel.Serializable`, catching Prisma error
  code `P2034`) — this is what actually prevents two simultaneous guests
  from both booking the last unit for the same dates, not just a
  pre-check. The (now-unused) `Room` model from early planning was
  removed rather than left as dead scaffolding.
- **Abandoned booking cleanup**: `cleanupAbandonedBookings()` +
  `/api/cron/cleanup-bookings` + `vercel.json`. Deliberately designed so
  correctness never depends on the cron's timing — a `PENDING` booking
  older than `HOLD_TTL_MINUTES` (30 min) stops counting toward
  availability immediately, at read time, in `getAvailability()` itself.
  The cron is just housekeeping (formally marks stale rows `CANCELLED`)
  and runs once daily, which is deliberate: **Vercel's Hobby plan caps
  cron jobs at once per day** — confirmed current as of this session, not
  assumed from training data. If you're on Pro and want tighter DB
  hygiene, tighten the schedule in `vercel.json`; it's not required for
  correctness either way.

## Known gaps — flagged, not silently skipped

- **No CSP header**: the security headers added are safe defaults
  (`X-Frame-Options`, `nosniff`, etc.), but a real Content-Security-Policy
  was deliberately left out — getting it right requires knowing every
  script/style source in advance (Google Fonts, any future Stripe/PayPal
  client-side SDKs), and a wrong CSP silently breaks things rather than
  failing loudly. Worth doing once the third-party script surface is
  finalized, not before.
- **No centralized env validation**: each feature checks its own required
  env vars at call time (`available` getters on payment providers,
  `isPlannerAvailable()`, etc.) rather than one startup-time schema
  validator. Consistent with the rest of this codebase's pattern; flagged
  in case a future session is tempted to add a redundant second system.
- **Availability is per-hotel, not per-room-type**: fine for whole-property
  listings (what's seeded today). If a hotel with actual distinct room
  types gets added later, `totalUnits` and the overlap query in
  `getAvailability()` would need to become room-type-aware — noted here
  so that need doesn't get missed.

## What NOT to do (lessons from the planning phase)

- Don't write a 40-prompt library or a "Company OS" folder tree before
  shipping the core loop. Docs follow working code, not the other way
  around.
- Don't design 50+ database tables up front. You don't know what you need
  until real screens exist.
- Don't stand up 4 payment providers simultaneously for v1. Two, fully
  working, beats four half-wired.
- Don't invent AI "employee roles" (CEO Agent, QA Lead, etc.) as a
  planning device — it produces documents, not software.

## Definition of done (per feature, kept short on purpose)

- [ ] Works on mobile width
- [ ] Keyboard-navigable, visible focus states
- [ ] Loading and empty states exist
- [ ] Server-side input validation (Zod)
- [ ] No `any` without a comment explaining why
- [ ] Matches the design system above

## Roadmap after v1 core loop ships

1. ~~Auth (NextAuth email + Google) wired into the booking flow~~ — done
2. ~~Stripe + Paystack live checkout sessions~~ — done
3. ~~User dashboard: My Trips~~ — done
4. ~~AI Planner (OpenAI, single endpoint, structured JSON itinerary
   output)~~ — done, `lib/ai/planner.ts`. Deliberately stateless: no
   `AIConversation` table. Add one only when there's a real feature that
   needs history (e.g. "save this itinerary"), not before.
4b. ~~Booking confirmation emails~~ — done, `lib/email.ts` via Resend,
   fired from `markPaymentSucceeded` so it fires once, regardless of
   which of the four payment providers confirmed the booking.
5. Reviews (only after there are real completed bookings to review)
6. ~~PayPal + M-Pesa~~ — done, though M-Pesa needs a currency conversion
   layer before it's actually correct (see Payments section above)
7. Admin dashboard (only once there's inventory to administer)
